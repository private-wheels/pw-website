import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { getAdmin } from "@/lib/server/admin";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";

/** Admin area: every page below re-checks the role on the server. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();

  if (!admin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-xl font-bold">Admins only</h1>
        <p className="mt-2 text-muted-foreground">Your account doesn&apos;t have access to this area.</p>
        <Button className="mt-6" render={<Link href="/dashboard">Back to Dashboard</Link>} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        </div>
        <AdminNav />
      </div>
      {children}
    </div>
  );
}
