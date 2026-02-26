# Tasks: Portal Legacy Schema Alignment

- [x] Verify remote DB constraints/indexes for `shops`, `shop_users`, `shop_credentials`.
- [x] Refactor edge function `owner_store_connections_get` to legacy tables only.
- [x] Refactor edge function `shopify_app_uninstalled` to revoke from `shop_credentials`.
- [x] Refactor edge function `owner_shopify_credentials_upsert` to `shop_id` contract.
- [x] Refactor edge function `shopify_oauth_finalize` to legacy-only writes.
- [x] Refactor edge functions `bootstrap_owner_store`, `invite_store_user`, `remove_store_user`.
- [x] Refactor admin edge functions (`admin_stores_list`, `admin_store_get`, `admin_store_update`, `admin_store_delete`).
- [x] Refactor Angular store/user models and edge DTO types to `shop_id` semantics.
- [x] Refactor Angular repositories/facades/components for legacy schema.
- [x] Remove `sync_owner_stores_from_legacy` function and Portal calls.
- [ ] Run build/typecheck and execute manual runbook checks.
