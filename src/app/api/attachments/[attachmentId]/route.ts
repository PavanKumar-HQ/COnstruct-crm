import { NextRequest, NextResponse } from "next/server";
import { validateActiveSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { StorageService } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  const token = req.cookies.get(env.AUTH_SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await validateActiveSession(token);
  if (!session) {
    return NextResponse.json({ error: "Session invalid or revoked" }, { status: 401 });
  }

  const { attachmentId } = await params;

  // Query attachment with mandatory tenant check
  const attachment = await prisma.attachment.findFirst({
    where: {
      id: attachmentId,
      organizationId: session.organizationId,
    },
  });

  if (!attachment) {
    return NextResponse.json({ error: "File not found or access denied" }, { status: 404 });
  }

  const buffer = await StorageService.getFileBuffer(session.organizationId, attachment.storageKey);
  if (!buffer) {
    return NextResponse.json({ error: "Stored file missing" }, { status: 404 });
  }

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Length": buffer.length.toString(),
      "Content-Disposition": `attachment; filename="${encodeURIComponent(attachment.fileName)}"`,
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
}
