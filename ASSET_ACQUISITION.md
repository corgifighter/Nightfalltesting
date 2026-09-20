# Hearthmere Asset Acquisition & Distillation Pass

This document records the first deliberate external-asset acquisition pass for Nightfall Reborn / Hearthmere.

## Objective

Replace the weakest visible procedural silhouettes with a small number of high-information source assets that materially improve the rendered image without turning the mobile browser build into an asset dump.

The runtime rule is:

**exceptional source -> provenance check -> mobile-sized runtime representation -> art-direction integration -> measured frame cost**

Raw source complexity is not the target. Perceived visual information at the game's actual camera distance is the target.

## Vendored CC0 assets

| Runtime file | Source | Intended role | Runtime strategy |
|---|---|---|---|
| assets/cc0/polyhaven/rock_moss_set_01.glb | Poly Haven / Rock Moss Set 01 | rocks, shoreline geology, path-side stones | select one of six source variants per placement |
| assets/cc0/polyhaven/shrub_02.glb | Poly Haven / Shrub 02 | low vegetation and village-edge shrubs | select source variants; replace weak shrub primitives |
| assets/cc0/polyhaven/fern_02.glb | Poly Haven / Fern 02 | damp woodland / river-edge understory | sparse hero dressing near water and approaches |
| assets/cc0/polyhaven/grass_medium_01.glb | Poly Haven / Grass Medium 01 | foreground and midground grass | replace weak grass-clump primitives |

Original source pages:

- https://polyhaven.com/a/rock_moss_set_01
- https://polyhaven.com/a/shrub_02
- https://polyhaven.com/a/fern_02
- https://polyhaven.com/a/grass_medium_01

Poly Haven states that its assets are released under CC0 and may be used commercially. Source provenance is retained here even though CC0 does not require attribution.

## Why these were selected

### Rock Moss Set 01

Six varied weathered rock silhouettes with moss, dirt and erosion give the scene information that a smooth procedural sphere cannot provide. Poly Haven lists the complete source set at 63K triangles, making it unusually attractive as a source family rather than a single repeated rock.

### Shrub 02

The important improvement is not polygon count. It is the combination of branching stems, narrow leaves, color variation and a natural ground-cover silhouette. It directly attacks the rounded green primitive problem visible in earlier frames.

### Fern 02

Four fern clumps provide a very different leaf language from the shrub. They are therefore used selectively around the river and damp edges rather than everywhere.

### Grass Medium 01

This is reserved for visible ground-cover zones. It is not used as an excuse to cover the entire map with expensive geometry.

## Runtime implementation

The app now has a local DISTILLED_ASSETS registry and a dedicated loader/cache. The renderer selects variants from multi-object CC0 sets instead of instantiating the entire source set repeatedly.

Legacy authored assets remain useful as placement/layout references. They are not treated as sacred final geometry.

## Deliberate non-acquisitions

### Tree Small 02

Excellent source asset, but its raw Poly Haven download is far too large for direct mobile delivery. It remains a source/distillation candidate, not a runtime dependency.

The correct next step is to create a small, silhouette-preserving LOD family from it rather than shipping the raw source.

### Large Grass / Forest Assets

Large scans and high-resolution vegetation are useful as source material, but should not be dropped into the browser unchanged. They must pass through the same distillation gate.

### Mixed-license marketplaces

CGTrader / Sketchfab and similar libraries remain research sources only until the exact asset license, redistribution rights, texture rights and derivative-use rights are verified. No uncertain-license asset is being introduced into the repository during this pass.

## Next acquisition targets

1. A genuinely high-quality broadleaf tree with a mobile LOD chain.
2. A second tree silhouette, preferably a conifer.
3. A compact medieval timber/stone architectural hero asset or source kit.
4. A small set of weathered wood/stone hero props.
5. Shoreline / bank geology that can break the current river edge.
6. A small hero architectural doorway/window/roof-detail family.
7. A lightweight foliage card/cluster solution for distant vegetation.

## Quality gate for every future asset

An asset is admitted only if:

- its provenance/license is clear;
- it materially improves a visible weakness;
- it has a believable silhouette at Hearthmere camera distance;
- its materials respond correctly to the existing renderer;
- it has a practical mobile representation or a credible distillation path;
- it does not introduce an incompatible art language;
- it is measurable in the live performance telemetry;
- it can be removed without destabilizing the world.

**Do not acquire assets merely because they are technically impressive. Acquire them because they make the actual game frame better.**