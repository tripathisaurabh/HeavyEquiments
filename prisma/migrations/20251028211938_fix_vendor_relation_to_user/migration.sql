/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Equipment` table. All the data in the column will be lost.
  - You are about to alter the column `price` on the `Equipment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE "Equipment" DROP COLUMN "updatedAt",
ADD COLUMN     "baseAddress" TEXT,
ADD COLUMN     "baseLat" DOUBLE PRECISION,
ADD COLUMN     "baseLng" DOUBLE PRECISION,
ADD COLUMN     "perKmRate" DECIMAL(65,30),
ALTER COLUMN "price" SET DATA TYPE DECIMAL(65,30);
