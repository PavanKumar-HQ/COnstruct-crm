import { z } from "zod";
import { prisma } from "../lib/db";
import { SessionPayload } from "../lib/auth";
import { assertPermission, assertTenantAccess, PERMISSIONS } from "../lib/permissions";
import { logAuditEvent } from "../lib/audit";
import { CustomerStatus, CustomerType, Prisma } from "@prisma/client";

export const CreateCustomerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  companyName: z.string().optional().nullable(),
  customerType: z.nativeEnum(CustomerType).default(CustomerType.INDIVIDUAL),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(7, "Phone number must be at least 7 digits").optional().nullable(),
  alternatePhone: z.string().optional().nullable(),
  billingAddress: z.record(z.any()).optional().nullable(),
  siteAddress: z.record(z.any()).optional().nullable(),
  taxIdentifier: z.string().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;

export const UpdateCustomerSchema = CreateCustomerSchema.partial();
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;

export class CustomerService {
  /**
   * Identifies potential duplicate customers within the organization by email or phone.
   */
  static async findPotentialDuplicates(
    session: SessionPayload,
    email?: string | null,
    phone?: string | null
  ) {
    assertTenantAccess(session, session.organizationId);
    assertPermission(session, PERMISSIONS.LEADS_READ);

    if (!email && !phone) return [];

    const conditions: Prisma.CustomerWhereInput[] = [];
    if (email) conditions.push({ email });
    if (phone) conditions.push({ phone });

    return prisma.customer.findMany({
      where: {
        organizationId: session.organizationId,
        OR: conditions,
      },
      select: {
        id: true,
        name: true,
        companyName: true,
        email: true,
        phone: true,
        status: true,
      },
    });
  }

  static async createCustomer(session: SessionPayload, rawInput: CreateCustomerInput) {
    assertTenantAccess(session, session.organizationId);
    assertPermission(session, PERMISSIONS.LEADS_WRITE);

    const input = CreateCustomerSchema.parse(rawInput);

    const customer = await prisma.customer.create({
      data: {
        organizationId: session.organizationId,
        name: input.name,
        companyName: input.companyName,
        customerType: input.customerType,
        email: input.email,
        phone: input.phone,
        alternatePhone: input.alternatePhone,
        billingAddress: input.billingAddress ? (input.billingAddress as Prisma.InputJsonValue) : Prisma.JsonNull,
        siteAddress: input.siteAddress ? (input.siteAddress as Prisma.InputJsonValue) : Prisma.JsonNull,
        taxIdentifier: input.taxIdentifier,
        assignedToId: input.assignedToId,
        notes: input.notes,
      },
    });

    await logAuditEvent({
      organizationId: session.organizationId,
      userId: session.userId,
      action: "CREATE",
      entityType: "Customer",
      entityId: customer.id,
      metadata: { name: customer.name, email: customer.email },
    });

    return customer;
  }

  static async updateCustomer(session: SessionPayload, customerId: string, rawInput: UpdateCustomerInput) {
    assertTenantAccess(session, session.organizationId);
    assertPermission(session, PERMISSIONS.LEADS_WRITE);

    const input = UpdateCustomerSchema.parse(rawInput);

    const existing = await prisma.customer.findFirst({
      where: { id: customerId, organizationId: session.organizationId },
    });

    if (!existing) {
      throw new Error("Customer not found or access denied");
    }

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.companyName !== undefined ? { companyName: input.companyName } : {}),
        ...(input.customerType !== undefined ? { customerType: input.customerType } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.alternatePhone !== undefined ? { alternatePhone: input.alternatePhone } : {}),
        ...(input.billingAddress !== undefined
          ? { billingAddress: input.billingAddress ? (input.billingAddress as Prisma.InputJsonValue) : Prisma.JsonNull }
          : {}),
        ...(input.siteAddress !== undefined
          ? { siteAddress: input.siteAddress ? (input.siteAddress as Prisma.InputJsonValue) : Prisma.JsonNull }
          : {}),
        ...(input.taxIdentifier !== undefined ? { taxIdentifier: input.taxIdentifier } : {}),
        ...(input.assignedToId !== undefined ? { assignedToId: input.assignedToId } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });

    await logAuditEvent({
      organizationId: session.organizationId,
      userId: session.userId,
      action: "UPDATE",
      entityType: "Customer",
      entityId: customerId,
      metadata: { name: updated.name },
    });

    return updated;
  }

  static async listCustomers(
    session: SessionPayload,
    params: {
      search?: string;
      status?: CustomerStatus;
      page?: number;
      pageSize?: number;
    } = {}
  ) {
    assertTenantAccess(session, session.organizationId);
    assertPermission(session, PERMISSIONS.LEADS_READ);

    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.CustomerWhereInput = {
      organizationId: session.organizationId,
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: "insensitive" } },
              { companyName: { contains: params.search, mode: "insensitive" } },
              { email: { contains: params.search, mode: "insensitive" } },
              { phone: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          assignedTo: { select: { id: true, fullName: true, email: true } },
          _count: { select: { leads: true, contacts: true, activities: true, siteVisits: true } },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  static async getCustomerById(session: SessionPayload, customerId: string) {
    assertTenantAccess(session, session.organizationId);
    assertPermission(session, PERMISSIONS.LEADS_READ);

    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        organizationId: session.organizationId,
      },
      include: {
        contacts: { orderBy: { isPrimary: "desc" } },
        leads: { orderBy: { createdAt: "desc" } },
        activities: { orderBy: { createdAt: "desc" } },
        siteVisits: { orderBy: { scheduledDate: "desc" } },
        attachments: { orderBy: { createdAt: "desc" } },
        assignedTo: { select: { id: true, fullName: true, email: true } },
      },
    });

    return customer;
  }
}
