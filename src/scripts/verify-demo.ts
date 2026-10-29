import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("-----------------------------------------------------------------");
  console.log("Construct OS — Demo Tenant Verification Check");
  console.log("-----------------------------------------------------------------");

  const demoOrg = await prisma.organization.findUnique({
    where: { slug: "apex-buildtech-demo" },
    include: {
      _count: {
        select: {
          memberships: true,
          customers: true,
          leads: true,
          siteVisits: true,
          activities: true,
          estimates: true,
          quotations: true,
          auditLogs: true,
        },
      },
    },
  });

  if (!demoOrg) {
    console.error("FAIL: Demo organization 'apex-buildtech-demo' was not found!");
    process.exit(1);
  }

  console.log(`Verified Organization: ${demoOrg.name} [ID: ${demoOrg.id}]`);
  console.log(`Memberships:           ${demoOrg._count.memberships}`);
  console.log(`Clients/Customers:     ${demoOrg._count.customers}`);
  console.log(`Leads:                 ${demoOrg._count.leads}`);
  console.log(`Site Visits:           ${demoOrg._count.siteVisits}`);
  console.log(`Activities:            ${demoOrg._count.activities}`);
  console.log(`Estimates:             ${demoOrg._count.estimates}`);
  console.log(`Quotations:            ${demoOrg._count.quotations}`);
  console.log(`Audit Logs:            ${demoOrg._count.auditLogs}`);

  if (demoOrg._count.customers === 0 || demoOrg._count.leads === 0) {
    console.error("FAIL: Incomplete seed dataset detected!");
    process.exit(1);
  }

  console.log("-----------------------------------------------------------------");
  console.log("SUCCESS: Demo Tenant Integrity Verified.");
  console.log("-----------------------------------------------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

