import { CANVAS, PLAYER, STATES } from './constants.js';

export function renderHUD(ctx, game)
{
    const player = game.player;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
    ctx.fillRect(0, 0, CANVAS.WIDTH, 54);

    const fuelPct = player.fuel / PLAYER.MAX_FUEL;
    const fuelHue = Math.max(0, Math.floor(fuelPct * 120));
    ctx.fillStyle = `hsl(${fuelHue}, 85%, 48%)`;
    ctx.fillRect(16, 18, 170 * fuelPct, 14);
    ctx.strokeStyle = '#d7d7d7';
    ctx.strokeRect(16, 18, 170, 14);

    ctx.fillStyle = '#ffffff';
    ctx.font = '15px monospace';
    ctx.fillText(`FUEL ${Math.ceil(player.fuel)}%`, 16, 14);
    ctx.fillText(`AMMO: ${Math.max(0, Math.floor(player.ammo))}`, 220, 30);

    ctx.fillText('BOMBS:', 390, 30);
    for (let i = 0; i < PLAYER.MAX_BOMBS; i++)
    {
        drawBombIcon(ctx, 450 + i * 24, 24, i < player.bombs);
    }

    ctx.fillText('HEALTH', 560, 30);
    ctx.strokeStyle = '#d7d7d7';
    ctx.strokeRect(620, 18, 170, 14);
    ctx.fillStyle = player.health > 35 ? '#39e75f' : '#ff5959';
    ctx.fillRect(620, 18, 170 * (player.health / PLAYER.MAX_HEALTH), 14);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#d7d7d7';
    ctx.fillText(`SPD ${Math.floor(player.speed)}`, 16, CANVAS.HEIGHT - 16);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`SCORE: ${game.score}`, CANVAS.WIDTH - 16, CANVAS.HEIGHT - 16);

    const centerMsg = getStateMessage(game);
    if (centerMsg)
    {
        ctx.textAlign = 'center';
        ctx.font = '20px monospace';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(CANVAS.WIDTH * 0.5 - 220, 70, 440, 38);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(centerMsg, CANVAS.WIDTH * 0.5, 96);
    }

    ctx.restore();
}

function drawBombIcon(ctx, x, y, filled)
{
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = filled ? '#e6e6e6' : 'transparent';
    ctx.strokeStyle = '#e6e6e6';
    ctx.beginPath();
    ctx.moveTo(-5, -3);
    ctx.lineTo(5, -3);
    ctx.lineTo(7, 6);
    ctx.lineTo(-7, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function getStateMessage(game)
{
    if (game.state.current === STATES.REARMING)
    {
        return `REARMING... ${Math.max(0, (2.5 - game.rearmTimer)).toFixed(1)}s`;
    }

    if (game.state.current === STATES.LANDING)
    {
        return 'LANDING... KEEP IT STEADY';
    }

    return '';
}
