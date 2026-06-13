// audit.test.js — standalone correctness + robustness harness (no deps, run with `node`)
// Loads the browser globals from curriculum.js and generators.js via vm, then
// exercises every curriculum topic across all 5 difficulty levels.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const sandbox = { Math, Array, Object, String, Number, console };
vm.createContext(sandbox);
// Concatenate both files + an export line into ONE script so the top-level
// `const` bindings are still in lexical scope when we expose them.
const src = [
  fs.readFileSync(path.join(root, 'curriculum.js'), 'utf8'),
  fs.readFileSync(path.join(root, 'generators.js'), 'utf8'),
  'globalThis.__api = { CURRICULUM, generateProblem, generateCurriculumProblems };',
].join('\n');
vm.runInContext(src, sandbox);

const { CURRICULUM, generateProblem } = sandbox.__api;
const stripTags = s => String(s).replace(/<[^>]+>/g, '');
const decode = s => stripTags(s).replace(/&nbsp;/g, ' ').trim();

// Parse an integer / fraction / mixed-number string to a [numerator, denominator] rational.
function parseRat(s) {
  s = String(s).trim();
  let m = s.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);          // mixed: "W n/d"
  if (m) { const w = +m[1], n = +m[2], d = +m[3], sign = w < 0 ? -1 : 1; return [sign * (Math.abs(w) * d + n), d]; }
  m = s.match(/^(-?\d+)\/(\d+)$/);                       // fraction "n/d"
  if (m) return [+m[1], +m[2]];
  m = s.match(/^(-?\d+)$/);                              // integer
  if (m) return [+m[1], 1];
  return null;
}

const failures = [];
const fail = (topic, diff, kind, detail) =>
  failures.push({ topic, diff, kind, detail });

const N = 300; // samples per topic per difficulty

// ── Correctness verifiers keyed by recognisable question text ──
function verifyAnswer(topic, diff, p) {
  const q = decode(p.html ?? '');
  const ans = decode(p.answer ?? '');

  // 1. NaN / undefined / empty checks (universal)
  if (ans === '' || /NaN|undefined/.test(ans) || /NaN|undefined/.test(q)) {
    return fail(topic, diff, 'BAD_OUTPUT', `q="${q}" ans="${ans}"`);
  }

  // 2. Column arithmetic: operandA op operandB
  if (p.layout === 'column') {
    const { operandA: a, operandB: b, operator: op, answer } = p;
    const map = { '+': a + b, '−': a - b, '×': a * b, '÷': a / b };
    if (op in map && String(map[op]) !== String(answer)) {
      return fail(topic, diff, 'ARITHMETIC', `${a} ${op} ${b} = ${answer} (expected ${map[op]})`);
    }
  }

  // 3. Long division
  if (p.layout === 'longdivision') {
    if (Number(p.answer) * p.operandB !== p.operandA) {
      return fail(topic, diff, 'LONGDIV', `${p.operandA} ÷ ${p.operandB} ≠ ${p.answer}`);
    }
  }

  // 4. "Find P% of W:" -> P/100 * W  (round to kill float artefacts)
  let m = q.match(/Find (\d+)% of (\d+)/);
  if (m) {
    const exp = Math.round((+m[1] / 100) * +m[2] * 1e6) / 1e6;
    if (Number(ans) !== exp) return fail(topic, diff, 'PERCENT', `${q} -> ${ans} (expected ${exp})`);
  }

  // 5. Inline two-operand integer arithmetic "A + B =" / "A − B ="
  m = q.match(/^(\d+)\s*([+−×])\s*(\d+)\s*=$/);
  if (m) {
    const a = +m[1], b = +m[3];
    const exp = m[2] === '+' ? a + b : m[2] === '−' ? a - b : a * b;
    if (Number(ans) !== exp) return fail(topic, diff, 'INLINE_ARITH', `${q} -> ${ans} (expected ${exp})`);
  }

  // 6. Decimal arithmetic "x + y =" with decimals
  m = q.match(/^([\d.]+)\s*([+−×])\s*([\d.]+)\s*=$/);
  if (m && q.includes('.')) {
    const a = +m[1], b = +m[3];
    const exp = m[2] === '+' ? a + b : m[2] === '−' ? a - b : a * b;
    if (Math.abs(+ans - exp) > 0.0005) return fail(topic, diff, 'DECIMAL', `${q} -> ${ans} (expected ~${exp})`);
  }

  // 7. Exact rational check for fraction +/− (mixed numbers included).
  //    Parses "W n/d ± W n/d =" and compares to the parsed answer exactly.
  if (topic.startsWith('y') && /fractionArithmetic|frac_/.test(topic)) {
    const fm = q.match(/^(.+?)\s*([+−])\s*(.+?)\s*=$/);
    if (fm) {
      const A = parseRat(fm[1]), B = parseRat(fm[3]), R = parseRat(ans);
      if (A && B && R) {
        const exp = fm[2] === '+'
          ? [A[0] * B[1] + B[0] * A[1], A[1] * B[1]]
          : [A[0] * B[1] - B[0] * A[1], A[1] * B[1]];
        if (exp[0] * R[1] !== R[0] * exp[1]) {
          return fail(topic, diff, 'FRACTION_MATH', `${q} -> ${ans} (expected ${exp[0]}/${exp[1]})`);
        }
      }
    }
  }

  // 8. Statistics "mean of {…} is M. Find the missing value" -> verify
  m = q.match(/mean of \{([\d, ]+),\s*\?\} is (\d+)/);
  if (m) {
    const known = m[1].split(',').map(s => +s.trim());
    const targetMean = +m[2];
    const setSize = known.length + 1;
    if ((known.reduce((s, n) => s + n, 0) + Number(ans)) / setSize !== targetMean) {
      return fail(topic, diff, 'STATS_MISSING', `${q} -> ${ans}`);
    }
  }

  // 9. Volume "l × w × h" cm³
  m = q.match(/(\d+) cm × (\d+) cm × (\d+) cm/);
  if (m) {
    const exp = +m[1] * +m[2] * +m[3];
    if (Number(ans.replace(/[^\d]/g, '')) !== exp) return fail(topic, diff, 'VOLUME', `${q} -> ${ans}`);
  }

  // 10. Perimeter "L cm × W cm"
  m = q.match(/Perimeter of rectangle: (\d+) cm × (\d+) cm/);
  if (m) {
    const exp = 2 * (+m[1] + +m[2]);
    if (Number(ans.replace(/[^\d]/g, '')) !== exp) return fail(topic, diff, 'PERIMETER', `${q} -> ${ans}`);
  }

  // 11. Money multi-item "Q items at $X each. Total ="
  m = q.match(/(\d+) items at \$([\d.]+) each/);
  if (m) {
    const exp = (+m[1] * +m[2]).toFixed(2);
    if (ans.replace('$', '') !== exp) return fail(topic, diff, 'MONEY_MULTI', `${q} -> ${ans} (expected $${exp})`);
  }

  // 12. Money change "Pay $N for an item costing $P. Change ="
  m = q.match(/Pay \$(\d+\.\d{2}) for an item costing \$(\d+\.\d{2})/);
  if (m) {
    const exp = (+m[1] - +m[2]).toFixed(2);
    if (ans.replace('$', '') !== exp) return fail(topic, diff, 'MONEY_CHANGE', `${q} -> ${ans} (expected $${exp})`);
  }

  // 13. Money discount "P% off $D.00. Sale price ="
  m = q.match(/(\d+)% off \$(\d+)\.00\. Sale price/);
  if (m) {
    const exp = (+m[2] * (1 - +m[1] / 100)).toFixed(2);
    if (ans.replace('$', '') !== exp) return fail(topic, diff, 'MONEY_DISCOUNT', `${q} -> ${ans} (expected $${exp})`);
  }

  // 14. Inverse add/subtract (Harder/Hardest)
  m = q.match(/What must you add to (\d+) to get (\d+)/);
  if (m && Number(ans) !== +m[2] - +m[1]) return fail(topic, diff, 'INVERSE_ADD', `${q} -> ${ans}`);
  m = q.match(/What must you subtract from (\d+) to get (\d+)/);
  if (m && Number(ans) !== +m[1] - +m[2]) return fail(topic, diff, 'INVERSE_SUB', `${q} -> ${ans}`);

  // 15. Negative answer only flagged where it should never occur
  //     (exclude the negative-numbers and algebra-substitution topics where negatives are valid).
  if (/^-/.test(ans) && !/negative|algebra/i.test(topic)) {
    return fail(topic, diff, 'UNEXPECTED_NEGATIVE', `q="${q}" ans="${ans}"`);
  }
}

