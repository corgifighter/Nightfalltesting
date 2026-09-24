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


## Build 118 — MATERIAL VISIBILITY NORMALIZED

Build 117 showed a small number of production-material objects/FX but no terrain/buildings after custom shader hooks were neutralized. This means custom hooks alone did not restore the world.

Build 118 keeps the production material classes and maps but forcibly normalizes visibility-critical material state:
- transparent=false
- opacity=1
- alphaTest=0
- depthTest=true
- depthWrite=true
- colorWrite=true
- side=DoubleSide
- custom onBeforeCompile disabled
- frustum culling disabled
- fixed camera retained

URL:
`https://corgifighter.github.io/Nightfalltesting/?raw=1&fixedmat=1`

Purpose: determine whether the production material pipeline is hiding geometry through alpha/transparency/depth/material-state configuration rather than geometry/camera.

Commit: `82be4747c07c9a5183c537346faad6e792ef0ab7`


## Build 119 — UNTEXTURED LIT GEOMETRY

Build 118 normalized transparency/depth/visibility state but still showed only a small black diamond and minor FX. The production texture path is now the next controlled suspect, especially because `applyCC0Materials()` replaces the terrain/architecture maps with remote Poly Haven textures before shader compilation.

Build 119:
- fixed camera unchanged;
- all meshes visible / frustum culling disabled;
- replaces every mesh material with a fresh `MeshStandardMaterial`;
- preserves each source material's base color, roughness, and metalness;
- removes all color/normal/roughness/metalness/alpha/displacement maps;
- removes all custom shader hooks;
- uses DoubleSide;
- direct renderer, no composer.

URL:
`https://corgifighter.github.io/Nightfalltesting/?raw=1&fixeduntextured=1`

Interpretation:
- terrain/buildings return: production texture/map pipeline is the culprit; investigate CC0 texture loading/replacement first.
- still blank: texture maps are not the root cause; next isolate production geometry/material assignment itself.

Commit: `9b41e2c33b54fa6e183a465f40b9eb7f41d3c967`


## Build 120 — FRESH BASIC GEOMETRY / FIXED CAMERA

Build 119 remained blank with fresh MeshStandard materials. Before interpreting that as a texture issue, Build 120 reproduces the proven Build 115 geometry test with fresh `MeshBasicMaterial` objects, per mesh.

No production material state, textures, lighting, fog, custom shader hooks, or EffectComposer are relevant to this test. Same fixed camera `(14.6,8.2,44.8)` targeting `(0,.72,30)`, all scene meshes forced visible, frustum culling disabled.

URL:
`https://corgifighter.github.io/Nightfalltesting/?raw=1&fixedbasic=1`

If geometry appears, the geometry/camera path is definitively healthy and the failure is specifically in the lit production material/shader pipeline.
If geometry does not appear, investigate the exact difference between Build 115 and the new branch, including runtime branch ordering/state.

Commit: `a64d3d10ce10d3d6ba178d19009094cda1e03bdd`



## Build 121 — SHARED BASIC REPRODUCTION

Build 120 unexpectedly stayed blank despite using fresh MeshBasicMaterials. Comparison with the known-positive Build 115 revealed a meaningful implementation difference: Build 115 uses **one shared MeshBasicMaterial**, while Build 120 creates a new material for every mesh. On mobile this can create a huge number of unique shader/material programs and produce a false diagnostic failure.

Build 121 exactly reproduces the positive Build 115 setup:
- one shared fresh MeshBasicMaterial;
- fixed camera `(14.6,8.2,44.8)`;
- target `(0,.72,30)`;
- controls disabled;
- sky hidden;
- all scene nodes forced visible;
- frustum culling disabled;
- depth disabled;
- direct renderer.

URL:
`https://corgifighter.github.io/Nightfalltesting/?raw=1&fixedbasicshared=1`

This is the control before interpreting Builds 117–120. If it restores the green world, Build 120/119 were confounded by excessive unique material creation, and the next tests must use shared materials only.

Commit: `e2cdd898abc4c4099e6929f2fa54a921144a3073`


## CORRECTION — Builds 115–121 INTERPRETATION

The previous handoff incorrectly stated that Build 115 proved the fixed camera could see world geometry. It did not. The user's screenshots for Builds 115 and 120 are visually the same: essentially a green field with no recognizable terrain/buildings. Build 115 therefore was NOT a positive geometry proof.

The actual positive proof remains Build 114 / auto-frame: the aggregate world-bounds camera produced recognizable terrain geometry. Therefore the fixed camera coordinates (14.6,8.2,44.8) targeting (0,.72,30) were never established as a valid world-view camera.

Consequently Builds 116–121, all of which retained that fixed camera, cannot validly isolate the production material pipeline. Their negative results are contaminated by the unproven camera relationship.

### Build 122 — AUTO-FRAME + PRODUCTION MATERIALS

