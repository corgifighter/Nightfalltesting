# HEARTHMERE / NIGHTFALL REBORN — FULL CONTINUATION HANDOFF
Date: 2026-09-20
Repository: corgifighter/Nightfalltesting
Reference/asset repository: corgifighter/Test-screen

## NON-NEGOTIABLE DIRECTIVE: SPEED HAS NO VALUE

The user explicitly rejects rushed 1–3 minute passes, superficial tweaks, incremental cosmetic polishing, fake screenshots, and “good enough” implementations.

Correct operating mode:
- Deeply inspect the existing project before changing it.
- Pick ONE major visual system at a time.
- Push that system as far as technically and artistically possible.
- Make a large, coherent reconstruction, not a small iteration.
- Spend the necessary time reasoning through geometry, materials, lighting, composition, interaction, performance, and integration.
- Then move to the next major system.
- Do NOT enter a screenshot/review loop after every tiny change.
- User specifically requested massive upgrades across every major target first, then visual review.
- Never confuse technical complexity, polygon count, or code volume with visual quality.
- Never declare a pass successful merely because it renders.
- If an asset/design is holding the project back, replace it. Nothing is sacred.
- Target is not merely “less Lego.” Target is an unbelievably beautiful, cohesive, handcrafted, atmospheric fantasy RPG world.
- A long, meticulous work turn is preferable to a fast answer. Speed is not an accepted currency.

## PROJECT NORTH STAR

Hearthmere / Nightfall Reborn is an original fantasy MMORPG-style browser game.

Influences:
- OSRS/RuneScape-style readability, charm and gameplay clarity are useful references.
- It must NOT become a RuneScape clone.
- Desired presentation: stylized realism with exceptional art direction.
- Modern architecture, lighting, materials, animation and environmental depth.
- Mobile-first browser playability.
- Real Three.js WebGL scene.
- Small vertical slice first, but it must feel like a genuine game world rather than a graybox/prototype.

Desired visual progression:
beautiful at first glance → believable at second glance → rich when examined closely → cohesive → atmospheric → handcrafted → strongly fantasy-specific.

Reject:
- primitive early-2000s indie appearance
- low-poly asset-pack appearance
- Lego/diorama world
- flat board with buildings on it
- placeholder environment
- procedural mush
- empty terrain
- fake concept-art screenshot

## USER'S KEY VISUAL FEEDBACK

Latest previously verified mobile screenshot showed:
- real Three.js world
- pale/cream terrain
- primitive spherical/bubble tree forms
- flat path
- blocky building
- narrow turquoise river
- tiny player
- high/diorama-like camera
- muddy/low-contrast lighting
- HUD acceptable but world weak

User said:
- only marginal improvement
- gap remains enormous (“million times better” was intentionally hyperbolic)
- world looked like Lego/diorama/prototype
- goal is NOT merely to stop looking like Lego
- goal is unbelievably beautiful
- no attachment to existing assets/designs
- nothing is off limits
- massive overhaul required
- visual quality takes priority over micro-detail
- do not waste time on vertex counts, gutters, tiny trims, etc. while global quality is far below target.

## MASTER VISUAL PLAN

Major systems, in priority order:
1. Renderer/image quality
2. Architecture reconstruction
3. Material system
4. Terrain surface/landform quality
5. Vegetation
6. Rocks/natural geometry
7. Water
8. Character
9. Atmospheric depth
10. Lighting/cinematography
11. Camera/composition
12. Environmental animation/life
13. World dressing/storytelling
14. VFX
15. UI/UX
16. Weather/time of day
17. Performance architecture
18. Full art-direction review
19. Repeat weakest major system

Renderer foundation is already strong enough. Do not endlessly micro-tune renderer without evidence. Content/art direction is the bottleneck.

## ENGINEERING FOUNDATION ALREADY COMPLETED

