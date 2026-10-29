import { NextRequest, NextResponse } from "next/server";
import { validateActiveSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { QuotationService } from "@/services/quotation.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ quotationId: string }> }
) {
  const token = req.cookies.get(env.AUTH_SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await validateActiveSession(token);
  if (!session) return NextResponse.json({ error: "Session invalid or revoked" }, { status: 401 });

  const { quotationId } = await params;
  try {
    const quotation = await QuotationService.getQuotationById(session, quotationId);
    if (!quotation) return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    return NextResponse.json(quotation);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ quotationId: string }> }
) {
  const token = req.cookies.get(env.AUTH_SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await validateActiveSession(token);
  if (!session) return NextResponse.json({ error: "Session invalid or revoked" }, { status: 401 });

  const { quotationId } = await params;
  try {
    const body = await req.json();
    const updated = await QuotationService.updateQuotationStatus(session, quotationId, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

