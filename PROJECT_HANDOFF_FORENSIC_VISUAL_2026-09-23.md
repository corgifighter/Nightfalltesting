# NIGHTFALL / HEARTHMERE — FORENSIC VISUAL-HANDOFF MANIFEST
## Authoritative continuation document — 2026-09-23

> **READ THIS FIRST.**
>
> This project is a real browser/mobile RuneScape-inspired game. The immediate task is **not new game content**. It is to recover the authored world's correct visual presentation.
>
> The advanced world itself is largely intact. The critical defect is a **stagnant, camera-space-looking yellow/orange/green wash plus severe softness/blur over the entire 3D canvas**. The HUD remains crisp. The user reports that the wash does not materially change while walking around the map, which strongly argues against treating ordinary world lighting as the primary cause.
>
> **Do not repeat the previous debugging pattern of disabling systems one by one and progressively destroying the production presentation.** Preserve the advanced world and investigate the presentation/render/output path surgically.

---

## 1. PROJECT / USER GOAL

Repository:

`https://github.com/corgifighter/Nightfalltesting`

Canonical project name: **Hearthmere / Nightfall Reborn**.

Target:
- A genuine playable browser/mobile fantasy game.
- Old School RuneScape-inspired readability and visual character, but substantially more modern.
- AAA-quality art direction/world presentation is the eventual bar.
- Strong architecture, terrain, foliage, materials, lighting, atmosphere and UI.
- Cohesive, believable fantasy environment.
- Mobile browser is the practical testing route.
- User tests primarily on an Android phone and provides direct phone screenshots.
- Visual quality has priority over speed and over micro-detail.
- Do not spend time on gutters, vertex counts, tiny trims, etc. until the broad image quality is right.
- Do not move on to town/world expansion while the graphics foundation is visibly broken.

---

## 2. CURRENT PRIMARY PROBLEM

The advanced production world can render:
- terrain
- buildings
- foliage
- river/water
- character
- environmental dressing
- advanced materials
- lighting/atmosphere

…but the final 3D image is contaminated by a strong full-frame color wash and blur.

The user's latest direct observation:

> "The color is certainly more greenish now. Im doubtful the problem is world lighting, it doesnt have any dynamic change when walking around the map. Its like a stagnant layer applied to the camera view"

This is a **high-value diagnostic observation**.

Treat it as evidence:
- The tint appears spatially/camera-space invariant.
- HUD remains sharp and normal.
- World content beneath it is visible but washed out.
- Walking around does not produce the expected local/world-light response.
- Therefore prioritize **camera-space compositing, post-processing, render-target/output transform, full-screen geometry, CSS/canvas filters, or a screen-space material/pass** over continued daylight-light tuning.

Do not declare the exact cause yet.

---

## 3. IMPORTANT KNOWN VISUAL BOOKENDS

### Haze-free checkpoint
**`25a725ad2b8622ed41fb4736f2e4f2ebc82d76fe`**

Commit:
`Major graphics overhaul — world lighting, atmosphere, landscape depth and material cohesion`

User-confirmed as visibly haze-free.

Immediately after it:
**`253cf3979fc71fe775788a281e74fb5f6847ec75`**

This moved the haze-plane geometry from z=+82 to z=-82 (and clouds similarly). User still saw no haze there. Therefore that geometry change alone was not the original visible haze cause.

### Intact advanced/hazy checkpoint
**`46aaae6d8013e3e472f1783d52638f4fcf26fd67`**

Commit title:
`Rewrite PROJECT_HANDOFF as authoritative continuation blueprint`

Important: although its title is documentation-oriented, its tree contains the intact advanced production world.

User tested this tree and saw:
- complete advanced world
- severe yellow/brown/orange wash
- severe blur/softness inside the game canvas
- crisp UI

This tree is preserved on:
**`forensic-intact-advanced-46aaae6`**

Do not lose this branch.

