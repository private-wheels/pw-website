import type { NextRequest } from "next/server";
import { notifyListing } from "@/lib/server/listing-emails";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Daily job (Vercel Cron, see vercel.json): one reminder to sellers whose
 * draft or unpaid listing has sat untouched for two days. Each listing gets
 * at most one reminder (`reminder_sent_at`), and only sellers with a
 * confirmed email are emailed.
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET`; without CRON_SECRET set
 * the job refuses to run, so nobody else can trigger a batch of emails.
 */

const IDLE_FOR_MS = 2 * 24 * 60 * 60 * 1000;
const MAX_PER_RUN = 100;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  const before = new Date(Date.now() - IDLE_FOR_MS).toISOString();
  const { data: listings, error } = await db
    .from("listings")
    .select("id, status")
    .in("status", ["draft", "pending_payment"])
    .is("reminder_sent_at", null)
    .lt("updated_at", before)
    .not("seller_id", "is", null)
    .limit(MAX_PER_RUN);
  if (error) {
    console.error("[reminders]", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const listing of listings) {
    const stage = listing.status === "draft" ? "draft" : "unpaid";
    const emailed = await notifyListing(listing.id, { type: "reminder", stage });
    // Marked either way: an unconfirmed email shouldn't be retried every day.
    await db.from("listings").update({ reminder_sent_at: new Date().toISOString() }).eq("id", listing.id);
    if (emailed) sent++;
  }

  console.log(`[reminders] ${sent} sent of ${listings.length} due`);
  return Response.json({ due: listings.length, sent });
}
