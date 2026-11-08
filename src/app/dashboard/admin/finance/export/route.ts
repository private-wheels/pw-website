import type { NextRequest } from "next/server";
import { getAdmin } from "@/lib/server/admin";
import { checksCsv, currentPeriod, isPeriod, loadFinanceReport, paymentsCsv } from "@/lib/server/finance-report";

/** CSV download of the Finance page's payments or identity checks. Admins only. */
export async function GET(request: NextRequest) {
  if (!(await getAdmin())) return new Response("Admins only", { status: 403 });

  const params = request.nextUrl.searchParams;
  const type = params.get("type") === "checks" ? "checks" : "payments";
  const month = params.get("month");
  const period = isPeriod(month) ? month : currentPeriod();

  const report = await loadFinanceReport(period);
  // Excel needs the byte-order mark to read the file as UTF-8 (R and • signs).
  const body = `﻿${type === "checks" ? checksCsv(report) : paymentsCsv(report)}`;
  const filename = `private-wheels-${type === "checks" ? "id-checks" : "payments"}-${period}.csv`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
