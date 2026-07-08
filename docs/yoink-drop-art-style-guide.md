# Yoink Drop Art Pack — Style Guide

The canonical look for every Yoink collectible. The reference set is the
16-item "Yoink Drop Art Pack" hero board (Bubble CRT, Jelly Flip Phone, Frog
Foil Card, Mochi Blob, Crinkle Pack Mascot, …). All new item art must match
this pack. The flat-SVG "sticker / vinyl / spin" system in `src/itemArt.js`
is **not** the product art style — treat it as legacy placeholder rendering
until every item has a real render.

## The look

- **Chibi 3D toy render** — soft rounded volumes, vinyl/clay material with
  glossy speculars, like a blind-box figure photographed for a shop.
- **Every item has a tiny kawaii face** (dot eyes, small smile, optional
  blush) — even objects: TVs, tickets, donuts.
- **Pastel seamless studio backdrop** per item (lavender, pink, mint, butter,
  peach, sky), single soft key light, soft contact shadow, subtle sparkles.
- **Holo material** — Holo Finds items and Ultra Rare / One-Off tiers get
  iridescent holographic foil surfaces (rainbow sheen, star glints).
- Square crop, item centered, no text or watermark in the render.

## Taxonomy

Four families — every item belongs to exactly one:

| Family | What lives here | Examples |
| --- | --- | --- |
| Pocket Tech | chunky retro gadgets | Bubble CRT, Jelly Flip Phone, Pocket Pixel MP3 |
| Holo Finds | shiny paper/ephemera collectibles | Frog Foil Card, Cosmic Sticker Slab, Lucky Pog Stack |
| Desk Pets | tiny creature companions | Mochi Blob, Sleepy Star Charm, Tiny Desk Dino |
| Snack Relics | food/vending/prize nostalgia | Cereal Prize Rocket, Capsule Ghost Toy, Crinkle Pack Mascot |

## Rarity ladder

Rarity is scarcity — mint counts ("N made") are part of the item identity
and displayed under the name.

| Rarity | Mint count | Price band (bells) | Tag color |
| --- | --- | --- | --- |
| Common | 150–220 made | 80–320 | grey `#8C8A99` |
| Uncommon | 80–120 made | 340–780 | teal `#10B5A0` |
| Rare | 40–60 made | 800–2,400 | purple `#6A5ACD` |
| Ultra Rare | 14–24 made | 2,600–7,500 | orange `#E89B2E` |
| One-Off | 1 made | 15,000–26,000 | pink `#FF3D9A` |

## Naming language

`[material/texture word] + [nostalgic object] (+ optional Relic / Charm /
Mascot / Toy / Pal)` — e.g. Bubble CRT, Taffy Tape Deck, Glimmer Ticket
Relic, Wobble Whale Charm. Material words: Bubble, Jelly, Gummy, Taffy,
Sherbet, Marshmallow, Glimmer, Crinkle, Cosmic, Prism, Opal, Aurora,
Stardust, Moonbeam, Twinkle, Milky, Minty, Dreamy, Puffy, Pebble…

## Pipeline

- Catalog data lives in `yoink/src/dropCatalog.js` — one entry per item with
  id, name, family, rarity, mint count, price, backdrop, and motif.
- `artPromptFor(item)` composes the house-style generation prompt for the
  render. Generate square renders and save as
  `yoink/src/assets/drops/<id>.png`.
- `yoink/src/dropCatalog.test.js` enforces the taxonomy, rarity bands, and
  hero set.
