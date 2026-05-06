// generators.js — All problem generators for the K–6 curriculum

// ── Utilities ─────────────────────────────────────────────────

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
function lcm(a, b) { return (a * b) / gcd(a, b); }

function simplifyFraction(n, d) {
  const g = gcd(Math.abs(n), Math.abs(d));
  return [n / g, d / g];
}

function fractionToString(n, d) {
  if (d === 1) return String(n);
  if (n >= d) {
    const whole = Math.floor(n / d);
    const rem = n % d;
    if (rem === 0) return String(whole);
    const [sn, sd] = simplifyFraction(rem, d);
    return `${whole} <sup>${sn}</sup>/<sub>${sd}</sub>`;
  }
  return `<sup>${n}</sup>/<sub>${d}</sub>`;
}

function frac(n, d) {
  return `<sup>${n}</sup>/<sub>${d}</sub>`;
}

// ── Arithmetic ────────────────────────────────────────────────

function genArithmetic(config) {
  const { operations, minOperand, maxOperand, minOperandA, maxOperandA, restrictTables, difficulty = 1 } = config;
  const op = randomChoice(operations);

  // Difficulty scales operand ceilings for +/−
  const addSubMax = [20, 100, 1000, 10000, 100000][difficulty - 1];
  const scaledMax = maxOperand ? Math.max(maxOperand, Math.min(addSubMax, addSubMax)) : addSubMax;

  if (op === 'LD') {
    const maxQ = [20, 50, 99, 999, 9999][difficulty - 1];
    const divisor = randomInt(2, difficulty >= 3 ? 12 : 9);
    const quotient = randomInt(11, maxQ);
    return { layout: 'longdivision', operandA: divisor * quotient, operandB: divisor, operator: 'LD', answer: String(quotient) };
  }

  if (op === '×' && restrictTables) {
    const table = randomChoice(restrictTables);
    const otherMax = difficulty <= 2 ? maxOperand : difficulty <= 3 ? 12 : difficulty <= 4 ? 99 : 999;
    const other = randomInt(minOperand, otherMax);
    return { layout: 'column', operandA: table, operandB: other, operator: '×', answer: String(table * other) };
  }

  if (op === '×' && minOperandA !== undefined) {
    const aMax = difficulty <= 3 ? maxOperandA : difficulty === 4 ? 99 : 999;
    const bMax = difficulty <= 3 ? maxOperand : difficulty === 4 ? 99 : 99;
    const a = randomInt(minOperandA, aMax);
    const b = randomInt(minOperand, bMax);
    return { layout: 'column', operandA: a, operandB: b, operator: '×', answer: String(a * b) };
  }

  if (op === '+') {
    const max = scaledMax;
    // Harder/Hardest: inverse — "What must you add to A to get B?"
    if (difficulty >= 4) {
      const b = randomInt(Math.floor(max * 0.4), max);
      const a = randomInt(1, b - 1);
      return { layout: 'inline', html: `<span class="prob-text">What must you add to ${a} to get ${b}?</span>`, answer: String(b - a) };
    }
    const a = randomInt(minOperand ?? 1, max);
    const b = randomInt(minOperand ?? 1, max);
    return { layout: 'column', operandA: a, operandB: b, operator: '+', answer: String(a + b) };
  }

  if (op === '-') {
    const max = scaledMax;
    if (difficulty >= 4) {
      const a = randomInt(Math.floor(max * 0.4), max);
      const b = randomInt(1, a - 1);
      return { layout: 'inline', html: `<span class="prob-text">What must you subtract from ${a} to get ${a - b}?</span>`, answer: String(b) };
    }
    const a = randomInt(minOperand ?? 1, max);
    const b = randomInt(minOperand ?? 1, a);
    return { layout: 'column', operandA: a, operandB: b, operator: '−', answer: String(a - b) };
  }

  if (op === '×') {
    const aMax = difficulty <= 2 ? (maxOperand ?? 10) : difficulty === 3 ? 99 : difficulty === 4 ? 99 : 999;
    const bMax = difficulty <= 2 ? (maxOperand ?? 10) : difficulty === 3 ? 12 : 99;
    const a = randomInt(minOperand ?? 2, aMax);
    const b = randomInt(minOperand ?? 2, bMax);
    return { layout: 'column', operandA: a, operandB: b, operator: '×', answer: String(a * b) };
  }

  if (op === '÷') {
    const aMax = difficulty <= 2 ? (maxOperand ?? 10) : difficulty === 3 ? 12 : 20;
    const a = randomInt(minOperand ?? 2, aMax);
    const b = randomInt(minOperand ?? 2, aMax);
    return { layout: 'column', operandA: a * b, operandB: b, operator: '÷', answer: String(a) };
  }
}

// ── Sequences ─────────────────────────────────────────────────

function genSequence(config) {
  const { step, minStart, maxStart, length, mode = 'forward' } = config;
  const start = randomInt(minStart, maxStart);
  const seq = Array.from({ length: length + 1 }, (_, i) =>
    mode === 'backward' ? start - i * step : start + i * step
  );

  const blankIdx = randomInt(1, length - 1);
  const answer = seq[blankIdx];
  const displayed = seq.map((n, i) => i === blankIdx ? '___' : String(n));

  return {
    layout: 'inline',
    html: `<span class="prob-text">${displayed.join(', ')}</span>`,
    answer: String(answer),
  };
}

// ── Number Bonds ──────────────────────────────────────────────

function genNumberBonds(config) {
  const { total } = config;
  const a = randomInt(1, total - 1);
  const b = total - a;

  if (Math.random() > 0.5) {
    return { layout: 'inline', html: `<span class="prob-text">${a} + ___ = ${total}</span>`, answer: String(b) };
  }
  return { layout: 'inline', html: `<span class="prob-text">___ + ${b} = ${total}</span>`, answer: String(a) };
}

// ── Place Value ───────────────────────────────────────────────

function genPlaceValue(config) {
  const { digits } = config;
  const placeNames = ['ones', 'tens', 'hundreds', 'thousands', 'ten-thousands'];
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  const num = randomInt(min, max);

  const placeIdx = randomInt(0, digits - 1);
  const placeName = placeNames[placeIdx];
  const placeDigit = Math.floor(num / Math.pow(10, placeIdx)) % 10;
  const placeValue = placeDigit * Math.pow(10, placeIdx);
  const fmt = n => n.toLocaleString('en-AU');

  const type = randomInt(0, 1);
  if (type === 0) {
    return {
      layout: 'inline',
      html: `<span class="prob-text">What digit is in the <em>${placeName}</em> place of ${fmt(num)}?</span>`,
      answer: String(placeDigit),
    };
  }
  return {
    layout: 'inline',
    html: `<span class="prob-text">What is the value of the ${placeDigit} in ${fmt(num)}?</span>`,
    answer: fmt(placeValue),
  };
}

// ── Rounding ──────────────────────────────────────────────────

