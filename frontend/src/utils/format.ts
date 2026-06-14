/**
 * Format a price in VND (e.g. 35,000₫) or other currency.
 */
export function formatPrice(price: number, currency = 'VND'): string {
  if (currency === 'VND') {
    return `${price.toLocaleString('vi-VN')}₫`;
  }
  return price.toLocaleString('en-US', { style: 'currency', currency });
}

/**
 * Format distance: < 1000m shows meters, otherwise km with 1 decimal.
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Format audio duration from seconds to MM:SS.
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
