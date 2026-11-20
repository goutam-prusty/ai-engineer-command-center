/**
 * Record <-> Firestore document converters. Kept free of any Firebase *initialisation* so they
 * can be unit tested in plain Node against firestore.rules.
 */
import { Timestamp } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import type {
  ActivityLogRecord,
  BonusProgressRecord,
  FlashcardStateRecord,
  JournalEntryRecord,
  PracticeLogRecord,
  ProjectRecord,
  QuizAttemptRecord,
  ResourceStateRecord,
  StudySessionRecord,
  TopicProgressRecord,
  UserProfile,
  WeakConceptRecord,
} from '../../types.ts';
import { clampInt, clampStr, nowIso } from '../util.ts';
import type { CollectionName } from './merge.ts';
import { stampMs } from './merge.ts';

export function tsToIso(val: unknown, fallback: string): string {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'string' && val.length > 0) return val;
  return fallback;
}

function toTs(iso: string | undefined): Timestamp {
  const ms = stampMs(iso);
  return Timestamp.fromMillis(ms > 0 ? ms : Date.now());
}

export interface WriteOptions {
  /** Override the record's own `updatedAt` / `createdAt` (used to resolve conflicts). */
  stamp?: string;
  createdAt?: string;
}

type Rec = any;

export interface Codec {
  toDoc: (uid: string, rec: Rec, o: WriteOptions) => Record<string, unknown>;
  fromDoc: (id: string, d: DocumentData) => Rec | null;
}

const upd = (r: { updatedAt: string }, o: WriteOptions) => toTs(o.stamp ?? r.updatedAt);
const crt = (r: { createdAt: string }, o: WriteOptions) => toTs(o.createdAt ?? r.createdAt);

