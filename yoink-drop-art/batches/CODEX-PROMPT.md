# Prompt for Codex — generate the Drop Art Pack renders

Copy everything below the line into Codex (run it in this repo). Attach the
original 16-item "Yoink Drop Art Pack" board image as a style reference if
your interface allows image attachments.

---

Generate the product render images for this repo's collectible catalog using
your image-generation capability (gpt-image-1 or equivalent).

CONTEXT
- The catalog is `yoink/src/dropCatalog.js` — 57 items need renders (the ones
  where `hero` is false).
- Ready-made generation prompts live in `docs/drop-render-batches/batch-01.md`
  through `batch-08.md`. Each entry shows the item, its exact output filename,
  and the full prompt text. Use those prompts VERBATIM — do not rewrite them.
- The style guide is `docs/yoink-drop-art-style-guide.md`. The look: cute
  chibi 3D collectible toy render, soft rounded vinyl-clay material, glossy
  speculars, a tiny kawaii face on every item (even objects), centered on a
  seamless pastel studio backdrop with a soft contact shadow, subtle sparkles.
  Holo Finds items and Ultra Rare / One-Off items get iridescent holographic
  foil accents (the prompts already include this).

REQUIREMENTS
1. Output: PNG, square 1024x1024, one image per item.
2. Save each image to `yoink/src/assets/drops/<id>.png` using the EXACT
   filename given in the batch sheet (e.g. `gummy-game-brick.png`).
3. Use identical model + settings for every image so the whole set reads as
   one artist. No text, no watermark, no borders in the images.
4. Work batch by batch: generate batch-01 (8 images) first and STOP so the
   art can be style-checked against the original pack. After approval,
   continue batch-02 through batch-08 the same way.
5. If an image comes out off-style (no face, dark background, realistic
   instead of toy-like, text present), regenerate it before moving on.
6. Do not modify any code or catalog files — images only.

When all batches are done, list any items you had to regenerate and why.
