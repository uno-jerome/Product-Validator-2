const KEYS = { PRODUCTS: 'automata_products', LOGS: 'automata_logs' };

const get = (key) => {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
};
const set = (key, data) => localStorage.setItem(key, JSON.stringify(data));

export const getProducts = () => get(KEYS.PRODUCTS);
export const saveProduct = (item) => {
  const list = [item, ...getProducts()];
  set(KEYS.PRODUCTS, list);
  return list;
};
export const deleteProduct = (id) => {
  const list = getProducts().filter(p => p.id !== id);
  set(KEYS.PRODUCTS, list);
  return list;
};

export const getLogs = () => get(KEYS.LOGS);
export const saveLog = (log) => {
  const list = [log, ...getLogs()].slice(0, 30);
  set(KEYS.LOGS, list);
  return list;
};
export const clearAll = () => { localStorage.clear(); };
