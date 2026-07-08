from __future__ import annotations

import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "item-catalog.json"
OUT = ROOT / "contact-sheet-expansion-2026-07-07.png"
DARK = (30, 24, 46)
WHITE = (255, 255, 255)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Helvetica Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Helvetica.ttf",
        "/Library/Fonts/Arial Bold.ttf" if bold else "/Library/Fonts/Arial.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def rarity_color(rarity: str) -> tuple[int, int, int]:
    return {
        "Common": (145, 142, 155),
        "Uncommon": (18, 147, 126),
        "Rare": (111, 88, 211),
        "Ultra Rare": (255, 135, 0),
        "One-Off": (255, 54, 145),
    }[rarity]


def main() -> None:
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    items = [item for item in catalog["items"] if item.get("dropRole") == "expansion-2026-07-07"]

    cols = 4
    card_w, card_h = 360, 470
    gap = 18
    margin = 28
    header = 105
    rows = math.ceil(len(items) / cols)
    width = margin * 2 + cols * card_w + (cols - 1) * gap
    height = header + margin + rows * card_h + (rows - 1) * gap
    sheet = Image.new("RGB", (width, height), (246, 242, 255))
    draw = ImageDraw.Draw(sheet)
    draw.text((margin, 24), "Yoink Drop Art Pack Expansion", fill=DARK, font=font(31, True))
    draw.text(
        (margin, 62),
        "34 generated assets - 4 Ultra Rare foil cards, 10 Pocket Tech, 10 Desk Pets, 10 Snack Relics",
        fill=(126, 119, 144),
        font=font(15),
    )

    title_font = font(20, True)
    meta_font = font(13)
    pill_font = font(12, True)
    price_font = font(17, True)

    for index, item in enumerate(items):
        row, col = divmod(index, cols)
        x = margin + col * (card_w + gap)
        y = header + row * (card_h + gap)
        draw.rounded_rectangle((x, y, x + card_w, y + card_h), radius=15, fill=WHITE, outline=(222, 215, 242), width=2)

        render = Image.open(ROOT / item["renderFile"]).convert("RGB").resize((282, 282), Image.Resampling.LANCZOS)
        sheet.paste(render, (x + 39, y + 18))

        draw.text((x + 20, y + 318), item["name"], fill=DARK, font=title_font)
        draw.text(
            (x + 20, y + 348),
            f"{item['family']} - {item['rarity']} - {item['editionSize']} made",
            fill=(126, 119, 144),
            font=meta_font,
        )
        badge = rarity_color(item["rarity"])
        badge_w = max(82, int(draw.textlength(item["rarity"], font=pill_font)) + 22)
        draw.rounded_rectangle((x + 20, y + 382, x + 20 + badge_w, y + 407), radius=8, fill=badge)
        draw.text((x + 31, y + 388), item["rarity"], fill=WHITE, font=pill_font)
        draw.text((x + 20, y + 425), f"Y {item['price']}", fill=(111, 88, 211), font=price_font)

    sheet.save(OUT)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
