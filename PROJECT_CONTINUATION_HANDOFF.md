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


---

# 21. BUILD 105 FORENSIC BREAKTHROUGH — SCENE ROOT VISIBILITY BUG

**Identified after source inspection of commit `126e07a04c8df7609e9bdd2cde2ae2aaf2d226ce`.**

The Build 105 material-probe test was not actually testing the known-good cube correctly. Its code traversed the entire scene and set visible=false without excluding the root `scene` object. Because `scene` itself is traversed, the diagnostic set **`scene.visible = false`**. It then added the cube as a child of that invisible Scene and called `renderer.render(scene,camera)`. An invisible root Scene suppresses the entire render tree, including the probe. The cleanup restored the child objects but never restored the Scene root visibility.

This precisely explains the user's latest observation: **“No cube or geometry in sight.”**

It is therefore **not evidence that MeshBasicMaterial, the renderer, the camera, or the WebGL framebuffer cannot display a trivial cube.** The diagnostic itself was invalid.

### Surgical fix committed
Commit: `b9eccd388e478305e582fb4c374129b516ddf5de`

The probe now:
- explicitly excludes `scene` from the hide traversal;
- records `priorSceneVisible`;
- explicitly sets `scene.visible=true` before the probe render;
- restores `scene.visible` after the probe;
- otherwise leaves the Build 105 diagnostic architecture unchanged.

No production material, lighting, post-processing, world geometry, or modern renderer system was changed by this fix.

### NEXT REQUIRED TEST

Retest the corrected known-good cube probe:

`https://corgifighter.github.io/Nightfalltesting/?raw=1&materialprobe=1`

Expected diagnostic behavior if the probe path is now valid: a plainly visible white cube on a dark gray background. This is a **diagnostic expectation, not yet a verified runtime result** until the user launches the deployed commit.

If the cube appears, immediately proceed to the next controlled source-level comparison rather than randomly changing materials. If it still does not appear, inspect renderer/WebGL state and framebuffer/viewport/scissor state around the direct render call.

Do not restart the investigation from fog, PMREM, lighting, cinematic grade, or missing world geometry.


---

# 22. BUILD 106 FORENSIC RESULT — BASICDIRECT TEST ALSO REQUIRED HARDENING

The corrected `?raw=1&materialprobe=1` test was successfully verified by the user: the white cube is visible, with no other world geometry visible.

This establishes that the fundamental direct-render path is working: WebGL context, Three.js renderer, canvas/framebuffer, camera/projection/viewport, and a known-good MeshBasicMaterial all function. The previous missing-cube result was caused by the Scene-root visibility bug in the diagnostic.

The next test was `?raw=1&basicdirect=1`, intended to replace production world materials with a plain white MeshBasicMaterial. User result: no geometry visible.

Source inspection revealed that the original `basicdirect` diagnostic used `scene.traverseVisible(...)`. That is not a sufficiently strong geometry test because a hidden ancestor/group prevents its descendants from being visited. The diagnostic could therefore report no geometry even when meshes exist under an invisible parent.

## Surgical forensic fix

Commit: `89f4aa31f078be20d8abead7214db2a1c6ba5462`

`basicdirect` now walks the complete scene graph with `scene.traverse(...)`, records every object's prior visibility, temporarily forces the traversed hierarchy visible, replaces every mesh material with the known-good white MeshBasicMaterial, disables frustum culling on tested meshes, renders with the sky hidden and post-processing bypassed, records `window.__HEARTHMERE_FORENSIC_BASIC_DIRECT_STATS`, and restores the original scene state afterward.

This is still a reversible diagnostic only. No production world material or art system has been altered.

## NEXT REQUIRED TEST

Launch:
`https://corgifighter.github.io/Nightfalltesting/?raw=1&basicdirect=1`

Do not interpret the previous no-geometry result as proof that world geometry is absent. It was not a sufficiently strong test because of `traverseVisible`.

