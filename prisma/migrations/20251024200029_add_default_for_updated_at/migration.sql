/*
  Warnings:

  - The primary key for the `Booking` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `bookingDate` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `uniqueBookingId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `userEmail` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `userName` on the `Booking` table. All the data in the column will be lost.
  - The `id` column on the `Booking` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `equipmentId` column on the `Booking` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Equipment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `description` on the `Equipment` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `Equipment` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Equipment` table. All the data in the column will be lost.
  - The `id` column on the `Equipment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[referenceId]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dob` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dropDate` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `equipment` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupDate` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `referenceId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Equipment` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `vendorId` on the `Equipment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."Booking" DROP CONSTRAINT "Booking_equipmentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Equipment" DROP CONSTRAINT "Equipment_vendorId_fkey";

-- DropIndex
DROP INDEX "public"."Booking_uniqueBookingId_key";

-- AlterTable
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_pkey",
DROP COLUMN "bookingDate",
DROP COLUMN "uniqueBookingId",
DROP COLUMN "userEmail",
DROP COLUMN "userName",
ADD COLUMN     "dob" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "dropDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "equipment" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "pickupDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "referenceId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "equipmentId",
ADD COLUMN     "equipmentId" INTEGER,
ADD CONSTRAINT "Booking_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Equipment" DROP CONSTRAINT "Equipment_pkey",
DROP COLUMN "description",
DROP COLUMN "image",
DROP COLUMN "location",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "vendorId",
ADD COLUMN     "vendorId" INTEGER NOT NULL,
ADD CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_referenceId_key" ON "Booking"("referenceId");

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
