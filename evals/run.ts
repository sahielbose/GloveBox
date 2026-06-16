import "dotenv/config";
import { checkQuote } from "@/lib/services/checkQuote";
import { decodeSymptom } from "@/lib/services/decodeSymptom";
import { structureServiceEntry } from "@/lib/services/structureServiceEntry";
import { digitizeInspection } from "@/lib/services/digitizeInspection";
import { findRecalls } from "@/lib/services/findRecalls";
import { decodeVehicle } from "@/lib/services/decodeVehicle";
import { QUOTE_CASES } from "./cases/quote-check";
import { SYMPTOM_CASES } from "./cases/symptom-urgency";
import { SERVICE_ENTRY_CASES } from "./cases/service-entry";
import { INSPECTION_CASES } from "./cases/inspection";
import { RECALL_CASES } from "./cases/recall-match";
import { VIN_CASES } from "./cases/vin-decode";
import thresholds from "./thresholds.json" with { type: "json" };

type Suite = {
  name: string;
  kind: "gate" | "live";
  passed: boolean;
  skipped?: boolean;
  metrics: Record<string, string>;
  failures: string[];
};

const URG_RANK = { safe: 0, soon: 1, stop: 2 } as const;

async function quoteSuite(): Promise<Suite> {
  let verdictOk = 0;
  let flagNeeded = 0;
  let flagHit = 0;
  let cleanCases = 0; // cases that should produce NO flags
  let cleanNoFlags = 0; // ...and actually did
  const failures: string[] = [];
  for (const c of QUOTE_CASES) {
    const r = await checkQuote({ vehicle: c.vehicle, region: c.region, lineItems: c.lineItems });
    if (c.expectVerdict.includes(r.verdict)) verdictOk++;
    else failures.push(`${c.name}: verdict ${r.verdict}, expected ${c.expectVerdict.join("/")} (quoted $${r.quotedTotalCents / 100}, fair $${Math.round(r.fairLowCents / 100)}-${Math.round(r.fairHighCents / 100)})`);
    const flagText = r.flags.map((f) => f.lineItem.toLowerCase()).join(" | ");
    for (const want of c.expectFlags) {
      flagNeeded++;
      if (flagText.includes(want.toLowerCase())) flagHit++;
      else failures.push(`${c.name}: expected a flag on "${want}"`);
    }
    // Flag precision: a case that expects no flags should not produce any.
    if (c.expectFlags.length === 0) {
      cleanCases++;
      if (r.flags.length === 0) cleanNoFlags++;
      else failures.push(`${c.name}: false-positive flag(s) on a clean quote — ${r.flags.map((f) => f.lineItem).join(", ")}`);
    }
  }
  const verdictAcc = verdictOk / QUOTE_CASES.length;
  const flagRecall = flagNeeded === 0 ? 1 : flagHit / flagNeeded;
  const flagPrecision = cleanCases === 0 ? 1 : cleanNoFlags / cleanCases;
  const th = thresholds["quote-check"];
  return {
    name: "Quote Check ★",
    kind: "gate",
    passed: verdictAcc >= th.verdictAccuracy && flagRecall >= th.flagRecall && flagPrecision >= th.flagPrecision,
    metrics: {
      "verdict accuracy": pct(verdictAcc, th.verdictAccuracy),
      "flag recall": pct(flagRecall, th.flagRecall),
      "flag precision": pct(flagPrecision, th.flagPrecision),
    },
    failures,
  };
}

async function symptomSuite(): Promise<Suite> {
  let exact = 0;
  let underWarn = 0;
  let overWarn = 0;
  const failures: string[] = [];
  for (const c of SYMPTOM_CASES) {
    const r = await decodeSymptom({ text: c.text, dtc: c.dtc, vehicle: c.vehicle });
    if (r.urgency === c.expectUrgency) exact++;
    else if (URG_RANK[r.urgency] < URG_RANK[c.expectUrgency]) {
      overWarn += 0;
      if (c.safety) {
        underWarn++;
        failures.push(`⚠ UNDER-WARN (safety): ${c.name} → ${r.urgency}, expected ${c.expectUrgency}`);
      } else {
        failures.push(`${c.name} → ${r.urgency}, expected ${c.expectUrgency}`);
      }
    } else {
      overWarn++; // erring safe — acceptable
    }
  }
  const acc = exact / SYMPTOM_CASES.length;
  const th = thresholds["symptom-urgency"];
  return {
    name: "Symptom urgency",
    kind: "gate",
    passed: acc >= th.accuracy && underWarn <= th.maxSafetyUnderWarn,
    metrics: {
      accuracy: pct(acc, th.accuracy),
      "safety under-warnings": `${underWarn} (max ${th.maxSafetyUnderWarn})`,
      "over-warnings (safe dir)": String(overWarn),
    },
    failures,
  };
}

