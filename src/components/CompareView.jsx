import { useState, useMemo } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatCurrency';

function computeConfigStats(config, itemMap, data) {
  const { selections = {}, customOptions = {}, budget } = config;

  // Total cost
  let totalCost = 0;
  for (const [key, sel] of Object.entries(selections)) {
    if (!sel.selected) continue;
    const item = itemMap[key];
    if (item && item.price != null) {
      totalCost += item.needsQuantity ? item.price * (sel.quantity || 0) : item.price;
    }
  }
  for (const [, custom] of Object.entries(customOptions)) {
    if (custom.selected && custom.price) {
      totalCost += custom.price;
    }
  }

  // Per-category totals
  const categoryTotals = {};
  for (const [key, sel] of Object.entries(selections)) {
    if (!sel.selected) continue;
    const item = itemMap[key];
    if (item && item.price != null) {
      const amount = item.needsQuantity ? item.price * (sel.quantity || 0) : item.price;
      categoryTotals[item.categoryCode] = (categoryTotals[item.categoryCode] || 0) + amount;
    }
  }
  for (const [, custom] of Object.entries(customOptions)) {
    if (custom.selected && custom.price) {
      categoryTotals['CU'] = (categoryTotals['CU'] || 0) + custom.price;
    }
  }

  // Set of selected keys
  const selectedKeys = new Set(
    Object.entries(selections)
      .filter(([, sel]) => sel.selected)
      .map(([key]) => key)
  );
  const selectedCustomKeys = new Set(
    Object.entries(customOptions)
      .filter(([, c]) => c.selected)
      .map(([key]) => key)
  );

  return { totalCost, categoryTotals, selectedKeys, selectedCustomKeys, budget };
}

