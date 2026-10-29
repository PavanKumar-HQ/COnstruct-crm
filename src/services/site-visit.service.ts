import { z } from "zod";
import { prisma } from "../lib/db";
import { SessionPayload } from "../lib/auth";
import { assertPermission, assertTenantAccess, PERMISSIONS } from "../lib/permissions";
import { logAuditEvent } from "../lib/audit";
import { SiteVisitStatus, Prisma } from "@prisma/client";
import Decimal from "decimal.js";

export const ScheduleSiteVisitSchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  leadId: z.string().uuid().optional().nullable(),
  assignedToId: z.string().uuid("Assigned staff member ID is required"),
  scheduledDate: z.string().datetime("Valid ISO scheduled date is required"),
  siteAddress: z.string().min(5, "Site address is required"),
  siteLatitude: z.number().optional().nullable(),
  siteLongitude: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type ScheduleSiteVisitInput = z.infer<typeof ScheduleSiteVisitSchema>;

export class SiteVisitService {
  static async scheduleSiteVisit(session: SessionPayload, rawInput: ScheduleSiteVisitInput) {
    assertTenantAccess(session, session.organizationId);
    assertPermission(session, PERMISSIONS.LEADS_WRITE);

    const input = ScheduleSiteVisitSchema.parse(rawInput);

    if (!input.customerId && !input.leadId) {
      throw new Error("Site visit must be associated with a customer or a lead");
    }

    // Verify lead/customer belongs to this organization
    if (input.leadId) {
      const lead = await prisma.lead.findFirst({
        where: { id: input.leadId, organizationId: session.organizationId },
      });
      if (!lead) {
        throw new Error("Specified lead not found in this organization");
      }
    }

    if (input.customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: input.customerId, organizationId: session.organizationId },
      });
      if (!customer) {
        throw new Error("Specified customer not found in this organization");
      }
    }

    const scheduledDate = new Date(input.scheduledDate);
    if (isNaN(scheduledDate.getTime())) {
      throw new Error("Invalid scheduled date");
    }

    const visit = await prisma.siteVisit.create({
      data: {
        organizationId: session.organizationId,
        customerId: input.customerId,
        leadId: input.leadId,
        assignedToId: input.assignedToId,
        createdById: session.userId,
        scheduledDate,
        siteAddress: input.siteAddress,
        siteLatitude: input.siteLatitude ? new Decimal(input.siteLatitude) : null,
        siteLongitude: input.siteLongitude ? new Decimal(input.siteLongitude) : null,
        notes: input.notes,
        status: SiteVisitStatus.SCHEDULED,
      },
    });

    // Update lead status to SITE_VISIT_SCHEDULED if applicable
    if (input.leadId) {
      await prisma.lead.update({
        where: { id: input.leadId },
        data: { status: "SITE_VISIT_SCHEDULED" },
      });
    }

    await logAuditEvent({
      organizationId: session.organizationId,
      userId: session.userId,
      action: "CREATE",
      entityType: "SiteVisit",
      entityId: visit.id,
      metadata: { scheduledDate: visit.scheduledDate, siteAddress: visit.siteAddress },
    });

    return visit;
  }

  static async recordVisitOutcome(
    session: SessionPayload,
    visitId: string,
    params: {
      measurements?: Record<string, unknown>;
      outcomeNotes: string;
    }
  ) {
    assertTenantAccess(session, session.organizationId);
    assertPermission(session, PERMISSIONS.LEADS_WRITE);

    const visit = await prisma.siteVisit.findFirst({
      where: { id: visitId, organizationId: session.organizationId },
    });

    if (!visit) {
      throw new Error("Site visit not found or inaccessible");
    }

    const updated = await prisma.siteVisit.update({
      where: { id: visitId },
      data: {
        status: SiteVisitStatus.COMPLETED,
        completedAt: new Date(),
        outcomeNotes: params.outcomeNotes,
        measurements: params.measurements
          ? (params.measurements as Prisma.InputJsonValue)
          : visit.measurements ?? Prisma.JsonNull,
      },
    });

    // Automatically transition lead to SITE_VISIT_COMPLETED
    if (visit.leadId) {
      await prisma.lead.update({
        where: { id: visit.leadId },
        data: { status: "SITE_VISIT_COMPLETED" },
      });
    }

    await logAuditEvent({
      organizationId: session.organizationId,
      userId: session.userId,
      action: "UPDATE",
      entityType: "SiteVisit",
      entityId: visitId,
      metadata: { status: "COMPLETED", outcomeNotes: params.outcomeNotes },
    });

    return updated;
  }
}
