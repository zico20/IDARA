import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names, resolving conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Initials from a display name, e.g. "Jane Doe" -> "JD". */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** Deterministic accent color from a string (for avatars). */
export function colorFromString(input: string): string {
  const palette = [
    "#58A6FF",
    "#3FB950",
    "#D29922",
    "#F85149",
    "#BC8CFF",
    "#39C5CF",
    "#FF7B72",
  ];
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return palette[Math.abs(hash) % palette.length];
}