Interpret the hardened test:
- World appears white: geometry/transforms/hierarchy are valid; move into production material/shader isolation.
- World still absent: use the new forensic stats and inspect object transforms/bounds/root organization. At that point the problem is genuinely upstream of production materials.
- Partial world: identify which root/group survives and isolate the missing layer.

Do not change fog, PMREM, tone mapping, cinematic grade, or lighting until this hardened geometry test identifies the responsible layer.


## Build 107 — post-build world probe

The hardened `basicdirect` test still produced no visible world geometry on the phone. This does **not** yet justify changing fog, lighting, post-processing, or assets. A new forensic mode was added that runs **after the entire async world-construction pipeline has completed**, then traverses the complete scene, forces hierarchy visibility, replaces every mesh material with a known-good white `MeshBasicMaterial`, disables frustum culling, computes aggregate world bounds, adds a red 3-unit anchor cube at the camera target, and performs a direct `renderer.render(scene,camera)`.

Test URL:
`https://corgifighter.github.io/Nightfalltesting/?raw=1&worldprobe=1`

Interpretation:
- Red anchor + white world: production geometry exists and the failure is in the earlier diagnostic timing/path; move into material/shader isolation.
- Red anchor only: world meshes exist but their aggregate placement/visibility is not in the camera view; inspect recorded bounds and transforms.
- Blank: if the red anchor is also absent, this is a direct-render invocation/timing problem despite the previously successful isolated cube, so inspect the render-loop/diagnostic branch itself rather than guessing about fog.
- Any visible subset: isolate the surviving world roots by name/type before touching production rendering.

Commit: `2611cce6993bc887bc0f4678d22932d21bf6bde3`

## Build 108 — WORLD PROBE RESULT AND NEXT ISOLATION

User verified `?raw=1&worldprobe=1`: the red 3-unit probe cube is visible; walking the player over the cube makes the player silhouette visibly contrast against it; no other world geometry is visibly apparent.

Important interpretation:
- Uniform white is NOT a sufficient explanation. The probe uses MeshBasicMaterial on a dark clear color, so any world mesh actually inside the camera frustum should still have been visible.
- The result therefore points toward a remaining distinction between world mesh placement/frustum visibility and the production material/color pipeline.
- Because the red anchor renders, the direct renderer/camera path is still proven.
- Do not change fog, lighting, tone mapping, cinematic grade, PMREM, or production assets based on this result.

Build 108 changed only the forensic world probe:
- excludes the sky from aggregate world bounds;
- forces the complete hierarchy visible;
- disables frustum culling;
- replaces every world mesh with a vivid, distinct MeshBasicMaterial color;
- disables depth testing/writing for the diagnostic materials so one hidden foreground mesh cannot mask all others;
- keeps the diagnostic direct-render path active through subsequent raw frames instead of relying on a single one-time render;
- records aggregate bounds/camera/target telemetry.

Commit: `8f7c42d527cf23cd737b7bb518b0f6fcc507b520`

Next test:
`https://corgifighter.github.io/Nightfalltesting/?raw=1&worldprobe=1`

Interpretation:
- Vivid colored world appears: world geometry is in the camera frustum; the previous white result was a visibility/readability issue and production material isolation can begin.
- Only red cube/player remains: world meshes are not reaching the current camera frustum despite forced visibility/culling bypass; inspect aggregate bounds and transforms next.
- Vivid partial geometry: identify which world roots/layers occupy the frustum before touching production rendering.

## Build 108 — VERIFIED VIVID WORLD RESULT

User has now supplied a real Android browser screenshot from:
`?raw=1&worldprobe=1`

The screenshot **does show the world geometry clearly in vivid per-mesh diagnostic colors** across the frame: terrain masses, paths/roads, river, trees/foliage, structures and other environment geometry are visibly present. The red WORLD_PROBE_ANCHOR is also visible, and the player silhouette is visible when overlapping/near it.

This resolves the ambiguity from the prior white diagnostic result.

### Proven by this result