function genRounding(config) {
  const { difficulty = 1 } = config;
  const scaleMap = [[10], [100], [1000], [10000], [100000]];
  const roundTo = config.roundTo ?? scaleMap[difficulty - 1];
  const maxMagnitude = Math.max(...roundTo) * 100;
  const minValue = config.minValue ?? Math.floor(maxMagnitude * 0.1);
  const maxValue = config.maxValue ?? maxMagnitude;
  const num = randomInt(minValue, maxValue);
  const to = randomChoice(roundTo);
  const rounded = Math.round(num / to) * to;

  return {
    layout: 'inline',
    html: `<span class="prob-text">Round ${num.toLocaleString('en-AU')} to the nearest ${to.toLocaleString('en-AU')}:</span>`,
    answer: rounded.toLocaleString('en-AU'),
  };
}

// ── Fraction of a Group ───────────────────────────────────────

function genFractionOfGroup(config) {
  const { denominators, maxWhole } = config;
  const denom = randomChoice(denominators);
  const numer = randomInt(1, denom - 1);
  const maxGroups = Math.floor(maxWhole / denom);
  const groups = randomInt(1, Math.max(1, maxGroups));
  const whole = groups * denom;
  const answer = (numer * whole) / denom;

  return {
    layout: 'inline',
    html: `<span class="prob-text">Find ${frac(numer, denom)} of ${whole}:</span>`,
    answer: String(answer),
  };
}

// ── Money ─────────────────────────────────────────────────────

function genMoney(config) {
  const { maxAmount, mode = 'add-sub' } = config;
  const toAmt = cents => `$${(cents / 100).toFixed(2)}`;
  const maxCents = maxAmount * 100;

  if (mode === 'add-sub') {
    const a = Math.round(randomInt(50, Math.floor(maxCents * 0.6)) / 5) * 5;
    const b = Math.round(randomInt(50, Math.floor(maxCents * 0.6)) / 5) * 5;
    const op = Math.random() > 0.5 ? '+' : '−';
    if (op === '+') {
      return { layout: 'inline', html: `<span class="prob-text">${toAmt(a)} + ${toAmt(b)} =</span>`, answer: toAmt(a + b) };
    }
    const big = Math.max(a, b), small = Math.min(a, b);
    return { layout: 'inline', html: `<span class="prob-text">${toAmt(big)} − ${toAmt(small)} =</span>`, answer: toAmt(big - small) };
  }

  if (mode === 'change') {
    // Round note values: $5, $10, $20, $50, $100 — capped to maxAmount
    const notes = [500, 1000, 2000, 5000, 10000].filter(n => n <= maxCents);
    const note = randomChoice(notes);
    const price = Math.round(randomInt(Math.floor(note * 0.1), Math.floor(note * 0.9)) / 5) * 5;
    return {
      layout: 'inline',
      html: `<span class="prob-text">Pay ${toAmt(note)} for an item costing ${toAmt(price)}. Change =</span>`,
      answer: toAmt(note - price),
    };
  }

  if (mode === 'multi-item') {
    const unitCents = Math.round(randomInt(50, Math.floor(maxCents * 0.3)) / 5) * 5;
    const qty = randomInt(2, 6);
    return {
      layout: 'inline',
      html: `<span class="prob-text">${qty} items at ${toAmt(unitCents)} each. Total =</span>`,
      answer: toAmt(unitCents * qty),
    };
  }

  if (mode === 'discount') {
    const pcts = [10, 20, 25, 50];
    const pct = randomChoice(pcts);
    // Use multiples of $5 so all answers are whole cents
    const priceDollars = randomInt(1, Math.floor(maxAmount / 5)) * 5;
    const priceCents = priceDollars * 100;
    const savingCents = priceCents * pct / 100;
    return {
      layout: 'inline',
      html: `<span class="prob-text">${pct}% off $${priceDollars}.00. Sale price =</span>`,
      answer: toAmt(priceCents - savingCents),
    };
  }
}

// ── Time ──────────────────────────────────────────────────────

