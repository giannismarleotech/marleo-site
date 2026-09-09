---
version: 1.1
name: Marleo-design
description: Marleo.tech design system — dark cinematic tech-editorial. De basis is een diep near-black canvas (`#120d12`) met wit type; witte editorial banden alleen in specifieke contexten (pricing, docs). De merksignatuur is de **oranje→magenta gradient** (`#ff8a2b` → `#ff2a86`), die het logo, primaire CTA's, key metrics en de gloed in hero-beelden aandrijft. Het dienstenaanbod loopt van managed IT tot **AI-infrastructuur** (compute, data, private modellen, governance); de site is drietalig NL · EN · FR — nooit als grote vlakke achtergrond. Type is **Inter** op bescheiden gewichten (display 500, body 400). Spacing volgt een expliciete 8px token-ladder (`xxxs` 4px t/m `super` 128px). Sterkste visuele signatuur: full-bleed donkere hero met hexagon-outlines, node-netwerk-textuur en warme gradient-gloed vanaf de randen.

colors:
  primary: "#ff2a86"
  primary-warm: "#ff8a2b"
  primary-active: "#d61a6c"
  primary-hover: "#b31459"
  ink: "#ffffff"
  body: "#a3a0a6"
  body-strong: "#ffffff"
  body-on-light: "#120d12"
  muted: "#6e6a72"
  muted-soft: "#8f8b93"
  hairline: "#2e2530"
  hairline-accent: "#4a2338"
  hairline-on-light: "#d6d2d8"
  hairline-soft: "#ebe9ec"
  canvas: "#120d12"
  canvas-elevated: "#1e1720"
  canvas-deep: "#0a070a"
  canvas-light: "#ffffff"
  surface-card: "#1e1720"
  surface-soft-light: "#f8f6f8"
  surface-strong-light: "#ebe9ec"
  on-primary: "#ffffff"
  on-dark: "#ffffff"
  on-light: "#120d12"
  semantic-info: "#4c98b9"
  semantic-success: "#12a05c"
  semantic-warning: "#ff8a2b"

gradients:
  brand: "linear-gradient(90deg, #ff8a2b 0%, #ff2a86 100%)"
  brand-diagonal: "linear-gradient(135deg, #ff8a2b 0%, #ff2a86 100%)"
  hero-glow-left: "radial-gradient(60% 90% at 0% 40%, rgba(255,138,43,0.18) 0%, transparent 70%)"
  hero-glow-right: "radial-gradient(55% 90% at 100% 30%, rgba(255,42,134,0.22) 0%, transparent 70%)"
  band-fade: "linear-gradient(180deg, #1e1720 0%, #0a070a 100%)"
  hairline-brand: "linear-gradient(90deg, #ff8a2b, #ff2a86)"

typography:
  display-mega:
    fontFamily: "'Inter', -apple-system, system-ui, sans-serif"
    fontSize: 80px
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: -1.6px
  display-xl:
    fontFamily: "'Inter', sans-serif"
    fontSize: 56px
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: -1.12px
  display-lg:
    fontFamily: "'Inter', sans-serif"
    fontSize: 36px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: -0.36px
  display-md:
    fontFamily: "'Inter', sans-serif"
    fontSize: 26px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: 0
  logotype:
    fontFamily: "'Inter', sans-serif"
    fontSize: 56px
    fontWeight: 600
    lineHeight: 1.0
    letterSpacing: -1.5px
  title-md:
    fontFamily: "'Inter', sans-serif"
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0
  title-sm:
    fontFamily: "'Inter', sans-serif"
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  body-md:
    fontFamily: "'Inter', sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-sm:
    fontFamily: "'Inter', sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  caption:
    fontFamily: "'Inter', sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  caption-uppercase:
    fontFamily: "'Inter', sans-serif"
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 1.1px
    textTransform: uppercase
  button:
    fontFamily: "'Inter', sans-serif"
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.0
    letterSpacing: 1.4px
    textTransform: uppercase
  nav-link:
    fontFamily: "'Inter', sans-serif"
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0.65px
    textTransform: uppercase
  number-display:
    fontFamily: "'Inter', sans-serif"
    fontSize: 80px
    fontWeight: 700
    lineHeight: 1.0
    letterSpacing: -1.6px

