/**
 * Static demo catalogue — fixture data only. The live site reads listings from
 * Supabase (see lib/data/listings.ts); these same vehicles were copied into the
 * database as demo listings by supabase/migrations/*_seed_demo_listings.sql.
 * Kept for design concept pages that render without a database.
 */
import type {
  AccidentHistory,
  BodyType,
  Condition,
  FuelType,
  Province,
  ServiceHistory,
  Transmission,
  Vehicle,
} from "@/lib/types";
import { COLOURS, PROVINCES, SERVICE_HISTORY_OPTIONS } from "@/lib/data/constants";

interface VehicleTemplate {
  make: string;
  model: string;
  variant: string;
  bodyType: BodyType;
  fuelType: FuelType;
  transmission: Transmission;
  price: number;
  year: number;
  mileage: number;
  /**
   * Optional rich detail. When a listing carries real specs (rather than the
   * generated filler) these win over the derived values in the builder below.
   */
  originalPrice?: number;
  province?: Province;
  town?: string;
  condition?: Condition;
  previousOwners?: number;
  serviceHistory?: ServiceHistory;
  accidentHistory?: AccidentHistory;
  colour?: string;
  features?: string[];
  description?: string;
  /** Photo paths under `public/` (real listing photos rather than the placeholder). */
  images?: string[];
  /** Days before "now" the listing went live — controls "Just added" ordering. */
  listedDaysAgo?: number;
  featured?: boolean;
}