function genTime(config) {
  const { mode } = config;
  const pad = n => String(n).padStart(2, '0');

  if (mode === 'oclock-halfpast') {
    const h = randomInt(1, 12);
    const half = Math.random() > 0.5;
    const digital = `${h}:${half ? '30' : '00'}`;
    const words = half ? `half past ${h}` : `${h} o'clock`;
    if (Math.random() > 0.5) {
      return { layout: 'inline', html: `<span class="prob-text">Write in words: ${digital}</span>`, answer: words };
    }
    return { layout: 'inline', html: `<span class="prob-text">Write as a digital time: ${words}</span>`, answer: digital };
  }

  if (mode === 'quarter') {
    const h = randomInt(1, 12);
    const type = randomChoice(['past', 'to']);
    if (type === 'past') {
      return {
        layout: 'inline',
        html: `<span class="prob-text">Write as a digital time: quarter past ${h}</span>`,
        answer: `${h}:15`,
      };
    }
    return {
      layout: 'inline',
      html: `<span class="prob-text">Write as a digital time: quarter to ${h}</span>`,
      answer: `${h - 1 || 12}:45`,
    };
  }

  if (mode === 'read-5min') {
    const h = randomInt(1, 12);
    const m = randomInt(0, 11) * 5;
    const digital = `${h}:${pad(m)}`;
    if (Math.random() > 0.5) {
      return { layout: 'inline', html: `<span class="prob-text">What time is ${digital}? (write in words)</span>`, answer: m === 0 ? `${h} o'clock` : `${m} past ${h}` };
    }
    return { layout: 'inline', html: `<span class="prob-text">Write the digital time for ${m === 0 ? `${h} o'clock` : `${m} past ${h}`}:</span>`, answer: digital };
  }

  if (mode === 'am-pm') {
    const questions = [
      { html: '7:30 in the morning is 7:30 ___ (am or pm)', answer: 'am' },
      { html: '3:00 in the afternoon is 3:00 ___ (am or pm)', answer: 'pm' },
      { html: '9:00 at night is 9:00 ___ (am or pm)', answer: 'pm' },
      { html: '6:15 in the morning is 6:15 ___ (am or pm)', answer: 'am' },
      { html: 'Midday (noon) is written as ___ (am or pm)', answer: 'pm' },
      { html: 'Midnight is written as 12:00 ___ (am or pm)', answer: 'am' },
      { html: 'School starts at 9:00 ___. Which: am or pm?', answer: 'am' },
      { html: 'Dinner at 6:30 ___. Which: am or pm?', answer: 'pm' },
    ];
    const q = randomChoice(questions);
    return { layout: 'inline', html: `<span class="prob-text">${q.html}</span>`, answer: q.answer };
  }

  if (mode === 'duration') {
    // start time and duration in whole 5-minute steps; end within the same 2-hour window
    const startH = randomInt(8, 18);
    const startM = randomInt(0, 11) * 5;
    const durMins = randomInt(1, 11) * 5 + randomInt(0, 3) * 15; // 5–105 min
    const totalMins = startH * 60 + startM + durMins;
    const endH = Math.floor(totalMins / 60);
    const endM = totalMins % 60;
    const suffix = startH < 12 ? 'am' : 'pm';
    if (Math.random() > 0.5) {
      return {
        layout: 'inline',
        html: `<span class="prob-text">Start: ${startH}:${pad(startM)} ${suffix}  End: ${endH}:${pad(endM)} ${endH < 12 ? 'am' : 'pm'}. How long? (minutes)</span>`,
        answer: `${durMins} min`,
      };
    }
    return {
      layout: 'inline',
      html: `<span class="prob-text">Start: ${startH}:${pad(startM)} ${suffix}. Duration: ${durMins} minutes. End time:</span>`,
      answer: `${endH}:${pad(endM)}`,
    };
  }

  if (mode === '24hour') {
    const h12 = randomInt(1, 12);
    const m = randomInt(0, 11) * 5;
    const ampm = Math.random() > 0.5 ? 'am' : 'pm';
    const h24 = ampm === 'am' ? (h12 === 12 ? 0 : h12) : (h12 === 12 ? 12 : h12 + 12);
    const digital12 = `${h12}:${pad(m)} ${ampm}`;
    const digital24 = `${pad(h24)}:${pad(m)}`;
    if (Math.random() > 0.5) {
      return { layout: 'inline', html: `<span class="prob-text">Write in 24-hour time: ${digital12}</span>`, answer: digital24 };
    }
    return { layout: 'inline', html: `<span class="prob-text">Write in 12-hour time: ${digital24}</span>`, answer: digital12 };
  }

  if (mode === 'convert-units') {
    const questions = [
      () => { const h = randomInt(1, 12); return { html: `How many minutes in ${h} hour${h > 1 ? 's' : ''}?`, answer: String(h * 60) }; },
      () => { const m = randomChoice([30, 45, 60, 90, 120, 180]); return { html: `${m} minutes = ___ hour(s) and ___ minutes`, answer: `${Math.floor(m/60)} h ${m%60} min` }; },
      () => { const d = randomInt(1, 7); return { html: `How many hours in ${d} day${d > 1 ? 's' : ''}?`, answer: String(d * 24) }; },
      () => { const m = randomInt(1, 5); return { html: `How many seconds in ${m} minute${m > 1 ? 's' : ''}?`, answer: String(m * 60) }; },
      () => { const s = randomChoice([60, 120, 180, 240, 300]); return { html: `${s} seconds = ___ minutes`, answer: String(s / 60) }; },
      () => { return { html: 'How many days in a week?', answer: '7' }; },
      () => { return { html: 'How many months in a year?', answer: '12' }; },
      () => { const w = randomInt(1, 4); return { html: `How many days in ${w} week${w > 1 ? 's' : ''}?`, answer: String(w * 7) }; },
    ];
    const q = randomChoice(questions)();
    return { layout: 'inline', html: `<span class="prob-text">${q.html}</span>`, answer: q.answer };
  }
}


// ── Division with Remainders ──────────────────────────────────

function genDivisionRemainder(config) {
  const { minDivisor, maxDivisor, minDividend, maxDividend } = config;
  const divisor = randomInt(minDivisor, maxDivisor);
  const dividend = randomInt(minDividend, maxDividend);
  const quotient = Math.floor(dividend / divisor);
  const remainder = dividend % divisor;

  return {
    layout: 'inline',
    html: `<span class="prob-text">${dividend} ÷ ${divisor} =</span>`,
    answer: remainder === 0 ? String(quotient) : `${quotient} r ${remainder}`,
  };
}

// ── Equivalent Fractions ──────────────────────────────────────

function genEquivFractions(config) {
  const { maxDenom } = config;
  const simpleNumer = randomInt(1, 4);
  const simpleDenom = randomInt(simpleNumer + 1, 6);
  const maxScale = Math.floor(maxDenom / simpleDenom);
  if (maxScale < 2) return genEquivFractions(config);
  const scale = randomInt(2, maxScale);

  if (Math.random() > 0.5) {
    return {
      layout: 'inline',
      html: `<span class="prob-text">${frac(simpleNumer, simpleDenom)} = ${frac('___', simpleDenom * scale)}</span>`,
      answer: String(simpleNumer * scale),
    };
  }
  return {
    layout: 'inline',
    html: `<span class="prob-text">${frac(simpleNumer * scale, simpleDenom * scale)} = ${frac('___', simpleDenom)}</span>`,
    answer: String(simpleNumer),
  };
}

// ── Fraction Arithmetic ───────────────────────────────────────

function genFractionArithmetic(config) {
  const { operation, sameDenom, difficulty = 1 } = config;
  const maxDenom = config.maxDenom ?? ([4, 6, 10, 20, 20][difficulty - 1]);

  // Harder/Hardest: mixed number addition/subtraction
  if (difficulty >= 4 && operation !== '×') {
    const w1 = randomInt(1, 5), w2 = randomInt(1, 5);
    const d = randomInt(2, 8);
    const n1 = randomInt(1, d - 1), n2 = randomInt(1, d - 1);
    if (operation === '+') {
      const totalN = w1 * d + n1 + w2 * d + n2;
      const whole = Math.floor(totalN / d), rem = totalN % d;
      const [sn, sd] = rem === 0 ? [0, 1] : simplifyFraction(rem, d);
      const ans = rem === 0 ? String(whole) : `${whole} ${fractionToString(sn, sd)}`;
      return { layout: 'inline', html: `<span class="prob-text">${w1} ${frac(n1, d)} + ${w2} ${frac(n2, d)} =</span>`, answer: ans };
    }
    const big = w1 >= w2 ? [w1, n1] : [w2, n2];
    const small = w1 >= w2 ? [w2, n2] : [w1, n1];
    let rN = big[1] - small[1], rW = big[0] - small[0];
    if (rN < 0) { rN += d; rW -= 1; }
    const [sn, sd] = rN === 0 ? [0, 1] : simplifyFraction(rN, d);
    const ans = rN === 0 ? String(rW) : `${rW} ${fractionToString(sn, sd)}`;
    return { layout: 'inline', html: `<span class="prob-text">${big[0]} ${frac(big[1], d)} − ${small[0]} ${frac(small[1], d)} =</span>`, answer: ans };
  }

  if (operation === '×') {
    const n1 = randomInt(1, 5), d1 = randomInt(n1 + 1, 8);
    const n2 = randomInt(1, 5), d2 = randomInt(n2 + 1, 8);
    const [sn, sd] = simplifyFraction(n1 * n2, d1 * d2);
    return {
      layout: 'inline',
      html: `<span class="prob-text">${frac(n1, d1)} × ${frac(n2, d2)} =</span>`,
      answer: fractionToString(sn, sd),
    };
  }

  if (sameDenom) {
    const denom = randomInt(2, maxDenom);
    if (operation === '+') {
      const n1 = randomInt(1, denom - 2);
      const n2 = randomInt(1, denom - n1);
      const [sn, sd] = simplifyFraction(n1 + n2, denom);
      return {
        layout: 'inline',
        html: `<span class="prob-text">${frac(n1, denom)} + ${frac(n2, denom)} =</span>`,
        answer: fractionToString(sn, sd),
      };
    }
    const n1 = randomInt(2, denom - 1);
    const n2 = randomInt(1, n1 - 1);
    const [sn, sd] = simplifyFraction(n1 - n2, denom);
    return {
      layout: 'inline',
      html: `<span class="prob-text">${frac(n1, denom)} − ${frac(n2, denom)} =</span>`,
      answer: fractionToString(sn, sd),
    };
  }

  // Different denominators
  const d1 = randomInt(2, Math.floor(maxDenom / 2));
  const d2 = randomInt(2, Math.floor(maxDenom / 2));
  if (d1 === d2) return genFractionArithmetic(config);
  const n1 = randomInt(1, d1 - 1);
  const n2 = randomInt(1, d2 - 1);
  const commonD = lcm(d1, d2);
  if (commonD > 24) return genFractionArithmetic(config);

  if (operation === '+') {
    const sumN = n1 * (commonD / d1) + n2 * (commonD / d2);
    const [sn, sd] = simplifyFraction(sumN, commonD);
    return {
      layout: 'inline',
      html: `<span class="prob-text">${frac(n1, d1)} + ${frac(n2, d2)} =</span>`,
      answer: fractionToString(sn, sd),
    };
  }
  const val1 = n1 / d1, val2 = n2 / d2;
  const [bigN, bigD, smallN, smallD] = val1 >= val2 ? [n1, d1, n2, d2] : [n2, d2, n1, d1];
  const diffN = bigN * (commonD / bigD) - smallN * (commonD / smallD);
  const [sn, sd] = simplifyFraction(diffN, commonD);
  return {
    layout: 'inline',
    html: `<span class="prob-text">${frac(bigN, bigD)} − ${frac(smallN, smallD)} =</span>`,
    answer: fractionToString(sn, sd),
  };
}

// ── Fraction × Whole Number ───────────────────────────────────

function genFractionMultiply(config) {
  const { maxDenom, maxWhole } = config;
  const denom = randomInt(2, maxDenom);
  const numer = randomInt(1, denom - 1);
  const whole = randomInt(2, maxWhole);
  const productN = numer * whole;
  const [sn, sd] = simplifyFraction(productN, denom);
  return {
    layout: 'inline',
    html: `<span class="prob-text">${frac(numer, denom)} × ${whole} =</span>`,
    answer: fractionToString(sn, sd),
  };
}

// ── Fraction ÷ Whole Number ───────────────────────────────────

function genFractionDivide(config) {
  const { maxDenom, maxWhole } = config;
  const numer = randomInt(1, 5);
  const denom = randomInt(numer + 1, maxDenom);
  const whole = randomInt(2, maxWhole);
  const [sn, sd] = simplifyFraction(numer, denom * whole);
  return {
    layout: 'inline',
    html: `<span class="prob-text">${frac(numer, denom)} ÷ ${whole} =</span>`,
    answer: fractionToString(sn, sd),
  };
}

// ── Improper Fractions / Mixed Numbers ────────────────────────

function genImproperMixed(config) {
  const { maxDenom, maxWhole } = config;
  const denom = randomInt(2, maxDenom);
  const whole = randomInt(1, maxWhole);
  const numer = randomInt(1, denom - 1);
  const improperN = whole * denom + numer;

  if (Math.random() > 0.5) {
    return {
      layout: 'inline',
      html: `<span class="prob-text">Write as an improper fraction: ${whole} ${frac(numer, denom)} =</span>`,
      answer: frac(improperN, denom),
    };
  }
  return {
    layout: 'inline',
    html: `<span class="prob-text">Write as a mixed number: ${frac(improperN, denom)} =</span>`,
    answer: `${whole} ${frac(numer, denom)}`,
  };
}

// ── Decimal Arithmetic ────────────────────────────────────────

function genDecimalArithmetic(config) {
  const { operation, difficulty = 1 } = config;
  const decimalPlaces = config.decimalPlaces ?? (difficulty <= 2 ? 1 : 2);
  const maxValue = config.maxValue ?? ([10, 20, 100, 100, 200][difficulty - 1]);
  const factor = Math.pow(10, decimalPlaces);
  const maxInt = Math.floor(maxValue * factor);
  const ops = operation === '+-' ? ['+', '−'] : [operation === '-' ? '−' : operation];
  const op = randomChoice(ops);

  const a = randomInt(1, Math.floor(maxInt / 2)) / factor;
  const b = randomInt(1, Math.floor(maxInt / 2)) / factor;

  if (op === '+') {
    const ans = Math.round((a + b) * factor) / factor;
    return {
      layout: 'inline',
      html: `<span class="prob-text">${a.toFixed(decimalPlaces)} + ${b.toFixed(decimalPlaces)} =</span>`,
      answer: ans.toFixed(decimalPlaces),
    };
  }
  if (op === '−') {
    const big = Math.max(a, b), small = Math.min(a, b);
    const ans = Math.round((big - small) * factor) / factor;
    return {
      layout: 'inline',
      html: `<span class="prob-text">${big.toFixed(decimalPlaces)} − ${small.toFixed(decimalPlaces)} =</span>`,
      answer: ans.toFixed(decimalPlaces),
    };
  }
  // multiplication: decimal × whole number
  const whole = randomInt(2, 9);
  const ans = Math.round(a * whole * factor) / factor;
  return {
    layout: 'inline',
    html: `<span class="prob-text">${a.toFixed(decimalPlaces)} × ${whole} =</span>`,
    answer: ans.toFixed(decimalPlaces),
  };
}

// ── Area ──────────────────────────────────────────────────────

function genArea(config) {
  const { shape, difficulty = 1 } = config;
  const minSide = config.minSide ?? 2;
  const maxSide = (config.maxSide ?? 12) * [1, 1.5, 2, 3, 4][difficulty - 1];

  // Hardest: compound shape — rectangle minus right triangle
  if (difficulty === 5) {
    const l = randomInt(6, 20), w = randomInt(4, 12);
    const tb = randomInt(2, Math.floor(l / 2)) * 2, th = randomInt(2, w - 1);
    const area = l * w - (tb * th) / 2;
    return {
      layout: 'inline',
      html: `<span class="prob-text">A rectangle (${l} cm × ${w} cm) has a right triangle (base ${tb} cm, height ${th} cm) cut from one corner. Remaining area:</span>`,
      answer: `${area} cm²`,
    };
  }

  // Harder: find missing dimension given area
  if (difficulty === 4 && (shape === 'rectangle' || !shape)) {
    const l = randomInt(minSide, Math.floor(maxSide / 2));
    const w = randomInt(minSide, Math.floor(maxSide / 2));
    if (Math.random() > 0.5) {
      return { layout: 'inline', html: `<span class="prob-text">A rectangle has area ${l * w} cm² and width ${w} cm. Find its length:</span>`, answer: `${l} cm` };
    }
    return { layout: 'inline', html: `<span class="prob-text">A rectangle has area ${l * w} cm² and length ${l} cm. Find its width:</span>`, answer: `${w} cm` };
  }

  if (shape === 'rectangle') {
    const l = randomInt(minSide, maxSide), w = randomInt(minSide, maxSide);
    return { layout: 'inline', html: `<span class="prob-text">Area of rectangle: length = ${l} cm, width = ${w} cm</span>`, answer: `${l * w} cm²` };
  }
  if (shape === 'triangle') {
    const b = randomInt(minSide, maxSide) * 2, h = randomInt(minSide, maxSide);
    return { layout: 'inline', html: `<span class="prob-text">Area of triangle: base = ${b} cm, height = ${h} cm</span>`, answer: `${(b * h) / 2} cm²` };
  }
  if (shape === 'parallelogram') {
    const b = randomInt(minSide, maxSide), h = randomInt(minSide, maxSide);
    return { layout: 'inline', html: `<span class="prob-text">Area of parallelogram: base = ${b} cm, height = ${h} cm</span>`, answer: `${b * h} cm²` };
  }
  if (shape === 'trapezium') {
    const a = randomInt(minSide, maxSide), b = randomInt(minSide, maxSide);
    const h = randomInt(minSide, maxSide) * 2;
    return { layout: 'inline', html: `<span class="prob-text">Area of trapezium: parallel sides = ${a} cm and ${b} cm, height = ${h} cm</span>`, answer: `${((a + b) * h) / 2} cm²` };
  }
}

// ── Perimeter ─────────────────────────────────────────────────

function genPerimeter(config) {
  const { minSide, maxSide } = config;
  const l = randomInt(minSide, maxSide);
  const w = randomInt(minSide, maxSide);
  return {
    layout: 'inline',
    html: `<span class="prob-text">Perimeter of rectangle: ${l} cm × ${w} cm</span>`,
    answer: `${2 * (l + w)} cm`,
  };
}

// ── Prime / Composite ─────────────────────────────────────────

const PRIMES = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]);

