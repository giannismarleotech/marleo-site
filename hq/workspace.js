/* Shared navigation, mobile tables and dialog behavior for Marleo HQ. */
const app = document.getElementById('appView');
const content = document.getElementById('mainArea');
const sidebar = document.getElementById('sidebar');
const nav = document.getElementById('mnav');
const scrim = document.getElementById('sbBack');
const backdrop = document.getElementById('mBackdrop');
const dialog = document.getElementById('mBox');
const mobile = matchMedia('(max-width: 860px)');

const style = document.createElement('link');
style.rel = 'stylesheet';
style.href = new URL('./workspace.css', import.meta.url).href;
document.head.append(style);

const header = document.createElement('header');
header.id = 'hqMobileHeader';
header.innerHTML = '<span class="hq-wordmark gtext">Marleo HQ</span><button type="button" class="btn subtle sm">Zoeken</button>';
app.prepend(header);
const search = header.querySelector('button');
const openSearch = window.gSearchOpen;
window.gSearchOpen = function () {
  if (SESSION?.role === 'admin') return openSearch.apply(this, arguments);
};
search.addEventListener('click', () => window.gSearchOpen());

nav.setAttribute('aria-label', 'Hoofdnavigatie');
const menu = nav.querySelector('[data-v="more"]');
menu.setAttribute('aria-controls', sidebar.id);
for (const [view, label, icon] of MENU_CLIENT) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.v = view;
  button.dataset.portal = '';
  button.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' + icon + '</svg>' + label;
  nav.insertBefore(button, menu);
}

function refreshNavigation() {
  const admin = SESSION?.role === 'admin';
  const opened = sidebar.classList.contains('open');
  const inApp = app.classList.contains('active');
  sidebar.inert = mobile.matches && !opened;
  nav.hidden = !inApp;
  search.hidden = !admin;
  for (const button of nav.querySelectorAll('button')) {
    const isMenu = button === menu;
    const active = isMenu ? opened : button.dataset.v === VIEW;
    button.hidden = !isMenu && (admin === button.hasAttribute('data-portal'));
    if (isMenu) button.setAttribute('aria-expanded', String(opened));
    else if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }
}
const navigationObserver = new MutationObserver(refreshNavigation);
navigationObserver.observe(app, {attributes: true, attributeFilter: ['class']});
navigationObserver.observe(sidebar, {attributes: true, attributeFilter: ['class']});
navigationObserver.observe(nav, {subtree: true, attributes: true, attributeFilter: ['class']});
mobile.addEventListener('change', refreshNavigation);
refreshNavigation();

function prepareTables() {
  for (const table of content.querySelectorAll('table')) {
    const rows = [...table.querySelectorAll('tbody > tr')];
    const labels = [...table.querySelectorAll('thead th')].map(cell => cell.textContent.trim());
    const wrapper = table.parentElement;
    if (wrapper.childElementCount === 1) wrapper.classList.add('hq-scroll-table');
    if (labels.length < 7 || !rows.some(row => row.getAttribute('onclick')?.startsWith('vInvoice('))) continue;
    table.classList.add('hq-invoice-table');
    for (const row of rows) {
      if (row.cells.length !== labels.length || row.hasAttribute('data-hq-ready')) continue;
      row.dataset.hqReady = '';
      row.tabIndex = 0;
      row.addEventListener('keydown', event => {
        if (event.target !== row || (event.key !== 'Enter' && event.key !== ' ')) return;
        event.preventDefault();
        row.click();
      });
      [...row.cells].forEach((cell, index) => {
        if (labels[index]) cell.dataset.hqColumn = labels[index];
      });
    }
  }
  const invoiceSearch = document.getElementById('invSearch');
  if (invoiceSearch) invoiceSearch.setAttribute('aria-label', 'Zoek op factuurnummer of klant');
}
new MutationObserver(prepareTables).observe(content, {childList: true});
prepareTables();

dialog.setAttribute('role', 'dialog');
dialog.setAttribute('aria-modal', 'true');
dialog.setAttribute('aria-labelledby', 'mTitle');
const close = dialog.querySelector('.modal-close');
close.setAttribute('aria-label', 'Venster sluiten');
let opener;
new MutationObserver(() => {
  const open = backdrop.classList.contains('open');
  document.body.classList.toggle('hq-dialog-open', open);
  if (open) {
    if (!dialog.contains(document.activeElement)) {
      opener = document.activeElement;
      close.focus({preventScroll: true});
    }
  } else {
    if (opener?.isConnected) opener.focus({preventScroll: true});
    opener = null;
  }
}).observe(backdrop, {attributes: true, attributeFilter: ['class']});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && sidebar.classList.contains('open') && mobile.matches && !backdrop.classList.contains('open')) {
    event.stopPropagation();
    scrim.click();
    menu.focus();
    return;
  }
  if (event.key !== 'Tab' || !backdrop.classList.contains('open')) return;
  const items = [...dialog.querySelectorAll('button, a[href], input, select, textarea, [tabindex]')]
    .filter(item => !item.disabled && item.tabIndex >= 0 && item.getClientRects().length);
  const first = items[0];
  const last = items.at(-1);
  if (!first) return;
  if (!dialog.contains(document.activeElement) || (event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  }
}, true);
