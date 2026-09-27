"use client";

import { useMemo, useState } from "react";
import { Check, ChevronLeft, Search, X } from "lucide-react";
import { useListings } from "@/hooks/use-listings";
import { getMakeIndex } from "@/lib/make-index";
import type { MakeSelection } from "@/lib/make-model";
import { PickerField } from "@/components/picker-field";
import { cn } from "@/lib/utils";

/**
 * Combined Make & model search. Pick a make → the panel switches to that
 * make's models (multi-select, "All" pre-checked). "Add more" drops the
 * pick into a dismissable chip in the field and returns to the make list,
 * so a buyer can stack several makes/models in one search. Modelled on
 * AutoTrader's picker.
 */
export function MakeModelPicker({
  value,
  onChange,
  className,
}: {
  value: MakeSelection[];
  onChange: (next: MakeSelection[]) => void;
  className?: string;
}) {
  const { listings } = useListings();
  const index = useMemo(() => getMakeIndex(listings), [listings]);

  const [step, setStep] = useState<"make" | "model">("make");
  const [editing, setEditing] = useState(-1);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const editingSel = editing >= 0 ? value[editing] : undefined;
  const editingEntry = editingSel && index.find((e) => e.make === editingSel.make);

  const makeResults = useMemo(() => {
    if (!q) return index;
    return index.filter(
      (e) =>
        e.make.toLowerCase().includes(q) ||
        e.models.some((m) => m.model.toLowerCase().includes(q)),
    );
  }, [index, q]);

  const modelResults = useMemo(() => {
    if (!editingEntry) return [];
    if (!q) return editingEntry.models;
    return editingEntry.models.filter((m) => m.model.toLowerCase().includes(q));
  }, [editingEntry, q]);

  function chipLabel(s: MakeSelection) {
    if (s.models.length === 0) return s.make;
    if (s.models.length === 1) return `${s.make} ${s.models[0]}`;
    return `${s.make} · ${s.models.length}`;
  }

  function toMakeStep() {
    setStep("make");
    setEditing(-1);
    setQuery("");
  }

  function pickMake(make: string) {
    const existing = value.findIndex((s) => s.make === make);
    if (existing >= 0) {
      setEditing(existing);
    } else {
      onChange([...value, { make, models: [] }]);
      setEditing(value.length);
    }
    setQuery("");
    setStep("model");
  }

  function editSelection(next: Partial<MakeSelection>) {
    if (editing < 0) return;
    onChange(value.map((s, i) => (i === editing ? { ...s, ...next } : s)));
  }

  function toggleModel(model: string) {
    if (!editingSel) return;
    const has = editingSel.models.includes(model);
    editSelection({
      models: has
        ? editingSel.models.filter((m) => m !== model)
        : [...editingSel.models, model],
    });
  }

  return (
    <div className={cn("min-w-0", className)}>
      <PickerField
        panelClassName="w-[min(440px,calc(100vw-2rem))]"
        onOpenChange={(open) => open && toMakeStep()}
        trigger={({ open, toggle }) => (
          <div
            role="button"
            tabIndex={0}
            aria-expanded={open}
            onClick={toggle}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggle();
              }
            }}
            className="w-full cursor-pointer px-3 py-2 text-left outline-none focus-visible:bg-muted"
          >
            <span className="block text-[13px] font-medium">Make &amp; model</span>
            <div className="mt-1 flex h-8 items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {value.length === 0 ? (
                <span className="shrink-0 text-sm text-muted-foreground">
                  Any make &amp; model
                </span>
              ) : (
                value.map((s, i) => (
                  <span
                    key={`${s.make}-${i}`}
                    className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted py-1 pr-1.5 pl-3 text-sm font-medium"
                  >
                    <span className="whitespace-nowrap">{chipLabel(s)}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${s.make}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange(value.filter((_, idx) => idx !== i));
                      }}
                      className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-card hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        )}
      >
        {(close) =>
          step === "make" ? (
            <>
              <SearchBar value={query} onChange={setQuery} placeholder="Search makes" />
              <div className="overflow-y-auto py-1">
                <Row
                  label="Any make & model"
                  selected={value.length === 0}
                  onClick={() => {
                    onChange([]);
                    close();
                  }}
                />
                {makeResults.map((e) => (
                  <Row
                    key={e.make}
                    label={e.make}
                    count={e.count}
                    selected={value.some((s) => s.make === e.make)}
                    onClick={() => pickMake(e.make)}
                  />
                ))}
                {makeResults.length === 0 && <Empty query={query} />}
              </div>
              {value.length > 0 && (
                <div className="border-t p-2">
                  <DoneButton onClick={close} />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-1 border-b px-2 py-2">
                <button
                  type="button"
                  onClick={toMakeStep}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium hover:bg-muted"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Makes
                </button>
                <span className="ml-1 truncate text-sm text-muted-foreground">
                  {editingSel?.make}
                </span>
              </div>
              <SearchBar
                value={query}
                onChange={setQuery}
                placeholder={`Search ${editingSel?.make} models`}
              />
              <div className="overflow-y-auto py-1">
                <CheckRow
                  label={`All ${editingSel?.make} models`}
                  checked={(editingSel?.models.length ?? 0) === 0}
                  onClick={() => editSelection({ models: [] })}
                />
                {modelResults.map((m) => (
                  <CheckRow
                    key={m.model}
                    label={m.model}
                    count={m.count}
                    checked={editingSel?.models.includes(m.model)}
                    onClick={() => toggleModel(m.model)}
                  />
                ))}
                {modelResults.length === 0 && <Empty query={query} />}
              </div>
              <div className="flex gap-2 border-t p-2">
                <button
                  type="button"
                  onClick={toMakeStep}
                  className="flex-1 rounded-full border py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Add more
                </button>
                <DoneButton onClick={close} className="flex-1" />
              </div>
            </>
          )
        }
      </PickerField>
    </div>
  );
}

function DoneButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full bg-foreground py-2 text-sm font-medium text-background transition-opacity hover:opacity-90",
        className ?? "w-full",
      )}
    >
      Done
    </button>
  );
}

function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-2 border-b px-3 py-2.5">
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

function Row({
  label,
  count,
  selected,
  onClick,
}: {
  label: string;
  count?: number;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 py-2 pr-3 pl-4 text-left text-sm hover:bg-muted",
        selected && "font-semibold",
      )}
    >
      <span className="flex-1 truncate">{label}</span>
      {typeof count === "number" && (
        <span className="text-xs text-muted-foreground">{count}</span>
      )}
      {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
    </button>
  );
}

function CheckRow({
  label,
  count,
  checked,
  onClick,
}: {
  label: string;
  count?: number;
  checked?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={checked}
      className="flex w-full items-center gap-2.5 py-2 pr-3 pl-4 text-left text-sm hover:bg-muted"
    >
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-input",
        )}
      >
        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <span className={cn("flex-1 truncate", checked && "font-medium")}>{label}</span>
      {typeof count === "number" && (
        <span className="text-xs text-muted-foreground">{count}</span>
      )}
    </button>
  );
}

function Empty({ query }: { query: string }) {
  return (
    <p className="px-4 py-6 text-center text-sm text-muted-foreground">
      Nothing matches &ldquo;{query}&rdquo;
    </p>
  );
}