function genPrimeComposite(config) {
  const { min, max } = config;
  const n = randomInt(min, max);
  const type = randomInt(0, 1);

  if (type === 0) {
    return {
      layout: 'inline',
      html: `<span class="prob-text">Is ${n} prime or composite?</span>`,
      answer: PRIMES.has(n) ? 'Prime' : 'Composite',
    };
  }
  const factors = [];
  for (let i = 1; i <= n; i++) if (n % i === 0) factors.push(i);
  return {
    layout: 'inline',
    html: `<span class="prob-text">List all factors of ${n}:</span>`,
    answer: factors.join(', '),
  };
}

// ── Factors ───────────────────────────────────────────────────

function genFactors(config) {
  const { min, max } = config;
  const type = randomInt(0, 1);

  if (type === 0) {
    const n = randomInt(min, max);
    const factors = [];
    for (let i = 1; i <= n; i++) if (n % i === 0) factors.push(i);
    return {
      layout: 'inline',
      html: `<span class="prob-text">List all factors of ${n}:</span>`,
      answer: factors.join(', '),
    };
  }
  const base = randomInt(2, 10);
  const multiples = Array.from({ length: 6 }, (_, i) => base * (i + 1));
  return {
    layout: 'inline',
    html: `<span class="prob-text">List the first 6 multiples of ${base}:</span>`,
    answer: multiples.join(', '),
  };
}

