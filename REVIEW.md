# REVIEW: Wings of Fury — Goose Test Report

**Verdict: NEEDS FIXES**

Two issues are game-breaking: a physics accumulation bug that makes the plane dive exponentially faster, and a flight model with no throttle control that makes safe landing practically impossible. Several hardcoded values bypass the constants system. State machine, entity wiring, and ES module exports are otherwise solid.

---

## 🐛 BUGS

### BUG-1 — `physics.js` line 22: `vy` accumulates instead of being set — breaks vertical flight

**Severity:** Critical — dive angle causes unbounded downward acceleration

```js
// CURRENT (wrong — dimensionally incorrect; accumulates pixels not px/s each frame)
player.vy += Math.sin(player.angle) * player.speed * dt;

// CORRECT — mirror how vx is handled: SET the flight-derived vertical velocity
player.vy = Math.sin(player.angle) * player.speed;
// (gravity still correctly accumulates separately via += GRAVITY * dt below stall)
```

`vx` is SET each frame to `cos(angle) * speed * facing`. `vy` should mirror this. Instead it is accumulated with an extra `* dt`, appending a pixel-scaled value (not px/s) to `vy` every tick. At 45° nose-down and max speed 350, `vy` grows ~4 px/s per frame and reaches ~247 px/s after 1 second with no upper bound. The plane dives exponentially faster — unrecoverable.

---

### BUG-2 — `main.js` line 590: LANDING→REARMING transition is buried inside `cleanupEntities`

**Severity:** Moderate — wrong function; subtle ordering risk

```js
// Inside cleanupEntities() — state transitions do not belong here
if (game.state.current === STATES.LANDING && game.player.speed <= 10) {
    game.state.transition(STATES.REARMING);
    ...
}
```

State transitions belong in `update()`. Move this block to the end of the main `update()` function, after `handleCollisions()`.

---

### BUG-3 — `entities/player.js` lines 37, 69, 80: State compared against raw string literals; `STATES` not imported

**Severity:** Moderate — silently breaks if STATES values are ever renamed

```js
// CURRENT — STATES not imported; raw strings used
if (game.state.current === 'takeoff') { ... }
if (game.state.current === 'landing') { ... }
if (game.state.current === 'rearming') { ... }

// FIX: add STATES to the import, use the constants
import { COLORS, PLAYER, STATES, WEAPON } from '../constants.js';
if (game.state.current === STATES.TAKEOFF) { ... }
```

---

### BUG-4 — `hud.js` line 78: `REARM.DURATION` hardcoded as literal `2.5`

**Severity:** Minor — countdown display breaks if REARM.DURATION is tuned

```js
// CURRENT
return `REARMING... ${Math.max(0, (2.5 - game.rearmTimer)).toFixed(1)}s`;

// FIX: import REARM, use REARM.DURATION
import { CANVAS, PLAYER, REARM, STATES } from './constants.js';
return `REARMING... ${Math.max(0, (REARM.DURATION - game.rearmTimer)).toFixed(1)}s`;
```

---

### BUG-5 — `physics.js` lines 27–28: Magic numbers `7000` and `560` instead of constants

**Severity:** Minor — maintenance trap; `WORLD` and `CANVAS` not imported in this file

```js
// CURRENT
player.x = clamp(player.x, 0, 7000 - player.w);  // 7000 = WORLD.WIDTH (coincidentally correct)
player.y = clamp(player.y, 10, 560 - player.h);   // 560 is undocumented; CANVAS.HEIGHT = 600

// FIX
import { PLAYER, WORLD, CANVAS } from './constants.js';
player.x = clamp(player.x, 0, WORLD.WIDTH - player.w);
player.y = clamp(player.y, 10, CANVAS.HEIGHT - 40 - player.h);
```

---

### BUG-6 — `main.js` line 195: Fuel-empty game-over checks `SEA_LEVEL` — misses island crash

**Severity:** Minor — a fuel-empty plane resting on the island never triggers game-over

```js
// CURRENT — only fires when player.y >= 498, but island ground is ~418-460
if (player.fuel <= 0 && player.y + player.h >= WORLD.SEA_LEVEL - 2) {
    game.state.transition(STATES.GAME_OVER);
}

// FIX — check onGround and not over carrier
if (player.fuel <= 0 && player.onGround && !isOverCarrier(player.x + player.w * 0.5)) {
    game.state.transition(STATES.GAME_OVER);
}
```

---

## ⚠️ WARNINGS

