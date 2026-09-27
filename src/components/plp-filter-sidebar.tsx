"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import {
  BODY_TYPES,
  CONDITIONS,
  FUEL_TYPES,
  MAKES,
  PROVINCES,
  TRANSMISSIONS,
} from "@/lib/data/constants";
import { countActiveFilters, countMatching, parseMultiValue } from "@/lib/filter";
import { getMakeIndex } from "@/lib/make-index";
import type { FilterState, Vehicle } from "@/lib/types";
import { formatCurrency, formatMileage, formatNumber } from "@/lib/format";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const FILTER_KEYS: (keyof FilterState)[] = [
  "make",
  "model",
  "mm",
  "priceMin",
  "priceMax",
  "yearMin",
  "yearMax",
  "mileageMin",
  "mileageMax",
  "province",
  "condition",
  "transmission",
  "fuelType",
  "bodyType",
];

const PRICE_STEPS = [
  25_000, 50_000, 75_000, 100_000, 150_000, 200_000, 250_000, 300_000, 400_000,
  500_000, 750_000, 1_000_000, 1_500_000, 2_000_000,
];

const MILEAGE_STEPS = [
  5_000, 10_000, 20_000, 30_000, 50_000, 75_000, 100_000, 150_000, 200_000,
  250_000,
];

const YEAR_NOW = new Date().getFullYear();
const YEAR_STEPS = Array.from({ length: 22 }, (_, i) => YEAR_NOW + 1 - i);

function Count({ value }: { value: number }) {
  return (
    <span
      className={cn(
        "ml-auto shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
        value > 0 ? "bg-primary/10 text-primary" : "text-muted-foreground/50",
      )}
    >
      {formatNumber(value)}
    </span>
  );
}

