import { prisma } from "../lib/db";
import { SessionPayload } from "../lib/auth";
import { assertPermission, assertTenantAccess, PERMISSIONS } from "../lib/permissions";
import { logAuditEvent } from "../lib/audit";
import { CurrencyMath } from "../lib/decimal";
import { EstimateStatus, Prisma } from "@prisma/client";
import Decimal from "decimal.js";
import {
  CreateEstimateSchema,
  CreateEstimateInput,
  CreateRevisionSchema,
  CreateRevisionInput,
  BoqItemInput,
} from "./estimation.types";

export class EstimationService {
  /**
   * Calculates all financial metrics for a set of BOQ items using decimal-safe arithmetic.
   */
  private static calculateRevisionFinancials(
    items: BoqItemInput[],
    markupPercentage: number,
    taxPercentage: number
  ) {
    const markupMultiplier = new Decimal(1).plus(new Decimal(markupPercentage).dividedBy(100));
    const taxMultiplier = new Decimal(taxPercentage).dividedBy(100);

    let totalCostAcc = new Decimal(0);
    let totalSellingAcc = new Decimal(0);

    const calculatedItems = items.map((item, idx) => {
      const qty = new Decimal(item.quantity);
      const mat = new Decimal(item.materialRate || 0);
      const lab = new Decimal(item.labourRate || 0);
      const eqp = new Decimal(item.equipmentRate || 0);
      const sub = new Decimal(item.subcontractRate || 0);

      const unitCostRate = mat.plus(lab).plus(eqp).plus(sub);
      const totalCost = qty.times(unitCostRate);

      const sellingRate = unitCostRate.times(markupMultiplier);
      const totalSellingPrice = qty.times(sellingRate);

      totalCostAcc = totalCostAcc.plus(totalCost);
      totalSellingAcc = totalSellingAcc.plus(totalSellingPrice);

      return {
        itemCode: item.itemCode,
        category: item.category,
        description: item.description,
        unit: item.unit,
        quantity: qty,
        materialRate: mat,
        labourRate: lab,
        equipmentRate: eqp,
        subcontractRate: sub,
        unitCostRate: unitCostRate.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
        totalCost: totalCost.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
        sellingRate: sellingRate.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
        totalSellingPrice: totalSellingPrice.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
        sortOrder: item.sortOrder ?? idx,
      };
    });

    const sellingPricePreTax = totalSellingAcc.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const taxAmount = sellingPricePreTax.times(taxMultiplier).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const totalAmount = sellingPricePreTax.plus(taxAmount);

    // Margin % = (Selling - Cost) / Selling * 100
    const profit = sellingPricePreTax.minus(totalCostAcc);
    const estimatedMargin = sellingPricePreTax.isZero()
      ? new Decimal(0)
      : profit.dividedBy(sellingPricePreTax).times(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    return {
      calculatedItems,
      totalCost: totalCostAcc.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
      sellingPricePreTax,
      taxAmount,
      totalAmount,
      estimatedMargin,
      markupPercentage: new Decimal(markupPercentage).toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
      taxPercentage: new Decimal(taxPercentage).toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
    };
  }

  static async createEstimate(session: SessionPayload, rawInput: CreateEstimateInput) {
    assertTenantAccess(session, session.organizationId);
    assertPermission(session, PERMISSIONS.ESTIMATES_WRITE);

    const input = CreateEstimateSchema.parse(rawInput);

    if (input.leadId) {
      const lead = await prisma.lead.findFirst({
        where: { id: input.leadId, organizationId: session.organizationId },
      });
      if (!lead) throw new Error("Specified lead not found in this organization");
    }

    if (input.customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: input.customerId, organizationId: session.organizationId },
      });
      if (!customer) throw new Error("Specified customer not found in this organization");
    }

    const financials = this.calculateRevisionFinancials(
      input.items,
      input.markupPercentage,
      input.taxPercentage
    );

    return prisma.$transaction(async (tx) => {
      // Generate sequential Estimate Number
      const count = await tx.estimate.count({ where: { organizationId: session.organizationId } });
      const currentYear = new Date().getFullYear();
      const estimateNumber = `EST-${currentYear}-${String(count + 1).padStart(4, "0")}`;

      const estimate = await tx.estimate.create({
        data: {
          organizationId: session.organizationId,
          estimateNumber,
          title: input.title,
          leadId: input.leadId,
          customerId: input.customerId,
          createdById: session.userId,
          currentVersion: 1,
          status: EstimateStatus.DRAFT,
          notes: input.notes,
        },
      });

      const revision = await tx.estimateRevision.create({
        data: {
          organizationId: session.organizationId,
          estimateId: estimate.id,
          versionNumber: 1,
          status: EstimateStatus.DRAFT,
          createdById: session.userId,
          totalCost: financials.totalCost,
          markupPercentage: financials.markupPercentage,
          sellingPricePreTax: financials.sellingPricePreTax,
          taxPercentage: financials.taxPercentage,
          taxAmount: financials.taxAmount,
          totalAmount: financials.totalAmount,
          estimatedMargin: financials.estimatedMargin,
          notes: input.notes,
          items: {
            create: financials.calculatedItems.map((item) => ({
              organizationId: session.organizationId,
              itemCode: item.itemCode,
              category: item.category,
              description: item.description,
              unit: item.unit,
              quantity: item.quantity,
              materialRate: item.materialRate,
              labourRate: item.labourRate,
              equipmentRate: item.equipmentRate,
              subcontractRate: item.subcontractRate,
              unitCostRate: item.unitCostRate,
              totalCost: item.totalCost,
              sellingRate: item.sellingRate,
              totalSellingPrice: item.totalSellingPrice,
              sortOrder: item.sortOrder,
            })),
          },
        },
        include: { items: true },
      });

      // Advance lead status to ESTIMATION if linked
      if (input.leadId) {
        await tx.lead.update({
          where: { id: input.leadId },
          data: { status: "ESTIMATION" },
        });
      }

      await logAuditEvent(
        {
          organizationId: session.organizationId,
          userId: session.userId,
          action: "CREATE",
          entityType: "Estimate",
          entityId: estimate.id,
          metadata: { estimateNumber, totalAmount: financials.totalAmount.toString() },
        },
        tx
      );

      return { estimate, revision };
    });
  }

  static async createNewRevision(
    session: SessionPayload,
    estimateId: string,
    rawInput: CreateRevisionInput
  ) {
    assertTenantAccess(session, session.organizationId);
    assertPermission(session, PERMISSIONS.ESTIMATES_WRITE);

    const input = CreateRevisionSchema.parse(rawInput);

    return prisma.$transaction(async (tx) => {
      const estimate = await tx.estimate.findFirst({
        where: { id: estimateId, organizationId: session.organizationId },
        include: { revisions: { orderBy: { versionNumber: "desc" }, take: 1 } },
      });

      if (!estimate) throw new Error("Estimate not found or access denied");

      const nextVersionNumber = estimate.currentVersion + 1;
      const financials = this.calculateRevisionFinancials(
        input.items,
        input.markupPercentage,
        input.taxPercentage
      );

      // Create new revision preserving prior revision snapshot
      const newRevision = await tx.estimateRevision.create({
        data: {
          organizationId: session.organizationId,
          estimateId: estimate.id,
          versionNumber: nextVersionNumber,
          status: EstimateStatus.DRAFT,
          createdById: session.userId,
          totalCost: financials.totalCost,
          markupPercentage: financials.markupPercentage,
          sellingPricePreTax: financials.sellingPricePreTax,
          taxPercentage: financials.taxPercentage,
          taxAmount: financials.taxAmount,
          totalAmount: financials.totalAmount,
          estimatedMargin: financials.estimatedMargin,
          notes: input.notes,
          items: {
            create: financials.calculatedItems.map((item) => ({
              organizationId: session.organizationId,
              itemCode: item.itemCode,
              category: item.category,
              description: item.description,
              unit: item.unit,
              quantity: item.quantity,
              materialRate: item.materialRate,
              labourRate: item.labourRate,
              equipmentRate: item.equipmentRate,
              subcontractRate: item.subcontractRate,
              unitCostRate: item.unitCostRate,
              totalCost: item.totalCost,
              sellingRate: item.sellingRate,
              totalSellingPrice: item.totalSellingPrice,
              sortOrder: item.sortOrder,
            })),
          },
        },
        include: { items: true },
      });

      // Update estimate pointer to new version
      await tx.estimate.update({
        where: { id: estimateId },
        data: { currentVersion: nextVersionNumber },
      });

      await logAuditEvent(
        {
          organizationId: session.organizationId,
          userId: session.userId,
          action: "UPDATE",
          entityType: "Estimate",
          entityId: estimate.id,
          metadata: { versionNumber: nextVersionNumber, totalAmount: financials.totalAmount.toString() },
        },
        tx
      );

      return newRevision;
    });
  }

  static async approveRevision(session: SessionPayload, estimateId: string, revisionId: string) {
    assertTenantAccess(session, session.organizationId);
    assertPermission(session, PERMISSIONS.QUOTES_APPROVE);

    return prisma.$transaction(async (tx) => {
      const revision = await tx.estimateRevision.findFirst({
        where: { id: revisionId, estimateId, organizationId: session.organizationId },
      });

      if (!revision) throw new Error("Revision not found or access denied");

      // Mark previously approved revisions as SUPERSEDED
      await tx.estimateRevision.updateMany({
        where: { estimateId, status: EstimateStatus.APPROVED },
        data: { status: EstimateStatus.SUPERSEDED },
      });

      const approvedRevision = await tx.estimateRevision.update({
        where: { id: revisionId },
        data: {
          status: EstimateStatus.APPROVED,
          approvedAt: new Date(),
        },
      });

      await tx.estimate.update({
        where: { id: estimateId },
        data: { status: EstimateStatus.APPROVED },
      });

      await logAuditEvent(
        {
          organizationId: session.organizationId,
          userId: session.userId,
          action: "APPROVE",
          entityType: "EstimateRevision",
          entityId: revisionId,
          metadata: { estimateId, versionNumber: revision.versionNumber },
        },
        tx
      );

      return approvedRevision;
    });
  }

  static async getEstimateById(session: SessionPayload, estimateId: string) {
    assertTenantAccess(session, session.organizationId);
    assertPermission(session, PERMISSIONS.ESTIMATES_READ);

    return prisma.estimate.findFirst({
      where: { id: estimateId, organizationId: session.organizationId },
      include: {
        lead: { select: { id: true, title: true, contactName: true, siteAddress: true } },
        customer: { select: { id: true, name: true, companyName: true } },
        createdBy: { select: { id: true, fullName: true, email: true } },
        revisions: {
          orderBy: { versionNumber: "desc" },
          include: {
            items: { orderBy: { sortOrder: "asc" } },
            createdBy: { select: { id: true, fullName: true } },
          },
        },
      },
    });
  }

  static async listEstimates(
    session: SessionPayload,
    params: { leadId?: string; customerId?: string; search?: string } = {}
  ) {
    assertTenantAccess(session, session.organizationId);
    assertPermission(session, PERMISSIONS.ESTIMATES_READ);

    return prisma.estimate.findMany({
      where: {
        organizationId: session.organizationId,
        ...(params.leadId ? { leadId: params.leadId } : {}),
        ...(params.customerId ? { customerId: params.customerId } : {}),
        ...(params.search
          ? {
              OR: [
                { title: { contains: params.search, mode: "insensitive" } },
                { estimateNumber: { contains: params.search, mode: "insensitive" } },
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
          select: { totalCost: true, sellingPricePreTax: true, totalAmount: true, status: true },
        },
      },
    });
  }
}
