import { redirect } from "next/navigation";

/** Payments now live on the Finance page, alongside identity check costs. */
export default function AdminPaymentsPage() {
  redirect("/dashboard/admin/finance");
}
