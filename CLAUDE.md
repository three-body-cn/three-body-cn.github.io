# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WebGL-based interactive 3D simulation of the Three-Body Problem, inspired by Liu Cixin's science fiction series. Hosted on GitHub Pages at `three-body-cn.github.io`. No build system — pure static HTML/JS served directly.

## Running Locally

This is a static site requiring an HTTP server (CORS blocks file:// protocol for config loading and physics worker). Any static server works:

```bash
# Python
python -m http.server 8080

# Node.js (npx)
npx serve .
```

Then open `http://localhost:8080/index.html`.

Entry points:
- `index.html` — Three-body gravitational simulation (primary)
- `solar.html` — Solar system visualization
- `asenal.html` — 3D model viewer with PBR materials

## Architecture

### Core Simulation Stack (`index.html` / `js/`)

The main simulation follows this initialization chain:

```
threebody.js (main())
  └── Universe.js        — manages all celestial objects, simulation state
        └── GLScene.js   — Three.js renderer, camera, lighting, render loop
              └── Aster.js / AsterFactory.js  — individual celestial bodies
```

**Render loop** (in `GLScene.js`): physics step → gravitational force accumulation → position sync → camera reposition → render → `requestAnimationFrame`.

**Physics**: Physijs (wrapper over Ammo.js/Bullet via WebWorker) handles collisions and rigid bodies. Gravitational forces are computed manually in `Aster.js` using Newton's law and applied as impulses each frame. Custom gravitational constant: `G = 66725.9`.

**Configuration** (`config/three-solar-system.json`): Defines initial celestial bodies with `type` (0=star, 1=planet, 2=satellite), `radius`, `mass`, `pos`, and `initVelocity`. Loaded via `DataLoader.js` which caches results in browser cookies.

### Key Classes

| Class | File | Role |
|-------|------|------|
| `Universe` | `js/Universe.js` | Orchestrates objects, sim time, disaster callbacks |
| `GLScene` | `js/GLScene.js` | Three.js scene, renderer, camera auto-positioning |
| `Aster` | `js/Aster.js` | Celestial body: physics mesh + gravity + orbital track |
| `AsterFactory` | `js/AsterFactory.js` | Factory: star (emissive + PointLight), planet (Lambert) |
| `GameLogicController` | `js/GameLogicController.js` | jQuery UI dialogs for disaster events |
| `DataLoader` | `js/DataLoader.js` | XHR + cookie-based config loading |

### Keyboard Controls

- `G` — toggle debug mesh grid
- `P` — toggle console logging

### `asenal.html` Demo

Uses ES6 `import/export` modules (unlike the core simulation which uses global `<script>` tags). See `js/demos/asenal.js` and `js/demos/ModelLoader.js`. Demonstrates FBX/OBJ model loading with PBR materials and lens flare.

## Known Technical Debt

- `DataLoader.js` uses `eval()` to parse JSON response — avoid expanding this pattern; use `JSON.parse()` instead.
- `Utils.js` uses synchronous XHR (`async: false`) — avoid adding more synchronous network calls.
- Core simulation uses global variables (`mUniverse`, `mGLScene`, `mOrbitControls`) in `threebody.js`.
- `THREE.ImageUtils.loadTexture` calls are deprecated — prefer `new THREE.TextureLoader().load(...)`.
- jQuery 1.12.4 is legacy; only used for UI dialogs in `GameLogicController.js`.

## Asset Layout

- `model/` — planet textures (PNG) and 3D fighter/prop models (FBX/OBJ + MTL)
- `texture/LensFlare/` — lens flare sprite textures
- `config/` — JSON simulation initial conditions
- `js/public/three/` — vendored Three.js + loaders + physics engine
- `js/public/libs/` — vendored jQuery, Tween.js, simplex-noise, etc.