// ── Order of Operations ───────────────────────────────────────

function genOrderOfOps(config) {
  const { level } = config;

  if (level === 1) {
    const a = randomInt(1, 10), b = randomInt(2, 9), c = randomInt(2, 9);
    if (Math.random() > 0.5) {
      return { layout: 'inline', html: `<span class="prob-text">${a} + ${b} × ${c} =</span>`, answer: String(a + b * c) };
    }
    return { layout: 'inline', html: `<span class="prob-text">${a} × ${b} + ${c} =</span>`, answer: String(a * b + c) };
  }

  const a = randomInt(2, 8), b = randomInt(2, 8), c = randomInt(2, 8);
  const type = randomInt(0, 2);
  if (type === 0) {
    return { layout: 'inline', html: `<span class="prob-text">(${a} + ${b}) × ${c} =</span>`, answer: String((a + b) * c) };
  }
  if (type === 1) {
    return { layout: 'inline', html: `<span class="prob-text">${a} × (${b} + ${c}) =</span>`, answer: String(a * (b + c)) };
  }
  return { layout: 'inline', html: `<span class="prob-text">${a}² + ${b} × ${c} =</span>`, answer: String(a * a + b * c) };
}

// ── Percentages ───────────────────────────────────────────────

function genPercentage(config) {
  const { level, difficulty = 1 } = config;

  // Hardest: two successive discounts
  if (difficulty === 5) {
    const p1 = randomChoice([10, 20, 25]);
    const p2 = randomChoice([5, 10]);
    const price = randomInt(4, 20) * 10;
    const after1 = price * (1 - p1 / 100);
    const final = Math.round(after1 * (1 - p2 / 100) * 100) / 100;
    return {
      layout: 'inline',
      html: `<span class="prob-text">An item costs $${price}. First ${p1}% off, then ${p2}% off the new price. Final price:</span>`,
      answer: `$${final.toFixed(2)}`,
    };
  }

  // Harder: reverse percentage
  if (difficulty === 4) {
    const pct = randomChoice([10, 20, 25, 50]);
    const salePrice = randomInt(2, 20) * 5;
    const original = salePrice * 100 / (100 - pct);
    if (!Number.isInteger(original)) return genPercentage(config);
    return {
      layout: 'inline',
      html: `<span class="prob-text">After a ${pct}% discount, the price is $${salePrice}. Original price:</span>`,
      answer: `$${original}`,
    };
  }

  const pctOptions = difficulty <= 2
    ? (level === 1 ? [10, 20, 25, 50, 75] : [5, 10, 15, 20, 25, 50])
    : [5, 10, 12, 15, 20, 25, 30, 35, 40, 45, 50, 60, 75, 80];
  const pct = randomChoice(pctOptions);
  const maxAns = difficulty <= 2 ? (level === 1 ? 20 : 40) : 100;
  const answer = randomInt(1, maxAns);
  const whole = answer * (100 / pct);
  if (!Number.isInteger(whole) || whole > 500) return genPercentage(config);
  return {
    layout: 'inline',
    html: `<span class="prob-text">Find ${pct}% of ${whole}:</span>`,
    answer: String(answer),
  };
}

// ── Fraction / Decimal / Percentage Conversion ────────────────

const COMMON_FRACS = [
  [1, 2, '0.5', '50'], [1, 4, '0.25', '25'], [3, 4, '0.75', '75'],
  [1, 5, '0.2', '20'], [2, 5, '0.4', '40'], [3, 5, '0.6', '60'], [4, 5, '0.8', '80'],
  [1, 10, '0.1', '10'], [3, 10, '0.3', '30'], [7, 10, '0.7', '70'],
];

