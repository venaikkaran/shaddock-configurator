const ADDITIVE_CATEGORIES = new Set(['01', '50', '52', 'FN', 'PL', 'CU', 'LG', 'CS', '20', '60']);

// Base codes that are always additive (room-dispatch or independent adds), never radio
const FORCE_ADDITIVE_BASES = new Set([
  // Mirrors - room-dispatch (one per bathroom)
  '880.1000',
  // Cabinets - all independent adds
  '600.1000',
  // Frameless shower - primary + addons
  '882.1000',
  // Garage door accessories mixed with styles
  '360.1000',
  // Towel bar/ring/holder per-unit purchases
  '760.7500',
  // Door additions (additive, not exclusive)
  'STR.9510',
]);

// Base codes that look additive by the heuristic but are genuinely radio
const FORCE_RADIO_BASES = new Set([
  // Bath fixture packages (pick one per bathroom)
  'PLB.1010', 'PLB.1012', 'PLB.1020', 'PLB.1030', 'PLB.1040',
  'PLB.1050', 'PLB.1060', 'PLB.1070', 'PLB.1080', 'PLB.1082',
  'PLB.1085', 'PLB.1090', 'PLB.10JJ', 'PLB.1100', 'PLB.1110',
  'PLB.1120', 'PLB.1130',
  // Shower heads, tub fillers, faucet upgrades
  '180.3005', '180.3010', '180.3015', '180.3020', '180.3080',
  // Kitchen faucets
  '182.3025', 'PLB.1250',
  // Pot fillers
  '180.3000', 'PLB.1200',
  // Soap dispensers, disposal buttons, bar/utility faucets
  '182.3000', '182.3005', '182.3050', '182.3055',
  // Tub upgrades
  '872.9000',
  // Appliance packages
  '920.0301',
  // Front door styles (by width)
  '340.3080', '340.3680', '340.6080',
  // Interior door styles
  '670.9000',
  // Stair systems/railings/treads
  '690.1005', '690.2000', '690.8000',
  // Door hardware
  '760.0000', '760.0025', '760.0050',
  // Fireplace mantel models (caststone)
  '860.2200',
  // Paint cabinet color
  '741.1000',
]);

// Detect if a group is room-dispatch (same upgrade offered per room, not mutually exclusive)
function isRoomDispatchGroup(items) {
  if (items.length < 3) return false;
  // Room-dispatch groups typically have all the same price
  const prices = items.filter(i => i.price != null && i.price > 0).map(i => i.price);
  if (prices.length < 2) return false;
  const allSamePrice = prices.every(p => p === prices[0]);
  if (allSamePrice) return true;
  // Also check for room keywords in descriptions
  const roomKeywords = /\b(bath\s*\d|bedroom\s*#?\d|master|jr\s*master|powder|guest|kitchen|study|living|dining|family|game|media|entry|stair|loft|utility|laundry)\b/i;
  const roomMatches = items.filter(i => roomKeywords.test(i.description));
  return roomMatches.length >= items.length * 0.6;
}

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
      // Skip explicitly additive bases
      if (FORCE_ADDITIVE_BASES.has(base)) continue;

      // Include explicitly radio bases regardless of count
      if (FORCE_RADIO_BASES.has(base)) {
        groups[cat.code][base] = items;
        continue;
      }

      // Default heuristic: 4+ items, but skip room-dispatch groups
      if (items.length >= 4 && !isRoomDispatchGroup(items)) {
        groups[cat.code][base] = items;
      }
    }
  }
  return groups;
}

// Cross-group mutual exclusions: groups of base codes where selecting from one
// should deselect from others (e.g., you can't have both brick AND stone surround)
export const CROSS_GROUP_EXCLUSIONS = [
  {
    label: 'Fireplace Surround Material',
    categoryCode: 'FS',
    groups: [
      { label: 'Brick Surround', bases: ['480.1002'] },
      { label: 'Stone Surround', bases: ['483.1002'] },
      { label: 'Tile Surround', bases: ['860.1001', '860.1002', '860.1003', '860.1004', '860.1005', '860.1006', '860.1007', '860.1008', '860.1009', '860.1010'] },
    ],
  },
  {
    label: 'Front Door Type',
    categoryCode: 'DO',
    groups: [
      { label: "3'0\" Front Door", bases: ['340.3080'] },
      { label: "3'6\" Front Door", bases: ['340.3680'] },
      { label: "6'0\" Double Front Door", bases: ['340.6080'] },
      { label: 'Iron Front Door', bases: ['341.1001', '341.1002', '341.1003', '341.1004', '341.1005', '341.1006', '341.1007', '341.1008', '341.1009', '341.1010', '341.1011'] },
    ],
  },
  {
    label: 'Kitchen Faucet',
    categoryCode: 'FT',
    groups: [
      { label: 'Kitchen Faucet (Standard Line)', bases: ['182.3025'] },
      { label: 'Kitchen Faucet (Premium Line)', bases: ['PLB.1250'] },
    ],
  },
  {
    label: 'Pot Filler',
    categoryCode: 'FT',
    groups: [
      { label: 'Pot Filler (Standard)', bases: ['180.3000'] },
      { label: 'Pot Filler (Artesso)', bases: ['PLB.1200'] },
    ],
  },
  {
    label: 'Fireplace Mantel Type',
    categoryCode: 'FP',
    groups: [
      { label: 'Cast Stone Mantel', bases: ['694.1000'] },
      { label: 'Wood Mantel', bases: ['860.2200'] },
    ],
  },
];

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
