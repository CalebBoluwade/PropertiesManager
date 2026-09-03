import { sqliteTable, text, integer, real, unique, index } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

// --- ENUMS (Mapped as TypeScript constants for type safety) ---
export const propertyStatusEnum = ["OCCUPIED", "VACANT", "PARTIALLY_OCCUPIED", "MAINTENANCE"] as const;
export const unitStatusEnum = ["OCCUPIED", "VACANT", "MAINTENANCE"] as const;
export const leaseStatusEnum = ["ACTIVE", "EXPIRED", "TERMINATED", "PENDING"] as const;
export const paymentStatusEnum = ["PAID", "PENDING", "OVERDUE", "PARTIALLY_PAID", "DUE"] as const;
export const paymentMethodEnum = ["CASH", "BANK_TRANSFER", "CARD", "CHEQUE", "OTHER"] as const;

// --- TABLES ---

export const propertyTypes = sqliteTable("property_types", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const propertyTypeFields = sqliteTable("property_type_fields", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  propertyTypeId: text("property_type_id").notNull().references(() => propertyTypes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  key: text("key").notNull(),
  fieldType: text("field_type").notNull(), // text, number, date, boolean, select
  required: integer("required", { mode: "boolean" }).default(false),
  options: text("options", { mode: "json" }),
}, (t) => ({
  unq: unique().on(t.propertyTypeId, t.key),
}));

export const properties = sqliteTable("properties", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  city: text("city"),
  state: text("state"),
  address: text("address").notNull(),
  country: text("country").notNull().default("Nigeria"),
  propertyTypeId: text("property_type_id").notNull().references(() => propertyTypes.id),
  numberOfUnits: integer("number_of_units").notNull().default(0),
  purchasePrice: real("purchase_price"),
  currentValue: real("current_value"),
  currency: text("currency").notNull().default("NGN"),
  status: text("status", { enum: propertyStatusEnum }).notNull().default("VACANT"),
  acquisitionDate: integer("acquisition_date", { mode: "timestamp" }),
  notes: text("notes"),
  
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const propertyFieldValues = sqliteTable("property_field_values", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  propertyId: text("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  fieldId: text("field_id").notNull().references(() => propertyTypeFields.id, { onDelete: "cascade" }),
  value: text("value", { mode: "json" }).notNull(),
}, (t) => ({
  unq: unique().on(t.propertyId, t.fieldId),
}));

export const units = sqliteTable("units", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  propertyId: text("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  unitNumber: text("unit_number").notNull(),
  unitType: text("unit_type"),
  floor: text("floor"),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  size: real("size"),
  monthlyRent: real("monthly_rent"),
  currency: text("currency").notNull().default("NGN"),
  status: text("status", { enum: unitStatusEnum }).notNull().default("VACANT"),
  notes: text("notes"),
}, (t) => ({
  unq: unique().on(t.propertyId, t.unitNumber),
}));

export const tenants = sqliteTable("tenants", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  propertyId: text("property_id").notNull().references(() => properties.id),
  monthlyRent: real("monthly_rent").notNull(),
  securityDeposit: real("security_deposit").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const leases = sqliteTable("leases", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  propertyId: text("property_id").notNull().references(() => properties.id),
  unitId: text("unit_id").references(() => units.id),
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }).notNull(),
  monthlyRent: real("monthly_rent").notNull(),
  securityDeposit: real("security_deposit"),
  currency: text("currency").notNull().default("NGN"),
  status: text("status", { enum: leaseStatusEnum }).notNull().default("PENDING"),
  notes: text("notes"),
});

export const rentObligations = sqliteTable("rent_obligations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  propertyId: text("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  unitId: text("unit_id").references(() => units.id),
  leaseId: text("lease_id").notNull().references(() => leases.id),
  periodStart: integer("period_start", { mode: "timestamp" }).notNull(),
  periodEnd: integer("period_end", { mode: "timestamp" }).notNull(),
  dueDate: integer("due_date", { mode: "timestamp" }).notNull(),
  amountDue: real("amount_due").notNull(),
  amountPaid: real("amount_paid").notNull().default(0),
  status: text("status", { enum: paymentStatusEnum }).notNull().default("DUE"),
}, (t) => ({
  dueDateStatusIdx: index("due_date_status_idx").on(t.dueDate, t.status),
}));

