import { loadDataset } from "@/lib/utils/datasetLoader";
import { marketDatasetSchema, type MarketDataset, type MarketQuote } from "./types";

export interface MarketProvider {
  readonly kind: "static-sample" | "live";
  readonly label: string;
  getQuote(cropId: string): Promise<MarketQuote | null>;
}

export class StaticSampleMarketProvider implements MarketProvider {
  readonly kind = "static-sample" as const;
  readonly label = "Illustrative sample APMC quotes (STATIC — not live prices)";

  private dataset: MarketDataset | null = null;

  private load(): MarketDataset | null {
    if (!this.dataset) {
      try {
        this.dataset = loadDataset(marketDatasetSchema, "markets", "sample-quotes.json");
      } catch {
        this.dataset = null;
      }
    }
    return this.dataset;
  }

  async getQuote(cropId: string): Promise<MarketQuote | null> {
    return this.load()?.quotes.find((q) => q.cropId === cropId) ?? null;
  }
}

let defaultProvider: MarketProvider | null = null;

export function getMarketProvider(): MarketProvider {
  if (!defaultProvider) {
    defaultProvider = new StaticSampleMarketProvider();
  }
  return defaultProvider;
}

export function setMarketProvider(provider: MarketProvider): void {
  defaultProvider = provider;
}
