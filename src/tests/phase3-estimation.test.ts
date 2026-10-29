import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/auth";
import { EstimationService } from "@/services/estimation.service";
import { LeadService } from "@/services/lead.service";
import { cleanTestDatabase } from "./test-utils";

const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || "postgresql://pavankumars@localhost:5432/construct_crm_test?schema=public",
    },
  },
});

describe("Phase 3.1 Estimation & BOQ Engine Verification Suite", () => {
  let orgAId: string;
  let orgBId: string;
  let userAId: string;
  let userBId: string;
  let sessionA: any;
  let sessionB: any;
  let leadAId: string;

  beforeAll(async () => {
    await cleanTestDatabase(testPrisma);

    const orgA = await testPrisma.organization.create({
      data: { name: "Apex Commercial Builders Pvt Ltd", slug: "apex-commercial" },
    });
    orgAId = orgA.id;

    const orgB = await testPrisma.organization.create({
      data: { name: "Zenith Infrastructure Ltd", slug: "zenith-infra" },
    });
    orgBId = orgB.id;

    const pwd = await hashPassword("EstimationP@ss2026!");
    const userA = await testPrisma.user.create({
      data: { email: "estimator@apexcommercial.com", passwordHash: pwd, fullName: "Kailash Nathan" },
    });
    userAId = userA.id;

    const userB = await testPrisma.user.create({
      data: { email: "director@zenithinfra.com", passwordHash: pwd, fullName: "Priya Sridhar" },
    });
    userBId = userB.id;

    const roleA = await testPrisma.role.create({
      data: { organizationId: orgAId, name: "Estimator", code: "ESTIMATOR", permissions: ["*"] },
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
      roleCode: "ESTIMATOR",
      permissions: ["*"],
      email: "estimator@apexcommercial.com",
    };

    sessionB = {
      userId: userBId,
      organizationId: orgBId,
      roleId: roleB.id,
      roleCode: "DIRECTOR",
      permissions: ["*"],
      email: "director@zenithinfra.com",
    };

    // Create a real lead in Org A
    const lead = await LeadService.createLead(sessionA, {
      title: "Warehouse Construction (G+1)",
      source: "Industrial Expo",
      priority: "HIGH",
      contactName: "Ashok Leyland Rep",
      siteAddress: "Bommasandra Industrial Area, Bengaluru",
    });
    leadAId = lead.id;
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  describe("BOQ & Cost Calculation Precision", () => {
    let createdEstimateId: string;
    let initialRevisionId: string;

    it("creates an Estimate with multi-category BOQ line items and decimal precision", async () => {
      const result = await EstimationService.createEstimate(sessionA, {
        title: "Civil & Structural BOQ Baseline",
        leadId: leadAId,
        markupPercentage: 15.0, // 15% overhead & profit
        taxPercentage: 18.0,    // 18% GST
        notes: "Detailed rate analysis based on CPWD Delhi Schedule of Rates (DSR)",
        items: [
          {
            itemCode: "EXC-01",
            category: "EXCAVATION",
            description: "Earth work in excavation by mechanical means over areas in ordinary soil",
            unit: "cu.m",
            quantity: 500,
            materialRate: 0,
            labourRate: 120,
            equipmentRate: 180,
            subcontractRate: 0,
          },
          {
            itemCode: "RCC-M25",
            category: "SUPERSTRUCTURE_RCC",
            description: "Reinforced cement concrete work in columns, beams and slabs using M25 design mix",
            unit: "cu.m",
            quantity: 120,
            materialRate: 4800,
            labourRate: 1500,
            equipmentRate: 400,
            subcontractRate: 300,
          },
        ],
      });

      expect(result.estimate.id).toBeDefined();
      expect(result.estimate.estimateNumber).toMatch(/^EST-\d{4}-\d{4}$/);
      expect(result.revision.versionNumber).toBe(1);
      expect(result.revision.items.length).toBe(2);

      createdEstimateId = result.estimate.id;
      initialRevisionId = result.revision.id;

      // Verification of Decimal Arithmetic:
      // Item 1 (Excavation):
      // Cost = 500 * (120 + 180) = 500 * 300 = 150,000.00
      // Selling Rate = 300 * 1.15 = 345.00
      // Selling Price = 500 * 345 = 172,500.00
      //
      // Item 2 (RCC-M25):
      // Unit Cost = 4800 + 1500 + 400 + 300 = 7,000.00
      // Cost = 120 * 7000 = 840,000.00
      // Selling Rate = 7000 * 1.15 = 8,050.00
      // Selling Price = 120 * 8050 = 966,000.00
      //
      // Total Cost = 150,000 + 840,000 = 990,000.00
      // Selling Price Pre-Tax = 172,500 + 966,000 = 1,138,500.00
      // Tax (18%) = 1,138,500 * 0.18 = 204,930.00
      // Total Amount = 1,138,500 + 204,930 = 1,343,430.00
      // Margin % = (1,138,500 - 990,000) / 1,138,500 * 100 = 148,500 / 1,138,500 * 100 = 13.04%

      expect(result.revision.totalCost.toString()).toBe("990000");
      expect(result.revision.sellingPricePreTax.toString()).toBe("1138500");
      expect(result.revision.taxAmount.toString()).toBe("204930");
      expect(result.revision.totalAmount.toString()).toBe("1343430");
      expect(result.revision.estimatedMargin.toString()).toBe("13.04");

      // Verify that lead status advanced to ESTIMATION
      const lead = await LeadService.getLeadById(sessionA, leadAId);
      expect(lead?.status).toBe("ESTIMATION");
    });

    it("creates a new Revision (v2) while preserving the original Revision (v1) snapshot", async () => {
      const v2 = await EstimationService.createNewRevision(sessionA, createdEstimateId, {
        notes: "Revision 2: Added structural steel rebar scope",
        markupPercentage: 15.0,
        taxPercentage: 18.0,
        items: [
          {
            itemCode: "EXC-01",
            category: "EXCAVATION",
            description: "Earth work in excavation by mechanical means",
            unit: "cu.m",
            quantity: 500,
            materialRate: 0,
            labourRate: 120,
            equipmentRate: 180,
            subcontractRate: 0,
          },
          {
            itemCode: "RCC-M25",
            category: "SUPERSTRUCTURE_RCC",
            description: "Reinforced cement concrete work",
            unit: "cu.m",
            quantity: 120,
            materialRate: 4800,
            labourRate: 1500,
            equipmentRate: 400,
            subcontractRate: 300,
          },
          {
            itemCode: "STL-FE550",
            category: "SUPERSTRUCTURE_RCC",
            description: "Thermo-mechanically treated (TMT) Fe-550D rebar cutting, bending and placing",
            unit: "MT",
            quantity: 15,
            materialRate: 62000,
            labourRate: 8000,
            equipmentRate: 1000,
            subcontractRate: 0,
          },
        ],
      });

      expect(v2.versionNumber).toBe(2);
      expect(v2.items.length).toBe(3);

      // Verify Estimate entity updated its currentVersion pointer
      const estimate = await EstimationService.getEstimateById(sessionA, createdEstimateId);
      expect(estimate?.currentVersion).toBe(2);
      expect(estimate?.revisions.length).toBe(2);

      // Verify Revision 1 remains intact with exactly 2 items
      const v1 = estimate?.revisions.find((r) => r.versionNumber === 1);
      expect(v1?.items.length).toBe(2);
      expect(v1?.totalCost.toString()).toBe("990000");
    });

    it("approves Revision and supersedes prior approvals with audit entry", async () => {
      const estimate = await EstimationService.getEstimateById(sessionA, createdEstimateId);
      const v2 = estimate?.revisions.find((r) => r.versionNumber === 2);

      const approved = await EstimationService.approveRevision(sessionA, createdEstimateId, v2!.id);
      expect(approved.status).toBe("APPROVED");
      expect(approved.approvedAt).not.toBeNull();

      // Check audit log
      const audit = await testPrisma.auditLog.findFirst({
        where: {
          organizationId: orgAId,
          entityType: "EstimateRevision",
          entityId: v2!.id,
          action: "APPROVE",
        },
      });
      expect(audit).not.toBeNull();
    });

    it("enforces strict Tenant Isolation: Org B cannot view or modify Org A estimates", async () => {
      // Org B attempting to read Org A's estimate returns null
      const estimateForOrgB = await EstimationService.getEstimateById(sessionB, createdEstimateId);
      expect(estimateForOrgB).toBeNull();

      // Org B listing estimates returns empty
      const listForOrgB = await EstimationService.listEstimates(sessionB);
      expect(listForOrgB.length).toBe(0);

      // Org B attempting to create a revision on Org A's estimate must fail
      await expect(
        EstimationService.createNewRevision(sessionB, createdEstimateId, {
          markupPercentage: 10,
          taxPercentage: 18,
          items: [
            {
              itemCode: "TAMPER",
              category: "MISCELLANEOUS",
              description: "Malicious insertion",
              unit: "nos",
              quantity: 1,
              materialRate: 1000,
            },
          ],
        })
      ).rejects.toThrow("Estimate not found or access denied");
    });
  });
});
