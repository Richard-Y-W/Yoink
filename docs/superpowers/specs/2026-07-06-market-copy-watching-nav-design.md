# Market Copy Watching And Nav Design

## Goal

Make the Market Copy bottom navigation feel clearly selected after a tap, and make hearted market listings appear in the Watching tab.

## Behavior

- Bottom nav keeps four tabs: Home, Search, Watching, Account.
- The active tab uses a strong purple cartoon treatment, not just purple text: a rounded purple pill/blob behind the icon, filled icon styling, purple label, and a small pop/scale visual.
- Hearting a listing in the market saves that actual listing to shared app state.
- Unhearting the same listing removes it from shared app state.
- Watching renders the saved listings instead of a placeholder when any exist.
- Watched listings can be opened into product detail and removed from Watching.
- Saved listings persist in `localStorage` so refresh does not clear hearts.

## Architecture

Create a focused watched-listing helper for toggling, restoring, and serializing watched listings. `App.jsx` owns the watched items and passes state/actions into `MonoMarket` and `Watching`. `MonoMarket` becomes controlled for watched status instead of owning hidden local saved state.

The old stashed saved-board code is used only as visual inspiration. Market Copy stores real market listings, not a separate saved catalog.

## Testing

- Unit-test watched-listing helper behavior.
- Static-test that `App.jsx` wires watched state into `MonoMarket` and `Watching`.
- Static-test that `MonoMarket` accepts controlled watched props.
- Static-test that `Watching` renders saved cards and empty state.
- Static-test that `YoinkNav` has a stronger active tab treatment.
