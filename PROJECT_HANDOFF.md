# NIGHTFALL REBORN / HEARTHMERE — PROJECT HANDOFF

**Purpose:** authoritative continuation document for any new ChatGPT instance taking over this repository.
**Repository:** corgifighter/Nightfalltesting
**Status date:** 2026-09-21

## 1. THE PRODUCT GOAL

This is intended to become a real RuneScape-inspired browser/mobile game, not a throwaway prototype. The visual target is an Old School RuneScape-like fantasy readability and world language, combined with substantially more modern rendering, lighting, materials, atmosphere, architecture, environmental dressing, and presentation.

The immediate benchmark is **stunningly beautiful, immersive, cohesive fantasy-world visuals**. The world should feel authored and believable rather than like a collection of primitives. The desired bar is AAA-studio-level fantasy presentation, and graphics foundation work comes before broad gameplay/content expansion.

The practical deployment target is a phone-browser launch. The user tests from Android and wants the actual running WebGL game, not a mockup or offline still. Runtime screenshots are the authoritative visual test.

## 2. CURRENT STATE — IMPORTANT

The project has now been returned from the later diagnostic experiments to a **visible-world baseline**. The user has confirmed that the world is visible again, including the broad geometry/scene that had disappeared during diagnostics.

The remaining dominant visual problem is the original one: a strong **orange/yellow haze/color cast** over the otherwise visible world. The user's latest report is that the most recent attempted changes did not materially alter that problem.

Therefore the project should NOT be treated as a geometry-loss problem anymore. Do not restart the long sequence of diagnostic geometry/camera/override-material experiments unless new evidence specifically requires it.

**Current baseline: VISIBLE WORLD + ORANGE/YELLOW CAST.**

## 3. WHAT WE LEARNED

### 3.1 Later diagnostic versions were counterproductive
Several versions disabled or bypassed combinations of cinematic rendering, post-processing, SSAO, sky/atmosphere, fog, override materials, background layers, lighting, and visibility. This produced increasingly broken-looking worlds. Those results should not be interpreted as proof that the underlying world geometry was broken.

The user's observation was consistent: before the diagnostic campaign, the world was substantially visible and the main obvious defect was the orange/yellow cast.

### 3.2 Do not solve a balance problem by disabling the whole system
The correct direction is coordinated balancing of PBR materials, environment lighting, sun/direct light, hemisphere/fill lighting, sky/background, fog/atmosphere, shadows, tone mapping/exposure, bloom, color grading, SSAO, and cinematic presentation. These systems need to be tuned as a coherent stack.

### 3.3 Cinematic mode is presentation, not a second renderer
The user's phone screenshots often show cinematic mode. CAPTURE/RETURN controls belong to that workflow. Cinematic mode should primarily alter framing/UI/presentation and must not cause the world to disappear or switch to a fundamentally different rendering path.

### 3.4 The blurry appearance was investigated deeply
EffectComposer sizing, pixel ratio, SSAO sizing, FXAA, native MSAA, bloom, OutputPass, and capture/cinematic branches were investigated. FXAA was removed and native antialiasing restored. SSAO/composer sizing was corrected earlier. Do not automatically repeat the same generic composer-size diagnosis.

### 3.5 Fog was considered but not established as the root cause
Fog was reduced/neutralized during several tests, but those versions did not restore the intended world. Fog may contribute to the color cast, but there is insufficient evidence that it alone caused the problem.

### 3.6 Known runtime error
A recurring diagnostic error was: Cannot read properties of null (reading 'color'). The user said this had already been addressed once. Do not blindly repeat generic null-color troubleshooting without locating the actual current source path.

## 4. VISUAL ART-DIRECTION HISTORY

### Graphics Benchmark V3 — World Reconstruction
- Broad raised terrain shoulders/ridges around the playable basin.
- Broad irregular biome islands.
- Woodland groves using richer tree instances.
- Natural outcrops.
- Secondary cottage/workshop structures.
- Material hierarchy for plaster, roofs, leaves, and water.

