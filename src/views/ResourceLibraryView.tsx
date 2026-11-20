import React, { useMemo, useState } from 'react';
import { FolderOpen, Pin, Search } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import {
  ALL_RESOURCES,
  getClassificationForWeek,
  RESOURCE_COUNTS,
} from '../data/resources';
import { ResourceClassification, ResourceItem } from '../types';
import { ClassificationTag, LanguageTag, SectionCard } from '../components/StatusPrimitives';

const PAGE_SIZE = 50;

export function ResourceLibraryView() {
  const { state, toggleResourceWatched, pinResourceToWeek } = useAppState();

  const [query, setQuery] = useState('');
  const [weekFilter, setWeekFilter] = useState<'all' | number>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | ResourceItem['source']>('all');
  const [classFilter, setClassFilter] = useState<'all' | ResourceClassification>('all');
  const [languageFilter, setLanguageFilter] = useState<'all' | 'English' | 'Hindi'>('all');
  const [watchFilter, setWatchFilter] = useState<'all' | 'unwatched' | 'watched'>('all');
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);

  const activeWeek = state.profile.currentWeek;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_RESOURCES.filter((r) => {
      if (weekFilter !== 'all' && !r.mappedWeeks.includes(weekFilter)) return false;
      if (sourceFilter !== 'all' && r.source !== sourceFilter) return false;
      if (languageFilter !== 'all' && r.language !== languageFilter) return false;

      const effectiveClass =
        weekFilter !== 'all'
          ? getClassificationForWeek(r, weekFilter)
          : r.defaultClassification;
      if (classFilter !== 'all' && effectiveClass !== classFilter) return false;

      const watched = Boolean(state.resourceStates[r.id]?.watched);
      if (watchFilter === 'watched' && !watched) return false;
      if (watchFilter === 'unwatched' && watched) return false;

      if (q) {
        const hay = `${r.title} ${r.courseName} ${r.sectionName} ${r.locator} ${r.reason} ${r.filePath ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    query,
    weekFilter,
    sourceFilter,
    classFilter,
    languageFilter,
    watchFilter,
    state.resourceStates,
  ]);

  const watchedTotal = useMemo(
    () => ALL_RESOURCES.filter((r) => state.resourceStates[r.id]?.watched).length,
    [state.resourceStates]
  );

  const displayed = filtered.slice(0, visibleLimit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A] tracking-tight">
            Supplementary Resource Library
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Verified catalogue of {RESOURCE_COUNTS.total} supplementary entries (
            {RESOURCE_COUNTS.pythonBootcamp} CWH Python · {RESOURCE_COUNTS.dataScienceHindi} CWH
            Data Science [Hindi] · {RESOURCE_COUNTS.ssdCurated} curated SSD entries). Never
            complete every file — use strictly to reinforce your current DataMites week.
          </p>
        </div>
        <div className="text-xs text-[#475569] tabular-nums shrink-0">
          Watched: <span className="font-semibold text-[#0F172A]">{watchedTotal}</span> /{' '}
          {RESOURCE_COUNTS.total}
        </div>
      </div>

      {/* Filters */}
      <SectionCard className="p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisibleLimit(PAGE_SIZE);
            }}
            placeholder="Search by lecture title, section, lecture number, or SSD folder path..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <select
            aria-label="Filter by mapped DataMites week"
            value={weekFilter}
            onChange={(e) => {
              setWeekFilter(e.target.value === 'all' ? 'all' : Number(e.target.value));
              setVisibleLimit(PAGE_SIZE);
            }}
            className="px-2.5 py-2 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
          >
            <option value="all">All Mapped Weeks</option>
            {Array.from({ length: 20 }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>
                Week {w} {w === activeWeek ? '(Current)' : ''}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by source tier"
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value as 'all' | ResourceItem['source']);
              setVisibleLimit(PAGE_SIZE);
            }}
            className="px-2.5 py-2 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
          >
            <option value="all">All Sources</option>
            <option value="CODEWITHHARRY_PYTHON">Tier 2 · CWH Python Bootcamp</option>
            <option value="CODEWITHHARRY_DATA_SCIENCE">Tier 3 · CWH Data Science (Hindi)</option>
            <option value="SSD_AI_ENGINEER_BOOTCAMP">Tier 4 · SSD AI Engineer</option>
            <option value="OTHER_SSD">Tier 4 · Other SSD</option>
          </select>

          <select
            aria-label="Filter by classification"
            value={classFilter}
            onChange={(e) => {
              setClassFilter(e.target.value as 'all' | ResourceClassification);
              setVisibleLimit(PAGE_SIZE);
            }}
            className="px-2.5 py-2 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
          >
            <option value="all">All Classifications</option>
            <option value="ESSENTIAL">ESSENTIAL</option>
            <option value="OPTIONAL">OPTIONAL</option>
            <option value="SKIP">SKIP</option>
          </select>

          <select
            aria-label="Filter by language"
            value={languageFilter}
            onChange={(e) => {
              setLanguageFilter(e.target.value as 'all' | 'English' | 'Hindi');
              setVisibleLimit(PAGE_SIZE);
            }}
            className="px-2.5 py-2 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
          >
            <option value="all">All Languages</option>
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
          </select>

          <select
            aria-label="Filter by watch status"
            value={watchFilter}
            onChange={(e) => {
              setWatchFilter(e.target.value as 'all' | 'unwatched' | 'watched');
              setVisibleLimit(PAGE_SIZE);
            }}
            className="px-2.5 py-2 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
          >
            <option value="all">Watched &amp; Unwatched</option>
            <option value="unwatched">Unwatched only</option>
            <option value="watched">Watched only</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-[#64748B] pt-1">
          <span className="tabular-nums">
            Showing {displayed.length} of {filtered.length} matching resources
          </span>
          {(query ||
            weekFilter !== 'all' ||
            sourceFilter !== 'all' ||
            classFilter !== 'all' ||
            languageFilter !== 'all' ||
            watchFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setWeekFilter('all');
                setSourceFilter('all');
                setClassFilter('all');
                setLanguageFilter('all');
                setWatchFilter('all');
                setVisibleLimit(PAGE_SIZE);
              }}
              className="text-[#2563EB] hover:text-[#1D4ED8] font-medium cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      </SectionCard>

      {/* Catalogue List */}
      <SectionCard className="divide-y divide-[#F1F5F9]">
        {displayed.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#64748B]">
            No verified resources match your filters.
          </div>
        ) : (
          displayed.map((item) => {
            const cls =
              weekFilter !== 'all'
                ? getClassificationForWeek(item, weekFilter)
                : item.defaultClassification;
            const rs = state.resourceStates[item.id];
            const watched = Boolean(rs?.watched);
            const targetPinWeek = weekFilter !== 'all' ? weekFilter : activeWeek;
            const isPinned = rs?.pinnedWeek === targetPinWeek;

            return (
              <div
                key={item.id}
                className="p-4 flex flex-col lg:flex-row lg:items-start justify-between gap-3"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <ClassificationTag value={cls} />
                    <LanguageTag language={item.language} />
                    <span className="text-[11px] font-medium text-[#64748B]">
                      Tier {item.priorityTier} · {item.courseName}
                    </span>
                    {item.mappedWeeks.length > 0 && (
                      <span className="text-[11px] text-[#2563EB] font-medium tabular-nums">
                        Weeks: {item.mappedWeeks.join(', ')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-[#0F172A]">{item.title}</p>
                  <p className="text-xs text-[#475569]">{item.reason}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#64748B]">
                    <span>{item.sectionName}</span>
                    <span>·</span>
                    <span>{item.locator}</span>
                    {item.duration && (
                      <>
                        <span>·</span>
                        <span className="tabular-nums">{item.duration}</span>
                      </>
                    )}
                    {item.filePath && (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#475569]">
                        <FolderOpen className="w-3 h-3 text-[#94A3B8]" />
                        {item.filePath}
                      </span>
                    )}
                    {!item.verified && (
                      <span className="text-[#B45309] font-medium">
                        UNVERIFIED (compressed archive contents not indexed)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-medium text-[#334155] cursor-pointer whitespace-nowrap shrink-0">
                    <input
                      type="checkbox"
                      checked={watched}
                      onChange={() => toggleResourceWatched(item.id, targetPinWeek)}
                      className="h-3.5 w-3.5 rounded border-[#CBD5E1] text-[#2563EB]"
                    />
                    <span>Watched</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => pinResourceToWeek(item.id, targetPinWeek, item.title)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                      isPinned
                        ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8]'
                        : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                    <span>{isPinned ? `Pinned W${targetPinWeek}` : `Pin to W${targetPinWeek}`}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </SectionCard>

      {visibleLimit < filtered.length && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setVisibleLimit((v) => v + PAGE_SIZE)}
            className="px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-sm font-medium text-[#0F172A] cursor-pointer"
          >
            Load more ({filtered.length - visibleLimit} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