Distance:
- `25a725ad` → `46aaae6` = **342 commits**
- `19f6adcd` → `46aaae6` = **159 commits**
- The 159-commit region contains genuine graphics development interspersed with diagnostics; do NOT call all 159 commits debugging.

---

## 4. LAST STRONG PRODUCTION BUILD BEFORE THE LATER DIAGNOSTIC CAMPAIGN

The strongest pre-diagnostic production sequence was:

- `5299a1ad` — refresh architectural physical material pass
- `57f9ead3` — activate core architectural physical material upgrade
- `782908f2` — remove stray escaped newline outside shader source
- `a67e5a7e` — refresh cache
- `b8228eab` — integrate layered ground vegetation and riverbank dressing
- `82579b5a` — hero secondary equipment and rig motion
- `3c228c6f` — strengthen terrain contact response
- `9800d62a` — repair ground pass and activate material grounding
- `41eda0f2` — broad terrain and world material integration pass
- `59b3d5b2` — full character presentation and focal lighting pass
- **`f8ed2499` — Advance world life, landmark atmosphere, and frame-loop hardening**
- `1275cda5` — Bump runtime cache for world-life pass
- `19f6adcd` — Add JavaScript syntax gate to browser smoke test

`f8ed2499` was only about two commits before the diagnostic campaign began and was a strong historical candidate, but it contained multiple later-repaired JavaScript-string defects. Attempts to boot it directly were abandoned after repeated syntax failures.

---

## 5. WHY WE STOPPED TESTING RANDOM HISTORICAL BUILDS

The pre-diagnostic build contained multiple independent malformed shader/string repairs later introduced during the recovery campaign.

Known later repairs include:
- `5852770e` — Fix grounding shader newline injection
- `682656d5` — Repair remaining multiline meadow shader literals
- `4efb3e1c` — Repair malformed meadow shader string
- `2059fbf1` — Fix beauty shader JavaScript string terminator
- `2caf6d61` — Fix beauty shader concatenation terminator
- `2668b1a4` — Correct beauty shader string closing quote
- `4624ad67` — Fix water shader newline and window light timing
- and other syntax/parser diagnostic commits

Two known malformed blocks were surgically repaired on the historical `1275cda5` line, but the browser still reported the same syntax error. Continuing to repair that contaminated build was no longer useful.

**Lesson:** historical source is valuable for forensic comparison, but not necessarily as a runtime candidate.

---

## 6. FAILED / DISCARDED DIAGNOSTIC APPROACHES

Do NOT repeat these as solutions:

### Cinematic-grade bypass
Commit around:
`b2b03ae3`

Bypassing `cinematicGradePass` changed the yellow wash toward pale/white but did NOT restore true world colors and did NOT solve the severe softness.

Conclusion:
- cinematic grade may contribute to appearance
- it is NOT established as the root cause.

### SSAO bypass
Commit around:
`b3492a68`

Disabling SSAO did not restore the world or solve the presentation defect.

Conclusion:
- SSAO is NOT established as the root cause.

### Fog isolation / raw-render diagnostics
A long sequence of V64–V81 diagnostics disabled or bypassed fog/post-processing/render components.

User explicitly rejected continuing this pattern because each successive attempt degraded the authored production presentation.

Conclusion:
- diagnostics can be useful only if implemented as isolated, non-destructive historical comparisons.
- Do not turn the production branch into a stripped-down renderer.

### Giant atmospheric sheets
Historical commits include:
- `497159e5` — giant atmospheric sheet
- `422a1917` — atmospheric depth veils
- `427d94df` — giant haze plane + dynamic lighting reconstruction
- `44afa9cc` — Remove giant atmospheric sheet from gameplay view

These are worth understanding historically, but they are **not enough evidence to call them the current root cause**.

---

## 7. RECENT PRESENTATION TESTS AND WHAT THEY TOLD US

### Presentation-resolution/color repair
We temporarily modified the intact advanced build to:
- stop adaptive quality from reducing resolution
- restore full-resolution composer sizing
- neutralize accumulated cinematic saturation/contrast/warmth/vignette
- restore a neutral/proven output transform

