import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductsSchema1789900000001 implements MigrationInterface {
  name = 'CreateProductsSchema1789900000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "products" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "price" numeric(12,2) NOT NULL, "stock" integer NOT NULL, "version" integer NOT NULL, CONSTRAINT "PK_products_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "stock_reservations" ("id" SERIAL NOT NULL, "orderId" integer NOT NULL, "productId" integer NOT NULL, "quantity" integer NOT NULL, CONSTRAINT "UQ_stock_reservations_order_product" UNIQUE ("orderId", "productId"), CONSTRAINT "PK_stock_reservations_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "outbox" ("id" SERIAL NOT NULL, "eventType" character varying NOT NULL, "payload" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "publishedAt" TIMESTAMPTZ, CONSTRAINT "PK_outbox_id" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "outbox"`);
    await queryRunner.query(`DROP TABLE "stock_reservations"`);
    await queryRunner.query(`DROP TABLE "products"`);
  }
}
