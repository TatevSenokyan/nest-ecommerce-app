import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrdersSchema1789900000002 implements MigrationInterface {
  name = 'CreateOrdersSchema1789900000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."orders_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."orders_sagastep_enum" AS ENUM('CREATED', 'STOCK_RESERVED', 'STOCK_FAILED', 'CONFIRMED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "orders" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "status" "public"."orders_status_enum" NOT NULL DEFAULT 'PENDING', "sagaStep" "public"."orders_sagastep_enum" NOT NULL DEFAULT 'CREATED', "total" numeric(12,2) NOT NULL DEFAULT 0, CONSTRAINT "PK_orders_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "order_items" ("id" SERIAL NOT NULL, "orderId" integer NOT NULL, "productId" integer NOT NULL, "productName" character varying NOT NULL, "quantity" integer NOT NULL, "price" numeric(12,2) NOT NULL, CONSTRAINT "PK_order_items_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_order_items_orderId" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE TABLE "outbox" ("id" SERIAL NOT NULL, "eventType" character varying NOT NULL, "payload" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "publishedAt" TIMESTAMPTZ, CONSTRAINT "PK_outbox_id" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "outbox"`);
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_orderId"`,
    );
    await queryRunner.query(`DROP TABLE "order_items"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TYPE "public"."orders_sagastep_enum"`);
    await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
  }
}
