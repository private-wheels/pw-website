import Link from "next/link";
import { Download, ExternalLink, FileText } from "lucide-react";
import { getAdmin } from "@/lib/server/admin";
import {
  APPROX_ZAR_PER_USD,
  OUTCOME_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYSTACK_DASHBOARD_URL,
  SMILE_CHECK_COST_USD,
  SMILE_PORTAL_URL,
  currentPeriod,
  isPeriod,
  loadFinanceReport,
  rand,
  recentPeriods,
  usd,
} from "@/lib/server/finance-report";
import { PAYMENT_STATUS_STYLES } from "@/lib/listing-status";
import { RefundButton } from "@/components/admin/refund-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata = { title: "Admin · Finance" };

const OUTCOME_STYLES: Record<string, string> = {
  processing: "bg-slate-100 text-slate-700",
  clear: "bg-green-100 text-green-700",
  attention: "bg-amber-100 text-amber-800",
  block: "bg-red-100 text-red-700",
  error: "bg-slate-200 text-slate-700",
};

function dateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-ZA", {
    timeZone: "Africa/Johannesburg",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p
        className={`text-xl font-semibold tracking-tight ${tone === "good" ? "text-green-700" : tone === "bad" ? "text-destructive" : ""}`}
      >
        {value}
      </p>
      <p className="text-xs text-muted-foreground uppercase">{label}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/**
 * Money in (listing fees via Paystack) and out (Smile ID checks) in one
 * place, with CSV and PDF exports and links back to both platforms.
 */
