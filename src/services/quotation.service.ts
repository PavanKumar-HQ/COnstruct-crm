import { prisma } from "../lib/db";
import { SessionPayload } from "../lib/auth";
import { assertPermission, assertTenantAccess, PERMISSIONS } from "../lib/permissions";
import { logAuditEvent } from "../lib/audit";
import { QuotationStatus, EstimateStatus, Prisma } from "@prisma/client";
import Decimal from "decimal.js";
import {
  CreateQuotationSchema,
  CreateQuotationInput,
  UpdateQuotationStatusSchema,
  UpdateQuotationStatusInput,
} from "./quotation.types";

export class QuotationService {
  /**
   * Generates a formal Quotation and Revision 1 from an Approved Estimate Revision.
   */
  static async createQuotationFromEstimate(
    session: SessionPayload,
    rawInput: CreateQuotationInput
  ) {
    assertTenantAccess(session, session.organizationId);
    assertPermission(session, PERMISSIONS.QUOTES_READ);

    const input = CreateQuotationSchema.parse(rawInput);

    return prisma.$transaction(async (tx) => {
      // 1. Fetch estimate and its latest approved revision
      const estimate = await tx.estimate.findFirst({
        where: { id: input.estimateId, organizationId: session.organizationId },
        include: {
          revisions: {
            where: { status: EstimateStatus.APPROVED },
            orderBy: { versionNumber: "desc" },
            take: 1,
            include: { items: true },
          },
        },
      });

      if (!estimate) throw new Error("Estimate not found or access denied");

      const approvedRevision = estimate.revisions[0];
      if (!approvedRevision) {
        throw new Error("Cannot issue quotation: Estimate does not have an approved baseline revision");
      }

      // 2. Sequential Quotation Number Generation
      const count = await tx.quotation.count({ where: { organizationId: session.organizationId } });
      const currentYear = new Date().getFullYear();
      const quotationNumber = `QUOT-${currentYear}-${String(count + 1).padStart(4, "0")}`;

      // 3. Decimal calculation of discount and final grand total
      const subtotal = approvedRevision.sellingPricePreTax;
      const taxRate = approvedRevision.taxPercentage;
      const taxAmount = approvedRevision.taxAmount;
      const discount = new Decimal(input.discountAmount || 0);

      const finalGrandTotal = subtotal
        .plus(taxAmount)
        .minus(discount)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      if (finalGrandTotal.isNegative()) {
        throw new Error("Discount amount cannot exceed total quotation value");
      }

      const quotation = await tx.quotation.create({
        data: {
          organizationId: session.organizationId,
          quotationNumber,
          estimateId: estimate.id,
          leadId: estimate.leadId,
          customerId: estimate.customerId,
          createdById: session.userId,
          currentVersion: 1,
          status: QuotationStatus.DRAFT,
          validUntil: new Date(input.validUntil),
          paymentTerms: input.paymentTerms,
          inclusions: input.inclusions,
          exclusions: input.exclusions,
        },
      });

      const quotationRevision = await tx.quotationRevision.create({
        data: {
          organizationId: session.organizationId,
          quotationId: quotation.id,
          estimateRevisionId: approvedRevision.id,
          versionNumber: 1,
          status: QuotationStatus.DRAFT,
          createdById: session.userId,
          subtotalAmount: subtotal,
          taxPercentage: taxRate,
          taxAmount: taxAmount,
          discountAmount: discount,
          finalGrandTotal,
          notes: input.notes,
        },
      });

      await logAuditEvent(
        {
          organizationId: session.organizationId,
          userId: session.userId,
          action: "CREATE",
          entityType: "Quotation",
          entityId: quotation.id,
          metadata: { quotationNumber, finalGrandTotal: finalGrandTotal.toString() },
        },
        tx
      );

      return { quotation, revision: quotationRevision };
    });
  }

