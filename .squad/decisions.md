# Team Decisions

## Active Decisions

### 2026-03-20: Project Kickoff
**By:** Erling Paulsen  
**What:** Build a Wings of Fury-style side-scrolling aerial combat game in plain JavaScript/HTML  
**Details:**
- Player controls a WWII-era aeroplane starting on an aircraft carrier at sea
- Flies toward an island with troops, tanks, and trucks as targets
- Weapons: machine gun (limited bullets) + 2 bombs
- Fuel is limited — must return to carrier to refuel and rearm
- Occasional enemy aircraft to engage
- No frameworks — plain JavaScript + HTML Canvas only
# Architecture Decisions — Viper (2025-07-17)

## Decision: ES Modules, No Bundler
All JS files use ES module imports. Loaded via `<script type="module">` in index.html. No build step.

## Decision: Fixed-Timestep Game Loop
60 Hz physics with accumulator pattern. Prevents physics breakage at low FPS. `main.js` is the sole owner of requestAnimationFrame.

## Decision: Plain Objects for Entities
No classes, no ECS framework. Entities are plain JS objects with a `type` tag. Per-type functions (create/update/render) operate on them. Simple, debuggable, zero overhead.

## Decision: Horizontal-Only Scrolling
World is 7000px wide, canvas height fits the full vertical range. Camera tracks player X only. World coords used everywhere; camera offset applied only during rendering.

## Decision: Arcade Flight Model
Speed + angle based. Gravity pulls nose down below stall speed. Angle clamped ±45°. No lift coefficient, no drag curve. Feels like Wings of Fury, not a sim.

## Decision: All Constants in One File
`constants.js` holds every tuning number. No magic numbers in logic files. Makes balancing easy — one file to tweak.

## Decision: 7-Phase Implementation Order
Skeleton → Player Flight → Weapons → Targets & Scoring → Landing & Rearming → Enemy Planes → Polish. Each phase produces a testable milestone.

## Decision: Canvas 2D Primitives First
No sprites in phase 1. Everything rendered with fillRect, simple shapes, and gradients. Sprite support swapped in later via drawImage.

# Implementation Decisions — Maverick (2026-03-20)

## Scope Completed
Implemented all seven architecture phases for `wings/` in plain JavaScript ES modules and HTML Canvas, including full gameplay loop, state machine, entities, collisions, weapons, enemy AI, rearming flow, HUD, audio hooks, and visual polish.

## Key Technical Decisions

1. **Entity model remained plain objects**
   - Every entity uses a flat object with `type`, transform, physics, and gameplay fields.
   - Kept update/render logic in per-entity modules for clarity and low coupling.

2. **Single owner game loop in `main.js`**
   - Fixed timestep 60Hz with accumulator and dt clamping to prevent unstable physics.
   - Centralized update order: input/state → player → entities → collisions → cleanup → camera.

3. **Landing and crash logic tuned for game feel**
   - Carrier landing only succeeds when speed and angle are within safe thresholds.
   - Unsafe touchdowns or terrain impacts force a crash/game-over path with explosion + shake.

4. **Visual quality-first Canvas primitives**
   - Implemented gradient sky, parallax clouds, patterned sea, shaped planes, detailed carrier/island, and multi-layer explosion effects.
   - Prioritized clear silhouette readability while staying sprite-free per architecture.

5. **Enemy combat behavior split by role**
   - Ground units use subtype configs (troop/truck/tank) with patrol + optional anti-air fire.
   - Enemy planes switch between patrol and intercept based on player detect range.

6. **Resource and progression wiring**
   - Full fuel/ammo/bombs/health tracking with rearming restoration rates and timer.
   - Score bookkeeping by subtype and victory condition when all ground targets are dead.

7. **Audio hooks implemented without asset dependency**
   - Added procedural WebAudio fallback tones mapped to expected event names (`gun_fire`, `explosion`, etc.) so `play()` calls are functional now and swappable later.

## Validation Performed
- Ran JavaScript syntax validation across all game modules with `node --check`.
- No pre-existing project test/lint harness exists in `wings/`; syntax validation used as implementation verification.

# Bug Fixes — Viper (2026-03-20)

Applied after Goose issued a **NEEDS FIXES** verdict on Maverick's implementation.

## Fixes Applied

### BUG-1 — physics.js: `vy` accumulation (Critical)
**Was:** `player.vy += Math.sin(player.angle) * player.speed * dt;`  
**Now:** `player.vy = Math.sin(player.angle) * player.speed;` (SET each frame)  
Gravity (`+= PLAYER.GRAVITY * dt`) still adds on top when stalling. Reordered so the SET happens before the gravity conditional. Extra `* dt` factor removed — `vy` is a velocity (px/s), not a displacement.

### WARN-1 — player.js: No deceleration (Critical)
**Was:** `throttle` always 1 when fuelled; no drag. `SAFE_LANDING_SPEED = 100` unachievable.  
**Now:** ArrowLeft/ArrowRight apply thrust (throttle = 1). Releasing both sets throttle = 0. physics.js applies `speed *= 0.98` drag per tick when throttle is 0, bleeding off ~65% speed over 2 seconds. Landing is now achievable by easing off keys before the carrier.

### BUG-3 — player.js: Raw string state comparisons (Medium)
**Was:** `game.state.current === 'takeoff'` etc.; `STATES` not imported.  
**Now:** `STATES` imported from `../constants.js`; all three comparisons use `STATES.TAKEOFF`, `STATES.LANDING`, `STATES.REARMING`.

