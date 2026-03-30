/**
 * Arithmetic problem generator — pure logic, no DOM access.
 */

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateAddition(min, max) {
  const a = randomInt(min, max);
  const b = randomInt(min, max);
  return { operandA: a, operandB: b, operator: '+', answer: a + b };
}

function generateSubtraction(min, max) {
  const a = randomInt(min, max);
  const b = randomInt(min, a); // b <= a so result is never negative
  return { operandA: a, operandB: b, operator: '-', answer: a - b };
}

function generateMultiplication(min, max) {
  const a = randomInt(min, max);
  const b = randomInt(min, max);
  return { operandA: a, operandB: b, operator: '×', answer: a * b };
}

function generateDivision(min, max) {
  // Generate two factors, multiply for dividend — guarantees integer result
  const a = randomInt(min, max);
  const b = randomInt(min, max);
  const dividend = a * b;
  return { operandA: dividend, operandB: b, operator: '÷', answer: a };
}

function generateLongDivision() {
  // 1-digit divisor, 2-digit quotient → multi-digit dividend
  const divisor = randomInt(2, 9);
  const quotient = randomInt(11, 99);
  return { operandA: divisor * quotient, operandB: divisor, operator: 'LD', answer: quotient };
}

function isDuplicate(problem, existing) {
  return existing.some(
    p =>
      p.operandA === problem.operandA &&
      p.operandB === problem.operandB &&
      p.operator === problem.operator
  );
}

function generateOne(operations, min, max) {
  const op = operations[randomInt(0, operations.length - 1)];
  switch (op) {
    case '+': return generateAddition(min, max);
    case '-': return generateSubtraction(min, max);
    case '×': return generateMultiplication(min, max);
    case '÷': return generateDivision(min, max);
    case 'LD': return generateLongDivision();
  }
}

/**
 * @param {object} config
 * @param {string[]} config.operations  e.g. ['+', '-', '×', '÷']
 * @param {number}   config.minOperand
 * @param {number}   config.maxOperand
 * @param {number}   config.count
 * @returns {{ operandA: number, operandB: number, operator: string, answer: number }[]}
 */
function generateProblems(config) {
  const { operations, minOperand, maxOperand, count } = config;
  const problems = [];
  const maxAttempts = count * 20;
  let attempts = 0;

  while (problems.length < count && attempts < maxAttempts) {
    attempts++;
    const candidate = generateOne(operations, minOperand, maxOperand);
    if (!isDuplicate(candidate, problems)) {
      problems.push(candidate);
    }
  }

  return problems;
}
