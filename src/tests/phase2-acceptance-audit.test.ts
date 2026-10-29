import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { hashPassword, createSessionToken } from "@/lib/auth";
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

describe("Phase 2 Acceptance Audit Suite", () => {
  let orgAId: string;
  let orgBId: string;
  let userAId: string;
  let userBId: string;
  let sessionA: any;
  let sessionB: any;

  beforeAll(async () => {
    await cleanTestDatabase(testPrisma);

    const orgA = await testPrisma.organization.create({
      data: { name: "Prime Builders India", slug: "prime-builders" },
    });
    orgAId = orgA.id;

    const orgB = await testPrisma.organization.create({
      data: { name: "Horizon Commercials", slug: "horizon-comm" },
    });
    orgBId = orgB.id;

    const pwd = await hashPassword("ComplexP@ssw0rd!2026");

    const userA = await testPrisma.user.create({
      data: { email: "pm@primebuilders.com", passwordHash: pwd, fullName: "Sunil Gavaskar" },
    });
    userAId = userA.id;

    const userB = await testPrisma.user.create({
      data: { email: "director@horizon.com", passwordHash: pwd, fullName: "Kavita Rao" },
    });
    userBId = userB.id;

    const roleA = await testPrisma.role.create({
      data: { organizationId: orgAId, name: "Project Manager", code: "PM", permissions: ["*"] },
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
      roleCode: "PM",
      permissions: ["*"],
      email: "pm@primebuilders.com",
    };

    sessionB = {
      userId: userBId,
      organizationId: orgBId,
      roleId: roleB.id,
      roleCode: "DIRECTOR",
      permissions: ["*"],
      email: "director@horizon.com",
    };
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  describe("Validation & State Machine Enforcement", () => {
    let testLeadId: string;

    it("creates lead and verifies initial state", async () => {
      const lead = await LeadService.createLead(sessionA, {
        title: "Commercial Office Fitout",
        source: "Website Enquiry",
        priority: "HIGH",
        estimatedBudget: 8500000,
        contactName: "Vikram Seth",
        contactEmail: "vikram@sethcorp.in",
        contactPhone: "+919123456789",
      });

      expect(lead.id).toBeDefined();
      expect(lead.status).toBe("NEW");
      testLeadId = lead.id;
    });

    it("rejects marking lead as LOST without mandatory loss reason", async () => {
      await expect(
        LeadService.updateLeadStatus(sessionA, testLeadId, {
          status: "LOST",
          lossReason: "",
        })
      ).rejects.toThrow("Loss reason is mandatory when marking a lead as LOST");
    });

    it("accepts marking lead as LOST with valid reason", async () => {
      const updated = await LeadService.updateLeadStatus(sessionA, testLeadId, {
        status: "LOST",
        lossReason: "Client postponed capital expenditure to next fiscal",
      });
      expect(updated.status).toBe("LOST");
      expect(updated.lossReason).toBe("Client postponed capital expenditure to next fiscal");
    });

    it("prevents cross-tenant customer linkage on lead creation", async () => {
      // Create a customer in Org B
      const customerB = await testPrisma.customer.create({
        data: {
          organizationId: orgBId,
          name: "Org B Client",
        },
      });

      // User A from Org A attempts to create a lead linked to customerB
      await expect(
        LeadService.createLead(sessionA, {
          title: "Malicious Cross-Tenant Link",
          source: "Direct Referral",
          customerId: customerB.id,
        })
      ).rejects.toThrow("Specified customer does not exist in this organization");
    });

    it("prevents cross-tenant site visit scheduling", async () => {
      // User A attempts to schedule a site visit referencing Org B's entity
      const leadB = await testPrisma.lead.create({
        data: {
          organizationId: orgBId,
          title: "Org B Project",
          source: "Banner",
        },
      });

      await expect(
        SiteVisitService.scheduleSiteVisit(sessionA, {
          leadId: leadB.id,
          assignedToId: userAId,
          scheduledDate: new Date().toISOString(),
          siteAddress: "Some Site Address",
        })
      ).rejects.toThrow("Specified lead not found in this organization");
    });

    it("prevents cross-tenant activity creation", async () => {
      const leadB = await testPrisma.lead.findFirst({
        where: { organizationId: orgBId },
      });

      await expect(
        ActivityService.createActivity(sessionA, {
          leadId: leadB!.id,
          type: "TASK",
          subject: "Attempt cross tenant task injection",
        })
      ).rejects.toThrow("Specified lead not found in this organization");
    });
  });

  describe("File Security & Attachment Authorization", () => {
    it("rejects unsupported MIME types", async () => {
      await expect(
        StorageService.saveFile({
          organizationId: orgAId,
          originalFileName: "malicious.exe",
          mimeType: "application/x-msdownload",
          buffer: Buffer.from("MZ..."),
        })
      ).rejects.toThrow("Unsupported or prohibited file type");
    });

    it("rejects files exceeding size limits", async () => {
      const largeBuffer = Buffer.alloc(16 * 1024 * 1024); // 16MB
      await expect(
        StorageService.saveFile({
          organizationId: orgAId,
          originalFileName: "large_drawing.pdf",
          mimeType: "application/pdf",
          buffer: largeBuffer,
        })
      ).rejects.toThrow("File size exceeds maximum permitted limit");
    });

    it("prevents path traversal during retrieval", async () => {
      // Attempts path traversal attack to read outside tenant sandbox
      const traversalKey = "../../../../etc/passwd";
      const result = await StorageService.getFileBuffer(orgAId, traversalKey);
      expect(result).toBeNull();
    });
  });
});
