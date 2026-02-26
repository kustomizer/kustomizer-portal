# Portal Legacy Alignment Plan (Shopify + Supabase + Angular/Remix)

## Objective

Align Portal (Landing) to the same data model already used by `kustomizer-shopify-app` (and expected by current editor/app flows), with a single source of truth and no compatibility bridges.

Decision for this plan:

- Source of truth for store linkage and membership: `shops`, `shop_users`, `shop_credentials`
- Keep shared account/licensing tables: `users`, `licenses`
- Remove canonical bridges from Portal runtime path: `stores`, `store_users`, `store_shopify_credentials`, legacy sync views/functions
- No dual-write, no fallback reads, no temporary retrocompat in production flow

---

## Cross-repo findings (current state)

### 1) Portal repo (`Landing`) is still canonical-first

- Core Portal connection status reads canonical credentials in `owner_store_connections_get` and only falls back to legacy mapping for domain hints.
- OAuth finalize path writes canonical credentials (`shopify_oauth_finalize` -> `store_shopify_credentials`).
- Metaobject and auth public edge functions currently resolve membership through canonical + legacy bridges.
- Angular models/repositories use `domain` as primary key and assume `stores`/`store_users`.
- Portal still exposes Shopify-facing OAuth routes (`/api/shopify/install`, `/api/shopify/callback`) in both `src/server.ts` and Vercel API routes.

### 2) Shopify app repo (`kustomizer-shopify-app`) is legacy-first for live app use

- Active app endpoints read/write `shops`, `shop_users`, `shop_credentials`.
- UI linked state can be satisfied from legacy owner lookup.
- Canonical finalize/revoke path exists but is not the effective source for app linked state.
- Security debt to fix while refactoring: hardcoded encryption seed in `app/lib/encryption.server.ts`.

### 3) Visual editor/storefront repo (`kustomizer`) does not depend on canonical portal schema

- Editor library uses Shopify GraphQL directly/proxy and does not read `stores/store_users/store_shopify_credentials`.
- Storefront reference includes hardcoded dev token/config defaults that should not remain in production-like flows.

Conclusion: the current production behavior is split. Portal and app are not aligned on one persistence model.

---

## Target schema contract (Portal after refactor)

### Tables

- `shops(id, name, shopify_domain, allowed_domains, owner_email, created_at, updated_at)`
- `shop_users(shop_id, email, invited_by, role, status, created_at, updated_at)`
- `shop_credentials(shop_id, shopify_domain, access_token_ciphertext, access_token_iv, last_validated_at, created_at, updated_at)`
- `users(email, license_id, name, lastname, ...)`
- `licenses(license_id, tier, expires_at, created_at, ...)`

### Mapping from canonical model

| Portal canonical (current) | Legacy target (new) |
| --- | --- |
| `stores.domain` | `shops.id` + `shops.shopify_domain` |
| `stores.owner_id` | `shops.owner_email` |
| `store_users.domain` | `shop_users.shop_id` |
| `store_shopify_credentials.domain` | `shop_credentials.shop_id` |

Important key change:

- Portal PK/FK flow moves from string `domain` to numeric `shop_id` (represented as string in TS where needed).

---

## Critical use-case checklist (ordered by criticality)

## P0 - Must work before release

- [ ] Install app in Shopify creates/updates `shops`, `shop_users(owner,active)`, `shop_credentials`.
- [ ] Portal shows store as `Connected` based only on `shop_credentials` existence/valid fields.
- [ ] Uninstall webhook removes only `shop_credentials` row, keeps `shops` + `shop_users` (store visible as `Disconnected`).
- [ ] Reinstall/reconnect recreates `shop_credentials` and Portal flips back to `Connected`.
- [ ] Ownership/membership enforcement is correct (`shop_users.status='active'`, role checks, owner checks).
- [ ] No false positive linked state from old canonical fallback paths.

## P1 - High

- [ ] Team invite/remove works on `shop_users` with proper owner authorization.
- [ ] Admin list/get/update/delete works on `shops` + `shop_users` + `shop_credentials` cleanup.
- [ ] Bootstrap flow (if kept) creates rows in `shops` + `shop_users` and license relation remains valid.
- [ ] Multidomain resolution works using `shops.allowed_domains` + `shops.shopify_domain` (not only exact shopify domain).

## P2 - Medium

- [ ] `kustomizer_auth` resolves store membership from legacy model and still validates license.
- [ ] Metaobject get/upsert paths read credentials from `shop_credentials` and preserve reconnect-required semantics.

## P3 - Hardening/cleanup

- [ ] Remove dead canonical code paths/routes/functions after cutover verification.
- [ ] Remove hardcoded encryption defaults in app/editor reference code.
- [ ] Update docs/runbook/specs for final single-model architecture.

