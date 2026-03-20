export function aabb(a, b)
{
    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}

export function inRadius(ax, ay, bx, by, radius)
{
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy <= radius * radius;
}
