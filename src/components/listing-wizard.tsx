"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { ListingError, createListing, updateListing } from "@/lib/store/listings";
import { deleteListingPhotos } from "@/lib/storage";
import { formatCurrency } from "@/lib/format";
import type {
  AccidentHistory,
  BodyType,
  Condition,
  FuelType,
  Province,
  NewVehicleInput,
  ServiceHistory,
  Transmission,
  User,
  Vehicle,
} from "@/lib/types";
import {
  ACCIDENT_HISTORY_OPTIONS,
  BODY_TYPES,
  COLOURS,
  CONDITIONS,
  FUEL_TYPES,
  MAKES,
  PROVINCES,
  SERVICE_HISTORY_OPTIONS,
  TRANSMISSIONS,
  VEHICLE_FEATURES,
} from "@/lib/data/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SiteContainer } from "@/components/site-container";
import { ListingPreviewCard } from "@/components/listing-preview-card";
import { PhotoUploader } from "@/components/photo-uploader";

export interface FormState {
  make: string;
  model: string;
  variant: string;
  year: string;
  price: string;
  mileage: string;
  province: Province | "";
  town: string;
  bodyType: BodyType | "";
  transmission: Transmission | "";
  fuelType: FuelType | "";
  condition: Condition | "";
  previousOwners: string;
  serviceHistory: ServiceHistory | "";
  accidentHistory: AccidentHistory | "";
  colour: string;
  features: string[];
  description: string;
  /** Public URLs of uploaded photos; the first is the cover. */
  images: string[];
  /** Contact details shown to buyers on the listing. */
  sellerName: string;
  phone: string;
}

const EMPTY_FORM: FormState = {
  make: "",
  model: "",
  variant: "",
  year: "",
  price: "",
  mileage: "",
  province: "",
  town: "",
  bodyType: "",
  transmission: "",
  fuelType: "",
  condition: "",
  previousOwners: "",
  serviceHistory: "",
  accidentHistory: "",
  colour: "",
  features: [],
  description: "",
  images: [],
  sellerName: "",
  phone: "",
};

function vehicleToForm(v: Vehicle): FormState {
  return {
    make: v.make,
    model: v.model,
    variant: v.variant,
    year: String(v.year),
    price: String(v.price),
    mileage: String(v.mileage),
    province: v.province,
    town: v.town,
    bodyType: v.bodyType,
    transmission: v.transmission,
    fuelType: v.fuelType,
    condition: v.condition,
    previousOwners: String(v.previousOwners),
    serviceHistory: v.serviceHistory,
    accidentHistory: v.accidentHistory,
    colour: v.colour,
    features: v.features,
    description: v.description,
    images: v.images,
    sellerName: v.sellerName,
    phone: v.phone,
  };
}

function initialForm(existing: Vehicle | undefined, user: User | null): FormState {
  if (existing) return vehicleToForm(existing);
  return { ...EMPTY_FORM, sellerName: user?.name ?? "", phone: user?.phone ?? "" };
}

const STEPS = ["Vehicle Details", "Specs & Features", "Photos", "Description & Price", "Review"];

