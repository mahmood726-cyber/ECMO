/*
 * Node tests for the MCS-Logic engine. Run: node tests.js
 * Independent hand-computed expectations — not a re-derivation of the engine.
 */
const { calculatePooled, normCDF, tQuantile } = require('./engine.js');

let pass = 0, fail = 0;
function ok(name, cond, detail) {
    if (cond) { pass++; console.log('  ok  ' + name); }
    else { fail++; console.log(' FAIL ' + name + (detail ? '  -> ' + detail : '')); }
}
function close(a, b, tol) { return Math.abs(a - b) < (tol || 1e-3); }

// --- normCDF ---
ok('normCDF(0) ~ 0.5', close(normCDF(0), 0.5, 1e-6));
ok('normCDF(1.96) ~ 0.975', close(normCDF(1.96), 0.975, 2e-3), 'got ' + normCDF(1.96));
ok('normCDF(-1.96) ~ 0.025', close(normCDF(-1.96), 0.025, 2e-3), 'got ' + normCDF(-1.96));
ok('normCDF symmetric', close(normCDF(1.3) + normCDF(-1.3), 1, 1e-9));

// --- tQuantile ---
ok('tQuantile large df -> 1.96', tQuantile(0.975, 500) === 1.96);
ok('tQuantile df=2 -> 4.30', tQuantile(0.975, 2) === 4.30);

// --- single trial passthrough ---
const single = calculatePooled([{ hr: 0.8, hr_lower: 0.65, hr_upper: 0.98, logHR: Math.log(0.8), seLogHR: 0.1, n: 100 }]);
ok('single: HR passthrough', single.HR === 0.8);
ok('single: k=1', single.k === 1);
ok('single: tau2=0', single.tau2 === 0);

// --- two identical trials: pooled == the trial, no heterogeneity ---
const t = { hr: 0.8, hr_lower: 0.66, hr_upper: 0.97, logHR: Math.log(0.8), seLogHR: 0.1, n: 100 };
const identical = calculatePooled([{ ...t }, { ...t }]);
ok('identical: HR == 0.8', close(identical.HR, 0.8));
ok('identical: tau2 == 0', close(identical.tau2, 0, 1e-9));
ok('identical: I2 == 0', close(identical.I2, 0, 1e-9));
ok('identical: seRE == sqrt(1/200)', close(identical.seLogHR, Math.sqrt(1 / 200)), 'got ' + identical.seLogHR);
ok('identical: totalN == 200', identical.totalN === 200);
ok('identical: weights sum to 100', close(identical.weights.reduce((a, b) => a + b, 0), 100));

// --- two heterogeneous trials: hand-computed DL pooled values ---
// t1: logHR=ln(0.7), se=0.1 (w=100);  t2: logHR=ln(0.9), se=0.2 (w=25)
// thetaFE=-0.30641, Q=1.263177, tau2=0.0065794, thetaRE=-0.29072, HR=0.74775, I2=20.835%
const het = calculatePooled([
    { hr: 0.7, hr_lower: 0.57, hr_upper: 0.85, logHR: Math.log(0.7), seLogHR: 0.1, n: 200 },
    { hr: 0.9, hr_lower: 0.61, hr_upper: 1.33, logHR: Math.log(0.9), seLogHR: 0.2, n: 150 }
]);
ok('het: tau2 ~ 0.0065794', close(het.tau2, 0.0065794, 1e-4), 'got ' + het.tau2);
ok('het: HR ~ 0.74775', close(het.HR, 0.74775, 1e-3), 'got ' + het.HR);
ok('het: I2 ~ 20.835%', close(het.I2, 20.835, 0.05), 'got ' + het.I2);
ok('het: totalN == 350', het.totalN === 350);
ok('het: first trial weighted more than second', het.weights[0] > het.weights[1]);

// --- empty ---
ok('empty -> null', calculatePooled([]) === null);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail === 0 ? 0 : 1);
