import { useMemo, useState, useEffect } from 'react';
import { getSelectionKey } from '../utils/selectionKey';
import { formatCurrency } from '../utils/formatCurrency';
import { unitBadgeLabel, unitInputLabel } from '../utils/unitLabels';
import OptionRow from './OptionRow';

/**
 * AreaGroup renders items that share a physical measurement (e.g., same SF area).
 * User enters quantity once, then picks which option(s) apply.
 */
export default function AreaGroup({
  label,
  items,
  unit,
  categoryCode,
  selections,
  onToggle,
  onQuantityChange,
}) {
  // Local state for the shared quantity — source of truth for the input
  const [localQty, setLocalQty] = useState(() => {
    // Initialize from any existing selection
    for (const item of items) {
      const key = getSelectionKey(item);
      const sel = selections[key];
      if (sel?.selected && sel.quantity > 0) return sel.quantity;
    }
    return 0;
  });

  const selectedItems = useMemo(() => {
    return items.filter(item => {
      const key = getSelectionKey(item);
      return selections[key]?.selected;
    });
  }, [items, selections]);

  // Sync localQty FROM selections if a selected item's qty changes externally
  useEffect(() => {
    for (const item of items) {
      const key = getSelectionKey(item);
      const sel = selections[key];
      if (sel?.selected && sel.quantity > 0 && sel.quantity !== localQty) {
        setLocalQty(sel.quantity);
        return;
      }
    }
  }, [selections, items]);

  const areaTotal = useMemo(() => {
    let total = 0;
    for (const item of selectedItems) {
      const key = getSelectionKey(item);
      const qty = selections[key]?.quantity || 0;
      total += (item.price || 0) * qty;
    }
    return total;
  }, [selectedItems, selections]);

  function handleSharedQtyChange(e) {
    const val = Math.max(0, parseInt(e.target.value, 10) || 0);
    setLocalQty(val);
    // Apply to ALL currently selected items
    for (const item of selectedItems) {
      onQuantityChange(item, val);
    }
  }

  // Custom toggle that applies the shared qty when selecting
  function handleToggle(item, catCode) {
    const key = getSelectionKey(item);
    const isCurrentlySelected = selections[key]?.selected;

    onToggle(item, catCode);

    // If selecting (not deselecting) and we have a local qty, apply it
    if (!isCurrentlySelected && localQty > 0) {
      setTimeout(() => onQuantityChange(item, localQty), 0);
    }
  }

  const inputLabel = unitInputLabel(unit);

  return (
    <div className="bg-warm-50/50 border border-warm-200 rounded-xl p-1 mb-3">
      <div className="px-3 py-2 border-b border-warm-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-warm-700">{label}</span>
          {unit && (
            <span className="text-xs font-normal text-warm-500 bg-warm-100 rounded px-2 py-0.5">
              {unitBadgeLabel(unit)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm text-stone-600">
            {inputLabel}:
          </label>
          <input
            type="number"
            min="0"
            value={localQty}
            onChange={handleSharedQtyChange}
            className="border border-stone-300 rounded px-3 py-1.5 text-center w-24 text-[15px] focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label={`${inputLabel} for ${label}`}
          />
          {areaTotal > 0 && (
            <span className="text-sm font-semibold text-stone-800">
              = {formatCurrency(areaTotal)}
            </span>
          )}
          {localQty > 0 && selectedItems.length === 0 && (
            <span className="text-sm text-warm-500 italic">Select a finish below</span>
          )}
        </div>
      </div>

      {items.map((item, idx) => {
        const key = getSelectionKey(item);
        const sel = selections[key];
        return (
          <OptionRow
            key={key}
            item={item}
            categoryCode={categoryCode}
            isRadio={false}
            isSelected={!!sel?.selected}
            quantity={sel?.quantity ?? 0}
            onToggle={handleToggle}
            onQuantityChange={onQuantityChange}
            index={idx}
            hideQuantityInput={true}
          />
        );
      })}
    </div>
  );
}
