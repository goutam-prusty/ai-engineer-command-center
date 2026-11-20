import type {
  ActivityLogRecord,
  AppDataState,
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
} from '../src/types.ts';

export const T0 = '2026-01-01T10:00:00.000Z';
export const T1 = '2026-01-01T11:00:00.000Z';
export const T2 = '2026-01-01T12:00:00.000Z';

export function defaultProfile(over: Partial<UserProfile> = {}): UserProfile {
  return {
    learnerName: 'AI Engineer Learner',
    onboardingCompleted: false,
    currentWeek: 1,
    weeklyLiveHours: 8,
    weeklySelfStudyHours: 8,
    weeklyPracticeHours: 4,
    internshipIntakeDone: false,
    internshipMentoringHours: 0,
    internshipCertificateDone: false,
    internshipExperienceLetterDone: false,
    createdAt: T0,
    updatedAt: T0,
    ...over,
  };
}

export function emptyState(over: Partial<AppDataState> = {}): AppDataState {
  return {
    version: 1,
    profile: defaultProfile(),
    topicProgress: {},
    bonusProgress: {},
    resourceStates: {},
    studySessions: [],
    practiceLogs: {},
    projects: [],
    weakConcepts: [],
    flashcardStates: {},
    quizAttempts: [],
    journalEntries: [],
    activityLogs: [],
    ...over,
  };
}

export const topic = (id: string, updatedAt = T0, notes = ''): TopicProgressRecord => ({
  topicId: id, week: 1, status: 'in_progress', assignmentStatus: 'not_started',
  revisionStatus: 'none', notes, evidenceUrl: '', updatedAt,
});

export const session = (id: string, updatedAt = T0): StudySessionRecord => ({
  id, week: 2, day: 'Mon', title: 'Read chapter', category: 'self_study',
  plannedMinutes: 45, completed: false, linkedRef: '', createdAt: T0, updatedAt,
});

/** One valid sample record per synced collection (used for rules/codec checks). */
export const SAMPLES = {
  topicProgress: topic('w1-t1', T1, 'my note'),
  bonusProgress: { moduleId: 'bonus-1', status: 'in_progress', notes: 'n', updatedAt: T1 } as BonusProgressRecord,
  resourceStates: { resourceId: 'res-1', watched: true, pinnedWeek: 3, note: 'good', updatedAt: T1 } as ResourceStateRecord,
  studySessions: session('sess-1', T1),
  practiceLogs: {
    exerciseId: 'ex-1', week: 2, status: 'completed', evidenceUrl: 'https://example.com', notes: 'done', updatedAt: T1,
  } as PracticeLogRecord,
  projects: {
    id: 'proj-1', category: 'supplementary_personal', title: 'Churn model', competencyArea: 'ML',
    problemStatement: 'Predict churn', skills: ['python'], datasetSource: 'kaggle', milestones: ['[ ] EDA'],
    deliverables: 'Notebook', githubUrl: 'https://github.com/x/y', completionCriteria: 'AUC > 0.8',
    status: 'in_progress', provenance: 'UNVERIFIED', createdAt: T0, updatedAt: T1,
  } as ProjectRecord,
  weakConcepts: {
    id: 'weak-1', week: 3, topicId: 'w3-t2', title: 'Bias vs variance', notes: 'revisit',
    resolved: false, source: 'manual', createdAt: T0, updatedAt: T1,
  } as WeakConceptRecord,
  flashcardStates: { cardId: 'fc-1', status: 'known', reviewCount: 2, updatedAt: T1 } as FlashcardStateRecord,
  quizAttempts: { id: 'quiz-1', week: 2, score: 7, total: 10, missedTopicIds: ['w2-t1'], createdAt: T1 } as QuizAttemptRecord,
  journalEntries: {
    id: 'jrnl-1', date: '2026-01-02', week: 1, learnedToday: 'a', implemented: 'b', problemsEncountered: 'c',
    howSolved: 'd', unclearConcepts: 'e', mentorQuestions: 'f', mentorResolved: false, nextSession: 'g',
    createdAt: T0, updatedAt: T1,
  } as JournalEntryRecord,
  activityLogs: { id: 'act-1', type: 'topic', title: 'Completed topic', detail: 'x', week: 1, createdAt: T1 } as ActivityLogRecord,
};
