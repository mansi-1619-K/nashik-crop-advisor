"use client";

import React, { memo, forwardRef } from "react";
import { LiquidMetal as LiquidMetalShader } from "@paper-design/shaders-react";
import { cn } from "@/lib/cn";
import { useReducedMotionLive as useReducedMotion } from "@/lib/use-reduced-motion";

// ============================================================================
// LiquidMetal - Base shader wrapper component
// ============================================================================

export interface LiquidMetalProps {
  /** Base background color of the liquid metal */
  colorBack?: string;
  /** Tint/highlight color for the chrome effect */
  colorTint?: string;
  /** Animation speed (0.1 - 2.0 recommended) */
  speed?: number;
  /** Pattern complexity/repetition (1 - 10) */
  repetition?: number;
  /** Wave distortion amount (0 - 1) */
  distortion?: number;
  /** Texture scale */
  scale?: number;
  /** Additional CSS classes */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

export const LiquidMetal = memo(function LiquidMetal({
  colorBack = "#aaaaac",
  colorTint = "#ffffff",
  speed = 0.5,
  repetition = 4,
  distortion = 0.1,
  scale = 1,
  className,
  style,
}: LiquidMetalProps) {
  const reduceMotion = useReducedMotion();
  return (
    <div
      className={cn("absolute inset-0 z-0 overflow-hidden", className)}
      style={style}
    >
      <LiquidMetalShader
        colorBack={colorBack}
        colorTint={colorTint}
        speed={reduceMotion ? 0 : speed}
        repetition={repetition}
        distortion={distortion}
        softness={0}
        shiftRed={0.3}
        shiftBlue={-0.3}
        angle={45}
        shape="none"
        scale={scale}
        fit="cover"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
});

LiquidMetal.displayName = "LiquidMetal";

// ============================================================================
// LiquidMetalButton - Premium button with liquid metal border effect
// ============================================================================

interface LiquidMetalControlProps {
  /** Button content */
  children: React.ReactNode;
  /** Optional icon displayed on the left */
  icon?: React.ReactNode;
  /** Border width in pixels */
  borderWidth?: number;
  /** Configuration for the LiquidMetal shader */
  metalConfig?: Omit<LiquidMetalProps, "className" | "style">;
  /** Size variant */
  size?: "xs" | "sm" | "md" | "lg";
}

export type LiquidMetalButtonProps = LiquidMetalControlProps &
  (
    | (React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: never })
    | (React.AnchorHTMLAttributes<HTMLAnchorElement> & {
        href: string;
        disabled?: boolean;
      })
  );

export const LiquidMetalButton = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  LiquidMetalButtonProps
>(
  (
    {
      children,
      icon,
      borderWidth = 4,
      metalConfig,
      size = "md",
      className,
      disabled,
      href,
      ...props
    },
    ref,
  ) => {
    const sizeStyles = {
      xs: "py-1.5 pl-1.5 pr-4 gap-2 text-xs",
      sm: "py-2 pl-2 pr-6 gap-3 text-sm",
      md: "py-3 pl-3 pr-8 gap-4 text-base",
      lg: "py-4 pl-4 pr-10 gap-6 text-lg",
    };

    const iconSizes = {
      xs: "w-6 h-6",
      sm: "w-8 h-8",
      md: "w-10 h-10",
      lg: "w-12 h-12",
    };

    const controlClassName = cn(
      "relative group inline-block rounded-full cursor-pointer border-none bg-transparent p-0 outline-none transition-transform active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none aria-disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:pointer-events-none",
      className,
    );
    const content = (
      <div
        className="relative rounded-full overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)]"
        style={{ padding: borderWidth }}
      >
        {/* Liquid Metal Border Layer */}
        <LiquidMetal
          colorBack={metalConfig?.colorBack ?? "#888888"}
          colorTint={metalConfig?.colorTint ?? "#ffffff"}
          speed={metalConfig?.speed ?? 0.4}
          repetition={metalConfig?.repetition ?? 4}
          distortion={metalConfig?.distortion ?? 0.15}
          scale={metalConfig?.scale ?? 1}
          className="absolute inset-0 z-0 rounded-full"
        />

        {/* Inner Button Body */}
        <div
          className={cn(
            "relative z-10 rounded-full flex items-center",
            "bg-background",
            "transition-colors duration-200",
            "group-hover:bg-muted",
            sizeStyles[size],
          )}
        >
          {icon && (
            <div
              className={cn(
                "rounded-full flex items-center justify-center",
                "bg-muted",
                "shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]",
                iconSizes[size],
              )}
            >
              <span className="text-muted-foreground" aria-hidden="true">
                {icon}
              </span>
            </div>
          )}
          <span className="font-medium tracking-tight text-foreground">
            {children}
          </span>
        </div>
      </div>
    );

    if (href !== undefined) {
      const anchorProps =
        props as React.AnchorHTMLAttributes<HTMLAnchorElement>;
      return (
        <a
          {...anchorProps}
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={disabled ? undefined : href}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : anchorProps.tabIndex}
          className={controlClassName}
          onClick={(event) => {
            if (disabled) {
              event.preventDefault();
              return;
            }
            anchorProps.onClick?.(event);
          }}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        type="button"
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        ref={ref as React.Ref<HTMLButtonElement>}
        disabled={disabled}
        className={controlClassName}
      >
        {content}
      </button>
    );
  },
);

LiquidMetalButton.displayName = "LiquidMetalButton";

export default LiquidMetalButton;
