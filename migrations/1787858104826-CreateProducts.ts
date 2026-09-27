import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProducts1787858104826 implements MigrationInterface {
    name = 'CreateProducts1787858104826'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "products" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "price" numeric(12,2) NOT NULL, "stock" integer NOT NULL, "version" integer NOT NULL, CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "products"`);
    }

}
