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
      <SectionCard className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
              Week {currentWeek} of 20 · {currentCourse.courseCode} · DataMites Master Sequence
            </p>
            <h1 className="text-2xl sm:text-[26px] font-semibold text-[#0F172A] tracking-tight">
              Welcome back, {state.profile.learnerName}
            </h1>
            <p className="text-sm text-[#475569]">
              Active course:{' '}
              <span className="font-medium text-[#0F172A]">{currentCourse.title}</span>
              {' · '}Brochure target:{' '}
              <span className="tabular-nums font-medium text-[#0F172A]">
                {state.profile.weeklyLiveHours +
                  state.profile.weeklySelfStudyHours +
                  state.profile.weeklyPracticeHours}
                h / week
              </span>
            </p>

            {/* Next Immediate Task Preview */}
            <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
                <span className="font-semibold text-[#0F172A]">Next immediate focus:</span>
                <span>{targetReasonLabel[nextLearningTarget.reason]}</span>
                <span>·</span>
                <span>{nextLearningTarget.moduleTitle}</span>
              </div>
              <p className="mt-1 text-[15px] font-medium text-[#0F172A]">
                {nextLearningTarget.subtopicTitle}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
            <button
              type="button"
              onClick={continueLearning}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Continue Learning</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => openStudyRoomForWeek(currentWeek)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#334155] text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#64748B]" />
              <span>Open Week {currentWeek} Study Room</span>
            </button>
          </div>
        </div>
      </SectionCard>

      {/* 4 Key Performance Indicators (All Live, Zero Fabricated Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SectionCard className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">Official Core Progress</span>
            <Layers className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-[#0F172A] tabular-nums">{corePct}%</span>
            <span className="text-xs text-[#64748B] tabular-nums">
              {coreCompletedCount} / {allSubtopics.length} subtopics
            </span>
          </div>
          <div className="mt-3">
            <ProgressBar value={corePct} colorClass="bg-[#2563EB]" />
          </div>
          <p className="mt-2 text-[11px] text-[#64748B]">
            Counts Demonstrated &amp; Complete only (excludes Bonus &amp; videos)
          </p>
        </SectionCard>

        <SectionCard className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">Week {currentWeek} Scope</span>
            <CheckCircle2 className="w-4 h-4 text-[#059669]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-[#0F172A] tabular-nums">{weekPct}%</span>
            <span className="text-xs text-[#64748B] tabular-nums">
              {weekCompletedCount} / {weekSubtopics.length} subtopics
            </span>
          </div>
          <div className="mt-3">
            <ProgressBar value={weekPct} colorClass="bg-[#059669]" />
          </div>
          <p className="mt-2 text-[11px] text-[#64748B] tabular-nums">
            Essential supplements watched: {watchedEssentialCount} / {weekEssentialResources.length}
          </p>
        </SectionCard>

        <SectionCard className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">Official Projects</span>
            <FolderGit2 className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-[#0F172A] tabular-nums">
              {officialProjectsDone} / {DATAMITES_PROGRAM_FACTS.minimumOfficialProjects}
            </span>
            <span className="text-xs text-[#64748B]">minimum required</span>
          </div>
          <div className="mt-3">
            <ProgressBar
              value={officialProjectsDone}
              max={DATAMITES_PROGRAM_FACTS.minimumOfficialProjects}
              colorClass="bg-[#2563EB]"
            />
          </div>
          <p className="mt-2 text-[11px] text-[#64748B] tabular-nums">
            {officialProjectsTotal} logged · {demonstratedCompetencies.size} / 8 competencies
            verified
          </p>
        </SectionCard>

        <SectionCard className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">Revision Queue</span>
            <RotateCcw className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-[#0F172A] tabular-nums">
              {totalPendingRevision}
            </span>
            <span className="text-xs text-[#64748B]">items needing review</span>
          </div>
          <div className="mt-3 text-xs text-[#475569] space-y-0.5 tabular-nums">
            <p>
              {openWeakConcepts.length} weak concepts · {needsRevisionTopics} topics ·{' '}
              {needsReviewFlashcards} flashcards
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveSection('revision')}
            className="mt-2 text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] cursor-pointer"
          >
            Open Revision &amp; Assessments →
          </button>
        </SectionCard>
      </div>

      {/* Main Two-Column Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Weekly Study Plan & Active Practical Work */}
        <div className="lg:col-span-7 space-y-6">
          <SectionCard className="p-5">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-base font-semibold text-[#0F172A]">
                  Week {currentWeek} Upcoming Sessions
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Scheduled blocks in your weekly learning plan
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSection('plan')}
                className="text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] whitespace-nowrap shrink-0 cursor-pointer"
              >
                Manage Plan →
              </button>
            </div>

            {upcomingSessions.length === 0 ? (
              <div className="py-6 text-center">
                <CalendarDays className="w-7 h-7 text-[#94A3B8] mx-auto mb-2" />
                <p className="text-sm font-medium text-[#0F172A]">
                  No pending sessions for Week {currentWeek}
                </p>
                <p className="text-xs text-[#64748B] mt-1">
                  Generate the brochure 20-hour schedule template or add custom study blocks.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveSection('plan')}
                  className="mt-3 px-3.5 py-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-xs font-medium text-[#0F172A] cursor-pointer"
                >
                  Open Weekly Planner
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#F1F5F9] mt-1">
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
                        className="mt-1 h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#0F172A] truncate">
                          {session.title}
                        </p>
                        <p className="text-xs text-[#64748B]">
                          {session.day} · {session.category.replace('_', ' ')}
                        </p>
                      </div>
                    </label>
                    <span className="text-xs font-medium text-[#475569] tabular-nums whitespace-nowrap shrink-0">
                      {session.plannedMinutes} min
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard className="p-5">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-base font-semibold text-[#0F172A]">
                  Week {currentWeek} Practical Exercises
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Hands-on coding &amp; implementation tasks (Supplementary Practice — Proposed)
                </p>
              </div>
              <button
                type="button"
                onClick={() => openStudyRoomForWeek(currentWeek)}
                className="text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] whitespace-nowrap shrink-0 cursor-pointer"
              >
                Open in Study Room →
              </button>
            </div>

            <div className="divide-y divide-[#F1F5F9] mt-1">
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
                        <Code2 className="w-4 h-4 text-[#2563EB] shrink-0" />
                        <p className="text-sm font-medium text-[#0F172A]">{ex.title}</p>
                      </div>
                      <p className="text-xs text-[#64748B] mt-1 line-clamp-2">{ex.deliverable}</p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded border whitespace-nowrap shrink-0 self-start sm:self-center ${
                        status === 'completed'
                          ? 'text-[#047857] bg-[#ECFDF5] border-[#A7F3D0]'
                          : status === 'in_progress'
                            ? 'text-[#1D4ED8] bg-[#EFF6FF] border-[#BFDBFE]'
                            : 'text-[#475569] bg-[#F8FAFC] border-[#E2E8F0]'
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
          <SectionCard className="p-5">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-base font-semibold text-[#0F172A]">
                  Week {currentWeek} Official Subtopics
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Click any topic to jump straight into the Study Room
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSection('curriculum')}
                className="text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] whitespace-nowrap shrink-0 cursor-pointer"
              >
                Full Syllabus →
              </button>
            </div>
            <div className="divide-y divide-[#F1F5F9] mt-1 max-h-[300px] overflow-y-auto">
              {weekSubtopics.slice(0, 8).map((sub) => {
                const status = state.topicProgress[sub.id]?.status ?? 'not_started';
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => openStudyRoomForWeek(currentWeek, sub.moduleId, sub.id)}
                    className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-[#F8FAFC] px-1.5 rounded transition-colors cursor-pointer"
                  >
                    <span className="text-sm text-[#0F172A] truncate">{sub.title}</span>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded border whitespace-nowrap shrink-0 ${topicStatusTone(
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

          <SectionCard className="p-5">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
              <h2 className="text-base font-semibold text-[#0F172A]">Recent Activity</h2>
              <ClipboardCheck className="w-4 h-4 text-[#64748B]" />
            </div>
            {state.activityLogs.length === 0 ? (
              <p className="py-5 text-xs text-[#64748B] text-center">
                Updates to topics, exercises, quizzes, flashcards, and journal entries will appear
                here.
              </p>
            ) : (
              <div className="divide-y divide-[#F1F5F9] mt-1">
                {state.activityLogs.slice(0, 6).map((act) => (
                  <div key={act.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#0F172A]">{act.title}</p>
                      {act.detail && (
                        <p className="text-xs text-[#64748B] truncate mt-0.5">{act.detail}</p>
                      )}
                    </div>
                    <span className="text-[11px] text-[#94A3B8] whitespace-nowrap shrink-0 tabular-nums">
                      W{act.week} · {formatRelativeTime(act.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard className="p-5">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-base font-semibold text-[#0F172A]">
                  DataMites 8 Competency Areas
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Demonstrated via completed official &amp; portfolio projects
                </p>
              </div>
              <Sparkles className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {OFFICIAL_COMPETENCY_AREAS.map((area) => {
                const done = demonstratedCompetencies.has(area.title);
                return (
                  <div
                    key={area.id}
                    className={`px-3 py-2 rounded-lg border text-xs flex items-center gap-2 ${
                      done
                        ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569]'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-3.5 h-3.5 shrink-0 ${
                        done ? 'text-[#059669]' : 'text-[#CBD5E1]'
                      }`}
                    />
                    <span className="truncate font-medium">{area.title}</span>
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
