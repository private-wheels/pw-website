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
    year: row.year,
    price: row.price,
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
    featured: row.featured,
    status: row.status as ListingStatus,
    sellerId: row.seller_id ?? "",
    sellerName: row.seller_name,
    phone: row.seller_phone,
    createdAt: row.created_at,
  };
}

/** Columns a seller may write — matches the column GRANTs on the table. */
export function vehicleInputToRow(
  input: NewVehicleInput,
): Omit<ListingInsert, "id" | "seller_id" | "featured" | "original_price" | "created_at" | "updated_at"> {
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
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Listing ids are UUIDs; anything else can't exist (and would error in Postgres). */
export function isListingId(id: string): boolean {
  return UUID_RE.test(id);
}
