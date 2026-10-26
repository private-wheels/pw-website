import { createAdminClient } from "@/lib/supabase/admin";
import { getAdmin } from "@/lib/server/admin";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata = { title: "Admin · Members" };

function date(iso: string | null | undefined): string {
  return iso ? new Date(iso).toLocaleDateString("en-ZA", { dateStyle: "medium" }) : "—";
}

export default async function AdminMembersPage() {
  if (!(await getAdmin())) return null;
  const db = createAdminClient();
  const [{ data: users }, { data: profiles }, { data: listings }] = await Promise.all([
    db.auth.admin.listUsers({ perPage: 1000 }),
    db.from("profiles").select("id, display_name, phone, role"),
    db.from("listings").select("seller_id, status").not("seller_id", "is", null),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const members = (users?.users ?? [])
    .filter((u) => !u.is_anonymous)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((u) => {
      const own = (listings ?? []).filter((l) => l.seller_id === u.id);
      return {
        id: u.id,
        email: u.email ?? "—",
        confirmed: Boolean(u.email_confirmed_at),
        createdAt: u.created_at,
        lastSignIn: u.last_sign_in_at,
        profile: profileById.get(u.id),
        listings: own.length,
        live: own.filter((l) => l.status === "active").length,
      };
    });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {members.length} member{members.length === 1 ? "" : "s"}. Admin access is granted in the database, not
        here. Ask your developer to add someone.
      </p>
      <div className="rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Listings</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last sign-in</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{m.profile?.display_name || m.email.split("@")[0]}</span>
                    {m.profile?.role === "admin" && <Badge>Admin</Badge>}
                    {!m.confirmed && <Badge variant="outline">Email not confirmed</Badge>}
                  </div>
                  <a href={`mailto:${m.email}`} className="text-xs text-muted-foreground hover:underline">
                    {m.email}
                  </a>
                </TableCell>
                <TableCell>{m.profile?.phone || "—"}</TableCell>
                <TableCell>
                  {m.listings} <span className="text-xs text-muted-foreground">({m.live} live)</span>
                </TableCell>
                <TableCell className="whitespace-nowrap">{date(m.createdAt)}</TableCell>
                <TableCell className="whitespace-nowrap">{date(m.lastSignIn)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