const TEMPLATES: VehicleTemplate[] = [
  { make: "BMW", model: "X3", variant: "2.0d xDrive Auto", bodyType: "SUV", fuelType: "Diesel", transmission: "Automatic", price: 385000, year: 2019, mileage: 98000 },
  { make: "Volkswagen", model: "Polo Vivo", variant: "1.4 Trendline", bodyType: "Hatchback", fuelType: "Petrol", transmission: "Manual", price: 179000, year: 2021, mileage: 61000 },
  { make: "Toyota", model: "Corolla Cross", variant: "1.8 XR Hybrid", bodyType: "SUV", fuelType: "Hybrid", transmission: "Automatic", price: 349900, year: 2022, mileage: 42300 },
  { make: "Volkswagen", model: "Polo", variant: "1.6 Comfortline Sedan", bodyType: "Sedan", fuelType: "Petrol", transmission: "Manual", price: 219900, year: 2021, mileage: 74800 },
  { make: "Porsche", model: "Macan", variant: "S Auto", bodyType: "SUV", fuelType: "Petrol", transmission: "Automatic", price: 759950, year: 2019, mileage: 82000 },
  { make: "Mercedes-Benz", model: "C-Class", variant: "C200 AMG Line Auto", bodyType: "Sedan", fuelType: "Petrol", transmission: "Automatic", price: 459950, year: 2019, mileage: 71000 },
  { make: "BMW", model: "5 Series", variant: "520d M Sport", bodyType: "Sedan", fuelType: "Diesel", transmission: "Automatic", price: 479950, year: 2019, mileage: 88000 },
  { make: "Suzuki", model: "Swift", variant: "1.2 GL+", bodyType: "Hatchback", fuelType: "Petrol", transmission: "Manual", price: 219900, year: 2025, mileage: 8300 },
  { make: "BMW", model: "3 Series", variant: "M340i xDrive Auto", bodyType: "Sedan", fuelType: "Petrol", transmission: "Automatic", price: 849000, year: 2021, mileage: 39000 },
  { make: "Peugeot", model: "208", variant: "1.6 Active", bodyType: "Hatchback", fuelType: "Petrol", transmission: "Automatic", price: 129900, year: 2016, mileage: 138000 },
  { make: "Ford", model: "EcoSport", variant: "1.0 EcoBoost Trend", bodyType: "SUV", fuelType: "Petrol", transmission: "Manual", price: 189000, year: 2020, mileage: 68000 },
  { make: "Nissan", model: "X-Trail", variant: "2.5 Acenta 4x4 Auto", bodyType: "SUV", fuelType: "Petrol", transmission: "Automatic", price: 349900, year: 2023, mileage: 46500 },
  { make: "Volkswagen", model: "T-Cross", variant: "1.5 TSI R-Line Auto", bodyType: "SUV", fuelType: "Petrol", transmission: "Automatic", price: 304900, year: 2021, mileage: 55000 },
  { make: "Mahindra", model: "Pik Up", variant: "2.2 mHawk S11 Auto Double-Cab", bodyType: "Bakkie", fuelType: "Diesel", transmission: "Automatic", price: 325900, year: 2022, mileage: 61000 },
  { make: "Mazda", model: "CX-5", variant: "2.0 Carbon Edition Auto", bodyType: "SUV", fuelType: "Petrol", transmission: "Automatic", price: 399900, year: 2023, mileage: 37000 },
  { make: "Kia", model: "Picanto", variant: "1.0 LX Manual", bodyType: "Hatchback", fuelType: "Petrol", transmission: "Manual", price: 204900, year: 2024, mileage: 21000 },
  { make: "Kia", model: "Sonet", variant: "1.5 LX", bodyType: "SUV", fuelType: "Petrol", transmission: "Manual", price: 299900, year: 2025, mileage: 9800 },
  { make: "Nissan", model: "Navara", variant: "2.5 DDTi SE Plus Auto Double-Cab", bodyType: "Bakkie", fuelType: "Diesel", transmission: "Automatic", price: 459900, year: 2024, mileage: 24000 },
  { make: "Opel", model: "Mokka", variant: "1.2T Elegance Auto", bodyType: "SUV", fuelType: "Petrol", transmission: "Automatic", price: 269900, year: 2022, mileage: 41000 },
  { make: "Renault", model: "Kiger", variant: "1.0 Energy Zen", bodyType: "SUV", fuelType: "Petrol", transmission: "Manual", price: 199000, year: 2025, mileage: 6400 },
  { make: "Volkswagen", model: "Tiguan", variant: "1.4 TSI Life 4x2 Auto", bodyType: "SUV", fuelType: "Petrol", transmission: "Automatic", price: 435000, year: 2023, mileage: 48500 },
  { make: "Mercedes-Benz", model: "GLC Coupe", variant: "300 4Matic AMG Auto", bodyType: "SUV", fuelType: "Petrol", transmission: "Automatic", price: 669900, year: 2020, mileage: 63000 },
  { make: "Ford", model: "Tourneo Custom", variant: "2.2 TDCi Ambiente LWB", bodyType: "MPV", fuelType: "Diesel", transmission: "Manual", price: 209900, year: 2015, mileage: 154000 },
  { make: "Hyundai", model: "Creta", variant: "2.0 Elite Auto", bodyType: "SUV", fuelType: "Petrol", transmission: "Automatic", price: 264900, year: 2023, mileage: 51000 },
  { make: "Hyundai", model: "i20", variant: "1.0T Fluid", bodyType: "Hatchback", fuelType: "Petrol", transmission: "Manual", price: 239900, year: 2021, mileage: 32000 },
  { make: "Nissan", model: "NP200", variant: "1.6 A/C Safety Pack", bodyType: "Bakkie", fuelType: "Petrol", transmission: "Manual", price: 179900, year: 2021, mileage: 92000 },
  { make: "Toyota", model: "Quantum", variant: "2.7 Sesfikile 16-Seat", bodyType: "MPV", fuelType: "Petrol", transmission: "Manual", price: 395000, year: 2021, mileage: 187000 },
  { make: "Mercedes-Benz", model: "A-Class", variant: "A200d AMG Line Auto", bodyType: "Hatchback", fuelType: "Diesel", transmission: "Automatic", price: 469950, year: 2020, mileage: 58000 },
  { make: "Toyota", model: "Hilux", variant: "2.4 GD-6 Auto Double-Cab", bodyType: "Bakkie", fuelType: "Diesel", transmission: "Automatic", price: 439900, year: 2023, mileage: 71500 },
  { make: "Isuzu", model: "D-Max", variant: "250C Single-Cab", bodyType: "Bakkie", fuelType: "Diesel", transmission: "Manual", price: 359950, year: 2025, mileage: 4200 },
  { make: "Jeep", model: "Wrangler", variant: "Rubicon 2.0T Auto 4-Door", bodyType: "SUV", fuelType: "Petrol", transmission: "Automatic", price: 1095000, year: 2025, mileage: 11500 },
  { make: "Audi", model: "A3 Sportback", variant: "1.8 TFSI SE Auto", bodyType: "Hatchback", fuelType: "Petrol", transmission: "Automatic", price: 259950, year: 2016, mileage: 89000 },
  { make: "Subaru", model: "Forester", variant: "2.5 XS Lineartronic", bodyType: "SUV", fuelType: "Petrol", transmission: "CVT", price: 188900, year: 2017, mileage: 176000 },
  { make: "Honda", model: "Civic", variant: "2.0 Type R", bodyType: "Hatchback", fuelType: "Petrol", transmission: "Manual", price: 309950, year: 2012, mileage: 118000 },
  { make: "Toyota", model: "Land Cruiser 79", variant: "4.5D Auto", bodyType: "Bakkie", fuelType: "Diesel", transmission: "Automatic", price: 969000, year: 2024, mileage: 28000 },
  { make: "Volvo", model: "XC40", variant: "T4 Momentum Auto", bodyType: "SUV", fuelType: "Petrol", transmission: "Automatic", price: 449900, year: 2021, mileage: 44000 },
  { make: "Mini", model: "Cooper S", variant: "3-Door Auto", bodyType: "Hatchback", fuelType: "Petrol", transmission: "Automatic", price: 329900, year: 2020, mileage: 52000 },
  { make: "Chevrolet", model: "Spark", variant: "1.2 Pronto", bodyType: "Hatchback", fuelType: "Petrol", transmission: "Manual", price: 89900, year: 2017, mileage: 121000 },
  { make: "Haval", model: "H2", variant: "1.5T City Auto", bodyType: "SUV", fuelType: "Petrol", transmission: "Automatic", price: 209950, year: 2019, mileage: 67000 },
  { make: "Suzuki", model: "SX4", variant: "2.0 GLX", bodyType: "Hatchback", fuelType: "Petrol", transmission: "Manual", price: 139000, year: 2010, mileage: 141000 },
  { make: "Ford", model: "Ranger", variant: "2.2 TDCi XL 4x4 Double-Cab", bodyType: "Bakkie", fuelType: "Diesel", transmission: "Manual", price: 299900, year: 2017, mileage: 154000 },
  { make: "Kia", model: "Rio", variant: "1.4 LX 5-dr Auto", bodyType: "Hatchback", fuelType: "Petrol", transmission: "Automatic", price: 169950, year: 2018, mileage: 96000 },
  {
    make: "BMW",
    model: "X1",
    variant: "sDrive18d M Sport",
    bodyType: "SUV",
    fuelType: "Diesel",
    transmission: "Automatic",
    price: 804800,
    year: 2025,
    mileage: 21800,
    province: "KwaZulu-Natal",
    town: "Umhlanga",
    condition: "Used",
    previousOwners: 1,
    serviceHistory: "Full Service History (Agents)",
    accidentHistory: "No Accident History",
    colour: "Alpine White",
    images: [
      "/listings/bmw-x1-sdrive18d/01.jpg",
      "/listings/bmw-x1-sdrive18d/02.jpg",
      "/listings/bmw-x1-sdrive18d/03.jpg",
      "/listings/bmw-x1-sdrive18d/04.jpg",
      "/listings/bmw-x1-sdrive18d/05.jpg",
      "/listings/bmw-x1-sdrive18d/06.jpg",
    ],
    listedDaysAgo: 0,
    featured: true,
    features: [
      "M Sport Package",
      "Sensatec Leather Upholstery",
      "Navigation System",
      "Reverse Camera",
      "Park Distance Control (Front & Rear)",
      "Adaptive Cruise Control",
      "Apple CarPlay & Android Auto",
      '18" M Light-Alloy Wheels',
      "Dual-Zone Climate Control",
      "LED Headlights",
      "Keyless Start",
      "Electric Tailgate",
    ],
    description:
      "2025 BMW X1 sDrive18d M Sport in Alpine White with the full M Sport package. One owner from new with a complete BMW franchise service history and the balance of the BMW Motorplan (roughly 47 months / 78 200 km remaining). The 2.0-litre turbodiesel puts out 110 kW and 360 Nm and still returns a genuine 5.0 l/100km on the open road. Meticulously maintained, never been in an accident, and still under factory warranty. Selling privately in Umhlanga — no dealer mark-up, no admin fees.",
  },
];

