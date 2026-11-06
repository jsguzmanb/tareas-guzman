# Design QA — Gestor de tareas JSG 0.2.0

## Comparison target

- Source visual truth: `/home/dev/proyectos/juansguzman/site-redesign/.qa/reference-assets/selected-homepage-concept.png`.
- Source pixels: 999 × 1575 px, desktop editorial reference, device scale factor 1.
- Rendered implementation: `/tmp/tareas-inbox-desktop-final.png`.
- Implementation pixels: 1440 × 2070 px, CSS viewport 1440 × 1000, device scale factor 1.
- Responsive evidence: `/tmp/tareas-inbox-mobile.png`, 390 × 3636 px, CSS viewport 390 × 844, device scale factor 1.
- Joint full-view evidence: `/tmp/tareas-qa-comparison.png`, generated from `/qa-comparison.html` with both artifacts visible in the same browser capture.
- State: authenticated Inbox with 19 real tasks, desktop and mobile.

The source is a public marketing page and the implementation is an authenticated
task application, so exact section topology is intentionally different. The
comparison evaluates the selected visual language: hierarchy, typography,
palette, rhythm, surfaces, identity, icon family and responsive behavior.

## Findings

No actionable P0, P1 or P2 differences remain.

- Typography: local Manrope Variable matches the selected direction. Display
  headings use compact tracking and strong optical weight; small interface text
  remains readable and does not truncate at 390 px.
- Spacing and layout: the desktop rail, wide paper workspace, generous header
  rhythm and modular task cards preserve the reference's calm composition.
  Mobile collapses to one column with persistent bottom navigation and no
  horizontal overflow.
- Colors and tokens: forest `#0B352F`, paper `#FBFAF4`, sage `#DFEADC`, apricot
  `#F39A61` and cobalt `#87AFE1` map directly to the approved system. Active,
  disabled, warning and destructive states remain distinguishable.
- Image quality: the approved JSG raster mark is used directly and renders
  sharply. Hero illustrations from the marketing reference are not reproduced
  inside the productivity app because they would compete with the working task
  surface; this is an intentional product-context constraint.
- Copy and content: existing task data and functional labels are preserved.
  Page framing copy was tightened into Spanish without changing task records or
  application behavior.
- Icons: Heroicons outline icons provide a consistent, real icon family. No
  handcrafted SVG, emoji, CSS art or placeholder imagery remains in the UI.

## Focused region comparison

The combined capture keeps the brand, navigation, primary heading, capture bar,
task cards and principal controls legible at the same time, so an additional
crop was not needed. Mobile evidence separately verifies wrapping, tap targets
and the persistent navigation pattern.

## Primary interactions and regression checks

- Technical login completed using the existing local account without exposing
  credentials.
- Inbox, Next Actions, Projects, Review and Settings rendered from the existing
  database without data mutation.
- Capture, voice, task-state and navigation controls remain present and named.
- Production build compiled all 18 routes successfully.
- ESLint passes.
- Test suite: 16 passed, 1 database-isolation test skipped because
  `TEST_DATABASE_URL` is not configured.
- Axe WCAG 2 A/AA on the login state: 20 passes, 0 incomplete, 0 violations.
- Browser console errors after the final asset fix: none.
- Mobile horizontal overflow: false.

## Comparison history

### Pass 1

- P2: the JSG mark was valid but Next Image's local optimizer returned an empty
  response in development, leaving a broken mark in the desktop rail.
- Fix: the supplied raster asset now uses direct unoptimized delivery through
  `next/image`.
- Post-fix evidence: `/tmp/tareas-inbox-desktop-final.png` shows the approved
  mark at the top of the forest rail.

### Pass 2

- P2: a simulated dotted paper texture caused contrast analysis to become
  indeterminate on four login texts.
- Fix: removed the CSS-generated texture and retained the approved solid paper
  token.
- Post-fix evidence: Axe reports 0 incomplete and 0 violations.

## Implementation checklist

- [x] Approved visual direction applied to the real multiuser application.
- [x] Existing auth, tenancy, server actions and database contracts preserved.
- [x] Desktop and mobile navigation implemented.
- [x] Login, Inbox, Focus, Next Actions, Projects, Someday, Review and Settings styled.
- [x] Build, lint, unit tests, browser interaction and accessibility checks passed.

## Follow-up polish

- P3: after owner review, labels such as `Next Action` and `Someday` can be
  translated consistently if terminology changes are desired; they remain
  unchanged where they function as established GTD vocabulary.

final result: passed
