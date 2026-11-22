export interface GstClassification {
  code: string;
  description: string;
  type: 'HSN' | 'SAC';
  gstRate: number;
  category: string;
  defaultUnit: string;
  defaultRate?: number;
}

export const GST_CLASSIFICATIONS: GstClassification[] = [
  {
    code: '39169090',
    description: 'PLA / ABS / PETG / TPU 3D Printing Filament Resale',
    type: 'HSN',
    gstRate: 18,
    category: 'Filament resale',
    defaultUnit: 'Spool',
    defaultRate: 950,
  },
  {
    code: '998920',
    description: '3D Printing Service – Customer Supplied Filament',
    type: 'SAC',
    gstRate: 18,
    category: 'Customer filament printing',
    defaultUnit: 'Hour',
    defaultRate: 60,
  },
  {
    code: '998391',
    description: '3D Modelling / CAD Design Services',
    type: 'SAC',
    gstRate: 18,
    category: 'CAD / 3D modelling',
    defaultUnit: 'Hour',
    defaultRate: 1200,
  },
  {
    code: '39269099',
    description: 'Plastic Keychains / General Custom Plastic Parts',
    type: 'HSN',
    gstRate: 18,
    category: 'Keychains / custom plastic parts',
    defaultUnit: 'Nos',
    defaultRate: 75,
  },
  {
    code: '39264099',
    description: 'Plastic Home Decor / Ornamental Products',
    type: 'HSN',
    gstRate: 18,
    category: 'Home decor / ornamental items',
    defaultUnit: 'Nos',
    defaultRate: 650,
  },
  {
    code: '39249090',
    description: 'Plastic Household Utility Articles',
    type: 'HSN',
    gstRate: 18,
    category: 'Household utility articles',
    defaultUnit: 'Nos',
    defaultRate: 250,
  },
];

export function getClassificationByCode(code?: string | null): GstClassification | undefined {
  if (!code) return undefined;
  const clean = code.trim().replace(/\s+/g, '');
  return GST_CLASSIFICATIONS.find((c) => c.code === clean);
}

export function detectHsnSacType(code?: string | null): 'HSN' | 'SAC' | null {
  if (!code) return null;
  const clean = code.trim().replace(/\s+/g, '');
  const found = getClassificationByCode(clean);
  if (found) return found.type;
  if (clean.startsWith('99')) return 'SAC';
  if (/^[0-9]{2,8}$/.test(clean)) return 'HSN';
  return null;
}
