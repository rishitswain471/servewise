# ServeWise C1 product shell cleanup

## Goal
Turn the current checkpoint-style interface into a credible food-service operations product shell, following the selected **Subdued command center** direction. Keep this strictly presentation-only: no authentication, persistence, calculations, AI, or other later functionality.

## Changes
- Remove every visible checkpoint, foundation, roadmap, deferred-feature, and implementation-status reference from pages, route descriptions, notifications, menus, and navigation copy.
- Replace the shared documentation-heavy page renderer with clean product layouts: a plain page header, meaningful summary metrics, one or two route-specific work areas, and honest sample/empty content where needed.
- Redesign Today’s Kitchen around demand/preparation context, service status, surplus rescue, recent activity, and an impact snapshot without presenting generated forecasts or calculations.
- Give Demand, Menu & Consumption, Service Day, Surplus Rescue, Safety Gate, Recipients, Impact, Copilot, and Settings distinct workspaces aligned to each job.
- Keep reusable loading, empty, error, status, form, table, and skeleton components in the UI system, but stop rendering them as permanent demonstrations.
- Remove the repeated meal-flow strip everywhere; use a compact contextual service workflow only on Service Day.
- Remove dead actions and simplify Copilot/settings unavailable areas into concise, product-facing empty states.
- Refine the sidebar and top bar to a stable shared grid with consistent icon, label, active-state, profile, search, and mobile alignment.
- Preserve the ServeWise plate/flow/leaf identity and warm-neutral botanical palette, using green selectively.

## Verification
- Search all user-facing source for checkpoint/development terminology.
- Verify root redirect, all ten routes, direct navigation, browser history, 404 handling, sidebar collapse, and mobile menu behavior.
- Check desktop and mobile screenshots for alignment, overflow, content hierarchy, and visible placeholder language.
- Confirm no runtime console errors or failed page resources and let the project harness validate the build.
