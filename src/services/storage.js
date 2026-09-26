export const STORAGE_KEYS = {
  CATALOG: 'dfa_product_catalog_v2',
  LOGS: 'automata_logs',
  THEME: 'automata_theme'
};

export const DEFAULT_PRODUCTS = [
  { id: 'prod-1', code: 'IT-2026-001', name: 'Enterprise Workstation', addedAt: '2026-09-26T10:00:00.000Z' },
  { id: 'prod-2', code: 'EL-2026-001', name: 'Modular Power Supply', addedAt: '2026-09-26T10:05:00.000Z' },
  { id: 'prod-3', code: 'PR-2026-001', name: 'Mechanical Keyboard', addedAt: '2026-09-26T10:10:00.000Z' },
  { id: 'prod-4', code: 'NW-2026-118', name: 'Core Router', addedAt: '2026-09-26T10:15:00.000Z' },
  { id: 'prod-5', code: 'OF-2026-001', name: 'Ergonomic Desk', addedAt: '2026-09-26T10:20:00.000Z' }
];

const get = (key) => {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
};
const save = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
  return data;
};

export const getProducts = () => get(STORAGE_KEYS.CATALOG);

export const saveProduct = (product) => {
  const current = getProducts();
  const normalizedCode = product.code.trim().toUpperCase();
  const exists = current.some(p => p.code.toUpperCase() === normalizedCode);
  if (exists) {
    return { success: false, error: 'DUPLICATE_CODE' };
  }
  const newProduct = {
    id: product.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    code: normalizedCode,
    name: product.name.trim(),
    addedAt: product.addedAt || new Date().toISOString()
  };
  const updated = [newProduct, ...current];
  save(STORAGE_KEYS.CATALOG, updated);
  return { success: true, data: updated };
};

export const deleteProduct = (code) =>
  save(STORAGE_KEYS.CATALOG, getProducts().filter(p => p.code.toUpperCase() !== code.toUpperCase()));

export const getLogs = () => get(STORAGE_KEYS.LOGS);
export const saveValidationLog = (entry, maxLimit = 100) => {
  const current = getLogs();
  if (current.some(l => l.input === entry.input)) {
    return current;
  }
  return save(STORAGE_KEYS.LOGS, [entry, ...current].slice(0, maxLimit));
};
export const clearLogs = () => save(STORAGE_KEYS.LOGS, []);

export const getTheme = () => localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
export const setTheme = (theme) => localStorage.setItem(STORAGE_KEYS.THEME, theme);
