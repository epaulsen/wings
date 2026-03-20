# Wings of Fury — Game Architecture

**Author:** Viper (Lead)
**Date:** 2025-07-17
**Status:** Approved — Maverick, build from this.

---

## 1. File / Module Structure

All files live in `wings/`. We use ES modules (`type="module"` on script tags). No bundler.

```
wings/
├── index.html              # Canvas element, loads main.js as module
├── main.js                 # Entry point: boots game, owns the game loop
├── constants.js            # All tuning numbers in one place
├── state.js                # Game state machine (title → takeoff → flying → …)
├── input.js                # Keyboard input manager
├── camera.js               # Scrolling / viewport logic
├── world.js                # World layout: carrier position, island position, sea level
├── physics.js              # Flight model, gravity, movement helpers
├── collision.js            # AABB & point-in-rect collision routines
├── hud.js                  # HUD rendering (fuel, ammo, bombs, health, score)
├── audio.js                # Sound effect manager (stretch goal)
├── entities/
│   ├── player.js           # Player plane: state, update, render
│   ├── bullet.js           # Machine gun bullet pool
│   ├── bomb.js             # Bomb entity
│   ├── enemy-plane.js      # Enemy aircraft AI + rendering
│   ├── ground-target.js    # Troops, tanks, trucks
│   ├── carrier.js          # Aircraft carrier entity
│   ├── explosion.js        # Explosion / hit effect (particle-lite)
│   └── island.js           # Island terrain (static collidable geometry)
└── assets/                 # (future) sprite sheets, sounds
```

### Ownership rules
- Each file exports functions or a factory; no file reaches into another's internals.
- `main.js` is the only file that calls `requestAnimationFrame`.
- Entity files each export `create()`, `update(entity, dt, ctx)`, and `render(entity, ctx, camera)`.

---

## 2. Game Loop

Fixed-timestep update with variable rendering. This prevents physics from breaking at low frame rates.

```js
// main.js — simplified
const TICK_RATE = 1 / 60;          // 60 Hz physics
let accumulator = 0;
let lastTime = 0;

function loop(timestamp) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    accumulator += Math.min(dt, 0.1); // clamp spiral-of-death

    // Fixed-step updates
    while (accumulator >= TICK_RATE) {
        update(TICK_RATE);
        accumulator -= TICK_RATE;
    }

    render();
    requestAnimationFrame(loop);
}
```

### `update(dt)`
1. Poll input (`input.js`)
2. Run state machine transitions (`state.js`)
3. Update player entity (physics, weapons, fuel burn)
4. Update all active entities (enemies, bullets, bombs, explosions)
5. Run collision detection
6. Remove dead entities
7. Update camera to follow player

### `render()`
1. Clear canvas
2. Draw sky gradient + sea
3. Draw world objects in camera space (carrier, island, ground targets)
4. Draw all entities in camera space
5. Draw HUD (screen space — ignores camera)

---

## 3. State Machine

Game states form a finite state machine. One state is active at a time.

```
TITLE → TAKEOFF → FLYING → LANDING → REARMING → TAKEOFF
                     ↓          ↓
                  GAME_OVER   GAME_OVER
```

```js
// state.js
export const States = {
    TITLE:     'title',
    TAKEOFF:   'takeoff',
    FLYING:    'flying',
    LANDING:   'landing',
    REARMING:  'rearming',
    GAME_OVER: 'game_over',
    VICTORY:   'victory',
};

export function createStateMachine() {
    return {
        current: States.TITLE,
        transition(newState) { this.current = newState; },
    };
}
```

### State descriptions

| State | What happens | Exit condition |
|-------|-------------|----------------|
| `TITLE` | Show title screen, "Press SPACE" | Space pressed → `TAKEOFF` |
| `TAKEOFF` | Player accelerates along carrier deck, auto-lifts at speed | Airborne + cleared carrier → `FLYING` |
| `FLYING` | Full player control, enemies active, weapons enabled | Land on carrier → `LANDING`; health ≤ 0 → `GAME_OVER` |
| `LANDING` | Player decelerating on carrier deck | Stopped → `REARMING` |
| `REARMING` | Refuel, reload ammo/bombs (animated timer ~2s) | Timer done → `TAKEOFF` |
| `GAME_OVER` | Show score, "Press R to restart" | R pressed → `TITLE` |
| `VICTORY` | All ground targets destroyed, show congratulations | Space → `TITLE` |

---

