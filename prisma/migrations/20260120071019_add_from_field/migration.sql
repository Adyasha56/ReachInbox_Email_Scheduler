/*
  Warnings:

  - Added the required column `from` to the `Email` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Email" ADD COLUMN     "from" TEXT NOT NULL DEFAULT 'noreply@reachinbox.dev';
ALTER TABLE "Email" ALTER COLUMN "from" DROP DEFAULT;
