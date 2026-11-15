/**
 * Format a date string into a human-readable format.
 * Example: "Nov 15, 2026" or "Nov 15, 2026 at 3:42 PM"
 */
export function formatDate(dateString: string, includeTime = false): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    const opts: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    if (includeTime) {
      opts.hour = 'numeric';
      opts.minute = '2-digit';
    }
    return date.toLocaleString('en-US', opts);
  } catch {
    return '—';
  }
}

/**
 * Format a date as a relative string ("2 hours ago", "3 days ago", etc.)
 */
export function formatRelativeTime(dateString: string): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  } catch {
    return '—';
  }
}

/**
 * Format a duration in milliseconds to a human-readable string.
 * Example: 125000 → "2m 5s", 65000 → "1m 5s", 999 → "999ms"
 */
export function formatDuration(ms?: number | null): string {
  if (ms == null || ms < 0) return '—';
  if (ms < 1000) return `${ms}ms`;
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

/**
 * Format a number as currency.
 * Example: 1234.56 → "$1,234.56"
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}

/**
 * Format a large number with thousands separators.
 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

/**
 * Format a percentage.
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Get initials from a name string.
 * "Jane Doe" → "JD", "Alice" → "AL"
 */
export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return name.slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Truncate text to a given length.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert snake_case or kebab-case to Title Case.
 * "workflow_run" → "Workflow Run"
 */
export function titleCase(str: string): string {
  return str.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Generate a human-friendly error message from an unknown error.
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred.';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'An unexpected error occurred.';
}

/**
 * Build a query string from an object, skipping null/undefined values.
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `?${qs}` : '';
}

/**
 * Debounce a function.
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Color for a numeric score (0–100). Returns a CSS var name.
 */
export function scoreColor(score: number): string {
  if (score >= 75) return 'var(--success)';
  if (score >= 50) return 'var(--warning)';
  return 'var(--danger)';
}
