export type RegionKey = "heavy_rainfall" | "central" | "arid";
export type SeasonKey = "kharif" | "rabi" | "summer";
export type SoilKey = "black" | "red" | "loamy";
export type WaterKey = "low" | "medium" | "high";
export type CropTier = "primary" | "secondary" | "alternative";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type TimelineCategory = "sowing" | "irrigation" | "fertilization" | "harvest";
export type AlertLevel = "info" | "warning" | "critical";

export interface RadarMetrics {
  yieldPotential: number;
  marketValue: number;
  waterEfficiency: number;
  soilCompatibility: number;
  climateResilience: number;
}

export interface Financials {
  inputCostPerAcre: number;
  grossRevenuePerAcre: number;
  netProfitPerAcre: number;
}

export interface WaterStagePoint {
  stage: string;
  waterNeed: number;
}

export interface PestDiseaseRisk {
  primaryPests: string[];
  primaryDiseases: string[];
  riskLevel: RiskLevel;
  ipmAdvice: string[];
  symptoms: string[];
}

export interface TimelineStage {
  id: string;
  name: string;
  days: number;
  category: TimelineCategory;
  tasks: string[];
  expertTip: string;
}

export interface CropRecommendation {
  id: string;
  tier: CropTier;
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
  radarMetrics: RadarMetrics;
  financials: Financials;
  waterStageCurve: WaterStagePoint[];
  pestAndDiseaseRisk: PestDiseaseRisk;
  growthTimeline: TimelineStage[];
}

export interface RecommendationRequest {
  region: RegionKey;
  season: SeasonKey;
  soil: SoilKey;
  water: WaterKey;
}

export interface RecommendationResponse {
  crops: CropRecommendation[];
  source: "ai" | "fallback";
  generatedAt: string;
  request: RecommendationRequest;
}

export interface WeatherDay {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
}

export interface WeatherAlert {
  id: string;
  level: AlertLevel;
  title: string;
  message: string;
}

export interface WeatherResponse {
  region: string;
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    weatherCode: number;
  };
  forecast: WeatherDay[];
  alerts: WeatherAlert[];
  source: "open-meteo" | "fallback";
}

export interface PresetDefinition {
  id: string;
  label: string;
  region: RegionKey;
  season: SeasonKey;
  soil: SoilKey;
  water: WaterKey;
  description: string;
}