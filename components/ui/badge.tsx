import { cn } from "@/lib/utils/cn";
import type { DataSourceClass } from "@/lib/types/common";

type Variant = "neutral" | "phase" | "success" | "warning" | "danger" | "source";

const variantClasses: Record<Variant, string> = {
  neutral: "border-line bg-transparent text-ink",
  phase: "border-ink bg-ink text-paper",
  success: "border-vermilion bg-vermilion text-paper",
  warning: "border-caution bg-caution text-ink",
  danger: "border-alarm bg-alarm text-paper",
  source: "border-line bg-paper text-ink",
};

export function Badge({
  variant = "neutral",
  className,
  children,
}: {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] whitespace-nowrap",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

const sourceLabels: Record<DataSourceClass, string> = {
  live: "LIVE",
  static: "STATIC",
  estimated: "ESTIMATED",
  heuristic: "HEURISTIC",
  ai_generated: "AI-GENERATED",
  user_provided: "USER-PROVIDED",
};

export function DataSourceBadge({ valueClass }: { valueClass: DataSourceClass }) {
  const variant: Variant =
    valueClass === "live"
      ? "success"
      : valueClass === "ai_generated"
        ? "phase"
        : valueClass === "heuristic" || valueClass === "estimated"
          ? "warning"
          : "source";
  return (
    <Badge variant={variant}>
      <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {sourceLabels[valueClass]}
    </Badge>
  );
}
