export type NavSection =
  | 'dashboard'
  | 'plan'
  | 'curriculum'
  | 'study-room'
  | 'resources'
  | 'projects'
  | 'revision'
  | 'analytics'
  | 'journal'
  | 'settings';

export type ProvenanceLabel =
  | 'DATAMITES_OFFICIAL'
  | 'CODEWITHHARRY_PYTHON'
  | 'CODEWITHHARRY_DATA_SCIENCE'
  | 'SSD_AI_ENGINEER_BOOTCAMP'
  | 'OTHER_SSD'
  | 'SUPPLEMENTARY_PRACTICE_PROPOSED'
  | 'UNVERIFIED';

export type ResourceClassification = 'ESSENTIAL' | 'OPTIONAL' | 'SKIP';

export type TopicStatus =
  | 'not_started'
  | 'in_progress'
  | 'practised'
  | 'demonstrated'
  | 'needs_revision'
  | 'complete';

export type AssignmentStatus = 'not_started' | 'in_progress' | 'submitted' | 'reviewed';

export type RevisionStatus = 'none' | 'scheduled' | 'needs_revision' | 'revised';

export type BonusModuleStatus = 'not_started' | 'in_progress' | 'complete';

export type FlashcardMastery = 'unreviewed' | 'known' | 'needs_review';

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export type SessionCategory = 'live_class' | 'self_study' | 'practice' | 'revision' | 'supplementary';

export interface SubtopicDef {
  id: string;
  title: string;
  week: number;
  provenance: ProvenanceLabel;
}

export interface ModuleDef {
  id: string;
  moduleNumber: number;
  title: string;
  hours: number;
  week: number;
  subtopics: SubtopicDef[];
}

export interface OfficialCourseDef {
  id: string;
  order: number;
  courseCode: string;
  title: string;
  weeks: number[];
  weekLabel: string;
  liveHours: number;
  tools: string[];
  brochurePage: number;
  isRevisionWeek?: boolean;
  modules: ModuleDef[];
}

export interface BonusModuleDef {
  id: string;
  moduleNumber: number;
  title: string;
  topics: string[];
  assignment?: string;
}

export interface BonusCourseDef {
  id: string;
  courseCode: string;
  title: string;
  valueLabel: string;
  lectureHours: number;
  learningHours: number;
  brochurePage: number;
  tools: string[];
  modules: BonusModuleDef[];
}

export interface CompetencyAreaDef {
  id: string;
  number: number;
  title: string;
  description: string;
}

export interface ResourceItem {
  id: string;
  title: string;
  source: 'CODEWITHHARRY_PYTHON' | 'CODEWITHHARRY_DATA_SCIENCE' | 'SSD_AI_ENGINEER_BOOTCAMP' | 'OTHER_SSD';
  priorityTier: 2 | 3 | 4;
  courseName: string;
  sectionName: string;
  locator: string;
  duration?: string;
  language: 'English' | 'Hindi';
  mappedWeeks: number[];
  defaultClassification: ResourceClassification;
  weekClassifications?: Record<number, ResourceClassification>;
  reason: string;
  verified: boolean;
  filePath?: string;
}

export interface PracticalExerciseDef {
  id: string;
  week: number;
  moduleId: string;
  title: string;
  type: 'coding' | 'notebook' | 'debugging' | 'mini_implementation';
  prompt: string;
  datasetOrInput: string;
  deliverable: string;
  starterCode?: string;
  hint: string;
  referenceApproach: string;
  provenance: 'SUPPLEMENTARY_PRACTICE_PROPOSED';
}

export interface CompletionCriteriaDef {
  week: number;
  understand: string[];
  implement: string[];
  evidence: string[];
}

export interface FlashcardDef {
  id: string;
  week: number;
  moduleId: string;
  topicLabel: string;
  front: string;
  back: string;
  practicalNuance: string;
  provenance: ProvenanceLabel;
}

export interface QuizQuestionDef {
  id: string;
  week: number;
  moduleId: string;
  topicLabel: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  provenance: 'SUPPLEMENTARY_PRACTICE_PROPOSED';
}

