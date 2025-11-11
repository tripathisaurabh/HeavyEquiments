/*
  Warnings:

  - Made the column `dropDate` on table `Booking` required. This step will fail if there are existing NULL values in that column.
  - Made the column `pickupDate` on table `Booking` required. This step will fail if there are existing NULL values in that column.
  - Made the column `equipmentId` on table `Booking` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address` on table `Booking` required. This step will fail if there are existing NULL values in that column.
  - Made the column `paymentType` on table `Booking` required. This step will fail if there are existing NULL values in that column.
  - Made the column `totalAmount` on table `Booking` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Booking` required. This step will fail if there are existing NULL values in that column.
  - Made the column `vendorId` on table `Booking` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Booking" DROP CONSTRAINT "Booking_equipmentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Booking" DROP CONSTRAINT "Booking_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Booking" DROP CONSTRAINT "Booking_vendorId_fkey";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "name" TEXT,
ADD COLUMN     "referenceId" TEXT,
ALTER COLUMN "dropDate" SET NOT NULL,
ALTER COLUMN "pickupDate" SET NOT NULL,
ALTER COLUMN "equipmentId" SET NOT NULL,
ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "paymentType" SET NOT NULL,
ALTER COLUMN "totalAmount" SET NOT NULL,
ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "vendorId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
