# Vimexx in Marleo HQ

The Hosting & toegangen module is available only to the verified Supabase Auth owner of Marleo HQ. Existing browser-local client accounts intentionally have no access. Granting customers access requires separate server-side identity and domain authorization, not a frontend role check.

## Configuration

1. Apply `supabase/hq-hosting.sql` once in project `ufzwdhbrmycjtlewstaw`.
2. Deploy `supabase/functions/hq-hosting` as `hq-hosting`, with JWT verification enabled. It uses the runtime's Supabase URL/service-role secret. Do not add these to browser code.
3. Create a dedicated Login Key in DirectAdmin on `web0175.zxcs.nl:2222`. Allow only `CMD_API_POP`. Keep Allow HTM disabled. Use a short initial expiry and set a renewal reminder through your normal processes.
4. The Supabase Edge Function has no fixed outbound IP configured. An IP-restricted key needs a separate fixed-egress gateway. Do not put your desktop's IP into Allowed IPs. Leaving Allowed IPs blank permits the key from any IP; its command scope must remain restricted.
5. In HQ, open Hosting & toegangen, then Vimexx verbinden. Enter the DirectAdmin username (not the Login Key's label), paste the key, and select only the domains to manage. A read-only mailbox list request for the first domain is made before configuration is saved.

Configuration and passwords are encrypted in Supabase Vault. Public tables hold only secret references and action metadata. There are no browser RLS policies; browser roles have no table or RPC privileges. Only the service role can use the INVOKER RPC. The RPC independently checks the configured owner's live `auth.sessions` entry for every operation.

## Supported behavior

- Read mailbox lists, mailbox quotas and usage.
- Create mailboxes and change passwords through the fixed CMD_API_POP endpoint.
- Preserve quota and sending limit on password-only changes.
- Save a password only after DirectAdmin confirms the change.
- View the last saved password, hidden after 30 seconds.
- Keep action metadata without secrets; record starts and confirmed successes separately.
- Serialize mailbox mutations with a 90-second database lease, including concurrent devices.
- Report ambiguous provider/network outcomes and require checking the mailbox before a retry.

No mailbox deletion, DNS changes, arbitrary URLs, provider command selection, or customer permission management is exposed.

An existing provider password cannot be retrieved. Passwords changed outside HQ can make the saved value stale. The UI explicitly labels saved passwords accordingly. There is no automatic two-way password synchronization.

## Validation

Run `node --test tests/hq-hosting.test.mjs` for simulated provider, Auth, Vault, authorization, quota and failure-path checks. Never use a real customer mailbox as a disposable test fixture.

A real end-to-end connection requires the owner to enter the Login Key through HQ. Backend mock tests and unauthenticated endpoint checks do not prove that the provider accepts that key or that the provider allows this runtime's network requests.

DOM interaction tests use jsdom 26.1.0: `HQ_JSDOM_MODULE=/path/to/node_modules/jsdom node tests/hq-hosting-ui.cjs`. They exercise the actual UI module against a simulated backend, not live provider credentials.