- World meshes are actually present after the complete asynchronous world build.
- The forced-visibility traversal reaches the world geometry.
- World geometry is not simply absent from the scene.
- The camera/frustum relationship is sufficiently valid for substantial world geometry to render.
- The direct renderer path is valid.
- The earlier uniform-white result was a diagnostic/readability limitation, not proof that the world was outside the camera frustum.

The screenshot is intentionally ugly because Build 108 replaces production materials with vivid diagnostic MeshBasicMaterial colors. That is expected and is **not** a production visual regression.

### Investigation status

The geometry layer is now cleared enough to move to the **production material/shader/color pipeline** without guessing about fog, lighting, PMREM, camera placement, or missing world geometry.

Do NOT undo the production material system or redesign assets. The next comparison must be controlled:

1. Launch the same build with `?raw=1` **without** `worldprobe=1`.
2. This uses the actual production materials/shaders and lighting while bypassing EffectComposer/post-processing.
3. Compare it directly against the vivid worldprobe frame.
4. If the production direct frame is already structurally correct but hazy/wrong-colored, isolate production material/shader hooks next.
5. If production direct is clean but normal presentation is hazy, then the remaining culprit is in the composer/final image pipeline and can be isolated without touching world materials.

Do not return to random fog/lighting changes. We now have a controlled A/B path.


## Build 109 — UNCOMPILED HOOK TEST RESULT

User tested:
`?raw=1&uncompiled=1`

Result: **no visual change**. The production world remained essentially a uniform gray-green field with only the player marker/small silhouettes visible.

This means simply replacing the `onBeforeCompile` hooks with no-op hooks during a direct render does **not** restore the missing world.

### Build 109 next isolation

The existing Lambert forensic branch was hardened so it now:
- traverses the complete scene graph rather than `traverseVisible`;
- forces every ancestor/object visible;
- replaces every world mesh with one shared plain `MeshLambertMaterial`;
- disables frustum culling;
- removes PBR textures, normal maps, transparency, custom shader hooks, and material-specific shader state;
- bypasses EffectComposer via the raw direct render;
- leaves the forensic state active for the URL session.

Commit: `232f135be63be542d4e19aaf061779f82f986f0f`

Next test:
`https://corgifighter.github.io/Nightfalltesting/?raw=1&lambertdirect=1`

Interpretation:
- If the world appears: production PBR/material configuration is the culprit; isolate texture/opacity/material state next.
- If the world still disappears: the failure is not specific to production shader hooks or PBR materials. Move downward to renderer state/scene render-state or inspect the actual mesh draw state and transforms, while retaining the successful Build 108 world probe as the geometry baseline.

Do not change production art, fog, lighting, or assets until this test is resolved.


## Build 110 — CACHE INVALIDATION CORRECTION

User tested the hardened Lambert diagnostic URL and reported **no visual change**.

Before drawing another renderer/material conclusion, the repository was inspected for delivery/caching. The project has a service worker that precaches `./app.js`. Its cache key was still `hearthmere-nightfalltesting-v106`, while the forensic app.js has been modified through Builds 108/109. Therefore an Android browser can legitimately continue executing a previously cached app.js despite later GitHub commits.

Build 110 bumps the service-worker cache to:
`hearthmere-nightfalltesting-v110`

Commit:
`916c4dcd7144abf5a6326ca86fad050b0c4a6314`

This is a delivery/infrastructure correction, not a production rendering change.

### Required next test

Reload the site once so the updated service worker can install/activate, then launch:

`https://corgifighter.github.io/Nightfalltesting/?raw=1&lambertdirect=1`

Do not interpret the prior Lambert screenshot as evidence until this cache-invalidated build has been tested.

If the Lambert frame now changes substantially, the prior result was stale-code execution. If it remains identical after confirmed cache refresh, continue the render-state investigation.


## Build 111 — DELIVERY + EXECUTION VERIFICATION

User retested `?raw=1&lambertdirect=1` after the v110 service-worker bump and again reported **no visual change**.

