import { describe, it, expect } from 'vitest';
import { resolveProductMetadata, CLOSED_CATEGORIES } from './productResolver';

describe('Product Resolver (Stage 2 Semantic Layer)', () => {
  it('correctly maps all 5 closed-set categories and assigns standard flag', () => {
    const testCases = [
      { code: 'IT-2026-001', category: 'Information Technology', baseName: 'Enterprise Workstation', isStd: true },
      { code: 'EL-2025-250', category: 'Electronics & Power', baseName: 'Modular Power Supply', isStd: true },
      { code: 'OF-2024-100', category: 'Office Furniture', baseName: 'Ergonomic Desk', isStd: true },
      { code: 'NW-2023-750', category: 'Network Infrastructure', baseName: 'Core Router', isStd: true },
      { code: 'PR-2022-450', category: 'Peripherals & Accessories', baseName: 'Mechanical Keyboard', isStd: true }
    ];

    testCases.forEach(({ code, category, isStd }) => {
      const res = resolveProductMetadata(code);
      expect(res.category).toBe(category);
      expect(res.isStandardCategory).toBe(isStd);
    });
  });

  it('resolves unassigned categories for valid custom prefixes', () => {
    ['AA-2026-050', 'ZZ-2025-300', 'HR-2024-800', 'QA-2026-150', 'RD-2025-999'].forEach(code => {
      const res = resolveProductMetadata(code);
      expect(res.category).toBe('Unassigned Category');
      expect(res.isStandardCategory).toBe(false);
      expect(res.name).toContain('Standard Asset');
    });
  });

  it('correctly resolves serial-tier boundaries', () => {
    // 000-199 -> Base Series
    expect(resolveProductMetadata('IT-2026-000').name).toBe('Enterprise Workstation Base Series (2026)');
    expect(resolveProductMetadata('IT-2026-199').name).toBe('Enterprise Workstation Base Series (2026)');

    // 200-599 -> Pro Edition
    expect(resolveProductMetadata('IT-2026-200').name).toBe('Enterprise Workstation Pro Edition (2026)');
    expect(resolveProductMetadata('IT-2026-599').name).toBe('Enterprise Workstation Pro Edition (2026)');

    // 600-999 -> Enterprise Ultra
    expect(resolveProductMetadata('IT-2026-600').name).toBe('Enterprise Workstation Enterprise Ultra (2026)');
    expect(resolveProductMetadata('IT-2026-999').name).toBe('Enterprise Workstation Enterprise Ultra (2026)');
  });

  it('returns exact schema { code, name, category, year, serial, isStandardCategory }', () => {
    const res = resolveProductMetadata('EL-2026-350');
    expect(res).toEqual({
      code: 'EL-2026-350',
      name: 'Modular Power Supply Pro Edition (2026)',
      category: 'Electronics & Power',
      year: '2026',
      serial: '350',
      isStandardCategory: true
    });
  });

  it('handles invalid or non-string inputs safely', () => {
    expect(resolveProductMetadata(null)).toBeNull();
    expect(resolveProductMetadata(undefined)).toBeNull();
    expect(resolveProductMetadata('')).toBeNull();
  });
});
