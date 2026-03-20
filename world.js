import { CANVAS, COLORS, WORLD } from './constants.js';

export function createWorld()
{
    const clouds = [];
    for (let i = 0; i < 14; i++)
    {
        clouds.push({
            x: i * 580 + (i % 3) * 120,
            y: 60 + (i % 5) * 45,
            w: 120 + (i % 4) * 30,
            h: 26 + (i % 3) * 8,
        });
    }

    return {
        clouds,
    };
}

export function getGroundLevelAt(x)
{
    if (x >= WORLD.CARRIER_X && x <= WORLD.CARRIER_X + WORLD.CARRIER_WIDTH)
    {
        return WORLD.CARRIER_DECK_Y;
    }

    if (x >= WORLD.ISLAND_X && x <= WORLD.ISLAND_X + WORLD.ISLAND_WIDTH)
    {
        const t = (x - WORLD.ISLAND_X) / WORLD.ISLAND_WIDTH;
        const hill = Math.sin(t * Math.PI) * 42 + Math.sin(t * 4 * Math.PI) * 10;
        return WORLD.ISLAND_GROUND_Y - hill;
    }

    return WORLD.SEA_LEVEL;
}

export function isOverCarrier(x)
{
    return x >= WORLD.CARRIER_X && x <= WORLD.CARRIER_X + WORLD.CARRIER_WIDTH;
}

export function isOverIsland(x)
{
    return x >= WORLD.ISLAND_X && x <= WORLD.ISLAND_X + WORLD.ISLAND_WIDTH;
}

export function renderBackground(ctx, camera, world)
{
    const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS.HEIGHT);
    skyGradient.addColorStop(0, COLORS.SKY_TOP);
    skyGradient.addColorStop(1, COLORS.SKY_BOTTOM);
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

    renderClouds(ctx, camera, world.clouds);

    ctx.fillStyle = COLORS.SEA;
    ctx.fillRect(0, WORLD.SEA_LEVEL, CANVAS.WIDTH, CANVAS.HEIGHT - WORLD.SEA_LEVEL);

    ctx.strokeStyle = COLORS.SEA_HIGHLIGHT;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4;
    for (let y = WORLD.SEA_LEVEL + 10; y < CANVAS.HEIGHT; y += 40)
    {
        ctx.beginPath();
        const phase = ((camera.x * 0.06) + y) % 36;
        for (let x = -40; x < CANVAS.WIDTH + 40; x += 40)
        {
            ctx.moveTo(x + phase, y);
            ctx.lineTo(x + phase + 22, y + 2);
        }
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
}

function renderClouds(ctx, camera, clouds)
{
    const parallaxX = camera.x * 0.3;
    ctx.fillStyle = COLORS.CLOUD;

    for (const cloud of clouds)
    {
        let x = cloud.x - parallaxX;
        while (x < -cloud.w * 2)
        {
            x += WORLD.WIDTH;
        }
        while (x > CANVAS.WIDTH + cloud.w * 2)
        {
            x -= WORLD.WIDTH;
        }

        drawCloud(ctx, x, cloud.y, cloud.w, cloud.h);
    }
}

function drawCloud(ctx, x, y, w, h)
{
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.32, h * 0.7, 0, 0, Math.PI * 2);
    ctx.ellipse(x + w * 0.22, y - 5, w * 0.24, h * 0.85, 0, 0, Math.PI * 2);
    ctx.ellipse(x - w * 0.24, y - 2, w * 0.22, h * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
}