const SELLERS = [
  { id: "seed-seller-1", name: "Johan v.d. Merwe", phone: "082 314 6620" },
  { id: "seed-seller-2", name: "Thandiwe Nkosi", phone: "071 902 4481" },
  { id: "seed-seller-3", name: "Rushil Naidoo", phone: "083 447 9012" },
  { id: "seed-seller-4", name: "Anél Botha", phone: "076 218 3390" },
  { id: "seed-seller-5", name: "Sipho Dlamini", phone: "084 559 7723" },
];

const ACCIDENT_CYCLE: AccidentHistory[] = [
  "No Accident History",
  "No Accident History",
  "No Accident History",
  "Minor Accident (Repaired)",
];

const TOWNS_BY_PROVINCE: Record<Province, string[]> = {
  Gauteng: ["Sandton", "Pretoria", "Randburg", "Centurion", "Midrand"],
  "Western Cape": ["Cape Town", "Bellville", "Stellenbosch", "Paarl"],
  "KwaZulu-Natal": ["Durban", "Pietermaritzburg", "Umhlanga"],
  "Eastern Cape": ["Gqeberha", "East London"],
  "Free State": ["Bloemfontein", "Welkom"],
  Limpopo: ["Polokwane", "Tzaneen"],
  Mpumalanga: ["Nelspruit", "Witbank"],
  "North West": ["Rustenburg", "Potchefstroom"],
  "Northern Cape": ["Kimberley", "Upington"],
};

