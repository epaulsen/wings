import { WORLD } from './constants.js';

export function createCamera(width, height)
{
    return {
        x: 0,
        y: 0,
        w: width,
        h: height,
    };
}

export function follow(camera, target)
{
    const targetCenter = target.x + target.w * 0.5;
    camera.x = Math.max(
        0,
        Math.min(targetCenter - camera.w * 0.5, WORLD.WIDTH - camera.w)
    );
}

export function toScreen(camera, worldX, worldY)
{
    return {
        x: worldX - camera.x,
        y: worldY,
    };
}
