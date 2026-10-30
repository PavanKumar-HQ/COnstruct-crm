import { NextRequest, NextResponse } from "next/server";
import { ensureAutoSession } from "@/lib/session-helper";
import { env } from "@/lib/env";
import { ContractService } from "@/services/contract.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const auth = await ensureAutoSession(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contractId } = await params;
  try {
    const contract = await ContractService.getContractById(auth.session, contractId);
    const response = NextResponse.json(contract);
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
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
}
