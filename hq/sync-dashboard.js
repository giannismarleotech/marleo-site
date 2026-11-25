import './finance.js?v=planning-remove-20261121';
/* Cloud snapshots are authoritative on sign-in. Writes use optimistic locking. */
const copy = value => JSON.parse(JSON.stringify(value));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const baseline = {};
let queued = Promise.resolve();

export function mergeRecords(base, local, remote) {
  if (!Array.isArray(base) || !Array.isArray(local) || !Array.isArray(remote) ||
      [...base, ...local, ...remote].some(item => !item?.id)) return local;
  const before = new Map(base.map(item => [item.id, item]));
  const here = new Map(local.map(item => [item.id, item]));
  const there = new Map(remote.map(item => [item.id, item]));
  for (const [id, original] of before) {
    if (!here.has(id)) there.delete(id);
    else if (there.has(id) && !same(original, here.get(id))) there.set(id, here.get(id));
  }
  for (const [id, item] of here) if (!before.has(id)) there.set(id, item);
  return [...there.values()];
}

function serial(task) {
  const result = queued.then(task);
  queued = result.catch(() => {});
  return result;
}
function persist() {
  // Browser-cache failures are reported separately and never turn cloud success into failure.
  if (window.HQCache) return window.HQCache.save(DATA);
  try { localStorage.setItem(LS_KEY, JSON.stringify(DATA)); } catch (_) {}
}
function redraw() {
  // Do not destroy editable agent drafts or reset the job workspace during background sync.
  if (['agents','controlcenter'].includes(VIEW)) return;
  if (SESSION && VIEW && !document.querySelector('.modal-backdrop.open')) go(VIEW);
}
async function readCollection(key) {
  const result = await sb.from('crm_state').select('data,updated_at')
    .eq('user_id', CLOUD.uid).eq('collection', key).maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}
async function push() {
  if (!sb || !CLOUD.uid) return;
  try {
    for (const key of cloudCollections()) {
      if (same(DATA[key], baseline[key]) || cloudHash(DATA[key]) === CLOUD.hashes[key]) continue;
      const sent = copy(DATA[key]);
      const base = baseline[key] ?? JSON.parse(CLOUD.hashes[key] || 'null');
      let saved;
      for (let attempt = 0; attempt < 4; attempt++) {
        const remote = await readCollection(key);
        const merged = remote ? mergeRecords(base, sent, remote.data) : sent;
        const row = {user_id: CLOUD.uid, collection: key, data: merged, updated_at: new Date().toISOString()};
        let result;
        if (remote) {
          result = await sb.from('crm_state').update(row).eq('user_id', CLOUD.uid)
            .eq('collection', key).eq('updated_at', remote.updated_at).select('data');
        } else {
          result = await sb.from('crm_state').insert(row).select('data');
          if (result.error?.code === '23505') continue;
        }
        if (result.error) throw result.error;
        if (result.data?.length) { saved = merged; break; }
      }
      if (saved === undefined) throw new Error('Gelijktijdige wijziging. Probeer opnieuw te synchroniseren.');
      // Preserve edits made while this request was in flight.
      DATA[key] = mergeRecords(sent, DATA[key], saved);
      baseline[key] = copy(saved);
      CLOUD.hashes[key] = cloudHash(saved);
    }
    persist();
    cloudSetStatus('Opgeslagen in de cloud');
  } catch (error) {
    cloudSetStatus('Opslaan mislukt: ' + error.message, true);
  }
}
window.cloudPushChanged = () => serial(push);
window.cloudPull = initial => serial(async () => {
  if (!sb || !CLOUD.uid) return;
  try {
    if (!initial) await push();
    const result = await sb.from('crm_state').select('collection,data,updated_at').eq('user_id', CLOUD.uid);
    if (result.error) throw result.error;
    if (initial && !result.data.length) {
      await push();
      return;
    }
    let changed = false;
    for (const row of result.data) {
      const key = row.collection;
      // Keep unsaved local work if an earlier write failed.
      const dirty = !initial && baseline[key] !== undefined && !same(DATA[key], baseline[key]);
      const next = dirty ? mergeRecords(baseline[key], DATA[key], row.data) : row.data;
      changed ||= !same(DATA[key], next);
      DATA[key] = copy(next);
      baseline[key] = copy(row.data);
      CLOUD.hashes[key] = cloudHash(row.data);
    }
    persist();
    if (changed && !initial) redraw();
    cloudSetStatus('Gesynchroniseerd ' + new Date().toLocaleTimeString('nl-BE', {hour:'2-digit',minute:'2-digit'}));
  } catch (error) {
    cloudSetStatus('Synchroniseren mislukt: ' + error.message, true);
  }
});

