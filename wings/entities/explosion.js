export function createExplosion(x, y, radius = 28)
{
    const particles = [];
    const count = 6 + Math.floor(Math.random() * 3);

    for (let i = 0; i < count; i++)
    {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const speed = 60 + Math.random() * 140;
        particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.45 + Math.random() * 0.3,
            age: 0,
        });
    }

    return {
        type: 'explosion',
        x,
        y,
        radius,
        age: 0,
        life: 0.6,
        alive: true,
        particles,
    };
}

export function updateExplosion(explosion, dt)
{
    explosion.age += dt;
    if (explosion.age >= explosion.life)
    {
        explosion.alive = false;
    }

    for (const particle of explosion.particles)
    {
        particle.age += dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += 220 * dt;
        particle.vx *= 0.98;
    }
}

export function renderExplosion(explosion, ctx, camera)
{
    const progress = explosion.age / explosion.life;
    const r = explosion.radius * (0.55 + progress * 1.2);
    const x = explosion.x - camera.x;
    const y = explosion.y;

    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - progress);

    const outerGradient = ctx.createRadialGradient(x, y, 1, x, y, r);
    outerGradient.addColorStop(0, 'rgba(255, 160, 20, 0.85)');
    outerGradient.addColorStop(1, 'rgba(255, 90, 0, 0.0)');
    ctx.fillStyle = outerGradient;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    const innerR = r * 0.55;
    const innerGradient = ctx.createRadialGradient(x, y, 1, x, y, innerR);
    innerGradient.addColorStop(0, 'rgba(255, 255, 150, 0.95)');
    innerGradient.addColorStop(1, 'rgba(255, 210, 40, 0)');
    ctx.fillStyle = innerGradient;
    ctx.beginPath();
    ctx.arc(x, y, innerR, 0, Math.PI * 2);
    ctx.fill();

    for (const particle of explosion.particles)
    {
        if (particle.age > particle.life)
        {
            continue;
        }
        const lifePct = 1 - particle.age / particle.life;
        ctx.fillStyle = `rgba(220, 220, 220, ${lifePct.toFixed(3)})`;
        ctx.fillRect(particle.x - camera.x, particle.y, 2, 2);
    }

    ctx.restore();
}
