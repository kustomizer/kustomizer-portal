# Testing (Baseline)

## General rules

- Tests should reflect behavior (inputs/outputs), not internal implementation details.
- When fixing bugs, add a failing test first when feasible.
- Prefer table-driven tests for edge cases.

## What to cover

- Happy path
- Validation errors
- Edge cases (null/empty, boundaries)
- Security boundaries (authz/authn where relevant)
