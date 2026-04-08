import { useState, memo } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { unitBadgeLabel, unitInputLabel } from '../utils/unitLabels';

const TRUNCATE_LENGTH = 120;

const OptionRow = memo(function OptionRow({
  item,
  categoryCode,
  isRadio = false,
  isSelected = false,
  quantity = 1,
  onToggle,
  onQuantityChange,
  index = 0,
  hideQuantityInput = false,
}) {
  const [expanded, setExpanded] = useState(false);

  const {
    optionCode,
    elevation,
    description,
    price,
    priceBlank,
    unit,
    needsQuantity,
    isStandard,
    elevationMismatch,
  } = item;

  const isInteractive = !isStandard && !priceBlank && !elevationMismatch;
  const isFree = !isStandard && !priceBlank && !elevationMismatch && price === 0;
  const isCredit = !isStandard && !priceBlank && price != null && price < 0;
  const showQtyInput = needsQuantity && isSelected && !hideQuantityInput && !elevationMismatch;
  const lineTotal = needsQuantity && isSelected ? price * (quantity || 0) : null;

  const descTruncated = description && description.length > TRUNCATE_LENGTH && !expanded
    ? description.slice(0, TRUNCATE_LENGTH).trimEnd() + '…'
    : description;

  const needsExpander = description && description.length > TRUNCATE_LENGTH;

  // Row background
  let rowBg = index % 2 === 0 ? 'bg-white' : 'bg-stone-50';
  let rowBorder = '';
  let rowOpacity = '';
  if (elevationMismatch) {
    rowBg = 'bg-stone-100';
    rowOpacity = 'opacity-50';
  } else if (isSelected) {
    rowBg = 'bg-amber-50';
    rowBorder = 'border-l-[3px] border-amber-600';
  } else if (isStandard) {
    rowBg = 'bg-stone-100';
    rowOpacity = 'opacity-75';
  } else if (priceBlank) {
    rowBg = 'bg-stone-100';
    rowOpacity = 'opacity-60';
  }

  function handleToggle() {
    if (!isInteractive) return;
    onToggle && onToggle(item, categoryCode);
  }

  function handleQtyChange(e) {
    const val = Math.max(0, parseInt(e.target.value, 10) || 0);
    onQuantityChange && onQuantityChange(item, val);
  }

  return (
    <div
      className={`option-row flex items-start gap-3 px-4 py-3 min-h-[52px] transition-colors ${rowBg} ${rowBorder} ${rowOpacity}`}
    >
      {/* Left: control */}
      <div className="flex-shrink-0 mt-1 w-5 min-w-[20px]">
        {elevationMismatch ? (
          <Circle className="w-5 h-5 text-stone-300" aria-hidden="true" />
        ) : isStandard ? (
          <CheckCircle2 className="w-5 h-5 text-stone-400" aria-hidden="true" />
        ) : priceBlank ? (
          <Circle className="w-5 h-5 text-stone-300" aria-hidden="true" />
        ) : isRadio ? (
          <button
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={handleToggle}
            className="w-5 h-5 rounded-full border-2 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1"
            style={{
              borderColor: isSelected ? '#92400e' : '#d6d3d1',
              backgroundColor: isSelected ? '#92400e' : 'transparent',
            }}
          >
            {isSelected && (
              <span className="w-2 h-2 rounded-full bg-white inline-block" />
            )}
          </button>
        ) : (
          <button
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            onClick={handleToggle}
            className="w-5 h-5 rounded border-2 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1"
            style={{
              borderColor: isSelected ? '#92400e' : '#d6d3d1',
              backgroundColor: isSelected ? '#92400e' : 'transparent',
            }}
          >
            {isSelected && (
              <svg
                className="w-3 h-3 text-white"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="2,6 5,9 10,3" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Middle: description */}
      <div className="flex-1 min-w-0">
        <div
          className={`text-[15px] leading-snug ${
            elevationMismatch ? 'text-stone-400' : isStandard ? 'text-stone-500' : priceBlank ? 'text-stone-400' : 'text-stone-800'
          } ${isInteractive ? 'cursor-pointer' : ''}`}
          onClick={isInteractive ? handleToggle : undefined}
        >
          {descTruncated}
          {needsExpander && (
            <button
              type="button"
              className="text-amber-700 text-sm ml-1 hover:text-amber-900 focus:outline-none focus:underline whitespace-nowrap"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1 mt-1">
          <span className="text-xs bg-stone-200 text-stone-600 rounded px-1.5 py-0.5 font-mono">
            {optionCode}
          </span>
          {elevation && (
            <span className="text-xs bg-blue-100 text-blue-700 rounded px-1.5 py-0.5">
              Elev {elevation}
            </span>
          )}
          {unit && (
            <span className="text-xs bg-amber-100 text-amber-700 rounded px-1.5 py-0.5">
              {unitBadgeLabel(unit)}
            </span>
          )}
        </div>

        {/* Quantity input */}
        {showQtyInput && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <input
              type="number"
              min="0"
              value={quantity}
              onChange={handleQtyChange}
              onClick={(e) => e.stopPropagation()}
              className="border border-stone-300 rounded px-2 py-1 text-center w-20 text-[15px] focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label={`${unitInputLabel(unit)} for ${description}`}
            />
            {unit && (
              <span className="text-sm text-stone-500">{unitInputLabel(unit)}</span>
            )}
            <span className="text-sm text-stone-500">
              × {formatCurrency(price)}
            </span>
            <span className="text-sm font-semibold text-stone-800">
              = {formatCurrency(lineTotal)}
            </span>
          </div>
        )}
      </div>

      {/* Right: price */}
      <div className="flex-shrink-0 text-right min-w-[140px]">
        {elevationMismatch ? (
          <span className="inline-block bg-stone-200 text-stone-500 text-xs px-2 py-1 rounded italic leading-tight">
            Not available for<br />this elevation
          </span>
        ) : isStandard ? (
          <span className="inline-block bg-stone-200 text-stone-600 text-xs px-2 py-0.5 rounded font-medium">
            ✓ Included
          </span>
        ) : priceBlank ? (
          <span className="text-stone-400 italic text-sm">Price TBD</span>
        ) : isFree ? (
          <span className="text-[15px] font-semibold text-stone-500">No Charge</span>
        ) : isCredit ? (
          <span className="text-[15px] font-semibold text-green-700">
            Credit: −{formatCurrency(Math.abs(price))}
          </span>
        ) : needsQuantity && isSelected ? (
          <span className="text-[15px] font-semibold text-stone-900">
            {formatCurrency(price)}
          </span>
        ) : (
          <span className="text-[15px] font-semibold text-stone-900">
            {formatCurrency(price)}
          </span>
        )}
      </div>
    </div>
  );
});

export default OptionRow;
