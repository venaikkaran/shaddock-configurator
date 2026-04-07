import { useState, useMemo } from 'react';
import { Home } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getSelectionKey } from '../utils/selectionKey';
import { getGroupBase } from '../utils/groupDetection';
import { detectAreaGroups, getAreaGroupedCodes } from '../utils/areaGrouping';
import OptionRow from './OptionRow';
import OptionGroup from './OptionGroup';
import AreaGroup from './AreaGroup';
import CustomOptions from './CustomOptions';

const PAGE_SIZE = 50;

function CategorySection({ category, groups, selections, onToggle, onQuantityChange, onClear, elevation }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const categoryGroups = groups[category.code] || {};

  // Build a lookup of elevationMismatch flags from the filtered category items
  const itemFlagLookup = useMemo(() => {
    const lookup = {};
    for (const item of category.items) {
      const key = item.optionCode + (item.elevation ? '_' + item.elevation : '');
      if (item.elevationMismatch) lookup[key] = true;
    }
    return lookup;
  }, [category.items]);

  // Augment group items with elevationMismatch flag from filtered data
  function flagGroupItems(items) {
    return items.map(item => {
      const key = item.optionCode + (item.elevation ? '_' + item.elevation : '');
      return itemFlagLookup[key] ? { ...item, elevationMismatch: true } : item;
    });
  }

  // Detect area groups for quantity items (Flatwork, Fence, Cabinet pairs, etc.)
  const areaGroups = useMemo(() => {
    return detectAreaGroups(category);
  }, [category]);

  const areaGroupedCodes = useMemo(() => {
    return getAreaGroupedCodes(areaGroups);
  }, [areaGroups]);

  // Determine which items are in radio groups
  const groupedItemCodes = useMemo(() => {
    const codes = new Set();
    for (const [, items] of Object.entries(categoryGroups)) {
      for (const item of items) {
        codes.add(item.optionCode + (item.elevation ? '_' + item.elevation : ''));
      }
    }
    return codes;
  }, [categoryGroups]);

  // Build ordered render list
  const renderList = useMemo(() => {
    const list = [];
    const addedBases = new Set();
    const addedAreaGroups = new Set();

    // First: area groups (for Flatwork, Fence, etc.)
    if (areaGroups) {
      for (const [label, group] of Object.entries(areaGroups)) {
        list.push({ type: 'areaGroup', label, group });
        for (const item of group.items) {
          addedAreaGroups.add(item.optionCode);
        }
      }
    }

    // Second: radio groups in order of first appearance
    for (const item of category.items) {
      if (item.isStandard || item.priceBlank) continue;
      if (addedAreaGroups.has(item.optionCode)) continue;
      const itemUniqueKey = item.optionCode + (item.elevation ? '_' + item.elevation : '');
      if (groupedItemCodes.has(itemUniqueKey)) {
        const base = getGroupBase(item.optionCode);
        if (base && categoryGroups[base] && !addedBases.has(base)) {
          addedBases.add(base);
          list.push({ type: 'group', base, items: flagGroupItems(categoryGroups[base]) });
        }
      }
    }

    // Third: standalone items (not in any group)
    for (const item of category.items) {
      const itemUniqueKey = item.optionCode + (item.elevation ? '_' + item.elevation : '');
      if (!groupedItemCodes.has(itemUniqueKey) && !areaGroupedCodes.has(item.optionCode)) {
        list.push({ type: 'item', item });
      }
    }

    return list;
  }, [category.items, categoryGroups, groupedItemCodes, areaGroups, areaGroupedCodes, itemFlagLookup]);

  const visibleList = renderList.slice(0, visibleCount);
  const hasMore = renderList.length > visibleCount;

  const hasSelections = useMemo(() => {
    return category.items.some(item => {
      const key = getSelectionKey(item);
      return selections[key]?.selected;
    });
  }, [category.items, selections]);

  if (category.code === 'CU') {
    return (
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-display text-stone-800">{category.name}</h2>
            <span className="text-sm text-warm-500 font-body">({category.items.length} items)</span>
          </div>
          {hasSelections && (
            <button
              onClick={() => onClear(category.code)}
              className="text-sm text-red-500 hover:text-red-700 transition-colors"
            >
              Clear selections in this category
            </button>
          )}
        </div>
        <CustomOptions category={category} selections={selections} />
      </div>
    );
  }

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-display text-stone-800">{category.name}</h2>
          <span className="text-sm text-warm-500 font-body">({category.items.length} items)</span>
        </div>
        {hasSelections && (
          <button
            onClick={() => onClear(category.code)}
            className="text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            Clear selections in this category
          </button>
        )}
      </div>

      <div className="space-y-2">
        {visibleList.map((entry, idx) => {
          if (entry.type === 'areaGroup') {
            return (
              <AreaGroup
                key={`area-${entry.label}`}
                label={entry.label}
                items={entry.group.items}
                unit={entry.group.unit}
                categoryCode={category.code}
                selections={selections}
                onToggle={onToggle}
                onQuantityChange={onQuantityChange}
              />
            );
          }
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
          }
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
              onToggle={(i, c) => onToggle(item, category.code)}
              onQuantityChange={(i, qty) => onQuantityChange(item, qty)}
              index={idx}
            />
          );
        })}
      </div>

      {hasMore && (
        <button
          onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
          className="mt-4 w-full py-3 text-brand-600 hover:bg-brand-50 rounded-lg border border-brand-200 text-center transition-colors font-body text-sm"
        >
          Show More ({renderList.length - visibleCount} remaining)
        </button>
      )}
    </div>
  );
}

export default function BrowseView() {
  const {
    filteredCategories,
    activeCategory,
    selections,
    groups,
    toggleSelection,
    updateQuantity,
    clearCategorySelections,
    searchQuery,
    elevation,
  } = useApp();

  const categoriesToShow = useMemo(() => {
    if (searchQuery && searchQuery.trim().length > 0) {
      return filteredCategories.filter(cat => cat.items.length > 0);
    }
    const cat = filteredCategories.find(c => c.code === activeCategory);
    return cat ? [cat] : [];
  }, [filteredCategories, activeCategory, searchQuery]);

  const isEmpty = categoriesToShow.length === 0 || categoriesToShow.every(c => c.items.length === 0);

  if (isEmpty) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col items-center justify-center h-64 text-warm-400">
          <Home className="w-12 h-12 mb-4 opacity-40" />
          <p className="text-lg font-body text-center">
            {searchQuery
              ? 'No options match your search.'
              : 'Select options from any category to start building your upgrade list'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {categoriesToShow.map(category => (
        <CategorySection
          key={category.code}
          category={category}
          groups={groups}
          selections={selections}
          onToggle={toggleSelection}
          onQuantityChange={updateQuantity}
          onClear={clearCategorySelections}
        />
      ))}
    </div>
  );
}
