import { NextRequest, NextResponse } from "next/server";
import { validateActiveSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { Decimal } from "decimal.js";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(env.AUTH_SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await validateActiveSession(token);
  if (!session) {
    return NextResponse.json({ error: "Session invalid or revoked" }, { status: 401 });
  }

  const orgId = session.organizationId;

  try {
    // 1. Live Aggregate Metrics from database (Zero fake totals)
    const [
      activeClientsCount,
      leadsCount,
      estimatesCount,
      quotationsCount,
      pendingActivitiesCount,
      upcomingVisitsCount,
    ] = await Promise.all([
      prisma.customer.count({ where: { organizationId: orgId, status: "ACTIVE" } }),
      prisma.lead.count({ where: { organizationId: orgId } }),
      prisma.estimate.count({ where: { organizationId: orgId } }),
      prisma.quotation.count({ where: { organizationId: orgId } }),
      prisma.activity.count({ where: { organizationId: orgId, status: "PENDING" } }),
      prisma.siteVisit.count({ where: { organizationId: orgId, status: "SCHEDULED" } }),
    ]);

    // 2. Financial Metrics from Approved Revisions & Issued Quotations
    const quotations = await prisma.quotationRevision.findMany({
      where: { organizationId: orgId, status: { in: ["ISSUED", "ACCEPTED"] } },
      select: { finalGrandTotal: true, status: true },
    });

    let totalQuotedValue = new Decimal(0);
    for (const q of quotations) {
      totalQuotedValue = totalQuotedValue.plus(new Decimal(q.finalGrandTotal.toString()));
    }

    const estimates = await prisma.estimateRevision.findMany({
      where: { organizationId: orgId, status: "APPROVED" },
      select: { totalCost: true, sellingPricePreTax: true },
    });

    let totalApprovedEstimateValue = new Decimal(0);
    for (const e of estimates) {
      totalApprovedEstimateValue = totalApprovedEstimateValue.plus(new Decimal(e.sellingPricePreTax.toString()));
    }

    // 3. Pipeline Breakdown
    const leadsByStatus = await prisma.lead.groupBy({
      by: ["status"],
      where: { organizationId: orgId },
      _count: { id: true },
    });

    // 4. Action Centre (Overdue activities & pending actions)
    const overdueActivities = await prisma.activity.findMany({
      where: {
        organizationId: orgId,
        status: "PENDING",
        dueDate: { lt: new Date() },
      },
      include: {
        lead: { select: { title: true } },
        assignedTo: { select: { fullName: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    });

    // 5. Recent Activity Stream
    const recentAuditLogs = await prisma.auditLog.findMany({
      where: { organizationId: orgId },
      include: { user: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    // 6. Recent Leads Preview
    const recentLeads = await prisma.lead.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        source: true,
        status: true,
        priority: true,
        estimatedBudget: true,
        contactName: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      organizationId: orgId,
      kpis: {
        activeClients: activeClientsCount,
        pipelineLeads: leadsCount,
        approvedEstimates: estimatesCount,
        issuedQuotations: quotationsCount,
        totalQuotedValue: totalQuotedValue.toFixed(2),
        totalApprovedEstimateValue: totalApprovedEstimateValue.toFixed(2),
        pendingTasks: pendingActivitiesCount,
        scheduledSiteVisits: upcomingVisitsCount,
      },
      pipelineBreakdown: leadsByStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      actionCentre: overdueActivities.map((a) => ({
        id: a.id,
        subject: a.subject,
        dueDate: a.dueDate,
        priority: a.priority,
        leadTitle: a.lead?.title,
        assignedTo: a.assignedTo?.fullName,
      })),
      recentActivity: recentAuditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        user: log.user?.fullName || "System",
        createdAt: log.createdAt,
      })),
      recentLeads: recentLeads.map((l) => ({
        ...l,
        estimatedBudget: l.estimatedBudget ? l.estimatedBudget.toString() : null,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