---

## Important improvements from canonical work to preserve in legacy refactor

These improvements should be ported, not dropped:

- Token crypto hardening pattern: env-based primary key + optional controlled legacy decrypt path + re-encrypt writeback.
- Strict domain normalization (`.myshopify.com` dedupe, lowercase, URL/protocol stripping).
- Explicit webhook HMAC validation and constant-time compare.
- Explicit `Connected/Disconnected` semantics based on credential record integrity.
- Reconnect-required behavior when encrypted token cannot be decrypted with configured keys.
- Runbook-style validation for install/uninstall/reconnect flows.

---

## Implementation plan by phase

## Phase 0 - Preconditions (DB + security)

- [ ] Verify/create constraints:
  - [ ] `UNIQUE (shopify_domain)` on `shops`
  - [ ] `UNIQUE (shop_id)` on `shop_credentials`
  - [ ] `UNIQUE (shop_id, email)` on `shop_users`
- [ ] Verify required indexes for lookup performance (`shop_users.email`, `shop_credentials.shop_id`, optional GIN on `allowed_domains`).
- [ ] Verify RLS/policies for any tables read directly by browser (`shops`, `shop_users`) or move those reads behind edge functions.
- [ ] Define final token encryption key envs for legacy schema and migration of existing ciphertexts.

## Phase 1 - P0 cutover in Portal edge functions

- [ ] Refactor `supabase/functions/_shared/store-access.ts`:
  - Resolve `shop_id` via `shops.shopify_domain` OR `shops.allowed_domains` contains normalized domain.
  - Resolve membership from `shop_users` by `shop_id + email`.
  - Return `shopId` (and resolved `shopifyDomain`) instead of canonical domain.
  - Remove canonical/legacy bridge lookups (`v_legacy_*`, `store_shopify_credentials` mapping lookups).
- [ ] Refactor `owner_store_connections_get` to legacy tables only:
  - `shop_users` -> authorized `shop_id`
  - `shops` -> display data
  - `shop_credentials` -> connected state
  - Response shape based on `shop_id`.
- [ ] Refactor `shopify_app_uninstalled` to delete from `shop_credentials` by `shopify_domain` and return revoked `shop_id`/`shopify_domain`.
- [ ] Refactor `owner_shopify_credentials_upsert` to upsert `shop_credentials` by `shop_id`.
- [ ] Refactor `shopify_oauth_finalize` to upsert only legacy model (`shops`, `shop_users`, `shop_credentials`) and remove canonical table writes.

## Phase 2 - Remaining Portal edge functions

- [ ] `bootstrap_owner_store` -> `shops` + `shop_users` model.
- [ ] `invite_store_user` / `remove_store_user` -> `shop_users` + owner checks against `shops.owner_email`.
- [ ] Admin functions:
  - [ ] `admin_stores_list`
  - [ ] `admin_store_get`
  - [ ] `admin_store_update`
  - [ ] `admin_store_delete` (also delete `shop_credentials`)
- [ ] `kustomizer_auth` -> new `resolveStoreMembership` output.
- [ ] (P2) `kustomizer_shopify_metaobject_get` / `upsert` -> `shop_credentials` by `shop_id`.

## Phase 3 - Angular frontend refactor (Portal)

- [ ] Update domain models/types:
  - `Store` to represent `id` (shop_id) + `shopifyDomain`.
  - `StoreUser` from `domain` to `shopId`.
  - Edge DTOs in `core/types/edge-functions.ts`.
- [ ] Refactor repositories:
  - `supabase-stores.repository.ts` (`stores` -> `shops` and connection mapping by `shop_id`).
  - `edge-store-users.repository.ts` (`store_users` -> `shop_users`).
  - `edge-bootstrap.repository.ts` request/response shape updates.
  - `edge-shopify-credentials.repository.ts` to send `shop_id`.
  - `edge-admin.repository.ts` response mapping to `shops` model.
  - `supabase-licenses.repository.ts` owner lookup via `shops.owner_email`.
- [ ] Refactor facades/components that assume `domain` as primary key:
  - `store-context.facade.ts` (active key should be shop_id)
  - `portal-dashboard.component.ts` (remove legacy sync CTA)
  - `store-list.component.ts` / `store-detail.component.ts`
  - `portal-team.component.ts`
  - `admin-stores-list.component.ts` / `admin-store-detail.component.ts`

## Phase 4 - Cross-repo cleanup for single model

- [ ] In `kustomizer-shopify-app`, remove canonical sync dependency if legacy is final source:
  - remove `canonical-store-sync.server.ts` usage in install/uninstall paths
  - ensure afterAuth writes legacy credentials reliably and logs failures with context