## 4. Entity System

Entities are plain JS objects with a `type` tag. No classes, no inheritance trees — just data + per-type update/render functions.

### Entity shape (base fields every entity has)

```js
{
    type: 'player',          // string tag
    x: 0, y: 0,             // world position (top-left of bounding box)
    w: 64, h: 24,           // bounding box size
    vx: 0, vy: 0,           // velocity
    alive: true,             // dead entities get reaped
    facing: 1,              // 1 = right, -1 = left
}
```

### Entity lists (in main.js game context)

```js
const game = {
    state: createStateMachine(),
    player: null,            // single player entity
    carrier: null,           // single carrier
    island: null,            // island terrain data
    bullets: [],             // pooled, max ~30
    bombs: [],               // max 2 active
    enemyPlanes: [],         // max ~3 active
    groundTargets: [],       // troops, tanks, trucks on island
    explosions: [],          // visual-only, no collision
    score: 0,
};
```

### Entity lifecycle
1. `create()` — factory returns a new entity object
2. Each frame: `update(entity, dt, gameCtx)` — mutates entity in place
3. Each frame: `render(entity, ctx, camera)` — draws to canvas
4. When `entity.alive = false` → spliced from its array after the update pass

---

## 5. Scrolling World

The world is a long horizontal strip. The camera follows the player.

### World layout (left to right)

```
x=0          x=800         x=1600                x=4000        x=5000   x=6000
|            |             |                      |             |        |
[  open sea  ][ CARRIER    ][    open sea          ][ ISLAND              ]
              deck=800w                             terrain=2000w
```

Concrete constants (in `constants.js`):

```js
export const WORLD = {
    WIDTH: 7000,              // total world width in pixels
    SEA_LEVEL: 500,           // y coordinate of water surface
    CARRIER_X: 800,           // carrier left edge
    CARRIER_WIDTH: 400,       // carrier deck length
    CARRIER_DECK_Y: 470,      // top of carrier deck (above sea level)
    ISLAND_X: 4000,           // island left edge
    ISLAND_WIDTH: 2000,       // island width
    ISLAND_GROUND_Y: 460,     // ground level on island
    SKY_HEIGHT: 600,          // canvas height
};
```

### Camera

```js
// camera.js
export function createCamera(canvasWidth, canvasHeight) {
    return { x: 0, y: 0, w: canvasWidth, h: canvasHeight };
}

export function follow(camera, target) {
    // Center on player horizontally, clamp to world bounds
    camera.x = Math.max(0,
        Math.min(target.x - camera.w / 2, WORLD.WIDTH - camera.w));
}

// Convert world coords → screen coords for rendering
export function toScreen(camera, wx, wy) {
    return { x: wx - camera.x, y: wy };
}
```

- All entity positions are in **world coordinates**.
- Rendering subtracts `camera.x` to get screen position.
- Vertical scrolling is NOT used (the world fits vertically in the canvas). The camera only scrolls horizontally.

---

## 6. Physics & Flight Model

Arcade-style. No realistic aerodynamics — this is an action game.

### Player physics fields

```js
{
    // added to base entity fields
    speed: 0,               // scalar speed (pixels/sec)
    angle: 0,               // pitch angle in radians (0 = level, negative = nose up)
    throttle: 1,             // 0..1
    fuel: PLAYER.MAX_FUEL,
    onGround: false,
}
```

### Flight rules

```js
// physics.js
export function updateFlight(player, dt) {
    // Thrust
    player.speed += player.throttle * PLAYER.ACCELERATION * dt;
    player.speed = clamp(player.speed, 0, PLAYER.MAX_SPEED);

    // Gravity pulls nose down when slow (stall)
    if (player.speed < PLAYER.STALL_SPEED && !player.onGround) {
        player.angle += PLAYER.GRAVITY_TORQUE * dt;
        player.vy += PLAYER.GRAVITY * dt;
    }

    // Velocity from speed + angle
    player.vx = Math.cos(player.angle) * player.speed * player.facing;
    player.vy = Math.sin(player.angle) * player.speed;

    // Apply velocity
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // Ground / sea collision
    const groundY = getGroundLevel(player.x);
    if (player.y + player.h >= groundY) {
        player.y = groundY - player.h;
        player.vy = 0;
        player.onGround = true;
    } else {
        player.onGround = false;
    }

    // Fuel burn
    player.fuel -= PLAYER.FUEL_BURN_RATE * dt;
    if (player.fuel <= 0) {
        player.fuel = 0;
        player.throttle = 0; // engine dies
    }
}
```

