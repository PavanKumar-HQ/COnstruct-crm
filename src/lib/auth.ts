import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { env } from "./env";
import { prisma } from "./db";

const SECRET_KEY = new TextEncoder().encode(env.AUTH_SECRET);
const ALGORITHM = "HS256";
const ISSUER = "construct-crm";
const AUDIENCE = "construct-crm-client";

export interface SessionPayload {
  userId: string;
  organizationId: string;
  roleId: string;
  roleCode: string;
  permissions: string[];
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const expSeconds = env.AUTH_SESSION_TTL_HOURS * 3600;
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(`${expSeconds}s`)
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: [ALGORITHM],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Validates the session against the database to guarantee revoked memberships,
 * suspended users, or modified roles immediately invalidate the session token.
 */
export async function validateActiveSession(token: string): Promise<SessionPayload | null> {
  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const membership = await prisma.membership.findFirst({
    where: {
      userId: payload.userId,
      organizationId: payload.organizationId,
      status: "ACTIVE",
      user: {
        status: "ACTIVE",
      },
      organization: {
        status: "ACTIVE",
      },
    },
    include: {
      role: true,
      user: true,
    },
  });

  if (!membership) {
    return null;
  }

  return {
    userId: membership.userId,
    organizationId: membership.organizationId,
    roleId: membership.roleId,
    roleCode: membership.role.code,
    permissions: membership.role.permissions,
    email: membership.user.email,
  };
}

/**
 * Returns security-hardened cookie configuration for session tokens.
 */
export function getSessionCookieOptions(isProduction: boolean = env.NODE_ENV === "production") {
  return {
    name: env.AUTH_SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: env.AUTH_SESSION_TTL_HOURS * 3600,
  };
}
