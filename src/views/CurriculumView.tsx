import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Search,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import {
  BONUS_COURSES,
  DATAMITES_PROGRAM_FACTS,
  getAllSubtopics,
  OFFICIAL_CURRICULUM,
} from '../data/curriculum';
import { AssignmentStatus, BonusModuleStatus, RevisionStatus, TopicStatus } from '../types';
import {
  ASSIGNMENT_STATUS_OPTIONS,
  BONUS_STATUS_OPTIONS,
  ProgressBar,
  ProvenanceInline,
  REVISION_STATUS_OPTIONS,
  SectionCard,
  TOPIC_STATUS_OPTIONS,
  topicStatusTone,
} from '../components/StatusPrimitives';

export function CurriculumView() {
  const { state, updateTopicProgress, updateBonusProgress, openStudyRoomForWeek } = useAppState();

  const [activeTab, setActiveTab] = useState<'core' | 'bonus'>('core');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TopicStatus>('all');
  const [weekFilter, setWeekFilter] = useState<'all' | number>('all');
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    OFFICIAL_CURRICULUM.forEach((c) => {
      if (c.weeks.includes(state.profile.currentWeek)) {
        init[c.id] = true;
      }
    });
    return init;
  });
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);

  const allCoreSubtopics = useMemo(() => getAllSubtopics(), []);
  const coreCompleted = useMemo(
    () =>
      allCoreSubtopics.filter((s) => {
        const st = state.topicProgress[s.id]?.status;
        return st === 'demonstrated' || st === 'complete';
      }).length,
    [allCoreSubtopics, state.topicProgress]
  );

  const bonusTotalModules = useMemo(
    () => BONUS_COURSES.reduce((acc, c) => acc + c.modules.length, 0),
    []
  );
  const bonusCompletedModules = useMemo(
    () =>
      BONUS_COURSES.flatMap((c) => c.modules).filter(
        (m) => state.bonusProgress[m.id]?.status === 'complete'
      ).length,
    [state.bonusProgress]
  );

  const toggleCourse = (courseId: string) => {
    setExpandedCourses((prev) => ({ ...prev, [courseId]: !prev[courseId] }));
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-secondary)]">
            {DATAMITES_PROGRAM_FACTS.bundleCode} · {DATAMITES_PROGRAM_FACTS.brochureVersion}
          </p>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-[var(--color-ink)] tracking-tight mt-0.5">
            Official DataMites Curriculum
          </h1>
          <p className="text-sm text-[var(--color-secondary)] mt-1">
            Exact 20-week official sequence. Watching supplementary videos never auto-marks a topic
            Demonstrated or Complete.
          </p>
        </div>

        {/* Core vs Bonus Tab Switcher */}
        <div className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex p-1 bg-[var(--color-sunken)] border border-[var(--color-line)] gap-1 shadow-none">
          <button
            type="button"
            onClick={() => setActiveTab('core')}
            className={`min-h-[44px] px-2.5 sm:px-3.5 py-2 text-xs font-mono text-center flex items-center justify-center cursor-pointer select-none border transition-colors ${
              activeTab === 'core'
                ? 'bg-[var(--color-ink)] text-[var(--color-paper)] border-[var(--color-ink)] font-semibold'
                : 'bg-[var(--color-surface)] text-[var(--color-secondary)] border-[var(--color-line-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-sunken)]'
            }`}
          >
            <span className="leading-tight">
              <span className="hidden sm:inline">
                Core 20-Week Curriculum ({coreCompleted}/{allCoreSubtopics.length})
              </span>
              <span className="sm:hidden block font-medium">Core Curriculum</span>
              <span className="sm:hidden block text-[11px] opacity-80 tabular-nums">
                ({coreCompleted}/{allCoreSubtopics.length})
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bonus')}
            className={`min-h-[44px] px-2.5 sm:px-3.5 py-2 text-xs font-mono text-center flex items-center justify-center cursor-pointer select-none border transition-colors ${
              activeTab === 'bonus'
                ? 'bg-[var(--color-ink)] text-[var(--color-paper)] border-[var(--color-ink)] font-semibold'
                : 'bg-[var(--color-surface)] text-[var(--color-secondary)] border-[var(--color-line-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-sunken)]'
            }`}
          >
            <span className="leading-tight">
              <span className="hidden sm:inline">
                Bonus Courses — Optional ({bonusCompletedModules}/{bonusTotalModules})
              </span>
              <span className="sm:hidden block font-medium">Bonus Courses</span>
              <span className="sm:hidden block text-[11px] opacity-80 tabular-nums">
                ({bonusCompletedModules}/{bonusTotalModules})
              </span>
            </span>
          </button>
        </div>
      </div>

      {activeTab === 'core' ? (
        <>
          {/* Filter Bar */}
          <SectionCard className="p-4 border border-[var(--color-line)]">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[var(--color-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search official courses, modules, subtopics, or tools..."
                  className="w-full min-h-[44px] pl-9 pr-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-ink)]"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <select
                  aria-label="Filter by week"
                  value={weekFilter}
                  onChange={(e) =>
                    setWeekFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
                  }
                  className="min-h-[44px] px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-mono text-[var(--color-ink)] cursor-pointer"
                >
                  <option value="all">All 20 Weeks</option>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w}>
                      Week {w}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filter by mastery status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | TopicStatus)}
                  className="min-h-[44px] px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-mono text-[var(--color-ink)] cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  {TOPIC_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    const allOpen = OFFICIAL_CURRICULUM.every((c) => expandedCourses[c.id]);
                    const next: Record<string, boolean> = {};
                    OFFICIAL_CURRICULUM.forEach((c) => {
                      next[c.id] = !allOpen;
                    });
                    setExpandedCourses(next);
                  }}
                  className="min-h-[44px] px-3.5 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sunken)] text-xs font-mono font-medium text-[var(--color-ink)] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {OFFICIAL_CURRICULUM.every((c) => expandedCourses[c.id])
                    ? 'Collapse all'
                    : 'Expand all'}
                </button>
              </div>
            </div>
          </SectionCard>

          {/* Official Courses List */}
          <div className="space-y-4">
            {OFFICIAL_CURRICULUM.map((course) => {
              const courseSubtopics = course.modules.flatMap((m) => m.subtopics);
              const matchingModules = course.modules
                .map((mod) => {
                  const filteredSubs = mod.subtopics.filter((sub) => {
                    if (weekFilter !== 'all' && sub.week !== weekFilter) return false;
                    const st = state.topicProgress[sub.id]?.status ?? 'not_started';
                    if (statusFilter !== 'all' && st !== statusFilter) return false;
                    if (normalizedQuery) {
                      const hay = `${course.title} ${course.courseCode} ${course.tools.join(' ')} ${mod.title} ${sub.title}`.toLowerCase();
                      if (!hay.includes(normalizedQuery)) return false;
                    }
                    return true;
                  });
                  return { ...mod, subtopics: filteredSubs };
                })
                .filter((mod) => mod.subtopics.length > 0);

              if (matchingModules.length === 0) return null;

              const doneCount = courseSubtopics.filter((s) => {
                const st = state.topicProgress[s.id]?.status;
                return st === 'demonstrated' || st === 'complete';
              }).length;
              const pct =
                courseSubtopics.length > 0
                  ? Math.round((doneCount / courseSubtopics.length) * 100)
                  : 0;
              const isOpen =
                Boolean(expandedCourses[course.id]) ||
                Boolean(normalizedQuery) ||
                weekFilter !== 'all' ||
                statusFilter !== 'all';
              const isCurrentCourse = course.weeks.includes(state.profile.currentWeek);

              return (
                <SectionCard
                  key={course.id}
                  className={`overflow-hidden border border-[var(--color-line)] ${
                    isCurrentCourse ? 'ring-1 ring-[var(--color-ink)]' : ''
                  }`}
                >
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--color-surface)]">
                    <button
                      type="button"
                      onClick={() => toggleCourse(course.id)}
                      className="flex items-start gap-3 text-left min-w-0 flex-1 cursor-pointer"
                    >
                      {isOpen ? (
                        <ChevronDown className="w-5 h-5 text-[var(--color-secondary)] shrink-0 mt-0.5" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-[var(--color-secondary)] shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-secondary)]">
                          <span className="font-mono font-semibold text-[var(--color-ink)]">{course.weekLabel}</span>
                          <span>·</span>
                          <span className="font-mono">{course.courseCode}</span>
                          <span>·</span>
                          <span className="tabular-nums font-mono">{course.liveHours}h live</span>
                          <span>·</span>
                          <span>Brochure p. {course.brochurePage}</span>
                          {isCurrentCourse && (
                            <span className="px-1.5 py-0.5 border border-[var(--color-ink)] bg-[var(--color-signal)] text-[var(--color-ink)] font-mono text-[11px] font-semibold">
                              Active Week
                            </span>
                          )}
                        </div>
                        <h2 className="text-base sm:text-lg font-display font-semibold text-[var(--color-ink)] mt-1">
                          {course.order}. {course.title}
                        </h2>
                        {course.tools.length > 0 && (
                          <p className="text-xs text-[var(--color-secondary)] mt-1 font-mono">
                            Tools: {course.tools.join(', ')}
                          </p>
                        )}
                      </div>
                    </button>

                    <div className="flex items-center gap-4 shrink-0 pl-8 sm:pl-0">
                      <div className="w-32">
                        <div className="flex justify-between text-xs mb-1 tabular-nums font-mono">
                          <span className="text-[var(--color-secondary)]">Mastered</span>
                          <span className="font-semibold text-[var(--color-ink)]">
                            {doneCount}/{courseSubtopics.length}
                          </span>
                        </div>
                        <ProgressBar value={pct} colorClass="bg-[var(--color-ink)]" heightClass="h-1.5" />
                      </div>
                      <button
                        type="button"
                        onClick={() => openStudyRoomForWeek(course.weeks[0])}
                        className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sunken)] text-xs font-mono font-medium text-[var(--color-ink)] whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[var(--color-ink)]" />
                        <span>Study Room</span>
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-[var(--color-line)] bg-[var(--color-sunken)]/40 divide-y divide-[var(--color-line)]">
                      {matchingModules.map((mod) => (
                        <div key={mod.id} className="p-4 sm:p-5 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-semibold text-[var(--color-ink)]">
                                Module {mod.moduleNumber}: {mod.title}
                              </h3>
                              <p className="text-xs text-[var(--color-secondary)] mt-0.5 tabular-nums font-mono">
                                Week {mod.week} · {mod.hours}h official allocation
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => openStudyRoomForWeek(mod.week, mod.id, mod.subtopics[0]?.id)}
                              className="text-xs font-mono font-medium text-[var(--color-ink)] underline hover:no-underline cursor-pointer"
                            >
                              Study Week {mod.week} →
                            </button>
                          </div>

                          <div className="space-y-2">
                            {mod.subtopics.map((sub) => {
                              const rec = state.topicProgress[sub.id];
                              const status = rec?.status ?? 'not_started';
                              const assign = rec?.assignmentStatus ?? 'not_started';
                              const rev = rec?.revisionStatus ?? 'none';
                              const notesOpen = expandedNotesId === sub.id;

                              return (
                                <div
                                  key={sub.id}
                                  className="bg-[var(--color-surface)] border border-[var(--color-line)] p-3"
                                >
                                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-[var(--color-ink)]">
                                        {sub.title}
                                      </p>
                                      <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <ProvenanceInline label={sub.provenance} />
                                        {rec?.evidenceUrl && (
                                          <a
                                            href={rec.evidenceUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-xs font-mono text-[var(--color-ink)] underline hover:no-underline"
                                          >
                                            <span>Evidence link</span>
                                            <ExternalLink className="w-3 h-3" />
                                          </a>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                                      <select
                                        aria-label={`Mastery status for ${sub.title}`}
                                        value={status}
                                        onChange={(e) =>
                                          updateTopicProgress(sub.id, sub.week, {
                                            status: e.target.value as TopicStatus,
                                          })
                                        }
                                        className={`min-h-[44px] px-2.5 py-1.5 border text-xs font-mono font-medium cursor-pointer ${topicStatusTone(
                                          status
                                        )}`}
                                      >
                                        {TOPIC_STATUS_OPTIONS.map((opt) => (
                                          <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                          </option>
                                        ))}
                                      </select>

                                      <select
                                        aria-label={`Assignment status for ${sub.title}`}
                                        value={assign}
                                        onChange={(e) =>
                                          updateTopicProgress(sub.id, sub.week, {
                                            assignmentStatus: e.target.value as AssignmentStatus,
                                          })
                                        }
                                        className="min-h-[44px] px-2 py-1.5 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-mono text-[var(--color-secondary)] cursor-pointer"
                                      >
                                        {ASSIGNMENT_STATUS_OPTIONS.map((opt) => (
                                          <option key={opt.value} value={opt.value}>
                                            Assign: {opt.label}
                                          </option>
                                        ))}
                                      </select>

                                      <select
                                        aria-label={`Revision status for ${sub.title}`}
                                        value={rev}
                                        onChange={(e) =>
                                          updateTopicProgress(sub.id, sub.week, {
                                            revisionStatus: e.target.value as RevisionStatus,
                                          })
                                        }
                                        className="min-h-[44px] px-2 py-1.5 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-mono text-[var(--color-secondary)] cursor-pointer"
                                      >
                                        {REVISION_STATUS_OPTIONS.map((opt) => (
                                          <option key={opt.value} value={opt.value}>
                                            Rev: {opt.label}
                                          </option>
                                        ))}
                                      </select>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          setExpandedNotesId(notesOpen ? null : sub.id)
                                        }
                                        className="min-h-[44px] px-2.5 py-1.5 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-mono font-medium text-[var(--color-ink)] hover:bg-[var(--color-sunken)] cursor-pointer"
                                      >
                                        {notesOpen
                                          ? 'Hide notes'
                                          : rec?.notes || rec?.evidenceUrl
                                            ? 'Notes •'
                                            : 'Notes'}
                                      </button>
                                    </div>
                                  </div>

                                  {notesOpen && (
                                    <div className="mt-3 pt-3 border-t border-[var(--color-line)] grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1">
                                          Study notes &amp; takeaways
                                        </label>
                                        <textarea
                                          rows={2}
                                          value={rec?.notes ?? ''}
                                          onChange={(e) =>
                                            updateTopicProgress(sub.id, sub.week, {
                                              notes: e.target.value,
                                            })
                                          }
                                          placeholder="Key formulas, pitfalls, or summary in your own words..."
                                          className="w-full px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-ink)]"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1">
                                          Evidence URL (GitHub commit, notebook, repo)
                                        </label>
                                        <input
                                          type="url"
                                          value={rec?.evidenceUrl ?? ''}
                                          onChange={(e) =>
                                            updateTopicProgress(sub.id, sub.week, {
                                              evidenceUrl: e.target.value,
                                            })
                                          }
                                          placeholder="https://github.com/..."
                                          className="w-full min-h-[44px] px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-mono text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-ink)]"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              );
            })}
          </div>
        </>
      ) : (
        /* Optional Bonus Value-Added Courses Tab — Strictly Isolated from Core 20 Weeks */
        <div className="space-y-4">
          <SectionCard className="p-4 bg-[var(--color-sunken)] border border-[var(--color-line)]">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-[var(--color-ink)] shrink-0 mt-0.5" />
              <p className="text-xs text-[var(--color-secondary)] leading-relaxed">
                These three optional value-added courses appear on Brochure pp. 24–27 (
                {DATAMITES_PROGRAM_FACTS.bonusLearningHours} learning hours /{' '}
                {DATAMITES_PROGRAM_FACTS.bonusLiveHours} lecture hours). They are tracked strictly
                separately here and never count toward your Core 20-Week completion percentage.
              </p>
            </div>
          </SectionCard>

          {BONUS_COURSES.map((course) => {
            const done = course.modules.filter(
              (m) => state.bonusProgress[m.id]?.status === 'complete'
            ).length;
            return (
              <SectionCard key={course.id} className="p-5 space-y-4 border border-[var(--color-line)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--color-line)]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-secondary)] font-mono">
                      <span className="font-semibold text-[var(--color-ink)]">
                        {course.courseCode}
                      </span>
                      <span>·</span>
                      <span>{course.valueLabel}</span>
                      <span>·</span>
                      <span className="tabular-nums">
                        {course.lectureHours}h lectures / {course.learningHours}h total
                      </span>
                      <span>·</span>
                      <span>Brochure p. {course.brochurePage}</span>
                    </div>
                    <h2 className="text-base sm:text-lg font-display font-semibold text-[var(--color-ink)] mt-1">{course.title}</h2>
                    {course.tools.length > 0 && (
                      <p className="text-xs text-[var(--color-secondary)] mt-0.5 font-mono">
                        Tools: {course.tools.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="w-36 shrink-0">
                    <div className="flex justify-between text-xs mb-1 tabular-nums font-mono">
                      <span className="text-[var(--color-secondary)]">Bonus progress</span>
                      <span className="font-semibold text-[var(--color-ink)]">
                        {done}/{course.modules.length}
                      </span>
                    </div>
                    <ProgressBar
                      value={done}
                      max={course.modules.length}
                      colorClass="bg-[var(--color-ink)]"
                      heightClass="h-1.5"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {course.modules.map((mod) => {
                    const rec = state.bonusProgress[mod.id];
                    const status = rec?.status ?? 'not_started';
                    return (
                      <div
                        key={mod.id}
                        className="p-3.5 border border-[var(--color-line)] bg-[var(--color-surface)] flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-[var(--color-ink)]">
                            Module {mod.moduleNumber}: {mod.title}
                          </h3>
                          <ul className="list-disc pl-4 text-xs text-[var(--color-secondary)] space-y-0.5">
                            {mod.topics.map((t, idx) => (
                              <li key={idx}>{t}</li>
                            ))}
                          </ul>
                          {mod.assignment && (
                            <p className="text-xs font-mono text-[var(--color-ink)] font-medium pt-1">
                              Assignment: {mod.assignment}
                            </p>
                          )}
                        </div>
                        <select
                          aria-label={`Bonus status for ${mod.title}`}
                          value={status}
                          onChange={(e) =>
                            updateBonusProgress(mod.id, e.target.value as BonusModuleStatus)
                          }
                          className="min-h-[44px] px-2.5 py-1.5 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-mono font-medium text-[var(--color-ink)] shrink-0 cursor-pointer"
                        >
                          {BONUS_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