Completed:
- deterministic seeded RNG
- reusable cylinder/sphere/rock/tree geometry caches
- scene telemetry
- visible mesh/shadow/transparent/light budgets
- texture telemetry
- authoritative readiness state
- real capture metadata
- capture telemetry bug fixed
- interaction raycasts isolated to explicit interaction roots
- navigation abstraction
- legacy visual GLB roots removed after replacement
- stale hero mesh references repaired
- procedural character animation references repaired
- static reconstructed visuals can be matrix-frozen
- shadow map cadence throttled
- GPU geometry/texture/program telemetry
- service-worker failure semantics hardened
- adaptive quality uses rolling p95-style evidence
- runtime diagnostics for errors/rejections/WebGL context loss
- shader precompilation
- CC0 enhancement textures initialized before readiness

Current service-worker cache: v26.

## RENDERER FOUNDATION

Three.js 0.181.1 with:
- WebGLRenderer
- capped pixel ratio
- EffectComposer
- RenderPass
- SSAO
- UnrealBloom
- FXAA
- OutputPass
- PCF soft shadows
- sRGB output
- AgX tone mapping
- custom sky/environment
- dynamic sun/moon/hemi/fill
- fog
- PMREM environment
- shader precompilation
- readiness diagnostics

Do not spend the next turn on tiny renderer adjustments unless a concrete runtime problem requires it.

## DEEP PASSES ALREADY COMPLETED

### Architecture
Recent commits:
- 7d8ae1b56ef49b2268b214a9dc1fa3ff716a8bd3
- 46b4850562d7a9041db51136aa25812a831ea6f2

Work:
- beveled building masses
- layered roof construction
- differentiated gables
- thick eaves/ridges
- recessed openings
- chimneys
- gable trims
- dormers
- landmark-specific silhouettes
- distinct cottage massing
- projecting secondary volumes
- cottage-specific roofs
- porches
- additional facade framing/windows

### Terrain
Commit:
422a1917bd81af41301004972f6490bf822ba865

Work:
- authored warped landform field
- 192x192 terrain subdivisions
- settlement basin
- river valley
- southern approach
- multiple ridge frequencies
- meadow/landform variation
- terrain-conforming road ribbons
- world-space biome response
- darker soil/grass values
- river wetness influence
- path wear

Goal: eliminate flat game-board appearance.

### Vegetation
Deep ecological layering:
- hero groves
- companion trees
- wet woodland edges
- western woodland
- meadow/forest transition
- village outskirts
- river ferns
- meadow grasses
- forest-floor rocks
- irregular density gradients
- controlled clearings

Do not blindly add hundreds more objects; eventually use telemetry.

### River
Deep waterway reconstruction:
- irregular river centerline
- variable width
- water ribbon
- water glow
- authored bank ribbons
- wet soil patches
- river stones
- foam rings
- shoreline glints
- reeds

Shared fields:
- riverCenterX(z)
- riverHalfWidth(z)

### Materials
World-space surface variation added to:
- timber
- stone
- roofs
- trunks
- architecture materials

Plaster has multi-scale world-space variation and roughness variation.
PBR wood/roof/stone maps are integrated into architecture materials.

### Atmosphere
Commit:
422a1917bd81af41301004972f6490bf822ba865

Added:
- distant forest horizon
- far trees
- distant ridge forms
- atmospheric depth veils
- subordinate background silhouettes

### Lighting
Commit:
427d94df999123f6a230434ef86e71c70a9c35cf

Added:
- authored warm local lights around inhabited structures
- cool river fill
- dynamic day palette
- dynamic sun elevation/color
- dynamic fog
- controlled environment response

### Character
Commit:
86aa75e372a4bd1f9b4cfbf651becfa0858b62ec

Rebuilt procedural hero:
- layered torso
- chest volume
- hem/belt
- neck/head/jaw
- hair and side locks
- nose/eyes
- articulated upper/lower arms
- gloves
- articulated legs
- knees/shins
- boots
- split tunic
- cloak
- clasp
- weapon

Preserved animation targets:
parts.arms
parts.legs
parts.cloak

### Camera
Commit:
89be9d3f0ae5c671fd94818d26cb9a82ea4f60a9

Changed:
- FOV 52
- closer/lower camera
- min distance 5.5
- max distance 46
- lower polar angle
- target raised toward player
- forward-biased focus
- less tabletop/diorama composition

