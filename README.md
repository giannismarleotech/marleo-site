# Marleo.tech

Public multilingual company website for AI systems, custom CRM, software and IT services aimed at European organisations. The English homepage is canonical at `/`, Dutch at `/nl/`, and French at `/fr/`. Existing service addresses are retained; `/en/` is an English homepage alias with `/` as its canonical.

## Public website source

- `src/site/build.py`: static page generator, shared navigation, metadata, structured data, sitemap and robots rules.
- `src/site/europe.py`: European homepage positioning and custom CRM pages in EN/NL/FR.
- `assets/europe.css`: editorial Marleo visual system, responsive homepage and shared styling.
- `src/site/brand_assets.py`: exports the existing Marleo code-hexagon as SVG/ICO/PNG browser icons and the sharing image (requires Pillow).
- Existing service, knowledge and project content remains in `src/site/`. Website cases are displayed under Work (`/en/projecten/`, `/projecten/`, `/fr/projecten/`), not on the homepage.

Build from the repository root:

```sh
python src/site/brand_assets.py
python src/site/build.py
python tests/check_europe.py
python tests/check_site.py
```

Commit the source, assets and generated public HTML. GitHub Pages publishes `main` from the repository root using the existing `CNAME`. The generator preserves sitemap modification dates for unchanged pages.

## Private applications

`hq/`, `portaal/` and Supabase functions are separate applications. Public site builds must not modify their data, authentication or source. HQ and private portal routes are excluded from the public sitemap and from crawling.

## SEO scope

The site uses generic English, Dutch and French `hreflang` values plus English `x-default`. It does not use an unsupported `EU` language region or create artificial city/country doorway pages. European service positioning describes the intended market; it does not imply European offices, named enterprise customers or certifications. Search visibility and favicon updates depend on search engines recrawling the site.
