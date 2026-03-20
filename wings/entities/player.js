import { COLORS, PLAYER, WEAPON } from '../constants.js';
import { clamp, updateFlight } from '../physics.js';
import { isOverCarrier } from '../world.js';

export function createPlayer(startX, startY)
{
    return {
        type: 'player',
        x: startX,
        y: startY,
        w: PLAYER.WIDTH,
        h: PLAYER.HEIGHT,
        vx: 0,
        vy: 0,
        speed: 0,
        angle: 0,
        facing: 1,
        throttle: 1,
        fuel: PLAYER.MAX_FUEL,
        health: PLAYER.MAX_HEALTH,
        ammo: PLAYER.MAX_AMMO,
        bombs: PLAYER.MAX_BOMBS,
        gunCooldown: 0,
        bombCooldown: 0,
        onGround: true,
        alive: true,
        invulnTimer: 0,
    };
}

export function updatePlayer(player, dt, game)
{
    player.gunCooldown = Math.max(0, player.gunCooldown - dt);
    player.bombCooldown = Math.max(0, player.bombCooldown - dt);
    player.invulnTimer = Math.max(0, player.invulnTimer - dt);

    if (game.state.current === 'takeoff')
    {
        player.facing = 1;
        player.throttle = 1;
        player.speed += PLAYER.TAKEOFF_ACCELERATION * dt;
        player.speed = clamp(player.speed, 0, PLAYER.MAX_SPEED * 0.72);
        player.vx = player.speed;

        const deckEndX = game.carrier.x + game.carrier.w - player.w * 0.3;
        if (player.x < deckEndX)
        {
            player.x += player.vx * dt;
            player.y = game.carrier.deckY - player.h;
            player.onGround = true;
            player.angle = 0;
        }
        else
        {
            player.onGround = false;
            if (player.speed >= PLAYER.TAKEOFF_SPEED)
            {
                player.vy -= PLAYER.TAKEOFF_LIFT * dt;
                player.y += player.vy * dt;
            }
            player.x += player.vx * dt;
            player.y += 18 * dt;
        }

        player.fuel = Math.max(0, player.fuel - PLAYER.FUEL_BURN_RATE * dt);
        return;
    }

    if (game.state.current === 'landing')
    {
        player.angle *= 0.94;
        player.speed = Math.max(0, player.speed - PLAYER.BRAKE_DECELERATION * dt);
        player.vx = player.speed * player.facing;
        player.x += player.vx * dt;
        player.y = game.carrier.deckY - player.h;
        player.onGround = true;
        return;
    }

    if (game.state.current === 'rearming')
    {
        player.onGround = true;
        player.speed = 0;
        player.vx = 0;
        player.vy = 0;
        player.angle = 0;
        player.x = game.carrier.x + 36;
        player.y = game.carrier.deckY - player.h;
        return;
    }

    handlePitchAndFacing(player, dt, game.input);
    updateFlight(player, dt);

    if (isOverCarrier(player.x + player.w * 0.5) && player.onGround)
    {
        player.y = game.carrier.deckY - player.h;
    }
}

function handlePitchAndFacing(player, dt, input)
{
    if (input.isDown('ArrowLeft'))
    {
        player.facing = -1;
    }

    if (input.isDown('ArrowRight'))
    {
        player.facing = 1;
    }

    if (!player.onGround)
    {
        if (input.isDown('ArrowUp'))
        {
            player.angle -= PLAYER.PITCH_RATE * dt;
        }

        if (input.isDown('ArrowDown'))
        {
            player.angle += PLAYER.PITCH_RATE * dt;
        }
    }

    player.angle = clamp(player.angle, -PLAYER.MAX_PITCH, PLAYER.MAX_PITCH);

    if (player.fuel <= 0)
    {
        player.throttle = 0;
    }
    else
    {
        player.throttle = 1;
    }
}

export function canShoot(player)
{
    return player.ammo > 0 && player.gunCooldown <= 0;
}

export function canDropBomb(player)
{
    return player.bombs > 0 && player.bombCooldown <= 0;
}

export function consumeShot(player)
{
    player.ammo = Math.max(0, player.ammo - 1);
    player.gunCooldown = WEAPON.GUN_COOLDOWN;
}

export function consumeBomb(player)
{
    player.bombs = Math.max(0, player.bombs - 1);
    player.bombCooldown = WEAPON.BOMB_COOLDOWN;
}

export function applyDamage(player, amount)
{
    if (player.invulnTimer > 0)
    {
        return false;
    }

    player.health = Math.max(0, player.health - amount);
    player.invulnTimer = PLAYER.DAMAGE_COOLDOWN;
    return true;
}

export function renderPlayer(player, ctx, camera)
{
    const sx = player.x - camera.x;
    const sy = player.y;

    ctx.save();
    ctx.translate(sx + player.w * 0.5, sy + player.h * 0.5);
    ctx.rotate(player.angle);
    ctx.scale(player.facing, 1);

    ctx.fillStyle = COLORS.PLAYER;
    ctx.beginPath();
    ctx.moveTo(-28, 0);
    ctx.lineTo(26, -5);
    ctx.lineTo(31, 0);
    ctx.lineTo(26, 5);
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

    ctx.fillStyle = '#2f3d22';
    ctx.beginPath();
    ctx.moveTo(-22, -6);
    ctx.lineTo(-30, -17);
    ctx.lineTo(-24, -5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = COLORS.PLAYER_COCKPIT;
    ctx.beginPath();
    ctx.ellipse(12, -4, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    if (player.invulnTimer > 0)
    {
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-32, -15, 64, 30);
    }

    ctx.restore();
}
