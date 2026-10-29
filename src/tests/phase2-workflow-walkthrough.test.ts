import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { hashPassword, createSessionToken } from "@/lib/auth";
import { CustomerService } from "@/services/customer.service";
import { LeadService } from "@/services/lead.service";
import { ActivityService } from "@/services/activity.service";
import { SiteVisitService } from "@/services/site-visit.service";
import { cleanTestDatabase } from "./test-utils";

const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || "postgresql://pavankumars@localhost:5432/construct_crm_test?schema=public",
    },
  },
});

describe("Phase 2.1 Complete CRM End-to-End Walkthrough Journey", () => {
  let orgId: string;
  let userId: string;
  let session: any;

  beforeAll(async () => {
    await cleanTestDatabase(testPrisma);

    const org = await testPrisma.organization.create({
      data: { name: "Vanguard Infrastructure & Construction", slug: "vanguard-infra" },
    });
    orgId = org.id;

    const pwd = await hashPassword("WalkthroughP@ss2026!");
    const user = await testPrisma.user.create({
      data: { email: "lead.pm@vanguard.com", passwordHash: pwd, fullName: "Deepak Verma" },
    });
    userId = user.id;

    const role = await testPrisma.role.create({
      data: { organizationId: orgId, name: "General Manager", code: "GM", permissions: ["*"] },
    });

    await testPrisma.membership.create({
      data: { organizationId: orgId, userId: userId, roleId: role.id, status: "ACTIVE" },
    });

    session = {
      userId,
      organizationId: orgId,
      roleId: role.id,
      roleCode: "GM",
      permissions: ["*"],
      email: "lead.pm@vanguard.com",
    };
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it("completes full CRM lifecycle: Lead -> Visit Schedule -> Visit Outcome -> Follow-up Task -> Conversion -> Relational Integrity", async () => {
    // 1. Create a lead with real specifications
    const lead = await LeadService.createLead(session, {
      title: "Luxury Hilltop Villa Construction (G+2)",
      source: "Architect Referral",
      priority: "HIGH",
      constructionType: "RCC Framed Structure",
      estimatedBudget: 35000000,
      contactName: "Naveen Jindal",
      contactPhone: "+919988776655",
      contactEmail: "naveen.j@jindalholdings.com",
      siteAddress: "Sy No 114, Nandi Hills Road, Devanahalli, Bengaluru",
      requirements: "Cantilevered infinity pool, seismic zone II compliant, high-spec Italian marble finish.",
    });

    expect(lead.id).toBeDefined();
    expect(lead.status).toBe("NEW");

    // 2. View and update lead status to QUALIFIED
    const qualifiedLead = await LeadService.updateLeadStatus(session, lead.id, {
      status: "QUALIFIED",
    });
    expect(qualifiedLead.status).toBe("QUALIFIED");

    // 3. Schedule site visit
    const visitDate = new Date(Date.now() + 48 * 3600 * 1000); // 2 days ahead
    const visit = await SiteVisitService.scheduleSiteVisit(session, {
      leadId: lead.id,
      assignedToId: userId,
      scheduledDate: visitDate.toISOString(),
      siteAddress: lead.siteAddress!,
      notes: "Verify road access for ready-mix concrete (RMC) transit mixers.",
    });

    expect(visit.id).toBeDefined();
    expect(visit.status).toBe("SCHEDULED");

    // Verify lead transitioned to SITE_VISIT_SCHEDULED
    const leadAfterSchedule = await LeadService.getLeadById(session, lead.id);
    expect(leadAfterSchedule?.status).toBe("SITE_VISIT_SCHEDULED");

    // 4. Record visit outcome and measurements
    const completedVisit = await SiteVisitService.recordVisitOutcome(session, visit.id, {
      outcomeNotes: "Soil is hard red gravel. Road access is 12m wide asphalt road, suitable for RMC vehicles.",
      measurements: {
        frontageMeters: 30,
        depthMeters: 45,
        slopePercentage: 4.2,
      },
    });

    expect(completedVisit.status).toBe("COMPLETED");

    // Verify lead transitioned to SITE_VISIT_COMPLETED
    const leadAfterVisit = await LeadService.getLeadById(session, lead.id);
    expect(leadAfterVisit?.status).toBe("SITE_VISIT_COMPLETED");
    expect(leadAfterVisit?.siteVisits?.length).toBe(1);

    // 5. Create follow-up activity
    const activity = await ActivityService.createActivity(session, {
      leadId: lead.id,
      type: "TASK",
      subject: "Prepare preliminary structural concept & BOQ",
      dueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      priority: "HIGH",
    });

    expect(activity.id).toBeDefined();
    expect(activity.status).toBe("PENDING");

    // Complete follow-up activity
    const completedActivity = await ActivityService.completeActivity(session, activity.id, "BOQ draft ready");
    expect(completedActivity.status).toBe("COMPLETED");

    // 6. Convert lead to verified Customer
    const conversion = await LeadService.convertLeadToCustomer(session, lead.id);
    expect(conversion.customer.id).toBeDefined();
    expect(conversion.customer.name).toBe("Naveen Jindal");
    expect(conversion.lead.status).toBe("WON");
    expect(conversion.lead.customerId).toBe(conversion.customer.id);

    // 7. Verify relational integrity on Customer account
    const customerAccount = await CustomerService.getCustomerById(session, conversion.customer.id);
    expect(customerAccount).not.toBeNull();
    expect(customerAccount?.leads.length).toBe(1);
    expect(customerAccount?.leads[0].id).toBe(lead.id);

    // Verify that site visits and activities are linked to the customer
    expect(customerAccount?.siteVisits.length).toBe(1);
    expect(customerAccount?.siteVisits[0].id).toBe(visit.id);
    expect(customerAccount?.activities.length).toBe(1);
    expect(customerAccount?.activities[0].id).toBe(activity.id);

    // 8. Test Customer update capability
    const updatedCustomer = await CustomerService.updateCustomer(session, conversion.customer.id, {
      companyName: "Jindal Holdings Private Limited",
      taxIdentifier: "29AAAAA0000A1Z5", // GSTIN
    });
    expect(updatedCustomer.companyName).toBe("Jindal Holdings Private Limited");
    expect(updatedCustomer.taxIdentifier).toBe("29AAAAA0000A1Z5");
  });
});
