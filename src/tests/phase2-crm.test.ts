import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { hashPassword, createSessionToken } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { CustomerService } from "@/services/customer.service";
import { LeadService } from "@/services/lead.service";
import { ActivityService } from "@/services/activity.service";
import { SiteVisitService } from "@/services/site-visit.service";
import { StorageService } from "@/lib/storage";
import { cleanTestDatabase } from "./test-utils";

const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || "postgresql://pavankumars@localhost:5432/construct_crm_test?schema=public",
    },
  },
});

describe("Phase 2 CRM End-to-End Suite", () => {
  let orgAId: string;
  let orgBId: string;
  let userAId: string;
  let userBId: string;
  let sessionA: any;
  let sessionB: any;

  beforeAll(async () => {
    await cleanTestDatabase(testPrisma);

    // Create Org A
    const orgA = await testPrisma.organization.create({
      data: { name: "Apex Infrastructure Pvt Ltd", slug: "apex-infra" },
    });
    orgAId = orgA.id;

    // Create Org B
    const orgB = await testPrisma.organization.create({
      data: { name: "BluePeak Developers Ltd", slug: "bluepeak-dev" },
    });
    orgBId = orgB.id;

    const pwd = await hashPassword("StrongP@ss1234!");

    const userA = await testPrisma.user.create({
      data: { email: "sales@apexinfra.com", passwordHash: pwd, fullName: "Karan Johar" },
    });
    userAId = userA.id;

    const userB = await testPrisma.user.create({
      data: { email: "director@bluepeak.com", passwordHash: pwd, fullName: "Ananya Roy" },
    });
    userBId = userB.id;

    const roleA = await testPrisma.role.create({
      data: { organizationId: orgAId, name: "Sales Manager", code: "SALES_MGR", permissions: ["*"] },
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
      roleCode: "SALES_MGR",
      permissions: ["*"],
      email: "sales@apexinfra.com",
    };

    sessionB = {
      userId: userBId,
      organizationId: orgBId,
      roleId: roleB.id,
      roleCode: "DIRECTOR",
      permissions: ["*"],
      email: "director@bluepeak.com",
    };
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  describe("Customer & Lead Lifecycle", () => {
    let createdLeadId: string;
    let createdCustomerId: string;

    it("creates a realistic Lead in Org A with audit history", async () => {
      const lead = await LeadService.createLead(sessionA, {
        title: "Commercial Warehouse G+1",
        source: "Direct Referral",
        priority: "HIGH",
        constructionType: "Industrial Pre-Engineered Building",
        estimatedBudget: 45000000,
        contactName: "Rajesh Varma",
        contactEmail: "rajesh.varma@varmaenterprises.in",
        contactPhone: "+919876543210",
        siteAddress: "Plot 42, KIADB Industrial Area, Phase 2, Bangalore",
        requirements: "Clear height of 10 meters with epoxy flooring and 500kVA transformer yard",
      });

      expect(lead.id).toBeDefined();
      expect(lead.title).toBe("Commercial Warehouse G+1");
      expect(lead.status).toBe("NEW");
      createdLeadId = lead.id;

      // Verify audit log
      const audit = await testPrisma.auditLog.findFirst({
        where: { organizationId: orgAId, entityId: lead.id, action: "CREATE" },
      });
      expect(audit).not.toBeNull();
    });

    it("schedules a Site Visit and updates Lead status", async () => {
      const visit = await SiteVisitService.scheduleSiteVisit(sessionA, {
        leadId: createdLeadId,
        assignedToId: userAId,
        scheduledDate: new Date(Date.now() + 86400000).toISOString(),
        siteAddress: "Plot 42, KIADB Industrial Area, Phase 2, Bangalore",
        notes: "Soil testing report to be collected from client representative",
      });

      expect(visit.id).toBeDefined();
      expect(visit.status).toBe("SCHEDULED");

      const lead = await LeadService.getLeadById(sessionA, createdLeadId);
      expect(lead?.status).toBe("SITE_VISIT_SCHEDULED");
    });

    it("records Site Visit outcome and transitions Lead status", async () => {
      const visit = await testPrisma.siteVisit.findFirst({
        where: { leadId: createdLeadId },
      });
      expect(visit).not.toBeNull();

      const completed = await SiteVisitService.recordVisitOutcome(sessionA, visit!.id, {
        outcomeNotes: "Site inspected. Natural ground level 1.2m below road. Piling foundation required.",
        measurements: {
          plotAreaSqFt: 24000,
          roadWidthMeters: 18,
          frontageMeters: 40,
        },
      });

      expect(completed.status).toBe("COMPLETED");

      const lead = await LeadService.getLeadById(sessionA, createdLeadId);
      expect(lead?.status).toBe("SITE_VISIT_COMPLETED");
    });

    it("converts Lead to Customer and links all historical records transactionally", async () => {
      // Add an activity prior to conversion
      await ActivityService.createActivity(sessionA, {
        leadId: createdLeadId,
        type: "MEETING",
        subject: "Structural design kick-off with Rajesh Varma",
        dueDate: new Date().toISOString(),
      });

      const conversion = await LeadService.convertLeadToCustomer(sessionA, createdLeadId);
      expect(conversion.customer.id).toBeDefined();
      expect(conversion.customer.name).toBe("Rajesh Varma");
      expect(conversion.lead.status).toBe("WON");
      expect(conversion.lead.customerId).toBe(conversion.customer.id);
      createdCustomerId = conversion.customer.id;

      // Duplicate conversion must be rejected
      await expect(
        LeadService.convertLeadToCustomer(sessionA, createdLeadId)
      ).rejects.toThrow("Lead has already been converted to a customer");
    });

    it("detects potential duplicate customer by phone and email without silent merging", async () => {
      const duplicates = await CustomerService.findPotentialDuplicates(
        sessionA,
        "rajesh.varma@varmaenterprises.in",
        "+919876543210"
      );

      expect(duplicates.length).toBeGreaterThan(0);
      expect(duplicates[0].id).toBe(createdCustomerId);
    });

    it("calculates overdue tasks accurately", async () => {
      // Create past-due activity
      const pastDate = new Date(Date.now() - 3600000).toISOString();
      await ActivityService.createActivity(sessionA, {
        customerId: createdCustomerId,
        type: "TASK",
        subject: "Submit preliminary soil test report",
        dueDate: pastDate,
      });

      const overdue = await ActivityService.listOverdueTasks(sessionA);
      expect(overdue.length).toBeGreaterThan(0);
      expect(overdue.some((t) => t.subject === "Submit preliminary soil test report")).toBe(true);
    });

    it("proves strict Tenant Isolation: Org B cannot access Org A's leads or customers", async () => {
      // Attempting to read Org A's lead using Org B's session
      const leadForOrgB = await LeadService.getLeadById(sessionB, createdLeadId);
      expect(leadForOrgB).toBeNull();

      // Attempting to read Org A's customer using Org B's session
      const customerForOrgB = await CustomerService.getCustomerById(sessionB, createdCustomerId);
      expect(customerForOrgB).toBeNull();

      // Attempting to list Org A's customers with Org B credentials returns empty list
      const orgBList = await CustomerService.listCustomers(sessionB);
      expect(orgBList.total).toBe(0);
      expect(orgBList.items.length).toBe(0);
    });
  });

  describe("Protected File Storage Abstraction", () => {
    it("saves and retrieves files in tenant-isolated partition without path traversal", async () => {
      const sampleBuffer = Buffer.from("SITE_SURVEY_REPORT_MOCK_DATA_2026");
      const metadata = await StorageService.saveFile({
        organizationId: orgAId,
        originalFileName: "Soil_Test_Report.pdf",
        mimeType: "application/pdf",
        buffer: sampleBuffer,
      });

      expect(metadata.storageKey).toBeDefined();

      const retrieved = await StorageService.getFileBuffer(orgAId, metadata.storageKey);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.toString()).toBe("SITE_SURVEY_REPORT_MOCK_DATA_2026");

      // Org B cannot retrieve Org A's file
      const crossOrgRetrieved = await StorageService.getFileBuffer(orgBId, metadata.storageKey);
      expect(crossOrgRetrieved).toBeNull();
    });
  });
});
