# Groovaly Module Setup Builder Prototype

A Vite + React + TypeScript prototype for configuring modular furniture blocks in a 4x3 grid with structural support constraints.

## What it includes

- Drag modules from palette into a 4x3 grid
- Drag placed modules to reposition
- Snap-to-cell placement
- Constraint enforcement:
  - Bounds check
  - Overlap check
  - Support check (every occupied cell above row 0 must have support directly below)
- Live placement preview (green valid / red invalid)
- Delete button (`x`) on placed modules
- Reset button
- RoughJS sketch-style rendering for grid and module cards
- Touch + mouse drag support via dnd-kit sensors
- Groovaly token extraction script with fallback tokens

## Tech

- React 18 + TypeScript + Vite
- `@dnd-kit/core`
- `roughjs`
- Playwright (`@playwright/test`) for token extraction script
- Vitest for grid logic tests

## Run locally

```bash
npm install
npm run dev
```

Build + preview:

```bash
npm run build
npm run preview
```

Run tests:

```bash
npm run test
```

## Extract Groovaly design tokens

```bash
npm run tokens
```

This runs `scripts/extract-groovaly-tokens.ts`, which:

1. Opens `https://www.groovaly.com/` with Playwright
2. Captures computed styles for `body`, heading (`h1/h2`), and a likely CTA button
3. Captures relevant CSS custom properties from `:root`
4. Writes `src/design-tokens.json`

If extraction fails, fallback values are written to `src/design-tokens.json`.

## Embedding `ModuleBuilder` later

The core builder is exported as:

- `src/components/ModuleBuilder.tsx`

To embed in an existing site:

1. Build static assets:

```bash
npm run build
```

2. Mount from your host app into a target element:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ModuleBuilder } from './components/ModuleBuilder';
import './styles.css';

ReactDOM.createRoot(document.getElementById('module-builder-root')!).render(
  <React.StrictMode>
    <ModuleBuilder />
  </React.StrictMode>,
);
```

3. Keep styles scoped via the `gb-` prefixed classes and CSS variables.

## File map

- `scripts/extract-groovaly-tokens.ts`
- `src/main.tsx`
- `src/App.tsx`
- `src/components/ModuleBuilder.tsx`
- `src/components/SketchGrid.tsx`
- `src/components/ModulePalette.tsx`
- `src/logic/grid.ts`
- `src/logic/grid.test.ts`
- `src/styles.css`
- `src/design-tokens.json`
