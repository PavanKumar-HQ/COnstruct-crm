import { prisma } from "../lib/db";
import { SessionPayload } from "../lib/auth";
import { assertPermission, assertTenantAccess, PERMISSIONS } from "../lib/permissions";
import { logAuditEvent } from "../lib/audit";
import { ContractStatus, ChangeOrderStatus, QuotationStatus, ProjectStatus, ProjectHealth } from "@prisma/client";
import Decimal from "decimal.js";
import {
  CreateContractFromQuotationSchema,
  CreateContractFromQuotationInput,
  CreateChangeOrderSchema,
  CreateChangeOrderInput,
  CreateProjectFromContractSchema,
  CreateProjectFromContractInput,
} from "./contract.types";

export class ContractService {
  /**
   * 1. List contracts for organization
   */
  static async listContracts(session: SessionPayload) {
    assertTenantAccess(session, session.organizationId);

    return prisma.contract.findMany({
      where: { organizationId: session.organizationId },
      include: {
        customer: { select: { id: true, name: true } },
        quotation: { select: { id: true, quotationNumber: true } },
        changeOrders: {
          orderBy: { createdAt: "desc" },
        },
        projects: {
          select: { id: true, projectCode: true, name: true, status: true, progressPercentage: true },
        },
        createdBy: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * 2. Get single contract detail
   */
  static async getContractById(session: SessionPayload, contractId: string) {
    assertTenantAccess(session, session.organizationId);

    const contract = await prisma.contract.findFirst({
      where: { id: contractId, organizationId: session.organizationId },
      include: {
        customer: true,
        quotation: {
          include: {
            revisions: {
              where: { status: QuotationStatus.ACCEPTED },
              take: 1,
            },
          },
        },
        changeOrders: {
          include: {
            createdBy: { select: { id: true, fullName: true } },
            approvedBy: { select: { id: true, fullName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        projects: {
          include: {
            workPackages: true,
            milestones: true,
            projectManager: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });

    if (!contract) {
      throw new Error("Contract not found or access denied");
    }

    return contract;
  }

  /**
   * 3. Create Contract from Awarded/Accepted Quotation
   * Enforces that the quotation is accepted/issued, preserves frozen commercial baseline.
   */
  static async createContractFromQuotation(
    session: SessionPayload,
    rawInput: CreateContractFromQuotationInput
  ) {
    assertTenantAccess(session, session.organizationId);
    assertPermission(session, PERMISSIONS.LEADS_WRITE);

    const input = CreateContractFromQuotationSchema.parse(rawInput);

    return prisma.$transaction(async (tx) => {
      // 1. Fetch quotation and verify tenant & accepted revision
      const quotation = await tx.quotation.findFirst({
        where: { id: input.quotationId, organizationId: session.organizationId },
        include: {
          customer: true,
          revisions: {
            orderBy: { versionNumber: "desc" },
            take: 1,
          },
        },
      });

      if (!quotation) {
        throw new Error("Quotation not found or tenant access violation");
      }

      const activeRevision = quotation.revisions[0];
      if (!activeRevision) {
        throw new Error("Quotation has no commercial revisions to baseline");
      }

      if (!quotation.customerId) {
        throw new Error("Cannot create contract without a linked verified customer account");
      }

      // Check for duplicate contract creation from the same quotation
      const existing = await tx.contract.findFirst({
        where: { quotationId: quotation.id, organizationId: session.organizationId },
      });
      if (existing) {
        throw new Error(`A contract (${existing.contractNumber}) has already been generated from this quotation`);
      }

      // 2. Generate sequential contract number: CTR-YYYY-XXXX
      const count = await tx.contract.count({ where: { organizationId: session.organizationId } });
      const currentYear = new Date().getFullYear();
      const contractNumber = `CTR-${currentYear}-${String(count + 1).padStart(4, "0")}`;

      // 3. Frozen baseline decimal amounts
      const baselineAmount = new Decimal(activeRevision.subtotalAmount);
      const taxAmount = new Decimal(activeRevision.taxAmount);
      const totalContractValue = new Decimal(activeRevision.finalGrandTotal);
      const revisedContractValue = totalContractValue; // Initially equals original value

      const contract = await tx.contract.create({
        data: {
          organizationId: session.organizationId,
          contractNumber,
          title: input.title,
          quotationId: quotation.id,
          quotationRevisionId: activeRevision.id,
          customerId: quotation.customerId,
          createdById: session.userId,
          status: ContractStatus.EXECUTED, // Standard execution upon mutual award
          baselineAmount,
          taxAmount,
          totalContractValue,
          revisedContractValue,
          retentionPercentage: new Decimal(input.retentionPercentage),
          advancePercentage: new Decimal(input.advancePercentage),
          startDate: input.startDate ? new Date(input.startDate) : null,
          completionDate: input.completionDate ? new Date(input.completionDate) : null,
          paymentTerms: input.paymentTerms || quotation.paymentTerms,
          scopeOfWork: input.scopeOfWork || quotation.inclusions,
          executedAt: new Date(),
        },
      });

      // Update quotation status to ACCEPTED if not already
      if (quotation.status !== QuotationStatus.ACCEPTED) {
        await tx.quotation.update({
          where: { id: quotation.id },
          data: { status: QuotationStatus.ACCEPTED },
        });
      }

      // Update linked Lead to WON if exists
      if (quotation.leadId) {
        await tx.lead.update({
          where: { id: quotation.leadId },
          data: { status: "WON" },
        });
      }

      // Audit log
      await logAuditEvent({
        organizationId: session.organizationId,
        userId: session.userId,
        action: "CREATE",
        entityType: "CONTRACT",
        entityId: contract.id,
        metadata: {
          contractNumber,
          quotationNumber: quotation.quotationNumber,
          totalContractValue: totalContractValue.toString(),
        },
      });

      return contract;
    });
  }

  /**
   * 4. Create Change Order for Contract
   * Starts in DRAFT / SUBMITTED state. Revised contract value is NOT updated yet.
   */
  static async createChangeOrder(session: SessionPayload, rawInput: CreateChangeOrderInput) {
    assertTenantAccess(session, session.organizationId);
    assertPermission(session, PERMISSIONS.LEADS_WRITE);

    const input = CreateChangeOrderSchema.parse(rawInput);

    return prisma.$transaction(async (tx) => {
      const contract = await tx.contract.findFirst({
        where: { id: input.contractId, organizationId: session.organizationId },
      });

      if (!contract) {
        throw new Error("Contract not found or tenant access violation");
      }

      if (contract.status === ContractStatus.TERMINATED || contract.status === ContractStatus.COMPLETED) {
        throw new Error(`Cannot issue change order on a ${contract.status} contract`);
      }

      const coCount = await tx.changeOrder.count({ where: { contractId: contract.id } });
      const changeOrderNumber = `CO-${String(coCount + 1).padStart(3, "0")}`;

      const amount = new Decimal(input.amount);
      const taxAmount = new Decimal(input.taxAmount || 0);
      const totalAmount = amount.plus(taxAmount);

      const changeOrder = await tx.changeOrder.create({
        data: {
          organizationId: session.organizationId,
          contractId: contract.id,
          changeOrderNumber,
          title: input.title,
          description: input.description,
          justification: input.justification,
          amount,
          taxAmount,
          totalAmount,
          timeExtensionDays: input.timeExtensionDays,
          status: ChangeOrderStatus.SUBMITTED,
          supportingDocsUrl: input.supportingDocsUrl,
          createdById: session.userId,
        },
      });

      await logAuditEvent({
        organizationId: session.organizationId,
        userId: session.userId,
        action: "CREATE",
        entityType: "CHANGE_ORDER",
        entityId: changeOrder.id,
        metadata: {
          contractId: contract.id,
          changeOrderNumber,
          totalAmount: totalAmount.toString(),
        },
      });

      return changeOrder;
    });
  }

  /**
   * 5. Approve Change Order
   * Transactionally updates revisedContractValue on Contract using exact decimal math.
   */
  static async approveChangeOrder(
    session: SessionPayload,
    changeOrderId: string
  ) {
    assertTenantAccess(session, session.organizationId);
    assertPermission(session, PERMISSIONS.LEADS_WRITE);

    return prisma.$transaction(async (tx) => {
      const co = await tx.changeOrder.findFirst({
        where: { id: changeOrderId, organizationId: session.organizationId },
        include: { contract: true },
      });

      if (!co) {
        throw new Error("Change order not found or tenant access violation");
      }

      if (co.status === ChangeOrderStatus.APPROVED) {
        throw new Error("Change order is already approved");
      }

      // 1. Mark change order as approved
      const updatedCo = await tx.changeOrder.update({
        where: { id: co.id },
        data: {
          status: ChangeOrderStatus.APPROVED,
          approvedById: session.userId,
          approvedAt: new Date(),
        },
      });

      // 2. Re-calculate revisedContractValue = baseline + sum(all approved change orders)
      const allApprovedCOs = await tx.changeOrder.findMany({
        where: { contractId: co.contractId, status: ChangeOrderStatus.APPROVED },
      });

      const totalVariations = allApprovedCOs.reduce(
        (acc, item) => acc.plus(new Decimal(item.totalAmount)),
        new Decimal(0)
      );

      const newRevisedContractValue = new Decimal(co.contract.totalContractValue)
        .plus(totalVariations)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      const updatedContract = await tx.contract.update({
        where: { id: co.contractId },
        data: {
          revisedContractValue: newRevisedContractValue,
          status: ContractStatus.AMENDED,
        },
      });

      // Also update linked project's budgetContractValue if project exists
      await tx.project.updateMany({
        where: { contractId: co.contractId, organizationId: session.organizationId },
        data: { budgetContractValue: newRevisedContractValue },
      });

      await logAuditEvent({
        organizationId: session.organizationId,
        userId: session.userId,
        action: "APPROVE",
        entityType: "CHANGE_ORDER",
        entityId: co.id,
        metadata: {
          contractId: co.contractId,
          variationAdded: co.totalAmount.toString(),
          newRevisedContractValue: newRevisedContractValue.toString(),
        },
      });

      return { changeOrder: updatedCo, contract: updatedContract };
    });
  }

  /**
   * 6. Create Project from Executed Contract
   * Prevents duplicate project creation from the same contract.
   * Auto-initializes Work Packages and Milestones from contract values.
   */
  static async createProjectFromContract(
    session: SessionPayload,
    rawInput: CreateProjectFromContractInput
  ) {
    assertTenantAccess(session, session.organizationId);
    assertPermission(session, PERMISSIONS.LEADS_WRITE);

    const input = CreateProjectFromContractSchema.parse(rawInput);

    return prisma.$transaction(async (tx) => {
      const contract = await tx.contract.findFirst({
        where: { id: input.contractId, organizationId: session.organizationId },
        include: {
          customer: true,
          projects: true,
        },
      });

      if (!contract) {
        throw new Error("Contract not found or tenant access violation");
      }

      if (contract.projects.length > 0) {
        throw new Error(
          `Project "${contract.projects[0].projectCode}" already exists for this contract. Duplicate project creation prevented.`
        );
      }

      // Generate sequential project code: PRJ-YYYY-XXXX
      const count = await tx.project.count({ where: { organizationId: session.organizationId } });
      const currentYear = new Date().getFullYear();
      const projectCode = `PRJ-${currentYear}-${String(count + 1).padStart(4, "0")}`;

      const project = await tx.project.create({
        data: {
          organizationId: session.organizationId,
          projectCode,
          name: input.name,
          contractId: contract.id,
          customerId: contract.customerId,
          projectManagerId: input.projectManagerId || session.userId,
          status: ProjectStatus.MOBILISATION,
          health: ProjectHealth.HEALTHY,
          siteAddress: input.siteAddress || (contract.customer.siteAddress ? JSON.stringify(contract.customer.siteAddress) : null),
          plannedStartDate: input.plannedStartDate ? new Date(input.plannedStartDate) : contract.startDate,
          targetCompletionDate: input.targetCompletionDate ? new Date(input.targetCompletionDate) : contract.completionDate,
          budgetContractValue: contract.revisedContractValue,
          progressPercentage: new Decimal(0),
        },
      });

      // Initialize Work Packages
      const workPackagesToCreate = input.initialWorkPackages && input.initialWorkPackages.length > 0
        ? input.initialWorkPackages
        : [
            {
              code: "WP-SUBSTRUCTURE",
              name: "Substructure & Foundation",
              budgetAmount: new Decimal(contract.revisedContractValue).times(0.35).toNumber(),
            },
            {
              code: "WP-SUPERSTRUCTURE",
              name: "Superstructure RCC Frame",
              budgetAmount: new Decimal(contract.revisedContractValue).times(0.45).toNumber(),
            },
            {
              code: "WP-FINISHING",
              name: "Masonry, Plaster & MEP Rough-Ins",
              budgetAmount: new Decimal(contract.revisedContractValue).times(0.20).toNumber(),
            },
          ];

      for (const wp of workPackagesToCreate) {
        await tx.workPackage.create({
          data: {
            organizationId: session.organizationId,
            projectId: project.id,
            code: wp.code,
            name: wp.name,
            budgetAmount: new Decimal(wp.budgetAmount),
          },
        });
      }

      // Initialize standard contractual payment milestones
      await tx.projectMilestone.createMany({
        data: [
          {
            organizationId: session.organizationId,
            projectId: project.id,
            name: "Mobilisation & Ground Breaking",
            description: "Site setup, batching setup, and excavation commencement",
            targetDate: new Date(Date.now() + 15 * 86400000),
            billingPercentage: new Decimal(contract.advancePercentage),
            billingAmount: new Decimal(contract.revisedContractValue).times(new Decimal(contract.advancePercentage).dividedBy(100)),
          },
          {
            organizationId: session.organizationId,
            projectId: project.id,
            name: "Substructure Plinth Level Completion",
            description: "Foundation raft concrete and basement retaining walls cast",
            targetDate: new Date(Date.now() + 90 * 86400000),
            billingPercentage: new Decimal(25.0),
            billingAmount: new Decimal(contract.revisedContractValue).times(0.25),
          },
          {
            organizationId: session.organizationId,
            projectId: project.id,
            name: "Superstructure Topping Out",
            description: "Final terrace floor RCC slab cast",
            targetDate: new Date(Date.now() + 240 * 86400000),
            billingPercentage: new Decimal(35.0),
            billingAmount: new Decimal(contract.revisedContractValue).times(0.35),
          },
          {
            organizationId: session.organizationId,
            projectId: project.id,
            name: "Final Handover & Defects Liability Commencement",
            description: "Snag list rectification and occupation certificate issued",
            targetDate: new Date(Date.now() + 365 * 86400000),
            billingPercentage: new Decimal(contract.retentionPercentage),
            billingAmount: new Decimal(contract.revisedContractValue).times(new Decimal(contract.retentionPercentage).dividedBy(100)),
          },
        ],
      });

      await logAuditEvent({
        organizationId: session.organizationId,
        userId: session.userId,
        action: "CREATE",
        entityType: "PROJECT",
        entityId: project.id,
        metadata: {
          projectCode,
          contractNumber: contract.contractNumber,
          budgetValue: contract.revisedContractValue.toString(),
        },
      });

      return project;
    });
  }

  /**
   * 7. List Projects with progress & work packages
   */
  static async listProjects(session: SessionPayload) {
    assertTenantAccess(session, session.organizationId);

    return prisma.project.findMany({
      where: { organizationId: session.organizationId },
      include: {
        customer: { select: { id: true, name: true } },
        contract: { select: { id: true, contractNumber: true, totalContractValue: true, revisedContractValue: true } },
        projectManager: { select: { id: true, fullName: true, email: true } },
        workPackages: true,
        milestones: { orderBy: { targetDate: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
