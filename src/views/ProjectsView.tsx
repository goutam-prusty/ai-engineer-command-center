import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FolderGit2,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import {
  DATAMITES_PROGRAM_FACTS,
  OFFICIAL_COMPETENCY_AREAS,
} from '../data/curriculum';
import { PROJECT_TEMPLATES, ProjectTemplateDef } from '../data/assessments';
import { ProjectRecord } from '../types';
import { ProgressBar, ProvenanceInline, SectionCard } from '../components/StatusPrimitives';

type ProjectTab = 'official_datamites' | 'internship' | 'supplementary_personal';

interface ProjectFormState {
  id?: string;
  category: ProjectRecord['category'];
  title: string;
  competencyArea: string;
  problemStatement: string;
  skillsCsv: string;
  datasetSource: string;
  milestonesText: string;
  deliverables: string;
  githubUrl: string;
  completionCriteria: string;
  status: ProjectRecord['status'];
  provenance: ProjectRecord['provenance'];
}

function emptyForm(category: ProjectTab): ProjectFormState {
  return {
    category,
    title: '',
    competencyArea: OFFICIAL_COMPETENCY_AREAS[0].title,
    problemStatement: '',
    skillsCsv: '',
    datasetSource: '',
    milestonesText: '[ ] Scope & dataset validation\n[ ] Baseline implementation\n[ ] Evaluation & documentation',
    deliverables: '',
    githubUrl: '',
    completionCriteria: '',
    status: 'planned',
    provenance:
      category === 'supplementary_personal'
        ? 'SUPPLEMENTARY_PRACTICE_PROPOSED'
        : 'DATAMITES_OFFICIAL',
  };
}

