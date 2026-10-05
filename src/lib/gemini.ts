import { GoogleGenAI, Type } from "@google/genai";
import type { Schema } from "@google/genai";
import type { CropRecommendation, RecommendationRequest } from "./types";

export interface GeminiCropResult {
  crop: string;
  tag: string;
  reason: string;
  advisorTip: string;
  sowingWindow: string;
  duration: number;
  companion: string;
  expectedYield: string;
  marketDemand: string;
  waterRequirement: string;
  radarMetrics: {
    yieldPotential: number;
    marketValue: number;
    waterEfficiency: number;
    soilCompatibility: number;
    climateResilience: number;
  };
  financials: {
    inputCostPerAcre: number;
    grossRevenuePerAcre: number;
    netProfitPerAcre: number;
  };
  waterStageCurve: { stage: string; waterNeed: number }[];
  pestAndDiseaseRisk: {
    primaryPests: string[];
    primaryDiseases: string[];
    riskLevel: "low" | "medium" | "high" | "critical";
    ipmAdvice: string[];
    symptoms: string[];
  };
  growthTimeline: {
    name: string;
    days: number;
    category: "sowing" | "irrigation" | "fertilization" | "harvest";
    tasks: string[];
    expertTip: string;
  }[];
}

const metricSchema: Schema = {
  type: Type.OBJECT,
  description: "Ratings from 0 to 100 for each agronomic trait.",
  properties: {
    yieldPotential: {
      type: Type.INTEGER,
      minimum: 0,
      maximum: 100,
      description: "Expected yield potential rating.",
    },
    marketValue: {
      type: Type.INTEGER,
      minimum: 0,
      maximum: 100,
      description: "Market price and demand strength rating.",
    },
    waterEfficiency: {
      type: Type.INTEGER,
      minimum: 0,
      maximum: 100,
      description: "Water-use efficiency rating.",
    },
    soilCompatibility: {
      type: Type.INTEGER,
      minimum: 0,
      maximum: 100,
      description: "Fitness to the selected soil type.",
    },
    climateResilience: {
      type: Type.INTEGER,
      minimum: 0,
      maximum: 100,
      description: "Resilience to local climate extremes.",
    },
  },
  required: [
    "yieldPotential",
    "marketValue",
    "waterEfficiency",
    "soilCompatibility",
    "climateResilience",
  ],
};

const financialsSchema: Schema = {
  type: Type.OBJECT,
  description: "Financial projection in Indian rupees per acre.",
  properties: {
    inputCostPerAcre: {
      type: Type.INTEGER,
      description: "Total estimated input cost per acre in INR.",
    },
    grossRevenuePerAcre: {
      type: Type.INTEGER,
      description: "Expected gross revenue per acre in INR.",
    },
    netProfitPerAcre: {
      type: Type.INTEGER,
      description: "Calculated net profit per acre in INR.",
    },
  },
  required: ["inputCostPerAcre", "grossRevenuePerAcre", "netProfitPerAcre"],
};

const waterCurveSchema: Schema = {
  type: Type.ARRAY,
  description: "Water need in mm across four physiological growth stages.",
  minItems: "4",
  maxItems: "4",
  items: {
    type: Type.OBJECT,
    properties: {
      stage: {
        type: Type.STRING,
        enum: [
          "Nursery/Sowing",
          "Vegetative",
          "Flowering/Panicle",
          "Maturity/Harvest",
        ],
      },
      waterNeed: { type: Type.NUMBER, description: "Water requirement in mm." },
    },
    required: ["stage", "waterNeed"],
  },
};

const pestSchema: Schema = {
  type: Type.OBJECT,
  description: "Pest and disease intelligence for the crop.",
  properties: {
    primaryPests: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Primary pest names.",
    },
    primaryDiseases: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Primary disease names.",
    },
    riskLevel: {
      type: Type.STRING,
      enum: ["low", "medium", "high", "critical"],
    },
    ipmAdvice: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Preventative IPM practices.",
    },
    symptoms: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Visible symptoms to watch out for.",
    },
  },
  required: [
    "primaryPests",
    "primaryDiseases",
    "riskLevel",
    "ipmAdvice",
    "symptoms",
  ],
};

