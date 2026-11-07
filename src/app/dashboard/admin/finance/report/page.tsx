import { getAdmin } from "@/lib/server/admin";
import { BUSINESS } from "@/lib/legal";
import {
  APPROX_ZAR_PER_USD,
  OUTCOME_LABELS,
  PAYMENT_STATUS_LABELS,
  SMILE_CHECK_COST_USD,
  currentPeriod,
  isPeriod,
  loadFinanceReport,
  rand,
  usd,
} from "@/lib/server/finance-report";
import { PrintOnLoad } from "@/components/admin/print-on-load";

export const metadata = { title: "Finance report" };

// Print only the report: hide the site and admin chrome around it.
const PRINT_CSS = `
@page { size: A4 landscape; margin: 12mm; }
@media print {
  body * { visibility: hidden; }
  #finance-report, #finance-report * { visibility: visible; }
  #finance-report { position: absolute; inset: 0 auto auto 0; width: 100%; }
  #finance-report table { page-break-inside: auto; }
  #finance-report tr { page-break-inside: avoid; }
}`;

const date = (iso: string) =>
  new Date(iso).toLocaleDateString("en-ZA", { timeZone: "Africa/Johannesburg", dateStyle: "medium" });

/**
 * Printable Finance report for one period. Opens the browser's print dialog,
 * where "Save as PDF" gives the PDF export.
 */
export default async function FinanceReportPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  if (!(await getAdmin())) return null;
  const { month } = await searchParams;
  const period = isPeriod(month) ? month : currentPeriod();
  const report = await loadFinanceReport(period);
  const { summary } = report;

  const lines: [string, string][] = [
    ["Listing fees collected", `${rand(summary.collectedCents)} (${report.payments.length} payments)`],
    ["Refunded", rand(summary.refundedCents)],
    ["Paystack fees (VAT incl.)", rand(summary.paystackFeesCents)],
    ["Net income", rand(summary.netCents)],
    [
      "Identity checks (Smile ID, estimated)",
      `${usd(summary.checksCostUsd)} (${summary.checks} × ${usd(SMILE_CHECK_COST_USD)}) ≈ ${rand(summary.checksCostZarCents)}`,
    ],
    ["Net after identity checks", rand(summary.netAfterChecksCents)],
    ["Paid out to bank (Paystack settlements)", summary.paidOutCents === null ? "—" : rand(summary.paidOutCents)],
  ];

  return (
    <div className="flex flex-col gap-4">
      <style>{PRINT_CSS}</style>
      <div className="flex justify-end">
        <PrintOnLoad />
      </div>

      <div id="finance-report" className="flex flex-col gap-6 bg-white p-2 text-[12px] text-black">
        <header className="flex items-start justify-between border-b pb-3">
          <div>
            <p className="text-lg font-bold">Finance report · {report.label}</p>
            <p>
              {BUSINESS.legalName} · Reg. {BUSINESS.registrationNumber}
            </p>
          </div>
          <p className="text-right">Generated {date(new Date().toISOString())}</p>
        </header>

        <section>
          <p className="mb-2 font-semibold">Summary</p>
          <table className="w-full max-w-xl border-collapse">
            <tbody>
              {lines.map(([label, value]) => (
                <tr key={label} className="border-b">
                  <td className="py-1 pr-4">{label}</td>
                  <td className="py-1 text-right font-medium">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[10px] text-neutral-600">
            Identity check costs are estimated at Smile ID&apos;s list price and converted at ≈ R{APPROX_ZAR_PER_USD}/$. Exact
            charges are in the Smile ID portal.
          </p>
        </section>

        <section>
          <p className="mb-2 font-semibold">Listing payments ({report.payments.length})</p>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b-2">
                <th className="py-1 pr-2">Date</th>
                <th className="py-1 pr-2">Seller</th>
                <th className="py-1 pr-2">Listing</th>
                <th className="py-1 pr-2 text-right">Amount</th>
                <th className="py-1 pr-2 text-right">Fee</th>
                <th className="py-1 pr-2">Method</th>
                <th className="py-1 pr-2">Status</th>
                <th className="py-1">Reference</th>
              </tr>
            </thead>
            <tbody>
              {report.payments.map((p) => (
                <tr key={p.id} className="border-b align-top">
                  <td className="py-1 pr-2 whitespace-nowrap">{date(p.paidAt)}</td>
                  <td className="py-1 pr-2">
                    {p.sellerName || "—"}
                    <br />
                    <span className="text-neutral-600">{p.sellerEmail}</span>
                  </td>
                  <td className="py-1 pr-2">{p.listingTitle}</td>
                  <td className="py-1 pr-2 text-right whitespace-nowrap">{rand(p.amountCents)}</td>
                  <td className="py-1 pr-2 text-right whitespace-nowrap">{p.feeCents === null ? "—" : rand(p.feeCents)}</td>
                  <td className="py-1 pr-2">{p.method}</td>
                  <td className="py-1 pr-2">{PAYMENT_STATUS_LABELS[p.status] ?? p.status}</td>
                  <td className="py-1 font-mono text-[10px]">{p.reference}</td>
                </tr>
              ))}
              {report.payments.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-2 text-neutral-600">
                    No payments in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section>
          <p className="mb-2 font-semibold">Identity checks ({report.checks.length})</p>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b-2">
                <th className="py-1 pr-2">Date</th>
                <th className="py-1 pr-2">Seller</th>
                <th className="py-1 pr-2">Result</th>
                <th className="py-1 pr-2 text-right">Est. cost</th>
                <th className="py-1">Smile ID job</th>
              </tr>
            </thead>
            <tbody>
              {report.checks.map((c) => (
                <tr key={c.id} className="border-b align-top">
                  <td className="py-1 pr-2 whitespace-nowrap">{date(c.submittedAt)}</td>
                  <td className="py-1 pr-2">
                    {c.sellerName || "—"}
                    <br />
                    <span className="text-neutral-600">{c.sellerEmail}</span>
                  </td>
                  <td className="py-1 pr-2">
                    {OUTCOME_LABELS[c.outcome] ?? c.outcome}
                    {c.reviewDecision ? ` (${c.reviewDecision})` : ""}
                    {c.reason ? ` · ${c.reason.replaceAll("_", " ")}` : ""}
                  </td>
                  <td className="py-1 pr-2 text-right">{usd(c.costUsd)}</td>
                  <td className="py-1 font-mono text-[10px]">{c.jobId}</td>
                </tr>
              ))}
              {report.checks.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-2 text-neutral-600">
                    No identity checks in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
