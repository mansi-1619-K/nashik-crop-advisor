import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section
      className={cn(
        "rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      {children}
    </section>
  );
}
