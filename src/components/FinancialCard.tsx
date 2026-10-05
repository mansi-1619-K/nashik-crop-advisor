"use client";

import { IndianRupee, TrendingUp, Wallet, PiggyBank } from "lucide-react";
import type { CropRecommendation } from "@/lib/types";
import { formatRupees } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { SectionCard, SectionTitle, Badge } from "./ui";
import { Progress } from "./ui/progress";

function marginTone(percent: number): {
  label: string;
  tone: "moss" | "harvest" | "terracotta";
  indicator: string;
} {
  if (percent >= 40)
    return {
      label: "High margin",
      tone: "moss",
      indicator: "[&_[data-slot=progress-indicator]]:bg-moss",
    };
  if (percent >= 20)
    return {
      label: "Moderate margin",
      tone: "harvest",
      indicator: "[&_[data-slot=progress-indicator]]:bg-harvest-500",
    };
  return {
    label: "Thin margin",
    tone: "terracotta",
    indicator: "[&_[data-slot=progress-indicator]]:bg-terracotta",
  };
}

export function FinancialCard({ crop }: { crop: CropRecommendation }) {
  const { inputCostPerAcre, grossRevenuePerAcre, netProfitPerAcre } =
    crop.financials;
  const margin =
    grossRevenuePerAcre > 0
      ? Math.round((netProfitPerAcre / grossRevenuePerAcre) * 100)
      : 0;
  const tone = marginTone(margin);

  const rows = [
    {
      label: "Input Cost",
      value: formatRupees(inputCostPerAcre),
      icon: Wallet,
      cls: "text-terracotta",
    },
    {
      label: "Expected Revenue",
      value: formatRupees(grossRevenuePerAcre),
      icon: TrendingUp,
      cls: "text-sage",
    },
    {
      label: "Net Profit",
      value: formatRupees(netProfitPerAcre),
      icon: PiggyBank,
      cls: "text-moss",
    },
  ];

  return (
    <SectionCard className="p-6">
      <SectionTitle
        icon={<IndianRupee className="h-4 w-4" aria-hidden />}
        title="Financial ROI Projection"
        subtitle="Estimated economics per acre (₹) — not accounting for land value."
        right={
          <Badge tone={tone.tone}>
            {tone.label} · {margin}%
          </Badge>
        }
      />

      <div className="mt-5 space-y-2.5">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div
              key={row.label}
              className="flex items-center justify-between rounded-lg border border-border/30 bg-canvas-warm/40 px-4 py-3"
            >
              <span className="flex items-center gap-2.5 text-sm font-medium text-ink-secondary">
                <Icon className={cn("h-4 w-4", row.cls)} aria-hidden />
                {row.label}
              </span>
              <span className="text-base font-bold text-ink">
                {row.value}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
          <span>Profit margin</span>
          <span>{margin}%</span>
        </div>
        <div className="mt-2">
          <Progress
            value={Math.min(100, Math.max(0, margin))}
            aria-label={`Profit margin ${margin} percent`}
            className={cn("h-2 bg-border-light", tone.indicator)}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-ink-muted">
          Margin = net profit ÷ gross revenue per acre.
        </p>
      </div>
    </SectionCard>
  );
}
