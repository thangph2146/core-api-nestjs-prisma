-- AlterTable
ALTER TABLE "public"."users"
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false;
