import { cn } from "@/lib/utils/cn";
import type { DataSourceClass } from "@/lib/types/common";

type Variant = "neutral" | "phase" | "success" | "warning" | "danger" | "source";

const variantClasses: Record<Variant, string> = {
  neutral: "bg-zinc-100 text-zinc-600 border-zinc-200",
  phase: "bg-amber-50 text-amber-700 border-amber-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  source: "bg-sky-50 text-sky-700 border-sky-200",
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
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
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
  return <Badge variant="source">{sourceLabels[valueClass]}</Badge>;
}
