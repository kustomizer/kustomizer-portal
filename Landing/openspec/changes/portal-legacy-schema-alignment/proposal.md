# Proposal: Align Portal to Legacy Shopify Schema

## Why

Portal runtime currently reads/writes canonical tables (`stores`, `store_users`, `store_shopify_credentials`) while Shopify app runtime (`kustomizer-shopify-app`) uses `shops`, `shop_users`, `shop_credentials`.

This split creates inconsistent state (app shows linked, portal shows disconnected) and adds operational complexity.

## What changes

- Move Portal edge functions to legacy schema as the only source of truth.
- Move Portal Angular repositories/models to `shop_id` + `shopify_domain` semantics.
- Remove legacy-sync bridge behavior from Portal runtime paths.
- Keep `users` and `licenses` integration unchanged.
- Keep metaobject endpoint behavior out of this first delivery scope.

## Scope (phase 1/2)

- Edge functions: connection status, uninstall revoke, credentials upsert, oauth finalize, bootstrap, team/admin endpoints.
- Angular: store/user models, repositories, facades, and portal/admin screens that assume `domain` PK.
- Cleanup: remove `sync_owner_stores_from_legacy` usage and function.

## Risks

- Contract changes between edge functions and Angular may cause runtime regressions if deployed partially.
- Existing data migration assumptions around store identity may surface owner/membership mismatches.

## Mitigations

- Ship backend + frontend together.
- Validate with install/uninstall/reconnect runbook before production rollout.
- Preserve encryption/hmac/domain-normalization hardening from prior canonical work.