Build 122 restores the exact known-positive auto-frame camera computation from Build 114 while leaving production materials untouched. This is the first valid test of production materials from a camera already demonstrated to see the world.

URL:
https://corgifighter.github.io/Nightfalltesting/?raw=1&frameprod=1

Commit: 623352cda57003823f49e02c650cde7999967189

Interpretation:
- recognizable world appears: production materials are viable; the production camera positioning/follow system is the likely remaining fault.
- world disappears: production material/shader state is implicated, now with the camera confound removed.

Build 121's shared-basic test should not be treated as a new diagnostic conclusion; it merely reproduces the same fixed-camera condition that was already unproven.


## Build 123 - ARCHITECTURE-ONLY FRAME

Build 122 shows clouds, faint river and tiny location labels but no visible architecture. The full-world auto-frame is dominated by the large terrain bounds, making village buildings very small. Build 123 isolates roots marked architectureTier=hero and frames only those building bounds, while leaving production materials untouched.

URL: https://corgifighter.github.io/Nightfalltesting/?raw=1&archframe=1

Commit: ea99a54a17a3f70879a944b041388b8e8304ef21


## Build 124 - ARCHITECTURE BASIC GEOMETRY

Build 123 successfully reveals the silhouettes/shapes of the authored hero buildings, but they appear as filled orange forms on the gray diagnostic background. This proves the architecture roots and transforms exist, but does not yet establish whether the production architecture material/shader stack is rendering correctly.

Build 124 keeps the same architecture-only framing and replaces every visible architecture mesh with ONE shared fresh MeshBasicMaterial. It removes production material colors, maps, custom shader hooks, lighting response, and fog from the test.

URL: https://corgifighter.github.io/Nightfalltesting/?raw=1&archbasic=1
Commit: 7a924819f19e915754f405b62cd5304610cf77a3


## Build 125 - ARCHITECTURE DEPTH ENABLED

User reports Build 124 produces filled green silhouettes, not visibly 3D models. Critical correction: Builds 123/124 intentionally disabled depth testing and depth writes. That can cause many overlapping 3D faces to collapse visually into filled silhouettes and therefore cannot establish 3D depth appearance.

Build 125 repeats the architecture-only frame with ONE shared fresh MeshBasicMaterial but restores normal `depthTest:true` and `depthWrite:true`. This is the first architecture diagnostic that preserves actual depth ordering.

URL: https://corgifighter.github.io/Nightfalltesting/?raw=1&archdepth=1
Commit: aa26d37f3155f161b0c08b6c2e634df15dce95dd


## Build 126 - ARCHITECTURE WIREFRAME

Build 125 still appears as green silhouettes from the fixed camera. Do not assume this means the geometry is flat. Build 126 switches the visible hero architecture meshes to wireframe Basic materials with normal depth testing. This directly exposes triangle topology and will distinguish a true 3D mesh from a camera-facing/flat surface while preserving the same architecture-only bounds/framing.

URL: https://corgifighter.github.io/Nightfalltesting/?raw=1&archwire=1
Commit: 17d28e317442943140017af7f3f399856a984af8


## BUILD 127 — meaningful hero architecture camera
Commit: `b67b567f24f93d7cd3544784189921c3a7769f64`
URL: `https://corgifighter.github.io/Nightfalltesting/?raw=1&archview=1`

Purpose: move beyond the proven-but-artificial architecture diagnostics. Builds 123–126 established that hero architecture roots exist, can be isolated, and are genuinely 3D; however, their synthetic all-architecture camera was not representative of the intended game view. Build 127 adds a clean diagnostic that:
- isolates the hero architecture layer;
- selects the authored Warm Lantern vicinity using the stable landmark position when the replacement root has no asset name;
- computes that building's actual transformed bounds;
- places a deliberate elevated oblique/front camera from the authored +Z side with a slight +X offset;
- aims directly at the building's geometric center;
- leaves production materials untouched;
- bypasses composer/post-processing for a clean camera/material evidence frame;
- records camera, target, bounds, and distance telemetry in `window.__HEARTHMERE_FORENSIC_ARCH_VIEW_STATS`.

This is the next required runtime test. If it shows a convincing dimensional building, the camera problem is isolated and the next pass should compare this meaningful view against the normal production camera and then restore the full beauty pipeline. If it still presents as a flat/washed shape despite the wireframe proof, inspect material/light/fog state from this valid camera rather than returning to arbitrary fixed-camera tests.


## Build 128 — Hero architecture neutral-lit isolation (latest)
Commit: `bcd9e9153a906612c8459d434021034c8e25168a`

New runtime:
`https://corgifighter.github.io/Nightfalltesting/?raw=1&archlit=1`

User observation from Build 127:
- Hero buildings initially appeared filled black.
- Touching/tapping around the screen caused many individual building components to change to a filled orange/brown appearance.