The user reported:

> "Perhaps a little sharper and almost neon brighter"

This is important:
**the resolution/render-target intervention appears to have produced a real sharpness improvement.**

Therefore the blur has at least some relationship to the presentation/render-target path.

### Oversized additive sun halo
We then reduced an advanced sun halo:
- scale 28 → 6
- opacity → .16

The user reported:
> "It's the same color as before"

Conclusion:
- that halo is NOT the primary full-frame wash.

### Dynamic daylight palette neutralization
We then reduced:
- fog saturation
- sun saturation
- hemisphere warmth
- environment/exposure
- sky horizon warmth

User reported:
> "The color is certainly more greenish now."

This proves the lighting changes can alter the tint, but the user's observation that the wash remains stagnant while walking makes ordinary dynamic world lighting an unlikely primary explanation.

**Do not continue endlessly tuning light colors.**

---

## 8. CURRENT MAIN STATE — IMPORTANT

At handoff time, `main` is at:

**`08fb039fd8d1743860b6bf73df8cd007fa464155`**

Title:
`Bump cache for camera-space wash forensic A/B`

Its parent:
**`f4ce2c7dbfd18b860c3ae970c0db581c6e532ef1`**

Parent title:
`Forensic A/B isolate stagnant camera-space color wash`

That A/B commit added:

```
ssaoPass.enabled=false;
bloomPass.enabled=false;
cinematicGradePass.enabled=false;
```

**BUT this was inserted before `cinematicGradePass` is declared.**

The user's latest runtime report was:

> "Uncaught reference error with cinematic grade pass."

Therefore the CURRENT `main` is **NOT a valid production test state**.

Do not interpret the runtime result of this broken A/B commit as evidence about the renderer.

The previous intact presentation state immediately before this A/B experiment was the chain containing:

- `ab5b609c` — Correct advanced daylight palette and atmospheric color neutrality
- `9ad8481b` — cache refresh

The exact branch history should be inspected before changing refs.

---

## 9. VERY IMPORTANT APP.JS STRUCTURE

Current `app.js` contains:

- Three.js 0.181.1
- `EffectComposer`
- `RenderPass`
- `UnrealBloomPass`
- `SSAOPass`
- `ShaderPass`
- `OutputPass`
- custom `cinematicGradePass`

Relevant lines in the advanced build include:

```
const composer=new EffectComposer(renderer);
```

and a custom grade pass roughly:

```
const cinematicGradePass=new ShaderPass(new THREE.ShaderMaterial({
  uniforms:{
    tDiffuse:{value:null},
    uSaturation:{value:1.055},
    uContrast:{value:1.045},
    uWarmth:{value:0.0},
    uVignette:{value:.065}
  },
  ...
}));
```

The custom fragment shader samples `tDiffuse`, modifies saturation/contrast/warmth/vignette, then writes `gl_FragColor`.

This is a legitimate **camera-space image operation**, so it remains an important forensic target.

However, bypassing it once did not solve the problem.

---

## 10. CURRENT STRONG HYPOTHESIS

The user's latest observation makes the following class of causes especially important:

### A. A full-frame/camera-space compositing layer
Examples:
- ShaderPass
- full-screen quad
- screen-space texture
- camera-facing plane/sprite
- additive/alpha overlay
- post-process LUT/grade
- stale render target being sampled
- incorrect composer target

### B. Output/render-target color-space issue
Examples:
- render target color space
- OutputPass
- tone mapping
- double color conversion
- intermediate buffer mismatch
- stale/incorrect framebuffer
- composer render-target sizing

### C. CSS/canvas presentation layer
Inspect:
- `filter`
- `backdrop-filter`
- `mix-blend-mode`
- pseudo-elements
- fixed overlays
- canvas opacity
- canvas background
- any full-screen DOM layer above the canvas

### D. Full-screen world geometry
Search for:
- PlaneGeometry sized to camera/world
- SpriteMaterial with `depthTest:false`
- `fog:false`
- `AdditiveBlending`
- large transparent quads
- atmospheric veil/mist bands
- camera-facing overlays

