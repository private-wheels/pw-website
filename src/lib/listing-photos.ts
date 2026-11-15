/**
 * The photos every listing must include. We can't tell what a photo shows,
 * so the wizard asks for at least one per shot and our reviewers check the
 * angles: a listing missing any of them gets a request for more photos, or
 * is declined.
 */
export const REQUIRED_PHOTOS = [
  { key: "front", label: "Front", hint: "The whole front of the car, number plate included" },
  { key: "back", label: "Back", hint: "The whole back of the car" },
  { key: "side", label: "Side", hint: "A full side view, front to back" },
  { key: "inside", label: "Inside", hint: "The dashboard and front seats" },
] as const;

export const MIN_PHOTOS = REQUIRED_PHOTOS.length;
