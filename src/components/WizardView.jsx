import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getSelectionKey } from '../utils/selectionKey';
import { getGroupBase } from '../utils/groupDetection';
import { formatCurrency } from '../utils/formatCurrency';
import OptionRow from './OptionRow';
import OptionGroup from './OptionGroup';
import CustomOptions from './CustomOptions';

const PAGE_SIZE = 50;

function WizardCategoryContent({ category, groups, selections, onToggle, onQuantityChange }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const categoryGroups = groups[category.code] || {};

  const groupedItemKeys = useMemo(() => {
    const keys = new Set();
    for (const items of Object.values(categoryGroups)) {
      for (const item of items) {
        keys.add(item.optionCode + (item.elevation ? '_' + item.elevation : ''));
      }
    }
    return keys;
  }, [categoryGroups]);

  const renderList = useMemo(() => {
    const list = [];
    const addedBases = new Set();

    for (const item of category.items) {
      if (item.isStandard || item.priceBlank) continue;
      const itemUniqueKey = item.optionCode + (item.elevation ? '_' + item.elevation : '');
      if (groupedItemKeys.has(itemUniqueKey)) {
        const base = getGroupBase(item.optionCode);
        if (base && categoryGroups[base] && !addedBases.has(base)) {
          addedBases.add(base);
          list.push({ type: 'group', base, items: categoryGroups[base] });
        }
      }
    }

    for (const item of category.items) {
      const itemUniqueKey = item.optionCode + (item.elevation ? '_' + item.elevation : '');
      if (!groupedItemKeys.has(itemUniqueKey)) {
        list.push({ type: 'item', item });
      }
    }

    return list;
  }, [category.items, categoryGroups, groupedItemKeys]);

  const visibleList = renderList.slice(0, visibleCount);
  const hasMore = renderList.length > visibleCount;

  if (category.code === 'CU') {
    return <CustomOptions category={category} selections={selections} />;
  }

  return (
    <div className="space-y-2">
      {visibleList.map((entry) => {
        if (entry.type === 'group') {
          return (
            <OptionGroup
              key={`group-${entry.base}`}
              groupBase={entry.base}
              items={entry.items}
              categoryCode={category.code}
              selections={selections}
              onToggle={onToggle}
              onQuantityChange={onQuantityChange}
            />
          );
        } else {
          const item = entry.item;
          const key = getSelectionKey(item);
          const sel = selections[key];
          return (
            <OptionRow
              key={key}
              item={item}
              categoryCode={category.code}
              isRadio={false}
              isSelected={!!sel?.selected}
              quantity={sel?.quantity ?? 1}
              onToggle={() => onToggle(item, category.code)}
              onQuantityChange={(qty) => onQuantityChange(item, qty)}
            />
          );
        }
      })}

      {hasMore && (
        <button
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          className="mt-4 w-full py-3 text-brand-600 hover:bg-brand-50 rounded-lg border border-brand-200 text-center transition-colors font-body text-sm"
        >
          Show More ({renderList.length - visibleCount} remaining)
        </button>
      )}
    </div>
  );
}

export default function WizardView() {
  const {
    filteredCategories,
    wizardStep,
    setWizardStep,
    selections,
    groups,
    toggleSelection,
    updateQuantity,
    categoryCounts,
    categoryTotals,
    setViewMode,
  } = useApp();

  const totalSteps = filteredCategories.length;
  const currentCategory = filteredCategories[wizardStep] || null;

  const isFirstStep = wizardStep === 0;
  const isLastStep = wizardStep === totalSteps - 1;

  const progressPercent = totalSteps > 0 ? ((wizardStep + 1) / totalSteps) * 100 : 0;

  const selectedCount = currentCategory ? (categoryCounts[currentCategory.code] || 0) : 0;
  const categorySpend = currentCategory ? (categoryTotals[currentCategory.code] || 0) : 0;

  function handleBack() {
    if (!isFirstStep) {
      setWizardStep(wizardStep - 1);
    }
  }

  function handleNext() {
    if (isLastStep) {
      setViewMode('browse');
    } else {
      setWizardStep(wizardStep + 1);
    }
  }

  function handleSkip() {
    if (!isLastStep) {
      setWizardStep(wizardStep + 1);
    } else {
      setViewMode('browse');
    }
  }

  if (!currentCategory) {
    return (
      <div className="flex-1 overflow-y-auto flex items-center justify-center">
        <p className="text-warm-400 font-body text-lg">No categories available.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {/* Progress section — sticky top */}
      <div className="px-6 py-4 bg-white border-b border-warm-200 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-lg font-display text-stone-700">
            Step {wizardStep + 1} of {totalSteps} &mdash; {currentCategory.name}
          </p>
          <span className="text-sm font-body text-warm-500">
            {Math.round(progressPercent)}% complete
          </span>
        </div>

        {/* Thin progress bar */}
        <div className="h-1.5 bg-warm-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Category summary */}
        <div className="mt-2 flex items-center gap-4 text-sm font-body text-warm-600">
          <span>
            {selectedCount === 0
              ? 'No items selected in this category'
              : `${selectedCount} item${selectedCount !== 1 ? 's' : ''} selected`}
          </span>
          {categorySpend > 0 && (
            <>
              <span className="text-warm-300">&bull;</span>
              <span className="font-medium text-stone-700">{formatCurrency(categorySpend)} spent in this category</span>
            </>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="px-6 py-4 flex-1">
        <WizardCategoryContent
          category={currentCategory}
          groups={groups}
          selections={selections}
          onToggle={toggleSelection}
          onQuantityChange={updateQuantity}
        />
      </div>

      {/* Navigation buttons — sticky bottom */}
      <div className="flex justify-between items-center px-6 py-4 bg-white border-t border-warm-200 sticky bottom-0">
        <button
          onClick={handleBack}
          disabled={isFirstStep}
          className={`min-h-[48px] px-6 rounded-lg font-medium flex items-center gap-2 transition-colors font-body ${
            isFirstStep
              ? 'bg-warm-100 text-warm-300 cursor-not-allowed'
              : 'bg-warm-100 text-warm-700 hover:bg-warm-200'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>

        <button
          onClick={handleSkip}
          className="min-h-[48px] px-4 rounded-lg font-medium flex items-center gap-2 transition-colors text-warm-500 hover:text-warm-700 font-body"
        >
          <SkipForward className="w-4 h-4" />
          Skip
        </button>

        <button
          onClick={handleNext}
          className="min-h-[48px] px-6 rounded-lg font-medium flex items-center gap-2 transition-colors font-body bg-brand-600 text-white hover:bg-brand-700"
        >
          {isLastStep ? 'Finish' : 'Next'}
          {!isLastStep && <ChevronRight className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
