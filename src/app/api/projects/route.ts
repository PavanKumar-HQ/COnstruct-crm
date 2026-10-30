import { NextRequest, NextResponse } from "next/server";
import { ensureAutoSession } from "@/lib/session-helper";
import { env } from "@/lib/env";
import { ContractService } from "@/services/contract.service";

export async function GET(req: NextRequest) {
  const auth = await ensureAutoSession(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const projects = await ContractService.listProjects(auth.session);
    const response = NextResponse.json(projects);
    response.cookies.set({
      name: env.AUTH_SESSION_COOKIE_NAME,
      value: auth.token,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: env.AUTH_SESSION_TTL_HOURS * 3600,
    });
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await ensureAutoSession(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const project = await ContractService.createProjectFromContract(auth.session, body);
    const response = NextResponse.json(project, { status: 201 });
    response.cookies.set({
      name: env.AUTH_SESSION_COOKIE_NAME,
      value: auth.token,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: env.AUTH_SESSION_TTL_HOURS * 3600,
    });
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
