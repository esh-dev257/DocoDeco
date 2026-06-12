import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Decision: cn() utility (shadcn/ui pattern)- merges Tailwind classes cleanly,
// handles conditional classes, and deduplicates conflicting utilities.
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}