### BUG-2 — main.js: State transition in `cleanupEntities` (Medium)
**Was:** LANDING→REARMING block inside `cleanupEntities()`.  
**Now:** Moved to `update()` immediately after `handleCollisions()`. `cleanupEntities()` only filters dead entities.

### BUG-6 — main.js: Fuel-empty check misses island (Medium)
**Was:** `player.fuel <= 0 && player.y + player.h >= WORLD.SEA_LEVEL - 2` — only fires over sea.  
**Now:** `player.fuel <= 0 && player.onGround && !isOverCarrier(player.x + player.w * 0.5)` — fires on any ground not the carrier deck.

### BUG-5 — physics.js: Magic numbers (Minor)
**Was:** `7000 - player.w` and `560 - player.h` hard-coded.  
**Now:** `WORLD.WIDTH - player.w` and `CANVAS.HEIGHT - 40 - player.h`. Added `CANVAS` and `WORLD` to import.

## Files Modified
- `wings/physics.js`
- `wings/entities/player.js`
- `wings/main.js`

## Syntax Validation
All four files pass `node --check` with exit code 0.

---

# Review Verdict — Goose (2026-03-20)

**Date:** 2026-03-20  
**Reviewer:** Goose (Tester)  
**Verdict:** APPROVED ✅  
**Full report:** `/wings/REVIEW.md`

All six bugs fixed by Viper. Game is now playable with proper physics, deceleration, state management, and fuel checks. Ready for deployment.

# Marketing README — BeanBag (2026-03-20)

**Date:** 2026-03-20  
**Author:** BeanBag (Marketing Specialist)  
**Status:** COMPLETE ✅

## Decision: Tagline & Emotional Hook

**Tagline:** "Fire up. Take off. Come back alive."

**Rationale:** 
- Captures mission-critical tension (the core gameplay loop)
- Mirrors the three phases: preparation → action → landing
- Short, punchy, era-appropriate (WWII pilot speak)
- Emphasizes the procedural challenge of landing—a unique selling point vs other arcade shooters

## Decision: Feature Translation to Player Benefits

**Approach:** 
Translated every technical feature into emotional/gameplay benefit:

- ❌ "200-round machine gun" 
- ✅ "Unleash 200 rounds of tracer fire"

- ❌ "Limited fuel system"
- ✅ "Every second of throttle matters. Turn back too late and you're ditching in the Pacific"

- ❌ "Carrier landing logic"
- ✅ "Master the procedural challenge of launching from a pitching deck and threading the needle on return"

**Why:** Players want to feel the experience, not read technical specs.

## Decision: SVG Screenshot Approach

**Rationale:**
- Game is a browser canvas, no built-in screenshot system
- SVG is lightweight, scalable, version-controllable (unlike PNG/JPG)
- Pixel-art aesthetic matches the game's visual simplicity
- Each screenshot tells a story:
  1. **Title Screen** — Fantasy/aspiration (stars, gold text, silhouette)
  2. **Combat** — Intensity (tracers, explosions, HUD density)
  3. **Island** — Tactical depth (ground targets, strafing geometry)
  4. **Carrier** — Precision skill (landing vectors, fuel critical)

**Color Palette:** Used game constants:
- Sky: `#1a1a4e` (top) → `#87CEEB` (horizon)
- Sea: `#0d3b6e` (deep)
- Island: `#5a7247` (olive terrain)
- Player: `#3d4c2e` (silhouette)
- Enemy: `#8b1a1a` (red)

## Decision: README Structure

**Order:** Story → Features → Controls → Getting Started → Tips → Scoring → Tech → Development

**Why this order:**
1. Hook with **About** (mission narrative)
2. Sell the **Features** (show breadth)
3. **Controls** (remove friction)
4. **How to Play** (get them in the game NOW)
5. **Tips** (make them feel expert-adjacent)
6. **Scoring** (clarity on progression)
7. **Tech** (brief, for other devs)

**Tone:** Arcade box copy + modern indie game landing page. Short punchy sentences mixed with atmosphere.

## Decision: Tips & Tricks Section

**Included 6 tactical tips:**
1. Fuel management
2. Approach geometry
3. Strafing vs circling
4. Landing technique
5. Bomb strategy
6. Enemy plane trade-off

**Why:** Makes the player feel like they have agency and expertise before they even launch the game. Reduces "I don't know what I'm doing" frustration. Classic arcade strategy guide vibe.

## Decision: Minimal Technical Section

**What was cut:**
- ES modules deep dive
- Build system explanation
- Asset pipeline details

**What was kept:**
- "Vanilla JavaScript + ES modules + HTML Canvas"
- "No frameworks, no build step, no dependencies"
- "Fixed 60 Hz physics"
- Link to `constants.js` for tweaking

**Why:** Players don't care about the tech stack. Devs who fork the game will read the code. This section is just enough to convey "it's simple and runs everywhere."

## Decision: Scoring Table

**Visible progression loop:**
- Troop: 10 pts
- Truck: 25 pts
- Tank: 50 pts
- Enemy Plane: 100 pts

**Why:** 
- Clarifies the risk/reward of different targets
- Makes progression **visible and understandable**
- Explains why tanks feel better to hunt than troops

## Artifacts Created

1. `/wings/README.md` — New marketing README (replaced old technical stub)
2. `/wings/assets/screenshots/screenshot-1-title.svg` — Title screen
3. `/wings/assets/screenshots/screenshot-2-combat.svg` — Combat scene
4. `/wings/assets/screenshots/screenshot-3-island.svg` — Island strafing
5. `/wings/assets/screenshots/screenshot-4-carrier.svg` — Carrier landing

All files use game palette and maintain pixel-art aesthetic.
