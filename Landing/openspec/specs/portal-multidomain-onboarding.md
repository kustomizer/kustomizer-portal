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

### Legacy Sync Bridge

- `POST sync_owner_stores_from_legacy` imports owner-linked stores for the authenticated email from legacy sources (`v_legacy_store_users`, `shops`) into canonical portal tables (`stores`, `store_users`).
- Dashboard and stores empty-state include a "Refresh linked stores" action that calls this sync endpoint and reloads store context.
- Sync also attempts to import credentials from `shop_credentials` when a compatible token field exists and the token validates against Shopify.

### Uninstall Webhook

- `POST shopify_app_uninstalled` accepts Shopify uninstall webhook payloads.
- It validates `x-shopify-hmac-sha256` with `SHOPIFY_WEBHOOK_SECRET`.
- On valid uninstall webhook, it clears encrypted access tokens from `store_shopify_credentials` for the affected `shopify_domain`.

### No Manual Store Bootstrap in Portal

- Portal dashboard and stores list must not provide manual "create store" forms.
- Empty state must communicate that owner stores are created through Shopify install.

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
