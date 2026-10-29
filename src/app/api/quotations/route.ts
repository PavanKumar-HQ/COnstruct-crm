import { NextRequest, NextResponse } from "next/server";
import { validateActiveSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { QuotationService } from "@/services/quotation.service";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(env.AUTH_SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await validateActiveSession(token);
  if (!session) return NextResponse.json({ error: "Session invalid or revoked" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("leadId") || undefined;
  const customerId = searchParams.get("customerId") || undefined;
  const search = searchParams.get("search") || undefined;

  try {
    const data = await QuotationService.listQuotations(session, { leadId, customerId, search });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(env.AUTH_SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await validateActiveSession(token);
  if (!session) return NextResponse.json({ error: "Session invalid or revoked" }, { status: 401 });

  try {
    const body = await req.json();
    const result = await QuotationService.createQuotationFromEstimate(session, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

