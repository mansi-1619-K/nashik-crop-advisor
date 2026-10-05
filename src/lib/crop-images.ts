/**
 * Phase 5.4 — crop name → hover-img thumbnail path.
 *
 * Maps a recommendation's crop name (fallback dataset or Gemini's free-text
 * "Crop and cultivar name") onto one of the Wikimedia-sourced JPEGs in
 * /public/crops (credits: public/crops/CREDITS.md). Rules run top-down and
 * are ordered most-specific-first so "Black Gram" resolves to urad rather
 * than plain chana, and "Pigeon Pea" to tur rather than garden pea.
 * Anything unmatched (Gemini can return any crop) falls back to the
 * generic field shot.
 */

type Rule = [pattern: RegExp, slug: string];

const RULES: Rule[] = [
  [/black gram|urad/, "urad"],
  [/green gram|moong/, "moong"],
  [/pigeon pea|\btur\b/, "tur"],
  [/garden pea|\bpeas?\b/, "pea"],
  [/chana|\bgram\b/, "chana"],
  [/finger millet|\bragi\b/, "ragi"],
  [/pearl millet|\bbajra\b/, "bajra"],
  [/sorghum|\bjowar\b/, "jowar"],
  [/bitter gourd|bitter melon|karela/, "bitter-gourd"],
  [/bottle gourd|lauki|\bgourds?\b|luffa/, "bottle-gourd"],
  [/sweet corn|\bcorns?\b|maize/, "corn"],
  [/paddy|\brice\b/, "paddy"],
  [/groundnut|ground nut/, "groundnut"],
  [/brinjal|eggplant|aubergine/, "brinjal"],
  [/potato/, "potato"],
  [/soybean|soya/, "soybean"],
  [/onion/, "onion"],
  [/tomato/, "tomato"],
  [/grape|vineyard/, "grape"],
  [/pomegranate|\banar\b/, "pomegranate"],
  [/sesame|gingelly|\btil\b/, "sesame"],
  [/cotton/, "cotton"],
];

/** Thumbnail for a crop name; never misses — unknown crops get /crops/field.jpg. */
export function cropImage(cropName: string): string {
  const name = cropName.toLowerCase();
  const hit = RULES.find(([pattern]) => pattern.test(name));
  return `/crops/${hit ? hit[1] : "field"}.jpg`;
}
