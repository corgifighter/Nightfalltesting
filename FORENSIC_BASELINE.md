# HEARTHMERE / NIGHTFALL REBORN — FORENSIC HANDOFF MANIFEST
## Mandatory continuation document for the next chat instance

**Repository:** `corgifighter/Nightfalltesting`  
**Project:** Hearthmere / Nightfall Reborn  
**Active branch:** `main`  
**Purpose of this document:** preserve the exact state, reasoning, constraints, discoveries, and next actions so a new chat instance can continue without asking the user to reconstruct the investigation.

---

# 1. PRODUCT GOAL — DO NOT LOSE SIGHT OF THIS

This is intended to become a real RuneScape-inspired mobile/browser game, not a disposable prototype.

Visual target:
- Old School RuneScape-style readability and fantasy identity.
- Much more modern renderer, lighting, materials, atmosphere, architecture, UI and presentation.
- Cohesive, believable fantasy world.
- High-end / AAA-studio visual ambition.
- Stunningly beautiful broad visual presentation is the current priority.
- The project is nowhere near the final visual target yet, so broad art-direction and graphics-foundation improvements matter much more than tiny geometry polish.

The user tests primarily from an Android phone browser. The real deployed game frame matters; do not substitute a generated preview for runtime evidence.

The user values deep, substantial progress over speed. Do not waste time on micro-detail, vertex counts, gutters, tiny trims, or other low-impact work while the global presentation is still wrong.

---

# 2. ABSOLUTE DEBUGGING RULES

These rules override convenience.

1. **Never destroy the accumulated modern renderer to diagnose one variable.**
2. **Never blindly roll main backward.**
3. **Never return to Build 77 / commit `9ad848...` as a development target.**
4. Protected recovery branch:
   - `protected/modern-yellow-build85`
   - protected commit: `dc42717a89f81eadc98703ea64bdaa38729bbf3b`
5. The protected branch must not be deleted or repurposed.
6. Every forensic experiment must be narrow and reversible.
7. One hypothesis at a time.
8. Do not stack multiple unknown visual changes merely to make a screenshot look different.
9. If a test causes black screen, severe degradation, or a misleading failure caused by the test harness itself, stop interpreting it and correct/remove that test.
10. Do not permanently disable advanced systems just because a diagnostic switch exists.
11. Once the actual culprit is identified, make a surgical fix and restore every system that was only disabled for diagnosis.
12. Do not repeat previously ruled-out tests unless new source evidence specifically changes the hypothesis.
13. Do not use screenshot-by-screenshot random experimentation. Source-level reasoning comes first.
14. Preserve the modern GREEN main state and the protected YELLOW/GOLD recovery state as distinct concepts.

---

# 3. TERMINOLOGY — IMPORTANT

There are two historical visual states and they must never be conflated:

### GREEN baseline
The current `main` build the user is testing. It has a strong green / yellow-green cast and is sharper than the older yellow state.

### YELLOW/GOLD baseline
The earlier modern advanced state preserved at:
`protected/modern-yellow-build85`  
commit `dc42717a89f81eadc98703ea64bdaa38729bbf3b`

The protected YELLOW/GOLD state is an emergency recovery anchor, NOT the preferred development direction.

---

# 4. WHAT THE PROBLEM LOOKS LIKE

The persistent problem is a global green/yellow color cast.

User observations:
- Current main is overwhelmingly GREEN, more green than golden yellow.
- The effect behaves like a stagnant camera/lens layer.
- Walking around the world does not produce the expected spatial change.
- The world appears sharper than the old yellow state, but the global chroma problem remains.
- The upper/middle/lower screenshot sampling previously showed approximately:
  - upper: RGB 135/139/29
  - middle: RGB 167/172/36
  - lower: RGB 165/169/38
- R and G remain strongly correlated while blue is dramatically suppressed.
- This is consistent with a global color contribution or transform more than ordinary distance fog.
- The user specifically suspects something applied to the camera/final image rather than ordinary world lighting.
- **OutputPass-off testing shifted the image from blurry yellow toward darker green with significantly crisper underlying world detail. This was directionally useful but not a fix.**

