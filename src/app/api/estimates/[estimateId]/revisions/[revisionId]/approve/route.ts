import { NextRequest, NextResponse } from "next/server";
import { validateActiveSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { EstimationService } from "@/services/estimation.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ estimateId: string; revisionId: string }> }
) {
  const token = req.cookies.get(env.AUTH_SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await validateActiveSession(token);
  if (!session) return NextResponse.json({ error: "Session invalid or revoked" }, { status: 401 });

  const { estimateId, revisionId } = await params;
  try {
    const approved = await EstimationService.approveRevision(session, estimateId, revisionId);
    return NextResponse.json(approved);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
