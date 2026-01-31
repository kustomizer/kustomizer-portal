---
name: testing-node-ts
description: Write and validate Node/TypeScript tests (unit/integration/e2e)
---

# Testing Node/TS

## Process

1. Identify the behavior change (expected inputs/outputs).
2. Choose the right level: unit vs integration vs e2e.
3. Add edge cases and regression coverage.
4. Run `npm test` and fix failures.

## Notes

- Prefer deterministic tests.
- Avoid mocking internals unless necessary.