Do not casually describe the problem as fog or lighting. Those hypotheses have already been tested.

---

# 5. PROTECTED MODERN SYSTEMS

The protected modern renderer contains the accumulated work that must survive this investigation:

- Three.js 0.181.1 WebGL renderer
- EffectComposer / RenderPass
- SSAO
- Unreal Bloom
- cinematic grade ShaderPass
- OutputPass
- ACES filmic tone mapping
- sRGB output conversion
- PBR / MeshPhysicalMaterial systems
- environment / PMREM pipeline
- authored and CC0 asset integration
- advanced sky / atmosphere
- cinematic world-depth systems
- lighting rigs
- shadows
- material integration/foundation systems
- world / architecture / terrain
- character presentation
- interaction/gameplay systems
- graphics benchmark V3/V4/V5 machinery
- deterministic world generation

These systems are valuable accumulated project work. Diagnosis must isolate them rather than dismantle them.

---

# 6. KNOWN RENDER CHAIN

The production render chain is approximately:

```
renderPass
ssaoPass
bloomPass
cinematicGradePass
outputPass = new OutputPass()
composer.addPass(outputPass)

renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.02
renderer.setClearColor(0x8fa49e, 1)
```

Important: OutputPass is the final presentation/color-conversion stage. It has already been isolated once, with useful but incomplete evidence.

---

# 7. IMPORTANT PRODUCTION SHADER/MATERIAL ARCHITECTURE

The project contains substantial custom shader activity. Do not assume ordinary PBR materials are the whole story.

### addBeautyShader()
Custom `onBeforeCompile` hook:
- preserves prior hook
- injects world position and normal
- modifies map fragment with broad material/beauty variation.

### Foundation Surface Shader
`installFoundationSurfaceShader(mat, seed, edge)`
- injects neutral macro variation
- world-coordinate warmth
- up-facing / crease color modulation
- specular modulation
- modifies `begin_vertex` and `color_fragment`.

### Grass
`MAT.grass` is MeshStandardMaterial with:
- meadow texture
- grass normal
- custom `onBeforeCompile`
- world-position injection
- custom terrain color logic
- green/brown vectors
- biome/domain/path-wear logic
- animated shader state.

### Water
`MAT.water` is MeshPhysicalMaterial with:
- custom `onBeforeCompile`
- animated vertex displacement
- ripple/fresnel/sun-spark logic
- cyan mix.

### Foliage physicalization
Materials are converted toward MeshPhysicalMaterial with:
- alpha testing
- sheen
- sheenColor
- custom leaf/backlight shader behavior.

### Architectural physicalization
Standard materials are converted to Physical materials while preserving:
- maps
- colors
- normalScale
- relevant material properties
- **their prior `onBeforeCompile` hook**

### Material grounding
Another `onBeforeCompile` layer modifies world-space ground-band appearance.

This means a material can have multiple inherited/custom shader behaviors. The combined hook stack remains a high-value investigation area.

---

# 8. DYNAMIC LIGHTING / ENVIRONMENT — DO NOT MISDIAGNOSE

Per-frame day-loop values include:

```
sun.color.setHSL(.065-.015*day,.16,.68+.08*day);
fill.color.setHSL(.55,.20,.60);
fill.intensity=.30+.28*day;
moon.intensity=.035+.24*(1-day);
hemi.intensity=.66+.48*day;
hemi.color.setHSL(.48,.07,.82);
hemi.groundColor.setHSL(.08,.06,.18+.04*day);
renderer.toneMappingExposure=.84+.16*day;
scene.environmentIntensity=.26+.10*day;
```

Other presentation passes have changed sun/fill/hemi intensities and tone-mapping exposure.

These are not currently the leading hypothesis because global chroma tests already strongly implicated something other than ordinary world lighting.

---

# 9. WHAT HAS ALREADY BEEN RULED OUT

Do NOT restart these investigations without new source evidence.

### Fog
A valid per-frame fog-density-zero test showed the cast remained.
**Fog is ruled out as the primary cause.**

