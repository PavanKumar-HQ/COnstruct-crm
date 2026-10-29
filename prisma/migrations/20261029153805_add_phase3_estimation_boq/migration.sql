-- CreateEnum
CREATE TYPE "EstimateStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'SUPERSEDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BoqCategory" AS ENUM ('EXCAVATION', 'SUBSTRUCTURE', 'SUPERSTRUCTURE_RCC', 'MASONRY_PLASTER', 'WATERPROOFING', 'FLOORING_FINISHING', 'DOORS_WINDOWS', 'PAINTING', 'PLUMBING_SANITARY', 'ELECTRICAL_HVAC', 'EXTERNAL_WORKS', 'MISCELLANEOUS');

-- CreateTable
CREATE TABLE "estimates" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "estimateNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "leadId" TEXT,
    "customerId" TEXT,
    "createdById" TEXT NOT NULL,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "status" "EstimateStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estimates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimate_revisions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "EstimateStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "totalCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "markupPercentage" DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    "sellingPricePreTax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taxPercentage" DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    "taxAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "estimatedMargin" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estimate_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boq_items" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "category" "BoqCategory" NOT NULL DEFAULT 'SUPERSTRUCTURE_RCC',
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "materialRate" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "labourRate" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "equipmentRate" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "subcontractRate" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "unitCostRate" DECIMAL(12,2) NOT NULL,
    "totalCost" DECIMAL(15,2) NOT NULL,
    "sellingRate" DECIMAL(12,2) NOT NULL,
    "totalSellingPrice" DECIMAL(15,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boq_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "estimates_organizationId_leadId_idx" ON "estimates"("organizationId", "leadId");

-- CreateIndex
CREATE INDEX "estimates_organizationId_customerId_idx" ON "estimates"("organizationId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "estimates_organizationId_estimateNumber_key" ON "estimates"("organizationId", "estimateNumber");

-- CreateIndex
CREATE INDEX "estimate_revisions_organizationId_estimateId_idx" ON "estimate_revisions"("organizationId", "estimateId");

-- CreateIndex
CREATE UNIQUE INDEX "estimate_revisions_estimateId_versionNumber_key" ON "estimate_revisions"("estimateId", "versionNumber");

-- CreateIndex
CREATE INDEX "boq_items_organizationId_revisionId_idx" ON "boq_items"("organizationId", "revisionId");

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_revisions" ADD CONSTRAINT "estimate_revisions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_revisions" ADD CONSTRAINT "estimate_revisions_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_revisions" ADD CONSTRAINT "estimate_revisions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boq_items" ADD CONSTRAINT "boq_items_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boq_items" ADD CONSTRAINT "boq_items_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "estimate_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