function pick<T>(arr: T[], index: number): T {
  return arr[index % arr.length];
}

function buildFeatures(index: number): string[] {
  const pool = [
    "Air Conditioning",
    "Electric Windows",
    "ABS",
    "Airbags",
    "Bluetooth",
    "Alloy Wheels",
    "Parking Sensors",
    "Cruise Control",
    "Leather Seats",
    "Sunroof",
    "Reverse Camera",
    "Navigation System",
    "Push Start",
    "Fog Lights",
  ];
  const count = 5 + (index % 5);
  const start = index % pool.length;
  const rotated = [...pool.slice(start), ...pool.slice(0, start)];
  return rotated.slice(0, count);
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export const VEHICLES: Vehicle[] = TEMPLATES.map((t, i) => {
  const province = t.province ?? pick(PROVINCES, i * 3 + 1);
  const towns = TOWNS_BY_PROVINCE[province];
  const town = t.town ?? pick(towns, i);
  const seller = pick(SELLERS, i);
  const condition: Condition =
    t.condition ?? (t.mileage < 6000 ? "New" : i % 11 === 0 ? "Demo" : "Used");
  const serviceHistory: ServiceHistory = t.serviceHistory ?? pick(SERVICE_HISTORY_OPTIONS, i * 2);
  // ~1 in 4 listings have had a price drop.
  const hasPriceDrop = i % 4 === 1;
  const originalPrice =
    t.originalPrice ??
    (hasPriceDrop ? Math.round((t.price * (1.08 + (i % 3) * 0.04)) / 500) * 500 : undefined);

  return {
    id: `v-${i + 1}`,
    make: t.make,
    model: t.model,
    variant: t.variant,
    year: t.year,
    price: t.price,
    ...(originalPrice ? { originalPrice } : {}),
    mileage: t.mileage,
    transmission: t.transmission,
    fuelType: t.fuelType,
    bodyType: t.bodyType,
    province,
    town,
    condition,
    previousOwners: t.previousOwners ?? (condition === "New" ? 0 : 1 + (i % 3)),
    serviceHistory,
    accidentHistory: t.accidentHistory ?? pick(ACCIDENT_CYCLE, i),
    colour: t.colour ?? pick(COLOURS, i * 5 + 2),
    features: t.features ?? buildFeatures(i),
    description:
      t.description ??
      `${t.year} ${t.make} ${t.model} ${t.variant} in ${condition.toLowerCase()} condition. ${serviceHistory}. Well looked after and ready for its next owner in ${town}, ${province}.`,
    images: t.images ?? [],
    featured: t.featured ?? i % 5 === 0,
    status: "active",
    sellerId: seller.id,
    sellerName: seller.name,
    phone: seller.phone,
    createdAt: daysAgoISO(t.listedDaysAgo ?? i * 2 + 1),
  };
});

export function getFeaturedVehicles(limit = 9): Vehicle[] {
  return VEHICLES.filter((v) => v.featured).slice(0, limit);
}

export function getLatestVehicles(limit = 8): Vehicle[] {
  return [...VEHICLES]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
