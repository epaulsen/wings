import {
    CANVAS,
    ENEMY,
    PLAYER,
    REARM,
    SHAKE,
    STATES,
    WEAPON,
    WORLD,
} from './constants.js';
import { createStateMachine } from './state.js';
import { endFrameInput, initInput, isDown, wasPressed } from './input.js';
import { createCamera, follow } from './camera.js';
import { createWorld, getGroundLevelAt, isOverCarrier, renderBackground } from './world.js';
import { aabb, inRadius } from './collision.js';
import { renderHUD } from './hud.js';
import * as Audio from './audio.js';
import {
    applyDamage,
    canDropBomb,
    canShoot,
    consumeBomb,
    consumeShot,
    createPlayer,
    renderPlayer,
    updatePlayer,
} from './entities/player.js';
import { createBullet, renderBullet, updateBullet } from './entities/bullet.js';
import { createBomb, renderBomb, updateBomb } from './entities/bomb.js';
import { createExplosion, renderExplosion, updateExplosion } from './entities/explosion.js';
import {
    createEnemyPlane,
    renderEnemyPlane,
    updateEnemyPlane,
} from './entities/enemy-plane.js';
import {
    createGroundTargets,
    renderGroundTarget,
    updateGroundTarget,
} from './entities/ground-target.js';
import { createCarrier, renderCarrier } from './entities/carrier.js';
import { createIsland, renderIsland } from './entities/island.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

if (!ctx)
{
    throw new Error('Canvas 2D context unavailable');
}

canvas.width = CANVAS.WIDTH;
canvas.height = CANVAS.HEIGHT;

const game = createGame();
initInput();

Audio.loadSound('gun_fire', '');
Audio.loadSound('bomb_drop', '');
Audio.loadSound('explosion', '');
Audio.loadSound('landing', '');
Audio.loadSound('pickup', '');

let lastTime = 0;
let accumulator = 0;
const TICK = 1 / 60;

requestAnimationFrame(loop);

function createGame()
{
    const state = createStateMachine();
    const carrier = createCarrier();

    return {
        state,
        world: createWorld(),
        camera: createCamera(CANVAS.WIDTH, CANVAS.HEIGHT),
        player: createPlayer(carrier.x + 28, carrier.deckY - PLAYER.HEIGHT),
        carrier,
        island: createIsland(),
        bullets: [],
        enemyBullets: [],
        bombs: [],
        explosions: [],
        enemyPlanes: [],
        groundTargets: createGroundTargets(),
        score: 0,
        takeoffCount: 0,
        rearmTimer: 0,
        shakeFrames: 0,
        titlePlaneX: -120,
        destroyed: {
            troop: 0,
            truck: 0,
            tank: 0,
            enemyPlane: 0,
        },
    };
}

function loop(time)
{
    if (lastTime === 0)
    {
        lastTime = time;
    }

    const dt = Math.min(0.1, (time - lastTime) / 1000);
    lastTime = time;
    accumulator += dt;

    while (accumulator >= TICK)
    {
        update(TICK);
        accumulator -= TICK;
    }

    render();
    endFrameInput();
    requestAnimationFrame(loop);
}

function update(dt)
{
    game.state.update(dt);

    if (game.state.current === STATES.TITLE)
    {
        updateTitle(dt);
        if (wasPressed('Space'))
        {
            game.state.transition(STATES.TAKEOFF);
        }
        return;
    }

    if (game.state.current === STATES.GAME_OVER)
    {
        if (wasPressed('KeyR'))
        {
            resetGame();
        }
        return;
    }

    if (game.state.current === STATES.VICTORY)
    {
        if (wasPressed('Space'))
        {
            resetGame();
        }
        return;
    }

    updatePlayer(game.player, dt, {
        state: game.state,
        carrier: game.carrier,
        input: { isDown },
    });

    if (game.state.current === STATES.TAKEOFF)
    {
        if (!game.player.onGround && game.player.x > game.carrier.x + game.carrier.w + 8)
        {
            game.state.transition(STATES.FLYING);
            game.takeoffCount++;
        }
    }

    if (game.state.current === STATES.REARMING)
    {
        runRearming(dt);
    }

    if (game.state.current === STATES.FLYING)
    {
        handlePlayerFire();
        maybeDropBomb();
    }

    updateProjectiles(dt);
    updateGroundTargets(dt);
    updateEnemies(dt);
    updateExplosions(dt);

    handleCollisions();
    cleanupEntities();

    if (game.player.health <= 0)
    {
        game.state.transition(STATES.GAME_OVER);
    }

    if (game.player.fuel <= 0 && game.player.y + game.player.h >= WORLD.SEA_LEVEL - 2)
    {
        game.state.transition(STATES.GAME_OVER);
    }

    const aliveGroundTargets = game.groundTargets.filter((target) => target.alive).length;
    if (aliveGroundTargets === 0 && game.state.current !== STATES.VICTORY)
    {
        game.state.transition(STATES.VICTORY);
    }

    follow(game.camera, game.player);
}