Engineering interpretation:
- The code contains a real pointer-hover system. `pointermove` raycasts against interaction roots and `setHover()` traverses the selected interaction root, changing every emissive-capable material toward `0x9d7b39` with a .35 blend. This exactly matches the reported behavior of building parts changing color when the phone is touched.
- Therefore the orange/brown change is a known interaction/emissive highlight, not evidence that the building geometry is flat or being generated by the touch.
- Build 126 already proved the hero architecture has genuine 3D topology via wireframe.
- Build 127 then tested that geometry from a meaningful oblique camera while leaving production materials intact. The new black-to-orange behavior exposes a remaining question: whether the production material/light/shader state is making the architecture visually black from that camera.
- Do not return to the arbitrary fixed camera. Do not infer missing geometry from the black appearance.

Build 128 isolates that remaining question:
- same meaningful Warm Lantern selection and oblique camera strategy as Build 127;
- all hero architecture meshes receive fresh neutral `MeshStandardMaterial` instances;
- no production `onBeforeCompile` hooks, textures, maps, or emissive materials;
- hover/pointer highlighting is disabled for this diagnostic;
- sky hidden and fog temporarily disabled;
- direct renderer path, no composer/post-processing;
- normal scene lights remain active;
- records `window.__HEARTHMERE_FORENSIC_ARCH_LIT_STATS`.

Next action:
1. Have the user test Build 128 and report/send the real phone screenshot.
2. If the building is visibly dimensional under Build 128, the geometry/camera/lighting fundamentals are healthy and the next investigation is specifically the production architecture material/shader stack (including custom `onBeforeCompile` paths and texture/color-space assumptions).
3. If Build 128 is still black/flat, inspect light direction, normals, material side/culling, and world transforms from this same meaningful camera. Do not reuse the old arbitrary fixed-camera tests.
4. Once the neutral-lit test is positive, restore production materials and isolate their shader features one layer at a time, preserving the known-good camera.
5. Do not interpret the orange touch response as a new geometry problem; it is consistent with the existing hover-emissive code.



## Build 128 result — decisive rendering milestone
The user tested `?raw=1&archlit=1` and clearly saw the hero buildings with dimensional form and basic brownish/neutral materials.

This establishes that, from the meaningful Warm Lantern camera:
- hero architecture geometry is real and spatially correct;
- the authored building bounds/camera framing are valid;
- normals/transforms are sufficient for dimensional shading;
- actual scene lighting can illuminate the building;
- the black appearance seen with production materials is NOT a fundamental geometry/camera failure.

Build 128 used fresh neutral `MeshStandardMaterial`, disabled hover, removed fog, hid sky, and direct-rendered without composer/postprocessing. Therefore the next investigation must move upward into the authored production material stack rather than returning to geometry/camera diagnostics.

## Build 129 — current test
Commit: `f3f115c9f9ea639a82e10a8034d489b5c46c76ca`

URL:
`https://corgifighter.github.io/Nightfalltesting/?raw=1&archprod=1`

Purpose:
- keep the exact successful Build-128 meaningful architecture camera;
- restore the building's authored production materials and texture maps;
- clone those materials so the diagnostic does not mutate the source materials;
- neutralize `onBeforeCompile` / custom shader cache hooks;
- keep hover disabled;
- hide sky and temporarily remove fog;
- bypass composer/post-processing;
- direct render.

Interpretation:
- If Build 129 remains properly visible/dimensional, authored textures/material properties are fundamentally healthy and the custom shader hooks are implicated.
- If Build 129 becomes black/dark again, the problem is in the authored material properties/textures/color-space/map stack even without custom shader mutation.
- Do not change geometry, camera, terrain, or world lighting based on a Build-129 result; those fundamentals are already positively established.

After Build 129, the next branch should be a controlled production-material decomposition, not broad random edits. Preserve the successful camera and direct render path while isolating maps/features one class at a time.


## BUILD 130 — architecture mapless material isolation (current)
Commit: `831f6ae36f938a0b85c6d335990d630753883dc0`
URL: https://corgifighter.github.io/Nightfalltesting/?raw=1&archmapless=1

User result from Build 129: roofs are filled black; walls are solid tan with no visible texture. This is not the intended visual target. Build 128 remains the known-good baseline: the same hero building renders dimensionally with fresh neutral Standard materials.

Build 130 deliberately preserves Build-128/129 camera, lighting, direct renderer, no-fog, no-sky, no-composer path and removes every texture map from cloned authored hero materials while also neutralizing custom shader hooks. It records how many color/normal maps were present before removal. This isolates authored base material color/roughness from the texture-map/color-space path.

Interpretation:
- If roofs become properly visible as their authored dark-brown/gray base colors, the black roof appearance is specifically tied to the roof texture/map path.
- If the roofs remain black even mapless, inspect authored roof base color/roughness and lighting from this proven camera.
- The walls may still appear relatively plain because the plaster materials are fundamentally color/roughness materials with procedural variation rather than a direct plaster image map. That plainness is a separate visual-quality issue from the black roof failure.
- Do not change geometry, camera, terrain, or world lighting based on this test.

