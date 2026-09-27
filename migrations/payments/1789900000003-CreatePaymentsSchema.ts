import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaymentsSchema1789900000003 implements MigrationInterface {
  name = 'CreatePaymentsSchema1789900000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."payments_status_enum" AS ENUM('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payments" ("id" SERIAL NOT NULL, "orderId" integer NOT NULL, "userId" integer NOT NULL, "amount" numeric(12,2) NOT NULL, "status" "public"."payments_status_enum" NOT NULL DEFAULT 'PENDING', "provider" character varying(50) NOT NULL DEFAULT 'MOCK', "idempotencyKey" character varying(255) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_payments_orderId" UNIQUE ("orderId"), CONSTRAINT "UQ_payments_idempotencyKey" UNIQUE ("idempotencyKey"), CONSTRAINT "PK_payments_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "outbox" ("id" SERIAL NOT NULL, "eventType" character varying NOT NULL, "payload" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "publishedAt" TIMESTAMPTZ, CONSTRAINT "PK_outbox_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "inbox" ("eventId" character varying NOT NULL, "processedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_inbox_eventId" PRIMARY KEY ("eventId"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "inbox"`);
    await queryRunner.query(`DROP TABLE "outbox"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
  }
}
