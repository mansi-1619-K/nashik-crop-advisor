import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Class-name helper: clsx-style conditional composition + tailwind-merge so
 * later utilities correctly override earlier ones (e.g. cn("p-2", "p-4")
 * yields "p-4" instead of both being emitted).
 *
 * extendTailwindMerge teaches the merger about this project's custom design
 * tokens (globals.css @theme): without this, tailwind-merge misclassifies
 * `text-h3` as a text *color* and drops it whenever a real color class
 * (text-ink) follows.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display",
            "h1",
            "h2",
            "h3",
            "body",
            "caption",
          ],
        },
      ],
      shadow: [{ shadow: ["1", "2", "3", "glow"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
