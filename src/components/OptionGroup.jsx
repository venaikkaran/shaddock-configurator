import { useMemo, useState, useEffect } from 'react';
import { Circle } from 'lucide-react';
import { getSelectionKey } from '../utils/selectionKey';
import { formatCurrency } from '../utils/formatCurrency';
import { unitBadgeLabel, unitInputLabel } from '../utils/unitLabels';
import OptionRow from './OptionRow';

function commonPrefix(strings) {
  if (!strings.length) return '';
  let prefix = strings[0];
  for (let i = 1; i < strings.length; i++) {
    while (!strings[i].startsWith(prefix)) {
      prefix = prefix.substring(0, prefix.length - 1);
      if (!prefix) return '';
    }
  }
  const lastSpace = prefix.lastIndexOf(' ');
  return lastSpace > 10 ? prefix.substring(0, lastSpace) : prefix;
}

export default function OptionGroup({
  groupBase,
  items,
  categoryCode,
  selections,
  onToggle,
  onQuantityChange,
}) {
  const groupLabel = useMemo(() => {
    const descriptions = items.map((item) => item.description || '');
    const prefix = commonPrefix(descriptions);
    return prefix.length >= 10 ? prefix : groupBase;
  }, [items, groupBase]);

  // Check if items in this group need quantity
  const groupNeedsQuantity = useMemo(() => {
    return items.some(item => item.needsQuantity);
  }, [items]);

  // Find currently selected item and its quantity
  const selectedInfo = useMemo(() => {
    for (const item of items) {
      const key = getSelectionKey(item);
      if (selections[key]?.selected) {
        return { item, key, quantity: selections[key].quantity || 0 };
      }
    }
    return null;
  }, [items, selections]);

  const anySelected = !!selectedInfo;

  // Get the unit label from items (they should all share the same unit)
  const unitLabel = useMemo(() => {
    const item = items.find(i => i.unit);
    return item?.unit || null;
  }, [items]);

  // Shared quantity for the group — local state is source of truth for input
  const [sharedQty, setSharedQty] = useState(() => {
    // Initialize from any existing selection
    if (selectedInfo && selectedInfo.quantity > 0) return selectedInfo.quantity;
    return 0;
  });

  // Sync sharedQty when selections change externally (e.g., loading a config)
  useEffect(() => {
    if (selectedInfo && selectedInfo.quantity > 0 && selectedInfo.quantity !== sharedQty) {
      setSharedQty(selectedInfo.quantity);
    }
  }, [selectedInfo?.quantity]);

  const effectiveQty = sharedQty;

  function handleNoneClick() {
    items.forEach((item) => {
      const key = getSelectionKey(item);
      if (selections[key]?.selected) {
        onToggle(item, categoryCode);
      }
    });
  }

  function handleSharedQtyChange(e) {
    const val = Math.max(0, parseInt(e.target.value, 10) || 0);
    setSharedQty(val);
    // Apply to currently selected item
    if (selectedInfo) {
      onQuantityChange(selectedInfo.item, val);
    }
  }

  // When toggling a radio item in a quantity group, apply the shared quantity
  function handleGroupToggle(item, catCode) {
    onToggle(item, catCode);
    // After toggling, if we have a shared quantity > 0, apply it
    // (the toggle sets quantity to 0 for needsQuantity items, so we override)
    if (groupNeedsQuantity && sharedQty > 0) {
      setTimeout(() => onQuantityChange(item, sharedQty), 0);
    }
  }

  // Compute line total for the shared quantity display
  const lineTotal = selectedInfo && groupNeedsQuantity
    ? (selectedInfo.item.price || 0) * effectiveQty
    : null;

  return (
    <div className="bg-warm-50/50 border border-warm-200 rounded-xl p-1 mb-3">
      {/* Group header */}
      <div className="text-base font-bold text-stone-700 px-3 py-2.5 border-b border-warm-200 mb-1 flex items-center justify-between">
        <span>{groupLabel}</span>
        {groupNeedsQuantity && unitLabel && (
          <span className="text-sm font-medium text-stone-600 bg-warm-100 rounded px-2 py-0.5">
            {unitBadgeLabel(unitLabel)}
          </span>
        )}
      </div>

      {/* Shared quantity input — shown at group level when items need quantity */}
      {groupNeedsQuantity && (
        <div className="px-4 py-2.5 border-b border-warm-200 bg-white/60">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm font-medium text-stone-700">
              {unitInputLabel(unitLabel)}:
            </label>
            <input
              type="number"
              min="0"
              value={effectiveQty}
              onChange={handleSharedQtyChange}
              className="border border-stone-300 rounded px-3 py-1.5 text-center w-24 text-[15px] focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label={`${unitInputLabel(unitLabel)} for ${groupLabel}`}
            />
            {anySelected && lineTotal != null && (
              <span className="text-sm text-stone-600">
                {effectiveQty} {unitInputLabel(unitLabel)} × {formatCurrency(selectedInfo.item.price)} = <strong className="text-stone-800">{formatCurrency(lineTotal)}</strong>
              </span>
            )}
            {!anySelected && effectiveQty > 0 && (
              <span className="text-sm text-warm-500 italic">Select an option below</span>
            )}
          </div>
        </div>
      )}

      {/* None option */}
      <div
        role="radio"
        aria-checked={!anySelected}
        tabIndex={0}
        onClick={handleNoneClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleNoneClick();
          }
        }}
        className="px-4 py-2.5 text-base text-stone-600 cursor-pointer hover:bg-warm-100 rounded flex items-center gap-2.5 min-h-[44px]"
      >
        <Circle
          size={20}
          className={anySelected ? 'text-stone-400' : 'text-blue-600 fill-blue-600'}
        />
        <span className="font-medium">None (no selection)</span>
      </div>

      {/* Option rows — hide individual qty inputs since we have shared one */}
      {items.map((item, idx) => {
        const key = getSelectionKey(item);
        const sel = selections[key];
        return (
          <OptionRow
            key={key}
            item={item}
            categoryCode={categoryCode}
            isRadio={true}
            isSelected={!!sel?.selected}
            quantity={sel?.quantity ?? 0}
            onToggle={groupNeedsQuantity ? handleGroupToggle : onToggle}
            onQuantityChange={onQuantityChange}
            index={idx}
            hideQuantityInput={groupNeedsQuantity}
          />
        );
      })}
    </div>
  );
}