export default function CompareView() {
  const { savedConfigs, setViewMode, data, itemMap } = useApp();
  const [pickedIds, setPickedIds] = useState([]);
  const [comparing, setComparing] = useState(false);

  const togglePick = (id) => {
    setPickedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, id];
    });
  };

  const pickedConfigs = useMemo(
    () => pickedIds.map(id => savedConfigs.find(c => c.id === id)).filter(Boolean),
    [pickedIds, savedConfigs]
  );

  const configStats = useMemo(() => {
    if (!data) return [];
    return pickedConfigs.map(cfg => computeConfigStats(cfg, itemMap, data));
  }, [pickedConfigs, itemMap, data]);

  // Categories that appear in at least one config's totals
  const relevantCategories = useMemo(() => {
    if (!data) return [];
    const codes = new Set();
    for (const stats of configStats) {
      for (const code of Object.keys(stats.categoryTotals)) {
        codes.add(code);
      }
    }
    return data.categories.filter(cat => codes.has(cat.code));
  }, [data, configStats]);

  // All unique selected item keys across all configs
  const allSelectedKeys = useMemo(() => {
    const keys = new Set();
    for (const stats of configStats) {
      for (const key of stats.selectedKeys) keys.add(key);
    }
    return [...keys];
  }, [configStats]);

  // Items that differ between configs (present in some, absent in others)
  const diffItems = useMemo(() => {
    if (configStats.length < 2) return [];
    return allSelectedKeys.filter(key => {
      const presences = configStats.map(s => s.selectedKeys.has(key));
      return !presences.every(Boolean) && presences.some(Boolean);
    }).map(key => ({
      key,
      item: itemMap[key],
      presences: configStats.map(s => s.selectedKeys.has(key)),
    })).filter(d => d.item);
  }, [allSelectedKeys, configStats, itemMap]);

  // Group diff items by category
  const diffByCategory = useMemo(() => {
    const groups = {};
    for (const diff of diffItems) {
      const code = diff.item.categoryCode;
      if (!groups[code]) groups[code] = { code, name: diff.item.categoryName, items: [] };
      groups[code].items.push(diff);
    }
    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
  }, [diffItems]);

  const handleStartCompare = () => {
    if (pickedIds.length >= 2) setComparing(true);
  };

  const handleBack = () => {
    setComparing(false);
    setPickedIds([]);
  };

  const handleExit = () => {
    setViewMode('browse');
  };

  // Not enough saved configs
  if (savedConfigs.length < 2) {
    return (
      <div className="p-6 overflow-y-auto flex-1">
        <button
          onClick={handleExit}
          className="flex items-center gap-2 text-warm-600 hover:text-warm-800 mb-4 text-base"
        >
          <ArrowLeft size={18} />
          Exit Compare
        </button>
        <div className="text-center py-12 text-warm-400">
          <p className="text-xl font-medium mb-2">Not enough saved configurations</p>
          <p className="text-base">Save at least 2 configurations to compare them.</p>
        </div>
      </div>
    );
  }

  // Step 1: Pick configs
  if (!comparing) {
    return (
      <div className="p-6 overflow-y-auto flex-1">
        <button
          onClick={handleExit}
          className="flex items-center gap-2 text-warm-600 hover:text-warm-800 mb-6 text-base"
        >
          <ArrowLeft size={18} />
          Exit Compare
        </button>

        <h2 className="text-2xl font-bold text-warm-900 mb-2">Compare Configurations</h2>
        <p className="text-warm-500 mb-6 text-base">Select 2 or 3 saved configurations to compare side by side.</p>

        <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto mb-8">
          {savedConfigs.map(cfg => {
            const isSelected = pickedIds.includes(cfg.id);
            const isDisabled = !isSelected && pickedIds.length >= 3;
            return (
              <button
                key={cfg.id}
                onClick={() => !isDisabled && togglePick(cfg.id)}
                disabled={isDisabled}
                className={[
                  'border rounded-xl p-4 cursor-pointer text-left transition-colors',
                  isSelected
                    ? 'border-brand-500 bg-brand-50'
                    : isDisabled
                      ? 'border-warm-100 bg-warm-50 opacity-50 cursor-not-allowed'
                      : 'border-warm-200 bg-white hover:border-brand-300 hover:bg-brand-50',
                ].join(' ')}
                aria-pressed={isSelected}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-warm-900 text-base leading-tight">{cfg.name}</span>
                  {isSelected && (
                    <span className="text-xs bg-brand-500 text-white rounded-full px-2 py-0.5 shrink-0">
                      #{pickedIds.indexOf(cfg.id) + 1}
                    </span>
                  )}
                </div>
                {cfg.elevation && (
                  <span className="text-xs text-warm-500 mt-1 block">Elevation {cfg.elevation}</span>
                )}
                <div className="text-sm text-warm-600 mt-1">{formatCurrency(cfg.totalCost)}</div>
                <div className="text-xs text-warm-400 mt-1">
                  {new Date(cfg.timestamp).toLocaleDateString()}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleStartCompare}
            disabled={pickedIds.length < 2}
            className={[
              'bg-brand-600 text-white px-6 py-3 rounded-lg text-base font-semibold transition-opacity',
              pickedIds.length < 2 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-brand-700',
            ].join(' ')}
          >
            Compare {pickedIds.length >= 2 ? `${pickedIds.length} Configurations` : 'Selected Configurations'}
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Comparison view
  const colCount = pickedConfigs.length;

  return (
    <div className="p-6 overflow-y-auto flex-1">
      {/* Nav row */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-warm-600 hover:text-warm-800 text-base"
        >
          <ArrowLeft size={18} />
          Back to Selection
        </button>
        <button
          onClick={handleExit}
          className="flex items-center gap-2 text-warm-600 hover:text-warm-800 text-base"
        >
          <X size={18} />
          Exit Compare
        </button>
      </div>

      <h2 className="text-2xl font-bold text-warm-900 mb-6">Configuration Comparison</h2>

      {/* Summary table */}
      <div className="mb-8 rounded-xl border border-warm-200 overflow-hidden shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-warm-50">
              <th className="px-4 py-3 text-left text-warm-700 font-semibold text-base border-b border-warm-200 w-48">
                &nbsp;
              </th>
              {pickedConfigs.map((cfg, i) => (
                <th
                  key={cfg.id}
                  className="px-4 py-3 text-left text-warm-700 font-semibold text-base border-b border-warm-200"
                >
                  <div>{cfg.name}</div>
                  {cfg.elevation && (
                    <div className="text-xs font-normal text-warm-400">Elevation {cfg.elevation}</div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white">
              <td className="px-4 py-3 text-warm-600 font-medium text-sm border-b border-warm-100">Total Cost</td>
              {configStats.map((stats, i) => (
                <td key={i} className="px-4 py-3 border-b border-warm-100 font-semibold text-warm-900 text-base">
                  {formatCurrency(stats.totalCost)}
                </td>
              ))}
            </tr>
            <tr className="bg-warm-50">
              <td className="px-4 py-3 text-warm-600 font-medium text-sm border-b border-warm-100">Budget</td>
              {configStats.map((stats, i) => (
                <td key={i} className="px-4 py-3 border-b border-warm-100 text-warm-700 text-base">
                  {stats.budget ? formatCurrency(stats.budget) : <span className="text-warm-400 italic">Not set</span>}
                </td>
              ))}
            </tr>
            <tr className="bg-white">
              <td className="px-4 py-3 text-warm-600 font-medium text-sm">
                Saved Date
              </td>
              {pickedConfigs.map((cfg, i) => (
                <td key={i} className="px-4 py-3 text-warm-600 text-sm">
                  {new Date(cfg.timestamp).toLocaleDateString()}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Per-category spend table */}
      {relevantCategories.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-warm-800 mb-3">Spend by Category</h3>
          <div className="rounded-xl border border-warm-200 overflow-hidden shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-warm-50">
                  <th className="px-4 py-3 text-left text-warm-700 font-semibold text-base border-b border-warm-200 w-48">
                    Category
                  </th>
                  {pickedConfigs.map((cfg) => (
                    <th
                      key={cfg.id}
                      className="px-4 py-3 text-left text-warm-700 font-semibold text-base border-b border-warm-200"
                    >
                      {cfg.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {relevantCategories.map((cat, rowIdx) => {
                  const amounts = configStats.map(s => s.categoryTotals[cat.code] || 0);
                  const maxAmt = Math.max(...amounts);
                  return (
                    <tr key={cat.code} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-warm-50'}>
                      <td className="px-4 py-2 text-warm-700 text-sm border-b border-warm-100 font-medium">
                        {cat.name}
                      </td>
                      {amounts.map((amt, i) => (
                        <td key={i} className="px-4 py-2 border-b border-warm-100">
                          {amt > 0 ? (
                            <div className="flex items-center gap-2">
                              <span className="text-warm-900 text-sm font-medium">{formatCurrency(amt)}</span>
                              <div className="flex-1 max-w-[80px]">
                                <div className="h-2 rounded-full bg-warm-100">
                                  <div
                                    className="h-2 rounded-full bg-brand-400"
                                    style={{ width: maxAmt > 0 ? `${(amt / maxAmt) * 100}%` : '0%' }}
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-warm-300 text-sm">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Differences section */}
      {diffItems.length === 0 ? (
        <div className="rounded-xl border border-warm-200 p-6 text-center text-warm-400 bg-warm-50">
          <p className="text-base font-medium">No differences found</p>
          <p className="text-sm mt-1">These configurations have identical item selections.</p>
        </div>
      ) : (
        <div>
          <h3 className="text-lg font-semibold text-warm-800 mb-3">
            Items That Differ ({diffItems.length} item{diffItems.length !== 1 ? 's' : ''})
          </h3>
          <p className="text-sm text-warm-500 mb-4">
            <span className="inline-block w-3 h-3 rounded-sm bg-green-200 border border-green-400 mr-1 align-middle" />
            Present in this config&nbsp;&nbsp;
            <span className="inline-block w-3 h-3 rounded-sm bg-orange-200 border border-orange-400 mr-1 align-middle" />
            Not in this config
          </p>

          <div className="space-y-6">
            {diffByCategory.map(group => (
              <div key={group.code} className="rounded-xl border border-warm-200 overflow-hidden shadow-sm">
                <div className="bg-warm-50 px-4 py-2 border-b border-warm-200">
                  <span className="font-semibold text-warm-700 text-sm">{group.name}</span>
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-white">
                      <th className="px-4 py-2 text-left text-warm-600 font-medium text-xs border-b border-warm-100 w-64">
                        Item
                      </th>
                      <th className="px-4 py-2 text-left text-warm-600 font-medium text-xs border-b border-warm-100 w-24">
                        Price
                      </th>
                      {pickedConfigs.map(cfg => (
                        <th
                          key={cfg.id}
                          className="px-4 py-2 text-left text-warm-600 font-medium text-xs border-b border-warm-100"
                        >
                          {cfg.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((diff, rowIdx) => (
                      <tr key={diff.key} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-warm-50'}>
                        <td className="px-4 py-2 border-b border-warm-100">
                          <div className="text-sm text-warm-800 leading-snug">
                            {diff.item.description.length > 80
                              ? diff.item.description.slice(0, 80) + '…'
                              : diff.item.description}
                          </div>
                          <div className="text-xs text-warm-400 mt-0.5">{diff.item.optionCode}</div>
                        </td>
                        <td className="px-4 py-2 border-b border-warm-100 text-sm text-warm-700">
                          {diff.item.price != null ? formatCurrency(diff.item.price) : 'Price TBD'}
                        </td>
                        {diff.presences.map((has, i) => (
                          <td
                            key={i}
                            className={[
                              'px-4 py-2 border-b border-warm-100 text-sm font-medium',
                              has ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700',
                            ].join(' ')}
                          >
                            {has ? 'Included' : 'Not selected'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
