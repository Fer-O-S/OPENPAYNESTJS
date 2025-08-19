-- DropForeignKey
ALTER TABLE "public"."Payments" DROP CONSTRAINT "Payments_orderId_fkey";

-- AlterTable
ALTER TABLE "public"."Payments" ADD COLUMN     "subscriptionId" INTEGER,
ALTER COLUMN "orderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Products" ADD COLUMN     "openpayPlanId" TEXT;

-- AlterTable
ALTER TABLE "public"."Subscriptions" ADD COLUMN     "orderId" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."Payments" ADD CONSTRAINT "Payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
