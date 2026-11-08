import { createAdminClient } from "@/lib/supabase/admin";
import { getAdmin } from "@/lib/server/admin";
import { IdentityReviewActions } from "@/components/admin/identity-review-actions";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata = { title: "Admin · ID checks" };

const OUTCOME_STYLES: Record<string, string> = {
  processing: "bg-slate-100 text-slate-700",
  clear: "bg-green-100 text-green-700",
  attention: "bg-amber-100 text-amber-800",
  block: "bg-red-100 text-red-700",
  error: "bg-slate-200 text-slate-700",
};

const OUTCOME_LABELS: Record<string, string> = {
  processing: "Processing",
  clear: "Passed",
  attention: "Flagged",
  block: "Failed",
  error: "Error",
};

function dateTime(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" }) : "—";
}

/**
 * Smile ID identity checks. Flagged ones (medium risk) wait here for an admin
 * to approve or reject; we only ever hold the outcome, so open the job in the
 * Smile ID portal (search its job ID) to see the selfie and ID details.
 */
export default async function AdminVerificationsPage() {
  if (!(await getAdmin())) return null;
  const db = createAdminClient();
  const [{ data: attempts }, { data: users }] = await Promise.all([
    db
      .from("identity_verifications")
      .select("*")
      .neq("status", "started")
      .order("created_at", { ascending: false })
      .limit(300),
    db.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailById = new Map((users?.users ?? []).map((u) => [u.id, u.email || u.new_email || "—"]));
  const rows = attempts ?? [];
  // A deleted account's checks stay for the books, but there's no one to review.
  const toReview = rows.filter(
    (a): a is typeof a & { user_id: string } => a.status === "attention" && !a.review_decision && a.user_id !== null,
  );
  const who = (userId: string | null) => (userId ? (emailById.get(userId) ?? userId) : "Account deleted");

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Waiting for you ({toReview.length})</h2>
        {toReview.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing to review. Smile ID flags medium-risk checks here.</p>
        ) : (
          toReview.map((a) => (
            <div key={a.id} className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center">
              <div className="flex-1 text-sm">
                <p className="font-medium">{who(a.user_id)}</p>
                <p className="text-muted-foreground">
                  Flagged {dateTime(a.completed_at)} · Smile ID job <code>{a.job_id}</code>
                </p>
              </div>
              <IdentityReviewActions userId={a.user_id} email={emailById.get(a.user_id) ?? "this member"} />
            </div>
          ))
        )}
        <p className="text-xs text-muted-foreground">
          To see the selfie and ID details, search the job ID in the Smile ID portal. Private Wheels doesn&apos;t store them.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">All checks</h2>
        <div className="rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Smile ID job</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{who(a.user_id)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className={OUTCOME_STYLES[a.status]}>
                        {OUTCOME_LABELS[a.status] ?? a.status}
                      </Badge>
                      {a.review_decision && (
                        <Badge variant="outline">{a.review_decision === "approved" ? "Approved" : "Rejected"}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.reason?.replaceAll("_", " ") ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">{dateTime(a.submitted_at)}</TableCell>
                  <TableCell>
                    <code className="text-xs">{a.job_id ?? "—"}</code>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
