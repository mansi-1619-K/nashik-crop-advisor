import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  extractJson,
  generateValidated,
  GeneratorPermanentError,
  GeneratorTransientError,
  setGeminiGenerator,
  getGeminiGenerator,
  isGeminiConfigured,
} from "@/lib/ai/gemini";
import { z } from "zod";

const tinySchema = z.object({ answer: z.string().min(3) });

function scripted(...outcomes: Array<() => unknown>) {
  let index = 0;
  return {
    generate: vi.fn(async () => {
      const producer = outcomes[Math.min(index, outcomes.length - 1)];
      index += 1;
      return producer();
    }),
  };
}

beforeEach(() => setGeminiGenerator(null));
afterEach(() => {
  setGeminiGenerator(undefined);
  vi.restoreAllMocks();
});

describe("gemini generator wrapper", () => {
  it("reports unconfigured when no generator or key exists", async () => {
    expect(getGeminiGenerator()).toBeNull();
    expect(isGeminiConfigured()).toBe(false);
    const result = await generateValidated({
      generator: null,
      schema: tinySchema,
      systemInstruction: "s",
      prompt: "p",
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("not-configured");
    expect(result.attempts).toBe(0);
  });

  it("accepts a valid response on the first attempt", async () => {
    const gen = scripted(() => ({ answer: "Use drip irrigation" }));
    const result = await generateValidated({
      generator: gen,
      schema: tinySchema,
      systemInstruction: "s",
      prompt: "p",
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ answer: "Use drip irrigation" });
    expect(result.attempts).toBe(1);
    expect(gen.generate).toHaveBeenCalledTimes(1);
  });

  it("strips markdown fences before parsing", () => {
    expect(extractJson("```json\n{\"answer\":\"yes ok\"}\n```")).toEqual({ answer: "yes ok" });
    expect(extractJson('junk {"answer":"still fine"} tail')).toEqual({ answer: "still fine" });
  });

  it("retries on transient errors and succeeds", async () => {
    const gen = scripted(
      () => {
        throw new GeneratorTransientError("503 UNAVAILABLE");
      },
      () => ({ answer: "recovered answer" }),
    );
    const result = await generateValidated({
      generator: gen,
      schema: tinySchema,
      systemInstruction: "s",
      prompt: "p",
      maxAttempts: 3,
    });
    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(2);
  });

  it("fails fast and permanently on auth-class errors", async () => {
    const gen = scripted(() => {
      throw new GeneratorPermanentError("Gemini rejected the request (401)");
    });
    const result = await generateValidated({
      generator: gen,
      schema: tinySchema,
      systemInstruction: "s",
      prompt: "p",
      maxAttempts: 3,
    });
    expect(result.ok).toBe(false);
    expect(result.attempts).toBe(1);
    expect(gen.generate).toHaveBeenCalledTimes(1);
  });

  it("retries schema-invalid payloads then reports validation failure", async () => {
    vi.spyOn(globalThis, "setTimeout").mockImplementation(((fn: () => void) => {
      fn();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout);
    try {
      const gen = scripted(() => ({ wrong: "shape" }));
      const result = await generateValidated({
        generator: gen,
        schema: tinySchema,
        systemInstruction: "s",
        prompt: "p",
        maxAttempts: 2,
      });
      expect(result.ok).toBe(false);
      expect(result.reason).toMatch(/schema-validation/);
      expect(gen.generate).toHaveBeenCalledTimes(2);
    } finally {
      vi.restoreAllMocks();
    }
  });
});
