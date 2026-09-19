# Hearthmere / Nightfall Reborn

Mobile-first hosted-web fantasy RPG vertical slice.

## Nightfalltesting deployment

The game shell and runtime code are deployed in this repository. The binary GLB and texture set is served from the verified existing Hearthmere asset repository (corgifighter/Test-screen) because the connected GitHub write interface does not expose a local-binary upload operation. The runtime therefore uses the complete existing asset set rather than substituting placeholders.

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
