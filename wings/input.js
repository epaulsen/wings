const keysDown = Object.create(null);
const keysPressed = Object.create(null);

export function initInput()
{
    window.addEventListener('keydown', (event) =>
    {
        if (!keysDown[event.code])
        {
            keysPressed[event.code] = true;
        }
        keysDown[event.code] = true;

        if ([
            'ArrowUp',
            'ArrowDown',
            'ArrowLeft',
            'ArrowRight',
            'Space',
            'KeyB',
            'KeyR',
        ].includes(event.code))
        {
            event.preventDefault();
        }
    });

    window.addEventListener('keyup', (event) =>
    {
        keysDown[event.code] = false;
    });
}

export function isDown(code)
{
    return !!keysDown[code];
}

export function wasPressed(code)
{
    return !!keysPressed[code];
}

export function endFrameInput()
{
    for (const key of Object.keys(keysPressed))
    {
        delete keysPressed[key];
    }
}
