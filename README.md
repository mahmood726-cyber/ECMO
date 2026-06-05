# MCS-Logic — Mechanical Circulatory Support Evidence Synthesis

A single-file, **fully offline** dashboard that pools hazard ratios for
mechanical circulatory support devices (VA-ECMO, Impella, TandemHeart, IABP) in
cardiogenic shock, with a DerSimonian–Laird random-effects model, forest plot,
GRADE summary, waffle visualisation, and a Monte-Carlo sensitivity panel.

**Live app:** open `index.html` (or the GitHub Pages link). No build step, no
network, no external CDN.

## Layout

```
index.html   single-file UI (loads engine.js)
engine.js    pure statistical core — runs in Node and the browser
tests.js     Node test harness, 21 assertions
LICENSE      MIT
```

## Statistical core (`engine.js`)

| Function | What it does |
|---|---|
| `calculatePooled(trials)` | DerSimonian–Laird random-effects pooling of logHR: τ² via the method-of-moments `(Q−(k−1))/C`, I², 95% CI, and a `t_{k−2}` prediction interval |
| `normCDF(x)` | standard normal CDF (for two-sided p-values) |
| `tQuantile(p, df)` | tabulated two-sided 0.975 t critical values |

## Bug fixed during revival (2026-06-05)

The originally-shipped `normCDF` mixed the Abramowitz–Stegun **erf** coefficients
with a normal-CDF structure and returned **0 at x=0** and **~0.95 at x=1.96**
(both wrong), which corrupted every displayed p-value (e.g. a z of 1.96 gave
p≈0.10 instead of 0.05). It is now a correct `Φ(x)=½(1+erf(x/√2))` with
|error| < 1.5e-7, locked in by tests. The pooling math (τ², I², weights) was
verified correct and left unchanged.

## Tests

```
node tests.js
# 21 passed, 0 failed
```

Checks include normal-CDF reference points (Φ(0)=0.5, Φ(1.96)=0.975), a
single-trial passthrough, a two-identical-trial case (τ²=0, I²=0,
seRE=√(1/200)), and a hand-computed heterogeneous case
(τ²≈0.00658, pooled HR≈0.748, I²≈20.8%).

## Caveats

DerSimonian–Laird is known to under-estimate τ² for small *k* (REML/Paule–Mandel
are preferred for k<10); this dashboard preserves the original method for
continuity and reports τ² and I² alongside every estimate. Device evidence in
cardiogenic shock is sparse and heterogeneous — treat pooled HRs as
hypothesis-generating. MIT licensed.
