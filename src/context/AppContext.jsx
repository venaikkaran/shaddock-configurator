import { createContext, useState, useEffect, useMemo, useCallback, useContext, useRef } from 'react';
import { debounce } from 'lodash';
import { getSelectionKey } from '../utils/selectionKey';
import { detectGroups, getGroupBase, isAdditiveCategory, CROSS_GROUP_EXCLUSIONS } from '../utils/groupDetection';
import { mapItemsToRooms, filterRoomSections } from '../utils/roomMapping';

const AppContext = createContext(null);

const LS_KEYS = {
  selections: 'shaddock_selections',
  customOptions: 'shaddock_custom_options',
  budget: 'shaddock_budget',
  thresholds: 'shaddock_thresholds',
  elevation: 'shaddock_elevation',
  savedConfigs: 'shaddock_saved_configs',
  browseMode: 'shaddock_browse_mode',
  activeRoom: 'shaddock_active_room',
};

function loadFromLS(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState(() => loadFromLS(LS_KEYS.selections, {}));
  const [customOptions, setCustomOptions] = useState(() => loadFromLS(LS_KEYS.customOptions, {}));
  const [elevation, setElevation] = useState(() => loadFromLS(LS_KEYS.elevation, null));
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('browse');
  const [browseMode, setBrowseMode] = useState(() => loadFromLS(LS_KEYS.browseMode, 'room')); // 'room' | 'trade'
  const [activeRoom, setActiveRoom] = useState(() => loadFromLS(LS_KEYS.activeRoom, null)); // room section ID for room view
  const [wizardStep, setWizardStep] = useState(0);
  const [budget, setBudget] = useState(() => loadFromLS(LS_KEYS.budget, null));
  const [yellowThreshold, setYellowThreshold] = useState(() => {
    const t = loadFromLS(LS_KEYS.thresholds, null);
    return t?.yellow ?? 0.01;
  });
  const [redThreshold, setRedThreshold] = useState(() => {
    const t = loadFromLS(LS_KEYS.thresholds, null);
    return t?.red ?? 0.05;
  });
  const [savedConfigs, setSavedConfigs] = useState(() => loadFromLS(LS_KEYS.savedConfigs, []));

  // Load data
  useEffect(() => {
    fetch('./options.json')
      .then(r => r.json())
      .then(d => {
        setData(d);
        if (!activeCategory && d.categories.length > 0) {
          setActiveCategory(d.categories[0].code);
        }
        // Set default room for room view (only if not already set from localStorage)
        const rooms = mapItemsToRooms(d.categories);
        if (rooms.length > 0) {
          setActiveRoom(prev => prev ?? rooms[0].id);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Debounced localStorage persistence
  const debouncedSave = useRef(
    debounce((key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        // localStorage quota exceeded or unavailable — silently ignore
      }
    }, 500)
  ).current;

  useEffect(() => { debouncedSave(LS_KEYS.selections, selections); }, [selections]);
  useEffect(() => { debouncedSave(LS_KEYS.customOptions, customOptions); }, [customOptions]);
  useEffect(() => { debouncedSave(LS_KEYS.budget, budget); }, [budget]);
  useEffect(() => { debouncedSave(LS_KEYS.elevation, elevation); }, [elevation]);
  useEffect(() => { debouncedSave(LS_KEYS.savedConfigs, savedConfigs); }, [savedConfigs]);
  useEffect(() => { debouncedSave(LS_KEYS.browseMode, browseMode); }, [browseMode]);
  useEffect(() => { debouncedSave(LS_KEYS.activeRoom, activeRoom); }, [activeRoom]);
  useEffect(() => {
    debouncedSave(LS_KEYS.thresholds, { yellow: yellowThreshold, red: redThreshold });
  }, [yellowThreshold, redThreshold]);

  // Mutual exclusion groups
  const groups = useMemo(() => {
    if (!data) return {};
    return detectGroups(data.categories);
  }, [data]);

  // Item lookup map
  const itemMap = useMemo(() => {
    if (!data) return {};
    const map = {};
    for (const cat of data.categories) {
      for (const item of cat.items) {
        const key = getSelectionKey(item);
        map[key] = { ...item, categoryCode: cat.code, categoryName: cat.name };
      }
    }
    return map;
  }, [data]);

  // Toggle selection
  const toggleSelection = useCallback((item, categoryCode) => {
    const key = getSelectionKey(item);
    setSelections(prev => {
      const next = { ...prev };
      const isCurrentlySelected = prev[key]?.selected;

      if (isCurrentlySelected) {
        delete next[key];
        return next;
      }

      // If this is a radio group item, deselect others in the group
      if (!isAdditiveCategory(categoryCode) && groups[categoryCode]) {
        const base = getGroupBase(item.optionCode);
        if (groups[categoryCode][base]) {
          // Remove all items in this radio group
          for (const groupItem of groups[categoryCode][base]) {
            const gKey = getSelectionKey(groupItem);
            delete next[gKey];
          }
        }
      }

      // Cross-group mutual exclusions: deselect items from competing groups
      const itemBase = getGroupBase(item.optionCode);
      for (const exclusion of CROSS_GROUP_EXCLUSIONS) {
        if (exclusion.categoryCode !== categoryCode) continue;
        // Find which exclusion group this item belongs to
        const myGroup = exclusion.groups.find(g => g.bases.includes(itemBase));
        if (!myGroup) continue;
        // Deselect items from all OTHER competing groups
        for (const otherGroup of exclusion.groups) {
          if (otherGroup === myGroup) continue;
          for (const otherBase of otherGroup.bases) {
            const catGroups = groups[categoryCode];
            if (catGroups && catGroups[otherBase]) {
              for (const otherItem of catGroups[otherBase]) {
                delete next[getSelectionKey(otherItem)];
              }
            }
            // Also remove standalone items with this base (not in detected groups)
            for (const [selKey] of Object.entries(next)) {
              const mapped = itemMap[selKey];
              if (mapped && mapped.categoryCode === categoryCode && getGroupBase(mapped.optionCode) === otherBase) {
                delete next[selKey];
              }
            }
          }
        }
      }

      next[key] = { selected: true, quantity: item.needsQuantity ? 0 : 1 };
      return next;
    });
  }, [groups, itemMap]);

  // Update quantity
  const updateQuantity = useCallback((item, quantity) => {
    const key = getSelectionKey(item);
    setSelections(prev => ({
      ...prev,
      [key]: { selected: quantity > 0, quantity: Math.max(0, quantity) },
    }));
  }, []);

  // Total cost
  const totalCost = useMemo(() => {
    let total = 0;
    for (const [key, sel] of Object.entries(selections)) {
      if (!sel.selected) continue;
      const item = itemMap[key];
      if (item && item.price != null) {
        total += item.needsQuantity ? item.price * (sel.quantity || 0) : item.price;
      }
    }
    for (const [, custom] of Object.entries(customOptions)) {
      if (custom.selected && custom.price) {
        total += custom.price;
      }
    }
    return total;
  }, [selections, customOptions, itemMap]);

  // Per-category totals
  const categoryTotals = useMemo(() => {
    const totals = {};
    for (const [key, sel] of Object.entries(selections)) {
      if (!sel.selected) continue;
      const item = itemMap[key];
      if (item && item.price != null) {
        const catCode = item.categoryCode;
        const amount = item.needsQuantity ? item.price * (sel.quantity || 0) : item.price;
        totals[catCode] = (totals[catCode] || 0) + amount;
      }
    }
    // Custom options go to CU
    for (const [, custom] of Object.entries(customOptions)) {
      if (custom.selected && custom.price) {
        totals['CU'] = (totals['CU'] || 0) + custom.price;
      }
    }
    return totals;
  }, [selections, customOptions, itemMap]);

  // Per-category selection counts
  const categoryCounts = useMemo(() => {
    const counts = {};
    for (const [key, sel] of Object.entries(selections)) {
      if (!sel.selected) continue;
      const item = itemMap[key];
      if (!item) continue;
      // needsQuantity items with qty=0 don't count as selected
      if (item.needsQuantity && (!sel.quantity || sel.quantity <= 0)) continue;
      counts[item.categoryCode] = (counts[item.categoryCode] || 0) + 1;
    }
    for (const [, custom] of Object.entries(customOptions)) {
      if (custom.selected) {
        counts['CU'] = (counts['CU'] || 0) + 1;
      }
    }
    return counts;
  }, [selections, customOptions, itemMap]);

  // Budget status
  const budgetStatus = useMemo(() => {
    if (budget == null || budget <= 0) return 'none';
    if (totalCost <= budget) return 'under';
    if (totalCost <= budget * (1 + yellowThreshold)) return 'yellow';
    return 'red';
  }, [totalCost, budget, yellowThreshold]);

  // Filtered categories based on elevation + search
  // Elevation-mismatched items are kept but flagged (not removed)
  const filteredCategories = useMemo(() => {
    if (!data) return [];
    return data.categories.map(cat => {
      let items = cat.items.map(item => {
        // Flag elevation mismatch: item has a specific elevation that doesn't match selection
        const elevationMismatch = elevation
          && item.elevation !== null
          && item.elevation !== elevation;
        return elevationMismatch ? { ...item, elevationMismatch: true } : item;
      });

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        items = items.filter(item =>
          item.description.toLowerCase().includes(q) ||
          item.optionCode.toLowerCase().includes(q)
        );
      }

      return { ...cat, items };
    });
  }, [data, elevation, searchQuery]);

  // Room-based sections (computed from raw data)
  const roomSectionsRaw = useMemo(() => {
    if (!data) return [];
    return mapItemsToRooms(data.categories);
  }, [data]);

  // Filtered room sections (elevation + search applied)
  const roomSections = useMemo(() => {
    return filterRoomSections(roomSectionsRaw, elevation, searchQuery);
  }, [roomSectionsRaw, elevation, searchQuery]);

  // Save config
  const saveConfig = useCallback((name) => {
    const config = {
      id: Date.now().toString(),
      name,
      timestamp: new Date().toISOString(),
      elevation,
      selections: { ...selections },
      customOptions: { ...customOptions },
      budget,
      totalCost,
    };
    setSavedConfigs(prev => [config, ...prev].slice(0, 20));
  }, [selections, customOptions, elevation, budget, totalCost]);

  // Load config
  const loadConfig = useCallback((config) => {
    setSelections(config.selections || {});
    setCustomOptions(config.customOptions || {});
    if (config.elevation !== undefined) setElevation(config.elevation);
    if (config.budget !== undefined) setBudget(config.budget);
  }, []);

  // Delete config
  const deleteConfig = useCallback((id) => {
    setSavedConfigs(prev => prev.filter(c => c.id !== id));
  }, []);

  // Rename config
  const renameConfig = useCallback((id, newName) => {
    setSavedConfigs(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
  }, []);

  // Clear all selections
  const clearAllSelections = useCallback(() => {
    setSelections({});
    setCustomOptions({});
  }, []);

  // Clear category selections
  const clearCategorySelections = useCallback((categoryCode) => {
    setSelections(prev => {
      const next = {};
      for (const [key, sel] of Object.entries(prev)) {
        const item = itemMap[key];
        if (item && item.categoryCode !== categoryCode) {
          next[key] = sel;
        }
      }
      return next;
    });
    if (categoryCode === 'CU') {
      setCustomOptions({});
    }
  }, [itemMap]);

  const value = {
    data,
    loading,
    selections,
    setSelections,
    customOptions,
    setCustomOptions,
    elevation,
    setElevation,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    wizardStep,
    setWizardStep,
    budget,
    setBudget,
    yellowThreshold,
    setYellowThreshold,
    redThreshold,
    setRedThreshold,
    savedConfigs,
    setSavedConfigs,
    groups,
    itemMap,
    toggleSelection,
    updateQuantity,
    totalCost,
    categoryTotals,
    categoryCounts,
    budgetStatus,
    filteredCategories,
    browseMode,
    setBrowseMode,
    activeRoom,
    setActiveRoom,
    roomSections,
    roomSectionsRaw,
    saveConfig,
    loadConfig,
    deleteConfig,
    renameConfig,
    clearAllSelections,
    clearCategorySelections,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
