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

/**
 * Restrained, neutral, ink-based topic status styling conforming to Paper & Signal.
 * Does not introduce unapproved saturated green/blue/amber colors.
 * Relies on dark ink, sunken neutral surfaces, and distinct border weights/styles.
 */
export function topicStatusTone(status: TopicStatus): string {
  switch (status) {
    case 'complete':
      // Solid dark ink border with sunken paper fill to indicate verified completion
      return 'text-[var(--color-ink)] bg-[var(--color-sunken)] border-[var(--color-ink)] font-semibold';
    case 'demonstrated':
      // Double/thick border with sunken fill to represent hands-on demonstration
      return 'text-[var(--color-ink)] bg-[var(--color-sunken)] border-2 border-[var(--color-ink)] font-semibold';
    case 'practised':
      // Solid hairline border with surface fill
      return 'text-[var(--color-ink)] bg-[var(--color-surface)] border-[var(--color-line)] font-medium';
    case 'in_progress':
      // Dashed hairline border with surface fill to represent active learning in progress
      return 'text-[var(--color-ink)] bg-[var(--color-surface)] border border-dashed border-[var(--color-line)] font-medium';
    case 'needs_revision':
      // Hairline border with subtle underline decoration to call for review without bright amber
      return 'text-[var(--color-ink)] bg-[var(--color-surface)] border-[var(--color-line)] underline decoration-[var(--color-secondary)] font-medium';
    default:
      // Quiet unstarted state on paper background with soft border
      return 'text-[var(--color-secondary)] bg-[var(--color-paper)] border-[var(--color-line-soft)]';
  }
}

/**
 * Resource Classification Tag conforming to Paper & Signal neutral typography and tokens.
 * Distinguishes ESSENTIAL, OPTIONAL, and SKIP strictly through typography, borders, and decorations.
 */
export function ClassificationTag({ value }: { value: ResourceClassification }) {
  const styles: Record<ResourceClassification, string> = {
    ESSENTIAL: 'text-[var(--color-ink)] bg-[var(--color-sunken)] border-[var(--color-ink)] font-bold',
    OPTIONAL: 'text-[var(--color-secondary)] bg-[var(--color-surface)] border-[var(--color-line-soft)] font-normal',
    SKIP: 'text-[var(--color-secondary)] bg-[var(--color-paper)] border-[var(--color-line-soft)] line-through decoration-[var(--color-line)] opacity-60',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-mono tracking-wide border whitespace-nowrap shrink-0 ${styles[value]}`}
    >
      {value}
    </span>
  );
}

/**
 * Language Tag conforming to Paper & Signal neutral typography.
 * Replaces previous bright yellow amber styling with a quiet sunken badge.
 */
export function LanguageTag({ language }: { language: 'English' | 'Hindi' }) {
  if (language !== 'Hindi') return null;
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase border border-[var(--color-line)] bg-[var(--color-sunken)] text-[var(--color-ink)] whitespace-nowrap shrink-0">
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

/**
 * Editorial provenance label in Cascadia Code monospace.
 */
export function ProvenanceInline({ label }: { label: ProvenanceLabel }) {
  const isOfficial = label === 'DATAMITES_OFFICIAL';
  const isUnverified = label === 'UNVERIFIED';

  return (
    <span
      className={`text-xs font-mono ${
        isOfficial
          ? 'text-[var(--color-ink)] font-bold'
          : isUnverified
            ? 'text-[var(--color-secondary)] italic underline'
            : 'text-[var(--color-secondary)]'
      }`}
    >
      {formatProvenance(label)}
    </span>
  );
}

/**
 * Rectilinear progress indicator conforming to Paper & Signal.
 * Replaces bubbly rounded pills with a crisp sunken track and hairline border.
 */
export function ProgressBar({
  value,
  max = 100,
  colorClass = 'bg-[var(--color-ink)]',
  heightClass = 'h-1.5',
}: {
  value: number;
  max?: number;
  colorClass?: string;
  heightClass?: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0;
  return (
    <div className={`w-full ${heightClass} bg-[var(--color-sunken)] border border-[var(--color-line)] overflow-hidden`}>
      <div
        className={`${heightClass} ${colorClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/**
 * Core surface container card conforming to Paper & Signal.
 * Replaces modern rounded-xl and soft drop shadows with a flat surface and hairline border.
 */
export function SectionCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-[var(--color-surface)] border border-[var(--color-line)] shadow-none ${className}`}>
      {children}
    </div>
  );
}
