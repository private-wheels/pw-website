import { isPhotoView } from "@/lib/listing-photos";
import type {
  AccidentHistory,
  BodyType,
  Condition,
  FuelType,
  ListingStatus,
  NewVehicleInput,
  Province,
  ServiceHistory,
  Transmission,
  Vehicle,
} from "@/lib/types";
import type { ListingInsert, ListingRow } from "@/lib/supabase/database.types";

/**
 * Mapping between the `listings` table (snake_case, enforced by check
 * constraints) and the app's `Vehicle` shape. Shared by server reads and
 * client mutations.
 */

export function rowToVehicle(row: ListingRow): Vehicle {
  return {
    id: row.id,
    make: row.make,
    model: row.model,
    variant: row.variant,
    // Blank only on drafts.
    year: row.year ?? 0,
    price: row.price ?? 0,
    ...(row.original_price ? { originalPrice: row.original_price } : {}),
    mileage: row.mileage,
    transmission: row.transmission as Transmission,
    fuelType: row.fuel_type as FuelType,
    bodyType: row.body_type as BodyType,
    province: row.province as Province,
    town: row.town,
    condition: row.condition as Condition,
    previousOwners: row.previous_owners,
    serviceHistory: row.service_history as ServiceHistory,
    accidentHistory: row.accident_history as AccidentHistory,
    colour: row.colour,
    features: row.features,
    description: row.description,
    images: row.images,
    // Missing only if the photo_views migration hasn't run yet.
    photoViews: (row.photo_views ?? []).filter(isPhotoView),
    status: row.status as ListingStatus,
    reviewNote: row.review_note,
    sellerId: row.seller_id ?? "",
    sellerName: row.seller_name,
    phone: row.seller_phone,
    createdAt: row.created_at,
  };
}

/** Columns a seller may write — matches the column GRANTs on the table. */
export function vehicleInputToRow(
  input: NewVehicleInput,
): Omit<
  ListingInsert,
  | "id"
  | "seller_id"
  | "featured"
  | "original_price"
  | "created_at"
  | "updated_at"
  | "paid_at"
  | "approved_at"
  | "reviewed_by"
  | "review_note"
  | "edited_at"
  | "fee_waived"
> {
  return {
    seller_name: input.sellerName,
    seller_phone: input.phone,
    make: input.make,
    model: input.model,
    variant: input.variant,
    year: input.year,
    price: input.price,
    mileage: input.mileage,
    transmission: input.transmission,
    fuel_type: input.fuelType,
    body_type: input.bodyType,
    province: input.province,
    town: input.town,
    condition: input.condition,
    previous_owners: input.previousOwners,
    service_history: input.serviceHistory,
    accident_history: input.accidentHistory,
    colour: input.colour,
    features: input.features,
    description: input.description,
    images: input.images,
    photo_views: input.photoViews,
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Listing ids are UUIDs; anything else can't exist (and would error in Postgres). */
export function isListingId(id: string): boolean {
  return UUID_RE.test(id);
}

/**
 * A listing still being written: everything as typed in the wizard, so any
 * field may be blank. Only `draft` listings may be saved like this.
 */
export type DraftInput = {
  make: string;
  model: string;
  variant: string;
  year: string;
  price: string;
  mileage: string;
  province: string;
  town: string;
  bodyType: string;
  transmission: string;
  fuelType: string;
  condition: string;
  previousOwners: string;
  serviceHistory: string;
  accidentHistory: string;
  colour: string;
  features: string[];
  description: string;
  images: string[];
  photoViews: string[];
  sellerName: string;
  phone: string;
};

/** Whole numbers within `max`, or null when blank (or not a number). */
function wholeNumber(value: string, max: number): number | null {
  const n = Math.round(Number(value.replace(/[\s,]/g, "")));
  return value.trim() && Number.isFinite(n) && n >= 0 && n <= max ? n : null;
}

export function draftToRow(d: DraftInput) {
  const year = wholeNumber(d.year, 2100);
  return {
    seller_name: d.sellerName.trim().slice(0, 80),
    seller_phone: d.phone.trim().slice(0, 30),
    make: d.make.slice(0, 60),
    model: d.model.trim().slice(0, 80),
    variant: d.variant.trim().slice(0, 120),
    year: year !== null && year >= 1900 ? year : null,
    price: wholeNumber(d.price, 2_000_000_000),
    mileage: wholeNumber(d.mileage, 2_000_000_000) ?? 0,
    transmission: d.transmission,
    fuel_type: d.fuelType,
    body_type: d.bodyType,
    province: d.province,
    town: d.town.trim().slice(0, 80),
    condition: d.condition,
    previous_owners: Math.min(wholeNumber(d.previousOwners, 50) ?? 0, 50),
    service_history: d.serviceHistory,
    accident_history: d.accidentHistory,
    colour: d.colour.slice(0, 40),
    features: d.features.slice(0, 60),
    description: d.description.slice(0, 5000),
    images: d.images.slice(0, 20),
    photo_views: d.photoViews.slice(0, 20),
  };
}
