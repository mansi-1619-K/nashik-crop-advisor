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
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    zinc: "bg-zinc-400",
  };
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-zinc-100", className)}
      role="presentation"
    >
      <div className={cn("h-full rounded-full transition-all", tones[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function scoreTone(value: number): "emerald" | "amber" | "red" {
  if (value >= 70) return "emerald";
  if (value >= 50) return "amber";
  return "red";
}