### Graphics Benchmark V4 — Asset Replacement
- Procedural hero silhouettes were replaced where they had reached their quality ceiling.
- Forest companions were replaced with richer authored/core tree assets.
- Geology was replaced with distilled Poly Haven rock/moss assets.
- Sparse shrub/fern/grass anchors were added.
- Roughness/environment-intensity hierarchy was reinforced.

### Graphics Benchmark V5 — latest major pre-debug art pass
- High-salience procedural hero foliage was replaced with richer authored GLB silhouettes.
- Sparse shrub/contact dressing was added.
- Circular biome decals were replaced by irregular biome ground meshes.
- This is the last major visual-art direction before the rendering troubleshooting campaign and is an important historical reference point.

**Art-direction rule:** If an asset cannot be pushed to the target quality, replace it. Do not spend excessive time polishing tiny details on an asset whose overall silhouette/material/world-context remains below the benchmark.

## 5. BROAD PRIORITIES

1. Preserve the visible-world baseline.
2. Neutralize and correctly balance the orange/yellow cast.
3. Restore the intended full presentation stack without destructive diagnostic bypasses.
4. Make the next visual test a large, obvious improvement rather than a micro-tweak.
5. Continue broad visual construction: terrain, architecture, foliage, materials, lighting, depth, and world composition.
6. Only later pursue micro-detail such as tiny trims, gutters, vertex-level polish, etc.
7. Gameplay/content expansion comes after the visual foundation reaches the agreed bar.

## 6. WHAT NOT TO DO

- Do not repeatedly restore the V61/V60 renderer-debug baseline and call it a pre-debug baseline.
- Do not assume a green/orange diagnostic field proves geometry is missing.
- Do not keep disabling systems one at a time without a hypothesis and a clear rollback point.
- Do not replace the whole visual stack with a flat diagnostic renderer.
- Do not repeatedly perform the same composer-size/FXAA/SSAO generic diagnosis.
- Do not claim visual improvement has been verified without a real runtime screenshot.
- Do not optimize tiny geometry details while the overall image is still far below target.
- Do not build out a large town merely to add content while the graphics foundation is inadequate.
- Do not sacrifice the functioning visible world to test one isolated rendering theory unless a reversible diagnostic branch exists.

## 7. CURRENT ENGINE / TECHNICAL FOUNDATION

The game uses Three.js 0.181.1 with a WebGL/PBR rendering pipeline. Major systems include PerspectiveCamera, PBR materials, EffectComposer, RenderPass, SSAO, bloom, OutputPass/color management, fog/atmosphere, environment lighting, directional/hemisphere/fill lighting, shadows, GLTF assets, and mobile-adaptive quality controls.

Core authored/CC0 asset infrastructure includes GLTFLoader, asset caching/loading, core village assets, character/hero assets, architectural detail assets, and Poly Haven-derived CC0 vegetation/geology/material assets.

The project includes systems for village/landmarks, residential architecture, natural dressing, landscape anchors, foliage/biomes, resource nodes, characters, interactions, water, cinematic lighting, and presentation/art-direction passes.

## 8. ASSET INFRASTRUCTURE

Historical core asset base: ASSET_BASE points at the Test-screen GitHub raw asset source. Distilled assets include Poly Haven rock, shrubs, fern, grass, and related CC0 material/texture resources. Inspect current source before changing paths or asset loading behavior.

## 9. NEXT RENDERING STRATEGY

Treat the orange/yellow problem as a **source-level color-pipeline investigation**, not a geometry reconstruction.

Map every contributor to final scene color and atmospheric tint:
1. Scene background.
2. Fog color/density.
3. Sky gradient / sky material.
4. Environment map / generated environment intensity.
5. Hemisphere light sky/ground colors and intensity.
6. Sun/directional light color/intensity.
7. Fill/rim lights.
8. Dynamic day/golden-hour color modulation.
9. Renderer tone mapping and exposure.
10. Bloom threshold/strength/radius.
11. Final cinematic color-grade pass, especially warmth/saturation/contrast.
12. Material base colors and environment-map response.
13. Any hidden post-processing pass that changes RGB/white balance.

Then determine which contributors are actually responsible by tracing the final color through source. Prefer one coordinated, reversible presentation correction over many isolated toggles.

