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
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
            {DATAMITES_PROGRAM_FACTS.bundleCode} · {DATAMITES_PROGRAM_FACTS.brochureVersion}
          </p>
          <h1 className="text-2xl font-semibold text-[#0F172A] tracking-tight mt-0.5">
            Official DataMites Curriculum
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Exact 20-week official sequence. Watching supplementary videos never auto-marks a topic
            Demonstrated or Complete.
          </p>
        </div>

        {/* Core vs Bonus Tab Switcher */}
        <div className="inline-flex rounded-lg border border-[#E2E8F0] bg-white p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('core')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'core'
                ? 'bg-[#2563EB] text-white'
                : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            Core 20-Week Curriculum ({coreCompleted}/{allCoreSubtopics.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bonus')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'bonus'
                ? 'bg-[#2563EB] text-white'
                : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            Bonus Courses — Optional ({bonusCompletedModules}/{bonusTotalModules})
          </button>
        </div>
      </div>

      {activeTab === 'core' ? (
        <>
          {/* Filter Bar */}
          <SectionCard className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search official courses, modules, subtopics, or tools..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <select
                  aria-label="Filter by week"
                  value={weekFilter}
                  onChange={(e) =>
                    setWeekFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
                  }
                  className="px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A]"
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
                  className="px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A]"
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
                  className="px-3 py-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-xs font-medium text-[#334155] whitespace-nowrap shrink-0 cursor-pointer"
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
                  className={`overflow-hidden ${
                    isCurrentCourse ? 'ring-1 ring-[#2563EB]/30' : ''
                  }`}
                >
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
                    <button
                      type="button"
                      onClick={() => toggleCourse(course.id)}
                      className="flex items-start gap-3 text-left min-w-0 flex-1 cursor-pointer"
                    >
                      {isOpen ? (
                        <ChevronDown className="w-5 h-5 text-[#64748B] shrink-0 mt-0.5" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-[#64748B] shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
                          <span className="font-semibold text-[#2563EB]">{course.weekLabel}</span>
                          <span>·</span>
                          <span className="font-mono">{course.courseCode}</span>
                          <span>·</span>
                          <span className="tabular-nums">{course.liveHours}h live</span>
                          <span>·</span>
                          <span>Brochure p. {course.brochurePage}</span>
                          {isCurrentCourse && (
                            <span className="px-1.5 py-0.5 rounded bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] font-medium">
                              Active Week
                            </span>
                          )}
                        </div>
                        <h2 className="text-base font-semibold text-[#0F172A] mt-1">
                          {course.order}. {course.title}
                        </h2>
                        {course.tools.length > 0 && (
                          <p className="text-xs text-[#64748B] mt-1">
                            Tools: {course.tools.join(', ')}
                          </p>
                        )}
                      </div>
                    </button>

                    <div className="flex items-center gap-4 shrink-0 pl-8 sm:pl-0">
                      <div className="w-32">
                        <div className="flex justify-between text-xs mb-1 tabular-nums">
                          <span className="text-[#64748B]">Mastered</span>
                          <span className="font-semibold text-[#0F172A]">
                            {doneCount}/{courseSubtopics.length}
                          </span>
                        </div>
                        <ProgressBar value={pct} colorClass="bg-[#2563EB]" heightClass="h-1.5" />
                      </div>
                      <button
                        type="button"
                        onClick={() => openStudyRoomForWeek(course.weeks[0])}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-medium text-[#0F172A] whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span>Study Room</span>
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-[#E2E8F0] bg-[#F8FAFC]/60 divide-y divide-[#E2E8F0]">
                      {matchingModules.map((mod) => (
                        <div key={mod.id} className="p-4 sm:p-5 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-semibold text-[#0F172A]">
                                Module {mod.moduleNumber}: {mod.title}
                              </h3>
                              <p className="text-xs text-[#64748B] mt-0.5 tabular-nums">
                                Week {mod.week} · {mod.hours}h official allocation
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => openStudyRoomForWeek(mod.week, mod.id, mod.subtopics[0]?.id)}
                              className="text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] cursor-pointer"
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
                                  className="bg-white border border-[#E2E8F0] rounded-lg p-3"
                                >
                                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-[#0F172A]">
                                        {sub.title}
                                      </p>
                                      <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <ProvenanceInline label={sub.provenance} />
                                        {rec?.evidenceUrl && (
                                          <a
                                            href={rec.evidenceUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-xs text-[#2563EB] hover:underline"
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

                                      <select
                                        aria-label={`Assignment status for ${sub.title}`}
                                        value={assign}
                                        onChange={(e) =>
                                          updateTopicProgress(sub.id, sub.week, {
                                            assignmentStatus: e.target.value as AssignmentStatus,
                                          })
                                        }
                                        className="px-2 py-1.5 rounded-md border border-[#E2E8F0] bg-white text-xs text-[#475569] cursor-pointer"
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
                                        className="px-2 py-1.5 rounded-md border border-[#E2E8F0] bg-white text-xs text-[#475569] cursor-pointer"
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
                                        className="px-2.5 py-1.5 rounded-md border border-[#E2E8F0] text-xs font-medium text-[#334155] hover:bg-[#F8FAFC] cursor-pointer"
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
                                    <div className="mt-3 pt-3 border-t border-[#F1F5F9] grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-medium text-[#475569] mb-1">
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
                                          className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A]"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-[#475569] mb-1">
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
                                          className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A]"
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
          <SectionCard className="p-4 bg-[#F8FAFC]">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <p className="text-xs text-[#334155]">
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
              <SectionCard key={course.id} className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
                      <span className="font-mono font-semibold text-[#2563EB]">
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
                    <h2 className="text-base font-semibold text-[#0F172A] mt-1">{course.title}</h2>
                    {course.tools.length > 0 && (
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Tools: {course.tools.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="w-36 shrink-0">
                    <div className="flex justify-between text-xs mb-1 tabular-nums">
                      <span className="text-[#64748B]">Bonus progress</span>
                      <span className="font-semibold text-[#0F172A]">
                        {done}/{course.modules.length}
                      </span>
                    </div>
                    <ProgressBar
                      value={done}
                      max={course.modules.length}
                      colorClass="bg-[#475569]"
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
                        className="p-3.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]/50 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-[#0F172A]">
                            Module {mod.moduleNumber}: {mod.title}
                          </h3>
                          <ul className="list-disc pl-4 text-xs text-[#475569] space-y-0.5">
                            {mod.topics.map((t, idx) => (
                              <li key={idx}>{t}</li>
                            ))}
                          </ul>
                          {mod.assignment && (
                            <p className="text-xs text-[#2563EB] font-medium pt-1">
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
                          className="px-2.5 py-1.5 rounded-md border border-[#E2E8F0] bg-white text-xs font-medium text-[#0F172A] shrink-0 cursor-pointer"
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
