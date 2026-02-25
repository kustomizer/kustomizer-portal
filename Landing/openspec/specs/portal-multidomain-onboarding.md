# Portal Multidomain Onboarding Spec

This spec defines owner onboarding and multidomain behavior for the client portal and editor auth endpoints.

## Owner Onboarding

### Registration to Shopify

- After a successful sign-up with an active session, the app routes to `/app/dashboard?onboarding=shopify`.
- If the user has no stores yet, dashboard onboarding must direct the user to Shopify installation.
- The Shopify install URL is configured with `environment.publicShopifyInstallUrl` and defaults to `/api/shopify/install`.

### Install Endpoint

- `GET /api/shopify/install` is the app-owned Shopify onboarding entrypoint.
- If `shop` query param is present (e.g. `shop=brand.myshopify.com`) and OAuth env vars are set, the endpoint redirects to Shopify OAuth authorize URL and sets a short-lived `shopify_oauth_state` cookie.
- If `shop` is missing, or OAuth env vars are not configured, the endpoint redirects to a configured fallback install URL.

### OAuth Callback + Finalize

- `GET /api/shopify/callback` validates callback query params (`shop`, `code`, `state`, `hmac`) and verifies `shopify_oauth_state` cookie.
- Callback exchanges authorization code for an Admin API token using `SHOPIFY_APP_CLIENT_ID` + `SHOPIFY_APP_CLIENT_SECRET` (or `SHOPIFY_API_SECRET`).
- Callback calls `POST shopify_oauth_finalize` with a shared secret header to store canonical encrypted credentials in `store_shopify_credentials`.
- Finalize must validate token access against Shopify, normalize `shopify_domain`, resolve canonical domain/owner from legacy `shops` mapping when present, and upsert canonical owner store records.
- Callback redirects to a portal URL with `shopify=connected` or `shopify=error` query params.
- Required callback envs:
  - Vercel: `SHOPIFY_APP_CLIENT_ID`, `SHOPIFY_APP_CLIENT_SECRET` (or `SHOPIFY_API_SECRET`), `SHOPIFY_OAUTH_REDIRECT_URI`, `SUPABASE_URL`, `SHOPIFY_OAUTH_FINALIZE_SECRET`.
  - Supabase: `SHOPIFY_OAUTH_FINALIZE_SECRET`.

### Legacy Sync Bridge

- `POST sync_owner_stores_from_legacy` imports owner-linked stores for the authenticated email from legacy sources (`v_legacy_store_users`, `shops`) into canonical portal tables (`stores`, `store_users`).
- Dashboard and stores empty-state include a "Refresh linked stores" action that calls this sync endpoint and reloads store context.
- Sync attempts to import credentials from `shop_credentials` and always re-encrypts imported tokens with the canonical `SHOPIFY_TOKEN_ENCRYPTION_KEY`.
- If legacy ciphertext cannot be decrypted with the canonical key, sync may use optional legacy key secrets (`SHOPIFY_TOKEN_ENCRYPTION_KEY_LEGACY` or `SHOPIFY_LEGACY_TOKEN_ENCRYPTION_KEY`) and then rewrites canonical ciphertext.

### Uninstall Webhook

- `POST shopify_app_uninstalled` accepts Shopify uninstall webhook payloads.
- It validates `x-shopify-hmac-sha256` with `SHOPIFY_WEBHOOK_SECRET`.
- On valid uninstall webhook, it deletes `store_shopify_credentials` rows for the affected `shopify_domain`.

### No Manual Store Bootstrap in Portal

- Portal dashboard and stores list must not provide manual "create store" forms.
- Empty state must communicate that owner stores are created through Shopify install.

### Store Connection State in Portal

- Store list/detail views expose Shopify connection state (`Connected`/`Disconnected`) from canonical credentials table presence.
- Connection state is fetched via `POST owner_store_connections_get` (owner/member scoped) so client code does not query `store_shopify_credentials` directly.
- Disconnected stores provide explicit actions to `Reconnect on Shopify` and `Refresh linked stores` without deleting store ownership records.

## Team Membership

- Team invite and remove behavior remains domain-scoped and role-based (`owner`, `admin`, `reader`).
- Existing member management flows in `/app/team` remain unchanged by onboarding changes.

## Multidomain Resolution for Editor Endpoints

Endpoints:

- `kustomizer_auth`
- `kustomizer_shopify_metaobject_get`
- `kustomizer_shopify_metaobject_upsert`

Behavior:

- Incoming `domain` values are normalized (host/protocol cleanup, lowercase).
- Shopify domains are normalized to avoid duplicated suffixes like `.myshopify.com.myshopify.com`.
- Membership resolution must support canonical and mapped domains by consulting legacy mappings and credential mappings.
- License validation and role/status checks continue to use canonical store membership.

## Shopify Credentials Normalization

- `owner_shopify_credentials_upsert` must normalize input `domain` and `shopify_domain` before validation and storage.
- Metaobject endpoints decrypt credentials with the canonical key first, then optional legacy key secrets, and rewrite to canonical encryption when legacy key decryption succeeds.
- When credentials exist but cannot be decrypted by configured keys, metaobject endpoints return `409` with reason `SHOPIFY_CREDENTIALS_RECONNECT_REQUIRED`.

## Production Runbook Checks

- Install -> connected: complete Shopify install, run owner sync if needed, and confirm store status is `Connected` in portal list/detail.
- Metaobject read/write: call `kustomizer_shopify_metaobject_get` and `kustomizer_shopify_metaobject_upsert` for a known store and verify `ok: true` plus expected payloads.
- Uninstall -> disconnected: trigger Shopify app uninstall webhook and confirm credentials row is removed while store remains visible as `Disconnected`.
- Reconnect -> connected: reinstall/reconnect store credentials and verify portal status returns to `Connected` with successful metaobject read/write.
