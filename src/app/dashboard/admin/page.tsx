import { createAdminClient } from "@/lib/supabase/admin";
import { getAdmin } from "@/lib/server/admin";
import { AdminListingRow, timeAgo } from "@/components/admin/admin-listing-row";

export const metadata = { title: "Admin · Review queue" };

export default async function AdminReviewQueuePage() {
  if (!(await getAdmin())) return null;
  const db = createAdminClient();

  const [{ data: inReview }, { data: awaitingSeller }, { data: live }, { data: counts }] =
    await Promise.all([
      db.from("listings").select("*").eq("status", "pending_review").order("updated_at", { ascending: true }),
      db.from("listings").select("*").eq("status", "changes_requested").order("updated_at", { ascending: true }),
      db.from("listings").select("*").eq("status", "active").not("edited_at", "is", null),
      db.from("listings").select("status, seller_id"),
    ]);

  const editedAfterApproval = (live ?? [])
    .filter((l) => l.approved_at && l.edited_at && l.edited_at > l.approved_at)
    .sort((a, b) => (b.edited_at ?? "").localeCompare(a.edited_at ?? ""));

  const real = (counts ?? []).filter((l) => l.seller_id);
  const count = (status: string) => real.filter((l) => l.status === status).length;

  const stats = [
    { label: "In review", value: count("pending_review") },
    { label: "Awaiting seller changes", value: count("changes_requested") },
    { label: "Awaiting payment", value: count("pending_payment") },
    { label: "Live (real sellers)", value: count("active") },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-5">
            <p className="text-2xl font-semibold tracking-tight">{s.value}</p>
            <p className="text-xs text-muted-foreground uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      <Section
        title="Waiting for review"
        empty="Nothing to review. New paid listings will show up here."
        hint="Oldest first. Aim to review within one working day — that's what sellers are told."
      >
        {(inReview ?? []).map((row) => (
          <AdminListingRow key={row.id} row={row} meta={`Waiting ${timeAgo(row.updated_at)}`} />
        ))}
      </Section>

      <Section title="Waiting on the seller" empty="No listings are waiting on seller changes.">
        {(awaitingSeller ?? []).map((row) => (
          <AdminListingRow key={row.id} row={row} meta={`Changes requested ${timeAgo(row.updated_at)}`} />
        ))}
      </Section>

      <Section
        title="Edited after approval"
        empty="No live listings have been edited since they were approved."
        hint="These stayed live. Give them a quick look and request changes if something's off."
      >
        {editedAfterApproval.map((row) => (
          <AdminListingRow key={row.id} row={row} meta={`Edited ${timeAgo(row.edited_at)}`} />
        ))}
      </Section>
    </div>
  );
}

function Section({
  title,
  hint,
  empty,
  children,
}: {
  title: string;
  hint?: string;
  empty: string;
  children: React.ReactNode[];
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold">
        {title} <span className="text-muted-foreground">({children.length})</span>
      </h2>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-3 flex flex-col gap-2">
        {children.length ? (
          children
        ) : (
          <p className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
            {empty}
          </p>
        )}
      </div>
    </section>
  );
}
