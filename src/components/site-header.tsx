"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { BrandLogo } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SiteContainer } from "@/components/site-container";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/cars", label: "Buy a Car" },
  { href: "/sell", label: "Sell Your Car" },
  { href: "/finance", label: "Finance" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  async function handleSignOut() {
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
      <SiteContainer className="flex h-20 items-center justify-between">
      <Link href="/" className="flex items-center">
        <BrandLogo className="h-7 w-auto text-primary" />
      </Link>

      <nav className="hidden items-center gap-10 md:flex">
        {NAV_LINKS.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative py-2 text-[16px] font-medium transition-colors",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
              {active && (
                <span className="absolute -bottom-px left-0 h-0.5 w-full rounded-full bg-foreground" />
              )}
            </Link>
          );
        })}
      </nav>

      <div
        className={cn("hidden items-center gap-2 md:flex", loading && "invisible")}
        aria-hidden={loading}
      >
        {user ? (
          <>
            <Button
              variant="ghost"
              className="rounded-full"
              render={
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              }
            />
            <Button variant="outline" className="rounded-full" onClick={() => void handleSignOut()}>
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              className="rounded-full"
              render={<Link href="/login">Sign In</Link>}
            />
            <Button
              className="rounded-full bg-primary hover:bg-primary/90"
              render={<Link href="/register">Register</Link>}
            />
          </>
        )}
      </div>

      <Sheet>
        <SheetTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              className="rounded-full md:hidden"
              aria-label="Menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          }
        />
        <SheetContent side="right" className="w-72">
          <SheetHeader>
            <SheetTitle className="flex items-center text-left">
              <BrandLogo className="h-5 w-auto text-primary" />
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-2 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2 border-t pt-4">
              {user ? (
                <>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    render={<Link href="/dashboard">Dashboard</Link>}
                  />
                  <Button variant="outline" className="rounded-full" onClick={() => void handleSignOut()}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    render={<Link href="/login">Sign In</Link>}
                  />
                  <Button
                    className="rounded-full bg-primary hover:bg-primary/90"
                    render={<Link href="/register">Register</Link>}
                  />
                </>
              )}
            </div>
          </nav>
        </SheetContent>
      </Sheet>
      </SiteContainer>
    </header>
  );
}
