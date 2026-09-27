# Ecommerce API

NestJS ecommerce backend split into an HTTP gateway and four worker processes. Users talk to one REST API on port `3000`. Products, orders, and payments run as separate services with their own Postgres databases. Redis is used for request/response RPC. Kafka carries domain events through an outbox.

## Architecture

| Process | Entry | Database | Role |
|---|---|---|---|
| API gateway | `src/main.ts` | `ecommerce_api` | Auth, users, profiles, HTTP controllers |
| Product MS | `src/microservices/product/product.microservice.ts` | `ecommerce_products` | Catalog, stock reserve/release, Redis cache |
| Order MS | `src/microservices/orders/orders.microservice.ts` | `ecommerce_orders` | Checkout saga, order status, outbox |
| Payment MS | `src/microservices/payments/payments.microservice.ts` | `ecommerce_payments` | Charge (mock), idempotency, outbox |
| Notifications MS | `src/microservices/notifications/notifications.microservice.ts` | none | Logs order/payment events |

One Postgres **container** hosts four **databases** (created by `docker/init-db.sql`). Redis carries `send` / `@MessagePattern`. Kafka carries `emit` / `@EventPattern` after the outbox relay publishes committed rows.

```
Browser
  → API :3000  (Helmet, CORS, throttle, JWT)
       ├─ Redis RPC  (AUTH + INTERNAL_RPC_SECRET)  → Product / Order / Payment MS
       └─ (workers)  → outbox → Kafka → Notifications MS
```

Checkout is a saga: Order MS loads products over RPC, writes the order, reserves stock, and compensates (release + cancel) if a later reserve fails. Events are written to `outbox` in the same transaction as the business row, then a relay publishes to Kafka.

## Prerequisites

- Node.js 20+
- Docker Desktop (Postgres, Redis, Kafka)

## Setup

```bash
npm install
```

Environment is read from `.env`:

```
DB_HOST=127.0.0.1
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE_API=ecommerce_api
DB_DATABASE_PRODUCTS=ecommerce_products
DB_DATABASE_ORDERS=ecommerce_orders
DB_DATABASE_PAYMENTS=ecommerce_payments
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=local-redis-password
KAFKA_BROKERS=localhost:9092
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=1h
CORS_ORIGINS=http://localhost:5173
THROTTLE_TTL=60
THROTTLE_LIMIT=60
INTERNAL_RPC_SECRET=local-internal-rpc-secret-change-me
```

Do not commit production secrets. Recreate Redis after adding `REDIS_PASSWORD` (`docker compose up -d redis --force-recreate`) so `--requirepass` takes effect.

### 1. Start infrastructure

```bash
npm run db:up
```

This starts Postgres (`5433`), Redis (`6379`, password-protected), and Kafka (`9092`). Those broker ports are for local host workers only. In production do **not** publish `6379`, `9092`, or `5433` to the host — only `3000` on `api`.

The init script only runs on a **new** Postgres volume (`postgres_multi_data`). If you still have the old `postgres_data` volume from the single-database setup, remove it or the four databases will not exist:

```bash
docker compose down -v
npm run db:up
```

### 2. Run migrations (all four databases)

```bash
npm run migration:run
```

Individual databases:

```bash
npm run migration:run:api
npm run migration:run:products
npm run migration:run:orders
npm run migration:run:payments
```

### 3. Start services (five terminals)

```bash
npm run start:product-ms
npm run start:order-ms
npm run start:payment-ms
npm run start:notifications-ms
npm run start:dev
```

The API is at `http://localhost:3000`. Health: `GET /health`.

PgAdmin is optional: `docker compose up -d pgadmin` → `http://localhost:5050` (admin@example.com / admin).

## Docker (API + workers)

```bash
docker compose up --build
```

Compose builds the image, runs `migrate` (`npm run migration:run` against all four databases), then starts `api`, `product-ms`, `order-ms`, `payment-ms`, and `notifications-ms`. Those app services wait until migrate exits successfully.

Host workers (`npm run start:dev` / `start:*-ms`) still need `npm run migration:run` after `npm run db:up`, because they do not start the Compose migrate job.

## Security

Two layers. JWT and `ValidationPipe` (`whitelist` + `forbidNonWhitelisted`) stay as they are.

**Browser → API** (gateway only — `src/main.ts` / `ThrottleModule`). Helmet, CORS, and throttle are **not** applied to Product/Order/Payment/Notifications workers; those processes do not listen on HTTP.

| Control | What it does |
|---|---|
| Helmet | Response headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, no `X-Powered-By`) |
| CORS | `CORS_ORIGINS` comma list, `credentials: true`. Required when `NODE_ENV=production`. Dev default: `http://localhost:3000` and `http://localhost:5173` |
| Throttle | Default 60 req / 60s per IP (Redis store). `POST /auth/login` and `POST /users` are 5 / 60s. `GET /health` is skipped. Limits are skipped when `NODE_ENV=test` |
| JSON body | 100kb max |