// ── Run ───────────────────────────────────────────────────────
let total = 0;
const layoutCounts = {};
for (const year of CURRICULUM) {
  for (const topic of year.topics) {
    for (let diff = 1; diff <= 5; diff++) {
      for (let i = 0; i < N; i++) {
        let p;
        try {
          p = generateProblem(topic.type, { ...topic.config, difficulty: diff });
        } catch (e) {
          fail(topic.id, diff, 'THROW', e.message.split('\n')[0]);
          break; // stop hammering a throwing generator
        }
        total++;
        if (!p || typeof p !== 'object') { fail(topic.id, diff, 'NO_RETURN', String(p)); continue; }
        if (!p.layout) fail(topic.id, diff, 'NO_LAYOUT', JSON.stringify(p));
        layoutCounts[p.layout] = (layoutCounts[p.layout] || 0) + 1;
        verifyAnswer(topic.id, diff, p);
      }
    }
  }
}

// ── Report ────────────────────────────────────────────────────
console.log(`\nGenerated & checked ${total} problems across ${CURRICULUM.reduce((s, y) => s + y.topics.length, 0)} topics × 5 difficulties.`);
console.log('Layouts seen:', layoutCounts);

if (failures.length === 0) {
  console.log('\n✅ ALL CHECKS PASSED\n');
  process.exit(0);
}

// Group failures by kind, then topic
const byKind = {};
for (const f of failures) {
  byKind[f.kind] = byKind[f.kind] || {};
  const key = `${f.topic} [diff ${f.diff}]`;
  byKind[f.kind][key] = byKind[f.kind][key] || { count: 0, sample: f.detail };
  byKind[f.kind][key].count++;
}

console.log(`\n❌ ${failures.length} FAILURES across ${Object.keys(byKind).length} categories:\n`);
for (const [kind, topics] of Object.entries(byKind)) {
  const totalK = Object.values(topics).reduce((s, t) => s + t.count, 0);
  console.log(`\n=== ${kind} (${totalK}) ===`);
  for (const [key, info] of Object.entries(topics)) {
    console.log(`  ${key} ×${info.count}  e.g. ${info.sample}`);
  }
}
process.exit(1);