### Environmental storytelling
Latest commit:
9e0f06bbe5cfddb2c06877aad15931b7cef07f5f

Added authored activity zones around:
- Warm Lantern / inn frontage
- Riverside Forge
- Chapel yard
- Ashwheel Mill
- North Watch
- River work edge

Props include tables, benches, barrels, fuel, tools, ore, grave markers, candles, grain/sacks, loading structures, defensive clutter, flags, work platforms and baskets/skiff-related props.

Goal: places should look inhabited and functional, not like isolated decorative meshes.

## IMPORTANT CURRENT STATE

The newest multi-system visual build has NOT yet been verified through the user's phone screenshot loop.

Do not claim it is visually successful.
Do not claim source changes equal runtime proof.
Do not fabricate a screenshot.

The user deliberately wants the screenshot/review loop postponed until after substantial reconstruction across the major systems.

Also note: the newest cluster of visual changes should eventually receive parser/runtime validation before further escalation if needed.

## NEXT MAJOR SYSTEMS TO DEEPEN

Already deeply attacked:
architecture, materials, terrain, vegetation, river/water, character, atmosphere, lighting, camera, environmental storytelling.

Remaining major systems:

### Natural geometry / rocks
Deeply reconstruct:
- rock silhouette library
- moss/weathering
- scale hierarchy
- cliffs/boulders
- river stones
- exposed soil transitions
- roots
- stumps/deadwood
- geological clustering
- shadow relationships

Use CC0 Poly Haven assets where they materially improve realism. Distill/LOD as needed.

### Environmental animation/life
Deep pass:
- tree/foliage wind
- grass movement
- flags
- water motion
- smoke
- forge embers
- chimney smoke
- birds/insects where appropriate
- subtle NPC activity
- animated light flicker
- layered ambient movement

Avoid uniform bobbing/oscillation. Use multiple frequencies/phases.

### VFX
Deep pass:
- water sparkle
- fire/embers
- smoke
- dust
- pollen/motes
- restrained fantasy/environmental particles

### UI/UX
HUD is currently not the primary bottleneck.
Eventually improve:
- hierarchy
- typography
- inventory/equipment
- touch controls
- minimap
- transitions
- interaction feedback
- quest presentation

Do not let UI displace world reconstruction.

### Weather/time of day
Deep pass:
- sunrise/sunset
- clouds
- rain
- fog
- wet surfaces
- night
- moonlight
- firelight
- weather transitions

### Performance architecture
Later:
- explicit hero/mid/far LOD
- InstancedMesh where justified
- chunking
- texture duplication analysis
- KTX2/Basis
- remaining legacy GLB metadata migration
- vendor Three.js dependency chain
- optimize without visually degrading the target.

## ASSET STRATEGY

Poly Haven research established:
- CC0
- commercial use
- no attribution required
- high-quality HDRIs
- photogrammetry PBR textures
- realistic models

Useful researched assets:
Tree Small 02; Island Tree 02; Island Tree 03; Rock Moss Set 01; Shrub 02; Forest Ground 01; Medieval Wood; Medieval Blocks; Medieval Wall; Medieval Red Brick; Large Castle Door; Root Cluster; Tree Stump; Forest Slope HDRI; Medieval Cafe HDRI.

Vendored:
assets/cc0/polyhaven/rock_moss_set_01.glb
assets/cc0/polyhaven/shrub_02.glb
assets/cc0/polyhaven/fern_02.glb
assets/cc0/polyhaven/grass_medium_01.glb
assets/cc0/polyhaven/shrub_04.glb
assets/cc0/polyhaven/wild_rooibos_bush.glb

Principle:
Never reject an exceptional source asset merely because raw representation is expensive.
Pipeline:
source → analyze → retopologize/simplify → bake normals/AO/material detail → LOD → integrate → instance/batch.

Do not use low-poly asset packs as primary art solution.

## ENGINEERING BACKLOG

