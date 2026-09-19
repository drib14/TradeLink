/**
 * Date and relative time formatting utilities for TradeLink
 */

export function formatRelativeTime(dateStr?: string | Date | number | null): string {
  if (!dateStr) return '';
  const timestamp = typeof dateStr === 'number'
    ? dateStr
    : typeof dateStr === 'string'
    ? new Date(dateStr).getTime()
    : dateStr instanceof Date
    ? dateStr.getTime()
    : NaN;
  if (isNaN(timestamp)) return '';

  const diffMs = Date.now() - timestamp;
  if (diffMs < 0) return 'Just now';

  const secs = Math.floor(diffMs / 1000);
  if (secs < 60) return `${Math.max(1, secs)}s ago`;

  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${Math.max(1, years)}y ago`;
}
