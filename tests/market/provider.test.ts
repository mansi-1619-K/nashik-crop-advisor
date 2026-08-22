import { describe, expect, it } from "vitest";
import {
  getMarketProvider,
  StaticSampleMarketProvider,
} from "@/lib/market/provider";

describe("market provider abstraction", () => {
  it("serves sample quotes and never claims they are live", async () => {
    const provider = new StaticSampleMarketProvider();
    expect(provider.kind).toBe("static-sample");
    const quote = await provider.getQuote("onion");
    expect(quote).not.toBeNull();
    expect(quote!.valueClass).not.toBe("live");
    expect(quote!.unit).toBe("INR/quintal");
  });

  it("returns null for unknown crops", async () => {
    const provider = new StaticSampleMarketProvider();
    await expect(provider.getQuote("dragon-fruit")).resolves.toBeNull();
  });

  it("exposes a default provider", () => {
    expect(getMarketProvider().kind).toBe("static-sample");
  });
});