export const CODECS: Record<CollectionName, Codec> = {
  topicProgress: {
    toDoc: (uid, r: TopicProgressRecord, o) => ({
      ownerId: uid,
      topicId: r.topicId,
      week: clampInt(r.week, 1, 20),
      status: r.status,
      assignmentStatus: r.assignmentStatus,
      revisionStatus: r.revisionStatus,
      notes: clampStr(r.notes, 4000),
      evidenceUrl: clampStr(r.evidenceUrl, 500),
      updatedAt: upd(r, o),
    }),
    fromDoc: (id, d) =>
      d.status
        ? ({
            topicId: d.topicId || id,
            week: d.week,
            status: d.status,
            assignmentStatus: d.assignmentStatus,
            revisionStatus: d.revisionStatus,
            notes: d.notes || '',
            evidenceUrl: d.evidenceUrl || '',
            updatedAt: tsToIso(d.updatedAt, nowIso()),
          } as TopicProgressRecord)
        : null,
  },
  bonusProgress: {
    toDoc: (uid, r: BonusProgressRecord, o) => ({
      ownerId: uid,
      moduleId: r.moduleId,
      status: r.status,
      notes: clampStr(r.notes, 2000),
      updatedAt: upd(r, o),
    }),
    fromDoc: (id, d) =>
      d.status
        ? ({
            moduleId: d.moduleId || id,
            status: d.status,
            notes: d.notes || '',
            updatedAt: tsToIso(d.updatedAt, nowIso()),
          } as BonusProgressRecord)
        : null,
  },
  resourceStates: {
    toDoc: (uid, r: ResourceStateRecord, o) => ({
      ownerId: uid,
      resourceId: r.resourceId,
      watched: Boolean(r.watched),
      pinnedWeek: clampInt(r.pinnedWeek, 0, 20),
      note: clampStr(r.note, 1000),
      updatedAt: upd(r, o),
    }),
    fromDoc: (id, d) => ({
      resourceId: d.resourceId || id,
      watched: Boolean(d.watched),
      pinnedWeek: Number(d.pinnedWeek || 0),
      note: d.note || '',
      updatedAt: tsToIso(d.updatedAt, nowIso()),
    } as ResourceStateRecord),
  },
  studySessions: {
    toDoc: (uid, r: StudySessionRecord, o) => ({
      ownerId: uid,
      week: clampInt(r.week, 1, 20),
      day: r.day,
      title: clampStr(r.title || 'Study Session', 200),
      category: r.category,
      plannedMinutes: clampInt(r.plannedMinutes, 5, 600),
      completed: Boolean(r.completed),
      linkedRef: clampStr(r.linkedRef, 200),
      createdAt: crt(r, o),
      updatedAt: upd(r, o),
    }),
    fromDoc: (id, d) =>
      d.title
        ? ({
            id,
            week: d.week,
            day: d.day,
            title: d.title,
            category: d.category,
            plannedMinutes: d.plannedMinutes,
            completed: Boolean(d.completed),
            linkedRef: d.linkedRef || '',
            createdAt: tsToIso(d.createdAt, nowIso()),
            updatedAt: tsToIso(d.updatedAt, nowIso()),
          } as StudySessionRecord)
        : null,
  },
  practiceLogs: {
    toDoc: (uid, r: PracticeLogRecord, o) => ({
      ownerId: uid,
      exerciseId: r.exerciseId,
      week: clampInt(r.week, 1, 20),
      status: r.status,
      evidenceUrl: clampStr(r.evidenceUrl, 500),
      notes: clampStr(r.notes, 3000),
      updatedAt: upd(r, o),
    }),
    fromDoc: (id, d) =>
      d.status
        ? ({
            exerciseId: d.exerciseId || id,
            week: d.week,
            status: d.status,
            evidenceUrl: d.evidenceUrl || '',
            notes: d.notes || '',
            updatedAt: tsToIso(d.updatedAt, nowIso()),
          } as PracticeLogRecord)
        : null,
  },
  projects: {
    toDoc: (uid, r: ProjectRecord, o) => ({
      ownerId: uid,
      category: r.category,
      title: clampStr(r.title || 'Untitled Project', 200),
      competencyArea: clampStr(r.competencyArea, 120),
      problemStatement: clampStr(r.problemStatement, 2000),
      skills: (r.skills || []).slice(0, 20).map((s) => clampStr(s, 200)),
      datasetSource: clampStr(r.datasetSource, 300),
      milestones: (r.milestones || []).slice(0, 20).map((m) => clampStr(m, 200)),
      deliverables: clampStr(r.deliverables, 1500),
      githubUrl: clampStr(r.githubUrl, 500),
      completionCriteria: clampStr(r.completionCriteria, 1500),
      status: r.status,
      provenance: r.provenance,
      createdAt: crt(r, o),
      updatedAt: upd(r, o),
    }),
    fromDoc: (id, d) =>
      d.title
        ? ({
            id,
            category: d.category,
            title: d.title,
            competencyArea: d.competencyArea || '',
            problemStatement: d.problemStatement || '',
            skills: Array.isArray(d.skills) ? d.skills : [],
            datasetSource: d.datasetSource || '',
            milestones: Array.isArray(d.milestones) ? d.milestones : [],
            deliverables: d.deliverables || '',
            githubUrl: d.githubUrl || '',
            completionCriteria: d.completionCriteria || '',
            status: d.status,
            provenance: d.provenance,
            createdAt: tsToIso(d.createdAt, nowIso()),
            updatedAt: tsToIso(d.updatedAt, nowIso()),
          } as ProjectRecord)
        : null,
  },
  weakConcepts: {
    toDoc: (uid, r: WeakConceptRecord, o) => ({
      ownerId: uid,
      week: clampInt(r.week, 1, 20),
      topicId: clampStr(r.topicId, 128),
      title: clampStr(r.title || 'Concept to review', 200),
      notes: clampStr(r.notes, 2000),
      resolved: Boolean(r.resolved),
      source: clampStr(r.source || 'manual', 80),
      createdAt: crt(r, o),
      updatedAt: upd(r, o),
    }),
    fromDoc: (id, d) =>
      d.title
        ? ({
            id,
            week: d.week,
            topicId: d.topicId || '',
            title: d.title,
            notes: d.notes || '',
            resolved: Boolean(d.resolved),
            source: d.source || 'manual',
            createdAt: tsToIso(d.createdAt, nowIso()),
            updatedAt: tsToIso(d.updatedAt, nowIso()),
          } as WeakConceptRecord)
        : null,
  },
  flashcardStates: {
    toDoc: (uid, r: FlashcardStateRecord, o) => ({
      ownerId: uid,
      cardId: r.cardId,
      status: r.status,
      reviewCount: clampInt(r.reviewCount, 0, 10000),
      updatedAt: upd(r, o),
    }),
    fromDoc: (id, d) =>
      d.status
        ? ({
            cardId: d.cardId || id,
            status: d.status,
            reviewCount: Number(d.reviewCount || 0),
            updatedAt: tsToIso(d.updatedAt, nowIso()),
          } as FlashcardStateRecord)
        : null,
  },
  quizAttempts: {
    toDoc: (uid, r: QuizAttemptRecord, o) => ({
      ownerId: uid,
      week: clampInt(r.week, 1, 20),
      score: clampInt(r.score, 0, 100),
      total: clampInt(r.total, 1, 100),
      missedTopicIds: (r.missedTopicIds || []).slice(0, 50).map((s) => clampStr(s, 200)),
      createdAt: crt(r, o),
    }),
    fromDoc: (id, d) =>
      typeof d.score === 'number'
        ? ({
            id,
            week: d.week,
            score: d.score,
            total: d.total,
            missedTopicIds: Array.isArray(d.missedTopicIds) ? d.missedTopicIds : [],
            createdAt: tsToIso(d.createdAt, nowIso()),
          } as QuizAttemptRecord)
        : null,
  },
  journalEntries: {
    toDoc: (uid, r: JournalEntryRecord, o) => ({
      ownerId: uid,
      date: clampStr(r.date, 32),
      week: clampInt(r.week, 1, 20),
      learnedToday: clampStr(r.learnedToday, 3000),
      implemented: clampStr(r.implemented, 3000),
      problemsEncountered: clampStr(r.problemsEncountered, 3000),
      howSolved: clampStr(r.howSolved, 3000),
      unclearConcepts: clampStr(r.unclearConcepts, 3000),
      mentorQuestions: clampStr(r.mentorQuestions, 3000),
      mentorResolved: Boolean(r.mentorResolved),
      nextSession: clampStr(r.nextSession, 2000),
      createdAt: crt(r, o),
      updatedAt: upd(r, o),
    }),
    fromDoc: (id, d) =>
      d.date
        ? ({
            id,
            date: d.date,
            week: d.week,
            learnedToday: d.learnedToday || '',
            implemented: d.implemented || '',
            problemsEncountered: d.problemsEncountered || '',
            howSolved: d.howSolved || '',
            unclearConcepts: d.unclearConcepts || '',
            mentorQuestions: d.mentorQuestions || '',
            mentorResolved: Boolean(d.mentorResolved),
            nextSession: d.nextSession || '',
            createdAt: tsToIso(d.createdAt, nowIso()),
            updatedAt: tsToIso(d.updatedAt, nowIso()),
          } as JournalEntryRecord)
        : null,
  },
  activityLogs: {
    toDoc: (uid, r: ActivityLogRecord, o) => ({
      ownerId: uid,
      type: r.type,
      title: clampStr(r.title, 200),
      detail: clampStr(r.detail, 300),
      week: clampInt(r.week, 1, 20),
      createdAt: crt(r, o),
    }),
    fromDoc: (id, d) =>
      d.title
        ? ({
            id,
            type: d.type,
            title: d.title,
            detail: d.detail || '',
            week: d.week,
            createdAt: tsToIso(d.createdAt, nowIso()),
          } as ActivityLogRecord)
        : null,
  },
};

