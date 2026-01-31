# Public Site Spec

This document describes the expected behavior for the public-facing pages (landing + legal).

## Landing Page (`/`)

### Credibility / Proof

- The landing must not include fabricated logos, fabricated customers, or anonymous testimonials presented as real.
- A compatibility block may be used instead (e.g. Shopify/Plus, Angular SSR, metafields).

### Primary CTAs

- Guests:
  - Navbar shows `Sign in` linking to `/login`.
  - Hero may show `Access portal` linking to `/login`.
- Authenticated users:
  - Navbar shows `Open Portal` linking to `/app`.
  - Hero may show `Go to portal` linking to `/app`.

### Demo Request Form

- The demo request form must not "fake" submissions via timeouts.
- Submitting the form opens the user's email client via `mailto:`.
- The email recipient is configured by `environment.publicDemoEmail`.
- If `environment.publicCalendlyUrl` is non-empty, show a secondary button linking to Calendly.

## Footer

- Footer must not contain dead placeholder links (`#`).
- Legal links must route to:
  - `/privacy`
  - `/terms`
  - `/security`

## Legal Pages

The following routes must exist and be navigable from the footer:

- `/privacy`
- `/terms`
- `/security`

These pages must contain a complete Privacy Policy / Terms / Security policy that is suitable for public publishing.
Review the content with legal counsel before Shopify submission.
