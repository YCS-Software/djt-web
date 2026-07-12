// Shared date formatting for the admin console.
// House display format: dd-mm-yyyy H:i:s (e.g. 09-07-2026 14:05:32).

const pad = (n: number): string => String(n).padStart(2, '0');

/**
 * Format a date/ISO string / timestamp as `dd-mm-yyyy HH:mm:ss`.
 * Returns '—' for empty / unparseable values.
 */
export const formatDateTime = (value?: string | number | Date | null): string => {
  if (value === null || value === undefined || value === '') return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return (
    `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
};

/** Date-only variant: `dd-mm-yyyy`. */
export const formatDate = (value?: string | number | Date | null): string => {
  if (value === null || value === undefined || value === '') return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
};
