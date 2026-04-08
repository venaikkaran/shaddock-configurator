import { useState, useMemo } from 'react';
import { Home, AlertTriangle, Info, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getSelectionKey } from '../utils/selectionKey';
import { getGroupBase } from '../utils/groupDetection';
import { detectAreaGroups, getAreaGroupedCodes } from '../utils/areaGrouping';
import { detectFlooringConflicts, getCrossReferences } from '../utils/roomMapping';
import OptionRow from './OptionRow';
import OptionGroup from './OptionGroup';
import AreaGroup from './AreaGroup';
import CustomOptions from './CustomOptions';

const PAGE_SIZE = 50;

/**
 * Renders items within a single subgroup (one trade category's items within a room).
 * Mirrors the rendering logic from BrowseView's CategorySection.
 */
function SubgroupSection({
  subgroup,
  groups,
  selections,
  onToggle,
  onQuantityChange,
  elevation,
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { categoryCode, categoryName, label, items } = subgroup;

  // Filter radio groups to only include items in this subgroup
  const subgroupItemKeys = useMemo(() => {
    const keys = new Set();
    for (const item of items) {
      keys.add(getSelectionKey(item));
    }
    return keys;
  }, [items]);

  const categoryGroups = useMemo(() => {
    const fullGroups = groups[categoryCode] || {};
    const filtered = {};
    for (const [base, groupItems] of Object.entries(fullGroups)) {
      const roomItems = groupItems.filter(item => {
        const key = getSelectionKey(item);
        return subgroupItemKeys.has(key);
      });
      if (roomItems.length >= 2) {
        filtered[base] = roomItems;
      }
    }
    return filtered;
  }, [groups, categoryCode, subgroupItemKeys]);

  // Build a lookup of elevationMismatch flags from the filtered items
  const itemFlagLookup = useMemo(() => {
    const lookup = {};
    for (const item of items) {
      const key = item.optionCode + (item.elevation ? '_' + item.elevation : '');
      if (item.elevationMismatch) lookup[key] = true;
    }
    return lookup;
  }, [items]);

  // Augment group items with elevationMismatch flag from filtered data
  function flagGroupItems(groupItems) {
    return groupItems.map(item => {
      const key = item.optionCode + (item.elevation ? '_' + item.elevation : '');
      return itemFlagLookup[key] ? { ...item, elevationMismatch: true } : item;
    });
  }

  // Detect area groups for quantity items
  const fakeCategory = useMemo(() => ({ code: categoryCode, items }), [categoryCode, items]);
  const areaGroups = useMemo(() => detectAreaGroups(fakeCategory), [fakeCategory]);
  const areaGroupedCodes = useMemo(() => getAreaGroupedCodes(areaGroups), [areaGroups]);

  // Determine which items are in radio groups
  const groupedItemCodes = useMemo(() => {
    const codes = new Set();
    for (const [, groupItems] of Object.entries(categoryGroups)) {
      for (const item of groupItems) {
        codes.add(item.optionCode + (item.elevation ? '_' + item.elevation : ''));
      }
    }
    return codes;
  }, [categoryGroups]);

  // Build ordered render list (same logic as BrowseView CategorySection)
  const renderList = useMemo(() => {
    const list = [];
    const addedBases = new Set();
    const addedAreaGroups = new Set();

    // First: area groups
    if (areaGroups) {
      for (const [areaLabel, group] of Object.entries(areaGroups)) {
        list.push({ type: 'areaGroup', label: areaLabel, group });
        for (const item of group.items) {
          addedAreaGroups.add(item.optionCode);
        }
      }
    }

    // Second: radio groups in order of first appearance
    for (const item of items) {
      if (item.isStandard || item.priceBlank) continue;
      if (addedAreaGroups.has(item.optionCode)) continue;
      const itemUniqueKey = getSelectionKey(item);
      if (groupedItemCodes.has(itemUniqueKey)) {
        const base = getGroupBase(item.optionCode);
        if (base && categoryGroups[base] && !addedBases.has(base)) {
          addedBases.add(base);
          list.push({ type: 'group', base, items: flagGroupItems(categoryGroups[base]) });
        }
      }
    }

    // Third: standalone items
    for (const item of items) {
      const itemUniqueKey = getSelectionKey(item);
      if (!groupedItemCodes.has(itemUniqueKey) && !areaGroupedCodes.has(item.optionCode)) {
        list.push({ type: 'item', item });
      }
    }

    return list;
  }, [items, categoryGroups, groupedItemCodes, areaGroups, areaGroupedCodes, itemFlagLookup]);

  const visibleList = renderList.slice(0, visibleCount);
  const hasMore = renderList.length > visibleCount;

  return (
    <div className="mb-6">
      {/* Subgroup heading */}
      <div className="border-b border-warm-200 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-warm-700">{label}</h3>
          <span className="text-sm text-warm-400 font-body">({items.length} items)</span>
        </div>
        <p className="text-xs text-warm-400 font-body mt-0.5">
          Category: {categoryName} ({categoryCode})
        </p>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {visibleList.map((entry, idx) => {
          if (entry.type === 'areaGroup') {
            return (
              <AreaGroup
                key={`area-${entry.label}`}
                label={entry.label}
                items={entry.group.items}
                unit={entry.group.unit}
                categoryCode={categoryCode}
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
                categoryCode={categoryCode}
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
              categoryCode={categoryCode}
              isRadio={false}
              isSelected={!!sel?.selected}
              quantity={sel?.quantity ?? 1}
              onToggle={() => onToggle(item, categoryCode)}
              onQuantityChange={(i, qty) => onQuantityChange(item, qty)}
              index={idx}
            />
          );
        })}
      </div>

      {hasMore && (
        <button
          onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
          className="mt-3 w-full py-2.5 text-brand-600 hover:bg-brand-50 rounded-lg border border-brand-200 text-center transition-colors font-body text-sm"
        >
          Show More ({renderList.length - visibleCount} remaining)
        </button>
      )}
    </div>
  );
}

/**
 * Renders a single room section with all its subgroups.
 */
function RoomSection({
  room,
  groups,
  selections,
  onToggle,
  onQuantityChange,
  onClearRoom,
  elevation,
}) {
  const { customOptions } = useApp();

  const hasSelections = useMemo(() => {
    for (const subgroup of room.subgroups) {
      if (subgroup.categoryCode === 'CU') {
        // Check customOptions for CU items
        if (Object.values(customOptions).some(c => c.selected)) return true;
        continue;
      }
      for (const item of subgroup.items) {
        const key = getSelectionKey(item);
        if (selections[key]?.selected) return true;
      }
    }
    return false;
  }, [room.subgroups, selections, customOptions]);

  // Detect flooring conflicts within this room
  const flooringConflicts = useMemo(() => {
    return detectFlooringConflicts(selections, room.subgroups);
  }, [room, selections]);

  // Get cross-references for this room
  const crossRefs = useMemo(() => {
    return getCrossReferences(room.id);
  }, [room.id]);

  // Check if this room has custom options
  const customSubgroup = room.subgroups.find(sg => sg.categoryCode === 'CU');
  const regularSubgroups = room.subgroups.filter(sg => sg.categoryCode !== 'CU');

  return (
    <div className="mb-10">
      {/* Room heading */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-display text-stone-800">{room.name}</h2>
          {room.description && (
            <p className="text-sm text-warm-500 font-body mt-0.5">{room.description}</p>
          )}
        </div>
        {hasSelections && (
          <button
            onClick={() => onClearRoom(room)}
            className="text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            Clear selections in this room
          </button>
        )}
      </div>

      {/* Flooring conflict warning */}
      {flooringConflicts && (
        <div className="flex items-start gap-3 p-3 mb-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Flooring Conflict</p>
            <p className="text-sm text-amber-700 mt-0.5">{flooringConflicts}</p>
          </div>
        </div>
      )}

      {/* Regular subgroups */}
      {regularSubgroups.map(subgroup => (
        <SubgroupSection
          key={`${subgroup.categoryCode}-${subgroup.label}`}
          subgroup={subgroup}
          groups={groups}
          selections={selections}
          onToggle={onToggle}
          onQuantityChange={onQuantityChange}
          elevation={elevation}
        />
      ))}

      {/* Custom options subgroup */}
      {customSubgroup && (
        <div className="mb-6">
          <div className="border-b border-warm-200 pb-2 mb-3">
            <h3 className="text-lg font-semibold text-warm-700">{customSubgroup.label}</h3>
            <p className="text-xs text-warm-400 font-body mt-0.5">
              Category: {customSubgroup.categoryName} ({customSubgroup.categoryCode})
            </p>
          </div>
          <CustomOptions items={customSubgroup.items} />
        </div>
      )}

      {/* Cross-references */}
      {crossRefs && crossRefs.length > 0 && (
        <div className="flex items-start gap-3 p-3 mt-4 bg-blue-50 border border-blue-100 rounded-lg">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-700">See also</p>
            <ul className="mt-1">
              {crossRefs.map((ref, i) => (
                <li key={`${ref.targetRoom}-${i}`} className="text-sm text-blue-700 flex items-center gap-1">
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span>{ref.label}</span>
                  {ref.detail && <span className="text-blue-500">— {ref.detail}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * RoomView — renders items organized by room/zone instead of trade category.
 * Uses the same OptionRow, OptionGroup, AreaGroup, and CustomOptions components
 * as BrowseView but grouped by physical location in the home.
 */
export default function RoomView() {
  const {
    roomSections,
    activeRoom,
    selections,
    groups,
    toggleSelection,
    updateQuantity,
    setSelections,
    setCustomOptions,
    searchQuery,
    elevation,
  } = useApp();

  // If roomSections isn't available yet (context not wired), show loading state
  if (!roomSections) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col items-center justify-center h-64 text-warm-400">
          <Home className="w-12 h-12 mb-4 opacity-40" />
          <p className="text-lg font-body text-center">Loading room view...</p>
        </div>
      </div>
    );
  }

  // Determine which rooms to show
  const roomsToShow = useMemo(() => {
    if (searchQuery && searchQuery.trim().length > 0) {
      // When searching, show all rooms that have matching items
      return roomSections.filter(room =>
        room.subgroups.some(sg => sg.items.length > 0)
      );
    }
    // Otherwise show the active room
    const room = roomSections.find(r => r.id === activeRoom);
    return room ? [room] : [];
  }, [roomSections, activeRoom, searchQuery]);

  // Handler to clear only the selections that belong to items in this room
  function handleClearRoom(room) {
    if (!window.confirm(`Clear all selections in ${room.name}? This cannot be undone.`)) return;
    // Collect all item keys that belong to this room
    const roomItemKeys = new Set();
    for (const sg of room.subgroups) {
      if (sg.categoryCode === 'CU') continue; // Custom options handled separately
      for (const item of sg.items) {
        roomItemKeys.add(getSelectionKey(item));
      }
    }
    // Remove only those selections
    setSelections(prev => {
      const next = {};
      for (const [key, sel] of Object.entries(prev)) {
        if (!roomItemKeys.has(key)) {
          next[key] = sel;
        }
      }
      return next;
    });
    // If room has CU subgroup, clear custom options too
    if (room.subgroups.some(sg => sg.categoryCode === 'CU')) {
      setCustomOptions({});
    }
  }

  // Empty state
  if (roomsToShow.length === 0 || roomsToShow.every(r => r.subgroups.every(sg => sg.items.length === 0))) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col items-center justify-center h-64 text-warm-400">
          <Home className="w-12 h-12 mb-4 opacity-40" />
          <p className="text-lg font-body text-center">
            {searchQuery
              ? 'No options match your search in any room.'
              : 'Select a room from the sidebar to browse upgrade options by location.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {roomsToShow.map(room => (
        <RoomSection
          key={room.id}
          room={room}
          groups={groups}
          selections={selections}
          onToggle={toggleSelection}
          onQuantityChange={updateQuantity}
          onClearRoom={handleClearRoom}
          elevation={elevation}
        />
      ))}
    </div>
  );
}