function genFracDecPct() {
  const [n, d, dec, pct] = randomChoice(COMMON_FRACS);
  const type = randomInt(0, 2);
  if (type === 0) {
    return { layout: 'inline', html: `<span class="prob-text">Write ${frac(n, d)} as a decimal:</span>`, answer: dec };
  }
  if (type === 1) {
    return { layout: 'inline', html: `<span class="prob-text">Write ${dec} as a percentage:</span>`, answer: `${pct}%` };
  }
  return { layout: 'inline', html: `<span class="prob-text">Write ${pct}% as a fraction in lowest terms:</span>`, answer: frac(n, d) };
}

// ── Ratios ────────────────────────────────────────────────────

function genRatio(config) {
  const { maxValue } = config;
  const a = randomInt(1, maxValue), b = randomInt(1, maxValue);
  const g = gcd(a, b);
  const simA = a / g, simB = b / g;

  if (Math.random() > 0.5 || (simA === a && simB === b)) {
    return {
      layout: 'inline',
      html: `<span class="prob-text">Simplify the ratio ${a} : ${b}:</span>`,
      answer: `${simA} : ${simB}`,
    };
  }
  const scale = randomInt(2, 4);
  return {
    layout: 'inline',
    html: `<span class="prob-text">Complete the equivalent ratio: ${simA} : ${simB} = ___ : ${simB * scale}</span>`,
    answer: String(simA * scale),
  };
}

// ── Negative Numbers ──────────────────────────────────────────

function genNegativeNumbers(config) {
  const { min, max } = config;
  const a = randomInt(min, max);
  const b = randomInt(0, Math.abs(min));
  const op = Math.random() > 0.5 ? '+' : '−';
  const ans = op === '+' ? a + b : a - b;
  return {
    layout: 'inline',
    html: `<span class="prob-text">${a} ${op} ${b} =</span>`,
    answer: String(ans),
  };
}

// ── Algebra: Substitution ─────────────────────────────────────

function genAlgebraSubstitution(config) {
  const { maxCoeff, maxConst, maxValue } = config;
  const x = randomInt(1, maxValue);
  const a = randomInt(1, maxCoeff);
  const b = randomInt(0, maxConst);
  const type = randomInt(0, 1);

  if (type === 0) {
    return { layout: 'inline', html: `<span class="prob-text">If <em>x</em> = ${x}, find ${a}<em>x</em> + ${b}:</span>`, answer: String(a * x + b) };
  }
  return { layout: 'inline', html: `<span class="prob-text">If <em>x</em> = ${x}, find ${a}<em>x</em> − ${b}:</span>`, answer: String(a * x - b) };
}

// ── Simple Equations ──────────────────────────────────────────

function genSimpleEquations(config) {
  const { difficulty = 1 } = config;
  const maxCoeff  = config.maxCoeff  ?? ([3, 5, 8, 12, 20][difficulty - 1]);
  const maxAnswer = config.maxAnswer ?? ([10, 20, 30, 50, 100][difficulty - 1]);

  const x = randomInt(1, maxAnswer);
  const a = randomInt(1, maxCoeff);
  const b = randomInt(1, maxAnswer);

  // Hardest: form and solve from a word problem
  if (difficulty === 5) {
    const items = randomChoice(['pens', 'books', 'cards', 'marbles', 'stickers']);
    const price = randomInt(2, 15);
    const extra = randomInt(1, 20);
    const total = a * price + extra;
    return {
      layout: 'inline',
      html: `<span class="prob-text">Sam buys ${a} ${items} at $${price} each and pays a $${extra} delivery fee. Write and solve an equation for the total cost <em>T</em>:</span>`,
      answer: `T = ${a} × ${price} + ${extra} = $${total}`,
    };
  }

  // Harder: equation with fraction coefficient
  if (difficulty === 4) {
    const d = randomChoice([2, 3, 4]);
    const ans = randomInt(1, 10) * d;
    return {
      layout: 'inline',
      html: `<span class="prob-text">Solve: ${frac(1, d)}<em>x</em> + ${b} = ${ans / d + b}</span>`,
      answer: `x = ${ans}`,
    };
  }

  const type = randomInt(0, 2);
  if (type === 0) {
    return { layout: 'inline', html: `<span class="prob-text">Solve: ${a}<em>x</em> = ${a * x}</span>`, answer: `x = ${x}` };
  }
  if (type === 1) {
    return { layout: 'inline', html: `<span class="prob-text">Solve: <em>x</em> + ${b} = ${x + b}</span>`, answer: `x = ${x}` };
  }
  return { layout: 'inline', html: `<span class="prob-text">Solve: ${a}<em>x</em> + ${b} = ${a * x + b}</span>`, answer: `x = ${x}` };
}

// ── Volume ────────────────────────────────────────────────────

function genVolume(config) {
  const { minSide, maxSide } = config;
  const l = randomInt(minSide, maxSide);
  const w = randomInt(minSide, maxSide);
  const h = randomInt(minSide, maxSide);
  return {
    layout: 'inline',
    html: `<span class="prob-text">Volume of rectangular prism: ${l} cm × ${w} cm × ${h} cm</span>`,
    answer: `${l * w * h} cm³`,
  };
}

// ── Statistics ────────────────────────────────────────────────

function genStatistics(config) {
  const { difficulty = 1 } = config;
  const setSize  = config.setSize  ?? (difficulty <= 3 ? 5 : 7);
  const minValue = config.minValue ?? 1;
  const maxValue = config.maxValue ?? ([20, 50, 100, 200, 500][difficulty - 1]);

  // Harder: find the missing value given mean
  if (difficulty >= 4) {
    const knownCount = setSize - 1;
    const targetMean = randomInt(5, 30);
    const known = Array.from({ length: knownCount }, () => randomInt(minValue, maxValue));
    const missing = targetMean * setSize - known.reduce((s, n) => s + n, 0);
    if (missing < 1 || missing > maxValue * 2) return genStatistics(config);
    const dataStr = `{${known.join(', ')}, ?}`;
    return {
      layout: 'inline',
      html: `<span class="prob-text">The mean of ${dataStr} is ${targetMean}. Find the missing value:</span>`,
      answer: String(missing),
    };
  }

  const data = Array.from({ length: setSize }, () => randomInt(minValue, maxValue)).sort((a, b) => a - b);
  const mean = data.reduce((s, n) => s + n, 0) / setSize;
  const median = setSize % 2 === 0
    ? (data[setSize / 2 - 1] + data[setSize / 2]) / 2
    : data[Math.floor(setSize / 2)];
  const freq = {};
  data.forEach(n => { freq[n] = (freq[n] || 0) + 1; });
  const maxFreq = Math.max(...Object.values(freq));
  const mode = maxFreq === 1 ? 'No mode' : Object.entries(freq).filter(([, f]) => f === maxFreq).map(([n]) => n).join(', ');
  const range = data[setSize - 1] - data[0];
  const dataStr = `{${data.join(', ')}}`;
  const type = randomInt(0, 3);

  const questions = [
    { html: `Find the mean of ${dataStr}:`, answer: String(mean % 1 === 0 ? mean : mean.toFixed(1)) },
    { html: `Find the median of ${dataStr}:`, answer: String(median) },
    { html: `Find the mode of ${dataStr}:`, answer: mode },
    { html: `Find the range of ${dataStr}:`, answer: String(range) },
  ];
  return { layout: 'inline', html: `<span class="prob-text">${questions[type].html}</span>`, answer: questions[type].answer };
}

