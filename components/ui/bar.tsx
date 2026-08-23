import { cn } from "@/lib/utils/cn";

export function ScoreBar({
  value,
  max = 100,
  className,
  tone = "emerald",
}: {
  value: number;
  max?: number;
  className?: string;
  tone?: "emerald" | "amber" | "red" | "zinc";
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const tones = {
    emerald: "bg-acid-deep",
    amber: "bg-caution",
    red: "bg-alarm",
    zinc: "bg-ink-soft",
  } as const;
  return (
    <div
      className={cn("relative h-3 w-full border border-ink bg-white", className)}
      role="presentation"
    >
      <div
        className={cn("h-full transition-none", tones[tone])}
        style={{ width: `${pct}%` }}
      />
      {/* quarter rules over the fill — reads like a measuring instrument */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 stripes-acid opacity-[0.07]"
      />
    </div>
  );
}

export function scoreTone(value: number): "emerald" | "amber" | "red" {
  if (value >= 70) return "emerald";
  if (value >= 50) return "amber";
  return "red";
}
