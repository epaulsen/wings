# Wings of Fury — Comprehensive Test Plan

**Author:** Goose (Tester)  
**Created:** 2025-03-20  
**Status:** Initial  

---

## Introduction

This test plan covers all critical game mechanics, edge cases, and failure modes for Wings of Fury. Each test includes:
- **What to test** — the specific mechanic or scenario
- **How to trigger it** — step-by-step reproduction
- **Expected result** — what should happen
- **Potential failure mode** — what could go wrong

Tests are organized by subsystem. Run them in order within each section to ensure dependencies are satisfied.

---

## 1. State Machine Transitions

### 1.1 Title → Takeoff
**What:** Game starts in TITLE state, transitions to TAKEOFF on Space key press.
**How:**
1. Load game (page load, requestAnimationFrame running)
2. Press Space key

**Expected:** Game displays title screen message ("Press SPACE to start"), then transitions smoothly to TAKEOFF state. Player begins on carrier deck at rest. HUD displays initial fuel/ammo/health.

**Failure mode:** Title screen missing or unresponsive to Space; crash on state transition; player spawns in wrong location.

---

### 1.2 Takeoff → Flying
**What:** Player accelerates on carrier deck; game auto-transitions to FLYING when airborne and clear of carrier.
**How:**
1. Start in TAKEOFF state (completed 1.1)
2. Observer: Player vehicle moves forward on deck
3. When player y-pos drops below deck level (onGround = false) and x exceeds carrier right edge

**Expected:** State transitions to FLYING. Player is now fully controllable (pitch up/down arrows, gun/bomb fire). Controls remain responsive.

**Failure mode:** Stuck in TAKEOFF; player flies but state never changes; player can roll or pitch before airborne.

---

### 1.3 Flying → Landing
**What:** Player lands on carrier deck; triggers LANDING state.
**How:**
1. In FLYING state, fly back toward carrier
2. Approach carrier deck from the right, descending
3. Land with speed ≤ landing threshold (e.g., 150 px/s) and angle ≈ 0° (level flight)

**Expected:** Player position snaps to carrier deck. State transitions to LANDING. Player velocity resets. Visible landing animation or HUD indicator appears. Sound cue (if audio implemented).

**Failure mode:** Landing detection fails silently; player crashes through deck; landing works at wrong speed threshold; no visual feedback.

---

### 1.4 Landing → Rearming
**What:** Player decelerates on deck and automatically transitions to REARMING.
**How:**
1. Complete landing (1.3)
2. Observe player deceleration on deck (friction or auto-stop)
3. Wait for deceleration to complete (velocity ≤ threshold)

**Expected:** State transitions to REARMING. Rearm timer (2.5s) appears on HUD. Fuel, ammo, bombs, and health begin refilling.

**Failure mode:** Stuck in LANDING; rearm timer doesn't start; fuel/ammo don't increase; player can take off before rearm completes.

---

### 1.5 Rearming → Takeoff
**What:** Rearming completes and state transitions to TAKEOFF.
**How:**
1. Complete REARMING (1.4)
2. Wait for timer to expire

**Expected:** Resources are fully restocked (or capped). State transitions to TAKEOFF. Player ready to accelerate down deck again. No manual input required.

**Failure mode:** Timer doesn't complete; state doesn't transition; resources are partially refilled; player stuck.

---

### 1.6 Flying → Game Over (Health = 0)
**What:** Player health depleted by enemy fire or collision; triggers GAME_OVER.
**How:**
1. In FLYING state, take enough damage (e.g., enemy bullets or crash into ground) to reach health ≤ 0
2. Alternatively: cheat/test by setting `player.health = 0` in dev console

**Expected:** State transitions to GAME_OVER. Screen shows final score. Message displays: "Press R to restart". Player is no longer controllable. No further damage or resource burn occurs.

**Failure mode:** Player continues flying after health = 0; state doesn't change; score is wrong or missing; crash happens instead.

---

### 1.7 Flying → Game Over (Fuel Depleted)
**What:** Player fuel runs out mid-flight; triggers engine failure and eventual crash/death.
**How:**
1. In FLYING state, fly at full throttle until fuel ≤ 0
2. Player will lose altitude due to stall

**Expected:** Fuel depletes. Throttle cuts. Player loses speed and stalls. Nose drops. If altitude too low, player crashes into sea and health drops. State transitions to GAME_OVER. OR if already near sea, immediate crash/death.

**Failure mode:** Fuel doesn't deplete; throttle doesn't cut; player doesn't stall; player floats without fuel.

---

### 1.8 Flying → Victory (All Targets Destroyed)
**What:** Player destroys all ground targets; triggers VICTORY state.
**How:**
1. In FLYING state, destroy all ground targets on island (troops, tanks, trucks) using bullets and bombs
2. Final target destroyed

**Expected:** State transitions to VICTORY. Screen displays congratulations message and final score. Message: "Press SPACE to return to title". Player is no longer controllable. Game does not crash.

**Failure mode:** Victory condition never triggers; wrong number of targets destroyed; crash on state transition; score is wrong.

---

### 1.9 Game Over / Victory → Title
**What:** Player presses R (Game Over) or Space (Victory) to return to title.
**How:**
1. In GAME_OVER state, press R key
2. In VICTORY state, press Space key

**Expected:** State transitions back to TITLE. Title screen redisplays. All entities reset. Score resets. Game ready for new playthrough.

**Failure mode:** State doesn't transition; previous game's entities remain active; score persists; crash on restart.

---

