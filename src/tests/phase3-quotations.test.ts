import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/auth";
import { EstimationService } from "@/services/estimation.service";
import { QuotationService } from "@/services/quotation.service";
import { LeadService } from "@/services/lead.service";
import { cleanTestDatabase } from "./test-utils";

const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || "postgresql://pavankumars@localhost:5432/construct_crm_test?schema=public",
    },
  },
});

describe("Phase 3.2 Formal Quotations Suite", () => {
  let orgAId: string;
  let orgBId: string;
  let userAId: string;
  let userBId: string;
  let sessionA: any;
  let sessionB: any;
  let leadAId: string;
  let approvedEstimateId: string;

  beforeAll(async () => {
    await cleanTestDatabase(testPrisma);

    const orgA = await testPrisma.organization.create({
      data: { name: "Empire Infra Developments", slug: "empire-infra" },
    });
    orgAId = orgA.id;

    const orgB = await testPrisma.organization.create({
      data: { name: "Summit Infra Projects", slug: "summit-infra" },
    });
    orgBId = orgB.id;

    const pwd = await hashPassword("QuotationsSecureP@ss1!");
    const userA = await testPrisma.user.create({
      data: { email: "estimator@empireinfra.com", passwordHash: pwd, fullName: "Raghav Menon" },
    });
    userAId = userA.id;

    const userB = await testPrisma.user.create({
      data: { email: "director@summitinfra.com", passwordHash: pwd, fullName: "Arjun Rampal" },
    });
    userBId = userB.id;

    const roleA = await testPrisma.role.create({
      data: { organizationId: orgAId, name: "Director", code: "DIRECTOR", permissions: ["*"] },
    });

    const roleB = await testPrisma.role.create({
      data: { organizationId: orgBId, name: "Director", code: "DIRECTOR", permissions: ["*"] },
    });

    await testPrisma.membership.create({
      data: { organizationId: orgAId, userId: userAId, roleId: roleA.id, status: "ACTIVE" },
    });

    await testPrisma.membership.create({
      data: { organizationId: orgBId, userId: userBId, roleId: roleB.id, status: "ACTIVE" },
    });

    sessionA = {
      userId: userAId,
      organizationId: orgAId,
      roleId: roleA.id,
      roleCode: "DIRECTOR",
      permissions: ["*"],
      email: "estimator@empireinfra.com",
    };

    sessionB = {
      userId: userBId,
      organizationId: orgBId,
      roleId: roleB.id,
      roleCode: "DIRECTOR",
      permissions: ["*"],
      email: "director@summitinfra.com",
    };

    // Create lead
    const lead = await LeadService.createLead(sessionA, {
      title: "Commercial High-Rise Plaza",
      source: "Govt Tender",
      priority: "HIGH",
      contactName: "Urban Dev Authority Rep",
    });
    leadAId = lead.id;

    // Create estimate with BOQ items
    const { estimate, revision } = await EstimationService.createEstimate(sessionA, {
      title: "Commercial High-Rise BOQ",
      leadId: leadAId,
      markupPercentage: 15.0,
      taxPercentage: 18.0,
      items: [
        {
          itemCode: "PILING-01",
          category: "SUBSTRUCTURE",
          description: "Bored cast in-situ RCC piles 600mm dia",
          unit: "running m",
          quantity: 400,
          materialRate: 2500,
          labourRate: 800,
          equipmentRate: 700,
          subcontractRate: 0,
        },
      ],
    });
    approvedEstimateId = estimate.id;

    // Approve Revision 1 to make it a valid baseline for quotation
    await EstimationService.approveRevision(sessionA, estimate.id, revision.id);
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  describe("Quotation Lifecycle & Discount Rules", () => {
    let createdQuotationId: string;

    it("generates a Quotation linked to the approved Estimate revision", async () => {
      const result = await QuotationService.createQuotationFromEstimate(sessionA, {
        estimateId: approvedEstimateId,
        validUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
        paymentTerms: "10% Advance with Purchase Order, 80% Progressive Billing against Running Account (RA) bills, 10% Retention release upon Handover",
        inclusions: "Piling rig mobilization, cement, steel, testing charges",
        exclusions: "Electricity & water at site to be provided by client",
        discountAmount: 25000, // ₹25,000 commercial discount
      });

      expect(result.quotation.id).toBeDefined();
      expect(result.quotation.quotationNumber).toMatch(/^QUOT-\d{4}-\d{4}$/);
      expect(result.revision.versionNumber).toBe(1);

      // Calculations check:
      // Unit Cost = 2500 + 800 + 700 = 4,000
      // Unit Selling = 4000 * 1.15 = 4,600
      // Subtotal (Pre-Tax) = 400 * 4600 = 1,840,000.00
      // Tax (18%) = 1,840,000 * 0.18 = 331,200.00
      // Pre-discount Total = 2,171,200.00
      // Discount = 25,000.00
      // Final Grand Total = 2,171,200 - 25,000 = 2,146,200.00
      expect(result.revision.subtotalAmount.toString()).toBe("1840000");
      expect(result.revision.taxAmount.toString()).toBe("331200");
      expect(result.revision.discountAmount.toString()).toBe("25000");
      expect(result.revision.finalGrandTotal.toString()).toBe("2146200");

      createdQuotationId = result.quotation.id;
    });

    it("transitions quotation status to ISSUED and advances Lead pipeline to QUOTATION_SENT", async () => {
      const updated = await QuotationService.updateQuotationStatus(sessionA, createdQuotationId, {
        status: "ISSUED",
      });

      expect(updated.status).toBe("ISSUED");

      const lead = await LeadService.getLeadById(sessionA, leadAId);
      expect(lead?.status).toBe("QUOTATION_SENT");
    });

    it("enforces mandatory rejection reason when marking quotation as REJECTED", async () => {
      await expect(
        QuotationService.updateQuotationStatus(sessionA, createdQuotationId, {
          status: "REJECTED",
          rejectionReason: "",
        })
      ).rejects.toThrow("Rejection reason is mandatory when marking a quotation as REJECTED");
    });

    it("accepts quotation and advances Lead to NEGOTIATION with audit trail", async () => {
      const accepted = await QuotationService.updateQuotationStatus(sessionA, createdQuotationId, {
        status: "ACCEPTED",
      });

      expect(accepted.status).toBe("ACCEPTED");

      const lead = await LeadService.getLeadById(sessionA, leadAId);
      expect(lead?.status).toBe("NEGOTIATION");

      // Verify audit log
      const audit = await testPrisma.auditLog.findFirst({
        where: {
          organizationId: orgAId,
          entityType: "Quotation",
          entityId: createdQuotationId,
          action: "ACCEPT",
        },
      });
      expect(audit).not.toBeNull();
    });

    it("proves Tenant Isolation: Org B cannot access Org A's quotations", async () => {
      const quotForOrgB = await QuotationService.getQuotationById(sessionB, createdQuotationId);
      expect(quotForOrgB).toBeNull();

      const listOrgB = await QuotationService.listQuotations(sessionB);
      expect(listOrgB.length).toBe(0);
    });
  });
});