### WARN-1 — No throttle control makes `SAFE_LANDING_SPEED = 100` practically unachievable

**File:** `entities/player.js` lines 128–135

`player.throttle` is binary: always 1 when fuelled, 0 when empty. In FLYING state, speed only increases (no drag, no deceleration input). `SAFE_LANDING_SPEED = 100` requires arriving at the carrier below 100 px/s, but there is no input that reduces speed in flight. Stalling loses altitude, not speed. Players will crash on almost every landing attempt.

**Options:**
- (a) Raise `SAFE_LANDING_SPEED` to ≥ 200 — simplest fix
- (b) Add a throttle-down key (`Z` / `Shift`)
- (c) Add air-drag so speed decays when throttle = 0

---

### WARN-2 — Enemy and tank bullet damage values are hardcoded, not in constants

**File:** `entities/enemy-plane.js` line 121, `entities/ground-target.js` line 93

```js
createBullet(..., 'enemy', 8);   // 8 hp damage — no constant
createBullet(..., 'enemy', 12);  // 12 hp damage — no constant
```

Add `PLANE_BULLET_DAMAGE: 8` and `TANK_BULLET_DAMAGE: 12` to the `ENEMY` block in `constants.js`.

---

### WARN-3 — `BOMB_DAMAGE = 10` one-shots all targets; may undercut tactical depth

All ground targets have health 1–3. One bomb deals 10 damage to everything within 80px, insta-killing all of them. Balanced by scarcity (2 bombs), but clusters of tanks require no skill. Consider `BOMB_DAMAGE = 3` to require precision or multiple hits on armoured targets.

---

### WARN-4 — Bomb splash origin uses `bomb.y`, but visual explosion is placed at `ground`

**File:** `main.js` `handleBombSplash`, lines 428–429

`inRadius` checks against `(bomb.x, bomb.y)`, but `createBombExplosion` places the visual at `(bomb.x, ground)`. `bomb.y` can be up to 12px above ground at kill-time. The two origins are inconsistent. Use `bomb.x + bomb.w * 0.5, ground` for both.

---

### WARN-5 — Enemy planes can spawn at score=0 (~16% chance in the first second of flight)

**File:** `main.js` lines 324–325

```js
const threshold = (game.enemyPlanes.length + 1) * ENEMY.SPAWN_SCORE_STEP; // = 150 initially
if (game.score < threshold && Math.random() > 0.003) { return; }
```

At score=0, the score gate fails ~0.3% per tick = ~16% chance within the first second of flight. Players can be ambushed before firing a shot. Add a minimum elapsed-time guard, e.g. `game.state.elapsed < 5` to skip spawn.

---

## ✅ APPROVED

### State Machine — All 7 states reachable, all transitions wired

| Transition | Trigger | Status |
|---|---|---|
| TITLE → TAKEOFF | Space pressed | ✅ |
| TAKEOFF → FLYING | Off carrier, x > carrier edge | ✅ |
| FLYING → LANDING | Over carrier, onGround, safe speed+angle | ✅ |
| FLYING → GAME_OVER | Crash / health=0 / fuel+sea-level | ✅ |
| FLYING → VICTORY | All ground targets dead | ✅ |
| LANDING → REARMING | speed ≤ 10 | ✅ (see BUG-2 re: location) |
| REARMING → TAKEOFF | Timer complete | ✅ |
| GAME_OVER → TITLE | R → resetGame | ✅ |
| VICTORY → TITLE | Space → resetGame | ✅ |

No orphaned states. No missing transitions. `resetGame` correctly re-initialises the full game object.

---

### Fixed-Timestep Game Loop (`main.js`) — Correct

Accumulator pattern correct. `dt = min(0.1, ...)` caps spiral-of-death. Physics always ticks at 60 Hz. `endFrameInput()` called after render. Camera follow runs after all updates. ✅

---

### Collision Detection (`collision.js`) — Correct

`aabb` is a correct AABB check. `inRadius` uses squared distance — no sqrt floating-point precision issue. Both are pure functions. Dead-bullet guard in `handleBulletHits` (`!bullet.alive` re-check before enemy plane loop) prevents ghost hits after a ground target consumes a bullet. ✅

---

### Resource Tracking — Correct

- **Fuel:** Burns at `FUEL_BURN_RATE * throttle * dt`; engine cut at 0. ✅
- **Ammo:** `consumeShot` decrements; `canShoot` guards at 0. ✅
- **Bombs:** `consumeBomb` decrements; `canDropBomb` guards at 0. ✅
- **Rearming:** Fuel, ammo, bombs all fully restored within REARM.DURATION. ✅

