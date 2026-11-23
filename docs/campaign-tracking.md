# Campaign follow-up in Marleo HQ

HQ → Campagnes / E-mailmarketing shows campaign delivery and engagement totals. “Ontvangers en resultaten” opens recipient search, filters, first/last opening and click timestamps, event counts, event/link history and a CSV export of the current filter. It retains the existing campaign designer, scheduling, unsubscribe list and customer/prospect audiences. Loading pages through all queue rows avoids the previous silent 5,000-row cap. Errors are shown instead of appearing as an empty campaign list. Refreshes run while this page is visible and no modal is open.

Opens are pixel loads and clicks may include security scanner activity. They are labelled “Opening gemeten” and “Klik gemeten”, never proof that someone read a message. Missing measurements are unknown. Percentages use only recipients with confirmed delivery; missing historical events are never invented. Repeated events on the same recipient do not increase the recipient count. The CSV neutralizes spreadsheet formula prefixes.

## Deployment

1. Apply `supabase/campaign-tracking.sql`. It adds first/last-event support, a service-written/owner-readable event ledger and connection report. No email is sent by the migration.
2. Deploy `campaign-admin`. The migration places a fixed, one-time maintenance request in server-only config. Startup claims this atomically and attempts to inspect/enable open/click tracking and the existing Resend webhook. It never sends email. Provider keys, legacy tokens, endpoint query secrets and webhook signing secrets are never returned to browsers or written into this report. Anonymous requests are otherwise rejected. HQ’s “Koppeling controleren” action is an owner-only read of provider settings, not a send action.
3. Deploy `mailhook`. With a stored signing secret it verifies the exact raw Svix body, message ID and timestamp (five-minute tolerance). Until management access is available it preserves the existing legacy hook-token route and requires Svix’s stable message ID. Supplying a query token cannot bypass signature checks once a signing secret has been installed.
4. Deploy `mailer`. Its existing sending behaviour is retained; after saving a provider message ID it reconciles events that arrived before the send acknowledgement. Do not invoke the mailer just to test tracking: that may send scheduled mail.
5. Publish `hq/campaign-tracking.js`, its CSS and the enterprise loader. The loader waits for the existing audience/designer extension before installing the follow-up dashboard.

The database records each provider event ID once and applies it atomically. Counts survive webhook retries and out-of-order events, first/last times come from the provider event timestamp, delivery events can wait for the queue mapping, and bounces/complaints maintain the suppression list. Failed persistence returns 503 for provider retry. New tables use RLS with owner-only SELECT; browser roles cannot forge events or read webhook secrets. There are no IP/device/location fields in the event ledger.

## Live inspection on 23 November 2026

The stored campaign history contained one sent/provider-linked email, with no stored delivered/opened/clicked events. The legacy webhook did receive requests during the preceding day. These observations do not prove that the old campaign was unread.

The configured Resend API key can send but returned 403 for management inspection. The safe connection report therefore records tracking configuration as unknown; no management change was confirmed. The user’s Resend screenshot showed an unsubmitted custom tracking-domain setup with both options selected. Complete “Add domain”, the DNS record Resend supplies for `links.marleo.tech`, and Resend verification before treating new campaigns as fully configured. DNS for ordinary email does not need to be replaced. The user subsequently confirmed completing the setup step; provider-side verification was not independently readable with the current API key. The existing authenticated webhook remains in service.

## Validation

- `node --test tests/campaign-tracking.test.mjs`: signature integrity and expiry, provider configuration mocks, owner-only diagnostics, error propagation, recipient counts and CSV safety.
- `HQ_JSDOM_MODULE=/path/to/jsdom node tests/campaign-tracking-ui.cjs`: filters, timestamps, links, failed connections and pagination past 5,000 queue rows.
- `tests/campaign-tracking.sql`: real database checks for duplicate/out-of-order events, early webhook reconciliation and browser grants. All synthetic fixtures are rolled back.

No campaign or test email was sent during implementation. A real recipient opening/clicking a newly sent campaign after domain verification remains an end-to-end check, not a result inferred from mocked tests.
