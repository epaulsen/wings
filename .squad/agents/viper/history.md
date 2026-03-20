## Project Context
Wings of Fury — WWII-style side-scrolling aerial combat game.
Plain JavaScript + HTML Canvas. No frameworks.
Game files live in the `wings/` directory.
User: Erling Paulsen

## Learnings

### 2025-07-17: Game Architecture Defined
- **Module system:** ES modules (`type="module"`), no bundler. Each file exports create/update/render.
- **Game loop:** Fixed-timestep (1/60s) with accumulator pattern. `main.js` owns the loop exclusively.
- **State machine:** 7 states — TITLE, TAKEOFF, FLYING, LANDING, REARMING, GAME_OVER, VICTORY. Simple FSM, one active state.
- **Entity model:** Plain JS objects with type tags. No classes/inheritance. Per-type update/render functions. Entity arrays on a `game` context object.
- **Scrolling:** Horizontal-only camera following player. World is 7000px wide. All positions in world coords; camera offset applied at render time.
- **Physics:** Arcade flight — speed/angle based, gravity stall below threshold, angle-clamped to ±45°. No lift simulation.
- **Collision:** AABB for all pairs, plus radius check for bomb splash damage.
- **Rendering:** Canvas 2D primitives first (rectangles, shapes). Sprites layered in later. Back-to-front draw order.
- **Constants:** All tuning numbers in `constants.js`. Nothing hard-coded in logic.
- **File structure:** 12 top-level modules + 8 entity files in `entities/` subdirectory.
- **Implementation plan:** 7 phases, skeleton→flight→weapons→targets→landing→enemies→polish.

### 2026-03-20: Post-Review Bug Fixes (Goose NEEDS FIXES verdict)
- **BUG-1 (physics.js — critical):** `vy` was accumulated with `+=` and an extra `* dt` factor, causing exponential downward velocity. Root cause: mirroring `vx` assignment incorrectly. Fix: SET `vy = sin(angle) * speed` each frame; gravity then ADDS on top when stalling. This matches how `vx` is handled.
- **WARN-1 (player.js — critical):** Throttle was always 1 when fuelled, making deceleration impossible. `SAFE_LANDING_SPEED = 100` was unreachable. Fix: ArrowLeft/ArrowRight now provide thrust; releasing both keys sets `throttle = 0` and physics applies `speed *= 0.98` drag per tick, bleeding off speed for carrier approach.
- **BUG-3 (player.js — medium):** State comparisons used raw string literals (`'takeoff'`, `'landing'`, `'rearming'`) instead of the `STATES` constants. `STATES` was not even imported. Silently would break if constants are ever renamed. Fix: import `STATES`, use `STATES.TAKEOFF` etc.
- **BUG-2 (main.js — medium):** LANDING→REARMING transition was inside `cleanupEntities()`. State transitions belong in `update()` where ordering is deliberate. Fix: moved block to `update()` after `handleCollisions()`; `cleanupEntities()` now only filters dead entities.
- **BUG-6 (main.js — medium):** Fuel-empty GAME_OVER check only fired when `player.y >= SEA_LEVEL - 2`, missing island ground (~460px). Fix: check `player.onGround && !isOverCarrier(...)` — catches both sea and island scenarios.
- **BUG-5 (physics.js — minor):** Magic numbers `7000` and `560` replaced with `WORLD.WIDTH` and `CANVAS.HEIGHT - 40`. Added `CANVAS` and `WORLD` to physics.js import.
- **Pattern learned:** Flight physics velocity must distinguish SET (base from angle) vs ADD (forces like gravity). Mixing the two creates unbounded accumulation. Always audit += vs = on velocity components.