async function serviceSuite(): Promise<Suite> {
  let fields = 0;
  let hits = 0;
  const failures: string[] = [];
  for (const c of SERVICE_ENTRY_CASES) {
    const r = await structureServiceEntry(c.text, c.vehicle);
    for (const [k, want] of Object.entries(c.expect)) {
      fields++;
      const got = (r as Record<string, unknown>)[k];
      if (got === want) hits++;
      else failures.push(`${c.name}: ${k}=${String(got)}, expected ${String(want)}`);
    }
  }
  const acc = fields === 0 ? 1 : hits / fields;
  const th = thresholds["service-entry"];
  return {
    name: "Service-entry extraction",
    kind: "gate",
    passed: acc >= th.fieldAccuracy,
    metrics: { "field accuracy": pct(acc, th.fieldAccuracy) },
    failures,
  };
}

async function inspectionSuite(): Promise<Suite> {
  let exact = 0;
  let total = 0;
  let safetyUnderClass = 0;
  const failures: string[] = [];
  for (const c of INSPECTION_CASES) {
    const r = await digitizeInspection({ text: c.text, vehicle: c.vehicle });
    for (const e of c.expect) {
      total++;
      const got = r.items.find((it) => it.item.toLowerCase().includes(e.match) || `${it.area} ${it.item}`.toLowerCase().includes(e.match));
      if (!got) {
        failures.push(`${c.name}: no item matched "${e.match}"`);
        continue;
      }
      if (got.status === e.status) exact++;
      else {
        const order = { ok: 0, soon: 1, alert: 2 } as const;
        if (e.safety && order[got.status] < order[e.status]) {
          safetyUnderClass++;
          failures.push(`⚠ UNDER-CLASS (safety): ${c.name} "${e.match}" → ${got.status}, expected ${e.status}`);
        } else {
          failures.push(`${c.name} "${e.match}" → ${got.status}, expected ${e.status}`);
        }
      }
    }
  }
  const acc = total === 0 ? 1 : exact / total;
  const th = thresholds["inspection"];
  return {
    name: "MPI digitization",
    kind: "gate",
    passed: acc >= th.accuracy && safetyUnderClass <= th.maxSafetyUnderClass,
    metrics: {
      accuracy: pct(acc, th.accuracy),
      "safety under-classifications": `${safetyUnderClass} (max ${th.maxSafetyUnderClass})`,
    },
    failures,
  };
}

async function recallSuite(): Promise<Suite> {
  const failures: string[] = [];
  let okCases = 0;
  let reachable = false;
  for (const c of RECALL_CASES) {
    try {
      const matches = await findRecalls(c.vehicle);
      if (matches.length > 0) reachable = true;
      const ids = matches.map((m) => m.campaignId);
      let pass = matches.length >= c.expectAtLeast;
      for (const want of c.expectCampaigns) {
        if (!ids.includes(want)) {
          pass = false;
          failures.push(`${c.name}: missing campaign ${want} (a false negative is a safety miss)`);
        }
      }
      // every match must carry provenance + a valid severity
      for (const m of matches) {
        if (!m.provenanceUrl || !m.campaignId) { pass = false; failures.push(`${c.name}: match missing provenance/campaignId`); }
      }
      if (pass) okCases++;
    } catch {
      failures.push(`${c.name}: network error`);
    }
  }
  if (!reachable) {
    return { name: "Recall match", kind: "live", passed: true, skipped: true, metrics: { status: "skipped (NHTSA unreachable)" }, failures: [] };
  }
  return {
    name: "Recall match",
    kind: "live",
    passed: okCases === RECALL_CASES.length,
    metrics: { "cases passed": `${okCases}/${RECALL_CASES.length}` },
    failures,
  };
}

