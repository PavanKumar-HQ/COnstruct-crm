import { SessionPayload } from "./auth";

export class AuthorizationError extends Error {
  constructor(message: string = "Forbidden: Insufficient permissions") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = "Unauthorized: Authentication required") {
    super(message);
    this.name = "AuthenticationError";
  }
}

/**
 * Standard system permissions.
 */
export const PERMISSIONS = {
  // Organizations & Settings
  ORG_MANAGE: "org:manage",
  MEMBERS_MANAGE: "members:manage",
  ROLES_MANAGE: "roles:manage",

  // CRM & Sales
  LEADS_READ: "leads:read",
  LEADS_WRITE: "leads:write",
  ESTIMATES_READ: "estimates:read",
  ESTIMATES_WRITE: "estimates:write",
  QUOTES_READ: "quotes:read",
  QUOTES_APPROVE: "quotes:approve",

  // Contracts & Projects
  CONTRACTS_READ: "contracts:read",
  CONTRACTS_WRITE: "contracts:write",
  CHANGE_ORDERS_APPROVE: "change_orders:approve",
  PROJECTS_READ: "projects:read",
  PROJECTS_WRITE: "projects:write",
  SITE_LOGS_WRITE: "site_logs:write",

  // Procurement & Inventory
  PROCUREMENT_READ: "procurement:read",
  PROCUREMENT_WRITE: "procurement:write",
  PURCHASE_ORDERS_APPROVE: "purchase_orders:approve",
  INVENTORY_WRITE: "inventory:write",

  // Finance
  FINANCE_READ: "finance:read",
  FINANCE_WRITE: "finance:write",
  INVOICES_APPROVE: "invoices:approve",
  PAYMENTS_ALLOCATE: "payments:allocate",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS] | string;

/**
 * Enforces server-side permission check.
 * Throws AuthorizationError if session lacks the required permission or organization match.
 */
export function assertPermission(session: SessionPayload | null, requiredPermission: PermissionKey): asserts session is SessionPayload {
  if (!session) {
    throw new AuthenticationError();
  }

  // System Administrator role with "*" permission has wildcard access within the organization
  const hasWildcard = session.permissions.includes("*");
  const hasSpecificPermission = session.permissions.includes(requiredPermission);

  if (!hasWildcard && !hasSpecificPermission) {
    throw new AuthorizationError(`Missing required permission: ${requiredPermission}`);
  }
}

/**
 * Enforces organization boundary validation on record access.
 */
export function assertTenantAccess(session: SessionPayload | null, targetOrganizationId: string): asserts session is SessionPayload {
  if (!session) {
    throw new AuthenticationError();
  }

  if (session.organizationId !== targetOrganizationId) {
    throw new AuthorizationError("Cross-tenant access violation");
  }
}