rounded:
  none: 0px
  xs: 2px
  sm: 4px
  md: 6px
  lg: 8px
  xl: 12px
  full: 9999px

spacing:
  xxxs: 4px
  xxs: 8px
  xs: 16px
  sm: 24px
  md: 32px
  lg: 48px
  xl: 64px
  xxl: 96px
  super: 128px

components:
  top-nav-on-dark:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    borderBottom: "1px solid {colors.hairline}"
    height: 64px
  top-nav-on-light:
    backgroundColor: "{colors.canvas-light}"
    textColor: "{colors.body-on-light}"
    typography: "{typography.nav-link}"
    height: 64px
  button-primary:
    background: "{gradients.brand}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: 14px 32px
    height: 48px
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
  button-outline-on-dark:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline-accent}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: 13px 31px
    height: 48px
  button-outline-on-light:
    backgroundColor: transparent
    textColor: "{colors.body-on-light}"
    border: "1px solid {colors.hairline-on-light}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: 13px 31px
    height: 48px
  button-tertiary-text:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.button}"
  hero-band-cinema:
    backgroundColor: "{colors.canvas}"
    backgroundImage: "{gradients.hero-glow-left}, {gradients.hero-glow-right}"
    textColor: "{colors.ink}"
    typography: "{typography.display-mega}"
    padding: 128px 48px
  hero-band-light:
    backgroundColor: "{colors.canvas-light}"
    textColor: "{colors.body-on-light}"
    typography: "{typography.display-xl}"
    padding: 96px
  logo-lockup:
    background: "{gradients.brand}"
    textColor: transparent
    typography: "{typography.logotype}"
    note: "hexagon-mark in gradient-stroke + gradient-clipped wordmark"
  feature-card-dark:
    backgroundColor: "{colors.canvas-elevated}"
    border: "1px solid {colors.hairline}"
    textColor: "{colors.ink}"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  feature-card-photo:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: 0
  feature-card-light:
    backgroundColor: "{colors.canvas-light}"
    border: "1px solid {colors.hairline-on-light}"
    textColor: "{colors.body-on-light}"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  accent-rule:
    background: "{gradients.hairline-brand}"
    height: 3px
    width: 64px
    rounded: "{rounded.full}"
  language-picker:
    backgroundColor: transparent
    border: "1px solid {colors.hairline}"
    textColor: "{colors.body}"
    activeBackground: "{gradients.brand}"
    activeTextColor: "{colors.on-primary}"
    typography: "{typography.caption-uppercase}"
    rounded: "{rounded.full}"
    padding: 3px
    itemPadding: 5px 11px
  ai-split-band:
    backgroundColor: "{colors.canvas}"
    backgroundImage: "radial-gradient(70% 120% at 50% 0%, rgba(255,42,134,0.10) 0%, transparent 65%)"
    textColor: "{colors.ink}"
    typography: "{typography.display-xl}"
    padding: 96px 48px
  pillar-row:
    backgroundColor: "{colors.canvas-elevated}"
    border: "1px solid {colors.hairline}"
    textColor: "{colors.ink}"
    typography: "{typography.title-sm}"
    rounded: "{rounded.lg}"
    padding: 24px
  service-tag-row:
    backgroundColor: transparent
    textColor: "{colors.body}"
    typography: "{typography.title-sm}"
    separator: "· in {colors.muted}"
    gap: "{spacing.xs}"
  listing-card-light:
    backgroundColor: "{colors.canvas-light}"
    textColor: "{colors.body-on-light}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 24px
  metric-cell:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.number-display}"
    padding: 24px 0
  metric-cell-accent:
    background: "{gradients.brand}"
    textColor: transparent
    typography: "{typography.number-display}"
    note: "gradient-clipped cijfer"
  list-row:
    backgroundColor: transparent
    borderBottom: "1px solid {colors.hairline}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    padding: 16px 0
  profile-card:
    backgroundColor: "{colors.canvas-elevated}"
    border: "1px solid {colors.hairline}"
    textColor: "{colors.ink}"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: 24px
  text-input-on-dark:
    backgroundColor: "{colors.canvas-deep}"
    border: "1px solid {colors.hairline}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: 14px 16px
    height: 48px
  text-input-on-light:
    backgroundColor: "{colors.canvas-light}"
    border: "1px solid {colors.hairline-on-light}"
    textColor: "{colors.body-on-light}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: 14px 16px
    height: 48px
  badge-pill:
    backgroundColor: "{colors.canvas-elevated}"
    border: "1px solid {colors.hairline-accent}"
    textColor: "{colors.ink}"
    typography: "{typography.caption-uppercase}"
    rounded: "{rounded.full}"
    padding: 4px 12px
  cta-band-dark:
    backgroundColor: "{colors.canvas}"
    backgroundImage: "{gradients.hero-glow-right}"
    textColor: "{colors.ink}"
    typography: "{typography.display-lg}"
    padding: 96px
  newsletter-input-band:
    backgroundColor: "{colors.canvas-elevated}"
    border: "1px solid {colors.hairline}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  footer-dark:
    backgroundColor: "{colors.canvas-deep}"
    borderTop: "1px solid {colors.hairline}"
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
    padding: 64px 48px
  footer-link:
    backgroundColor: transparent
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
---

