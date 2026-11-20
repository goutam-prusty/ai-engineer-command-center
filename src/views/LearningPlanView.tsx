import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Pin,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { DATAMITES_PROGRAM_FACTS, getCourseForWeek } from '../data/curriculum';
import { ALL_RESOURCES } from '../data/resources';
import { DayOfWeek, SessionCategory } from '../types';
import { LanguageTag, ProgressBar, SectionCard } from '../components/StatusPrimitives';

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CATEGORY_OPTIONS: { value: SessionCategory; label: string; short: string }[] = [
  { value: 'live_class', label: 'DataMites Live Class', short: 'Live class' },
  { value: 'self_study', label: 'Self-Study & Official Reading', short: 'Self-study' },
  { value: 'practice', label: 'Hands-on Coding & Projects', short: 'Practice' },
  { value: 'revision', label: 'Revision & Recall', short: 'Revision' },
  { value: 'supplementary', label: 'Supplementary Lesson', short: 'Supplementary' },
];

export function LearningPlanView() {
  const {
    state,
    addStudySession,
    updateStudySession,
    deleteStudySession,
    generateWeeklyPlanTemplate,
    openStudyRoomForWeek,
  } = useAppState();

  const [selectedWeek, setSelectedWeek] = useState<number>(state.profile.currentWeek);
  const [day, setDay] = useState<DayOfWeek>('Mon');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SessionCategory>('self_study');
  const [plannedMinutes, setPlannedMinutes] = useState(90);
  const [linkedRef, setLinkedRef] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMinutes, setEditMinutes] = useState(60);

  const course = useMemo(() => getCourseForWeek(selectedWeek), [selectedWeek]);
  const weekSessions = useMemo(
    () => state.studySessions.filter((s) => s.week === selectedWeek),
    [state.studySessions, selectedWeek]
  );

  const pinnedResources = useMemo(
    () =>
      ALL_RESOURCES.filter((r) => state.resourceStates[r.id]?.pinnedWeek === selectedWeek),
    [state.resourceStates, selectedWeek]
  );

  const totals = useMemo(() => {
    const liveMin = weekSessions
      .filter((s) => s.category === 'live_class')
      .reduce((acc, s) => acc + s.plannedMinutes, 0);
    const selfMin = weekSessions
      .filter(
        (s) =>
          s.category === 'self_study' ||
          s.category === 'revision' ||
          s.category === 'supplementary'
      )
      .reduce((acc, s) => acc + s.plannedMinutes, 0);
    const practiceMin = weekSessions
      .filter((s) => s.category === 'practice')
      .reduce((acc, s) => acc + s.plannedMinutes, 0);
    const completedMin = weekSessions
      .filter((s) => s.completed)
      .reduce((acc, s) => acc + s.plannedMinutes, 0);
    const totalMin = liveMin + selfMin + practiceMin;
    return { liveMin, selfMin, practiceMin, completedMin, totalMin };
  }, [weekSessions]);

  const targetTotalHours =
    state.profile.weeklyLiveHours +
    state.profile.weeklySelfStudyHours +
    state.profile.weeklyPracticeHours;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addStudySession({
      week: selectedWeek,
      day,
      title: title.trim(),
      category,
      plannedMinutes: Math.max(15, Math.min(480, Number(plannedMinutes) || 60)),
      linkedRef: linkedRef.trim(),
    });
    setTitle('');
    setLinkedRef('');
  };

  return (
    <div className="space-y-6">
      {/* Header + Week Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A] tracking-tight">My Learning Plan</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Schedule your weekly study blocks around the DataMites{' '}
            {DATAMITES_PROGRAM_FACTS.weeklyCommitment.total}-hour commitment (
            {DATAMITES_PROGRAM_FACTS.weeklyCommitment.liveTraining}h live ·{' '}
            {DATAMITES_PROGRAM_FACTS.weeklyCommitment.selfLearningAndRevision}h self-study ·{' '}
            {DATAMITES_PROGRAM_FACTS.weeklyCommitment.assignmentsAndProjects}h practice).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Select DataMites week"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-sm font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
          >
            {Array.from({ length: 20 }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>
                Week {w} {w === state.profile.currentWeek ? '(Current)' : ''} —{' '}
                {getCourseForWeek(w).title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => generateWeeklyPlanTemplate(selectedWeek)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate 20h Template</span>
          </button>
        </div>
      </div>

      {/* Allocation Tracker */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SectionCard className="p-4">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Live Training</span>
            <span className="tabular-nums font-medium text-[#0F172A]">
              {(totals.liveMin / 60).toFixed(1)}h / {state.profile.weeklyLiveHours}h
            </span>
          </div>
          <div className="mt-2.5">
            <ProgressBar
              value={totals.liveMin}
              max={state.profile.weeklyLiveHours * 60}
              colorClass="bg-[#2563EB]"
            />
          </div>
        </SectionCard>

        <SectionCard className="p-4">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Self-Study &amp; Revision</span>
            <span className="tabular-nums font-medium text-[#0F172A]">
              {(totals.selfMin / 60).toFixed(1)}h / {state.profile.weeklySelfStudyHours}h
            </span>
          </div>
          <div className="mt-2.5">
            <ProgressBar
              value={totals.selfMin}
              max={state.profile.weeklySelfStudyHours * 60}
              colorClass="bg-[#0EA5E9]"
            />
          </div>
        </SectionCard>

        <SectionCard className="p-4">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Hands-on Practice</span>
            <span className="tabular-nums font-medium text-[#0F172A]">
              {(totals.practiceMin / 60).toFixed(1)}h / {state.profile.weeklyPracticeHours}h
            </span>
          </div>
          <div className="mt-2.5">
            <ProgressBar
              value={totals.practiceMin}
              max={state.profile.weeklyPracticeHours * 60}
              colorClass="bg-[#059669]"
            />
          </div>
        </SectionCard>

        <SectionCard className="p-4">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Completed This Week</span>
            <span className="tabular-nums font-medium text-[#0F172A]">
              {(totals.completedMin / 60).toFixed(1)}h /{' '}
              {Math.max(targetTotalHours, Number((totals.totalMin / 60).toFixed(1)))}h
            </span>
          </div>
          <div className="mt-2.5">
            <ProgressBar
              value={totals.completedMin}
              max={Math.max(totals.totalMin, targetTotalHours * 60)}
              colorClass="bg-[#059669]"
            />
          </div>
        </SectionCard>
      </div>

      {/* Main Content: Add Form + Mon-Sun Schedule + Pinned Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Mon-Sun Schedule */}
        <div className="lg:col-span-8 space-y-4">
          <SectionCard className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-base font-semibold text-[#0F172A]">
                  Week {selectedWeek} Schedule · {course.title}
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {course.courseCode} · Brochure p. {course.brochurePage}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openStudyRoomForWeek(selectedWeek)}
                className="text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] whitespace-nowrap shrink-0 cursor-pointer"
              >
                Open Week {selectedWeek} Study Room →
              </button>
            </div>

            {weekSessions.length === 0 ? (
              <div className="py-10 text-center">
                <CalendarDays className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
                <p className="text-sm font-medium text-[#0F172A]">
                  No study blocks planned for Week {selectedWeek} yet
                </p>
                <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
                  Click &ldquo;Generate 20h Template&rdquo; above to pre-populate a structured
                  Mon–Sun schedule matching DataMites hours, or add individual blocks on the right.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {DAYS.map((d) => {
                  const daySessions = weekSessions.filter((s) => s.day === d);
                  if (daySessions.length === 0) return null;
                  const dayMins = daySessions.reduce((a, b) => a + b.plannedMinutes, 0);
                  return (
                    <div key={d} className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                      <div className="px-4 py-2 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#334155]">
                          {d}
                        </span>
                        <span className="text-xs text-[#64748B] tabular-nums">
                          {dayMins} min ({(dayMins / 60).toFixed(1)}h)
                        </span>
                      </div>
                      <div className="divide-y divide-[#F1F5F9]">
                        {daySessions.map((session) => (
                          <div
                            key={session.id}
                            className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white"
                          >
                            {editingId === session.id ? (
                              <div className="flex flex-1 flex-wrap items-center gap-2">
                                <input
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="flex-1 min-w-[180px] px-2.5 py-1.5 rounded border border-[#CBD5E1] text-sm text-[#0F172A]"
                                />
                                <input
                                  type="number"
                                  min={15}
                                  max={480}
                                  value={editMinutes}
                                  onChange={(e) => setEditMinutes(Number(e.target.value))}
                                  className="w-20 px-2 py-1.5 rounded border border-[#CBD5E1] text-sm text-[#0F172A] tabular-nums"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateStudySession(session.id, {
                                      title: editTitle.trim() || session.title,
                                      plannedMinutes: Math.max(15, Math.min(480, editMinutes)),
                                    });
                                    setEditingId(null);
                                  }}
                                  className="px-2.5 py-1.5 rounded bg-[#2563EB] text-white text-xs font-medium cursor-pointer"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="px-2.5 py-1.5 rounded border border-[#E2E8F0] text-xs text-[#475569] cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <>
                                <label className="flex items-start gap-3 cursor-pointer min-w-0 flex-1">
                                  <input
                                    type="checkbox"
                                    checked={session.completed}
                                    onChange={(e) =>
                                      updateStudySession(session.id, {
                                        completed: e.target.checked,
                                      })
                                    }
                                    className="mt-1 h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
                                  />
                                  <div className="min-w-0">
                                    <p
                                      className={`text-sm font-medium ${
                                        session.completed
                                          ? 'line-through text-[#94A3B8]'
                                          : 'text-[#0F172A]'
                                      }`}
                                    >
                                      {session.title}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-[#64748B]">
                                      <span>
                                        {CATEGORY_OPTIONS.find((c) => c.value === session.category)
                                          ?.short ?? session.category}
                                      </span>
                                      {session.linkedRef && (
                                        <>
                                          <span>·</span>
                                          <span className="truncate max-w-[260px]">
                                            {session.linkedRef}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </label>
                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                  <span className="inline-flex items-center gap-1 text-xs text-[#475569] tabular-nums">
                                    <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
                                    {session.plannedMinutes}m
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingId(session.id);
                                      setEditTitle(session.title);
                                      setEditMinutes(session.plannedMinutes);
                                    }}
                                    className="text-xs text-[#64748B] hover:text-[#0F172A] px-2 py-1 rounded hover:bg-[#F1F5F9] cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    aria-label="Delete session"
                                    onClick={() => deleteStudySession(session.id)}
                                    className="p-1 text-[#94A3B8] hover:text-[#DC2626] rounded hover:bg-[#FEF2F2] cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right: Add Study Block Form + Pinned Resources */}
        <div className="lg:col-span-4 space-y-6">
          <SectionCard className="p-5">
            <h2 className="text-base font-semibold text-[#0F172A] pb-3 border-b border-[#E2E8F0]">
              Add Study Session
            </h2>
            <form onSubmit={handleAdd} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#334155] mb-1">
                  Session title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., DataMites Live Session or NumPy Drills"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#334155] mb-1">Day</label>
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value as DayOfWeek)}
                    className="w-full px-2.5 py-2 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A]"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#334155] mb-1">
                    Minutes
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={480}
                    step={15}
                    value={plannedMinutes}
                    onChange={(e) => setPlannedMinutes(Number(e.target.value))}
                    className="w-full px-2.5 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#334155] mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SessionCategory)}
                  className="w-full px-2.5 py-2 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A]"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#334155] mb-1">
                  Linked topic or lecture (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Module 2 · Python Control Flow"
                  value={linkedRef}
                  onChange={(e) => setLinkedRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A]"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add to Week {selectedWeek}</span>
              </button>
            </form>
          </SectionCard>

          <SectionCard className="p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h2 className="text-base font-semibold text-[#0F172A]">
                Pinned Supplements (Week {selectedWeek})
              </h2>
              <Pin className="w-4 h-4 text-[#64748B]" />
            </div>
            {pinnedResources.length === 0 ? (
              <p className="py-5 text-xs text-[#64748B]">
                Pin supplementary lessons from the Weekly Study Room or Resource Library to keep
                them handy in this week&apos;s plan.
              </p>
            ) : (
              <div className="divide-y divide-[#F1F5F9] mt-1">
                {pinnedResources.map((r) => {
                  const watched = Boolean(state.resourceStates[r.id]?.watched);
                  return (
                    <div key={r.id} className="py-2.5 space-y-1">
                      <div className="flex items-center gap-2">
                        {watched && <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0" />}
                        <p className="text-xs font-medium text-[#0F172A]">{r.title}</p>
                        <LanguageTag language={r.language} />
                      </div>
                      <p className="text-[11px] text-[#64748B]">
                        {r.courseName} · {r.locator}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