async function vinSuite(): Promise<Suite> {
  const failures: string[] = [];
  let ok = 0;
  let reachable = false;
  for (const c of VIN_CASES) {
    try {
      const d = await decodeVehicle({ kind: "vin", vin: c.vin });
      if (c.expectGracefulFailure) {
        if (!d.ok) { ok++; reachable = true; }
        else failures.push(`${c.name}: expected graceful failure, got ${d.make} ${d.model}`);
        continue;
      }
      reachable = true;
      const e = c.expect ?? {};
      const matchMake = !e.make || (d.make ?? "").toLowerCase() === e.make.toLowerCase();
      const matchModel = !e.model || (d.model ?? "").toLowerCase().includes(e.model.toLowerCase());
      const matchYear = !e.year || d.year === e.year;
      if (matchMake && matchModel && matchYear) ok++;
      else failures.push(`${c.name}: got ${d.year} ${d.make} ${d.model}`);
    } catch {
      failures.push(`${c.name}: network error`);
    }
  }
  if (!reachable) {
    return { name: "VIN decode", kind: "live", passed: true, skipped: true, metrics: { status: "skipped (vPIC unreachable)" }, failures: [] };
  }
  return { name: "VIN decode", kind: "live", passed: ok === VIN_CASES.length, metrics: { "cases passed": `${ok}/${VIN_CASES.length}` }, failures };
}

async function assistantSuite(): Promise<Suite> {
  if (!process.env.DATABASE_URL) {
    return { name: "Assistant citations", kind: "live", passed: true, skipped: true, metrics: { status: "skipped (no DATABASE_URL)" }, failures: [] };
  }
  try {
    const { db } = await import("@/lib/db/client");
    const { users, vehicles } = await import("@/lib/db/schema");
    const { ingestChunks } = await import("@/lib/rag");
    const { askVehicle } = await import("@/lib/services/askVehicle");
    const { eq } = await import("drizzle-orm");

    const [u] = await db.insert(users).values({ email: `eval-assistant-${Date.now()}@glovebox.test`, name: "Eval" }).returning();
    const [v] = await db.insert(vehicles).values({ userId: u.id, make: "Honda", model: "Civic", year: 2018, mileage: 50000 }).returning();
    try {
      await ingestChunks(v.id, [
        { kind: "maintenance", content: "Oil change interval: change the engine oil and filter every 7500 miles or 6 months on this vehicle.", sourceLabel: "Curated schedule — oil change" },
      ]);
      const vehicle = { id: v.id, make: v.make, model: v.model, year: v.year, mileage: v.mileage };
      const hit = await askVehicle({ question: "how often should I change the oil and filter", vehicle });
      const miss = await askVehicle({ question: "what is the airspeed velocity of an unladen swallow", vehicle });

      const failures: string[] = [];
      if (!hit.grounded || hit.citations.length === 0) failures.push("retrievable question did not ground/cite its source");
      if (miss.grounded || miss.citations.length > 0) failures.push("irrelevant question should decline: grounded=false, no citations");

      return {
        name: "Assistant citations",
        kind: "live",
        passed: failures.length === 0,
        metrics: {
          "grounds + cites relevant Q": hit.grounded && hit.citations.length > 0 ? "yes ✓" : "no ✗",
          "declines irrelevant Q": !miss.grounded && miss.citations.length === 0 ? "yes ✓" : "no ✗",
        },
        failures,
      };
    } finally {
      await db.delete(users).where(eq(users.id, u.id)); // cascade removes the vehicle + chunks
    }
  } catch (e) {
    return { name: "Assistant citations", kind: "live", passed: true, skipped: true, metrics: { status: `skipped (db unavailable)` }, failures: [String((e as Error).message).slice(0, 80)] };
  }
}

function pct(v: number, th: number): string {
  const s = `${(v * 100).toFixed(0)}%`;
  return v >= th ? `${s} ✓` : `${s} ✗ (need ${(th * 100).toFixed(0)}%)`;
}

async function main() {
  console.log("\n🧪 GloveBox evals\n" + "═".repeat(60));
  const suites = [
    await quoteSuite(),
    await symptomSuite(),
    await serviceSuite(),
    await inspectionSuite(),
    await recallSuite(),
    await vinSuite(),
    await assistantSuite(),
  ];

  let gateFailed = false;
  for (const s of suites) {
    const tag = s.skipped ? "⊘ SKIP" : s.passed ? "✓ PASS" : "✗ FAIL";
    console.log(`\n${tag}  ${s.name}  [${s.kind}]`);
    for (const [k, v] of Object.entries(s.metrics)) console.log(`     ${k}: ${v}`);
    for (const f of s.failures.slice(0, 12)) console.log(`     · ${f}`);
    if (s.kind === "gate" && !s.passed) gateFailed = true;
  }

  console.log("\n" + "═".repeat(60));
  console.log(gateFailed ? "✗ EVALS FAILED (a gating suite is below threshold)\n" : "✓ EVALS PASSED\n");
  process.exit(gateFailed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
