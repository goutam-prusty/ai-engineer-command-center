import React, { useMemo } from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  FolderGit2,
  Layers,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import {
  DATAMITES_PROGRAM_FACTS,
  getAllSubtopics,
  getCourseForWeek,
  getSubtopicsForWeek,
  OFFICIAL_COMPETENCY_AREAS,
} from '../data/curriculum';
import { getExercisesForWeek } from '../data/assessments';
import { getClassificationForWeek, getResourcesForWeek } from '../data/resources';
import {
  formatTopicStatus,
  ProgressBar,
  SectionCard,
  topicStatusTone,
} from '../components/StatusPrimitives';

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function DashboardView() {
  const {
    state,
    nextLearningTarget,
    continueLearning,
    setActiveSection,
    openStudyRoomForWeek,
    updateStudySession,
  } = useAppState();

  const currentWeek = state.profile.currentWeek;
  const currentCourse = useMemo(() => getCourseForWeek(currentWeek), [currentWeek]);
  const allSubtopics = useMemo(() => getAllSubtopics(), []);
  const weekSubtopics = useMemo(() => getSubtopicsForWeek(currentWeek), [currentWeek]);
  const weekExercises = useMemo(() => getExercisesForWeek(currentWeek), [currentWeek]);
  const weekEssentialResources = useMemo(
    () =>
      getResourcesForWeek(currentWeek).filter(
        (r) => getClassificationForWeek(r, currentWeek) === 'ESSENTIAL'
      ),
    [currentWeek]
  );

  // Strict Official Curriculum Completion (only Demonstrated or Complete)
  const coreCompletedCount = useMemo(
    () =>
      allSubtopics.filter((s) => {
        const st = state.topicProgress[s.id]?.status;
        return st === 'demonstrated' || st === 'complete';
      }).length,
    [allSubtopics, state.topicProgress]
  );
  const corePct =
    allSubtopics.length > 0 ? Math.round((coreCompletedCount / allSubtopics.length) * 100) : 0;

  const weekCompletedCount = useMemo(
    () =>
      weekSubtopics.filter((s) => {
        const st = state.topicProgress[s.id]?.status;
        return st === 'demonstrated' || st === 'complete';
      }).length,
    [weekSubtopics, state.topicProgress]
  );
  const weekPct =
    weekSubtopics.length > 0 ? Math.round((weekCompletedCount / weekSubtopics.length) * 100) : 0;

  const officialProjectsDone = useMemo(
    () =>
      state.projects.filter(
        (p) => p.category === 'official_datamites' && p.status === 'completed'
      ).length,
    [state.projects]
  );
  const officialProjectsTotal = useMemo(
    () => state.projects.filter((p) => p.category === 'official_datamites').length,
    [state.projects]
  );

  const openWeakConcepts = useMemo(
    () => state.weakConcepts.filter((w) => !w.resolved),
    [state.weakConcepts]
  );
  const needsRevisionTopics = useMemo(
    () =>
      allSubtopics.filter((s) => state.topicProgress[s.id]?.status === 'needs_revision').length,
    [allSubtopics, state.topicProgress]
  );
  const needsReviewFlashcards = useMemo(
    () =>
      Object.values(state.flashcardStates).filter((f) => f.status === 'needs_review').length,
    [state.flashcardStates]
  );
  const totalPendingRevision =
    openWeakConcepts.length + needsRevisionTopics + needsReviewFlashcards;

  const weekSessions = useMemo(
    () => state.studySessions.filter((s) => s.week === currentWeek),
    [state.studySessions, currentWeek]
  );
  const upcomingSessions = useMemo(
    () => weekSessions.filter((s) => !s.completed).slice(0, 5),
    [weekSessions]
  );

  const watchedEssentialCount = useMemo(
    () => weekEssentialResources.filter((r) => state.resourceStates[r.id]?.watched).length,
    [weekEssentialResources, state.resourceStates]
  );

  const demonstratedCompetencies = useMemo(() => {
    const areas = new Set(
      state.projects
        .filter((p) => p.status === 'completed' && p.competencyArea)
        .map((p) => p.competencyArea)
    );
    return areas;
  }, [state.projects]);

  const targetReasonLabel: Record<typeof nextLearningTarget.reason, string> = {
    in_progress: 'In progress',
    needs_revision: 'Flagged for revision',
    next_in_sequence: 'Next in official sequence',
    week_complete: 'Current week complete',
  };

  return (
    <div className="space-y-6">
      {/* Primary Focus Card with Continue Learning CTA */}
      <SectionCard className="p-5 sm:p-6 border border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-secondary)]">
              Week {currentWeek} of 20 · {currentCourse.courseCode} · DataMites Master Sequence
            </p>
            <h1 className="text-2xl sm:text-3xl font-display font-semibold text-[var(--color-ink)] tracking-tight">
              Welcome back, {state.profile.learnerName}
            </h1>
            <p className="text-sm text-[var(--color-secondary)]">
              Active course:{' '}
              <span className="font-semibold text-[var(--color-ink)]">{currentCourse.title}</span>
              {' · '}Brochure target:{' '}
              <span className="tabular-nums font-mono font-medium text-[var(--color-ink)]">
                {state.profile.weeklyLiveHours +
                  state.profile.weeklySelfStudyHours +
                  state.profile.weeklyPracticeHours}
                h / week
              </span>
            </p>

            {/* Next Immediate Task Preview */}
            <div className="mt-4 pt-4 border-t border-[var(--color-line-soft)]">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[var(--color-secondary)]">
                <span className="font-semibold text-[var(--color-ink)] uppercase">Next immediate focus:</span>
                <span>{targetReasonLabel[nextLearningTarget.reason]}</span>
                <span>·</span>
                <span className="break-words">{nextLearningTarget.moduleTitle}</span>
              </div>
              <p className="mt-1 text-sm sm:text-base font-semibold text-[var(--color-ink)] break-words">
                {nextLearningTarget.subtopicTitle}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
            <button
              type="button"
              onClick={continueLearning}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--color-signal)] border border-[var(--color-ink)] text-[var(--color-ink)] text-xs font-mono font-bold hover:brightness-95 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Continue Learning</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => openStudyRoomForWeek(currentWeek)}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sunken)] text-[var(--color-ink)] text-xs font-mono font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-[var(--color-ink)]" />
              <span>Open Week {currentWeek} Study Room</span>
            </button>
          </div>
        </div>
      </SectionCard>

      {/* 4 Key Performance Indicators (All Live, Zero Fabricated Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SectionCard className="p-4 sm:p-5 border border-[var(--color-line)] border-t-2 border-t-[var(--color-ink)] bg-[var(--color-surface)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-secondary)]">Official Core Progress</span>
            <Layers className="w-4 h-4 text-[var(--color-ink)]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-display font-bold text-[var(--color-ink)] tabular-nums">{corePct}%</span>
            <span className="text-xs font-mono text-[var(--color-secondary)] tabular-nums">
              {coreCompletedCount} / {allSubtopics.length} subtopics
            </span>
          </div>
          <div className="mt-3">
            <ProgressBar value={corePct} colorClass="bg-[var(--color-ink)]" />
          </div>
          <p className="mt-2 text-[11px] text-[var(--color-secondary)]">
            Counts Demonstrated &amp; Complete only (excludes Bonus &amp; videos)
          </p>
        </SectionCard>

        <SectionCard className="p-4 sm:p-5 border border-[var(--color-line)] border-t-2 border-t-[var(--color-ink)] bg-[var(--color-surface)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-secondary)]">Week {currentWeek} Scope</span>
            <CheckCircle2 className="w-4 h-4 text-[var(--color-ink)]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-display font-bold text-[var(--color-ink)] tabular-nums">{weekPct}%</span>
            <span className="text-xs font-mono text-[var(--color-secondary)] tabular-nums">
              {weekCompletedCount} / {weekSubtopics.length} subtopics
            </span>
          </div>
          <div className="mt-3">
            <ProgressBar value={weekPct} colorClass="bg-[var(--color-ink)]" />
          </div>
          <p className="mt-2 text-[11px] text-[var(--color-secondary)] tabular-nums">
            Essential supplements watched: {watchedEssentialCount} / {weekEssentialResources.length}
          </p>
        </SectionCard>

        <SectionCard className="p-4 sm:p-5 border border-[var(--color-line)] border-t-2 border-t-[var(--color-ink)] bg-[var(--color-surface)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-secondary)]">Official Projects</span>
            <FolderGit2 className="w-4 h-4 text-[var(--color-ink)]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-display font-bold text-[var(--color-ink)] tabular-nums">
              {officialProjectsDone} / {DATAMITES_PROGRAM_FACTS.minimumOfficialProjects}
            </span>
            <span className="text-xs font-mono text-[var(--color-secondary)]">min required</span>
          </div>
          <div className="mt-3">
            <ProgressBar
              value={officialProjectsDone}
              max={DATAMITES_PROGRAM_FACTS.minimumOfficialProjects}
              colorClass="bg-[var(--color-ink)]"
            />
          </div>
          <p className="mt-2 text-[11px] text-[var(--color-secondary)] tabular-nums">
            {officialProjectsTotal} logged · {demonstratedCompetencies.size} / 8 competencies verified
          </p>
        </SectionCard>

        <SectionCard className="p-4 sm:p-5 border border-[var(--color-line)] border-t-2 border-t-[var(--color-ink)] bg-[var(--color-surface)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-secondary)]">Revision Queue</span>
            <RotateCcw className="w-4 h-4 text-[var(--color-ink)]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-display font-bold text-[var(--color-ink)] tabular-nums">
              {totalPendingRevision}
            </span>
            <span className="text-xs font-mono text-[var(--color-secondary)]">items to review</span>
          </div>
          <div className="mt-3 text-xs text-[var(--color-secondary)] space-y-0.5 tabular-nums font-mono">
            <p>
              {openWeakConcepts.length} weak · {needsRevisionTopics} topics · {needsReviewFlashcards} cards
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveSection('revision')}
            className="mt-2 min-h-[44px] text-xs font-mono font-medium text-[var(--color-ink)] underline hover:no-underline cursor-pointer inline-flex items-center"
          >
            Open Revision &amp; Assessments →
          </button>
        </SectionCard>
      </div>

      {/* 20-Week Master Curriculum Roadmap */}
      <SectionCard className="p-4 sm:p-5 border border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[var(--color-line)]">
          <div>
            <h2 className="text-base font-display font-semibold text-[var(--color-ink)]">
              20-Week Master Curriculum Roadmap
            </h2>
            <p className="text-xs text-[var(--color-secondary)] font-mono mt-0.5">
              Official sequence · Click any week to jump directly into its Study Room
            </p>
          </div>
          <span className="text-xs font-mono text-[var(--color-secondary)]">
            Active: <span className="font-bold text-[var(--color-ink)]">Week {currentWeek}</span>
          </span>
        </div>
        <div className="mt-4 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2">
          {Array.from({ length: 20 }, (_, i) => i + 1).map((w) => {
            const isCurrent = w === currentWeek;
            const isPast = w < currentWeek;
            const courseForW = getCourseForWeek(w);
            return (
              <button
                key={w}
                type="button"
                onClick={() => openStudyRoomForWeek(w)}
                aria-label={`Open Week ${w} Study Room: ${courseForW.courseCode}`}
                className={`min-h-[44px] p-2 flex flex-col items-center justify-center border text-center transition-colors cursor-pointer ${
                  isCurrent
                    ? 'border-2 border-[var(--color-ink)] bg-[var(--color-signal)] text-[var(--color-ink)] font-bold'
                    : isPast
                      ? 'border border-[var(--color-line)] bg-[var(--color-sunken)] text-[var(--color-ink)] hover:border-[var(--color-ink)]'
                      : 'border border-[var(--color-line-soft)] bg-[var(--color-surface)] text-[var(--color-secondary)] hover:border-[var(--color-line)] hover:text-[var(--color-ink)]'
                }`}
              >
                <span className="text-xs font-mono font-bold leading-none">W{w}</span>
                <span className="text-[10px] font-mono opacity-80 mt-1 truncate max-w-full">
                  {courseForW.courseCode}
                </span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Main Two-Column Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Weekly Study Plan & Active Practical Work */}
        <div className="lg:col-span-7 space-y-6">
          <SectionCard className="p-4 sm:p-5 border border-[var(--color-line)] bg-[var(--color-surface)]">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-[var(--color-line)]">
              <div>
                <h2 className="text-base font-display font-semibold text-[var(--color-ink)]">
                  Week {currentWeek} Upcoming Sessions
                </h2>
                <p className="text-xs text-[var(--color-secondary)] mt-0.5">
                  Scheduled blocks in your weekly learning plan
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSection('plan')}
                className="min-h-[44px] text-xs font-mono font-medium text-[var(--color-ink)] underline hover:no-underline whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center"
              >
                Manage Plan →
              </button>
            </div>

            {upcomingSessions.length === 0 ? (
              <div className="py-8 text-center bg-[var(--color-sunken)]/30 border border-dashed border-[var(--color-line-soft)] mt-4 p-4">
                <CalendarDays className="w-7 h-7 text-[var(--color-secondary)] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  No pending sessions for Week {currentWeek}
                </p>
                <p className="text-xs text-[var(--color-secondary)] mt-1 max-w-sm mx-auto">
                  Generate the brochure 20-hour schedule template or add custom study blocks.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveSection('plan')}
                  className="mt-3 min-h-[44px] px-4 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sunken)] text-xs font-mono font-medium text-[var(--color-ink)] cursor-pointer inline-flex items-center justify-center transition-colors"
                >
                  Open Weekly Planner
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-line-soft)] mt-1">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <label className="flex items-start gap-3 cursor-pointer min-w-0">
                      <input
                        type="checkbox"
                        checked={session.completed}
                        onChange={(e) =>
                          updateStudySession(session.id, { completed: e.target.checked })
                        }
                        className="mt-1 h-4 w-4 rounded-none border border-[var(--color-line)] accent-[var(--color-ink)] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--color-ink)] break-words">
                          {session.title}
                        </p>
                        <p className="text-xs font-mono text-[var(--color-secondary)]">
                          {session.day} · {session.category.replace('_', ' ')}
                        </p>
                      </div>
                    </label>
                    <span className="text-xs font-mono text-[var(--color-secondary)] tabular-nums whitespace-nowrap shrink-0">
                      {session.plannedMinutes} min
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard className="p-4 sm:p-5 border border-[var(--color-line)] bg-[var(--color-surface)]">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-[var(--color-line)]">
              <div>
                <h2 className="text-base font-display font-semibold text-[var(--color-ink)]">
                  Week {currentWeek} Practical Exercises
                </h2>
                <p className="text-xs text-[var(--color-secondary)] mt-0.5">
                  Hands-on coding &amp; implementation tasks (Supplementary Practice — Proposed)
                </p>
              </div>
              <button
                type="button"
                onClick={() => openStudyRoomForWeek(currentWeek)}
                className="min-h-[44px] text-xs font-mono font-medium text-[var(--color-ink)] underline hover:no-underline whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center"
              >
                Open in Study Room →
              </button>
            </div>

            <div className="divide-y divide-[var(--color-line-soft)] mt-1">
              {weekExercises.map((ex) => {
                const log = state.practiceLogs[ex.id];
                const status = log?.status ?? 'not_started';
                return (
                  <div
                    key={ex.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-[var(--color-ink)] shrink-0" />
                        <p className="text-sm font-medium text-[var(--color-ink)] break-words">{ex.title}</p>
                      </div>
                      <p className="text-xs text-[var(--color-secondary)] mt-1 line-clamp-2 break-words">{ex.deliverable}</p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-xs font-mono border whitespace-nowrap shrink-0 self-start sm:self-center ${
                        status === 'completed'
                          ? 'text-[var(--color-ink)] bg-[var(--color-sunken)] border-[var(--color-ink)] font-semibold'
                          : status === 'in_progress'
                            ? 'text-[var(--color-ink)] bg-[var(--color-surface)] border border-dashed border-[var(--color-line)] font-medium'
                            : 'text-[var(--color-secondary)] bg-[var(--color-surface)] border-[var(--color-line-soft)]'
                      }`}
                    >
                      {status === 'completed'
                        ? 'Completed'
                        : status === 'in_progress'
                          ? 'In progress'
                          : 'Not started'}
                    </span>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        {/* Right Column (5 cols): Week Subtopics Snapshot + Recent Activity + Competencies */}
        <div className="lg:col-span-5 space-y-6">
          <SectionCard className="p-4 sm:p-5 border border-[var(--color-line)] bg-[var(--color-surface)]">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-[var(--color-line)]">
              <div>
                <h2 className="text-base font-display font-semibold text-[var(--color-ink)]">
                  Week {currentWeek} Official Subtopics
                </h2>
                <p className="text-xs text-[var(--color-secondary)] mt-0.5">
                  Click any topic to jump straight into the Study Room
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSection('curriculum')}
                className="min-h-[44px] text-xs font-mono font-medium text-[var(--color-ink)] underline hover:no-underline whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center"
              >
                Full Syllabus →
              </button>
            </div>
            <div className="divide-y divide-[var(--color-line-soft)] mt-1 max-h-[300px] overflow-y-auto">
              {weekSubtopics.slice(0, 8).map((sub) => {
                const status = state.topicProgress[sub.id]?.status ?? 'not_started';
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => openStudyRoomForWeek(currentWeek, sub.moduleId, sub.id)}
                    className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-[var(--color-sunken)] px-1.5 transition-colors cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm text-[var(--color-ink)] break-words line-clamp-2">{sub.title}</span>
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 border whitespace-nowrap shrink-0 ${topicStatusTone(
                        status
                      )}`}
                    >
                      {formatTopicStatus(status)}
                    </span>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard className="p-4 sm:p-5 border border-[var(--color-line)] bg-[var(--color-surface)]">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--color-line)]">
              <h2 className="text-base font-display font-semibold text-[var(--color-ink)]">Recent Activity</h2>
              <ClipboardCheck className="w-4 h-4 text-[var(--color-ink)]" />
            </div>
            {state.activityLogs.length === 0 ? (
              <p className="py-5 text-xs text-[var(--color-secondary)] text-center font-mono">
                Updates to topics, exercises, quizzes, flashcards, and journal entries will appear
                here.
              </p>
            ) : (
              <div className="divide-y divide-[var(--color-line-soft)] mt-1">
                {state.activityLogs.slice(0, 6).map((act) => (
                  <div key={act.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[var(--color-ink)] break-words">{act.title}</p>
                      {act.detail && (
                        <p className="text-xs text-[var(--color-secondary)] break-words mt-0.5">{act.detail}</p>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-[var(--color-secondary)] whitespace-nowrap shrink-0 tabular-nums">
                      W{act.week} · {formatRelativeTime(act.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard className="p-4 sm:p-5 border border-[var(--color-line)] bg-[var(--color-surface)]">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--color-line)]">
              <div>
                <h2 className="text-base font-display font-semibold text-[var(--color-ink)]">
                  DataMites 8 Competency Areas
                </h2>
                <p className="text-xs text-[var(--color-secondary)] mt-0.5">
                  Demonstrated via completed official &amp; portfolio projects
                </p>
              </div>
              <Sparkles className="w-4 h-4 text-[var(--color-ink)]" />
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {OFFICIAL_COMPETENCY_AREAS.map((area) => {
                const done = demonstratedCompetencies.has(area.title);
                return (
                  <div
                    key={area.id}
                    className={`p-2.5 border text-xs flex items-start gap-2.5 transition-colors ${
                      done
                        ? 'bg-[var(--color-sunken)] border-[var(--color-ink)] text-[var(--color-ink)]'
                        : 'bg-[var(--color-surface)] border-[var(--color-line-soft)] text-[var(--color-secondary)]'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                        done ? 'text-[var(--color-ink)]' : 'text-[var(--color-line-soft)]'
                      }`}
                    />
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] text-[var(--color-secondary)] block">Area {area.number}</span>
                      <span className="font-medium text-[var(--color-ink)] break-words leading-tight block">
                        {area.title}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
