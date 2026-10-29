# Marleo AI positioning

AI systems and automation lead the public website; all existing services and customer portfolio routes remain available. English is canonical at `/`; the Dutch homepage moves to `/nl/`. Existing Dutch service URLs stay unchanged, as do `/en/<service>/` and `/fr/<service>/`. `/en/` remains an English entry with canonical `/`. Appointment links carry explicit language parameters. Shared standalone-page translations default to English when no explicit or stored preference exists.

The interactive workflow module is an illustrative client-side simulation. It does not invoke AI, read customer information or take external actions. Existing performance claims were removed from the homepage. Custom AI projects are scoped separately from managed workstation packages. No invented customer results, team size or offices were added.

Source: `src/site/positioning.py`, integrated into `src/site/build.py`. Rebuild with `python src/site/build.py`. Generated language pages, sitemap, `assets/ai-positioning.css`, `assets/ai-demo.js` and `i18n.js` belong to the same release.

Validation completed: Python compilation/build, JS syntax, H1/canonical/language and local destination checks across 19 key pages, and workflow execution/switch cancellation for all three languages in a DOM harness. Browser rendering and real mobile interaction still require review; Chromium could not be downloaded in the execution environment. No live form submissions performed.

This branch excludes the separate, unfinished Peppol work. It has not been pushed or published. GitHub account access is needed to publish through the existing workflow.

## Brand restoration and release checks

The homepage uses the original dark Marleo palette, oversized gradient wordmark and orb. Pointer effects are scoped to the hero, stop when the page is hidden and respect reduced motion. All sections remain dark, with white text and restrained brand accents. Homepage content is visible without scroll animations. The compact service grouping and English-first routes remain.

The existing HQ files are byte-for-byte identical to main; the public footer now includes /hq/. Public lead and booking routes still use the existing Supabase project and payload fields. Read-only checks confirmed cloud collections and the expected lead/booking columns. Live booking availability and empty-contact validation were checked without creating records or notifications. Browsers on a new Netlify hostname require a fresh HQ login; existing cloud data stays in the existing project. Peppol remains separate unfinished work and is not included in this website release.

A language-index bug in project details and website-audit checks was fixed: their source tuples remain NL/EN/FR even though English is now the primary navigation language. Dropdown state and mobile dialog focus handling were improved. The contact handler checks HTTP status and catches failures.

Validation: check_site.py checks 101 public/HQ pages, relative destinations, anchors, inline/external script syntax, main homepage languages, service links and HQ byte equality. Additional DOM and browser checks cover contact payloads, menus, desktop/mobile overflow, header motion, workflow demos, contact success/failure and reduced motion. No real contact lead, booking, email or WhatsApp message was sent. No live HQ authenticated workflow or production delivery test was performed.

## Public solutions and intake release

Added seven public pages in EN/NL/FR: solutions index, document processing, customer support, sales operations, a functional document extraction demo, security/deployment and a project brief form. The demo uses browser-side rules and explicitly identifies that it has no connected AI model. It handles only the displayed sample format, never invents missing fields and renders user input with textContent. No uploaded documents or external model keys are used.

The project brief posts the existing `aanvraag` contract: name/company/email/phone plus a structured message with project type, tools, timing and budget, source `project-intake`. The existing HQ import reads these records from web_leads into the pipeline. Successful responses reset the form; failed requests preserve the input. Tests use intercepted requests, not real submissions.

All public links to /hq/ were removed. The existing authenticated HQ route and files remain available and unchanged. A two-page English company profile is bundled at /assets/marleo-company-profile.pdf. Selected-work context was added for TrustTap and Pain du Mie based on existing delivered web/software references, without fabricated AI metrics.

Validation: 122 public/HQ pages pass local destination, anchor, language and syntax checks; four document-parser tests pass; all three existing workflow simulations pass; browser checks pass on 21 new mobile pages and desktop/mobile demo/intake views, including extraction, safe rendering, project payloads and request failure handling. PDF pages were rendered and inspected. No live leads, bookings or messages were created. No backend changes were deployed.

## Operations-led website and enterprise HQ

The homepage now leads with an original department selector (documents, sales, support, technical operations), a custom-engineering section and the existing Marleo wordmark/orb. All existing services and intake routes remain. Technical operations has a dedicated solution page in EN/NL/FR. The public workspaces are explicitly fictional illustrations, not the private HQ or claimed live client systems.

The private HQ gains an isolated `enterprise.js` / `enterprise.css` extension and a new `Enterprise & AI` menu group. Eight preparation areas cover AI workflows, technical knowledge, cybersecurity discovery, incident preparation, cloud/M365, integrations, industrial IT/OT discovery and digital platforms. Users can record their own capability status and partners; templates are not certifications or guarantees of execution capability. Reference links point to NIST, OWASP, Microsoft and W3C materials. The OT preparation explicitly keeps technical actions subject to the relevant owner and specialist.

New project records use `DATA.enterpriseProjects` and capability notes use `DATA.enterpriseSkills`. They flow through the existing `saveData` / generic `crm_state` collection sync and owner RLS. No database migration or live writes were performed. SQL inspection confirmed the existing authenticated ownership policy. Answers, gates, client/deal references, next steps and estimates are user-entered. Full cloud round-trip with an authenticated live user has not been tested; local persistence and the cloud collection contract have been checked.

Explicit buttons create a linked pipeline deal and four preparation tasks; both avoid duplicates. Customer conversion for enterprise deals uses an enterprise-specific editable invoice line with price zero, rather than the legacy website-package line or unconfirmed estimate. Project briefs and blank preparation guides download as Markdown. No documents are sent to anyone automatically. Public pages remain free of HQ links; users access their existing /hq/ address directly.

Validation: 125 public/HQ pages pass destination, anchor and syntax checks. Public selector controls pass browser tests across three languages and 1440/390/320px widths, including keyboard navigation and technical-operation links. The HQ was tested in an isolated local browser with synthetic data: creation, answers and checklist persistence, customer association, task/deal deduplication, invoice preparation, export, templates, partner recording, mobile rendering and client-view guard. No live customer records, emails or appointments were created. An unrelated modified social screenshot was left untouched and excluded from this release.