### PMREM / environment contribution
A valid per-frame `scene.environmentIntensity = 0` test showed no meaningful change.
**Environment contribution is ruled out as the primary cause.**

### Foundation Surface Shader
A global diagnostic gate was added and the shader was disabled.
**No meaningful change.**
Not the primary cause by itself.

### DOM vignette / grain
Disabled diagnostically.
**No meaningful change.**

### GraphicsSunHalo
Disabled diagnostically.
**No meaningful change.**

### Broad CinematicWorldDepth mist bands
Removed/disabled diagnostically.
**No meaningful change.**

### Sun disc
Hidden diagnostically.
**No meaningful change.**

### Cinematic grade
Identity-style grade test produced a gray/white presentation but the underlying problem remained.
Therefore the grade changes presentation but is not the root cause.

Production grade currently:
```
uSaturation = 1.055
uContrast = 1.045
uWarmth = 0.0
uVignette = 0.065
```
The grade's explicit warmth is zero, so it is not intentionally adding the observed warmth.

### ACES vs AgX
AgX changed the hue toward more green but did not remove the problem.
Tone mapping changes presentation but does not explain the underlying persistent cast.

---

# 10. MAJOR BREAKTHROUGH: THE WORLD ITSELF IS HEALTHY

A direct normal-material render proved that the complete world geometry exists and renders.

Diagnostic:
`?raw=1&normal=1`

The user saw vivid psychedelic normal colors across:
- buildings
- terrain
- roads
- trees
- character
- props

This is exactly what MeshNormalMaterial is expected to do: it maps surface normals to RGB.

Therefore:
- geometry exists
- camera is substantially correct
- scene objects are present
- rasterization is working
- the production screenshot problem is not simply “the world failed to generate”
- the world can be rendered directly outside the production post-processing presentation path.

This is one of the most important facts in the entire investigation.

---

# 11. RAW MATERIAL TEST HISTORY

Several tests attempted to replace production materials with simpler materials.

### Build 97 — normal override
`?raw=1&normal=1`
**SUCCESSFUL diagnostic.**
Full world visible in psychedelic normal colors.

### Build 98 — MeshBasic override
`?raw=1&basic=1`
Result: mostly gray/white field, no useful world geometry.
This did NOT prove that MeshBasicMaterial itself is broken.

### Build 99 — direct MeshBasic assignment
`?raw=1&basicdirect=1`
Result: gray/white field with no useful village geometry.
Again, do not overinterpret this as proof that production materials are the culprit.

### Build 100 — depth
`?raw=1&depth=1`
Result: black camera view.
This diagnostic path is not useful evidence about the production world.

### Build 101 — direct MeshNormalMaterial assignment
`?raw=1&normaldirect=1`
Result: psychedelic world.
This reconfirmed direct material replacement can render the complete geometry.

### Build 102 — uncompiled shader test
`?raw=1&uncompiled=1`
First version incorrectly set `mat.onBeforeCompile = null`, which caused:
**Cannot read properties of null**
This was a diagnostic implementation error, not evidence about the game.

It was changed to:
```
mat.onBeforeCompile = () => {};
```
because Three.js 0.181 program-cache paths expect the hook to remain callable.

### Build 103 — corrected uncompiled test
Result: gray/white field with no useful geometry.
This test was not a clean enough isolation of custom shader hooks to justify further conclusions.

### Build 104 — Lambert direct
`?raw=1&lambertdirect=1`
Replaced visible meshes with a plain MeshLambertMaterial.
Result: gray field, no useful geometry.
This was also not a clean answer.

---

# 12. MOST RECENT TEST — BUILD 105

The latest controlled diagnostic is:

`https://corgifighter.github.io/Nightfalltesting/?raw=1&materialprobe=1`

Build 105 added a **single known-good white cube** directly into the live scene for one raw renderer pass.

The probe:
- does NOT replace production world materials
- does NOT alter production geometry
- hides the sky temporarily
- adds a BoxGeometry(3,3,3)
- uses MeshBasicMaterial
- places the cube in front of the camera
- disables depth testing/writing on the probe
- clears to dark gray
- directly calls `renderer.render(scene,camera)`
- removes and disposes the cube afterward
- restores sky and clear color.

