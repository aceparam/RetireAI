// Indian-locale aware formatting helpers (lakh / crore aware).

/** Format a number as Indian Rupees with smart abbreviation (L / Cr). */
export function formatINR(value: number, opts?: { decimals?: number; compact?: boolean }): string {
  if (!isFinite(value)) return "—";
  const decimals = opts?.decimals ?? 0;
  const compact = opts?.compact ?? true;
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);

  if (compact) {
    if (abs >= 1.0e7) {
      return `${sign}₹${(abs / 1.0e7).toFixed(abs >= 1.0e8 ? 1 : 2)} Cr`;
    }
    if (abs >= 1.0e5) {
      return `${sign}₹${(abs / 1.0e5).toFixed(abs >= 1.0e6 ? 1 : 2)} L`;
    }
    if (abs >= 1.0e3) {
      return `${sign}₹${(abs / 1.0e3).toFixed(0)}K`;
    }
  }
  return `${sign}₹${abs.toLocaleString("en-IN", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  })}`;
}

/** Full rupee value with Indian digit grouping (no abbreviation). */
export function formatINRFull(value: number): string {
  if (!isFinite(value)) return "—";
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export function formatPercent(value: number, decimals = 1): string {
  if (!isFinite(value)) return "—";
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number, decimals = 0): string {
  if (!isFinite(value)) return "—";
  return value.toLocaleString("en-IN", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });
}

export function formatYears(value: number): string {
  if (!isFinite(value)) return "—";
  if (value <= 0) return "Achieved";
  const years = Math.floor(value);
  const months = Math.round((value - years) * 12);
  if (years === 0) return `${months} mo`;
  if (months === 0) return `${years} yr`;
  return `${years} yr ${months} mo`;
}

/** Parse a possibly-formatted string back into a number. */
export function parseNumber(input: string): number {
  const cleaned = input.replace(/[^0-9.-]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}