Next after Build 130: if the roof recovers when mapless, inspect/fix CC0 texture loading, UVs, color-space configuration, and map assignment before adding new art. Then restore a real slate texture and add a genuine plaster/wall surface treatment rather than accepting solid tan walls. The final target remains cohesive, readable, richly textured fantasy architecture—not this diagnostic appearance.


## Build 131 — macro root-cause material isolation (2026-09-24)

The project remains in **forensic rendering/root-cause mode**. Do not resume cosmetic architecture design, granular detailing, town expansion, or broad world-content work until the large-scale rendering problem is understood and the production pipeline is trustworthy again.

Build 131 commit: `479ecac5c2428269951cb64df76f062335596574`
Test URL: `https://corgifighter.github.io/Nightfalltesting/?raw=1&archscalar=1`

Build 131 is deliberately a diagnostic, not an art pass. It uses the proven Build 128 architecture camera/isolation and direct renderer path, but replaces every hero architecture material with a **fresh MeshStandardMaterial** constructed only from authored scalar properties (color, roughness, metalness, side, flatShading, and emissive scalar state). It does not reuse authored material objects, texture maps, custom shader hooks, composer/post-processing, or fog. The purpose is to distinguish an authored material-object/state problem from a lighting/color-space problem without changing the world itself.

Interpretation rule:
- If Build 131 makes the roofs behave materially like Build 128, the problem is inside authored material state/object configuration or prior material mutation; investigate that pipeline rather than redesigning assets.
- If Build 131 remains dark like Builds 129–130, the next investigation should move outward to the actual lighting/color-management/material assignment path on specific meshes. Do not start cosmetic texture work.
- Build 128 remains the known-good visual/material baseline; Build 129 restored production material objects and showed dark roofs/tan walls; Build 130 removed maps and was essentially unchanged, weakening the texture-map hypothesis.

**Current priority:** solve the large-scale rendering/material pipeline issue first. Cosmetic granular design is explicitly deferred until this root cause is resolved.


---

# 23. MASTER FORENSIC SYNTHESIS / CONTINUATION PLAN
Date: 2026-09-24
Purpose: consolidate the entire rendering investigation so the next instance does not repeat completed work.

## A. WHY THIS SECTION EXISTS

The project entered forensic rendering mode because the real game repeatedly presented a persistent gray/orange/yellow/green washed appearance, at times with very little or no recognizable geometry. The user described it as a stagnant layer applied to the camera view rather than ordinary world lighting.

The investigation must therefore be understood as one continuous chain, not as unrelated material and architecture experiments.

The older rendering/debugging work established that the production renderer contains a substantial modern pipeline. The newer Builds 105–131 then progressively removed confounding variables and proved which lower-level systems are healthy.

The correct interpretation is:

**the investigation has moved from “is the renderer/world actually capable of drawing the scene?” to “which production state/path is causing the real scene to become visually wrong?”**

Do not reset this chain.

---

## B. WHAT THE OLD WORK ALREADY ESTABLISHED

Before Builds 105–131, the project had already received major visual and renderer reconstruction.

### Renderer / presentation foundation

The production renderer contains:
- Three.js 0.181.1 WebGLRenderer
- capped pixel ratio
- sRGB output
- ACES tone mapping
- EffectComposer
- RenderPass
- SSAO
- UnrealBloom
- FXAA
- OutputPass
- PCF soft shadows
- custom sky/environment
- PMREM environment
- dynamic sun/moon/hemi/fill lighting
- fog
- shader precompilation
- readiness/error diagnostics
- adaptive quality and GPU telemetry

The production presentation layer also contains:
- cinematic grading
- exposure/tone mapping
- environment intensity
- bloom
- SSAO
- fog
- dynamic lighting/day-cycle changes
- camera follow
- mobile/cinematic presentation modes

The old work also investigated and corrected several unrelated runtime failures, including initialization order, service-worker caching, readiness, capture telemetry, stale references, and interaction systems.

### Important old visual finding

The user repeatedly described the world as being covered by a persistent color cast/haze that did not behave like normal changing world illumination. This led to testing and disabling various systems during earlier troubleshooting.

Those earlier attempts were useful because they established that simply changing scene lighting values did not produce the expected relationship between camera movement and the perceived wash.

However, the old work did NOT prove a single culprit such as fog, bloom, SSAO, cinematic grade, or environment lighting.

Therefore:

**Do not now treat any one of those systems as the established culprit.**

The correct lesson from the old work is that the symptom is persistent enough to justify source-level isolation, not that a particular effect has already been convicted.

---

## C. THE FORENSIC CHAIN — BUILDS 105–131

