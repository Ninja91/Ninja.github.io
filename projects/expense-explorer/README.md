# Expense Explorer

Expense Explorer is a Vite + React app embedded inside the portfolio site at `projects/expense-explorer/`.

## Development

- `npm run dev` starts the local Vite dev server.
- `npm run build` performs a clean production build using `index.html.source` as the source template and restores the checked-in deploy entrypoint afterward.
- `npm run build:check` runs the raw Vite pipeline directly and is mainly useful when validating the generated `index.html`.
- `npm run preview` serves the generated `dist/` output locally.

## Deployment note

This repo keeps a checked-in `index.html` and hashed assets under `assets/` for static hosting. The source template for local builds lives in `index.html.source`, which avoids mixing the deploy artifact with the Vite source entry during development.
