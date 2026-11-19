import { makeGroup, modelLabel } from "@/lib/data/constants";

/**
 * The hero search lets a buyer stack several make/model picks. They ride
 * in one `mm` URL param: selections joined by `,`, and within a selection
 * the make and its models joined by `;`.
 *
 *   mm=BMW;3 Series;X3,Audi,Toyota;Hilux
 *   → [{ make: "BMW", models: ["3 Series", "X3"] },
 *      { make: "Audi", models: [] },
 *      { make: "Toyota", models: ["Hilux"] }]
 */
export interface MakeSelection {
  make: string;
  /** Empty = every model of the make. */
  models: string[];
}

export function serializeMakeSelections(selections: MakeSelection[]): string {
  return selections
    .filter((s) => s.make)
    .map((s) => [s.make, ...s.models].join(";"))
    .join(",");
}

export function parseMakeSelections(param: string | null | undefined): MakeSelection[] {
  if (!param) return [];
  return param
    .split(",")
    .map((chunk) => chunk.split(";").map((p) => p.trim()))
    .filter((parts) => parts[0])
    .map(([make, ...models]) => ({ make, models: models.filter(Boolean) }));
}

/** A vehicle matches when it satisfies any one selection. */
export function vehicleMatchesSelections(
  vehicle: { make: string; model: string },
  selections: MakeSelection[],
): boolean {
  if (selections.length === 0) return true;
  const model = modelLabel(vehicle).toLowerCase();
  return selections.some((sel) => {
    // "Other" covers every make outside the standard list.
    if (makeGroup(vehicle.make) !== sel.make) return false;
    if (sel.models.length === 0) return true;
    return sel.models.some((m) => model.includes(m.toLowerCase()));
  });
}
