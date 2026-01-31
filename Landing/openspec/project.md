# Project Context (OpenCode Workbench)

This file is the **human source of truth** for how this project is built and how changes should be delivered.

- Keep it up to date when the stack or workflows change.
- Avoid duplicating content in multiple places: `.opencode/context/project/project-context.md` should reference this.

<!-- OPENCODE_WORKBENCH_MANIFEST_START -->
```json
{
  "packageManager": "npm",
  "monorepoTool": null,
  "frameworks": [
    "angular",
    "express"
  ],
  "testing": {
    "unit": "vitest",
    "e2e": null
  }
}
```
<!-- OPENCODE_WORKBENCH_MANIFEST_END -->

## Definition of Done

- Code follows project conventions and is easy to read and review.
- Lint + typecheck + tests pass (or documented why not applicable).
- New behavior is covered by tests (unit/integration/e2e depending on scope).
- Public APIs are documented (README, TSDoc, or OpenSpec specs).
- Security: no secrets committed, no unsafe shell commands, inputs validated.

## Testing Strategy

Document which runners are used and where tests live.

- Unit: (fill in)
- Integration: (fill in)
- E2E: (fill in)

## Architecture Notes

Capture key patterns that should be consistent across packages (module boundaries, DI style, error handling, logging, etc.).

### Runtime / Build

- Node: expected `24.x` (Angular build is tested with Node 24).
- Build: `npm run build`
- SSR serve (after build): `node dist/Landing/server/server.mjs`

### Public Site Configuration

Non-secret public configuration is stored in `src/environment/environment*.ts`:

- `publicDemoEmail`: email used by the landing mailto demo flow.
- `publicCalendlyUrl`: optional Calendly link shown in the landing demo section.

### Error Handling (Portal)

- Backend errors should be surfaced to the UI with explicit messages.
- The UI must not get stuck in loading states after failed requests.
- Some async UI updates may require explicit change detection (see components using `ChangeDetectorRef.detectChanges()`).
