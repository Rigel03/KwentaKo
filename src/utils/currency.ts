/**
 * currency.ts
 * All monetary display helpers for KwentaKo.
 * Values are stored as integers (centavos). 100 centavos = ₱1.00
 */

/** Convert centavos integer → display string: ₱ 1,234.50 */
export function formatPHP(centavos: number): string {
  const pesos = centavos / 100;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(pesos);
}

/** Convert centavos → raw number with 2 decimal places */
export function centavosToFloat(centavos: number): number {
  return centavos / 100;
}

/** Convert a decimal peso string (e.g. "1234.50") → centavos integer */
export function pesosToCentavos(pesosStr: string): number {
  const parsed = parseFloat(pesosStr);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

/**
 * Evaluate a simple arithmetic expression string (only + and -).
 * Returns centavos integer. Returns 0 if invalid.
 * e.g. "500 + 250.50 - 80" → 67050
 */
export function evaluateExpression(expr: string): number {
  try {
    // Allow digits, dots, +, -, spaces
    const sanitized = expr.replace(/[^0-9+\-.]/g, '');
    if (!sanitized || sanitized === '-') return 0;

    // Split on + and -, keeping the operators
    const tokens = sanitized.split(/(?=[+-])/).filter(Boolean);
    let total = 0;
    for (const token of tokens) {
      const val = parseFloat(token);
      if (!isNaN(val)) total += val;
    }
    // Convert to centavos
    return Math.max(0, Math.round(total * 100));
  } catch {
    return 0;
  }
}

/** Format a centavos number for display in numpad (e.g. "1,234.50") */
export function formatAmountDisplay(centavos: number): string {
  if (centavos === 0) return '0';
  const pesos = centavos / 100;
  return new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(pesos);
}

/** Short format: "₱1.2K", "₱45.3K", "₱1.2M" for compact displays */
export function formatCompact(centavos: number): string {
  const abs = Math.abs(centavos / 100);
  const sign = centavos < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}₱${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}₱${(abs / 1_000).toFixed(1)}K`;
  return `${sign}₱${abs.toFixed(2)}`;
}