function updateTitle(dt)
{
    game.titlePlaneX += 220 * dt;
    if (game.titlePlaneX > CANVAS.WIDTH + 120)
    {
        game.titlePlaneX = -120;
    }
}

function handlePlayerFire()
{
    if (!isDown('Space'))
    {
        return;
    }

    if (!canShoot(game.player))
    {
        return;
    }

    consumeShot(game.player);
    Audio.play('gun_fire');

    const angle = game.player.angle;
    const dir = game.player.facing;
    const bulletSpeedX = Math.cos(angle) * WEAPON.BULLET_SPEED * dir;
    const bulletSpeedY = Math.sin(angle) * WEAPON.BULLET_SPEED;

    game.bullets.push(
        createBullet(
            game.player.x + (dir === 1 ? game.player.w : 0),
            game.player.y + game.player.h * 0.5,
            bulletSpeedX,
            bulletSpeedY,
            'player',
            WEAPON.BULLET_DAMAGE
        )
    );
}

function maybeDropBomb()
{
    if (!wasPressed('KeyB'))
    {
        return;
    }

    if (!canDropBomb(game.player))
    {
        return;
    }

    consumeBomb(game.player);
    Audio.play('bomb_drop');
    game.bombs.push(createBomb(game.player));
}

function updateProjectiles(dt)
{
    for (const bullet of game.bullets)
    {
        updateBullet(bullet, dt);
    }

    for (const bullet of game.enemyBullets)
    {
        updateBullet(bullet, dt);
    }

    for (const bomb of game.bombs)
    {
        updateBomb(bomb, dt);
        const ground = getGroundLevelAt(bomb.x);
        if (bomb.y + bomb.h >= ground)
        {
            bomb.alive = false;
            createBombExplosion(bomb.x, ground);
            addShake();
            Audio.play('explosion');
        }
    }
}

function updateGroundTargets(dt)
{
    for (const target of game.groundTargets)
    {
        target.y = getGroundLevelAt(target.x + target.w * 0.5) - target.h;
        updateGroundTarget(target, dt, game);
    }
}

function updateEnemies(dt)
{
    maybeSpawnEnemy();

    for (const enemy of game.enemyPlanes)
    {
        updateEnemyPlane(enemy, dt, game);
    }
}

function maybeSpawnEnemy()
{
    if (game.state.current !== STATES.FLYING)
    {
        return;
    }

    if (game.enemyPlanes.length >= ENEMY.MAX_ENEMIES)
    {
        return;
    }

    const threshold = (game.enemyPlanes.length + 1) * ENEMY.SPAWN_SCORE_STEP;
    if (game.score < threshold && Math.random() > 0.003)
    {
        return;
    }

    const spawnX = WORLD.ISLAND_X + WORLD.ISLAND_WIDTH + 80 + Math.random() * 220;
    const spawnY = 110 + Math.random() * 180;
    game.enemyPlanes.push(
        createEnemyPlane(
            spawnX,
            spawnY,
            WORLD.ISLAND_X - 120,
            WORLD.ISLAND_X + WORLD.ISLAND_WIDTH + 180
        )
    );
}

function updateExplosions(dt)
{
    for (const explosion of game.explosions)
    {
        updateExplosion(explosion, dt);
    }
}

function handleCollisions()
{
    handleBulletHits();
    handleBombSplash();
    handleEnemyAndPlayerCollision();
    handleEnemyBulletsToPlayer();
    handleLandingChecks();
    handleTerrainCrash();
}

function handleBulletHits()
{
    for (const bullet of game.bullets)
    {
        if (!bullet.alive)
        {
            continue;
        }

        for (const target of game.groundTargets)
        {
            if (!target.alive)
            {
                continue;
            }

            if (aabb(bullet, target))
            {
                bullet.alive = false;
                target.health -= bullet.damage;
                if (target.health <= 0)
                {
                    killGroundTarget(target);
                }
                break;
            }
        }

        for (const enemy of game.enemyPlanes)
        {
            if (!bullet.alive || !enemy.alive)
            {
                continue;
            }

            if (aabb(bullet, enemy))
            {
                bullet.alive = false;
                enemy.health -= bullet.damage;
                if (enemy.health <= 0)
                {
                    enemy.alive = false;
                    game.score += ENEMY.SCORE_PLANE;
                    game.destroyed.enemyPlane += 1;
                    game.explosions.push(createExplosion(enemy.x + enemy.w * 0.5, enemy.y + enemy.h * 0.5, 30));
                    Audio.play('explosion');
                }
            }
        }
    }
}

