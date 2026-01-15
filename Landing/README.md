# Landing

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.0.

## Mock licensing MVP

The `/app` client portal and `/admin` backoffice are fully mocked. Repositories read from in-memory seed data and simulate delays + errors to prepare for Supabase or HTTP replacements without touching UI components.

### Quick start

```bash
ng serve
```

- Portal: `http://localhost:4200/app`
- Admin: `http://localhost:4200/admin`
- Login selector: `http://localhost:4200/login`

### Change active user (mock auth)

Use the login selector page (`/login`) to choose a seeded user or create a new workspace. Sessions are stored in `localStorage` under `kustomizer.session` and expire after 8 hours.

### Simulate mock failures

Set `localStorage.kustomizer.mock.failures` to a JSON array of failure keys (strings) to trigger errors. Example:

```js
localStorage.setItem('kustomizer.mock.failures', JSON.stringify(['stores.list', 'licenses.get']));
```

### Seed data location

Edit `src/app/core/mocks/mock-data.ts` to update users, orgs, licenses, stores, domains, and audit logs.

### Folder structure

- `src/app/core/models` – domain models and types
- `src/app/core/repositories` – repository interfaces + injection tokens
- `src/app/core/mocks` – in-memory implementations + seed data
- `src/app/core/facades` – screen-level orchestration
- `src/app/core/guards` – auth and admin guards
- `src/app/core/adapters` – Supabase adapter stub
- `src/app/portal/pages` – client portal pages
- `src/app/admin/pages` – admin backoffice pages
- `src/app/shared/validators` – form validators
- `src/app/shared/utils` – load state helpers

### Supabase wiring (next iteration)

`src/app/core/adapters/supabase.adapter.ts` reads `environment.supabaseUrl` and `environment.supabaseKey`. To swap mocks for Supabase or HTTP:

1. Create repository implementations (e.g. `SupabaseStoresRepository`) in `src/app/core/repositories`.
2. Update `src/app/app.config.ts` to provide those classes instead of `provideMockRepositories()`.
3. Keep components unchanged; they depend on repository interfaces only.
