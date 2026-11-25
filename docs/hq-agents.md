## Update 25 November: company research, outreach and navigation

- Dossiers have an explicit official website. **Internetonderzoek starten** runs up to three fixed basic Tavily searches (official site, public LinkedIn company mentions, other company news/projects), reads the site and up to four same-domain pages. Search excerpts remain labelled unverified; no authenticated LinkedIn scraping or automatic identity confirmation.
- Sources persist in the job before AI generation. Failed AI runs can still have their research imported, and retry reuses acquired sources without new searches. Import requires the original dossier fingerprint to match. Website edits also invalidate prior drafts.
- Contact preparation produces three distinct service-specific email proposals. Only actual known business activity is used as fact; use cases are hypotheses. Open the chosen proposal, edit recipient/content and approve a schedule. The existing campaign queue sends it, adds unsubscribe handling and receives tracking events. No mail is queued merely by generating a draft. Double-clicks are blocked; a pending duplicate subject/recipient is rejected. Exact schedule is shown in Belgian time; manually entered date/time uses the device timezone with an explicit converted preview.
- Planning/open/click results appear in the dossier and existing email marketing screen. No measurement does not prove unread status.
- In-tab Back/Forward restores modules, company dossiers, common filters, scroll and nested dialogs. History stores only random entry IDs; dossier/form content stays in tab memory and clears on logout. Reloads do not retain unsaved forms.
- Node tests cover bounded search, partial failures/resume, domain redirects, mail variants/scheduling/double submit and Back/Forward with nested dialog handlers. UI/provider endpoints are simulated in tests; no real emails are sent.

> Latest workflow and UI changes: see [hq-websites-selection.md](hq-websites-selection.md).

# Marleo HQ: Control Center and cloud sales agents

The owner now lands in Control Center: a central workspace with actual job status, step history, source results, completed drafts and next actions. The shared HQ navigation pins Control Center, Agents, Customers and Invoices; other existing modules remain in visible groups. Customer portals and financial calculations are not replaced.

## Workflow

1. **Control Center → Zoekronde starten**: choose region, sector and optional search direction. The Lead Scout makes one bounded Tavily basic search. Results carry original URLs and snippets, are deduplicated per domain and remain unverified company sources, not confirmed leads, buying intent or customers.
2. **Dossier voorbereiden**: review/correct the company name. A new dossier defaults to Prospect / Nog te benaderen. The search excerpt is stored as an unverified source; it is not promoted to confirmed facts. Existing domain/name matches open the existing dossier.
3. **Agents & verkoop**: add confirmed facts, real contact notes, next action/date and public sources. An emailed company is distinct from a reply or a confirmed customer.
4. **Execute one assistant or all four**: research, possible AI/CRM application, contact draft and follow-up preparation. These explicitly start an owner-authorized cloud job. Track its real steps in Control Center. The browser does not run a local model or orchestrate the four calls.
5. **Review results**: completed outputs stay in the job. Explicitly import them into the original dossier. The source fingerprint must still match; changed dossiers are never silently overwritten. Individual results remain editable/reviewable in the dossier. Creating tasks or pipeline entries is also explicit; no messages are sent and new deals have value zero.

## Cloud execution and progress

`hq-agent-jobs` authenticates the owner, stores a job, then uses `EdgeRuntime.waitUntil` to execute it. Jobs persist in `public.hq_agent_jobs` under ownership RLS. The function's database client is scoped to the caller JWT, without service-role authority. Each completed step saves its output before the next step begins.

The unique partial index permits one active job per user; client request UUIDs prevent duplicate dispatch. Workflows run four roles sequentially. Cancellation stops later calls and discards a late current response; a dispatched provider request may still count against quota. Errors preserve finished outputs. There is no scheduled run, startup inference or paid model fallback. A MODEL_BUSY response may receive one bounded retry within an explicitly started job. The explicit retry button starts the failed step separately.

A provider budget of 125 seconds and per-request timeout stay below the free Edge worker's 150-second limit. A worker/platform termination can still interrupt a job; after three minutes without an update the next HQ read marks it interrupted rather than leaving a fake active indicator. The UI polls changed jobs every five seconds while work is active and less often while idle. Results remain accessible after the browser is closed/reopened, subject to successful server completion.