The following tests are cumulative.

### Builds 105–106 — prove the renderer can display trivial geometry

Build 105 initially appeared to show nothing, but source inspection found the diagnostic itself was hiding the root Scene.

Commit:
b9eccd388e478305e582fb4c374129b516ddf5de

The corrected material probe was then verified by the user.

Build 106 result:
- visible white cube
- no world geometry

This is the first hard foundation point.

It proves:
- WebGL context works
- Three.js renderer works
- canvas/framebuffer works
- camera/projection works
- viewport path works
- direct render works
- MeshBasicMaterial works

Therefore a completely broken renderer/framebuffer/camera explanation is ruled out.

### Build 107 — first whole-world forced-material probe

Commit:
2611cce6993bc887bc0f4678d22932d21bf6bde3

The world was traversed, forced visible, production meshes replaced with Basic materials, frustum culling disabled, and a diagnostic cube added.

User saw:
- red diagnostic cube
- player silhouette
- no recognizable surrounding world

This showed that the scene was not simply empty, but did not yet prove why most world geometry was absent.

### Build 108 — vivid whole-world probe

Commit:
8f7c42d527cf23cd737b7bb518b0f6fcc507b520

Per-mesh vivid Basic colors, depth isolation, persistent direct render and bounds telemetry were added.

This prepared the investigation for the later auto-frame test.

### Build 109/110-era hierarchy hardening — eliminate traversal false negatives

A major diagnostic flaw was discovered: `scene.traverseVisible` skips descendants under invisible ancestors.

Commit:
89f4aa31f078be20d8abead7214db2a1c6ba5462

The hardened diagnostics use `scene.traverse`, explicitly restore hierarchy visibility, disable culling, and render directly.

This matters because otherwise “no geometry” could merely mean “the diagnostic never visited it.”

### Build 111 — execution proof

Commit:
5c0e1dafc93bc19cb231707f3ecb9b0a85476ec8

Visible banner:
BUILD 111 • LAMBERT DIRECT ACTIVE

User confirmed the banner.

Therefore the diagnostic branch itself was definitely executing. The world appearance was not merely caused by the wrong URL or a stale code path.

### Build 112 — depth isolation

Commit:
4eb6c2293a8531cea29658248d6c722769b1e5e8

Basic materials with depth test/write disabled.

Result:
mostly blank white/gray.

This weakened the hypothesis that ordinary depth-buffer occlusion was the fundamental explanation for the missing/washed world.

### Builds 113–114 — aggregate auto-frame

Commits:
733018fc71fb7a5bb55512722312b315f27979a4
584b2f120a81c8d1b75ee443357381aa37da8f12

The entire transformed world was bounded and the camera was automatically positioned around it.

User saw:
- large vivid green terrain
- pale atmospheric/cloud meshes
- floating/diagonal geometry

This is a major complementary result.

It proves:
- substantial world geometry exists
- the world can be directly rendered
- the terrain dominates the aggregate bounds
- earlier blank/faint results were partly contaminated by framing/scale
- architecture can become tiny relative to the full terrain envelope

This is why the investigation later switched from “why is there no geometry?” to “which specific layer is visually failing?”

### Build 115 — fixed camera isolation

Commit:
d8050f380139ded6e82e26c06a4ae5a94166c607

A fixed camera was used.

Result was negative/ambiguous.

Important retrospective correction:
the fixed camera itself was not yet proven meaningful, so Builds 115–121 cannot be used as strong evidence that architecture/materials were fundamentally invisible.

This is explicitly retained in the manifest to prevent future instances from over-interpreting those tests.

### Builds 116–121 — material experiments under the same unproven camera

These progressively tried:
- production materials with hooks neutralized
- normalized production materials
- fresh StandardMaterial
- fresh BasicMaterial
- one shared fresh BasicMaterial

None revealed useful architecture.

Because the camera was not a proven meaningful architecture view, these tests are weak evidence for architecture/material failure.

Do not repeat them.

### Build 122 — known-positive world auto-frame + production materials

Commit:
623352cda57003823f49e02c650cde7999967189

User saw:
- clouds
- faint river
- tiny location tags
- no meaningful architecture

This connected the earlier world-bounds result to the production-material world:
the production world existed, but the aggregate framing was dominated by terrain/atmospheric extent and was not useful for judging hero architecture.

This motivated a clean architecture-only branch.

---

## D. ARCHITECTURE FORENSICS — BUILDS 123–128

These tests are the bridge between the whole-world haze investigation and the later material diagnosis.

### Build 123 — architecture-only frame

Commit:
ea99a54a17a3f70879a944b041388b8e8304ef21

Hero architecture roots were isolated and framed.

User saw:
- recognizable building shapes
- filled orange forms against gray

This proved the authored hero architecture roots have visible spatial form.

### Builds 124–125 — Basic/depth architecture tests

