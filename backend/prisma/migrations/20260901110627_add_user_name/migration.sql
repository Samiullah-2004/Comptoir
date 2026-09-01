-- AlterTable
ALTER TABLE "User" ADD COLUMN "name" TEXT;

UPDATE "User" SET "name" = 'User' WHERE "name" IS NULL;

ALTER TABLE "User" ALTER COLUMN "name" SET NOT NULL;