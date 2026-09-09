# marleo.tech

Drietalige bedrijfssite (NL · EN · FR) voor marleo.tech — IT-beheer, cloud, security, AI-infrastructuur, maatwerksoftware, webshops, websites, games en branding.

## Wat staat waar

- `index.html` — de volledige site als één zelfstandig bestand. Geen build, geen dependencies: openen = werkt.
- `CNAME` — custom domain voor GitHub Pages (marleo.tech).
- `.nojekyll` — schakelt Jekyll-verwerking uit op GitHub Pages.
- `src/` — bronbestanden waaruit `index.html` gebundeld is. Bewerk hier, niet in index.html.

## Publiceren op GitHub Pages

De bestaande `index.html` in de repo (oude PWA met push) wordt hierdoor vervangen.
`marleo-sw.js` en `push/OneSignalSDKWorker.js` laat je staan of verwijder je — de nieuwe site gebruikt ze niet.

1. Zet de inhoud van deze map in de root van `giannismarleotech/marleo-site` (branch `main`) en overschrijf `index.html`.
2. Repo → Settings → Pages → Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.
3. Custom domain: `marleo.tech` (het CNAME-bestand staat er al) → *Enforce HTTPS* aanzetten.

## DNS bij je registrar

| Type  | Naam | Waarde |
|-------|------|--------|
| A     | @    | 185.199.108.153 |
| A     | @    | 185.199.109.153 |
| A     | @    | 185.199.110.153 |
| A     | @    | 185.199.111.153 |
| CNAME | www  | giannismarleotech.github.io |

Certificaat is doorgaans binnen een uur actief; DNS-propagatie kan tot 24 uur duren.

## Pagina's

Home · Diensten · Managed IT · Cloud · Security · AI-infrastructuur · Development · Webshops · Websites · Games · Huisstijl & branding · Domeincheck · Projecten · Prijzen · Over ons · Contact

Routing gebeurt via de hash (`#/security`), dus GitHub Pages heeft geen rewrite-regels nodig.
