# Hearthmere Graphics Master Plan

## Target
A high-readability fantasy world with authored silhouettes, physically convincing materials, cinematic lighting, rich vegetation, strong character presentation, and mobile-safe runtime performance. The target is an AAA-inspired visual bar, not a literal AAA-budget asset count and not a RuneScape clone.

## Required visual systems

1. **Material authoring and response**
   - Consistent PBR/physical response across wood, stone, plaster, roofs, metal, cloth, glass, terrain and water.
   - High-quality normal/detail response without texture tiling becoming obvious.
   - Controlled roughness/specular variation and grazing-angle response.
   - Wetness and moisture differentiation around the river.

2. **Terrain and ground truth**
   - Strong macro landforms before micro detail.
   - Meadow/soil/path biome transitions.
   - Slope-aware material variation.
   - River banks that visually grow out of the terrain.
   - Contact grounding around buildings, props and vegetation.

3. **Architecture**
   - Replace primitive silhouettes with authored massing.
   - Deep windows/doors, timber framing, masonry foundations, roof overhangs and varied rooflines.
   - Distinct landmark identities.
   - Repeated assets must gain controlled variation rather than looking duplicated.

4. **Vegetation**
   - Organic canopy silhouettes rather than spherical blobs.
   - Hero trees, companions, understory, wetland vegetation and meadow layers.
   - Multiple value/color families.
   - Wind and sunlight response.
   - Deliberate sightline preservation.

5. **Character presentation**
   - Strong hero silhouette and readable equipment.
   - Layered cloth/leather/metal response.
   - Facial silhouette and secondary motion.
   - Grounding shadow/contact relationship.
   - Better focal lighting than background NPCs.

6. **Lighting and atmosphere**
   - Warm/cool hierarchy.
   - Physically readable shadows and contact AO.
   - Cinematic sky and sun source.
   - Controlled bloom.
   - Distance depth from fog/terrain rather than transparent foreground sheets.
   - Final image grade that unifies the scene.

7. **World composition**
   - Major visual anchors should form readable spatial relationships.
   - Arrival, civic center, river edge and distant destination need clear visual hierarchy.
   - Avoid expanding the world merely to increase area; improve the existing slice first.

8. **Presentation / post-processing**
   - Stable tone mapping and output color space.
   - Restrained final contrast/saturation/warmth/vignette.
   - No effects that obscure gameplay readability.
   - Actual WebGL capture remains the authority.

9. **Animation / life**
   - Hero locomotion and secondary equipment motion.
   - Wind-driven foliage.
   - Fire, smoke, water, motes and wildlife used selectively.

10. **Performance hardening**
   - Shared geometry/material caches.
   - Mobile-safe shadow policy.
   - Adaptive pixel ratio.
   - Static visual freezing where safe.
   - Asset failures must remain visible in diagnostics.
   - No graphics upgrade should reintroduce the historical shader/newline black-screen failure.

## Implemented in the current graphics push

- Added a dedicated final cinematic image-grade pass before OutputPass.
- Added slope/elevation response to the meadow shader.
- Added sun sparkle response to water.
- Added foliage backlighting and macro variation to the physicalized foliage layer.
- Added a hero focal key/rim/fill light rig.
- Added sparse organic inner canopy accents to hero trees.
- Added low-energy landmark separation lights.
- Added a procedural photographic-style sun halo.
- Refreshed the service-worker cache to v40.
- Preserved the real WebGL capture path.

## Remaining gates before declaring the graphics foundation satisfactory

- Audit and, where worthwhile, replace the weakest authored models with higher-information CC0/local assets.
- Continue improving terrain/architecture/foliage material richness without expanding the playable footprint.
- Strengthen hero animation and equipment motion.
- Perform one milestone runtime capture after several major passes, then use that capture for retroactive corrections.
- Verify mobile runtime, asset completeness, post-processing health and capture metadata before moving to the next production priority.

## Working rule
Broad visual gains come before vertex-count polishing, tiny trims, or other micro-optimizations.