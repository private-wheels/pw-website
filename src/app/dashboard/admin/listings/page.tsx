import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdmin } from "@/lib/server/admin";
import { STATUS_LABELS } from "@/lib/listing-status";
import { cn } from "@/lib/utils";
import { AdminListingRow } from "@/components/admin/admin-listing-row";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Admin · All listings" };

const FILTERS = [
  { value: "", label: "All" },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
  { value: "demo", label: "Demo" },
];

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  if (!(await getAdmin())) return null;
  const { status = "", q = "" } = await searchParams;

  let query = createAdminClient().from("listings").select("*").order("created_at", { ascending: false });
  if (status === "demo") query = query.is("seller_id", null);
  else if (status) query = query.eq("status", status);

  // Strip characters that have meaning in PostgREST's or() syntax.
  const term = q.replace(/[,()*%\\]/g, " ").trim();
  if (term) {
    query = query.or(
      ["make", "model", "variant", "seller_name", "seller_phone"]
        .map((col) => `${col}.ilike.*${term}*`)
        .join(","),
    );
  }
  const { data: rows } = await query.limit(200);

  const href = (next: { status?: string; q?: string }) => {
    const params = new URLSearchParams();
    const s = next.status ?? status;
    const t = next.q ?? q;
    if (s) params.set("status", s);
    if (t) params.set("q", t);
    const qs = params.toString();
    return `/dashboard/admin/listings${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <form className="flex gap-2" action="/dashboard/admin/listings">
        {status && <input type="hidden" name="status" value={status} />}
        <Input name="q" defaultValue={q} placeholder="Search make, model, seller or phone" />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <div className="-mx-1 flex gap-1 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <Link
            key={f.value || "all"}
            href={href({ status: f.value })}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-sm",
              status === f.value ? "border-foreground bg-foreground text-background" : "hover:bg-muted",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        {rows?.length ?? 0} listing{rows?.length === 1 ? "" : "s"}
        {rows?.length === 200 ? " (showing the newest 200)" : ""}
      </p>

      <div className="flex flex-col gap-2">
        {(rows ?? []).map((row) => (
          <AdminListingRow key={row.id} row={row} />
        ))}
      </div>
    </div>
  );
}
