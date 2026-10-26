export type Transmission = "Manual" | "Automatic" | "Semi-Automatic" | "CVT";

export type FuelType = "Petrol" | "Diesel" | "Hybrid" | "Electric";

export type BodyType =
  | "SUV"
  | "Sedan"
  | "Bakkie"
  | "Hatchback"
  | "Coupe"
  | "Convertible"
  | "MPV";

export type Condition = "New" | "Used" | "Demo";

export type ServiceHistory =
  | "Full Service History (Agents)"
  | "Full Service History (Independent)"
  | "Partial Service History"
  | "No Service History";

export type AccidentHistory = "No Accident History" | "Minor Accident (Repaired)";

export type Province =
  | "Eastern Cape"
  | "Free State"
  | "Gauteng"
  | "KwaZulu-Natal"
  | "Limpopo"
  | "Mpumalanga"
  | "North West"
  | "Northern Cape"
  | "Western Cape";

export type ListingStatus = "pending_payment" | "active" | "paused" | "sold" | "draft";

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  variant: string;
  year: number;
  price: number;
  /** Pre-drop price — set only when the seller has reduced the asking price. */
  originalPrice?: number;
  mileage: number;
  transmission: Transmission;
  fuelType: FuelType;
  bodyType: BodyType;
  province: Province;
  town: string;
  condition: Condition;
  previousOwners: number;
  serviceHistory: ServiceHistory;
  accidentHistory: AccidentHistory;
  colour: string;
  features: string[];
  description: string;
  images: string[];
  featured: boolean;
  status: ListingStatus;
  /** Empty for the pre-launch demo listings, which have no real seller. */
  sellerId: string;
  sellerName: string;
  phone: string;
  createdAt: string;
}

/** What a seller submits from the listing wizard. */
export type NewVehicleInput = Omit<
  Vehicle,
  "id" | "sellerId" | "createdAt" | "status" | "featured" | "originalPrice"
>;

/** The signed-in user: Supabase Auth account + their `profiles` row. */
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
}

export interface FilterState {
  make: string;
  model: string;
  /** Serialized multi make/model selection from the hero search (see lib/make-model). */
  mm: string;
  priceMin: string;
  priceMax: string;
  yearMin: string;
  yearMax: string;
  mileageMin: string;
  mileageMax: string;
  province: string;
  condition: string;
  transmission: string;
  /** Comma-separated list of fuel types — the PLP fuel filter is multi-select. */
  fuelType: string;
  bodyType: string;
  sort: string;
}

export interface InstalmentInputs {
  price: number;
  deposit: number;
  rate: number;
  termMonths: number;
  balloonPct: number;
}

export interface InstalmentResult {
  monthlyInstalment: number;
  principal: number;
  balloonAmount: number;
  totalRepayment: number;
  totalInterest: number;
}

export interface AffordabilityInputs {
  income: number;
  expenses: number;
  rate?: number;
  termMonths?: number;
}

export interface AffordabilityResult {
  disposableIncome: number;
  maxInstalment: number;
  maxVehiclePrice: number;
}
