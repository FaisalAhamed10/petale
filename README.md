# PÉTALE — Atelier Floral

Immersive luxury bouquet boutique (demo). React 18 + Vite + Tailwind, GSAP (ScrollTrigger, SplitText) + Lenis + Framer Motion, Three.js via React Three Fiber / Drei, Lucide icons.

```
npm install
npm run dev       # http://localhost:5173
npm run build     # dist/ (+ _headers with CSP / security headers)
npm run preview   # serves dist/ with the same headers
```

From the Portfolio folder the launch configs `petale` (dev) and `petale-prod` (preview of `dist/`) do the same.

## What's where

| Area | Files |
| --- | --- |
| 3D flowers (procedural, no GLB downloads) | `src/three/flowers.js` — rose (reflexed, notched petals), peony, tulip, lily, sunflower heads; serrated veined leaves and rose-leaf sprays; baby's-breath florets; pleated paper; satin ribbon + bow; canvas-drawn vein / paper textures; petal translucency shader |
| Bouquet composer | `src/three/Bouquet.jsx` — dome layout, spiral-tied stems, wind sway, scatter / petal-detach / wrap / ribbon states read from a ref every frame |
| Hero scroll story | `src/components/HeroStory.jsx` (DOM + ScrollTrigger) → `src/three/story.js` → `src/three/HeroScene.jsx` (camera keyframes) |
| Customiser | `src/components/Customizer.jsx` + lazy `src/three/CustomizerScene.jsx` (studio plinth with real shadows, orbit camera + view presets, 3D gift card); presets, per-variety stem counts and pricing in `src/data/catalog.js` |
| Garden walk | `src/components/Garden.jsx` + lazy `src/three/GardenScene.jsx` (instanced roses / leaves) |
| Cart, wishlist, checkout | `src/lib/store.jsx`, `src/components/Overlays.jsx` |
| Catalogue, occasions, reviews, sample contact | `src/data/catalog.js` |

## Notes

- **Demo only.** Checkout, contact form and newsletter never send anything; contact details and reviews are sample data and labelled as such.
- **Photography** is from Unsplash (free licence), self-hosted in `public/photos/` as WebP at 480 / 960 / 1440 px (`<id>-<width>.webp`) and served with `srcset`; crops are CSS `object-fit: cover`. To add a photo, put its three widths there and its Unsplash id in `IMG` in `src/data/catalog.js`. `Photo` in `src/components/ui.jsx` shows a placeholder while loading and retries on failure. For production, swap in the boutique's own photography.
- **Performance:** each canvas compiles during the loader / before it scrolls in, pauses when off-screen, and adapts its pixel ratio to the frame rate. Phones and low-memory devices get fewer flowers, fewer petals and no sheen. The customiser and garden scenes are code-split and mount only near the viewport.
- **Accessibility:** `prefers-reduced-motion` disables Lenis, character reveals, auto-rotation and drifting petals; without WebGL each 3D scene falls back to photography.
- Cart and wishlist persist in `localStorage`, re-validated against the catalogue on load (prices are always recomputed, never trusted from storage).

## Deploy

Live at https://petale-atelier.netlify.app (Netlify site `petale-atelier`, id `46389aea-7575-4152-b1c1-c54a8fd2dfea`; `.netlify/state.json` links it). Source: https://github.com/FaisalAhamed10/petale.

```
npm run build
npx netlify-cli@17.38.1 deploy --prod --dir dist
```

The two console errors on the live site come from Netlify's injected free-plan badge script, which the CSP blocks on purpose; the site itself logs none.
