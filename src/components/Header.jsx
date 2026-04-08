import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, LayoutGrid, Compass, GitCompare, Settings, Home, List } from 'lucide-react';
import { debounce } from 'lodash';
import { useApp } from '../context/AppContext';

const ELEVATIONS = ['A', 'B', 'C', 'D', 'E'];

export default function Header({ onOpenSettings }) {
  const {
    elevation,
    setElevation,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    selections,
    itemMap,
    setSelections,
    browseMode,
    setBrowseMode,
  } = useApp();

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const searchInputRef = useRef(null);

  // Debounced setter for search query
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetSearch = useCallback(
    debounce((val) => setSearchQuery(val), 300),
    [setSearchQuery]
  );

  // Keep localSearch in sync if searchQuery is cleared externally
  useEffect(() => {
    if (searchQuery === '') {
      setLocalSearch('');
    }
  }, [searchQuery]);

  function handleSearchChange(e) {
    const val = e.target.value;
    setLocalSearch(val);
    debouncedSetSearch(val);
  }

  function handleClearSearch() {
    setLocalSearch('');
    setSearchQuery('');
    searchInputRef.current?.focus();
  }

  function handleElevationChange(e) {
    const newElevation = e.target.value === 'all' ? null : e.target.value;
    const prevElevation = elevation;

    if (newElevation === prevElevation) return;

    // Find selections that are specific to the old elevation and won't apply to the new one
    const orphaned = Object.entries(selections).filter(([key, sel]) => {
      if (!sel.selected) return false;
      const item = itemMap ? itemMap[key] : null;
      if (!item) return false;
      // Item is elevation-specific and doesn't match the new elevation
      return item.elevation !== null && item.elevation !== newElevation;
    });

    if (orphaned.length > 0) {
      const prevLabel = prevElevation ? `Elevation ${prevElevation}` : 'All Elevations';
      const newLabel = newElevation ? `Elevation ${newElevation}` : 'All Elevations';
      const confirmed = window.confirm(
        `You have ${orphaned.length} selection${orphaned.length !== 1 ? 's' : ''} for ${prevLabel} that don't apply to ${newLabel}.\n\nClear those selections and switch to ${newLabel}?`
      );
      if (!confirmed) {
        // Reset the select element visually by forcing a re-render
        e.target.value = prevElevation ?? 'all';
        return;
      }
      // Only clear the orphaned elevation-specific selections
      const orphanedKeys = new Set(orphaned.map(([key]) => key));
      setSelections(prev => {
        const next = {};
        for (const [key, sel] of Object.entries(prev)) {
          if (!orphanedKeys.has(key)) {
            next[key] = sel;
          }
        }
        return next;
      });
    }

    setElevation(newElevation);
  }

  const viewModes = [
    { id: 'browse', label: 'Browse', Icon: LayoutGrid },
    { id: 'wizard', label: 'Wizard', Icon: Compass },
    { id: 'compare', label: 'Compare', Icon: GitCompare },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-warm-200 shadow-sm">
      <div className="flex items-center gap-4 px-4 h-[70px] max-w-screen-2xl mx-auto">

        {/* Logo / Title */}
        <div className="flex flex-col justify-center flex-shrink-0 min-w-0">
          <span
            className="font-display text-xl leading-tight text-brand-700 whitespace-nowrap"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Shaddock Homes
          </span>
          <span
            className="text-xs text-warm-500 leading-tight whitespace-nowrap"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Stafford Plan — Custer Ridge Estates
          </span>
        </div>

        {/* Divider */}
        <div className="hidden md:block h-8 w-px bg-warm-200 flex-shrink-0" />

        {/* Elevation Dropdown */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <label
            htmlFor="elevation-select"
            className="text-sm font-medium text-warm-700 whitespace-nowrap hidden sm:block"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Elevation
          </label>
          <select
            id="elevation-select"
            value={elevation ?? 'all'}
            onChange={handleElevationChange}
            className="h-11 px-3 bg-warm-50 border border-warm-200 rounded-lg text-sm text-warm-800 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 min-w-[140px]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <option value="all">All Elevations</option>
            {ELEVATIONS.map((el) => (
              <option key={el} value={el}>
                Elevation {el}
              </option>
            ))}
          </select>
        </div>

        {/* Divider */}
        <div className="hidden md:block h-8 w-px bg-warm-200 flex-shrink-0" />

        {/* Search Input */}
        <div className="relative flex items-center flex-1 min-w-0 max-w-md">
          <Search
            className="absolute left-3 text-warm-400 flex-shrink-0 pointer-events-none"
            size={18}
            aria-hidden="true"
          />
          <input
            ref={searchInputRef}
            type="search"
            value={localSearch}
            onChange={handleSearchChange}
            placeholder="Search options..."
            className="w-full h-11 pl-10 pr-10 bg-warm-50 border border-warm-200 rounded-lg text-sm text-warm-800 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
            aria-label="Search options"
          />
          {localSearch && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2 flex items-center justify-center w-7 h-7 rounded text-warm-400 hover:text-warm-700 hover:bg-warm-100 transition-colors"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1 hidden lg:block" />

        {/* Browse Mode Toggle: Room vs Trade */}
        {viewMode === 'browse' && (
          <div
            className="flex items-center gap-1 bg-warm-50 border border-warm-200 rounded-lg p-1 flex-shrink-0"
            role="group"
            aria-label="Browse mode"
          >
            <button
              type="button"
              onClick={() => setBrowseMode('room')}
              className={`flex items-center gap-1.5 px-3 h-11 rounded-md text-sm font-medium transition-all ${
                browseMode === 'room'
                  ? 'bg-white text-brand-700 shadow-sm border border-warm-200'
                  : 'text-warm-500 hover:text-warm-800 hover:bg-warm-100'
              }`}
              style={{ fontFamily: "'DM Sans', sans-serif" }}
              aria-pressed={browseMode === 'room'}
            >
              <Home size={15} aria-hidden="true" />
              <span className="hidden sm:inline">By Room</span>
            </button>
            <button
              type="button"
              onClick={() => setBrowseMode('trade')}
              className={`flex items-center gap-1.5 px-3 h-11 rounded-md text-sm font-medium transition-all ${
                browseMode === 'trade'
                  ? 'bg-white text-brand-700 shadow-sm border border-warm-200'
                  : 'text-warm-500 hover:text-warm-800 hover:bg-warm-100'
              }`}
              style={{ fontFamily: "'DM Sans', sans-serif" }}
              aria-pressed={browseMode === 'trade'}
            >
              <List size={15} aria-hidden="true" />
              <span className="hidden sm:inline">By Trade</span>
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="hidden md:block h-8 w-px bg-warm-200 flex-shrink-0" />

        {/* View Mode Toggle */}
        <div
          className="flex items-center gap-1 bg-warm-50 border border-warm-200 rounded-lg p-1 flex-shrink-0"
          role="group"
          aria-label="View mode"
        >
          {viewModes.map(({ id, label, Icon }) => {
            const isActive = viewMode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setViewMode(id)}
                className={`
                  flex items-center gap-1.5 px-3 h-11 rounded-md text-sm font-medium transition-all
                  ${isActive
                    ? 'bg-white text-brand-700 shadow-sm border border-warm-200'
                    : 'text-warm-500 hover:text-warm-800 hover:bg-warm-100'
                  }
                `}
                style={{ fontFamily: "'DM Sans', sans-serif" }}
                aria-pressed={isActive}
                aria-label={`${label} mode`}
              >
                <Icon size={15} aria-hidden="true" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="hidden md:block h-8 w-px bg-warm-200 flex-shrink-0" />

        {/* Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex items-center justify-center w-11 h-11 rounded-lg text-warm-500 hover:text-warm-800 hover:bg-warm-100 transition-colors flex-shrink-0"
          aria-label="Open settings"
          title="Settings"
        >
          <Settings size={20} aria-hidden="true" />
        </button>

      </div>
    </header>
  );
}
