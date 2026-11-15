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