The exact conceptual test is:

**Can the renderer draw one trivial known-good MeshBasic cube in a controlled raw pass?**

The user has now reported:

> **“No cube or geometry in sight.”**

This is the latest observation.

---

# 13. INTERPRETATION OF THE LATEST RESULT

This is important:

The failure of the Build 105 cube test does **NOT** mean the game geometry is missing.

We already have direct normal-render evidence proving the world geometry renders.

The failure instead makes the simple-material/raw-render path itself suspect.

The combination is now:

- production render = green/yellow cast
- OutputPass-off = darker green + much crisper, but still wrong
- raw normal = complete world geometry
- raw basic = no useful geometry
- raw basic-direct = no useful geometry
- raw Lambert = no useful geometry
- raw depth = black
- raw uncompiled = no useful geometry
- raw material probe = no cube

That pattern is stronger evidence for a **renderer/material/program/state interaction** than for fog, world lighting, or missing geometry.

Do NOT now randomly add another material replacement.

---

# 14. NEXT INVESTIGATION — EXACT DIRECTION

The next instance must continue from Build 105 and perform **source-level investigation**, not another blind visual experiment.

Priority order:

## A. Inspect renderer state and render path around raw mode
Determine exactly what happens immediately before the raw renderer call:
- render target
- viewport
- scissor
- scissor test
- camera aspect/projection
- renderer autoClear
- XR state if any
- WebGL state
- composer read/write buffers
- framebuffer bindings
- active render target
- clear state
- depth/stencil state
- color mask
- blending state
- culling state

The fact that MeshNormalDirect works but a known-good Basic cube does not is particularly valuable.

## B. Compare the actual material/program behavior
Do not null `onBeforeCompile`.

Investigate:
- material program cache keys
- `customProgramCacheKey`
- `onBeforeCompile`
- `needsUpdate`
- whether the material has already been compiled under another renderer state
- whether shared materials are mutated elsewhere
- whether direct material replacement happens during another traversal/update
- whether materials are being reinstalled/replaced after the raw branch begins.

## C. Investigate render-target/composer interaction
The OutputPass test already showed that the final path changes presentation significantly.

Find whether:
- composer leaves a render target bound
- raw direct rendering occurs while a non-default target is active
- viewport/scissor are inherited incorrectly
- a pass changes WebGL state without restoring it
- the raw branch is rendering somewhere other than the visible canvas.

This is now a high-value hypothesis.

## D. Inspect sky/background separately
Sky is a ShaderMaterial:
- BackSide
- depthWrite false
- gradient uniforms
- custom vertex/fragment shaders.

Raw tests hide it, so it should not be the cause of the missing cube in the probe, but inspect it later as part of the production cast investigation.

## E. Inspect camera-space / fullscreen primitives
Search every object that could affect the whole frame:
- PlaneGeometry
- Sprite
- fullscreen quad
- camera child
- transparent large meshes
- screen-space/camera-space effects
- render-order overrides
- always-visible overlays.

The user’s “stagnant camera lens filter” observation makes this category important.

## F. Inspect every global color transform
Search source for:
- `setClearColor`
- `outputColorSpace`
- `toneMapping`
- `toneMappingExposure`
- `OutputPass`
- `ShaderPass`
- `ShaderMaterial`
- `gl_FragColor`
- `vec4`
- `color *=`
- `mix(`
- `onBeforeCompile`
- `customProgramCacheKey`
- `renderTarget`
- `setRenderTarget`
- `readBuffer`
- `writeBuffer`
- `renderToScreen`
- transparent fullscreen/camera-space objects.

---

# 15. DO NOT MAKE THESE MISTAKES AGAIN

### Do not treat a broken diagnostic as a discovery.
Build 102 initially generated an error because the diagnostic itself set `onBeforeCompile=null`. That was our error.

### Do not infer “material system is guilty” merely because Basic/Lambert tests show gray.
Those tests did not render useful geometry while Normal did. The discrepancy itself needs explanation.

