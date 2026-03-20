import { WEAPON } from '../constants.js';

export function createBomb(player)
{
    const x = player.x + player.w * 0.5;
    const y = player.y + player.h * 0.7;

    return {
        type: 'bomb',
        x,
        y,
        w: WEAPON.BOMB_W,
        h: WEAPON.BOMB_H,
        vx: player.vx * 0.8,
        vy: 0,
        alive: true,
    };
}

export function updateBomb(bomb, dt)
{
    bomb.vy += WEAPON.BOMB_GRAVITY * dt;
    bomb.x += bomb.vx * dt;
    bomb.y += bomb.vy * dt;
}

export function renderBomb(bomb, ctx, camera)
{
    const x = bomb.x - camera.x;
    const y = bomb.y;

    ctx.save();
    ctx.fillStyle = '#313131';
    ctx.fillRect(x, y, bomb.w, bomb.h);
    ctx.fillStyle = '#bbbbbb';
    ctx.fillRect(x + 1, y + 1, bomb.w - 2, 3);
    ctx.restore();
}
