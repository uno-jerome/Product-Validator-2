import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getProducts,
  saveProduct,
  deleteProduct,
  getLogs,
  saveLog,
  clearLogs,
  getTheme,
  setTheme
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

  it('manages products correctly (save, get, delete by code)', () => {
    expect(getProducts()).toEqual([]);

    const p1 = { code: 'IT-2026-001', category: 'IT', name: 'Workstation 1' };
    saveProduct(p1);
    expect(getProducts()).toEqual([p1]);

    // Upsert / overwrite code if exists
    const p1Updated = { code: 'IT-2026-001', category: 'IT', name: 'Workstation Pro' };
    saveProduct(p1Updated);
    expect(getProducts()).toHaveLength(1);
    expect(getProducts()[0].name).toBe('Workstation Pro');

    const p2 = { code: 'NW-2026-118', category: 'NW', name: 'Router' };
    saveProduct(p2);
    expect(getProducts()).toHaveLength(2);

    deleteProduct('IT-2026-001');
    expect(getProducts()).toEqual([p2]);
  });

  it('manages validation logs and truncates to 30 items', () => {
    expect(getLogs()).toEqual([]);

    saveLog({ id: 1, input: 'IT-2026-001', isValid: true, state: 'q11', time: '10:00:00' });
    expect(getLogs()).toHaveLength(1);

    for (let i = 2; i <= 35; i++) {
      saveLog({ id: i, input: `NW-2026-${String(i).padStart(3, '0')}`, isValid: true, state: 'q11', time: '10:00:00' });
    }

    const logs = getLogs();
    expect(logs).toHaveLength(30);

    clearLogs();
    expect(getLogs()).toEqual([]);
  });

  it('manages theme setting', () => {
    expect(getTheme()).toBe('dark');
    setTheme('light');
    expect(getTheme()).toBe('light');
  });
});