export const payments = sqliteTable("payments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  propertyId: text("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  unitId: text("unit_id").references(() => units.id),
  leaseId: text("lease_id").references(() => leases.id),
  obligationId: text("obligation_id").references(() => rentObligations.id),
  amount: real("amount").notNull(),
  paymentDate: integer("payment_date", { mode: "timestamp" }),
  status: text("status", { enum: paymentStatusEnum }).notNull().default("PENDING"),
  method: text("method", { enum: paymentMethodEnum }).notNull().default("BANK_TRANSFER"),
  reference: text("reference"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (t) => ({
  paymentDateIdx: index("payment_date_idx").on(t.paymentDate),
}));

export const expenses = sqliteTable("expenses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  propertyId: text("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  unitId: text("unit_id").references(() => units.id),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("NGN"),
  expenseDate: integer("expense_date", { mode: "timestamp" }).notNull(),
  vendor: text("vendor"),
  reference: text("reference"),
  receiptUrl: text("receipt_url"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (t) => ({
  expenseDateIdx: index("expense_date_idx").on(t.expenseDate),
}));

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  propertyId: text("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  mimeType: text("mime_type"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const propertyPhotos = sqliteTable("property_photos", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  propertyId: text("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  caption: text("caption"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

// --- RELATIONS ---
export const propertyRelations = relations(properties, ({ many, one }) => ({
  propertyType: one(propertyTypes, { fields: [properties.propertyTypeId], references: [propertyTypes.id] }),
  units: many(units),
  tenants: many(tenants),
  expenses: many(expenses),
  payments: many(payments),
  obligations: many(rentObligations),
  documents: many(documents),
  photos: many(propertyPhotos),
  customValues: many(propertyFieldValues),
}));

export const unitRelations = relations(units, ({ one }) => ({
  property: one(properties, { fields: [units.propertyId], references: [properties.id] }),
}));

export const tenantRelations = relations(tenants, ({ one, many }) => ({
  property: one(properties, { fields: [tenants.propertyId], references: [properties.id] }),
  leases: many(leases),
}));

export const expenseRelations = relations(expenses, ({ one }) => ({
  property: one(properties, { fields: [expenses.propertyId], references: [properties.id] }),
  unit: one(units, { fields: [expenses.unitId], references: [units.id] }),
}));

export const paymentRelations = relations(payments, ({ one }) => ({
  property: one(properties, { fields: [payments.propertyId], references: [properties.id] }),
  unit: one(units, { fields: [payments.unitId], references: [units.id] }),
  lease: one(leases, { fields: [payments.leaseId], references: [leases.id] }),
  obligation: one(rentObligations, { fields: [payments.obligationId], references: [rentObligations.id] }),
}));

export const rentObligationRelations = relations(rentObligations, ({ one, many }) => ({
  property: one(properties, { fields: [rentObligations.propertyId], references: [properties.id] }),
  unit: one(units, { fields: [rentObligations.unitId], references: [units.id] }),
  lease: one(leases, { fields: [rentObligations.leaseId], references: [leases.id] }),
  payments: many(payments),
}));

export const documentRelations = relations(documents, ({ one }) => ({
  property: one(properties, { fields: [documents.propertyId], references: [properties.id] }),
}));

export const propertyPhotoRelations = relations(propertyPhotos, ({ one }) => ({
  property: one(properties, { fields: [propertyPhotos.propertyId], references: [properties.id] }),
}));

export const propertyFieldValueRelations = relations(propertyFieldValues, ({ one }) => ({
  property: one(properties, { fields: [propertyFieldValues.propertyId], references: [properties.id] }),
  field: one(propertyTypeFields, { fields: [propertyFieldValues.fieldId], references: [propertyTypeFields.id] }),
}));

export const propertyTypeRelations = relations(propertyTypes, ({ many }) => ({
  properties: many(properties),
  fields: many(propertyTypeFields),
}));

export const propertyTypeFieldRelations = relations(propertyTypeFields, ({ one }) => ({
  propertyType: one(propertyTypes, { fields: [propertyTypeFields.propertyTypeId], references: [propertyTypes.id] }),
}));

export const leaseRelations = relations(leases, ({ one, many }) => ({
  tenant: one(tenants, { fields: [leases.tenantId], references: [tenants.id] }),
  property: one(properties, { fields: [leases.propertyId], references: [properties.id] }),
  unit: one(units, { fields: [leases.unitId], references: [units.id] }),
  obligations: many(rentObligations),
  payments: many(payments),
}));

// (You can add relation blocks for Units, Tenants, Leases, etc., following the same pattern)