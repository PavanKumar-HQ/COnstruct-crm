import { prisma } from "../lib/db";
import { SessionPayload } from "../lib/auth";
import { assertPermission, assertTenantAccess, PERMISSIONS } from "../lib/permissions";
import { logAuditEvent } from "../lib/audit";
import { ActivityStatus } from "@prisma/client";
import { CreateActivitySchema, CreateActivityInput } from "./activity.types";

export class ActivityService {
  static async createActivity(session: SessionPayload, rawInput: CreateActivityInput) {
    assertTenantAccess(session, session.organizationId);
    assertPermission(session, PERMISSIONS.LEADS_WRITE);

    const input = CreateActivitySchema.parse(rawInput);

    if (!input.customerId && !input.leadId) {
      throw new Error("Activity must be associated with either a customer or a lead");
    }

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

    const activity = await prisma.activity.create({
      data: {
        organizationId: session.organizationId,
        customerId: input.customerId,
        leadId: input.leadId,
        type: input.type,
        subject: input.subject,
        description: input.description,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        priority: input.priority,
        assignedToId: input.assignedToId || session.userId,
      },
    });

    await logAuditEvent({
      organizationId: session.organizationId,
      userId: session.userId,
      action: "CREATE",
      entityType: "Activity",
      entityId: activity.id,
      metadata: { type: activity.type, subject: activity.subject },
    });

    return activity;
  }

  static async completeActivity(session: SessionPayload, activityId: string, outcomeNotes?: string) {
    assertTenantAccess(session, session.organizationId);
    assertPermission(session, PERMISSIONS.LEADS_WRITE);

    const activity = await prisma.activity.findFirst({
      where: { id: activityId, organizationId: session.organizationId },
    });

    if (!activity) {
      throw new Error("Activity not found or inaccessible");
    }

    const updated = await prisma.activity.update({
      where: { id: activityId },
      data: {
        status: ActivityStatus.COMPLETED,
        completedAt: new Date(),
        outcomeNotes: outcomeNotes || activity.outcomeNotes,
      },
    });

    await logAuditEvent({
      organizationId: session.organizationId,
      userId: session.userId,
      action: "UPDATE",
      entityType: "Activity",
      entityId: activityId,
      metadata: { status: "COMPLETED", outcomeNotes },
    });

    return updated;
  }

  static async listOverdueTasks(session: SessionPayload) {
    assertTenantAccess(session, session.organizationId);
    assertPermission(session, PERMISSIONS.LEADS_READ);

    const now = new Date();

    return prisma.activity.findMany({
      where: {
        organizationId: session.organizationId,
        status: ActivityStatus.PENDING,
        dueDate: { lt: now },
      },
      orderBy: { dueDate: "asc" },
      include: {
        lead: { select: { id: true, title: true } },
        customer: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, fullName: true, email: true } },
      },
    });
  }
}
