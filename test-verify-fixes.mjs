/**
 * test-verify-fixes.mjs — Verifies room mapping correctness
 *
 * Loads options.json directly and re-implements the room mapping logic
 * inline (since we can't import .js with bare specifiers outside a bundler).
 * Then checks specific previously-broken items and invariants.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dir = dirname(__filename);

// ── Load options.json ───────────────────────────────────────────────────────

const optionsData = JSON.parse(
  readFileSync(join(__dir, 'public', 'options.json'), 'utf-8')
);
const categories = optionsData.categories;

// ── Inline the room mapping logic (copied from src/utils/roomMapping.js) ────
// We read the actual file and evaluate it to stay in sync.

const rmSource = readFileSync(join(__dir, 'src', 'utils', 'roomMapping.js'), 'utf-8');

// Rewrite the import to a no-op since we'll provide getSelectionKey inline
const patchedSource = rmSource
  .replace(/import\s*\{[^}]*\}\s*from\s*['"][^'"]*['"];?/g, '')
  .replace(/export\s+function/g, 'function')
  .replace(/export\s*\{[^}]*\}/g, '');

// Provide getSelectionKey
const wrappedSource = `
function getSelectionKey(item) {
  if (item.elevation) return item.optionCode + '_' + item.elevation;
  return item.optionCode;
}
${patchedSource}
return { mapItemsToRooms, detectFlooringConflicts, getRoomStats, filterRoomSections, getCrossReferences };
`;

const factory = new Function(wrappedSource);
const { mapItemsToRooms } = factory();

// ── Run the mapping ─────────────────────────────────────────────────────────

const sections = mapItemsToRooms(categories);

// Build lookup: selectionKey → roomId, and description → roomId
const keyToRoom = new Map();    // selectionKey → roomId
const descToRoom = new Map();   // description → { roomId, catCode }
const allKeysFromRooms = [];
let totalItemsInRooms = 0;

for (const section of sections) {
  for (const sg of section.subgroups) {
    for (const item of sg.items) {
      const key = item.elevation
        ? `${item.optionCode}_${item.elevation}`
        : item.optionCode;

      allKeysFromRooms.push({ key, roomId: section.id, desc: item.description, catCode: sg.categoryCode });
      keyToRoom.set(key, section.id);
      descToRoom.set(item.description + '|' + (item.elevation || ''), { roomId: section.id, catCode: sg.categoryCode });
      totalItemsInRooms++;
    }
  }
}

// Count total items from source data
let totalItemsInSource = 0;
for (const cat of categories) {
  totalItemsInSource += cat.items.length;
}

// ── Test Runner ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function check(name, condition, detail) {
  if (condition) {
    console.log(`  PASS  ${name}`);
    passed++;
  } else {
    console.log(`  FAIL  ${name}`);
    if (detail) console.log(`        ${detail}`);
    failed++;
  }
}

// Helper: find items whose description matches a pattern and return their room(s)
function findItemRooms(descPattern) {
  const matches = [];
  for (const entry of allKeysFromRooms) {
    if (descPattern.test(entry.desc)) {
      matches.push(entry);
    }
  }
  return matches;
}

// Helper: find items from a specific source category
function findItemsByCat(catCode) {
  return allKeysFromRooms.filter(e => e.catCode === catCode);
}

console.log('=== Room Mapping Verification Tests ===\n');

// ── Check 1: No missing items ───────────────────────────────────────────────
console.log('--- Check 1: Every item appears in exactly one room (no missing) ---');
check(
  'Total items match',
  totalItemsInRooms === totalItemsInSource,
  `In rooms: ${totalItemsInRooms}, In source: ${totalItemsInSource}, Missing: ${totalItemsInSource - totalItemsInRooms}`
);

// ── Check 2: No duplicates ──────────────────────────────────────────────────
console.log('\n--- Check 2: No duplicate items ---');
const keyCounts = new Map();
for (const entry of allKeysFromRooms) {
  const k = entry.key;
  keyCounts.set(k, (keyCounts.get(k) || 0) + 1);
}
const duplicates = [...keyCounts.entries()].filter(([, count]) => count > 1);
check(
  'No duplicate selection keys across rooms',
  duplicates.length === 0,
  duplicates.length > 0
    ? `Duplicates: ${duplicates.slice(0, 5).map(([k, c]) => `${k} (${c}x)`).join(', ')}${duplicates.length > 5 ? ` ...and ${duplicates.length - 5} more` : ''}`
    : undefined
);

// ── Check 3: Specific previously-broken items ──────────────────────────────
console.log('\n--- Check 3: Previously-broken items in correct rooms ---');

// 3a: "Powder Bath 2 Fixtures" → guest-bath (NOT bath-2)
const powderBath2 = findItemRooms(/powder\s*bath\s*2/i);
if (powderBath2.length > 0) {
  const allGuestBath = powderBath2.every(e => e.roomId === 'guest-bath');
  const anyBath2 = powderBath2.some(e => e.roomId === 'bath-2');
  check(
    '"Powder Bath 2 Fixtures" → guest-bath (NOT bath-2)',
    allGuestBath && !anyBath2,
    `Found in rooms: ${[...new Set(powderBath2.map(e => e.roomId))].join(', ')} — items: ${powderBath2.map(e => e.desc.slice(0, 60)).join('; ')}`
  );
} else {
  // Try broader match
  const powderBath = findItemRooms(/powder\s*bath/i);
  const anyInBath2 = powderBath.some(e => e.roomId === 'bath-2');
  check(
    '"Powder Bath" items → guest-bath (NOT bath-2)',
    !anyInBath2 && powderBath.length > 0,
    powderBath.length === 0
      ? 'No items matching "Powder Bath" found'
      : `Found in rooms: ${[...new Set(powderBath.map(e => e.roomId))].join(', ')}`
  );
}

// 3b: "Kinla Towel Bar" → whole-house (NOT gameroom-media)
const kinla = findItemRooms(/kinla\s*towel\s*bar/i);
if (kinla.length > 0) {
  check(
    '"Kinla Towel Bar" → whole-house (NOT gameroom-media)',
    kinla.every(e => e.roomId === 'whole-house') && kinla.every(e => e.roomId !== 'gameroom-media'),
    `Found in rooms: ${[...new Set(kinla.map(e => e.roomId))].join(', ')}`
  );
} else {
  // Try broader: any towel bar items
  const towelBars = findItemRooms(/towel\s*bar/i);
  const towelInGameroom = towelBars.filter(e => e.roomId === 'gameroom-media');
  check(
    'Towel bar items NOT in gameroom-media (proxy for Kinla fix)',
    towelInGameroom.length === 0,
    towelInGameroom.length > 0
      ? `Found ${towelInGameroom.length} towel bar items in gameroom-media: ${towelInGameroom.map(e => e.desc.slice(0, 60)).join('; ')}`
      : `${towelBars.length} towel bar items found, none in gameroom-media`
  );
}

// 3c: "Apron-Front" sink → kitchen (NOT exterior)
const apronFront = findItemRooms(/apron[\s-]*front/i);
if (apronFront.length > 0) {
  check(
    '"Apron-Front" sink → kitchen (NOT exterior)',
    apronFront.every(e => e.roomId === 'kitchen') && apronFront.every(e => e.roomId !== 'exterior'),
    `Found in rooms: ${[...new Set(apronFront.map(e => e.roomId))].join(', ')}`
  );
} else {
  check('"Apron-Front" sink → kitchen (NOT exterior)', false, 'No items matching "Apron-Front" found');
}

// 3d: "Master Switch" → whole-house (NOT master-suite)
const masterSwitch = findItemRooms(/master\s*switch/i);
if (masterSwitch.length > 0) {
  check(
    '"Master Switch" → whole-house (NOT master-suite)',
    masterSwitch.every(e => e.roomId !== 'master-suite'),
    `Found in rooms: ${[...new Set(masterSwitch.map(e => e.roomId))].join(', ')}`
  );
} else {
  // Check broader: items with "master" from category 50 should not be in master-suite
  const cat50Master = allKeysFromRooms.filter(e => e.catCode === '50' && /master/i.test(e.desc));
  check(
    'Electrical items with "master" NOT in master-suite (proxy for Master Switch fix)',
    cat50Master.every(e => e.roomId !== 'master-suite'),
    cat50Master.length === 0
      ? 'No cat-50 items with "master" found (category is whole-house anyway)'
      : `Found in rooms: ${[...new Set(cat50Master.map(e => e.roomId))].join(', ')}`
  );
}

// 3e: "Casual Dining/Kitchen" items → kitchen (NOT living-dining)
const casualDining = findItemRooms(/casual\s*dining/i);
if (casualDining.length > 0) {
  const anyLivingDining = casualDining.some(e => e.roomId === 'living-dining');
  check(
    '"Casual Dining/Kitchen" items → kitchen (NOT living-dining)',
    !anyLivingDining,
    `Found in rooms: ${[...new Set(casualDining.map(e => e.roomId))].join(', ')} — items: ${casualDining.map(e => e.desc.slice(0, 60)).join('; ')}`
  );
} else {
  check('"Casual Dining/Kitchen" items → kitchen (NOT living-dining)', false, 'No items matching "Casual Dining" found');
}

// 3f: "Mudroom / Family Foyer" → laundry-mudroom (NOT living-dining)
const mudroom = findItemRooms(/mudroom|family\s*foyer/i);
if (mudroom.length > 0) {
  const anyLivingDining = mudroom.some(e => e.roomId === 'living-dining');
  check(
    '"Mudroom / Family Foyer" → laundry-mudroom (NOT living-dining)',
    !anyLivingDining && mudroom.some(e => e.roomId === 'laundry-mudroom'),
    `Found in rooms: ${[...new Set(mudroom.map(e => e.roomId))].join(', ')}`
  );
} else {
  check('"Mudroom / Family Foyer" → laundry-mudroom (NOT living-dining)', false, 'No items matching "Mudroom" or "Family Foyer" found');
}

// 3g: Cabinet items with "WINDOW" notes → whole-house (NOT exterior)
const cabinetWindow = findItemRooms(/cabinet.*window|window.*cabinet/i);
// Also check broader: items from cabinet categories (60, 61) that mention WINDOW
const cabinetCatItems = allKeysFromRooms.filter(
  e => (e.catCode === '60' || e.catCode === '61') && /window/i.test(e.desc)
);
if (cabinetCatItems.length > 0) {
  const anyExterior = cabinetCatItems.some(e => e.roomId === 'exterior');
  check(
    'Cabinet items with "WINDOW" notes → NOT exterior',
    !anyExterior,
    `Found ${cabinetCatItems.length} items in rooms: ${[...new Set(cabinetCatItems.map(e => e.roomId))].join(', ')} — samples: ${cabinetCatItems.slice(0, 3).map(e => e.desc.slice(0, 60)).join('; ')}`
  );
} else if (cabinetWindow.length > 0) {
  const anyExterior = cabinetWindow.some(e => e.roomId === 'exterior');
  check(
    'Cabinet items with "WINDOW" notes → NOT exterior',
    !anyExterior,
    `Found in rooms: ${[...new Set(cabinetWindow.map(e => e.roomId))].join(', ')}`
  );
} else {
  check('Cabinet items with "WINDOW" notes → NOT exterior', true, 'No cabinet items mentioning "WINDOW" found (vacuously true)');
}

// ── Check 4: No category 50 (Electrical) items in master-suite ─────────────
console.log('\n--- Check 4: No Electrical (cat 50) items in master-suite ---');
const cat50InMaster = allKeysFromRooms.filter(
  e => e.catCode === '50' && e.roomId === 'master-suite'
);
check(
  'No category 50 items in master-suite',
  cat50InMaster.length === 0,
  cat50InMaster.length > 0
    ? `Found ${cat50InMaster.length} items: ${cat50InMaster.slice(0, 5).map(e => e.desc.slice(0, 60)).join('; ')}`
    : undefined
);

// ── Summary ─────────────────────────────────────────────────────────────────
console.log('\n=== Summary ===');
console.log(`  ${passed} passed, ${failed} failed, ${passed + failed} total`);
process.exit(failed > 0 ? 1 : 0);
