/**
 * roomMapping.js — Maps options.json items into room-based sections
 *
 * Takes the flat trade-based categories and re-indexes them by room/zone.
 * Items are NOT duplicated — each item appears in exactly one room section.
 * Selection keys remain identical so state is shared between views.
 *
 * Output: Array of room sections, each containing sub-groups by trade category.
 */

import { getSelectionKey } from './selectionKey';

// ── Room Definitions ──────────────────────────────────────────────────────

const ROOM_DEFS = [
  {
    id: 'master-suite',
    name: 'Master Suite',
    description: 'Master Bath, Bedroom & Closets',
    wholeCats: ['18'], // Master Bath Tub Upgrades
    patterns: [
      /\bmaster\s*bath/i,
      /\bmaster\s*tub/i,
      /\bmaster\s*shower/i,
      /\bmaster\s*closet/i,
      /\bmaster\s*bed/i,
      /\bmaster\s*mud\s*pan/i,
      /\bmstr\b/i,
      // Category 53 patterns for master
      /tile[:\s]*master/i,
      /master.*surround/i,
      /master.*tile/i,
      /master.*splash/i,
      /master.*skirt/i,
      /master.*deck/i,
    ],
    // Exclude "Jr Master" (handled separately)
    excludePatterns: [/\bjr\.?\s*master/i],
  },
  {
    id: 'jr-master',
    name: 'Jr Master Suite',
    description: 'Junior Master Bath & Bedroom',
    patterns: [/\bjr\.?\s*master/i],
    // Check BEFORE master-suite since "Jr Master" contains "Master"
    priority: true,
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    description: 'Cabinets, Counters, Backsplash, Sink, Faucets, Appliances & Flooring',
    wholeCats: ['AP', 'BS'], // Appliances, Backsplash
    patterns: [
      /\bkitchen\b/i,
      /\bkitchenette\b/i,
      /\bpantry\b/i,
      /\bnook\b/i,
      /\bisland\b/i,
      /\bkitchen\s*perimeter/i,
      /\brange\s*hood/i,
      /\bgarbage\s*disposal/i,
      /\bpot\s*filler/i,
      /\bcasual\s*dining/i,
      /\bapron[\s-]*front/i, // Farmhouse apron-front sinks are kitchen items
      /\bfarmhouse\b/i,      // Farmhouse sinks → kitchen
    ],
  },
  {
    id: 'bath-2',
    name: 'Bath 2',
    description: 'Secondary Bathroom 2',
    patterns: [/\bbath\s*2\b/i, /\bbath\s*#2\b/i],
    excludePatterns: [/\bpowder\s*bath/i, /\bpool\s*bath/i],
  },
  {
    id: 'bath-3',
    name: 'Bath 3',
    description: 'Secondary Bathroom 3',
    patterns: [/\bbath\s*3\b/i, /\bbath\s*#3\b/i],
    excludePatterns: [/\bpowder\s*bath/i, /\bpool\s*bath/i],
  },
  {
    id: 'bath-4',
    name: 'Bath 4',
    description: 'Secondary Bathroom 4',
    patterns: [/\bbath\s*4\b/i, /\bbath\s*#4\b/i],
    excludePatterns: [/\bpowder\s*bath/i, /\bpool\s*bath/i],
  },
  {
    id: 'bath-5',
    name: 'Bath 5',
    description: 'Secondary Bathroom 5',
    patterns: [/\bbath\s*5\b/i, /\bbath\s*#5\b/i],
    excludePatterns: [/\bpowder\s*bath/i, /\bpool\s*bath/i],
  },
  {
    id: 'bath-6',
    name: 'Bath 6',
    description: 'Secondary Bathroom 6',
    patterns: [/\bbath\s*6\b/i, /\bbath\s*#6\b/i],
    excludePatterns: [/\bpowder\s*bath/i, /\bpool\s*bath/i],
  },
  {
    id: 'bath-7',
    name: 'Bath 7',
    description: 'Secondary Bathroom 7',
    patterns: [/\bbath\s*7\b/i, /\bbath\s*#7\b/i],
    excludePatterns: [/\bpowder\s*bath/i, /\bpool\s*bath/i],
  },
  {
    id: 'guest-bath',
    name: 'Guest & Powder Bath',
    description: 'Guest Bath, Powder Bath & Pool Bath',
    patterns: [
      /\bguest\s*bath/i,
      /\bpowder\s*bath/i,
      /\bpowder\b/i,
      /\bpwdr\b/i,
      /\bpool\s*bath/i,
    ],
  },
  {
    id: 'jack-jill',
    name: 'Jack & Jill Bath',
    description: 'Jack and Jill / Secondary Bath',
    patterns: [
      /\bjack\s*and\s*jill/i,
      /\bjack\s*&\s*jill/i,
      /\bsecondary\s*bath/i,
    ],
  },
  {
    id: 'fireplace',
    name: 'Fireplace',
    description: 'Mantel, Surround & Firebox',
    wholeCats: ['FP', 'FS'], // Fireplace Mantel, Fireplace Surround
    patterns: [/\bfireplace/i, /\bmantel/i, /\bfirebox/i, /\bfirepit/i, /\bfire\s*pit/i],
  },
  {
    id: 'living-dining',
    name: 'Living & Dining',
    description: 'Family Room, Dining Room & Common Areas',
    patterns: [
      /\bfamily\s*room/i,
      /\bliving\s*room/i,
      /\bdining\b/i,
      /\bfamily\s*center/i,
    ],
  },
  {
    id: 'gameroom-media',
    name: 'Gameroom & Media',
    description: 'Gameroom, Media Room & Bar/Wetbar',
    patterns: [
      /\bgame\s*room/i,
      /\bmedia\s*room/i,
      /\bgameroom/i,
      /\b(?:wet\s*bar|bar\s*sink|bar\s*faucet|bar\s*\/\s*wet)/i, // only actual bar/wetbar references
      /\bwetbar\b/i,
      /\bcasita\b/i,
      /\bflex\s*room/i,
    ],
  },
  {
    id: 'bedrooms',
    name: 'Bedrooms',
    description: 'Bedrooms 2-7 Flooring & Finishes',
    patterns: [
      /\bbedroom\s*#?\s*[2-7]/i,
      /\bbed\s*#?\s*[2-7]/i,
    ],
  },
  {
    id: 'entry-stairs',
    name: 'Entry & Stairs',
    description: 'Entry, Foyer, Hallways & Staircase',
    wholeCats: ['70'], // Stairs
    patterns: [
      /\bentry\b/i,
      /\bfoyer\b/i,
      /\bhallway/i,
      /\bstair/i,
      /\bunder\s*stairs/i,
      /\bextended\s*entry/i,
    ],
    // "Family Foyer" goes to laundry-mudroom, not entry-stairs
    excludePatterns: [/\bfamily\s*foyer/i],
  },
  {
    id: 'study-office',
    name: 'Study & Office',
    description: 'Study, Home Office',
    patterns: [
      /\bstudy\b/i,
      /\boffice\b/i,
    ],
  },
  {
    id: 'laundry-mudroom',
    name: 'Laundry & Mud Room',
    description: 'Laundry, Utility Room & Mud Room',
    patterns: [
      /\blaundry/i,
      /\butility\b/i,
      /\butilitly/i, // typo in data
      /\bmudroom/i,
      /\bmud\s*room/i,
      /\bfamily\s*foyer/i,
    ],
    // Exclude "Master Mud Pan" which should go to master suite
    excludePatterns: [/\bmaster\s*mud/i],
  },
  {
    id: 'exterior',
    name: 'Exterior',
    description: 'Masonry, Paint, Roof, Windows, Insulation & Front Door',
    wholeCats: ['MS', 'PE', 'RO', 'WD', 'IN'], // Masonry, Paint Exterior, Roofing, Windows, Insulation
    patterns: [
      /\bexterior\b/i,
      /\bfront\s*(?:door|porch|elevation|of\s*house)/i,
      /\biron\s*front/i,
      /\bext\s*stds/i,
      /\bstucco/i,
      /\bbrick\b/i,
      /\bmortar/i,
      /\bstone\b(?!.*counter)/i, // stone but not countertop stone
      /\bshingle/i,
      /\bgutter/i,
      /\binsulation/i,
      /\bencapsulation/i,
      /\bobscure\s*glass/i,
      /\brain\s*glass/i,
      /\bwindow\s*(?:upgrade|glass|obscure|rain)/i,
    ],
  },
  {
    id: 'garage-driveway',
    name: 'Garage & Driveway',
    description: 'Garage Doors, Driveway & Flatwork',
    wholeCats: ['36'], // Garage Doors
    patterns: [
      /\bgarage\b/i,
      /\bdriveway/i,
      /\bcity\s*walk/i,
      /\blead\s*walk/i,
      /\bapproach\b/i,
      /\bac\s*pad/i,
    ],
  },
  {
    id: 'outdoor',
    name: 'Outdoor',
    description: 'Patio, Fence, Swimming Pool',
    wholeCats: ['FN', 'CS'], // Fence, Swimming Pool
    patterns: [
      /\bpatio\b/i,
      /\bcovered\s*patio/i,
      /\bfence/i,
      /\bpool\b(?!\s*bath)/i, // "pool" but not "pool bath"
      /\bswimming/i,
      /\bhose\s*bibb/i,
    ],
  },
];

// Categories that go entirely to "Whole House" (no room detection needed)
const WHOLE_HOUSE_CATS = new Set(['DR', 'LG', '50', '52', 'PL']);

// Categories where items should be individually matched to rooms
// (not listed as wholeCats for any room and not in WHOLE_HOUSE_CATS)
// These will be checked per-item against all room patterns

// ── Room Detection ────────────────────────────────────────────────────────

/**
 * Determine which room an item belongs to.
 * Returns room ID or null (for "Whole House").
 */
function detectRoom(item, categoryCode) {
  const desc = item.description || '';

  // Priority rooms first (e.g., "Jr Master" before "Master")
  const priorityRooms = ROOM_DEFS.filter(r => r.priority);
  for (const room of priorityRooms) {
    if (room.patterns?.some(p => p.test(desc))) {
      return room.id;
    }
  }

  // Check non-priority rooms
  for (const room of ROOM_DEFS) {
    if (room.priority) continue;

    // Check exclude patterns first
    if (room.excludePatterns?.some(p => p.test(desc))) continue;

    // Check if any pattern matches
    if (room.patterns?.some(p => p.test(desc))) {
      return room.id;
    }
  }

  return null; // Whole House
}

/**
 * Determine the sub-group label for an item within a room.
 * This is the trade-category name, which helps users understand
 * what type of decision they're making.
 */
function getSubgroupLabel(categoryCode, categoryName) {
  // Shorten some long category names for sub-group headings
  const SHORT_NAMES = {
    '18': 'Tub Upgrades',
    '20': 'Mirrors & Showers',
    '53': 'Tile Surrounds',
    '60': 'Cabinet Options',
    '61': 'Cabinet Additions',
    '65': 'Hardware & Accessories',
    '67': 'Sink Options',
    '70': 'Stairs',
    'AP': 'Appliances',
    'BF': 'Bath Fixtures',
    'BS': 'Backsplash Tile',
    'CF': 'Carpet',
    'CT': 'Countertops',
    'DO': 'Doors',
    'EF': 'Engineered Wood Floor',
    'FL': 'Floor Tile',
    'FN': 'Fence',
    'FP': 'Fireplace Mantel',
    'FS': 'Fireplace Surround',
    'FT': 'Kitchen & Utility Faucets',
    'IN': 'Insulation',
    'IT': 'Interior Trim',
    'MS': 'Masonry',
    'PE': 'Exterior Paint',
    'PL': 'Plumbing',
    'PT': 'Interior Paint',
    'RO': 'Roofing',
    'WD': 'Windows',
    'WF': 'Hardwood Floor',
  };
  return SHORT_NAMES[categoryCode] || categoryName;
}

// ── Flooring conflict detection ───────────────────────────────────────────

const FLOORING_CATS = new Set(['CF', 'EF', 'FL', 'WF']);

const FLOORING_MATERIAL_LABELS = {
  'CF': 'Carpet',
  'EF': 'Engineered Wood',
  'FL': 'Tile',
  'WF': 'Hardwood',
};

/**
 * Given a room's subgroups, detect if multiple flooring material types
 * are present. Returns a warning message or null.
 */
export function detectFlooringConflicts(selectedItems, roomSubgroups) {
  const selectedFlooring = new Set();
  for (const sg of roomSubgroups) {
    if (!FLOORING_CATS.has(sg.categoryCode)) continue;
    for (const item of sg.items) {
      const key = getSelectionKey(item);
      if (selectedItems[key]?.selected) {
        selectedFlooring.add(sg.categoryCode);
      }
    }
  }
  if (selectedFlooring.size > 1) {
    const materials = [...selectedFlooring].map(c => FLOORING_MATERIAL_LABELS[c] || c);
    return `You have both ${materials.join(' and ')} selected for this room. These are likely mutually exclusive — only one flooring material will be installed. Please verify with your builder.`;
  }
  return null;
}

// ── Main Mapping Function ─────────────────────────────────────────────────

/**
 * Map categories from options.json into room-based sections.
 *
 * @param {Array} categories — The categories array from options.json
 * @returns {Array} Room sections with sub-grouped items
 *
 * Each section:
 * {
 *   id: 'master-suite',
 *   name: 'Master Suite',
 *   description: '...',
 *   subgroups: [
 *     {
 *       label: 'Tub Upgrades',
 *       categoryCode: '18',
 *       categoryName: 'Master Bath Tub Upgrades',
 *       items: [item1, item2, ...]
 *     },
 *     ...
 *   ]
 * }
 */
export function mapItemsToRooms(categories) {
  if (!categories) return [];

  // Build whole-category lookup: which room "owns" each category entirely
  const wholeCatMap = {}; // categoryCode → roomId
  for (const room of ROOM_DEFS) {
    if (room.wholeCats) {
      for (const catCode of room.wholeCats) {
        wholeCatMap[catCode] = room.id;
      }
    }
  }

  // Accumulate items per room per category-subgroup
  // Structure: { roomId: { categoryCode: { items, categoryName } } }
  const roomBuckets = {};
  for (const room of ROOM_DEFS) {
    roomBuckets[room.id] = {};
  }
  roomBuckets['whole-house'] = {};
  roomBuckets['custom-options'] = {};

  for (const cat of categories) {
    // Custom Options → always its own section
    if (cat.code === 'CU') {
      roomBuckets['custom-options'][cat.code] = {
        items: [...cat.items],
        categoryName: cat.name,
      };
      continue;
    }

    // Whole-house categories → all items go there
    if (WHOLE_HOUSE_CATS.has(cat.code)) {
      if (!roomBuckets['whole-house'][cat.code]) {
        roomBuckets['whole-house'][cat.code] = { items: [], categoryName: cat.name };
      }
      roomBuckets['whole-house'][cat.code].items.push(...cat.items);
      continue;
    }

    // Whole-category mapping to a specific room
    if (wholeCatMap[cat.code]) {
      const roomId = wholeCatMap[cat.code];
      if (!roomBuckets[roomId][cat.code]) {
        roomBuckets[roomId][cat.code] = { items: [], categoryName: cat.name };
      }
      roomBuckets[roomId][cat.code].items.push(...cat.items);
      continue;
    }

    // Per-item room detection
    for (const item of cat.items) {
      const roomId = detectRoom(item, cat.code) || 'whole-house';
      if (!roomBuckets[roomId]) {
        roomBuckets[roomId] = {};
      }
      if (!roomBuckets[roomId][cat.code]) {
        roomBuckets[roomId][cat.code] = { items: [], categoryName: cat.name };
      }
      roomBuckets[roomId][cat.code].items.push(item);
    }
  }

  // Build the final sections array
  const sections = [];

  // Add defined rooms (in order)
  for (const room of ROOM_DEFS) {
    const bucket = roomBuckets[room.id];
    if (!bucket || Object.keys(bucket).length === 0) continue;

    const subgroups = [];
    // Sort sub-groups by a sensible order within each room
    const catCodes = Object.keys(bucket);
    catCodes.sort((a, b) => {
      // Use a priority order for common trade categories within a room
      return (SUB_GROUP_ORDER[a] ?? 50) - (SUB_GROUP_ORDER[b] ?? 50);
    });

    for (const catCode of catCodes) {
      const { items, categoryName } = bucket[catCode];
      if (items.length === 0) continue;
      subgroups.push({
        label: getSubgroupLabel(catCode, categoryName),
        categoryCode: catCode,
        categoryName,
        items,
      });
    }

    if (subgroups.length > 0) {
      sections.push({
        id: room.id,
        name: room.name,
        description: room.description,
        subgroups,
      });
    }
  }

  // Add "Whole House" section
  const whBucket = roomBuckets['whole-house'];
  if (whBucket && Object.keys(whBucket).length > 0) {
    const subgroups = [];
    const catCodes = Object.keys(whBucket);
    catCodes.sort((a, b) => (SUB_GROUP_ORDER[a] ?? 50) - (SUB_GROUP_ORDER[b] ?? 50));
    for (const catCode of catCodes) {
      const { items, categoryName } = whBucket[catCode];
      if (items.length === 0) continue;
      subgroups.push({
        label: getSubgroupLabel(catCode, categoryName),
        categoryCode: catCode,
        categoryName,
        items,
      });
    }
    if (subgroups.length > 0) {
      sections.push({
        id: 'whole-house',
        name: 'Whole House',
        description: 'Electrical, AVI, Drywall, Paint, Plumbing, Doors & Global Options',
        subgroups,
      });
    }
  }

  // Add "Custom Options" section
  const cuBucket = roomBuckets['custom-options'];
  if (cuBucket && Object.keys(cuBucket).length > 0) {
    const subgroups = [];
    for (const catCode of Object.keys(cuBucket)) {
      const { items, categoryName } = cuBucket[catCode];
      subgroups.push({
        label: 'Custom Options',
        categoryCode: catCode,
        categoryName,
        items,
      });
    }
    sections.push({
      id: 'custom-options',
      name: 'Custom Options',
      description: 'Builder-Negotiated Custom Additions',
      subgroups,
    });
  }

  return sections;
}

// Priority order for sub-groups within a room (lower = first)
const SUB_GROUP_ORDER = {
  // Structural / big decisions first
  '18': 1,   // Tub Upgrades
  '20': 2,   // Mirrors & Showers
  'BF': 3,   // Bath Fixtures
  '67': 4,   // Sink Upgrades
  '65': 5,   // Hardware & Accessories
  '53': 6,   // Tile Surrounds
  'BS': 7,   // Backsplash
  'CT': 8,   // Countertops
  '60': 9,   // Cabinet Options
  '61': 10,  // Cabinet Additions
  'AP': 11,  // Appliances
  'FT': 12,  // Kitchen/Utility Faucets
  'FP': 13,  // Fireplace Mantel
  'FS': 14,  // Fireplace Surround
  // Flooring last (within a room)
  'CF': 20,  // Carpet
  'FL': 21,  // Floor Tile
  'EF': 22,  // Engineered Wood
  'WF': 23,  // Hardwood
  // Exterior / Structure
  'MS': 30,  // Masonry
  'PE': 31,  // Exterior Paint
  'DO': 32,  // Doors
  'WD': 33,  // Windows
  'RO': 34,  // Roofing
  'IN': 35,  // Insulation
  // Systems
  '50': 40,  // Electrical
  '52': 41,  // AVI
  'PL': 42,  // Plumbing Non-Fixture
  'LG': 43,  // Lighting
  'PT': 44,  // Interior Paint
  'DR': 45,  // Drywall
  'IT': 46,  // Interior Trim
  '70': 47,  // Stairs
  '01': 48,  // Flatwork
  'FN': 49,  // Fence
  'CS': 50,  // Swimming Pool
  '36': 51,  // Garage Doors
};

/**
 * Get total item count and selection stats for a room section.
 * Used by RoomSidebar.
 */
export function getRoomStats(section, selections, customOptions = {}) {
  let totalItems = 0;
  let selectedCount = 0;
  let totalSpend = 0;

  for (const sg of section.subgroups) {
    for (const item of sg.items) {
      totalItems++;
      const key = getSelectionKey(item);
      const sel = selections[key];
      if (sel?.selected) {
        selectedCount++;
        if (item.price != null) {
          totalSpend += item.needsQuantity
            ? item.price * (sel.quantity || 0)
            : item.price;
        }
      }
    }
    // Add custom options
    if (sg.categoryCode === 'CU') {
      for (const [, custom] of Object.entries(customOptions)) {
        if (custom.selected) {
          selectedCount++;
          if (custom.price) totalSpend += custom.price;
        }
      }
    }
  }

  return { totalItems, selectedCount, totalSpend };
}

/**
 * Apply elevation and search filters to room sections.
 * Returns new sections with filtered items (same structure).
 */
export function filterRoomSections(sections, elevation, searchQuery) {
  if (!sections) return [];

  return sections.map(section => {
    const filteredSubgroups = section.subgroups.map(sg => {
      let items = sg.items.map(item => {
        const elevationMismatch = elevation
          && item.elevation !== null
          && item.elevation !== elevation;
        return elevationMismatch ? { ...item, elevationMismatch: true } : item;
      });

      if (searchQuery?.trim()) {
        const q = searchQuery.toLowerCase().trim();
        items = items.filter(item =>
          item.description.toLowerCase().includes(q) ||
          item.optionCode.toLowerCase().includes(q)
        );
      }

      return { ...sg, items };
    }).filter(sg => sg.items.length > 0);

    return { ...section, subgroups: filteredSubgroups };
  }).filter(section => section.subgroups.length > 0);
}

/**
 * Cross-reference notes for rooms.
 * Returns hints like "See also: Whole House > Electrical for outlet additions"
 */
export function getCrossReferences(roomId) {
  const refs = {
    'master-suite': [
      { label: 'Electrical', detail: 'outlet & switch additions', targetRoom: 'whole-house' },
      { label: 'Hardware & Accessories', detail: 'towel bars, door hardware finishes', targetRoom: 'whole-house' },
    ],
    'kitchen': [
      { label: 'Electrical', detail: 'under-cabinet lighting, outlet additions', targetRoom: 'whole-house' },
      { label: 'Lighting', detail: 'additional lighting selections', targetRoom: 'whole-house' },
    ],
    'bath-2': [{ label: 'Hardware & Accessories', detail: 'towel bars & finishes', targetRoom: 'whole-house' }],
    'bath-3': [{ label: 'Hardware & Accessories', detail: 'towel bars & finishes', targetRoom: 'whole-house' }],
    'bath-4': [{ label: 'Hardware & Accessories', detail: 'towel bars & finishes', targetRoom: 'whole-house' }],
    'bath-5': [{ label: 'Hardware & Accessories', detail: 'towel bars & finishes', targetRoom: 'whole-house' }],
    'bath-6': [{ label: 'Hardware & Accessories', detail: 'towel bars & finishes', targetRoom: 'whole-house' }],
    'bath-7': [{ label: 'Hardware & Accessories', detail: 'towel bars & finishes', targetRoom: 'whole-house' }],
    'living-dining': [
      { label: 'Electrical', detail: 'outlet & lighting additions', targetRoom: 'whole-house' },
      { label: 'Fireplace', detail: 'mantel & surround options', targetRoom: 'fireplace' },
    ],
    'exterior': [
      { label: 'Garage & Driveway', detail: 'garage doors & flatwork', targetRoom: 'garage-driveway' },
      { label: 'Outdoor', detail: 'patio, fence & pool', targetRoom: 'outdoor' },
    ],
  };
  return refs[roomId] || [];
}
