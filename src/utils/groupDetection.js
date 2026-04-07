const ADDITIVE_CATEGORIES = new Set(['01', '50', '52', 'FN', 'PL', 'CU', 'LG', 'CS']);

export function detectGroups(categories) {
  const groups = {};

  for (const cat of categories) {
    if (ADDITIVE_CATEGORIES.has(cat.code)) continue;

    const baseGroups = {};
    for (const item of cat.items) {
      if (item.isStandard || item.priceBlank) continue;
      const lastHyphen = item.optionCode.lastIndexOf('-');
      if (lastHyphen === -1) continue;
      const base = item.optionCode.substring(0, lastHyphen);

      if (!baseGroups[base]) baseGroups[base] = [];
      baseGroups[base].push(item);
    }

    groups[cat.code] = {};
    for (const [base, items] of Object.entries(baseGroups)) {
      if (items.length >= 4) {
        groups[cat.code][base] = items;
      }
    }
  }
  return groups;
}

export function getGroupForItem(groups, categoryCode, item) {
  if (!groups[categoryCode]) return null;
  const lastHyphen = item.optionCode.lastIndexOf('-');
  if (lastHyphen === -1) return null;
  const base = item.optionCode.substring(0, lastHyphen);
  return groups[categoryCode][base] || null;
}

export function getGroupBase(optionCode) {
  const lastHyphen = optionCode.lastIndexOf('-');
  if (lastHyphen === -1) return optionCode;
  return optionCode.substring(0, lastHyphen);
}

export function isAdditiveCategory(code) {
  return ADDITIVE_CATEGORIES.has(code);
}
