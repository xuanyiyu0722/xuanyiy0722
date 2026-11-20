Performance maintenance — 2026-11-20

The design, copy, layout, animation durations and easing curves remain intact.
Original artwork is retained. `performance-assets.json` records the derived files.

- 155 PNG/SVG resources: 87,555,268 → 39,485,244 bytes (55% smaller).
  PNGs use lossless WebP at their original dimensions. SVG geometry/text remain
  vectors; only embedded raster encodings change. Decoded RGBA was compared for
  every conversion, ignoring RGB only where alpha is zero. No resizing or lossy
  recompression was used. Profiled, oriented and animated source images were
  excluded from conversion.
- Five Euclid TTFs: 701,360 → 170,652 bytes (76% smaller WOFF2).
  Character maps, glyph order, outlines, horizontal metrics, hhea, OS/2 and shaping
  tables were checked after round trip. Families, weights and styles are unchanged.
- Teachers and EverPaw's supplied screen fonts use the same Google Fonts WOFF2
  files, now local. Unicode ranges remain intact; only the common Teachers normal
  Latin subset is preloaded. Existing original-artwork font declarations are kept.
- Content-hashed derivatives receive immutable caching. Unhashed HTML, scripts,
  CSS and original images keep their existing cache behavior. Changed runtime
  references use a fresh version query. All 23 missing intrinsic image sizes in
  the seven main pages are supplied to reserve the same aspect ratios early.
- Existing lazy image/SVG/iframe loading and video `preload="none"` are retained.
  Both MP4s already put `moov` before `mdat` for progressive playback; no video
  re-encoding or quality change was needed.

Runtime changes

- Home title sizing reads geometry before writing styles, caches font ink metrics
  until fonts change, coalesces ResizeObserver callbacks and deduplicates SVG
  selection highlights. Existing title/carton placement math is retained.
- Four artwork viewers coalesce pointer input into one scroll update per paint,
  retain the release sample and cancel pending work on close/capture loss/pagehide.
- MUSUBI and FridgeKey embed resize messages are source/bounds checked, coalesced
  and deduplicated. Visibility notifications respect hidden documents and BFCache.
- Gallery Lenis still uses the original shared Motion frame scheduler and easing.
  It stops ticks in hidden documents, guards destroyed instances and avoids a
  second animation rebuild when loaded fonts have not changed card geometry.
- Naborfood leaders measure all notes before writing paths. Wireframe highlights
  reuse their DOM on resize, while a newly selected function keeps its entrance.
  FridgeKey rail controls coalesce scroll notifications. MUSUBI's storyboard
  suspends pending paints offscreen and restores its existing playback position.
- Existing home cursor, hover, counters, reveal effects, other journey animations,
  page transitions and smooth-scroll timings were audited and retained where
  they already use bounded/on-demand work. There is no active Glitch-specific
  runtime in the current source; no visual effect was removed.

Validation

`node --test scripts/*.test.mjs` covers deployment gates, event bursts, final
pointer positions, source/size guards, cancellation/resumption, deduplication,
layout-read ordering and font-metric cache invalidation. `node scripts/build-site.mjs`
checks static references, case-sensitive filenames, syntax and deployment output.

`node scripts/performance-audit.mjs` reports deduplicated, directly declared page
resource bytes. Baseline/results are in `performance-baseline.json`. Across the
seven pages this is about 160.1 → 113.9 MB. This sum includes repeated shared
resources between pages and all declared lazy artwork; it is not initial network
transfer, load duration, Lighthouse, FPS or field Core Web Vitals. Newly localized
fonts also become visible to this static inventory. Original source assets remain
in the repository/output, so the full deployment archive is not smaller.

Browser checks compare pre-change production with local output at 1440×700 and
390×844. Desktop key-block offsets, dimensions, computed fonts and colors match.
Mobile key layouts match; transient arrival classes/sticky offsets are ignored.
Interaction checks include egg preview/crack/close, gallery engine and return
position, wireframe tabs/highlights, image zoom, embedded prototypes and storyline
play/pause. No browser frame-time or real-device performance claim is made.
