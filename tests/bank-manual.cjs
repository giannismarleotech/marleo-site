const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../hq/bank-manual.js'), 'utf8');
function setup() {
  let sequence = 0;
  const elements = {}, calls = {saved: 0, auto: 0, legacy: 0, html: ''};
  const s = {SESSION: {role: 'admin'}, DATA: {settings: {company: {name: 'Marleo'}}, invoices: [{id: 'invoice', status: 'openstaand'}]},
    BANK: {data: {balances: [{currency: 'EUR', amount: 100}, {currency: 'EUR', amount: 50}, {currency: 'USD', amount: 999}]}},
    document: {getElementById: id => elements[id] || null},
    saveData: () => {calls.saved++; calls.persisted = JSON.stringify(s.DATA);},
    nid: () => 'entry-' + (++sequence), eur: n => n.toFixed(2) + ' EUR',
    esc: value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'),
    toast: (message, error) => {calls.toast = {message, error};},
    rSettings: () => {calls.settings = true;}, rBank: () => {calls.bank = true;},
    bankAutoLink: () => {calls.auto++;}, wiseSync: () => {calls.legacy++;},
    bankLoad: async () => {s.BANK.data.balances[0].amount = 500; s.bankAutoLink();},
    go: view => {calls.route = view;},
    main: () => ({insertAdjacentHTML: (position, html) => {calls.html = html;},
      querySelector: () => ({insertAdjacentHTML: (position, html) => {calls.summary = html;}})})};
  s.window = s;
  vm.createContext(s); vm.runInContext(source, s);
  const input = (id, value) => {elements[id] = {value};};
  const balance = amount => {input('bm_balance', amount); s.bmSaveBalance();};
  const register = (kind, amount, description = 'Materiaal') => {
    input('bm_kind', kind); input('bm_amount', amount); input('bm_description', description); s.bmRegister();
  };
  return {s, calls, input, balance, register};
}
test('EUR parsing preserves cents, zero and negatives; rejects malformed amounts', () => {
  const parse = setup().s.MarleoBankManual.parseCents;
  for (const [input, expected] of [['1234,56',123456], ['1.234,56',123456], ['1234.56',123456], ['0',0], ['-25,50',-2550], ['0,29',29]]) assert.equal(parse(input), expected);
  for (const input of ['', 'abc', '1,234', '10e2', 'Infinity', '1,2,3', '1000000000', '<script>']) assert.equal(parse(input), null, input);
});
test('Correction and registrations persist independently of Wise, invoices and company settings', () => {
  const {s, calls, balance, register} = setup();
  balance('1000,00'); register('expense', '19,99'); register('income', '50,00');
  assert.equal(s.DATA.settings.wiseManual.balanceCents, 103001);
  assert.equal(s.DATA.settings.wiseManual.entries.length, 3);
  assert.equal(s.DATA.settings.wiseManual.entries[0].amountCents, 85000);
  assert.equal(s.DATA.invoices[0].status, 'openstaand'); assert.equal(s.DATA.settings.company.name, 'Marleo');
  assert.equal(s.MarleoBankManual.syncedCents(), 15000);
  s.DATA = JSON.parse(calls.persisted); assert.equal(s.MarleoBankManual.active(), true);
  assert.equal(s.DATA.settings.wiseManual.balanceCents, 103001);
});
test('Manual zero balance remains active; invalid entries do not mutate or save', () => {
  const {s, calls, balance, register} = setup(); balance('0');
  assert.equal(s.MarleoBankManual.active(), true);
  const before = JSON.stringify(s.DATA), saved = calls.saved;
  register('expense', '-5'); register('income', '0'); register('expense', '2', ''); register('transfer', '2'); balance('oops');
  assert.equal(JSON.stringify(s.DATA), before); assert.equal(calls.saved, saved);
});
test('Wise refresh cannot overwrite the manual balance or automatically mark invoices paid; reset restores automation', async () => {
  const {s, calls, balance} = setup(); balance('200');
  await s.wiseSync(true); s.bankAutoLink();
  assert.equal(s.DATA.settings.wiseManual.balanceCents, 20000); assert.equal(calls.auto, 0); assert.equal(calls.legacy, 0);
  assert.equal(s.DATA.invoices[0].status, 'openstaand');
  s.bmUseWise(); assert.equal(s.MarleoBankManual.active(), false);
  s.bankAutoLink(); s.wiseSync(); assert.equal(calls.auto, 1); assert.equal(calls.legacy, 1);
  assert.equal(s.DATA.settings.wiseManual.entries.at(-1).kind, 'automatic');
});
test('Settings and bank show source labels, escaped history and controls without a Wise connection', () => {
  const {s, calls, balance, register} = setup(); s.BANK.data = null;
  balance('25'); register('expense', '5', '<img src=x onerror=alert(1)>');
  s.rSettings(); assert.match(calls.html, /Wise — saldo handmatig beheren/);
  assert.match(calls.html, /geen geld overgeschreven/); assert.match(calls.html, /&lt;img/);
  assert.doesNotMatch(calls.html, /<img/);
  s.rBank(); assert.match(calls.summary, /20.00 EUR/); assert.match(calls.summary, /geen door Wise bevestigd saldo/);
});
test('Client sessions cannot read or mutate the manual balance through extension handlers', () => {
  const {s, calls, balance, register} = setup(); balance('100'); const before = JSON.stringify(s.DATA), saved = calls.saved;
  s.SESSION = {role: 'client'}; balance('900'); register('expense','20'); s.bmUseWise(); s.rSettings(); s.rBank();
  assert.equal(JSON.stringify(s.DATA), before); assert.equal(calls.saved, saved);
  assert.equal(s.bankManualSummary(), ''); assert.equal(calls.settings, undefined); assert.equal(calls.bank, undefined);
});
