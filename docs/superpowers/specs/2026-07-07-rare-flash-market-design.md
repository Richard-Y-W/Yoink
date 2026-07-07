# Rare Flash Market Design

## Goal

Rare items should feel like surprising marketplace listings, not blind paid pulls. Rare items appear directly in the feed with a cartoon "Rare Flash" treatment. Ultra Rare and One-Off items trigger a bigger "Ultra Rare Drop" burst before the user chooses whether to view or skip the listing.

## Rules

- Common and Uncommon items fill the normal feed.
- Rare items appear once in a while as normal purchasable listings with a highlighted in-feed card, a small `! RARE FLASH` badge, and a haptic event.
- Ultra Rare and One-Off items appear later in the scroll and trigger a full-screen cartoon burst with `View listing` and `Keep scrolling` actions.
- All rare/ultra items remain direct marketplace purchases. No bids, paid random pulls, fake scarcity, or hidden odds.
- The current Yoink cartoon style stays: thick borders, purple accents, pink/yellow highlights, rounded toy shapes, and Material icon punctuation.

## Bugfixes Bundled With This Slice

- Add a subtract button in checkout cart rows.
- Guard checkout/order placement so spam taps cannot place duplicate orders or drain the wallet.
- Keep toast messages inside the phone viewport by wrapping text instead of forcing one long line.
- Remove small image-caption labels like `button-eye sprout` from market cards, watching cards, and product detail hero art.
- Remove bidding UI for now, including auction mode, bid badges, and bid sorting.

## Interaction

When a Rare item first enters the loaded feed, the app fires `rare-flash` haptics and the card animates in with a highlighted border. When an Ultra Rare or One-Off item first enters the loaded feed, the app fires `ultra-drop` haptics and opens the burst overlay. The user can tap `View listing` to inspect/buy the item or `Keep scrolling` to dismiss it.
