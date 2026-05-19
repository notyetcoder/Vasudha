import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines Tailwind CSS classes, resolving conflicts using twMerge.
 * @param inputs - Array of class values (strings, objects, or arrays).
 * @returns A single string of merged classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
