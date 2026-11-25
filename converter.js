const Converter = {
  assets: {}, data: null,
  usd(code) {
    const a = this.assets[code], d = this.data;
    if (!a || !d) return null;
    if (a.type === 'crypto') { const c = d.crypto && d.crypto[a.coingecko_id]; return c ? c.usd : null; }
    const r = d.fiat && d.fiat[code]; return r ? 1 / r : null;
  },
  convert(amount, from, to) {
    const a = this.usd(from), b = this.usd(to);
    return a && b ? amount * a / b : null;
  },
  format(value, code) {
    if (value === null || !isFinite(value)) return '—';
    const a = this.assets[code], max = a ? a.decimal_digits : 2;
    const crypto = a && a.type === 'crypto';
    const digits = crypto && Math.abs(value) >= 1000 ? 2 : max;
    return value.toLocaleString('en-US', { minimumFractionDigits: crypto ? 0 : digits, maximumFractionDigits: digits });
  }
};
