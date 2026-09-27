import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1786783467660 implements MigrationInterface {
    name = 'InitialSchema1786783467660'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profiles" DROP CONSTRAINT "FK_3154329f6f4920fdb1deca3fe98"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "role" "public"."users_role_enum" NOT NULL DEFAULT 'user'`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD CONSTRAINT "FK_315ecd98bd1a42dcf2ec4e2e985" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profiles" DROP CONSTRAINT "FK_315ecd98bd1a42dcf2ec4e2e985"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD CONSTRAINT "FK_3154329f6f4920fdb1deca3fe98" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
