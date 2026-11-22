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
      <SectionCard className="p-4 sm:p-5 border border-[var(--color-line)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-secondary)] font-mono">
              <span className="font-semibold uppercase tracking-wider text-[var(--color-secondary)]">
                Weekly Study Room · Week {week} of 20
              </span>
              <span>·</span>
              <span>{course.courseCode}</span>
              <span>·</span>
              <span>Brochure p. {course.brochurePage}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-semibold text-[var(--color-ink)] tracking-tight">
              {course.title}
            </h1>
            {course.tools.length > 0 && (
              <p className="text-xs text-[var(--color-secondary)] font-mono">
                Official tools &amp; stack: {course.tools.join(', ')}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0 w-full sm:w-auto">
            <select
              aria-label="Switch Study Room week"
              value={week}
              onChange={(e) => {
                clearHighlightedTarget();
                setSelectedStudyWeek(Number(e.target.value));
              }}
              className="min-h-[44px] px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-sm font-mono font-medium text-[var(--color-ink)] cursor-pointer w-full sm:w-auto"
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
                className="min-h-[44px] px-3.5 py-2 border border-[var(--color-ink)] bg-[var(--color-sunken)] hover:bg-[var(--color-line-soft)] text-xs font-mono font-medium text-[var(--color-ink)] whitespace-nowrap shrink-0 cursor-pointer w-full sm:w-auto"
              >
                Set as Current Week
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--color-line)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 max-w-md">
            <div className="flex justify-between text-xs mb-1.5 tabular-nums font-mono">
              <span className="font-medium text-[var(--color-secondary)]">Official Week {week} Mastery</span>
              <span className="font-semibold text-[var(--color-ink)]">
                {completedCount} / {weekSubtopics.length} subtopics ({weekPct}%)
              </span>
            </div>
            <ProgressBar value={weekPct} colorClass="bg-[var(--color-ink)]" />
          </div>
          <p className="text-xs text-[var(--color-secondary)] font-mono leading-relaxed">
            Priority order: 1. DataMites Official → 2. CWH Python → 3. CWH Data Science (Hindi) → 4.
            SSD Gaps
          </p>
        </div>
      </SectionCard>

      {/* Highlight Banner when navigated via Dashboard Continue Learning */}
      {highlightedTarget && highlightedTarget.week === week && highlightedTarget.subtopicId && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[var(--color-sunken)] border border-[var(--color-ink)] text-sm text-[var(--color-ink)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <BookOpen className="w-4 h-4 text-[var(--color-ink)] shrink-0" />
            <p className="text-xs sm:text-sm">
              <span className="font-semibold font-mono">Continue Learning target:</span>{' '}
              scrolls straight to your next immediate official DataMites subtopic below.
            </p>
          </div>
          <button
            type="button"
            onClick={clearHighlightedTarget}
            aria-label="Dismiss highlight"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-[var(--color-ink)] hover:bg-[var(--color-line-soft)] cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTION A: Official DataMites Learning Scope */}
      <SectionCard className="p-4 sm:p-5 space-y-4 border border-[var(--color-line)]">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--color-line)]">
          <div>
            <h2 className="text-base sm:text-lg font-display font-semibold text-[var(--color-ink)]">
              A. Official DataMites Scope (Week {week})
            </h2>
            <p className="text-xs text-[var(--color-secondary)] mt-0.5">
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
              <div key={mod.id} className="border border-[var(--color-line)] overflow-hidden">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedModules((prev) => ({ ...prev, [mod.id]: !isOpen }))
                  }
                  className="min-h-[48px] w-full px-3.5 py-3 bg-[var(--color-sunken)]/60 hover:bg-[var(--color-sunken)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 text-left cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-[var(--color-secondary)] shrink-0 mt-0.5" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[var(--color-secondary)] shrink-0 mt-0.5" />
                    )}
                    <span className="text-sm font-semibold text-[var(--color-ink)] break-words leading-snug">
                      Module {mod.moduleNumber}: {mod.title}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-[var(--color-secondary)] tabular-nums whitespace-nowrap shrink-0 self-start sm:self-center pl-6 sm:pl-0">
                    {mod.hours}h · {mod.subtopics.length} subtopics
                  </span>
                </button>

                {isOpen && (
                  <div className="divide-y divide-[var(--color-line-soft)] bg-[var(--color-surface)] border-t border-[var(--color-line)]">
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
                          className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                            isHighlighted
                              ? 'bg-[var(--color-sunken)] ring-2 ring-inset ring-[var(--color-ink)]'
                              : ''
                          }`}
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium text-[var(--color-ink)] leading-snug break-words">{sub.title}</p>
                              {isHighlighted && (
                                <span className="px-2 py-0.5 border border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)] font-mono text-[11px] font-semibold whitespace-nowrap shrink-0">
                                  Next to study
                                </span>
                              )}
                            </div>
                            <ProvenanceInline label={sub.provenance} />
                          </div>

                          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                            <select
                              aria-label={`Status for ${sub.title}`}
                              value={status}
                              onChange={(e) =>
                                updateTopicProgress(sub.id, week, {
                                  status: e.target.value as TopicStatus,
                                })
                              }
                              className={`min-h-[44px] flex-1 sm:flex-none px-2.5 py-1.5 border text-xs font-mono font-medium cursor-pointer ${topicStatusTone(
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
                              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sunken)] text-xs font-mono text-[var(--color-ink)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <Flag className="w-3.5 h-3.5 text-[var(--color-ink)]" />
                              <span className="inline">Flag weak</span>
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
      <SectionCard className="p-4 sm:p-5 space-y-4 border border-[var(--color-line)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-line)]">
          <div>
            <h2 className="text-base sm:text-lg font-display font-semibold text-[var(--color-ink)]">
              B. Mapped Supplementary Lessons (Week {week})
            </h2>
            <p className="text-xs text-[var(--color-secondary)] mt-0.5">
              Curated strictly for Week {week}. Marking &ldquo;Watched&rdquo; tracks video progress
              separately and never alters official DataMites mastery.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 sm:inline-flex gap-1.5 w-full sm:w-auto p-1 bg-[var(--color-sunken)] border border-[var(--color-line)]">
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
                  className={`min-h-[44px] px-2.5 py-2 text-xs font-mono text-center flex items-center justify-center cursor-pointer select-none border transition-colors ${
                    resourceFilter === cls
                      ? 'bg-[var(--color-ink)] text-[var(--color-paper)] border-[var(--color-ink)] font-semibold'
                      : 'bg-[var(--color-surface)] text-[var(--color-secondary)] border-[var(--color-line-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-sunken)]'
                  }`}
                >
                  <span>{cls} <span className="tabular-nums opacity-85 font-mono">({count})</span></span>
                </button>
              );
            })}
          </div>
        </div>

        {visibleResources.length === 0 ? (
          <p className="py-6 text-xs text-[var(--color-secondary)] font-mono text-center">
            No supplementary lessons match this filter for Week {week}.
          </p>
        ) : (
          <div className="divide-y divide-[var(--color-line-soft)]">
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
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <ClassificationTag value={cls} />
                      <LanguageTag language={item.language} />
                      <span className="text-[11px] font-mono text-[var(--color-secondary)]">
                        Tier {item.priorityTier} · {item.courseName}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[var(--color-ink)] leading-snug break-words">{item.title}</p>
                    <p className="text-xs text-[var(--color-secondary)] leading-relaxed break-words">{item.reason}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--color-secondary)] font-mono">
                      <span>Locator: {item.locator}</span>
                      {item.duration && <span className="tabular-nums font-mono">{item.duration}</span>}
                      {item.filePath && (
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--color-secondary)] break-all">
                          <FolderOpen className="w-3 h-3 text-[var(--color-muted)] shrink-0" />
                          <span>{item.filePath}</span>
                        </span>
                      )}
                      {!item.verified && (
                        <span className="text-[var(--color-ink)] font-semibold border border-[var(--color-line)] bg-[var(--color-sunken)] px-1 py-0.5">
                          UNVERIFIED archive contents
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-1 md:pt-0 w-full sm:w-auto">
                    <label className="min-h-[44px] flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sunken)] text-xs font-mono text-[var(--color-ink)] cursor-pointer whitespace-nowrap shrink-0 transition-colors">
                      <input
                        type="checkbox"
                        checked={watched}
                        onChange={() => toggleResourceWatched(item.id, week)}
                        className="h-4 w-4 rounded-none border-[var(--color-line)] text-[var(--color-ink)] accent-[var(--color-ink)]"
                      />
                      <span>Watched</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => pinResourceToWeek(item.id, week, item.title)}
                      className={`min-h-[44px] flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 border text-xs font-mono font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        pinnedHere
                          ? 'bg-[var(--color-ink)] border-[var(--color-ink)] text-[var(--color-paper)]'
                          : 'bg-[var(--color-surface)] border-[var(--color-line)] text-[var(--color-ink)] hover:bg-[var(--color-sunken)]'
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
          <div className="pt-2 border-t border-[var(--color-line-soft)]">
            <button
              type="button"
              onClick={() => setShowSkipResources((v) => !v)}
              className="min-h-[44px] inline-flex items-center text-xs font-mono font-medium text-[var(--color-secondary)] hover:text-[var(--color-ink)] cursor-pointer"
            >
              {showSkipResources
                ? `Hide ${skipCount} SKIP items`
                : `Show ${skipCount} SKIP items (redundant/out-of-scope for Week ${week})`}
            </button>
          </div>
        )}
      </SectionCard>

      {/* SECTION D: Practical Work */}
      <SectionCard className="p-4 sm:p-5 space-y-4 border border-[var(--color-line)]">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--color-line)]">
          <div>
            <h2 className="text-base sm:text-lg font-display font-semibold text-[var(--color-ink)]">
              C. Practical Implementation &amp; Coding Exercises
            </h2>
            <p className="text-xs text-[var(--color-secondary)] mt-0.5">
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
              <div key={ex.id} className="border border-[var(--color-line)] p-4 space-y-3 bg-[var(--color-surface)]">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-[var(--color-ink)] shrink-0" />
                      <h3 className="text-sm font-semibold text-[var(--color-ink)] break-words">{ex.title}</h3>
                      <span className="text-[11px] uppercase tracking-wide text-[var(--color-secondary)] font-mono">
                        · {ex.type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-secondary)] leading-relaxed break-words">{ex.prompt}</p>
                    <p className="text-xs text-[var(--color-secondary)] font-mono">
                      <span className="font-semibold text-[var(--color-ink)] font-sans">Input / Dataset:</span>{' '}
                      {ex.datasetOrInput}
                    </p>
                    <p className="text-xs text-[var(--color-secondary)] font-mono">
                      <span className="font-semibold text-[var(--color-ink)] font-sans">Deliverable:</span>{' '}
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
                    className={`min-h-[44px] w-full sm:w-auto px-3 py-2 border text-xs font-mono font-medium shrink-0 cursor-pointer ${
                      status === 'completed'
                        ? 'text-[var(--color-ink)] bg-[var(--color-sunken)] border-[var(--color-ink)] font-semibold'
                        : status === 'in_progress'
                          ? 'text-[var(--color-ink)] bg-[var(--color-surface)] border-[var(--color-ink)] font-semibold'
                          : 'text-[var(--color-secondary)] bg-[var(--color-surface)] border-[var(--color-line)]'
                    }`}
                  >
                    <option value="not_started">Not started</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1 w-full sm:w-auto">
                  {ex.starterCode && (
                    <button
                      type="button"
                      onClick={() =>
                        setOpenExerciseDetails((prev) => ({ ...prev, [ex.id]: !detailsOpen }))
                      }
                      className="min-h-[44px] px-3.5 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sunken)] text-xs font-mono font-medium text-[var(--color-ink)] cursor-pointer text-center"
                    >
                      {detailsOpen ? 'Hide Starter Code' : 'View Starter Code'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setOpenExerciseHints((prev) => ({ ...prev, [ex.id]: !hintOpen }))
                    }
                    className="min-h-[44px] px-3.5 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sunken)] text-xs font-mono font-medium text-[var(--color-ink)] cursor-pointer text-center"
                  >
                    {hintOpen ? 'Hide Hint & Approach' : 'Show Hint & Reference Approach'}
                  </button>
                </div>

                {detailsOpen && ex.starterCode && (
                  <pre className="p-3 bg-[var(--color-ink)] text-[var(--color-surface)] text-xs font-mono overflow-x-auto leading-relaxed border border-[var(--color-line)]">
                    <code>{ex.starterCode}</code>
                  </pre>
                )}

                {hintOpen && (
                  <div className="p-3 bg-[var(--color-sunken)] border border-[var(--color-line)] text-xs text-[var(--color-ink)] space-y-1.5">
                    <p>
                      <span className="font-semibold text-[var(--color-ink)] font-mono">Hint:</span> {ex.hint}
                    </p>
                    <p>
                      <span className="font-semibold text-[var(--color-ink)] font-mono">Reference approach:</span>{' '}
                      {ex.referenceApproach}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[var(--color-line-soft)]">
                  <input
                    type="url"
                    value={log?.evidenceUrl ?? ''}
                    onChange={(e) =>
                      updatePracticeLog(ex.id, week, { evidenceUrl: e.target.value })
                    }
                    placeholder="Evidence URL (GitHub repo, Colab, or commit link)"
                    className="min-h-[44px] px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-mono text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-ink)]"
                  />
                  <input
                    type="text"
                    value={log?.notes ?? ''}
                    onChange={(e) => updatePracticeLog(ex.id, week, { notes: e.target.value })}
                    placeholder="Implementation notes or observed metric..."
                    className="min-h-[44px] px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-ink)]"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* SECTION E & F: Quick Knowledge Check + Completion Criteria */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <SectionCard className="lg:col-span-5 p-4 sm:p-5 space-y-4 border border-[var(--color-line)]">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--color-line)]">
            <div>
              <h2 className="text-base sm:text-lg font-display font-semibold text-[var(--color-ink)]">
                D. Quick Knowledge Check
              </h2>
              <p className="text-xs text-[var(--color-secondary)] mt-0.5 font-mono">
                Offline recall tools for Week {week}
              </p>
            </div>
            <RotateCcw className="w-4 h-4 text-[var(--color-ink)]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setActiveSection('revision')}
              className="min-h-[44px] p-3 border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sunken)] text-left transition-colors cursor-pointer"
            >
              <p className="text-xs font-mono font-semibold text-[var(--color-ink)]">Week {week} Flashcards</p>
              <p className="text-xs text-[var(--color-secondary)] mt-0.5 tabular-nums font-mono">
                {weekFlashcards.length} curated cards
              </p>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('revision')}
              className="min-h-[44px] p-3 border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sunken)] text-left transition-colors cursor-pointer"
            >
              <p className="text-xs font-mono font-semibold text-[var(--color-ink)]">Week {week} Quiz</p>
              <p className="text-xs text-[var(--color-secondary)] mt-0.5 tabular-nums font-mono">
                {weekQuizzes.length} offline questions
              </p>
            </button>
          </div>

          <form onSubmit={handleQuickWeakSubmit} className="pt-3 border-t border-[var(--color-line)] space-y-2.5">
            <p className="text-xs font-semibold text-[var(--color-ink)] flex items-center gap-1.5 font-mono">
              <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-ink)]" />
              <span>Log a Weak Concept for Week {week}</span>
            </p>
            <input
              type="text"
              value={quickWeakTitle}
              onChange={(e) => setQuickWeakTitle(e.target.value)}
              placeholder="Concept you want to revisit (e.g., Backprop chain rule)"
              className="w-full min-h-[44px] px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-ink)]"
            />
            <input
              type="text"
              value={quickWeakNotes}
              onChange={(e) => setQuickWeakNotes(e.target.value)}
              placeholder="What felt confusing? (optional)"
              className="w-full min-h-[44px] px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-ink)]"
            />
            <button
              type="submit"
              className="w-full sm:w-auto min-h-[44px] px-4 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] text-xs font-mono font-medium cursor-pointer hover:opacity-90"
            >
              Add to Weak Concepts Queue
            </button>
          </form>
        </SectionCard>

        <SectionCard className="lg:col-span-7 p-4 sm:p-5 space-y-4 border border-[var(--color-line)]">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--color-line)]">
            <div>
              <h2 className="text-base sm:text-lg font-display font-semibold text-[var(--color-ink)]">
                E. Week {week} Completion Criteria
              </h2>
              <p className="text-xs text-[var(--color-secondary)] mt-0.5">
                Verify understanding, implementation, and evidence before advancing to Week{' '}
                {Math.min(20, week + 1)}.
              </p>
            </div>
            <HelpCircle className="w-4 h-4 text-[var(--color-secondary)]" />
          </div>

          {criteria && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 p-3 bg-[var(--color-sunken)]/50 border border-[var(--color-line-soft)]">
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-ink)]">
                  Understand
                </h3>
                <ul className="space-y-2">
                  {criteria.understand.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-[var(--color-secondary)]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-ink)] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2 p-3 bg-[var(--color-sunken)]/50 border border-[var(--color-line-soft)]">
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-ink)]">
                  Implement
                </h3>
                <ul className="space-y-2">
                  {criteria.implement.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-[var(--color-secondary)]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-ink)] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2 p-3 bg-[var(--color-sunken)]/50 border border-[var(--color-line-soft)]">
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-ink)]">
                  Evidence
                </h3>
                <ul className="space-y-2">
                  {criteria.evidence.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-[var(--color-secondary)]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-ink)] shrink-0 mt-0.5" />
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
