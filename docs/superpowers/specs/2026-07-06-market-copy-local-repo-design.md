# Market Copy Local Repo Design

## Goal

Create a separate local-only repo for a Yoink Market Copy while leaving the current `/Users/byungkim/yoink` checkout as the Exchange Copy. The Market Copy should remove the Exchange/Bell trading surface from the user-facing app and use a simpler four-tab bottom navigation:

- Home
- Search
- Watching
- Account

No large center sell, Bell, or Exchange button should appear in the Market Copy.

## Repository Shape

The current repo stays in place as the Exchange Copy. A new repo will be created at:

`/Users/byungkim/yoink-market-copy`

The new repo starts from the current pulled Yoink source so the market, product detail, cart, checkout, styles, and backend basics remain available. It will be initialized as its own local git repository without a GitHub remote.

## App Navigation

Market Copy will replace the existing tab model with four tabs:

- `home`: current market browsing experience.
- `search`: search-first market browsing. For this first pass, it can reuse the market screen with the same feed/filtering system rather than introducing a separate search engine.
- `watching`: a simple saved/watching surface. If no full watching model exists in the current source, this can start as a lightweight screen shell.
- `account`: a simple account surface backed by existing wallet/order state where practical.

The Exchange Copy's center Bell button and Exchange route are not part of Market Copy navigation.

## Exchange Removal Scope

The Market Copy should remove user-facing Exchange entry points:

- No bottom-nav center Bell/Exchange button.
- No home header Bell chip.
- No route that opens the Exchange screen from normal app navigation.
- No Exchange screen import in the Market Copy app shell.

Backend exchange files can remain in the repo for now if removing them would create unnecessary risk. The first pass is a user-facing Market Copy, not a backend purge.

## Preserved Behavior

Market Copy should keep:

- Market feed browsing.
- Product detail.
- Cart state.
- Checkout/order placement.
- Orders data where needed for account or post-checkout flow.
- Existing styling language and phone-frame presentation.

Checkout completion can still send the user to an order/account-adjacent surface if that is the smallest coherent flow.

## Testing

Use test-first changes for the app behavior:

- Update or add app-flow tests proving the tab set is `home`, `search`, `watching`, `account`.
- Prove Exchange is not a tab and normal navigation does not open it.
- Add/update a nav structure test proving the bottom nav exposes the four Market Copy labels and does not expose the center Bell/Exchange button.
- Run the focused app-flow/nav tests, then the full direct test-file command.
- Run `npm run build`.

## Localhost

After implementation, start the Market Copy dev server from `/Users/byungkim/yoink-market-copy/yoink`. Use the first available Vite port, expected to be `http://127.0.0.1:5173/` if free.
