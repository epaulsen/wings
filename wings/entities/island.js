import { COLORS, WORLD } from '../constants.js';

export function createIsland()
{
    return {
        type: 'island',
        x: WORLD.ISLAND_X,
        y: WORLD.ISLAND_GROUND_Y,
        w: WORLD.ISLAND_WIDTH,
        h: 120,
    };
}

export function updateIsland()
{
}

export function renderIsland(island, ctx, camera)
{
    const x = island.x - camera.x;
    const y = island.y;

    ctx.save();

    ctx.fillStyle = COLORS.BEACH;
    ctx.beginPath();
    ctx.moveTo(x - 20, y + 40);
    ctx.quadraticCurveTo(x + 16, y + 8, x + 80, y + 18);
    ctx.lineTo(x + 70, y + 60);
    ctx.lineTo(x - 20, y + 60);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = COLORS.ISLAND;
    ctx.beginPath();
    ctx.moveTo(x, y + 45);
    ctx.bezierCurveTo(x + 260, y - 10, x + 560, y - 35, x + 820, y - 10);
    ctx.bezierCurveTo(x + 1120, y + 8, x + 1450, y - 25, x + 1780, y + 4);
    ctx.lineTo(x + island.w, y + 120);
    ctx.lineTo(x, y + 120);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#2f5b2a';
    for (let i = 0; i < 18; i++)
    {
        const tx = x + 90 + i * 98;
        const ty = y + 10 + Math.sin(i * 0.8) * 9;
        ctx.beginPath();
        ctx.arc(tx, ty, 8 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}
