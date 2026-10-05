"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/cn";

interface FlipTextProps {
  /**
   * Additional CSS classes for the wrapper
   */
  className?: string;

  /**
   * The text content to animate (will be split by spaces)
   */
  children: string;

  /**
   * Duration of the flip animation in seconds
   * @default 2.2
   */
  duration?: number;

  /**
   * Initial delay before animation starts in seconds
   * @default 0
   */
  delay?: number;

  /**
   * Whether the animation should loop infinitely
   * @default true
   */
  loop?: boolean;

  /**
   * Custom separator for splitting text (default is space)
   * @default " "
   */
  separator?: string;

  /**
   * Whether all characters should animate together (no stagger)
   * @default false
   */
  together?: boolean;
}

export function FlipText({
  className,
  children,
  duration = 2.2,
  delay = 0,
  loop = true,
  separator = " ",
  together = false,
}: FlipTextProps) {
  const words = useMemo(() => children.split(separator), [children, separator]);
  const totalChars = children.length;

  // Calculate character index for each position
  const getCharIndex = (wordIndex: number, charIndex: number) => {
    let index = 0;
    for (let i = 0; i < wordIndex; i++) {
      index += words[i].length + (separator === " " ? 1 : separator.length);
    }
    return index + charIndex;
  };

  return (
    <div
      className={cn("flip-text-wrapper inline-block leading-none", className)}
      style={{ perspective: "1000px" }}
    >
      {words.map((word, wordIndex) => {
        const chars = word.split("");

        return (
          <React.Fragment key={wordIndex}>
            <span
              className="word inline-block whitespace-nowrap"
              style={{ transformStyle: "preserve-3d" }}
            >
              {chars.map((char, charIndex) => {
                const currentGlobalIndex = getCharIndex(wordIndex, charIndex);

                // Calculate delay - if together, use same delay for all
                let calculatedDelay = delay;
                if (!together) {
                  const normalizedIndex = currentGlobalIndex / totalChars;
                  const sineValue = Math.sin(normalizedIndex * (Math.PI / 2));
                  calculatedDelay = sineValue * (duration * 0.25) + delay;
                }
                // Math.sin can differ by a ULP between the Node server and
                // the browser, which turns the inline --flip-delay string
                // into a hydration mismatch; rounding to 0.1ms keeps SSR
                // and client identical.
                calculatedDelay = Math.round(calculatedDelay * 1e4) / 1e4;

                return (
                  <span
                    key={charIndex}
                    className="flip-char inline-block relative"
                    data-char={char}
                    style={
                      {
                        "--flip-duration": `${duration}s`,
                        "--flip-delay": `${calculatedDelay}s`,
                        "--flip-iteration": loop ? "infinite" : "1",
                        transformStyle: "preserve-3d",
                      } as React.CSSProperties
                    }
                  >
                    {char}
                  </span>
                );
              })}
            </span>
            {/* The word gap lives OUTSIDE the whitespace-nowrap word
                            span (the registry put an &nbsp; inside it): an nbsp
                            makes the whole phrase unbreakable, which would push
                            long crop names past a 390px viewport. A plain text
                            space between the word spans keeps a normal break
                            opportunity in the wrapper's inline context. */}
            {separator === " " && wordIndex < words.length - 1 && " "}
            {separator !== " " && wordIndex < words.length - 1 && (
              <span className="separator inline-block">{separator}</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default FlipText;
