import { NextRequest, NextResponse } from "next/server";
import { ensureAutoSession } from "@/lib/session-helper";
import { env } from "@/lib/env";
import { ActivityService } from "@/services/activity.service";

export async function GET(req: NextRequest) {
  const auth = await ensureAutoSession(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const activities = await ActivityService.listActivities(auth.session);
    const response = NextResponse.json(activities);
    response.cookies.set({
      name: env.AUTH_SESSION_COOKIE_NAME,
      value: auth.token,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: env.AUTH_SESSION_TTL_HOURS * 3600,
    });
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await ensureAutoSession(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const activity = await ActivityService.createActivity(auth.session, body);
    const response = NextResponse.json(activity, { status: 201 });
    response.cookies.set({
      name: env.AUTH_SESSION_COOKIE_NAME,
      value: auth.token,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: env.AUTH_SESSION_TTL_HOURS * 3600,
    });
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
