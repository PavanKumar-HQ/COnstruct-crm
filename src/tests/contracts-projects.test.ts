import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "../lib/db";
import { ContractService } from "../services/contract.service";
import { QuotationService } from "../services/quotation.service";
import { EstimationService } from "../services/estimation.service";
import { LeadService } from "../services/lead.service";
import { CustomerService } from "../services/customer.service";
import { SessionPayload } from "../lib/auth";
import Decimal from "decimal.js";

describe("Vertical Slice: Contracts -> Change Orders -> Project Creation", () => {
  let sessionOrgA: SessionPayload;
  let sessionOrgB: SessionPayload;
  let customerA: any;
  let quotationA: any;

  beforeEach(async () => {
    // 1. Setup isolated test organizations
    const orgA = await prisma.organization.create({
      data: { name: "Apex Commercial Builders", slug: `apex-${Date.now()}` },
    });
    const orgB = await prisma.organization.create({
      data: { name: "Competitor Infra Ltd", slug: `competitor-${Date.now()}` },
    });

    const userA = await prisma.user.create({
      data: { email: `admin-${Date.now()}@apex.test`, passwordHash: "hash", fullName: "Vikram MD" },
    });
    const userB = await prisma.user.create({
      data: { email: `admin-${Date.now()}@competitor.test`, passwordHash: "hash", fullName: "Rajesh Comp" },
    });

    const roleA = await prisma.role.create({
      data: { organizationId: orgA.id, name: "Admin", code: "ORG_ADMIN", permissions: ["*"] },
    });
    const roleB = await prisma.role.create({
      data: { organizationId: orgB.id, name: "Admin", code: "ORG_ADMIN", permissions: ["*"] },
    });

    await prisma.membership.createMany({
      data: [
        { organizationId: orgA.id, userId: userA.id, roleId: roleA.id },
        { organizationId: orgB.id, userId: userB.id, roleId: roleB.id },
      ],
    });

    sessionOrgA = {
      userId: userA.id,
      organizationId: orgA.id,
      roleId: roleA.id,
      roleCode: "ORG_ADMIN",
      email: userA.email,
      permissions: ["*"],
    };
    sessionOrgB = {
      userId: userB.id,
      organizationId: orgB.id,
      roleId: roleB.id,
      roleCode: "ORG_ADMIN",
      email: userB.email,
      permissions: ["*"],
    };

    // 2. Setup verified customer, lead, BOQ estimate, and quotation in Org A
    customerA = await CustomerService.createCustomer(sessionOrgA, {
      name: "Prestige Estates Ltd",
      customerType: "COMPANY",
      email: "procurement@prestige.test",
    });

    const leadA = await LeadService.createLead(sessionOrgA, {
      title: "Prestige Cyber Tower Substructure",
      source: "Direct Referral",
      customerId: customerA.id,
      estimatedBudget: 50000000,
    });

    // Create estimate with BOQ items
    const { estimate, revision } = await EstimationService.createEstimate(sessionOrgA, {
      leadId: leadA.id,
      customerId: customerA.id,
      title: "BOQ Baseline Substructure",
      markupPercentage: 15,
      taxPercentage: 18,
      items: [
        {
          itemCode: "EXC-01",
          category: "EXCAVATION",
          description: "Earthwork excavation in hard rock",
          unit: "cu.m",
          quantity: 1000,
          materialRate: 0,
          labourRate: 250,
          equipmentRate: 350,
          subcontractRate: 0,
        },
      ],
    });

    // Approve the estimate revision to make it an official baseline
    await EstimationService.approveRevision(sessionOrgA, estimate.id, revision.id);

    // Create Formal Quotation
    const quotResult = await QuotationService.createQuotationFromEstimate(sessionOrgA, {
      estimateId: estimate.id,
      discountAmount: 0,
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
      paymentTerms: "10% Advance, 85% Progressive, 5% Retention",
      inclusions: "Tower crane staging, testing cubes",
    });
    quotationA = quotResult.quotation;
  });

  it("Step 1: Creates executed contract preserving frozen baseline from quotation", async () => {
    const contract = await ContractService.createContractFromQuotation(sessionOrgA, {
      quotationId: quotationA.id,
      title: "Prime EPC Contract - Prestige Cyber Tower",
      retentionPercentage: 5,
      advancePercentage: 10,
    });

    expect(contract.id).toBeDefined();
    expect(contract.contractNumber).toMatch(/^CTR-\d{4}-\d{4}$/);
    expect(contract.status).toBe("EXECUTED");
    expect(new Decimal(contract.totalContractValue).toNumber()).toBeGreaterThan(0);
    expect(contract.revisedContractValue.toString()).toBe(contract.totalContractValue.toString());

    // Verify linked quotation status transitioned to ACCEPTED
    const updatedQuot = await prisma.quotation.findUnique({ where: { id: quotationA.id } });
    expect(updatedQuot?.status).toBe("ACCEPTED");
  });

  it("Step 2: Prevents duplicate contract generation from the same quotation", async () => {
    await ContractService.createContractFromQuotation(sessionOrgA, {
      quotationId: quotationA.id,
      title: "First Contract Attempt",
      retentionPercentage: 5,
      advancePercentage: 10,
    });

    await expect(
      ContractService.createContractFromQuotation(sessionOrgA, {
        quotationId: quotationA.id,
        title: "Duplicate Contract Attempt",
        retentionPercentage: 5,
        advancePercentage: 10,
      })
    ).rejects.toThrow(/already been generated/);
  });

  it("Step 3: Manages Change Orders - preserves revised value until formal approval", async () => {
    const contract = await ContractService.createContractFromQuotation(sessionOrgA, {
      quotationId: quotationA.id,
      title: "Contract with Variations",
      retentionPercentage: 5,
      advancePercentage: 10,
    });

    const initialTotal = new Decimal(contract.totalContractValue);

    // Create Change Order 1 (e.g. +₹250,000 for unexpected dewatering)
    const co = await ContractService.createChangeOrder(sessionOrgA, {
      contractId: contract.id,
      title: "CO-01 Additional Deep Dewatering",
      description: "Continuous wellpoint pumping due to high subterranean water table",
      amount: 250000,
      taxAmount: 45000, // 18% GST
      timeExtensionDays: 14,
    });

    expect(co.status).toBe("SUBMITTED");
    expect(co.changeOrderNumber).toBe("CO-001");

    // Verify contract revised value remains UNCHANGED prior to approval
    const midContract = await ContractService.getContractById(sessionOrgA, contract.id);
    expect(midContract.revisedContractValue.toString()).toBe(initialTotal.toString());

    // Formally approve Change Order
    const { contract: approvedContract } = await ContractService.approveChangeOrder(sessionOrgA, co.id);
    const expectedRevised = initialTotal.plus(295000); // 250000 + 45000
    expect(new Decimal(approvedContract.revisedContractValue).toString()).toBe(expectedRevised.toString());
    expect(approvedContract.status).toBe("AMENDED");
  });

  it("Step 4: Creates Project with Work Packages & Milestones, preventing duplicate projects", async () => {
    const contract = await ContractService.createContractFromQuotation(sessionOrgA, {
      quotationId: quotationA.id,
      title: "Contract For Project Execution",
      retentionPercentage: 5,
      advancePercentage: 10,
    });

    const project = await ContractService.createProjectFromContract(sessionOrgA, {
      contractId: contract.id,
      name: "Prestige Cyber Tower Construction Project",
      siteAddress: "Bellandur Tech Zone, Bangalore",
    });

    expect(project.id).toBeDefined();
    expect(project.projectCode).toMatch(/^PRJ-\d{4}-\d{4}$/);
    expect(project.status).toBe("MOBILISATION");
    expect(project.budgetContractValue.toString()).toBe(contract.revisedContractValue.toString());

    // Verify Work Packages auto-seeded
    const wpList = await prisma.workPackage.findMany({ where: { projectId: project.id } });
    expect(wpList.length).toBe(3);
    expect(wpList.map((w) => w.code)).toContain("WP-SUBSTRUCTURE");

    // Verify Milestones auto-seeded
    const milestones = await prisma.projectMilestone.findMany({ where: { projectId: project.id } });
    expect(milestones.length).toBe(4);

    // Verify prevention of duplicate project creation
    await expect(
      ContractService.createProjectFromContract(sessionOrgA, {
        contractId: contract.id,
        name: "Second Project Attempt",
      })
    ).rejects.toThrow(/already exists for this contract/);
  });

  it("Step 5: Enforces strict organization isolation across contracts and projects", async () => {
    const contractA = await ContractService.createContractFromQuotation(sessionOrgA, {
      quotationId: quotationA.id,
      title: "Org A Secret Contract",
      retentionPercentage: 5,
      advancePercentage: 10,
    });

    // Org B should get 0 contracts
    const orgBContracts = await ContractService.listContracts(sessionOrgB);
    expect(orgBContracts.length).toBe(0);

    // Org B cannot access Org A's contract
    await expect(ContractService.getContractById(sessionOrgB, contractA.id)).rejects.toThrow(/not found or access denied/);

    // Org B cannot create change orders on Org A's contract
    await expect(
      ContractService.createChangeOrder(sessionOrgB, {
        contractId: contractA.id,
        title: "Malicious Intrusion CO",
        description: "Breach attempt",
        amount: 100000,
        taxAmount: 18000,
        timeExtensionDays: 0,
      })
    ).rejects.toThrow(/not found or tenant access violation/);
  });
});