### Do not disable the modern systems permanently.
The goal is surgical diagnosis, not simplification.

### Do not return to the old primitive build.
The modern renderer and accumulated graphics work are the project.

### Do not chase fog again.
Already ruled out.

### Do not chase PMREM/environment again.
Already ruled out.

### Do not chase the cinematic grade as the root cause without new evidence.
Identity grade already failed to eliminate the problem.

### Do not repeatedly alter lighting colors.
The evidence points beyond ordinary light chroma.

### Do not perform broad destructive renderer changes.
The user specifically does not want the advanced modern state lost again.

---

# 16. CURRENT COMMIT HISTORY REFERENCE

Recent diagnostic commits:

- Build 92 final/output forensic:
  - app: `8822481c2ca0edad8f09c8835ab55abda6a24254`
  - index: `d10cf72336dc770623a459c8fef83a0b707ed3ec`
  - sw: `4157173543f551b10cbef498d9946453485bf091`

- Build 96 renderpass:
  - disables SSAO, bloom, grade, OutputPass for direct test.

- Build 97 normal override:
  - first major proof of complete geometry through direct normal rendering.

- Build 100 depth:
  - app: `9cb35e1d51f27cedd54f07bdace1c14d0fd9ffe6`
  - index: `5b5ecb1073af08ac35ba5183017bc8750a787faa`
  - sw: `3b9bb1f2e0362d7ee076dc71b3ed4cd577f605b2`

- Build 103 corrected uncompiled:
  - app: `f13995abbce455835cfe7fa3de28048d76b85f2e`
  - index: `5f1c352333d16c0e2339a87a265001858326e9f3`
  - sw: `65d87ebbe9da801a540e2f99e1214aa5a68a1634`

- Build 104 Lambert:
  - app: `b238d9a3007f42e867dc70126d3d703741a31f1c`
  - index: `0f785d785da337fb98fc37952342e428b75e6ca1`
  - sw: `8d7c5b990a9a6bc700838e5b2c193e1aa56fa3af`

- Build 105 material probe:
  - app: `e034ed13b3b8d276149f596e9cf4119406bd5cee`
  - index: `e0f218d2d978d261a8e49f9562879a20a9adeb49`
  - sw: `93d327bab7cf08bac2b70faddbf59d66cd4266b2`

The exact current deployed Build 105 URL:
`https://corgifighter.github.io/Nightfalltesting/?raw=1&materialprobe=1`

---

# 17. REPOSITORY / CACHE DETAILS

The production page references versioned app.js and service-worker caches.

Current recent build:
- app.js build 105
- service worker cache v105

When modifying source:
1. update app.js
2. update index build query
3. bump service-worker cache version
4. commit the complete controlled change
5. give the user the exact test URL.

Do not accidentally serve stale app.js through the service worker.

---

# 18. EXPECTED WORK STYLE

The user does not want a stream of tiny “I changed one line” updates.

Preferred workflow:
1. inspect deeply
2. identify a coherent hypothesis
3. make a narrow controlled change
4. deploy
5. provide one exact test URL
6. user reports actual phone result
7. incorporate result
8. continue from evidence.

Do not ask the user to rediscover project history.

Do not ask the user to repeat the goal.

Do not ask the user what was already documented here.

---

# 19. LONGER-TERM BLUEPRINT AFTER THE CAST IS SOLVED

The current color problem is a blocking graphics-foundation issue.

Do NOT resume broad game-content expansion until the rendering foundation is trustworthy.

Once the global cast is surgically corrected:

### Phase 1 — Restore/verify all advanced systems
- cinematic grade
- OutputPass
- SSAO
- bloom
- atmosphere
- sky
- environment/PMREM
- physical materials
- custom terrain/water shaders
- foliage
- architectural material integration
- lighting
- shadows
- character presentation.

### Phase 2 — Broad visual leap
Prioritize:
- coherent color palette
- natural daylight
- readable terrain
- beautiful architecture
- believable materials
- atmospheric depth
- strong composition
- high-quality silhouettes
- attractive vegetation
- character/world integration
- cohesive lighting.

