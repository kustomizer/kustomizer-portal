# Kustomizer Security Notes

This document is a reminder list for hardening items related to the external Kustomizer service integration.

## Pending hardening (do later)

- Add a server-to-server authentication layer for calls from Kustomizer -> Supabase Edge Functions.
  - Option A: fixed shared secret header (e.g. `X-KUSTOMIZER-SERVICE-KEY`).
  - Option B: HMAC signature with timestamp (prevents replay attacks).
  - Rotate secrets and store them in Supabase Function secrets.
- Consider rate limiting / abuse protection for public endpoints (especially those that accept `{ domain, email }`).
- Add audit logging for Shopify write operations (domain, target, actor email, timestamp, outcome).

