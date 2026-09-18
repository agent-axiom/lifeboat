# Browser Player Implementation Plan

**Goal:** Remove the native installation prerequisite from the first useful
Lifeboat experience without concealing the unresolved macOS distribution issue.

**Architecture:** A self-contained HTML page imports a snapshot and keeps its
source text separate from normalized working items. A bounded two-step workflow
requires explicit acceptance. Export embeds the data and runtime in a local HTML
file. No server, model call, API credential, or external asset is required.

**Tech Stack:** HTML, CSS, vanilla JavaScript, File/Blob APIs, optional Web Crypto
and localStorage. No new packages, build tools, or paid services.

## Files

- Create `web/browser-player/index.html`: importer, workflow engine, UI, exports.
- Create `docs/browser-player.md`: schema, limits, privacy, honest validation scope.
- Modify `web/landing/index.html`: main browser CTA and visible entry strip.
- Modify `web/landing/story.css`: entry-strip styling in the existing visual system.
- Publish the new Player to `docs/player/index.html` for GitHub Pages.

## Delivery sequence

1. Implement bounded JSON/CSV parsing with duplicate detection and source retention.
2. Implement guarded, idempotent actions and invalidate acceptance on recipe changes.
3. Implement safe text rendering, preview, downloads, and opt-in browser backups.
4. Embed source and working state in portable HTML without external dependencies.
5. Link the implementation from the landing page and publish the preview.
6. Keep native installation warnings. Do not claim a signed macOS release.

## Verification boundary

Do not claim checks that were not executed. The repository instructions require
explicit authorization for additional validation. The release checklist is in
`docs/browser-player.md`; implementation and publication alone do not establish
that the new Player is competition-ready or that it works in every browser.
