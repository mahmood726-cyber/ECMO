# E156-PROTOCOL — MCS-Logic (Mechanical Circulatory Support Synthesis)

- **Project:** ECMO (GitHub repo `ECMO`, user `mahmood726-cyber`)
- **Revived:** 2026-06-05 (from a single-file `ECMO.html` dump)
- **Type:** single-file offline browser tool + Node-testable engine
- **Dashboard:** GitHub Pages (`index.html`)

## What changed in the revival

- Made **fully offline**: removed the Google Fonts CDN `<link>`; the app now
  loads no external resource (system fonts fall back).
- Extracted the statistical core into a pure `engine.js` (single source of
  truth; the inline duplicates were removed and the page now loads `engine.js`).
- Added `tests.js` (21 assertions, all passing).
- **Fixed a correctness bug** in `normCDF` (was returning 0 at x=0 and ~0.95 at
  x=1.96, corrupting all p-values) — now a correct `Φ(x)=½(1+erf(x/√2))`.
- Added Pages scaffold (`.nojekyll`, README, `.gitignore`); renamed
  `ECMO.html` → `index.html`.

## Body (E156 draft — CURRENT BODY)

Does the choice of mechanical circulatory support device change survival in
cardiogenic shock, and how certain is that pooled signal? This dashboard
collates randomised and matched-cohort hazard ratios for VA-ECMO, Impella,
TandemHeart and IABP against medical or comparator support. It pools logHR with
a DerSimonian–Laird random-effects model, reporting τ², I², a 95% confidence
interval and a `t_{k−2}` prediction interval, with a Monte-Carlo panel for
sensitivity. Across the bundled trial set the pooled estimates remain wide and
heterogeneity-dominated, so no device shows a robust mortality advantage and the
prediction intervals routinely cross unity. A revival audit found and fixed a
normal-CDF bug that had corrupted every displayed p-value, and locked the
statistical core behind a 21-assertion test suite verified against hand
computation. The result is that current device evidence in shock is too sparse
and heterogeneous to rank devices on survival, and the honest read is
equipoise rather than superiority. The tool is a transparent synthesis aid for
exploring that uncertainty, not a clinical decision rule.

SUBMITTED: [ ]
