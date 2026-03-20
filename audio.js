const sounds = new Map();
let audioContext = null;

function getAudioContext()
{
    if (!audioContext)
    {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx)
        {
            return null;
        }
        audioContext = new Ctx();
    }

    return audioContext;
}

export function loadSound(name, src)
{
    sounds.set(name, { src });
}

export function play(name)
{
    const context = getAudioContext();
    if (!context)
    {
        return;
    }

    if (!sounds.has(name))
    {
        sounds.set(name, { src: null });
    }

    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.connect(gain);
    gain.connect(context.destination);

    const now = context.currentTime;
    const freq = getFrequency(name);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

    osc.start(now);
    osc.stop(now + 0.12);
}

function getFrequency(name)
{
    if (name === 'gun_fire')
    {
        return 620;
    }

    if (name === 'bomb_drop')
    {
        return 220;
    }

    if (name === 'explosion')
    {
        return 120;
    }

    if (name === 'landing')
    {
        return 300;
    }

    if (name === 'pickup')
    {
        return 760;
    }

    return 440;
}
