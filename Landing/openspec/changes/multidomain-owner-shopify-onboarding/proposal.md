# Proposal: Multidomain Access + Shopify Owner Onboarding

## Motivation

The landing/client portal still allows manual store bootstrap from the portal UI, while production ownership should be created through Shopify install.

At the same time, the editor-facing auth/authz endpoints currently validate by a single `domain` value and do not consistently resolve multidomain mappings.

This creates two risks:

- New users can attempt manual store creation in the portal instead of Shopify-led onboarding.
- Editor authentication can fail when requests come from mapped domains (custom domain vs Shopify domain).

## Goals

- Enforce owner onboarding through Shopify (no manual store creation from landing/client portal).
- Support multidomain resolution in editor auth/authz endpoints.
- Keep current member invite/remove flow unchanged for existing stores.

## Scope

In scope:

- Portal UX changes to remove manual "create store" paths.
- Registration flow redirect for owner onboarding via Shopify install URL.
- Multidomain resolution in Edge Functions used by the Kustomizer SPA:
  - `kustomizer_auth`
  - `kustomizer_shopify_metaobject_get`
  - `kustomizer_shopify_metaobject_upsert`

Out of scope:

- Implementing full Shopify OAuth callback/token exchange inside this repo.
- Data backfill/migration scripts for existing rows.
- Changes to admin backoffice flows unless strictly required by the above.

## Proposed Behavior

### 1) Owner onboarding in portal

- New registered users will no longer create stores manually in portal forms.
- Empty-state onboarding in portal will direct owners to Shopify install.
- A stable app-owned install endpoint (`/api/shopify/install`) is used for redirect.
- The install endpoint supports optional `shop=<store>.myshopify.com` and can redirect either:
  - to Shopify OAuth authorize URL when OAuth env vars are configured, or
  - to a configured fallback install URL when no shop or OAuth config is available.

### 2) Multidomain auth for editor endpoints

- Incoming `domain` will resolve against legacy multidomain mapping (domain/shopify_domain).
- Membership lookup accepts either canonical domain or mapped Shopify domain.
- Once resolved, permissions and license checks continue over canonical store domain.

### 3) Team management compatibility

- Existing team invite/remove flow remains owner-gated and domain-scoped.
- No changes to role semantics (`owner`, `admin`, `reader`) or status checks.

### 4) Legacy-to-portal owner sync bridge

- Add a sync endpoint that imports owner-linked stores from legacy Shopify linkage tables/views into canonical portal tables.
- Expose sync trigger in portal empty state to recover store visibility after Shopify app linking.
- During sync, attempt to import Shopify credentials from legacy credentials storage (encrypted columns first, plaintext fallback).

### 5) Uninstall handling

- Add a Shopify uninstall webhook endpoint that verifies `X-Shopify-Hmac-Sha256` and revokes encrypted Shopify credentials for the uninstalled shop.
- Keep store ownership records visible in portal after uninstall, but mark connection as disconnected and offer reconnect/sync actions.
- Resolve connection-status rendering through an owner-scoped Edge endpoint (instead of direct credential-table reads from browser clients).

## Risks and Mitigations

- Risk: Wrong Shopify install URL in environment leads to bad redirect.
  - Mitigation: keep URL configurable and show clear fallback message when missing.
- Risk: Ambiguous mappings in legacy views.
  - Mitigation: prefer deterministic single-row lookups and return explicit 404/403 when unresolved.

## Acceptance Criteria

- Portal no longer exposes manual create-store forms for onboarding.
- Register flow can send owner to Shopify install path.
- Editor endpoints accept mapped domains and pass existing membership/license checks.
- Existing invite/remove functionality remains operational for active owner stores.
