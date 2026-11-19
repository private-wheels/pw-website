import type { Vehicle } from "@/lib/types";
import { OTHER_MAKE, makeGroup, modelLabel } from "@/lib/data/constants";

export interface MakeIndexEntry {
  make: string;
  count: number;
  models: { model: string; count: number }[];
}

/**
 * Makes → their models, with listing counts, for the combined search picker.
 * Makes outside the standard list are grouped under "Other" (last), with
 * their models shown as "Make Model".
 */
export function getMakeIndex(vehicles: Vehicle[]): MakeIndexEntry[] {
  const byMake = new Map<string, Map<string, number>>();
  for (const v of vehicles) {
    const group = makeGroup(v.make);
    if (!byMake.has(group)) byMake.set(group, new Map());
    const models = byMake.get(group)!;
    const label = modelLabel(v);
    models.set(label, (models.get(label) ?? 0) + 1);
  }
  return [...byMake.entries()]
    .map(([make, models]) => ({
      make,
      count: [...models.values()].reduce((a, b) => a + b, 0),
      models: [...models.entries()]
        .map(([model, count]) => ({ model, count }))
        .sort((a, b) => a.model.localeCompare(b.model)),
    }))
    .sort((a, b) => (a.make === OTHER_MAKE ? 1 : b.make === OTHER_MAKE ? -1 : a.make.localeCompare(b.make)));
}

/** Distinct sellers across listings (demo listings have no seller id, so count by name). */
export function countSellers(vehicles: Vehicle[]): number {
  return new Set(vehicles.map((v) => v.sellerId || v.sellerName)).size;
}