export default async function AdminFinancePage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  if (!(await getAdmin())) return null;
  const { month } = await searchParams;
  const period = isPeriod(month) ? month : currentPeriod();
  const report = await loadFinanceReport(period);
  const { summary } = report;
  const exportQuery = `month=${period}`;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <form className="flex items-end gap-2" action="/dashboard/admin/finance">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-muted-foreground">Period</span>
            <select
              name="month"
              defaultValue={period}
              className="h-9 rounded-lg border bg-background px-3 text-sm"
            >
              {recentPeriods().map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
              <option value="all">All time</option>
            </select>
          </label>
          <Button type="submit" variant="outline" size="sm" className="h-9">
            Show
          </Button>
        </form>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            render={
              <a href={`/dashboard/admin/finance/report?${exportQuery}`} target="_blank" rel="noopener">
                <FileText className="h-3.5 w-3.5" /> PDF report
              </a>
            }
          />
          <Button
            variant="outline"
            size="sm"
            render={
              <a href={`/dashboard/admin/finance/export?type=payments&${exportQuery}`}>
                <Download className="h-3.5 w-3.5" /> Payments CSV
              </a>
            }
          />
          <Button
            variant="outline"
            size="sm"
            render={
              <a href={`/dashboard/admin/finance/export?type=checks&${exportQuery}`}>
                <Download className="h-3.5 w-3.5" /> ID checks CSV
              </a>
            }
          />
        </div>
      </div>

      {report.warnings.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
          {report.warnings.join(" ")}
        </div>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">{report.label}</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Listing fees collected" value={rand(summary.collectedCents)} hint={`${report.payments.length} payments`} />
          <Stat label="Refunded" value={rand(summary.refundedCents)} />
          <Stat label="Paystack fees" value={rand(summary.paystackFeesCents)} hint="VAT included" />
          <Stat label="Net income" value={rand(summary.netCents)} tone="good" />
          <Stat
            label="ID checks (Smile ID)"
            value={usd(summary.checksCostUsd)}
            hint={`${summary.checks} × ${usd(SMILE_CHECK_COST_USD)} ≈ ${rand(summary.checksCostZarCents)}`}
          />
          <Stat
            label="Net after ID checks"
            value={rand(summary.netAfterChecksCents)}
            hint={`Checks converted at ≈ R${APPROX_ZAR_PER_USD}/$`}
            tone={summary.netAfterChecksCents < 0 ? "bad" : "good"}
          />
          <Stat
            label="Paid out to bank"
            value={summary.paidOutCents === null ? "—" : rand(summary.paidOutCents)}
            hint="Paystack settlements this period"
          />
          <Stat
            label="Waiting at Paystack"
            value={summary.paystackBalanceCents === null ? "—" : rand(summary.paystackBalanceCents)}
            hint="Balance right now, not yet paid out"
          />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <a href={PAYSTACK_DASHBOARD_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
            Paystack dashboard <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <a href={SMILE_PORTAL_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
            Smile ID portal (wallet balance and billing) <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Listing payments</h2>
        <div className="rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Listing</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Fee</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    No payments in this period.
                  </TableCell>
                </TableRow>
              )}
              {report.payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="whitespace-nowrap">{dateTime(p.paidAt)}</TableCell>
                  <TableCell>
                    <span className="font-medium">{p.sellerName || "—"}</span>
                    {p.sellerEmail && (
                      <a href={`mailto:${p.sellerEmail}`} className="block text-xs text-muted-foreground hover:underline">
                        {p.sellerEmail}
                      </a>
                    )}
                    {p.sellerPhone && <span className="block text-xs text-muted-foreground">{p.sellerPhone}</span>}
                  </TableCell>
                  <TableCell>
                    {p.listingId ? (
                      <Link href={`/dashboard/admin/listings/${p.listingId}`} className="hover:underline">
                        {p.listingTitle}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">{p.listingTitle}</span>
                    )}
                    <span className="block font-mono text-xs text-muted-foreground">{p.reference}</span>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">{rand(p.amountCents)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                    {p.feeCents === null ? "—" : rand(p.feeCents)}
                  </TableCell>
                  <TableCell className="text-sm">{p.method}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={PAYMENT_STATUS_STYLES[p.status]}>
                      {PAYMENT_STATUS_LABELS[p.status] ?? p.status}
                    </Badge>
                    {p.refundNote && (
                      <span className="block max-w-40 truncate text-xs text-muted-foreground">{p.refundNote}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {p.paystackUrl && (
                        <a
                          href={p.paystackUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs whitespace-nowrap text-primary hover:underline"
                        >
                          Paystack <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {p.status === "success" && <RefundButton paymentId={p.id} amount={rand(p.amountCents)} />}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">Identity checks</h2>
          <Link href="/dashboard/admin/verifications" className="text-sm text-primary hover:underline">
            Review flagged checks
          </Link>
        </div>
        <div className="rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Result</TableHead>
                <TableHead className="text-right">Est. cost</TableHead>
                <TableHead>Smile ID job</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.checks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No identity checks in this period.
                  </TableCell>
                </TableRow>
              )}
              {report.checks.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="whitespace-nowrap">{dateTime(c.submittedAt)}</TableCell>
                  <TableCell>
                    <span className="font-medium">{c.sellerName || "—"}</span>
                    {c.sellerEmail && (
                      <a href={`mailto:${c.sellerEmail}`} className="block text-xs text-muted-foreground hover:underline">
                        {c.sellerEmail}
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className={OUTCOME_STYLES[c.outcome]}>
                        {OUTCOME_LABELS[c.outcome] ?? c.outcome}
                      </Badge>
                      {c.reviewDecision && (
                        <Badge variant="outline">{c.reviewDecision === "approved" ? "Approved" : "Rejected"}</Badge>
                      )}
                    </div>
                    {c.reason && <span className="block text-xs text-muted-foreground">{c.reason.replaceAll("_", " ")}</span>}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">{usd(c.costUsd)}</TableCell>
                  <TableCell>
                    <code className="text-xs">{c.jobId || "—"}</code>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">
          Costs are estimated at Smile ID&apos;s list price of {usd(SMILE_CHECK_COST_USD)} per check. For exact charges and
          your wallet balance, open the{" "}
          <a href={SMILE_PORTAL_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            Smile ID portal
          </a>{" "}
          and search a job ID to see that check there.
        </p>
      </section>
    </div>
  );
}