1. Validate shadow classification with actual performance data.
2. Establish explicit hero/mid/far LOD policy.
3. Expand navigation blockers beyond river/bridge.
4. Analyze texture telemetry for duplicate/heavy families.
5. Remove remaining hidden/legacy binary dependencies where practical.
6. Vendor remaining Three.js runtime dependency chain.
7. Evaluate KTX2/Basis.
8. Use InstancedMesh/chunking for repeated foliage only when evidence supports it.
9. True LOD after visual asset quality is established.

## BOOT BUG HISTORY

Previous real mobile screenshot exposed:
Cannot access 'rockGeometryCache' before initialization

Fixed by moving rockGeometryCache above world-environment construction, removing duplicate declaration, and advancing SW cache.

Fix commit:
27a37c9730dbe43e687a2dc71417812f9f7631d

Do not reintroduce initialization-order problems.

## MOBILE / HUD STATE

Earlier mobile work:
- inventory hidden by default on mobile
- MENU opens inventory
- minimap hidden on phone
- compact quest panel
- compact hotbar
- cinematic mode hides HUD but preserves scene
- CAPTURE/CINEMATIC remain accessible

User tests from Android phone/browser.
User wants:
- launchable in phone browser
- actual runtime frame
- accurate capture from real WebGL canvas
- no fake concept screenshots

## QUALITY GATE

Runtime:
- GitHub Pages loads
- no black screen
- no fatal console errors
- Three.js/GLBs/textures load
- service worker safe
- refresh works
- mobile works
- real capture works

Character:
- natural movement
- grounded
- readable silhouette
- convincing animation

World:
- authored architecture
- believable landforms
- ecological vegetation
- river integrated into landscape
- materials respond to light
- atmospheric depth
- lighting hierarchy
- world life
- functional storytelling

Visual:
- not Lego
- not low-poly
- not graybox
- not primitive early-2000s
- not empty
- not procedural demo
- strong fantasy identity
- stylized realism
- cohesive art direction
- attractive immediately
- believable on closer inspection
- rich when examined

## DO NOT

Do not:
- make tiny roof tweaks and call them major
- tweak polygon counts while global quality is poor
- obsess over gutters/tiny trims/vertex counts
- preserve bad assets because they already exist
- produce concept art instead of modifying the actual game
- provide fake screenshots
- claim an unverified build works
- rush due to token/time pressure
- stop after one implementation pass
- add arbitrary detail without composition/material/lighting logic
- make every tree/rock/prop identical
- create a dense procedural forest that destroys readability
- sacrifice visual quality merely for easy optimization
- return to renderer micro-tuning without concrete evidence

## COMMUNICATION EXPECTATION

User prefers:
- decisive execution
- minimal progress chatter
- long uninterrupted work turns
- actual repository changes
- factual reporting
- no premature celebration
- no pretending

“Continue” means continue doing deep work.
“Go” means proceed without asking permission.
When a major system is below target, reconstruct it.

## EXACT CURRENT POSITION

Current campaign sequence:
Architecture
→ Terrain
→ Vegetation
→ River
→ Materials
→ Atmosphere
→ Lighting
→ Character
→ Camera
→ Environmental storytelling

Latest known commit:
9e0f06bbe5cfddb2c06877aad15931b7cef07f5f

Service worker:
v26

Next instance should:
1. Read this document.
2. Read current app.js before modifying it.
3. Inspect recent commits if necessary.
4. Continue the deep reconstruction campaign.
5. Pick the next major remaining system.
6. Work deeply on it.
7. Do not enter screenshot loop prematurely.
8. Maintain visual north star.
9. Only after major systems have received substantial reconstruction should the user be asked for a real mobile frame.

## FINAL DIRECTIVE

This is not a speed challenge.
Speed is not an accepted currency here.

A long, carefully reasoned reconstruction that materially advances visual quality is worth more than a fast superficial answer.

Treat this as an inherited production project, not a fresh chat.

DO NOT reset the plan.
DO NOT downgrade the ambition.
DO NOT settle.
CONTINUE THE DEEP WORK.


## RENDER LAB — 2026-09-25

This branch is a protected experimental clone of the modern authored-world renderer. The real/default copy was not modified.

