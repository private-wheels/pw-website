import type { BodyType, FuelType, Province, ServiceHistory, Transmission } from "@/lib/types";

export const MAKES = [
  "Audi",
  "BMW",
  "Chevrolet",
  "Ford",
  "Haval",
  "Honda",
  "Hyundai",
  "Isuzu",
  "Jeep",
  "Kia",
  "Mahindra",
  "Mazda",
  "Mercedes-Benz",
  "Mini",
  "Nissan",
  "Opel",
  "Peugeot",
  "Porsche",
  "Renault",
  "Subaru",
  "Suzuki",
  "Toyota",
  "Volkswagen",
  "Volvo",
] as const;

/**
 * Makes outside MAKES: sellers pick "Other" and type the make, which is saved
 * as typed (e.g. "Chery"). Search and filters group all of them under "Other".
 */
export const OTHER_MAKE = "Other";

const LISTED_MAKES: readonly string[] = MAKES;

export function isListedMake(make: string): boolean {
  return LISTED_MAKES.includes(make);
}

/** A typed make, matched to the standard list where it's on it ("toyota" → "Toyota"). */
export function canonicalMake(typed: string): string {
  const clean = typed.trim().replace(/\s+/g, " ");
  return LISTED_MAKES.find((m) => m.toLowerCase() === clean.toLowerCase()) ?? clean;
}

/** The make a listing is filed under in search: its own, or "Other". */
export function makeGroup(make: string): string {
  return isListedMake(make) ? make : OTHER_MAKE;
}

/** How a listing's model reads within its make group ("Chery Tiggo 4" under Other). */
export function modelLabel(vehicle: { make: string; model: string }): string {
  return isListedMake(vehicle.make) ? vehicle.model : `${vehicle.make} ${vehicle.model}`.trim();
}

export const PROVINCES: Province[] = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];

export const BODY_TYPES: BodyType[] = [
  "SUV",
  "Sedan",
  "Bakkie",
  "Hatchback",
  "Coupe",
  "Convertible",
  "MPV",
];

export const TRANSMISSIONS: Transmission[] = ["Manual", "Automatic", "Semi-Automatic", "CVT"];

export const FUEL_TYPES: FuelType[] = ["Petrol", "Diesel", "Hybrid", "Electric"];

export const CONDITIONS = ["New", "Used", "Demo"] as const;
/** What private sellers can pick ("Demo" is a dealer category). */
export const SELLER_CONDITIONS = ["New", "Used"] as const;

export const SERVICE_HISTORY_OPTIONS: ServiceHistory[] = [
  "Full Service History (Agents)",
  "Full Service History (Independent)",
  "Partial Service History",
  "No Service History",
];

export const ACCIDENT_HISTORY_OPTIONS = ["No Accident History", "Minor Accident (Repaired)"] as const;

export const VEHICLE_FEATURES = [
  "Air Conditioning",
  "Leather Seats",
  "Electric Windows",
  "Sunroof",
  "ABS",
  "Airbags",
  "Parking Sensors",
  "Reverse Camera",
  "Fog Lights",
  "Bluetooth",
  "Navigation System",
  "Alloy Wheels",
  "Cruise Control",
  "Push Start",
  "Heated Seats",
  "Tow Bar",
];

export const COLOURS = [
  "White",
  "Black",
  "Silver",
  "Grey",
  "Red",
  "Blue",
  "Light Blue",
  "Green",
  "Brown",
  "Beige",
  "Orange",
  "Yellow",
];

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "mileage-asc", label: "Mileage: Low to High" },
  { value: "year-asc", label: "Year: Old to New" },
  { value: "year-desc", label: "Year: New to Old" },
];
