from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
RENDERS = ROOT / "renders"
PROMPTS = ROOT / "prompts"
CATALOG = ROOT / "item-catalog.json"
CONTACT_SHEET = ROOT / "contact-sheet-expansion-2026-07-07.png"
SUMMARY = ROOT / "expansion-2026-07-07.md"
SIZE = 1254
DARK = (30, 24, 46)
WHITE = (255, 255, 255)


@dataclass(frozen=True)
class Item:
    id: str
    name: str
    family: str
    rarity: str
    edition_size: int
    price: int
    traits: list[str]
    prompt: str
    render_mode: str
    palette: dict[str, tuple[int, int, int]]


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


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def mix(c1: tuple[int, int, int], c2: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(lerp(a, b, t) for a, b in zip(c1, c2))


def brighten(color: tuple[int, int, int], amount: float = 0.22) -> tuple[int, int, int]:
    return mix(color, WHITE, amount)


def darken(color: tuple[int, int, int], amount: float = 0.24) -> tuple[int, int, int]:
    return mix(color, (0, 0, 0), amount)


def gradient_background(top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    img = Image.new("RGB", (SIZE, SIZE), top)
    px = img.load()
    for y in range(SIZE):
        t = y / max(1, SIZE - 1)
        color = mix(top, bottom, t)
        for x in range(SIZE):
            px[x, y] = color
    return img


def layer() -> Image.Image:
    return Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))


def draw_shadow(base: Image.Image, bbox: tuple[int, int, int, int], blur: int = 38, alpha: int = 80) -> None:
    sh = layer()
    d = ImageDraw.Draw(sh)
    d.ellipse(bbox, fill=(45, 33, 70, alpha))
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(sh)


def rr(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    radius: int,
    fill: tuple[int, int, int] | tuple[int, int, int, int],
    outline: tuple[int, int, int] = DARK,
    width: int = 10,
) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def ellipse(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    fill: tuple[int, int, int] | tuple[int, int, int, int],
    outline: tuple[int, int, int] = DARK,
    width: int = 9,
) -> None:
    draw.ellipse(box, fill=fill, outline=outline, width=width)


def poly(
    draw: ImageDraw.ImageDraw,
    points: list[tuple[int, int]],
    fill: tuple[int, int, int],
    outline: tuple[int, int, int] = DARK,
    width: int = 9,
) -> None:
    draw.polygon(points, fill=fill)
    draw.line(points + [points[0]], fill=outline, width=width, joint="curve")


def draw_face(draw: ImageDraw.ImageDraw, x: int, y: int, scale: float = 1.0, mood: str = "smile") -> None:
    eye = int(18 * scale)
    gap = int(62 * scale)
    ellipse(draw, (x - gap, y - eye, x - gap + eye, y + eye), DARK, DARK, 0)
    ellipse(draw, (x + gap - eye, y - eye, x + gap, y + eye), DARK, DARK, 0)
    ellipse(draw, (x - gap + int(5 * scale), y - int(8 * scale), x - gap + int(11 * scale), y - int(2 * scale)), WHITE, WHITE, 0)
    ellipse(draw, (x + gap - int(13 * scale), y - int(8 * scale), x + gap - int(7 * scale), y - int(2 * scale)), WHITE, WHITE, 0)
    if mood == "sleep":
        draw.arc((x - int(24 * scale), y + int(4 * scale), x + int(24 * scale), y + int(36 * scale)), 20, 160, fill=DARK, width=max(3, int(5 * scale)))
    else:
        draw.arc((x - int(24 * scale), y + int(2 * scale), x + int(24 * scale), y + int(38 * scale)), 15, 165, fill=DARK, width=max(3, int(5 * scale)))
    blush = (255, 127, 164, 150)
    draw.ellipse((x - int(100 * scale), y + int(20 * scale), x - int(58 * scale), y + int(45 * scale)), fill=blush)
    draw.ellipse((x + int(58 * scale), y + int(20 * scale), x + int(100 * scale), y + int(45 * scale)), fill=blush)


