# Codex Usage Render Pipeline

This pipeline prepares Yoink drop-art jobs without OpenAI or Gemini API keys. Local scripts manage catalog, prompts, status, and contact sheets. Codex image generation usage creates the PNGs.

## Core Commands

```bash
node yoink-drop-art/tools/codex-usage-pipeline.mjs expand --target 400
node yoink-drop-art/tools/codex-usage-pipeline.mjs jobs
node yoink-drop-art/tools/codex-usage-pipeline.mjs next
node yoink-drop-art/tools/codex-usage-pipeline.mjs copy-latest --to yoink-drop-art/renders/<item-id>.png
node yoink-drop-art/tools/codex-usage-pipeline.mjs mark --id <item-id> --status approved
node yoink-drop-art/tools/codex-usage-pipeline.mjs sheet
node yoink-drop-art/tools/codex-usage-pipeline.mjs sync-app
```

## Render Loop

1. Run `next` and copy the printed prompt.
2. Generate that image through Codex image generation usage.
3. Save the newest generated PNG into the requested target:

```bash
node yoink-drop-art/tools/codex-usage-pipeline.mjs copy-latest --to yoink-drop-art/renders/<item-id>.png
```

4. Rebuild jobs and contact sheet:

```bash
node yoink-drop-art/tools/codex-usage-pipeline.mjs jobs
node yoink-drop-art/tools/codex-usage-pipeline.mjs sheet
```

5. Review `yoink-drop-art/codex-contact-sheet.html`.
6. Mark good renders:

```bash
node yoink-drop-art/tools/codex-usage-pipeline.mjs mark --id <item-id> --status approved
```

7. Mark bad renders:

```bash
node yoink-drop-art/tools/codex-usage-pipeline.mjs mark --id <item-id> --status needs-regen
```

## App Sync

When renders are ready to use in the market app, run:

```bash
node yoink-drop-art/tools/codex-usage-pipeline.mjs sync-app
```

That copies `generated` and `approved` PNGs into `yoink/public/yoink-items/`. The app catalog still needs matching entries in `yoink/src/data.js` before new items appear in the feed.

## Current State

The catalog is prepared for 400 total items. Existing checked-in renders are detected automatically, and missing render files stay `pending` until Codex usage generation creates them.
