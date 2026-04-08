import { useApp } from '../context/AppContext';
import { formatCompact } from '../utils/formatCurrency';

export default function CategorySidebar() {
  const {
    data,
    activeCategory,
    setActiveCategory,
    categoryCounts,
    categoryTotals,
    filteredCategories,
    searchQuery,
    viewMode,
    setWizardStep,
  } = useApp();

  if (!data?.categories) return null;

  const filteredByCode = {};
  if (filteredCategories) {
    for (const cat of filteredCategories) {
      filteredByCode[cat.code] = cat.items ? cat.items.length : 0;
    }
  }

  const isSearchActive = searchQuery && searchQuery.trim().length > 0;

  return (
    <aside
      className="w-64 flex-shrink-0 bg-warm-50 sidebar-scroll overflow-y-auto sticky top-0 border-r border-warm-200"
      style={{ maxHeight: 'calc(100vh - 70px)' }}
      aria-label="Category navigation"
    >
      <nav>
        {data.categories.map((cat) => {
          const isActive = activeCategory === cat.code;
          const count = categoryCounts?.[cat.code] || 0;
          const total = categoryTotals?.[cat.code] || 0;
          const filteredCount = filteredByCode[cat.code] ?? (isSearchActive ? 0 : 1);
          const isDimmed = isSearchActive && filteredCount === 0;

          return (
            <button
              key={cat.code}
              onClick={() => {
                setActiveCategory(cat.code);
                if (viewMode === 'wizard') {
                  const stepIndex = filteredCategories.findIndex(c => c.code === cat.code);
                  if (stepIndex !== -1) setWizardStep(stepIndex);
                }
              }}
              className={[
                'w-full text-left min-h-[48px] px-3 py-2 flex flex-col justify-center gap-0.5 transition-all duration-150 cursor-pointer',
                isActive
                  ? 'bg-white border-l-4 border-brand-500 shadow-sm'
                  : 'border-l-4 border-transparent hover:bg-warm-100',
                isDimmed ? 'opacity-40' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-xs bg-warm-200 text-warm-700 rounded px-1.5 py-0.5 font-mono flex-shrink-0 leading-none">
                  {cat.code}
                </span>
                <span
                  className={[
                    'flex-1 text-sm font-medium truncate leading-snug',
                    isActive ? 'text-brand-700' : 'text-warm-800',
                  ].join(' ')}
                  title={cat.name}
                >
                  {cat.name}
                </span>
                {count > 0 && (
                  <span
                    className="bg-brand-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 font-semibold leading-none"
                    aria-label={`${count} selected`}
                  >
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </div>
              {total > 0 && (
                <div className="pl-0 flex justify-end w-full">
                  <span className="text-xs text-warm-500 tabular-nums">
                    {formatCompact(total)}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
