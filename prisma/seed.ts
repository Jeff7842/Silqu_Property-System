import bcrypt from "bcryptjs";
import { db } from "../src/server/db/client";

const HASH_ROUNDS = 12;

function toCents(kes: number) {
  return Math.round(kes * 100);
}

function phone(seed: number) {
  return `2547${String(10000000 + seed).slice(0, 8)}`;
}

const TENANT_NAMES = [
  "Wanjiru Kamau", "Otieno Odhiambo", "Achieng Wafula", "Mutiso Kilonzo",
  "Njeri Mwangi", "Barasa Wekesa", "Chebet Kiprotich", "Nyambura Karanja",
  "Odongo Owino", "Wambui Githinji", "Kiplagat Rono", "Auma Ochieng",
  "Mwikali Musyoka", "Kariuki Ndungu", "Akinyi Onyango", "Cherono Kiptoo",
  "Muthoni Kimani", "Omondi Aoko",
];

const EMPLOYEE_NAMES = ["Fatuma Hassan", "Peter Kamotho"];
const CARETAKER_NAME = "Joseph Mwakio";
const MANAGER_NAME = "Jefferson Kimotho";
const ADMIN_NAME = "SILQU Admin";

const COUNTY = "Nairobi";
const PROPERTIES = [
  { name: "Kileleshwa Gardens", town: "Kileleshwa", type: "APARTMENT" as const, units: 8 },
  { name: "Buruburu Courts", town: "Buruburu", type: "MAISONETTE" as const, units: 8 },
  { name: "Roysambu Heights", town: "Roysambu", type: "APARTMENT" as const, units: 8 },
];

const MAINTENANCE_ITEMS: Array<{
  category: "PLUMBING" | "ELECTRICAL" | "STRUCTURAL" | "SECURITY" | "OTHER";
  description: string;
}> = [
  { category: "PLUMBING", description: "Kitchen sink is leaking under the counter." },
  { category: "ELECTRICAL", description: "Bedroom socket sparks when a plug is inserted." },
  { category: "SECURITY", description: "Gate padlock is broken, will not latch." },
  { category: "PLUMBING", description: "No hot water since Tuesday." },
  { category: "STRUCTURAL", description: "Crack forming along the living room ceiling." },
  { category: "OTHER", description: "Balcony door won't slide shut fully." },
];