def draw_star(draw: ImageDraw.ImageDraw, cx: int, cy: int, r1: int, r2: int, fill: tuple[int, int, int]) -> None:
    pts: list[tuple[int, int]] = []
    for i in range(10):
        r = r1 if i % 2 == 0 else r2
        a = -math.pi / 2 + i * math.pi / 5
        pts.append((int(cx + math.cos(a) * r), int(cy + math.sin(a) * r)))
    poly(draw, pts, fill, DARK, max(5, r1 // 9))


def sticker(draw: ImageDraw.ImageDraw, x: int, y: int, color: tuple[int, int, int], kind: str = "star") -> None:
    if kind == "star":
        draw_star(draw, x, y, 34, 16, color)
    elif kind == "heart":
        draw.ellipse((x - 30, y - 20, x, y + 10), fill=color, outline=DARK, width=5)
        draw.ellipse((x, y - 20, x + 30, y + 10), fill=color, outline=DARK, width=5)
        poly(draw, [(x - 32, y - 3), (x + 32, y - 3), (x, y + 42)], color, DARK, 5)
    else:
        ellipse(draw, (x - 28, y - 28, x + 28, y + 28), color, DARK, 5)


def glossy_highlight(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], alpha: int = 96) -> None:
    x1, y1, x2, y2 = box
    draw.rounded_rectangle(
        (x1 + 42, y1 + 34, x2 - 120, y1 + 82),
        radius=28,
        fill=(255, 255, 255, alpha),
    )


def render_pocket_tech(item: Item) -> Image.Image:
    p = item.palette
    img = gradient_background(p["bg1"], p["bg2"]).convert("RGBA")
    d = ImageDraw.Draw(img, "RGBA")
    mode = item.render_mode
    draw_shadow(img, (250, 900, 1000, 1055))

    if "crt" in mode:
        rr(d, (310, 315, 920, 880), 130, p["body"], width=12)
        rr(d, (398, 410, 820, 710), 92, darken(p["screen"], 0.12), width=12)
        rr(d, (432, 445, 786, 675), 72, p["screen"], outline=darken(p["accent"], 0.15), width=8)
        draw_face(d, 610, 552, 1.2)
        glossy_highlight(d, (310, 315, 920, 880), 120)
        ellipse(d, (450, 782, 505, 837), p["accent"])
        ellipse(d, (575, 782, 630, 837), p["button"])
        ellipse(d, (700, 782, 755, 837), p["accent2"])
        rr(d, (300, 825, 410, 930), 42, darken(p["body"], 0.05), width=9)
        rr(d, (820, 825, 930, 930), 42, darken(p["body"], 0.05), width=9)
        d.line((565, 315, 510, 220), fill=DARK, width=12)
        ellipse(d, (470, 170, 540, 240), p["accent2"], width=8)
        sticker(d, 382, 496, p["accent2"], "heart")
        sticker(d, 820, 810, p["accent"], "star")
    elif "flip" in mode:
        rr(d, (395, 185, 815, 562), 110, (*p["body"], 180), width=12)
        rr(d, (435, 248, 775, 500), 52, p["screen"], width=10)
        draw_face(d, 605, 375, 0.85)
        rr(d, (390, 548, 820, 980), 92, p["body"], width=12)
        for row in range(4):
            for col in range(3):
                x = 470 + col * 90
                y = 625 + row * 74
                ellipse(d, (x, y, x + 54, y + 54), mix(p["accent"], WHITE, (row + col) * 0.06), width=6)
        ellipse(d, (655, 665, 738, 748), p["accent2"], width=7)
        d.arc((450, 510, 760, 620), 0, 180, fill=darken(p["body"], 0.16), width=13)
        d.line((820, 560, 965, 645), fill=DARK, width=10)
        sticker(d, 965, 650, p["accent2"], "star")
        glossy_highlight(d, (395, 185, 815, 980), 95)
    elif "mp3" in mode:
        rr(d, (375, 260, 860, 925), 92, p["body"], width=12)
        rr(d, (445, 335, 790, 560), 42, p["screen"], width=10)
        draw_face(d, 618, 455, 0.9)
        ellipse(d, (515, 640, 720, 845), p["button"], width=12)
        ellipse(d, (570, 695, 665, 790), p["accent"], width=8)
        d.polygon([(607, 720), (607, 765), (647, 742)], fill=WHITE)
        for x, y, c in [(440, 635, p["accent"]), (775, 635, p["accent2"]), (445, 820, p["accent2"]), (775, 820, p["accent"])]:
            ellipse(d, (x, y, x + 60, y + 60), c, width=7)
        sticker(d, 785, 310, p["accent2"], "star")
        glossy_highlight(d, (375, 260, 860, 925), 105)
    elif "camera" in mode:
        rr(d, (300, 395, 945, 850), 105, p["body"], width=12)
        rr(d, (420, 318, 650, 440), 52, p["body"], width=10)
        ellipse(d, (610, 485, 875, 750), darken(p["screen"], 0.2), width=13)
        ellipse(d, (662, 537, 823, 698), p["screen"], outline=darken(p["accent"], 0.2), width=9)
        ellipse(d, (718, 585, 768, 635), WHITE, WHITE, 0)
        rr(d, (720, 360, 840, 430), 28, p["button"], width=8)
        ellipse(d, (350, 455, 430, 535), p["accent"], width=8)
        sticker(d, 393, 735, p["accent2"], "star")
        sticker(d, 885, 407, p["accent"], "circle")
        d.arc((322, 778, 484, 1010), 100, 265, fill=darken(p["accent"], 0.1), width=42)
        glossy_highlight(d, (300, 395, 945, 850), 95)
    elif "pager" in mode:
        rr(d, (310, 405, 930, 815), 86, p["body"], width=12)
        rr(d, (410, 478, 800, 620), 38, p["screen"], width=10)
        draw_face(d, 605, 552, 0.78)
        for i in range(4):
            ellipse(d, (430 + i * 92, 690, 485 + i * 92, 745), p["accent"] if i % 2 else p["accent2"], width=6)
        rr(d, (765, 665, 880, 765), 32, p["button"], width=8)
        d.line((835, 405, 940, 310), fill=DARK, width=12)
        ellipse(d, (918, 285, 988, 355), p["accent"], width=8)
        sticker(d, 350, 448, p["accent2"], "star")
        glossy_highlight(d, (310, 405, 930, 815), 90)
    else:
        rr(d, (410, 280, 810, 910), 86, p["body"], width=12)
        rr(d, (460, 220, 760, 345), 54, p["accent"], width=10)
        rr(d, (510, 375, 710, 610), 44, p["screen"], width=10)
        draw_face(d, 610, 500, 0.75)
        ellipse(d, (510, 690, 585, 765), p["button"], width=8)
        ellipse(d, (635, 690, 710, 765), p["accent2"], width=8)
        d.line((810, 500, 930, 500), fill=DARK, width=16)
        rr(d, (915, 445, 1005, 555), 34, p["accent2"], width=9)
        sticker(d, 474, 842, p["accent"], "heart")
        glossy_highlight(d, (410, 280, 810, 910), 100)

    return img.convert("RGB")


def render_desk_pet(item: Item) -> Image.Image:
    p = item.palette
    img = gradient_background(p["bg1"], p["bg2"]).convert("RGBA")
    d = ImageDraw.Draw(img, "RGBA")
    mode = item.render_mode
    draw_shadow(img, (260, 900, 1000, 1055))

    if "blob" in mode:
        ellipse(d, (310, 380, 915, 860), p["body"], width=12)
        ellipse(d, (355, 795, 470, 910), darken(p["body"], 0.03), width=9)
        ellipse(d, (760, 795, 875, 910), darken(p["body"], 0.03), width=9)
        draw_face(d, 612, 585, 1.05)
        sticker(d, 438, 420, p["accent"], "star")
        d.ellipse((455, 390, 745, 510), fill=(255, 255, 255, 80))
    elif "star" in mode:
        pts = []
        cx, cy = 610, 585
        for i in range(10):
            r = 300 if i % 2 == 0 else 155
            a = -math.pi / 2 + i * math.pi / 5
            pts.append((int(cx + math.cos(a) * r), int(cy + math.sin(a) * r)))
        poly(d, pts, p["body"], DARK, 12)
        draw_face(d, 610, 585, 0.92, "sleep")
        d.line((780, 350, 925, 235), fill=DARK, width=13)
        ellipse(d, (895, 200, 980, 285), p["accent"], width=8)
        sticker(d, 807, 810, p["accent2"], "star")
        d.ellipse((430, 340, 730, 460), fill=(255, 255, 255, 70))
    elif "sprout" in mode:
        ellipse(d, (360, 410, 875, 880), p["body"], width=12)
        ellipse(d, (440, 270, 610, 445), p["leaf"], width=10)
        ellipse(d, (610, 270, 780, 445), p["leaf"], width=10)
        d.line((610, 430, 610, 350), fill=DARK, width=10)
        ellipse(d, (500, 580, 580, 660), p["button"], width=8)
        ellipse(d, (640, 580, 720, 660), p["button"], width=8)
        d.arc((570, 690, 655, 742), 20, 160, fill=DARK, width=7)
        sticker(d, 804, 715, p["accent"], "heart")
        d.ellipse((438, 430, 680, 540), fill=(255, 255, 255, 65))
    elif "dino" in mode:
        ellipse(d, (345, 430, 825, 845), p["body"], width=12)
        ellipse(d, (700, 500, 950, 745), p["body"], width=12)
        poly(d, [(335, 650), (210, 585), (305, 760)], p["body"], DARK, 10)
        for x in [575, 660, 745]:
            draw_star(d, x, 390, 42, 20, p["accent2"])
        draw_face(d, 565, 600, 0.85)
        ellipse(d, (450, 785, 525, 865), darken(p["body"], 0.06), width=8)
        ellipse(d, (725, 780, 800, 860), darken(p["body"], 0.06), width=8)
        sticker(d, 860, 620, p["accent"], "heart")
    elif "pillow" in mode:
        rr(d, (330, 385, 890, 845), 145, p["body"], width=12)
        rr(d, (390, 445, 830, 785), 120, brighten(p["body"], 0.1), width=6)
        draw_face(d, 610, 595, 1.0, "sleep")
        for x, y in [(330, 385), (845, 385), (330, 800), (845, 800)]:
            ellipse(d, (x - 24, y - 24, x + 54, y + 54), p["accent"], width=7)
        sticker(d, 810, 480, p["accent2"], "star")
    else:
        ellipse(d, (390, 430, 835, 820), p["body"], width=12)
        ellipse(d, (320, 545, 430, 710), p["accent"], width=9)
        ellipse(d, (795, 545, 905, 710), p["accent"], width=9)
        for x in [445, 540, 635, 730]:
            d.line((x, 810, x - 30, 910), fill=DARK, width=10)
            ellipse(d, (x - 55, 895, x + 5, 945), p["accent2"], width=7)
        draw_face(d, 612, 600, 0.88)
        sticker(d, 610, 420, p["accent2"], "circle")

    return img.convert("RGB")


def render_snack_relic(item: Item) -> Image.Image:
    p = item.palette
    img = gradient_background(p["bg1"], p["bg2"]).convert("RGBA")
    d = ImageDraw.Draw(img, "RGBA")
    mode = item.render_mode
    draw_shadow(img, (250, 900, 1000, 1055))

    if "rocket" in mode:
        poly(d, [(610, 190), (760, 510), (720, 850), (500, 850), (460, 510)], p["body"], DARK, 12)
        ellipse(d, (520, 455, 700, 635), p["screen"], width=10)
        draw_face(d, 610, 545, 0.65)
        poly(d, [(500, 710), (320, 835), (485, 840)], p["accent"], DARK, 10)
        poly(d, [(720, 710), (900, 835), (735, 840)], p["accent"], DARK, 10)
        rr(d, (475, 230, 745, 335), 44, p["accent2"], width=9)
        for x in [520, 610, 700]:
            sticker(d, x, 760, p["accent"], "star")
        d.ellipse((500, 845, 720, 1035), fill=(*p["accent2"], 130), outline=DARK, width=7)
    elif "capsule" in mode:
        ellipse(d, (335, 300, 885, 895), (*p["bubble"], 130), outline=DARK, width=12)
        d.line((365, 610, 855, 610), fill=DARK, width=10)
        rr(d, (395, 620, 825, 845), 80, p["base"], width=10)
        ellipse(d, (485, 420, 735, 710), p["body"], width=10)
        draw_face(d, 610, 560, 0.82)
        for x, y, c in [(420, 745, p["accent"]), (760, 740, p["accent2"]), (520, 805, p["accent2"])]:
            ellipse(d, (x, y, x + 62, y + 62), c, width=6)
        d.ellipse((410, 330, 640, 420), fill=(255, 255, 255, 85))
    elif "ring" in mode:
        ellipse(d, (365, 350, 855, 840), p["base"], width=12)
        ellipse(d, (485, 470, 735, 720), p["bg1"], DARK, 10)
        poly(d, [(610, 245), (760, 420), (665, 650), (500, 650), (460, 420)], p["gem"], DARK, 10)
        for x in [510, 605, 700]:
            d.line((x, 315, x + 20, 615), fill=brighten(p["gem"], 0.4), width=5)
        sticker(d, 825, 780, p["accent"], "star")
        d.line((780, 780, 910, 870), fill=DARK, width=10)
        ellipse(d, (885, 842, 955, 912), p["accent2"], width=7)
    elif "pack" in mode:
        poly(d, [(360, 310), (865, 270), (900, 900), (330, 875)], p["body"], DARK, 12)
        d.line((378, 390, 880, 350), fill=darken(p["body"], 0.25), width=9)
        d.line((350, 810, 890, 835), fill=darken(p["body"], 0.25), width=9)
        rr(d, (455, 515, 765, 730), 72, p["accent"], width=10)
        draw_face(d, 610, 615, 0.75)
        sticker(d, 435, 460, p["accent2"], "star")
        sticker(d, 805, 795, p["accent2"], "circle")
        for x in range(370, 870, 55):
            d.line((x, 300, x + 22, 350), fill=brighten(p["body"], 0.35), width=6)
    elif "tab" in mode:
        rr(d, (395, 335, 830, 890), 155, p["body"], width=12)
        ellipse(d, (505, 430, 720, 675), p["bg1"], width=10)
        rr(d, (545, 510, 680, 640), 48, p["accent"], width=8)
        draw_face(d, 612, 765, 0.75)
        sticker(d, 455, 388, p["accent2"], "star")
        glossy_highlight(d, (395, 335, 830, 890), 110)
    else:
        ellipse(d, (355, 335, 865, 845), p["body"], width=12)
        ellipse(d, (450, 430, 770, 750), p["accent"], width=10)
        draw_face(d, 610, 590, 0.86)
        for angle in range(0, 360, 45):
            x = int(610 + math.cos(math.radians(angle)) * 315)
            y = int(590 + math.sin(math.radians(angle)) * 315)
            sticker(d, x, y, p["accent2"], "circle")
        d.ellipse((455, 355, 735, 455), fill=(255, 255, 255, 85))

    return img.convert("RGB")


def palette(bg1: str, bg2: str, body: str, accent: str, accent2: str, screen: str = "#BFF4FF") -> dict[str, tuple[int, int, int]]:
    body_rgb = hex_to_rgb(body)
    return {
        "bg1": hex_to_rgb(bg1),
        "bg2": hex_to_rgb(bg2),
        "body": body_rgb,
        "accent": hex_to_rgb(accent),
        "accent2": hex_to_rgb(accent2),
        "button": hex_to_rgb(accent),
        "screen": hex_to_rgb(screen),
        "leaf": hex_to_rgb(accent2),
        "base": darken(body_rgb, 0.08),
        "bubble": hex_to_rgb("#E7DAFF"),
        "gem": hex_to_rgb(screen),
    }


def make_items() -> list[Item]:
    shared_prompt = (
        "high-polish cartoon 3D toy render with thick dark outlines, soft vinyl or clay lighting, "
        "rounded chunky forms, pastel body colors, one bold accent color, sticker-like details, "
        "clean pastel studio background, centered front three-quarter view, no real logos, no readable text"
    )

    def prompt(name: str, family: str, details: str) -> str:
        return (
            f"Use case: stylized-concept\n"
            f"Asset type: Yoink {family} item render\n"
            f"Primary request: {name}.\n"
            f"Subject: {details}\n"
            f"Style/medium: {shared_prompt}.\n"
            f"Composition/framing: single centered object, square image, generous padding, readable at small mobile-card thumbnail size.\n"
            f"Constraints: no real brand logos, no exact existing characters, no readable fake text, no watermark, no clutter, no casino or gambling cues.\n"
        )

    data: list[Item] = [
        Item("holo-finds-prism-star-foil-card", "Prism Star Foil Card", "Holo Finds", "Ultra Rare", 12, 1400, ["slabbed foil card", "prism star icon", "rainbow chrome edge", "serial-stamp shape"], prompt("Prism Star Foil Card", "Holo Finds", "an Ultra Rare slabbed foil card with a cute abstract prism star icon, iridescent frame, chrome edge, glow rim, and sparkle flecks."), "generated-card", palette("#F1E6FF", "#DCCBFF", "#F8B9FF", "#8C5CFF", "#FFD55F")),
        Item("holo-finds-chrome-heart-foil-card", "Chrome Heart Foil Card", "Holo Finds", "Ultra Rare", 10, 1500, ["slabbed foil card", "chrome heart icon", "pink case corners", "rainbow shimmer"], prompt("Chrome Heart Foil Card", "Holo Finds", "an Ultra Rare slabbed foil card with a chunky chrome heart icon, iridescent rainbow frame, polished pink case corners, and a subtle glow."), "generated-card", palette("#FFE2D1", "#FFC9B4", "#FFD2E5", "#FF6FAE", "#A984FF")),
        Item("holo-finds-pixel-crown-foil-card", "Pixel Crown Foil Card", "Holo Finds", "Ultra Rare", 9, 1600, ["slabbed foil card", "pixel crown icon", "cyan case corners", "foil confetti"], prompt("Pixel Crown Foil Card", "Holo Finds", "an Ultra Rare slabbed foil card with a chunky pixel crown icon, rounded gems, cyan-gold glow, and foil confetti."), "generated-card", palette("#D9FFE9", "#BCF7E0", "#B7F7FF", "#21C8D9", "#FFD75B")),
        Item("holo-finds-moon-jelly-foil-card", "Moon Jelly Foil Card", "Holo Finds", "Ultra Rare", 11, 1450, ["slabbed foil card", "crescent moon bubble", "lavender glow", "jelly shimmer"], prompt("Moon Jelly Foil Card", "Holo Finds", "an Ultra Rare slabbed foil card with a crescent moon floating in a jelly-like bubble, lavender-blue glow, and shimmer rim."), "generated-card", palette("#E0E3FF", "#C9CAFF", "#D6C4FF", "#8D72FF", "#FFE7A8")),
        Item("pocket-tech-mint-bubble-crt", "Mint Bubble CRT", "Pocket Tech", "Rare", 48, 460, ["rounded CRT shell", "mint cabinet", "peach screen glow", "sticker buttons"], prompt("Mint Bubble CRT", "Pocket Tech", "a nostalgic rounded CRT desk toy reskinned in mint vinyl with peach screen glow, tiny face, antenna bead, and sticker controls."), "crt", palette("#E0FFF1", "#C8F7E5", "#9EF2CA", "#FF8DA8", "#FFD36E", "#FFC6D7")),
        Item("pocket-tech-berry-bubble-crt", "Berry Bubble CRT", "Pocket Tech", "Rare", 36, 520, ["rounded CRT shell", "berry cabinet", "aqua screen glow", "star sticker"], prompt("Berry Bubble CRT", "Pocket Tech", "a rounded CRT collectible with berry vinyl shell, aqua glowing screen face, chunky side vents, and star sticker details."), "crt", palette("#F3E4FF", "#E2D0FF", "#D29AFF", "#44D7D1", "#FFB347", "#BFF7FF")),
        Item("pocket-tech-lime-jelly-flip", "Lime Jelly Flip", "Pocket Tech", "Uncommon", 84, 360, ["translucent flip shell", "lime keypad", "star charm", "tiny screen face"], prompt("Lime Jelly Flip", "Pocket Tech", "a translucent lime flip phone toy with pastel keypad buttons, tiny smiling screen, and dangling star charm."), "flip", palette("#DFFFF0", "#BFF4D6", "#86E8A8", "#A875FF", "#FFD85C", "#D8FFE4")),
        Item("pocket-tech-coral-jelly-flip", "Coral Jelly Flip", "Pocket Tech", "Rare", 52, 480, ["translucent coral shell", "lavender keypad", "moon charm", "glossy hinge"], prompt("Coral Jelly Flip", "Pocket Tech", "a translucent coral flip phone toy with lavender keypad, glossy hinge, tiny screen face, and charm loop."), "flip", palette("#FFE5DE", "#FFD0CA", "#FF9F9B", "#8D72FF", "#FFE66D", "#FFF2B8")),
        Item("pocket-tech-sky-pocket-pixel-mp3", "Sky Pocket Pixel MP3", "Pocket Tech", "Common", 150, 210, ["sky blue case", "pixel screen", "round play pad", "soft buttons"], prompt("Sky Pocket Pixel MP3", "Pocket Tech", "a rounded sky-blue MP3 player desk toy with pixel screen face, circular play pad, and pastel control buttons."), "mp3", palette("#E2F5FF", "#C9ECFF", "#8FD9FF", "#6F62E8", "#FFD866", "#E7FFBB")),
        Item("pocket-tech-grape-pocket-pixel-mp3", "Grape Pocket Pixel MP3", "Pocket Tech", "Uncommon", 95, 330, ["grape case", "mint screen", "orange play pad", "side sticker"], prompt("Grape Pocket Pixel MP3", "Pocket Tech", "a grape-purple MP3 player toy with mint screen face, orange play pad, and small sticker badge."), "mp3", palette("#EFE4FF", "#DCCBFF", "#A77DFF", "#FF9C54", "#7CF0C4", "#CFFFEA")),
        Item("pocket-tech-lemon-flashpop-camera", "Lemon Flashpop Camera", "Pocket Tech", "Rare", 42, 540, ["lemon camera body", "teal lens", "star flash", "wrist charm"], prompt("Lemon Flashpop Camera", "Pocket Tech", "a lemon-yellow toy camera with oversized teal lens, star flash, and chunky charm strap."), "camera", palette("#FFF2C6", "#FFE49C", "#FFD86B", "#2ECAC4", "#FF7AAE", "#A6F7FF")),
        Item("pocket-tech-teal-flashpop-camera", "Teal Flashpop Camera", "Pocket Tech", "Ultra Rare", 16, 900, ["teal camera body", "rainbow lens", "pink flash", "foil charm"], prompt("Teal Flashpop Camera", "Pocket Tech", "an Ultra Rare teal toy camera with rainbow lens ring, pink flash cap, glossy foil charm, and sticker details."), "camera", palette("#DCF9FF", "#BDEFFF", "#62D6D1", "#FF6FAE", "#FFD45F", "#BAF8FF")),
        Item("pocket-tech-mini-pager-pal", "Mini Pager Pal", "Pocket Tech", "Uncommon", 80, 340, ["rounded pager", "mint screen", "antenna bead", "soft buttons"], prompt("Mini Pager Pal", "Pocket Tech", "a rounded pager desk toy with mint screen face, antenna bead, chunky soft buttons, and sticker corner."), "pager", palette("#F2E8FF", "#DCCBFF", "#BBA1FF", "#23C8BA", "#FFD460", "#DFFFF3")),
        Item("pocket-tech-candy-usb-buddy", "Candy USB Buddy", "Pocket Tech", "Common", 140, 240, ["usb toy", "candy shell", "tiny display", "side plug"], prompt("Candy USB Buddy", "Pocket Tech", "a chunky candy-colored USB buddy collectible with tiny face display, soft cap, side plug, and sticker heart."), "usb", palette("#FFEAF4", "#FFD5E7", "#FFB0CC", "#7B69F2", "#62E6C7", "#F5FFBE")),
        Item("desk-pets-blueberry-mochi-blob", "Blueberry Mochi Blob", "Desk Pets", "Common", 220, 160, ["round mochi body", "blueberry vinyl", "tiny feet", "star sticker"], prompt("Blueberry Mochi Blob", "Desk Pets", "a round mochi blob desk pet in blueberry vinyl with tiny feet, soft smile, and a small star sticker."), "blob", palette("#E8ECFF", "#CDD6FF", "#A7B8FF", "#FF8EBD", "#FFD66E")),
        Item("desk-pets-citrus-mochi-blob", "Citrus Mochi Blob", "Desk Pets", "Common", 210, 170, ["round mochi body", "citrus vinyl", "tiny feet", "heart sticker"], prompt("Citrus Mochi Blob", "Desk Pets", "a round mochi blob desk pet in citrus vinyl with tiny feet, soft smile, and a small heart sticker."), "blob", palette("#FFF5D7", "#FFE7A8", "#FFD36B", "#FF7CA8", "#79E4C7")),
        Item("desk-pets-mint-sleepy-star", "Mint Sleepy Star Charm", "Desk Pets", "Rare", 44, 420, ["sleepy star body", "mint vinyl", "dangling charm", "foil cheek"], prompt("Mint Sleepy Star Charm", "Desk Pets", "a sleepy star charm in mint vinyl with dangling ring, tiny closed eyes, foil cheek flecks, and pastel charm loop."), "star", palette("#E1FFF3", "#C7F7E3", "#8EEAC6", "#A876FF", "#FFE06B")),
        Item("desk-pets-coral-sleepy-star", "Coral Sleepy Star Charm", "Desk Pets", "Rare", 38, 460, ["sleepy star body", "coral vinyl", "dangling charm", "yellow accent"], prompt("Coral Sleepy Star Charm", "Desk Pets", "a sleepy star charm in coral vinyl with dangling ring, closed-eye face, yellow accent charm, and glossy highlights."), "star", palette("#FFE8E1", "#FFD3C9", "#FFA092", "#7BDACB", "#FFE16D")),
        Item("desk-pets-purple-button-eye-sprout", "Purple Button-Eye Sprout", "Desk Pets", "Uncommon", 82, 300, ["sprout body", "purple plush vinyl", "button eyes", "mint leaves"], prompt("Purple Button-Eye Sprout", "Desk Pets", "a sprout desk pet in purple plush vinyl with button eyes, mint leaves, blush cheeks, and dangling heart charm."), "sprout", palette("#F1E5FF", "#DDC8FF", "#BE94FF", "#FF8AAE", "#9EEFC3")),
        Item("desk-pets-sunrise-button-eye-sprout", "Sunrise Button-Eye Sprout", "Desk Pets", "Rare", 50, 440, ["sprout body", "sunrise body", "button eyes", "green leaves"], prompt("Sunrise Button-Eye Sprout", "Desk Pets", "a sunrise-color sprout desk pet with button eyes, soft green leaves, blush cheeks, and small charm."), "sprout", palette("#FFF0D8", "#FFD9B3", "#FFB16C", "#8B72F0", "#97E887")),
        Item("desk-pets-lilac-tiny-desk-dino", "Lilac Tiny Desk Dino", "Desk Pets", "Ultra Rare", 18, 880, ["tiny dino silhouette", "lilac body", "star back plates", "foil charm"], prompt("Lilac Tiny Desk Dino", "Desk Pets", "an Ultra Rare tiny desk dino in lilac vinyl with star-shaped back plates, tiny smile, and foil charm detail."), "dino", palette("#EEE4FF", "#D8C7FF", "#B899FF", "#67DCD2", "#FFE16D")),
        Item("desk-pets-melon-tiny-desk-dino", "Melon Tiny Desk Dino", "Desk Pets", "Rare", 36, 520, ["tiny dino silhouette", "melon body", "purple back plates", "heart sticker"], prompt("Melon Tiny Desk Dino", "Desk Pets", "a melon-colored tiny desk dino with purple back plates, small smile, heart sticker, and rounded vinyl body."), "dino", palette("#E8FFE6", "#CDF5CA", "#9EEA9C", "#A975FF", "#FF8EAE")),
        Item("desk-pets-cloud-pillow-pal", "Cloud Pillow Pal", "Desk Pets", "Uncommon", 90, 310, ["pillow body", "cloud corners", "sleepy face", "star sticker"], prompt("Cloud Pillow Pal", "Desk Pets", "a puffy cloud pillow desk pet with rounded plush corners, sleepy face, soft vinyl seams, and star sticker."), "pillow", palette("#EEF7FF", "#D6ECFF", "#B8DAFF", "#FF8DB6", "#FFD96B")),
        Item("desk-pets-pebble-button-charm", "Pebble Button Charm", "Desk Pets", "Uncommon", 88, 320, ["pebble body", "button shell", "tiny feet", "round badge"], prompt("Pebble Button Charm", "Desk Pets", "a pebble-shaped button charm desk pet with tiny feet, round badge cap, soft smile, and glossy vinyl finish."), "bug", palette("#F1EDE7", "#DED6CF", "#BFB5AA", "#7EDCD2", "#FFD26A")),
        Item("snack-relics-blue-rocket-prize", "Blue Rocket Prize", "Snack Relics", "Rare", 56, 430, ["cereal prize rocket", "blue body", "orange fins", "porthole face"], prompt("Blue Rocket Prize", "Snack Relics", "a cereal-prize rocket toy in blue vinyl with orange fins, porthole face, stickers, and soft launch puff."), "rocket", palette("#E2F5FF", "#C4E8FF", "#7EC9FF", "#FF7A4D", "#FFD35C", "#D8F8FF")),
        Item("snack-relics-lime-rocket-prize", "Lime Rocket Prize", "Snack Relics", "Rare", 52, 450, ["cereal prize rocket", "lime body", "pink fins", "star stickers"], prompt("Lime Rocket Prize", "Snack Relics", "a cereal-prize rocket toy in lime vinyl with pink fins, porthole face, star stickers, and soft launch puff."), "rocket", palette("#F0FFD8", "#DDF6A8", "#BDEB6C", "#FF78A8", "#FFD45D", "#E9FFD0")),
        Item("snack-relics-pink-capsule-ghost", "Pink Capsule Ghost Toy", "Snack Relics", "Uncommon", 118, 260, ["capsule dome", "pink base", "tiny ghost shape", "pastel beads"], prompt("Pink Capsule Ghost Toy", "Snack Relics", "a vending capsule toy with clear dome, pink base, tiny ghost-like mascot shape, pastel beads, and cute face."), "capsule", palette("#FFE7F2", "#FFD0E5", "#FF9ECB", "#7A6FF2", "#FFD66C")),
        Item("snack-relics-teal-capsule-ghost", "Teal Capsule Ghost Toy", "Snack Relics", "Rare", 64, 420, ["capsule dome", "teal base", "tiny ghost shape", "foil bead"], prompt("Teal Capsule Ghost Toy", "Snack Relics", "a vending capsule toy with clear dome, teal base, tiny ghost-like mascot shape, pastel beads, and a foil bead accent."), "capsule", palette("#DFFFFA", "#C0F5EA", "#6BDDD0", "#A979FF", "#FFD86E")),
        Item("snack-relics-grape-vending-ring", "Grape Vending Ring Relic", "Snack Relics", "Ultra Rare", 20, 820, ["chunky ring", "grape base", "aqua gem", "dangling charm"], prompt("Grape Vending Ring Relic", "Snack Relics", "an Ultra Rare vending-machine ring relic with grape base, chunky aqua gem, star flecks, and dangling charm."), "ring", palette("#EFE4FF", "#D9C8FF", "#A982FF", "#42D6D2", "#FFD25E", "#A6F8FF")),
        Item("snack-relics-sunset-vending-ring", "Sunset Vending Ring Relic", "Snack Relics", "Rare", 40, 560, ["chunky ring", "sunset base", "mint gem", "small charm"], prompt("Sunset Vending Ring Relic", "Snack Relics", "a vending-machine ring relic with sunset coral base, mint gem, star flecks, and tiny dangling charm."), "ring", palette("#FFE5D9", "#FFD0BA", "#FF9B72", "#65DCCB", "#FFE170", "#C9FFF4")),
        Item("snack-relics-mint-crinkle-pack", "Mint Crinkle Pack Mascot", "Snack Relics", "Rare", 46, 470, ["crinkle pack", "mint wrapper", "face badge", "foil corner"], prompt("Mint Crinkle Pack Mascot", "Snack Relics", "a fake prize crinkle pack mascot with mint wrapper, face badge, foil corner detail, and chunky crimped edges."), "pack", palette("#E1FFF4", "#BFF6E5", "#86EBCB", "#A574FF", "#FFD660")),
        Item("snack-relics-berry-crinkle-pack", "Berry Crinkle Pack Mascot", "Snack Relics", "Rare", 42, 490, ["crinkle pack", "berry wrapper", "face badge", "star sticker"], prompt("Berry Crinkle Pack Mascot", "Snack Relics", "a fake prize crinkle pack mascot with berry wrapper, face badge, star sticker, and chunky crimped edges."), "pack", palette("#FFE1F1", "#FFC5E2", "#F88ABD", "#7FE0D0", "#FFD760")),
        Item("snack-relics-soda-tab-prize", "Soda Tab Prize", "Snack Relics", "Common", 160, 190, ["rounded tab", "toy metal", "inner pull", "sticker star"], prompt("Soda Tab Prize", "Snack Relics", "a rounded soda-tab prize toy with toy-metal finish, inner pull shape, tiny face, sticker star, and soft highlights."), "tab", palette("#E6F5FF", "#CFEBFF", "#93D8FF", "#8070F2", "#FFD35F")),
        Item("snack-relics-bubble-gum-token", "Bubble Gum Token", "Snack Relics", "Uncommon", 100, 280, ["round token", "bubble gum colors", "face center", "edge dots"], prompt("Bubble Gum Token", "Snack Relics", "a round bubble-gum token collectible with raised center face, edge dots, pastel body, and sticker-like details."), "token", palette("#FFE7F2", "#FFD2E7", "#FF9DCA", "#7C6FF0", "#FFD65F")),
    ]
    return data


RENDERERS: dict[str, Callable[[Item], Image.Image]] = {
    "Pocket Tech": render_pocket_tech,
    "Desk Pets": render_desk_pet,
    "Snack Relics": render_snack_relic,
}


def write_prompts(items: list[Item]) -> None:
    PROMPTS.mkdir(exist_ok=True)
    for item in items:
        (PROMPTS / f"{item.id}.txt").write_text(item.prompt, encoding="utf-8")


def render_items(items: list[Item]) -> None:
    RENDERS.mkdir(exist_ok=True)
    for item in items:
        if item.family == "Holo Finds":
            expected = RENDERS / f"{item.id}.png"
            if not expected.exists():
                raise FileNotFoundError(f"Missing generated foil card render: {expected}")
            continue
        renderer = RENDERERS[item.family]
        renderer(item).save(RENDERS / f"{item.id}.png")


def update_catalog(items: list[Item]) -> None:
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    existing = {entry["id"]: entry for entry in catalog["items"]}
    for item in items:
        existing[item.id] = {
            "id": item.id,
            "name": item.name,
            "family": item.family,
            "rarity": item.rarity,
            "editionSize": item.edition_size,
            "dropRole": "expansion-2026-07-07",
            "price": item.price,
            "traits": item.traits,
            "renderFile": f"renders/{item.id}.png",
            "promptFile": f"prompts/{item.id}.txt",
        }
    original_order = [entry["id"] for entry in catalog["items"]]
    new_order = original_order + [item.id for item in items if item.id not in original_order]
    catalog["version"] = "0.2.0"
    catalog["items"] = [existing[item_id] for item_id in new_order]
    CATALOG.write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8")


def rarity_color(rarity: str) -> tuple[int, int, int]:
    return {
        "Common": (145, 142, 155),
        "Uncommon": (18, 147, 126),
        "Rare": (111, 88, 211),
        "Ultra Rare": (255, 135, 0),
        "One-Off": (255, 54, 145),
    }[rarity]


def contact_sheet(items: list[Item]) -> None:
    cols = 4
    card_w, card_h = 360, 470
    gap = 18
    margin = 28
    header = 105
    rows = math.ceil(len(items) / cols)
    width = margin * 2 + cols * card_w + (cols - 1) * gap
    height = header + margin + rows * card_h + (rows - 1) * gap
    sheet = Image.new("RGB", (width, height), (246, 242, 255))
    d = ImageDraw.Draw(sheet)
    d.text((margin, 24), "Yoink Drop Art Pack Expansion", fill=DARK, font=font(31, True))
    d.text((margin, 62), "34 new assets - 4 Ultra Rare foil cards, 10 Pocket Tech, 10 Desk Pets, 10 Snack Relics", fill=(126, 119, 144), font=font(15))
    title_font = font(20, True)
    meta_font = font(13)
    pill_font = font(12, True)

    for index, item in enumerate(items):
        row, col = divmod(index, cols)
        x = margin + col * (card_w + gap)
        y = header + row * (card_h + gap)
        d.rounded_rectangle((x, y, x + card_w, y + card_h), radius=15, fill=WHITE, outline=(222, 215, 242), width=2)
        img = Image.open(RENDERS / f"{item.id}.png").convert("RGB").resize((282, 282), Image.Resampling.LANCZOS)
        sheet.paste(img, (x + 39, y + 18))
        d.text((x + 20, y + 318), item.name, fill=DARK, font=title_font)
        d.text((x + 20, y + 348), f"{item.family} - {item.rarity} - {item.edition_size} made", fill=(126, 119, 144), font=meta_font)
        badge = rarity_color(item.rarity)
        badge_w = max(82, int(d.textlength(item.rarity, font=pill_font)) + 22)
        d.rounded_rectangle((x + 20, y + 382, x + 20 + badge_w, y + 407), radius=8, fill=badge)
        d.text((x + 31, y + 388), item.rarity, fill=WHITE, font=pill_font)
        d.text((x + 20, y + 425), f"Y {item.price}", fill=(111, 88, 211), font=font(17, True))

    sheet.save(CONTACT_SHEET)


def write_summary(items: list[Item]) -> None:
    by_family: dict[str, list[Item]] = {}
    for item in items:
        by_family.setdefault(item.family, []).append(item)
    lines = [
        "# Yoink Drop Art Pack Expansion - 2026-07-07",
        "",
        "This expansion adds 34 new collectible renders to the Yoink art pack.",
        "",
        "- 4 Ultra Rare Holo Finds foil cards",
        "- 10 Pocket Tech variants and new tech toys",
        "- 10 Desk Pets variants and new mascots",
        "- 10 Snack Relics variants and new prize toys",
        "",
        "All entries were added to `item-catalog.json`, with prompt files in `prompts/` and PNG renders in `renders/`.",
        "",
    ]
    for family, family_items in by_family.items():
        lines.append(f"## {family}")
        lines.append("")
        for item in family_items:
            lines.append(f"- {item.name} - {item.rarity}, edition {item.edition_size}, Y {item.price}")
        lines.append("")
    SUMMARY.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    items = make_items()
    write_prompts(items)
    render_items(items)
    update_catalog(items)
    contact_sheet(items)
    write_summary(items)
    print(f"Generated {len(items)} expansion assets")
    print(CONTACT_SHEET)


if __name__ == "__main__":
    main()
