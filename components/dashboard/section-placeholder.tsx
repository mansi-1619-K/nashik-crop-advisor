import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function SectionPlaceholder({
  icon: Icon,
  title,
  description,
  phase,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <div className="flex h-full flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Icon size={18} aria-hidden />
          </span>
          <h2 className="font-semibold text-zinc-900">{title}</h2>
        </div>
        <Badge variant="phase">{phase}</Badge>
      </div>
      <p className="text-sm leading-relaxed text-zinc-500">{description}</p>
    </div>
  );
}
