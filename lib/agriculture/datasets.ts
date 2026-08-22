import { loadDataset } from "@/lib/utils/datasetLoader";
import { cropsDatasetSchema, type CropsDataset } from "./crop";
import { seasonsDatasetSchema, type Season, type SeasonsDataset } from "./season";
import { soilsDatasetSchema, type Soil, type SoilsDataset } from "./soil";
import { zonesDatasetSchema, type Zone, type ZonesDataset } from "./zone";

export interface AgricultureDatasets {
  zones: ZonesDataset;
  soils: SoilsDataset;
  seasons: SeasonsDataset;
  crops: CropsDataset;
}

let cache: AgricultureDatasets | null = null;

export function getAgricultureDatasets(): AgricultureDatasets {
  if (!cache) {
    cache = {
      zones: loadDataset(zonesDatasetSchema, "zones", "nashik-zones.json"),
      soils: loadDataset(soilsDatasetSchema, "soils", "nashik-soils.json"),
      seasons: loadDataset(seasonsDatasetSchema, "seasons", "maharashtra-seasons.json"),
      crops: loadDataset(cropsDatasetSchema, "crops", "nashik-crops.json"),
    };
  }
  return cache;
}

export function findZone(datasets: AgricultureDatasets, zoneId: string): Zone | undefined {
  return datasets.zones.zones.find((z) => z.id === zoneId);
}

export function findSeason(datasets: AgricultureDatasets, seasonId: string): Season | undefined {
  return datasets.seasons.seasons.find((s) => s.id === seasonId);
}

export function findSoil(datasets: AgricultureDatasets, soilId: string): Soil | undefined {
  return datasets.soils.soils.find((s) => s.id === soilId);
}