function handleBombSplash()
{
    for (const bomb of game.bombs)
    {
        if (bomb.alive)
        {
            continue;
        }

        for (const target of game.groundTargets)
        {
            if (!target.alive)
            {
                continue;
            }

            const hit = inRadius(
                bomb.x,
                bomb.y,
                target.x + target.w * 0.5,
                target.y + target.h * 0.5,
                WEAPON.BOMB_SPLASH_RADIUS
            );

            if (hit)
            {
                target.health -= WEAPON.BOMB_DAMAGE;
                if (target.health <= 0)
                {
                    killGroundTarget(target);
                }
            }
        }
    }
}

function handleEnemyAndPlayerCollision()
{
    for (const enemy of game.enemyPlanes)
    {
        if (!enemy.alive)
        {
            continue;
        }

        if (aabb(enemy, game.player))
        {
            enemy.alive = false;
            game.explosions.push(createExplosion(enemy.x + enemy.w * 0.5, enemy.y + enemy.h * 0.5, 26));
            const tookDamage = applyDamage(game.player, 25);
            if (tookDamage)
            {
                addShake();
                Audio.play('explosion');
            }
        }
    }
}

function handleEnemyBulletsToPlayer()
{
    for (const bullet of game.enemyBullets)
    {
        if (!bullet.alive)
        {
            continue;
        }

        if (aabb(bullet, game.player))
        {
            bullet.alive = false;
            const tookDamage = applyDamage(game.player, bullet.damage);
            if (tookDamage)
            {
                addShake();
            }
        }
    }
}

function handleLandingChecks()
{
    if (game.state.current !== STATES.FLYING)
    {
        return;
    }

    const player = game.player;
    const centerX = player.x + player.w * 0.5;
    if (!isOverCarrier(centerX) || !player.onGround)
    {
        return;
    }

    const safeSpeed = player.speed <= PLAYER.SAFE_LANDING_SPEED;
    const safeAngle = Math.abs(player.angle) <= PLAYER.SAFE_LANDING_ANGLE;

    if (safeSpeed && safeAngle)
    {
        player.speed = Math.min(player.speed, PLAYER.SAFE_LANDING_SPEED);
        player.facing = 1;
        game.state.transition(STATES.LANDING);
        Audio.play('landing');
    }
    else
    {
        crashPlayer('Hard landing on carrier');
    }
}

function handleTerrainCrash()
{
    if (game.state.current !== STATES.FLYING)
    {
        return;
    }

    const player = game.player;
    const noseX = player.x + (player.facing === 1 ? player.w : 0);
    const groundY = getGroundLevelAt(noseX);

    if (!player.onGround)
    {
        return;
    }

    const unsafeSpeed = player.speed > PLAYER.SAFE_LANDING_SPEED;
    const steepAngle = Math.abs(player.angle) > PLAYER.SAFE_LANDING_ANGLE;
    const onCarrier = isOverCarrier(noseX);

    if ((unsafeSpeed || steepAngle) && !onCarrier)
    {
        crashPlayer('Crashed into terrain');
    }
}

function runRearming(dt)
{
    game.rearmTimer += dt;

    const player = game.player;
    player.fuel = Math.min(PLAYER.MAX_FUEL, player.fuel + REARM.FUEL_RATE * dt);
    player.ammo = Math.min(PLAYER.MAX_AMMO, player.ammo + REARM.AMMO_RATE * dt);
    player.bombs = PLAYER.MAX_BOMBS;

    if (game.rearmTimer >= REARM.DURATION)
    {
        player.health = Math.min(PLAYER.MAX_HEALTH, player.health + REARM.HEALTH_RESTORE);
        game.rearmTimer = 0;
        game.state.transition(STATES.TAKEOFF);
        Audio.play('pickup');
    }
}

function killGroundTarget(target)
{
    target.alive = false;
    game.score += target.score;
    game.destroyed[target.subtype] += 1;
    game.explosions.push(
        createExplosion(target.x + target.w * 0.5, target.y + target.h * 0.5, 22)
    );
    Audio.play('explosion');
}

function createBombExplosion(x, y)
{
    game.explosions.push(createExplosion(x, y, 38));
}

function cleanupEntities()
{
    game.bullets = game.bullets.filter((entity) => entity.alive);
    game.enemyBullets = game.enemyBullets.filter((entity) => entity.alive);
    game.bombs = game.bombs.filter((entity) => entity.alive);
    game.explosions = game.explosions.filter((entity) => entity.alive);
    game.enemyPlanes = game.enemyPlanes.filter((entity) => entity.alive);

    if (game.state.current === STATES.LANDING && game.player.speed <= 10)
    {
        game.state.transition(STATES.REARMING);
        game.rearmTimer = 0;
        game.player.x = game.carrier.x + 36;
        game.player.y = game.carrier.deckY - game.player.h;
    }
}

