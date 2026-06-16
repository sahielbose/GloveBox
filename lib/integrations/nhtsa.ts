import { getJson } from "./http";
import type { Status } from "@/lib/status";

const VPIC = "https://vpic.nhtsa.dot.gov/api/vehicles";
const API = "https://api.nhtsa.gov";

/* ── VIN decode (vPIC) ─────────────────────────────────────────────────────── */

export type VehicleDecode = {
  vin?: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  engine?: string;
  bodyClass?: string;
  fuelType?: string;
  raw: Record<string, string>;
  errors: string[];
};

type VpicRow = Record<string, string>;

function titleCase(s?: string): string | undefined {
  if (!s) return undefined;
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function mapDecode(r: VpicRow, vin?: string): VehicleDecode {
  const errorText = r.ErrorText && r.ErrorText !== "0 - VIN decoded clean. Check Digit (9th position) is correct" ? r.ErrorText : "";
  const errors = (r.ErrorCode && r.ErrorCode !== "0")
    ? errorText.split(";").map((e) => e.trim()).filter(Boolean)
    : [];
  const engineBits = [r.DisplacementL ? `${Number(r.DisplacementL).toFixed(1)}L` : "", r.EngineCylinders ? `${r.EngineCylinders}-cyl` : "", r.EngineConfiguration ?? ""]
    .filter(Boolean)
    .join(" ")
    .trim();
  return {
    vin,
    year: r.ModelYear ? Number(r.ModelYear) : undefined,
    make: titleCase(r.Make),
    model: r.Model || undefined,
    trim: r.Trim || r.Series || undefined,
    engine: engineBits || undefined,
    bodyClass: r.BodyClass || undefined,
    fuelType: r.FuelTypePrimary || undefined,
    raw: r,
    errors,
  };
}

/** Decode a full 17-char VIN. Returns a partial decode on edge cases rather than throwing. */
export async function decodeVin(vin: string): Promise<VehicleDecode | null> {
  const clean = vin.trim().toUpperCase();
  const res = await getJson<{ Results: VpicRow[] }>(
    `${VPIC}/DecodeVinValues/${encodeURIComponent(clean)}?format=json`,
  );
  if (!res.ok || !res.data.Results?.[0]) return null;
  return mapDecode(res.data.Results[0], clean);
}

/** Decode a partial VIN (e.g. first 11 chars) with a model-year hint. */
export async function decodePartialVin(
  partial: string,
  year?: number,
): Promise<VehicleDecode | null> {
  const clean = partial.trim().toUpperCase();
  const yq = year ? `&modelyear=${year}` : "";
  const res = await getJson<{ Results: VpicRow[] }>(
    `${VPIC}/DecodeVinValues/${encodeURIComponent(clean)}?format=json${yq}`,
  );
  if (!res.ok || !res.data.Results?.[0]) return null;
  return mapDecode(res.data.Results[0], clean);
}

/* ── Year / make / model pickers (vPIC) ────────────────────────────────────── */

export async function getMakesForYear(year: number): Promise<string[]> {
  // vPIC has no year-scoped "all makes"; use the canonical make list and let the
  // model lookup constrain by year.
  const res = await getJson<{ Results: { Make_Name: string }[] }>(
    `${VPIC}/GetMakesForVehicleType/car?format=json`,
  );
  if (!res.ok) return [];
  return Array.from(new Set(res.data.Results.map((r) => titleCase(r.Make_Name)!))).sort();
}

export async function getModelsForMakeYear(
  make: string,
  year: number,
): Promise<string[]> {
  const res = await getJson<{ Results: { Model_Name: string }[] }>(
    `${VPIC}/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`,
  );
  if (!res.ok) return [];
  return Array.from(new Set(res.data.Results.map((r) => r.Model_Name))).sort();
}

/* ── Recalls (api.nhtsa.gov) ───────────────────────────────────────────────── */

export type NhtsaRecall = {
  source: "NHTSA";
  campaignId: string;
  component: string;
  summary: string;
  consequence: string;
  remedy: string;
  notes?: string;
  reportDate?: string;
  severity: Status; // ok | soon | alert
  parkIt: boolean;
  parkOutside: boolean;
  provenanceUrl: string;
};

type RawNhtsaRecall = {
  NHTSACampaignNumber: string;
  Component: string;
  Summary: string;
  Consequence: string;
  Remedy: string;
  Notes?: string;
  ReportReceivedDate?: string;
  parkIt?: boolean;
  parkOutSide?: boolean;
};

function recallSeverity(r: RawNhtsaRecall): Status {
  // parkIt / parkOutSide are NHTSA's own do-not-drive / fire-risk flags.
  if (r.parkIt || r.parkOutSide) return "alert";
  // Otherwise raise the genuinely "don't wait" classes (fire, sudden loss of
  // control, airbag rupture/non-deployment) above the default "soon".
  const text = `${r.Component ?? ""} ${r.Consequence ?? ""} ${r.Summary ?? ""}`.toLowerCase();
  if (
    /\bfire\b|catch (on )?fire|loss of (vehicle )?control|without warning|airbag.*(rupture|not deploy|fail to deploy|inadvertent)|brake (failure|loss|can fail)|loss of brak|steering (loss|failure)|injury or death/.test(
      text,
    )
  ) {
    return "alert";
  }
  return "soon";
}

export async function getRecallsByYMM(
  make: string,
  model: string,
  year: number,
): Promise<NhtsaRecall[]> {
  const url = `${API}/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`;
  const res = await getJson<{ Count: number; results: RawNhtsaRecall[] }>(url);
  if (!res.ok || !res.data.results) return [];
  return res.data.results.map((r) => ({
    source: "NHTSA" as const,
    campaignId: r.NHTSACampaignNumber,
    component: r.Component ?? "",
    summary: r.Summary ?? "",
    consequence: r.Consequence ?? "",
    remedy: r.Remedy ?? "",
    notes: r.Notes,
    reportDate: r.ReportReceivedDate,
    severity: recallSeverity(r),
    parkIt: !!r.parkIt,
    parkOutside: !!r.parkOutSide,
    provenanceUrl: `https://www.nhtsa.gov/recalls?nhtsaId=${encodeURIComponent(r.NHTSACampaignNumber)}`,
  }));
}

/* ── Safety ratings + complaints (context for health/symptoms) ─────────────── */

export type SafetyRating = {
  overallRating?: string;
  frontCrash?: string;
  sideCrash?: string;
  rollover?: string;
  description?: string;
};

export async function getSafetyRatings(
  year: number,
  make: string,
  model: string,
): Promise<SafetyRating | null> {
  const lookup = await getJson<{ Results: { VehicleId: number; VehicleDescription: string }[] }>(
    `${API}/SafetyRatings/modelyear/${year}/make/${encodeURIComponent(make)}/model/${encodeURIComponent(model)}`,
  );
  if (!lookup.ok || !lookup.data.Results?.[0]) return null;
  const id = lookup.data.Results[0].VehicleId;
  const res = await getJson<{
    Results: {
      OverallRating?: string;
      OverallFrontCrashRating?: string;
      OverallSideCrashRating?: string;
      RolloverRating?: string;
      VehicleDescription?: string;
    }[];
  }>(`${API}/SafetyRatings/VehicleId/${id}`);
  if (!res.ok || !res.data.Results?.[0]) return null;
  const r = res.data.Results[0];
  return {
    overallRating: r.OverallRating,
    frontCrash: r.OverallFrontCrashRating,
    sideCrash: r.OverallSideCrashRating,
    rollover: r.RolloverRating,
    description: r.VehicleDescription,
  };
}

export async function getComplaintCount(
  year: number,
  make: string,
  model: string,
): Promise<{ count: number; topComponents: string[] } | null> {
  const res = await getJson<{ count: number; results: { components: string }[] }>(
    `${API}/complaints/complaintsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`,
  );
  if (!res.ok) return null;
  const counts = new Map<string, number>();
  for (const c of res.data.results ?? []) {
    const comp = (c.components ?? "").split(",")[0]?.trim();
    if (comp) counts.set(comp, (counts.get(comp) ?? 0) + 1);
  }
  const topComponents = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);
  return { count: res.data.count ?? res.data.results?.length ?? 0, topComponents };
}
