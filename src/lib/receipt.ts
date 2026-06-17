/**
 * Generate a unique receipt number in the format MTU-YYYYMMDD-XXXXXX
 * where XXXXXX is 6 random uppercase alphanumeric characters.
 *
 * @returns A formatted receipt number string
 */
export function generateReceiptNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  const array = new Uint8Array(6);
  crypto.getRandomValues(array);
  for (let i = 0; i < 6; i++) {
    random += chars[array[i] % chars.length];
  }

  return `MTU-${dateStr}-${random}`;
}

/**
 * Format an ISO timestamp string into a human-readable date and time.
 *
 * @param isoString - An ISO 8601 date string (e.g. "2026-05-14T10:32:00Z")
 * @returns A formatted string like "14 May 2026, 10:32 AM"
 */
export function formatReceiptDate(isoString: string): string {
  const date = new Date(isoString);
  const day = date.getDate();
  const month = date.toLocaleDateString('en-GB', { month: 'short' });
  const year = date.getFullYear();
  const time = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${day} ${month} ${year}, ${time}`;
}
