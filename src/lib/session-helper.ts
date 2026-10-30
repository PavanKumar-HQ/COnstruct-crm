import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSessionToken, validateActiveSession } from "@/lib/auth";
import { env } from "@/lib/env";

export async function ensureAutoSession(req: NextRequest): Promise<{ token: string; session: any } | null> {
  const existingCookie = req.cookies.get(env.AUTH_SESSION_COOKIE_NAME)?.value;
  if (existingCookie) {
    const session = await validateActiveSession(existingCookie);
    if (session) {
      return { token: existingCookie, session };
    }
  }

  // If no session or invalid, auto-login to demo tenant in development/local
  if (process.env.APP_ENV !== "production") {
    const demoOrg = await prisma.organization.findUnique({
      where: { slug: "apex-buildtech-demo" },
      include: {
        memberships: {
          where: { status: "ACTIVE" },
          include: { user: true, role: true },
        },
      },
    });

    if (demoOrg && demoOrg.memberships.length > 0) {
      const adminMember =
        demoOrg.memberships.find((m) => m.role.code === "ORG_ADMIN") || demoOrg.memberships[0];

      const token = await createSessionToken({
        userId: adminMember.userId,
        organizationId: demoOrg.id,
        roleId: adminMember.roleId,
        roleCode: adminMember.role.code,
        permissions: adminMember.role.permissions,
        email: adminMember.user.email,
      });

      return {
        token,
        session: {
          userId: adminMember.userId,
          organizationId: demoOrg.id,
          roleId: adminMember.roleId,
          roleCode: adminMember.role.code,
          permissions: adminMember.role.permissions,
          email: adminMember.user.email,
        },
      };
    }
  }

  return null;
}