// ── Shape Properties ──────────────────────────────────────────

const SHAPES = [
  { name: 'circle',        sides: 0, vertices: 0, symmetry: 'Infinite' },
  { name: 'triangle',      sides: 3, vertices: 3, symmetry: 3 },
  { name: 'square',        sides: 4, vertices: 4, symmetry: 4 },
  { name: 'rectangle',     sides: 4, vertices: 4, symmetry: 2 },
  { name: 'pentagon',      sides: 5, vertices: 5, symmetry: 5 },
  { name: 'hexagon',       sides: 6, vertices: 6, symmetry: 6 },
  { name: 'octagon',       sides: 8, vertices: 8, symmetry: 8 },
  { name: 'parallelogram', sides: 4, vertices: 4, symmetry: 0 },
  { name: 'rhombus',       sides: 4, vertices: 4, symmetry: 2 },
];

function genShapeProperties(config) {
  const { level } = config;
  const shape = randomChoice(SHAPES);

  if (level === 1) {
    // Name shape / count sides
    const type = randomInt(0, 1);
    if (type === 0) {
      return {
        layout: 'inline',
        html: `<span class="prob-text">A ${shape.name} has ___ sides.</span>`,
        answer: String(shape.sides),
      };
    }
    return {
      layout: 'inline',
      html: `<span class="prob-text">A ${shape.name} has ___ vertices (corners).</span>`,
      answer: String(shape.vertices),
    };
  }

  // level 2: lines of symmetry
  return {
    layout: 'inline',
    html: `<span class="prob-text">How many lines of symmetry does a ${shape.name} have?</span>`,
    answer: String(shape.symmetry),
  };
}

// ── Angles ────────────────────────────────────────────────────

function genAngles(config) {
  const { mode } = config;

  if (mode === 'name') {
    const types = [
      { label: 'acute',   min: 1,   max: 89  },
      { label: 'right',   min: 90,  max: 90  },
      { label: 'obtuse',  min: 91,  max: 179 },
      { label: 'straight',min: 180, max: 180 },
      { label: 'reflex',  min: 181, max: 359 },
    ];
    const chosen = randomChoice(types);
    const deg = randomInt(chosen.min, chosen.max);
    return {
      layout: 'inline',
      html: `<span class="prob-text">Name this angle: ${deg}°</span>`,
      answer: chosen.label,
    };
  }

  if (mode === 'missing-line') {
    const type = randomInt(0, 1);
    if (type === 0) {
      // angles on a straight line sum to 180°
      const a = randomInt(10, 160);
      return {
        layout: 'inline',
        html: `<span class="prob-text">Two angles on a straight line: ${a}° and ___°</span>`,
        answer: `${180 - a}°`,
      };
    }
    // angles at a point sum to 360°
    const a = randomInt(30, 150), b = randomInt(30, 360 - a - 30);
    return {
      layout: 'inline',
      html: `<span class="prob-text">Three angles at a point: ${a}°, ${b}° and ___°</span>`,
      answer: `${360 - a - b}°`,
    };
  }

  if (mode === 'missing-shape') {
    const type = randomInt(0, 1);
    if (type === 0) {
      // triangle: sum = 180°
      const a = randomInt(20, 120), b = randomInt(20, 160 - a);
      return {
        layout: 'inline',
        html: `<span class="prob-text">Angles in a triangle: ${a}°, ${b}° and ___°</span>`,
        answer: `${180 - a - b}°`,
      };
    }
    // quadrilateral: sum = 360°
    const a = randomInt(50, 130), b = randomInt(50, 130), c = randomInt(50, 360 - a - b - 50);
    return {
      layout: 'inline',
      html: `<span class="prob-text">Angles in a quadrilateral: ${a}°, ${b}°, ${c}° and ___°</span>`,
      answer: `${360 - a - b - c}°`,
    };
  }
}

// ── Coordinates ───────────────────────────────────────────────

function genCoordinates(config) {
  const { mode, maxCoord } = config;
  const letters = 'ABCDEFGHIJKLMNOP';

  if (mode === 'read') {
    const x = randomInt(0, maxCoord), y = randomInt(0, maxCoord);
    const label = randomChoice(letters.split(''));
    const type = randomInt(0, 1);
    if (type === 0) {
      return {
        layout: 'inline',
        html: `<span class="prob-text">Point ${label} is at (${x}, ${y}). What is its x-coordinate?</span>`,
        answer: String(x),
      };
    }
    return {
      layout: 'inline',
      html: `<span class="prob-text">Point ${label} is at (${x}, ${y}). What is its y-coordinate?</span>`,
      answer: String(y),
    };
  }

  // transform: translate a point
  const x = randomInt(1, maxCoord), y = randomInt(1, maxCoord);
  const dx = randomInt(-3, 3), dy = randomInt(-3, 3);
  const nx = x + dx, ny = y + dy;
  if (nx < 0 || ny < 0) return genCoordinates(config);
  const dirX = dx >= 0 ? `${dx} right` : `${Math.abs(dx)} left`;
  const dirY = dy >= 0 ? `${dy} up` : `${Math.abs(dy)} down`;
  return {
    layout: 'inline',
    html: `<span class="prob-text">Translate (${x}, ${y}) by ${dirX} and ${dirY}. New coordinates:</span>`,
    answer: `(${nx}, ${ny})`,
  };
}

// ── Triangle Classification ───────────────────────────────────

function genTriangleClassify() {
  const questions = [
    { html: 'A triangle with 3 equal sides is called an ___ triangle.', answer: 'equilateral' },
    { html: 'A triangle with 2 equal sides is called an ___ triangle.', answer: 'isosceles' },
    { html: 'A triangle with no equal sides is called a ___ triangle.', answer: 'scalene' },
    { html: 'A triangle with one 90° angle is called a ___ triangle.', answer: 'right-angled' },
    { html: 'An equilateral triangle has ___ lines of symmetry.', answer: '3' },
    { html: 'An isosceles triangle has ___ line(s) of symmetry.', answer: '1' },
    { html: 'A scalene triangle has ___ lines of symmetry.', answer: '0' },
    { html: 'Each angle in an equilateral triangle measures ___°.', answer: '60' },
    { html: 'The three interior angles of any triangle add up to ___°.', answer: '180' },
    { html: 'A triangle with angles 60°, 60° and 60° is called an ___ triangle.', answer: 'equilateral' },
    { html: 'A triangle with one angle greater than 90° is called an ___ triangle.', answer: 'obtuse' },
    { html: 'A triangle with all angles less than 90° is called an ___ triangle.', answer: 'acute' },
    { html: 'A right-angled isosceles triangle has two angles each measuring ___°.', answer: '45' },
  ];
  const q = randomChoice(questions);
  return { layout: 'inline', html: `<span class="prob-text">${q.html}</span>`, answer: q.answer };
}

