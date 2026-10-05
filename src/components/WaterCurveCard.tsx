"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Droplets } from "lucide-react";
import type { CropRecommendation } from "@/lib/types";
import { SectionCard, SectionTitle } from "./ui";

export function WaterCurveCard({ crop }: { crop: CropRecommendation }) {
  const data = crop.waterStageCurve;

  return (
    <SectionCard className="p-6">
      <SectionTitle
        icon={<Droplets className="h-4 w-4" aria-hidden />}
        title="Water Requirement Curve"
        subtitle="Estimated crop-water demand (mm) across physiological growth stages."
      />
      <div className="mt-3 h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
          >
            <defs>
              <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8a9a7c" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#8a9a7c" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5decf"
              strokeOpacity={0.9}
              vertical={false}
            />
            <XAxis
              dataKey="stage"
              tick={{
                fontSize: 11,
                fill: "#55514a",
                fontFamily: "var(--font-inter)",
              }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6e6a62" }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "mm",
                angle: -90,
                position: "insideLeft",
                fontSize: 10,
                fill: "#6e6a62",
              }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e5decf",
                fontSize: 12,
                background: "#ffffff",
                fontFamily: "var(--font-inter)",
                color: "#1f1d1a",
              }}
              formatter={(value) => [`${value} mm`, "Water need"]}
            />
            <Area
              type="monotone"
              dataKey="waterNeed"
              stroke="#6f7f35"
              strokeWidth={2}
              fill="url(#waterGradient)"
              activeDot={{
                r: 5,
                fill: "#477b37",
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}
