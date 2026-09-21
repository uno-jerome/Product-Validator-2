// M = (Q, Σ, δ, q0, F)
export const SIGMA = /^[A-Z0-9-]$/;

const STAGES = [
  { from: 'q0',  to: 'q1',  valid: /^[A-Z]$/, domain: 'Prefix' },
  { from: 'q1',  to: 'q2',  valid: /^[A-Z]$/, domain: 'Prefix' },
  { from: 'q2',  to: 'q3',  valid: /^-$/,     domain: 'Delimiter' },
  { from: 'q3',  to: 'q4',  valid: /^[0-9]$/, domain: 'Year' },
  { from: 'q4',  to: 'q5',  valid: /^[0-9]$/, domain: 'Year' },
  { from: 'q5',  to: 'q6',  valid: /^[0-9]$/, domain: 'Year' },
  { from: 'q6',  to: 'q7',  valid: /^[0-9]$/, domain: 'Year' },
  { from: 'q7',  to: 'q8',  valid: /^-$/,     domain: 'Delimiter' },
  { from: 'q8',  to: 'q9',  valid: /^[0-9]$/, domain: 'Serial' },
  { from: 'q9',  to: 'q10', valid: /^[0-9]$/, domain: 'Serial' },
  { from: 'q10', to: 'q11', valid: /^[0-9]$/, domain: 'Serial' }
];

// δ(qi, c) -> q_{i+1} if valid, else q_trap
export function validateProductCode(input) {
  if (!input) return { input, isValid: false, finalState: 'q0', trace: [], errorReason: 'Empty string ε' };
  let currentState = 'q0', errorReason = null, trace = [];

  for (let i = 0; i < input.length; i++) {
    const c = input[i], stage = STAGES[i], from = currentState;
    if (currentState === 'q_trap') {
      trace.push({ step: i + 1, symbol: c, fromState: 'q_trap', toState: 'q_trap', domain: 'Dead', status: 'error' });
      continue;
    }
    if (!SIGMA.test(c)) {
      currentState = 'q_trap';
      errorReason = `Symbol '${c}' ∉ Σ`;
    } else if (!stage || !stage.valid.test(c)) {
      currentState = 'q_trap';
      errorReason = stage ? `Expected ${stage.domain} at ${from}` : `Length overflow at ${from}`;
    } else {
      currentState = stage.to;
    }
    trace.push({
      step: i + 1, symbol: c, fromState: from, toState: currentState,
      domain: stage ? stage.domain : 'Overflow', status: currentState === 'q_trap' ? 'error' : 'valid'
    });
  }

  if (currentState !== 'q11' && !errorReason) errorReason = `Halted prematurely at state ${currentState}`;
  return { input, isValid: currentState === 'q11' && trace.length === 11, finalState: currentState, trace, errorReason };
}

export function generateSampleCode(category = 'IT') {
  const serial = String(Math.floor(Math.random() * 900) + 100).padStart(3, '0');
  return `${category}-2026-${serial}`;
}
