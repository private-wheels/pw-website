"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Loader2, Save, Sparkles } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { ListingError, createListing, saveDraft, updateListing } from "@/lib/store/listings";
import { PaymentError, goToCheckout } from "@/lib/store/payments";
import { useListingFee } from "@/hooks/use-listing-fee";
import { LISTING_FEE_CENTS, formatFee } from "@/lib/payments";
import { publishWithoutPayment } from "@/app/actions/admin";
import { resubmitListing } from "@/app/actions/listings";
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
  SELLER_CONDITIONS,
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
import { HelpCallout } from "@/components/help-callout";
import { ListingPreviewCard } from "@/components/listing-preview-card";
import { PhotoUploader } from "@/components/photo-uploader";
import { type ListingPhoto, fromPhotos, listViews, missingViews, toPhotos } from "@/lib/listing-photos";

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
  /** Uploaded photos and the view each shows; the front photo is the cover. */
  photos: ListingPhoto[];
  /** The photo chosen as the cover; null means the front photo. */
  coverUrl: string | null;
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
  photos: [],
  coverUrl: null,
  sellerName: "",
  phone: "",
};

function vehicleToForm(v: Vehicle): FormState {
  // Drafts store blank numbers as 0 (year, price) — show them blank again.
  const draft = v.status === "draft";
  const number = (n: number) => (draft && !n ? "" : String(n));
  return {
    make: v.make,
    model: v.model,
    variant: v.variant,
    year: number(v.year),
    price: number(v.price),
    mileage: number(v.mileage),
    province: v.province,
    town: v.town,
    bodyType: v.bodyType,
    transmission: v.transmission,
    fuelType: v.fuelType,
    condition: v.condition,
    previousOwners: number(v.previousOwners),
    serviceHistory: v.serviceHistory,
    accidentHistory: v.accidentHistory,
    colour: v.colour,
    features: v.features,
    description: v.description,
    photos: toPhotos(v.images, v.photoViews),
    coverUrl: v.images[0] ?? null,
    sellerName: v.sellerName,
    phone: v.phone,
  };
}

function initialForm(existing: Vehicle | undefined, user: User | null): FormState {
  if (existing) return vehicleToForm(existing);
  return { ...EMPTY_FORM, sellerName: user?.name ?? "", phone: user?.phone ?? "" };
}

const STEPS = ["Vehicle Details", "Specs & Features", "Photos", "Description & Price", "Review"];

/**
 * Everything on a listing is required except the optional extra photos.
 * Each check returns the problem to show, or null when the field is fine.
 */
type Check = { field: keyof FormState; label: string; problem: (f: FormState) => string | null };

const blank = (value: string) => value.trim() === "";
const wholeNumberIn = (value: string, min: number, max: number) => {
  const n = Number(value);
  return !blank(value) && Number.isInteger(n) && n >= min && n <= max;
};
const required = (field: keyof FormState, label: string): Check => ({
  field,
  label,
  problem: (f) => (blank(String(f[field] ?? "")) ? label : null),
});

const STEP_CHECKS: Check[][] = [
  [
    required("make", "Make"),
    required("model", "Model"),
    required("variant", "Variant"),
    {
      field: "year",
      label: "Year",
      problem: (f) => (wholeNumberIn(f.year, 1900, new Date().getFullYear() + 1) ? null : "Year"),
    },
    { field: "price", label: "Price", problem: (f) => (wholeNumberIn(f.price, 1, 100_000_000) ? null : "Price") },
    { field: "mileage", label: "Mileage", problem: (f) => (wholeNumberIn(f.mileage, 0, 5_000_000) ? null : "Mileage") },
    required("bodyType", "Body type"),
    required("condition", "Condition"),
    required("transmission", "Transmission"),
    required("fuelType", "Fuel type"),
    required("province", "Province"),
    required("town", "Town / suburb"),
  ],
  [
    {
      field: "previousOwners",
      label: "Previous owners",
      problem: (f) => (wholeNumberIn(f.previousOwners, 0, 50) ? null : "Previous owners"),
    },
    required("colour", "Colour"),
    required("serviceHistory", "Service history"),
    required("accidentHistory", "Accident history"),
    { field: "features", label: "Features", problem: (f) => (f.features.length > 0 ? null : "At least one feature") },
  ],
  [
    {
      field: "photos",
      label: "Photos",
      problem: (f) => {
        const missing = missingViews(f.photos.map((p) => p.view));
        return missing.length > 0 ? `Photos of ${listViews(missing)}` : null;
      },
    },
  ],
  [
    required("description", "Description"),
    required("sellerName", "Your name"),
    {
      field: "phone",
      label: "Contact number",
      problem: (f) => (f.phone.replace(/\D/g, "").length >= 9 ? null : "Contact number"),
    },
  ],
  [],
];