### Phase 3 — World-quality pass
Only after the global presentation is strong:
- improve village/landmark design
- terrain transitions
- roads
- props
- vegetation distribution
- architectural variety
- environmental storytelling.

### Phase 4 — Gameplay/UI
Then expand:
- movement
- interactions
- NPCs
- combat
- inventory
- quests
- UI
- mobile controls
- progression.

### Phase 5 — polish
Only after broad quality:
- micro-geometry
- trims
- gutters
- vertex/detail optimization
- subtle material variation
- final performance tuning.

---

# 20. FINAL MISSION STATEMENT

The immediate mission is NOT “make the screenshot look better.”

It is:

**Find the exact operation or state interaction that is suppressing blue / producing the global green-yellow camera-space appearance, using controlled source-level forensic isolation, while preserving the complete modern renderer and world. Then remove or correct only that cause and restore every legitimate graphics system.**

The most important evidence currently available is:

**The world renders correctly through direct MeshNormalMaterial, but a known-good MeshBasic cube does not appear in the latest raw material-probe path.**

That contradiction is the next clue.

Start there.

Do not restart the investigation from fog, PMREM, lighting, cinematic grade, sun halo, or world geometry.

Do not sacrifice the modern build.

Continue exactly from Build 105.

# 21. SEPTEMBER 24, 2026 — LATEST HANDOFF CORRECTION

Do not begin the next chat by assuming the task is merely to neutralize the haze. The immediate problem is to preserve the real production world, explain why production architecture/material rendering becomes visually suppressed/dark while clean forensic rendering reveals the same geometry, and determine whether that mechanism is related to the original stagnant green/yellow camera-space cast.

The user's remembered history — that something may have improved the haze while architecture subsequently stopped rendering visibly — is a valuable hypothesis, but it is NOT yet proven by repository evidence. Do not state it as fact. Investigate the transition in source/commit history.

## Critical discoveries from Builds 123–134

- Build 123 (ea99a54a17a3f70879a944b041388b8e8304ef21, ?raw=1&archframe=1) isolated hero architecture and showed recognizable building shapes. Hero roots are identified by userData.architectureTier === 'hero'.
- Build 126 (17d28e317442943140017af7f3f399856a984af8, ?raw=1&archwire=1) showed the architecture as real 3D geometry. The user explicitly confirmed: “Yeah i see they are 3d.”
- Build 127 (b67b567f24f93d7cd3544784189921c3a7769f64, ?raw=1&archview=1) used a meaningful architecture camera. Black/orange changes were traced to the existing pointer-hover/emissive interaction system, not geometry creation.
- Build 128 (bcd9e9153a906612c8459d434021034c8e25168a, ?raw=1&archlit=1) is decisive: fresh neutral MeshStandardMaterial plus actual scene lights rendered the hero buildings clearly. User: “Yes i clearly see the buildings and the basic brownish materials.” This proves geometry, transforms, camera, bounds and illumination are healthy.
- Build 129 (f3f115c9f9ea639a82e10a8034d489b5c46c76ca, ?raw=1&archprod=1) cloned production materials while neutralizing shader hooks. User saw black-filled roofs and tan walls. This demonstrates a substantial difference between the clean material path and production material/scalar path.
- Build 130 (831f6ae36f938a0b85c6d335990d630753883dc0, ?raw=1&archmapless=1) stripped production texture maps and still looked essentially the same. User clarified roofs have enough color variation and edge lines to identify them. Do not waste time redesigning roof textures.
- Build 131 (?raw=1&archscalar=1) was intended to use entirely fresh scalar StandardMaterials. It was not runtime-verified; do not invent a result or SHA.
- Build 132 (f3d4b2642075dcc0b8251394ab8a3ff70fbf27e9) tested production direct rendering, with and without fog. User saw the same yellow haze in both. Therefore EffectComposer is not required for the haze and fog is not the cause. Do not restart generic composer/fog cycling.
- Build 133 (?raw=1&forensicinventory=1) added source/runtime inventory of materials, transparency, camera children, planes, sprites, shader hooks, ownership, depth/renderOrder, maps and emissive. It was not visually verified because the user had reached the attachment limit.
- Build 134 (6cac304bbe450272ea182f8498b7184710eae05d, ?raw=1&transparentprobe=1) hid transparent meshes/Sprites and directly rendered the remainder. User reported “No visible geometry.” This is not evidence that transparent objects caused the haze; it demonstrates again that broad raw diagnostics can interact badly with renderer/material/state. Do not continue broad transparent-object elimination.