export function ProjectsView() {
  const { state, saveProject, deleteProject, updateProfile } = useAppState();
  const [activeTab, setActiveTab] = useState<ProjectTab>('official_datamites');
  const [modalForm, setModalForm] = useState<ProjectFormState | null>(null);

  const officialProjects = useMemo(
    () => state.projects.filter((p) => p.category === 'official_datamites'),
    [state.projects]
  );
  const internshipProjects = useMemo(
    () => state.projects.filter((p) => p.category === 'internship'),
    [state.projects]
  );
  const personalProjects = useMemo(
    () => state.projects.filter((p) => p.category === 'supplementary_personal'),
    [state.projects]
  );

  const officialCompleted = officialProjects.filter((p) => p.status === 'completed').length;

  const demonstratedAreas = useMemo(() => {
    const s = new Set<string>();
    state.projects
      .filter((p) => p.status === 'completed' && p.competencyArea)
      .forEach((p) => s.add(p.competencyArea));
    return s;
  }, [state.projects]);

  const openEditModal = (proj: ProjectRecord) => {
    setModalForm({
      id: proj.id,
      category: proj.category,
      title: proj.title,
      competencyArea: proj.competencyArea,
      problemStatement: proj.problemStatement,
      skillsCsv: proj.skills.join(', '),
      datasetSource: proj.datasetSource,
      milestonesText: proj.milestones.join('\n'),
      deliverables: proj.deliverables,
      githubUrl: proj.githubUrl,
      completionCriteria: proj.completionCriteria,
      status: proj.status,
      provenance: proj.provenance,
    });
  };

  const handleUseTemplate = (tpl: ProjectTemplateDef) => {
    saveProject({
      category: 'supplementary_personal',
      title: tpl.title,
      competencyArea: tpl.competencyArea,
      problemStatement: tpl.problemStatement,
      skills: tpl.skills,
      datasetSource: tpl.datasetSource,
      milestones: tpl.milestones.map((m) => (m.startsWith('[') ? m : `[ ] ${m}`)),
      deliverables: tpl.deliverables,
      githubUrl: '',
      completionCriteria: tpl.completionCriteria,
      status: 'planned',
      provenance: 'SUPPLEMENTARY_PRACTICE_PROPOSED',
    });
  };

  const handleToggleMilestone = (proj: ProjectRecord, idx: number) => {
    const nextMilestones = proj.milestones.map((m, i) => {
      if (i !== idx) return m;
      if (m.startsWith('[x] ')) return `[ ] ${m.slice(4)}`;
      if (m.startsWith('[ ] ')) return `[x] ${m.slice(4)}`;
      return `[x] ${m}`;
    });
    saveProject(
      {
        category: proj.category,
        title: proj.title,
        competencyArea: proj.competencyArea,
        problemStatement: proj.problemStatement,
        skills: proj.skills,
        datasetSource: proj.datasetSource,
        milestones: nextMilestones,
        deliverables: proj.deliverables,
        githubUrl: proj.githubUrl,
        completionCriteria: proj.completionCriteria,
        status: proj.status,
        provenance: proj.provenance,
      },
      proj.id
    );
  };

  const handleSubmitModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm || !modalForm.title.trim()) return;
    const skills = modalForm.skillsCsv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const milestones = modalForm.milestonesText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => (l.startsWith('[x] ') || l.startsWith('[ ] ') ? l : `[ ] ${l}`));

    saveProject(
      {
        category: modalForm.category,
        title: modalForm.title.trim(),
        competencyArea: modalForm.competencyArea,
        problemStatement: modalForm.problemStatement.trim(),
        skills,
        datasetSource: modalForm.datasetSource.trim(),
        milestones,
        deliverables: modalForm.deliverables.trim(),
        githubUrl: modalForm.githubUrl.trim(),
        completionCriteria: modalForm.completionCriteria.trim(),
        status: modalForm.status,
        provenance: modalForm.provenance,
      },
      modalForm.id
    );
    setModalForm(null);
  };

  const renderProjectCard = (proj: ProjectRecord) => (
    <SectionCard key={proj.id} className="p-4 sm:p-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-secondary)]">
            <ProvenanceInline label={proj.provenance} />
            {proj.competencyArea && (
              <>
                <span className="text-[var(--color-line)]">·</span>
                <span className="font-mono font-medium text-[var(--color-ink)]">{proj.competencyArea}</span>
              </>
            )}
          </div>
          <h3 className="text-base font-display font-semibold text-[var(--color-ink)] break-words">
            {proj.title}
          </h3>
          {proj.problemStatement && (
            <p className="text-xs text-[var(--color-secondary)] leading-relaxed break-words">
              {proj.problemStatement}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <select
            aria-label={`Project status for ${proj.title}`}
            value={proj.status}
            onChange={(e) =>
              saveProject(
                {
                  category: proj.category,
                  title: proj.title,
                  competencyArea: proj.competencyArea,
                  problemStatement: proj.problemStatement,
                  skills: proj.skills,
                  datasetSource: proj.datasetSource,
                  milestones: proj.milestones,
                  deliverables: proj.deliverables,
                  githubUrl: proj.githubUrl,
                  completionCriteria: proj.completionCriteria,
                  status: e.target.value as ProjectRecord['status'],
                  provenance: proj.provenance,
                },
                proj.id
              )
            }
            className={`min-h-[44px] px-2.5 py-1.5 border text-xs font-mono font-medium cursor-pointer transition-colors ${
              proj.status === 'completed'
                ? 'text-[var(--color-ink)] bg-[var(--color-sunken)] border-[var(--color-ink)] font-semibold'
                : proj.status === 'in_progress'
                  ? 'text-[var(--color-ink)] bg-[var(--color-surface)] border border-dashed border-[var(--color-line)] font-medium'
                  : 'text-[var(--color-secondary)] bg-[var(--color-paper)] border-[var(--color-line-soft)]'
            }`}
          >
            <option value="planned">Planned</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </select>

          <button
            type="button"
            onClick={() => openEditModal(proj)}
            className="min-h-[44px] min-w-[44px] px-3 py-1.5 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-mono font-medium text-[var(--color-ink)] hover:bg-[var(--color-sunken)] cursor-pointer inline-flex items-center justify-center transition-colors"
          >
            Edit
          </button>
          <button
            type="button"
            aria-label={`Delete ${proj.title}`}
            onClick={() => deleteProject(proj.id)}
            className="min-h-[44px] min-w-[44px] px-2.5 py-1.5 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-mono font-medium text-[var(--color-secondary)] hover:text-[var(--color-ink)] hover:border-[var(--color-ink)] hover:bg-[var(--color-sunken)] cursor-pointer inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {proj.skills.length > 0 && (
        <p className="text-xs text-[var(--color-secondary)] break-words">
          <span className="font-mono font-semibold text-[var(--color-ink)]">Skills:</span> {proj.skills.join(', ')}
        </p>
      )}
      {proj.datasetSource && (
        <p className="text-xs text-[var(--color-secondary)] break-words">
          <span className="font-mono font-semibold text-[var(--color-ink)]">Dataset / Input:</span> {proj.datasetSource}
        </p>
      )}
      {proj.deliverables && (
        <p className="text-xs text-[var(--color-secondary)] break-words">
          <span className="font-mono font-semibold text-[var(--color-ink)]">Deliverables:</span> {proj.deliverables}
        </p>
      )}
      {proj.completionCriteria && (
        <p className="text-xs text-[var(--color-secondary)] break-words">
          <span className="font-mono font-semibold text-[var(--color-ink)]">Completion criteria:</span>{' '}
          {proj.completionCriteria}
        </p>
      )}

      {proj.milestones.length > 0 && (
        <div className="pt-2 border-t border-[var(--color-line-soft)] space-y-1.5">
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--color-secondary)]">
            Milestones
          </p>
          {proj.milestones.map((m, idx) => {
            const checked = m.startsWith('[x] ');
            const label = m.replace(/^\[[ x]\]\s*/, '');
            return (
              <label
                key={idx}
                className="min-h-[38px] sm:min-h-[32px] flex items-start gap-2.5 text-xs text-[var(--color-ink)] cursor-pointer py-1 select-none"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleToggleMilestone(proj, idx)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded-none border border-[var(--color-line)] accent-[var(--color-ink)]"
                />
                <span className={`break-words leading-snug ${checked ? 'line-through text-[var(--color-secondary)] opacity-60' : ''}`}>
                  {label}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {proj.githubUrl && (
        <div className="pt-2 border-t border-[var(--color-line-soft)]">
          <a
            href={proj.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-[var(--color-ink)] underline hover:opacity-80 break-all"
          >
            <span className="break-all">{proj.githubUrl}</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>
        </div>
      )}
    </SectionCard>
  );

  return (
    <div className="space-y-6">
      {/* Header + Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-medium text-[var(--color-ink)] tracking-tight">
            Projects &amp; Portfolio
          </h1>
          <p className="text-sm text-[var(--color-secondary)] mt-1 max-w-prose">
            Track official DataMites projects (minimum{' '}
            {DATAMITES_PROGRAM_FACTS.minimumOfficialProjects} required), 3-month internship
            deliverables, and supplementary portfolio builds.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalForm(emptyForm(activeTab))}
          className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[var(--color-signal)] hover:brightness-95 text-[var(--color-ink)] border border-[var(--color-ink)] text-xs font-mono font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Project</span>
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 border-b border-[var(--color-line-soft)] pb-2">
        {(
          [
            {
              id: 'official_datamites',
              label: `Official DataMites (${officialCompleted}/${DATAMITES_PROGRAM_FACTS.minimumOfficialProjects})`,
            },
            {
              id: 'internship',
              label: `Internship Deliverables (${internshipProjects.length})`,
            },
            {
              id: 'supplementary_personal',
              label: `Supplementary Personal (${personalProjects.length})`,
            },
          ] as { id: ProjectTab; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`min-h-[44px] px-3 sm:px-3.5 py-2 text-xs font-mono transition-colors text-center cursor-pointer border ${
              activeTab === t.id
                ? 'bg-[var(--color-ink)] text-[var(--color-paper)] border-[var(--color-ink)] font-semibold'
                : 'bg-[var(--color-surface)] border-[var(--color-line)] text-[var(--color-secondary)] hover:bg-[var(--color-sunken)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Official DataMites Projects */}
      {activeTab === 'official_datamites' && (
        <div className="space-y-6">
          <SectionCard className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <h2 className="text-base font-display font-medium text-[var(--color-ink)]">
                  Official Project Milestone ({officialCompleted} /{' '}
                  {DATAMITES_PROGRAM_FACTS.minimumOfficialProjects} Completed)
                </h2>
                <p className="text-xs text-[var(--color-secondary)] mt-0.5">
                  Brochure p. 28 requires a minimum of 5 real-world industry projects across the 8
                  competency areas below.
                </p>
              </div>
              <div className="w-full sm:w-48 shrink-0">
                <ProgressBar
                  value={officialCompleted}
                  max={DATAMITES_PROGRAM_FACTS.minimumOfficialProjects}
                  colorClass="bg-[var(--color-ink)]"
                />
              </div>
            </div>

            <div className="p-3 sm:p-3.5 border-l-4 border-[var(--color-line)] bg-[var(--color-sunken)] flex items-start gap-2.5 text-xs text-[var(--color-secondary)]">
              <AlertCircle className="w-4 h-4 text-[var(--color-secondary)] shrink-0 mt-0.5" />
              <p>
                <span className="font-mono font-bold text-[var(--color-ink)]">UNVERIFIED batch specifics:</span> Official batch
                project titles, datasets, and grading rubrics are not listed in the brochure. Add
                your cohort&apos;s assigned DataMites projects here as your mentors release them.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {OFFICIAL_COMPETENCY_AREAS.map((area) => {
                const done = demonstratedAreas.has(area.title);
                return (
                  <div
                    key={area.id}
                    className={`p-3 border text-xs transition-colors ${
                      done
                        ? 'bg-[var(--color-project)]/35 border-[var(--color-line)] text-[var(--color-ink)]'
                        : 'bg-[var(--color-surface)] border-[var(--color-line-soft)] text-[var(--color-secondary)]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 shrink-0 ${
                          done ? 'text-[var(--color-ink)]' : 'text-[var(--color-line-soft)]'
                        }`}
                      />
                      <span className="font-mono">
                        {area.number}. {area.title}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-snug opacity-90 break-words">{area.description}</p>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {officialProjects.length === 0 ? (
            <SectionCard className="p-8 text-center">
              <FolderGit2 className="w-8 h-8 text-[var(--color-secondary)] mx-auto mb-2" />
              <p className="text-sm font-display font-medium text-[var(--color-ink)]">
                No official DataMites projects logged yet
              </p>
              <p className="text-xs text-[var(--color-secondary)] mt-1">
                Click &ldquo;Add Project&rdquo; once your batch assigns its first official
                industry project.
              </p>
            </SectionCard>
          ) : (
            <div className="space-y-4">{officialProjects.map(renderProjectCard)}</div>
          )}
        </div>
      )}

      {/* TAB 2: Internship Deliverables */}
      {activeTab === 'internship' && (
        <div className="space-y-6">
          <SectionCard className="p-4 sm:p-5 space-y-4">
            <div>
              <h2 className="text-base font-display font-medium text-[var(--color-ink)]">
                3-Month Applied AI Internship Tracker
              </h2>
              <p className="text-xs text-[var(--color-secondary)] mt-0.5">
                Brochure p. 28: {DATAMITES_PROGRAM_FACTS.internshipMonths} months post-training
                internship with {DATAMITES_PROGRAM_FACTS.liveProjectMentoringHours} hours of live
                project mentoring, real deliverables, certificate, and experience letter.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 p-3.5 sm:p-4 border border-[var(--color-line-soft)] bg-[var(--color-sunken)]/40">
                <label className="min-h-[44px] flex items-center gap-3 text-xs sm:text-sm text-[var(--color-ink)] cursor-pointer select-none py-1">
                  <input
                    type="checkbox"
                    checked={state.profile.internshipIntakeDone}
                    onChange={(e) =>
                      updateProfile({ internshipIntakeDone: e.target.checked })
                    }
                    className="h-4 w-4 shrink-0 rounded-none border border-[var(--color-line)] accent-[var(--color-ink)]"
                  />
                  <span>Internship intake &amp; team onboarding completed</span>
                </label>

                <label className="min-h-[44px] flex items-center gap-3 text-xs sm:text-sm text-[var(--color-ink)] cursor-pointer select-none py-1">
                  <input
                    type="checkbox"
                    checked={state.profile.internshipCertificateDone}
                    onChange={(e) =>
                      updateProfile({ internshipCertificateDone: e.target.checked })
                    }
                    className="h-4 w-4 shrink-0 rounded-none border border-[var(--color-line)] accent-[var(--color-ink)]"
                  />
                  <span>Internship Certificate issued</span>
                </label>

                <label className="min-h-[44px] flex items-center gap-3 text-xs sm:text-sm text-[var(--color-ink)] cursor-pointer select-none py-1">
                  <input
                    type="checkbox"
                    checked={state.profile.internshipExperienceLetterDone}
                    onChange={(e) =>
                      updateProfile({ internshipExperienceLetterDone: e.target.checked })
                    }
                    className="h-4 w-4 shrink-0 rounded-none border border-[var(--color-line)] accent-[var(--color-ink)]"
                  />
                  <span>Experience Letter issued</span>
                </label>
              </div>

              <div className="p-3.5 sm:p-4 border border-[var(--color-line-soft)] bg-[var(--color-sunken)]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-semibold text-[var(--color-ink)]">
                    Live Project Mentoring Hours
                  </label>
                  <span className="text-xs font-mono font-semibold text-[var(--color-ink)] tabular-nums">
                    {state.profile.internshipMentoringHours} /{' '}
                    {DATAMITES_PROGRAM_FACTS.liveProjectMentoringHours}h
                  </span>
                </div>
                <ProgressBar
                  value={state.profile.internshipMentoringHours}
                  max={DATAMITES_PROGRAM_FACTS.liveProjectMentoringHours}
                  colorClass="bg-[var(--color-ink)]"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={state.profile.internshipMentoringHours}
                    onChange={(e) =>
                      updateProfile({
                        internshipMentoringHours: Math.max(0, Math.min(200, Number(e.target.value) || 0)),
                      })
                    }
                    className="w-24 min-h-[44px] px-2.5 py-1.5 border border-[var(--color-line)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)] tabular-nums font-mono"
                  />
                  <span className="text-xs text-[var(--color-secondary)]">hours logged</span>
                </div>
              </div>
            </div>
          </SectionCard>

          {internshipProjects.length === 0 ? (
            <SectionCard className="p-8 text-center">
              <p className="text-sm font-display font-medium text-[var(--color-ink)]">No internship deliverables logged</p>
              <p className="text-xs text-[var(--color-secondary)] mt-1">
                Log your internship sprint deliverables, PR links, and evaluation milestones here.
              </p>
            </SectionCard>
          ) : (
            <div className="space-y-4">{internshipProjects.map(renderProjectCard)}</div>
          )}
        </div>
      )}

      {/* TAB 3: Supplementary Personal Projects */}
      {activeTab === 'supplementary_personal' && (
        <div className="space-y-6">
          <SectionCard className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-display font-medium text-[var(--color-ink)]">
                  Recommended Stage-Aligned Starter Templates
                </h2>
                <p className="text-xs text-[var(--color-secondary)] mt-0.5">
                  Proposed supplementary projects unlocked progressively as you complete core
                  weeks. Clearly labeled as supplementary practice — never official DataMites
                  projects.
                </p>
              </div>
              <ProvenanceInline label="SUPPLEMENTARY_PRACTICE_PROPOSED" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PROJECT_TEMPLATES.map((tpl) => {
                const alreadyAdded = personalProjects.some((p) => p.title === tpl.title);
                const unlocked = state.profile.currentWeek >= tpl.unlockAfterWeek;
                return (
                  <div
                    key={tpl.id}
                    className="p-4 border border-[var(--color-line)] bg-[var(--color-surface)] flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                        <span className="font-semibold text-[var(--color-ink)] tabular-nums">
                          Suggested after Week {tpl.unlockAfterWeek}
                        </span>
                        <span className={unlocked ? 'text-[var(--color-ink)] font-bold' : 'text-[var(--color-secondary)]'}>
                          {unlocked ? 'Ready now' : 'Upcoming'}
                        </span>
                      </div>
                      <h3 className="text-sm font-display font-semibold text-[var(--color-ink)] break-words">{tpl.title}</h3>
                      <p className="text-xs text-[var(--color-secondary)] line-clamp-3 leading-relaxed break-words">{tpl.problemStatement}</p>
                      <p className="text-[11px] font-mono text-[var(--color-secondary)] break-words">{tpl.competencyArea}</p>
                    </div>
                    <button
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() => handleUseTemplate(tpl)}
                      className={`min-h-[44px] w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-mono font-medium transition-colors cursor-pointer border ${
                        alreadyAdded
                          ? 'bg-[var(--color-sunken)] text-[var(--color-secondary)] border-[var(--color-line-soft)] cursor-default'
                          : 'bg-[var(--color-surface)] border border-[var(--color-line)] hover:bg-[var(--color-sunken)] text-[var(--color-ink)]'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{alreadyAdded ? 'Added to Portfolio' : 'Start from Template'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {personalProjects.length > 0 && (
            <div className="space-y-4">{personalProjects.map(renderProjectCard)}</div>
          )}
        </div>
      )}

      {/* Add / Edit Project Modal */}
      {modalForm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-ink)]/40 p-3 sm:p-4 overflow-y-auto"
        >
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-none my-auto">
            {/* Modal Header: Accessible & Fixed */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[var(--color-line-soft)] flex items-center justify-between shrink-0 bg-[var(--color-surface)]">
              <h2 id="project-modal-title" className="text-base sm:text-lg font-display font-medium text-[var(--color-ink)]">
                {modalForm.id ? 'Edit Project' : 'Add Project'}
              </h2>
              <button
                type="button"
                onClick={() => setModalForm(null)}
                aria-label="Close dialog"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-[var(--color-secondary)] hover:text-[var(--color-ink)] cursor-pointer -mr-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form: Scrollable internal area */}
            <form onSubmit={handleSubmitModal} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1.5">
                      Category
                    </label>
                    <select
                      value={modalForm.category}
                      onChange={(e) => {
                        const cat = e.target.value as ProjectRecord['category'];
                        setModalForm({
                          ...modalForm,
                          category: cat,
                          provenance:
                            cat === 'supplementary_personal'
                              ? 'SUPPLEMENTARY_PRACTICE_PROPOSED'
                              : 'DATAMITES_OFFICIAL',
                        });
                      }}
                      className="w-full min-h-[44px] px-3 py-2.5 border border-[var(--color-line)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)] font-body focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]"
                    >
                      <option value="official_datamites">Official DataMites Project</option>
                      <option value="internship">Internship Deliverable</option>
                      <option value="supplementary_personal">Supplementary Personal Project</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1.5">
                      Competency Area
                    </label>
                    <select
                      value={modalForm.competencyArea}
                      onChange={(e) =>
                        setModalForm({ ...modalForm, competencyArea: e.target.value })
                      }
                      className="w-full min-h-[44px] px-3 py-2.5 border border-[var(--color-line)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)] font-body focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]"
                    >
                      {OFFICIAL_COMPETENCY_AREAS.map((a) => (
                        <option key={a.id} value={a.title}>
                          {a.number}. {a.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1.5">
                    Project Title
                  </label>
                  <input
                    type="text"
                    required
                    value={modalForm.title}
                    onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                    placeholder="e.g., Customer Churn Classifier with MLflow Tracking"
                    className="w-full min-h-[44px] px-3 py-2.5 border border-[var(--color-line)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)] font-body focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1.5">
                    Problem Statement
                  </label>
                  <textarea
                    rows={3}
                    value={modalForm.problemStatement}
                    onChange={(e) =>
                      setModalForm({ ...modalForm, problemStatement: e.target.value })
                    }
                    className="w-full p-3 border border-[var(--color-line)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)] font-body focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)] leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1.5">
                      Skills (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={modalForm.skillsCsv}
                      onChange={(e) => setModalForm({ ...modalForm, skillsCsv: e.target.value })}
                      placeholder="Python, Scikit-Learn, FastAPI"
                      className="w-full min-h-[44px] px-3 py-2.5 border border-[var(--color-line)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)] font-body focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1.5">
                      Dataset / Input Source
                    </label>
                    <input
                      type="text"
                      value={modalForm.datasetSource}
                      onChange={(e) =>
                        setModalForm({ ...modalForm, datasetSource: e.target.value })
                      }
                      className="w-full min-h-[44px] px-3 py-2.5 border border-[var(--color-line)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)] font-body focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1.5">
                    Milestones (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={modalForm.milestonesText}
                    onChange={(e) =>
                      setModalForm({ ...modalForm, milestonesText: e.target.value })
                    }
                    className="w-full p-3 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-mono text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)] leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1.5">
                      Deliverables
                    </label>
                    <input
                      type="text"
                      value={modalForm.deliverables}
                      onChange={(e) =>
                        setModalForm({ ...modalForm, deliverables: e.target.value })
                      }
                      className="w-full min-h-[44px] px-3 py-2.5 border border-[var(--color-line)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)] font-body focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1.5">
                      GitHub / Demo URL
                    </label>
                    <input
                      type="url"
                      value={modalForm.githubUrl}
                      onChange={(e) => setModalForm({ ...modalForm, githubUrl: e.target.value })}
                      placeholder="https://github.com/..."
                      className="w-full min-h-[44px] px-3 py-2.5 border border-[var(--color-line)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)] font-body focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1.5">
                      Completion Criteria
                    </label>
                    <input
                      type="text"
                      value={modalForm.completionCriteria}
                      onChange={(e) =>
                        setModalForm({ ...modalForm, completionCriteria: e.target.value })
                      }
                      className="w-full min-h-[44px] px-3 py-2.5 border border-[var(--color-line)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)] font-body focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1.5">
                      Status
                    </label>
                    <select
                      value={modalForm.status}
                      onChange={(e) =>
                        setModalForm({
                          ...modalForm,
                          status: e.target.value as ProjectRecord['status'],
                        })
                      }
                      className="w-full min-h-[44px] px-3 py-2.5 border border-[var(--color-line)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)] font-body focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]"
                    >
                      <option value="planned">Planned</option>
                      <option value="in_progress">In progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Actions Footer: Fixed & Reachable */}
              <div className="p-4 sm:px-6 py-3 border-t border-[var(--color-line-soft)] flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-2 shrink-0 bg-[var(--color-surface)]">
                <button
                  type="button"
                  onClick={() => setModalForm(null)}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-mono font-medium text-[var(--color-secondary)] hover:bg-[var(--color-sunken)] hover:text-[var(--color-ink)] cursor-pointer inline-flex items-center justify-center transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2 bg-[var(--color-signal)] border border-[var(--color-ink)] text-xs font-mono font-bold text-[var(--color-ink)] hover:brightness-95 cursor-pointer inline-flex items-center justify-center transition-colors"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
