/**
 * Utility functions for the application
 */

/**
 * Merge class names conditionally
 * Simple implementation for className merging
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
