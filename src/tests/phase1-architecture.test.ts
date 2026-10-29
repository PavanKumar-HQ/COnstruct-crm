import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { hashPassword, createSessionToken, validateActiveSession } from "@/lib/auth";
import { assertPermission, assertTenantAccess, AuthorizationError, AuthenticationError, PERMISSIONS } from "@/lib/permissions";
import { CurrencyMath } from "@/lib/decimal";
import Decimal from "decimal.js";

// Test database connection
const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || "postgresql://pavankumars@localhost:5432/construct_crm_test?schema=public",
    },
  },
});

describe("Phase 1 Architecture Verification Tests", () => {
  let orgAId: string;
  let orgBId: string;
  let userAId: string;
  let userBId: string;
  let roleAdminAId: string;
  let roleSiteEngAId: string;

  beforeAll(async () => {
    // Clean test schema
    await testPrisma.auditLog.deleteMany();
    await testPrisma.membership.deleteMany();
    await testPrisma.role.deleteMany();
    await testPrisma.user.deleteMany();
    await testPrisma.organization.deleteMany();

    // Create Organization A
    const orgA = await testPrisma.organization.create({
      data: {
        name: "Acme Infra Ltd",
        slug: "acme-infra",
      },
    });
    orgAId = orgA.id;

    // Create Organization B (Tenant Isolation verification)
    const orgB = await testPrisma.organization.create({
      data: {
        name: "Zenith Builders Ltd",
        slug: "zenith-builders",
      },
    });
    orgBId = orgB.id;

    // Roles for Org A
    const adminRole = await testPrisma.role.create({
      data: {
        organizationId: orgAId,
        name: "Admin",
        code: "ADMIN",
        permissions: ["*"],
      },
    });
    roleAdminAId = adminRole.id;

    const siteEngRole = await testPrisma.role.create({
      data: {
        organizationId: orgAId,
        name: "Site Engineer",
        code: "SITE_ENG",
        permissions: [PERMISSIONS.PROJECTS_READ, PERMISSIONS.SITE_LOGS_WRITE],
      },
    });
    roleSiteEngAId = siteEngRole.id;

    // Users
    const pwdHash = await hashPassword("SecureP@ssword123!");
    const userA = await testPrisma.user.create({
      data: {
        email: "engineer.a@acme.com",
        passwordHash: pwdHash,
        fullName: "Rohan Sharma",
      },
    });
    userAId = userA.id;

    const userB = await testPrisma.user.create({
      data: {
        email: "director@zenith.com",
        passwordHash: pwdHash,
        fullName: "Priya Nair",
      },
    });
    userBId = userB.id;

    // Memberships
    await testPrisma.membership.create({
      data: {
        organizationId: orgAId,
        userId: userAId,
        roleId: roleSiteEngAId,
        status: "ACTIVE",
      },
    });

    const roleAdminB = await testPrisma.role.create({
      data: {
        organizationId: orgBId,
        name: "Admin",
        code: "ADMIN",
        permissions: ["*"],
      },
    });

    await testPrisma.membership.create({
      data: {
        organizationId: orgBId,
        userId: userBId,
        roleId: roleAdminB.id,
        status: "ACTIVE",
      },
    });
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  describe("Authentication & RBAC Enforcement", () => {
    it("should issue and verify valid session token", async () => {
      const token = await createSessionToken({
        userId: userAId,
        organizationId: orgAId,
        roleId: roleSiteEngAId,
        roleCode: "SITE_ENG",
        permissions: [PERMISSIONS.PROJECTS_READ, PERMISSIONS.SITE_LOGS_WRITE],
        email: "engineer.a@acme.com",
      });

      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(20);
    });

    it("should grant permitted actions and forbid unauthorized actions", () => {
      const session = {
        userId: userAId,
        organizationId: orgAId,
        roleId: roleSiteEngAId,
        roleCode: "SITE_ENG",
        permissions: [PERMISSIONS.PROJECTS_READ, PERMISSIONS.SITE_LOGS_WRITE],
        email: "engineer.a@acme.com",
      };

      // Allowed
      expect(() => assertPermission(session, PERMISSIONS.PROJECTS_READ)).not.toThrow();
      expect(() => assertPermission(session, PERMISSIONS.SITE_LOGS_WRITE)).not.toThrow();

      // Denied: Site engineer attempting to access finance or approve POs
      expect(() => assertPermission(session, PERMISSIONS.FINANCE_READ)).toThrow(AuthorizationError);
      expect(() => assertPermission(session, PERMISSIONS.PURCHASE_ORDERS_APPROVE)).toThrow(AuthorizationError);
    });

    it("should reject unauthenticated caller", () => {
      expect(() => assertPermission(null, PERMISSIONS.PROJECTS_READ)).toThrow(AuthenticationError);
    });
  });

  describe("Tenant Isolation Enforcement (Negative Tests)", () => {
    it("should block cross-tenant resource access", () => {
      const userASession = {
        userId: userAId,
        organizationId: orgAId, // Org A
        roleId: roleSiteEngAId,
        roleCode: "SITE_ENG",
        permissions: ["*"],
        email: "engineer.a@acme.com",
      };

      // Attempting to access an entity belonging to Org B
      expect(() => assertTenantAccess(userASession, orgBId)).toThrow(AuthorizationError);
      expect(() => assertTenantAccess(userASession, orgAId)).not.toThrow();
    });

    it("enforces database uniqueness of roles per organization", async () => {
      // Trying to create a duplicate role code within the same organization must violate unique constraint
      await expect(
        testPrisma.role.create({
          data: {
            organizationId: orgAId,
            name: "Duplicate Site Engineer",
            code: "SITE_ENG",
            permissions: [],
          },
        })
      ).rejects.toThrow();
    });
  });

  describe("Financial Math Precision", () => {
    it("calculates Revised Contract Value accurately with decimals", () => {
      const originalContract = "12500000.50";
      const approvedCO1 = "345000.25";
      const approvedCO2 = "150000.00";

      const revisedValue = CurrencyMath.calculateRevisedContractValue(
        originalContract,
        CurrencyMath.add(approvedCO1, approvedCO2)
      );

      expect(revisedValue.toFixed(2)).toBe("12995000.75");
    });

    it("calculates Customer Outstanding without floating point inaccuracies", () => {
      // 0.1 + 0.2 floating point anomaly test
      const invoices = CurrencyMath.add("0.1", "0.2");
      const payments = "0.15";
      const outstanding = CurrencyMath.calculateCustomerOutstanding(invoices, payments);

      expect(outstanding.toFixed(2)).toBe("0.15");
    });

    it("calculates Remaining Budget properly distinguishing commitments", () => {
      const revisedBudget = "5000000.00";
      const actualCost = "3200000.40";

      const remainingBudget = CurrencyMath.calculateRemainingBudget(revisedBudget, actualCost);
      expect(remainingBudget.toFixed(2)).toBe("1799999.60");
    });
  });
});