`hq-agent-run` remains the metadata/legacy direct-call endpoint. The connection button checks key/model availability only; it does not prove generation capacity. The UI now says this explicitly. Google errors include safe actionable details and codes. The reported 503 was confirmed by the user as Google model high demand, not a disconnected HQ session. Default model changed from Gemini 3.1 Flash-Lite to Gemini 3.5 Flash-Lite, both documented with free-tier text access at implementation time. Successful generation with the new default is not claimed without a real authenticated run.

## Configuration and spending

- `GEMINI_API_KEY`: use an eligible Google Free Tier project without attached billing. The user supplied a screenshot confirming the replacement project is Free Tier.
- Optional `MARLEO_AGENT_MODEL`: only `gemini-3.5-flash-lite` (default) or `gemini-3.1-flash-lite` are accepted.
- `TAVILY_API_KEY`: use Tavily's free Researcher plan with pay-as-you-go disabled. Basic search is fixed, maximum ten returned sources, no generated answer, crawl, extract, image search or auto-parameters. Tavily documents 1,000 free monthly credits and one credit per basic search. Live search remains blocked until the key is configured.
- Keys are read only in Supabase, never sent to HQ or saved in the repository. The app cannot infer account billing tier from the API key. Upgrading a provider project can make requests chargeable; HQ does not activate billing or buy credits.
- No AI calls run at server startup. A prior startup smoke proposal was rejected by automatic review because cold starts could repeat calls. That approach is not used here.

Only selected public business sources, bounded facts and contact notes are submitted to Gemini. Invoices and private customer/contact collections are not automatically included. Avoid personal/confidential information in source/notes fields. The system does not independently verify every model claim and does not guarantee sales or company suitability.

## Persistence and access

Job RLS permits authenticated users to read/create/update only rows with their own user ID. The Edge endpoint independently restricts execution to the Marleo owner; arbitrary inserted rows do not trigger an execution. Anonymous grants are revoked. There is no job delete endpoint or widened access to other CRM tables.

Dossiers and imported draft review states reuse the existing `DATA.agentWorkspaces` cloud collection and `crm_state` ownership RLS. `DATA.agentAppliedJobs` records explicit imports. The source reader retains JWT/owner checks, HTTPS/public DNS/redirect checks, bounded HTML/plain text extraction and a manual-paste fallback. Source text remains untrusted data, never instructions for extra tool access.

## Validation and limits

- 27 Node core/provider/job tests: grounding, actual contact state, source bounds, key handling, fixed provider protocol, quota failures, background progression, preserved partial results, cancellation, bounded search, domain deduplication, owner access, active-job locking and idempotency.
- Dossier jsdom test: CRM copy stays Prospect, source capture, explicit workflow dispatch, task/pipeline deduplication, logout and owner gate.
- Control Center jsdom test: default landing, grouped navigation, job rendering, explicit draft import, prospect-only source conversion and one search dispatch. Provider endpoints are simulated in these UI tests.
- SQL transaction with a rolled-back synthetic row verified owner visibility and non-owner isolation. RLS and grants inspected; security advisor reported no new job-table finding. Pre-existing project advisories are outside this change.
- Real browser desktop and 390px iframe QA used clearly labelled synthetic data and simulated endpoints; checked layout, search form, job timeline and importing results. No production job or customer data was seeded for the visual test.
- Live function endpoint rejects an anon JWT with 401. Gateway JWT verification stays enabled. The new job endpoint is deployed without startup model calls.
- Authenticated production generation and Tavily search require a real owner run; they are not represented by the synthetic preview. External capacity and free quotas remain provider limits.

References:
- https://supabase.com/docs/guides/functions/background-tasks
- https://supabase.com/docs/guides/functions/limits
- https://ai.google.dev/gemini-api/docs/pricing
- https://docs.tavily.com/documentation/api-credits
- https://docs.tavily.com/documentation/api-reference/endpoint/search