Clone branch:
- render-lab-modern-2026-09-25
- base: 46aaae6d8013e3e472f1783d52638f4fcf26fd67

### New investigation

The prior forensic record said GraphicsSunHalo had been ruled out. Source inspection found a critical continuity problem: the halo was later reintroduced by buildGraphicsMasterPass after that historical test.

The current implementation created a depthTest=false, fog=false, AdditiveBlending Sprite with a 28-unit scale. That is materially different from a normal world object and can contaminate the camera image while leaving HUD/CSS sharp. This is therefore a legitimate modern-regression candidate, not a repeat of the old test.

The lab disables that reintroduced halo while preserving:
- authored world geometry
- production materials
- sky
- sun disc
- fog
- environment/PMREM
- SSAO
- bloom
- cinematic grade
- OutputPass
- lighting
- camera
- gameplay

### Additional presentation hardening

The lab also resets cached WebGL state immediately before the normal multi-pass render and again on composer failure. It explicitly restores:
- default framebuffer target
- scissor disabled
- autoClear color/depth/stencil

This is intended to catch stale WebGL state leaking from shadows, transmission, custom materials, or other renderer work into fullscreen presentation. It does not alter authored scene content.

### Research basis

Three.js documents EffectComposer as an ordered pass chain whose last enabled pass renders to screen, and OutputPass as the final tone-mapping/color-space stage. Three.js also documents renderer.resetState() as the public mechanism for resetting cached WebGL state. These are the basis for the lab changes.

### Next decision

Test this branch on the actual Android browser. If the stagnant yellow/green wash changes materially, keep the relevant correction and continue from the intact production scene. If it does not, do not revert to geometry isolation; continue looking for modern-only presentation contamination, especially other depthTest=false / blending / fullscreen-space primitives and renderer-state mutations.


## RENDER LAB — STAGE PROVENANCE INSTRUMENTATION — 2026-09-25

After comparing against the documented history, the lab did NOT repeat the already-tested cinematic-grade bypass, OutputPass bypass, fog/atmosphere stripping, or geometry isolation.

New commit:
- 57aa344c9d68578a2b5cdb38b79f36ac7ccd6b2c

The protected render-lab branch now contains an opt-in query mode:
- `?stageprobe=1`

This mode keeps the complete authored production scene intact and performs a one-time render provenance sequence:
1. direct production renderer
2. RenderPass only
3. RenderPass + SSAO
4. RenderPass + SSAO + Bloom
5. RenderPass + SSAO + Bloom + cinematic grade
6. full chain including OutputPass

At each stage it samples the actual framebuffer/intermediate EffectComposer buffer at multiple screen positions and records average RGB, center RGBA, and green-minus-red / blue-minus-red deltas in:
`window.__HEARTHMERE_STAGE_PROVENANCE`

This is intended to answer the key question that previous tests did not establish: **at which exact render stage does the intact modern world first acquire the thermal yellow/green cast?** It does not substitute geometry, replace materials, or strip world systems.

Important implementation detail: the diagnostic restores every pass's enabled state and renderer framebuffer state in a finally block, then normal production rendering resumes. It is not a permanent production presentation change.

Cache/query version was advanced to app build 64 / service-worker cache v64 so Android testing cannot silently reuse the previous cached app.js.

### Required next test
Launch the protected render-lab build with `stageprobe=1` on the actual Android browser. The useful evidence is the console/window diagnostic object and, separately, whether the normal visible world remains the same thermal-washed presentation. Do not interpret any geometry-isolation result as relevant evidence; none is used here.


## 2026-09-25 Render-stage provenance instrumentation
The render-lab remains based on intact modern production world. No geometry isolation, material substitution, fog stripping, cinematic-grade bypass, or OutputPass bypass was added in this pass.

A new query mode `?stageprobe=1` was added to `app.js`. Once the real production world is ready, it performs one controlled provenance sweep over the same authored scene:
1. direct renderer scene output
2. RenderPass
3. RenderPass + SSAO
4. RenderPass + SSAO + Bloom
5. + cinematic grade
6. + OutputPass / final screen