### 1.10 Invalid Transitions (Defensive)
**What:** Game handles attempts to transition to invalid states gracefully.
**How:**
1. In TITLE, try to press arrow keys, Space (correctly handled), or B for bomb
2. In TAKEOFF, press arbitrary keys (only throttle should work)
3. In LANDING, try to turn or fire

**Expected:** Invalid inputs are ignored or handled gracefully. No crashes. No undefined behavior.

**Failure mode:** Unexpected state change; crash; console error.

---

## 2. Player Flight

### 2.1 Takeoff Acceleration
**What:** Player accelerates on carrier deck during TAKEOFF.
**How:**
1. Start TAKEOFF state
2. Observe player movement along deck to the right
3. Monitor throttle = 1.0 (auto-controlled)

**Expected:** Player speed increases at constant rate (ACCELERATION constant). After ~1–2 seconds, player reaches liftoff speed (e.g., 200 px/s). Player lifts off (y decreases, onGround = false).

**Failure mode:** No acceleration; speed is wrong; liftoff doesn't trigger; player overshoots deck and crashes.

---

### 2.2 Pitch Control (Up Arrow)
**What:** Pressing Up arrow pitches nose upward during flight.
**How:**
1. In FLYING, press and hold Up arrow
2. Observe angle and vertical trajectory

**Expected:** Player angle decreases (nose up). Vertical velocity becomes negative. Player climbs. Pitch rate is constant (PITCH_RATE). Angle clamps at -45°.

**Failure mode:** No pitch response; pitch is inverted; angle exceeds ±45° limit; player doesn't climb.

---

### 2.3 Pitch Control (Down Arrow)
**What:** Pressing Down arrow pitches nose downward.
**How:**
1. In FLYING, press and hold Down arrow
2. Observe angle and vertical trajectory

**Expected:** Player angle increases (nose down). Vertical velocity becomes positive. Player descends. Angle clamps at +45°.

**Failure mode:** No pitch response; pitch is inverted; angle exceeds limit; player doesn't descend.

---

### 2.4 Speed Limits
**What:** Player speed is clamped to [0, MAX_SPEED].
**How:**
1. In FLYING, apply full throttle for 10 seconds
2. Monitor player speed via console or HUD

**Expected:** Speed increases to MAX_SPEED (e.g., 400 px/s) and remains constant. No further acceleration. Player cannot exceed max speed.

**Failure mode:** Speed exceeds limit; player accelerates indefinitely; speed becomes negative or NaN.

---

### 2.5 Stall Behavior (Below Stall Speed)
**What:** When speed drops below STALL_SPEED, gravity pulls plane nose down.
**How:**
1. In FLYING, fly upward (pitch nose up) for a few seconds
2. Speed decreases due to gravity
3. When speed < STALL_SPEED, observe nose behavior

**Expected:** Angle increases (nose drops) automatically. Vertical velocity increases (falls faster). Player loses altitude. Must regain speed by pitching down or reducing altitude.

**Failure mode:** Stall doesn't trigger; nose doesn't drop; player floats at low speed; player can climb indefinitely.

---

### 2.6 Speed Gravity (Downward Pull Below Stall)
**What:** Gravity applies additional downward force (vy += GRAVITY * dt) when stalled.
**How:**
1. Reach stall condition (2.5)
2. Maintain low speed (<STALL_SPEED) while nose is up
3. Monitor vertical acceleration

**Expected:** Player descends faster than normal pitch control would produce. Vy increases beyond normal pitch dynamics. Player rapidly loses altitude.

**Failure mode:** Gravity doesn't apply; player falls at normal rate; stall doesn't feel dangerous.

---

### 2.7 Fuel Burn Rate
**What:** Fuel depletes at constant rate during flight.
**How:**
1. In FLYING with full fuel, record initial fuel value
2. Wait 10 seconds at full throttle (1.0)
3. Check fuel value

**Expected:** Fuel decreases by ~10 units (assuming FUEL_BURN_RATE = 1 unit/sec). Depletion is linear and predictable. HUD fuel bar decreases visibly.

**Failure mode:** Fuel doesn't decrease; burn rate is wrong; fuel bar doesn't update; fuel drops to negative.

---

### 2.8 Fuel Depletion → Throttle Cut
**What:** When fuel reaches 0, throttle automatically cuts.
**How:**
1. In FLYING, deplete fuel completely (wait or test with console)
2. When fuel ≤ 0, observe throttle status

**Expected:** Throttle resets to 0. Player speed no longer increases. Player begins to lose speed due to gravity/stall. HUD shows fuel at 0.

**Failure mode:** Throttle doesn't cut; player continues accelerating; fuel shows negative; engine doesn't die.

---

### 2.9 Level Flight (Angle = 0)
**What:** Player maintains horizontal flight at angle = 0.
**How:**
1. In FLYING, level wings (no pitch input)
2. Cruise at stable angle

**Expected:** Angle remains 0. Vertical velocity is 0. Player flies horizontal without climbing or descending. HUD shows level flight indicator (if available).

**Failure mode:** Angle drifts; player climbs or sinks without input; angle oscillates.

---

### 2.10 Turning Left (Facing = -1)
**What:** Pressing Left arrow flips player to face left.
**How:**
1. In FLYING, fly to the right (facing = 1)
2. Press Left arrow
3. Observe player sprite and facing direction

**Expected:** Player flips (sprite mirrors). `facing = -1`. Velocity and angle are preserved. Player continues flight in opposite direction. Subsequent movement is to the left.

**Failure mode:** Player doesn't flip; sprite doesn't mirror; velocity reverses unexpectedly; crashes.

---