const timelineStageSchema: Schema = {
  type: Type.OBJECT,
  description: "A single growth stage of the crop calendar.",
  properties: {
    name: { type: Type.STRING, description: "Stage name." },
    days: { type: Type.INTEGER, description: "Duration in days." },
    category: {
      type: Type.STRING,
      enum: ["sowing", "irrigation", "fertilization", "harvest"],
    },
    tasks: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Action checklist.",
    },
    expertTip: { type: Type.STRING, description: "Agronomist expert tip." },
  },
  required: ["name", "days", "category", "tasks", "expertTip"],
};

const cropSchema: Schema = {
  type: Type.OBJECT,
  description: "A ranked crop recommendation.",
  properties: {
    crop: { type: Type.STRING, description: "Crop and cultivar name." },
    tag: {
      type: Type.STRING,
      enum: [
        "Primary Recommended Crop",
        "High-Value Cash Crop",
        "Drought-Hardy Option",
      ],
    },
    reason: {
      type: Type.STRING,
      description: "2-3 sentences of agronomic justification.",
    },
    advisorTip: {
      type: Type.STRING,
      description: "Expert fertilization, spacing or micronutrient tip.",
    },
    sowingWindow: {
      type: Type.STRING,
      description: "Ideal planting calendar window.",
    },
    duration: { type: Type.INTEGER, description: "Crop cycle length in days." },
    companion: {
      type: Type.STRING,
      description: "Best companion or intercrop species.",
    },
    expectedYield: {
      type: Type.STRING,
      description: "Expected yield per hectare/acre.",
    },
    marketDemand: { type: Type.STRING, description: "Local market dynamics." },
    waterRequirement: {
      type: Type.STRING,
      description: "Detailed water requirement.",
    },
    radarMetrics: metricSchema,
    financials: financialsSchema,
    waterStageCurve: waterCurveSchema,
    pestAndDiseaseRisk: pestSchema,
    growthTimeline: {
      type: Type.ARRAY,
      minItems: "4",
      maxItems: "4",
      items: timelineStageSchema,
    },
  },
  required: [
    "crop",
    "tag",
    "reason",
    "advisorTip",
    "sowingWindow",
    "duration",
    "companion",
    "expectedYield",
    "marketDemand",
    "waterRequirement",
    "radarMetrics",
    "financials",
    "waterStageCurve",
    "pestAndDiseaseRisk",
    "growthTimeline",
  ],
};

const responseSchema: Schema = {
  type: Type.OBJECT,
  description: "Ranked crop recommendations for Nashik district micro-regions.",
  properties: {
    crops: {
      type: Type.ARRAY,
      minItems: "2",
      maxItems: "3",
      items: cropSchema,
    },
  },
  required: ["crops"],
};

const REGION_DESCRIPTIONS: Record<string, string> = {
  heavy_rainfall:
    "Heavy Rainfall Belt — Igatpuri, Trimbakeshwar, Western Ghats. 2500mm+ monsoon, acidic red/laterite soils, cool misty microclimate.",
  central:
    "Central Irrigated Belt — Niphad, Dindori, Nashik, Sinnar. Godavari basin, deep black cotton soil (Vertisol), canal/drip irrigated, table grapes, onions, vegetables.",
  arid: "Arid / Rainshadow Eastern Belt — Malegaon, Nandgaon, Yeola. 500-600mm rainfall, shallow calcareous/gravelly soils, drought-hardy crops.",
};

const SEASON_DESCRIPTIONS: Record<string, string> = {
  kharif: "Kharif (Monsoon: June-October)",
  rabi: "Rabi (Winter: October-March)",
  summer: "Summer/Zaid (March-June)",
};

const SOIL_DESCRIPTIONS: Record<string, string> = {
  black: "Deep black cotton soil (Vertisol, high clay, high water retention)",
  red: "Red/laterite soil (Alfisol, porous, slightly acidic, well-drained)",
  loamy: "Alluvial/loamy soil (fertile river basin, high organic matter)",
};

const WATER_DESCRIPTIONS: Record<string, string> = {
  low: "Low water availability (rainfed only / dryland)",
  medium: "Medium water availability (seasonal canal, seasonal dug-well)",
  high: "High water availability (assured canal, round-the-year borewell, micro-drip)",
};

