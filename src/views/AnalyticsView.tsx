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

const STATUS_COLORS: Record<string, string> = {
  Complete: '#059669',
  Demonstrated: '#10B981',
  Practised: '#3B82F6',
  'In progress': '#60A5FA',
  'Needs revision': '#F59E0B',
  'Not started': '#CBD5E1',
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
        <h1 className="text-2xl font-semibold text-[#0F172A] tracking-tight">Progress Analytics</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Genuine learning metrics. Official 20-week DataMites mastery is tracked independently from
          supplementary video watching and optional Bonus Courses.
        </p>
      </div>

      {/* Strict Separation Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SectionCard className="p-5 space-y-2">
          <p className="text-xs font-medium text-[#64748B]">Official Core Curriculum</p>
          <p className="text-2xl font-semibold text-[#0F172A] tabular-nums">
            {allSubtopics.length > 0 ? Math.round((officialMastered / allSubtopics.length) * 100) : 0}%
          </p>
          <ProgressBar value={officialMastered} max={allSubtopics.length} colorClass="bg-[#2563EB]" />
          <p className="text-[11px] text-[#64748B] tabular-nums">
            {officialMastered} / {allSubtopics.length} core subtopics Demonstrated or Complete
          </p>
        </SectionCard>

        <SectionCard className="p-5 space-y-2">
          <p className="text-xs font-medium text-[#64748B]">Supplementary Videos Watched</p>
          <p className="text-2xl font-semibold text-[#0F172A] tabular-nums">
            {watchedResourcesCount}
          </p>
          <ProgressBar
            value={watchedResourcesCount}
            max={ALL_RESOURCES.length}
            colorClass="bg-[#0EA5E9]"
          />
          <p className="text-[11px] text-[#64748B]">
            Tracked separately · never inflates official mastery
          </p>
        </SectionCard>

        <SectionCard className="p-5 space-y-2">
          <p className="text-xs font-medium text-[#64748B]">Practical Exercises &amp; Recall</p>
          <p className="text-2xl font-semibold text-[#0F172A] tabular-nums">
            {exercisesDone} / {PRACTICAL_EXERCISES.length}
          </p>
          <ProgressBar
            value={exercisesDone}
            max={PRACTICAL_EXERCISES.length}
            colorClass="bg-[#059669]"
          />
          <p className="text-[11px] text-[#64748B] tabular-nums">
            Flashcards known: {flashcardsKnown} / {FLASHCARDS.length}
          </p>
        </SectionCard>

        <SectionCard className="p-5 space-y-2">
          <p className="text-xs font-medium text-[#64748B]">Bonus Courses (Optional)</p>
          <p className="text-2xl font-semibold text-[#0F172A] tabular-nums">
            {bonusDone} / {bonusModules.length}
          </p>
          <ProgressBar value={bonusDone} max={bonusModules.length} colorClass="bg-[#64748B]" />
          <p className="text-[11px] text-[#64748B]">
            Isolated from core 20-week DataMites progress
          </p>
        </SectionCard>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <SectionCard className="lg:col-span-7 p-5 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A]">
              Official Curriculum Completion by Course Block
            </h2>
            <p className="text-xs text-[#64748B]">
              Percentage of subtopics marked Demonstrated or Complete across Weeks 1–20
            </p>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseProgressData} margin={{ top: 8, right: 8, left: -18, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} unit="%" />
                <Tooltip
                  formatter={(value, _name, item) => [
                    `${value ?? 0}% (${item?.payload?.done ?? 0}/${item?.payload?.total ?? 0})`,
                    String(item?.payload?.courseTitle ?? 'Course'),
                  ]}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="pct" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard className="lg:col-span-5 p-5 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A]">
              Official Topic Mastery Breakdown
            </h2>
            <p className="text-xs text-[#64748B]">
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
                  paddingAngle={2}
                >
                  {masteryBreakdown
                    .filter((d) => d.value > 0)
                    .map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#94A3B8'} />
                    ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {masteryBreakdown.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[item.name] }}
                  />
                  <span className="text-[#475569] truncate">{item.name}</span>
                </div>
                <span className="font-semibold text-[#0F172A] tabular-nums">{item.value}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Bottom Row: Quiz Trend + Official Projects & Competencies */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <SectionCard className="lg:col-span-6 p-5 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A]">Recent Quiz Scores</h2>
            <p className="text-xs text-[#64748B]">
              Offline assessment percentages from Revision &amp; Assessments
            </p>
          </div>
          {quizChartData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-xs text-[#64748B]">
              Take a weekly quiz in Revision &amp; Assessments to chart your recall accuracy.
            </div>
          ) : (
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quizChartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} unit="%" />
                  <Tooltip
                    formatter={(v) => [`${v ?? 0}%`, 'Quiz Score']}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="pct" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        <SectionCard className="lg:col-span-6 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#0F172A]">
                Projects &amp; Competency Coverage
              </h2>
              <p className="text-xs text-[#64748B]">
                Official milestone: {officialProjectsDone} /{' '}
                {DATAMITES_PROGRAM_FACTS.minimumOfficialProjects} completed ·{' '}
                {demonstratedAreas.size} / 8 competency areas verified
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {OFFICIAL_COMPETENCY_AREAS.map((area) => {
              const verified = demonstratedAreas.has(area.title);
              return (
                <div
                  key={area.id}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-[#F1F5F9] last:border-none"
                >
                  <span className="text-[#334155]">
                    {area.number}. {area.title}
                  </span>
                  <span
                    className={`font-medium ${
                      verified ? 'text-[#047857]' : 'text-[#94A3B8]'
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
