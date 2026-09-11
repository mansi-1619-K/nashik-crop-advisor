import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function Card({
  label,
  index,
  className,
  bodyClassName,
  children,
}: {
  label?: string;
  index?: string;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("border border-line bg-white", className)}>
      {label && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-2">
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.15em]">{label}</span>
          {index && (
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink-soft">
              {index}
            </span>
          )}
        </header>
      )}
      <div className={cn("p-5 md:p-6", bodyClassName)}>{children}</div>
    </section>
  );
}
