// Yoink Drop Art Pack catalog — the canonical collectible list.
// Style guide: docs/yoink-drop-art-style-guide.md. Item art is an AI-generated
// chibi 3D render per item (see artPromptFor); renders land in
// src/assets/drops/<id>.png. The 16 `hero` items are the original art pack.

export const FAMILIES = ['Pocket Tech', 'Holo Finds', 'Desk Pets', 'Snack Relics'];

export const RARITY_META = {
  'Common':     { color: '#8C8A99', made: [150, 220], price: [80, 320] },
  'Uncommon':   { color: '#10B5A0', made: [80, 120],  price: [340, 780] },
  'Rare':       { color: '#6A5ACD', made: [40, 60],   price: [800, 2400] },
  'Ultra Rare': { color: '#E89B2E', made: [14, 24],   price: [2600, 7500] },
  'One-Off':    { color: '#FF3D9A', made: [1, 1],     price: [15000, 26000] },
};

export const RARITIES = Object.keys(RARITY_META);

// Pastel seamless studio backdrops from the art pack.
export const DROP_BGS = {
  lavender: '#E9DEFF',
  pink:     '#FFD6EA',
  mint:     '#D7F3E3',
  butter:   '#FFF1B8',
  peach:    '#FFE4CE',
  sky:      '#D6EBFF',
};

const item = (id, name, family, rarity, made, price, bg, emoji, motif, hero = false) =>
  ({ id, name, family, rarity, made, price, bg, emoji, motif, hero });

