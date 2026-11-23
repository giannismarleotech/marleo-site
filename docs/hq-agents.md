# Marleo Cloud Agents & verkoop

Owner-only HQ workspace for larger AI/CRM sales preparation. Browser UI invokes Supabase Edge Functions; Gemini inference runs in the cloud. No local model, model download, WebGPU, ONNX runtime, paid model fallback or email sending is included.

## Workflow

1. HQ → Agents & verkoop → Dossier toevoegen. Optionally copy an existing CRM fiche or pipeline record. Copying a customer fiche defaults to Prospect; it does not confirm a paying relationship. Set the actual status, e.g. E-mail gestuurd, separately from Reactie ontvangen.
2. Add confirmed facts, contact notes, next action/date and public source text. Public HTTPS pages can be fetched through the owner-only source reader; manual pasting remains available if the source cannot be read.
3. Click Cloudverbinding testen. The server verifies the signed-in owner, key configuration and Gemini model availability. This is not a guarantee that generation quota remains available. Requests are capped and provider quota errors are shown clearly.
4. Run one assistant or all four sequentially: source-based company summary, possible AI/CRM use case, contact draft and next-step preparation. Review/edit outputs in HQ. Facts must be checked; model suggestions and interest/budget remain hypotheses unless explicitly confirmed.
5. Explicitly create an HQ follow-up task or pipeline entry. Open tasks deduplicate by dossier/date; new deals use value zero. Nothing sends a message, creates a customer automatically or changes invoice/revenue figures.

There is no autonomous discovery of new companies, scheduled background campaign or guarantee of sales. Runs are requested from the open page; inference is server-side. Responses are saved through existing HQ cloud sync when returned. Closing the page before a response is saved may discard that result. The four roles use one cloud model, not four independent services.

## Cloud configuration and costs

- Project secret: GEMINI_API_KEY. It never appears in frontend code or responses.
- Default model: gemini-3.1-flash-lite. Optional MARLEO_AGENT_MODEL accepts only this model or gemini-3.5-flash-lite. Both have documented free-tier text access at release time; actual eligibility/quotas are project-specific. There is no automatic model switch or quota retry.
- The user requested no new spending. Use an eligible Free Tier project without an attached billing account. A key cannot prove its billing tier to this app; if its Google project is upgraded, Google can charge for requests. HQ does not activate billing or buy credits.
- The user confirmed the currently configured key belongs to Tier 1. A live deployment smoke test of model availability returned HTTP 402 RESOURCE_EXHAUSTED. No successful generation is claimed. The user must replace it with a working Free Tier project key (or explicitly choose a different budget later). Do not add paid credit automatically.
- 402, 429, missing key, inaccessible model, timeout, empty/blocked/truncated output are visible failures, never simulated success or paid fallback.

Only the selected dossier's bounded facts, notes, sources and previous research draft are submitted to Google. Private contact fields, invoices and full CRM data are not automatically included. Avoid confidential or personal data in these fields; free-tier data terms apply. Data and drafts reuse the existing owner-scoped HQ collection sync/RLS. No schema changes or production CRM records were created during this work.

## Security and persistence

Both endpoints retain gateway JWT verification and independently check the Marleo owner via Auth.getUser; frontend role checks are not the authorization boundary. The auth client uses the built-in anon key, not service-role database authority. Gemini model/endpoint/tools are fixed server-side. Source text is untrusted; no model execution tool, email action or database tool is exposed.

Source reader validates public HTTPS names, resolved IPs and redirects, bounds size/time and strips markup. It cannot promise prevention of every DNS rebinding case; it forwards no credentials and has no private file access. Authenticated production fetch was not verified; unit tests cover safe success and failure paths. Manual source text is supported.

DATA.agentWorkspaces contains dossiers, source excerpts, output origin/model/time/fingerprint/review state and follow-up fields. Generation re-fetches the current record and rejects changed source fingerprints before saving. Logout/cancellation suppress late writes. Edits are disabled during a run. Cancellation stops subsequent roles and discards the current response; an already dispatched cloud request may finish and count against quota. Concurrent calls and bursts are guarded per function instance; this is not a global billing cap.

The browser and server grounding helpers are intentionally copied for the function deployment package; a test asserts byte-for-byte equality.

## Validation

- node --test tests/hq-agents.test.mjs tests/hq-agents-cloud.test.mjs: 17 cases for grounding, snapshots, contact status, output errors, task semantics, owner authorization, bounded request data, provider protocol, no tools/fallback, source URL/DNS/redirect/body guards.
- HQ_JSDOM_MODULE=/path/to/jsdom node tests/hq-agents-ui.cjs: actual HQ module with a simulated server adapter; dossier/source saves, explicit prospect/contact state, four sequential calls, human review, linked task/pipeline deduplication, cancellation/logout and owner controls. No real provider call in this harness.
- Deployment-only synthetic smoke code was used to check the live secret/provider from Supabase without reading private CRM data or exposing the key. It returned 402 before generation. Smoke code is removed from the production entrypoint.
- The public function endpoint rejects an anon caller with 401. Gateway JWT verification remains enabled.
- Browser QA of the updated feature was unavailable: another preview occupied the managed preview and the test path returned 404. No unrelated preview was stopped. The live HQ login page remains reachable. Authenticated end-to-end generation and cross-device saves are not claimed as verified.

References:
- https://ai.google.dev/api/generate-content
- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/gemini-api/docs/billing
- https://supabase.com/docs/guides/functions/auth
