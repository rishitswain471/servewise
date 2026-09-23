# ServeWise C1 Product Foundation Plan

## Scope
Build only the C1 frontend/application foundation for ServeWise. No authentication, database, backend APIs, forecasting engine, safety engine, recipient matching, impact calculations, external integrations, or AI responses will be implemented.

## What will change
- Replace the blank home page with an application entry that routes users into the ServeWise shell.
- Add real routes for Dashboard, Demand Lab, Menu / Consumption, Service Day, Surplus Rescue, Safety Gate, Recipients, Impact, ServeWise Copilot, and Settings.
- Add a shared SaaS shell with desktop sidebar, mobile navigation, top header, organization context, profile area, breadcrumbs, page title/subtitle structure, and toast support.
- Establish ServeWise-specific design tokens in the global styles for typography, surfaces, borders, shadows, focus states, and status colors.
- Add a small set of reusable app primitives for page layouts, metrics, states, status indicators, responsive data areas, and confirmation/demo UI patterns.
- Use the existing shadcn-style components already present in the project rather than adding a second UI framework.

## Page foundations
Each route will render a meaningful C1 foundation:
- Dashboard: operational overview, metric area, activity sections, demo/empty states.
- Demand Lab: forecast workspace shell with input/result/explanation placeholders.
- Menu / Consumption: table and analysis workspace foundation.
- Service Day: prepared/served/actual workflow foundation.
- Surplus Rescue: batch workspace, status/filter area, empty state.
- Safety Gate: verification workspace and status visualization with clear future-logic labeling.
- Recipients: management and matching workspace foundation.
- Impact: impact dashboard foundation with future-calculation labeling.
- ServeWise Copilot: chat UI foundation only, no fake AI replies.
- Settings: organization/profile/data settings foundation only.

## Technical details
- Keep TanStack Start routing and file-based route conventions.
- Create one route file for every navigation target.
- Preserve and reuse existing UI primitives where useful.
- Use semantic Tailwind tokens from `src/styles.css`; avoid hardcoded visual color utilities in new app code.
- Add route-level metadata for all content routes.
- Mount the app shell around child routes while keeping root error and not-found boundaries.
- Validate navigation, direct URLs, back/forward behavior, 404 behavior, and mobile overflow with the live preview.

## Out of scope for C1
- Real data persistence
- User accounts and permissions
- Business-rule calculations
- Forecasting/safety/matching/impact engines
- Copilot/Gemini responses
- External weather or operational integrations
