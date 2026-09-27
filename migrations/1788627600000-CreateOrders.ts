import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrders1788627600000 implements MigrationInterface {
    name = 'CreateOrders1788627600000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "status" "public"."orders_status_enum" NOT NULL DEFAULT 'PENDING', CONSTRAINT "PK_orders_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "order_items" ("id" SERIAL NOT NULL, "orderId" integer NOT NULL, "productId" integer NOT NULL, "quantity" integer NOT NULL, "price" numeric(12,2) NOT NULL, CONSTRAINT "PK_order_items_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_order_items_orderId" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_order_items_productId" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_productId"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_orderId"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_userId"`);
        await queryRunner.query(`DROP TABLE "order_items"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
    }

}