export function monthlyTotals(invoices, year) {
  return Array.from({length:12}, (_, month) => {
    const key = year + '-' + String(month + 1).padStart(2, '0');
    const list = invoices.filter(invoice => invoice.date?.startsWith(key) && invoice.type !== 'offerte' && invoice.status !== 'concept');
    const amount = invoice => invoice.type === 'creditnota' ? -Math.abs(invSub(invoice)) : invSub(invoice);
    const total = list.reduce((sum, invoice) => sum + amount(invoice), 0);
    const paid = list.filter(invoice => invStatus(invoice) === 'betaald').reduce((sum, invoice) => sum + (invoice.type === 'creditnota' ? -Math.abs(invTot(invoice)) : invTot(invoice)), 0);
    const open = list.filter(invoice => invStatus(invoice) !== 'betaald').reduce((sum, invoice) => sum + (invoice.type === 'creditnota' ? -Math.abs(invTot(invoice)) : invTot(invoice)), 0);
    return {key, count:list.length, total, paid, open};
  });
}
let selectedYear = new Date().getFullYear();
function monthlyDashboard() {
  if (window.renderFinance) { window.renderFinance(); return; }
  if (SESSION?.role !== 'admin' || !['dashboard','stats','reports'].includes(VIEW)) return;
  document.getElementById('monthlyInvoices')?.remove();
  const years = [...new Set([selectedYear, new Date().getFullYear(), ...DATA.invoices.map(invoice => Number(invoice.date?.slice(0,4))).filter(Boolean)])].sort((a,b)=>b-a);
  const section = document.createElement('section');
  section.id = 'monthlyInvoices';
  section.className = 'panelbox';
  section.style.marginBlock = '20px';
  section.innerHTML = '<div class="topbar"><div><h3>Facturen per maand</h3><p class="hint">Omzet excl. btw op factuurdatum. Betaald en openstaand incl. btw, gegroepeerd op factuurmaand. Offertes en concepten zijn uitgesloten.</p></div><label>Jaar<select id="monthlyYear">' +
    years.map(year => '<option '+(year===selectedYear?'selected':'')+'>'+year+'</option>').join('') +
    '</select></label></div><div style="overflow-x:auto"><table><thead><tr><th>Maand</th><th>Facturen</th><th>Omzet excl. btw</th><th>Betaald incl. btw</th><th>Open incl. btw</th><th>Details</th></tr></thead><tbody>' +
    monthlyTotals(DATA.invoices, selectedYear).map(row => '<tr><td>'+new Date(row.key+'-01T12:00:00').toLocaleDateString('nl-BE',{month:'long'})+'</td><td>'+row.count+'</td><td>'+eur(row.total)+'</td><td>'+eur(row.paid)+'</td><td>'+eur(row.open)+'</td><td><button class="btn sm subtle" data-month="'+row.key+'">Bekijken</button></td></tr>').join('') +
    '</tbody></table></div>';
  main().append(section);
  section.querySelector('select').onchange = event => { selectedYear = Number(event.target.value); monthlyDashboard(); };
  section.addEventListener('click', event => {
    const month = event.target.closest('[data-month]')?.dataset.month;
    if (!month) return;
    const list = DATA.invoices.filter(invoice => invoice.date?.startsWith(month) && invoice.type !== 'offerte' && invoice.status !== 'concept');
    openM('Facturen · '+month, invTable(list), '', true);
  });
}
const previousGo = window.go;
window.go = function () {
  const result = previousGo.apply(this, arguments);
  monthlyDashboard();
  return result;
};
monthlyDashboard();
