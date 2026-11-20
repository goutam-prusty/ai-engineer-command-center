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
    <SectionCard key={proj.id} className="p-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
            <ProvenanceInline label={proj.provenance} />
            {proj.competencyArea && (
              <>
                <span>·</span>
                <span className="font-medium text-[#334155]">{proj.competencyArea}</span>
              </>
            )}
          </div>
          <h3 className="text-base font-semibold text-[#0F172A]">{proj.title}</h3>
          {proj.problemStatement && (
            <p className="text-xs text-[#475569] leading-relaxed">{proj.problemStatement}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
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
            className={`px-2.5 py-1.5 rounded-md border text-xs font-medium cursor-pointer ${
              proj.status === 'completed'
                ? 'text-[#047857] bg-[#ECFDF5] border-[#A7F3D0]'
                : proj.status === 'in_progress'
                  ? 'text-[#1D4ED8] bg-[#EFF6FF] border-[#BFDBFE]'
                  : 'text-[#475569] bg-[#F8FAFC] border-[#E2E8F0]'
            }`}
          >
            <option value="planned">Planned</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </select>

          <button
            type="button"
            onClick={() => openEditModal(proj)}
            className="px-2.5 py-1.5 rounded-md border border-[#E2E8F0] text-xs font-medium text-[#334155] hover:bg-[#F8FAFC] cursor-pointer"
          >
            Edit
          </button>
          <button
            type="button"
            aria-label={`Delete ${proj.title}`}
            onClick={() => deleteProject(proj.id)}
            className="p-1.5 text-[#94A3B8] hover:text-[#DC2626] rounded hover:bg-[#FEF2F2] cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {proj.skills.length > 0 && (
        <p className="text-xs text-[#64748B]">
          <span className="font-medium text-[#334155]">Skills:</span> {proj.skills.join(', ')}
        </p>
      )}
      {proj.datasetSource && (
        <p className="text-xs text-[#64748B]">
          <span className="font-medium text-[#334155]">Dataset / Input:</span> {proj.datasetSource}
        </p>
      )}
      {proj.deliverables && (
        <p className="text-xs text-[#64748B]">
          <span className="font-medium text-[#334155]">Deliverables:</span> {proj.deliverables}
        </p>
      )}
      {proj.completionCriteria && (
        <p className="text-xs text-[#64748B]">
          <span className="font-medium text-[#334155]">Completion criteria:</span>{' '}
          {proj.completionCriteria}
        </p>
      )}

      {proj.milestones.length > 0 && (
        <div className="pt-2 border-t border-[#F1F5F9] space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
            Milestones
          </p>
          {proj.milestones.map((m, idx) => {
            const checked = m.startsWith('[x] ');
            const label = m.replace(/^\[[ x]\]\s*/, '');
            return (
              <label key={idx} className="flex items-center gap-2 text-xs text-[#334155] cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleToggleMilestone(proj, idx)}
                  className="h-3.5 w-3.5 rounded border-[#CBD5E1] text-[#2563EB]"
                />
                <span className={checked ? 'line-through text-[#94A3B8]' : ''}>{label}</span>
              </label>
            );
          })}
        </div>
      )}

      {proj.githubUrl && (
        <div className="pt-2 border-t border-[#F1F5F9]">
          <a
            href={proj.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2563EB] hover:underline"
          >
            <span>{proj.githubUrl}</span>
            <ExternalLink className="w-3.5 h-3.5" />
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
          <h1 className="text-2xl font-semibold text-[#0F172A] tracking-tight">
            Projects &amp; Portfolio
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Track official DataMites projects (minimum{' '}
            {DATAMITES_PROGRAM_FACTS.minimumOfficialProjects} required), 3-month internship
            deliverables, and supplementary portfolio builds.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalForm(emptyForm(activeTab))}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium whitespace-nowrap shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Project</span>
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E2E8F0] pb-2">
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
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === t.id
                ? 'bg-[#0F172A] text-white'
                : 'bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Official DataMites Projects */}
      {activeTab === 'official_datamites' && (
        <div className="space-y-6">
          <SectionCard className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-[#0F172A]">
                  Official Project Milestone ({officialCompleted} /{' '}
                  {DATAMITES_PROGRAM_FACTS.minimumOfficialProjects} Completed)
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Brochure p. 28 requires a minimum of 5 real-world industry projects across the 8
                  competency areas below.
                </p>
              </div>
              <div className="w-48 shrink-0">
                <ProgressBar
                  value={officialCompleted}
                  max={DATAMITES_PROGRAM_FACTS.minimumOfficialProjects}
                  colorClass="bg-[#2563EB]"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] flex items-start gap-2.5 text-xs text-[#92400E]">
              <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
              <p>
                <span className="font-semibold">UNVERIFIED batch specifics:</span> Official batch
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
                    className={`p-3 rounded-lg border text-xs ${
                      done
                        ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#334155]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 shrink-0 ${
                          done ? 'text-[#059669]' : 'text-[#CBD5E1]'
                        }`}
                      />
                      <span>
                        {area.number}. {area.title}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] opacity-85">{area.description}</p>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {officialProjects.length === 0 ? (
            <SectionCard className="p-8 text-center">
              <FolderGit2 className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
              <p className="text-sm font-medium text-[#0F172A]">
                No official DataMites projects logged yet
              </p>
              <p className="text-xs text-[#64748B] mt-1">
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
          <SectionCard className="p-5 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-[#0F172A]">
                3-Month Applied AI Internship Tracker
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Brochure p. 28: {DATAMITES_PROGRAM_FACTS.internshipMonths} months post-training
                internship with {DATAMITES_PROGRAM_FACTS.liveProjectMentoringHours} hours of live
                project mentoring, real deliverables, certificate, and experience letter.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2.5 p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]/60">
                <label className="flex items-center gap-2.5 text-sm text-[#0F172A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.profile.internshipIntakeDone}
                    onChange={(e) =>
                      updateProfile({ internshipIntakeDone: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB]"
                  />
                  <span>Internship intake &amp; team onboarding completed</span>
                </label>

                <label className="flex items-center gap-2.5 text-sm text-[#0F172A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.profile.internshipCertificateDone}
                    onChange={(e) =>
                      updateProfile({ internshipCertificateDone: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB]"
                  />
                  <span>Internship Certificate issued</span>
                </label>

                <label className="flex items-center gap-2.5 text-sm text-[#0F172A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.profile.internshipExperienceLetterDone}
                    onChange={(e) =>
                      updateProfile({ internshipExperienceLetterDone: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB]"
                  />
                  <span>Experience Letter issued</span>
                </label>
              </div>

              <div className="p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]/60 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#0F172A]">
                    Live Project Mentoring Hours
                  </label>
                  <span className="text-xs font-semibold text-[#2563EB] tabular-nums">
                    {state.profile.internshipMentoringHours} /{' '}
                    {DATAMITES_PROGRAM_FACTS.liveProjectMentoringHours}h
                  </span>
                </div>
                <ProgressBar
                  value={state.profile.internshipMentoringHours}
                  max={DATAMITES_PROGRAM_FACTS.liveProjectMentoringHours}
                  colorClass="bg-[#2563EB]"
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
                    className="w-24 px-2.5 py-1.5 rounded border border-[#CBD5E1] bg-white text-sm text-[#0F172A] tabular-nums"
                  />
                  <span className="text-xs text-[#64748B]">hours logged</span>
                </div>
              </div>
            </div>
          </SectionCard>

          {internshipProjects.length === 0 ? (
            <SectionCard className="p-8 text-center">
              <p className="text-sm font-medium text-[#0F172A]">No internship deliverables logged</p>
              <p className="text-xs text-[#64748B] mt-1">
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
          <SectionCard className="p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[#0F172A]">
                  Recommended Stage-Aligned Starter Templates
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
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
                    className="p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]/50 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="font-semibold text-[#2563EB] tabular-nums">
                          Suggested after Week {tpl.unlockAfterWeek}
                        </span>
                        <span className={unlocked ? 'text-[#059669]' : 'text-[#94A3B8]'}>
                          {unlocked ? 'Ready now' : 'Upcoming'}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-[#0F172A]">{tpl.title}</h3>
                      <p className="text-xs text-[#475569] line-clamp-3">{tpl.problemStatement}</p>
                      <p className="text-[11px] text-[#64748B]">{tpl.competencyArea}</p>
                    </div>
                    <button
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() => handleUseTemplate(tpl)}
                      className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        alreadyAdded
                          ? 'bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] cursor-default'
                          : 'bg-white border border-[#E2E8F0] hover:bg-[#EFF6FF] hover:border-[#BFDBFE] text-[#0F172A]'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2E8F0] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#0F172A]">
                {modalForm.id ? 'Edit Project' : 'Add Project'}
              </h2>
              <button
                type="button"
                onClick={() => setModalForm(null)}
                className="p-1 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#334155] mb-1">Category</label>
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
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A]"
                  >
                    <option value="official_datamites">Official DataMites Project</option>
                    <option value="internship">Internship Deliverable</option>
                    <option value="supplementary_personal">Supplementary Personal Project</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#334155] mb-1">
                    Competency Area
                  </label>
                  <select
                    value={modalForm.competencyArea}
                    onChange={(e) =>
                      setModalForm({ ...modalForm, competencyArea: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A]"
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
                <label className="block text-xs font-medium text-[#334155] mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  value={modalForm.title}
                  onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                  placeholder="e.g., Customer Churn Classifier with MLflow Tracking"
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#334155] mb-1">
                  Problem Statement
                </label>
                <textarea
                  rows={2}
                  value={modalForm.problemStatement}
                  onChange={(e) =>
                    setModalForm({ ...modalForm, problemStatement: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#334155] mb-1">
                    Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={modalForm.skillsCsv}
                    onChange={(e) => setModalForm({ ...modalForm, skillsCsv: e.target.value })}
                    placeholder="Python, Scikit-Learn, FastAPI"
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#334155] mb-1">
                    Dataset / Input Source
                  </label>
                  <input
                    type="text"
                    value={modalForm.datasetSource}
                    onChange={(e) =>
                      setModalForm({ ...modalForm, datasetSource: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#334155] mb-1">
                  Milestones (one per line)
                </label>
                <textarea
                  rows={3}
                  value={modalForm.milestonesText}
                  onChange={(e) =>
                    setModalForm({ ...modalForm, milestonesText: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs font-mono text-[#0F172A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#334155] mb-1">
                    Deliverables
                  </label>
                  <input
                    type="text"
                    value={modalForm.deliverables}
                    onChange={(e) =>
                      setModalForm({ ...modalForm, deliverables: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#334155] mb-1">
                    GitHub / Demo URL
                  </label>
                  <input
                    type="url"
                    value={modalForm.githubUrl}
                    onChange={(e) => setModalForm({ ...modalForm, githubUrl: e.target.value })}
                    placeholder="https://github.com/..."
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#334155] mb-1">
                    Completion Criteria
                  </label>
                  <input
                    type="text"
                    value={modalForm.completionCriteria}
                    onChange={(e) =>
                      setModalForm({ ...modalForm, completionCriteria: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#334155] mb-1">Status</label>
                  <select
                    value={modalForm.status}
                    onChange={(e) =>
                      setModalForm({
                        ...modalForm,
                        status: e.target.value as ProjectRecord['status'],
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A]"
                  >
                    <option value="planned">Planned</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setModalForm(null)}
                  className="px-4 py-2 rounded-lg border border-[#E2E8F0] text-sm font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium cursor-pointer"
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