async function main() {
  console.log("Clearing existing data...");
  await db.$transaction(
    [
      db.notification.deleteMany(),
      db.maintenanceComment.deleteMany(),
      db.maintenanceRequest.deleteMany(),
      db.announcement.deleteMany(),
      db.paymentAllocation.deleteMany(),
      db.payment.deleteMany(),
      db.invoiceLine.deleteMany(),
      db.invoice.deleteMany(),
      db.lease.deleteMany(),
      db.document.deleteMany(),
      db.invitation.deleteMany(),
      db.caretakerAssignment.deleteMany(),
      db.mpesaTransaction.deleteMany(),
      db.auditLog.deleteMany(),
      db.emailLog.deleteMany(),
      db.tenant.deleteMany(),
      db.unit.deleteMany(),
      db.property.deleteMany(),
      db.employeeProfile.deleteMany(),
      db.subscription.deleteMany(),
      db.user.deleteMany(),
      db.organization.deleteMany(),
    ],
    { maxWait: 10_000, timeout: 30_000 },
  );

  const passwordHash = await bcrypt.hash("Passw0rd!", HASH_ROUNDS);

  console.log("Creating platform admin...");
  await db.user.create({
    data: {
      email: "platform-admin@silqu.co.ke",
      fullName: ADMIN_NAME,
      phone: phone(1),
      passwordHash,
      role: "PLATFORM_ADMIN",
    },
  });

  console.log("Creating organization + subscription...");
  const org = await db.organization.create({
    data: {
      name: "Kembo Properties Ltd",
      county: COUNTY,
      phone: phone(2),
      email: "info@kemboproperties.co.ke",
      status: "ACTIVE",
      subscription: {
        create: {
          plan: "MONTHLY",
          status: "ACTIVE",
          unitLimit: 50,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  console.log("Creating manager, employees, caretaker...");
  const manager = await db.user.create({
    data: {
      orgId: org.id,
      email: "manager@kemboproperties.co.ke",
      fullName: MANAGER_NAME,
      phone: phone(3),
      passwordHash,
      role: "MANAGER",
    },
  });

  const [financeEmployee, careEmployee] = await Promise.all([
    db.user.create({
      data: {
        orgId: org.id,
        email: "finance@kemboproperties.co.ke",
        fullName: EMPLOYEE_NAMES[0],
        phone: phone(4),
        passwordHash,
        role: "EMPLOYEE",
        employeeProfile: { create: { subRole: "FINANCE" } },
      },
    }),
    db.user.create({
      data: {
        orgId: org.id,
        email: "care@kemboproperties.co.ke",
        fullName: EMPLOYEE_NAMES[1],
        phone: phone(5),
        passwordHash,
        role: "EMPLOYEE",
        employeeProfile: { create: { subRole: "CUSTOMER_CARE" } },
      },
    }),
  ]);

  const caretaker = await db.user.create({
    data: {
      orgId: org.id,
      email: "caretaker@kemboproperties.co.ke",
      fullName: CARETAKER_NAME,
      phone: phone(6),
      passwordHash,
      role: "CARETAKER",
    },
  });

  console.log("Creating properties + units...");
  const units: { id: string; rentCents: number; label: string; propertyId: string }[] = [];
  const propertyIds: string[] = [];

  for (const p of PROPERTIES) {
    const property = await db.property.create({
      data: {
        orgId: org.id,
        name: p.name,
        county: COUNTY,
        town: p.town,
        address: `${p.name}, ${p.town}, ${COUNTY}`,
        type: p.type,
        status: "ACTIVE",
      },
    });
    propertyIds.push(property.id);

    for (let i = 1; i <= p.units; i++) {
      const bedrooms = [1, 1, 2, 2, 2, 3][i % 6];
      const rentKes = 8000 + bedrooms * 4500 + (i % 3) * 1000;
      const unit = await db.unit.create({
        data: {
          orgId: org.id,
          propertyId: property.id,
          label: `${p.name[0]}${i}`,
          unitType: bedrooms === 1 ? "Studio" : `${bedrooms} bedroom`,
          bedrooms,
          rentCents: toCents(rentKes),
          depositCents: toCents(rentKes),
          status: "VACANT",
        },
      });
      units.push({ id: unit.id, rentCents: unit.rentCents, label: unit.label, propertyId: property.id });
    }
  }

  await db.caretakerAssignment.create({
    data: { userId: caretaker.id, propertyId: propertyIds[0] },
  });

  console.log("Creating tenants + leases...");
  const now = new Date();
  const leases: { id: string; unitId: string; tenantId: string; rentCents: number }[] = [];

  for (let i = 0; i < TENANT_NAMES.length; i++) {
    const unit = units[i];
    const tenant = await db.tenant.create({
      data: {
        orgId: org.id,
        fullName: TENANT_NAMES[i],
        nationalId: String(30000000 + i * 137),
        phone: phone(10 + i),
        email: `${TENANT_NAMES[i].toLowerCase().replace(/\s+/g, ".")}@example.co.ke`,
        nextOfKinName: "Next of Kin",
        nextOfKinPhone: phone(200 + i),
        status: "ACTIVE",
      },
    });

    const startDate = new Date(now.getFullYear(), now.getMonth() - 4, 1 + (i % 5));
    const lease = await db.lease.create({
      data: {
        orgId: org.id,
        unitId: unit.id,
        tenantId: tenant.id,
        startDate,
        endDate: new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate()),
        rentCents: unit.rentCents,
        depositCents: unit.rentCents,
        billingDay: 1,
        status: "ACTIVE",
      },
    });
    await db.unit.update({ where: { id: unit.id }, data: { status: "OCCUPIED" } });

    leases.push({ id: lease.id, unitId: unit.id, tenantId: tenant.id, rentCents: unit.rentCents });
  }

  console.log("Creating invoices + payments for the last 3 months...");
  let invoiceSeq = 1;

  for (const lease of leases) {
    for (let m = 2; m >= 0; m--) {
      const period = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const periodYear = period.getFullYear();
      const periodMonth = period.getMonth() + 1;
      const dueDate = new Date(periodYear, periodMonth - 1, 5);
      const invoiceNo = `INV-${periodYear}${String(periodMonth).padStart(2, "0")}-${String(invoiceSeq++).padStart(5, "0")}`;

      // Deterministic-ish spread: recent month more likely unpaid/overdue.
      const roll = (invoiceSeq + m) % 5;
      const settleFraction = m === 0 ? (roll < 2 ? 0 : roll < 4 ? 0.5 : 1) : roll < 4 ? 1 : 0.5;

      const invoice = await db.invoice.create({
        data: {
          orgId: org.id,
          leaseId: lease.id,
          invoiceNo,
          periodYear,
          periodMonth,
          issueDate: new Date(periodYear, periodMonth - 1, 1),
          dueDate,
          totalCents: lease.rentCents,
          paidCents: 0,
          balanceCents: lease.rentCents,
          status: "OPEN",
          lines: {
            create: [{ category: "RENT", description: "Monthly rent", amountCents: lease.rentCents }],
          },
        },
      });

      if (settleFraction > 0) {
        const amountCents = Math.round(lease.rentCents * settleFraction);
        const payment = await db.payment.create({
          data: {
            orgId: org.id,
            tenantId: lease.tenantId,
            leaseId: lease.id,
            amountCents,
            method: "MPESA",
            mpesaReceipt: `Q${(1000000000 + invoiceSeq * 37).toString(36).toUpperCase()}`,
            paidAt: new Date(dueDate.getTime() - 24 * 60 * 60 * 1000),
            recordedById: financeEmployee.id,
            status: "COMPLETED",
            allocations: {
              create: [{ invoiceId: invoice.id, amountCents }],
            },
          },
        });
        void payment;

        await db.invoice.update({
          where: { id: invoice.id },
          data: {
            paidCents: amountCents,
            balanceCents: lease.rentCents - amountCents,
            status: amountCents >= lease.rentCents ? "PAID" : "PARTIALLY_PAID",
          },
        });
      }
    }
  }

  console.log("Creating maintenance requests...");
  for (let i = 0; i < MAINTENANCE_ITEMS.length; i++) {
    const lease = leases[i * 3];
    const item = MAINTENANCE_ITEMS[i];
    await db.maintenanceRequest.create({
      data: {
        orgId: org.id,
        unitId: lease.unitId,
        tenantId: lease.tenantId,
        propertyId: units.find((u) => u.id === lease.unitId)?.propertyId,
        category: item.category,
        description: item.description,
        priority: i % 3 === 0 ? "HIGH" : "MEDIUM",
        status: i < 2 ? "RESOLVED" : i < 4 ? "IN_PROGRESS" : "OPEN",
        assignedToId: i < 4 ? caretaker.id : null,
        resolvedAt: i < 2 ? new Date() : null,
      },
    });
  }

  console.log("Creating announcements...");
  await db.announcement.createMany({
    data: [
      {
        orgId: org.id,
        title: "Water rationing this Thursday",
        body: "Nairobi Water has scheduled maintenance; expect low pressure across all properties on Thursday from 9am to 4pm.",
        audience: "ALL",
        createdById: manager.id,
        publishedAt: new Date(),
      },
      {
        orgId: org.id,
        title: "Gate repainting at Kileleshwa Gardens",
        body: "The main gate will be repainted this weekend. Please use the side entrance on Saturday.",
        audience: "PROPERTY",
        propertyId: propertyIds[0],
        createdById: careEmployee.id,
        publishedAt: new Date(),
      },
      {
        orgId: org.id,
        title: "Rent due reminder",
        body: "A friendly reminder that rent is due on the 1st of each month. Pay via M-Pesa from your tenant portal.",
        audience: "ALL",
        createdById: manager.id,
        publishedAt: new Date(),
      },
    ],
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