Build 124:
7a924819f19e915754f405b62cd5304610cf77a3

Build 125:
aa26d37f3155f161b0c08b6c2e634df15dce95dd

Both produced green silhouettes.

At this stage it was still unsafe to call the buildings flat because depth/material state and camera presentation could make real geometry look like silhouettes.

### Build 126 — wireframe topology proof

Commit:
17d28e317442943140017af7f3f399856a984af8

User explicitly saw:
“Yeah i see they are 3d.”

This is decisive.

Hero architecture meshes have genuine 3D topology.

Therefore:
- geometry is not a flat-card failure
- the building meshes are not merely camera-facing impostors
- the architecture branch is real

### Build 127 — meaningful architecture camera

Commit:
b67b567f24f93d7cd3544784189921c3a7769f64

This was the critical correction to the earlier fixed-camera contamination.

Instead of an arbitrary fixed camera, the diagnostic:
- selected the Warm Lantern/inn area
- used its authored location
- computed transformed bounds
- positioned an oblique/front camera from the meaningful +Z side
- aimed at the actual building center
- bypassed post-processing
- retained production materials

User observed the architecture becoming black initially and changing orange/brown when touching.

Source inspection then found the existing pointer-hover system:
- pointermove raycasts interaction roots
- selected roots are passed through `setHover`
- emissive-capable materials are blended toward `0x9d7b39`

Therefore the touch-triggered orange was NOT geometry appearing.
It was the existing hover/emissive interaction response.

This removed another major false lead.

### Build 128 — known-good architecture baseline

Commit:
bcd9e9153a906612c8459d434021034c8e25168a

The exact meaningful camera from Build 127 was preserved.

Every hero architecture mesh received a fresh neutral MeshStandardMaterial.

The test removed:
- authored material objects
- authored texture maps
- custom shader hooks
- hover
- fog
- sky
- composer/post-processing

But it retained:
- actual architecture geometry
- actual authored transforms
- the meaningful camera
- actual scene lights

User result:
“the buildings” were clearly visible with basic brownish materials.

This is the single most important visual control in the entire investigation.

**Build 128 is the known-good architecture rendering baseline.**

It proves:
- geometry works
- transforms work
- meaningful camera works
- normals are adequate
- scene lighting can illuminate the buildings
- direct rendering works
- the black production appearance is not a fundamental geometry/camera failure

Any future diagnostic that cannot explain itself relative to Build 128 is suspect.

---

## E. PRODUCTION MATERIAL DECOMPOSITION — BUILDS 129–131

### Build 129 — production materials, shader hooks neutralized

Commit:
f3f115c9f9ea639a82e10a8034d489b5c46c76ca

Preserved Build-128 camera/isolation.

Cloned each source production material while retaining:
- maps
- colors
- roughness
- metalness
- normal/emissive maps

But neutralized:
- `onBeforeCompile`
- `customProgramCacheKey`

Also retained:
- no fog
- no sky
- no composer
- no hover
- direct rendering

User result:
- roofs appeared filled black
- walls appeared solid tan
- no expected rich texture appearance

This is important because the diagnostic was already stripped of the broad scene haze systems.

Therefore the dark architecture appearance survives even when:
- fog is absent
- post-processing is absent
- hover is absent
- custom shader hooks are neutralized

That makes a simple “cinematic grade is painting the whole screen black/orange” explanation insufficient to explain the architecture-specific material behavior.

### Build 130 — mapless production-material isolation

Commit:
831f6ae36f938a0b85c6d335990d630753883dc0

Same known-good camera and direct render.

Production materials were cloned and then stripped of:
- map
- normalMap
- roughnessMap
- metalnessMap
- aoMap
- emissiveMap

Shader hooks were neutralized.

User result:
“basically looks the same.”

Important clarification from the user:
the roofs DO have enough color variation and edge lines to make out what they are; the previous description of them as simply featureless black was too strong.

This weakens the hypothesis that the CC0 slate texture itself is the primary cause of the dark roof behavior.

The wall flatness is also not proof of a map failure because the plaster architecture materials are substantially scalar-color/roughness driven with procedural shader variation in the normal production path.

### Build 131 — fresh scalar-material isolation

Commit:
479ecac5c2428269951cb64df76f062335596574
Diagnostic implementation commit:
50af2d56d544dfff8588c0c5521c21326afea20b

URL:
https://corgifighter.github.io/Nightfalltesting/?raw=1&archscalar=1

Build 131 constructs entirely fresh MeshStandardMaterial instances for each hero mesh using only authored scalar material properties:
- color
- roughness
- metalness
- side
- flatShading
- emissive scalar state

It deliberately does NOT reuse:
- authored material objects
- maps
- normal maps
- roughness maps
- metalness maps
- AO maps
- emissive maps
- shader hooks
- composer
- post-processing
- fog

It keeps the same proven Build-128 camera/isolation and direct-render path.

