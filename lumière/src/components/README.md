# Components

Components are grouped by where they are used:

- `layout/` contains app-wide page structure such as navigation, footer, and the root layout.
- `home/` contains sections that make up the homepage.
- `shop/` contains product listing, filtering, sorting, and shop card UI.
- `favorites/` contains the favorites drawer UI.
- `common/` contains reusable route/UI helpers that are not tied to a single page.

Page-level route components live in `src/pages`, shared state lives in `src/stores` and `src/context`, and API/data helpers live in `src/lib` or `src/utils`.
