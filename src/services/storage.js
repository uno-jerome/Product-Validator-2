const KEYS = { PRODUCTS: 'automata_products', LOGS: 'automata_logs', THEME: 'automata_theme' };

const get = (key) => {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
};
const set = (key, val) => localStorage.setItem(key, JSON.stringify(val));

const save = (key, data) => { set(key, data); return data; };

export const getProducts = () => get(KEYS.PRODUCTS);
export const saveProduct = (product) => {
  const current = getProducts();
  const exists = current.some(p => p.code.toUpperCase() === product.code.toUpperCase());
  if (exists) {
    return { success: false, error: 'DUPLICATE_CODE' };
  }
  const updated = [product, ...current];
  save(KEYS.PRODUCTS, updated);
  return { success: true, data: updated };
};
export const deleteProduct = (code) => save(KEYS.PRODUCTS, getProducts().filter(p => p.code !== code));

export const getLogs = () => get(KEYS.LOGS);
export const saveValidationLog = (entry, maxLimit = 100) => {
  const current = getLogs();
  if (current.some(l => l.input === entry.input)) {
    return current;
  }
  return save(KEYS.LOGS, [entry, ...current].slice(0, maxLimit));
};
export const clearLogs = () => save(KEYS.LOGS, []);

export const getTheme = () => localStorage.getItem(KEYS.THEME) || 'dark';
export const setTheme = (theme) => localStorage.setItem(KEYS.THEME, theme);

