## Project Context
Wings of Fury — WWII-style side-scrolling aerial combat game.
Plain JavaScript + HTML Canvas. No frameworks.
Game files live in the `wings/` directory.
User: Erling Paulsen

## Learnings

### 2025-03-20: Test Plan Creation — Key Risk Areas

**Critical Path Tests:**
- State machine transitions (7 distinct states, 10 transitions total) — any broken transition breaks the game loop
- Collision detection at high speed — fixed 60 Hz timestep mitigates tunneling but must be verified
- Fuel drain logic — if fuel doesn't cut throttle, game becomes unwinnable

**Balance Concerns:**
- Stall mechanics: Gravity torque below stall speed may feel too punishing or too forgiving; needs tuning
- Enemy intercept AI: If pathfinding overshoots, player may feel cheated. Lead calculation critical.
- Bomb splash radius (80px): May be too large or too small; test with corner cases (targets at radius edge)
- Gun cooldown (0.08s = 12 rds/sec): Verify this feels responsive, not laggy

**Edge Case Risks:**
- Bullet pool exhaustion (max 30 bullets): What happens on 31st bullet? Must handle gracefully
- Score overflow: JS integers are 53-bit safe; unlikely issue but display must handle large numbers
- Canvas resize: Not mentioned as supported in architecture; if added later, camera offset logic must adjust
- ES module load errors: Browser console must be clear; dev team needs good error messages

**Collision Detection Risks:**
- AABB only: Works for arcade game but ground targets may look misaligned if sprite art added later
- Bomb splash inradius check: Avoid floating-point precision issues (use squared distance, not sqrt)
- Enemy vs Player ramming: If both entities die simultaneously, removal order matters; prevent double-score bugs

**Gameplay Flow Observations:**
- Rearming duration (2.5s) feels long — playtesters may perceive pacing issue
- Max bomb count (2) forces resource scarcity but may frustrate players on first playthrough
- Landing speed threshold (e.g., 150 px/s) needs to be communicated to player somehow (tutorials or hints)
- Victory condition (all targets destroyed) is clear; defeat conditions (health=0, fuel=0) need HUD visual cues

**Recommended Debugging Aids:**
- Dev console should show: current state, player position (x, y), speed, fuel, ammo, bombs, enemy count
- Overlay grid or coordinate display useful for collision testing
- Frame counter / FPS meter to catch performance regressions
- Cheat keys (e.g., Ctrl+G for god mode, Ctrl+R for instant refuel) save testing time

### 2025-07-17: Final Approval Check — Viper's Fixes

**Verdict: APPROVED**

All 6 fixes from the NEEDS FIXES verdict were correctly applied by Viper. No regressions introduced.

- `physics.js`: `vy` is now SET (not accumulated) from angle+speed; gravity correctly adds on top only during stall. Critical flight physics bug resolved.
- `player.js`: ArrowLeft/Right provide thrust; `speed *= 0.98` drag in `physics.js` when throttle=0 (no key held). Landing is now achievable — speed halves in ~0.57 s.
- `player.js` + `main.js`: All state comparisons use `STATES.*` constants; `STATES` is properly imported in `player.js`.
- `main.js`: LANDING→REARMING transition correctly lives in `update()` at lines 190–196; `cleanupEntities` only filters entity arrays.
- `main.js`: Fuel-empty game-over uses `onGround && !isOverCarrier(x)`, correctly covering island-stranded scenario.
- `physics.js`: World/canvas bounds use `WORLD.WIDTH` and `CANVAS.HEIGHT - 40` constants, not magic numbers.

**Quality assessment:** Viper's fixes were clean and precise — no scope creep, no new bugs. Code is in a shippable state for the current milestone. Remaining open items (WARN-2 through WARN-5 from original review) are balance/quality improvements, not blockers.

---

### 2025-07-17: Full Code Review — Maverick's Implementation

**Overall quality:** Good structural work. Module boundaries clean, state machine complete, collision detection solid. Two critical bugs block gameplay.

**Critical bugs found:**
1. **`physics.js` BUG-1 (critical):** `player.vy` accumulated with `+= sin(angle) * speed * dt` instead of being SET to `sin(angle) * speed`. Wrong units + wrong operation. The plane accelerates downward unboundedly at any nose-down angle. Fix: change `+=` to `=` and remove the `* dt`.
2. **WARN-1 (critical gameplay):** No throttle control exists. `player.throttle` is binary (1 or 0). `SAFE_LANDING_SPEED = 100` is unreachable — the player has no mechanism to reduce speed in FLYING state. Either raise the constant or add a throttle-down input.

**Moderate bugs:**
- `player.js` compares state with raw string literals (`'takeoff'`, `'landing'`, `'rearming'`); `STATES` is not imported. Fragile.
- LANDING→REARMING state transition lives inside `cleanupEntities()` — wrong function.
- Fuel-empty game-over condition checks `SEA_LEVEL` but island ground is above sea level; plane stranded on island never triggers game-over.

**Minor/constants bugs:**
- `hud.js` hardcodes `2.5` instead of `REARM.DURATION`
- `physics.js` hardcodes `7000`/`560` instead of `WORLD.WIDTH`/`CANVAS.HEIGHT`
- Enemy/tank bullet damage values are magic numbers in entity files, not in `constants.js`

**Confirmed working:**
- State machine: all 7 states reachable, all transitions correctly wired
- Fixed-timestep game loop: accumulator pattern correct
- Collision detection: AABB and inRadius both correct; dead-bullet guard prevents ghost hits
- Resource depletion: fuel, ammo, bombs all drain and refill correctly
- ES module imports/exports: all match between reviewed files
- HUD: all bars and displays correct
- Enemy AI: patrol/intercept, towardPlayer guard, out-of-bounds kill

**Prediction accuracy vs test plan:**
- Correctly predicted vy physics risk (was listed as stall concern)
- `inRadius` correctly uses squared distance (my concern was justified but Maverick got it right)
- Bomb splash radius is fine in code but damage is arguably too high (10 vs max health 3)
- Landing speed threshold concern was accurate — `SAFE_LANDING_SPEED = 100` is too tight


