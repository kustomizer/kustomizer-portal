# Tasks: Multidomain Access + Shopify Owner Onboarding

- [x] Add configurable Shopify owner install URL in public environment config.
- [x] Add app-owned install endpoint (`/api/shopify/install`) with optional `shop` and fallback redirect behavior.
- [x] Add owner store sync endpoint to import linked Shopify stores from legacy schema (`shops` / `v_legacy_store_users`) into portal tables.
- [x] Update register/portal empty-state UX to route owner onboarding through Shopify instead of manual store creation.
- [x] Remove manual create-store forms from dashboard/store list UI.
- [x] Implement multidomain resolution in `kustomizer_auth` using legacy domain mappings.
- [x] Implement multidomain resolution in `kustomizer_shopify_metaobject_get` and `kustomizer_shopify_metaobject_upsert`.
- [x] Keep canonical-domain checks for membership and license validation.
- [x] Verify team invite/remove flow is unaffected for owner-managed stores.
- [x] Run typecheck/build validations for Angular + Edge function TypeScript.
- [x] Update `openspec/specs/` to document owner onboarding and multidomain endpoint behavior.