- [ ] Replace hardcoded crypto key derivation in app with env-based key strategy (plus one-time decrypt migration if needed).
- [ ] In `kustomizer` reference, remove hardcoded token defaults and force runtime config injection.

## Phase 5 - Delete obsolete runtime paths (no dual source)

- [ ] Remove `sync_owner_stores_from_legacy` edge function and related frontend calls.
- [ ] Remove references to `v_legacy_stores` and `v_legacy_store_users` from Portal code.
- [ ] Remove Portal Shopify OAuth runtime routes if Shopify-facing flow is exclusively `kustomizer.xyz` app.
- [ ] Remove canonical table access from Portal codebase.
- [ ] Drop canonical tables/views only after full validation window.

---

## File-by-file primary impact list (Portal)

Edge functions:

- `supabase/functions/_shared/store-access.ts`
- `supabase/functions/owner_store_connections_get/index.ts`
- `supabase/functions/shopify_app_uninstalled/index.ts`
- `supabase/functions/owner_shopify_credentials_upsert/index.ts`
- `supabase/functions/bootstrap_owner_store/index.ts`
- `supabase/functions/shopify_oauth_finalize/index.ts`
- `supabase/functions/invite_store_user/index.ts`
- `supabase/functions/remove_store_user/index.ts`
- `supabase/functions/admin_store_get/index.ts`
- `supabase/functions/admin_stores_list/index.ts`
- `supabase/functions/admin_store_update/index.ts`
- `supabase/functions/admin_store_delete/index.ts`
- `supabase/functions/kustomizer_auth/index.ts`
- (P2) `supabase/functions/kustomizer_shopify_metaobject_get/index.ts`
- (P2) `supabase/functions/kustomizer_shopify_metaobject_upsert/index.ts`
- Remove: `supabase/functions/sync_owner_stores_from_legacy/index.ts`

Angular frontend:

- `src/app/core/models/store.model.ts`
- `src/app/core/models/membership.model.ts`
- `src/app/core/models/auth.model.ts`
- `src/app/core/types/edge-functions.ts`
- `src/app/core/infrastructure/supabase/supabase-stores.repository.ts`
- `src/app/core/infrastructure/supabase/supabase-licenses.repository.ts`
- `src/app/core/infrastructure/edge/edge-store-users.repository.ts`
- `src/app/core/infrastructure/edge/edge-bootstrap.repository.ts`
- `src/app/core/infrastructure/edge/edge-shopify-credentials.repository.ts`
- `src/app/core/infrastructure/edge/edge-admin.repository.ts`
- `src/app/core/facades/store-context.facade.ts`
- `src/app/portal/pages/dashboard/portal-dashboard.component.ts`
- `src/app/portal/pages/stores/store-list.component.ts`
- `src/app/portal/pages/stores/store-detail.component.ts`
- `src/app/portal/pages/team/portal-team.component.ts`
- `src/app/admin/pages/stores/admin-stores-list.component.ts`
- `src/app/admin/pages/stores/admin-store-detail.component.ts`

---

## Test/runbook checklist

## Core E2E checks

- [ ] Install app -> rows present in `shops`, `shop_users`, `shop_credentials` -> Portal shows `Connected`.
- [ ] Uninstall app -> `shop_credentials` removed -> Portal still lists store as `Disconnected`.
- [ ] Reinstall app -> `shop_credentials` restored -> Portal returns to `Connected`.
- [ ] Owner mismatch attempt is rejected.
- [ ] Member invite/remove updates `shop_users` and UI reflects changes.
- [ ] Admin list/detail/update/delete works end-to-end.

## Public/editor checks

- [ ] `kustomizer_auth` validates active membership + license.
- [ ] (P2) Metaobject get/upsert succeeds with valid credentials and license.

## SQL smoke checks

- [ ] Connection status query by `shop_id` returns expected rows for connected/disconnected states.
- [ ] No writes remain to `stores`, `store_users`, `store_shopify_credentials` during install/uninstall/reconnect flows.

---

## Rollout strategy

- [ ] Implement in feature branch with granular commits by phase.
- [ ] Deploy edge functions + frontend together to avoid mixed contracts.
- [ ] Run full checklist in staging, then one controlled production store.
- [ ] Monitor logs for install/uninstall/reconnect and membership failures.
- [ ] Remove obsolete tables/views only after validation window completes.

---

## Out of scope for first delivery

- Full redesign of metaobject payload model itself (only storage/membership source alignment is in scope when P2 starts).
- Any new editor feature work unrelated to install/uninstall/reconnect and membership correctness.
