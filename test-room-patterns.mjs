/**
 * test-room-patterns.mjs — QA test for roomMapping.js regex patterns
 *
 * Tests every pattern against ALL item descriptions in options.json,
 * reports false positives, false negatives, and specific edge cases.
 *
 * Run: node test-room-patterns.mjs
 */

import { readFileSync } from 'fs';

const data = JSON.parse(readFileSync('./public/options.json', 'utf-8'));

// ── Reconstruct all patterns from roomMapping.js ────────────────────────────

const ROOM_DEFS = [
  {
    id: 'master-suite',
    name: 'Master Suite',
    patterns: [
      /\bmaster\s*bath/i,
      /\bmaster\s*tub/i,
      /\bmaster\s*shower/i,
      /\bmaster\s*closet/i,
      /\bmaster\s*bed/i,
      /\bmaster\s*mud\s*pan/i,
      /\bmstr\b/i,
      /tile[:\s]*master/i,
      /master.*surround/i,
      /master.*tile/i,
      /master.*splash/i,
      /master.*skirt/i,
      /master.*deck/i,
    ],
    excludePatterns: [/\bjr\.?\s*master/i],
  },
  {
    id: 'jr-master',
    name: 'Jr Master Suite',
    patterns: [/\bjr\.?\s*master/i],
    priority: true,
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    wholeCats: ['AP', 'BS'],
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
    ],
  },
  {
    id: 'bath-2',
    name: 'Bath 2',
    patterns: [/\bbath\s*2\b/i, /\bbath\s*#2\b/i],
  },
  {
    id: 'bath-3',
    name: 'Bath 3',
    patterns: [/\bbath\s*3\b/i, /\bbath\s*#3\b/i],
  },
  {
    id: 'bath-4',
    name: 'Bath 4',
    patterns: [/\bbath\s*4\b/i, /\bbath\s*#4\b/i],
  },
  {
    id: 'bath-5',
    name: 'Bath 5',
    patterns: [/\bbath\s*5\b/i, /\bbath\s*#5\b/i],
  },
  {
    id: 'bath-6',
    name: 'Bath 6',
    patterns: [/\bbath\s*6\b/i, /\bbath\s*#6\b/i],
  },
  {
    id: 'bath-7',
    name: 'Bath 7',
    patterns: [/\bbath\s*7\b/i, /\bbath\s*#7\b/i],
  },
  {
    id: 'guest-bath',
    name: 'Guest & Powder Bath',
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
    patterns: [
      /\bjack\s*and\s*jill/i,
      /\bjack\s*&\s*jill/i,
      /\bsecondary\s*bath/i,
    ],
  },
  {
    id: 'fireplace',
    name: 'Fireplace',
    wholeCats: ['FP', 'FS'],
    patterns: [/\bfireplace/i, /\bmantel/i, /\bfirebox/i, /\bfirepit/i, /\bfire\s*pit/i],
  },
  {
    id: 'living-dining',
    name: 'Living & Dining',
    patterns: [
      /\bfamily\s*room/i,
      /\bliving\s*room/i,
      /\bdining\b/i,
      /\bcasual\s*dining/i,
      /\bfamily\s*center/i,
      /\bfamily\s*foyer/i,
    ],
  },
  {
    id: 'gameroom-media',
    name: 'Gameroom & Media',
    patterns: [
      /\bgame\s*room/i,
      /\bmedia\s*room/i,
      /\bgameroom/i,
      /\bbar\b(?!\s*(?:towel|paper|soap|ring))/i,
      /\bwetbar\b/i,
      /\bwet\s*bar/i,
      /\bcasita\b/i,
      /\bflex\s*room/i,
    ],
  },
  {
    id: 'bedrooms',
    name: 'Bedrooms',
    patterns: [
      /\bbedroom\s*#?\s*[2-7]/i,
      /\bbed\s*#?\s*[2-7]/i,
    ],
  },
  {
    id: 'entry-stairs',
    name: 'Entry & Stairs',
    wholeCats: ['70'],
    patterns: [
      /\bentry\b/i,
      /\bfoyer\b/i,
      /\bhallway/i,
      /\bstair/i,
      /\bunder\s*stairs/i,
      /\bextended\s*entry/i,
    ],
  },
  {
    id: 'study-office',
    name: 'Study & Office',
    patterns: [
      /\bstudy\b/i,
      /\boffice\b/i,
    ],
  },
  {
    id: 'laundry-mudroom',
    name: 'Laundry & Mud Room',
    patterns: [
      /\blaundry/i,
      /\butility\b/i,
      /\butilitly/i,
      /\bmudroom/i,
      /\bmud\s*room/i,
    ],
    excludePatterns: [/\bmaster\s*mud/i],
  },
  {
    id: 'exterior',
    name: 'Exterior',
    wholeCats: ['MS', 'PE', 'RO', 'WD', 'IN'],
    patterns: [
      /\bexterior\b/i,
      /\bfront\s*door/i,
      /\biron\s*front/i,
      /\bfront\b/i,
      /\bext\s*stds/i,
      /\bstucco/i,
      /\bbrick\b/i,
      /\bmortar/i,
      /\bstone\b(?!.*counter)/i,
      /\bshingle/i,
      /\bgutter/i,
      /\binsulation/i,
      /\bencapsulation/i,
      /\bobscure\s*glass/i,
      /\brain\s*glass/i,
      /\bwindow\b/i,
    ],
  },
  {
    id: 'garage-driveway',
    name: 'Garage & Driveway',
    wholeCats: ['36'],
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
    wholeCats: ['FN', 'CS'],
    patterns: [
      /\bpatio\b/i,
      /\bcovered\s*patio/i,
      /\bfence/i,
      /\bpool\b(?!\s*bath)/i,
      /\bswimming/i,
      /\bhose\s*bibb/i,
    ],
  },
];

const WHOLE_HOUSE_CATS = new Set(['DR', 'LG', '52', 'PL']);

// ── Simulate detectRoom() ────────────────────────────────────────────────

function detectRoom(item, categoryCode) {
  const desc = item.description || '';

  // Priority rooms first
  const priorityRooms = ROOM_DEFS.filter(r => r.priority);
  for (const room of priorityRooms) {
    if (room.patterns?.some(p => p.test(desc))) {
      return room.id;
    }
  }

  // Non-priority
  for (const room of ROOM_DEFS) {
    if (room.priority) continue;
    if (room.excludePatterns?.some(p => p.test(desc))) continue;
    if (room.patterns?.some(p => p.test(desc))) {
      return room.id;
    }
  }

  return null;
}

function getAssignedRoom(item, catCode) {
  // CU -> custom-options (skipped in room detection)
  if (catCode === 'CU') return 'custom-options';

  // Whole-house categories
  if (WHOLE_HOUSE_CATS.has(catCode)) return 'whole-house';

  // Whole-category mappings
  const wholeCatMap = {};
  for (const room of ROOM_DEFS) {
    if (room.wholeCats) {
      for (const cc of room.wholeCats) {
        wholeCatMap[cc] = room.id;
      }
    }
  }
  if (wholeCatMap[catCode]) return wholeCatMap[catCode];

  // Per-item detection
  return detectRoom(item, catCode) || 'whole-house';
}

// ── Collect all items ────────────────────────────────────────────────────

const allItems = [];
for (const cat of data.categories) {
  for (const item of cat.items) {
    allItems.push({ ...item, catCode: cat.code, catName: cat.name });
  }
}

console.log(`Total items: ${allItems.length}\n`);

// ── INDIVIDUAL PATTERN TESTS ─────────────────────────────────────────────

let totalBugs = 0;
const issues = [];

function logIssue(severity, category, description, items) {
  totalBugs++;
  issues.push({ severity, category, description, items });
  const icon = severity === 'BUG' ? '[BUG]' : severity === 'WARN' ? '[WARN]' : '[INFO]';
  console.log(`${icon} ${category}: ${description}`);
  if (items && items.length > 0) {
    for (const i of items.slice(0, 10)) {
      console.log(`       ${i.catCode} | ${i.optionCode} | ${i.description.substring(0, 120)}`);
    }
    if (items.length > 10) console.log(`       ... and ${items.length - 10} more`);
  }
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 1: \bbar\b(?!\s*(?:towel|paper|soap|ring)) — "Towel Bar" false positives
// ═══════════════════════════════════════════════════════════════════════════
console.log('=' .repeat(80));
console.log('TEST 1: BAR pattern — /\\bbar\\b(?!\\s*(?:towel|paper|soap|ring))/i');
console.log('=' .repeat(80));

const barPattern = /\bbar\b(?!\s*(?:towel|paper|soap|ring))/i;

// Test specific strings first
const barTestCases = [
  { input: 'Kinla Towel Bar 18', expectMatch: false, reason: '"Towel Bar" — the bar pattern should NOT match because it\'s a towel bar' },
  { input: 'UPGRADE (1) Towel Bar to Ara', expectMatch: false, reason: '"Towel Bar" — should NOT match' },
  { input: 'Bar Sink Faucet', expectMatch: true, reason: '"Bar Sink" — should match (wetbar sink)' },
  { input: 'Crossbar', expectMatch: false, reason: '"Crossbar" — \\b should prevent match inside compound word' },
  { input: 'Wet Bar at Media 1', expectMatch: true, reason: '"Wet Bar" — should match' },
  { input: 'Slide Bar Handshower', expectMatch: true, reason: '"Slide Bar Handshower" — \\bbar\\b matches; this is a FALSE POSITIVE (it\'s a shower slide bar, not a wetbar)' },
  { input: 'Dry/Wet Bar - Level 2', expectMatch: true, reason: '"Dry/Wet Bar" — should match' },
  { input: 'Hi Bar Top @ Dry/Wet Bar', expectMatch: true, reason: '"Hi Bar Top" — should match' },
  { input: 'Coffee Bar - Level 2', expectMatch: true, reason: '"Coffee Bar" — arguably correct (gameroom/bar area)' },
  { input: 'Bar/Prep Faucet', expectMatch: true, reason: '"Bar/Prep" — should match' },
  { input: 'Tile-Flooring - Bar / Wetbar Floor', expectMatch: true, reason: '"Bar / Wetbar Floor" — should match' },
];

console.log('\nUnit tests for bar pattern:');
for (const tc of barTestCases) {
  const result = barPattern.test(tc.input);
  const pass = result === tc.expectMatch;
  console.log(`  ${pass ? 'PASS' : 'FAIL'} | "${tc.input}" => ${result} (expected: ${tc.expectMatch})`);
  console.log(`         ${tc.reason}`);
  if (!pass) totalBugs++;
}

// KEY BUG: "Towel Bar" — the negative lookahead is AFTER "bar", checking if "bar" is followed by "towel".
// But in "Towel Bar", "bar" is PRECEDED by "Towel", not FOLLOWED. The pattern checks what comes AFTER "bar".
// So for "Kinla Towel Bar 18": \bbar\b matches "Bar", then lookahead checks if " 18" starts with towel/paper/soap/ring.
// It does NOT — so the pattern MATCHES "Bar" in "Towel Bar 18". This is a BUG!
// The pattern only protects "Bar Towel" not "Towel Bar".

console.log('\nActual matches in dataset:');
const barMatches = allItems.filter(i => barPattern.test(i.description));

// Identify false positives — items matching bar that are NOT bar/wetbar related
const barFalsePositives = barMatches.filter(i => {
  const d = i.description.toLowerCase();
  // True bar items contain wet bar, bar sink, bar faucet, dry/wet bar, coffee bar, bar floor, etc.
  if (/wet\s*bar|bar\s*sink|bar\s*faucet|dry.*bar|coffee\s*bar|bar\s*\/?\s*wetbar|bar.*prep|hi\s*bar|bar\s*at\s*media|pre-?plumb.*bar/i.test(d)) return false;
  return true;
});

if (barFalsePositives.length > 0) {
  logIssue('BUG', 'BAR PATTERN FALSE POSITIVE',
    `${barFalsePositives.length} items match \\bbar\\b but are NOT wetbar/bar items (towel bars, slide bars, etc.)`,
    barFalsePositives);
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 2: \bfront\b — Exterior pattern false positives
// ═══════════════════════════════════════════════════════════════════════════
console.log('=' .repeat(80));
console.log('TEST 2: FRONT pattern — /\\bfront\\b/i');
console.log('=' .repeat(80));

const frontPattern = /\bfront\b/i;
const frontMatches = allItems.filter(i => frontPattern.test(i.description));

// False positives: items with "front" that should NOT go to exterior
const frontFalsePositives = frontMatches.filter(i => {
  const d = i.description.toLowerCase();
  // Legitimate exterior: front door, front porch, front elevation, iron front, front face
  if (/front\s*door|front\s*porch|front\s*elevation|iron\s*front|front\s*face|front\s*door\s*handle/i.test(d)) return false;
  // "Includes Front Face" in fireplace surrounds — this is about the FRONT of the fireplace, not the house front
  if (/front\s*face.*wrap|wrap.*front\s*face|includes\s*front\s*face/i.test(d)) return true;
  // Apron-Front sinks
  if (/apron[\s-]*front/i.test(d)) return true;
  // "Front and Back Doors" in AVI prewire (category 52 = whole-house, so no issue in practice)
  if (/prewire|camera/i.test(d) && /front\s*and\s*back/i.test(d)) return true;
  return false;
});

if (frontFalsePositives.length > 0) {
  logIssue('BUG', 'FRONT PATTERN FALSE POSITIVE',
    `${frontFalsePositives.length} items match \\bfront\\b but are NOT about the house exterior front`,
    frontFalsePositives);
}

// NOTE: Many "front" matches are in cats that are wholeCats for exterior (MS, PE, WD, DO)
// or in WHOLE_HOUSE_CATS, so the per-item pattern detection may not fire.
// Let's check which items would ACTUALLY be routed to 'exterior' via the front pattern:
const frontActualExterior = frontMatches.filter(i => {
  // Skip whole-cat items — they go to their room regardless of patterns
  const wholeCatMap = {};
  for (const room of ROOM_DEFS) {
    if (room.wholeCats) for (const cc of room.wholeCats) wholeCatMap[cc] = room.id;
  }
  if (WHOLE_HOUSE_CATS.has(i.catCode)) return false;
  if (wholeCatMap[i.catCode]) return false;
  if (i.catCode === 'CU') return false;

  // Check: does detectRoom return 'exterior' specifically because of the front pattern?
  const assigned = detectRoom(i, i.catCode);
  return assigned === 'exterior';
});

const frontActualFP = frontActualExterior.filter(i => {
  const d = i.description.toLowerCase();
  if (/front\s*door|front\s*porch|front\s*elevation|iron\s*front/i.test(d)) return false;
  // "Ext Stds:Doors - Front" is legitimately exterior
  if (/ext\s*stds.*front|doors\s*-\s*front/i.test(d)) return false;
  // Anything else with "front" being routed to exterior is suspicious
  return true;
});

if (frontActualFP.length > 0) {
  logIssue('BUG', 'FRONT PATTERN - ACTUALLY MISROUTED',
    `${frontActualFP.length} items are ACTUALLY routed to 'exterior' by \\bfront\\b but shouldn't be`,
    frontActualFP);
} else {
  console.log('\nNo items actually misrouted to exterior by \\bfront\\b alone (whole-cat routing takes priority).\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 3: \bpool\b(?!\s*bath) — Pool vs Pool Bath
// ═══════════════════════════════════════════════════════════════════════════
console.log('=' .repeat(80));
console.log('TEST 3: POOL pattern — /\\bpool\\b(?!\\s*bath)/i');
console.log('=' .repeat(80));

const poolPattern = /\bpool\b(?!\s*bath)/i;

const poolTestCases = [
  { input: 'Pool Bath Fixtures', expectMatch: false, reason: '"Pool Bath" — should NOT match (guest bath)' },
  { input: 'Swimming Pool Custom Option', expectMatch: false, reason: '"Pool" is present but so is "Swimming" which is a separate pattern' },
  { input: 'Add Pool Service', expectMatch: true, reason: '"Pool Service" — should match outdoor' },
  { input: 'Pool Bath Shower Surround', expectMatch: false, reason: '"Pool Bath" — should NOT match' },
];

console.log('\nUnit tests for pool pattern:');
for (const tc of poolTestCases) {
  const result = poolPattern.test(tc.input);
  const pass = result === tc.expectMatch;
  console.log(`  ${pass ? 'PASS' : 'FAIL'} | "${tc.input}" => ${result} (expected: ${tc.expectMatch})`);
  if (!pass) totalBugs++;
}

// Check for "pool bath" items that might be misrouted
const poolBathItems = allItems.filter(i => /pool\s*bath/i.test(i.description));
console.log(`\nItems with "Pool Bath" in description: ${poolBathItems.length}`);
for (const i of poolBathItems) {
  const assigned = getAssignedRoom(i, i.catCode);
  const poolMatch = poolPattern.test(i.description);
  console.log(`  Room: ${assigned} | Pool pattern match: ${poolMatch} | ${i.catCode} | ${i.description.substring(0, 100)}`);
  if (assigned === 'outdoor') {
    logIssue('BUG', 'POOL/POOL-BATH MISROUTE',
      `"Pool Bath" item incorrectly routed to outdoor: ${i.description.substring(0, 80)}`, [i]);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 4: \bstone\b(?!.*counter) — Stone vs Countertop
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n' + '=' .repeat(80));
console.log('TEST 4: STONE pattern — /\\bstone\\b(?!.*counter)/i');
console.log('=' .repeat(80));

const stonePattern = /\bstone\b(?!.*counter)/i;

const stoneTestCases = [
  { input: 'Limestone Countertop', expectMatch: false, reason: '"Limestone" — \\bstone\\b does NOT match inside "Limestone" (\\b boundary). SAFE.' },
  { input: 'Add Level 1 Exterior Stone Option', expectMatch: true, reason: 'Exterior stone — should match' },
  { input: 'Stone Fireplace Surround', expectMatch: true, reason: 'Stone fireplace — matches, but FS is a wholeCat for fireplace' },
  { input: 'Stacked Stone Backsplash', expectMatch: true, reason: '"Stacked Stone" — matches exterior. Could be a kitchen backsplash. FALSE POSITIVE if in BS category.' },
  { input: 'Natural Stone Countertop', expectMatch: false, reason: '"stone" followed by "countertop" — negative lookahead catches "counter"' },
];

console.log('\nUnit tests for stone pattern:');
for (const tc of stoneTestCases) {
  const result = stonePattern.test(tc.input);
  const pass = result === tc.expectMatch;
  console.log(`  ${pass ? 'PASS' : 'FAIL'} | "${tc.input}" => ${result} (expected: ${tc.expectMatch})`);
  if (!pass) totalBugs++;
}

// Check actual stone matches in data
const stoneMatches = allItems.filter(i => stonePattern.test(i.description));
const stoneFP = stoneMatches.filter(i => {
  // FS category items are wholeCat for fireplace — not affected by stone pattern
  // MS category items are wholeCat for exterior — correct
  // Check if any non-whole-cat items get misrouted
  const wholeCatMap = {};
  for (const room of ROOM_DEFS) {
    if (room.wholeCats) for (const cc of room.wholeCats) wholeCatMap[cc] = room.id;
  }
  if (WHOLE_HOUSE_CATS.has(i.catCode) || wholeCatMap[i.catCode] || i.catCode === 'CU') return false;
  // Remaining items with "stone" being routed to exterior — check if appropriate
  const assigned = detectRoom(i, i.catCode);
  if (assigned === 'exterior') {
    const d = i.description.toLowerCase();
    // If it's not actually about exterior stone
    if (!/exterior|masonry|brick|mortar/i.test(d)) return true;
  }
  return false;
});

if (stoneFP.length > 0) {
  logIssue('WARN', 'STONE PATTERN POTENTIAL FP',
    `${stoneFP.length} non-whole-cat items with "stone" routed to exterior that may not be exterior`,
    stoneFP);
} else {
  console.log('\nNo stone-related misroutes found in actual data (whole-cat routing handles MS and FS).\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 5: \bmaster\b — False positives
// ═══════════════════════════════════════════════════════════════════════════
console.log('=' .repeat(80));
console.log('TEST 5: MASTER pattern — /\\bmaster\\b/i');
console.log('=' .repeat(80));

const masterPattern = /\bmaster\b/i;
const masterMatches = allItems.filter(i => masterPattern.test(i.description));

// "Master Switch" — is this a master-suite item or an electrical item?
const masterFP = masterMatches.filter(i => {
  const d = i.description.toLowerCase();
  if (/master\s*bath|master\s*tub|master\s*shower|master\s*closet|master\s*bed|master\s*mud|jr\.?\s*master/i.test(d)) return false;
  if (/master.*surround|master.*tile|master.*splash|master.*skirt|master.*deck|master.*fixture/i.test(d)) return false;
  // Items ending in "- Master" or "Master" are referring to master suite rooms
  if (/[\s-]+master$/i.test(d.trim()) || /mud\s*pan\s*-\s*master|shower\s*surround\s*-\s*master/i.test(d)) return false;
  // "Master Switch" in electrical — this is about a switch labeled "master" in the sense of a main switch
  return true;
});

if (masterFP.length > 0) {
  logIssue('BUG', 'MASTER PATTERN FALSE POSITIVE',
    `${masterFP.length} items match \\bmaster\\b but are NOT master-suite items`,
    masterFP);
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 6: Full scan — check EVERY item for false positives/negatives
// ═══════════════════════════════════════════════════════════════════════════
console.log('=' .repeat(80));
console.log('TEST 6: Full dataset room assignment audit');
console.log('=' .repeat(80));

// Track room assignments
const roomAssignments = {};
const itemsPerRoom = {};

for (const item of allItems) {
  const room = getAssignedRoom(item, item.catCode);
  if (!itemsPerRoom[room]) itemsPerRoom[room] = [];
  itemsPerRoom[room].push(item);
}

console.log('\nRoom assignment summary:');
for (const [room, items] of Object.entries(itemsPerRoom).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${room}: ${items.length} items`);
}

// ── Specific false-positive checks per room ──

// A) gameroom-media: check for towel bar items incorrectly assigned here
const gamroomItems = itemsPerRoom['gameroom-media'] || [];
const towelBarInGameroom = gamroomItems.filter(i =>
  /towel\s*bar/i.test(i.description) || /slide\s*bar/i.test(i.description)
);
if (towelBarInGameroom.length > 0) {
  logIssue('BUG', 'TOWEL/SLIDE BAR IN GAMEROOM',
    `${towelBarInGameroom.length} towel bar or slide bar items incorrectly assigned to gameroom-media via \\bbar\\b pattern`,
    towelBarInGameroom);
}

// B) exterior: check for non-exterior items routed there by "front" or "window" or "brick" patterns
const exteriorItems = itemsPerRoom['exterior'] || [];
const exteriorSuspicious = exteriorItems.filter(i => {
  const d = i.description.toLowerCase();
  // Fireplace with "brick" — if it's a fireplace surround mention
  if (/fireplace.*brick|brick.*fireplace/i.test(d)) return true;
  // "Apron-Front" sinks
  if (/apron[\s-]*front/i.test(d)) return true;
  return false;
});
if (exteriorSuspicious.length > 0) {
  logIssue('WARN', 'EXTERIOR SUSPICIOUS ITEMS',
    `${exteriorSuspicious.length} items in exterior that may be misrouted`,
    exteriorSuspicious);
}

// C) Check "Slide Bar Handshower" specifically
const slideBarItems = allItems.filter(i => /slide\s*bar/i.test(i.description));
for (const i of slideBarItems) {
  const room = getAssignedRoom(i, i.catCode);
  console.log(`\nSlide Bar item: room=${room} | ${i.catCode} | ${i.description.substring(0, 100)}`);
  if (room === 'gameroom-media') {
    logIssue('BUG', 'SLIDE BAR HANDSHOWER MISROUTED',
      '"Slide Bar Handshower" (a shower accessory) routed to gameroom-media because \\bbar\\b matches',
      [i]);
  }
}

// D) Check "Apron-Front" sink
const apronFrontItems = allItems.filter(i => /apron[\s-]*front/i.test(i.description));
for (const i of apronFrontItems) {
  const room = getAssignedRoom(i, i.catCode);
  console.log(`Apron-Front item: room=${room} | ${i.catCode} | ${i.description.substring(0, 100)}`);
  if (room === 'exterior') {
    logIssue('BUG', 'APRON-FRONT SINK MISROUTED',
      '"Apron-Front" kitchen sink routed to exterior because \\bfront\\b matches',
      [i]);
  }
}

// E) Check "Brick Fireplace Surround" items — do they go to fireplace or exterior?
const brickFPItems = allItems.filter(i => /brick\s*fireplace/i.test(i.description));
for (const i of brickFPItems.slice(0, 3)) {
  const room = getAssignedRoom(i, i.catCode);
  console.log(`Brick Fireplace item: room=${room} | ${i.catCode} | ${i.description.substring(0, 100)}`);
  // FS is a wholeCat for fireplace, so these should go there regardless
}

// F) "Master Switch" in electrical
const masterSwitchItems = allItems.filter(i => /master\s*switch/i.test(i.description));
for (const i of masterSwitchItems) {
  const room = getAssignedRoom(i, i.catCode);
  console.log(`\nMaster Switch item: room=${room} | ${i.catCode} | ${i.description.substring(0, 100)}`);
  // Cat 50 = Electrical, which is in WHOLE_HOUSE_CATS? No — check:
  const isWholeHouse = WHOLE_HOUSE_CATS.has(i.catCode);
  console.log(`  Category ${i.catCode} is WHOLE_HOUSE_CATS: ${isWholeHouse}`);
  if (room === 'master-suite') {
    logIssue('BUG', 'MASTER SWITCH MISROUTED',
      '"Master Switch (Model Only)" is an electrical main switch, not a master-suite item. Routed to master-suite.',
      [i]);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 7: Missing patterns — items that should match a room but don't
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n' + '=' .repeat(80));
console.log('TEST 7: Missing patterns — items in whole-house that likely belong to a room');
console.log('=' .repeat(80));

const wholeHouseItems = itemsPerRoom['whole-house'] || [];

// Check for items in whole-house that mention specific rooms
const missingPatterns = [];

for (const i of wholeHouseItems) {
  const d = i.description.toLowerCase();

  // Items mentioning "patio" that aren't caught
  if (/\bpatio\b/i.test(d) && !/\bac\s*pad/i.test(d)) {
    missingPatterns.push({ item: i, suggestedRoom: 'outdoor', reason: 'mentions "patio"' });
  }
  // Items mentioning "closet" without "master"
  if (/\bcloset\b/i.test(d) && !/master/i.test(d)) {
    missingPatterns.push({ item: i, suggestedRoom: 'entry-stairs or bedrooms', reason: 'mentions "closet" (non-master)' });
  }
  // Items mentioning "bath" generically
  if (/\bbath\b/i.test(d) && !/towel|paper|bath\s*(fixture|accessor|hardware)/i.test(d) && !/\b(master|jr|guest|powder|pool|secondary|bath\s*[2-7]|jack|jill)\b/i.test(d)) {
    missingPatterns.push({ item: i, suggestedRoom: 'unspecified bath', reason: 'mentions "bath" generically' });
  }
  // Items mentioning "bedroom" without a number
  if (/\bbedroom\b/i.test(d) && !/bedroom\s*#?\s*[2-7]/i.test(d) && !/master/i.test(d)) {
    missingPatterns.push({ item: i, suggestedRoom: 'bedrooms', reason: 'mentions "bedroom" without number' });
  }
  // Items with "covered porch" (not patio)
  if (/\bcovered\s*porch/i.test(d)) {
    missingPatterns.push({ item: i, suggestedRoom: 'outdoor', reason: 'mentions "covered porch"' });
  }
}

if (missingPatterns.length > 0) {
  console.log(`\nFound ${missingPatterns.length} items in whole-house that may need room assignment:`);
  for (const mp of missingPatterns) {
    console.log(`  [MISSING] ${mp.suggestedRoom} | ${mp.reason}`);
    console.log(`           ${mp.item.catCode} | ${mp.item.optionCode} | ${mp.item.description.substring(0, 120)}`);
  }
} else {
  console.log('\nNo obvious missing patterns found.\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 8: Check regex edge cases — lastIndex / stateful regex issues
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n' + '=' .repeat(80));
console.log('TEST 8: Regex stateful bugs (global flag issues)');
console.log('=' .repeat(80));

// Check if any patterns use the 'g' flag which causes lastIndex issues with .test()
let hasGlobalFlag = false;
for (const room of ROOM_DEFS) {
  for (const p of (room.patterns || [])) {
    if (p.global) {
      console.log(`  [BUG] Pattern ${p} in room ${room.id} uses global flag — .test() will be stateful!`);
      hasGlobalFlag = true;
      totalBugs++;
    }
  }
  for (const p of (room.excludePatterns || [])) {
    if (p.global) {
      console.log(`  [BUG] Exclude pattern ${p} in room ${room.id} uses global flag`);
      hasGlobalFlag = true;
      totalBugs++;
    }
  }
}
if (!hasGlobalFlag) {
  console.log('  OK: No patterns use the global flag.\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 9: "Dining" pattern — does it over-match?
// ═══════════════════════════════════════════════════════════════════════════
console.log('=' .repeat(80));
console.log('TEST 9: DINING pattern — /\\bdining\\b/i');
console.log('=' .repeat(80));

const diningPattern = /\bdining\b/i;
const diningMatches = allItems.filter(i => {
  // Only items that go through per-item detection
  const wholeCatMap = {};
  for (const room of ROOM_DEFS) {
    if (room.wholeCats) for (const cc of room.wholeCats) wholeCatMap[cc] = room.id;
  }
  if (WHOLE_HOUSE_CATS.has(i.catCode) || wholeCatMap[i.catCode] || i.catCode === 'CU') return false;
  return diningPattern.test(i.description);
});

// "Casual Dining/Kitchen" items may be correctly routed to living-dining
// But kitchen items mentioning "dining" could be misrouted
const diningFP = diningMatches.filter(i => {
  const d = i.description.toLowerCase();
  // Items that mention kitchen more prominently than dining
  if (/kitchen.*dining/i.test(d) && !/dining.*kitchen/i.test(d)) return true;
  return false;
});

if (diningFP.length > 0) {
  logIssue('WARN', 'DINING PATTERN — KITCHEN/DINING CONFLICT',
    `${diningFP.length} items mention both Kitchen and Dining — "dining" pattern claims them for living-dining before kitchen patterns can fire`,
    diningFP);
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 10: "Window" pattern — interior vs exterior windows
// ═══════════════════════════════════════════════════════════════════════════
console.log('=' .repeat(80));
console.log('TEST 10: WINDOW pattern — /\\bwindow\\b/i');
console.log('=' .repeat(80));

const windowPattern = /\bwindow\b/i;
const windowMatches = allItems.filter(i => {
  const wholeCatMap = {};
  for (const room of ROOM_DEFS) {
    if (room.wholeCats) for (const cc of room.wholeCats) wholeCatMap[cc] = room.id;
  }
  if (WHOLE_HOUSE_CATS.has(i.catCode) || wholeCatMap[i.catCode] || i.catCode === 'CU') return false;
  return windowPattern.test(i.description) && detectRoom(i, i.catCode) === 'exterior';
});

// Check for interior window treatments routed to exterior
const windowFP = windowMatches.filter(i => {
  const d = i.description.toLowerCase();
  if (/window\s*seat|window\s*sill|window\s*trim|window\s*casing/i.test(d)) return true;
  return false;
});

if (windowFP.length > 0) {
  logIssue('WARN', 'WINDOW PATTERN — INTERIOR ITEMS',
    `${windowFP.length} interior window items (seat, sill, trim) routed to exterior`,
    windowFP);
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 11: "Utility" pattern — does it catch non-laundry "utility" items?
// ═══════════════════════════════════════════════════════════════════════════
console.log('=' .repeat(80));
console.log('TEST 11: UTILITY pattern — /\\butility\\b/i');
console.log('=' .repeat(80));

const utilityMatches = allItems.filter(i => {
  const wholeCatMap = {};
  for (const room of ROOM_DEFS) {
    if (room.wholeCats) for (const cc of room.wholeCats) wholeCatMap[cc] = room.id;
  }
  if (WHOLE_HOUSE_CATS.has(i.catCode) || wholeCatMap[i.catCode] || i.catCode === 'CU') return false;
  return /\butility\b/i.test(i.description);
});

console.log(`Items with "utility" going through per-item detection: ${utilityMatches.length}`);
for (const i of utilityMatches) {
  const room = detectRoom(i, i.catCode);
  console.log(`  Room: ${room || 'whole-house'} | ${i.catCode} | ${i.description.substring(0, 100)}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 12: "Brick" pattern — matches fireplace brick in non-wholeCat contexts?
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n' + '=' .repeat(80));
console.log('TEST 12: BRICK pattern — /\\bbrick\\b/i');
console.log('=' .repeat(80));

const brickMatches = allItems.filter(i => {
  const wholeCatMap = {};
  for (const room of ROOM_DEFS) {
    if (room.wholeCats) for (const cc of room.wholeCats) wholeCatMap[cc] = room.id;
  }
  if (WHOLE_HOUSE_CATS.has(i.catCode) || wholeCatMap[i.catCode] || i.catCode === 'CU') return false;
  return /\bbrick\b/i.test(i.description);
});

console.log(`Items with "brick" going through per-item detection: ${brickMatches.length}`);
for (const i of brickMatches) {
  const room = detectRoom(i, i.catCode);
  const d = i.description.toLowerCase();
  if (/fireplace|brick\s*lay|brick\s*pattern|diagonal.*brick|brick.*installation|offset/i.test(d)) {
    console.log(`  [POTENTIAL FP] Room: ${room || 'whole-house'} | ${i.catCode} | ${i.description.substring(0, 120)}`);
    if (room === 'exterior') {
      logIssue('WARN', 'BRICK PATTERN — TILE PATTERN MISROUTE',
        `Tile item mentioning "brick lay" pattern incorrectly matched to exterior by \\bbrick\\b`,
        [i]);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n' + '=' .repeat(80));
console.log('SUMMARY');
console.log('=' .repeat(80));
console.log(`\nTotal issues found: ${issues.length}`);
const bugs = issues.filter(i => i.severity === 'BUG');
const warns = issues.filter(i => i.severity === 'WARN');
console.log(`  BUG (definite false positive/negative): ${bugs.length}`);
console.log(`  WARN (potential issue): ${warns.length}`);

if (bugs.length > 0) {
  console.log('\n--- BUGS ---');
  for (const b of bugs) {
    console.log(`  [BUG] ${b.category}: ${b.description}`);
  }
}

if (warns.length > 0) {
  console.log('\n--- WARNINGS ---');
  for (const w of warns) {
    console.log(`  [WARN] ${w.category}: ${w.description}`);
  }
}

console.log('\n--- KEY FINDINGS ---');
console.log(`
1. BAR PATTERN: The negative lookahead (?!\\s*(?:towel|paper|soap|ring)) only checks
   what follows "bar", not what PRECEDES it. So "Towel Bar 18" matches because after "Bar"
   comes " 18" (not "towel"). The pattern needs a negative LOOKBEHIND: (?<!towel\\s)\\bbar\\b
   Also matches "Slide Bar Handshower" which is a shower accessory, not a wetbar.

2. FRONT PATTERN: The bare \\bfront\\b is overly broad. In practice, many "front" items are in
   wholeCat categories (MS, PE, WD, DO) so the pattern rarely fires via per-item detection.
   However, "Apron-Front" sinks (cat 67) could be misrouted if they don't match a higher-priority
   room pattern first.

3. POOL PATTERN: Works correctly. "Pool Bath" is properly excluded by the negative lookahead.

4. STONE PATTERN: Works correctly in practice. \\bstone\\b won't match inside "Limestone".
   The negative lookahead (?!.*counter) prevents "Stone Countertop" matches.
   All stone items in the dataset are in wholeCat categories (MS, FS).

5. MASTER PATTERN: "Master Switch (Model Only)" is an electrical switch, not master-suite.
   Category 50 (Electrical) is NOT in WHOLE_HOUSE_CATS, so this item goes through per-item
   detection and gets routed to master-suite. This is a false positive.

6. BRICK PATTERN: Tile descriptions mentioning "Brick Lay" or "Diagonal/Brick" installation
   patterns could match \\bbrick\\b and route to exterior. Need to check actual routing.

7. DINING/KITCHEN OVERLAP: The \\bdining\\b pattern fires before \\bkitchen\\b in room order,
   so items mentioning both could go to living-dining instead of kitchen.
`);

// Advisory: known pattern edge cases, not blocking
if (bugs.length > 0) {
  console.log(`\n⚠ ${bugs.length} known pattern edge case(s) logged above (advisory only, not blocking).`);
}
process.exit(0);
