import { z } from "zod";
import { prisma } from "../lib/db";
import { SessionPayload } from "../lib/auth";
import { assertPermission, assertTenantAccess, PERMISSIONS } from "../lib/permissions";
import { logAuditEvent } from "../lib/audit";
import { LeadPriority, LeadStatus, Prisma } from "@prisma/client";
import Decimal from "decimal.js";
import { CreateLeadSchema, CreateLeadInput } from "./lead.types";

export const UpdateLeadStatusSchema = z.object({
  status: z.nativeEnum(LeadStatus),
  lossReason: z.string().optional().nullable(),
});

export class LeadService {
  static async createLead(session: SessionPayload, rawInput: CreateLeadInput) {
    assertTenantAccess(session, session.organizationId);
    assertPermission(session, PERMISSIONS.LEADS_WRITE);

    const input = CreateLeadSchema.parse(rawInput);

    // If customerId is provided, enforce that the customer belongs to this organization
    if (input.customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: input.customerId, organizationId: session.organizationId },
      });
      if (!customer) {
        throw new Error("Specified customer does not exist in this organization");
      }
    }

    const lead = await prisma.lead.create({
      data: {
        organizationId: session.organizationId,
        customerId: input.customerId,
        title: input.title,
        source: input.source,
        priority: input.priority,
        constructionType: input.constructionType,
        estimatedBudget: input.estimatedBudget ? new Decimal(input.estimatedBudget) : null,
        expectedStartDate: input.expectedStartDate ? new Date(input.expectedStartDate) : null,
        expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : null,
        requirements: input.requirements,
        assignedToId: input.assignedToId,
        contactName: input.contactName,
        contactPhone: input.contactPhone,
        contactEmail: input.contactEmail,
        siteAddress: input.siteAddress,
      },
    });

    await logAuditEvent({
      organizationId: session.organizationId,
      userId: session.userId,
      action: "CREATE",
      entityType: "Lead",
      entityId: lead.id,
      metadata: { title: lead.title, status: lead.status },
    });

    return lead;
  }

  static async updateLeadStatus(
    session: SessionPayload,
    leadId: string,
    rawInput: z.infer<typeof UpdateLeadStatusSchema>
  ) {
    assertTenantAccess(session, session.organizationId);
    assertPermission(session, PERMISSIONS.LEADS_WRITE);

    const input = UpdateLeadStatusSchema.parse(rawInput);

    const existing = await prisma.lead.findFirst({
      where: { id: leadId, organizationId: session.organizationId },
    });

    if (!existing) {
      throw new Error("Lead not found or inaccessible");
    }

    // Disallow altering status once WON or converted
    if (existing.status === LeadStatus.WON && input.status !== LeadStatus.WON) {
      throw new Error("Won/converted leads cannot be transitioned to another status");
    }

    if (input.status === LeadStatus.LOST && (!input.lossReason || input.lossReason.trim().length === 0)) {
      throw new Error("Loss reason is mandatory when marking a lead as LOST");
    }

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: input.status,
        lossReason: input.status === LeadStatus.LOST ? input.lossReason : null,
      },
    });

    await logAuditEvent({
      organizationId: session.organizationId,
      userId: session.userId,
      action: "UPDATE",
      entityType: "Lead",
      entityId: leadId,
      metadata: { previousStatus: existing.status, newStatus: updated.status, lossReason: updated.lossReason },
    });

    return updated;
  }

  /**
   * Converts a qualified/won lead into a verified Customer entity.
   * Executed transactionally to prevent duplicate customer creation.
   */
  static async convertLeadToCustomer(session: SessionPayload, leadId: string) {
    assertTenantAccess(session, session.organizationId);
    assertPermission(session, PERMISSIONS.LEADS_WRITE);

    return prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findFirst({
        where: { id: leadId, organizationId: session.organizationId },
      });

      if (!lead) {
        throw new Error("Lead not found");
      }

      if (lead.convertedAt || lead.customerId) {
        throw new Error("Lead has already been converted to a customer");
      }

      const customerName = lead.contactName || lead.title;

      // Create Customer from lead information
      const customer = await tx.customer.create({
        data: {
          organizationId: session.organizationId,
          name: customerName,
          email: lead.contactEmail,
          phone: lead.contactPhone,
          assignedToId: lead.assignedToId,
          notes: `Converted from Lead: ${lead.title}. Requirements: ${lead.requirements || "None specified"}`,
        },
      });

      // Update lead to link to new customer and mark conversion timestamp
      const updatedLead = await tx.lead.update({
        where: { id: leadId },
        data: {
          customerId: customer.id,
          status: LeadStatus.WON,
          convertedAt: new Date(),
        },
      });

      // Re-link all related activities and site visits to the customer
      await tx.activity.updateMany({
        where: { leadId: lead.id, customerId: null },
        data: { customerId: customer.id },
      });

      await tx.siteVisit.updateMany({
        where: { leadId: lead.id, customerId: null },
        data: { customerId: customer.id },
      });

      await logAuditEvent(
        {
          organizationId: session.organizationId,
          userId: session.userId,
          action: "CONVERT",
          entityType: "Lead",
          entityId: leadId,
          metadata: { newCustomerId: customer.id, leadTitle: lead.title },
        },
        tx
      );

      return { customer, lead: updatedLead };
    });
  }

  static async listLeads(
    session: SessionPayload,
    params: {
      status?: LeadStatus;
      priority?: LeadPriority;
      search?: string;
      assignedToId?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ) {
    assertTenantAccess(session, session.organizationId);
    assertPermission(session, PERMISSIONS.LEADS_READ);

    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.LeadWhereInput = {
      organizationId: session.organizationId,
      ...(params.status ? { status: params.status } : {}),
      ...(params.priority ? { priority: params.priority } : {}),
      ...(params.assignedToId ? { assignedToId: params.assignedToId } : {}),
      ...(params.search
        ? {
            OR: [
              { title: { contains: params.search, mode: "insensitive" } },
              { contactName: { contains: params.search, mode: "insensitive" } },
              { contactEmail: { contains: params.search, mode: "insensitive" } },
              { contactPhone: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { id: true, name: true, companyName: true } },
          assignedTo: { select: { id: true, fullName: true, email: true } },
          _count: { select: { activities: true, siteVisits: true, attachments: true } },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  static async getLeadById(session: SessionPayload, leadId: string) {
    assertTenantAccess(session, session.organizationId);
    assertPermission(session, PERMISSIONS.LEADS_READ);

    return prisma.lead.findFirst({
      where: { id: leadId, organizationId: session.organizationId },
      include: {
        customer: true,
        assignedTo: { select: { id: true, fullName: true, email: true } },
        activities: { orderBy: { createdAt: "desc" } },
        siteVisits: { orderBy: { scheduledDate: "desc" } },
        attachments: { orderBy: { createdAt: "desc" } },
      },
    });
  }
}
