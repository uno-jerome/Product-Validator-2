import { describe, it, expect } from 'vitest';
import { validateProductCode, SIGMA } from './dfaEngine.js';

describe('Deterministic Finite Automaton (M = (Q, Σ, δ, q0, F))', () => {
  const accepted = [
    'IT-2026-001', 'IT-2024-892', 'EL-2025-104', 'EL-1999-000', 'PR-2023-551',
    'PR-2026-999', 'NW-2021-042', 'NW-2026-118', 'OF-2022-303', 'OF-2026-015'
  ];

  const rejected = [
    'it-2026-001', 'IT-202-0001', 'IT-2026001', 'I-2026-0001', 'ITT-2026-01',
    'IT-2026-00A', 'NW_2026_001', 'PR-2026-', 'IT-2026-0001', ''
  ];

  it('verifies 10 accepted strings reach accepting state q11', () => {
    accepted.forEach(code => {
      const res = validateProductCode(code);
      expect(res.isValid).toBe(true);
      expect(res.finalState).toBe('q11');
      expect(res.trace.length).toBe(11);
    });
  });

  it('verifies 10 rejected strings halt at non-accepting states', () => {
    rejected.forEach(code => {
      const res = validateProductCode(code);
      expect(res.isValid).toBe(false);
      expect(res.finalState).not.toBe('q11');
    });
  });

  it('diverts illegal symbols outside Σ directly to q_trap', () => {
    ['@', '#', '!'].forEach(symbol => {
      expect(SIGMA.test(symbol)).toBe(false);
      const res = validateProductCode(`IT-2026-00${symbol}`);
      expect(res.isValid).toBe(false);
      expect(res.finalState).toBe('q_trap');
      expect(res.errorReason).toContain(`Symbol '${symbol}' ∉ Σ`);
    });
  });
});
