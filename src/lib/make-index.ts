import type { Vehicle } from "@/lib/types";

export interface MakeIndexEntry {
  make: string;
  count: number;
  models: { model: string; count: number }[];
}

/** Makes → their models, with listing counts, for the combined search picker. */
export function getMakeIndex(vehicles: Vehicle[]): MakeIndexEntry[] {
  const byMake = new Map<string, Map<string, number>>();
  for (const v of vehicles) {
    if (!byMake.has(v.make)) byMake.set(v.make, new Map());
    const models = byMake.get(v.make)!;
    models.set(v.model, (models.get(v.model) ?? 0) + 1);
  }
  return [...byMake.entries()]
    .map(([make, models]) => ({
      make,
      count: [...models.values()].reduce((a, b) => a + b, 0),
      models: [...models.entries()]
        .map(([model, count]) => ({ model, count }))
        .sort((a, b) => a.model.localeCompare(b.model)),
    }))
    .sort((a, b) => a.make.localeCompare(b.make));
}

/** Distinct sellers across listings (demo listings have no seller id, so count by name). */
export function countSellers(vehicles: Vehicle[]): number {
  return new Set(vehicles.map((v) => v.sellerId || v.sellerName)).size;
}
