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

