# Visual Asset Research & Selection

Updated 2026-09-19.

## Existing project asset library

The authored Test-screen repository contains the current Hearthmere environment set: cottages A/B/C, Inn, Forge, Chapel, Mill, Watchtower, bridge, hero/character, trees, rocks, props, and architectural detail meshes. The manifest describes the cottage set as the production environment pass and lists authored architectural details such as chimney, door, window, roof-ridge, timber-brace and eave-trim pieces.

These assets remain useful as layout/gameplay references, but no individual asset is protected from replacement if it conflicts with the target visual direction.

## External asset research

### Selected: Poly Haven
Poly Haven is a CC0 library and provides high-resolution PBR materials, HDRIs and realistic models. For the mobile browser build, the first integration uses 2K material maps rather than shipping massive photoreal geometry.

Current selected material families:
- Grass Ground — meadow/soil surface
- Wood Planks — timber construction
- Roof Tiles — weathered ceramic roofing
- Medieval Blocks 03 — stone construction

The runtime keeps local/procedural material fallbacks if a remote map fails.

Sources:
- https://polyhaven.com/a/grass_ground
- https://polyhaven.com/a/wood_planks
- https://polyhaven.com/a/roof_tiles
- https://polyhaven.com/a/medieval_blocks_03

All are CC0 according to their Poly Haven asset pages.

### Rejected as primary world geometry: Quaternius / Kenney low-poly packs
These libraries contain useful CC0 game assets, but their dominant visual language is explicitly stylized/low-poly. That conflicts with the current project requirement to move away from low-poly visual presentation, so they are not being used as the foundation of the world.

### Research conclusion
Use high-quality PBR materials and carefully selected realistic environmental detail where they strengthen the world. Do not assemble a random marketplace asset collage. New assets must serve one cohesive Hearthmere art direction and remain appropriate for mobile WebGL performance.
