import { WEAPON } from '../constants.js';

export function createBullet(x, y, vx, vy, owner = 'player', damage = WEAPON.BULLET_DAMAGE)
{
    return {
        type: 'bullet',
        owner,
        x,
        y,
        w: WEAPON.BULLET_W,
        h: WEAPON.BULLET_H,
        vx,
        vy,
        traveled: 0,
        damage,
        alive: true,
    };
}

export function updateBullet(bullet, dt)
{
    const dx = bullet.vx * dt;
    const dy = bullet.vy * dt;
    bullet.x += dx;
    bullet.y += dy;
    bullet.traveled += Math.sqrt(dx * dx + dy * dy);

    if (bullet.traveled >= WEAPON.BULLET_RANGE)
    {
        bullet.alive = false;
    }

    if (bullet.y < -30 || bullet.y > 640)
    {
        bullet.alive = false;
    }
}

export function renderBullet(bullet, ctx, camera)
{
    const x = bullet.x - camera.x;
    const y = bullet.y;

    ctx.save();
    ctx.translate(x, y);
    const angle = Math.atan2(bullet.vy, bullet.vx);
    ctx.rotate(angle);
    ctx.fillStyle = '#ffff44';
    ctx.fillRect(-1, -1, 6, 2);
    ctx.restore();
}