### 2.11 Turning Right (Facing = 1)
**What:** Pressing Right arrow flips player to face right.
**How:**
1. In FLYING, fly to the left (facing = -1)
2. Press Right arrow
3. Observe player sprite and facing direction

**Expected:** Player flips. `facing = 1`. Velocity and angle preserved. Subsequent movement is to the right.

**Failure mode:** Player doesn't flip; facing doesn't change; velocity reverses.

---

### 2.12 Altitude Ceiling (Sky Boundary)
**What:** Player cannot fly above y = 0 (top of screen).
**How:**
1. In FLYING, pitch nose up to max angle (-45°)
2. At max speed, maintain level altitude, wait for eventual climb

**Expected:** Player y-coordinate clamps at y = 0 or slightly below. Player cannot escape top of screen. Rendering remains valid.

**Failure mode:** Player flies off screen; y becomes negative; rendering breaks; player stuck above canvas.

---

### 2.13 Sea Boundary (Bottom Collision)
**What:** Player collides with sea when y-coordinate reaches SEA_LEVEL (y ≥ 500).
**How:**
1. In FLYING, descend until altitude approaches sea (y = 500)
2. Do not land on carrier or island first

**Expected:** Player either lands on island/carrier OR crashes into sea. If sea collision: health decreases, player may die or transition to GAME_OVER. Player cannot go below sea surface (y clamped at SEA_LEVEL).

**Failure mode:** Player sinks into sea without crash detection; health doesn't decrease; player falls forever; rendering glitches.

---

### 2.14 World Boundary Left (x = 0)
**What:** Player cannot fly past x = 0 (left edge of world).
**How:**
1. In FLYING, fly toward left edge (x = 0)
2. Approach or reach x = 0

**Expected:** Player x-coordinate clamps at x = 0 or is prevented from going negative. Player cannot leave the world. Camera may clamp to left edge.

**Failure mode:** Player flies off-screen; x becomes negative; rendering breaks; camera shows invalid world.

---

### 2.15 World Boundary Right (x = 7000)
**What:** Player cannot fly past x = 7000 (right edge of world).
**How:**
1. In FLYING, fly toward right edge (x = 7000)
2. Approach or reach x = 7000

**Expected:** Player x-coordinate clamps at x = 7000. Player cannot leave the world. Camera shows right edge.

**Failure mode:** Player flies off-screen; x exceeds limit; rendering breaks.

---

## 3. Weapons — Machine Gun

### 3.1 Gun Fire (Space Key)
**What:** Pressing Space fires a bullet from the player's nose.
**How:**
1. In FLYING, fly toward the island at medium altitude
2. Press Space key once

**Expected:** Single bullet spawns at player's nose position (approximately x = player.x + player.w/2 or similar). Bullet travels in `player.facing` direction at BULLET.SPEED (e.g., 600 px/s). Bullet is visible as a small rectangle. Ammo count decreases by 1.

**Failure mode:** No bullet appears; bullet spawns in wrong location; bullet doesn't move; ammo doesn't decrease; crash.

---

### 3.2 Gun Cooldown
**What:** Gun has a cooldown period (GUN_COOLDOWN) between shots.
**How:**
1. In FLYING, press Space
2. Immediately press Space again
3. Monitor cooldown timer

**Expected:** First bullet fires. Second press is ignored (cooldown active). After ~80ms (GUN_COOLDOWN = 0.08s), next Space press fires. Effective rate: ~12 rounds/sec. HUD or audio cue indicates cooldown (if implemented).

**Failure mode:** Gun fires on every press (no cooldown); cooldown is too long; crash.

---

### 3.3 Continuous Fire (Space Held)
**What:** Holding Space key produces rapid fire (limited by cooldown).
**How:**
1. In FLYING, hold Space key for 1 second

**Expected:** Bullets fire continuously at cooldown rate (~12 rounds/sec). HUD shows ammo decreasing rapidly. Visually, stream of bullets appears on-screen moving away from player.

**Failure mode:** No bullets; single bullet; fire stops; ammo doesn't decrease; game hangs.

---

### 3.4 Ammo Pool Depletion (200 Rounds)
**What:** When all 200 ammo rounds are depleted, no more bullets fire.
**How:**
1. In FLYING, hold Space key for ~20 seconds
2. Ammo decreases from 200 to 0
3. Continue holding Space

**Expected:** Bullets fire continuously until ammo reaches 0. At ammo = 0, Space no longer fires bullets. HUD shows ammo = 0. Game does not crash. Ammo does not go negative.

**Failure mode:** Ammo goes negative; gun fires after ammo depleted; ammo counter shows wrong value; crash.

---

### 3.5 Bullet Spawn Position (Nose of Plane)
**What:** Bullets spawn from player's nose, not center or tail.
**How:**
1. In FLYING, position player above ground target
2. Fire bullets (Space)
3. Observe where bullets originate

**Expected:** Bullets originate from approximately the front of the player sprite (player.x + player.w, not player.x). Bullets fly toward target in facing direction.

**Failure mode:** Bullets spawn at wrong point (center, tail, etc.); bullets fly in wrong direction; bullets collide with player immediately.

---

### 3.6 Bullet Speed and Direction
**What:** Bullets travel at constant speed in player's facing direction.
**How:**
1. Fire bullet facing right (facing = 1)
2. Measure bullet position at t=0 and t=1 second
3. Repeat facing left (facing = -1)

**Expected:** Bullet travels BULLET.SPEED px/sec in facing direction. If facing right, vx = BULLET.SPEED. If facing left, vx = -BULLET.SPEED. Velocity is constant (no acceleration/drag).

**Failure mode:** Speed is wrong; direction is reversed; speed changes over time; bullet curves.

---

