/**
 * For additive categories with quantity items that naturally pair (e.g., Flatwork
 * where Broom/Salt finishes share the same area measurement), detect and return
 * area groups.
 *
 * Returns: { [areaLabel]: { items: [...], unit: "per SF"|"per LFT" } }
 */

// Extract the area/location from a Flatwork description
// "Flatwork: Driveway Broom Finish 4\" per SF" → "Driveway"
// "Flatwork: Broom Finish 4\" per SF" → "General"
// "Flatwork: Aggregate Finish ILO Broom Finish 4\" per SF" → "Upgrade (ILO)"
function extractFlatworkArea(desc) {
  // ILO items
  if (desc.includes('ILO')) return 'Finish Upgrade (ILO)';
  // Remove "Flatwork: " prefix
  const stripped = desc.replace(/^Flatwork:\s*/i, '');
  // Extract area by removing the finish type and trailing stuff
  const areaMatch = stripped.match(/^(.*?)\s*(?:Broom|Salt|Aggregate)\s+Finish/i);
  if (areaMatch && areaMatch[1].trim()) {
    return areaMatch[1].trim();
  }
  // If just "Broom Finish..." with no area prefix, it's general
  if (/^(?:Broom|Salt)\s+Finish/i.test(stripped)) return 'General Flatwork';
  // Covered Patio Salt Finish
  if (/Covered Patio/i.test(stripped)) return 'Covered Patio';
  return stripped.split(/\s+/).slice(0, 2).join(' ');
}

// Extract area from Cabinet description for paired items
function extractCabinetPairKey(desc) {
  if (/Floating Shelves/i.test(desc)) return 'Floating Shelves';
  if (/Desk Base/i.test(desc)) return 'Desk/Workstation Base';
  if (/Extend Uppers/i.test(desc)) return 'Extended Upper Cabinets';
  return null; // not a paired item
}

// Extract area from Paint description
function extractPaintPairKey(desc) {
  if (/Paint Site Finished Cabinets/i.test(desc)) return 'Paint Site Finished Cabinets';
  return null;
}

/**
 * Detect area groups for a given category. Returns groups where items share
 * the same physical measurement.
 */
export function detectAreaGroups(category) {
  if (!category || !category.items) return null;

  const code = category.code;

  // Flatwork — group by area
  if (code === '01') {
    return groupByExtractor(category.items, extractFlatworkArea);
  }

  // Fence — all items share one LFT measurement
  if (code === 'FN') {
    const qtyItems = category.items.filter(i => i.needsQuantity && !i.isStandard && !i.priceBlank);
    if (qtyItems.length >= 2) {
      return { 'Iron Fence': { items: qtyItems, unit: qtyItems[0].unit } };
    }
  }

  // Cabinet Options — detect specific pairs
  if (code === '60') {
    return groupByExtractor(
      category.items.filter(i => i.needsQuantity && !i.isStandard && !i.priceBlank),
      extractCabinetPairKey,
      true // only group items that return a key
    );
  }

  // Paint Interior — dark/light pair
  if (code === 'PT') {
    return groupByExtractor(
      category.items.filter(i => i.needsQuantity && !i.isStandard && !i.priceBlank),
      extractPaintPairKey,
      true
    );
  }

  return null;
}

function groupByExtractor(items, extractor, skipNulls = false) {
  const groups = {};
  const qtyItems = items.filter(i => i.needsQuantity && !i.isStandard && !i.priceBlank);

  for (const item of qtyItems) {
    const key = extractor(item.description);
    if (skipNulls && !key) continue;
    const label = key || 'Other';
    if (!groups[label]) {
      groups[label] = { items: [], unit: item.unit };
    }
    groups[label].items.push(item);
  }

  // Only return groups with 2+ items (single items don't need grouping)
  // Exception: if an item is the only one for that area (like Covered Patio), keep it standalone
  const result = {};
  for (const [label, group] of Object.entries(groups)) {
    if (group.items.length >= 2) {
      result[label] = group;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Get the set of optionCodes that are in area groups (so BrowseView can skip them
 * from standalone rendering).
 */
export function getAreaGroupedCodes(areaGroups) {
  if (!areaGroups) return new Set();
  const codes = new Set();
  for (const group of Object.values(areaGroups)) {
    for (const item of group.items) {
      codes.add(item.optionCode);
    }
  }
  return codes;
}
