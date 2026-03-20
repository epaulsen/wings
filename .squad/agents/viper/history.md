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

