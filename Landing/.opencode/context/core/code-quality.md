# Code Quality (Baseline)

Goals:

- Make changes easy to review and easy to revert.
- Optimize for maintainability over short-term cleverness.

## Conventions

- Keep modules focused. Split by responsibility.
- Prefer pure functions in the core; isolate I/O at the edges.
- Prefer composition over inheritance.
- Avoid deep nesting; use early returns.

## SOLID quick checks

- S: each module/class has 1 reason to change.
- O: extend behavior by adding new code, not modifying unrelated code.
- L: if using inheritance, derived types must be substitutable.
- I: small interfaces.
- D: depend on abstractions where it reduces coupling.
