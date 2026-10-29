import { NextRequest, NextResponse } from "next/server";
import { validateActiveSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { SiteVisitService } from "@/services/site-visit.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ visitId: string }> }
) {
  const token = req.cookies.get(env.AUTH_SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await validateActiveSession(token);
  if (!session) return NextResponse.json({ error: "Session invalid or revoked" }, { status: 401 });

  const { visitId } = await params;
  try {
    const body = await req.json();
    const completed = await SiteVisitService.recordVisitOutcome(session, visitId, {
      outcomeNotes: body.outcomeNotes,
      measurements: body.measurements,
    });
    return NextResponse.json(completed);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