### E. Render target resolution
This remains relevant because the prior intervention made the screenshot somewhat sharper.

---

## 11. A VERY IMPORTANT CODE-READING CLUE

Current `app.js` contains comments explicitly acknowledging the mobile blur problem around the composer:

> EffectComposer owns its own render targets...
>
> On mobile that produced the severe full-screen blur visible in the first...

Treat this as evidence that render-target sizing/resolution has already been a known problem area.

Do a historical diff of the exact composer/render-target code between:
- `25a725ad`
- the first visibly advanced production build
- `46aaae6`
- the commits immediately preceding the diagnostic campaign

Look specifically for the FIRST introduction of:
- composer sizing
- pixel-ratio changes
- render target changes
- OutputPass
- AgX/ACES changes
- post-process order
- custom grade pass
- resize handler changes
- adaptive quality logic

Do not simply change them again. Identify **when and why they changed**.

---

## 12. HOW THE NEXT INSTANCE SHOULD PROCEED

### Phase 1 — establish clean refs
1. Preserve `forensic-intact-advanced-46aaae6`.
2. Preserve `25a725ad` as the haze-free visual reference.
3. Do NOT destroy either.
4. Treat current `main` as broken until the A/B declaration-order error is corrected or main is moved back to the last valid test state.
5. Do not make the user test the broken A/B.

### Phase 2 — source forensics, not runtime teardown
Perform historical diffs on `app.js` and relevant HTML/CSS files.

Find the earliest meaningful transition where:
- world remains intact
- presentation begins to acquire the stagnant wash
- blur/render-target behavior changes

Prefer commit-level source comparison over arbitrary runtime debugging.

### Phase 3 — isolate the camera-space layer
Search the entire source for:
- `ShaderPass`
- `RenderPass`
- `OutputPass`
- `RawShaderMaterial`
- `ShaderMaterial`
- `PlaneGeometry`
- `SpriteMaterial`
- `AdditiveBlending`
- `NormalBlending`
- `depthTest:false`
- `fog:false`
- transparent full-screen objects
- CSS `filter`
- CSS `backdrop-filter`
- `mix-blend-mode`
- canvas overlays

Map each one to its introduction commit.

### Phase 4 — compare pipeline order
Document the exact order:

```
Scene
→ RenderPass
→ SSAO
→ Bloom
→ cinematicGrade
→ OutputPass
→ canvas
```

or whatever the actual historical/current order is.

Then compare that order against `25a725ad`.

### Phase 5 — surgical fix
Once a specific causal change is identified:
- make ONE targeted correction
- preserve the full advanced world
- bump cache
- test
- judge the actual runtime screenshot

Do not stack five speculative visual changes together.

---

## 13. WHAT NOT TO DO

Never again use these as a default strategy:

- disable fog
- disable SSAO
- disable bloom
- disable the grade
- replace the advanced renderer with a raw renderer
- move the camera to an arbitrary diagnostic location
- replace the world with a benchmark scene
- remove advanced materials
- remove atmosphere wholesale
- rebuild the world from an old checkpoint
- chase syntax errors indefinitely in a historically contaminated build
- declare a cause based solely on a commit title
- call a build "haze-free" without the user actually seeing it

The user explicitly wants the **actual advanced world repaired**, not another stripped diagnostic world.

---

## 14. HISTORICAL DIAGNOSTIC CAMPAIGN — REFERENCE ONLY

Later diagnostic commits include:

