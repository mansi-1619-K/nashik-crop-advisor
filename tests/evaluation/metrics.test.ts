import { describe, expect, it } from "vitest";
import { percentile, runScenario, topKAgreement } from "@/lib/eval/engineMetrics";
import { overlapRatioStandalone } from "@/lib/eval/stability";
import type { EvalScenario } from "@/lib/eval/types";

function scenario(overrides: Partial<EvalScenario>): EvalScenario {
  return {
    id: "s1",
    kind: "expert",
    description: "test",
    context: {
      zoneId: "central-irrigated",
      seasonId: "rabi",
      soilId: "medium-black",
      waterAvailability: "assured",
    },
    expectations: {},
    ...overrides,
  };
}

describe("percentile", () => {
  it("returns sorted-order percentiles including edge positions", () => {
    expect(percentile([5, 1, 3], 50)).toBe(3);
    expect(percentile([10, 20, 30, 40], 95)).toBe(40);
    expect(percentile([], 50)).toBe(0);
  });
});

describe("topKAgreement", () => {
  it("measures prefix membership, not order", () => {
    expect(topKAgreement(["a", "b", "c"], ["c", "a", "z"], 3)).toBe(2 / 3);
    expect(topKAgreement(["a"], ["a", "x"], 1)).toBe(1);
    expect(topKAgreement([], ["anything"], 2)).toBe(1);
  });
});

describe("overlapRatioStandalone", () => {
  it("handles empty-vs-empty as perfect agreement", () => {
    expect(overlapRatioStandalone([], [])).toBe(1);
    expect(overlapRatioStandalone(["a", "b"], ["b", "c"])).toBe(0.5);
    expect(overlapRatioStandalone(["a"], [])).toBe(0);
  });
});

describe("runScenario expectation diffs", () => {
  it("flags a wrong expected primary with the engine's actual choice", () => {
    const result = runScenario(
      scenario({ expectations: { expectedPrimary: "paddy" } }),
    );
    expect(result.failures[0]).toMatch(/expected PRIMARY paddy/);
  });

  it("flags a mustBeExcluded crop that the engine ranked", () => {
    const result = runScenario(scenario({ expectations: { mustBeExcluded: ["onion"] } }));
    expect(result.failures.join(" ")).toMatch(/expected EXCLUDED: onion/);
  });

  it("passes when expectations match documented engine behaviour", () => {
    const result = runScenario(
      scenario({
        context: {
          zoneId: "central-irrigated",
          seasonId: "rabi",
          soilId: "medium-black",
          waterAvailability: "assured",
        },
        expectations: { expectedPrimary: "onion", mustBeExcluded: ["paddy"] },
      }),
    );
    expect(result.failures).toEqual([]);
    expect(result.primaryId).toBe("onion");
  });

  it("enforces maxEligibleCount ceilings", () => {
    const result = runScenario(
      scenario({
        context: {
          zoneId: "central-irrigated",
          seasonId: "rabi",
          soilId: "medium-black",
          waterAvailability: "rainfed",
        },
        expectations: { maxEligibleCount: 0 },
      }),
    );
    expect(result.failures).toEqual([]);
    expect(result.eligibleIds).toEqual([]);
  });
});
