-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "description" TEXT;

-- CreateTable
CREATE TABLE "EquipmentImage" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "equipmentId" INTEGER NOT NULL,

    CONSTRAINT "EquipmentImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EquipmentImage" ADD CONSTRAINT "EquipmentImage_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
