import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { ListingsProvider } from "@/context/listings-context";
import { getActiveListings } from "@/lib/data/listings";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: "Private Wheels | Buy & Sell Cars in South Africa",
  description:
    "South Africa's trusted private vehicle marketplace. Browse thousands of listings, sell your car with confidence, and calculate finance in seconds.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const listings = await getActiveListings();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <ListingsProvider listings={listings}>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <Toaster />
          </ListingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
