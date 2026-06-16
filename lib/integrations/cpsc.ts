import { getJson } from "./http";
import type { Status } from "@/lib/status";

/**
 * CPSC SaferProducts recalls — covers consumer products: tires, child seats,
 * and vehicle accessories (NOT whole vehicles, which are NHTSA's domain). Queried
 * by keyword; results are clearly labeled and only surfaced when they plausibly
 * match the owner's context. No key required.
 */
const BASE = "https://www.saferproducts.gov/RestWebServices/Recall";

export type CpscRecall = {
  source: "CPSC";
  campaignId: string;
  component: string;
  summary: string;
  remedy: string;
  severity: Status;
  provenanceUrl: string;
  reportDate?: string;
};

type RawCpscRecall = {
  RecallID: number | string;
  RecallNumber?: string;
  RecallDate?: string;
  Title?: string;
  Description?: string;
  URL?: string;
  Products?: { Name?: string; Type?: string }[];
  Hazards?: { Name?: string }[];
  Remedies?: { Name?: string }[];
};

function severityFromHazards(r: RawCpscRecall): Status {
  const hz = (r.Hazards ?? []).map((h) => (h.Name ?? "").toLowerCase()).join(" ");
  if (/fire|burn|crash|laceration|death|strangulation/.test(hz)) return "alert";
  return "soon";
}

export async function searchCpscRecalls(query: string): Promise<CpscRecall[]> {
  const url = `${BASE}?format=json&RecallTitle=${encodeURIComponent(query)}`;
  const res = await getJson<RawCpscRecall[]>(url, { timeoutMs: 15000 });
  if (!res.ok || !Array.isArray(res.data)) return [];
  return res.data.slice(0, 25).map((r) => ({
    source: "CPSC" as const,
    campaignId: String(r.RecallNumber ?? r.RecallID),
    component: r.Products?.[0]?.Type ?? r.Products?.[0]?.Name ?? "Consumer product",
    summary: [r.Title, r.Description].filter(Boolean).join(" — ").slice(0, 600),
    remedy: r.Remedies?.[0]?.Name ?? "See CPSC notice for remedy details.",
    severity: severityFromHazards(r),
    provenanceUrl: r.URL ?? "https://www.cpsc.gov/Recalls",
    reportDate: r.RecallDate,
  }));
}
