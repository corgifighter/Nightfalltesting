# Hearthmere / Nightfall Reborn

Mobile-first hosted-web fantasy RPG vertical slice.

## START HERE — PROJECT CONTINUITY

**Read [PROJECT_HANDOFF.md](./PROJECT_HANDOFF.md) before making changes.**

That document is the canonical project history, requirements, lessons learned, priority order, deployment plan, quality gates, and continuation instructions. It is specifically written so a fresh ChatGPT instance can inherit the project without relying on previous chat memory.

## Nightfalltesting deployment

The game shell and runtime code are deployed in this repository. The binary GLB and texture set is served from the verified existing Hearthmere asset repository (corgifighter/Test-screen) because the connected GitHub write interface does not expose a local-binary upload operation. The runtime therefore uses the complete existing asset set rather than substituting placeholders.

**Important:** Nightfalltesting should not be described as a fully self-contained asset repository until the binary assets are actually migrated into it.

## Controls

- Tap/click terrain to move.
- Drag to orbit the camera.
- Use the HUD tabs for inventory, skills, equipment and map.
- CAPTURE requests a PNG directly from the real Three.js WebGL canvas.

## Runtime

- Three.js 0.181.1
- GLTF assets
- PWA shell
- Service-worker caching
- Mobile-first controls
