export const CLOSED_CATEGORIES = {
  IT: { category: 'Information Technology', baseName: 'Enterprise Workstation' },
  EL: { category: 'Electronics & Power', baseName: 'Modular Power Supply' },
  OF: { category: 'Office Furniture', baseName: 'Ergonomic Desk' },
  NW: { category: 'Network Infrastructure', baseName: 'Core Router' },
  PR: { category: 'Peripherals & Accessories', baseName: 'Mechanical Keyboard' }
};

export function resolveProductMetadata(code) {
  if (!code || code.length !== 11) return null;

  const prefix = code.slice(0, 2);
  const year = code.slice(3, 7);
  const serialRaw = code.slice(8, 11);
  const serial = parseInt(serialRaw, 10);

  const matched = CLOSED_CATEGORIES[prefix] || {
    category: 'Unassigned Category',
    baseName: 'Standard Asset'
  };

  let tier = 'Base Series';
  if (serial >= 200 && serial <= 599) tier = 'Pro Edition';
  if (serial >= 600) tier = 'Enterprise Ultra';

  return {
    code,
    name: `${matched.baseName} ${tier} (${year})`,
    category: matched.category,
    year,
    serial: serialRaw,
    isStandardCategory: Boolean(CLOSED_CATEGORIES[prefix])
  };
}
