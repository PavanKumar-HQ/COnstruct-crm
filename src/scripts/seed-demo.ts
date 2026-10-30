import { PrismaClient, LeadStatus, LeadPriority } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Decimal } from "decimal.js";

const prisma = new PrismaClient();

async function main() {
  const databaseUrl = process.env.DATABASE_URL || "";
  const nodeEnv = process.env.NODE_ENV || "development";

  console.log("-----------------------------------------------------------------");
  console.log("Construct OS — Demo Data Seed & Isolation Engine");
  console.log("-----------------------------------------------------------------");
  console.log(`Target Database: ${databaseUrl.replace(/:[^:@]*@/, ":***@")}`);
  console.log(`Environment: ${nodeEnv}`);

  // Safety Gate: Refuse to run against production
  if (nodeEnv === "production" || databaseUrl.includes("prod")) {
    console.error("FATAL: Refusing to seed demo data into a production environment!");
    process.exit(1);
  }

  const DEMO_ORG_SLUG = "apex-buildtech-demo";
  console.log(`Preparing isolated demo tenant: ${DEMO_ORG_SLUG}...`);

  // Clean existing demo organization if present (strictly scoped to DEMO_ORG_SLUG)
  const existingOrg = await prisma.organization.findUnique({
    where: { slug: DEMO_ORG_SLUG },
  });

  if (existingOrg) {
    console.log(`Cleaning existing records for demo tenant: ${existingOrg.id}...`);
    const orgId = existingOrg.id;
    await prisma.quotationRevision.deleteMany({ where: { organizationId: orgId } });
    await prisma.quotation.deleteMany({ where: { organizationId: orgId } });
    await prisma.boqItem.deleteMany({ where: { organizationId: orgId } });
    await prisma.estimateRevision.deleteMany({ where: { organizationId: orgId } });
    await prisma.estimate.deleteMany({ where: { organizationId: orgId } });
    await prisma.attachment.deleteMany({ where: { organizationId: orgId } });
    await prisma.siteVisit.deleteMany({ where: { organizationId: orgId } });
    await prisma.activity.deleteMany({ where: { organizationId: orgId } });
    await prisma.lead.deleteMany({ where: { organizationId: orgId } });
    await prisma.contact.deleteMany({ where: { organizationId: orgId } });
    await prisma.customer.deleteMany({ where: { organizationId: orgId } });
    await prisma.auditLog.deleteMany({ where: { organizationId: orgId } });
    await prisma.membership.deleteMany({ where: { organizationId: orgId } });
    await prisma.role.deleteMany({ where: { organizationId: orgId } });
    await prisma.organization.delete({ where: { id: orgId } });
  }

  // 1. Create Demo Organization
  const demoOrg = await prisma.organization.create({
    data: {
      name: "Apex BuildTech Contracting (Demo)",
      slug: DEMO_ORG_SLUG,
      currency: "INR",
      timezone: "Asia/Kolkata",
      settings: {
        isDemoOrganization: true,
        businessType: "General Commercial & Industrial Contractor",
        licenseNumber: "BLD-KA-2026-9812",
        standardTaxRate: 18.0,
      },
    },
  });
  console.log(`Created Organization: ${demoOrg.name} (${demoOrg.id})`);

  // 2. Create Roles
  const allPermissions = [
    "org:read", "org:admin", "users:read", "users:write",
    "leads:read", "leads:write", "leads:delete", "leads:convert",
    "customers:read", "customers:write",
    "site_visits:read", "site_visits:write",
    "activities:read", "activities:write",
    "estimates:read", "estimates:write", "estimates:approve",
    "quotes:read", "quotes:write", "quotes:approve",
    "quotations:read", "quotations:write", "quotations:approve",
    "projects:read", "projects:write", "projects:admin",
    "finance:read", "finance:write", "finance:transact",
    "treasury:read", "treasury:transact",
    "procurement:read", "procurement:write", "procurement:approve",
    "inventory:read", "inventory:write",
    "knowledge:read", "knowledge:write", "knowledge:publish",
    "audit:read"
  ];

  const adminRole = await prisma.role.create({
    data: {
      organizationId: demoOrg.id,
      name: "Managing Director",
      code: "ORG_ADMIN",
      isSystemRole: true,
      permissions: allPermissions,
    },
  });

  const pmRole = await prisma.role.create({
    data: {
      organizationId: demoOrg.id,
      name: "Senior Project Manager",
      code: "PROJECT_MANAGER",
      isSystemRole: false,
      permissions: [
        "org:read", "leads:read", "customers:read", "site_visits:read", "site_visits:write",
        "activities:read", "activities:write", "estimates:read", "estimates:write",
        "quotations:read", "projects:read", "projects:write", "procurement:read",
        "inventory:read", "knowledge:read", "knowledge:write"
      ],
    },
  });

  const qsRole = await prisma.role.create({
    data: {
      organizationId: demoOrg.id,
      name: "Chief Quantity Surveyor",
      code: "QUANTITY_SURVEYOR",
      isSystemRole: false,
      permissions: [
        "org:read", "leads:read", "customers:read", "site_visits:read", "estimates:read",
        "estimates:write", "estimates:approve", "quotations:read", "quotations:write"
      ],
    },
  });

  // 3. Create Users & Memberships
  const passwordHash = await bcrypt.hash("DemoAdmin@2026", 10);

  const usersData = [
    { fullName: "Vikram Malhotra", email: "vikram@apexbuildtech.demo", role: adminRole },
    { fullName: "Ananya Sharma", email: "ananya.pm@apexbuildtech.demo", role: pmRole },
    { fullName: "Rajesh Kulkarni", email: "rajesh.qs@apexbuildtech.demo", role: qsRole },
    { fullName: "Suresh Menon", email: "suresh.site@apexbuildtech.demo", role: pmRole },
    { fullName: "Pooja Hegde", email: "pooja.sales@apexbuildtech.demo", role: pmRole },
  ];

  const createdUsers: any[] = [];
  for (const u of usersData) {
    let user = await prisma.user.findUnique({ where: { email: u.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          fullName: u.fullName,
          email: u.email,
          passwordHash,
          status: "ACTIVE",
        },
      });
    }
    await prisma.membership.create({
      data: {
        organizationId: demoOrg.id,
        userId: user.id,
        roleId: u.role.id,
        status: "ACTIVE",
      },
    });
    createdUsers.push(user);
  }
  console.log(`Created ${createdUsers.length} Fictional Demo Team Members.`);

  const primaryUser = createdUsers[0];

  // 4. Create Customers & Contacts
  const customer1 = await prisma.customer.create({
    data: {
      organizationId: demoOrg.id,
      name: "Prestige Horizon Tech Parks Ltd",
      companyName: "Prestige Group Enterprises",
      email: "procurement@prestigehorizon.demo",
      phone: "+91 80 4123 9901",
      status: "ACTIVE",
      notes: "Tier-1 commercial real estate developer. Strict milestone inspection requirements.",
      contacts: {
        create: [
          {
            organizationId: demoOrg.id,
            name: "Kavita Ramachandran",
            email: "kavita.r@prestigehorizon.demo",
            phone: "+91 98450 11223",
            designation: "VP Procurement & Infrastructure",
            isPrimary: true,
          },
          {
            organizationId: demoOrg.id,
            name: "Arun Prasad",
            email: "arun.p@prestigehorizon.demo",
            phone: "+91 98450 44556",
            designation: "Chief Site Engineer",
            isPrimary: false,
          },
        ],
      },
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      organizationId: demoOrg.id,
      name: "Brigade Industrial Logistics Hub",
      companyName: "Brigade Logistics Corp",
      email: "contracts@brigadelogistics.demo",
      phone: "+91 80 2234 5567",
      status: "ACTIVE",
      notes: "PEB warehouse construction and heavy load flooring projects.",
      contacts: {
        create: [
          {
            organizationId: demoOrg.id,
            name: "Manoj Deshmukh",
            email: "manoj@brigadelogistics.demo",
            phone: "+91 98230 77889",
            designation: "General Manager - Project Delivery",
            isPrimary: true,
          },
        ],
      },
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      organizationId: demoOrg.id,
      name: "Sobha Signature Residences",
      companyName: "Sobha Developers",
      email: "infra@sobhasignature.demo",
      phone: "+91 80 3344 6677",
      status: "ACTIVE",
      notes: "Luxury residential high-rise civil contracting.",
      contacts: {
        create: [
          {
            organizationId: demoOrg.id,
            name: "Deepak Chawla",
            email: "deepak@sobhasignature.demo",
            phone: "+91 98110 33445",
            designation: "Director - Contracts",
            isPrimary: true,
          },
        ],
      },
    },
  });

  console.log(`Created 3 Corporate Clients with Primary Contacts.`);

  // 5. Create Leads across Pipeline Stages
  const leadsData: Array<{
    title: string;
    source: string;
    status: LeadStatus;
    priority: LeadPriority;
    estimatedBudget: Decimal;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    siteAddress: string;
    requirements: string;
    customerId?: string;
    convertedAt?: Date;
  }> = [
    {
      title: "Prestige Tech Park Tower 4 RCC Superstructure",
      source: "Direct Referral",
      status: LeadStatus.WON,
      priority: LeadPriority.HIGH,
      estimatedBudget: new Decimal("45000000.00"), // 4.5 Cr
      contactName: "Kavita Ramachandran",
      contactEmail: "kavita.r@prestigehorizon.demo",
      contactPhone: "+91 98450 11223",
      siteAddress: "Plot 14-B, Outer Ring Road, Bellandur, Bangalore",
      requirements: "G+14 RCC Frame commercial tower, 220,000 sq.ft built-up area. Turnkey civil & MEP core.",
      customerId: customer1.id,
      convertedAt: new Date(),
    },
    {
      title: "Brigade Logistics 180,000 sq.ft Warehouse & Hardstand",
      source: "Client Portal Tender",
      status: LeadStatus.QUOTATION_SENT,
      priority: LeadPriority.HIGH,
      estimatedBudget: new Decimal("28000000.00"), // 2.8 Cr
      contactName: "Manoj Deshmukh",
      contactEmail: "manoj@brigadelogistics.demo",
      contactPhone: "+91 98230 77889",
      siteAddress: "Survey 88, Hoskote Industrial Area, Bangalore Rural",
      requirements: "FM2 special tolerance heavy-duty industrial flooring, PEB foundation pedestals, storm drainage.",
      customerId: customer2.id,
    },
    {
      title: "Sobha Emerald Club House & Infinity Pool Civil Package",
      source: "Architect Partner",
      status: LeadStatus.SITE_VISIT_SCHEDULED,
      priority: LeadPriority.HIGH,
      estimatedBudget: new Decimal("16500000.00"), // 1.65 Cr
      contactName: "Deepak Chawla",
      contactEmail: "deepak@sobhasignature.demo",
      contactPhone: "+91 98110 33445",
      siteAddress: "Green Glen Layout, Sarjapur Road, Bangalore",
      requirements: "Pre-stressed post-tensioned beam structure, water-retaining basement and cantilever deck.",
      customerId: customer3.id,
    },
    {
      title: "Adani Cold Chain Distribution Centre Substructure",
      source: "Website Enquiry",
      status: LeadStatus.QUALIFIED,
      priority: LeadPriority.MEDIUM,
      estimatedBudget: new Decimal("32000000.00"),
      contactName: "Hemant Varma",
      contactEmail: "h.varma@adanilogistics.demo",
      contactPhone: "+91 97223 99881",
      siteAddress: "Dabaspet Industrial Estate, Tumkur Road",
      requirements: "High-capacity pile foundations (750mm dia, 18m depth) and vapour-barrier insulated raft.",
    },
    {
      title: "Bhartiya City Commercial Plaza Expansion",
      source: "Subcontractor Network",
      status: LeadStatus.NEW,
      priority: LeadPriority.LOW,
      estimatedBudget: new Decimal("12000000.00"),
      contactName: "Tanvi S.",
      contactEmail: "tanvi@bhartiyacity.demo",
      contactPhone: "+91 99001 22334",
      siteAddress: "Thanisandra Main Road, Bangalore North",
      requirements: "Entry atrium glass facade steel support and podium civil works.",
    },
  ];

  const createdLeads: any[] = [];
  for (const ld of leadsData) {
    const lead = await prisma.lead.create({
      data: {
        organizationId: demoOrg.id,
        assignedToId: createdUsers[1].id, // Ananya Sharma
        ...ld,
      },
    });
    createdLeads.push(lead);
  }
  console.log(`Created ${createdLeads.length} Leads in distinct pipeline stages.`);

  // 6. Create Site Visits
  const visit1 = await prisma.siteVisit.create({
    data: {
      organizationId: demoOrg.id,
      leadId: createdLeads[0].id,
      assignedToId: createdUsers[3].id, // Suresh Menon
      createdById: primaryUser.id,
      scheduledDate: new Date(Date.now() - 1000 * 3600 * 48), // 2 days ago
      status: "COMPLETED",
      siteAddress: createdLeads[0].siteAddress,
      notes: "Pre-construction soil and access route audit.",
      outcomeNotes: "Soil bearing capacity validated at 220 kN/sqm. 18m approach road accessible for 10-wheel transit mixers. Water table deep at 14m.",
      measurements: {
        totalPlotAreaSqFt: 54000,
        frontageWidthMeters: 42,
        setbackMeters: 8,
        roadWidthMeters: 18,
      },
      completedAt: new Date(Date.now() - 1000 * 3600 * 40),
    },
  });

  const visit2 = await prisma.siteVisit.create({
    data: {
      organizationId: demoOrg.id,
      leadId: createdLeads[2].id, // Sobha
      assignedToId: createdUsers[3].id,
      createdById: primaryUser.id,
      scheduledDate: new Date(Date.now() + 1000 * 3600 * 24), // Tomorrow
      status: "SCHEDULED",
      siteAddress: createdLeads[2].siteAddress,
      notes: "Elevation level check and bedrock outcrop inspection for infinity pool footing.",
    },
  });

  console.log(`Created Site Visits (1 Completed with Measurements, 1 Scheduled).`);

  // 7. Create Activities & Follow-ups (including overdue and urgent items)
  await prisma.activity.createMany({
    data: [
      {
        organizationId: demoOrg.id,
        leadId: createdLeads[1].id,
        assignedToId: createdUsers[1].id,
        type: "CALL",
        subject: "Review flooring specifications with Manoj Deshmukh",
        description: "Verify if laser screeding and steel fibre reinforcement are required in Section B.",
        dueDate: new Date(Date.now() - 1000 * 3600 * 12), // Overdue by 12 hours
        status: "PENDING",
        priority: "HIGH",
      },
      {
        organizationId: demoOrg.id,
        leadId: createdLeads[0].id,
        assignedToId: createdUsers[2].id, // Rajesh Kulkarni
        type: "MEETING",
        subject: "Contract Sign-off & Mobilisation Advance Discussion",
        description: "Final review of milestone schedule and bank guarantee submission.",
        dueDate: new Date(Date.now() + 1000 * 3600 * 36),
        status: "PENDING",
        priority: "URGENT",
      },
      {
        organizationId: demoOrg.id,
        leadId: createdLeads[0].id,
        assignedToId: createdUsers[1].id,
        type: "TASK",
        subject: "BOQ Line Item Rate Analysis Preparation",
        description: "Compile concrete and rebars bulk quote from Tata Steel & UltraTech.",
        dueDate: new Date(Date.now() - 1000 * 3600 * 72),
        status: "COMPLETED",
        priority: "HIGH",
        outcomeNotes: "Tata Tiscon Fe550D rebar quoted at 61,500 INR/MT delivered to site.",
        completedAt: new Date(Date.now() - 1000 * 3600 * 68),
      },
    ],
  });
  console.log(`Created Activities with Overdue, Pending, and Completed states.`);

  // 8. Create Detailed Estimate & BOQ
  const est1 = await prisma.estimate.create({
    data: {
      organizationId: demoOrg.id,
      estimateNumber: "EST-2026-0001",
      title: "Prestige Horizon Tower 4 - Substructure & Core RCC",
      leadId: createdLeads[0].id,
      customerId: customer1.id,
      createdById: primaryUser.id,
      currentVersion: 1,
      status: "APPROVED",
    },
  });

  const rev1 = await prisma.estimateRevision.create({
    data: {
      organizationId: demoOrg.id,
      estimateId: est1.id,
      versionNumber: 1,
      status: "APPROVED",
      markupPercentage: new Decimal("14.00"), // 14% Contractor Markup
      taxPercentage: new Decimal("18.00"),    // 18% GST
      taxAmount: new Decimal("7438500.00"),
      totalCost: new Decimal("36250000.00"),
      sellingPricePreTax: new Decimal("41325000.00"),
      totalAmount: new Decimal("48763500.00"),
      estimatedMargin: new Decimal("12.28"),
      createdById: primaryUser.id,
      approvedAt: new Date(Date.now() - 1000 * 3600 * 24),
      notes: "Baseline commercial estimate approved by Vikram Malhotra. Ready for formal quotation issuance.",
    },
  });

  // BOQ line items
  await prisma.boqItem.createMany({
    data: [
      {
        organizationId: demoOrg.id,
        revisionId: rev1.id,
        itemCode: "CIV-EXC-01",
        category: "EXCAVATION",
        description: "Mass excavation in all classes of soil including rock cutting, shoring and dewatering",
        unit: "cu.m",
        quantity: new Decimal("12500.00"),
        materialRate: new Decimal("0.00"),
        labourRate: new Decimal("120.00"),
        equipmentRate: new Decimal("180.00"),
        subcontractRate: new Decimal("0.00"),
        unitCostRate: new Decimal("300.00"),
        sellingRate: new Decimal("342.00"),
        totalCost: new Decimal("3750000.00"),
        totalSellingPrice: new Decimal("4275000.00"),
      },
      {
        organizationId: demoOrg.id,
        revisionId: rev1.id,
        itemCode: "CIV-CONC-M35",
        category: "SUPERSTRUCTURE_RCC",
        description: "Providing and pumping M35 grade ready mix concrete for heavy shear walls and raft foundations",
        unit: "cu.m",
        quantity: new Decimal("3200.00"),
        materialRate: new Decimal("5400.00"),
        labourRate: new Decimal("1450.00"),
        equipmentRate: new Decimal("450.00"),
        subcontractRate: new Decimal("200.00"),
        unitCostRate: new Decimal("7500.00"),
        sellingRate: new Decimal("8550.00"),
        totalCost: new Decimal("24000000.00"),
        totalSellingPrice: new Decimal("27360000.00"),
      },
      {
        organizationId: demoOrg.id,
        revisionId: rev1.id,
        itemCode: "CIV-STEEL-550D",
        category: "SUBSTRUCTURE",
        description: "Supply, cutting, bending and placing Fe550D high-yield deformed bars with binding wire",
        unit: "MT",
        quantity: new Decimal("125.00"),
        materialRate: new Decimal("61500.00"),
        labourRate: new Decimal("5500.00"),
        equipmentRate: new Decimal("1000.00"),
        subcontractRate: new Decimal("0.00"),
        unitCostRate: new Decimal("68000.00"),
        sellingRate: new Decimal("77520.00"),
        totalCost: new Decimal("8500000.00"),
        totalSellingPrice: new Decimal("9690000.00"),
      },
    ],
  });
  console.log(`Created Estimate EST-2026-0001 with 3 detailed BOQ Items totaling ₹48,763,500.`);

  // 9. Create Formal Commercial Quotation
  const quote1 = await prisma.quotation.create({
    data: {
      organizationId: demoOrg.id,
      quotationNumber: "QUOT-2026-0001",
      estimateId: est1.id,
      leadId: createdLeads[0].id,
      customerId: customer1.id,
      createdById: primaryUser.id,
      currentVersion: 1,
      status: "ISSUED",
      validUntil: new Date(Date.now() + 1000 * 3600 * 24 * 30), // Valid 30 days
      paymentTerms: "10% Mobilisation Advance against Bank Guarantee, 85% Progressive Running Account monthly bills, 5% Retention held for 12 months defects liability period.",
      inclusions: "Tower cranes, staging scaffolding, batching plant batching tickets, high-capacity pumps, third-party laboratory cube testing.",
      exclusions: "Permanent electrical grid connection, municipal plan sanctions and betterment charges.",
    },
  });

  await prisma.quotationRevision.create({
    data: {
      organizationId: demoOrg.id,
      quotationId: quote1.id,
      estimateRevisionId: rev1.id,
      versionNumber: 1,
      status: "ISSUED",
      createdById: primaryUser.id,
      subtotalAmount: new Decimal("41325000.00"),
      taxPercentage: new Decimal("18.00"),
      taxAmount: new Decimal("7438500.00"),
      discountAmount: new Decimal("500000.00"), // ₹5 Lakh Goodwill Commercial Discount
      finalGrandTotal: new Decimal("48263500.00"),
      issuedAt: new Date(Date.now() - 1000 * 3600 * 18),
      notes: "Commercial bid officially submitted to Prestige Horizon procurement committee.",
    },
  });
  console.log(`Created Formal Quotation QUOT-2026-0001 with Issued Revision totaling ₹48,263,500.`);

  // 10. Log Audit Event
  await prisma.auditLog.create({
    data: {
      organizationId: demoOrg.id,
      userId: primaryUser.id,
      action: "CREATE",
      entityType: "ORGANIZATION",
      entityId: demoOrg.id,
      metadata: {
        seededBy: "pnpm db:seed:demo",
        organizationSlug: DEMO_ORG_SLUG,
        clientsCount: 3,
        leadsCount: 5,
        estimatesCount: 1,
        quotationsCount: 1,
      },
    },
  });

  console.log("-----------------------------------------------------------------");
  console.log("SUCCESS: Isolated Demo Organization Seeded Successfully!");
  console.log("Tenant Slug:       apex-buildtech-demo");
  console.log("Demo Admin Email:  vikram@apexbuildtech.demo");
  console.log("Demo Password:     DemoAdmin@2026");
  console.log("-----------------------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
