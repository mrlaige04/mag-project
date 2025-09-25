/*
  Warnings:

  - You are about to drop the column `receiverUserId` on the `Transfer` table. All the data in the column will be lost.
  - You are about to drop the column `senderUserId` on the `Transfer` table. All the data in the column will be lost.
  - You are about to drop the `IbanPayment` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `receiverCardId` to the `Transfer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderCardId` to the `Transfer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Transfer" DROP COLUMN "receiverUserId",
DROP COLUMN "senderUserId",
ADD COLUMN     "receiverCardId" TEXT NOT NULL,
ADD COLUMN     "senderCardId" TEXT NOT NULL;

-- DropTable
DROP TABLE "IbanPayment";
