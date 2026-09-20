# Stage 2 Engineering Foundation

This document records the objective engineering work that should be completed before returning to screenshot-driven visual iteration.

## Completed in this engineering block

- Deterministic seeded world generation so authored placement and runtime environmental randomness are reproducible.
- Shared geometry caches for repeated high-segment cylinders, spheres, rocks, and reconstructed tree canopies.
- Scene-budget telemetry for visible meshes, shadow casters, transparent meshes, lights, draw calls, triangles, geometries, and textures.
- Explicit runtime readiness state separating asset readiness, visual-world readiness, shader readiness, and first rendered frame.
- Real capture metadata containing seed, renderer revision, viewport, pixel ratio, quality level, render statistics, scene budget, and asset failures.
- Gameplay raycasts isolated to registered interaction roots rather than the complete visual scene.
- Shadow participation policy applied to distilled micro-foliage, with shrubs/scrub retaining shadow contribution while grass/ferns avoid full shadow-map cost.
- Navigation volumes separated into named river/bridge data rather than embedding those dimensions directly in movement code.
- Texture-budget telemetry added with unique texture count, estimated base memory, and largest texture entries.
- Service-worker fallback corrected so only navigation requests fall back to index.html; failed assets/modules remain actual failures.
- Runtime lifecycle diagnostics added for uncaught errors, unhandled rejections, WebGL context creation/loss/restoration, and page visibility.
- CC0 enhancement textures now settle before the authoritative ready state and are explicitly GPU-initialized when loaded.
- Adaptive quality now uses a rolling 120-frame sample with p95 frame-interval protection rather than reacting to a single average window.
- Capture metadata now includes runtime failures and shadow-policy telemetry.
- Shadow participation now has a geometry-aware tiny-caster policy; large/medium silhouettes remain eligible while very small trim/fasteners are removed from shadow-map participation.
- Reconstructed rock geometry now reuses the existing high-segment geometry cache.
- Service-worker cache coverage now includes capture.html and runtime caching for the external Test-screen and Poly Haven asset prefixes.
- Asset readiness now tracks actual loader pending state instead of assuming every manifest entry was requested.
- Capture readiness is now false when required runtime assets fail, preventing false-positive “ready” captures.
- Static parser validation was added during this audit and exposed a malformed terrain shader string that had survived earlier iterations; the shader source was repaired and app.js/sw.js now pass parser checks.

## Remaining Stage 2 engineering backlog

1. Validate the new shadow classification against the first real-frame performance sample and tune only if evidence shows visual or GPU regressions.
2. Establish explicit distance/LOD policy for hero, gameplay vicinity, midground, and far-background assets.
3. Expand navigation volumes beyond the river/bridge into authored building and landmark blockers.
4. Use the new texture telemetry to identify duplicate/heavy texture families before expanding the asset library.
5. Replace hidden legacy visual GLBs with layout metadata where practical so old visual assets stop consuming runtime resources.
6. Vendor the remaining Three.js runtime dependency chain when the asset/runtime architecture is stable enough to do so safely.
7. Evaluate GPU-compressed texture delivery (KTX2/Basis) for the final asset pipeline; this is a production pipeline change, not a blind runtime dependency to add before compressed assets exist.

## Operating rule

After this foundation, visual work returns to the real-frame cadence:

**major visual pass -> real runtime screenshot -> objective analysis -> next major visual pass.**

Engineering work should interrupt that cadence only when a concrete correctness, reproducibility, performance, deployment, or asset-pipeline issue is discovered.
