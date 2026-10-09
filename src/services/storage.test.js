import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  STORAGE_KEYS,
  getProducts,
  findProduct,
  saveProduct,
  deleteProduct,
  getLogs,
  saveValidationLog,
  clearLogs,
  getTheme,
  setTheme,
  isDisclaimerAcknowledged,
  setDisclaimerAcknowledged,
  DEFAULT_PRODUCTS
} from './storage';

const mockStorage = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, val) => { store[key] = String(val); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: mockStorage,
  writable: true
});

describe('Storage Service (Synchronous LocalStorage Manager)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('finds product case-insensitively', () => {
    expect(findProduct('IT-2026-001')).toBeNull();
    const p1 = { code: 'IT-2026-001', name: 'Workstation 1', category: 'Information Technology', year: '2026', addedAt: '2026-09-26' };
    saveProduct(p1);
    expect(findProduct('IT-2026-001')).toEqual(p1);
    expect(findProduct('it-2026-001')).toEqual(p1);
    expect(findProduct('NW-2026-999')).toBeNull();
  });

  it('manages products correctly (save, get, delete by code) and rejects duplicates', () => {
    expect(getProducts()).toEqual([]);

    const p1 = { code: 'IT-2026-001', name: 'Workstation 1', category: 'Information Technology', year: '2026', addedAt: '2026-09-26' };
    const res1 = saveProduct(p1);
    expect(res1.success).toBe(true);
    expect(getProducts()).toEqual([p1]);

    // Reject duplicate code (case-insensitive) without altering catalog
    const dupRes = saveProduct({ code: 'it-2026-001', name: 'Workstation Duplicate', category: 'Information Technology', year: '2026', addedAt: '2026-09-26' });
    expect(dupRes.success).toBe(false);
    expect(dupRes.error).toBe('DUPLICATE_CODE');
    expect(getProducts()).toHaveLength(1);
    expect(getProducts()[0].name).toBe('Workstation 1');

    const p2 = { code: 'NW-2026-118', name: 'Router', category: 'Network Infrastructure', year: '2026', addedAt: '2026-09-26' };
    const res2 = saveProduct(p2);
    expect(res2.success).toBe(true);
    expect(getProducts()).toHaveLength(2);

    deleteProduct('IT-2026-001');
    expect(getProducts()).toEqual([p2]);
  });

  it('exports DEFAULT_PRODUCTS adhering to minimalist schema { code, name, category, year, addedAt }', () => {
    expect(DEFAULT_PRODUCTS).toBeDefined();
    expect(Array.isArray(DEFAULT_PRODUCTS)).toBe(true);
    expect(DEFAULT_PRODUCTS.length).toBeGreaterThan(0);
    DEFAULT_PRODUCTS.forEach(p => {
      expect(p).toHaveProperty('code');
      expect(p).toHaveProperty('name');
      expect(p).toHaveProperty('category');
      expect(p).toHaveProperty('year');
      expect(p).toHaveProperty('addedAt');
      expect(p.id).toBeUndefined();
    });
  });

  it('uses dfa_product_catalog_v2 cache storage key', () => {
    expect(STORAGE_KEYS.CATALOG).toBe('dfa_product_catalog_v2');
  });

  it('manages validation logs, blocks duplicates, and truncates to limit', () => {
    expect(getLogs()).toEqual([]);

    saveValidationLog({ id: 1, input: 'IT-2026-001', isValid: true, state: 'q11', time: '10:00:00' });
    expect(getLogs()).toHaveLength(1);

    // Attempting to log a duplicate entry is blocked
    saveValidationLog({ id: 2, input: 'IT-2026-001', isValid: true, state: 'q11', time: '10:00:01' });
    expect(getLogs()).toHaveLength(1);

    for (let i = 2; i <= 105; i++) {
      saveValidationLog({ id: i, input: `NW-2026-${String(i).padStart(3, '0')}`, isValid: true, state: 'q11', time: '10:00:00' });
    }

    const logs = getLogs();
    expect(logs).toHaveLength(100);

    // Block duplicate of existing log
    saveValidationLog({ id: 9999, input: 'NW-2026-002', isValid: true, state: 'q11', time: '10:00:00' });
    expect(getLogs()).toHaveLength(100);

    // Test custom limit parameter with unique input
    saveValidationLog({ id: 999, input: 'OF-2026-999', isValid: true, state: 'q11', time: '10:00:00' }, 50);
    expect(getLogs()).toHaveLength(50);

    clearLogs();
    expect(getLogs()).toEqual([]);
  });

  it('manages theme setting', () => {
    expect(getTheme()).toBe('dark');
    setTheme('light');
    expect(getTheme()).toBe('light');
  });

  it('manages academic disclaimer acknowledgment setting', () => {
    expect(isDisclaimerAcknowledged()).toBe(false);
    setDisclaimerAcknowledged(true);
    expect(isDisclaimerAcknowledged()).toBe(true);
    setDisclaimerAcknowledged(false);
    expect(isDisclaimerAcknowledged()).toBe(false);
  });
});