function crashPlayer()
{
    game.explosions.push(
        createExplosion(game.player.x + game.player.w * 0.5, game.player.y + game.player.h * 0.5, 44)
    );
    addShake();
    game.player.health = 0;
    game.state.transition(STATES.GAME_OVER);
    Audio.play('explosion');
}

function addShake()
{
    game.shakeFrames = SHAKE.DURATION_FRAMES;
}

function render()
{
    ctx.save();

    if (game.shakeFrames > 0)
    {
        const shakeX = (Math.random() * 2 - 1) * SHAKE.INTENSITY;
        const shakeY = (Math.random() * 2 - 1) * SHAKE.INTENSITY;
        ctx.translate(shakeX, shakeY);
        game.shakeFrames -= 1;
    }

    renderBackground(ctx, game.camera, game.world);
    renderIsland(game.island, ctx, game.camera);
    renderCarrier(game.carrier, ctx, game.camera);

    for (const target of game.groundTargets)
    {
        if (target.alive)
        {
            renderGroundTarget(target, ctx, game.camera);
        }
    }

    for (const bomb of game.bombs)
    {
        renderBomb(bomb, ctx, game.camera);
    }

    for (const enemy of game.enemyPlanes)
    {
        renderEnemyPlane(enemy, ctx, game.camera);
    }

    if (game.state.current !== STATES.TITLE)
    {
        renderPlayer(game.player, ctx, game.camera);
    }

    for (const bullet of game.bullets)
    {
        renderBullet(bullet, ctx, game.camera);
    }

    for (const bullet of game.enemyBullets)
    {
        renderBullet(bullet, ctx, game.camera);
    }

    for (const explosion of game.explosions)
    {
        renderExplosion(explosion, ctx, game.camera);
    }

    ctx.restore();

    if (game.state.current === STATES.TITLE)
    {
        renderTitleScreen();
        return;
    }

    renderHUD(ctx, game);

    if (game.state.current === STATES.GAME_OVER)
    {
        renderEndOverlay('GAME OVER', '#ff5f5f', 'Press R to restart');
    }

    if (game.state.current === STATES.VICTORY)
    {
        renderEndOverlay('VICTORY!', '#7dff9b', 'All targets destroyed. Press SPACE');
    }
}

function renderTitleScreen()
{
    ctx.save();
    ctx.fillStyle = 'rgba(3, 6, 15, 0.75)';
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 72px monospace';
    ctx.fillText('WINGS OF FURY', CANVAS.WIDTH * 0.5, 220);

    ctx.font = '24px monospace';
    ctx.fillStyle = '#d8e8ff';
    const blink = Math.floor(performance.now() / 400) % 2 === 0;
    if (blink)
    {
        ctx.fillText('Press SPACE to take off', CANVAS.WIDTH * 0.5, 290);
    }

    ctx.translate(game.titlePlaneX, 360);
    ctx.scale(1.6, 1.6);
    ctx.fillStyle = '#3d4c2e';
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(24, -5);
    ctx.lineTo(30, 0);
    ctx.lineTo(24, 5);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(12, -13);
    ctx.lineTo(17, -13);
    ctx.lineTo(4, 0);
    ctx.lineTo(17, 13);
    ctx.lineTo(12, 13);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function renderEndOverlay(title, titleColor, subtitle)
{
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

    ctx.fillStyle = '#0f121e';
    ctx.fillRect(CANVAS.WIDTH * 0.5 - 220, 140, 440, 320);
    ctx.strokeStyle = '#aab8d4';
    ctx.strokeRect(CANVAS.WIDTH * 0.5 - 220, 140, 440, 320);

    ctx.textAlign = 'center';
    ctx.fillStyle = titleColor;
    ctx.font = 'bold 48px monospace';
    ctx.fillText(title, CANVAS.WIDTH * 0.5, 200);

    ctx.fillStyle = '#f3f6ff';
    ctx.font = '18px monospace';
    ctx.fillText(subtitle, CANVAS.WIDTH * 0.5, 236);

    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${game.score}`, CANVAS.WIDTH * 0.5, 284);
    ctx.fillText(`Troops destroyed: ${game.destroyed.troop}`, CANVAS.WIDTH * 0.5, 316);
    ctx.fillText(`Trucks destroyed: ${game.destroyed.truck}`, CANVAS.WIDTH * 0.5, 342);
    ctx.fillText(`Tanks destroyed: ${game.destroyed.tank}`, CANVAS.WIDTH * 0.5, 368);
    ctx.fillText(`Enemy planes downed: ${game.destroyed.enemyPlane}`, CANVAS.WIDTH * 0.5, 394);

    ctx.restore();
}

function resetGame()
{
    const fresh = createGame();
    Object.assign(game, fresh);
}
