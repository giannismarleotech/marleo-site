# Mijn Marleo customer portal

Public entry: `https://marleo.tech/portaal/`. Owner management: HQ → Klantportalen, or the matching customer detail page. This is independent of the owner-only Hosting & toegangen module.

## Owner workflow

1. Ensure the customer dossier has been saved and synchronized from HQ.
2. Open Klantportalen, choose the customer and use Klant uitnodigen. Review the recipient, customer and permissions. The invitation preview never sends a message.
3. The explicit Account aanmaken en uitnodiging sturen action creates/updates that contact's grant and sends the branded email through the existing Resend configuration. A failed or uncertain send is not displayed as success. The code never automatically retries an invitation.
4. Add services with a title, category, status, public description, optional HTTPS link, optional price excluding VAT, billing period and renewal date. Visibility is explicit. This inventory does not affect financial reports or generate invoices.
5. Edit account permissions, revoke/restore access, resend invitations and answer customer support questions from the same screen.

No customers, services or invitations are automatically seeded. No production invitation was sent during implementation testing. Browser-local legacy client accounts are not migrated into real accounts without the owner's explicit invitation.

## Identity and authorization

- Passwordless Supabase Auth via admin-generated magic links sent using the server's Resend key.
- Tokens appear only in the email fragment URL, are removed from the browser address bar immediately and are consumed after the visitor explicitly presses Portaal openen.
- `verifyOtp` uses `type: email`. The dedicated portal uses the pinned supabase-js 2.119.2 SDK with a separate `marleo-customer-portal-auth` storage key and automatic session refresh. HQ sessions are not reused.
- JWTs are validated by Supabase Auth in the function. Every protected database operation also checks that the actual auth.sessions row is live.
- Only the verified HQ owner's user ID can use administrative actions. Neither frontend role flags nor user_metadata grant authority.
- Customer scope is loaded from the active server-side grant, never a customer_id supplied by a client. Revoked grants are checked on each request, including with an unexpired JWT.
- A contact belongs to one customer. Multiple contacts may belong to the same customer; those contacts share that customer's support tickets. Cross-customer reuse of an email is rejected.
- All portal tables have RLS and no grants to anon/authenticated. Only the service-role INVOKER RPC can access them. The lack of client RLS policies is deliberate, not an invitation to grant direct browser access.
- Public login responses are generic, with per-email cooldown and hourly email/IP/global limits. The endpoint never creates an Auth user for an uninvited email during public login.

## Customer data

Only an explicit customer/company/invoice projection is returned. Other customers, internal notes, CRM settings, integrations, expenses, quotes and draft invoices are excluded. Credit notes subtract from the balance. Invoice math matches HQ's current 21% VAT and line-level rounding model. Each invoice detail request verifies its customer scope again.

Invoice details can be printed or saved as PDF using the browser print dialog; no claim is made that this is a stored original invoice PDF. The portal reads synchronized live CRM invoice data and refreshes on visibility change and every minute while open. Services are curated separately by the owner; hosting passwords are not shared.

Support questions are persisted to the portal and shown in HQ. Replies appear in the portal; this first implementation does not send a separate reply notification email.

## Deployment and tests

Apply `supabase/hq-portal.sql` once. Deploy `supabase/functions/hq-portal` with the runtime SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and existing RESEND_API_KEY. Gateway JWT verification is disabled because login requests are public; all other requests authenticate in the handler and enforce the live-session server grant.

- `node --test tests/hq-portal.test.mjs`
- `HQ_JSDOM_MODULE=/path/to/jsdom node tests/hq-portal-ui.cjs` (jsdom 26.1.0)
- `tests/hq-portal-permissions.sql`: transaction-only database permission checks with synthetic account/session records, fully rolled back.

Test code mocks mail delivery. The real first invitation remains an explicit owner action, so real deliverability and the complete email-to-Auth flow are not claimed as tested with a customer address.

## Dutch and English

Apply `supabase/hq-portal-languages.sql` after the initial schema. The header selector translates navigation, actions, statuses, categories, validation feedback and invoice labels immediately; dates and currency use nl-BE/en-GB. Local storage remembers the guest preference. Authenticated selections are saved on the acting contact’s grant, so another device loads the same preference. The owner can set this language when inviting or editing an account. Invite previews, invitations, resends and requested login emails use that language; invitation URLs carry `?lang=nl` or `?lang=en` before the token fragment.

Translation operates on authored UI literals, never the rendered DOM or customer data. Company names, invoice lines, terms, manually authored service content and support messages remain verbatim. Switching languages preserves a draft enquiry and the open invoice. No translation service receives customer data. Test cases cover both UI languages, invoice labels, draft preservation, preference payload scoping, English emails and rollback-only database preference updates.
