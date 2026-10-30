import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSessionToken } from "@/lib/auth";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  // Allow in development, local, or demo mode
  if (process.env.APP_ENV === "production") {
    return NextResponse.json({ error: "Demo session login disabled in production" }, { status: 403 });
  }

  try {
    const demoOrg = await prisma.organization.findUnique({
      where: { slug: "apex-buildtech-demo" },
      include: {
        memberships: {
          where: { status: "ACTIVE" },
          include: {
            user: true,
            role: true,
          },
        },
      },
    });

    if (!demoOrg || demoOrg.memberships.length === 0) {
      return NextResponse.json(
        { error: "Demo organization not seeded. Run 'pnpm db:seed:demo' first." },
        { status: 404 }
      );
    }

    // Pick the Managing Director / Admin member
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

    const response = NextResponse.json({
      success: true,
      user: {
        id: adminMember.user.id,
        fullName: adminMember.user.fullName,
        email: adminMember.user.email,
        role: adminMember.role.name,
      },
      organization: {
        id: demoOrg.id,
        name: demoOrg.name,
        slug: demoOrg.slug,
      },
    });

    // Set secure session cookie
    response.cookies.set({
      name: env.AUTH_SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: env.AUTH_SESSION_TTL_HOURS * 3600,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

