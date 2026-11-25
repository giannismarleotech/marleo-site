# Automatic lead scouting

The owner requested unattended lead scouting across Belgium and Europe. A server scheduler checks every five minutes and reserves at most one search round per hour. It continues without an open browser. The monthly hard cap is 600 reserved rounds, including failed attempts; there is no automatic paid upgrade. Manual research uses additional provider allowance. Keep Tavily pay-as-you-go disabled to retain a free-account ceiling.

Ten European markets rotate with ten broad business sectors. This is an initial market sample, not complete European coverage. Each round uses one basic Tavily search followed by bounded public website reading and deterministic company qualification. No Gemini/Groq inference is needed for this discovery path. Existing AI research and mail preparation remain separate user-started steps. No outbound mail is queued.

Results stay in hq_agent_jobs with actual timestamps, source evidence and failures. Domains in the last 600 completed search rounds are suppressed, as are repeated domains within a round. Existing CRM dossiers/customers are not yet used for cross-checking that filter. A candidate is not a verified buying opportunity; no prospect is automatically turned into a customer.

The digital office reports real stages: searching, reading sites and qualification. Only the current recorded stage animates; stale jobs show an unknown state. A pause control disables future runs and stops subsequent steps in an active automatic round; an already dispatched provider request may still consume a credit. The schedule and last outcome are shown even when no job is active.

Security: the endpoint verifies either the exact HQ owner JWT for status/configuration or a random 256-bit cron token for ticks. The token is stored in Vault, only its hash is in the service-only RLS table, and neither is returned to browsers. The claim RPC is SECURITY INVOKER, executable only by service_role. No RLS policies on the config table is intentional deny-all for clients; the advisor INFO reflects this design (https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy). Other existing security advisories are unchanged.

Deployment setup SQL is in hq-autopilot-setup.sql. The creation migration leaves the plan paused until the worker is deployed and checked. Activation is a separate owner-authorized configuration update. Claim locks, a next-run timestamp and the existing one-active-job index bound concurrent execution. A failed worker is marked interrupted after three minutes by maintenance. Quota/key errors pause the plan. Provider uptime and free allowances are not guaranteed.

Validation: rotation/dedup tests, synthetic UI stale/paused/escaping tests, existing Control Center regression, desktop and 390px preview. Anonymous and forged scheduler tokens receive HTTP 401. No test sends email or changes financial data.
