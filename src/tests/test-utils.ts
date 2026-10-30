import { PrismaClient } from "@prisma/client";

export async function cleanTestDatabase(prisma: PrismaClient) {
  // Ordered deletion respecting foreign key dependencies
  await prisma.projectMilestone.deleteMany();
  await prisma.workPackage.deleteMany();
  await prisma.project.deleteMany();
  await prisma.changeOrder.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.quotationRevision.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.boqItem.deleteMany();
  await prisma.estimateRevision.deleteMany();
  await prisma.estimate.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.siteVisit.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
}