A useful next test sequence is: establish neutral daylight values; remove explicit warm bias from sun/fill/sky/fog/grade; keep world and PBR materials intact; preserve shadows and depth; keep bloom restrained; compare a real runtime screenshot; if the cast persists, trace material/environment response next.

The objective is not to make the world cold or gray. It is **neutral, readable natural fantasy lighting** with intentional warmth only where art direction calls for it.

## 10. VISUAL BENCHMARK

The desired image should read as a cohesive fantasy village/world with readable buildings, character, terrain, and vegetation; rich but controlled natural materials; clear depth and spatial hierarchy; strong silhouettes; convincing grounding/contact; atmospheric depth without color contamination; attractive daylight with optional restrained golden accents; polished mobile presentation; and Old School RuneScape-inspired readability with a much more modern rendering/art foundation.

The benchmark is not merely technically functioning. It is visibly beautiful and convincing.

## 11. RUNTIME VERIFICATION RULE

The assistant currently does not have a browser/Playwright runtime viewer. Source changes can be inspected and committed, but visual success must not be claimed until the user launches the current build and supplies a real phone/runtime screenshot or equivalent runtime evidence.

The user's screenshots are direct Android phone screenshots. Treat them as authoritative visual evidence.

## 12. IMPORTANT GIT CHECKPOINTS

- Graphics V5 app: 155c74d87e4801d8de4eb276ee6692d284cb4cf8
- V5 synchronized index: 82aaaba3e6e097c93d62b71951396e83bba23fd3
- V5 synchronized service worker: 7711c021c0f24a5ac1ba04dae887978439a82e3d
- V61-era app: 8b5d3da8dc45455dab895149944e873ae78f275a2
- V61-era index: 987a05d14d1cf313f8c860d3f3afa19aa747d9a2
- V61-era service worker: 0f29b23fa1c0cf304a057faf13f6e8abf55f6ac5

The repository was explicitly synchronized back to the V61-era trio during recovery, and the user subsequently confirmed that the visible world had returned while the orange/yellow haze remained. Treat that as the currently validated state unless a newer commit supersedes it.

## 13. HANDOFF WORKFLOW

1. Read this file completely before editing anything.
2. Inspect current app.js, index.html, and sw.js from the default branch.
3. Confirm the current commit and identify whether the visible-world baseline has been preserved.
4. Do not infer runtime appearance from source alone.
5. Identify the exact final-color pipeline and all warm-bias contributors.
6. Make a substantial, coordinated, reversible correction aimed specifically at the orange/yellow cast.
7. Keep all world-building systems active.
8. Commit changes with a clear message explaining the visual hypothesis.
9. Tell the user exactly what changed and what to test.
10. Use the user's next runtime screenshot to guide the next broad pass.

## 14. LONG-TERM BLUEPRINT

### Phase A — Rendering stability
- Preserve visible world.
- Eliminate destructive diagnostic branches.
- Ensure cinematic mode is presentation-only.
- Establish neutral color baseline.

### Phase B — Visual benchmark
- Terrain hierarchy and large forms.
- Architecture silhouettes and material richness.
- Vegetation density/composition.
- Ground integration and contact.
- Water and natural features.
- Lighting hierarchy and atmospheric depth.

### Phase C — World cohesion
- Biome transitions.
- Landmark composition.
- Village spatial storytelling.
- Repeated asset variation without visual noise.
- Lighting/time-of-day identity.

### Phase D — Polish
- High-salience asset replacement.
- Material tuning.
- Contact shadows and grounding.
- UI integration.
- Mobile performance without sacrificing the visual benchmark.

### Phase E — Content expansion
Only after the graphics foundation is strong: gameplay systems, economy, quests, combat, NPC depth, larger world, and additional areas.

## 15. GUIDING PRINCIPLE

**Do the big visual work first.** A beautiful coherent world with a few assets is more valuable at this stage than a large amount of content rendered with weak art direction. Quality is more important than speed. Each major working pass should produce a meaningful visual leap, not a collection of tiny invisible tweaks.

**Continuation target: VISIBLE + NATURAL COLOR + COHESIVE + BEAUTIFUL + IMMERSIVE.**
