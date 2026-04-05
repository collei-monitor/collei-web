import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Truncate hash (commit hash, etc.) to 7 characters
 * @param hash - The hash string to truncate
 * @param length - The length to truncate to (default: 7)
 * @returns Truncated hash or original value if shorter than length
 */
export function truncateHash(hash: string | null | undefined, length: number = 7): string {
  if (!hash) return ""
  return hash.length > length ? hash.substring(0, length) : hash
}
