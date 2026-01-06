# chart-annotator

A small React + Vite app for charting time series data, adding notes, and exporting the chart as PNG/PDF.

## Local dev

```bash
npm install
npm run dev
```

## Export

Use the **Export PNG** / **Export PDF** buttons above the chart.

## GitHub Pages

This repo includes a GitHub Actions workflow at `.github/workflows/pages.yml` that builds and deploys the Vite `dist/` folder to GitHub Pages on every push to `main`.

**Important:** In GitHub: **Settings → Pages → Source → GitHub Actions**.

The site will be served from:

```text
https://davesuzuki-hiya.github.io/chart-annotator/
```
