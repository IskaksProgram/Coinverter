const API = {
  KEY: 'cv_rates',
  async get(url) { const r = await fetch(url); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); },
  async load(cryptoIds) {
    const saved = JSON.parse(localStorage.getItem(this.KEY) || 'null') || {};
    const out = { fiat: saved.fiat || null, crypto: saved.crypto || null, fiatTime: saved.fiatTime, cryptoTime: saved.cryptoTime, stale: false };
    try { out.fiat = (await this.get('https://open.er-api.com/v6/latest/USD')).rates; out.fiatTime = Date.now(); }
    catch { try { out.fiat = { USD: 1, ...(await this.get('https://api.frankfurter.app/latest?from=USD')).rates }; out.fiatTime = Date.now(); } catch { out.stale = true; } }
    try { out.crypto = await this.get('https://api.coingecko.com/api/v3/simple/price?ids=' + cryptoIds.join(',') + '&vs_currencies=usd&include_24hr_change=true'); out.cryptoTime = Date.now(); }
    catch { out.stale = true; }
    localStorage.setItem(this.KEY, JSON.stringify({ fiat: out.fiat, crypto: out.crypto, fiatTime: out.fiatTime, cryptoTime: out.cryptoTime }));
    return out;
  }
};