## Overview

Marleo.tech leest als dark tech-editorial: een diep near-black canvas (`{colors.canvas}` — #120d12) met wit type, waar warme gradient-gloed vanaf de randen naar binnen komt. Witte banden verschijnen alleen in editorial contexten (pricing, listings, docs).

De merksignatuur is de **oranje→magenta gradient** (`{gradients.brand}` — #ff8a2b → #ff2a86). Die gradient is het merk: het hexagon-logo, het wordmark, primaire CTA's, accent-hairlines en key metrics. Hij wordt nooit als grote vlakke achtergrond gebruikt — altijd als lijn, tekst-clip, knopvlak of zachte gloed.

Type is **Inter** als enige familie op bescheiden gewichten — display 500, body 400. CTA-labels en nav in uppercase met ruime tracking (0.65–1.4px). Display-copy is nooit bold.

**Kernkenmerken:**
- Eén merkgradient: oranje → magenta. Geen tweede verzadigde kleur.
- Diep near-black canvas (#120d12) met warme ondertoon — nooit puur zwart, nooit koel grijs.
- Gloed als diepte: radiale glows links/rechts in hero's, geen zware schaduwen.
- Geometrische achtergrond-textuur: hexagon-outlines en node-netwerk op 6–12% opacity.
- Eén sans-familie: Inter; display blijft op gewicht 500.
- Zachte 4–8px hoeken (`{rounded.sm}` / `{rounded.lg}`); pill alleen voor badges en accent-rules.
- Expliciete 8px spacing-ladder (`xxxs` t/m `super`).

## Brand Gradient

| Token | Waarde | Gebruik |
|---|---|---|
| `{gradients.brand}` | `linear-gradient(90deg, #ff8a2b, #ff2a86)` | Wordmark, primaire CTA, metric-cijfers |
| `{gradients.brand-diagonal}` | 135° variant | Logo-hexagon stroke, iconen |
| `{gradients.hairline-brand}` | 90° 3px regel | Accent-rule onder/naast koppen |
| `{gradients.hero-glow-left}` | oranje radial 18% | Linker hero-gloed |
| `{gradients.hero-glow-right}` | magenta radial 22% | Rechter hero-gloed, pre-footer |
| `{gradients.band-fade}` | #1e1720 → #0a070a | Sectie-overgang naar footer |

**Regels:** gradient-op-tekst altijd via `background-clip: text` op koppen van ≥26px — nooit op body-tekst. Gradient-vlakken alleen op elementen kleiner dan een sectie (knop, badge-rand, rule, icoon). Losse `{colors.primary-warm}` (oranje) alleen als solide kleur wanneer een gradient technisch niet kan.

## Spacing & Layout

### Spacing-systeem
- **Basiseenheid:** 4px.
- **Tokens:** `{spacing.xxxs}` 4px · `{spacing.xxs}` 8px · `{spacing.xs}` 16px · `{spacing.sm}` 24px · `{spacing.md}` 32px · `{spacing.lg}` 48px · `{spacing.xl}` 64px · `{spacing.xxl}` 96px · `{spacing.super}` 128px.
- **Sectie-padding:** `{spacing.xxl}` (96px) voor grote banden; `{spacing.super}` (128px) voor hero-diepte.
- Gebruik de benoemde ladder — nooit ad-hoc px-waarden.

### Grid & Container
- Max contentbreedte: ~1280px op editorial banden. Hero-gloed en textuur gaan full-bleed.
- Editorial body: 12-koloms grid.
- Card-grids: 2-up voor hero-splits, 3-up voor service-grids, 4-up voor listing-tegels.
- Footer: 5 kolommen op desktop.

### Witruimte-filosofie
Genereuze pacing in donkere banden; de gloed heeft ruimte nodig om te werken. Body-secties zitten strakker eronder. Witte editorial banden zijn dichter gezet dan de donkere banden.

### Achtergrond-textuur
- Hexagon-outlines: 1–2px stroke in `{colors.hairline-accent}`, 8–12% opacity, gedeeltelijk buiten de rand gecropt.
- Node-netwerk (punten + dunne lijnen): `{colors.primary-warm}` op 6–10% opacity, links en rechts, nooit achter body-tekst.
- Textuur ligt altijd onder de gloed en boven het canvas — nooit tussen tekst en achtergrond zonder contrastcheck.

### Responsive

| Naam | Breedte | Belangrijkste wijzigingen |
|---|---|---|
| Mobile | < 640px | Hero h1 80→32px; card-grid 1-up; hamburger-nav; één gloed i.p.v. twee; textuur op 50% dekking. |
| Tablet | 640–1024px | Hero h1 56px; card-grid 2-up. |
| Desktop | 1024–1280px | Volle hero h1 80px; card-grid 3-up; listings 4-up. |
| Wide | > 1280px | Body capt op 1280px; gloed en textuur blijven full-bleed. |

- Primaire CTA 48px hoog — WCAG AAA touch target.
- Nav klapt naar hamburger onder 768px.
- Card-grid: 4-up → 3-up → 2-up → 1-up.

## Elevation & Depth

Gloed + helderheidstrap in plaats van schaduwtiers.

| Niveau | Behandeling | Gebruik |
|---|---|---|
| Flat | `{colors.canvas}` (#120d12) | Body-banden |
| Deep | `{colors.canvas-deep}` (#0a070a) | Footer, inputs |
| Card | `{colors.canvas-elevated}` (#1e1720) + 1px `{colors.hairline}` | Feature-, profile-cards |
| Lichte band | `{colors.canvas-light}` | Listings, pricing |
| Gloed | `{gradients.hero-glow-left/right}` | Hero, pre-footer |
| Accent-rand | 1px `{colors.hairline-accent}` | Outline-CTA, badges |
| Soft drop | `0 8px 24px rgba(0,0,0,0.35)` | Hovered cards (enige tier) |

## Componenten

### Top Navigation
**`top-nav-on-dark`** — Standaard nav. Achtergrond `{colors.canvas}`, 1px `{colors.hairline}` onderrand, hoogte 64px. Logo-lockup links, horizontaal menu midden, primaire CTA rechts. Menu-items uppercase met 0.65px tracking.
**`top-nav-on-light`** — Witte variant voor lichte editorial banden.
**`language-picker`** — NL / EN / FR in één pill-container: 1px `{colors.hairline}` rand, `{rounded.full}`, 3px padding. De actieve taal krijgt `{gradients.brand}` als vulling met witte tekst; inactieve talen `{colors.body}` op transparant. Type `{typography.caption-uppercase}`. Staat altijd links van de primaire nav-CTA, ook mobiel (dan bovenaan het hamburger-paneel).

### Logo
**`logo-lockup`** — Hexagon-mark met `</>`-glyph in `{gradients.brand-diagonal}` stroke, naast het wordmark in `{typography.logotype}` met de gradient text-clipped. Minimale hoogte 32px; nooit op een lichte achtergrond zonder de solide-donkere variant.

### Buttons
**`button-primary`** — Gradient-CTA. `{gradients.brand}`, tekst `{colors.on-primary}`, type `{typography.button}` (14px / 700 / 1.4px tracking, uppercase), padding 14×32px, hoogte 48px, `{rounded.sm}`.
**`button-primary-active`** — Press state, solide `{colors.primary-active}`.
**`button-outline-on-dark`** — Transparant, 1px `{colors.hairline-accent}` rand.
**`button-outline-on-light`** — Transparant, 1px `{colors.hairline-on-light}` rand.
**`button-tertiary-text`** — Inline tekstlink in `{colors.primary}`, uppercase tracking.

### Hero Bands
**`hero-band-cinema`** — Donkere hero met dubbele gloed (`{gradients.hero-glow-left}` + `{gradients.hero-glow-right}`) en hexagon/node-textuur. Headline in `{typography.display-mega}` (80px / 500 / -1.6px), één sleutelwoord gradient-clipped. Onder de headline een `accent-rule` + `service-tag-row`. Eén primaire + één outline CTA. Padding 128×48px.
**`hero-band-light`** — Witte variant, padding 96px, geen gloed.

### Cards
**`feature-card-dark`** — Standaard service-card. `{colors.canvas-elevated}`, 1px `{colors.hairline}`, `{rounded.lg}`, padding 32px. Icoon in gradient-stroke boven, titel, body in `{colors.body}`.
**`feature-card-photo`** — Image-first card; beeld vult de top edge-to-edge, titel + body strak eronder.
**`feature-card-light`** — Witte variant voor lichte banden.
**`profile-card`** — Team-/profielkaart. `{colors.canvas-elevated}`, padding 24px. Portret + naam + rol + badge.
**`listing-card-light`** — Voor listing-grids (cases, producten). Wit, padding 24px, `{rounded.lg}`.

### Accent & Editorial
**`accent-rule`** — 3px × 64px gradient-regel, `{rounded.full}`. Zit links van of onder een kop als sectie-markering. Maximaal één per sectie.
**`service-tag-row`** — Horizontale rij diensten gescheiden door een `·` in `{colors.muted}`, tekst in `{colors.body}` met het kernwoord in `{colors.ink}` op gewicht 700. Flex met `{spacing.xs}` gap. Bevat altijd de vijf kerndiensten: Managed IT · AI-infrastructuur · Cloud · Security · Development.
**`ai-split-band`** — De AI-infrastructuur-sectie: 2-koloms split (1fr 1fr, 64px gap) met kop in `{typography.display-xl}` links en een stapel `pillar-row`-kaarten rechts. Zachte gloed van bovenaf (10% magenta) — lichter dan de hero, zodat de hero de sterkste band blijft.
**`pillar-row`** — Rij binnen `ai-split-band`: 44px gradient-clipped abbr-tegel links, titel + body rechts. `{colors.canvas-elevated}`, 1px `{colors.hairline}`, `{rounded.lg}`, padding 24px.
**`metric-cell`** — Key metric. Waarde in `{typography.number-display}` (80px / 700, wit), label eronder in `{typography.caption-uppercase}`.
**`metric-cell-accent`** — Zelfde geometrie, cijfer gradient-clipped. Max één per grid.
**`list-row`** — Hairline-gescheiden rij (changelog, SLA-tabel, agenda). Datum links, titel midden, status rechts. Padding 16px 0.

### Forms & Tags
**`text-input-on-dark`** — `{colors.canvas-deep}`, 1px `{colors.hairline}`, `{rounded.sm}`, padding 14×16px, hoogte 48px. Focus: 1px `{colors.primary}` rand + `0 0 0 3px rgba(255,42,134,0.2)`.
**`text-input-on-light`** — Witte variant.
**`badge-pill`** — Kleine uppercase pill. `{colors.canvas-elevated}`, 1px `{colors.hairline-accent}`, `{typography.caption-uppercase}`, `{rounded.full}`, padding 4×12px.

### Newsletter / CTA / Footer
**`newsletter-input-band`** — Signup-band. `{colors.canvas-elevated}`, `{rounded.lg}`, padding 32px, inline e-mailinput + gradient-CTA.
**`cta-band-dark`** — Pre-footer band met rechter gloed. Gecentreerde `{typography.display-lg}` headline, één gradient-CTA, 96px padding.
**`footer-dark`** — `{colors.canvas-deep}`, 1px `{colors.hairline}` bovenrand, tekst `{colors.body}`, 5-koloms linklijst, padding 64×48px.
**`footer-link`** — `{colors.body}`, `{typography.body-sm}`.

## Meertaligheid (NL · EN · FR)

De site is drietalig: **Nederlands** (default), **Engels** en **Frans**. Alle drie zijn volwaardig — geen enkele taal is een tweederangs vertaling.

- **URL-structuur:** taalprefix per pad (`/nl/…`, `/en/…`, `/fr/…`), met `hreflang`-tags en `x-default` naar `/nl/`.
- **Taalkeuze:** via `language-picker` in de nav; keuze persisteert per bezoeker. Nooit automatisch omschakelen op IP.
- **Copy-lengte:** Frans loopt 15–25% langer dan Nederlands, Engels 5–10% korter. Ontwerp koppen op de **Franse** lengte: `{typography.display-mega}` koppen max 15ch in NL, en het layoutgrid moet twee regels aankunnen zonder de gloed te verschuiven.
- **CTA-labels:** uppercase met 1.4px tracking in alle talen; Franse labels mogen tot 24 tekens — knoppen groeien in breedte, nooit in hoogte (48px blijft).
- **Getallen & valuta:** NL/FR `€ 29` met komma-decimaal (`99,9%`), EN `€ 29` met punt-decimaal (`99.9%`). Datums voluit per locale (28 aug 2026 / 28 Aug 2026 / 28 août 2026).
- **Diakrieten:** Inter dekt de Franse set; controleer dat `letter-spacing: -1.6px` op display accenten (é, à, ç) niet laat botsen met de regel erboven — verhoog `line-height` naar 1.1 bij Franse display-koppen.
- **Niet vertalen:** de merkclaim en productnamen (Managed IT, Managed+ AI, marleo.tech). Wel vertalen: alle overige nav-, dienst- en supportlabels.

## Do's en Don'ts

### Do
- Zet de gradient in op logo, primaire CTA, accent-rules, iconen en max één metric per grid.
- Gebruik gloed (radial gradients) als diepte, niet schaduw.
- Houd hexagon- en node-textuur onder 12% opacity en weg van body-tekst.
- CTA-labels uppercase met 1.4px tracking via `{typography.button}`.
- Gebruik de benoemde spacing-ladder, nooit ad-hoc px.
- Display-gewicht blijft 500 — één sleutelwoord mag gradient-clipped.

### Don't
- Geen tweede verzadigde merkkleur naast oranje/magenta.
- Geen gradient als volledige sectie-achtergrond of achter body-tekst.
- Geen gradient op tekst kleiner dan 26px — onleesbaar en vies bij subpixel-rendering.
- Geen puur zwart of koel grijs canvas — `{colors.canvas}` (#120d12) heeft warme ondertoon.
- Geen schaduwtiers — gloed + helderheidstrap dragen de diepte.
- Geen hex inline in ontwerpen — altijd `{token.refs}`.
- Textuur nooit zo zwaar dat contrast onder 4.5:1 zakt.

## Known Gaps

- Iconografie-set nog niet gedefinieerd (richting: 1.5px lijn-iconen in gradient-stroke).
- AI-infrastructuur-diagrammen (architectuurplaten) nog niet als component gedocumenteerd.
- Tone of voice niet opgenomen — "IT that just works" is de bekende claim-toon.
- Animatie-timings (gloed-parallax, gradient-shift op CTA) buiten scope.
- Form-validatiestates beyond focus beperkt gedocumenteerd.
- Exacte marleo.tech live-hexwaarden zijn afgeleid van het merkbanner-beeld; verifieer tegen de site-CSS bij implementatie.
