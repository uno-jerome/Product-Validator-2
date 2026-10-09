export const STORAGE_KEYS = {
  CATALOG: 'dfa_product_catalog_v2',
  LOGS: 'automata_logs',
  THEME: 'automata_theme',
  DISCLAIMER: 'ccautoma_demo_acknowledged'
};

export const DEFAULT_PRODUCTS = [
  { code: 'IT-2026-001', name: 'Enterprise Workstation Base Series (2026)', category: 'Information Technology', year: '2026', addedAt: '2026-09-26T10:00:00.000Z' },
  { code: 'EL-2026-001', name: 'Modular Power Supply Base Series (2026)', category: 'Electronics & Power', year: '2026', addedAt: '2026-09-26T10:05:00.000Z' },
  { code: 'PR-2026-001', name: 'Mechanical Keyboard Base Series (2026)', category: 'Peripherals & Accessories', year: '2026', addedAt: '2026-09-26T10:10:00.000Z' },
  { code: 'NW-2026-118', name: 'Core Router Base Series (2026)', category: 'Network Infrastructure', year: '2026', addedAt: '2026-09-26T10:15:00.000Z' },
  { code: 'OF-2026-001', name: 'Ergonomic Desk Base Series (2026)', category: 'Office Furniture', year: '2026', addedAt: '2026-09-26T10:20:00.000Z' }
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

export const findProduct = (code) => {
  if (!code || typeof code !== 'string') return null;
  const normalized = code.trim().toUpperCase();
  return getProducts().find(p => p.code.toUpperCase() === normalized) || null;
};

export const saveProduct = (product) => {
  const current = getProducts();
  const normalizedCode = product.code.trim().toUpperCase();
  const exists = current.some(p => p.code.toUpperCase() === normalizedCode);
  if (exists) {
    return { success: false, error: 'DUPLICATE_CODE' };
  }
  const newProduct = {
    code: normalizedCode,
    name: product.name.trim(),
    category: product.category || 'Unassigned Category',
    year: String(product.year || ''),
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

export const isDisclaimerAcknowledged = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.DISCLAIMER) === 'true';
  } catch {
    return false;
  }
};

export const setDisclaimerAcknowledged = (acknowledged = true) => {
  try {
    localStorage.setItem(STORAGE_KEYS.DISCLAIMER, acknowledged ? 'true' : 'false');
  } catch {}
};
