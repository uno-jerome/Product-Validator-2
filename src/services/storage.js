const KEYS = { PRODUCTS: 'automata_products', LOGS: 'automata_logs', THEME: 'automata_theme' };

const get = (key) => {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
};
const set = (key, val) => localStorage.setItem(key, JSON.stringify(val));

export const getProducts = () => get(KEYS.PRODUCTS);
export const saveProduct = (product) => {
  const updated = [product, ...getProducts().filter(p => p.code !== product.code)];
  set(KEYS.PRODUCTS, updated);
  return updated;
};
export const deleteProduct = (code) => {
  const updated = getProducts().filter(p => p.code !== code);
  set(KEYS.PRODUCTS, updated);
  return updated;
};

export const getLogs = () => get(KEYS.LOGS);
export const saveLog = (entry) => {
  const updated = [entry, ...getLogs()].slice(0, 30);
  set(KEYS.LOGS, updated);
  return updated;
};
export const clearLogs = () => {
  set(KEYS.LOGS, []);
  return [];
};

export const getTheme = () => localStorage.getItem(KEYS.THEME) || 'dark';
export const setTheme = (theme) => localStorage.setItem(KEYS.THEME, theme);
