import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  ActivityLogRecord,
  AppDataState,
  AssignmentStatus,
  BonusModuleStatus,
  DayOfWeek,
  FlashcardMastery,
  JournalEntryRecord,
  NavSection,
  NextLearningTarget,
  PracticeLogRecord,
  ProjectRecord,
  RevisionStatus,
  SessionCategory,
  StudySessionRecord,
  TopicProgressRecord,
  TopicStatus,
  UserProfile,
  WeakConceptRecord,
} from '../types';
import {
  DATAMITES_PROGRAM_FACTS,
  getAllSubtopics,
  getCourseForWeek,
  getModulesForWeek,
  getSubtopicsForWeek,
  OFFICIAL_CURRICULUM,
} from '../data/curriculum';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
  signInWithGoogle,
  signOutUser,
} from '../lib/firebase';

const STORAGE_KEY = 'aiecc_state_v1';

export type SyncStatus = 'local_only' | 'syncing' | 'synced' | 'error';

export interface HighlightedStudyTarget {
  week: number;
  moduleId: string;
  subtopicId: string;
  nonce: number;
}

export interface ToastMessage {
  id: string;
  text: string;
  tone?: 'info' | 'success' | 'warning';
}

function nowIso(): string {
  return new Date().toISOString();
}

function makeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${rand}`;
}

function clampStr(val: string, maxLen: number): string {
  return String(val ?? '').slice(0, maxLen);
}

function clampInt(val: number, min: number, max: number): number {
  const n = Math.round(Number(val));
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function tsToIso(val: unknown, fallback: string): string {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'string' && val.length > 0) return val;
  return fallback;
}

export function createInitialState(): AppDataState {
  const ts = nowIso();
  return {
    version: 1,
    profile: {
      learnerName: 'AI Engineer Learner',
      onboardingCompleted: false,
      currentWeek: 1,
      weeklyLiveHours: DATAMITES_PROGRAM_FACTS.weeklyCommitment.liveTraining,
      weeklySelfStudyHours: DATAMITES_PROGRAM_FACTS.weeklyCommitment.selfLearningAndRevision,
      weeklyPracticeHours: DATAMITES_PROGRAM_FACTS.weeklyCommitment.assignmentsAndProjects,
      internshipIntakeDone: false,
      internshipMentoringHours: 0,
      internshipCertificateDone: false,
      internshipExperienceLetterDone: false,
      createdAt: ts,
      updatedAt: ts,
    },
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
  };
}

function loadLocalState(): AppDataState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as Partial<AppDataState>;
    const base = createInitialState();
    return {
      ...base,
      ...parsed,
      profile: {
        ...base.profile,
        ...(parsed.profile || {}),
      },
      topicProgress: parsed.topicProgress || {},
      bonusProgress: parsed.bonusProgress || {},
      resourceStates: parsed.resourceStates || {},
      studySessions: Array.isArray(parsed.studySessions) ? parsed.studySessions : [],
      practiceLogs: parsed.practiceLogs || {},
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      weakConcepts: Array.isArray(parsed.weakConcepts) ? parsed.weakConcepts : [],
      flashcardStates: parsed.flashcardStates || {},
      quizAttempts: Array.isArray(parsed.quizAttempts) ? parsed.quizAttempts : [],
      journalEntries: Array.isArray(parsed.journalEntries) ? parsed.journalEntries : [],
      activityLogs: Array.isArray(parsed.activityLogs) ? parsed.activityLogs : [],
    };
  } catch {
    return createInitialState();
  }
}

export function computeNextLearningTarget(
  state: AppDataState,
  weekOverride?: number
): NextLearningTarget {
  const week = clampInt(weekOverride ?? state.profile.currentWeek, 1, 20);
  const course = getCourseForWeek(week);
  const modules = getModulesForWeek(week);
  const orderedSubtopics = modules.flatMap((m) =>
    m.subtopics.map((s) => ({
      moduleId: m.id,
      moduleTitle: m.title,
      subtopicId: s.id,
      subtopicTitle: s.title,
    }))
  );

  const inProgress = orderedSubtopics.find(
    (s) => state.topicProgress[s.subtopicId]?.status === 'in_progress'
  );
  if (inProgress) {
    return {
      week,
      courseTitle: course.title,
      courseCode: course.courseCode,
      ...inProgress,
      reason: 'in_progress',
    };
  }

  const needsRevision = orderedSubtopics.find(
    (s) => state.topicProgress[s.subtopicId]?.status === 'needs_revision'
  );
  if (needsRevision) {
    return {
      week,
      courseTitle: course.title,
      courseCode: course.courseCode,
      ...needsRevision,
      reason: 'needs_revision',
    };
  }

  const nextNotDone = orderedSubtopics.find((s) => {
    const st = state.topicProgress[s.subtopicId]?.status ?? 'not_started';
    return st === 'not_started' || st === 'practised';
  });
  if (nextNotDone) {
    return {
      week,
      courseTitle: course.title,
      courseCode: course.courseCode,
      ...nextNotDone,
      reason: 'next_in_sequence',
    };
  }

  const fallback = orderedSubtopics[0] ?? {
    moduleId: modules[0]?.id ?? `w${week}-m1`,
    moduleTitle: modules[0]?.title ?? course.title,
    subtopicId: '',
    subtopicTitle: 'All subtopics in this week completed',
  };
  return {
    week,
    courseTitle: course.title,
    courseCode: course.courseCode,
    ...fallback,
    reason: 'week_complete',
  };
}

interface AppContextValue {
  state: AppDataState;
  activeSection: NavSection;
  setActiveSection: (section: NavSection) => void;
  selectedStudyWeek: number;
  setSelectedStudyWeek: (week: number) => void;
  highlightedTarget: HighlightedStudyTarget | null;
  clearHighlightedTarget: () => void;
  openStudyRoomForWeek: (week: number, moduleId?: string, subtopicId?: string) => void;
  continueLearning: () => void;
  nextLearningTarget: NextLearningTarget;
  showOnboardingModal: boolean;
  setShowOnboardingModal: (open: boolean) => void;

  // Auth & Sync
  user: User | null;
  authReady: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  syncError: string | null;
  handleGoogleSignIn: () => Promise<void>;
  handleSignOut: () => Promise<void>;
  syncNow: () => Promise<void>;

  // Toasts
  toasts: ToastMessage[];
  pushToast: (text: string, tone?: ToastMessage['tone']) => void;
  dismissToast: (id: string) => void;

  // Mutations
  completeOnboarding: (opts: {
    learnerName: string;
    currentWeek: number;
    markPriorCompleted: boolean;
    weeklyLiveHours: number;
    weeklySelfStudyHours: number;
    weeklyPracticeHours: number;
  }) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  updateTopicProgress: (
    topicId: string,
    week: number,
    patch: Partial<{
      status: TopicStatus;
      assignmentStatus: AssignmentStatus;
      revisionStatus: RevisionStatus;
      notes: string;
      evidenceUrl: string;
    }>
  ) => void;
  updateBonusProgress: (moduleId: string, status: BonusModuleStatus, notes?: string) => void;
  toggleResourceWatched: (resourceId: string, weekContext: number) => void;
  pinResourceToWeek: (resourceId: string, week: number, title: string) => void;
  addStudySession: (input: {
    week: number;
    day: DayOfWeek;
    title: string;
    category: SessionCategory;
    plannedMinutes: number;
    linkedRef?: string;
  }) => void;
  updateStudySession: (id: string, patch: Partial<StudySessionRecord>) => void;
  deleteStudySession: (id: string) => void;
  generateWeeklyPlanTemplate: (week: number) => void;
  updatePracticeLog: (
    exerciseId: string,
    week: number,
    patch: Partial<Pick<PracticeLogRecord, 'status' | 'evidenceUrl' | 'notes'>>
  ) => void;
  saveProject: (project: Omit<ProjectRecord, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string) => void;
  deleteProject: (id: string) => void;
  addWeakConcept: (input: {
    week: number;
    topicId?: string;
    title: string;
    notes?: string;
    source?: string;
  }) => void;
  toggleWeakConceptResolved: (id: string) => void;
  deleteWeakConcept: (id: string) => void;
  setFlashcardStatus: (cardId: string, status: FlashcardMastery, week: number) => void;
  recordQuizAttempt: (week: number, score: number, total: number, missedTopicIds: string[]) => void;
  saveJournalEntry: (
    entry: Omit<JournalEntryRecord, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => void;
  deleteJournalEntry: (id: string) => void;
  exportBackupJson: () => string;
  importBackupJson: (rawJson: string) => { ok: boolean; error?: string };
  resetAllProgress: () => void;
}

const AppStateContext = createContext<AppContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppDataState>(() => loadLocalState());
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [selectedStudyWeek, setSelectedStudyWeek] = useState<number>(() =>
    clampInt(loadLocalState().profile.currentWeek, 1, 20)
  );
  const [highlightedTarget, setHighlightedTarget] = useState<HighlightedStudyTarget | null>(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(
    () => !loadLocalState().profile.onboardingCompleted
  );

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local_only');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const stateRef = useRef(state);
  stateRef.current = state;

  const pushToast = useCallback((text: string, tone: ToastMessage['tone'] = 'info') => {
    const id = makeId('toast');
    setToasts((prev) => [...prev.slice(-3), { id, text, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Persist locally on every state update
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('Failed saving state to localStorage:', err);
    }
  }, [state]);

  const canSyncCloud = useCallback(
    (u: User | null): u is User => Boolean(u && u.emailVerified),
    []
  );

  // Cloud write helpers (matching firestore.rules strict allowlists & serverTimestamp)
  const syncProfileToCloud = useCallback(async (uid: string, profile: UserProfile) => {
    const ref = doc(db, 'users', uid);
    try {
      const snap = await getDoc(ref);
      const mutable = {
        learnerName: clampStr(profile.learnerName || 'AI Engineer Learner', 100),
        onboardingCompleted: Boolean(profile.onboardingCompleted),
        currentWeek: clampInt(profile.currentWeek, 1, 20),
        weeklyLiveHours: Math.max(0, Math.min(60, Number(profile.weeklyLiveHours) || 0)),
        weeklySelfStudyHours: Math.max(0, Math.min(60, Number(profile.weeklySelfStudyHours) || 0)),
        weeklyPracticeHours: Math.max(0, Math.min(60, Number(profile.weeklyPracticeHours) || 0)),
        internshipIntakeDone: Boolean(profile.internshipIntakeDone),
        internshipMentoringHours: Math.max(0, Math.min(200, Number(profile.internshipMentoringHours) || 0)),
        internshipCertificateDone: Boolean(profile.internshipCertificateDone),
        internshipExperienceLetterDone: Boolean(profile.internshipExperienceLetterDone),
        updatedAt: serverTimestamp(),
      };
      if (snap.exists()) {
        await updateDoc(ref, mutable);
      } else {
        await setDoc(ref, {
          ownerId: uid,
          ...mutable,
          createdAt: serverTimestamp(),
        });
      }
      setLastSyncedAt(nowIso());
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
      setSyncError(err instanceof Error ? err.message : 'Cloud sync failed');
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
    }
  }, []);

  const syncTopicToCloud = useCallback(async (uid: string, rec: TopicProgressRecord) => {
    const path = `users/${uid}/topicProgress/${rec.topicId}`;
    try {
      await setDoc(doc(db, 'users', uid, 'topicProgress', rec.topicId), {
        ownerId: uid,
        topicId: rec.topicId,
        week: clampInt(rec.week, 1, 20),
        status: rec.status,
        assignmentStatus: rec.assignmentStatus,
        revisionStatus: rec.revisionStatus,
        notes: clampStr(rec.notes, 4000),
        evidenceUrl: clampStr(rec.evidenceUrl, 500),
        updatedAt: serverTimestamp(),
      });
      setLastSyncedAt(nowIso());
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }, []);

  const syncBonusToCloud = useCallback(
    async (uid: string, moduleId: string, status: BonusModuleStatus, notes: string) => {
      const path = `users/${uid}/bonusProgress/${moduleId}`;
      try {
        await setDoc(doc(db, 'users', uid, 'bonusProgress', moduleId), {
          ownerId: uid,
          moduleId,
          status,
          notes: clampStr(notes, 2000),
          updatedAt: serverTimestamp(),
        });
        setLastSyncedAt(nowIso());
      } catch (err) {
        setSyncStatus('error');
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    },
    []
  );

  const syncResourceToCloud = useCallback(
    async (uid: string, resourceId: string, watched: boolean, pinnedWeek: number, note: string) => {
      const path = `users/${uid}/resourceStates/${resourceId}`;
      try {
        await setDoc(doc(db, 'users', uid, 'resourceStates', resourceId), {
          ownerId: uid,
          resourceId,
          watched: Boolean(watched),
          pinnedWeek: clampInt(pinnedWeek, 0, 20),
          note: clampStr(note, 1000),
          updatedAt: serverTimestamp(),
        });
        setLastSyncedAt(nowIso());
      } catch (err) {
        setSyncStatus('error');
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    },
    []
  );

  const syncStudySessionToCloud = useCallback(async (uid: string, session: StudySessionRecord, isNew: boolean) => {
    const path = `users/${uid}/studySessions/${session.id}`;
    const ref = doc(db, 'users', uid, 'studySessions', session.id);
    const mutable = {
      week: clampInt(session.week, 1, 20),
      day: session.day,
      title: clampStr(session.title || 'Study Session', 200),
      category: session.category,
      plannedMinutes: clampInt(session.plannedMinutes, 5, 600),
      completed: Boolean(session.completed),
      linkedRef: clampStr(session.linkedRef, 200),
      updatedAt: serverTimestamp(),
    };
    try {
      if (isNew) {
        await setDoc(ref, { ownerId: uid, ...mutable, createdAt: serverTimestamp() });
      } else {
        const snap = await getDoc(ref);
        if (snap.exists()) {
          await updateDoc(ref, mutable);
        } else {
          await setDoc(ref, { ownerId: uid, ...mutable, createdAt: serverTimestamp() });
        }
      }
      setLastSyncedAt(nowIso());
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }, []);

  const syncPracticeToCloud = useCallback(async (uid: string, log: PracticeLogRecord) => {
    const path = `users/${uid}/practiceLogs/${log.exerciseId}`;
    try {
      await setDoc(doc(db, 'users', uid, 'practiceLogs', log.exerciseId), {
        ownerId: uid,
        exerciseId: log.exerciseId,
        week: clampInt(log.week, 1, 20),
        status: log.status,
        evidenceUrl: clampStr(log.evidenceUrl, 500),
        notes: clampStr(log.notes, 3000),
        updatedAt: serverTimestamp(),
      });
      setLastSyncedAt(nowIso());
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }, []);

  const syncProjectToCloud = useCallback(async (uid: string, proj: ProjectRecord, isNew: boolean) => {
    const path = `users/${uid}/projects/${proj.id}`;
    const ref = doc(db, 'users', uid, 'projects', proj.id);
    const mutable = {
      category: proj.category,
      title: clampStr(proj.title || 'Untitled Project', 200),
      competencyArea: clampStr(proj.competencyArea, 120),
      problemStatement: clampStr(proj.problemStatement, 2000),
      skills: proj.skills.slice(0, 20).map((s) => clampStr(s, 200)),
      datasetSource: clampStr(proj.datasetSource, 300),
      milestones: proj.milestones.slice(0, 20).map((m) => clampStr(m, 200)),
      deliverables: clampStr(proj.deliverables, 1500),
      githubUrl: clampStr(proj.githubUrl, 500),
      completionCriteria: clampStr(proj.completionCriteria, 1500),
      status: proj.status,
      provenance: proj.provenance,
      updatedAt: serverTimestamp(),
    };
    try {
      if (isNew) {
        await setDoc(ref, { ownerId: uid, ...mutable, createdAt: serverTimestamp() });
      } else {
        const snap = await getDoc(ref);
        if (snap.exists()) {
          await updateDoc(ref, mutable);
        } else {
          await setDoc(ref, { ownerId: uid, ...mutable, createdAt: serverTimestamp() });
        }
      }
      setLastSyncedAt(nowIso());
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }, []);

  const syncWeakConceptToCloud = useCallback(async (uid: string, item: WeakConceptRecord, isNew: boolean) => {
    const path = `users/${uid}/weakConcepts/${item.id}`;
    const ref = doc(db, 'users', uid, 'weakConcepts', item.id);
    const mutable = {
      week: clampInt(item.week, 1, 20),
      topicId: clampStr(item.topicId, 128),
      title: clampStr(item.title || 'Concept to review', 200),
      notes: clampStr(item.notes, 2000),
      resolved: Boolean(item.resolved),
      source: clampStr(item.source || 'manual', 80),
      updatedAt: serverTimestamp(),
    };
    try {
      if (isNew) {
        await setDoc(ref, { ownerId: uid, ...mutable, createdAt: serverTimestamp() });
      } else {
        const snap = await getDoc(ref);
        if (snap.exists()) {
          await updateDoc(ref, mutable);
        } else {
          await setDoc(ref, { ownerId: uid, ...mutable, createdAt: serverTimestamp() });
        }
      }
      setLastSyncedAt(nowIso());
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }, []);

  const syncFlashcardToCloud = useCallback(
    async (uid: string, cardId: string, status: FlashcardMastery, reviewCount: number) => {
      const path = `users/${uid}/flashcardStates/${cardId}`;
      try {
        await setDoc(doc(db, 'users', uid, 'flashcardStates', cardId), {
          ownerId: uid,
          cardId,
          status,
          reviewCount: clampInt(reviewCount, 0, 10000),
          updatedAt: serverTimestamp(),
        });
        setLastSyncedAt(nowIso());
      } catch (err) {
        setSyncStatus('error');
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    },
    []
  );

  const syncQuizAttemptToCloud = useCallback(
    async (uid: string, attempt: { id: string; week: number; score: number; total: number; missedTopicIds: string[] }) => {
      const path = `users/${uid}/quizAttempts/${attempt.id}`;
      try {
        await setDoc(doc(db, 'users', uid, 'quizAttempts', attempt.id), {
          ownerId: uid,
          week: clampInt(attempt.week, 1, 20),
          score: clampInt(attempt.score, 0, 100),
          total: clampInt(attempt.total, 1, 100),
          missedTopicIds: attempt.missedTopicIds.slice(0, 50).map((s) => clampStr(s, 200)),
          createdAt: serverTimestamp(),
        });
        setLastSyncedAt(nowIso());
      } catch (err) {
        setSyncStatus('error');
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    []
  );

  const syncJournalToCloud = useCallback(async (uid: string, entry: JournalEntryRecord, isNew: boolean) => {
    const path = `users/${uid}/journalEntries/${entry.id}`;
    const ref = doc(db, 'users', uid, 'journalEntries', entry.id);
    const mutable = {
      date: clampStr(entry.date, 32),
      week: clampInt(entry.week, 1, 20),
      learnedToday: clampStr(entry.learnedToday, 3000),
      implemented: clampStr(entry.implemented, 3000),
      problemsEncountered: clampStr(entry.problemsEncountered, 3000),
      howSolved: clampStr(entry.howSolved, 3000),
      unclearConcepts: clampStr(entry.unclearConcepts, 3000),
      mentorQuestions: clampStr(entry.mentorQuestions, 3000),
      mentorResolved: Boolean(entry.mentorResolved),
      nextSession: clampStr(entry.nextSession, 2000),
      updatedAt: serverTimestamp(),
    };
    try {
      if (isNew) {
        await setDoc(ref, { ownerId: uid, ...mutable, createdAt: serverTimestamp() });
      } else {
        const snap = await getDoc(ref);
        if (snap.exists()) {
          await updateDoc(ref, mutable);
        } else {
          await setDoc(ref, { ownerId: uid, ...mutable, createdAt: serverTimestamp() });
        }
      }
      setLastSyncedAt(nowIso());
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }, []);

  const syncActivityToCloud = useCallback(async (uid: string, log: ActivityLogRecord) => {
    const path = `users/${uid}/activityLogs/${log.id}`;
    try {
      await setDoc(doc(db, 'users', uid, 'activityLogs', log.id), {
        ownerId: uid,
        type: log.type,
        title: clampStr(log.title, 200),
        detail: clampStr(log.detail, 300),
        week: clampInt(log.week, 1, 20),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      // Activity log is non-blocking auxiliary audit
      console.warn('Activity log cloud write skipped:', err);
    }
  }, []);

  const pullFromCloudAndMerge = useCallback(async (u: User) => {
    if (!u.emailVerified) {
      setSyncStatus('local_only');
      return;
    }
    setSyncStatus('syncing');
    setSyncError(null);
    const uid = u.uid;
    try {
      const userSnap = await getDoc(doc(db, 'users', uid));
      const fetchSub = async (sub: string) => {
        const q = query(collection(db, 'users', uid, sub), where('ownerId', '==', uid));
        return getDocs(q);
      };

      const [
        topicSnap,
        bonusSnap,
        resSnap,
        sessSnap,
        pracSnap,
        projSnap,
        weakSnap,
        fcSnap,
        quizSnap,
        jourSnap,
        actSnap,
      ] = await Promise.all([
        fetchSub('topicProgress'),
        fetchSub('bonusProgress'),
        fetchSub('resourceStates'),
        fetchSub('studySessions'),
        fetchSub('practiceLogs'),
        fetchSub('projects'),
        fetchSub('weakConcepts'),
        fetchSub('flashcardStates'),
        fetchSub('quizAttempts'),
        fetchSub('journalEntries'),
        fetchSub('activityLogs'),
      ]);

      const local = stateRef.current;

      // If cloud has no profile yet, push local state up to initialize cloud
      if (!userSnap.exists()) {
        await syncProfileToCloud(uid, local.profile);
        await Promise.all([
          ...Object.values(local.topicProgress).map((t) => syncTopicToCloud(uid, t)),
          ...Object.values(local.bonusProgress).map((b) => syncBonusToCloud(uid, b.moduleId, b.status, b.notes)),
          ...Object.values(local.resourceStates).map((r) =>
            syncResourceToCloud(uid, r.resourceId, r.watched, r.pinnedWeek, r.note)
          ),
          ...local.studySessions.map((s) => syncStudySessionToCloud(uid, s, true)),
          ...Object.values(local.practiceLogs).map((p) => syncPracticeToCloud(uid, p)),
          ...local.projects.map((p) => syncProjectToCloud(uid, p, true)),
          ...local.weakConcepts.map((w) => syncWeakConceptToCloud(uid, w, true)),
          ...Object.values(local.flashcardStates).map((f) =>
            syncFlashcardToCloud(uid, f.cardId, f.status, f.reviewCount)
          ),
          ...local.journalEntries.map((j) => syncJournalToCloud(uid, j, true)),
        ]);
        setSyncStatus('synced');
        setLastSyncedAt(nowIso());
        return;
      }

      const cloudProfileData = userSnap.data();
      const mergedProfile: UserProfile = {
        learnerName: cloudProfileData.learnerName || local.profile.learnerName,
        onboardingCompleted: Boolean(cloudProfileData.onboardingCompleted),
        currentWeek: clampInt(cloudProfileData.currentWeek, 1, 20),
        weeklyLiveHours: Number(cloudProfileData.weeklyLiveHours ?? 8),
        weeklySelfStudyHours: Number(cloudProfileData.weeklySelfStudyHours ?? 8),
        weeklyPracticeHours: Number(cloudProfileData.weeklyPracticeHours ?? 4),
        internshipIntakeDone: Boolean(cloudProfileData.internshipIntakeDone),
        internshipMentoringHours: Number(cloudProfileData.internshipMentoringHours ?? 0),
        internshipCertificateDone: Boolean(cloudProfileData.internshipCertificateDone),
        internshipExperienceLetterDone: Boolean(cloudProfileData.internshipExperienceLetterDone),
        createdAt: tsToIso(cloudProfileData.createdAt, local.profile.createdAt),
        updatedAt: tsToIso(cloudProfileData.updatedAt, nowIso()),
      };

      const topicProgress = { ...local.topicProgress };
      topicSnap.forEach((d) => {
        const data = d.data();
        topicProgress[d.id] = {
          topicId: data.topicId,
          week: data.week,
          status: data.status,
          assignmentStatus: data.assignmentStatus,
          revisionStatus: data.revisionStatus,
          notes: data.notes || '',
          evidenceUrl: data.evidenceUrl || '',
          updatedAt: tsToIso(data.updatedAt, nowIso()),
        };
      });

      const bonusProgress = { ...local.bonusProgress };
      bonusSnap.forEach((d) => {
        const data = d.data();
        bonusProgress[d.id] = {
          moduleId: data.moduleId,
          status: data.status,
          notes: data.notes || '',
          updatedAt: tsToIso(data.updatedAt, nowIso()),
        };
      });

      const resourceStates = { ...local.resourceStates };
      resSnap.forEach((d) => {
        const data = d.data();
        resourceStates[d.id] = {
          resourceId: data.resourceId,
          watched: Boolean(data.watched),
          pinnedWeek: Number(data.pinnedWeek || 0),
          note: data.note || '',
          updatedAt: tsToIso(data.updatedAt, nowIso()),
        };
      });

      const sessMap = new Map(local.studySessions.map((s) => [s.id, s]));
      sessSnap.forEach((d) => {
        const data = d.data();
        sessMap.set(d.id, {
          id: d.id,
          week: data.week,
          day: data.day,
          title: data.title,
          category: data.category,
          plannedMinutes: data.plannedMinutes,
          completed: Boolean(data.completed),
          linkedRef: data.linkedRef || '',
          createdAt: tsToIso(data.createdAt, nowIso()),
          updatedAt: tsToIso(data.updatedAt, nowIso()),
        });
      });

      const practiceLogs = { ...local.practiceLogs };
      pracSnap.forEach((d) => {
        const data = d.data();
        practiceLogs[d.id] = {
          exerciseId: data.exerciseId,
          week: data.week,
          status: data.status,
          evidenceUrl: data.evidenceUrl || '',
          notes: data.notes || '',
          updatedAt: tsToIso(data.updatedAt, nowIso()),
        };
      });

      const projMap = new Map(local.projects.map((p) => [p.id, p]));
      projSnap.forEach((d) => {
        const data = d.data();
        projMap.set(d.id, {
          id: d.id,
          category: data.category,
          title: data.title,
          competencyArea: data.competencyArea || '',
          problemStatement: data.problemStatement || '',
          skills: Array.isArray(data.skills) ? data.skills : [],
          datasetSource: data.datasetSource || '',
          milestones: Array.isArray(data.milestones) ? data.milestones : [],
          deliverables: data.deliverables || '',
          githubUrl: data.githubUrl || '',
          completionCriteria: data.completionCriteria || '',
          status: data.status,
          provenance: data.provenance,
          createdAt: tsToIso(data.createdAt, nowIso()),
          updatedAt: tsToIso(data.updatedAt, nowIso()),
        });
      });

      const weakMap = new Map(local.weakConcepts.map((w) => [w.id, w]));
      weakSnap.forEach((d) => {
        const data = d.data();
        weakMap.set(d.id, {
          id: d.id,
          week: data.week,
          topicId: data.topicId || '',
          title: data.title,
          notes: data.notes || '',
          resolved: Boolean(data.resolved),
          source: data.source || 'manual',
          createdAt: tsToIso(data.createdAt, nowIso()),
          updatedAt: tsToIso(data.updatedAt, nowIso()),
        });
      });

      const flashcardStates = { ...local.flashcardStates };
      fcSnap.forEach((d) => {
        const data = d.data();
        flashcardStates[d.id] = {
          cardId: data.cardId,
          status: data.status,
          reviewCount: Number(data.reviewCount || 0),
          updatedAt: tsToIso(data.updatedAt, nowIso()),
        };
      });

      const quizMap = new Map(local.quizAttempts.map((q) => [q.id, q]));
      quizSnap.forEach((d) => {
        const data = d.data();
        quizMap.set(d.id, {
          id: d.id,
          week: data.week,
          score: data.score,
          total: data.total,
          missedTopicIds: Array.isArray(data.missedTopicIds) ? data.missedTopicIds : [],
          createdAt: tsToIso(data.createdAt, nowIso()),
        });
      });

      const jourMap = new Map(local.journalEntries.map((j) => [j.id, j]));
      jourSnap.forEach((d) => {
        const data = d.data();
        jourMap.set(d.id, {
          id: d.id,
          date: data.date,
          week: data.week,
          learnedToday: data.learnedToday || '',
          implemented: data.implemented || '',
          problemsEncountered: data.problemsEncountered || '',
          howSolved: data.howSolved || '',
          unclearConcepts: data.unclearConcepts || '',
          mentorQuestions: data.mentorQuestions || '',
          mentorResolved: Boolean(data.mentorResolved),
          nextSession: data.nextSession || '',
          createdAt: tsToIso(data.createdAt, nowIso()),
          updatedAt: tsToIso(data.updatedAt, nowIso()),
        });
      });

      const actMap = new Map(local.activityLogs.map((a) => [a.id, a]));
      actSnap.forEach((d) => {
        const data = d.data();
        actMap.set(d.id, {
          id: d.id,
          type: data.type,
          title: data.title,
          detail: data.detail || '',
          week: data.week,
          createdAt: tsToIso(data.createdAt, nowIso()),
        });
      });

      setState({
        version: 1,
        profile: mergedProfile,
        topicProgress,
        bonusProgress,
        resourceStates,
        studySessions: Array.from(sessMap.values()),
        practiceLogs,
        projects: Array.from(projMap.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
        weakConcepts: Array.from(weakMap.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
        flashcardStates,
        quizAttempts: Array.from(quizMap.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        journalEntries: Array.from(jourMap.values()).sort((a, b) => b.date.localeCompare(a.date)),
        activityLogs: Array.from(actMap.values())
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 60),
      });

      if (mergedProfile.onboardingCompleted) {
        setShowOnboardingModal(false);
        setSelectedStudyWeek(mergedProfile.currentWeek);
      }

      setSyncStatus('synced');
      setLastSyncedAt(nowIso());
    } catch (err) {
      setSyncStatus('error');
      setSyncError(err instanceof Error ? err.message : 'Unable to sync with Firebase');
      console.error('Firebase sync failed; continuing with localStorage fallback:', err);
    }
  }, [
    syncBonusToCloud,
    syncFlashcardToCloud,
    syncJournalToCloud,
    syncPracticeToCloud,
    syncProfileToCloud,
    syncProjectToCloud,
    syncResourceToCloud,
    syncStudySessionToCloud,
    syncTopicToCloud,
    syncWeakConceptToCloud,
  ]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
      if (u && u.emailVerified) {
        void pullFromCloudAndMerge(u);
      } else {
        setSyncStatus('local_only');
      }
    });
    return () => unsub();
  }, [pullFromCloudAndMerge]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setSyncError(null);
      await signInWithGoogle();
      pushToast('Signed in with Google. Cloud sync enabled.', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in cancelled or failed';
      setSyncError(msg);
      pushToast('Google sign-in did not complete. Local storage stays active.', 'warning');
    }
  }, [pushToast]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOutUser();
      setSyncStatus('local_only');
      pushToast('Signed out. Progress continues saving locally.', 'info');
    } catch {
      pushToast('Could not sign out cleanly.', 'warning');
    }
  }, [pushToast]);

  const syncNow = useCallback(async () => {
    if (!canSyncCloud(user)) {
      pushToast('Sign in with Google in Settings to enable Firebase cloud sync.', 'info');
      return;
    }
    await pullFromCloudAndMerge(user);
    pushToast('Cloud sync complete.', 'success');
  }, [canSyncCloud, pullFromCloudAndMerge, pushToast, user]);

  const appendActivity = useCallback(
    (type: ActivityLogRecord['type'], title: string, detail: string, week: number) => {
      const log: ActivityLogRecord = {
        id: makeId('act'),
        type,
        title: clampStr(title, 200),
        detail: clampStr(detail, 300),
        week: clampInt(week, 1, 20),
        createdAt: nowIso(),
      };
      setState((prev) => ({
        ...prev,
        activityLogs: [log, ...prev.activityLogs].slice(0, 60),
      }));
      if (canSyncCloud(user)) {
        void syncActivityToCloud(user.uid, log);
      }
    },
    [canSyncCloud, syncActivityToCloud, user]
  );

  const nextLearningTarget = useMemo(() => computeNextLearningTarget(state), [state]);

  const openStudyRoomForWeek = useCallback((week: number, moduleId?: string, subtopicId?: string) => {
    const safeWeek = clampInt(week, 1, 20);
    setSelectedStudyWeek(safeWeek);
    setActiveSection('study-room');
    if (moduleId && subtopicId) {
      setHighlightedTarget({ week: safeWeek, moduleId, subtopicId, nonce: Date.now() });
    } else {
      setHighlightedTarget(null);
    }
  }, []);

  const continueLearning = useCallback(() => {
    const target = computeNextLearningTarget(stateRef.current);
    setSelectedStudyWeek(target.week);
    setActiveSection('study-room');
    setHighlightedTarget({
      week: target.week,
      moduleId: target.moduleId,
      subtopicId: target.subtopicId,
      nonce: Date.now(),
    });
  }, []);

  const clearHighlightedTarget = useCallback(() => {
    setHighlightedTarget(null);
  }, []);

  const completeOnboarding = useCallback(
    (opts: {
      learnerName: string;
      currentWeek: number;
      markPriorCompleted: boolean;
      weeklyLiveHours: number;
      weeklySelfStudyHours: number;
      weeklyPracticeHours: number;
    }) => {
      const ts = nowIso();
      const safeWeek = clampInt(opts.currentWeek, 1, 20);
      const nextProfile: UserProfile = {
        ...stateRef.current.profile,
        learnerName: clampStr(opts.learnerName.trim() || 'AI Engineer Learner', 100),
        onboardingCompleted: true,
        currentWeek: safeWeek,
        weeklyLiveHours: opts.weeklyLiveHours,
        weeklySelfStudyHours: opts.weeklySelfStudyHours,
        weeklyPracticeHours: opts.weeklyPracticeHours,
        updatedAt: ts,
      };

      const updatedTopics: Record<string, TopicProgressRecord> = { ...stateRef.current.topicProgress };
      const bulkTopicsToSync: TopicProgressRecord[] = [];
      if (opts.markPriorCompleted && safeWeek > 1) {
        const allSubs = getAllSubtopics();
        for (const sub of allSubs) {
          if (sub.week < safeWeek) {
            const existing = updatedTopics[sub.id];
            if (!existing || existing.status === 'not_started') {
              const rec: TopicProgressRecord = {
                topicId: sub.id,
                week: sub.week,
                status: 'complete',
                assignmentStatus: existing?.assignmentStatus ?? 'reviewed',
                revisionStatus: existing?.revisionStatus ?? 'revised',
                notes: existing?.notes ?? '',
                evidenceUrl: existing?.evidenceUrl ?? '',
                updatedAt: ts,
              };
              updatedTopics[sub.id] = rec;
              bulkTopicsToSync.push(rec);
            }
          }
        }
      }

      setState((prev) => ({
        ...prev,
        profile: nextProfile,
        topicProgress: updatedTopics,
      }));
      setShowOnboardingModal(false);
      setSelectedStudyWeek(safeWeek);
      setActiveSection('study-room');

      const target = computeNextLearningTarget(
        { ...stateRef.current, profile: nextProfile, topicProgress: updatedTopics },
        safeWeek
      );
      setHighlightedTarget({
        week: safeWeek,
        moduleId: target.moduleId,
        subtopicId: target.subtopicId,
        nonce: Date.now(),
      });

      pushToast(`Workspace configured for Week ${safeWeek}.`, 'success');

      if (canSyncCloud(user)) {
        void syncProfileToCloud(user.uid, nextProfile);
        bulkTopicsToSync.forEach((rec) => void syncTopicToCloud(user.uid, rec));
      }
    },
    [canSyncCloud, pushToast, syncProfileToCloud, syncTopicToCloud, user]
  );

  const updateProfile = useCallback(
    (patch: Partial<UserProfile>) => {
      const next: UserProfile = {
        ...stateRef.current.profile,
        ...patch,
        currentWeek: clampInt(patch.currentWeek ?? stateRef.current.profile.currentWeek, 1, 20),
        updatedAt: nowIso(),
      };
      setState((prev) => ({ ...prev, profile: next }));
      if (patch.currentWeek !== undefined) {
        setSelectedStudyWeek(next.currentWeek);
      }
      if (canSyncCloud(user)) {
        void syncProfileToCloud(user.uid, next);
      }
    },
    [canSyncCloud, syncProfileToCloud, user]
  );

  const updateTopicProgress = useCallback(
    (
      topicId: string,
      week: number,
      patch: Partial<{
        status: TopicStatus;
        assignmentStatus: AssignmentStatus;
        revisionStatus: RevisionStatus;
        notes: string;
        evidenceUrl: string;
      }>
    ) => {
      const existing = stateRef.current.topicProgress[topicId];
      const next: TopicProgressRecord = {
        topicId,
        week: clampInt(week, 1, 20),
        status: patch.status ?? existing?.status ?? 'not_started',
        assignmentStatus: patch.assignmentStatus ?? existing?.assignmentStatus ?? 'not_started',
        revisionStatus: patch.revisionStatus ?? existing?.revisionStatus ?? 'none',
        notes: patch.notes !== undefined ? patch.notes : existing?.notes ?? '',
        evidenceUrl: patch.evidenceUrl !== undefined ? patch.evidenceUrl : existing?.evidenceUrl ?? '',
        updatedAt: nowIso(),
      };
      setState((prev) => ({
        ...prev,
        topicProgress: { ...prev.topicProgress, [topicId]: next },
      }));

      if (patch.status && patch.status !== existing?.status) {
        const sub = getAllSubtopics().find((s) => s.id === topicId);
        appendActivity(
          'topic',
          `Topic marked ${patch.status.replace('_', ' ')}`,
          sub?.title || topicId,
          week
        );
      }

      if (canSyncCloud(user)) {
        void syncTopicToCloud(user.uid, next);
      }
    },
    [appendActivity, canSyncCloud, syncTopicToCloud, user]
  );

  const updateBonusProgress = useCallback(
    (moduleId: string, status: BonusModuleStatus, notes?: string) => {
      const existing = stateRef.current.bonusProgress[moduleId];
      const nextNotes = notes !== undefined ? notes : existing?.notes ?? '';
      setState((prev) => ({
        ...prev,
        bonusProgress: {
          ...prev.bonusProgress,
          [moduleId]: {
            moduleId,
            status,
            notes: nextNotes,
            updatedAt: nowIso(),
          },
        },
      }));
      if (canSyncCloud(user)) {
        void syncBonusToCloud(user.uid, moduleId, status, nextNotes);
      }
    },
    [canSyncCloud, syncBonusToCloud, user]
  );

  const toggleResourceWatched = useCallback(
    (resourceId: string, weekContext: number) => {
      const existing = stateRef.current.resourceStates[resourceId];
      const nextWatched = !existing?.watched;
      const nextPinned = existing?.pinnedWeek ?? 0;
      const nextNote = existing?.note ?? '';
      setState((prev) => ({
        ...prev,
        resourceStates: {
          ...prev.resourceStates,
          [resourceId]: {
            resourceId,
            watched: nextWatched,
            pinnedWeek: nextPinned,
            note: nextNote,
            updatedAt: nowIso(),
          },
        },
      }));
      if (nextWatched) {
        appendActivity('resource', 'Supplementary lecture watched', resourceId, weekContext);
      }
      if (canSyncCloud(user)) {
        void syncResourceToCloud(user.uid, resourceId, nextWatched, nextPinned, nextNote);
      }
    },
    [appendActivity, canSyncCloud, syncResourceToCloud, user]
  );

  const pinResourceToWeek = useCallback(
    (resourceId: string, week: number, title: string) => {
      const safeWeek = clampInt(week, 1, 20);
      const existing = stateRef.current.resourceStates[resourceId];
      const nextWatched = existing?.watched ?? false;
      const nextNote = existing?.note ?? '';
      const nextPinned = existing?.pinnedWeek === safeWeek ? 0 : safeWeek;
      setState((prev) => ({
        ...prev,
        resourceStates: {
          ...prev.resourceStates,
          [resourceId]: {
            resourceId,
            watched: nextWatched,
            pinnedWeek: nextPinned,
            note: nextNote,
            updatedAt: nowIso(),
          },
        },
      }));
      if (nextPinned > 0) {
        pushToast(`Pinned to Week ${safeWeek} Learning Plan`, 'success');
        const ts = nowIso();
        const session: StudySessionRecord = {
          id: makeId('sess'),
          week: safeWeek,
          day: 'Sat',
          title: clampStr(`Supplement: ${title}`, 200),
          category: 'supplementary',
          plannedMinutes: 45,
          completed: false,
          linkedRef: resourceId,
          createdAt: ts,
          updatedAt: ts,
        };
        setState((prev) => ({
          ...prev,
          studySessions: [...prev.studySessions, session],
        }));
        if (canSyncCloud(user)) {
          void syncStudySessionToCloud(user.uid, session, true);
        }
      } else {
        pushToast('Unpinned from Learning Plan', 'info');
      }
      if (canSyncCloud(user)) {
        void syncResourceToCloud(user.uid, resourceId, nextWatched, nextPinned, nextNote);
      }
    },
    [canSyncCloud, pushToast, syncResourceToCloud, syncStudySessionToCloud, user]
  );

  const addStudySession = useCallback(
    (input: {
      week: number;
      day: DayOfWeek;
      title: string;
      category: SessionCategory;
      plannedMinutes: number;
      linkedRef?: string;
    }) => {
      const ts = nowIso();
      const session: StudySessionRecord = {
        id: makeId('sess'),
        week: clampInt(input.week, 1, 20),
        day: input.day,
        title: clampStr(input.title.trim() || 'Study Session', 200),
        category: input.category,
        plannedMinutes: clampInt(input.plannedMinutes, 5, 600),
        completed: false,
        linkedRef: clampStr(input.linkedRef ?? '', 200),
        createdAt: ts,
        updatedAt: ts,
      };
      setState((prev) => ({
        ...prev,
        studySessions: [...prev.studySessions, session],
      }));
      appendActivity('plan', 'Scheduled study session', `${session.day} · ${session.title}`, session.week);
      if (canSyncCloud(user)) {
        void syncStudySessionToCloud(user.uid, session, true);
      }
    },
    [appendActivity, canSyncCloud, syncStudySessionToCloud, user]
  );

  const updateStudySession = useCallback(
    (id: string, patch: Partial<StudySessionRecord>) => {
      let updated: StudySessionRecord | null = null;
      setState((prev) => ({
        ...prev,
        studySessions: prev.studySessions.map((s) => {
          if (s.id !== id) return s;
          updated = { ...s, ...patch, updatedAt: nowIso() };
          return updated;
        }),
      }));
      if (updated && canSyncCloud(user)) {
        void syncStudySessionToCloud(user.uid, updated, false);
      }
    },
    [canSyncCloud, syncStudySessionToCloud, user]
  );

  const deleteStudySession = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        studySessions: prev.studySessions.filter((s) => s.id !== id),
      }));
      if (canSyncCloud(user)) {
        void deleteDoc(doc(db, 'users', user.uid, 'studySessions', id)).catch((err) =>
          handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/studySessions/${id}`)
        );
      }
    },
    [canSyncCloud, user]
  );

  const generateWeeklyPlanTemplate = useCallback(
    (week: number) => {
      const safeWeek = clampInt(week, 1, 20);
      const course = getCourseForWeek(safeWeek);
      const mods = getModulesForWeek(safeWeek);
      const m1 = mods[0]?.title || course.title;
      const m2 = mods[1]?.title || mods[0]?.title || course.title;
      const ts = nowIso();

      const template: Omit<StudySessionRecord, 'id' | 'createdAt' | 'updatedAt'>[] = [
        { week: safeWeek, day: 'Mon', title: `DataMites Live Class — ${m1}`, category: 'live_class', plannedMinutes: 120, completed: false, linkedRef: course.courseCode },
        { week: safeWeek, day: 'Tue', title: `Self-Study & Concept Notes — ${m1}`, category: 'self_study', plannedMinutes: 120, completed: false, linkedRef: course.courseCode },
        { week: safeWeek, day: 'Wed', title: `DataMites Live Class — ${m2}`, category: 'live_class', plannedMinutes: 120, completed: false, linkedRef: course.courseCode },
        { week: safeWeek, day: 'Thu', title: `Essential Supplementary Reinforcement`, category: 'supplementary', plannedMinutes: 120, completed: false, linkedRef: `week-${safeWeek}` },
        { week: safeWeek, day: 'Fri', title: `Hands-On Coding / Notebook Practice`, category: 'practice', plannedMinutes: 120, completed: false, linkedRef: `week-${safeWeek}` },
        { week: safeWeek, day: 'Sat', title: `Live Lab & Practical Deliverable`, category: 'live_class', plannedMinutes: 240, completed: false, linkedRef: course.courseCode },
        { week: safeWeek, day: 'Sun', title: `Weekly Flashcards, Quiz & Journal Review`, category: 'revision', plannedMinutes: 120, completed: false, linkedRef: `week-${safeWeek}` },
      ];

      const created: StudySessionRecord[] = template.map((t, idx) => ({
        ...t,
        id: makeId(`tpl${idx}`),
        createdAt: ts,
        updatedAt: ts,
      }));

      setState((prev) => ({
        ...prev,
        studySessions: [...prev.studySessions, ...created],
      }));
      pushToast(`Generated brochure-aligned schedule for Week ${safeWeek}.`, 'success');
      if (canSyncCloud(user)) {
        created.forEach((s) => void syncStudySessionToCloud(user.uid, s, true));
      }
    },
    [canSyncCloud, pushToast, syncStudySessionToCloud, user]
  );

  const updatePracticeLog = useCallback(
    (
      exerciseId: string,
      week: number,
      patch: Partial<Pick<PracticeLogRecord, 'status' | 'evidenceUrl' | 'notes'>>
    ) => {
      const existing = stateRef.current.practiceLogs[exerciseId];
      const next: PracticeLogRecord = {
        exerciseId,
        week: clampInt(week, 1, 20),
        status: patch.status ?? existing?.status ?? 'not_started',
        evidenceUrl: patch.evidenceUrl !== undefined ? patch.evidenceUrl : existing?.evidenceUrl ?? '',
        notes: patch.notes !== undefined ? patch.notes : existing?.notes ?? '',
        updatedAt: nowIso(),
      };
      setState((prev) => ({
        ...prev,
        practiceLogs: { ...prev.practiceLogs, [exerciseId]: next },
      }));
      if (patch.status === 'completed' && existing?.status !== 'completed') {
        appendActivity('practice', 'Completed hands-on exercise', exerciseId, week);
      }
      if (canSyncCloud(user)) {
        void syncPracticeToCloud(user.uid, next);
      }
    },
    [appendActivity, canSyncCloud, syncPracticeToCloud, user]
  );

  const saveProject = useCallback(
    (input: Omit<ProjectRecord, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string) => {
      const ts = nowIso();
      if (existingId) {
        let updated: ProjectRecord | null = null;
        setState((prev) => ({
          ...prev,
          projects: prev.projects.map((p) => {
            if (p.id !== existingId) return p;
            updated = { ...p, ...input, updatedAt: ts };
            return updated;
          }),
        }));
        if (updated) {
          pushToast('Project updated.', 'success');
          if (canSyncCloud(user)) void syncProjectToCloud(user.uid, updated, false);
        }
      } else {
        const rec: ProjectRecord = {
          ...input,
          id: makeId('proj'),
          createdAt: ts,
          updatedAt: ts,
        };
        setState((prev) => ({
          ...prev,
          projects: [rec, ...prev.projects],
        }));
        appendActivity('project', `Added project: ${rec.title}`, rec.competencyArea || rec.category, stateRef.current.profile.currentWeek);
        pushToast('Project added to portfolio.', 'success');
        if (canSyncCloud(user)) void syncProjectToCloud(user.uid, rec, true);
      }
    },
    [appendActivity, canSyncCloud, pushToast, syncProjectToCloud, user]
  );

  const deleteProject = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        projects: prev.projects.filter((p) => p.id !== id),
      }));
      pushToast('Project removed.', 'info');
      if (canSyncCloud(user)) {
        void deleteDoc(doc(db, 'users', user.uid, 'projects', id)).catch((err) =>
          handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/projects/${id}`)
        );
      }
    },
    [canSyncCloud, pushToast, user]
  );

  const addWeakConcept = useCallback(
    (input: { week: number; topicId?: string; title: string; notes?: string; source?: string }) => {
      const ts = nowIso();
      const rec: WeakConceptRecord = {
        id: makeId('weak'),
        week: clampInt(input.week, 1, 20),
        topicId: clampStr(input.topicId ?? '', 128),
        title: clampStr(input.title.trim() || 'Concept to review', 200),
        notes: clampStr(input.notes ?? '', 2000),
        resolved: false,
        source: clampStr(input.source ?? 'manual', 80),
        createdAt: ts,
        updatedAt: ts,
      };
      setState((prev) => ({
        ...prev,
        weakConcepts: [rec, ...prev.weakConcepts],
      }));
      pushToast('Saved to Weak Concepts queue.', 'info');
      if (canSyncCloud(user)) void syncWeakConceptToCloud(user.uid, rec, true);
    },
    [canSyncCloud, pushToast, syncWeakConceptToCloud, user]
  );

  const toggleWeakConceptResolved = useCallback(
    (id: string) => {
      let updated: WeakConceptRecord | null = null;
      setState((prev) => ({
        ...prev,
        weakConcepts: prev.weakConcepts.map((w) => {
          if (w.id !== id) return w;
          updated = { ...w, resolved: !w.resolved, updatedAt: nowIso() };
          return updated;
        }),
      }));
      if (updated && canSyncCloud(user)) {
        void syncWeakConceptToCloud(user.uid, updated, false);
      }
    },
    [canSyncCloud, syncWeakConceptToCloud, user]
  );

  const deleteWeakConcept = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        weakConcepts: prev.weakConcepts.filter((w) => w.id !== id),
      }));
      if (canSyncCloud(user)) {
        void deleteDoc(doc(db, 'users', user.uid, 'weakConcepts', id)).catch((err) =>
          handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/weakConcepts/${id}`)
        );
      }
    },
    [canSyncCloud, user]
  );

  const setFlashcardStatus = useCallback(
    (cardId: string, status: FlashcardMastery, week: number) => {
      const existing = stateRef.current.flashcardStates[cardId];
      const nextCount = (existing?.reviewCount ?? 0) + 1;
      setState((prev) => ({
        ...prev,
        flashcardStates: {
          ...prev.flashcardStates,
          [cardId]: {
            cardId,
            status,
            reviewCount: nextCount,
            updatedAt: nowIso(),
          },
        },
      }));
      if (status === 'known' || status === 'needs_review') {
        appendActivity(
          'flashcard',
          `Flashcard marked ${status === 'known' ? 'Known' : 'Needs Review'}`,
          cardId,
          week
        );
      }
      if (canSyncCloud(user)) {
        void syncFlashcardToCloud(user.uid, cardId, status, nextCount);
      }
    },
    [appendActivity, canSyncCloud, syncFlashcardToCloud, user]
  );

  const recordQuizAttempt = useCallback(
    (week: number, score: number, total: number, missedTopicIds: string[]) => {
      const rec = {
        id: makeId('quiz'),
        week: clampInt(week, 1, 20),
        score,
        total,
        missedTopicIds,
        createdAt: nowIso(),
      };
      setState((prev) => ({
        ...prev,
        quizAttempts: [rec, ...prev.quizAttempts],
      }));
      appendActivity('quiz', `Week ${week} Knowledge Check`, `Scored ${score}/${total}`, week);
      if (canSyncCloud(user)) {
        void syncQuizAttemptToCloud(user.uid, rec);
      }
    },
    [appendActivity, canSyncCloud, syncQuizAttemptToCloud, user]
  );

  const saveJournalEntry = useCallback(
    (input: Omit<JournalEntryRecord, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string) => {
      const ts = nowIso();
      if (existingId) {
        let updated: JournalEntryRecord | null = null;
        setState((prev) => ({
          ...prev,
          journalEntries: prev.journalEntries.map((j) => {
            if (j.id !== existingId) return j;
            updated = { ...j, ...input, updatedAt: ts };
            return updated;
          }),
        }));
        if (updated) {
          pushToast('Journal entry updated.', 'success');
          if (canSyncCloud(user)) void syncJournalToCloud(user.uid, updated, false);
        }
      } else {
        const rec: JournalEntryRecord = {
          ...input,
          id: makeId('jour'),
          createdAt: ts,
          updatedAt: ts,
        };
        setState((prev) => ({
          ...prev,
          journalEntries: [rec, ...prev.journalEntries],
        }));
        appendActivity('journal', `Logged study journal (${rec.date})`, rec.learnedToday.slice(0, 90), rec.week);
        pushToast('Journal entry saved.', 'success');
        if (canSyncCloud(user)) void syncJournalToCloud(user.uid, rec, true);
      }
    },
    [appendActivity, canSyncCloud, pushToast, syncJournalToCloud, user]
  );

  const deleteJournalEntry = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        journalEntries: prev.journalEntries.filter((j) => j.id !== id),
      }));
      pushToast('Journal entry deleted.', 'info');
      if (canSyncCloud(user)) {
        void deleteDoc(doc(db, 'users', user.uid, 'journalEntries', id)).catch((err) =>
          handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/journalEntries/${id}`)
        );
      }
    },
    [canSyncCloud, pushToast, user]
  );

  const exportBackupJson = useCallback(() => {
    return JSON.stringify(stateRef.current, null, 2);
  }, []);

  const importBackupJson = useCallback(
    (rawJson: string): { ok: boolean; error?: string } => {
      try {
        const parsed = JSON.parse(rawJson) as Partial<AppDataState>;
        if (!parsed || typeof parsed !== 'object' || !parsed.profile) {
          return { ok: false, error: 'Invalid backup file: missing learner profile.' };
        }
        const base = createInitialState();
        const restored: AppDataState = {
          ...base,
          ...parsed,
          version: 1,
          profile: {
            ...base.profile,
            ...parsed.profile,
            currentWeek: clampInt(parsed.profile.currentWeek ?? 1, 1, 20),
            updatedAt: nowIso(),
          },
          topicProgress: parsed.topicProgress || {},
          bonusProgress: parsed.bonusProgress || {},
          resourceStates: parsed.resourceStates || {},
          studySessions: Array.isArray(parsed.studySessions) ? parsed.studySessions : [],
          practiceLogs: parsed.practiceLogs || {},
          projects: Array.isArray(parsed.projects) ? parsed.projects : [],
          weakConcepts: Array.isArray(parsed.weakConcepts) ? parsed.weakConcepts : [],
          flashcardStates: parsed.flashcardStates || {},
          quizAttempts: Array.isArray(parsed.quizAttempts) ? parsed.quizAttempts : [],
          journalEntries: Array.isArray(parsed.journalEntries) ? parsed.journalEntries : [],
          activityLogs: Array.isArray(parsed.activityLogs) ? parsed.activityLogs : [],
        };
        setState(restored);
        setSelectedStudyWeek(restored.profile.currentWeek);
        setShowOnboardingModal(!restored.profile.onboardingCompleted);
        pushToast('Backup restored successfully.', 'success');
        if (canSyncCloud(user)) {
          void syncProfileToCloud(user.uid, restored.profile);
        }
        return { ok: true };
      } catch {
        return { ok: false, error: 'Could not parse JSON file. Check that it is a valid backup export.' };
      }
    },
    [canSyncCloud, pushToast, syncProfileToCloud, user]
  );

  const resetAllProgress = useCallback(() => {
    const fresh = createInitialState();
    setState(fresh);
    setSelectedStudyWeek(1);
    setShowOnboardingModal(true);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    pushToast('All local progress has been reset.', 'info');
    if (canSyncCloud(user)) {
      void syncProfileToCloud(user.uid, fresh.profile);
    }
  }, [canSyncCloud, pushToast, syncProfileToCloud, user]);

  // Helper check so OFFICIAL_CURRICULUM and getSubtopicsForWeek remain referenced & usable
  void OFFICIAL_CURRICULUM;
  void getSubtopicsForWeek;

  const value: AppContextValue = {
    state,
    activeSection,
    setActiveSection,
    selectedStudyWeek,
    setSelectedStudyWeek,
    highlightedTarget,
    clearHighlightedTarget,
    openStudyRoomForWeek,
    continueLearning,
    nextLearningTarget,
    showOnboardingModal,
    setShowOnboardingModal,
    user,
    authReady,
    syncStatus,
    lastSyncedAt,
    syncError,
    handleGoogleSignIn,
    handleSignOut,
    syncNow,
    toasts,
    pushToast,
    dismissToast,
    completeOnboarding,
    updateProfile,
    updateTopicProgress,
    updateBonusProgress,
    toggleResourceWatched,
    pinResourceToWeek,
    addStudySession,
    updateStudySession,
    deleteStudySession,
    generateWeeklyPlanTemplate,
    updatePracticeLog,
    saveProject,
    deleteProject,
    addWeakConcept,
    toggleWeakConceptResolved,
    deleteWeakConcept,
    setFlashcardStatus,
    recordQuizAttempt,
    saveJournalEntry,
    deleteJournalEntry,
    exportBackupJson,
    importBackupJson,
    resetAllProgress,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
