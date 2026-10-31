/* Manual HQ balance and registrations. Never calls a payment API or changes invoices. */
(function () {
  'use strict';
  var LIMIT = 99999999999;
  function admin() { return typeof SESSION !== 'undefined' && SESSION && SESSION.role === 'admin'; }
  function state() { return (DATA.settings && DATA.settings.wiseManual) || {}; }
  function active() { var s = state(); return s.enabled === true && Number.isSafeInteger(s.balanceCents) && Math.abs(s.balanceCents) <= LIMIT; }
  function cents(value) {
    var s = String(value).trim().replace(/[\s\u00a0\u202f]/g, '');
    if (/^-?\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s)) s = s.replace(/\./g, '');
    if (!/^-?\d+(?:[,.]\d{1,2})?$/.test(s)) return null;
    var n = Math.round(Number(s.replace(',', '.')) * 100);
    return Number.isSafeInteger(n) && Math.abs(n) <= LIMIT ? n : null;
  }
  function synced() {
    if (!BANK.data || !Array.isArray(BANK.data.balances)) return null;
    return Math.round(BANK.data.balances.filter(function (b) { return b.currency === 'EUR'; })
      .reduce(function (sum, b) { return sum + Number(b.amount || 0); }, 0) * 100);
  }
  function money(n) { return eur(n / 100); }
  function stamp(at) { return at ? new Date(at).toLocaleString('nl-BE') : ''; }
  function commit(s) {
    DATA.settings = DATA.settings || {}; DATA.settings.wiseManual = s;
    saveData();
  }
  function record(s, kind, amount, description) {
    s.entries = s.entries || [];
    s.updatedAt = new Date().toISOString();
    s.entries.push({ id: nid('bankmanual'), kind: kind, amountCents: amount,
      balanceCents: s.balanceCents, description: description, at: s.updatedAt });
    commit(s);
  }
  function input(id) { return (document.getElementById(id) || {}).value || ''; }
  window.bankManualActive = active;
  window.bankManualSummary = function () {
    if (!admin() || !active()) return '';
    return '<div class="panelbox" id="bankManualSummary"><h3>Handmatig saldo in HQ</h3>' +
      '<div style="font-size:1.9rem;font-weight:700">' + money(state().balanceCents) + '</div>' +
      '<div class="hint">Bijgewerkt ' + esc(stamp(state().updatedAt)) + '. Dit is je eigen registratie, geen door Wise bevestigd saldo.</div>' +
      '<button class="btn sm subtle" onclick="go(\'settings\')">Saldo en registraties aanpassen</button></div>';
  };
  function panel() {
    var s = state(), on = active(), live = synced();
    var initial = on ? s.balanceCents : live;
    var rows = (s.entries || []).slice(-12).reverse().map(function (e) {
      return '<tr><td>' + esc(stamp(e.at)) + '</td><td>' + esc(e.description) + '</td><td class="num">' +
        (e.amountCents > 0 ? '+ ' : '') + money(e.amountCents) + '</td><td class="num">' + money(e.balanceCents) + '</td></tr>';
    }).join('');
    return '<section class="panelbox" id="bankManualSettings" style="margin-bottom:18px">' +
      '<h3>Wise — saldo handmatig beheren</h3><p class="hint">' +
      (on ? 'Handmatige stand actief. Wise-verversingen overschrijven dit saldo niet. Facturen worden in deze stand niet automatisch als betaald gemarkeerd.' :
        'Automatische Wise-stand. Sla hieronder een saldo op om de handmatige stand te gebruiken.') + '</p>' +
      '<div class="hint">' + (live === null ? 'Er is nog geen Wise-saldo opgehaald.' : 'Laatst opgehaald uit Wise (EUR, inclusief potjes): ' + money(live) + '.') + '</div>' +
      '<form onsubmit="bmSaveBalance(event)"><div class="fgroup"><label for="bm_balance">Totaal EUR-saldo in HQ (inclusief potjes)</label>' +
      '<input id="bm_balance" inputmode="decimal" autocomplete="off" placeholder="1234,56" value="' +
      (initial === null ? '' : (initial / 100).toFixed(2).replace('.', ',')) + '"></div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px"><button class="btn" type="submit">Handmatig saldo opslaan</button>' +
      (on ? '<button class="btn subtle" type="button" onclick="bmUseWise()">Terug naar automatisch Wise-saldo</button>' : '') + '</div></form>' +
      (on ? '<div style="font-size:1.5rem;font-weight:700;margin:16px 0">Saldo in HQ: ' + money(s.balanceCents) + '</div>' +
        '<form onsubmit="bmRegister(event)"><h4>Inkomst of uitgave registreren</h4>' +
        '<p class="hint">Dit past alleen het handmatige HQ-saldo aan. Er wordt geen geld overgeschreven en er wordt geen factuur als betaald gemarkeerd.</p>' +
        '<div class="frow"><div class="fgroup"><label for="bm_kind">Soort registratie</label><select id="bm_kind"><option value="expense">Uitgave (saldo verlagen)</option><option value="income">Inkomst (saldo verhogen)</option></select></div>' +
        '<div class="fgroup"><label for="bm_amount">Bedrag in EUR</label><input id="bm_amount" inputmode="decimal" autocomplete="off" placeholder="25,00"></div></div>' +
        '<div class="fgroup"><label for="bm_description">Omschrijving</label><input id="bm_description" maxlength="160" placeholder="Bijvoorbeeld: aankoop materiaal"></div>' +
        '<button class="btn" type="submit">Alleen in HQ registreren</button></form>' : '') +
      (rows ? '<details style="margin-top:16px"><summary>Laatste handmatige registraties</summary><div style="overflow-x:auto"><table><thead><tr><th>Wanneer</th><th>Omschrijving</th><th>Wijziging</th><th>Saldo na registratie</th></tr></thead><tbody>' + rows + '</tbody></table></div></details>' : '') + '</section>';
  }
  function renderPanel() {
    var el = document.getElementById('bankManualSettings');
    if (el) el.outerHTML = panel();
  }
  window.bmSaveBalance = function (event) {
    if (event) event.preventDefault(); if (!admin()) return;
    var n = cents(input('bm_balance'));
    if (n === null) { toast('Vul een geldig EUR-bedrag in, bijvoorbeeld 1234,56 (maximaal 2 decimalen).', true); return; }
    var s = state(), previous = active() ? s.balanceCents : synced();
    s.enabled = true; s.balanceCents = n;
    record(s, 'correction', previous === null ? 0 : n - previous, 'Handmatig saldo ingesteld');
    renderPanel(); toast('Handmatig saldo opgeslagen. Wise overschrijft dit niet.');
  };
  window.bmRegister = function (event) {
    if (event) event.preventDefault(); if (!admin() || !active()) return;
    var n = cents(input('bm_amount')), kind = input('bm_kind'), description = input('bm_description').trim();
    if (n === null || n <= 0 || (kind !== 'expense' && kind !== 'income') || !description || description.length > 160) {
      toast('Kies een soort, een positief bedrag met maximaal 2 decimalen en een omschrijving.', true); return;
    }
    var s = state(), delta = kind === 'expense' ? -n : n;
    if (Math.abs(s.balanceCents + delta) > LIMIT) { toast('Dit saldo is te groot.', true); return; }
    s.balanceCents += delta; record(s, kind, delta, description);
    renderPanel(); toast('In HQ geregistreerd. Geen bankoverschrijving uitgevoerd.');
  };
  window.bmUseWise = function () {
    if (!admin() || !active()) return;
    var s = state(); s.enabled = false;
    record(s, 'automatic', 0, 'Teruggeschakeld naar automatisch Wise-saldo');
    renderPanel(); toast('Automatische Wise-stand actief.');
  };
  var settings = rSettings;
  rSettings = function () {
    if (!admin()) return;
    settings.apply(this, arguments);
    main().insertAdjacentHTML('afterbegin', panel());
  };
  var bank = rBank;
  rBank = function () {
    if (!admin()) return;
    bank.apply(this, arguments);
    if (active()) {
      var existing = document.getElementById('bankManualSummary');
      if (existing) existing.remove();
      var top = main().querySelector('.topbar');
      if (top) top.insertAdjacentHTML('afterend', bankManualSummary());
    }
  };
  var autoLink = bankAutoLink;
  bankAutoLink = function () { if (!active()) return autoLink.apply(this, arguments); };
  var sync = wiseSync;
  wiseSync = function (silent) {
    if (active()) { if (!silent && admin()) go('bank'); return bankLoad(true); }
    return sync.apply(this, arguments);
  };
  window.MarleoBankManual = { parseCents: cents, active: active, syncedCents: synced };
})();