### Turning / pitch controls
- **Up arrow:** pitch nose up (decrease angle)
- **Down arrow:** pitch nose down (increase angle)
- Pitch rate is constant: `PLAYER.PITCH_RATE` rad/sec
- Angle clamped to ±45° to prevent vertical flight

### Facing direction
- Player can face left or right. Pressing the opposite horizontal direction flips `facing`.
- Flipping is instant (arcade feel). The sprite mirrors horizontally.

### Stall
- Below `STALL_SPEED`, gravity pulls the plane down and forces angle toward positive (nose-down).
- Player must gain speed to recover. This creates risk/reward with altitude.

---

## 7. Collision Detection

All collisions use **Axis-Aligned Bounding Boxes (AABB)**.

```js
// collision.js
export function aabb(a, b) {
    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}
```

### Collision pairs checked each frame

| A | B | Result |
|---|---|--------|
| Bullet | Ground target | Damage target, destroy bullet |
| Bullet | Enemy plane | Damage enemy, destroy bullet |
| Bomb | Ground target | Destroy target (one-hit), create explosion |
| Bomb | Ground (y ≥ groundY) | Create explosion, check splash radius |
| Player | Enemy plane | Damage both |
| Player | Ground (crash) | If speed > safe landing speed → damage/destroy |
| Player | Carrier deck | If speed ≤ landing speed and angle ≈ 0 → land; else crash |
| Enemy bullet | Player | Damage player |

### Bomb splash radius
Bombs don't need pixel-perfect collision. On impact, check all ground targets within `BOMB.SPLASH_RADIUS` (e.g., 80px) of the bomb center.

```js
export function inRadius(ax, ay, bx, by, radius) {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy <= radius * radius;
}
```

---

## 8. Weapons System

### Machine gun

```js
// Part of player entity
{
    ammo: PLAYER.MAX_AMMO,       // e.g., 200 rounds
    gunCooldown: 0,              // seconds until next shot allowed
}
```

- Fire with **Space** (held = continuous fire).
- Cooldown: `WEAPON.GUN_COOLDOWN` (e.g., 0.08s = ~12 rounds/sec).
- Bullets spawn at the player's nose position, travel in `player.facing` direction at `BULLET.SPEED`.
- Bullets are pooled: reuse dead bullet objects instead of allocating new ones.
- Bullets die after `BULLET.MAX_RANGE` pixels traveled or on hit.

### Bombs

```js
{
    bombs: PLAYER.MAX_BOMBS,     // starts at 2
}
```

- Drop with **B** key.
- Bombs fall with gravity (`BOMB.GRAVITY`), inheriting player's horizontal velocity at drop time.
- Bomb trajectory: `vx = player.vx * 0.8`, `vy = 0` initially, `vy += BOMB.GRAVITY * dt`.
- Bombs explode on ground contact. Splash damage to nearby ground targets.
- Bombs replenished during `REARMING` state.

---

## 9. Player Resources

All tracked on the player entity object:

```js
{
    health: PLAYER.MAX_HEALTH,    // e.g., 100
    fuel: PLAYER.MAX_FUEL,        // e.g., 100 (abstract units, burns ~1/sec at full throttle)
    ammo: PLAYER.MAX_AMMO,        // e.g., 200
    bombs: PLAYER.MAX_BOMBS,      // 2
}
```

### Rearming (on carrier)
When state is `REARMING`:
- `fuel` refills at `REARM.FUEL_RATE` per second
- `ammo` refills at `REARM.AMMO_RATE` per second
- `bombs` resets to `MAX_BOMBS` immediately
- `health` restored by `REARM.HEALTH_RESTORE` (partial, not full)
- Rearming lasts `REARM.DURATION` seconds (e.g., 2.5s), then auto-transitions to `TAKEOFF`

### Death conditions
- `health ≤ 0` → plane destroyed, state → `GAME_OVER`
- `fuel = 0` and `altitude ≤ sea level` → crash into sea, state → `GAME_OVER`
- Crash into island terrain at high speed → `GAME_OVER`

---

## 10. Enemy Behaviour

### Ground targets (troops, tanks, trucks)

Stored in `game.groundTargets[]`. Each is a plain entity:

