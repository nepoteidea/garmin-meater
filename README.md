# Grill Watch — unofficial concept prototype

A clickable web simulator of a meat-probe companion app on a round, Forerunner-970-class watch
(454×454 AMOLED, five side buttons). Visual prototype only: no real Bluetooth and no Connect IQ build.
Tracks [NEP-13](https://linear.app/nepoteidea/issue/NEP-13).

Live at **https://garmin-meater.nepoteidea.com**. Designs: [Garmin Meater designs](https://claude.ai/artifact/3WiN7d4g317RuDSxMcbGj6).

## What it does

- **Connect / Sync**: a probe connected before (kept in `localStorage`) is offered as *Sync MEATER #1*;
  otherwise Searching… → probe found → Connected ✓. A demo toggle makes the search fail to show the error state.
- **Meat**: Beef, Pork, Chicken, Lamb, plus a Settings entry for °C / °F.
- **Doneness**: options per meat from `src/lib/config.ts`; chicken is only offered at 74 °C and pork has no rare options.
- **Cooking**: bezel progress ring, time until remove-from-heat, internal / target / ambient temps, elapsed time.
  States: Estimating → Cooking → **Remove from heat** (full-screen alert + vibration) → Resting → Ready to eat.
  START opens a stop-cook confirmation.
- **Demo controls**: 1× / 10× / 60× speed, jump to remove-from-heat, restart the watch app, forget the saved probe.

### Inputs

| Watch           | Keyboard | Touch                    | Action                                  |
| --------------- | -------- | ------------------------ | --------------------------------------- |
| START/STOP      | Enter    | Tap                      | Select · confirm · start cook · cook menu |
| BACK            | Esc      | Swipe right              | Back · dismiss alert                    |
| UP / DOWN       | ↑ / ↓    | Swipe down / up          | Move selection                          |
| LIGHT           | —        | —                        | Press animation (backlight flash)       |

## Simulation

Internal temperature follows an exponential approach toward a ~180 °C ambient (with small deterministic noise).
Remove-from-heat fires 3 °C below target; a 6-minute rest carries the temperature up to land on target.
The ETA comes from the same curve and is hidden for the first 5 minutes (“Estimating”). All constants live in `SIM`
in `src/lib/config.ts`.

## Getting started

```sh
npm install
npm run dev
```

| Script                  | What it does                                   |
| ----------------------- | ---------------------------------------------- |
| `npm run dev`           | Start the dev server                           |
| `npm run build`         | Production build into `dist/`                  |
| `npm run preview`       | Serve the production build                     |
| `npm run check`         | Type-check Svelte and TypeScript               |
| `npm test`              | Run the test suite once                        |
| `npm run test:coverage` | Run tests with coverage and enforce thresholds |

## Project layout

```
src/
  lib/config.ts        Meats, doneness targets, simulation constants
  lib/sim.ts           Pure cook simulation (curve, phases, ETA) and formatting
  lib/machine.ts       Pure screen/cook state machine (reducer over input events)
  lib/storage.ts       Guarded localStorage for the saved probe and units
  lib/Watch.svelte     Watch frame, side buttons, touch gestures, scaling
  lib/Screen.svelte    The 454×454 round display for every screen
  lib/CookView.svelte  Cooking / resting / ready screens
  lib/DemoPanel.svelte Demo controls outside the watch
  App.svelte           Page layout, timers, keyboard, vibration
```

## Deployment

Cloudflare Workers static assets (Worker `garmin-meater`, see `wrangler.jsonc`). GitHub Actions run check + tests +
build on every push and PR; pushes to `main` run `wrangler deploy`, and same-repo PRs get a preview URL comment.
The workflow uses the `CLOUDFLARE_API_TOKEN` nepoteidea org secret; Wrangler infers the account from that account-scoped token.

---

Unofficial concept prototype. Not affiliated with, or endorsed by, any watch or meat-probe maker.