### 3.7 Bullet Max Range
**What:** Bullets die after traveling MAX_RANGE distance.
**How:**
1. Fire bullet in empty sky
2. Observe bullet movement
3. After bullet travels ~1500px (example MAX_RANGE), check if bullet is removed

**Expected:** Bullet disappears after MAX_RANGE pixels traveled. Does not crash. Does not extend past world boundary.

**Failure mode:** Bullet persists forever; bullet crashes into world boundary; range is wrong.

---

### 3.8 Bullet Pool Reuse
**What:** Dead bullets are reused (pooled) rather than allocated fresh.
**How:**
1. Fire bullets until max pool (e.g., 30 bullets)
2. Observe active bullet count in array
3. Fire more bullets while old ones die
4. Verify pool remains constant size

**Expected:** Bullet array size remains constant (~30). Old dead bullets are reused (marked alive = true again). No memory leaks. Performance remains consistent.

**Failure mode:** Array grows unboundedly; memory usage increases; old bullets respawn unexpectedly; pool doesn't reuse.

---

## 4. Weapons — Bombs

### 4.1 Bomb Drop (B Key)
**What:** Pressing B key drops a bomb from player position.
**How:**
1. In FLYING, fly over ground target or open area
2. Press B key

**Expected:** Single bomb spawns at player's current position (x ≈ player.x, y ≈ player.y). Bomb is visible as small rectangle. Bomb count decreases by 1 (from 2 to 1). Bomb immediately begins falling with gravity.

**Failure mode:** No bomb appears; bomb spawns in wrong location; bomb count doesn't decrease; bomb doesn't fall.

---

### 4.2 Bomb Gravity and Trajectory
**What:** Dropped bombs inherit player's horizontal velocity and fall with gravity.
**How:**
1. Drop bomb while flying level (angle = 0) at moderate speed
2. Observe bomb trajectory

**Expected:** Bomb has vx = player.vx * 0.8 (inherited, dampened). Bomb has vy = 0 initially. Bomb accelerates downward (vy += BOMB.GRAVITY * dt). Bomb follows parabolic arc. Lands ahead of player position.

**Failure mode:** Bomb spawns at player location and stays there; bomb moves backward; bomb falls straight down; gravity doesn't apply.

---

### 4.3 Bomb Impact and Explosion
**What:** Bomb explodes when hitting ground.
**How:**
1. Drop bomb over island terrain
2. Bomb contacts ground (y ≥ ISLAND_GROUND_Y)

**Expected:** Bomb is removed (alive = false). Explosion entity is created at bomb location. Explosion is visible (expanding orange/yellow circle). All ground targets within SPLASH_RADIUS are damaged or destroyed.

**Failure mode:** Bomb persists; no explosion; explosion in wrong location; targets not damaged; crash.

---

### 4.4 Bomb Splash Radius
**What:** Bomb damage affects all targets within SPLASH_RADIUS (~80px) of impact center.
**How:**
1. Drop bomb near ground target (but not directly on it)
2. Distance from bomb to target center ~70px

**Expected:** Target receives damage/destruction even though bomb didn't collide directly. Damage is applied to all targets within radius. Outside radius, targets unaffected.

**Failure mode:** Radius doesn't work; all targets damaged; no targets damaged; radius is wrong distance.

---

### 4.5 Max Bombs (Limited to 2)
**What:** Player can carry only 2 bombs at a time.
**How:**
1. In FLYING, press B to drop bomb #1
2. Press B to drop bomb #2
3. Press B again (no bombs left)

**Expected:** First two B presses drop bombs. Bomb count: 2 → 1 → 0. Third B press does nothing (no bomb drops, no ammo depletion, no crash).

**Failure mode:** Can drop more than 2 bombs; bomb count goes negative; fourth bomb appears.

---

### 4.6 Bomb Rearm (During Rearming)
**What:** Bomb count resets to 2 during REARMING state.
**How:**
1. Land on carrier, enter REARMING
2. Observe bomb count at start of REARMING (should be 0 if both dropped)
3. Wait for REARMING to complete

**Expected:** Bomb count immediately resets to 2 (or increments during rearming if REARM.AMMO_RATE applies). Upon entering TAKEOFF, player has 2 bombs.

**Failure mode:** Bombs don't rearm; bomb count stays at 0; bombs rearm at wrong rate.

---

### 4.7 Bomb Drop with 0 Bombs
**What:** Pressing B when bomb count = 0 produces no effect.
**How:**
1. Drop both bombs (4.5)
2. Press B key repeatedly

**Expected:** No bomb appears. No error. No crash. No ammo depletion. Game continues normally.

**Failure mode:** Bomb appears anyway; error in console; crash; ammo decreases; undefined behavior.

---

## 5. Weapons — Collision & Damage

### 5.1 Bullet vs Ground Target
**What:** Bullet collides with ground target, damaging it.
**How:**
1. In FLYING, fire bullets at ground target (troop, tank, or truck)
2. Bullet AABB intersects target AABB

**Expected:** Bullet hit registers. Target health decreases (or is destroyed if 1-hit). Bullet is removed (alive = false). Explosion or impact effect occurs. Score increases.

**Failure mode:** Bullet passes through target; target not damaged; bullet persists; no score; crash.

---

### 5.2 Bullet vs Enemy Plane
**What:** Bullet collides with enemy plane.
**How:**
1. Enemy plane spawned and flying
2. Fire bullets at enemy

**Expected:** Bullet collides with enemy AABB. Enemy health decreases. After 2 hits (ENEMY.PLANE_HEALTH = 2), enemy dies. Enemy removed. Bullet removed. Explosion created. Score increases (100 points).

