import { ArrowRight } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * InteractiveHoverButton (ObsidianUI block — plan 5.1, applied to the
 * Export/Print, Refresh and Compare actions).
 *
 * The block's signature, as it actually behaves (verified by pixel-sampling
 * the hover state): a small moss disc sits at the left of a dark pill; on
 * hover the disc scales to 100.8× and fills the pill moss while the resting
 * label slides out and a label + arrow slides in — so the hover row is
 * `text-primary-foreground` (near-black), which reads 7.7:1 on the moss fill
 * and must NOT be re-tinted to moss-deep (moss-on-moss would fail contrast).
 *
 * Adaptations from the registry original, for this app:
 * - The disc is an always-present layer (plain 8px dot at rest). When an
 *   `icon` is supplied the icon sits ABOVE it, unscaled, in a dark ink that
 *   matches the `bg-moss text-canvas` icon-tile pattern — so the fill effect
 *   survives the icon variant instead of being replaced by it.
 * - Tailwind v4's bare `border` inherits `currentColor`; pinned to
 *   `border-border/50`.
 * - The hover row is `aria-hidden` — the resting label is the accessible
 *   name, otherwise the label is announced twice.
 * - `motion-reduce:transition-none` applies the fill/state swap instantly
 *   under `prefers-reduced-motion`.
 * - Explicit `focus-visible` ring (the registry original relied on the UA
 *   outline alone).
 */
export function InteractiveHoverButton({
  children,
  className,
  icon,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon?: ReactNode }) {
  return (
    <button
      className={cn(
        "group relative w-auto cursor-pointer overflow-hidden rounded-full border border-border/50 bg-background p-2 px-5 text-center text-sm font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-hidden disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <div className="relative flex items-center gap-2">
        {/* Moss disc — the fill. In flow as the 8px dot when no icon; pinned
            behind the icon when one is given. Scales to flood the pill. */}
        <span
          aria-hidden
          className={cn(
            "bg-primary rounded-full transition-transform duration-300 group-hover:scale-[100.8] motion-reduce:transition-none",
            icon
              ? "absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2"
              : "h-2 w-2 shrink-0",
          )}
        />
        {/* Resting row: the icon and the label must ride out together — a
            sibling icon would linger on top of the incoming overlay. */}
        <span className="relative z-[1] flex items-center gap-2 whitespace-nowrap transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0 motion-reduce:transition-none">
          {icon ? (
            <span className="shrink-0 text-primary-foreground">{icon}</span>
          ) : null}
          <span>{children}</span>
        </span>
      </div>
      <div
        aria-hidden
        className="absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 whitespace-nowrap text-primary-foreground opacity-0 transition-all duration-300 group-hover:-translate-x-5 group-hover:opacity-100 motion-reduce:transition-none"
      >
        <span>{children}</span>
        <ArrowRight className="h-4 w-4 shrink-0" />
      </div>
    </button>
  );
}