export function buildPrompt(request: RecommendationRequest): string {
  return [
    "You are a senior agronomist with the Maharashtra Agricultural Department, specialising in the Nashik district of Maharashtra, India.",
    "Recommend 3 ranked, realistic, locally-proven crops for the given micro-region, season, soil and water availability.",
    "Crop 1 must be the primary recommended crop, Crop 2 a high-value cash crop (secondary), Crop 3 a climate-resilient alternative.",
    "Use real Nashik varieties (e.g. Indrayani/Jarhan paddy, Thompson Seedless grapes, Bhima Super/Phule Samarth onion, GHB-905 bajra, Bhagwa pomegranate, TAG-24 groundnut, JS-335 soybean, Digvijay gram).",
    "Keep all figures realistic and internally consistent: netProfitPerAcre must equal grossRevenuePerAcre minus inputCostPerAcre.",
    "Give concrete, actionable, expert-level agronomy. Reference local markets (Lasalgaon APMC, Pimpalgaon Mandi, Malegaon, Nashik, Mumbai export demand).",
    "",
    `Micro-Region: ${REGION_DESCRIPTIONS[request.region]}`,
    `Season: ${SEASON_DESCRIPTIONS[request.season]}`,
    `Soil: ${SOIL_DESCRIPTIONS[request.soil]}`,
    `Water Availability: ${WATER_DESCRIPTIONS[request.water]}`,
    "",
    "Return only the JSON matching the provided schema. All currency figures in Indian Rupees per acre.",
  ].join("\n");
}

/**
 * Hard cap on a single Gemini round trip. The SDK defaults to FIVE
 * attempts with exponential backoff (up to 60s between retries), which is
 * what produced the observed `application-code: 41s` responses on
 * `/api/recommend` — the route simply blocked until the model answered or
 * the retry budget ran out. With `attempts: 1` + `timeout`, a slow or
 * flaky call resolves (or throws) within ~6s and the route falls back to
 * the instant local dataset instead of hanging the UI (plan 7.5).
 */
const GEMINI_TIMEOUT_MS = 6000;