**Failure mode:** Bullet passes through; enemy not damaged; no score; enemy doesn't die after 2 hits.

---

### 5.3 Bomb vs Ground Target
**What:** Bomb splash radius affects ground target.
**How:**
1. Drop bomb near ground target (within splash radius ~80px)

**Expected:** Bomb explodes. Ground target is destroyed (one-hit). Score increases. Explosion appears at bomb location.

**Failure mode:** Target survives; no score; explosion missing; bomb doesn't explode.

---

### 5.4 Bomb Splash Radius Accuracy
**What:** Targets outside splash radius are not affected.
**How:**
1. Drop bomb between two targets
2. One target within 80px, one target > 100px away

**Expected:** Near target destroyed. Far target unharmed. Score increases for one target only.

**Failure mode:** Both targets destroyed; neither destroyed; radius incorrect; crash.

---

### 5.5 Explosion Visual Effect
**What:** Explosion is rendered as expanding circle.
**How:**
1. Trigger bomb explosion or bullet impact
2. Observe explosion animation

**Expected:** Explosion appears as expanding orange/yellow circle. Starts small, grows over ~0.5 seconds. Disappears when animation complete. No collision after explosion ends.

**Failure mode:** No explosion; explosion doesn't expand; explosion persists forever; explosion causes collision after end.

---

## 6. Landing

### 6.1 Perfect Landing (Speed ≤ Threshold, Angle ≈ 0)
**What:** Player lands on carrier with safe speed and level angle.
**How:**
1. In FLYING, fly back toward carrier
2. Approach from right side, descending
3. Pitch nose to level (angle ≈ 0)
4. Reduce speed to ≤ landing threshold (e.g., 150 px/s)
5. Contact carrier deck at speed and angle

**Expected:** Landing registers. State transitions to LANDING. Player position snaps to deck. Velocity resets to 0. Player is visible on deck. HUD shows LANDING state. No damage taken.

**Failure mode:** Landing doesn't register; player crashes through deck; state doesn't change; velocity remains nonzero.

---

### 6.2 Landing Too Fast
**What:** Player attempts landing at speed > threshold.
**How:**
1. Approach carrier deck at high speed (e.g., 300 px/s)
2. Do not slow down before contact

**Expected:** Landing fails. Player crashes on deck. Health decreases. State may transition to GAME_OVER if health reaches 0. Damage is proportional to speed overage. Visual/audio crash effect.

**Failure mode:** Landing succeeds despite high speed; no damage; player lands anyway.

---

### 6.3 Landing Too Steep
**What:** Player attempts landing at angle far from level (e.g., angle = 30°).
**How:**
1. Approach carrier deck while pitched up or down
2. Angle > ±20° (example threshold)

**Expected:** Landing fails. Player crashes on deck or flies past. Health decreases. Crash effect. Does not transition to LANDING state.

**Failure mode:** Landing succeeds despite steep angle; no damage; unexpected state change.

---

### 6.4 Landing on Wrong Surface (Island)
**What:** Player attempts landing on island instead of carrier.
**How:**
1. Approach island terrain at landing speed and angle
2. Contact island ground

**Expected:** Landing fails. Player crashes into island. Health decreases significantly (terrain crash is harder). Crash effect. Player may bounce or explode. State may transition to GAME_OVER.

**Failure mode:** Landing succeeds on island; no damage; unexpected transition.

---

### 6.5 Landing on Wrong Surface (Sea)
**What:** Player attempts landing on sea.
**How:**
1. Descend to sea level (y = SEA_LEVEL)
2. Contact water

**Expected:** No landing. Player crashes into sea. Health decreases. Player may be pulled underwater (removal from game). State may transition to GAME_OVER immediately.

**Failure mode:** Landing succeeds on water; no damage; player floats on water.

---

### 6.6 Landing Deceleration
**What:** During LANDING state, player decelerates on deck.
**How:**
1. Complete landing (6.1)
2. Observe player velocity

**Expected:** Player velocity smoothly decreases to 0. Deceleration is gradual (e.g., friction or drag). After ~1 second, velocity = 0 and player is stopped. State readies to transition to REARMING.

**Failure mode:** No deceleration; player slides off deck; velocity doesn't reach 0; state doesn't transition.

---

## 7. Rearming

### 7.1 Rearming Initiation
**What:** Player enters REARMING state; timer starts.
**How:**
1. Land on carrier (6.1)
2. Complete LANDING state deceleration

