/**
 * haptic.ts
 * Lightweight wrapper for the Vibration API.
 * Safely no-ops on devices that do not support it (iOS, desktop).
 */

/** Short success buzz (15ms) */
export function vibrateSuccess(): void {
  try { navigator.vibrate?.(15); } catch { /* unsupported */ }
}

/** Double-tap confirmation (e.g. delete) */
export function vibrateConfirm(): void {
  try { navigator.vibrate?.([10, 50, 10]); } catch { /* unsupported */ }
}

/** Error pattern */
export function vibrateError(): void {
  try { navigator.vibrate?.([30, 30, 30]); } catch { /* unsupported */ }
}