/* ---------- profile ---------- */

export function profileToDoc(uid: string, p: UserProfile, o: WriteOptions): Record<string, unknown> {
  return {
    ownerId: uid,
    learnerName: clampStr(p.learnerName || 'AI Engineer Learner', 100),
    onboardingCompleted: Boolean(p.onboardingCompleted),
    currentWeek: clampInt(p.currentWeek, 1, 20),
    weeklyLiveHours: Math.max(0, Math.min(60, Number(p.weeklyLiveHours) || 0)),
    weeklySelfStudyHours: Math.max(0, Math.min(60, Number(p.weeklySelfStudyHours) || 0)),
    weeklyPracticeHours: Math.max(0, Math.min(60, Number(p.weeklyPracticeHours) || 0)),
    internshipIntakeDone: Boolean(p.internshipIntakeDone),
    internshipMentoringHours: Math.max(0, Math.min(200, Number(p.internshipMentoringHours) || 0)),
    internshipCertificateDone: Boolean(p.internshipCertificateDone),
    internshipExperienceLetterDone: Boolean(p.internshipExperienceLetterDone),
    createdAt: crt(p, o),
    updatedAt: upd(p, o),
  };
}

export function profileFromDoc(d: DocumentData): UserProfile {
  return {
    learnerName: d.learnerName || 'AI Engineer Learner',
    onboardingCompleted: Boolean(d.onboardingCompleted),
    currentWeek: clampInt(d.currentWeek, 1, 20),
    weeklyLiveHours: Number(d.weeklyLiveHours ?? 8),
    weeklySelfStudyHours: Number(d.weeklySelfStudyHours ?? 8),
    weeklyPracticeHours: Number(d.weeklyPracticeHours ?? 4),
    internshipIntakeDone: Boolean(d.internshipIntakeDone),
    internshipMentoringHours: Number(d.internshipMentoringHours ?? 0),
    internshipCertificateDone: Boolean(d.internshipCertificateDone),
    internshipExperienceLetterDone: Boolean(d.internshipExperienceLetterDone),
    createdAt: tsToIso(d.createdAt, nowIso()),
    updatedAt: tsToIso(d.updatedAt, nowIso()),
  };
}

