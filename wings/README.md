# Wings of Fury

A plain JavaScript + HTML Canvas side-scrolling aerial combat game.

## Run locally

Because the game uses ES modules, run it through a local HTTP server (not `file://`).

### Option 1: Node

```bash
npx serve .
```

Then open the displayed URL and navigate to `/wings/` if needed.

### Option 2: Python

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/wings/`.

## Controls

- **Space**: Fire machine gun (and start from title screen)
- **B**: Drop bomb
- **Arrow Up / Arrow Down**: Pitch up/down
- **Arrow Left / Arrow Right**: Face left/right
- **R**: Restart from game over
