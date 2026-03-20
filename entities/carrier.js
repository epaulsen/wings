import { COLORS, WORLD } from '../constants.js';

export function createCarrier()
{
    return {
        type: 'carrier',
        x: WORLD.CARRIER_X,
        y: WORLD.CARRIER_DECK_Y,
        w: WORLD.CARRIER_WIDTH,
        h: WORLD.CARRIER_HULL_HEIGHT,
        deckY: WORLD.CARRIER_DECK_Y,
    };
}

export function updateCarrier()
{
}

export function renderCarrier(carrier, ctx, camera)
{
    const x = carrier.x - camera.x;
    const y = carrier.y;

    ctx.save();

    ctx.fillStyle = COLORS.CARRIER_HULL;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 8);
    ctx.lineTo(x + carrier.w - 8, y + 8);
    ctx.lineTo(x + carrier.w - 26, y + carrier.h);
    ctx.lineTo(x + 20, y + carrier.h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = COLORS.CARRIER_DECK;
    ctx.fillRect(x, y, carrier.w, 12);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(x + 20, y + 6);
    ctx.lineTo(x + carrier.w - 70, y + 6);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = '#e5e5e5';
    for (let i = 0; i < 4; i++)
    {
        ctx.beginPath();
        ctx.moveTo(x + 80 + i * 70, y + 1.5);
        ctx.lineTo(x + 80 + i * 70, y + 10.5);
        ctx.stroke();
    }

    ctx.fillStyle = '#4d5863';
    ctx.fillRect(x + carrier.w - 58, y - 22, 34, 24);
    ctx.fillStyle = '#687480';
    ctx.fillRect(x + carrier.w - 48, y - 34, 18, 12);

    ctx.restore();
}
