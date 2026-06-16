import { getJson } from "./http";

/**
 * FuelEconomy.gov — MPG + EPA vehicle data enrichment. Best-effort; degrades to
 * null on any failure (it only enriches the vehicle profile). JSON via the Accept
 * header. No key required.
 */
const WS = "https://www.fueleconomy.gov/ws/rest";
const JSON_HEADERS = { Accept: "application/json" };

export type MpgInfo = {
  cityMpg?: number;
  highwayMpg?: number;
  combinedMpg?: number;
  fuelType?: string;
  epaVehicleId?: string;
};

export async function getMpg(
  year: number,
  make: string,
  model: string,
): Promise<MpgInfo | null> {
  const optsRes = await getJson<{
    menuItem: { text: string; value: string }[] | { text: string; value: string };
  }>(
    `${WS}/vehicle/menu/options?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`,
    { headers: JSON_HEADERS },
  );
  if (!optsRes.ok) return null;
  const itemsRaw = optsRes.data.menuItem;
  const items = Array.isArray(itemsRaw) ? itemsRaw : itemsRaw ? [itemsRaw] : [];
  if (items.length === 0) return null;
  const id = items[0].value;

  const v = await getJson<{
    city08?: number | string;
    highway08?: number | string;
    comb08?: number | string;
    fuelType?: string;
  }>(`${WS}/vehicle/${id}`, { headers: JSON_HEADERS });
  if (!v.ok) return null;
  const num = (x: number | string | undefined) =>
    x == null || x === "" ? undefined : Number(x);
  return {
    cityMpg: num(v.data.city08),
    highwayMpg: num(v.data.highway08),
    combinedMpg: num(v.data.comb08),
    fuelType: v.data.fuelType,
    epaVehicleId: id,
  };
}
