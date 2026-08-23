import { cn } from "@/lib/utils/cn";
import type { DataSourceClass } from "@/lib/types/common";

type Variant = "neutral" | "phase" | "success" | "warning" | "danger" | "source";

const variantClasses: Record<Variant, string> = {
  neutral: "border-ink bg-transparent text-ink",
  phase: "border-ink bg-ink text-paper",
  success: "border-ink bg-acid text-ink",
  warning: "border-ink bg-caution text-ink",
  danger: "border-ink bg-alarm text-paper",
  source: "border-ink bg-white text-ink",
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
        "inline-flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider whitespace-nowrap",
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
      <span aria-hidden className="inline-block h-1.5 w-1.5 bg-current" />
      {sourceLabels[valueClass]}
    </Badge>
  );
}
