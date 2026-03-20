import { COLORS, ENEMY, WEAPON } from '../constants.js';
import { createBullet } from './bullet.js';

export function createEnemyPlane(x, y, patrolMinX, patrolMaxX)
{
    return {
        type: 'enemy_plane',
        x,
        y,
        w: 48,
        h: 20,
        vx: -ENEMY.PLANE_SPEED,
        vy: 0,
        alive: true,
        health: ENEMY.PLANE_HEALTH,
        speed: ENEMY.PLANE_SPEED,
        facing: -1,
        angle: 0,
        ai: 'patrol',
        patrolMinX,
        patrolMaxX,
        shootCooldown: 0.3,
    };
}

export function updateEnemyPlane(enemy, dt, game)
{
    enemy.shootCooldown = Math.max(0, enemy.shootCooldown - dt);

    const player = game.player;
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= ENEMY.DETECT_RANGE)
    {
        enemy.ai = 'intercept';
    }
    else
    {
        enemy.ai = 'patrol';
    }

    if (enemy.ai === 'patrol')
    {
        patrol(enemy, dt);
    }
    else
    {
        intercept(enemy, dt, player);
        tryShoot(enemy, game, dx, dy, dist);
    }

    if (enemy.x < -80 || enemy.x > 7120)
    {
        enemy.alive = false;
    }
}

function patrol(enemy, dt)
{
    enemy.vy *= 0.9;
    enemy.angle *= 0.9;

    if (enemy.x <= enemy.patrolMinX)
    {
        enemy.facing = 1;
    }

    if (enemy.x + enemy.w >= enemy.patrolMaxX)
    {
        enemy.facing = -1;
    }

    enemy.vx = enemy.facing * enemy.speed;
    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;
}

function intercept(enemy, dt, player)
{
    enemy.facing = player.x > enemy.x ? 1 : -1;
    const targetY = player.y - 25;
    const yDelta = targetY - enemy.y;

    enemy.vx = enemy.facing * (enemy.speed + 35);
    enemy.vy += Math.max(-120, Math.min(120, yDelta * 1.6)) * dt;
    enemy.vy *= 0.95;

    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;
    enemy.y = Math.max(60, Math.min(350, enemy.y));

    enemy.angle = Math.max(-0.35, Math.min(0.35, enemy.vy / 180));
}

function tryShoot(enemy, game, dx, dy, dist)
{
    if (enemy.shootCooldown > 0 || dist > ENEMY.DETECT_RANGE)
    {
        return;
    }

    const towardPlayer = enemy.facing === 1 ? dx > 0 : dx < 0;
    if (!towardPlayer)
    {
        return;
    }

    const magnitude = Math.max(1, Math.hypot(dx, dy));
    const vx = (dx / magnitude) * WEAPON.BULLET_SPEED * 0.7;
    const vy = (dy / magnitude) * WEAPON.BULLET_SPEED * 0.7;

    const bullet = createBullet(
        enemy.x + enemy.w * 0.5,
        enemy.y + enemy.h * 0.5,
        vx,
        vy,
        'enemy',
        8
    );
    game.enemyBullets.push(bullet);
    enemy.shootCooldown = ENEMY.PLANE_SHOOT_COOLDOWN + Math.random() * 0.35;
}

export function renderEnemyPlane(enemy, ctx, camera)
{
    const sx = enemy.x - camera.x;
    const sy = enemy.y;

    ctx.save();
    ctx.translate(sx + enemy.w * 0.5, sy + enemy.h * 0.5);
    ctx.rotate(enemy.angle);
    ctx.scale(enemy.facing, 1);

    ctx.fillStyle = COLORS.ENEMY;
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.lineTo(18, -5);
    ctx.lineTo(24, 0);
    ctx.lineTo(18, 5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = COLORS.ENEMY_DARK;
    ctx.beginPath();
    ctx.moveTo(-4, -12);
    ctx.lineTo(10, -5);
    ctx.lineTo(2, 0);
    ctx.lineTo(10, 5);
    ctx.lineTo(-4, 12);
    ctx.closePath();
    ctx.fill();

    ctx.fillRect(-24, -6, 6, 12);

    ctx.restore();
}
