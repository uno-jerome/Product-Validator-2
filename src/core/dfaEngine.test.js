import { describe, it, expect } from 'vitest';
import { validateProductCode, generateSampleCode, SAMPLE_PREFIXES, SIGMA } from './dfaEngine.js';

describe('Deterministic Finite Automaton (M = (Q, Σ, δ, q0, F))', () => {
  const accepted = [
    'IT-2026-001', 'IT-2024-892', 'EL-2025-104', 'EL-1999-000', 'PR-2023-551',
    'PR-2026-999', 'NW-2021-042', 'NW-2026-118', 'OF-2022-303', 'OF-2026-015',
    'AA-2024-001', 'ZZ-2026-999', 'HR-2025-500', 'QA-2024-123', 'RD-2026-789'
  ];

  const rejected = [
    'it-2026-001', 'IT-202-0001', 'IT-2026001', 'I-2026-0001', 'ITT-2026-01',
    'IT-2026-00A', 'NW_2026_001', 'PR-2026-', 'IT-2026-0001', ''
  ];

  it('verifies accepted strings reach accepting state q11 and set isAccepted true', () => {
    accepted.forEach(code => {
      const res = validateProductCode(code);
      expect(res.isValid).toBe(true);
      expect(res.isAccepted).toBe(true);
      expect(res.finalState).toBe('q11');
      expect(res.trace.length).toBe(11);
    });
  });

  it('verifies rejected strings halt at non-accepting states and set isAccepted false', () => {
    rejected.forEach(code => {
      const res = validateProductCode(code);
      expect(res.isValid).toBe(false);
      expect(res.isAccepted).toBe(false);
      expect(res.finalState).not.toBe('q11');
    });
  });

  it('diverts illegal symbols outside Σ directly to q_trap', () => {
    ['@', '#', '!'].forEach(symbol => {
      expect(SIGMA.test(symbol)).toBe(false);
      const res = validateProductCode(`IT-2026-00${symbol}`);
      expect(res.isValid).toBe(false);
      expect(res.isAccepted).toBe(false);
      expect(res.finalState).toBe('q_trap');
      expect(res.errorReason).toContain(`Symbol '${symbol}' ∉ Σ`);
    });
  });

  it('accepts any 2-letter uppercase prefix [A-Z]^2 permutations', () => {
    ['AA', 'AZ', 'BA', 'HR', 'QA', 'RD', 'ZZ'].forEach(prefix => {
      const res = validateProductCode(`${prefix}-2025-100`);
      expect(res.isAccepted).toBe(true);
      expect(res.finalState).toBe('q11');
    });
  });
});

describe('Sample Code Generator', () => {
  it('uses clean sample prefixes pool', () => {
    expect(SAMPLE_PREFIXES).toEqual(['IT', 'EL', 'NW', 'PR', 'OF', 'HR', 'QA', 'RD']);
  });

  it('generates valid DFA-compliant product codes in realistic year range (2024-2026)', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateSampleCode();
      const parts = code.split('-');
      expect(parts).toHaveLength(3);
      expect(SAMPLE_PREFIXES).toContain(parts[0]);
      const year = Number(parts[1]);
      expect(year).toBeGreaterThanOrEqual(2024);
      expect(year).toBeLessThanOrEqual(2026);
      const serial = Number(parts[2]);
      expect(serial).toBeGreaterThanOrEqual(1);
      expect(serial).toBeLessThanOrEqual(999);
      expect(parts[2]).toHaveLength(3);

      const dfa = validateProductCode(code);
      expect(dfa.isAccepted).toBe(true);
      expect(dfa.finalState).toBe('q11');
    }
  });
});
