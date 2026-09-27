import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1785095660544 implements MigrationInterface {
    name = 'InitialSchema1785095660544'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "profiles" ("id" SERIAL NOT NULL, "bio" character varying NOT NULL, "avatar" character varying, "birthday" date, "userId" integer, CONSTRAINT "REL_da107b8e4be77bac0e0c4d7fc2" UNIQUE ("userId"), CONSTRAINT "PK_8e520eb89a81be6725f35233193" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD CONSTRAINT "FK_3154329f6f4920fdb1deca3fe98" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profiles" DROP CONSTRAINT "FK_3154329f6f4920fdb1deca3fe98"`);
        await queryRunner.query(`DROP TABLE "profiles"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