It samples multiple framebuffer points at each stage and stores the result in `window.__HEARTHMERE_STAGE_PROVENANCE`, while restoring the normal pass state afterward. The purpose is to identify the FIRST stage where the thermal yellow/green contamination appears, rather than repeating already-documented effect-disable experiments.

Important: the mode is diagnostic instrumentation only. It does not replace world geometry or materials and must not be interpreted as a geometry test. Android browser output remains authoritative. Build/cache was bumped to v65.

## 2026-09-25 — MAXIMAL MODERN COLOR-ERROR CONTROL TEST

User-directed strategy: stop geometry isolation. The intact modern authored world is the control subject. The new test disables every plausible presentation/color contaminant simultaneously on the protected render-lab branch. The purpose is binary: if the world becomes normally colored/sharp, reintroduce systems in small batches; if the wash survives, the search moves below the quarantined presentation stack into the remaining opaque material/texture/renderer path.

### Systems deliberately disabled in one shot
- Global scene fog and all dynamic fog color/density updates.
- Procedural sky sphere and sun-disc visual.
- PMREM scene environment and environment intensity/rotation.
- Entire EffectComposer path: RenderPass, SSAO, UnrealBloom, cinematic grade ShaderPass and OutputPass.
- Renderer tone mapping/exposure; control uses NoToneMapping and sRGB canvas output.
- Renderer transmission resolution enhancement.
- Shadow map generation and all object cast/receive shadow participation.
- All scene lights are forced to neutral white; hemisphere ground color is white; animated light-color changes are suppressed by the control frame guard.
- All sprites, points, lines and every mesh using transparency, sub-1 opacity, non-normal blending, depth-test/write suppression, transmission, alpha-hash or non-tone-mapped presentation is hidden. This catches smoke, mist, glints, clouds, labels, fireflies, foliage cards, water/glass overlays, glow layers, additive/depth-independent primitives and similar image contamination.
- All emissive colors/maps/intensities are removed from remaining opaque materials.
- All material environment maps/intensities, clearcoat, sheen, iridescence, transmission and specular intensity are removed.
- Material fog participation is disabled.
- All application-installed onBeforeCompile shader mutations are removed and materials marked needsUpdate, eliminating the graphics-foundation world-space color/edge/foliage/grounding/water shader modifications from the control.
- Material onBeforeRender hooks are removed.
- CSS vignette and grain overlays are hidden.
- The frame loop reasserts the control because the production simulation normally rewrites fog, exposure, environment intensity, light colors and animated presentation elements every frame.

### What is intentionally preserved
- The complete authored modern world geometry and its transforms.
- The production camera and camera-follow behavior.
- Opaque base material colors and their ordinary color maps.
- Opaque world meshes and their geometry hierarchy.
- Character/world transforms and gameplay movement.
- Normal WebGLRenderer direct rendering to the real canvas.

Three.js documentation supports this separation: Scene fog affects everything rendered in the scene; Scene.environment affects physical materials; EffectComposer executes ordered post-processing passes; OutputPass performs tone mapping/color-space conversion; material onBeforeCompile can modify built-in shaders and requires needsUpdate when recompiling. These are the mechanisms being controlled, not an invented geometry test.

### Current control-test commits
- app.js maximal control implementation: 197f712629fc2e9b267168a6db83c8067442d10f
- Pages shell: e307911f5a47c31a1f3837011bd5b3c49ec8c30a
- Pages packaging correction: 8bedb6b833149c02a0f591f03d9735ef1d2ee339
- branch: render-lab-modern-2026-09-25
- query: ?colorcontrol=1

### Required interpretation after mobile test
A clean/sharp normally colored intact world means the root is in the quarantined set. Re-enable in small coherent batches, with a real mobile visual check after each batch, until the error returns. Suggested order: (1) opaque material shader hooks/world-space material variation, (2) environment/reflections, (3) neutral-to-authored lighting, (4) shadows, (5) atmosphere/fog/sky, (6) translucent world/VFX layers, (7) SSAO, (8) bloom, (9) cinematic grade, (10) OutputPass/tone mapping. Do not re-enable several unrelated systems at once.

