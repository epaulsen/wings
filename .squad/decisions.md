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