// ── Quadrilateral Properties ──────────────────────────────────

function genQuadrilateralProperties() {
  const questions = [
    { html: 'A quadrilateral with exactly 1 pair of parallel sides is called a ___.', answer: 'trapezium' },
    { html: 'A quadrilateral with 2 pairs of parallel sides and all sides equal is called a ___.', answer: 'rhombus' },
    { html: 'A quadrilateral with 2 pairs of parallel sides and all angles equal to 90° is called a ___.', answer: 'rectangle' },
    { html: 'A quadrilateral with all sides equal and all angles 90° is called a ___.', answer: 'square' },
    { html: 'A parallelogram has ___ pairs of parallel sides.', answer: '2' },
    { html: 'A rhombus has ___ equal sides.', answer: '4' },
    { html: 'True or False: A rhombus has 4 right angles.', answer: 'False' },
    { html: 'True or False: A parallelogram has opposite sides that are equal in length.', answer: 'True' },
    { html: 'True or False: A trapezium has 2 pairs of parallel sides.', answer: 'False' },
    { html: 'True or False: Every square is also a rhombus.', answer: 'True' },
    { html: 'True or False: Every rectangle is also a parallelogram.', answer: 'True' },
    { html: 'A rhombus has ___ lines of symmetry.', answer: '2' },
    { html: 'The angles inside any quadrilateral add up to ___°.', answer: '360' },
    { html: 'A parallelogram has ___ lines of symmetry.', answer: '0' },
    { html: 'Which shape has all sides equal but angles that are not 90°: square or rhombus?', answer: 'rhombus' },
  ];
  const q = randomChoice(questions);
  return { layout: 'inline', html: `<span class="prob-text">${q.html}</span>`, answer: q.answer };
}

// ── Analog Clock ──────────────────────────────────────────────

function clockSVG(h, m) {
  const cx = 60, cy = 60, r = 54;
  const toRad = deg => (deg - 90) * Math.PI / 180;

  const mAngle = m * 6;
  const hAngle = (h % 12) * 30 + m * 0.5;

  const mRad = toRad(mAngle), hRad = toRad(hAngle);
  const mX = (cx + 42 * Math.cos(mRad)).toFixed(1);
  const mY = (cy + 42 * Math.sin(mRad)).toFixed(1);
  const hX = (cx + 28 * Math.cos(hRad)).toFixed(1);
  const hY = (cy + 28 * Math.sin(hRad)).toFixed(1);

  const ticks = Array.from({ length: 60 }, (_, i) => {
    const a = toRad(i * 6);
    const isHour = i % 5 === 0;
    const inner = isHour ? r - 8 : r - 4;
    return `<line x1="${(cx + inner * Math.cos(a)).toFixed(1)}" y1="${(cy + inner * Math.sin(a)).toFixed(1)}" x2="${(cx + r * Math.cos(a)).toFixed(1)}" y2="${(cy + r * Math.sin(a)).toFixed(1)}" stroke="#333" stroke-width="${isHour ? 2 : 1}"/>`;
  }).join('');

  const nums = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    const a = toRad(n * 30);
    return `<text x="${(cx + 43 * Math.cos(a)).toFixed(1)}" y="${(cy + 43 * Math.sin(a) + 3.5).toFixed(1)}" text-anchor="middle" font-size="9" font-family="sans-serif" fill="#111">${n}</text>`;
  }).join('');

  return `<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="white" stroke="#111" stroke-width="2.5"/>
  ${ticks}
  ${nums}
  <line x1="${cx}" y1="${cy}" x2="${hX}" y2="${hY}" stroke="#111" stroke-width="4.5" stroke-linecap="round"/>
  <line x1="${cx}" y1="${cy}" x2="${mX}" y2="${mY}" stroke="#111" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="${cx}" cy="${cy}" r="3" fill="#111"/>
</svg>`;
}

function genAnalogClock(config) {
  const { mode } = config;
  const h = randomInt(1, 12);
  let m;
  if (mode === 'oclock-halfpast') m = randomChoice([0, 30]);
  else if (mode === 'quarter')    m = randomChoice([0, 15, 30, 45]);
  else                            m = randomInt(0, 11) * 5;

  return {
    layout: 'clock',
    html: clockSVG(h, m),
    answer: `${h}:${String(m).padStart(2, '0')}`,
  };
}

// ── Dispatcher ────────────────────────────────────────────────

function generateProblem(type, config) {
  switch (type) {
    case 'arithmetic':          return genArithmetic(config);
    case 'sequence':            return genSequence(config);
    case 'numberBonds':         return genNumberBonds(config);
    case 'placeValue':          return genPlaceValue(config);
    case 'rounding':            return genRounding(config);
    case 'fractionOfGroup':     return genFractionOfGroup(config);
    case 'money':               return genMoney(config);
    case 'divisionRemainder':   return genDivisionRemainder(config);
    case 'equivFractions':      return genEquivFractions(config);
    case 'fractionArithmetic':  return genFractionArithmetic(config);
    case 'fractionMultiply':    return genFractionMultiply(config);
    case 'fractionDivide':      return genFractionDivide(config);
    case 'improperMixed':       return genImproperMixed(config);
    case 'decimalArithmetic':   return genDecimalArithmetic(config);
    case 'area':                return genArea(config);
    case 'perimeter':           return genPerimeter(config);
    case 'primeComposite':      return genPrimeComposite(config);
    case 'factors':             return genFactors(config);
    case 'orderOfOps':          return genOrderOfOps(config);
    case 'percentage':          return genPercentage(config);
    case 'fracDecPct':          return genFracDecPct();
    case 'ratio':               return genRatio(config);
    case 'negativeNumbers':     return genNegativeNumbers(config);
    case 'algebraSubstitution': return genAlgebraSubstitution(config);
    case 'simpleEquations':     return genSimpleEquations(config);
    case 'volume':              return genVolume(config);
    case 'statistics':          return genStatistics(config);
    case 'shapeProperties':     return genShapeProperties(config);
    case 'angles':              return genAngles(config);
    case 'coordinates':             return genCoordinates(config);
    case 'time':                    return genTime(config);
    case 'triangleClassify':        return genTriangleClassify();
    case 'quadrilateralProperties': return genQuadrilateralProperties();
    case 'analogClock':             return genAnalogClock(config);
    default:
      return { layout: 'inline', html: '<span class="prob-text">Unknown problem type</span>', answer: '' };
  }
}

function generateCurriculumProblems(topic, count, difficulty = 1) {
  const problems = [];
  const maxAttempts = count * 30;
  let attempts = 0;
  while (problems.length < count && attempts < maxAttempts) {
    attempts++;
    const p = generateProblem(topic.type, { ...topic.config, difficulty });
    if (p) problems.push(p);
  }
  return problems;
}
