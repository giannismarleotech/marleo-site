# Website inventory, direct HQ access and company selection

## Existing websites

`hq/website-catalog.json` contains 20 discovered websites/projects: the 13 existing portfolio entries, Air Masters, AB Firestop, OVH Construct, De Frietkazerne, FER Construction, Marleo and Fluppy Bird. Sources are the repository portfolio, project dossiers, known client URLs and accessible GitHub repositories. This is a discovered inventory, not a claim that every possible historical project has been found.

One bounded HTTPS page check was made per URL. Eighteen returned 200; HC by Abdo returned 403 and Rani Poetsservice returned 503. The UI labels these as checks requiring attention, not proven outages. It records the check date and uses existing portfolio images. Missing previews show a labelled project panel, never fabricated website imagery.

The full inventory is directly accessible through Mijn websites, with search/type filters, existing links, optional management links, inline editing and reversible hiding. A summary is on Control Center. Seed data is public portfolio information; management links/notes and manual additions use owner-scoped existing HQ cloud collections (`websiteOverrides`, `managedWebsites`). No CRM customers or financial records are created or changed. No passwords/API keys are stored by this feature.

## Direct layout

Navigation groups now show their links without disclosure controls. Twelve frequent modules also have direct dashboard buttons. The search form, currently selected job, timeline, results and drafts are on the page. Selecting historical work changes the inline result area rather than opening a modal. Website editing is also inline. Existing invoice/customer editing flows are outside this change.

## Company research quality

The previous search endpoint displayed unqualified web results. Read-only inspection of the user's latest Brussels round confirmed pages from BECI, software.brussels and the regional government, along with real companies. Those were not a suitable prospect list.

A new search now:

1. Interprets general production requests as industrial manufacturing, unless film/media is explicitly requested.
2. Makes one fixed basic Tavily query and caps the initial pool. It excludes known media/social/directory/government domains and list-style results before reading company sites.
3. Reads up to six public company pages, plus at most one discovered same-origin contact/about link per company, with three bounded readers in parallel. HTTPS, resolved public IPs, redirects, content type, body size and six-second request limits are checked. No auth headers are forwarded. Footer location data is retained.
4. Asks Gemini for at most four actual operating company candidates with company identity, official-site/sector/region classification and literal activity/location evidence. Industrial searches reject film studio results. Buying intent, budget and a need for AI are never assumed.
5. Validates the model's source IDs, exact company-name occurrence and quoted activity/location text against the fetched sources. A source must have been read; matching one requested city or the full requested region is required. For example West-Vlaanderen does not satisfy Oost-Vlaanderen. Failed or unknown matches are not used to fill a list.
6. Shows only `company_candidate` results, including fit rationale, public evidence and a labelled possible process hypothesis. Old raw search results are not promoted into company cards. Raw source pools remain saved for diagnostics or explicit resume, not presented as qualified prospects.

This is source-based candidate selection, not independent company-register validation or a guarantee of fit/interest. A result may be empty. External site blocking, model capacity, free quota and the function's execution limit can interrupt the job. Failures never fall back to random web results.

## Resume and provider failures

An explicit resume request reads the failed/stopped original job under the owner's JWT. It reuses finished outputs and only executes missing workflow roles. Search resume can reuse saved source pages instead of charging another Tavily query. A running role may make one bounded retry on Google's explicit MODEL_BUSY response, only within the remaining job budget; there is no model upgrade or startup inference. Timeout failures keep earlier work. The whole provider budget is 125 seconds under the free worker's 150-second ceiling.

Assistant prompts now request a company briefing, a concrete bounded AI/CRM pilot, specific contact preparation and a practical follow-up plan. Observed facts, hypotheses and unknowns must remain separate. Richer outputs are capped at 4096 tokens.

## Checks

- Core/provider/job/company-selection/catalog tests, including the actual bad-result domain categories from the Brussels round, rejected fabricated quotes/location mismatches, reader redirect/private-IP guards, source-bounded JSON selection and resume of only missing roles.
- Dossier and Control Center UI harnesses, plus website UI harness covering 20 projects, inline editing, private overrides, reversible hiding and manual additions.
- Browser preview with clearly labelled synthetic data: direct menu links and inline search/results, 20-project inventory, real existing thumbnail assets and desktop/mobile layout. No real generation/search is simulated as a live provider test.
- No new paid plan, messages or campaign sends. Real authenticated provider throughput remains subject to Google/Tavily availability and quotas.