export const dropCatalog = [
  // ── The original 16 hero collectibles (art shipped in the Drop Art Pack) ──
  item('bubble-crt',            'Bubble CRT',            'Pocket Tech',  'Rare',       40,  1850,  'lavender', '📺', 'a puffy lavender retro CRT television with a smiling purple screen, chrome dials and stubby feet', true),
  item('jelly-flip-phone',      'Jelly Flip Phone',      'Pocket Tech',  'Uncommon',   90,  520,   'mint',     '📱', 'a translucent teal jelly flip phone standing open, pink jelly keypad, happy pixel screen and a star charm', true),
  item('pocket-pixel-mp3',      'Pocket Pixel MP3',      'Pocket Tech',  'Common',     168, 240,   'butter',   '🎵', 'a butter-yellow pocket MP3 player with a smiling pixel screen and candy-button control ring', true),
  item('flashpop-toy-camera',   'Flashpop Toy Camera',   'Pocket Tech',  'Ultra Rare', 18,  4800,  'pink',     '📷', 'a pink toy camera with a big teal glass lens, gold star flash and a film-roll charm', true),
  item('frog-foil-card',        'Frog Foil Card',        'Holo Finds',   'Rare',       55,  1250,  'pink',     '🐸', 'a holographic foil trading card of a chibi frog on a lily pad, sealed in a clear collector frame', true),
  item('cosmic-sticker-slab',   'Cosmic Sticker Slab',   'Holo Finds',   'Ultra Rare', 22,  5400,  'lavender', '⭐', 'a graded collector slab holding a smiling galaxy star sticker over a sparkling cosmic purple field', true),
  item('lucky-pog-stack',       'Lucky Pog Stack',       'Holo Finds',   'Uncommon',   100, 460,   'peach',    '🍀', 'a leaning stack of pastel pogs topped with a clover-emblem gold slammer', true),
  item('glimmer-ticket-relic',  'Glimmer Ticket Relic',  'Holo Finds',   'One-Off',    1,   22000, 'butter',   '🎫', 'an iridescent golden arcade ticket embossed with a star, mounted like a museum relic', true),
  item('mochi-blob',            'Mochi Blob',            'Desk Pets',    'Common',     200, 180,   'pink',     '🍡', 'a round pink mochi blob with a serene face, blush cheeks and a tiny star sticker', true),
  item('sleepy-star-charm',     'Sleepy Star Charm',     'Desk Pets',    'Rare',       44,  1400,  'butter',   '💤', 'a sleepy lilac puffy star keychain charm with closed eyes and a gold clasp', true),
  item('button-eye-sprout',     'Button-Eye Sprout',     'Desk Pets',    'Uncommon',   88,  560,   'mint',     '🌱', 'a green sprout desk pet with pink button eyes, a leaf on its head and a tiny tag charm', true),
  item('tiny-desk-dino',        'Tiny Desk Dino',        'Desk Pets',    'Ultra Rare', 16,  6200,  'sky',      '🦕', 'a teal chibi dinosaur desk pet wearing a tiny lilac backpack', true),
  item('cereal-prize-rocket',   'Cereal Prize Rocket',   'Snack Relics', 'Rare',       50,  1100,  'sky',      '🚀', 'a retro cereal-box prize rocket in orange and cream with a porthole window and star decals', true),
  item('capsule-ghost-toy',     'Capsule Ghost Toy',     'Snack Relics', 'Uncommon',   110, 420,   'peach',    '👻', 'a gacha capsule with a smiling ghost toy floating inside among pastel orbs', true),
  item('vending-ring-pop',      'Vending Ring Pop Relic','Snack Relics', 'Ultra Rare', 20,  5000,  'mint',     '💍', 'an oversized candy ring with a sparkling faceted teal gem on a chunky purple band', true),
  item('crinkle-pack-mascot',   'Crinkle Pack Mascot',   'Snack Relics', 'One-Off',    1,   18500, 'butter',   '🍬', 'a crinkly purple snack pouch with a mascot face and mystery-star print, standing upright', true),

  // ── Batch 2: Pocket Tech ──
  item('gummy-game-brick',      'Gummy Game Brick',      'Pocket Tech',  'Common',     180, 220,   'pink',     '🎮', 'a translucent strawberry-gummy handheld game brick with a smiling green screen and jelly d-pad'),
  item('pixel-pet-cam',         'Pixel Pet Cam',         'Pocket Tech',  'Common',     190, 150,   'sky',      '📸', 'a chunky mint toy digicam with a pixel puppy on its screen and a wrist strap charm'),
  item('minty-mini-console',    'Minty Mini Console',    'Pocket Tech',  'Common',     160, 290,   'mint',     '🕹️', 'a mint-green mini game console with two candy buttons and a happy boot screen'),
  item('milky-mouse-ball',      'Milky Mouse Ball',      'Pocket Tech',  'Common',     172, 130,   'lavender', '🖱️', 'a milky-white retro computer mouse with a pearl trackball belly and a curly tail cable'),
  item('taffy-tape-deck',       'Taffy Tape Deck',       'Pocket Tech',  'Uncommon',   96,  480,   'peach',    '📼', 'a peach taffy cassette player with pastel reels for eyes and squishy rubber buttons'),
  item('puffy-pager-pal',       'Puffy Pager Pal',       'Pocket Tech',  'Uncommon',   92,  540,   'butter',   '📟', 'a puffy sky-blue pager with a winking LCD face and a jelly belt clip'),
  item('chrome-robo-walkie',    'Chrome Robo Walkie',    'Pocket Tech',  'Uncommon',   104, 420,   'sky',      '📡', 'a chrome-and-coral toy walkie talkie with an antenna topped by a tiny star'),
  item('jelly-joystick',        'Jelly Joystick',        'Pocket Tech',  'Uncommon',   86,  620,   'lavender', '🕹️', 'a grape-jelly arcade joystick on a cream base with one big glossy red button'),
  item('sherbet-boombox',       'Sherbet Boombox',       'Pocket Tech',  'Rare',       48,  1600,  'pink',     '📻', 'a sherbet-orange boombox with speaker-cone eyes and a rainbow equalizer smile'),
  item('marshmallow-keyboard',  'Marshmallow Keyboard',  'Pocket Tech',  'Rare',       52,  1150,  'mint',     '⌨️', 'a squishy white marshmallow keyboard with pastel keycaps and one heart-shaped enter key'),
  item('glow-dial-rotary',      'Glow Dial Rotary',      'Pocket Tech',  'Rare',       42,  2050,  'butter',   '☎️', 'a glow-in-the-dark lilac rotary phone whose dial holes are tiny moons and stars'),
  item('dreamy-disc-player',    'Dreamy Disc Player',    'Pocket Tech',  'Rare',       56,  950,   'sky',      '💿', 'a dreamy clamshell disc player, lid open to show a rainbow-sheen disc with a smiley hub'),
  item('opal-antenna-tv',       'Opal Antenna TV',       'Pocket Tech',  'Ultra Rare', 20,  4400,  'lavender', '📺', 'an opalescent mini television with rabbit-ear antennae ending in pearl beads, aurora sheen shell'),
  item('starlit-synth-keys',    'Starlit Synth Keys',    'Pocket Tech',  'Ultra Rare', 16,  6600,  'pink',     '🎹', 'a midnight-blue toy synthesizer with glittering star keys and a crescent-moon pitch wheel'),
  item('prism-projector-pod',   'Prism Projector Pod',   'Pocket Tech',  'One-Off',    1,   24000, 'sky',      '📽️', 'a crystal prism film projector pod casting a tiny rainbow beam, iridescent shell and pearl reels'),

  // ── Batch 2: Holo Finds ──
  item('doodle-sticker-sheet',  'Doodle Sticker Sheet',  'Holo Finds',   'Common',     200, 95,    'mint',     '🎨', 'a glossy sticker sheet of smiling pastel doodles, one corner peeling up'),
  item('bubble-badge-button',   'Bubble Badge Button',   'Holo Finds',   'Common',     168, 140,   'pink',     '🔘', 'a puffy pin-back badge with a smiling bubble face and a soft plastic dome'),
  item('glitter-gum-wrapper',   'Glitter Gum Wrapper',   'Holo Finds',   'Common',     184, 110,   'lavender', '✨', 'a neatly folded glitter-foil gum wrapper that shines like treasure, tiny face on the crest'),
  item('smiley-sun-decal',      'Smiley Sun Decal',      'Holo Finds',   'Common',     190, 120,   'butter',   '🌞', 'a vintage smiley sun window decal with soft rays and rosy cheeks'),
  item('lucky-cat-foil-card',   'Lucky Cat Foil Card',   'Holo Finds',   'Uncommon',   98,  620,   'peach',    '🐱', 'a holographic foil trading card of a chibi lucky cat waving, in a clear collector frame'),
  item('prism-pin-relic',       'Prism Pin Relic',       'Holo Finds',   'Uncommon',   90,  560,   'sky',      '📌', 'a faceted prism enamel pin shaped like a gem heart, mounted on a tiny relic card'),
  item('moonbeam-marble-slab',  'Moonbeam Marble Slab',  'Holo Finds',   'Uncommon',   108, 480,   'lavender', '🔮', 'a collector slab holding a swirling moonbeam marble with a galaxy inside'),
  item('twinkle-ticket-strip',  'Twinkle Ticket Strip',  'Holo Finds',   'Uncommon',   112, 400,   'pink',     '🎟️', 'a strip of three twinkling raffle tickets, each printed with a tiny winking star'),
  item('aurora-postage-relic',  'Aurora Postage Relic',  'Holo Finds',   'Rare',       46,  1700,  'mint',     '📮', 'an aurora-foil postage stamp with scalloped edges and a sleepy cloud portrait, framed as a relic'),
  item('duckie-foil-card',      'Duckie Foil Card',      'Holo Finds',   'Rare',       58,  1050,  'butter',   '🦆', 'a holographic foil trading card of a chibi rubber duck admiral, sealed in a collector frame'),
  item('stardust-slammer',      'Stardust Slammer',      'Holo Finds',   'Rare',       44,  1900,  'lavender', '💫', 'a heavy stardust pog slammer with an embossed comet and glitter-suspended resin'),
  item('nebula-trading-slab',   'Nebula Trading Slab',   'Holo Finds',   'Ultra Rare', 18,  5800,  'pink',     '🌌', 'a graded slab holding a nebula card whose surface swirls like living galaxy foil'),
  item('opal-arcade-token',     'Opal Arcade Token',     'Holo Finds',   'Ultra Rare', 22,  3900,  'peach',    '🪙', 'an opal arcade token with a star punched through the middle and rainbow milk sheen'),
  item('rainbow-receipt-relic', 'Rainbow Receipt Relic', 'Holo Finds',   'Ultra Rare', 14,  7200,  'sky',      '🧾', 'an impossibly long holographic receipt curling like a ribbon, every line a tiny rainbow'),

  // ── Batch 2: Desk Pets ──
  item('pudding-cat-blob',      'Pudding Cat Blob',      'Desk Pets',    'Common',     210, 160,   'butter',   '🐱', 'a caramel pudding blob shaped like a loafing cat with a wobbly top'),
  item('boba-buddy',            'Boba Buddy',            'Desk Pets',    'Common',     176, 210,   'peach',    '🧋', 'a milk-tea cup pet with pearl freckles, a striped straw and stubby arms'),
  item('moss-ball-pal',         'Moss Ball Pal',         'Desk Pets',    'Common',     188, 120,   'mint',     '🟢', 'a fuzzy round moss ball pet with two sleepy eyes, sitting in a tiny glass dish'),
  item('pebble-penguin',        'Pebble Penguin',        'Desk Pets',    'Common',     164, 260,   'sky',      '🐧', 'a smooth pebble-shaped penguin with a knitted bobble hat'),
  item('pea-pod-twins',         'Pea Pod Twins',         'Desk Pets',    'Uncommon',   96,  520,   'mint',     '🫛', 'an open velvet pea pod with two smiling pea twins tucked inside'),
  item('wobble-whale-charm',    'Wobble Whale Charm',    'Desk Pets',    'Uncommon',   100, 470,   'sky',      '🐋', 'a round lilac whale charm that wobbles on its belly, water spout shaped like a heart'),
  item('toast-ghost',           'Toast Ghost',           'Desk Pets',    'Uncommon',   84,  680,   'butter',   '🍞', 'a ghost rising out of a toaster slot, shaped like a slice of toast with a shy smile'),
  item('mushroom-snoozer',      'Mushroom Snoozer',      'Desk Pets',    'Uncommon',   102, 440,   'pink',     '🍄', 'a dozing mushroom pet with a polka-dot cap pulled down like a nightcap'),
  item('yawning-moon-charm',    'Yawning Moon Charm',    'Desk Pets',    'Rare',       48,  1500,  'lavender', '🌙', 'a mid-yawn crescent moon charm with a night-cap tassel and one tiny orbiting star'),
  item('cloud-pup-squish',      'Cloud Pup Squish',      'Desk Pets',    'Rare',       54,  1200,  'sky',      '☁️', 'a squishy cloud puppy with rainbow-tipped ears, mid-boop expression'),
  item('bashful-axolotl',       'Bashful Axolotl',       'Desk Pets',    'Rare',       40,  2300,  'pink',     '🦎', 'a bashful pink axolotl covering its cheeks with tiny hands, frilly gills like petals'),
  item('disco-snail-shell',     'Disco Snail Shell',     'Desk Pets',    'Ultra Rare', 24,  2900,  'lavender', '🐌', 'a snail pet whose shell is a tiny mirrored disco ball, leaving a glitter trail'),
  item('crystal-bunny-charm',   'Crystal Bunny Charm',   'Desk Pets',    'Ultra Rare', 15,  6900,  'mint',     '🐰', 'a translucent rose-crystal bunny charm with light caught in its long ears'),
  item('golden-koi-desk-pond',  'Golden Koi Desk Pond',  'Desk Pets',    'One-Off',    1,   26000, 'sky',      '🎏', 'a palm-sized desk pond with one golden koi circling, water rendered like resin glass'),

  // ── Batch 2: Snack Relics ──
  item('sprinkle-toaster-tart', 'Sprinkle Toaster Tart', 'Snack Relics', 'Common',     192, 170,   'pink',     '🥧', 'a frosted toaster tart with rainbow sprinkles and one bite-shaped smile'),
  item('soda-cap-stack',        'Soda Cap Stack',        'Snack Relics', 'Common',     170, 230,   'sky',      '🥤', 'a wobbly stack of pastel soda bottle caps, the top one winking'),
  item('candy-dot-strip',       'Candy Dot Strip',       'Snack Relics', 'Common',     205, 90,    'butter',   '🍬', 'a paper strip of candy dots in sunset colors, gently curling'),
  item('gumball-globe',         'Gumball Globe',         'Snack Relics', 'Uncommon',   95,  580,   'peach',    '🍭', 'a mini gumball machine with a glass globe of pastel gumballs and a coin slot smile'),
  item('jelly-bean-pod',        'Jelly Bean Pod',        'Snack Relics', 'Uncommon',   88,  640,   'mint',     '🫘', 'a clear capsule pod filled with glossy jelly beans, one pressed against the glass'),
  item('choco-coin-purse',      'Choco Coin Purse',      'Snack Relics', 'Uncommon',   106, 460,   'butter',   '🪙', 'a velvet pouch spilling gold-foil chocolate coins, the top coin embossed with a smiley'),
  item('popsicle-twin-relic',   'Popsicle Twin Relic',   'Snack Relics', 'Uncommon',   114, 380,   'pink',     '🍦', 'a twin popsicle in strawberry-and-soda flavors, still joined, two faces sharing one smile'),
  item('swirl-lolly-relic',     'Swirl Lolly Relic',     'Snack Relics', 'Rare',       52,  1300,  'lavender', '🍥', 'a giant swirl lollipop in lavender and cream, wrapped in crinkly cellophane with a bow'),
  item('fortune-cookie-charm',  'Fortune Cookie Charm',  'Snack Relics', 'Rare',       46,  1750,  'peach',    '🥠', 'a glossy fortune cookie charm cracked open, a tiny golden fortune ribbon peeking out'),
  item('milk-carton-mascot',    'Milk Carton Mascot',    'Snack Relics', 'Rare',       58,  1000,  'sky',      '🥛', 'a retro school milk carton with a mascot face and a bendy straw antenna'),
  item('cotton-candy-comet',    'Cotton Candy Comet',    'Snack Relics', 'Rare',       42,  2200,  'lavender', '☄️', 'a comet made of pink-and-blue cotton candy with a sugar-glitter tail'),
  item('sundae-cloud-cup',      'Sundae Cloud Cup',      'Snack Relics', 'Rare',       49,  1450,  'mint',     '🍨', 'a paper sundae cup where the ice cream is a sleeping cloud, cherry balanced on top'),
  item('prize-egg-surprise',    'Prize Egg Surprise',    'Snack Relics', 'Ultra Rare', 21,  4200,  'butter',   '🥚', 'a half-open golden prize egg with confetti and a mystery sparkle glowing inside'),
  item('diamond-donut-relic',   'Diamond Donut Relic',   'Snack Relics', 'Ultra Rare', 16,  6400,  'pink',     '🍩', 'a crystalline donut with faceted diamond glaze and gemstone sprinkles, museum-lit'),
];

// House-style render prompt for one item; keep ALL style language here so the
// whole catalog stays one artist.
export function artPromptFor(it) {
  const holo = it.family === 'Holo Finds' || it.rarity === 'Ultra Rare' || it.rarity === 'One-Off'
    ? ', iridescent holographic foil accents'
    : '';
  return `Cute chibi 3D collectible toy render of ${it.motif}, soft rounded vinyl-clay material, `
    + `glossy speculars, tiny kawaii face, subtle sparkle details${holo}, centered on a seamless `
    + `pastel ${it.bg} studio backdrop with a soft contact shadow, single soft key light, `
    + `square crop, no text, no watermark.`;
}

export const dropHeroes = dropCatalog.filter((it) => it.hero);
export const dropBatch2 = dropCatalog.filter((it) => !it.hero);
