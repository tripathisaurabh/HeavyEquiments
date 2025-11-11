/*
  Warnings:

  - You are about to drop the column `dob` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `equipment` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `referenceId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Booking` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Booking_referenceId_key";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "dob",
DROP COLUMN "equipment",
DROP COLUMN "name",
DROP COLUMN "referenceId",
DROP COLUMN "updatedAt",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "paymentType" TEXT,
ADD COLUMN     "totalAmount" DOUBLE PRECISION,
ADD COLUMN     "userId" INTEGER,
ADD COLUMN     "vendorId" INTEGER,
ALTER COLUMN "status" SET DEFAULT 'PENDING',
ALTER COLUMN "dropDate" DROP NOT NULL,
ALTER COLUMN "pickupDate" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