If the maximal control still shows the same stagnant yellow/green wash over the intact world, do NOT return to worldframe/worldscalar/geometry isolation. The remaining high-value suspects are the opaque base textures/material colors, texture color-space handling, renderer/canvas output path, or another render-state mutation not covered by the control. Preserve this control build as a forensic reference.

## TERMINAL SESSION FINDING — 2026-09-25 — STARTUP WATCHDOG CAUGHT A STALE DIAGNOSTIC SYMBOL

The latest Android screenshot is important evidence and must be interpreted correctly.

### What the screenshot showed

The Render Lab URL with ?renderlab=pages-89&framebufferprobe=1 displayed a large STARTUP WATCHDOG panel reporting:

- window error: Uncaught ReferenceError: sterileVisualMode is not defined
- source: the live app.js
- line: 3504:3

The underlying Hearthmere HUD was visibly present behind the watchdog (title/quest/vitality/hotbar/cinematic controls), proving this was not a Pages/HTML blank-page failure and not evidence that the authored world had disappeared.

### Exact cause

The frame loop still contained this stale call:

    if(sterileVisualMode)applySterileVisualMode();

but the corresponding sterileVisualMode declaration/function had already been removed during later diagnostic cleanup. Therefore the browser entered the frame function and threw a ReferenceError before completing the normal render/probe sequence.

This was a diagnostic-code continuity bug introduced by our own investigation, not a discovery about the game's geometry, materials, haze, or renderer.

### Immediate repair already committed

Commit: 5fb36fd8e58049d848c78ff5d01b035f38019834
Message: Remove stale sterile visual diagnostic call that halted the frame loop

The stale invocation was removed. The sterile visual diagnostic is retired and must NOT be resurrected as a new geometry-isolation path.

The Pages shell is currently cache-busted to:
    app.js?renderlab=pages-89&framebufferprobe=1

The index already contains the startup watchdog that unregisters stale service workers, reports window errors/unhandled rejections, reports module-load failures, and times out if app.js never starts.

### Important interpretation for the next instance

1. Do not treat the screenshot's dark/obscured appearance as the rendering result. The watchdog overlay covers most of the viewport.
2. Do not return to geometry isolation. The production modern scene has repeatedly been confirmed to contain the complete authored world underneath the yellow/green contamination.
3. The immediate task after this chat is to verify that the repaired frame loop now reaches runFramebufferProbe() and produces its measured framebuffer panel.
4. If the framebuffer probe appears, record its actual canvas dimensions, DPR, contextLost state, GL error, average RGBA, center RGBA, draw calls, and postFailed state. Those measurements are the next evidence.
5. If another runtime error appears, fix that concrete startup/frame-loop error before interpreting any visual result. Do not infer a renderer/geometry cause from a JS exception.
6. Optional shader precompile is now guarded by the explicit ?precompile query flag; normal launches do not block on renderer.compileAsync. This removes the earlier concern that startup might stall before the frame loop.
7. The material-binary diagnostic remains retired/invalid. Do not revive it.
8. The sterileVisualMode diagnostic remains retired. Do not revive it.

### Current render-lab chain after this repair

- Protected modern-world forensic base: 46aaae6d8013e3e472f1783d52638f4fcf26fd67
- Render-lab branch lineage: render-lab-modern-2026-09-25
- Latest main repair commit: 5fb36fd8e58049d848c78ff5d01b035f38019834
- Current diagnostic query: ?renderlab=pages-89&framebufferprobe=1
- Known haze-free historical reference: 25a725ad2b8622ed41fb4736f2e4f2ebc82d76fe
- Protected advanced-world forensic reference: 46aaae6d8013e3e472f1783d52638f4fcf26fd67

### Do not lose the central problem

The real production target remains:

intact modern authored world visible + eliminate the stagnant yellow/orange/green camera-wide wash and severe softness.

The no-geometry white/blank diagnostic states from Builds 135–144 were artifacts of forensic isolation and are not the production failure. The modern game already has geometry; the job is to identify and correct the presentation/color contamination without destroying that world.