/** The problems on one step, as short labels ("Year", "Photos of the back"). */
function stepProblems(form: FormState, step: number): string[] {
  return (STEP_CHECKS[step] ?? []).map((c) => c.problem(form)).filter((p): p is string => p !== null);
}

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
  const isAdmin = user?.role === "admin";
  const fee = useListingFee();
  const resubmitting = mode === "edit" && existingListing?.status === "changes_requested";
  // Finishing a saved draft works like creating a new listing.
  const finishingDraft = mode === "edit" && existingListing?.status === "draft";
  const creating = mode === "create" || finishingDraft;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(() => initialForm(existingListing, user));
  const [submitting, setSubmitting] = useState(false);
  // The saved draft this wizard is writing to, once there is one.
  const [draftId, setDraftId] = useState<string | null>(finishingDraft ? existingListing.id : null);
  const [savingDraft, setSavingDraft] = useState(false);
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

  // Steps where the seller tried to move on with gaps: their problems show.
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);
  const currentProblems = checkedSteps.includes(step) ? stepProblems(form, step) : [];
  /** Whether to mark a field as missing (only once they've tried to move on). */
  function invalid(field: keyof FormState): boolean {
    const stepIndex = STEP_CHECKS.findIndex((checks) => checks.some((c) => c.field === field));
    if (!checkedSteps.includes(stepIndex)) return false;
    return STEP_CHECKS[stepIndex].some((c) => c.field === field && c.problem(form) !== null);
  }

  function handlePhotosChange(update: (photos: ListingPhoto[]) => ListingPhoto[]) {
    setForm((f) => {
      const photos = update(f.photos);
      photos.forEach(({ url }) => {
        if (!f.photos.some((p) => p.url === url)) uploadedThisSession.current.add(url);
      });
      return { ...f, photos };
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
    if (stepProblems(form, step).length > 0) {
      setCheckedSteps((s) => (s.includes(step) ? s : [...s, step]));
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  /**
   * Saves what's there so far as a draft. Temporary /list accounts are asked
   * to sign in or create an account next, so the draft has an owner they can
   * come back to.
   */
  async function handleSaveDraft() {
    if (!user) return;
    const { make, model, year, price, photos, description } = form;
    if (!make && !model.trim() && !year && !price && photos.length === 0 && !description.trim()) {
      toast.error("Add a few details about your car first.");
      return;
    }
    setSavingDraft(true);
    try {
      const saved = await saveDraft(draftId, { ...form, ...fromPhotos(form.photos, form.coverUrl) });
      setDraftId(saved.id);
      // Photos on the saved draft are now kept until the listing is saved
      // without them; ones removed before this save can go now.
      uploadedThisSession.current.clear();
      if (removedSavedPhotos.length > 0) {
        await deleteListingPhotos(removedSavedPhotos);
        setRemovedSavedPhotos([]);
      }
      if (user.isAnonymous) {
        router.push(`/list/account?listing=${saved.id}&draft=1`);
        return;
      }
      toast.success("Draft saved. You'll find it in your dashboard whenever you're ready to finish it.");
    } catch (err) {
      console.error(err);
      toast.error("We couldn't save your draft. Please try again.");
    }
    setSavingDraft(false);
  }

  async function handlePublish() {
    if (!user) return;
    // Everything is required: go back to the first step with gaps.
    const incomplete = STEPS.findIndex((_, i) => stepProblems(form, i).length > 0);
    if (incomplete !== -1) {
      setCheckedSteps((s) => (s.includes(incomplete) ? s : [...s, incomplete]));
      setStep(incomplete);
      toast.error("Some details are missing. Fill in the highlighted fields to continue.");
      return;
    }
    setSubmitting(true);

    const payload: NewVehicleInput = {
      make: form.make,
      model: form.model,
      variant: form.variant,
      // All checked by stepProblems above.
      year: Number(form.year),
      price: Number(form.price),
      mileage: Number(form.mileage),
      province: form.province as Province,
      town: form.town.trim(),
      bodyType: form.bodyType as BodyType,
      transmission: form.transmission as Transmission,
      fuelType: form.fuelType as FuelType,
      condition: form.condition as Condition,
      previousOwners: Number(form.previousOwners),
      serviceHistory: form.serviceHistory as ServiceHistory,
      accidentHistory: form.accidentHistory as AccidentHistory,
      colour: form.colour,
      features: form.features,
      description: form.description.trim(),
      ...fromPhotos(form.photos, form.coverUrl),
      sellerName: form.sellerName.trim(),
      phone: form.phone.trim(),
    };

    let created: Vehicle | null = null;
    try {
      if (draftId) {
        // A saved draft becomes the listing, ready to verify and pay.
        created = await updateListing(draftId, payload, { finishDraft: true });
        await deleteListingPhotos(removedSavedPhotos);
      } else if (mode === "edit" && existingListing) {
        await updateListing(existingListing.id, payload);
        await deleteListingPhotos(removedSavedPhotos);
        if (resubmitting) {
          const { ok } = await resubmitListing(existingListing.id);
          if (ok) toast.success("Thanks! Your listing is back in review. We'll email you soon.");
          else toast.error("Your changes are saved, but we couldn't resubmit. Please try again.");
        } else {
          toast.success("Listing updated.");
        }
      } else {
        created = await createListing(payload);
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

    // Temporary /list accounts add their email (or sign in) before paying.
    if (created && user.isAnonymous) {
      router.push(`/list/account?listing=${created.id}`);
      return;
    }

    // Admins publish straight away, without paying or waiting for review.
    if (created && isAdmin) {
      const result = await publishWithoutPayment(created.id);
      if (result.ok) toast.success("Published.");
      else toast.error(`Your listing is saved, but couldn't be published: ${result.error}`);
      router.push("/dashboard");
      return;
    }

    // Everyone else pays the listing fee on Paystack, then it goes for review.
    if (created) {
      try {
        await goToCheckout(created.id);
        return;
      } catch (err) {
        console.error(err);
        toast.error(
          err instanceof PaymentError
            ? `Your listing is saved. ${err.message}`
            : "Your listing is saved, but we couldn't start the payment. Pay from your dashboard.",
        );
      }
    }
    router.push("/dashboard");
  }

  return (
    <SiteContainer className="py-10">
      {resubmitting && existingListing?.reviewNote && (
        <div className="mb-8 rounded-xl border-l-4 border-amber-400 bg-amber-50 p-4 text-sm dark:bg-amber-950/30">
          <p className="font-medium">What our team asked you to change</p>
          <p className="mt-1 whitespace-pre-line">{existingListing.reviewNote}</p>
          <p className="mt-2 text-muted-foreground">
            Make the change, then press <strong>Save &amp; Resubmit</strong> on the last step. There&apos;s nothing more to pay.
          </p>
        </div>
      )}
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
        {finishingDraft ? "Finish your listing" : mode === "edit" ? "Edit listing" : "Create a new listing"}
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
                <SelectTrigger className="w-full" aria-invalid={invalid("make")}>
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
              <Input value={form.model} aria-invalid={invalid("model")} onChange={(e) => set("model", e.target.value)} placeholder="e.g. Polo" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Variant</Label>
              <Input
                value={form.variant} aria-invalid={invalid("variant")}
                onChange={(e) => set("variant", e.target.value)}
                placeholder="e.g. 1.4 Trendline"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Year</Label>
              <Input
                type="number"
                value={form.year} aria-invalid={invalid("year")}
                onChange={(e) => set("year", e.target.value)}
                placeholder="e.g. 2021"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Price (R)</Label>
              <Input
                type="number"
                value={form.price} aria-invalid={invalid("price")}
                onChange={(e) => set("price", e.target.value)}
                placeholder="e.g. 219900"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Mileage (km)</Label>
              <Input
                type="number"
                value={form.mileage} aria-invalid={invalid("mileage")}
                onChange={(e) => set("mileage", e.target.value)}
                placeholder="e.g. 65000"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Body Type</Label>
              <Select value={form.bodyType} onValueChange={(v) => set("bodyType", v as BodyType)}>
                <SelectTrigger className="w-full" aria-invalid={invalid("bodyType")}>
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
                <SelectTrigger className="w-full" aria-invalid={invalid("condition")}>
                  <SelectValue>{(v: string | null) => v || "Select condition"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {[...SELLER_CONDITIONS, ...(form.condition === "Demo" ? (["Demo"] as const) : [])].map((c) => (
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
                <SelectTrigger className="w-full" aria-invalid={invalid("transmission")}>
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
                <SelectTrigger className="w-full" aria-invalid={invalid("fuelType")}>
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
                <SelectTrigger className="w-full" aria-invalid={invalid("province")}>
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
              <Input value={form.town} aria-invalid={invalid("town")} onChange={(e) => set("town", e.target.value)} placeholder="e.g. Sandton" />
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
                  value={form.previousOwners} aria-invalid={invalid("previousOwners")}
                  onChange={(e) => set("previousOwners", e.target.value)}
                  placeholder="e.g. 1"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Colour</Label>
                <Select value={form.colour} onValueChange={(v) => set("colour", v ?? "")}>
                  <SelectTrigger className="w-full" aria-invalid={invalid("colour")}>
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
                  <SelectTrigger className="w-full" aria-invalid={invalid("serviceHistory")}>
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
                  <SelectTrigger className="w-full" aria-invalid={invalid("accidentHistory")}>
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
              <p className={invalid("features") ? "mt-1 text-xs text-destructive" : "mt-1 text-xs text-muted-foreground"}>
                Tick everything your car has (at least one).
              </p>
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
          <div className="flex flex-col gap-5">
          <PhotoUploader
            userId={user.id}
            photos={form.photos}
            coverUrl={form.coverUrl}
            onCoverChange={(url) => set("coverUrl", url)}
            onChange={handlePhotosChange}
            onRemove={handlePhotoRemoved}
          />
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <Label>Description</Label>
              <Textarea
                rows={8}
                value={form.description} aria-invalid={invalid("description")}
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
                    value={form.sellerName} aria-invalid={invalid("sellerName")}
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
                    value={form.phone} aria-invalid={invalid("phone")}
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
              <ReviewField label="Photos" value={`${form.photos.length} added`} />
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
            {creating && !isAdmin && (
              <p className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                Listing this car costs{" "}
                <span className="font-semibold text-foreground">{fee.label}</span>, paid once for this listing
                {fee.founding &&
                  ` as a founding seller (it goes up to ${formatFee(LISTING_FEE_CENTS)} per listing when we launch)`}
                .{" "}
                {user?.isAnonymous ? "Next, you'll add your email and pay" : "You'll pay"} securely with
                Paystack. Our team then reviews your listing, usually within
                one working day, and it goes live once it&apos;s approved.
              </p>
            )}
            {creating && isAdmin && (
              <p className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                As an admin, your listing is published straight away. No payment or review needed.
              </p>
            )}
          </div>
        )}
      </div>

      {currentProblems.length > 0 && (
        <div role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <p className="font-medium">Please complete this step before you continue:</p>
          <p className="mt-0.5">{currentProblems.join(" · ")}</p>
        </div>
      )}

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
        <div className="flex flex-wrap justify-end gap-2">
          {creating && (
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => void handleSaveDraft()}
              disabled={savingDraft || submitting}
            >
              {savingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save draft
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              onClick={goNext}
              className="rounded-full bg-foreground text-background hover:opacity-90"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => void handlePublish()}
              disabled={submitting || savingDraft}
              className="rounded-full bg-primary hover:bg-primary/90"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {resubmitting
                ? "Save & Resubmit"
                : !creating
                  ? "Save Changes"
                  : user?.isAnonymous
                    ? "Continue"
                    : isAdmin
                      ? "Publish Listing"
                      : `Continue to Payment · ${fee.label}`}
            </Button>
          )}
        </div>
      </div>
      <HelpCallout className="mt-6" />
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