**Build 131 has not yet been user-verified in this manifest. Do not invent its result.**

Its purpose is the cleanest current split:

If Build 131 resembles Build 128:
→ authored material object/state/mutation is implicated.

If Build 131 remains dark:
→ the investigation moves outward toward the actual light/color-management/material-assignment/render state affecting those meshes, because both authored material objects and authored maps have now been removed.

Either result is useful.

---

## F. WHAT ALL OF THE TESTS MEAN TOGETHER

The tests do NOT point to one simple “bad texture” or “bad building” problem.

They form a hierarchy of exclusions.

### Proven healthy

1. WebGL context.
2. Three.js direct renderer.
3. Canvas/framebuffer.
4. Camera/projection/viewport in a known-good trivial case.
5. MeshBasicMaterial.
6. Existence of substantial world geometry.
7. Ability to frame and render the world.
8. Existence of hero architecture roots.
9. Genuine 3D architecture topology.
10. Meaningful architecture camera.
11. Actual scene lighting can illuminate architecture.
12. Fresh neutral Standard materials can render architecture correctly.
13. The orange touch response is an existing hover/emissive interaction effect, not geometry creation.
14. Ordinary depth-buffer occlusion is not sufficient to explain the early blank result.
15. Architecture remains visually problematic after fog/composer/hover/shader-hook removal.
16. Removing architecture texture maps did not materially change the user's reported appearance.

### Therefore the current unresolved zone is much narrower

The remaining question is not:

“Can Three.js render the world?”

It can.

The remaining question is:

**What production state or render/material assignment difference causes the real scene/material pipeline to diverge from the known-good Build-128 direct-render baseline?**

This distinction is the central result of the entire investigation.

---

## G. HOW THE HAZE INVESTIGATION AND ARCHITECTURE TESTS COMPLEMENT EACH OTHER

The architecture branch was not a detour.

The original haze symptom was global/camera-like. It was therefore necessary to determine whether the visible scene underneath that symptom was itself healthy.

The whole-world probes showed that geometry exists and can render.

The architecture branch then supplied a controlled, high-information object whose:
- bounds are known
- geometry is known
- camera is known
- lighting can be held constant
- materials can be replaced deterministically

That makes architecture an excellent diagnostic witness for the larger rendering problem.

Build 128 is effectively the control image.

Builds 129–131 are controlled perturbations of that control.

The next investigation should preserve that discipline.

---

## H. CURRENT HYPOTHESIS TREE

Do NOT treat these as conclusions; they are the remaining branches to test.

### Branch 1 — authored material object/state contamination
Tested by Build 131.

If positive, inspect:
- when production materials are mutated
- shared material references
- `applyCC0Materials()`
- beauty shader hooks
- `addBeautyShader`
- `addSurfaceVariation`
- `addPlasterVariation`
- environment-intensity mutation
- hover state mutation
- post-build material passes
- order of material assignment versus shader compilation

### Branch 2 — material assignment / mesh classification
If fresh scalar materials still render incorrectly, inspect whether the actual source meshes receive unexpected:
- material arrays
- side/culling state
- flatShading state
- transforms
- visibility
- renderOrder
- depth state
- shadow state
- layer state

This must be inspected on the exact affected hero meshes, not guessed globally.

### Branch 3 — light/color-management state
If Build 131 is still dark, compare the exact Build-128 light/material state with production state:
- renderer tone mapping
- output color space
- exposure
- environment intensity
- light intensities/colors
- light positions/directions
- shadow configuration
- color conversion
- scene/environment state

Do this as a source-level differential, not a random lighting tweak.

### Branch 4 — image-wide stage remains relevant to the ORIGINAL haze
The architecture diagnostics deliberately bypass composer/post-processing.

That proves the architecture material problem can exist independently of the beauty pipeline.

It does NOT prove that the original global haze is caused by architecture materials.

Therefore the global haze branch must eventually be reconciled with the direct-render baseline.

The correct eventual comparison is:
**known-good direct render → production direct render → production composed render**

with identical camera, scene, materials and frame state wherever possible.

The purpose is to identify the first stage at which the global image diverges, not to randomly disable effects.

### Branch 5 — camera-follow/day-cycle mutation
The normal game loop mutates:
- player position
- controls target
- camera follow
- day/night lighting
- animations

Diagnostics bypass much of that.

If a direct production frame is healthy but the live game is not, the next target becomes runtime state mutation rather than static material configuration.

---

## I. COHESIVE NEXT PLAN

### Phase 1 — finish the existing forensic branch

1. Do NOT repeat Builds 105–130.
2. Preserve Build 128 as the control.
3. Verify/record Build 131 result if it has not already been supplied by the user.
4. Based on that result, perform one source-level differential against Build 128.
5. Inspect exact affected hero meshes/materials rather than the entire world.
6. Record the first meaningful divergence in telemetry.

