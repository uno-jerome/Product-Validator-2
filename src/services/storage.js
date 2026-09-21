const KEYS = { PRODUCTS: 'automata_products', LOGS: 'automata_logs', THEME: 'automata_theme' };

const get = (key) => {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
};
const set = (key, val) => localStorage.setItem(key, JSON.stringify(val));

const save = (key, data) => { set(key, data); return data; };

export const getProducts = () => get(KEYS.PRODUCTS);
export const saveProduct = (product) => save(KEYS.PRODUCTS, [product, ...getProducts().filter(p => p.code !== product.code)]);
export const deleteProduct = (code) => save(KEYS.PRODUCTS, getProducts().filter(p => p.code !== code));

export const getLogs = () => get(KEYS.LOGS);
export const saveLog = (entry) => save(KEYS.LOGS, [entry, ...getLogs()].slice(0, 30));
export const clearLogs = () => save(KEYS.LOGS, []);

export const getTheme = () => localStorage.getItem(KEYS.THEME) || 'dark';
export const setTheme = (theme) => localStorage.setItem(KEYS.THEME, theme);

