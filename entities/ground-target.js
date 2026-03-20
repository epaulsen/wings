import { ENEMY } from '../constants.js';
import { createBullet } from './bullet.js';

export function createGroundTargets()
{
    const targets = [];

    targets.push(createTarget('troop', 4220, 0));
    targets.push(createTarget('troop', 4340, 0));
    targets.push(createTarget('troop', 4470, 0));
    targets.push(createTarget('truck', 4620, 0));
    targets.push(createTarget('truck', 4860, 0));
    targets.push(createTarget('tank', 5100, 0));
    targets.push(createTarget('tank', 5400, 0));
    targets.push(createTarget('truck', 5600, 0));

    return targets;
}

export function createTarget(subtype, x, y)
{
    const config = getSubtypeConfig(subtype);

    return {
        type: 'ground_target',
        subtype,
        x,
        y,
        w: config.w,
        h: config.h,
        vx: config.vx,
        alive: true,
        health: config.health,
        maxHealth: config.health,
        patrolVx: config.vx,
        patrolMinX: x - config.patrol,
        patrolMaxX: x + config.patrol,
        shootCooldown: Math.random() * config.cooldown,
        canShoot: config.canShoot,
        score: config.score,
    };
}

export function updateGroundTarget(target, dt, game)
{
    if (!target.alive)
    {
        return;
    }

    if (target.patrolVx !== 0)
    {
        target.x += target.vx * dt;
        if (target.x < target.patrolMinX || target.x > target.patrolMaxX)
        {
            target.vx *= -1;
            target.x = Math.max(target.patrolMinX, Math.min(target.x, target.patrolMaxX));
        }
    }

    if (target.canShoot)
    {
        target.shootCooldown -= dt;
        if (target.shootCooldown <= 0)
        {
            maybeShootTank(target, game);
            target.shootCooldown = ENEMY.TANK_SHOOT_COOLDOWN + Math.random() * 0.7;
        }
    }
}

function maybeShootTank(target, game)
{
    const player = game.player;
    const dx = player.x - target.x;

    if (Math.abs(dx) > ENEMY.TANK_RANGE)
    {
        return;
    }

    if (player.y + player.h > target.y)
    {
        return;
    }

    const magnitude = Math.max(1, Math.hypot(dx, -140));
    const vx = (dx / magnitude) * ENEMY.TANK_BULLET_SPEED;
    const vy = (-140 / magnitude) * ENEMY.TANK_BULLET_SPEED;

    game.enemyBullets.push(
        createBullet(target.x + target.w * 0.5, target.y, vx, vy, 'enemy', 12)
    );
}

function getSubtypeConfig(subtype)
{
    if (subtype === 'tank')
    {
        return {
            w: 30,
            h: 14,
            health: 3,
            vx: 20,
            patrol: 110,
            canShoot: true,
            cooldown: ENEMY.TANK_SHOOT_COOLDOWN,
            score: ENEMY.SCORE_TANK,
        };
    }

    if (subtype === 'truck')
    {
        return {
            w: 34,
            h: 12,
            health: 2,
            vx: 28,
            patrol: 100,
            canShoot: false,
            cooldown: 0,
            score: ENEMY.SCORE_TRUCK,
        };
    }

    return {
        w: 10,
        h: 12,
        health: 1,
        vx: 10,
        patrol: 70,
        canShoot: false,
        cooldown: 0,
        score: ENEMY.SCORE_TROOP,
    };
}

export function renderGroundTarget(target, ctx, camera)
{
    const x = target.x - camera.x;
    const y = target.y;

    if (target.subtype === 'troop')
    {
        ctx.fillStyle = '#1e6e2e';
        ctx.fillRect(x + 3, y + 3, 4, 8);
        ctx.beginPath();
        ctx.arc(x + 5, y + 2, 2, 0, Math.PI * 2);
        ctx.fill();
        return;
    }

    if (target.subtype === 'tank')
    {
        ctx.fillStyle = '#333840';
        ctx.fillRect(x, y + 4, target.w, 10);
        ctx.fillRect(x + 10, y, 10, 6);
        ctx.strokeStyle = '#aaaaaa';
        ctx.beginPath();
        ctx.moveTo(x + 20, y + 3);
        ctx.lineTo(x + 32, y + 3);
        ctx.stroke();
        return;
    }

    ctx.fillStyle = '#556b2f';
    ctx.fillRect(x, y + 3, target.w, 9);
    ctx.fillStyle = '#3a4921';
    ctx.beginPath();
    ctx.arc(x + 6, y + 12, 3, 0, Math.PI * 2);
    ctx.arc(x + target.w - 6, y + 12, 3, 0, Math.PI * 2);
    ctx.fill();
}