## Correct Build 105 interpretation

Build 105 was a known-good cube sanity check, not a specific “haze fix hid architecture” experiment. It was reached after NormalMaterial could render the world while Basic/Lambert paths produced gray/blank results. The first material-probe implementation itself was invalid because traversal hid the root scene; this was documented in 402891da9435aef31d39c4d1a8495a00b3eb4b96 and corrected by b9eccd388e478305e582fb4c374129b516ddf5de. The corrected probe was historically verified as a visible white cube in Build 106. Always validate the diagnostic harness before interpreting its output.

## Current evidence matrix

Proven: world geometry exists; hero architecture is genuine 3D; meaningful architecture framing works; fresh neutral StandardMaterial plus real lights clearly renders hero architecture; direct MeshNormalMaterial can render the broader world; production architecture can become very dark/black in isolation; removing production texture maps does not materially change that architecture appearance; production direct rendering retains the yellow haze; production direct rendering with fog removed retains it.

Not proven: that one historical haze fix caused architecture suppression; that architecture shader hooks alone cause the global haze; that black roofs mean missing textures; that Build 131 changed anything; that a particular fullscreen plane/camera child is the haze layer; or that tone mapping/PMREM/lighting is the root cause.

High-value hypothesis: a shared renderer/material lifecycle or WebGL-state interaction may connect production material suppression, raw Basic/Lambert failures, successful NormalMaterial rendering, and the persistent global chroma. This is the next hypothesis to investigate.

# 22. MANDATORY NEXT-INSTANCE WORK ORDER

1. Read this entire manifest before touching the repo.
2. Inspect the current main source and current app/index/service-worker versions. Do not assume an old build is current.
3. Trace renderer state immediately before raw renderer.render(scene,camera): render target, viewport, scissor/scissor-test, camera projection/aspect, autoClear, depth/stencil, color mask, blending, culling, framebuffer state, composer buffers, and whether a non-default target remains bound.
4. Trace the hero architecture material lifecycle: source material → conversion/assignment → architectural physicalization → foundation/beauty/grounding hooks → needsUpdate → program compilation/cache → any freezeStaticVisuals/compileAsync path → production frame.
5. Inventory every camera/fullscreen contributor: camera children, PlaneGeometry, Sprite, ShaderMaterial, fullscreen quads, large transparent planes, renderOrder, screen-space shaders, vignette/grain, grade and camera-space effects.
6. Compare commit history around protected/modern-yellow-build85 (dc42717a89f81eadc98703ea64bdaa38729bbf3b) and the later green state. Specifically look for simultaneous changes to camera-space effects, OutputPass/color pipeline, architecture material integration, shader hooks, renderer state, visibility/frustum logic, sky/background and material freezing/compilation. Determine whether the user's remembered haze/architecture transition corresponds to an actual source change.
7. Only then create the next runtime diagnostic. It must answer one precise question and preserve the production world. Do not ship another diagnostic whose only result is “no geometry.”

## Communication/workflow constraints

The user has limited screenshot/attachment availability. Perform as much source-level work as possible before requesting another screenshot. Do not make the user launch a chain of low-information tests. Prefer one high-information controlled build after source investigation. Do not claim a visual fix without real runtime evidence.

Do not drift back into micro-detail art work. The current blocker is the rendering/material/state problem. Once it is surgically understood and corrected, restore all legitimate modern systems and return to the original goal: stunningly beautiful, cohesive, immersive RuneScape-inspired visuals with a modern rendering foundation.