export interface ShortAnswerDef {
  id: string;
  week: number;
  moduleId: string;
  topicLabel: string;
  prompt: string;
  modelAnswer: string;
  keyCheckpoints: string[];
  provenance: 'SUPPLEMENTARY_PRACTICE_PROPOSED';
}

// Persistent learner state types
export interface UserProfile {
  learnerName: string;
  onboardingCompleted: boolean;
  currentWeek: number;
  weeklyLiveHours: number;
  weeklySelfStudyHours: number;
  weeklyPracticeHours: number;
  internshipIntakeDone: boolean;
  internshipMentoringHours: number;
  internshipCertificateDone: boolean;
  internshipExperienceLetterDone: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TopicProgressRecord {
  topicId: string;
  week: number;
  status: TopicStatus;
  assignmentStatus: AssignmentStatus;
  revisionStatus: RevisionStatus;
  notes: string;
  evidenceUrl: string;
  updatedAt: string;
}

export interface BonusProgressRecord {
  moduleId: string;
  status: BonusModuleStatus;
  notes: string;
  updatedAt: string;
}

export interface ResourceStateRecord {
  resourceId: string;
  watched: boolean;
  pinnedWeek: number; // 0 if not pinned
  note: string;
  updatedAt: string;
}

export interface StudySessionRecord {
  id: string;
  week: number;
  day: DayOfWeek;
  title: string;
  category: SessionCategory;
  plannedMinutes: number;
  completed: boolean;
  linkedRef: string;
  createdAt: string;
  updatedAt: string;
}

export interface PracticeLogRecord {
  exerciseId: string;
  week: number;
  status: 'not_started' | 'in_progress' | 'completed';
  evidenceUrl: string;
  notes: string;
  updatedAt: string;
}

export interface ProjectRecord {
  id: string;
  category: 'official_datamites' | 'internship' | 'supplementary_personal';
  title: string;
  competencyArea: string;
  problemStatement: string;
  skills: string[];
  datasetSource: string;
  milestones: string[]; // Stored as "[x] Label" or "[ ] Label"
  deliverables: string;
  githubUrl: string;
  completionCriteria: string;
  status: 'planned' | 'in_progress' | 'completed';
  provenance: 'DATAMITES_OFFICIAL' | 'SUPPLEMENTARY_PRACTICE_PROPOSED' | 'UNVERIFIED';
  createdAt: string;
  updatedAt: string;
}

export interface WeakConceptRecord {
  id: string;
  week: number;
  topicId: string;
  title: string;
  notes: string;
  resolved: boolean;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlashcardStateRecord {
  cardId: string;
  status: FlashcardMastery;
  reviewCount: number;
  updatedAt: string;
}

export interface QuizAttemptRecord {
  id: string;
  week: number;
  score: number;
  total: number;
  missedTopicIds: string[];
  createdAt: string;
}

export interface JournalEntryRecord {
  id: string;
  date: string;
  week: number;
  learnedToday: string;
  implemented: string;
  problemsEncountered: string;
  howSolved: string;
  unclearConcepts: string;
  mentorQuestions: string;
  mentorResolved: boolean;
  nextSession: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLogRecord {
  id: string;
  type: 'topic' | 'practice' | 'quiz' | 'flashcard' | 'project' | 'journal' | 'resource' | 'plan';
  title: string;
  detail: string;
  week: number;
  createdAt: string;
}

export interface AppDataState {
  version: number;
  profile: UserProfile;
  topicProgress: Record<string, TopicProgressRecord>;
  bonusProgress: Record<string, BonusProgressRecord>;
  resourceStates: Record<string, ResourceStateRecord>;
  studySessions: StudySessionRecord[];
  practiceLogs: Record<string, PracticeLogRecord>;
  projects: ProjectRecord[];
  weakConcepts: WeakConceptRecord[];
  flashcardStates: Record<string, FlashcardStateRecord>;
  quizAttempts: QuizAttemptRecord[];
  journalEntries: JournalEntryRecord[];
  activityLogs: ActivityLogRecord[];
}

export interface NextLearningTarget {
  week: number;
  courseTitle: string;
  courseCode: string;
  moduleId: string;
  moduleTitle: string;
  subtopicId: string;
  subtopicTitle: string;
  reason: 'in_progress' | 'needs_revision' | 'next_in_sequence' | 'week_complete';
}