### Phase 2 — identify the production-state mutation

Trace the lifecycle of the affected architecture materials from creation to final render:

creation
→ architecture assignment
→ CC0 material application
→ shader hooks
→ presentation/material passes
→ lighting passes
→ interaction registration
→ freezeStaticVisuals
→ renderer.compileAsync
→ render loop

The objective is to find whether a later stage changes the material or renderer state after the building was initially valid.

### Phase 3 — reconcile architecture and global haze

Once the architecture control is understood, use the same methodology on the whole world.

Do not make a pile of simultaneous changes.

Establish three reproducible states:

A. Build-128-style direct controlled render.
B. Full production scene rendered directly.
C. Full production scene through the normal composer/presentation pipeline.

Compare them under the same camera and frame state.

The first state that introduces the characteristic wash becomes the next investigation target.

### Phase 4 — only then repair the production pipeline

The repair should be structural:
- eliminate unintended persistent image-wide color state
- prevent material mutation from contaminating shared resources
- correct color-space/state ownership
- correct render-pass ordering if implicated
- restore fog/lighting/post effects only at their intended strength
- preserve the renderer architecture rather than deleting features blindly

### Phase 5 — production visual restoration

After the root cause is fixed:
- restore all systems disabled during diagnosis
- verify normal world
- verify architecture
- verify terrain/vegetation/water
- verify character
- verify atmosphere
- verify mobile camera
- verify cinematic mode
- verify capture
- only then resume visual art-direction work

---

## J. EXPLICITLY ABANDONED / LOW-VALUE PATHS

Do not repeat:
- the original Build-105 invalid cube test
- `traverseVisible`-based world tests
- arbitrary fixed-camera architecture tests
- repeated BasicMaterial swaps under the old fixed camera
- assuming orange touch response is geometry
- assuming missing architecture is caused by terrain aggregate framing
- assuming black roofs automatically mean the slate map is broken
- cosmetic roof/trim/gutter work
- polygon-count work as a substitute for visual diagnosis
- generic “try fog / try bloom / try SSAO” cycling without a controlled comparison

The project has already paid for these experiments.

Use their conclusions.

---

## K. CRITICAL CONTROL MATRIX

| Test | Geometry | Camera | Lighting | Materials | Maps | Fog | Composer | Result |
|---|---|---|---|---|---|---|---|---|
| Build 106 | cube | known-good | irrelevant | fresh Basic | none | none | none | WHITE CUBE VERIFIED |
| Build 114 | full world | auto-frame | direct | fresh Basic | none | isolated | none | WORLD GEOMETRY VERIFIED |
| Build 126 | hero architecture | architecture frame | direct | wire Basic | none | isolated | none | 3D TOPOLOGY VERIFIED |
| Build 128 | hero architecture | meaningful | real scene lights | fresh neutral Standard | none | off | none | BUILDING VISIBILITY VERIFIED |
| Build 129 | hero architecture | same | same | cloned production | retained | off | none | dark roofs / tan walls |
| Build 130 | hero architecture | same | same | cloned production | removed | off | none | essentially unchanged |
| Build 131 | hero architecture | same | same | fresh scalar Standard | none | off | none | **AWAITING RUNTIME RESULT** |

This matrix is the shortest reliable map of the investigation.

---

## L. CURRENT DEFINITION OF SUCCESS

The next success is NOT “the building looks prettier.”

The next success is:

**identify and explain the first production-state divergence from Build 128 that accounts for the observed dark/material behavior, then connect that result back to the original global haze without introducing new confounding variables.**

Only after that is achieved should the project leave forensic mode.

The ultimate visual target remains unchanged:
an exceptionally beautiful, cohesive, handcrafted fantasy world with RuneScape/OSRS-like readability and substantially more modern visual architecture, lighting, materials and atmosphere.

Do not lower that target.

Do not resume cosmetic work merely because the scene becomes technically visible.

---

# 24. HANDOFF RULE FOR THE NEXT INSTANCE

A new instance must read this section together with the earlier handoff, then:

1. Inspect the current repository HEAD.
2. Read the current `app.js`.
3. Confirm whether any commits exist after Build 131.
4. Do not assume Build 131's runtime result.
5. Treat Build 128 as the visual control.
6. Treat Builds 129–131 as a controlled material-state ladder.
7. Use the original haze symptom as the eventual global-image validation target.
8. Never repeat a diagnostic already listed as completed here unless new source evidence invalidates its conclusion.
9. Do not return to cosmetic architecture work while the rendering root cause remains unresolved.
10. When making the next change, make it a targeted, source-backed experiment or structural fix with a clearly stated hypothesis and a clean control.

**The investigation is now narrower than it was at the beginning. That narrowing is progress.**

The objective is to finish the causal chain, repair the real production path, restore every temporarily disabled system, and only then return to the original visual reconstruction campaign.
