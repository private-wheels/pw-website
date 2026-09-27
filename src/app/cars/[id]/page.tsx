import type { Metadata } from "next";
import { getActiveListing } from "@/lib/data/listings";
import { formatCurrency, formatMileage } from "@/lib/format";
import { VehicleDetailClient } from "@/components/vehicle-detail-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const v = await getActiveListing(id);

  if (!v) {
    return { title: "Vehicle not found | Private Wheels" };
  }

  const name = `${v.year} ${v.make} ${v.model} ${v.variant}`.trim();
  const title = `${name} — ${formatCurrency(v.price)} | Private Wheels`;
  const description = `${formatCurrency(v.price)} · ${formatMileage(v.mileage)} · ${v.transmission} · ${v.fuelType} · ${v.condition}. Private sale in ${v.town}, ${v.province}.`;
  const image = v.images[0];
  const url = `/cars/${v.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: "Private Wheels",
      title: name,
      description,
      images: image
        ? [{ url: image, width: 1280, height: 960, alt: name }]
        : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VehicleDetailClient id={id} />;
}
