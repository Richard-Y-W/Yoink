# Codex Usage Drop Pipeline Design

## Goal

Build a no-API Yoink drop-art pipeline that can scale the catalog to 400 items and prepare app-ready render jobs for Codex usage-based image generation. The repo should own the catalog, prompts, status, contact sheets, and sync path; Codex provides the actual bitmap render generation outside local scripts.

## Architecture

The source of truth remains `yoink-drop-art/item-catalog.json`. A new Node tool in `yoink-drop-art/tools/` expands the catalog deterministically, writes prompt files, writes a Codex job manifest, derives status from checked-in PNGs plus manual overrides, and builds an HTML contact sheet. No script calls OpenAI or Gemini APIs.

The pipeline writes renders to `yoink-drop-art/renders/<item-id>.png`. Approved renders can later be synced into `yoink/public/yoink-items/<item-id>.png`, which matches the current app asset model without forcing an immediate migration to `dropCatalog.js` or imported assets.

## Data Flow

1. `expand` reads existing catalog items and appends deterministic Yoink items until the target count is reached.
2. Each catalog item gets `renderFile`, `promptFile`, family, rarity, edition size, price, traits, and drop role.
3. `jobs` writes `yoink-drop-art/codex-render-jobs.json` with one prompt and target render path per item.
4. Codex usage-based image generation consumes the next pending prompt and saves the PNG at the target render path.
5. `sheet` writes `yoink-drop-art/codex-contact-sheet.html`, showing generated, approved, pending, and needs-regen items.
6. `sync-app` copies approved or generated renders into `yoink/public/yoink-items/` when we are ready to expose them in the app.

## Status Rules

The default status is derived from files:

- `pending`: no render PNG exists.
- `generated`: render PNG exists.

Manual overrides live in `yoink-drop-art/codex-render-status.json`:

- `approved`: render passed style review.
- `needs-regen`: render exists but should be replaced.

Manual status always wins over file-derived status so bad renders stay flagged until changed.

## Testing

The app test suite imports the pipeline module directly and verifies:

- Catalog expansion reaches exactly 400 items with unique ids.
- Existing catalog entries are preserved.
- Generated items receive render and prompt paths.
- Prompt text carries Yoink style constraints and avoids logos/readable text.
- Job status combines filesystem renders with manual overrides.
- App sync copies only generated or approved render files.

## Constraints

The pipeline must not require API keys, must not call external image APIs, and must be resumable when Codex usage limits pause image generation. It should be safe to run repeatedly without duplicating items or rewriting approved status.
