import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getRoomStats } from '../utils/roomMapping';
import { formatCompact } from '../utils/formatCurrency';

export default function RoomSidebar() {
  const {
    roomSections,
    activeRoom,
    setActiveRoom,
    selections,
    searchQuery,
  } = useApp();

  const isSearchActive = searchQuery && searchQuery.trim().length > 0;

  // Pre-compute stats for every room section
  const roomStats = useMemo(() => {
    if (!roomSections) return {};
    const stats = {};
    for (const section of roomSections) {
      stats[section.id] = getRoomStats(section, selections);
    }
    return stats;
  }, [roomSections, selections]);

  if (!roomSections || roomSections.length === 0) return null;

  return (
    <aside
      className="w-64 flex-shrink-0 bg-warm-50 sidebar-scroll overflow-y-auto sticky top-0 border-r border-warm-200"
      style={{ maxHeight: 'calc(100vh - 70px)' }}
      aria-label="Room navigation"
    >
      <nav>
        {roomSections.map((section) => {
          const isActive = activeRoom === section.id;
          const stats = roomStats[section.id] || {
            totalItems: 0,
            selectedCount: 0,
            totalSpend: 0,
          };

          // When searching, dim rooms that have no items matching
          const isDimmed = isSearchActive && stats.totalItems === 0;

          return (
            <button
              key={section.id}
              onClick={() => setActiveRoom(section.id)}
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
                <span
                  className={[
                    'flex-1 text-sm font-medium truncate leading-snug',
                    isActive ? 'text-brand-700' : 'text-warm-800',
                  ].join(' ')}
                  title={section.name}
                >
                  {section.name}
                </span>
                <span className="text-xs text-warm-500 flex-shrink-0">
                  ({stats.totalItems})
                </span>
                {stats.selectedCount > 0 && (
                  <span
                    className="bg-brand-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 font-semibold leading-none"
                    aria-label={`${stats.selectedCount} selected`}
                  >
                    {stats.selectedCount > 99 ? '99+' : stats.selectedCount}
                  </span>
                )}
              </div>
              {section.description && (
                <span className="text-xs text-warm-400 truncate leading-tight pl-0">
                  {section.description}
                </span>
              )}
              {stats.totalSpend > 0 && (
                <div className="pl-0 flex justify-end w-full">
                  <span className="text-xs text-warm-500 tabular-nums">
                    {formatCompact(stats.totalSpend)}
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
