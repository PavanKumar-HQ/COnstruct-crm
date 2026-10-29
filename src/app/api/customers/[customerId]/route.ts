import { NextRequest, NextResponse } from "next/server";
import { validateActiveSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { CustomerService, CreateCustomerSchema } from "@/services/customer.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const token = req.cookies.get(env.AUTH_SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await validateActiveSession(token);
  if (!session) return NextResponse.json({ error: "Session invalid or revoked" }, { status: 401 });

  const { customerId } = await params;
  try {
    const customer = await CustomerService.getCustomerById(session, customerId);
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    return NextResponse.json(customer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const token = req.cookies.get(env.AUTH_SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await validateActiveSession(token);
  if (!session) return NextResponse.json({ error: "Session invalid or revoked" }, { status: 401 });

  const { customerId } = await params;
  try {
    const body = await req.json();
    const updated = await CustomerService.updateCustomer(session, customerId, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
