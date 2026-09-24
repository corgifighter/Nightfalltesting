# HEARTHMERE FORENSIC BASELINE — PROTECTED

This file exists to prevent graphics debugging from destroying or obscuring the modern visual build.

## Protected recovery point

**Protected branch:** `protected/modern-yellow-build85`

**Protected commit:** `dc42717a89f81eadc98703ea64bdaa38729bbf3b`

That branch was created directly from the Build 85 commit. It is the recovery anchor for the modern advanced renderer/presentation state immediately before the later Build 89/90 forensic modifications.

**Do not use the old Build 77 / 9ad848... state as the visual development target.** That is only historical recovery context. The protected Build 85 state contains the modern accumulated rendering architecture and graphics machinery.

## What this protects

The recovery point preserves the accumulated modern system, including:

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
- advanced atmosphere and sky
- cinematic world-depth systems
- lighting rigs
- shadows
- material integration and foundation systems
- world/architecture/terrain work
- character presentation
- interactions and gameplay systems
- graphics benchmark V3/V4/V5 machinery
- deterministic world generation

## Current main branch

At the time this manifest was created:

**main:** `5c0680f0f5935890f7d71014b95667d42f09c6e7`

Main is the active forensic-development line. It may contain diagnostic changes. It must NOT be treated as the recovery baseline merely because it is newer.

## Diagnostic safety rules

1. Never roll the main branch backward blindly.
2. Never stack several unknown visual changes into one diagnostic experiment.
3. Every diagnostic must be reversible.
4. Prefer runtime switches or narrowly scoped isolation over deleting/removing advanced systems.
5. Before any experiment that modifies rendering behavior, compare the intended change against the protected baseline.
6. If an experiment produces a black screen, severe degradation, or an unexplained regression, stop and revert that experiment rather than continuing to modify the degraded state.
7. Preserve the advanced machinery even when testing whether one component is responsible.
8. Record discoveries in the forensic handoff documentation.
9. Do not delete or repurpose `protected/modern-yellow-build85`.
10. The protected branch is the emergency recovery route if forensic work becomes confused.

## Known historical facts

The persistent yellow/green cast has already been tested against several candidate causes:

- fog: ruled out by a valid per-frame fog-density-zero test
- PMREM/environment contribution: ruled out by a valid per-frame environment-intensity-zero test
- Foundation Surface Shader: ruled out by a valid global disable
- DOM vignette/grain overlays: ruled out
- GraphicsSunHalo: ruled out
- broad CinematicWorldDepth mist bands: ruled out
- sun disc: ruled out
- cinematic grade identity test: changed presentation to gray/white but did not remove the underlying problem
- AgX versus ACES changed the hue but did not remove the underlying problem

These findings are evidence, not permission to remove those systems permanently.

## Immediate forensic direction

Continue source-level isolation while preserving the protected state.

Highest-value remaining investigation classes:

1. fullscreen/composer/output transformations
2. OutputPass and final color conversion
3. custom ShaderMaterial / shader fragments
4. remaining onBeforeCompile hooks
5. large transparent or camera-space primitives
6. sky/background composition
7. texture color-space handling
8. any global framebuffer/render-target manipulation
9. remaining post-processing passes and their order

The governing objective is:

**Identify the exact operation producing the global blue-channel suppression / yellow-green cast, correct it surgically, and keep the entire modern renderer intact.**

Never substitute rollback for diagnosis.
