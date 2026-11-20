import React from 'react';
import {
  AssignmentStatus,
  BonusModuleStatus,
  ProvenanceLabel,
  ResourceClassification,
  RevisionStatus,
  TopicStatus,
} from '../types';

export const TOPIC_STATUS_OPTIONS: { value: TopicStatus; label: string }[] = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'practised', label: 'Practised' },
  { value: 'demonstrated', label: 'Demonstrated' },
  { value: 'needs_revision', label: 'Needs revision' },
  { value: 'complete', label: 'Complete' },
];

export const ASSIGNMENT_STATUS_OPTIONS: { value: AssignmentStatus; label: string }[] = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'reviewed', label: 'Reviewed' },
];

export const REVISION_STATUS_OPTIONS: { value: RevisionStatus; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'needs_revision', label: 'Needs revision' },
  { value: 'revised', label: 'Revised' },
];

export const BONUS_STATUS_OPTIONS: { value: BonusModuleStatus; label: string }[] = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'complete', label: 'Complete' },
];

export function formatTopicStatus(status: TopicStatus): string {
  return TOPIC_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? 'Not started';
}

export function topicStatusTone(status: TopicStatus): string {
  switch (status) {
    case 'complete':
    case 'demonstrated':
      return 'text-[#047857] bg-[#ECFDF5] border-[#A7F3D0]';
    case 'practised':
    case 'in_progress':
      return 'text-[#1D4ED8] bg-[#EFF6FF] border-[#BFDBFE]';
    case 'needs_revision':
      return 'text-[#B45309] bg-[#FFFBEB] border-[#FDE68A]';
    default:
      return 'text-[#475569] bg-[#F8FAFC] border-[#E2E8F0]';
  }
}

export function ClassificationTag({ value }: { value: ResourceClassification }) {
  const styles: Record<ResourceClassification, string> = {
    ESSENTIAL: 'text-[#1D4ED8] bg-[#EFF6FF] border-[#BFDBFE]',
    OPTIONAL: 'text-[#475569] bg-[#F8FAFC] border-[#CBD5E1]',
    SKIP: 'text-[#94A3B8] bg-[#F8FAFC] border-[#E2E8F0] line-through decoration-[#CBD5E1]',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold tracking-wide rounded border whitespace-nowrap shrink-0 ${styles[value]}`}
    >
      {value}
    </span>
  );
}

export function LanguageTag({ language }: { language: 'English' | 'Hindi' }) {
  if (language !== 'Hindi') return null;
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 text-[11px] font-medium rounded border border-[#FDE68A] bg-[#FFFBEB] text-[#B45309] whitespace-nowrap shrink-0">
      Hindi
    </span>
  );
}

export function formatProvenance(label: ProvenanceLabel): string {
  switch (label) {
    case 'DATAMITES_OFFICIAL':
      return 'DataMites Official';
    case 'CODEWITHHARRY_PYTHON':
      return 'CodeWithHarry Python';
    case 'CODEWITHHARRY_DATA_SCIENCE':
      return 'CodeWithHarry Data Science';
    case 'SSD_AI_ENGINEER_BOOTCAMP':
      return 'SSD AI Engineer Bootcamp';
    case 'OTHER_SSD':
      return 'SSD Reference';
    case 'SUPPLEMENTARY_PRACTICE_PROPOSED':
      return 'Supplementary Practice (Proposed)';
    case 'UNVERIFIED':
      return 'Unverified in Brochure';
  }
}

export function ProvenanceInline({ label }: { label: ProvenanceLabel }) {
  const tone =
    label === 'UNVERIFIED'
      ? 'text-[#B45309] font-medium'
      : label === 'DATAMITES_OFFICIAL'
        ? 'text-[#1D4ED8] font-medium'
        : 'text-[#64748B]';
  return <span className={`text-xs ${tone}`}>{formatProvenance(label)}</span>;
}

export function ProgressBar({
  value,
  max = 100,
  colorClass = 'bg-[#2563EB]',
  heightClass = 'h-2',
}: {
  value: number;
  max?: number;
  colorClass?: string;
  heightClass?: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0;
  return (
    <div className={`w-full ${heightClass} rounded-full bg-[#E2E8F0] overflow-hidden`}>
      <div
        className={`${heightClass} rounded-full transition-all duration-300 ${colorClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function SectionCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-xl ${className}`}>
      {children}
    </div>
  );
}
