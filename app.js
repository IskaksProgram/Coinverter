const $ = id => document.getElementById(id);
const POPULAR = ['USD','EUR','GBP','RUB','KGS','CNY','BTC','ETH','USDT','SOL'];
let timer;

function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 1800); }
function label(c) { const a = Converter.assets[c]; return (a.flag ? a.flag + ' ' : '') + c + ' — ' + a.name; }

function fillSelects() {
  for (const id of ['from', 'to']) {
    const s = $(id); s.innerHTML = '';
    for (const [grp, type] of [['FIAT', 'fiat'], ['CRYPTO', 'crypto']]) {
      const g = document.createElement('optgroup'); g.label = grp;
      Object.keys(Converter.assets).filter(c => Converter.assets[c].type === type).sort().forEach(c => g.append(new Option(label(c), c)));
      s.append(g);
    }
  }
}

function render() {
  const amt = parseFloat($('amount').value) || 0, from = $('from').value, to = $('to').value;
  const res = Converter.convert(amt, from, to), one = Converter.convert(1, from, to);
  $('result').textContent = res === null ? 'Rate unavailable' : Converter.format(amt, from) + ' ' + from + ' = ' + Converter.format(res, to) + ' ' + to;
  $('rate').textContent = one === null ? '' : '1 ' + from + ' = ' + Converter.format(one, to) + ' ' + to;
  localStorage.setItem('cv_pair', JSON.stringify({ from, to, amt: $('amount').value }));
  clearTimeout(timer);
  if (res !== null && amt > 0) timer = setTimeout(() => saveHistory(amt, from, to, res, one), 1500);
}

function saveHistory(amount, from, to, result, rate) {
  const h = JSON.parse(localStorage.getItem('cv_history') || '[]');
  h.unshift({ from, to, amount, result, rate, time: Date.now() });
  localStorage.setItem('cv_history', JSON.stringify(h.slice(0, 50)));
}

function renderPopular() {
  $('popular').innerHTML = POPULAR.map(c => {
    const a = Converter.assets[c], u = Converter.usd(c);
    const cg = a.type === 'crypto' && Converter.data.crypto ? Converter.data.crypto[a.coingecko_id] : null;
    const ch = cg ? cg.usd_24h_change : null;
    const txt = typeof ch === 'number' ? (ch >= 0 ? '+' : '') + ch.toFixed(2) + '%' : '—';
    return `<div class="tile"><b>${a.flag || ''} ${c}</b><small>${a.name}</small><div class="p">${u === null ? '—' : '$' + Converter.format(u, 'USD')}</div><small class="${typeof ch === 'number' ? (ch >= 0 ? 'up' : 'down') : ''}">${txt}</small></div>`;
  }).join('');
}

function setStatus() {
  const d = Converter.data, el = $('status');
  const t = Math.min(d.fiatTime || Infinity, d.cryptoTime || Infinity);
  if (!isFinite(t)) { el.textContent = 'No data available — check your connection'; el.className = 'status stale'; return; }
  el.textContent = (d.stale ? 'Offline — last saved: ' : 'Updated: ') + new Date(t).toLocaleString();
  el.className = 'status' + (d.stale ? ' stale' : '');
}

async function refresh() {
  Converter.data = await API.load(Object.values(Converter.assets).filter(a => a.type === 'crypto').map(a => a.coingecko_id));
  setStatus(); renderPopular(); render();
}

async function init() {
  const [fiat, crypto] = await Promise.all([fetch('currencies.json').then(r => r.json()), fetch('crypto.json').then(r => r.json())]);
  Converter.assets = { ...fiat, ...crypto };
  fillSelects();
  const saved = JSON.parse(localStorage.getItem('cv_pair') || 'null') || { from: 'USD', to: 'KGS', amt: '100' };
  $('from').value = saved.from; $('to').value = saved.to; $('amount').value = saved.amt;
  ['amount', 'from', 'to'].forEach(id => $(id).addEventListener('input', render));
  $('swap').onclick = () => { const f = $('from').value; $('from').value = $('to').value; $('to').value = f; render(); };
  $('copy').onclick = async () => { try { await navigator.clipboard.writeText($('result').textContent); toast('Copied'); } catch { toast('Copy failed'); } };
  await refresh();
  setInterval(refresh, 120000);
}
init().catch(e => { $('status').textContent = 'Failed to load data files — run via a local server'; $('status').className = 'status stale'; console.error(e); });