export async function queryGemini(
  request: RecommendationRequest,
): Promise<GeminiCropResult[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: buildPrompt(request),
    config: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.6,
      httpOptions: {
        timeout: GEMINI_TIMEOUT_MS,
        retryOptions: { attempts: 1 },
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  const parsed = JSON.parse(text) as { crops?: GeminiCropResult[] };
  if (!Array.isArray(parsed.crops) || parsed.crops.length < 2) {
    throw new Error("Gemini response did not match the expected schema");
  }
  return parsed.crops.slice(0, 3);
}

/* --- Phase 7.5 — memoized AI lookups ------------------------------------
   Preset toggles re-request the same (region, season, soil, water) set
   constantly; a successful AI response is now reused for 30 minutes and
   concurrent requests for the same set share one in-flight promise, so a
   repeat visit returns in ~0ms instead of paying the model round trip
   again. Only successes are cached — a throw propagates to the route's
   dataset fallback as before. The cached array is treated as read-only
   (normalizeGeminiCrops maps it into fresh objects).

   On top of that, errors arm a global cool-down so a persistently failing
   upstream (the observed case: free-tier 429 quota exhausted, where every
   param switch used to block on retries) stops being re-probed on each
   click: the first failure pays the round trip, subsequent requests skip
   straight to the fallback until the window lapses. */
const RESULT_TTL_MS = 30 * 60_000;
const RESULT_CACHE_MAX = 64;
const ERROR_COOLDOWN_MS = 60_000;
const QUOTA_COOLDOWN_MS = 5 * 60_000;
let errorCooldownUntil = 0;

const resultCache = new Map<
  string,
  { crops: GeminiCropResult[]; expires: number }
>();
const inflight = new Map<string, Promise<GeminiCropResult[]>>();

function requestKey(request: RecommendationRequest): string {
  return `${request.region}|${request.season}|${request.soil}|${request.water}`;
}

function cooldownFor(error: unknown): number {
  const message = error instanceof Error ? error.message : String(error);
  const status = (error as { status?: number } | null)?.status;
  const quota = status === 429 || /\b429\b|quota/i.test(message);
  return quota ? QUOTA_COOLDOWN_MS : ERROR_COOLDOWN_MS;
}

export async function queryGeminiCached(
  request: RecommendationRequest,
): Promise<GeminiCropResult[]> {
  const key = requestKey(request);
  const hit = resultCache.get(key);
  if (hit) {
    if (hit.expires > Date.now()) return hit.crops;
    resultCache.delete(key);
  }

  if (Date.now() < errorCooldownUntil) {
    throw new Error("Gemini cool-down active — serving dataset fallback");
  }

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = queryGemini(request)
    .then((crops) => {
      if (resultCache.size >= RESULT_CACHE_MAX) {
        const oldest = resultCache.keys().next().value;
        if (oldest !== undefined) resultCache.delete(oldest);
      }
      resultCache.set(key, { crops, expires: Date.now() + RESULT_TTL_MS });
      return crops;
    })
    .catch((error: unknown) => {
      errorCooldownUntil = Date.now() + cooldownFor(error);
      throw error;
    })
    .finally(() => {
      inflight.delete(key);
    });
  inflight.set(key, promise);
  return promise;
}

const RISK_LEVELS = ["low", "medium", "high", "critical"];
const TIMELINE_CATEGORIES = [
  "sowing",
  "irrigation",
  "fertilization",
  "harvest",
];

export function normalizeGeminiCrops(
  results: GeminiCropResult[],
): CropRecommendation[] {
  const tiers: CropRecommendation["tier"][] = [
    "primary",
    "secondary",
    "alternative",
  ];
  return results.map((r, index) => {
    const metrics = r.radarMetrics ?? ({} as GeminiCropResult["radarMetrics"]);
    const finances = r.financials ?? ({} as GeminiCropResult["financials"]);
    const input = Math.max(0, Number(finances.inputCostPerAcre) || 0);
    const gross = Math.max(0, Number(finances.grossRevenuePerAcre) || 0);
    const net = gross - input;

    const riskLevel = RISK_LEVELS.includes(
      r.pestAndDiseaseRisk?.riskLevel as string,
    )
      ? (r.pestAndDiseaseRisk
          .riskLevel as CropRecommendation["pestAndDiseaseRisk"]["riskLevel"])
      : "medium";

    return {
      id: `ai-${Date.now()}-${index}`,
      tier: tiers[index] ?? "alternative",
      crop: String(r.crop ?? "Crop"),
      tag: String(r.tag ?? "Primary Recommended Crop"),
      reason: String(r.reason ?? ""),
      advisorTip: String(r.advisorTip ?? ""),
      sowingWindow: String(r.sowingWindow ?? ""),
      duration: Math.max(1, Number(r.duration) || 100),
      companion: String(r.companion ?? ""),
      expectedYield: String(r.expectedYield ?? ""),
      marketDemand: String(r.marketDemand ?? ""),
      waterRequirement: String(r.waterRequirement ?? ""),
      radarMetrics: {
        yieldPotential: clamp(metrics.yieldPotential),
        marketValue: clamp(metrics.marketValue),
        waterEfficiency: clamp(metrics.waterEfficiency),
        soilCompatibility: clamp(metrics.soilCompatibility),
        climateResilience: clamp(metrics.climateResilience),
      },
      financials: {
        inputCostPerAcre: input,
        grossRevenuePerAcre: gross,
        netProfitPerAcre: net,
      },
      waterStageCurve: (r.waterStageCurve ?? []).slice(0, 4).map((p) => ({
        stage: String(p.stage ?? ""),
        waterNeed: Math.max(0, Number(p.waterNeed) || 0),
      })),
      pestAndDiseaseRisk: {
        primaryPests: (r.pestAndDiseaseRisk?.primaryPests ?? []).slice(0, 4),
        primaryDiseases: (r.pestAndDiseaseRisk?.primaryDiseases ?? []).slice(
          0,
          4,
        ),
        riskLevel,
        ipmAdvice: (r.pestAndDiseaseRisk?.ipmAdvice ?? []).slice(0, 4),
        symptoms: (r.pestAndDiseaseRisk?.symptoms ?? []).slice(0, 4),
      },
      growthTimeline: (r.growthTimeline ?? []).slice(0, 4).map((s, i) => ({
        id: `ai-timeline-${i}`,
        name: String(s.name ?? `Stage ${i + 1}`),
        days: Math.max(1, Number(s.days) || 1),
        category: TIMELINE_CATEGORIES.includes(s.category as string)
          ? (s.category as CropRecommendation["growthTimeline"][number]["category"])
          : "sowing",
        tasks: (s.tasks ?? []).slice(0, 4),
        expertTip: String(s.expertTip ?? ""),
      })),
    };
  });
}

function clamp(value: unknown): number {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return Math.min(100, Math.max(0, Math.round(num)));
}
