## Project Context
Wings of Fury — WWII-style side-scrolling aerial combat game.
Plain JavaScript + HTML Canvas. No frameworks.
Game files live in the `wings/` directory.
User: Erling Paulsen

## Learnings

- Implemented full Wings of Fury architecture in ES modules with fixed-step loop (60Hz), state machine (title/takeoff/flying/landing/rearming/game over/victory), and complete entity lifecycle.
- Used plain-object entities + per-module create/update/render functions for player, weapons, explosions, enemies, carrier, island, and targets to keep logic decoupled and readable.
- Added polished visual pipeline: sky gradient, sea wave highlights, parallax clouds, detailed carrier/island silhouettes, stylized aircraft, multi-ring particle explosions, HUD overlays, and shake feedback.
- Implemented gameplay-critical rules: landing safety checks (speed+angle), rearm/refuel flow, enemy patrol/intercept AI, tank anti-air fire, bomb splash damage, scoring, and victory when all ground targets are destroyed.
- Added lightweight audio hooks with no-op-safe procedural beeps so gameplay events still trigger consistent sound calls even without assets.