  static async updateQuotationStatus(
    session: SessionPayload,
    quotationId: string,
    rawInput: UpdateQuotationStatusInput
  ) {
    assertTenantAccess(session, session.organizationId);
    assertPermission(session, PERMISSIONS.QUOTES_APPROVE);

    const input = UpdateQuotationStatusSchema.parse(rawInput);

    return prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.findFirst({
        where: { id: quotationId, organizationId: session.organizationId },
        include: { revisions: { orderBy: { versionNumber: "desc" }, take: 1 } },
      });

      if (!quotation) throw new Error("Quotation not found or access denied");

      if (input.status === QuotationStatus.REJECTED && (!input.rejectionReason || input.rejectionReason.trim().length === 0)) {
        throw new Error("Rejection reason is mandatory when marking a quotation as REJECTED");
      }

      const latestRev = quotation.revisions[0];

      // Update Quotation and its active revision
      const updatedQuotation = await tx.quotation.update({
        where: { id: quotationId },
        data: { status: input.status },
      });

      if (latestRev) {
        await tx.quotationRevision.update({
          where: { id: latestRev.id },
          data: {
            status: input.status,
            issuedAt: input.status === QuotationStatus.ISSUED ? new Date() : latestRev.issuedAt,
            acceptedAt: input.status === QuotationStatus.ACCEPTED ? new Date() : latestRev.acceptedAt,
            rejectionReason: input.status === QuotationStatus.REJECTED ? input.rejectionReason : null,
          },
        });
      }

      // If quotation is ISSUED, transition Lead to QUOTATION_SENT
      if (input.status === QuotationStatus.ISSUED && quotation.leadId) {
        await tx.lead.update({
          where: { id: quotation.leadId },
          data: { status: "QUOTATION_SENT" },
        });
      }

      // If quotation is ACCEPTED, transition Lead to NEGOTIATION / WON
      if (input.status === QuotationStatus.ACCEPTED && quotation.leadId) {
        await tx.lead.update({
          where: { id: quotation.leadId },
          data: { status: "NEGOTIATION" },
        });
      }

      await logAuditEvent(
        {
          organizationId: session.organizationId,
          userId: session.userId,
          action: input.status === QuotationStatus.ACCEPTED ? "ACCEPT" : input.status === QuotationStatus.ISSUED ? "SEND" : "UPDATE",
          entityType: "Quotation",
          entityId: quotation.id,
          metadata: { status: input.status, rejectionReason: input.rejectionReason },
        },
        tx
      );

      return updatedQuotation;
    });
  }

  static async getQuotationById(session: SessionPayload, quotationId: string) {
    assertTenantAccess(session, session.organizationId);
    assertPermission(session, PERMISSIONS.QUOTES_READ);

    return prisma.quotation.findFirst({
      where: { id: quotationId, organizationId: session.organizationId },
      include: {
        estimate: true,
        lead: { select: { id: true, title: true, contactName: true, siteAddress: true } },
        customer: { select: { id: true, name: true, companyName: true, email: true, phone: true } },
        createdBy: { select: { id: true, fullName: true, email: true } },
        revisions: {
          orderBy: { versionNumber: "desc" },
          include: {
            estimateRevision: {
              include: { items: { orderBy: { sortOrder: "asc" } } },
            },
            createdBy: { select: { id: true, fullName: true } },
          },
        },
      },
    });
  }

  static async listQuotations(
    session: SessionPayload,
    params: { leadId?: string; customerId?: string; search?: string } = {}
  ) {
    assertTenantAccess(session, session.organizationId);
    assertPermission(session, PERMISSIONS.QUOTES_READ);

    return prisma.quotation.findMany({
      where: {
        organizationId: session.organizationId,
        ...(params.leadId ? { leadId: params.leadId } : {}),
        ...(params.customerId ? { customerId: params.customerId } : {}),
        ...(params.search
          ? {
              OR: [
                { quotationNumber: { contains: params.search, mode: "insensitive" } },
                { inclusions: { contains: params.search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        lead: { select: { id: true, title: true } },
        customer: { select: { id: true, name: true } },
        revisions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
          select: { subtotalAmount: true, taxAmount: true, discountAmount: true, finalGrandTotal: true, status: true },
        },
      },
    });
  }
}

