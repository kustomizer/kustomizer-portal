# Proposal: Shopify Publish Readiness (Landing + Portal)

## Motivation

To submit the Kustomizer Shopify app for review, we need a public-facing landing page that is credible and compliant.

Specifically:

- Remove "fake" proof elements (anonymous testimonials, invented company logos).
- Ensure the landing provides a working path to sign in / open the portal.
- Replace placeholder demo/lead capture so it does not simulate submissions.
- Remove dead links (`#`) and provide real, navigable legal pages.
- Validate that portal flows do not get stuck in loading states when API calls fail (400/409/500).

## Scope

In scope:

- Public landing page UX and copy adjustments.
- Add legal routes: `/privacy`, `/terms`, `/security`.
- Replace demo form behavior with a real action (mailto + optional Calendly).
- Make footer links non-placeholder.
- Improve error propagation and UI updates for common portal flows.

Out of scope:

- Building a full CRM lead pipeline.
- Implementing server-side email sending.
- Full legal text review (copy will be placeholder until replaced by final counsel-approved text).

## Proposed Behavior

### Landing

- Navbar CTA:
  - Guest: show `Sign in`.
  - Authenticated: show `Open Portal`.
- Remove testimonials.
- Replace "Trusted by" logos with a neutral "Built for" compatibility block.
- Demo section:
  - Submitting the form opens the user's email client via `mailto:` with all details.
  - If `environment.publicCalendlyUrl` is set, also show a "Book on Calendly" button.

### Footer

- No `#` placeholder links.
- Legal links point to internal routes:
  - `/privacy`
  - `/terms`
  - `/security`
- Social links removed unless real URLs exist.

### Portal Error Handling

- If an API call fails (e.g. Edge Function returns 409), the UI must:
  - stop showing loading state
  - show a human-readable error
  - allow retry

Implementation note: this project behaves like a zoneless/SSR setup in which some async updates may require explicit change detection.

## Configuration

Public site configuration is stored in `src/environment/environment*.ts`:

- `publicDemoEmail`: email used for the `mailto:` demo request.
- `publicCalendlyUrl`: optional external link.

These values are intentionally non-secret.

## Risks / Mitigations

- Risk: placeholder legal copy is not acceptable for Shopify review.
  - Mitigation: treat the pages as routes + placeholders, and replace copy before submission.
- Risk: mailto flow depends on user's email client.
  - Mitigation: optional Calendly link for direct scheduling.
