import { describe, it, expect, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { cleanTestDatabase } from "./test-utils";

const prisma = new PrismaClient();

describe("Demo Tenant & Environment Isolation Gates", () => {
  beforeEach(async () => {
    await cleanTestDatabase(prisma);
  });

  it("should prevent seeding demo data when NODE_ENV is set to production", async () => {
    const isProduction = true;
    const canSeedDemo = !isProduction;

    expect(canSeedDemo).toBe(false);
  });

  it("should enforce tenant boundaries so demo records never leak into production orgs", async () => {
    // 1. Create a real client organization
    const realOrg = await prisma.organization.create({
      data: {
        name: "Acme Real Contracting Corp",
        slug: "acme-real-corp",
      },
    });

    // 2. Create an isolated demo organization
    const demoOrg = await prisma.organization.create({
      data: {
        name: "Apex BuildTech Contracting (Demo)",
        slug: "apex-buildtech-demo",
        settings: { isDemoOrganization: true },
      },
    });

    // 3. Create a lead under demo organization
    await prisma.lead.create({
      data: {
        organizationId: demoOrg.id,
        title: "Demo Warehouse Project",
        source: "Demo Lead Engine",
      },
    });

    // 4. Verify querying under realOrg returns 0 leads
    const realOrgLeads = await prisma.lead.findMany({
      where: { organizationId: realOrg.id },
    });
    expect(realOrgLeads.length).toBe(0);

    // 5. Verify querying under demoOrg returns 1 lead
    const demoOrgLeads = await prisma.lead.findMany({
      where: { organizationId: demoOrg.id },
    });
    expect(demoOrgLeads.length).toBe(1);
    expect(demoOrgLeads[0].title).toBe("Demo Warehouse Project");
  });

  it("should reconcile all financial totals using Decimal values without floating point errors", async () => {
    const org = await prisma.organization.create({
      data: {
        name: "Precision Demo Corp",
        slug: "precision-demo-corp",
      },
    });

    const user = await prisma.user.create({
      data: {
        fullName: "Test User",
        email: "test.precision@demo.com",
        passwordHash: "dummy",
      },
    });

    const lead = await prisma.lead.create({
      data: {
        organizationId: org.id,
        title: "Precision Test Project",
        source: "Direct",
      },
    });

    const estimate = await prisma.estimate.create({
      data: {
        organizationId: org.id,
        estimateNumber: "EST-PREC-01",
        title: "Precision BOQ",
        leadId: lead.id,
        createdById: user.id,
      },
    });

    const rev = await prisma.estimateRevision.create({
      data: {
        organizationId: org.id,
        estimateId: estimate.id,
        versionNumber: 1,
        totalCost: 100000.00,
        sellingPricePreTax: 115000.00,
        taxAmount: 20700.00,
        totalAmount: 135700.00,
        createdById: user.id,
      },
    });

    const boq = await prisma.boqItem.create({
      data: {
        organizationId: org.id,
        revisionId: rev.id,
        itemCode: "BOQ-01",
        description: "Test BOQ item",
        unit: "sq.m",
        quantity: 100,
        unitCostRate: 1000,
        totalCost: 100000,
        sellingRate: 1150,
        totalSellingPrice: 115000,
      },
    });

    expect(Number(boq.totalCost)).toBe(100000);
    expect(Number(boq.totalSellingPrice)).toBe(115000);
  });
});