Inspection confirmed the Lambert branch is present and the URL parameter is parsed. However, the previous test still lacked a visible proof that the phone was executing that exact branch.

Two corrections were therefore made:

1. Service worker is now **network-first for `app.js`**, with cached fallback only if the network fails. This prevents stale forensic app modules from masking new commits.
2. The Lambert branch now displays a fixed diagnostic marker:
   `BUILD 111 • LAMBERT DIRECT ACTIVE`
   and sets a dark diagnostic clear color.

Commit:
`5c0e1dafc93bc19cb231707f3ecb9b0a85476ec8`

The SW network-first change is in commit:
`e81652ca0429cc10350dece7ee98b3ff4a8978ee`

### Required test

Reload the normal site once, then open:
`https://corgifighter.github.io/Nightfalltesting/?raw=1&lambertdirect=1`

This test is now binary:
- If the **BUILD 111 • LAMBERT DIRECT ACTIVE** marker appears, the branch definitely executed; the rendered result can then be interpreted.
- If the marker does not appear, stop renderer/material analysis: the phone is still not receiving/executing the current app.js and delivery/cache must be investigated further.


## Build 112 — LAMBERT EXECUTION CONFIRMED, DEPTH-OCCLUSION TEST

User confirmed the Build 111 banner appeared, so the hardened Lambert branch definitely executes on the phone. The world view nevertheless remained unchanged.

This is significant: the failure survives:
- direct renderer path;
- real world geometry;
- forced hierarchy visibility;
- disabled frustum culling;
- plain MeshLambertMaterial;
- removal of PBR textures/normal maps/custom shader hooks;
- EffectComposer bypass.

Therefore the investigation should move below material/shader configuration.

Build 112 adds `?raw=1&flatdirect=1`, which uses the real world geometry but forces every mesh to a shared plain `MeshBasicMaterial` with **depthTest=false and depthWrite=false**, plus forced visibility/culling bypass and a visible execution marker.

Commit: `4eb6c2293a8531cea29658248d6c722769b1e5e8`

Next test:
`https://corgifighter.github.io/Nightfalltesting/?raw=1&flatdirect=1`

Interpretation:
- World becomes visible: a foreground depth-writing mesh/state is occluding the world. Next step is identify the occluding mesh and correct its render order/depth behavior.
- World remains invisible: depth occlusion is not the explanation; inspect camera/view transforms, render lists, clipping, or other renderer state while retaining Build 108 as the geometry baseline.

Do not alter production materials, fog, lighting, or assets yet.


## Build 113 — AUTO-FRAME WORLD BOUNDS DIAGNOSTIC

Build 112 executed (user saw the diagnostic result) but showed no world geometry even with depth testing and writing disabled.

Build 113 therefore adds `?raw=1&framedirect=1`. It:
- traverses the complete built world;
- forces every object visible;
- disables frustum culling;
- assigns one vivid MeshBasic material with depth disabled;
- computes actual transformed aggregate bounds for all world meshes;
- explicitly moves/reorients the camera to frame the aggregate bounds;
- expands camera far plane substantially;
- renders directly, bypassing the composer;
- displays `BUILD 113 • WORLD AUTO-FRAME`.

This is intended to eliminate camera target/orientation/clipping as the remaining ambiguity.

Commit: `733018fc71fb7a5bb55512722312b315f27979a4`

Next test:
`https://corgifighter.github.io/Nightfalltesting/?raw=1&framedirect=1`

Interpretation:
- vivid green world appears: the previous camera/view state was the issue; inspect camera follow/target/clip behavior next.
- still blank: the world bounds may be pathological or renderer draw state remains the next suspect. The on-screen marker proves execution; the diagnostic stats are also stored in `window.__HEARTHMERE_FORENSIC_FRAME_STATS`.


## Build 114 — AUTO-FRAME BOUNDS HARDENING

Build 113 executed (user saw the `BUILD 113 • WORLD AUTO-FRAME` marker) but the screen remained blank/gray.

