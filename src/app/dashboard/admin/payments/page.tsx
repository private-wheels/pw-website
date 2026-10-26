import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdmin } from "@/lib/server/admin";
import { formatCurrency } from "@/lib/format";
import { PAYMENT_STATUS_STYLES } from "@/lib/listing-status";
import { RefundButton } from "@/components/admin/refund-button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata = { title: "Admin · Payments" };

export default async function AdminPaymentsPage() {
  if (!(await getAdmin())) return null;
  const db = createAdminClient();
  const { data: payments } = await db
    .from("payments")
    .select("*, listings(year, make, model, seller_name)")
    .order("created_at", { ascending: false })
    .limit(300);

  const rows = payments ?? [];
  const received = rows.filter((p) => p.status === "success").reduce((sum, p) => sum + p.amount_cents, 0) / 100;
  const refunded = rows
    .filter((p) => p.status === "refunded" || p.status === "refund_pending")
    .reduce((sum, p) => sum + p.amount_cents, 0) / 100;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-2xl font-semibold tracking-tight">{formatCurrency(received)}</p>
          <p className="text-xs text-muted-foreground uppercase">Received (kept)</p>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-2xl font-semibold tracking-tight">{formatCurrency(refunded)}</p>
          <p className="text-xs text-muted-foreground uppercase">Refunded</p>
        </div>
        <div className="col-span-2 rounded-2xl border bg-card p-5 sm:col-span-1">
          <p className="text-2xl font-semibold tracking-tight">{rows.filter((p) => p.status === "success").length}</p>
          <p className="text-xs text-muted-foreground uppercase">Paid listings</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Amounts are what Paystack charged; its fees come off at settlement. Not sure whether to refund?{" "}
        <Link href="/dashboard/admin/refunds" className="text-primary hover:underline">
          Read the refund guide
        </Link>
        .
      </p>

      <div className="rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Listing</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No payments yet.
                </TableCell>
              </TableRow>
            )}
            {rows.map((p) => {
              const amount = `R${(p.amount_cents / 100).toFixed(2)}`;
              return (
                <TableRow key={p.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(p.paid_at ?? p.created_at).toLocaleDateString("en-ZA", { dateStyle: "medium" })}
                  </TableCell>
                  <TableCell>
                    {p.listing_id && p.listings ? (
                      <Link href={`/dashboard/admin/listings/${p.listing_id}`} className="hover:underline">
                        {p.listings.year} {p.listings.make} {p.listings.model}
                        <span className="block text-xs text-muted-foreground">{p.listings.seller_name}</span>
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">Listing deleted</span>
                    )}
                  </TableCell>
                  <TableCell>{amount}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={PAYMENT_STATUS_STYLES[p.status]}>
                      {p.status.replace("_", " ")}
                    </Badge>
                    {p.refund_note && <span className="block max-w-48 truncate text-xs text-muted-foreground">{p.refund_note}</span>}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{p.reference}</TableCell>
                  <TableCell className="text-right">
                    {p.status === "success" && <RefundButton paymentId={p.id} amount={amount} />}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