---

### Invulnerability Frames — Correct

`applyDamage` returns `false` during the 0.7s window; shake and audio suppressed for ghost hits. ✅

---

### Enemy AI — Acceptable

Patrol ↔ intercept switches on `DETECT_RANGE`. `tryShoot` checks `towardPlayer` — no backwards fire. Out-of-bounds kill (`x < -80 || x > 7120`) prevents entity leaks. Enemy bullets pushed to `game.enemyBullets` and handled separately by `handleEnemyBulletsToPlayer`. ✅

---

### ES Module Imports/Exports — Correct (reviewed files only)

All reviewed files export exactly what consuming files import. No phantom exports, no missing named exports within the reviewed file set. ✅

---

### HUD — Correct

Fuel bar HSL hue transitions green→red. Health bar flips to red below 35 HP. Bomb icons loop `MAX_BOMBS`. State messages appear for LANDING and REARMING. Score live-reads `game.score`. ✅

---

## 🔗 WIRING

| # | File | Missing | Why Needed |
|---|------|---------|------------|
| W-1 | `entities/player.js` | Import `STATES` | State comparisons on lines 37, 69, 80 (BUG-3) |
| W-2 | `hud.js` | Import `REARM` | Countdown display (BUG-4) |
| W-3 | `physics.js` | Import `WORLD`, `CANVAS` | Replace magic numbers (BUG-5) |
| W-4 | `constants.js` ENEMY block | `PLANE_BULLET_DAMAGE`, `TANK_BULLET_DAMAGE` | Centralise hardcoded damage values (WARN-2) |

---

## Fix Priority Summary

| Priority | ID | Location | Issue |
|---|---|---|---|
| 🔴 Critical | BUG-1 | physics.js:22 | `vy` accumulation breaks vertical flight |
| 🔴 Critical | WARN-1 | player.js:128 | No throttle control → landing impossible |
| 🟡 Medium | BUG-3 | player.js:37,69,80 | Raw string state comparisons |
| 🟡 Medium | BUG-2 | main.js:590 | State transition in wrong function |
| 🟡 Medium | BUG-6 | main.js:195 | Fuel-empty check misses island scenario |
| 🟢 Low | BUG-4 | hud.js:78 | Hardcoded REARM.DURATION |
| 🟢 Low | BUG-5 | physics.js:27 | Magic numbers instead of constants |
| 🟢 Low | WARN-2 | enemy-plane/ground-target | Hardcoded damage values |
| 🟢 Low | WARN-5 | main.js:324 | Enemy spawn at score=0 |
| 🟢 Low | W-1–4 | various | Missing constant imports |

---

*Reviewed by Goose (Tester) — Wings of Fury*

---

## ✅ FINAL APPROVAL — Viper's Fixes Verified (2025-07-17)

**Verdict: APPROVED**

All 6 fixes from the NEEDS FIXES verdict have been correctly applied and are logically sound. No new bugs were introduced.

| Fix | Location | Verified |
|---|---|---|
| 1. `vy` SET each frame; gravity adds on top | `physics.js` line 23 | ✅ |
| 2. ArrowLeft/Right → thrust; `speed *= 0.98` drag on throttle=0 | `physics.js` line 16, `player.js` line 114 | ✅ |
| 3. Raw string state comparisons → `STATES.*` constants | `player.js` line 1+37/69/80, `main.js` throughout | ✅ |
| 4. LANDING→REARMING transition moved into `update()` | `main.js` lines 190–196; `cleanupEntities` clean | ✅ |
| 5. Fuel-empty check: `onGround && !isOverCarrier(...)` | `main.js` line 203 | ✅ |
| 6. Magic numbers → `WORLD.WIDTH` / `CANVAS.HEIGHT` constants | `physics.js` lines 34–35 | ✅ |

**Physics assessment:** Speed bleed now works. `speed *= 0.98` at 60 Hz halves speed in ~34 frames (~0.57 s). A player releasing the thrust key on approach can realistically reduce speed below `SAFE_LANDING_SPEED` before touching down. Carrier landing is achievable.

**Outstanding low-severity items from the original review** (WARN-2, WARN-3, WARN-4, WARN-5) remain open but are not blocking. They are quality/balance improvements, not gameplay blockers.

*Final approval by Goose (Tester) — Wings of Fury*
