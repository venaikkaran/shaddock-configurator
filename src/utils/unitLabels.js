const UNIT_LABELS = {
  'per SF': 'per Square Foot (SF)',
  'per LFT': 'per Linear Foot (LFT)',
  'each': 'each',
  'per $': 'Enter Total Dollar Amount',
};

const UNIT_SHORT_LABELS = {
  'per SF': 'SF (Sq. Ft.)',
  'per LFT': 'LFT (Linear Ft.)',
  'each': 'each',
  'per $': 'Enter $ Amount',
};

const UNIT_INPUT_LABELS = {
  'per SF': 'Square Feet',
  'per LFT': 'Linear Feet',
  'each': 'Quantity',
  'per $': 'Enter Total Dollar Amount',
};

/** Full label for badges: "per SF (Square Foot)" */
export function unitBadgeLabel(unit) {
  if (!unit) return '';
  return UNIT_LABELS[unit] || unit;
}

/** Short label for input fields: "SF (Sq. Ft.)" */
export function unitShortLabel(unit) {
  if (!unit) return '';
  return UNIT_SHORT_LABELS[unit] || unit.replace('per ', '');
}

/** Label for quantity input prompts: "Square Feet" */
export function unitInputLabel(unit) {
  if (!unit) return 'Quantity';
  return UNIT_INPUT_LABELS[unit] || unit.replace('per ', '');
}
