import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAppState } from '../context/AppStateContext';
import {
  BONUS_COURSES,
  DATAMITES_PROGRAM_FACTS,
  getAllSubtopics,
  OFFICIAL_COMPETENCY_AREAS,
  OFFICIAL_CURRICULUM,
} from '../data/curriculum';
import { ALL_RESOURCES } from '../data/resources';
import { FLASHCARDS, PRACTICAL_EXERCISES } from '../data/assessments';
import { ProgressBar, SectionCard } from '../components/StatusPrimitives';

// Paper & Signal palette for status breakdown
const STATUS_COLORS: Record<string, string> = {
  Complete: '#17191a',       // ink
  Demonstrated: '#4a4f4c',   // secondary
  Practised: '#827d71',      // line
  'In progress': '#d3f03c',  // signal lime
  'Needs revision': '#ddd8cb', // line-soft
  'Not started': '#efebdf',  // sunken
};

export function AnalyticsView() {
  const { state } = useAppState();
  const allSubtopics = useMemo(() => getAllSubtopics(), []);

  // 1. Official Curriculum Core Mastery Breakdown
  const masteryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {
      Complete: 0,
      Demonstrated: 0,
      Practised: 0,
      'In progress': 0,
      'Needs revision': 0,
      'Not started': 0,
    };
    allSubtopics.forEach((s) => {
      const st = state.topicProgress[s.id]?.status ?? 'not_started';
      if (st === 'complete') counts.Complete += 1;
      else if (st === 'demonstrated') counts.Demonstrated += 1;
      else if (st === 'practised') counts.Practised += 1;
      else if (st === 'in_progress') counts['In progress'] += 1;
      else if (st === 'needs_revision') counts['Needs revision'] += 1;
      else counts['Not started'] += 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [allSubtopics, state.topicProgress]);

  const officialMastered = useMemo(
    () =>
      allSubtopics.filter((s) => {
        const st = state.topicProgress[s.id]?.status;
        return st === 'demonstrated' || st === 'complete';
      }).length,
    [allSubtopics, state.topicProgress]
  );

  // 2. Per-course completion bar chart (Core 20 weeks strictly)
  const courseProgressData = useMemo(
    () =>
      OFFICIAL_CURRICULUM.map((course) => {
        const subs = course.modules.flatMap((m) => m.subtopics);
        const done = subs.filter((s) => {
          const st = state.topicProgress[s.id]?.status;
          return st === 'demonstrated' || st === 'complete';
        }).length;
        const pct = subs.length > 0 ? Math.round((done / subs.length) * 100) : 0;
        return {
          label: `W${course.weeks[0]}${course.weeks.length > 1 ? `-${course.weeks[course.weeks.length - 1]}` : ''}`,
          courseTitle: course.title,
          pct,
          done,
          total: subs.length,
        };
      }),
    [state.topicProgress]
  );

  // 3. Separate metrics (Strictly isolated from Official Core)
  const watchedResourcesCount = useMemo(
    () => ALL_RESOURCES.filter((r) => state.resourceStates[r.id]?.watched).length,
    [state.resourceStates]
  );
  const bonusModules = useMemo(() => BONUS_COURSES.flatMap((c) => c.modules), []);
  const bonusDone = useMemo(
    () => bonusModules.filter((m) => state.bonusProgress[m.id]?.status === 'complete').length,
    [bonusModules, state.bonusProgress]
  );
  const exercisesDone = useMemo(
    () =>
      PRACTICAL_EXERCISES.filter((e) => state.practiceLogs[e.id]?.status === 'completed').length,
    [state.practiceLogs]
  );
  const flashcardsKnown = useMemo(
    () =>
      FLASHCARDS.filter((f) => state.flashcardStates[f.id]?.status === 'known').length,
    [state.flashcardStates]
  );
  const officialProjectsDone = useMemo(
    () =>
      state.projects.filter(
        (p) => p.category === 'official_datamites' && p.status === 'completed'
      ).length,
    [state.projects]
  );

  const quizChartData = useMemo(
    () =>
      [...state.quizAttempts]
        .reverse()
        .slice(-10)
        .map((q, idx) => ({
          name: `W${q.week} (#${idx + 1})`,
          pct: Math.round((q.score / Math.max(1, q.total)) * 100),
        })),
    [state.quizAttempts]
  );

  const demonstratedAreas = useMemo(
    () =>
      new Set(
        state.projects
          .filter((p) => p.status === 'completed' && p.competencyArea)
          .map((p) => p.competencyArea)
      ),
    [state.projects]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-medium text-[var(--color-ink)] tracking-tight">
          Progress Analytics
        </h1>
        <p className="text-sm text-[var(--color-secondary)] mt-1 max-w-3xl">
          Genuine learning metrics. Official 20-week DataMites mastery is tracked independently from
          supplementary video watching and optional Bonus Courses.
        </p>
      </div>

      {/* Strict Separation Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SectionCard className="p-4 sm:p-5 border border-[var(--color-line)] border-t-2 border-t-[var(--color-ink)] bg-[var(--color-surface)] space-y-2">
          <p className="text-xs font-mono uppercase tracking-wider text-[var(--color-secondary)]">Official Core Curriculum</p>
          <p className="text-2xl sm:text-3xl font-display font-bold text-[var(--color-ink)] tabular-nums">
            {allSubtopics.length > 0 ? Math.round((officialMastered / allSubtopics.length) * 100) : 0}%
          </p>
          <ProgressBar value={officialMastered} max={allSubtopics.length} colorClass="bg-[var(--color-ink)]" />
          <p className="text-[11px] font-mono text-[var(--color-secondary)] tabular-nums">
            {officialMastered} / {allSubtopics.length} core subtopics Demonstrated or Complete
          </p>
        </SectionCard>

        <SectionCard className="p-4 sm:p-5 border border-[var(--color-line)] border-t-2 border-t-[var(--color-ink)] bg-[var(--color-surface)] space-y-2">
          <p className="text-xs font-mono uppercase tracking-wider text-[var(--color-secondary)]">Supplementary Videos Watched</p>
          <p className="text-2xl sm:text-3xl font-display font-bold text-[var(--color-ink)] tabular-nums">
            {watchedResourcesCount}
          </p>
          <ProgressBar
            value={watchedResourcesCount}
            max={ALL_RESOURCES.length}
            colorClass="bg-[var(--color-ink)]"
          />
          <p className="text-[11px] font-mono text-[var(--color-secondary)]">
            Tracked separately · never inflates official mastery
          </p>
        </SectionCard>

        <SectionCard className="p-4 sm:p-5 border border-[var(--color-line)] border-t-2 border-t-[var(--color-ink)] bg-[var(--color-surface)] space-y-2">
          <p className="text-xs font-mono uppercase tracking-wider text-[var(--color-secondary)]">Practical Exercises &amp; Recall</p>
          <p className="text-2xl sm:text-3xl font-display font-bold text-[var(--color-ink)] tabular-nums">
            {exercisesDone} / {PRACTICAL_EXERCISES.length}
          </p>
          <ProgressBar
            value={exercisesDone}
            max={PRACTICAL_EXERCISES.length}
            colorClass="bg-[var(--color-ink)]"
          />
          <p className="text-[11px] font-mono text-[var(--color-secondary)] tabular-nums">
            Flashcards known: {flashcardsKnown} / {FLASHCARDS.length}
          </p>
        </SectionCard>

        <SectionCard className="p-4 sm:p-5 border border-[var(--color-line)] border-t-2 border-t-[var(--color-ink)] bg-[var(--color-surface)] space-y-2">
          <p className="text-xs font-mono uppercase tracking-wider text-[var(--color-secondary)]">Bonus Courses (Optional)</p>
          <p className="text-2xl sm:text-3xl font-display font-bold text-[var(--color-ink)] tabular-nums">
            {bonusDone} / {bonusModules.length}
          </p>
          <ProgressBar value={bonusDone} max={bonusModules.length} colorClass="bg-[var(--color-ink)]" />
          <p className="text-[11px] font-mono text-[var(--color-secondary)]">
            Isolated from core 20-week DataMites progress
          </p>
        </SectionCard>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <SectionCard className="lg:col-span-7 p-4 sm:p-5 space-y-4 border border-[var(--color-line)] bg-[var(--color-surface)]">
          <div>
            <h2 className="text-base font-display font-semibold text-[var(--color-ink)]">
              Official Curriculum Completion by Course Block
            </h2>
            <p className="text-xs text-[var(--color-secondary)] font-mono">
              Percentage of subtopics marked Demonstrated or Complete across Weeks 1–20
            </p>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseProgressData} margin={{ top: 8, right: 8, left: -20, bottom: 24 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#ddd8cb" vertical={false} />
                <XAxis
                  dataKey="label"
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={36}
                  tick={{ fontSize: 10, fill: '#4a4f4c', fontFamily: 'Cascadia Code, monospace' }}
                />
                <YAxis
                  domain={[0, 100]}
                  unit="%"
                  tick={{ fontSize: 10, fill: '#4a4f4c', fontFamily: 'Cascadia Code, monospace' }}
                />
                <Tooltip
                  formatter={(value, _name, item) => [
                    `${value ?? 0}% (${item?.payload?.done ?? 0}/${item?.payload?.total ?? 0})`,
                    String(item?.payload?.courseTitle ?? 'Course'),
                  ]}
                  contentStyle={{
                    backgroundColor: '#fdfcf8',
                    borderColor: '#827d71',
                    borderRadius: 0,
                    fontSize: 11,
                    fontFamily: 'Cascadia Code, monospace',
                    color: '#17191a',
                  }}
                />
                <Bar dataKey="pct" fill="#17191a" radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard className="lg:col-span-5 p-4 sm:p-5 space-y-4 border border-[var(--color-line)] bg-[var(--color-surface)]">
          <div>
            <h2 className="text-base font-display font-semibold text-[var(--color-ink)]">
              Official Topic Mastery Breakdown
            </h2>
            <p className="text-xs text-[var(--color-secondary)] font-mono">
              Distribution across all {allSubtopics.length} core syllabus subtopics
            </p>
          </div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={masteryBreakdown.filter((d) => d.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={84}
                  paddingAngle={1}
                >
                  {masteryBreakdown
                    .filter((d) => d.value > 0)
                    .map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[entry.name] ?? '#efebdf'}
                        stroke="#827d71"
                        strokeWidth={0.5}
                      />
                    ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fdfcf8',
                    borderColor: '#827d71',
                    borderRadius: 0,
                    fontSize: 11,
                    fontFamily: 'Cascadia Code, monospace',
                    color: '#17191a',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {masteryBreakdown.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-2 p-1 border border-[var(--color-line-soft)] bg-[var(--color-surface)]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 shrink-0 border border-[var(--color-line)]"
                    style={{ backgroundColor: STATUS_COLORS[item.name] }}
                  />
                  <span className="text-[var(--color-secondary)] truncate">{item.name}</span>
                </div>
                <span className="font-semibold text-[var(--color-ink)] tabular-nums">{item.value}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Bottom Row: Quiz Trend + Official Projects & Competencies */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <SectionCard className="lg:col-span-6 p-4 sm:p-5 space-y-4 border border-[var(--color-line)] bg-[var(--color-surface)]">
          <div>
            <h2 className="text-base font-display font-semibold text-[var(--color-ink)]">Recent Quiz Scores</h2>
            <p className="text-xs text-[var(--color-secondary)] font-mono">
              Offline assessment percentages from Revision &amp; Assessments
            </p>
          </div>
          {quizChartData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-xs font-mono text-[var(--color-secondary)] border border-dashed border-[var(--color-line-soft)] bg-[var(--color-sunken)]/30">
              Take a weekly quiz in Revision &amp; Assessments to chart your recall accuracy.
            </div>
          ) : (
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quizChartData} margin={{ top: 8, right: 8, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#ddd8cb" vertical={false} />
                  <XAxis
                    dataKey="name"
                    angle={-25}
                    textAnchor="end"
                    height={32}
                    tick={{ fontSize: 10, fill: '#4a4f4c', fontFamily: 'Cascadia Code, monospace' }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    unit="%"
                    tick={{ fontSize: 10, fill: '#4a4f4c', fontFamily: 'Cascadia Code, monospace' }}
                  />
                  <Tooltip
                    formatter={(v) => [`${v ?? 0}%`, 'Quiz Score']}
                    contentStyle={{
                      backgroundColor: '#fdfcf8',
                      borderColor: '#827d71',
                      borderRadius: 0,
                      fontSize: 11,
                      fontFamily: 'Cascadia Code, monospace',
                      color: '#17191a',
                    }}
                  />
                  <Bar dataKey="pct" fill="#d3f03c" stroke="#17191a" strokeWidth={1} radius={[0, 0, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        <SectionCard className="lg:col-span-6 p-4 sm:p-5 space-y-4 border border-[var(--color-line)] bg-[var(--color-surface)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-display font-semibold text-[var(--color-ink)]">
                Projects &amp; Competency Coverage
              </h2>
              <p className="text-xs text-[var(--color-secondary)] font-mono">
                Official milestone: {officialProjectsDone} /{' '}
                {DATAMITES_PROGRAM_FACTS.minimumOfficialProjects} completed ·{' '}
                {demonstratedAreas.size} / 8 competency areas verified
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
            {OFFICIAL_COMPETENCY_AREAS.map((area) => {
              const verified = demonstratedAreas.has(area.title);
              return (
                <div
                  key={area.id}
                  className="flex items-center justify-between text-xs py-2 px-2 border-b border-[var(--color-line-soft)] last:border-none"
                >
                  <span className="text-[var(--color-ink)] font-body break-words pr-2">
                    <span className="font-mono text-[var(--color-secondary)]">{area.number}.</span> {area.title}
                  </span>
                  <span
                    className={`font-mono text-[11px] px-2 py-0.5 border whitespace-nowrap shrink-0 ${
                      verified
                        ? 'border-[var(--color-ink)] bg-[var(--color-sunken)] text-[var(--color-ink)] font-bold'
                        : 'border-[var(--color-line-soft)] bg-[var(--color-surface)] text-[var(--color-secondary)]'
                    }`}
                  >
                    {verified ? 'Demonstrated' : 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