The most likely remaining flaw in that diagnostic is its aggregate `Box3.setFromObject()` collection: one pathological/non-finite/huge mesh bound can poison the aggregate center/size and drive the camera to invalid or useless coordinates, even though the underlying world geometry is valid.

Build 114 keeps the same test but rejects:
- non-finite bounds;
- empty bounds;
- individual mesh bounds with any dimension >= 600 world units.

This is diagnostic-only and does not alter production rendering.

Commit: `584b2f120a81c8d1b75ee443357381aa37da8f12`

Next test:
`https://corgifighter.github.io/Nightfalltesting/?raw=1&framedirect=1`

If this remains blank, the next diagnostic should stop trying to infer camera placement from aggregate bounds and instead explicitly render a known-good subset (terrain/roads/landscape) with a fixed known-good camera, while reporting finite mesh counts/bounds on-screen.


## Build 115 — FIXED CAMERA ISOLATION

Build 114 produced the first clear evidence that the world geometry really does render: the auto-frame screenshot showed a large vivid-green terrain surface and atmospheric meshes. This means the previous blank result was not a universal renderer/geometry failure.

The important remaining distinction is the normal camera-follow/OrbitControls state. The runtime updates the player-follow camera and calls `controls.update()` every frame before the forensic render branches. Build 115 adds `?raw=1&fixeddirect=1` and explicitly:
- disables OrbitControls;
- ignores player-follow camera movement;
- sets the camera to the authored original relationship around the player's starting position `(0,30)`: camera `(14.6,8.2,44.8)`, target `(0,.72,30)`;
- hides the sky;
- forces all meshes visible and unculls them;
- uses plain depth-disabled MeshBasicMaterial;
- directly renders.

Commit: `d8050f380139ded6e82e26c06a4ae5a94166c607`

Next test:
`https://corgifighter.github.io/Nightfalltesting/?raw=1&fixeddirect=1`

Interpretation:
- World appears: player-follow/OrbitControls state is the root of the blank normal view. Fix the production camera system, not materials.
- World remains absent: the issue is specific to this world region/camera relationship; compare the fixed camera against the successful auto-frame and explicitly frame a known authored region.


## Build 116 — FIXED CAMERA + PRODUCTION MATERIALS

Build 115 showed the complete world can be rendered from a fixed camera at the authored starting relationship, using forensic materials. This means the camera can physically see world geometry from that relationship.

Build 116 adds `?raw=1&fixedprod=1`:
- disables OrbitControls;
- fixes camera at `(14.6,8.2,44.8)`;
- looks directly at `(0,.72,30)`;
- leaves all production world materials/shaders untouched;
- bypasses EffectComposer;
- directly renders with the production renderer.

Purpose: cleanly separate **camera/control state** from **production material/shader state**.

Commit: `82028560681386e8403aff72c68e658e7f9fdb7b`

Next test:
`https://corgifighter.github.io/Nightfalltesting/?raw=1&fixedprod=1`

Interpretation:
- world appears: production materials are valid and normal camera/control orientation/state is the remaining problem.
- world disappears: fixed camera works geometrically but production materials/shaders are the remaining issue; then test one controlled production material at a time from this fixed camera.


## Build 117 — FIXED CAMERA / CUSTOM HOOKS NEUTRALIZED

Build 116 produced no visible geometry with production materials, while Build 115 showed the same fixed camera with forensic MeshBasic materials. Build 117 therefore keeps production materials/properties but replaces every material's `onBeforeCompile` with a no-op and marks materials `needsUpdate`.

URL:
`https://corgifighter.github.io/Nightfalltesting/?raw=1&fixedhooks=1`

Purpose: isolate the project's many custom shader injections (foliage, foundation, grounding, etc.) from the underlying production material state.

Interpretation:
- geometry appears: one or more custom shader hooks is causing the production invisibility/compile failure.
- still blank: the failure is in base material state (textures/transparency/material parameters) rather than custom shader injection.

Commit: `d12667129dc653c148e909b82ac1267aa21ded9b`