function FilterGroup({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b pb-4 last:border-b-0 last:pb-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-1 text-sm font-semibold"
      >
        {title}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

function RangeSelect({
  value,
  onChange,
  minKey,
  maxKey,
  steps,
  format,
  minLabel = "Minimum",
  maxLabel = "Maximum",
}: {
  value: FilterState;
  onChange: (key: keyof FilterState, value: string) => void;
  minKey: keyof FilterState;
  maxKey: keyof FilterState;
  steps: number[];
  format: (n: number) => string;
  minLabel?: string;
  maxLabel?: string;
}) {
  const fields: [keyof FilterState, string][] = [
    [minKey, minLabel],
    [maxKey, maxLabel],
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {fields.map(([key, lbl]) => (
        <div key={key} className="flex flex-col gap-1">
          <Label className="text-[11px] font-medium text-muted-foreground">
            {lbl}
          </Label>
          <Select
            value={value[key] || "any"}
            onValueChange={(v) => onChange(key, !v || v === "any" ? "" : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {(v: string | null) =>
                  !v || v === "any" ? "Any" : format(Number(v))
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              {steps.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {format(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}

function OptionRow({
  selected,
  onSelect,
  label,
  count,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className="flex w-full items-center gap-2.5 py-1.5 text-left text-sm"
    >
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
          selected ? "border-primary" : "border-input",
        )}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
      </span>
      <span className={cn("truncate", selected && "font-medium")}>{label}</span>
      {count !== undefined && <Count value={count} />}
    </button>
  );
}

export function PlpFilterSidebar({
  listings,
  onApplied,
}: {
  listings: Vehicle[];
  onApplied?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters: FilterState = {
    make: searchParams.get("make") ?? "",
    model: searchParams.get("model") ?? "",
    mm: searchParams.get("mm") ?? "",
    priceMin: searchParams.get("priceMin") ?? "",
    priceMax: searchParams.get("priceMax") ?? "",
    yearMin: searchParams.get("yearMin") ?? "",
    yearMax: searchParams.get("yearMax") ?? "",
    mileageMin: searchParams.get("mileageMin") ?? "",
    mileageMax: searchParams.get("mileageMax") ?? "",
    province: searchParams.get("province") ?? "",
    condition: searchParams.get("condition") ?? "",
    transmission: searchParams.get("transmission") ?? "",
    fuelType: searchParams.get("fuelType") ?? "",
    bodyType: searchParams.get("bodyType") ?? "",
    sort: searchParams.get("sort") ?? "newest",
  };

  function setParams(mut: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mut(params);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    onApplied?.();
  }

  function update(key: keyof FilterState, value: string) {
    setParams((params) => {
      if (value) params.set(key, value);
      else params.delete(key);
      // The sidebar's make/model controls and the hero's stacked `mm`
      // selection can't both be live — the sidebar wins.
      if (key === "make") {
        params.delete("mm");
        params.delete("model");
      }
      if (key === "model") params.delete("mm");
    });
  }

  function toggleMulti(key: "fuelType" | "bodyType", value: string) {
    const current = parseMultiValue(filters[key]);
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    update(key, next.join(","));
  }

  function clearAll() {
    setParams((params) => FILTER_KEYS.forEach((key) => params.delete(key)));
  }

  const activeCount = countActiveFilters(filters);
  const makeIndex = getMakeIndex(listings);
  const makeModels = filters.make
    ? (makeIndex.find((m) => m.make === filters.make)?.models ?? [])
    : [];
  // Keep a searched model visible even when nothing currently matches it.
  const models =
    filters.model && !makeModels.some((m) => m.model === filters.model)
      ? [{ model: filters.model, count: 0 }, ...makeModels]
      : makeModels;
  const selectedFuels = parseMultiValue(filters.fuelType);
  const selectedBodyTypes = parseMultiValue(filters.bodyType);
  const c = (override: Partial<FilterState>) =>
    countMatching(listings, filters, override);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          Filter Results
          {activeCount > 0 && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </h2>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-7 px-2 text-xs"
          >
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      <FilterGroup title="Make & Model">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium text-muted-foreground">
              Make
            </Label>
            <Select
              value={filters.make || "all"}
              onValueChange={(v) => update("make", !v || v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string | null) =>
                    !v || v === "all" ? "All Makes" : v
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex-1">All Makes</span>
                  <Count value={c({ make: "" })} />
                </SelectItem>
                {MAKES.map((m) => (
                  <SelectItem key={m} value={m}>
                    <span className="flex-1">{m}</span>
                    <Count value={c({ make: m })} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium text-muted-foreground">
              Model
            </Label>
            <Select
              value={filters.model || "all"}
              disabled={!filters.make}
              onValueChange={(v) => update("model", !v || v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string | null) =>
                    !v || v === "all"
                      ? filters.make
                        ? "All Models"
                        : "Select a make first"
                      : v
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex-1">All Models</span>
                  <Count value={c({ model: "" })} />
                </SelectItem>
                {models.map(({ model }) => (
                  <SelectItem key={model} value={model}>
                    <span className="flex-1">{model}</span>
                    <Count value={c({ model })} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </FilterGroup>

      <FilterGroup title="Pricing">
        <RangeSelect
          value={filters}
          onChange={update}
          minKey="priceMin"
          maxKey="priceMax"
          steps={PRICE_STEPS}
          format={formatCurrency}
          minLabel="Minimum Price"
          maxLabel="Maximum Price"
        />
      </FilterGroup>

      <FilterGroup title="Location">
        <div role="radiogroup" className="flex flex-col">
          <OptionRow
            selected={!filters.province}
            onSelect={() => update("province", "")}
            label="All"
            count={c({ province: "" })}
          />
          {PROVINCES.map((p) => (
            <OptionRow
              key={p}
              selected={filters.province === p}
              onSelect={() =>
                update("province", filters.province === p ? "" : p)
              }
              label={p}
              count={c({ province: p })}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Body Type">
        <div className="flex flex-col">
          <label className="flex items-center gap-2.5 py-1.5 text-sm">
            <Checkbox
              checked={selectedBodyTypes.length === 0}
              onCheckedChange={() => update("bodyType", "")}
            />
            Any
          </label>
          {BODY_TYPES.map((bt) => (
            <label key={bt} className="flex items-center gap-2.5 py-1.5 text-sm">
              <Checkbox
                checked={selectedBodyTypes.includes(bt)}
                onCheckedChange={() => toggleMulti("bodyType", bt)}
              />
              <span>{bt}</span>
              <Count value={c({ bodyType: bt })} />
            </label>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Transmission">
        <div role="radiogroup" className="flex flex-col">
          <OptionRow
            selected={!filters.transmission}
            onSelect={() => update("transmission", "")}
            label="Any"
          />
          {TRANSMISSIONS.map((t) => (
            <OptionRow
              key={t}
              selected={filters.transmission === t}
              onSelect={() =>
                update("transmission", filters.transmission === t ? "" : t)
              }
              label={t}
              count={c({ transmission: t })}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Condition">
        <div role="radiogroup" className="flex flex-col">
          <OptionRow
            selected={!filters.condition}
            onSelect={() => update("condition", "")}
            label="Any"
          />
          {CONDITIONS.filter((cond) => cond !== "Demo").map((cond) => (
            <OptionRow
              key={cond}
              selected={filters.condition === cond}
              onSelect={() =>
                update("condition", filters.condition === cond ? "" : cond)
              }
              label={cond}
              count={c({ condition: cond })}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Year">
        <RangeSelect
          value={filters}
          onChange={update}
          minKey="yearMin"
          maxKey="yearMax"
          steps={YEAR_STEPS}
          format={(n) => String(n)}
        />
      </FilterGroup>

      <FilterGroup title="Mileage">
        <RangeSelect
          value={filters}
          onChange={update}
          minKey="mileageMin"
          maxKey="mileageMax"
          steps={MILEAGE_STEPS}
          format={formatMileage}
        />
      </FilterGroup>

      <FilterGroup title="Fuel Type">
        <div className="flex flex-col">
          <label className="flex items-center gap-2.5 py-1.5 text-sm">
            <Checkbox
              checked={selectedFuels.length === 0}
              onCheckedChange={() => update("fuelType", "")}
            />
            Any
          </label>
          {FUEL_TYPES.map((f) => (
            <label key={f} className="flex items-center gap-2.5 py-1.5 text-sm">
              <Checkbox
                checked={selectedFuels.includes(f)}
                onCheckedChange={() => toggleMulti("fuelType", f)}
              />
              <span>{f}</span>
              <Count value={c({ fuelType: f })} />
            </label>
          ))}
        </div>
      </FilterGroup>
    </div>
  );
}
