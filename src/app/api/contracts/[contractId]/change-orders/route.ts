import { NextRequest, NextResponse } from "next/server";
import { ensureAutoSession } from "@/lib/session-helper";
import { env } from "@/lib/env";
import { ContractService } from "@/services/contract.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const auth = await ensureAutoSession(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contractId } = await params;
  try {
    const body = await req.json();
    const changeOrder = await ContractService.createChangeOrder(auth.session, {
      ...body,
      contractId,
    });
    const response = NextResponse.json(changeOrder, { status: 201 });
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