```js
{
    type: 'ground_target',
    subtype: 'tank',           // 'troop' | 'tank' | 'truck'
    x: 4200, y: 448,
    w: 32, h: 16,
    alive: true,
    health: 1,                 // troops: 1hp, tanks: 3hp, trucks: 2hp
    patrolVx: 20,              // pixels/sec, 0 for static
    patrolMinX: 4100,          // patrol bounds
    patrolMaxX: 4400,
    shootCooldown: 0,          // tanks can shoot back
    canShoot: true,            // tanks/troops with guns
}
```

**Behaviour:**
- **Troops:** static or slow patrol, 1 HP, worth 10 points
- **Trucks:** patrol a short range, 2 HP, worth 25 points
- **Tanks:** patrol + shoot upward at player when in range, 3 HP, worth 50 points

Tank shooting: when player is within `ENEMY.TANK_RANGE` (e.g., 300px) horizontally and above, fire a slow bullet upward at `ENEMY.TANK_BULLET_SPEED`.

### Enemy planes

Stored in `game.enemyPlanes[]`:

```js
{
    type: 'enemy_plane',
    x: 0, y: 200,
    w: 48, h: 20,
    vx: 0, vy: 0,
    alive: true,
    health: 2,
    speed: ENEMY.PLANE_SPEED,
    facing: -1,
    ai: 'patrol',             // 'patrol' | 'intercept'
    patrolMinX: 3000,
    patrolMaxX: 5500,
    shootCooldown: 0,
}
```

**AI states:**
- **Patrol:** fly back and forth between `patrolMinX` and `patrolMaxX` at constant altitude.
- **Intercept:** triggered when player enters within `ENEMY.DETECT_RANGE`. Enemy turns toward player, matches altitude loosely, fires machine gun.
- Transitions back to `patrol` if player leaves detect range.
- Max ~3 enemy planes active at once. Spawn from right edge of world when score thresholds are reached.

---

## 11. HUD

Rendered in **screen space** (not affected by camera). Drawn last, on top of everything.

```
┌──────────────────────────────────────────────────────────────┐
│ FUEL [████████░░] 72%    AMMO: 148    BOMBS: ●●    ♥♥♥♥♥   │
│                                                              │
│                                                              │
│                          (game area)                         │
│                                                              │
│                                                    SCORE: 350│
└──────────────────────────────────────────────────────────────┘
```

### HUD elements

| Element | Position | Style |
|---------|----------|-------|
| Fuel gauge | Top-left | Horizontal bar, green→yellow→red |
| Ammo count | Top-center-left | Numeric text |
| Bomb count | Top-center-right | Filled circles (● = available, ○ = used) |
| Health | Top-right | Hearts or a health bar |
| Score | Bottom-right | Numeric text |
| Speed indicator | Bottom-left | Small bar or number (helpful for landing) |
| State messages | Center | "REARMING…", "PRESS SPACE TO START", etc. |

```js
// hud.js
export function renderHUD(ctx, player, score, state) {
    ctx.save();
    // Fuel bar
    const fuelPct = player.fuel / PLAYER.MAX_FUEL;
    ctx.fillStyle = fuelPct > 0.3 ? '#0f0' : '#f00';
    ctx.fillRect(10, 10, 150 * fuelPct, 16);
    ctx.strokeRect(10, 10, 150, 16);

    // Ammo
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText(`AMMO: ${player.ammo}`, 180, 24);

    // Bombs
    for (let i = 0; i < PLAYER.MAX_BOMBS; i++) {
        ctx.fillText(i < player.bombs ? '●' : '○', 320 + i * 18, 24);
    }

    // Score
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${score}`, ctx.canvas.width - 10, ctx.canvas.height - 10);
    ctx.restore();
}
```

---

## 12. Audio (Stretch Goal)

Audio is optional but the hooks should exist from day one.

```js
// audio.js
const sounds = {};

export function loadSound(name, src) {
    const audio = new Audio(src);
    audio.preload = 'auto';
    sounds[name] = audio;
}

export function play(name) {
    const s = sounds[name];
    if (!s) return;
    s.currentTime = 0;
    s.play().catch(() => {}); // ignore autoplay blocks
}
```

**Sound hooks to wire up:**
- `gun_fire` — short burst
- `bomb_drop` — whistle
- `explosion` — boom
- `engine_loop` — continuous, pitch varies with speed
- `landing` — screech
- `pickup` — rearm chime

Maverick: just call `Audio.play('gun_fire')` etc. even if no audio files exist yet. The calls will silently no-op.

---

## 13. Data / Constants File

All magic numbers live in `constants.js`. Nothing is hard-coded in logic files.

```js
// constants.js
export const CANVAS = { WIDTH: 960, HEIGHT: 600 };

