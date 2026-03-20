import { CANVAS, PLAYER, WORLD } from './constants.js';
import { getGroundLevelAt } from './world.js';

export function clamp(value, min, max)
{
    return Math.max(min, Math.min(max, value));
}

export function updateFlight(player, dt)
{
    const acceleration = player.throttle * PLAYER.ACCELERATION;
    player.speed += acceleration * dt;

    if (player.throttle === 0)
    {
        player.speed *= 0.98;
    }

    player.speed = clamp(player.speed, 0, PLAYER.MAX_SPEED);

    // SET vx and vy from flight angle each frame — never accumulate the base value
    player.vx = Math.cos(player.angle) * player.speed * player.facing;
    player.vy = Math.sin(player.angle) * player.speed;

    if (player.speed < PLAYER.STALL_SPEED && !player.onGround)
    {
        player.angle += PLAYER.GRAVITY_TORQUE * dt;
        player.vy += PLAYER.GRAVITY * dt;
    }

    player.x += player.vx * dt;
    player.y += player.vy * dt;

    player.x = clamp(player.x, 0, WORLD.WIDTH - player.w);
    player.y = clamp(player.y, 10, CANVAS.HEIGHT - 40 - player.h);

    const noseX = player.x + (player.facing === 1 ? player.w : 0);
    const groundY = getGroundLevelAt(noseX);
    if (player.y + player.h >= groundY)
    {
        player.y = groundY - player.h;
        player.vy = 0;
        player.onGround = true;
    }
    else
    {
        player.onGround = false;
    }

    if (player.fuel > 0)
    {
        player.fuel -= PLAYER.FUEL_BURN_RATE * player.throttle * dt;
        if (player.fuel <= 0)
        {
            player.fuel = 0;
            player.throttle = 0;
        }
    }
}
