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

function CategoryBadge({ category }: { category: SessionCategory }) {
  const opt = CATEGORY_OPTIONS.find((c) => c.value === category);
  const label = opt?.short ?? category;

  switch (category) {
    case 'live_class':
    case 'supplementary':
      // Research blue pastel
      return (
        <span className="px-1.5 py-0.5 border border-[var(--color-line)] bg-[var(--color-research)] text-[var(--color-ink)] font-mono text-[11px] font-medium whitespace-nowrap shrink-0">
          {label}
        </span>
      );
    case 'self_study':
    case 'revision':
      // Writing sage pastel
      return (
        <span className="px-1.5 py-0.5 border border-[var(--color-line)] bg-[var(--color-writing)] text-[var(--color-ink)] font-mono text-[11px] font-medium whitespace-nowrap shrink-0">
          {label}
        </span>
      );
    case 'practice':
      // Projects peach pastel
      return (
        <span className="px-1.5 py-0.5 border border-[var(--color-line)] bg-[var(--color-project)] text-[var(--color-ink)] font-mono text-[11px] font-medium whitespace-nowrap shrink-0">
          {label}
        </span>
      );
    default:
      return (
        <span className="px-1.5 py-0.5 border border-[var(--color-line-soft)] bg-[var(--color-sunken)] text-[var(--color-secondary)] font-mono text-[11px] whitespace-nowrap shrink-0">
          {label}
        </span>
      );
  }
}

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
          <h1 className="text-2xl sm:text-3xl font-display font-medium text-[var(--color-ink)] tracking-tight">
            My Learning Plan
          </h1>
          <p className="text-sm text-[var(--color-secondary)] mt-0.5">
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
            className="min-h-[44px] px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-mono text-[var(--color-ink)] cursor-pointer focus:outline-none focus:border-[var(--color-ink)]"
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
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 border border-[var(--color-ink)] bg-[var(--color-signal)] text-[var(--color-ink)] text-xs font-mono font-bold hover:brightness-95 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate 20h Template</span>
          </button>
        </div>
      </div>

      {/* Allocation Tracker */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SectionCard className="p-4 border border-[var(--color-line)] bg-[var(--color-surface)]">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--color-secondary)] uppercase tracking-wider">Live Training</span>
            <span className="tabular-nums font-semibold text-[var(--color-ink)]">
              {(totals.liveMin / 60).toFixed(1)}h / {state.profile.weeklyLiveHours}h
            </span>
          </div>
          <div className="mt-2.5">
            <ProgressBar
              value={totals.liveMin}
              max={state.profile.weeklyLiveHours * 60}
              colorClass="bg-[var(--color-ink)]"
            />
          </div>
        </SectionCard>

        <SectionCard className="p-4 border border-[var(--color-line)] bg-[var(--color-surface)]">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--color-secondary)] uppercase tracking-wider">Self-Study &amp; Revision</span>
            <span className="tabular-nums font-semibold text-[var(--color-ink)]">
              {(totals.selfMin / 60).toFixed(1)}h / {state.profile.weeklySelfStudyHours}h
            </span>
          </div>
          <div className="mt-2.5">
            <ProgressBar
              value={totals.selfMin}
              max={state.profile.weeklySelfStudyHours * 60}
              colorClass="bg-[var(--color-ink)]"
            />
          </div>
        </SectionCard>

        <SectionCard className="p-4 border border-[var(--color-line)] bg-[var(--color-surface)]">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--color-secondary)] uppercase tracking-wider">Hands-on Practice</span>
            <span className="tabular-nums font-semibold text-[var(--color-ink)]">
              {(totals.practiceMin / 60).toFixed(1)}h / {state.profile.weeklyPracticeHours}h
            </span>
          </div>
          <div className="mt-2.5">
            <ProgressBar
              value={totals.practiceMin}
              max={state.profile.weeklyPracticeHours * 60}
              colorClass="bg-[var(--color-ink)]"
            />
          </div>
        </SectionCard>

        <SectionCard className="p-4 border border-[var(--color-line)] bg-[var(--color-surface)]">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--color-secondary)] uppercase tracking-wider">Completed This Week</span>
            <span className="tabular-nums font-semibold text-[var(--color-ink)]">
              {(totals.completedMin / 60).toFixed(1)}h /{' '}
              {Math.max(targetTotalHours, Number((totals.totalMin / 60).toFixed(1)))}h
            </span>
          </div>
          <div className="mt-2.5">
            <ProgressBar
              value={totals.completedMin}
              max={Math.max(totals.totalMin, targetTotalHours * 60)}
              colorClass="bg-[var(--color-ink)]"
            />
          </div>
        </SectionCard>
      </div>

      {/* Main Content: Mon-Sun Schedule + Add Form / Pinned */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Mon-Sun Schedule */}
        <div className="lg:col-span-8 space-y-4">
          <SectionCard className="p-4 sm:p-5 border border-[var(--color-line)] bg-[var(--color-surface)]">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[var(--color-line)]">
              <div>
                <h2 className="text-base font-display font-semibold text-[var(--color-ink)]">
                  Week {selectedWeek} Schedule · {course.title}
                </h2>
                <p className="text-xs font-mono text-[var(--color-secondary)] mt-0.5">
                  {course.courseCode} · Brochure p. {course.brochurePage}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openStudyRoomForWeek(selectedWeek)}
                className="min-h-[44px] text-xs font-mono font-medium text-[var(--color-ink)] underline hover:no-underline whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center"
              >
                Open Week {selectedWeek} Study Room →
              </button>
            </div>

            {weekSessions.length === 0 ? (
              <div className="py-10 text-center bg-[var(--color-sunken)]/30 border border-dashed border-[var(--color-line-soft)] mt-4 p-4">
                <CalendarDays className="w-8 h-8 text-[var(--color-secondary)] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  No study blocks planned for Week {selectedWeek} yet
                </p>
                <p className="text-xs text-[var(--color-secondary)] mt-1 max-w-md mx-auto">
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
                    <div key={d} className="border border-[var(--color-line)] bg-[var(--color-surface)] overflow-hidden">
                      <div className="px-4 py-2 bg-[var(--color-sunken)] border-b border-[var(--color-line)] flex items-center justify-between">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-ink)]">
                          {d}
                        </span>
                        <span className="text-xs font-mono text-[var(--color-secondary)] tabular-nums">
                          {dayMins} min ({(dayMins / 60).toFixed(1)}h)
                        </span>
                      </div>
                      <div className="divide-y divide-[var(--color-line-soft)]">
                        {daySessions.map((session) => (
                          <div
                            key={session.id}
                            className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--color-surface)]"
                          >
                            {editingId === session.id ? (
                              <div className="flex flex-1 flex-wrap items-center gap-2">
                                <input
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="min-h-[44px] flex-1 min-w-[160px] px-3 py-1.5 border border-[var(--color-line)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)] font-body focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]"
                                />
                                <input
                                  type="number"
                                  min={15}
                                  max={480}
                                  value={editMinutes}
                                  onChange={(e) => setEditMinutes(Number(e.target.value))}
                                  className="min-h-[44px] w-20 px-2.5 py-1.5 border border-[var(--color-line)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)] font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]"
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
                                  className="min-h-[44px] px-3.5 py-1.5 border border-[var(--color-ink)] bg-[var(--color-signal)] text-[var(--color-ink)] font-mono text-xs font-bold hover:brightness-95 cursor-pointer inline-flex items-center justify-center"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="min-h-[44px] px-3 py-1.5 border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sunken)] text-[var(--color-secondary)] hover:text-[var(--color-ink)] font-mono text-xs cursor-pointer inline-flex items-center justify-center transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <>
                                <label className="min-h-[44px] flex items-start gap-3 cursor-pointer min-w-0 flex-1 select-none">
                                  <input
                                    type="checkbox"
                                    checked={session.completed}
                                    onChange={(e) =>
                                      updateStudySession(session.id, {
                                        completed: e.target.checked,
                                      })
                                    }
                                    className="mt-1 h-4 w-4 rounded-none border border-[var(--color-line)] accent-[var(--color-ink)] shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <p
                                      className={`text-sm font-medium break-words leading-snug ${
                                        session.completed
                                          ? 'line-through text-[var(--color-secondary)] opacity-60'
                                          : 'text-[var(--color-ink)]'
                                      }`}
                                    >
                                      {session.title}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs">
                                      <CategoryBadge category={session.category} />
                                      {session.linkedRef && (
                                        <span className="font-mono text-[11px] text-[var(--color-secondary)] break-words">
                                          · {session.linkedRef}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </label>
                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                  <span className="inline-flex items-center gap-1 font-mono text-xs text-[var(--color-secondary)] tabular-nums">
                                    <Clock className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                                    {session.plannedMinutes}m
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingId(session.id);
                                      setEditTitle(session.title);
                                      setEditMinutes(session.plannedMinutes);
                                    }}
                                    className="min-h-[44px] min-w-[44px] px-2.5 py-1.5 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-mono font-medium text-[var(--color-ink)] hover:bg-[var(--color-sunken)] cursor-pointer inline-flex items-center justify-center transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    aria-label={`Delete session ${session.title}`}
                                    onClick={() => deleteStudySession(session.id)}
                                    className="min-h-[44px] min-w-[44px] p-2 border border-[var(--color-line-soft)] text-[var(--color-secondary)] hover:text-[var(--color-ink)] hover:border-[var(--color-ink)] hover:bg-[var(--color-sunken)] cursor-pointer inline-flex items-center justify-center transition-colors"
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
          <SectionCard className="p-4 sm:p-5 border border-[var(--color-line)] bg-[var(--color-surface)]">
            <h2 className="text-base font-display font-semibold text-[var(--color-ink)] pb-3 border-b border-[var(--color-line)]">
              Add Study Session
            </h2>
            <form onSubmit={handleAdd} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1">
                  Session title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., DataMites Live Session or NumPy Drills"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="min-h-[44px] w-full px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)] font-body focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1">Day</label>
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value as DayOfWeek)}
                    className="min-h-[44px] w-full px-2.5 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-mono text-[var(--color-ink)] cursor-pointer focus:outline-none focus:border-[var(--color-ink)]"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1">
                    Minutes
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={480}
                    step={15}
                    value={plannedMinutes}
                    onChange={(e) => setPlannedMinutes(Number(e.target.value))}
                    className="min-h-[44px] w-full px-2.5 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-mono text-[var(--color-ink)] tabular-nums focus:outline-none focus:border-[var(--color-ink)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SessionCategory)}
                  className="min-h-[44px] w-full px-2.5 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-mono text-[var(--color-ink)] cursor-pointer focus:outline-none focus:border-[var(--color-ink)]"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1">
                  Linked topic or lecture (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Module 2 · Python Control Flow"
                  value={linkedRef}
                  onChange={(e) => setLinkedRef(e.target.value)}
                  className="min-h-[44px] w-full px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)] font-body focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]"
                />
              </div>

              <button
                type="submit"
                className="min-h-[44px] w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[var(--color-signal)] border border-[var(--color-ink)] text-xs font-mono font-bold text-[var(--color-ink)] hover:brightness-95 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add to Week {selectedWeek}</span>
              </button>
            </form>
          </SectionCard>

          <SectionCard className="p-4 sm:p-5 border border-[var(--color-line)] bg-[var(--color-surface)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-line)]">
              <h2 className="text-base font-display font-semibold text-[var(--color-ink)]">
                Pinned Supplements (Week {selectedWeek})
              </h2>
              <Pin className="w-4 h-4 text-[var(--color-ink)]" />
            </div>
            {pinnedResources.length === 0 ? (
              <p className="py-5 text-xs text-[var(--color-secondary)] font-mono">
                Pin supplementary lessons from the Weekly Study Room or Resource Library to keep
                them handy in this week&apos;s plan.
              </p>
            ) : (
              <div className="divide-y divide-[var(--color-line-soft)] mt-1">
                {pinnedResources.map((r) => {
                  const watched = Boolean(state.resourceStates[r.id]?.watched);
                  return (
                    <div key={r.id} className="py-2.5 space-y-1">
                      <div className="flex items-center gap-2">
                        {watched && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-ink)] shrink-0" />}
                        <p className="text-xs font-medium text-[var(--color-ink)] break-words">{r.title}</p>
                        <LanguageTag language={r.language} />
                      </div>
                      <p className="text-[11px] font-mono text-[var(--color-secondary)]">
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
