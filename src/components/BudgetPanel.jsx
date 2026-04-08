import { useState } from 'react';
import { AlertTriangle, Save, Trash2, Download, Edit3, BarChart3 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatCompact } from '../utils/formatCurrency';

export default function BudgetPanel() {
  const {
    budget,
    setBudget,
    totalCost,
    budgetStatus,
    categoryTotals,
    categoryCounts,
    data,
    savedConfigs,
    saveConfig,
    loadConfig,
    deleteConfig,
    renameConfig,
    clearAllSelections,
    setActiveCategory,
    setViewMode,
    yellowThreshold,
    redThreshold,
  } = useApp();

  const [budgetInput, setBudgetInput] = useState(budget != null ? String(budget) : '');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState('');

  // Category name lookup
  const categoryNameMap = {};
  if (data && data.categories) {
    for (const cat of data.categories) {
      categoryNameMap[cat.code] = cat.name;
    }
  }

  // Total items selected
  const totalItemsSelected = Object.values(categoryCounts || {}).reduce((sum, n) => sum + n, 0);

  // Progress bar color
  const barColorClass =
    !budget
      ? 'bg-stone-400'
      : budgetStatus === 'red'
      ? 'bg-red-500'
      : budgetStatus === 'yellow'
      ? 'bg-yellow-400'
      : 'bg-green-500';

  const barColorStyle =
    !budget
      ? '#a8a29e'
      : budgetStatus === 'red'
      ? '#ef4444'
      : budgetStatus === 'yellow'
      ? '#eab308'
      : '#22c55e';

  const barPercent = budget ? Math.min((totalCost / budget) * 100, 100) : 0;

  // Category breakdown sorted by spend
  const categoryBreakdownEntries = Object.entries(categoryTotals || {})
    .filter(([, total]) => total > 0)
    .sort(([, a], [, b]) => b - a);

  const maxCategorySpend = categoryBreakdownEntries[0]?.[1] || 1;
  const visibleCategories = showAllCategories
    ? categoryBreakdownEntries
    : categoryBreakdownEntries.slice(0, 10);
  const hasMoreCategories = categoryBreakdownEntries.length > 10;

  // Over budget amount
  const overBudgetAmount = budget ? totalCost - budget : 0;

  function handleBudgetChange(e) {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    setBudgetInput(raw);
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed > 0) {
      setBudget(parsed);
    } else if (raw === '' || raw === '0') {
      setBudget(null);
    }
  }

  function handleSaveConfig() {
    if (!savingConfig) {
      const defaultName = `Config ${(savedConfigs?.length || 0) + 1}`;
      setSaveNameInput(defaultName);
      setSavingConfig(true);
      return;
    }
    if (saveNameInput.trim()) {
      saveConfig(saveNameInput.trim());
    }
    setSavingConfig(false);
    setSaveNameInput('');
  }

  function handleCancelSave() {
    setSavingConfig(false);
    setSaveNameInput('');
  }

  function handleLoadConfig(config) {
    const confirmed = window.confirm(
      `Load "${config.name}"? This will replace your current selections.`
    );
    if (confirmed) {
      loadConfig(config);
    }
  }

  function handleDeleteConfig(config) {
    const confirmed = window.confirm(`Delete "${config.name}"? This cannot be undone.`);
    if (confirmed) {
      deleteConfig(config.id);
    }
  }

  function handleStartRename(config) {
    setRenamingId(config.id);
    setRenameValue(config.name);
  }

  function handleRenameSubmit(id) {
    if (renameValue.trim()) {
      renameConfig(id, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  }

  function handleClearAll() {
    const confirmed = window.confirm(
      'Clear all selections? This cannot be undone.'
    );
    if (confirmed) {
      clearAllSelections();
    }
  }

  function formatDate(ts) {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  }

  return (
    <aside className="w-72 flex-shrink-0 sticky top-[70px] max-h-[calc(100vh-70px)] overflow-y-auto bg-white shadow-md rounded-l-lg border-l border-stone-200">
      <div className="space-y-5 p-4">

        {/* Budget Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
            Budget
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl font-semibold text-stone-400 select-none">
              $
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={budgetInput}
              onChange={handleBudgetChange}
              placeholder="Enter budget..."
              className="w-full pl-8 pr-3 py-3 text-2xl font-semibold bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-stone-800 placeholder-stone-300"
            />
          </div>
        </div>

        {/* Progress Bar + Cost Summary */}
        <div>
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-sm font-medium text-stone-600">Total Selected</span>
            <span className="text-base font-bold text-stone-800">{formatCurrency(totalCost)}</span>
          </div>

          {budget ? (
            <>
              <div className="h-4 rounded-full bg-stone-100 overflow-hidden mb-1.5">
                <div
                  className="budget-bar-fill h-full rounded-full transition-all duration-500"
                  style={{ width: `${barPercent}%`, backgroundColor: barColorStyle }}
                />
              </div>

              {budgetStatus === 'red' || budgetStatus === 'yellow' ? (
                <div className={`flex items-center gap-1.5 text-sm font-medium ${budgetStatus === 'red' ? 'text-red-600' : 'text-yellow-700'}`}>
                  <AlertTriangle size={14} className="flex-shrink-0" />
                  {overBudgetAmount > 0
                    ? (
                      <span>
                        {formatCurrency(totalCost)} of {formatCurrency(budget)} — <strong>{formatCurrency(overBudgetAmount)} over budget</strong>
                      </span>
                    )
                    : (
                      <span>
                        {formatCurrency(totalCost)} of {formatCurrency(budget)} ({((totalCost / budget) * 100).toFixed(1)}%)
                      </span>
                    )
                  }
                </div>
              ) : (
                <p className="text-xs text-stone-500">
                  {formatCurrency(totalCost)} of {formatCurrency(budget)} ({((totalCost / budget) * 100).toFixed(1)}%)
                  {' '}<span className="text-emerald-600 font-medium">{formatCurrency(budget - totalCost)} remaining</span>
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-stone-400 italic">Set a budget above to track spending</p>
          )}

          <p className="text-xs text-stone-400 mt-1.5">
            {totalItemsSelected === 0
              ? 'No items selected'
              : `${totalItemsSelected} item${totalItemsSelected === 1 ? '' : 's'} selected`}
          </p>
        </div>

        {/* Category Spend Breakdown */}
        {categoryBreakdownEntries.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <BarChart3 size={13} className="text-stone-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Spend by Category
              </span>
            </div>
            <div className="space-y-0.5">
              {visibleCategories.map(([code, total]) => {
                const name = categoryNameMap[code] || code;
                const barWidth = Math.max(4, (total / maxCategorySpend) * 100);
                return (
                  <button
                    key={code}
                    onClick={() => setActiveCategory(code)}
                    className="w-full text-left flex flex-col gap-0.5 py-1.5 px-1 rounded hover:bg-stone-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-stone-600 group-hover:text-emerald-700 truncate max-w-[160px] transition-colors">
                        {name}
                      </span>
                      <span className="text-xs font-semibold text-stone-700 ml-2 flex-shrink-0">
                        {formatCompact(total)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded bg-stone-100 overflow-hidden w-full">
                      <div
                        className="h-full rounded bg-emerald-500 transition-all duration-300"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
            {hasMoreCategories && (
              <button
                onClick={() => setShowAllCategories(s => !s)}
                className="mt-1 text-xs text-emerald-700 hover:text-emerald-900 font-medium underline underline-offset-2"
              >
                {showAllCategories
                  ? 'Show less'
                  : `Show all ${categoryBreakdownEntries.length} categories`}
              </button>
            )}
          </div>
        )}

        {/* Divider */}
        <hr className="border-stone-100" />

        {/* Save Configuration */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Save size={13} className="text-stone-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Saved Configurations
            </span>
          </div>

          {savingConfig ? (
            <div className="space-y-2 mb-3">
              <input
                type="text"
                value={saveNameInput}
                onChange={e => setSaveNameInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveConfig();
                  if (e.key === 'Escape') handleCancelSave();
                }}
                placeholder="Configuration name..."
                autoFocus
                className="w-full text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50 text-stone-800"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveConfig}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelSave}
                  className="flex-1 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleSaveConfig}
              disabled={(savedConfigs?.length || 0) >= 20}
              className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2.5 w-full text-sm font-semibold transition-colors mb-3 flex items-center justify-center gap-2"
            >
              <Save size={15} />
              Save Configuration
            </button>
          )}

          {/* Saved Config List */}
          {savedConfigs && savedConfigs.length > 0 ? (
            <div className="space-y-0">
              {savedConfigs.map(config => (
                <div key={config.id} className="border-b border-stone-100 py-2 last:border-b-0">
                  {renamingId === config.id ? (
                    <div className="flex gap-1 mb-1">
                      <input
                        type="text"
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleRenameSubmit(config.id);
                          if (e.key === 'Escape') { setRenamingId(null); setRenameValue(''); }
                        }}
                        autoFocus
                        className="flex-1 text-xs px-2 py-1 border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-stone-50"
                      />
                      <button
                        onClick={() => handleRenameSubmit(config.id)}
                        className="text-xs px-2 py-1 bg-emerald-700 text-white rounded font-medium"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => { setRenamingId(null); setRenameValue(''); }}
                        className="text-xs px-2 py-1 border border-stone-200 text-stone-500 rounded"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-800 truncate">{config.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-xs text-stone-400">{formatDate(config.timestamp)}</span>
                          {config.elevation && (
                            <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.5 rounded">
                              Elev {config.elevation}
                            </span>
                          )}
                          {config.budget != null && (
                            <span className="text-xs text-stone-500">
                              {formatCompact(
                                (() => {
                                  // compute total from config selections if possible
                                  return config.totalCost != null ? config.totalCost : config.budget;
                                })()
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => handleStartRename(config)}
                          title="Rename"
                          className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition-colors"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteConfig(config)}
                          title="Delete"
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => handleLoadConfig(config)}
                    className="mt-1.5 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-700 border border-emerald-200 hover:bg-emerald-50 rounded-md py-1.5 transition-colors"
                  >
                    <Download size={12} />
                    Load
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-400 italic text-center py-2">No saved configurations yet</p>
          )}
        </div>

        {/* Divider */}
        <hr className="border-stone-100" />

        {/* Action Buttons */}
        <div className="space-y-2 pb-2">
          <button
            onClick={() => setViewMode('compare')}
            disabled={!savedConfigs || savedConfigs.length < 2}
            className="w-full flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed text-stone-700 font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
          >
            <BarChart3 size={15} />
            Compare Configurations
          </button>

          <button
            onClick={handleClearAll}
            disabled={totalItemsSelected === 0}
            className="w-full border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            Clear All Selections
          </button>
        </div>

      </div>
    </aside>
  );
}
