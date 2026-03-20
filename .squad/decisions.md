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
