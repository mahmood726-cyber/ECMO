/*
 * MCS-Logic engine — pure meta-analysis core for the ECMO / Mechanical
 * Circulatory Support evidence-synthesis dashboard.
 *
 * Extracted verbatim from the dashboard's inline script so the statistical
 * core is a single source of truth, importable under Node for testing.
 * Browser: functions are globals (plain declarations). Node: module.exports.
 *
 * Method: DerSimonian-Laird random-effects on logHR. Prediction interval uses
 * a t_{k-2} critical value (the app's convention). Faithful to the shipped app
 * — no methodology changes.
 */

function calculatePooled(trials) {
    if (trials.length === 0) return null;

    let active = trials;

    if (active.length === 1) {
        const t = active[0];
        return {
            HR: t.hr, HR_lower: t.hr_lower, HR_upper: t.hr_upper,
            logHR: t.logHR, seLogHR: t.seLogHR,
            I2: 0, tau2: 0, k: 1, totalN: t.n,
            pValue: 2 * (1 - normCDF(Math.abs(t.logHR / t.seLogHR))),
            PI_lower: t.hr_lower, PI_upper: t.hr_upper,
            weights: [100]
        };
    }

    // Fixed effect weights
    let sumW = 0, sumWY = 0, sumW2 = 0;
    active.forEach(t => {
        const w = 1 / (t.seLogHR ** 2);
        sumW += w; sumWY += w * t.logHR; sumW2 += w ** 2;
    });
    const thetaFE = sumWY / sumW;

    // Q statistic & Tau^2 (DerSimonian-Laird)
    let Q = 0;
    active.forEach(t => {
        const w = 1 / (t.seLogHR ** 2);
        Q += w * ((t.logHR - thetaFE) ** 2);
    });

    const k = active.length;
    const C = sumW - (sumW2 / sumW);
    const tau2 = Math.max(0, (Q - (k - 1)) / C);

    // Random effects
    let sumWRE = 0, sumWYRE = 0;
    const weights = [];
    active.forEach(t => {
        const wRE = 1 / (t.seLogHR ** 2 + tau2);
        sumWRE += wRE;
        sumWYRE += wRE * t.logHR;
        weights.push(wRE);
    });

    // Normalize weights
    const totalW = weights.reduce((a, b) => a + b, 0);
    const normWeights = weights.map(w => (w / totalW) * 100);

    const thetaRE = sumWYRE / sumWRE;
    const seRE = Math.sqrt(1 / sumWRE);
    const I2 = Q > (k - 1) ? ((Q - (k - 1)) / Q) * 100 : 0;

    // 95% Prediction Interval (t_{k-2} convention)
    const tCrit = k > 2 ? tQuantile(0.975, k - 2) : 4.303;
    const piSE = Math.sqrt(seRE ** 2 + tau2);

    return {
        HR: Math.exp(thetaRE),
        HR_lower: Math.exp(thetaRE - 1.96 * seRE),
        HR_upper: Math.exp(thetaRE + 1.96 * seRE),
        logHR: thetaRE,
        seLogHR: seRE,
        PI_lower: Math.exp(thetaRE - tCrit * piSE),
        PI_upper: Math.exp(thetaRE + tCrit * piSE),
        I2, tau2, k,
        totalN: active.reduce((s, t) => s + t.n, 0),
        pValue: 2 * (1 - normCDF(Math.abs(thetaRE / seRE))),
        weights: normWeights
    };
}

// Standard normal CDF via the Abramowitz & Stegun 7.1.26 erf approximation.
// NOTE (fixed during 2026-06 revival): the original shipped normCDF mixed the
// erf coefficients with a normal-CDF structure and returned 0 at x=0 and ~0.95
// at x=1.96 (both wrong), corrupting every displayed p-value. This version is
// correct: Phi(x) = 0.5*(1 + erf(x/sqrt(2))). |abs error| < 1.5e-7.
function erf(x) {
    const sign = x < 0 ? -1 : 1;
    const ax = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * ax);
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
    return sign * y;
}
function normCDF(x) {
    return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

function tQuantile(p, df) {
    // Approximate t-distribution inverse (two-sided 0.975 critical values)
    if (df >= 100) return 1.96;
    if (df <= 1) return 12.71;
    const map = { 2: 4.30, 3: 3.18, 4: 2.78, 5: 2.57, 6: 2.45, 7: 2.36, 8: 2.31, 9: 2.26, 10: 2.23 };
    return map[Math.round(df)] || 2.1;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculatePooled, normCDF, tQuantile, erf };
}
