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

Gallery opening follow-up — 2026-11-20

- Gallery entry waits until the page-arrival curtain clears. Only visible projects
  receive the existing 850/1100ms staggered entrance. Measurements are batched,
  static centering is preserved in full transform keyframes, and temporary
  compositor hints are removed on finish/cancellation/resize.
- Scroll bindings start after the curtain. Repeated setup with unchanged geometry
  is skipped, all card measurements precede animation writes, and observers/frame
  callbacks disconnect and resume through BFCache.
- Opening a project stops Lenis before measuring its source rectangle and blocks
  pending gallery snapping. Escape resumes scrolling. This prevents inertia from
  moving the source underneath the expanding sheet. A stable scrollbar gutter
  avoids changing the content width while scrolling is locked.
- Opening previews use the real case page's stylesheet links, body classes,
  navigation and hero markup, but omit the remaining chapters and their scripts.
  A bounded four-entry cache warms the first screen on hover/focus. Blob URLs keep
  SVG fragments local and are revoked when the preview closes. Failed preparation
  and limited/local-file contexts retain the original full-page/native fallback.
- The same seven ink circles, turbulence/displacement filter, dimensions and
  timings are retained. Supporting engines animate their SVG radius natively,
  eliminating seven JavaScript attribute writes per frame. This does not imply
  that SVG filters become GPU accelerated. Older engines keep one bounded RAF
  fallback. Text/navigation/ink seek the same elapsed time when assets arrive late.
- Local browser checks exercised all four project previews, the final page
  handoff, cancellation/resumption and the 390px EverPaw seven-phone hero. The
  MUSUBI preview held 116 body descendants during opening versus 1230 after full
  navigation; this is a DOM inventory, not a frame-rate or load-time benchmark.
- The MUSUBI Questionnaire & Interview introduction now ends with the requested
  `(percentages are rounded)` note.

Gallery artwork reveal follow-up — 2026-11-21

- The animated turbulence/displacement mask above is replaced by seven copies
  of a fixed, rough SVG outline. Each copy scales with the existing positions,
  delays, 1050ms duration and easing; completion remains at 1900ms. The edge is
  similar to the ink reveal, rather than the previous live noise calculation.
  This removes the SVG noise filters and the older radius-attribute RAF loop.
- Preview readiness waits for every hero image (including MUSUBI's wordmark)
  and its fonts. It no longer starts unconditionally after 450ms. A failed decode
  or a 1200ms readiness deadline opens the native case page with a settled handoff,
  avoiding a late image joining or restarting the reveal. Cleanup invalidates
  pending decode callbacks after cancellation or leaving the page.
- All 41 tests and the static build pass. Offline SVG raster checks cover five
  intermediate times for MUSUBI and NABORFOOD. Reveal coverage increases to the
  full image, and the final RGBA pixels match the unmasked artwork. Images, CSS
  placement and layout are unchanged.
- Browser automation was unavailable for this follow-up. The offline renderer
  verifies mask appearance and coverage; it does not measure Chrome frame rate
  or establish performance on the user's device.

Gallery white-strip and opening follow-up — 2026-11-21

- Artwork now enters with one 850ms opacity/translation animation, starting at
  120ms. This supersedes the SVG ink stamps above. The 900ms paper expansion and
  the existing text/navigation sequence remain. Temporary layer hints are cleared
  on completion, interruption and pagehide.
- MUSUBI's source has an opaque light canvas. Its enlarged left edge extended
  beyond the figure backdrop while masks isolated its `darken` blend, exposing a
  light strip. A lossless, content-hashed alpha derivative removes the need for
  that blend and its compensating background shadows. The original 2400×1800
  artwork remains in place. All 4,320,000 derived pixels composited on #efeee9
  match the former darken result exactly; five opacity stages produce no pixels
  brighter than that background. The derivative is larger than the opaque source
  (977,104 versus 322,572 bytes) to preserve exact displayed colors with alpha.
- The gallery stays visible until the preview is decoded, instead of an empty
  sheet starting after 180ms. The 3200ms loading deadline is canceled on readiness;
  the 1900ms reveal then has its own 2400ms completion guard. Timeout handoffs are
  settled so the native page does not restart the entrance. Late messages after
  navigation are ignored.
- All 42 tests and the static build pass. Browser automation remains unavailable;
  pixel/compositing checks and timing/message tests do not establish Chrome FPS.
