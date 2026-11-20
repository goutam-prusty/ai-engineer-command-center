import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Flag,
  FolderOpen,
  HelpCircle,
  Pin,
  RotateCcw,
  X,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import {
  COMPLETION_CRITERIA_BY_WEEK,
  getCourseForWeek,
  getModulesForWeek,
  getSubtopicsForWeek,
} from '../data/curriculum';
import { getClassificationForWeek, getResourcesForWeek } from '../data/resources';
import { getExercisesForWeek, getFlashcardsForWeek, getQuizzesForWeek } from '../data/assessments';
import { ResourceClassification, TopicStatus } from '../types';
import {
  ClassificationTag,
  LanguageTag,
  ProgressBar,
  ProvenanceInline,
  SectionCard,
  TOPIC_STATUS_OPTIONS,
  topicStatusTone,
} from '../components/StatusPrimitives';

export function WeeklyStudyRoomView() {
  const {
    state,
    selectedStudyWeek,
    setSelectedStudyWeek,
    highlightedTarget,
    clearHighlightedTarget,
    updateTopicProgress,
    toggleResourceWatched,
    pinResourceToWeek,
    updatePracticeLog,
    addWeakConcept,
    setActiveSection,
    updateProfile,
  } = useAppState();

  const week = selectedStudyWeek;
  const course = useMemo(() => getCourseForWeek(week), [week]);
  const modules = useMemo(() => getModulesForWeek(week), [week]);
  const weekSubtopics = useMemo(() => getSubtopicsForWeek(week), [week]);
  const weekResources = useMemo(() => getResourcesForWeek(week), [week]);
  const weekExercises = useMemo(() => getExercisesForWeek(week), [week]);
  const weekFlashcards = useMemo(() => getFlashcardsForWeek(week), [week]);
  const weekQuizzes = useMemo(() => getQuizzesForWeek(week), [week]);
  const criteria = COMPLETION_CRITERIA_BY_WEEK[week];

  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [resourceFilter, setResourceFilter] = useState<'ALL' | ResourceClassification>('ALL');
  const [showSkipResources, setShowSkipResources] = useState(false);
  const [openExerciseDetails, setOpenExerciseDetails] = useState<Record<string, boolean>>({});
  const [openExerciseHints, setOpenExerciseHints] = useState<Record<string, boolean>>({});
  const [quickWeakTitle, setQuickWeakTitle] = useState('');
  const [quickWeakNotes, setQuickWeakNotes] = useState('');

  // Auto-expand all modules for the active week (and definitely the highlighted module)
  useEffect(() => {
    const next: Record<string, boolean> = {};
    modules.forEach((m) => {
      next[m.id] = true;
    });
    setExpandedModules(next);
  }, [week, modules]);

  // Smoothly scroll to the highlighted subtopic when arriving via "Continue Learning"
  useEffect(() => {
    if (!highlightedTarget || highlightedTarget.week !== week || !highlightedTarget.subtopicId) {
      return;
    }
    setExpandedModules((prev) => ({ ...prev, [highlightedTarget.moduleId]: true }));
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`subtopic-${highlightedTarget.subtopicId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
    return () => window.clearTimeout(timer);
  }, [highlightedTarget, week]);

  const completedCount = useMemo(
    () =>
      weekSubtopics.filter((s) => {
        const st = state.topicProgress[s.id]?.status;
        return st === 'demonstrated' || st === 'complete';
      }).length,
    [weekSubtopics, state.topicProgress]
  );
  const weekPct =
    weekSubtopics.length > 0 ? Math.round((completedCount / weekSubtopics.length) * 100) : 0;

  const essentialCount = useMemo(
    () => weekResources.filter((r) => getClassificationForWeek(r, week) === 'ESSENTIAL').length,
    [weekResources, week]
  );
  const optionalCount = useMemo(
    () => weekResources.filter((r) => getClassificationForWeek(r, week) === 'OPTIONAL').length,
    [weekResources, week]
  );
  const skipCount = useMemo(
    () => weekResources.filter((r) => getClassificationForWeek(r, week) === 'SKIP').length,
    [weekResources, week]
  );

  const visibleResources = useMemo(() => {
    return weekResources.filter((r) => {
      const cls = getClassificationForWeek(r, week);
      if (resourceFilter !== 'ALL') return cls === resourceFilter;
      if (cls === 'SKIP' && !showSkipResources) return false;
      return true;
    });
  }, [weekResources, week, resourceFilter, showSkipResources]);

  const handleQuickWeakSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickWeakTitle.trim()) return;
    addWeakConcept({
      week,
      title: quickWeakTitle.trim(),
      notes: quickWeakNotes.trim(),
      source: 'study_room',
    });
    setQuickWeakTitle('');
    setQuickWeakNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Week Selector + Active Week Sync */}
      <SectionCard className="p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
              <span className="font-semibold uppercase tracking-wider text-[#2563EB]">
                Weekly Study Room · Week {week} of 20
              </span>
              <span>·</span>
              <span className="font-mono">{course.courseCode}</span>
              <span>·</span>
              <span>Brochure p. {course.brochurePage}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#0F172A] tracking-tight">
              {course.title}
            </h1>
            {course.tools.length > 0 && (
              <p className="text-xs text-[#64748B]">
                Official tools &amp; stack: {course.tools.join(', ')}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <select
              aria-label="Switch Study Room week"
              value={week}
              onChange={(e) => {
                clearHighlightedTarget();
                setSelectedStudyWeek(Number(e.target.value));
              }}
              className="px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-sm font-medium text-[#0F172A]"
            >
              {Array.from({ length: 20 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  Week {w} {w === state.profile.currentWeek ? '(Current)' : ''}
                </option>
              ))}
            </select>

            {week !== state.profile.currentWeek && (
              <button
                type="button"
                onClick={() => updateProfile({ currentWeek: week })}
                className="px-3 py-2 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] hover:bg-[#DBEAFE] text-xs font-medium text-[#1D4ED8] whitespace-nowrap shrink-0 cursor-pointer"
              >
                Set as Current Week
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 max-w-md">
            <div className="flex justify-between text-xs mb-1.5 tabular-nums">
              <span className="font-medium text-[#334155]">Official Week {week} Mastery</span>
              <span className="font-semibold text-[#0F172A]">
                {completedCount} / {weekSubtopics.length} subtopics ({weekPct}%)
              </span>
            </div>
            <ProgressBar value={weekPct} colorClass="bg-[#2563EB]" />
          </div>
          <p className="text-xs text-[#64748B]">
            Priority order: 1. DataMites Official → 2. CWH Python → 3. CWH Data Science (Hindi) → 4.
            SSD Gaps
          </p>
        </div>
      </SectionCard>

      {/* Highlight Banner when navigated via Dashboard Continue Learning */}
      {highlightedTarget && highlightedTarget.week === week && highlightedTarget.subtopicId && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-sm text-[#1E3A8A]">
          <div className="flex items-center gap-2.5 min-w-0">
            <BookOpen className="w-4 h-4 text-[#2563EB] shrink-0" />
            <p className="text-xs sm:text-sm">
              <span className="font-semibold">Continue Learning target highlighted below:</span>{' '}
              scrolls straight to your next immediate official DataMites subtopic.
            </p>
          </div>
          <button
            type="button"
            onClick={clearHighlightedTarget}
            aria-label="Dismiss highlight"
            className="p-1 text-[#1D4ED8] hover:bg-[#DBEAFE] rounded cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTION A: Official DataMites Learning Scope */}
      <SectionCard className="p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0]">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A]">
              A. Official DataMites Scope (Week {week})
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Master curriculum from the official brochure. Mark Demonstrated or Complete only after
              hands-on implementation or recall.
            </p>
          </div>
          <ProvenanceInline label="DATAMITES_OFFICIAL" />
        </div>

        <div className="space-y-4">
          {modules.map((mod) => {
            const isOpen = expandedModules[mod.id] ?? true;
            return (
              <div key={mod.id} className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedModules((prev) => ({ ...prev, [mod.id]: !isOpen }))
                  }
                  className="w-full px-4 py-3 bg-[#F8FAFC] flex items-center justify-between gap-3 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-[#64748B] shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#64748B] shrink-0" />
                    )}
                    <span className="text-sm font-semibold text-[#0F172A] truncate">
                      Module {mod.moduleNumber}: {mod.title}
                    </span>
                  </div>
                  <span className="text-xs text-[#64748B] tabular-nums whitespace-nowrap shrink-0">
                    {mod.hours}h · {mod.subtopics.length} subtopics
                  </span>
                </button>

                {isOpen && (
                  <div className="divide-y divide-[#F1F5F9] bg-white">
                    {mod.subtopics.map((sub) => {
                      const rec = state.topicProgress[sub.id];
                      const status = rec?.status ?? 'not_started';
                      const isHighlighted =
                        highlightedTarget?.week === week &&
                        highlightedTarget?.subtopicId === sub.id;

                      return (
                        <div
                          key={sub.id}
                          id={`subtopic-${sub.id}`}
                          className={`px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                            isHighlighted
                              ? 'bg-[#EFF6FF] ring-2 ring-inset ring-[#2563EB]'
                              : ''
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium text-[#0F172A]">{sub.title}</p>
                              {isHighlighted && (
                                <span className="px-2 py-0.5 rounded bg-[#2563EB] text-white text-[11px] font-medium whitespace-nowrap shrink-0">
                                  Next to study
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5">
                              <ProvenanceInline label={sub.provenance} />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <select
                              aria-label={`Status for ${sub.title}`}
                              value={status}
                              onChange={(e) =>
                                updateTopicProgress(sub.id, week, {
                                  status: e.target.value as TopicStatus,
                                })
                              }
                              className={`px-2.5 py-1.5 rounded-md border text-xs font-medium cursor-pointer ${topicStatusTone(
                                status
                              )}`}
                            >
                              {TOPIC_STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              title="Flag as weak concept for revision"
                              onClick={() =>
                                addWeakConcept({
                                  week,
                                  topicId: sub.id,
                                  title: sub.title,
                                  notes: `Flagged from Week ${week} · ${mod.title}`,
                                  source: 'study_room',
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[#E2E8F0] hover:bg-[#FFFBEB] hover:border-[#FDE68A] hover:text-[#B45309] text-xs text-[#475569] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <Flag className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Flag weak</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* SECTION B-C: Mapped Supplementary Lessons */}
      <SectionCard className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A]">
              B. Mapped Supplementary Lessons (Week {week})
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Curated strictly for Week {week}. Marking &ldquo;Watched&rdquo; tracks video progress
              separately and never alters official DataMites mastery.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(['ALL', 'ESSENTIAL', 'OPTIONAL', 'SKIP'] as const).map((cls) => {
              const count =
                cls === 'ALL'
                  ? essentialCount + optionalCount + (showSkipResources ? skipCount : 0)
                  : cls === 'ESSENTIAL'
                    ? essentialCount
                    : cls === 'OPTIONAL'
                      ? optionalCount
                      : skipCount;
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setResourceFilter(cls)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    resourceFilter === cls
                      ? 'bg-[#0F172A] text-white border-[#0F172A]'
                      : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {cls} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {visibleResources.length === 0 ? (
          <p className="py-6 text-xs text-[#64748B] text-center">
            No supplementary lessons match this filter for Week {week}.
          </p>
        ) : (
          <div className="divide-y divide-[#F1F5F9]">
            {visibleResources.map((item) => {
              const cls = getClassificationForWeek(item, week);
              const rs = state.resourceStates[item.id];
              const watched = Boolean(rs?.watched);
              const pinnedHere = rs?.pinnedWeek === week;

              return (
                <div
                  key={item.id}
                  className="py-3.5 flex flex-col md:flex-row md:items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <ClassificationTag value={cls} />
                      <LanguageTag language={item.language} />
                      <span className="text-[11px] font-medium text-[#64748B]">
                        Tier {item.priorityTier} · {item.courseName}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[#0F172A]">{item.title}</p>
                    <p className="text-xs text-[#475569]">{item.reason}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#64748B]">
                      <span>Locator: {item.locator}</span>
                      {item.duration && <span className="tabular-nums">{item.duration}</span>}
                      {item.filePath && (
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#475569]">
                          <FolderOpen className="w-3 h-3 text-[#94A3B8]" />
                          {item.filePath}
                        </span>
                      )}
                      {!item.verified && (
                        <span className="text-[#B45309] font-medium">UNVERIFIED archive contents</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-1 md:pt-0">
                    <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-medium text-[#334155] cursor-pointer whitespace-nowrap shrink-0">
                      <input
                        type="checkbox"
                        checked={watched}
                        onChange={() => toggleResourceWatched(item.id, week)}
                        className="h-3.5 w-3.5 rounded border-[#CBD5E1] text-[#2563EB]"
                      />
                      <span>Watched</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => pinResourceToWeek(item.id, week, item.title)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        pinnedHere
                          ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8]'
                          : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <Pin className="w-3.5 h-3.5" />
                      <span>{pinnedHere ? 'Pinned' : 'Pin to Plan'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {resourceFilter === 'ALL' && skipCount > 0 && (
          <div className="pt-2 border-t border-[#F1F5F9]">
            <button
              type="button"
              onClick={() => setShowSkipResources((v) => !v)}
              className="text-xs font-medium text-[#64748B] hover:text-[#0F172A] cursor-pointer"
            >
              {showSkipResources
                ? `Hide ${skipCount} SKIP items`
                : `Show ${skipCount} SKIP items (redundant/out-of-scope for Week ${week})`}
            </button>
          </div>
        )}
      </SectionCard>

      {/* SECTION D: Practical Work */}
      <SectionCard className="p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0]">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A]">
              C. Practical Implementation &amp; Coding Exercises
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Curated hands-on tasks aligned to Week {week} modules. Log your repo or notebook link
              as evidence.
            </p>
          </div>
          <ProvenanceInline label="SUPPLEMENTARY_PRACTICE_PROPOSED" />
        </div>

        <div className="space-y-4">
          {weekExercises.map((ex) => {
            const log = state.practiceLogs[ex.id];
            const status = log?.status ?? 'not_started';
            const detailsOpen = Boolean(openExerciseDetails[ex.id]);
            const hintOpen = Boolean(openExerciseHints[ex.id]);

            return (
              <div key={ex.id} className="border border-[#E2E8F0] rounded-lg p-4 space-y-3 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-[#2563EB] shrink-0" />
                      <h3 className="text-sm font-semibold text-[#0F172A]">{ex.title}</h3>
                      <span className="text-[11px] uppercase tracking-wide text-[#64748B]">
                        · {ex.type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-[#334155] leading-relaxed">{ex.prompt}</p>
                    <p className="text-xs text-[#64748B]">
                      <span className="font-medium text-[#334155]">Input / Dataset:</span>{' '}
                      {ex.datasetOrInput}
                    </p>
                    <p className="text-xs text-[#64748B]">
                      <span className="font-medium text-[#334155]">Deliverable:</span>{' '}
                      {ex.deliverable}
                    </p>
                  </div>

                  <select
                    aria-label={`Practice status for ${ex.title}`}
                    value={status}
                    onChange={(e) =>
                      updatePracticeLog(ex.id, week, {
                        status: e.target.value as 'not_started' | 'in_progress' | 'completed',
                      })
                    }
                    className={`px-2.5 py-1.5 rounded-md border text-xs font-medium shrink-0 cursor-pointer ${
                      status === 'completed'
                        ? 'text-[#047857] bg-[#ECFDF5] border-[#A7F3D0]'
                        : status === 'in_progress'
                          ? 'text-[#1D4ED8] bg-[#EFF6FF] border-[#BFDBFE]'
                          : 'text-[#475569] bg-[#F8FAFC] border-[#E2E8F0]'
                    }`}
                  >
                    <option value="not_started">Not started</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {ex.starterCode && (
                    <button
                      type="button"
                      onClick={() =>
                        setOpenExerciseDetails((prev) => ({ ...prev, [ex.id]: !detailsOpen }))
                      }
                      className="px-2.5 py-1 rounded border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-xs font-medium text-[#334155] cursor-pointer"
                    >
                      {detailsOpen ? 'Hide Starter Code' : 'View Starter Code'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setOpenExerciseHints((prev) => ({ ...prev, [ex.id]: !hintOpen }))
                    }
                    className="px-2.5 py-1 rounded border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-xs font-medium text-[#334155] cursor-pointer"
                  >
                    {hintOpen ? 'Hide Hint & Approach' : 'Show Hint & Reference Approach'}
                  </button>
                </div>

                {detailsOpen && ex.starterCode && (
                  <pre className="p-3 rounded-lg bg-[#0F172A] text-[#F8FAFC] text-xs font-mono overflow-x-auto leading-relaxed">
                    <code>{ex.starterCode}</code>
                  </pre>
                )}

                {hintOpen && (
                  <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#334155] space-y-1.5">
                    <p>
                      <span className="font-semibold text-[#0F172A]">Hint:</span> {ex.hint}
                    </p>
                    <p>
                      <span className="font-semibold text-[#0F172A]">Reference approach:</span>{' '}
                      {ex.referenceApproach}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#F1F5F9]">
                  <input
                    type="url"
                    value={log?.evidenceUrl ?? ''}
                    onChange={(e) =>
                      updatePracticeLog(ex.id, week, { evidenceUrl: e.target.value })
                    }
                    placeholder="Evidence URL (GitHub repo, Colab, or commit link)"
                    className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A]"
                  />
                  <input
                    type="text"
                    value={log?.notes ?? ''}
                    onChange={(e) => updatePracticeLog(ex.id, week, { notes: e.target.value })}
                    placeholder="Implementation notes or observed metric..."
                    className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A]"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* SECTION E & F: Quick Knowledge Check + Completion Criteria */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <SectionCard className="lg:col-span-5 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div>
              <h2 className="text-base font-semibold text-[#0F172A]">
                D. Quick Knowledge Check
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Offline recall tools for Week {week}
              </p>
            </div>
            <RotateCcw className="w-4 h-4 text-[#2563EB]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setActiveSection('revision')}
              className="p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#EFF6FF] hover:border-[#BFDBFE] text-left transition-colors cursor-pointer"
            >
              <p className="text-xs font-semibold text-[#0F172A]">Week {week} Flashcards</p>
              <p className="text-xs text-[#64748B] mt-0.5 tabular-nums">
                {weekFlashcards.length} curated cards
              </p>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('revision')}
              className="p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#EFF6FF] hover:border-[#BFDBFE] text-left transition-colors cursor-pointer"
            >
              <p className="text-xs font-semibold text-[#0F172A]">Week {week} Quiz</p>
              <p className="text-xs text-[#64748B] mt-0.5 tabular-nums">
                {weekQuizzes.length} offline questions
              </p>
            </button>
          </div>

          <form onSubmit={handleQuickWeakSubmit} className="pt-3 border-t border-[#E2E8F0] space-y-2.5">
            <p className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
              <span>Log a Weak Concept for Week {week}</span>
            </p>
            <input
              type="text"
              value={quickWeakTitle}
              onChange={(e) => setQuickWeakTitle(e.target.value)}
              placeholder="Concept you want to revisit (e.g., Backprop chain rule)"
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A]"
            />
            <input
              type="text"
              value={quickWeakNotes}
              onChange={(e) => setQuickWeakNotes(e.target.value)}
              placeholder="What felt confusing? (optional)"
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A]"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-medium cursor-pointer"
            >
              Add to Weak Concepts Queue
            </button>
          </form>
        </SectionCard>

        <SectionCard className="lg:col-span-7 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div>
              <h2 className="text-base font-semibold text-[#0F172A]">
                E. Week {week} Completion Criteria
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Verify understanding, implementation, and evidence before advancing to Week{' '}
                {Math.min(20, week + 1)}.
              </p>
            </div>
            <HelpCircle className="w-4 h-4 text-[#64748B]" />
          </div>

          {criteria && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
                  Understand
                </h3>
                <ul className="space-y-2">
                  {criteria.understand.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-[#334155]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#94A3B8] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#059669]">
                  Implement
                </h3>
                <ul className="space-y-2">
                  {criteria.implement.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-[#334155]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#94A3B8] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#475569]">
                  Evidence
                </h3>
                <ul className="space-y-2">
                  {criteria.evidence.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-[#334155]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#94A3B8] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
