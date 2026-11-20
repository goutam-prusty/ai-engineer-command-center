import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
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
  describeAuthError,
  errorCode,
  isFirebaseConfigured,
  missingFirebaseEnv,
  signInWithGoogle,
  signOutUser,
} from '../lib/firebase';
import { clampInt, clampStr, makeId, nowIso } from '../lib/util';
import { BackupInfo } from '../lib/sync/meta';
import { SyncStatus, useCloudSync } from './useCloudSync';

const STORAGE_KEY = 'aiecc_state_v1';

export type { SyncStatus } from './useCloudSync';

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
  authError: string | null;
  cloudConfigured: boolean;
  missingFirebaseEnv: string[];
  pendingSyncCount: number;
  localBackups: BackupInfo[];
  downloadLocalBackup: (key: string) => void;

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
  const [authError, setAuthError] = useState<string | null>(null);
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
    (u: User | null): u is User => Boolean(isFirebaseConfigured && u && u.emailVerified),
    []
  );

  /** Replace local state with a fresh one (used when a different Google account signs in). */
  const resetLocalState = useCallback(() => {
    const fresh = createInitialState();
    stateRef.current = fresh;
    setState(fresh);
    setSelectedStudyWeek(1);
    setShowOnboardingModal(true);
  }, []);

  const cloud = useCloudSync({
    user,
    authReady,
    stateRef,
    setState,
    storageKey: STORAGE_KEY,
    resetLocalState,
    onCloudProfile: (profile, first) => {
      if (profile.onboardingCompleted) setShowOnboardingModal(false);
      if (first) setSelectedStudyWeek(clampInt(profile.currentWeek, 1, 20));
    },
    pushToast,
  });

  const {
    syncStatus,
    lastSyncedAt,
    syncNow,
    deleteCloudRecord,
    resetCloudData,
    requestForceReconcile,
    syncProfileToCloud,
    syncTopicToCloud,
    syncBonusToCloud,
    syncResourceToCloud,
    syncStudySessionToCloud,
    syncPracticeToCloud,
    syncProjectToCloud,
    syncWeakConceptToCloud,
    syncFlashcardToCloud,
    syncQuizAttemptToCloud,
    syncJournalToCloud,
    syncActivityToCloud,
  } = cloud;
  const syncError = authError ?? cloud.syncError;

  // Firebase Auth session (persisted by the SDK, restored automatically after a refresh)
  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      return undefined;
    }
    return onAuthStateChanged(
      auth,
      (u) => {
        setUser(u);
        setAuthReady(true);
      },
      (err) => {
        console.error('Auth state error:', err);
        setAuthError(describeAuthError(err));
        setAuthReady(true);
      }
    );
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
      pushToast('Signed in with Google. Syncing your progress…', 'success');
    } catch (err) {
      const code = errorCode(err);
      const message = describeAuthError(err);
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setAuthError(message);
      }
      pushToast(message, 'warning');
    }
  }, [pushToast]);

  const handleSignOut = useCallback(async () => {
    try {
      await cloud.flushAndWait(); // push pending edits while still authenticated
      await signOutUser();
      setAuthError(null);
      pushToast('Signed out. Progress continues saving on this device.', 'info');
    } catch (err) {
      pushToast(describeAuthError(err), 'warning');
    }
  }, [cloud.flushAndWait, pushToast]);

  const downloadLocalBackup = useCallback(
    (key: string) => {
      const raw = cloud.getBackupJson(key);
      if (!raw) {
        pushToast('That backup is no longer available.', 'warning');
        return;
      }
      const blob = new Blob([raw], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-engineer-command-center-safety-backup-${nowIso().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [cloud.getBackupJson, pushToast]
  );

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
      deleteCloudRecord('studySessions', id);
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
      deleteCloudRecord('projects', id);
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
      deleteCloudRecord('weakConcepts', id);
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
      deleteCloudRecord('journalEntries', id);
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
        stateRef.current = restored;
        pushToast('Backup restored successfully.', 'success');
        requestForceReconcile(); // signed in: upload the restored data (restored records win conflicts)
        return { ok: true };
      } catch {
        return { ok: false, error: 'Could not parse JSON file. Check that it is a valid backup export.' };
      }
    },
    [pushToast, requestForceReconcile]
  );

  const resetAllProgress = useCallback(() => {
    const fresh = createInitialState();
    stateRef.current = fresh;
    setState(fresh);
    setSelectedStudyWeek(1);
    setShowOnboardingModal(true);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    resetCloudData(); // also clears this account's cloud data (applied now, or when back online / signed in)
    pushToast(
      canSyncCloud(user) ? 'All progress has been reset on this device and in the cloud.' : 'All local progress has been reset.',
      'info'
    );
  }, [canSyncCloud, pushToast, resetCloudData, user]);

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
    showOnboardingModal: showOnboardingModal && cloud.profileGateOpen,
    setShowOnboardingModal,
    user,
    authReady,
    syncStatus,
    lastSyncedAt,
    syncError,
    handleGoogleSignIn,
    handleSignOut,
    syncNow,
    authError,
    cloudConfigured: cloud.cloudConfigured,
    missingFirebaseEnv: cloud.missingFirebaseEnv,
    pendingSyncCount: cloud.pendingCount,
    localBackups: cloud.localBackups,
    downloadLocalBackup,
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