- `5b44feff` — v81 atmospheric isolation
- `f6e46005` — remove warm atmospheric shell from cinematic inspection
- `53a14f96` — deterministic cinematic inspection
- `87f2cefd` — deterministic village camera/direct render
- `212e296d` — repair malformed newline
- `e36cca35` — clean beauty baseline
- `dfe5eb7b` — restore sharp production beauty pipeline
- `929f6956` — cinematic view diagnostic
- `46840620` — full-resolution SSAO / remove FXAA
- `2ec6b1ec` — restore production beauty pipeline
- `5fb94a59` — fog diagnostic
- `17f0f28c` — raw render diagnostic
- `d981c295` — neutral world render probe
- `a10df682` — diagnostic fog fix
- `3a54fed6` — clean visual diagnostic
- `116f0b22` — capture render-target sizing diagnostics
- `8b5d3da8` — first-frame post-processing resolution
- `13625c31` — graphics benchmark V4 replacement
- `92805391` — graphics benchmark V5 hero foliage
- `55304c23` through `5852770e` — extensive JavaScript/shader parser repair campaign

These are useful for understanding what was attempted. They are **not a recipe for future work**.

---

## 15. VISUAL QUALITY TARGET

The eventual target remains:

**Old School RuneScape readability + modern AAA fantasy presentation.**

The world should feel:
- beautiful
- cohesive
- grounded
- richly materialized
- readable at mobile scale
- atmospheric without being washed out
- colorful without neon contamination
- sharp without artificial oversharpening
- immersive rather than filtered

The present yellow/green wash is not an acceptable final art direction.

---

## 16. USER'S PROCESS PREFERENCES

The user explicitly prefers:
- deep work over speed
- major improvements over micro-tweaks
- occasional meaningful screenshot checks
- no screenshot after every tiny modification
- exact commit/SHA reporting
- direct repository work
- preserving working history
- forensic reasoning based on actual runtime evidence
- no unnecessary repetition of already-failed diagnostics

The user is frustrated because several previous chat instances consumed substantial time and progressively degraded the diagnostic world. The next instance should respect that history and **start from this manifest, not from generic troubleshooting**.

---

## 17. DEFINITIVE NEXT OBJECTIVE

> **Find the first concrete source/render-pipeline change that can explain why the advanced world is being seen through a stagnant camera-space yellow/orange/green wash and blur, while the HUD remains crisp.**

Do not solve the symptom by changing the world palette.

Do not continue tuning sunlight.

Do not disable systems.

Find the layer.

Then remove or correct the layer while retaining the advanced world.

---

## 18. IMPORTANT SHA INDEX

| Purpose | SHA |
|---|---|
| Haze-free confirmed checkpoint | `25a725ad2b8622ed41fb4736f2e4f2ebc82d76fe` |
| Immediate haze-free follow-up | `253cf3979fc71fe775788a281e74fb5f6847ec75` |
| Last strong pre-diagnostic production candidate | `f8ed2499` |
| Runtime-cache bump after it | `1275cda5b9750f3b53bca88c968fa2c6b9541acd` |
| Intact advanced world / severe wash | `46aaae6d8013e3e472f1783d52638f4fcf26fd67` |
| Preserved advanced branch | `forensic-intact-advanced-46aaae6` |
| Last valid palette-correction app commit | `ab5b609c3eeffafb5de40cb93fa7a7edd191602f` |
| Palette-correction cache | `9ad8481ba8f21fda27d3fb1cbce29d41f6349089` |
| Current main — BROKEN A/B declaration-order test | `08fb039fd8d1743860b6bf73df8cd007fa464155` |
| Broken A/B parent | `f4ce2c7dbfd18b860c3ae970c0db581c6e532ef1` |

---

## 19. FINAL HANDOFF NOTE

The most important new evidence is **not** that the world became greener after changing lighting.

The most important evidence is:

> **The user sees the wash as a stagnant layer attached to the camera view, while walking around the world does not materially change it.**

Combine that with:
- crisp HUD
- blurry/washed game canvas
- earlier improvement in sharpness after render-target/resolution work
- cinematic-grade bypass changing the tint but not restoring correct world colors
- SSAO bypass failing
- sun-halo reduction failing

That combination should drive the next investigation toward the **camera-space image pipeline**, not toward further world-lighting edits.

Continue from the repository history above.
Do not start over.
Do not throw away the advanced world.
Do not repeat the failed diagnostic cycle.
