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
    <section className={cn("border-2 border-ink bg-white", className)}>
      {label && (
        <header className="flex items-center justify-between gap-3 border-b-2 border-ink px-4 py-1.5">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest">{label}</span>
          {index && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">
              {index}
            </span>
          )}
        </header>
      )}
      <div className={cn("p-4 md:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
