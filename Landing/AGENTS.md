# AGENTS.md (Kustomizer Landing)
This file is for agentic coding tools working in this repo. It captures build/test commands plus architecture + code-style rules that preserve maintainability and security.
Repository type: Angular 21 standalone app with SSR + Supabase.

## Commands

Install (preferred, reproducible):
```bash
npm ci
```
Dev server:
```bash
npm start
# Portal: http://localhost:4200/app
# Admin:  http://localhost:4200/admin
# Login:  http://localhost:4200/login
```
Build:
```bash
npm run build
npm run watch # dev build/watch
```
SSR (after build):
```bash
npm run build && npm run serve:ssr:Landing
```

Unit tests (Angular builder uses Vitest runner by default):
```bash
npm test
npx ng test --watch=false
npx ng test --watch=false --include src/app/app.spec.ts
npx ng test --watch=false --filter "^App"   # suite/test name regex
npx ng test --list-tests
npx ng test --watch=false --coverage
```

Lint/format/typecheck:
- Lint is not configured (`npx ng lint` errors). Do not add lint tooling unless requested.
- Prettier (config in `package.json`):
```bash
npx prettier --check .
npx prettier --write .
```
- Typecheck (fast, no emit):
```bash
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.spec.json --noEmit
```
- Security hygiene: `npm audit`

## Architecture Rules (Clean Architecture + SOLID)
Goal: keep authorization boundaries explicit and enable swapping infrastructure (mocks/Supabase/HTTP) without touching UI.

Layers (dependency direction only inward):
- Presentation: standalone components in `src/app/**/pages/**` and feature shells.
- Application: facades in `src/app/core/facades/**` (use-cases + `vm$`).
- Domain: models/types + repository interfaces/tokens in `src/app/core/{models,types,repositories}/**`.
- Infrastructure: concrete repos in `src/app/core/infrastructure/**` (Supabase + Edge).

Hard rules (DIP):
- Components talk to facades only.
- Facades talk to repository tokens only (`inject(TOKEN)`), never to concrete infra classes.
- Infra maps external DTOs/errors to domain types (`DomainError`, ID aliases, enums).

Adding a data capability:
1. Extend/create interface in `src/app/core/repositories/*.ts`.
2. Export token in `src/app/core/repositories/index.ts`.
3. Implement in `src/app/core/infrastructure/{supabase|edge}/...`.
4. Provide in `src/app/core/providers/production-providers.ts`.
5. Orchestrate in a facade, expose `vm$` for UI.

## Code Style (repo conventions)

Formatting:
- 2 spaces, single quotes (see `.editorconfig`); Prettier `printWidth=100`.

Imports (top-to-bottom):
1. `@angular/...`
2. `rxjs` then `rxjs/operators`
3. third-party
4. local app
Rationale: stable diffs + predictable dependency boundaries.

Naming:
- Files: kebab-case (Angular style guide).
- Classes: PascalCase; orchestration lives in `*Facade`.
- Tokens: `UPPER_SNAKE_CASE` (e.g., `AUTH_REPOSITORY`).
- Streams: `...$`; subjects: private `...Subject`, expose `...$`.

Types:
- `strict: true` is enabled; keep it that way.
- Avoid `any` (use `unknown` + narrow at boundaries).
- Prefer domain ID aliases (`src/app/core/types/ids.ts`) to prevent accidental mixing.
- Keep domain types framework-agnostic (no Angular imports in `core/models` or `core/types`).

RxJS/state:
- Prefer declarative pipelines; avoid component subscriptions except for one-shot actions.
- Use `async` pipe; use `take(1)` + `finalize` for actions.
- Cache in facades with `shareReplay({ bufferSize: 1, refCount: true })`.
- Use `Loadable<T>` (`src/app/shared/utils/loadable.ts`) for loading/empty/error UX.

Error handling:
- Never leak raw Supabase/HTTP errors across layers.
- Map infra errors to `DomainError` in `src/app/core/infrastructure/supabase/error-mapper.ts`.
- Preserve `DomainError.reason` for safe UI branching (conflicts/validation).

SSR:
- Do not access `window`/`document`/`localStorage` directly; use `StorageService` + `isPlatformBrowser`.

## Security and Safety (non-negotiable)
- Treat client data as untrusted; authZ decisions are server-side.
- Supabase RLS is mandatory for data access; privileged checks go through Edge Functions.
- Never gate admin UX using client role fields; use `AdminRepository.isAdmin()`.
- Never introduce service-role keys into browser code; only anon/publishable keys belong in `src/environment/*`.
- Do not log secrets, JWTs, sessions, or PII.
- Validate/normalize user input at boundaries (e.g., domain normalization in `src/app/shared/validators`).
- Prefer least privilege: select minimal columns, avoid broad queries.

## Repo Notes
- Mock repos are currently disabled in `src/app/core/providers/app-providers.ts`.
- Production providers are wired in `src/app/app.config.ts` and `src/app/core/providers/production-providers.ts`.

## Cursor / Copilot Rules
- No `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md` found.

## References
- Angular style guide (naming + file conventions): https://angular.dev/style-guide
- Angular DI + `inject()` patterns: https://angular.dev/guide/di
- Vitest CLI patterns: https://vitest.dev
