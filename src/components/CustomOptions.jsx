import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatCurrency';

const BATCH_SIZE = 20;

export default function CustomOptions({ items }) {
  const { customOptions, setCustomOptions } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);

  const totalSlots = items ? items.length : 299;

  function handleChange(optionCode, field, value) {
    setCustomOptions(prev => {
      const existing = prev[optionCode] || { description: '', price: 0, selected: false };
      const updated = { ...existing, [field]: value };

      // Auto-check when price > 0; auto-uncheck when price === 0 and was auto-checked
      if (field === 'price') {
        const numericPrice = parseFloat(value) || 0;
        updated.price = numericPrice;
        // Auto-check if price > 0, auto-uncheck only if description is also empty
        if (numericPrice > 0) {
          updated.selected = true;
        } else if (!updated.description) {
          updated.selected = false;
        }
      }

      if (field === 'description') {
        // If description cleared and price is 0, deselect
        if (!value && !updated.price) {
          updated.selected = false;
        }
      }

      return { ...prev, [optionCode]: updated };
    });
  }

  function handleSelectedToggle(optionCode) {
    setCustomOptions(prev => {
      const existing = prev[optionCode] || { description: '', price: 0, selected: false };
      return { ...prev, [optionCode]: { ...existing, selected: !existing.selected } };
    });
  }

  const visibleItems = items ? items.slice(0, visibleCount) : [];
  const hasMore = visibleCount < totalSlots;

  return (
    <div className="border border-warm-200 rounded-xl overflow-hidden">
      {/* Header toggle */}
      <button
        className="w-full px-4 py-3 bg-warm-50 cursor-pointer flex items-center justify-between hover:bg-warm-100 transition-colors"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <span className="font-medium text-stone-700">
          Custom Options — {totalSlots} slots
        </span>
        {expanded ? (
          <ChevronDown className="w-5 h-5 text-warm-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-warm-500" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div>
          {visibleItems.map((item, index) => {
            const key = item.optionCode;
            const state = customOptions[key] || { description: '', price: 0, selected: false };
            const hasContent = state.description || state.price > 0;

            return (
              <div
                key={key}
                className="px-4 py-2.5 border-b border-warm-100 flex items-center gap-3"
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-brand-500 flex-shrink-0"
                  checked={!!state.selected}
                  onChange={() => handleSelectedToggle(key)}
                  disabled={!hasContent}
                  aria-label={`Include Custom Option ${index + 1} in budget`}
                />

                {/* Option label */}
                <span className="text-sm text-warm-600 w-32 flex-shrink-0">
                  Custom Option {index + 1}
                </span>

                {/* Description input */}
                <input
                  type="text"
                  className="flex-1 bg-warm-50 border border-warm-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300"
                  placeholder="Enter description..."
                  value={state.description || ''}
                  onChange={e => handleChange(key, 'description', e.target.value)}
                  aria-label={`Description for Custom Option ${index + 1}`}
                />

                {/* Price input */}
                <input
                  type="number"
                  className="w-24 bg-warm-50 border border-warm-200 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300"
                  placeholder="$0"
                  min={0}
                  step={1}
                  value={state.price > 0 ? state.price : ''}
                  onChange={e => handleChange(key, 'price', e.target.value)}
                  aria-label={`Price for Custom Option ${index + 1}`}
                />

                {/* Formatted price display (when has value) */}
                {state.price > 0 && (
                  <span className="text-sm text-stone-600 w-24 text-right flex-shrink-0">
                    {formatCurrency(state.price)}
                  </span>
                )}
              </div>
            );
          })}

          {/* Show More button */}
          {hasMore && (
            <button
              className="w-full py-2.5 text-brand-600 hover:bg-brand-50 text-sm border-t border-warm-200 flex items-center justify-center gap-1.5 transition-colors"
              onClick={() => setVisibleCount(c => c + BATCH_SIZE)}
            >
              <Plus className="w-4 h-4" />
              Show {Math.min(BATCH_SIZE, totalSlots - visibleCount)} More
            </button>
          )}

          {/* Empty state */}
          {visibleItems.length === 0 && (
            <div className="px-4 py-6 text-center text-warm-500 text-sm">
              No custom option slots available.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
