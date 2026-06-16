import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  real,
  uuid,
  boolean,
  primaryKey,
  index,
  vector,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ──────────────────────────────────────────────────────────────────────────
 * Auth.js (NextAuth) tables — standard @auth/drizzle-adapter Postgres schema.
 * Database session strategy: sessions live in Postgres, no passwords stored.
 * ────────────────────────────────────────────────────────────────────────── */

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  // GloveBox preferences
  reminderChannel: text("reminderChannel").default("email").notNull(), // email | sms | none
  digestFrequency: text("digestFrequency").default("weekly").notNull(), // weekly | monthly | off
  phone: text("phone"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

/* ──────────────────────────────────────────────────────────────────────────
 * GloveBox domain (data model §8). Money is stored as integer cents.
 * status/severity/urgency share one vocabulary: ok | soon | alert (+ urgency
 * safe|soon|stop, verdict fair|high|overpriced) — see lib/status.ts.
 * ────────────────────────────────────────────────────────────────────────── */

export const vehicles = pgTable(
  "vehicle",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    vin: text("vin"),
    year: integer("year"),
    make: text("make").notNull(),
    model: text("model").notNull(),
    trim: text("trim"),
    engine: text("engine"),
    mileage: integer("mileage").default(0).notNull(),
    nickname: text("nickname"),
    isPrimary: boolean("isPrimary").default(false).notNull(),
    // raw vPIC decode + FuelEconomy specs, kept for the vehicle profile
    specs: jsonb("specs").$type<Record<string, unknown>>(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (v) => [index("vehicle_user_idx").on(v.userId)],
);

export const serviceRecords = pgTable(
  "service_record",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vehicleId: uuid("vehicleId")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    date: timestamp("date", { mode: "date" }).notNull(),
    mileage: integer("mileage"),
    type: text("type").notNull(), // oil_change | brakes | tires | ...
    description: text("description"),
    parts: jsonb("parts").$type<{ name: string; partNumber?: string }[]>(),
    laborHours: real("laborHours"),
    costCents: integer("costCents"),
    source: text("source").default("manual").notNull(), // manual | voice | quote_check | maintenance | import
    receiptUrl: text("receiptUrl"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (r) => [index("service_vehicle_idx").on(r.vehicleId)],
);

export const maintenanceItems = pgTable(
  "maintenance_item",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vehicleId: uuid("vehicleId")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    service: text("service").notNull(),
    intervalMiles: integer("intervalMiles"),
    intervalMonths: integer("intervalMonths"),
    dueMileage: integer("dueMileage"),
    dueDate: timestamp("dueDate", { mode: "date" }),
    status: text("status").default("ok").notNull(), // ok | soon | alert
    source: text("source").default("curated-intervals").notNull(),
    completedAt: timestamp("completedAt", { mode: "date" }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (m) => [index("maint_vehicle_idx").on(m.vehicleId)],
);

export const recallMatches = pgTable(
  "recall_match",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vehicleId: uuid("vehicleId")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    source: text("source").notNull(), // NHTSA | CPSC
    campaignId: text("campaignId").notNull(),
    component: text("component"),
    summary: text("summary").notNull(),
    severity: text("severity").default("soon").notNull(), // ok | soon | alert
    remedy: text("remedy"),
    consequence: text("consequence"),
    status: text("status").default("open").notNull(), // open | remedy_available | closed (official only)
    provenanceUrl: text("provenanceUrl").notNull(),
    reportDate: text("reportDate"),
    notified: boolean("notified").default(false).notNull(),
    foundAt: timestamp("foundAt", { mode: "date" }).defaultNow().notNull(),
  },
  (r) => [
    index("recall_vehicle_idx").on(r.vehicleId),
    // a vehicle should only ever hold one row per official campaign
    index("recall_campaign_idx").on(r.vehicleId, r.source, r.campaignId),
  ],
);

export const quoteChecks = pgTable(
  "quote_check",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vehicleId: uuid("vehicleId")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    shopName: text("shopName"),
    region: text("region"), // US region key (e.g. "CA", "national")
    lineItems: jsonb("lineItems").$type<QuoteLineItem[]>().notNull(),
    totalCents: integer("totalCents").notNull(),
    verdict: text("verdict").notNull(), // fair | high | overpriced
    fairLowCents: integer("fairLowCents").notNull(),
    fairHighCents: integer("fairHighCents").notNull(),
    flags: jsonb("flags").$type<QuoteFlag[]>().notNull(),
    summary: text("summary"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (q) => [index("quote_vehicle_idx").on(q.vehicleId)],
);

export const symptomReports = pgTable(
  "symptom_report",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vehicleId: uuid("vehicleId")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    input: text("input"),
    dtcCode: text("dtcCode"),
    causes: jsonb("causes").$type<SymptomCause[]>().notNull(),
    urgency: text("urgency").notNull(), // safe | soon | stop
    estLowCents: integer("estLowCents"),
    estHighCents: integer("estHighCents"),
    summary: text("summary"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (s) => [index("symptom_vehicle_idx").on(s.vehicleId)],
);

export const documents = pgTable(
  "document",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vehicleId: uuid("vehicleId")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // manual | insurance | registration | receipt | other
    fileName: text("fileName"),
    fileUrl: text("fileUrl"),
    extractedText: text("extractedText"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (d) => [index("doc_vehicle_idx").on(d.vehicleId)],
);

// RAG store. Chunks are scoped per-vehicle. `kind` distinguishes the three RAG
// sources: owner documents, cached recall/safety data, curated maintenance schedules.
export const chunks = pgTable(
  "chunk",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vehicleId: uuid("vehicleId")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    documentId: uuid("documentId").references(() => documents.id, {
      onDelete: "cascade",
    }),
    kind: text("kind").notNull(), // document | recall | safety | maintenance
    content: text("content").notNull(),
    sourceLabel: text("sourceLabel").notNull(), // human citation label
    sourceUrl: text("sourceUrl"),
    embedding: vector("embedding", { dimensions: 1536 }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (c) => [
    index("chunk_vehicle_idx").on(c.vehicleId),
    index("chunk_embedding_idx").using(
      "hnsw",
      c.embedding.op("vector_cosine_ops"),
    ),
  ],
);

export const reminders = pgTable(
  "reminder",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vehicleId: uuid("vehicleId").references(() => vehicles.id, {
      onDelete: "cascade",
    }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // maintenance | recall | custom | digest
    channel: text("channel").default("email").notNull(), // email | sms | calendar
    title: text("title").notNull(),
    body: text("body"),
    scheduleAt: timestamp("scheduleAt", { mode: "date" }).notNull(),
    status: text("status").default("draft").notNull(), // draft | scheduled | sent | cancelled
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (r) => [index("reminder_user_idx").on(r.userId)],
);

/* ── Relations (for typed `db.query` joins) ───────────────────────────────── */

export const usersRelations = relations(users, ({ many }) => ({
  vehicles: many(vehicles),
  reminders: many(reminders),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  user: one(users, { fields: [vehicles.userId], references: [users.id] }),
  serviceRecords: many(serviceRecords),
  maintenanceItems: many(maintenanceItems),
  recallMatches: many(recallMatches),
  quoteChecks: many(quoteChecks),
  symptomReports: many(symptomReports),
  documents: many(documents),
  chunks: many(chunks),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  vehicle: one(vehicles, {
    fields: [documents.vehicleId],
    references: [vehicles.id],
  }),
  chunks: many(chunks),
}));

/* ── Shared JSON column types ─────────────────────────────────────────────── */

export type QuoteLineItem = {
  description: string;
  part?: string;
  laborHours?: number;
  priceCents: number;
  category?: string; // labor | part | fee | shop_supplies | diagnostic
};

export type QuoteFlag = {
  lineItem: string;
  reason: string;
  severity: "soon" | "alert";
  fairLowCents?: number;
  fairHighCents?: number;
};

export type SymptomCause = {
  cause: string;
  likelihood: "high" | "medium" | "low";
  note?: string;
};
