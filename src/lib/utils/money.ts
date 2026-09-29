/**
 * Format amounts to Bangladeshi Taka currency format (e.g. ৳1,450)
 */
export function formatPrice(amount: number): string {
  return `৳${amount.toLocaleString('en-BD')}`;
}