export const WORLD = {
    WIDTH: 7000,
    SEA_LEVEL: 500,
    CARRIER_X: 800,
    CARRIER_WIDTH: 400,
    CARRIER_DECK_Y: 470,
    ISLAND_X: 4000,
    ISLAND_WIDTH: 2000,
    ISLAND_GROUND_Y: 460,
};

export const PLAYER = {
    WIDTH: 64,
    HEIGHT: 24,
    MAX_SPEED: 350,            // px/sec
    STALL_SPEED: 80,
    ACCELERATION: 120,         // px/sec²
    PITCH_RATE: 1.8,           // rad/sec
    MAX_PITCH: Math.PI / 4,    // 45 degrees
    GRAVITY: 300,              // px/sec² (when stalling)
    GRAVITY_TORQUE: 0.5,       // rad/sec (nose drops in stall)
    FUEL_BURN_RATE: 2,         // units/sec at full throttle
    MAX_FUEL: 100,
    MAX_HEALTH: 100,
    MAX_AMMO: 200,
    MAX_BOMBS: 2,
    SAFE_LANDING_SPEED: 100,   // max speed for safe carrier landing
    SAFE_LANDING_ANGLE: 0.15,  // max angle (rad) for safe landing
};

export const WEAPON = {
    GUN_COOLDOWN: 0.08,
    BULLET_SPEED: 600,
    BULLET_RANGE: 500,
    BULLET_W: 6,
    BULLET_H: 2,
    BULLET_DAMAGE: 1,
    BOMB_GRAVITY: 400,
    BOMB_SPLASH_RADIUS: 80,
    BOMB_DAMAGE: 10,
    BOMB_W: 8,
    BOMB_H: 12,
};

export const ENEMY = {
    PLANE_SPEED: 200,
    PLANE_HEALTH: 2,
    DETECT_RANGE: 500,
    PLANE_SHOOT_COOLDOWN: 0.5,
    TANK_RANGE: 300,
    TANK_BULLET_SPEED: 200,
    TANK_SHOOT_COOLDOWN: 1.5,
    SCORE_TROOP: 10,
    SCORE_TRUCK: 25,
    SCORE_TANK: 50,
    SCORE_PLANE: 100,
};

export const REARM = {
    DURATION: 2.5,
    FUEL_RATE: 50,            // units/sec
    AMMO_RATE: 100,           // rounds/sec
    HEALTH_RESTORE: 30,       // fixed amount
};

export const COLORS = {
    SKY_TOP: '#87CEEB',
    SKY_BOTTOM: '#E0F0FF',
    SEA: '#1a5276',
    CARRIER: '#555',
    ISLAND_GROUND: '#5a7247',
    PLAYER: '#2c3e50',
    ENEMY_PLANE: '#8b0000',
    HUD_TEXT: '#ffffff',
    HUD_BG: 'rgba(0,0,0,0.4)',
};
```

---

## 14. Rendering Approach

Everything is drawn with Canvas 2D primitives initially — **rectangles and simple shapes**. No sprites in phase 1.

### Draw order (back to front)
1. **Sky** — vertical gradient from `SKY_TOP` to `SKY_BOTTOM`
2. **Sea** — solid rectangle below `SEA_LEVEL`
3. **Island terrain** — filled polygon/rectangle
4. **Carrier** — rectangle with deck detail
5. **Ground targets** — small colored rectangles on island
6. **Bombs** — small dark rectangles
7. **Player plane** — triangle + rectangle body shape
8. **Enemy planes** — similar shapes in red
9. **Bullets** — tiny rectangles
10. **Explosions** — expanding orange/yellow circles
11. **HUD** — text and bars (screen space)

### Player plane shape (primitive)
```js
function drawPlane(ctx, x, y, w, h, facing, color) {
    ctx.save();
    ctx.translate(x + w/2, y + h/2);
    ctx.scale(facing, 1);
    ctx.fillStyle = color;
    // Fuselage
    ctx.fillRect(-w/2, -h/4, w, h/2);
    // Wings
    ctx.fillRect(-w/4, -h/2, w/2, h);
    // Tail
    ctx.fillRect(-w/2, -h/3, 4, h/1.5);
    ctx.restore();
}
```

Sprite support can be layered in later by swapping these draw calls for `drawImage()`.

---

## 15. Input Handling

```js
// input.js
const keys = {};

