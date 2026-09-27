import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateApiSchema1789900000000 implements MigrationInterface {
  name = 'CreateApiSchema1789900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', CONSTRAINT "UQ_users_email" UNIQUE ("email"), CONSTRAINT "PK_users_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "profiles" ("id" SERIAL NOT NULL, "bio" character varying NOT NULL, "avatar" character varying, "birthday" date, "userId" integer, CONSTRAINT "UQ_profiles_userId" UNIQUE ("userId"), CONSTRAINT "PK_profiles_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "profiles" ADD CONSTRAINT "FK_profiles_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "profiles" DROP CONSTRAINT "FK_profiles_userId"`,
    );
    await queryRunner.query(`DROP TABLE "profiles"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
