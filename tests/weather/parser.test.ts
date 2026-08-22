import { describe, expect, it } from "vitest";
import { isWetCode, parseWeatherCode, WMO_CODES } from "@/lib/weather/parser";

describe("WMO weather code parsing", () => {
  it("maps known codes to descriptions and groups", () => {
    expect(parseWeatherCode(0)).toMatchObject({ description: "Clear sky", group: "clear" });
    expect(parseWeatherCode(2)).toMatchObject({ group: "cloudy" });
    expect(parseWeatherCode(65)).toMatchObject({ description: "Heavy rain", group: "rain" });
    expect(parseWeatherCode(80)).toMatchObject({ group: "showers" });
    expect(parseWeatherCode(95)).toMatchObject({ group: "thunderstorm" });
    expect(parseWeatherCode(45)).toMatchObject({ group: "fog" });
  });

  it("falls back safely for unknown codes", () => {
    const parsed = parseWeatherCode(-42);
    expect(parsed.group).toBe("cloudy");
    expect(parsed.description.toLowerCase()).toContain("unknown");
  });

  it("classifies wet vs dry codes consistently", () => {
    for (const code of [51, 61, 63, 65, 80, 81, 82, 95]) {
      expect(isWetCode(code), `code ${code}`).toBe(true);
    }
    for (const code of [0, 1, 2, 3, 45]) {
      expect(isWetCode(code), `code ${code}`).toBe(false);
    }
  });

  it("keeps every entry tagged with a valid group", () => {
    const groups = new Set([
      "clear", "cloudy", "fog", "drizzle", "rain", "freezing-rain", "snow", "showers", "thunderstorm",
    ]);
    for (const [, entry] of Object.entries(WMO_CODES)) {
      expect(groups.has(entry.group)).toBe(true);
    }
  });
});
