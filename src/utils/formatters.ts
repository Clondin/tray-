
export const fmt = (num?: number | null): string => {
    if (num === undefined || num === null || isNaN(num)) return '$0';
    return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num)};

export const fmtPct = (num?: number | null): string => {
    if (num === undefined || num === null || isNaN(num)) return '0.0%';
    if (!isFinite(num)) return '∞%';
    return `${num.toFixed(1)}%`
};