export function ListingWizard({
  mode,
  existingListing,
  showWelcome,
}: {
  mode: "create" | "edit";
  existingListing?: Vehicle;
  showWelcome?: boolean;
}) {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(() => initialForm(existingListing, user));
  const [submitting, setSubmitting] = useState(false);
  // Photos uploaded in this session can be deleted from storage as soon as
  // they're removed. Photos already saved on the listing are only deleted
  // once the edit is saved, so abandoning the edit doesn't break the listing.
  const uploadedThisSession = useRef(new Set<string>());
  const [removedSavedPhotos, setRemovedSavedPhotos] = useState<string[]>([]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleFeature(feature: string) {
    setForm((f) => ({
      ...f,
      features: f.features.includes(feature)
        ? f.features.filter((x) => x !== feature)
        : [...f.features, feature],
    }));
  }

  const canContinueStep0 = form.make && form.model && form.year && form.price && form.province && form.bodyType;

  function handlePhotosChange(update: (images: string[]) => string[]) {
    setForm((f) => {
      const images = update(f.images);
      images.forEach((url) => {
        if (!f.images.includes(url)) uploadedThisSession.current.add(url);
      });
      return { ...f, images };
    });
  }

  function handlePhotoRemoved(url: string) {
    if (uploadedThisSession.current.has(url)) {
      uploadedThisSession.current.delete(url);
      void deleteListingPhotos([url]);
    } else {
      setRemovedSavedPhotos((urls) => [...urls, url]);
    }
  }

  function goNext() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handlePublish() {
    if (!user) return;
    if (!form.sellerName.trim() || !form.phone.trim()) {
      toast.error("Add your name and contact number so buyers can reach you.");
      setStep(3);
      return;
    }
    setSubmitting(true);

    const payload: NewVehicleInput = {
      make: form.make,
      model: form.model,
      variant: form.variant,
      year: Number(form.year) || new Date().getFullYear(),
      price: Number(form.price) || 0,
      mileage: Number(form.mileage) || 0,
      province: (form.province || "Gauteng") as Province,
      town: form.town || "—",
      bodyType: (form.bodyType || "Sedan") as BodyType,
      transmission: (form.transmission || "Manual") as Transmission,
      fuelType: (form.fuelType || "Petrol") as FuelType,
      condition: (form.condition || "Used") as Condition,
      previousOwners: Number(form.previousOwners) || 0,
      serviceHistory: (form.serviceHistory || "Partial Service History") as ServiceHistory,
      accidentHistory: (form.accidentHistory || "No Accident History") as AccidentHistory,
      colour: form.colour || "White",
      features: form.features,
      description: form.description,
      images: form.images,
      sellerName: form.sellerName.trim(),
      phone: form.phone.trim(),
    };

    try {
      if (mode === "edit" && existingListing) {
        await updateListing(existingListing.id, payload);
        await deleteListingPhotos(removedSavedPhotos);
        toast.success("Listing updated.");
      } else {
        await createListing(payload);
        toast.success("Your listing is live.");
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof ListingError
          ? "We couldn't save your listing. Check the details and try again."
          : "Something went wrong. Please try again.",
      );
      setSubmitting(false);
      return;
    }

    // Remember contact details for the next listing (best effort).
    if (payload.sellerName !== user.name || payload.phone !== user.phone) {
      updateProfile({ name: payload.sellerName, phone: payload.phone }).catch(() => {});
    }
    router.push("/dashboard");
  }

  return (
    <SiteContainer className="py-10">
      {showWelcome && (
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="font-semibold">Welcome to Private Wheels!</p>
            <p className="text-sm text-muted-foreground">
              Your account is ready. Let&apos;s get your first vehicle listed — it only takes a
              few minutes.
            </p>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-semibold tracking-tight">
        {mode === "edit" ? "Edit listing" : "Create a new listing"}
      </h1>

      {/* Step indicator */}
      <div className="mt-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`flex items-center gap-2 ${i < STEPS.length - 1 ? "flex-1" : "flex-none"}`}
          >
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && <div className="h-0.5 flex-1 bg-muted" />}
          </div>
        ))}
      </div>
      <p className="mt-2 text-sm font-semibold text-muted-foreground">{STEPS[step]}</p>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div>
      <div className="rounded-2xl border bg-card p-6">
        {step === 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Make</Label>
              <Select value={form.make} onValueChange={(v) => set("make", v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v: string | null) => v || "Select make"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {MAKES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Model</Label>
              <Input value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="e.g. Polo" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Variant</Label>
              <Input
                value={form.variant}
                onChange={(e) => set("variant", e.target.value)}
                placeholder="e.g. 1.4 Trendline"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Year</Label>
              <Input
                type="number"
                value={form.year}
                onChange={(e) => set("year", e.target.value)}
                placeholder="e.g. 2021"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Price (R)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="e.g. 219900"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Mileage (km)</Label>
              <Input
                type="number"
                value={form.mileage}
                onChange={(e) => set("mileage", e.target.value)}
                placeholder="e.g. 65000"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Body Type</Label>
              <Select value={form.bodyType} onValueChange={(v) => set("bodyType", v as BodyType)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v: string | null) => v || "Select body type"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {BODY_TYPES.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Condition</Label>
              <Select value={form.condition} onValueChange={(v) => set("condition", v as Condition)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v: string | null) => v || "Select condition"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Transmission</Label>
              <Select value={form.transmission} onValueChange={(v) => set("transmission", v as Transmission)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v: string | null) => v || "Select transmission"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TRANSMISSIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Fuel Type</Label>
              <Select value={form.fuelType} onValueChange={(v) => set("fuelType", v as FuelType)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v: string | null) => v || "Select fuel type"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {FUEL_TYPES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Province</Label>
              <Select value={form.province} onValueChange={(v) => set("province", v as Province)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v: string | null) => v || "Select province"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PROVINCES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Town / Suburb</Label>
              <Input value={form.town} onChange={(e) => set("town", e.target.value)} placeholder="e.g. Sandton" />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Previous Owners</Label>
                <Input
                  type="number"
                  value={form.previousOwners}
                  onChange={(e) => set("previousOwners", e.target.value)}
                  placeholder="e.g. 1"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Colour</Label>
                <Select value={form.colour} onValueChange={(v) => set("colour", v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{(v: string | null) => v || "Select colour"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {COLOURS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Service History</Label>
                <Select value={form.serviceHistory} onValueChange={(v) => set("serviceHistory", v as ServiceHistory)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{(v: string | null) => v || "Select service history"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_HISTORY_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Accident History</Label>
                <Select value={form.accidentHistory} onValueChange={(v) => set("accidentHistory", v as AccidentHistory)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{(v: string | null) => v || "Select accident history"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ACCIDENT_HISTORY_OPTIONS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Vehicle Features</Label>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {VEHICLE_FEATURES.map((feature) => (
                  <label key={feature} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.features.includes(feature)}
                      onCheckedChange={() => toggleFeature(feature)}
                    />
                    {feature}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && user && (
          <PhotoUploader
            userId={user.id}
            images={form.images}
            onChange={handlePhotosChange}
            onRemove={handlePhotoRemoved}
          />
        )}

        {step === 3 && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <Label>Description</Label>
              <Textarea
                rows={8}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Describe your vehicle's condition, history, and any extras..."
              />
            </div>
            <div>
              <p className="text-sm font-semibold">How buyers reach you</p>
              <p className="text-sm text-muted-foreground">
                Shown on your listing. Buyers tap to reveal your number.
              </p>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="seller-name">Your name</Label>
                  <Input
                    id="seller-name"
                    value={form.sellerName}
                    onChange={(e) => set("sellerName", e.target.value)}
                    placeholder="e.g. Thandi Nkosi"
                    maxLength={80}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="seller-phone">Contact number</Label>
                  <Input
                    id="seller-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="e.g. 082 123 4567"
                    maxLength={30}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground uppercase">
                {form.year} {form.make}
              </p>
              <p className="text-lg font-bold">
                {form.model} {form.variant}
              </p>
              <p className="text-xl font-extrabold text-primary">
                {form.price ? formatCurrency(Number(form.price)) : "R —"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <ReviewField label="Mileage" value={form.mileage ? `${form.mileage} km` : "—"} />
              <ReviewField label="Transmission" value={form.transmission || "—"} />
              <ReviewField label="Fuel Type" value={form.fuelType || "—"} />
              <ReviewField label="Body Type" value={form.bodyType || "—"} />
              <ReviewField label="Condition" value={form.condition || "—"} />
              <ReviewField label="Province" value={form.province ? `${form.town}, ${form.province}` : "—"} />
              <ReviewField label="Colour" value={form.colour || "—"} />
              <ReviewField label="Previous Owners" value={form.previousOwners || "—"} />
              <ReviewField label="Features" value={`${form.features.length} selected`} />
              <ReviewField label="Photos" value={`${form.images.length} added`} />
              <ReviewField
                label="Contact"
                value={[form.sellerName, form.phone].filter(Boolean).join(" · ") || "—"}
              />
            </div>
            {form.description && (
              <div>
                <p className="text-xs text-muted-foreground uppercase">Description</p>
                <p className="mt-1 text-sm">{form.description}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <Button
          variant="outline"
          className="rounded-full"
          onClick={goBack}
          disabled={step === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            onClick={goNext}
            disabled={step === 0 && !canContinueStep0}
            className="rounded-full bg-foreground text-background hover:opacity-90"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={() => void handlePublish()}
            disabled={submitting}
            className="rounded-full bg-primary hover:bg-primary/90"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "edit" ? "Save Changes" : "Publish Listing"}
          </Button>
        )}
      </div>
      </div>

      <div className="lg:sticky lg:top-24">
        <ListingPreviewCard form={form} />
      </div>
      </div>
    </SiteContainer>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