**API → workers** (Redis RPC). JWT is for users. Workers speak Redis/Kafka, so the bus is locked down instead:

| Control | What it does |
|---|---|
| Redis AUTH | `REDIS_PASSWORD` on compose (`--requirepass`) and every ioredis / Nest Redis / BullMQ client |
| RPC secret | Every `send` is `{ data, token: INTERNAL_RPC_SECRET }`. Product/Order/Payment `@MessagePattern` handlers reject a missing or wrong token with RPC 403. Kafka event payloads are **not** wrapped (they leave the outbox after a trusted worker commit) |

Kafka stays PLAINTEXT for local KRaft. Do not expose broker ports on the public internet.

## HTTP API

JWT is required except where noted. Send `Authorization: Bearer <token>`.

### Auth and users

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/users` | public | Register (creates user + empty profile) |
| POST | `/auth/login` | public | `{ email, password }` → `{ access_token }` |
| GET | `/users/me` | JWT | Current user from token |
| GET | `/users` | JWT | Paginated users |
| GET | `/users/:id` | JWT | User by id |
| GET | `/users/admin` | JWT + admin | Admin-only probe |

Register body:

```json
{
  "firstName": "Ada",
  "lastName": "Lovelace",
  "email": "ada@example.com",
  "password": "password123"
}
```

Default role is `user`. Product writes require `admin` (`users.role` in `ecommerce_api`).

### Products

HTTP is proxied to Product MS over Redis.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/products` | public | List |
| GET | `/products/:id` | public | One product (Redis cache) |
| POST | `/products` | JWT + admin | Create `{ name, price, stock }` |
| PATCH | `/products/:id` | JWT + admin | Update `{ name?, price?, version }` |

### Orders

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/orders` | JWT | Create order, reserve stock |
| GET | `/orders` | JWT | Current user's orders |
| GET | `/orders/:id` | JWT | One order |
| PATCH | `/orders/:id/status` | JWT | `{ "status": "CONFIRMED" }` or `"CANCELLED"` |

Create body:

```json
{
  "items": [{ "productId": 1, "quantity": 2 }]
}
```

Allowed transitions: `PENDING → CONFIRMED` or `PENDING → CANCELLED`. Cancel is rejected if a payment for that order already `SUCCEEDED`.

### Payments

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/payments` | JWT | Pay a **CONFIRMED** order |
| GET | `/payments/:id` | JWT | Payment by id |
| PATCH | `/payments/:id/status` | JWT | Manual status (constrained machine) |

```json
{
  "orderId": 1,
  "idempotencyKey": "pay-order-1-attempt-1"
}
```

The mock provider is charged on create (`PENDING`/`PROCESSING` → `SUCCEEDED` or `FAILED`). The same `idempotencyKey` returns the existing payment.

## Typical flow

1. `POST /users` → `POST /auth/login`
2. Admin `POST /products`
3. User `POST /orders`
4. User `PATCH /orders/:id/status` with `CONFIRMED`
5. User `POST /payments`
6. Notifications MS logs `order.created`, `order.confirmed`, `payment.succeeded` (or failed)

## Transporters

| Pattern | Transport | Examples |
|---|---|---|
| RPC (`send`) | Redis | `product.get`, `product.reserve-stock`, `order.create`, `payment.create` |
| Events (`emit`) | Kafka via outbox | `order.created`, `order.confirmed`, `order.cancelled`, `order.stock_failed`, `payment.succeeded`, `payment.failed` |

Contracts live in `src/microservices/contracts/`.

## Scripts

| Script | Purpose |
|---|---|
| `npm run db:up` | Postgres + Redis + Kafka |
| `npm run migration:run` | All four databases (host, or Compose `migrate` service) |
| `npm run start:dev` | API watch mode |
| `npm run start:product-ms` | Product worker |
| `npm run start:order-ms` | Order worker |
| `npm run start:payment-ms` | Payment worker |
| `npm run start:notifications-ms` | Notifications worker |
| `npm test` | Unit tests |
| `npm run test:e2e` | E2E (needs API database) |

## Tests

```bash
npm test
npm run test:e2e
```

Unit tests mock DataSources and clients. Throttle is skipped when `NODE_ENV=test`. `sendCommand` uses `INTERNAL_RPC_SECRET` or a test default. E2E starts `AppModule` and expects Postgres (`ecommerce_api`) and Redis for `GET /`.

## Project layout

```
src/
  main.ts                         API bootstrap
  auth/ users/ profile/           stay on the API + ecommerce_api
  products/                       domain used by Product MS
  orders/                         domain used by Order MS
  payments/                       domain used by Payment MS
  microservices/
    contracts/                    RPC patterns + Kafka event types
    product/                      Redis client + Product MS
    orders/                       Redis client + Order MS
    payments/                     Redis client + Payment MS
    notifications/                Kafka consumer
    kafka/                        Kafka client + outbox relay
  common/outbox/                  outbox entity, writer, relay
  database/                       one TypeORM DataSource per database
migrations/
  api/ products/ orders/ payments/
```
