import { db } from "./index";
import { eq } from "drizzle-orm";
import {
  propertyTypes,
  properties,
  units,
  tenants,
  leases,
  rentObligations,
  payments,
  expenses,
  propertyPhotos,
  documents,
} from "./schema";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Tiny coloured SVG encoded as a base64 image/svg+xml data URI */
function svgPhoto(label: string, bg: string, fg = "#fff") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="${bg}"/><text x="200" y="160" font-family="sans-serif" font-size="28" fill="${fg}" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/** Minimal valid single-page PDF as a base64 data URI */
function minimalPdf(title: string) {
  const content = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>>>
endobj
4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
5 0 obj<</Length 44>>stream
BT /F1 18 Tf 72 720 Td (${title.slice(0, 30)}) Tj ET
endstream
endobj
xref
0 6
0000000000 65535 f 
trailer<</Size 6/Root 1 0 R>>
startxref
0
%%EOF`;
  return `data:application/pdf;base64,${Buffer.from(content).toString("base64")}`;
}

async function seed() {
  console.log("🌱 Seeding…");

  // ── Property types ──────────────────────────────────────────────────────────
  const [residential] = await db.insert(propertyTypes).values({
    name: "Residential",
    description: "Houses, apartments and residential estates",
  }).onConflictDoUpdate({ target: propertyTypes.name, set: { description: "Houses, apartments and residential estates" } }).returning();

  const [commercial] = await db.insert(propertyTypes).values({
    name: "Commercial",
    description: "Offices, shops and commercial buildings",
  }).onConflictDoUpdate({ target: propertyTypes.name, set: { description: "Offices, shops and commercial buildings" } }).returning();

  const [land] = await db.insert(propertyTypes).values({
    name: "Land",
    description: "Land and undeveloped plots",
  }).onConflictDoUpdate({ target: propertyTypes.name, set: { description: "Land and undeveloped plots" } }).returning();

  // ── Properties ──────────────────────────────────────────────────────────────
  const [lekki] = await db.insert(properties).values({
    name: "Lekki Phase 1 Estate",
    address: "14 Admiralty Way",
    city: "Lagos",
    state: "Lagos",
    propertyTypeId: residential.id,
    numberOfUnits: 6,
    purchasePrice: 280_000_000,
    currentValue: 340_000_000,
    status: "PARTIALLY_OCCUPIED",
    notes: "Gated estate with 24/7 security",
  }).returning();

  const [vi] = await db.insert(properties).values({
    name: "Victoria Island Office Complex",
    address: "Plot 1234 Adeola Odeku Street",
    city: "Lagos",
    state: "Lagos",
    propertyTypeId: commercial.id,
    numberOfUnits: 4,
    purchasePrice: 450_000_000,
    currentValue: 520_000_000,
    status: "PARTIALLY_OCCUPIED",
    notes: "Grade-A office space",
  }).returning();

  const [abuja] = await db.insert(properties).values({
    name: "Maitama Luxury Apartments",
    address: "22 Aguiyi Ironsi Street",
    city: "Abuja",
    state: "FCT",
    propertyTypeId: residential.id,
    numberOfUnits: 4,
    purchasePrice: 190_000_000,
    currentValue: 230_000_000,
    status: "OCCUPIED",
  }).returning();

  const [ibeju] = await db.insert(properties).values({
    name: "Ibeju-Lekki Land Bank",
    address: "Km 42 Lekki-Epe Expressway",
    city: "Ibeju-Lekki",
    state: "Lagos",
    propertyTypeId: land.id,
    numberOfUnits: 0,
    purchasePrice: 60_000_000,
    currentValue: 95_000_000,
    status: "VACANT",
    notes: "C of O obtained. 2 plots.",
  }).returning();

  // ── Units ───────────────────────────────────────────────────────────────────
  const lekkiUnits = await db.insert(units).values([
    { propertyId: lekki.id, unitNumber: "A1", unitType: "3 Bedroom", bedrooms: 3, bathrooms: 2, monthlyRent: 3_500_000, status: "OCCUPIED" },
    { propertyId: lekki.id, unitNumber: "A2", unitType: "3 Bedroom", bedrooms: 3, bathrooms: 2, monthlyRent: 3_500_000, status: "OCCUPIED" },
    { propertyId: lekki.id, unitNumber: "B1", unitType: "2 Bedroom", bedrooms: 2, bathrooms: 1, monthlyRent: 2_500_000, status: "OCCUPIED" },
    { propertyId: lekki.id, unitNumber: "B2", unitType: "2 Bedroom", bedrooms: 2, bathrooms: 1, monthlyRent: 2_500_000, status: "VACANT" },
    { propertyId: lekki.id, unitNumber: "C1", unitType: "1 Bedroom", bedrooms: 1, bathrooms: 1, monthlyRent: 1_800_000, status: "VACANT" },
    { propertyId: lekki.id, unitNumber: "C2", unitType: "1 Bedroom", bedrooms: 1, bathrooms: 1, monthlyRent: 1_800_000, status: "MAINTENANCE" },
  ]).returning();

  const viUnits = await db.insert(units).values([
    { propertyId: vi.id, unitNumber: "Floor 1", unitType: "Open Plan Office", monthlyRent: 8_000_000, status: "OCCUPIED" },
    { propertyId: vi.id, unitNumber: "Floor 2", unitType: "Open Plan Office", monthlyRent: 8_000_000, status: "OCCUPIED" },
    { propertyId: vi.id, unitNumber: "Floor 3", unitType: "Partitioned Office", monthlyRent: 7_500_000, status: "VACANT" },
    { propertyId: vi.id, unitNumber: "Floor 4", unitType: "Penthouse Suite", monthlyRent: 12_000_000, status: "VACANT" },
  ]).returning();

  const abujaUnits = await db.insert(units).values([
    { propertyId: abuja.id, unitNumber: "101", unitType: "4 Bedroom Duplex", bedrooms: 4, bathrooms: 3, monthlyRent: 5_000_000, status: "OCCUPIED" },
    { propertyId: abuja.id, unitNumber: "102", unitType: "4 Bedroom Duplex", bedrooms: 4, bathrooms: 3, monthlyRent: 5_000_000, status: "OCCUPIED" },
    { propertyId: abuja.id, unitNumber: "201", unitType: "3 Bedroom Flat", bedrooms: 3, bathrooms: 2, monthlyRent: 3_800_000, status: "OCCUPIED" },
    { propertyId: abuja.id, unitNumber: "202", unitType: "3 Bedroom Flat", bedrooms: 3, bathrooms: 2, monthlyRent: 3_800_000, status: "OCCUPIED" },
  ]).returning();

  // ── Tenants ─────────────────────────────────────────────────────────────────
  const tenantRows = await db.insert(tenants).values([
    { name: "Adaeze Okonkwo",   email: "adaeze@example.com",  phone: "08031234567", propertyId: lekki.id,  monthlyRent: 3_500_000, securityDeposit: 7_000_000 },
    { name: "Emeka Nwosu",      email: "emeka@example.com",   phone: "08041234567", propertyId: lekki.id,  monthlyRent: 3_500_000, securityDeposit: 7_000_000 },
    { name: "Fatima Aliyu",     email: "fatima@example.com",  phone: "08051234567", propertyId: lekki.id,  monthlyRent: 2_500_000, securityDeposit: 5_000_000 },
    { name: "Chidi Enterprises", email: "chidi@example.com", phone: "08061234567", propertyId: vi.id,    monthlyRent: 8_000_000, securityDeposit: 16_000_000 },
    { name: "Zenith Consulting", email: "zenith@example.com", phone: "08071234567", propertyId: vi.id,    monthlyRent: 8_000_000, securityDeposit: 16_000_000 },
    { name: "Bola Tinubu-James", email: "bola@example.com",  phone: "08081234567", propertyId: abuja.id, monthlyRent: 5_000_000, securityDeposit: 10_000_000 },
    { name: "Ngozi Adeyemi",    email: "ngozi@example.com",   phone: "08091234567", propertyId: abuja.id, monthlyRent: 5_000_000, securityDeposit: 10_000_000 },
    { name: "Tunde Bakare",     email: "tunde@example.com",   phone: "08001234567", propertyId: abuja.id, monthlyRent: 3_800_000, securityDeposit: 7_600_000 },
    { name: "Amina Suleiman",   email: "amina@example.com",   phone: "08011234567", propertyId: abuja.id, monthlyRent: 3_800_000, securityDeposit: 7_600_000 },
  ]).returning();

  const [t1, t2, t3, t4, t5, t6, t7, t8, t9] = tenantRows;

  // ── Leases ──────────────────────────────────────────────────────────────────
  const now = new Date();
  const y = now.getFullYear();

  const leaseRows = await db.insert(leases).values([
    { tenantId: t1.id, propertyId: lekki.id, unitId: lekkiUnits[0].id, startDate: new Date(`${y - 1}-01-01`), endDate: new Date(`${y + 1}-12-31`), monthlyRent: 3_500_000, securityDeposit: 7_000_000, status: "ACTIVE" },
    { tenantId: t2.id, propertyId: lekki.id, unitId: lekkiUnits[1].id, startDate: new Date(`${y - 1}-03-01`), endDate: new Date(`${y + 1}-02-28`), monthlyRent: 3_500_000, securityDeposit: 7_000_000, status: "ACTIVE" },
    { tenantId: t3.id, propertyId: lekki.id, unitId: lekkiUnits[2].id, startDate: new Date(`${y}-01-01`),     endDate: new Date(`${y + 1}-12-31`), monthlyRent: 2_500_000, securityDeposit: 5_000_000, status: "ACTIVE" },
    { tenantId: t4.id, propertyId: vi.id,    unitId: viUnits[0].id,    startDate: new Date(`${y - 1}-06-01`), endDate: new Date(`${y + 1}-05-31`), monthlyRent: 8_000_000, securityDeposit: 16_000_000, status: "ACTIVE" },
    { tenantId: t5.id, propertyId: vi.id,    unitId: viUnits[1].id,    startDate: new Date(`${y}-01-01`),     endDate: new Date(`${y + 1}-12-31`), monthlyRent: 8_000_000, securityDeposit: 16_000_000, status: "ACTIVE" },
    { tenantId: t6.id, propertyId: abuja.id, unitId: abujaUnits[0].id, startDate: new Date(`${y - 2}-01-01`), endDate: new Date(`${y}-12-31`),     monthlyRent: 5_000_000, securityDeposit: 10_000_000, status: "ACTIVE" },
    { tenantId: t7.id, propertyId: abuja.id, unitId: abujaUnits[1].id, startDate: new Date(`${y - 1}-07-01`), endDate: new Date(`${y + 1}-06-30`), monthlyRent: 5_000_000, securityDeposit: 10_000_000, status: "ACTIVE" },
    { tenantId: t8.id, propertyId: abuja.id, unitId: abujaUnits[2].id, startDate: new Date(`${y}-03-01`),     endDate: new Date(`${y + 2}-02-28`), monthlyRent: 3_800_000, securityDeposit: 7_600_000, status: "ACTIVE" },
    { tenantId: t9.id, propertyId: abuja.id, unitId: abujaUnits[3].id, startDate: new Date(`${y}-04-01`),     endDate: new Date(`${y + 2}-03-31`), monthlyRent: 3_800_000, securityDeposit: 7_600_000, status: "ACTIVE" },
  ]).returning();

  // ── Rent obligations (last 3 months per lease) ───────────────────────────────
  const obligationRows: (typeof rentObligations.$inferInsert)[] = [];
  for (const lease of leaseRows) {
    for (let m = 2; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const periodEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const isPast = m > 0;
      obligationRows.push({
        propertyId: lease.propertyId,
        unitId: lease.unitId ?? undefined,
        leaseId: lease.id,
        periodStart: d,
        periodEnd,
        dueDate: d,
        amountDue: lease.monthlyRent,
        amountPaid: isPast ? lease.monthlyRent : m === 0 ? lease.monthlyRent * 0.5 : 0,
        status: isPast ? "PAID" : "PARTIALLY_PAID",
      });
    }
  }
  const insertedObligations = await db.insert(rentObligations).values(obligationRows).returning();

  // ── Payments (one per paid obligation) ──────────────────────────────────────
  const paymentRows: (typeof payments.$inferInsert)[] = [];
  for (const ob of insertedObligations) {
    if (ob.amountPaid > 0) {
      paymentRows.push({
        propertyId: ob.propertyId,
        unitId: ob.unitId ?? undefined,
        leaseId: ob.leaseId,
        obligationId: ob.id,
        amount: ob.amountPaid,
        paymentDate: ob.dueDate,
        status: ob.amountPaid >= ob.amountDue ? "PAID" : "PARTIALLY_PAID",
        method: (["BANK_TRANSFER", "CASH", "CARD"] as const)[Math.floor(Math.random() * 3)],
      });
    }
  }
  await db.insert(payments).values(paymentRows);

  // ── Expenses ─────────────────────────────────────────────────────────────────
  await db.insert(expenses).values([
    { propertyId: lekki.id,  category: "REPAIRS",        description: "Roof leak repair — Block A",       amount: 850_000,   expenseDate: new Date(`${y}-02-10`), vendor: "Apex Contractors" },
    { propertyId: lekki.id,  category: "UTILITIES",      description: "Borehole pump replacement",        amount: 420_000,   expenseDate: new Date(`${y}-03-05`), vendor: "AquaTech Ltd" },
    { propertyId: lekki.id,  category: "SERVICE_CHARGE", description: "Estate management Q1",             amount: 1_200_000, expenseDate: new Date(`${y}-01-15`), vendor: "Lekki Estate Mgmt" },
    { propertyId: lekki.id,  category: "INSURANCE",      description: "Annual building insurance",        amount: 650_000,   expenseDate: new Date(`${y}-01-02`), vendor: "Leadway Assurance" },
    { propertyId: vi.id,     category: "REPAIRS",        description: "HVAC servicing — all floors",      amount: 2_300_000, expenseDate: new Date(`${y}-02-20`), vendor: "CoolAir Services" },
    { propertyId: vi.id,     category: "UTILITIES",      description: "Generator diesel — Feb",           amount: 980_000,   expenseDate: new Date(`${y}-02-28`), vendor: "Total Energies" },
    { propertyId: vi.id,     category: "MANAGEMENT_FEE", description: "Property management fee Q1",       amount: 3_500_000, expenseDate: new Date(`${y}-01-31`), vendor: "Prime Properties" },
    { propertyId: vi.id,     category: "INSURANCE",      description: "Commercial property insurance",    amount: 1_800_000, expenseDate: new Date(`${y}-01-05`), vendor: "AXA Mansard" },
    { propertyId: abuja.id,  category: "REPAIRS",        description: "Plumbing overhaul — Block 1",      amount: 560_000,   expenseDate: new Date(`${y}-03-12`), vendor: "Abuja Plumbers Co." },
    { propertyId: abuja.id,  category: "SERVICE_CHARGE", description: "Maitama estate levy Q1",           amount: 900_000,   expenseDate: new Date(`${y}-01-20`), vendor: "Maitama Residents Assoc." },
    { propertyId: abuja.id,  category: "UTILITIES",      description: "Solar inverter maintenance",       amount: 310_000,   expenseDate: new Date(`${y}-02-14`), vendor: "SolarMax NG" },
    { propertyId: ibeju.id,  category: "OTHER",          description: "Survey & beaconing renewal",       amount: 250_000,   expenseDate: new Date(`${y}-01-08`), vendor: "Surveyor Adebayo" },
  ]);

  // ── Property photos & videos ────────────────────────────────────────────────
  await db.insert(propertyPhotos).values([
    // Lekki
    { propertyId: lekki.id, url: svgPhoto("Lekki — Front Gate",    "#1e3a5f"), caption: "Front gate" },
    { propertyId: lekki.id, url: svgPhoto("Lekki — Block A",       "#2d6a4f"), caption: "Block A exterior" },
    { propertyId: lekki.id, url: svgPhoto("Lekki — Pool Area",     "#0077b6"), caption: "Swimming pool" },
    { propertyId: lekki.id, url: svgPhoto("Lekki — Living Room",   "#6d4c41"), caption: "Sample living room" },
    // VI
    { propertyId: vi.id,   url: svgPhoto("VI — Lobby",             "#37474f"), caption: "Ground floor lobby" },
    { propertyId: vi.id,   url: svgPhoto("VI — Floor 1 Office",    "#4a148c"), caption: "Floor 1 open plan" },
    { propertyId: vi.id,   url: svgPhoto("VI — Rooftop",           "#bf360c"), caption: "Rooftop terrace" },
    // Abuja
    { propertyId: abuja.id, url: svgPhoto("Maitama — Exterior",    "#1b5e20"), caption: "Building exterior" },
    { propertyId: abuja.id, url: svgPhoto("Maitama — Master Bed",  "#880e4f"), caption: "Master bedroom" },
    { propertyId: abuja.id, url: svgPhoto("Maitama — Kitchen",     "#e65100"), caption: "Kitchen" },
    // Ibeju land
    { propertyId: ibeju.id, url: svgPhoto("Ibeju — Plot Overview", "#827717"), caption: "Aerial plot view" },
    { propertyId: ibeju.id, url: svgPhoto("Ibeju — Survey Beacon", "#4e342e"), caption: "Survey beacon" },
  ]);

  // ── Property documents ───────────────────────────────────────────────────────
  await db.insert(documents).values([
    { propertyId: lekki.id,  name: "Certificate of Occupancy",   url: minimalPdf("C of O — Lekki Phase 1"),        mimeType: "application/pdf" },
    { propertyId: lekki.id,  name: "Building Approval",          url: minimalPdf("Building Approval — Lekki"),     mimeType: "application/pdf" },
    { propertyId: vi.id,     name: "Deed of Assignment",         url: minimalPdf("Deed of Assignment — VI"),       mimeType: "application/pdf" },
    { propertyId: vi.id,     name: "Fire Safety Certificate",    url: minimalPdf("Fire Safety Cert — VI"),         mimeType: "application/pdf" },
    { propertyId: abuja.id,  name: "Certificate of Occupancy",   url: minimalPdf("C of O — Maitama"),              mimeType: "application/pdf" },
    { propertyId: ibeju.id,  name: "Survey Plan",                url: minimalPdf("Survey Plan — Ibeju-Lekki"),     mimeType: "application/pdf" },
    { propertyId: ibeju.id,  name: "Certificate of Occupancy",   url: minimalPdf("C of O — Ibeju-Lekki"),         mimeType: "application/pdf" },
  ]);

  // ── Expense receipts ─────────────────────────────────────────────────────────
  const allExpenses = await db.query.expenses.findMany();
  for (const [i, expense] of allExpenses.entries()) {
    const colours = ["#b71c1c", "#1a237e", "#1b5e20", "#e65100", "#4a148c", "#006064"];
    const receiptUrl = i % 3 === 0
      ? minimalPdf(`Receipt — ${expense.description.slice(0, 25)}`)
      : svgPhoto(`Receipt\n${expense.amount.toLocaleString()}`, colours[i % colours.length]);
    await db.update(expenses).set({ receiptUrl }).where(eq(expenses.id, expense.id));
  }

  console.log("✅ Seed complete");
  console.log(`   ${leaseRows.length} leases`);
  console.log(`   ${insertedObligations.length} rent obligations`);
  console.log(`   ${paymentRows.length} payments`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