export function init() {
    window.addEventListener('keydown', e => { keys[e.code] = true; });
    window.addEventListener('keyup', e => { keys[e.code] = false; });
}

export function isDown(code) { return !!keys[code]; }
```

### Key bindings

| Key | Action |
|-----|--------|
| ArrowLeft | Turn to face left / bank left |
| ArrowRight | Turn to face right / bank right |
| ArrowUp | Pitch nose up |
| ArrowDown | Pitch nose down |
| Space | Fire machine gun |
| KeyB | Drop bomb |
| KeyR | Restart (game over screen) |

---

## 16. Suggested Implementation Order

Maverick, build in this order. Each phase should result in something you can see and test.

### Phase 1: Skeleton & Loop (first session)
1. `index.html` — canvas element, load `main.js`
2. `constants.js` — all constants
3. `input.js` — keyboard handler
4. `main.js` — game loop (requestAnimationFrame, fixed timestep)
5. `camera.js` — basic camera that scrolls
6. `world.js` — draw sky, sea, carrier rectangle, island rectangle

**Milestone:** You see a scrolling world with colored rectangles. Arrow keys move a dot.

### Phase 2: Player Flight
7. `entities/player.js` — create, update, render
8. `physics.js` — flight model (speed, angle, gravity, stall)
9. `state.js` — implement TITLE → TAKEOFF → FLYING states

**Milestone:** Player takes off from carrier, flies around, sky scrolls. Stalls if too slow. Can flip direction.

### Phase 3: Weapons
10. `entities/bullet.js` — bullet pool, fire, update, render
11. `entities/bomb.js` — bomb drop, gravity fall, ground detect
12. `entities/explosion.js` — expanding circle effect
13. `collision.js` — AABB routine + splash radius check

**Milestone:** Space fires bullets, B drops bombs, explosions appear on impact.

### Phase 4: Targets & Scoring
14. `entities/ground-target.js` — troops, tanks, trucks on island
15. Wire up collision: bullets/bombs vs ground targets
16. Score tracking + victory condition (all targets destroyed)

**Milestone:** Player can strafe the island, destroy targets, see score. Victory screen appears when all targets are gone.

### Phase 5: Landing & Rearming
17. Carrier landing detection (speed + angle check)
18. `LANDING` → `REARMING` → `TAKEOFF` state flow
19. Fuel burn, ammo depletion, health tracking
20. `hud.js` — fuel bar, ammo count, bombs, health, score

**Milestone:** Full resource loop. Fly out, use ammo, come back, rearm, repeat.

### Phase 6: Enemy Planes
21. `entities/enemy-plane.js` — patrol AI, intercept AI
22. Enemy plane spawning (score-based)
23. Enemy bullets → player collision
24. Player bullets → enemy planes collision

**Milestone:** Enemy planes challenge the player. Full combat loop.

### Phase 7: Polish
25. `entities/carrier.js` — better carrier visuals
26. `entities/island.js` — terrain contour (optional)
27. `audio.js` — sound effects
28. Game feel: screen shake on explosions, death animation, better HUD

---

## Appendix A: World Coordinate Reference

```
y=0 ──────────────────────────────────────── (top of screen / sky)
│
│     Player can fly here (altitude)
│
y=460 ── carrier deck / island ground level
y=500 ── sea level
y=600 ── bottom of canvas (underwater, not visible)

x=0       x=800    x=1200     x=4000    x=6000   x=7000
│         │        │          │         │        │
          carrier              island
```

## Appendix B: Entity Quick Reference

| Entity | File | Pool? | Max active | Has AI? |
|--------|------|-------|------------|---------|
| Player | `entities/player.js` | No (singleton) | 1 | No |
| Bullet | `entities/bullet.js` | Yes | 30 | No |
| Bomb | `entities/bomb.js` | No | 2 | No |
| Enemy Plane | `entities/enemy-plane.js` | No | 3 | Yes |
| Ground Target | `entities/ground-target.js` | No | ~15 | Minimal |
| Explosion | `entities/explosion.js` | No | 10 | No |
| Carrier | `entities/carrier.js` | No (singleton) | 1 | No |
| Island | `entities/island.js` | No (singleton) | 1 | No |

---

*This document is the source of truth. If Maverick has a question about how something should work, the answer is here or should be added here by Viper.*
