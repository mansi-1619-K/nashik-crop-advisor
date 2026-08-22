import { describe, expect, it } from "vitest";
import { loadDataset, DatasetLoadError } from "@/lib/utils/datasetLoader";
import { zonesDatasetSchema } from "@/lib/agriculture/zone";
import { soilsDatasetSchema } from "@/lib/agriculture/soil";
import { seasonsDatasetSchema } from "@/lib/agriculture/season";
import { cropsDatasetSchema } from "@/lib/agriculture/crop";
import { presetsDatasetSchema } from "@/lib/agriculture/context";
import { marketDatasetSchema } from "@/lib/market/types";

const zones = loadDataset(zonesDatasetSchema, "zones", "nashik-zones.json");
const soils = loadDataset(soilsDatasetSchema, "soils", "nashik-soils.json");
const seasons = loadDataset(seasonsDatasetSchema, "seasons", "maharashtra-seasons.json");
const crops = loadDataset(cropsDatasetSchema, "crops", "nashik-crops.json");
const presets = loadDataset(presetsDatasetSchema, "scenarios", "presets.json");
const market = loadDataset(marketDatasetSchema, "markets", "sample-quotes.json");

describe("zones dataset", () => {
  it("validates against the zone schema", () => {
    expect(zones.zones.length).toBe(3);
  });

  it("contains the three macro-zones from the project brief", () => {
    const ids = zones.zones.map((z) => z.id).sort();
    expect(ids).toEqual(["arid-eastern", "central-irrigated", "heavy-rainfall"]);
  });

  it("has unique taluka ids across all zones and coordinates inside Maharashtra bounds", () => {
    const talukas = zones.zones.flatMap((z) => z.talukas);
    expect(new Set(talukas.map((t) => t.id)).size).toBe(talukas.length);
    for (const t of talukas) {
      expect(t.lat).toBeGreaterThan(18.5);
      expect(t.lat).toBeLessThan(21.5);
      expect(t.lng).toBeGreaterThan(72.5);
      expect(t.lng).toBeLessThan(75.5);
    }
  });
});

describe("soils dataset", () => {
  it("validates against the soil schema with unique ids", () => {
    expect(new Set(soils.soils.map((s) => s.id)).size).toBe(soils.soils.length);
    expect(soils.soils.map((s) => s.id)).toContain("deep-black");
  });
});

describe("seasons dataset", () => {
  it("defines kharif, rabi, summer and perennial", () => {
    const ids = seasons.seasons.map((s) => s.id);
    expect(ids).toEqual(expect.arrayContaining(["kharif", "rabi", "summer", "perennial"]));
  });

  it("covers all twelve months across kharif/rabi/summer windows", () => {
    const seasonalMonths = new Set(
      seasons.seasons.filter((s) => s.id !== "perennial").flatMap((s) => s.months),
    );
    for (let m = 1; m <= 12; m++) {
      expect(seasonalMonths.has(m)).toBe(true);
    }
  });
});

describe("crops dataset", () => {
  it("validates against the crop schema", () => {
    expect(crops.crops.length).toBeGreaterThanOrEqual(10);
  });

  it("has unique crop ids", () => {
    expect(new Set(crops.crops.map((c) => c.id)).size).toBe(crops.crops.length);
  });

  it("references only known zones, seasons and soils (cross-dataset integrity)", () => {
    const zoneIds = new Set(zones.zones.map((z) => z.id));
    const seasonIds = new Set(seasons.seasons.map((s) => s.id));
    const soilIds = new Set(soils.soils.map((s) => s.id));
    for (const crop of crops.crops) {
      for (const z of crop.zones) expect(zoneIds.has(z), `${crop.id} zone ${z}`).toBe(true);
      for (const s of crop.seasons) expect(seasonIds.has(s), `${crop.id} season ${s}`).toBe(true);
      for (const sc of crop.soilCompatibility)
        expect(soilIds.has(sc.soilId), `${crop.id} soil ${sc.soilId}`).toBe(true);
    }
  });

  it("flags every crop's economics as assumed in Phase 0 (data honesty)", () => {
    for (const crop of crops.crops) {
      expect(crop.economics.dataQuality).toBe("assumed");
      expect(crop.notes.some((n) => n.includes("ASSUMED")) || crops.meta.quality === "assumed").toBe(
        true,
      );
    }
    expect(crops.meta.disclaimer).toBeTruthy();
  });
});

describe("presets dataset", () => {
  it("contains the five predefined scenarios from the brief", () => {
    expect(presets.presets.map((p) => p.id)).toEqual([
      "igatpuri-monsoon-paddy",
      "niphad-irrigated-onion",
      "niphad-export-grapes",
      "malegaon-drought-bajra",
      "sinnar-pomegranate",
    ]);
  });

  it("resolves every preset taluka to its declared zone", () => {
    for (const preset of presets.presets) {
      const { talukaId, zoneId } = preset.context;
      if (!talukaId) continue;
      const zone = zones.zones.find((z) => z.id === zoneId);
      expect(zone).toBeDefined();
      expect(zone?.talukas.some((t) => t.id === talukaId)).toBe(true);
    }
  });
});

describe("market sample quotes", () => {
  it("validates and only references known crops", () => {
    const cropIds = new Set(crops.crops.map((c) => c.id));
    for (const quote of market.quotes) {
      expect(cropIds.has(quote.cropId)).toBe(true);
      expect(quote.modalPriceInr).toBeGreaterThanOrEqual(quote.priceMinInr);
      expect(quote.modalPriceInr).toBeLessThanOrEqual(quote.priceMaxInr);
    }
  });

  it("is explicitly labelled as non-live sample data", () => {
    expect(market.meta.quality).toBe("sample");
    for (const quote of market.quotes) {
      expect(quote.valueClass).not.toBe("live");
    }
  });
});

describe("dataset loader", () => {
  it("throws DatasetLoadError for a missing file", () => {
    expect(() =>
      loadDataset(zonesDatasetSchema, "zones", "does-not-exist.json"),
    ).toThrowError(DatasetLoadError);
  });
});
