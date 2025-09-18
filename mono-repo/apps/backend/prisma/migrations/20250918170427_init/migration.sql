/*
  Warnings:

  - The values [In_Service,Standby,Under_Maintenance] on the enum `OperationalStatusEnum` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."OperationalStatusEnum_new" AS ENUM ('in_service', 'standby', 'under_maintenance');
ALTER TABLE "public"."Operations" ALTER COLUMN "operationalStatus" TYPE "public"."OperationalStatusEnum_new" USING ("operationalStatus"::text::"public"."OperationalStatusEnum_new");
ALTER TYPE "public"."OperationalStatusEnum" RENAME TO "OperationalStatusEnum_old";
ALTER TYPE "public"."OperationalStatusEnum_new" RENAME TO "OperationalStatusEnum";
DROP TYPE "public"."OperationalStatusEnum_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."Operations" ADD COLUMN     "rank" INTEGER,
ADD COLUMN     "rl_priority" INTEGER,
ADD COLUMN     "score" INTEGER;