**Expected:** State transitions to REARMING. On-screen timer displays (e.g., "Rearming: 2.5s"). Resources begin refilling. Player is immobile on deck. No user input accepted (arrows, space, B don't fire/move).

**Failure mode:** No transition; timer missing; resources don't refill; player can still fly.

---

### 7.2 Fuel Refill Rate
**What:** Fuel refills at FUEL_RATE during REARMING.
**How:**
1. During REARMING, monitor fuel value
2. Record fuel at t=0 and t=1.0 second

**Expected:** Fuel increases by FUEL_RATE (e.g., 50 units/sec). After 2 seconds, fuel increase = ~100 units. Fuel caps at MAX_FUEL (no overfill). HUD fuel bar increases visibly.

**Failure mode:** Fuel doesn't increase; rate is wrong; fuel overshoots max; fuel bar doesn't update.

---

### 7.3 Ammo Refill Rate
**What:** Ammo refills at AMMO_RATE during REARMING.
**How:**
1. Start with depleted ammo (= 0)
2. Enter REARMING
3. Monitor ammo value over 1 second

**Expected:** Ammo increases by AMMO_RATE (e.g., 100 rounds/sec). After 2 seconds, ammo increase = ~200 rounds. Ammo caps at MAX_AMMO (200). HUD ammo counter increases.

**Failure mode:** Ammo doesn't increase; rate is wrong; ammo overshoots max; ammo counter doesn't update.

---

### 7.4 Bomb Reset
**What:** Bombs immediately reset to 2 upon entering REARMING.
**How:**
1. Drop both bombs (bombs = 0)
2. Land and enter REARMING

**Expected:** Bomb count immediately jumps to 2 (not gradually refilled). HUD bomb indicator shows 2. When TAKEOFF begins, player has 2 bombs ready.

**Failure mode:** Bombs don't reset; bombs = 0 during rearming; bombs refill gradually; bombs overshoot 2.

---

### 7.5 Health Restoration
**What:** Player health partially restored during REARMING.
**How:**
1. Damage player during flight (take enemy fire or crash lightly)
2. Health < MAX_HEALTH
3. Land and enter REARMING

**Expected:** Health increases by HEALTH_RESTORE amount (e.g., 30 units). After 2.5 seconds, health is restored (but may not reach MAX_HEALTH). HUD health bar increases.

**Failure mode:** Health doesn't increase; health overshoots max; health bar doesn't update; full health restored (should be partial).

---

### 7.6 Rearming Duration (2.5 seconds)
**What:** REARMING completes after DURATION (e.g., 2.5 seconds).
**How:**
1. Enter REARMING state
2. Wait for timer to count down

**Expected:** Timer ticks from 2.5s → 0s. At timer = 0, state transitions to TAKEOFF. Resources are fully refilled (or at max). Player ready to accelerate down deck.

**Failure mode:** Timer duration is wrong; timer doesn't complete; state doesn't transition; resources partially refilled.

---

### 7.7 No User Input During Rearming
**What:** Arrow keys, Space, and B are ignored during REARMING.
**How:**
1. Enter REARMING
2. Press arrow keys, Space, B repeatedly

**Expected:** No effect. Player doesn't move. No bullets fire. No bombs drop. Game state machine remains in REARMING. Timer continues.

**Failure mode:** Player moves; gun fires; bombs drop; state changes unexpectedly; crash.

---

## 8. Collision Detection

### 8.1 AABB Collision — Bullet vs Target
**What:** Bullet AABB intersects with target AABB.
**How:**
1. Fire bullet at ground target
2. Bullet trajectory passes through target bounding box

**Expected:** Collision registers (aabb() function returns true). Damage applied. Bullet and target lifecycle events trigger.

**Failure mode:** Collision not detected; objects overlap but no collision; false positive collision (no overlap).

---

### 8.2 AABB Collision — Player vs Ground
**What:** Player bounding box intersects with ground/island terrain.
**How:**
1. Fly low and descend toward island

**Expected:** Player y-coordinate is clamped above ground. Player cannot sink into terrain. onGround flag is set to true.

**Failure mode:** Player sinks into ground; onGround not set; y-coordinate goes below ground level; rendering glitches.

---

### 8.3 Bomb Splash Radius (Inradius Check)
**What:** Ground targets within splash radius of bomb center are damaged.
**How:**
1. Drop bomb center at position (x, y)
2. Ground target at distance 70px away

**Expected:** Distance check: sqrt((tx - bx)^2 + (ty - by)^2) ≤ SPLASH_RADIUS. Collision triggers. Damage applied.

**Failure mode:** Targets outside radius damaged; targets inside radius not damaged; radius calculation wrong; no damage.

---

### 8.4 Bullet vs Player (from Enemy)
**What:** Enemy bullet collides with player.
**How:**
1. Enemy plane spawned and firing
2. Enemy bullet travels toward player
3. Bullet AABB intersects player AABB

**Expected:** Collision registers. Player health decreases. Enemy bullet removed. If health ≤ 0, state transitions to GAME_OVER.

**Failure mode:** Collision not detected; player not damaged; bullet persists; no state transition.

---

### 8.5 Player vs Enemy Plane (Ramming)
**What:** Player collides with enemy aircraft.
**How:**
1. Fly directly into enemy plane (AABB overlap)

**Expected:** Collision registers. Both player and enemy take damage. If either health ≤ 0, removal/death occurs. Visual effect (screen shake, explosion).

**Failure mode:** Collision not detected; no damage; unexpected behavior.

---

## 9. Enemy AI

### 9.1 Enemy Plane Spawn
**What:** Enemy planes spawn based on score threshold.
**How:**
1. In FLYING, destroy targets and accumulate score
2. Score reaches spawn threshold (e.g., 200 points)

**Expected:** Enemy plane entity is created. Spawns at random altitude above island. Facing player's general direction. Visible on-screen.

**Failure mode:** Enemy doesn't spawn; spawns in wrong location; spawns underground; crash.

---

### 9.2 Enemy Patrol Bounds
**What:** Enemy planes patrol within defined world bounds.
**How:**
1. Observe enemy plane movement when not engaging player
2. Enemy flies in patrol pattern

**Expected:** Enemy stays within world bounds (x between 0 and 7000). Does not fly off-screen. Patrol is predictable.

**Failure mode:** Enemy flies off-screen; enemy moves at wrong speed; patrol bounds ignored.

---

### 9.3 Enemy Detection Range
**What:** Enemy detects player within DETECT_RANGE (~500px).
**How:**
1. Enemy plane flying (not engaged)
2. Player approaches to within 500px horizontally/vertically

**Expected:** Enemy detects player. AI behavior changes to "intercept" or "attack". Enemy turns toward player. Enemy may fire.

**Failure mode:** Enemy doesn't detect; enemy stays in patrol; detection range wrong.

---

### 9.4 Enemy Intercept Behavior
**What:** When player detected, enemy intercepts (flies toward intercept point).
**How:**
1. Enemy detects player (9.3)
2. Observe enemy trajectory

**Expected:** Enemy calculates intercept point (lead the target). Enemy flies toward intercept. Enemy closes distance to player. Behavior is challenging but not unfair.

**Failure mode:** Enemy flies away; enemy doesn't intercept; intercept point wrong; enemy too fast or too slow.

---

### 9.5 Enemy Shooting
**What:** Enemy planes fire bullets when player is in range.
**How:**
1. Enemy detects and intercepts player
2. Enemy at close range

**Expected:** Enemy fires bullets at player. Cooldown rate: PLANE_SHOOT_COOLDOWN (e.g., 0.5s). Bullets travel from enemy toward player. Bullets match BULLET.SPEED (same as player bullets).

**Failure mode:** Enemy doesn't fire; bullets fire at wrong rate; bullets travel wrong direction; bullets too fast/slow.

---

### 9.6 Enemy Plane Death
**What:** Enemy plane health reaches 0 after 2 hits from player bullets.
**How:**
1. Fire 2 bullets at enemy plane

**Expected:** Each bullet decreases enemy health by 1. After 2 hits, health = 0. Enemy dies (alive = false). Enemy is removed from active list. Explosion created. Score increases by 100.

**Failure mode:** Enemy survives 2 hits; no explosion; no score; enemy doesn't die; crash.

---

## 10. Victory & Defeat

### 10.1 Victory — All Targets Destroyed
**What:** Game triggers victory when all ground targets destroyed.
**How:**
1. In FLYING, destroy all ground targets (troops, tanks, trucks)
2. Final target destroyed

**Expected:** Victory condition checks. State transitions to VICTORY. Screen shows congratulations message. Final score displayed. HUD shows "Press SPACE to return to title". Game does not crash.

**Failure mode:** Victory doesn't trigger; wrong number of targets; crash on transition; score incorrect.

---

### 10.2 Defeat — Health Reaches 0
**What:** Game ends when player health = 0.
**How:**
1. In FLYING, take damage from enemy fire or crash
2. Health decreases to 0

**Expected:** Player dies. State transitions to GAME_OVER. Screen shows score. Message: "Press R to restart". Player ceases responding to input. Game continues running (doesn't crash).

**Failure mode:** Game doesn't end; player can still move; health goes negative; crash.

---

### 10.3 Defeat — Fuel Runs Out
**What:** Game ends if fuel depletes and player crashes into sea.
**How:**
1. In FLYING, deplete fuel completely
2. Player stalls and descends
3. Player sinks below SEA_LEVEL without landing on carrier

**Expected:** Player crashes into sea. Health decreases significantly (or instantly). State transitions to GAME_OVER. Score displayed. Game over message.

**Failure mode:** Game doesn't end; player floats; health doesn't decrease; crash.

---

### 10.4 Score Persistence at Game Over
**What:** Final score is displayed and remains visible.
**How:**
1. Reach GAME_OVER state
2. Observe score on screen

**Expected:** Score is displayed prominently on GAME_OVER screen. Score is correct (sum of all target destructions). Score does not change until next playthrough.

**Failure mode:** Score is missing; score is wrong; score resets immediately.

---

## 11. Edge Cases

### 11.1 Player Flying Past Left World Boundary (x < 0)
**What:** Player approaches x = 0 from the right.
**How:**
1. In FLYING, fly to the left
2. Approach or reach x = 0

**Expected:** Player x-coordinate clamps at 0. Player cannot go left of world edge. Camera may clamp or show ocean. Game continues.

**Failure mode:** Player flies off-screen; x becomes negative; rendering breaks; crash.

---

### 11.2 Player Flying Past Right World Boundary (x > 7000)
**What:** Player approaches x = 7000 from the left.
**How:**
1. Fly to the right toward world edge
2. Reach or exceed x = 7000

**Expected:** Player x-coordinate clamps at 7000. Player cannot go right of world edge. Camera shows right edge. Game continues.

**Failure mode:** Player flies off-screen; rendering breaks; crash.

---

### 11.3 Score Overflow (Very High Score)
**What:** Score accumulates to very large value (e.g., 9999 points).
**How:**
1. Destroy many targets and enemies
2. Play until score is very high

**Expected:** Score continues incrementing without overflow. Display shows full number (no truncation). No integer overflow (int32 max = 2.1 billion, well above reasonable game score).

**Failure mode:** Score wraps to negative; score truncates; HUD display overflows; crash.

---

### 11.4 Entity Pool Exhaustion
**What:** Game handles when bullet pool is exhausted (> 30 active bullets).
**How:**
1. Hold Space key for extended period
2. Fire bullets until pool fills
3. Continue firing

**Expected:** Once pool is full, new fire requests are queued or ignored gracefully. No new bullets appear. No crash. Game continues playable.

**Failure mode:** New bullets spawn anyway (unbounded allocation); memory leak; crash.

---

### 11.5 Canvas Resize (if supported)
**What:** Window or canvas is resized during gameplay.
**How:**
1. Game running in fullscreen or resizable window
2. Resize window

**Expected:** Canvas resizes. Camera viewport adjusts. Rendering remains valid. No gaps or overflow. Game continues playable. HUD redraws correctly.

**Failure mode:** Rendering breaks; HUD misaligned; game crashes; objects disappear.

---

### 11.6 ES Module Import Errors
**What:** Missing or broken ES module imports.
**How:**
1. Remove or corrupt an import statement in main.js or any module
2. Load game in browser

**Expected:** Browser console shows clear error. Game does not load. Error message indicates which module failed. No uncaught exceptions in other modules.

**Failure mode:** Silent failure; partial load; undefined symbols; crash on first game action.

---

### 11.7 Multiple Rapid State Transitions
**What:** Game handles rapid or queued state changes.
**How:**
1. Trigger multiple transitions in quick succession
2. E.g., land, immediately try to take off before rearming completes

**Expected:** State machine ignores invalid transitions. State remains in current valid state. Game does not crash. Subsequent action completes correctly.

**Failure mode:** State becomes invalid; undefined behavior; crash.

---

### 11.8 Collision Detection at High Speed
**What:** At maximum player speed, collision detection remains accurate (no tunneling).
**How:**
1. Fly at MAX_SPEED toward small ground target or bullet
2. Ensure dt is short enough (fixed 60 Hz timestep)

**Expected:** Collision is detected even at high speed. No "tunneling" through objects. Bullet hits target reliably.

**Failure mode:** Collisions missed; bullet passes through target; crash.

---

## 12. Visual / User Experience

### 12.1 HUD Updates — Fuel
**What:** Fuel bar and text update in real-time during flight.
**How:**
1. In FLYING, fly and burn fuel
2. Observe HUD fuel indicator

**Expected:** Fuel bar decreases smoothly. Fuel text displays current value. Bar color may change (e.g., red when low). Updates every frame (60 Hz).

**Failure mode:** HUD doesn't update; fuel bar stuck; text doesn't change; display lag.

---

### 12.2 HUD Updates — Ammo
**What:** Ammo counter updates when firing.
**How:**
1. Fire bullets
2. Observe HUD ammo counter

**Expected:** Ammo count decreases by 1 per bullet. Counter updates every frame. Text is readable.

**Failure mode:** Counter doesn't update; counter lags; display wrong value; crash.

---

### 12.3 HUD Updates — Bombs
**What:** Bomb count displayed and updated on drop/rearm.
**How:**
1. Drop bomb
2. Observe bomb indicator on HUD

**Expected:** Bomb count decreases (2 → 1 → 0). Indicator updates immediately. On rearming, count jumps to 2.

**Failure mode:** Indicator doesn't update; lag; wrong count displayed.

---

### 12.4 HUD Updates — Health
**What:** Health bar updates when player takes damage or is healed.
**How:**
1. Take damage (enemy fire or crash)
2. Observe health bar

**Expected:** Health bar decreases smoothly. Color may indicate low health (e.g., red). Updates each frame. During rearming, bar increases.

**Failure mode:** Bar doesn't update; bar overshoots; color doesn't change; display lag.

---

### 12.5 HUD Updates — Score
**What:** Score counter updates when targets destroyed.
**How:**
1. Destroy ground target or enemy
2. Observe score display

**Expected:** Score increases immediately. New total displayed. Increments are consistent (troops +10, trucks +25, tanks +50, planes +100).

**Failure mode:** Score doesn't update; score increments wrong; display lag; crash.

---

### 12.6 Screen Shake on Explosion
**What:** Camera shakes briefly when bomb explodes.
**How:**
1. Drop bomb and trigger explosion
2. Observe camera movement

**Expected:** Camera position shifts slightly (e.g., ±5px) for ~0.2 seconds. Shake is noticeable but not nauseating. World view recovers smoothly.

**Failure mode:** No shake; shake is too violent; shake persists too long; rendering breaks.

---

### 12.7 Explosion Particle Effect
**What:** Explosion renders as expanding circle with multiple "frames" or particles.
**How:**
1. Trigger explosion
2. Observe visual

**Expected:** Explosion appears as expanding orange/yellow circle. May include secondary particles (sparks, debris). Effect lasts ~0.5 seconds. Smooth and visually satisfying.

**Failure mode:** No effect; static circle; particles missing; effect too brief; animation stutters.

---

### 12.8 Title Screen Animation
**What:** Title screen displays and animates.
**How:**
1. Load game in TITLE state
2. Observe title screen

**Expected:** Title text and "Press SPACE to start" message visible. May include animated elements (pulsing text, scrolling background). Message is clear. Space key is responsive.

**Failure mode:** No title visible; text unreadable; animation missing; Space key not responsive.

---

### 12.9 Game Over Screen Display
**What:** Game over screen shows score and restart prompt clearly.
**How:**
1. Reach GAME_OVER state
2. Observe display

**Expected:** Score displayed prominently. Message "GAME OVER" visible. Prompt: "Press R to restart" is clear. Layout is readable.

**Failure mode:** Screen is blank; score missing; prompt unclear; unreadable font/color.

---

### 12.10 Victory Screen Display
**What:** Victory screen shows victory message and score.
**How:**
1. Destroy all targets, trigger VICTORY
2. Observe display

**Expected:** Congratulations message displayed. Final score shown. Prompt: "Press SPACE to return to title". Layout is clear and celebratory (if intentional).

**Failure mode:** Screen is blank; message missing; score incorrect; prompt unclear.

---

## Summary

This test plan covers all major systems and edge cases for Wings of Fury. Testers should run tests sequentially within each section and verify state transitions, physics, weapons, collision, UI, and gameplay flow. Any failure mode should be escalated to development with reproduction steps and expected behavior clearly documented.

**Total test cases:** 100+  
**Estimated execution time:** 4–6 hours (full manual playthrough)  
**Recommended priority:** All state machine, flight physics, and collision tests are critical path.

---

*Goose has spoken. Maverick, make sure these tests pass before calling it done.*
