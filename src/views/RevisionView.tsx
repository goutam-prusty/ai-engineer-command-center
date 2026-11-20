import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Code2,
  Flag,
  HelpCircle,
  Layers,
  Plus,
  RotateCcw,
  Shuffle,
  Trash2,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import {
  FLASHCARDS,
  getQuizzesForWeek,
  getShortAnswersForWeek,
  PRACTICAL_EXERCISES,
} from '../data/assessments';
import { getCourseForWeek } from '../data/curriculum';
import { FlashcardMastery } from '../types';
import { ProgressBar, ProvenanceInline, SectionCard } from '../components/StatusPrimitives';

type RevisionTab = 'flashcards' | 'quizzes' | 'short_answer' | 'coding' | 'weak_concepts';

export function RevisionView() {
  const {
    state,
    setFlashcardStatus,
    recordQuizAttempt,
    addWeakConcept,
    toggleWeakConceptResolved,
    deleteWeakConcept,
    updatePracticeLog,
  } = useAppState();

  const [activeTab, setActiveTab] = useState<RevisionTab>('flashcards');

  // --- Flashcard state ---
  const [fcWeekFilter, setFcWeekFilter] = useState<'all' | number>('all');
  const [fcTopicFilter, setFcTopicFilter] = useState<string>('all');
  const [fcStatusFilter, setFcStatusFilter] = useState<'all' | FlashcardMastery>('all');
  const [fcOrderIds, setFcOrderIds] = useState<string[]>(() => FLASHCARDS.map((c) => c.id));
  const [fcIndex, setFcIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // --- Quiz state ---
  const [quizWeek, setQuizWeek] = useState<number>(state.profile.currentWeek);
  const [quizSelections, setQuizSelections] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // --- Short Answer state ---
  const [saWeek, setSaWeek] = useState<number>(state.profile.currentWeek);
  const [saDrafts, setSaDrafts] = useState<Record<string, string>>({});
  const [saRevealed, setSaRevealed] = useState<Record<string, boolean>>({});

  // --- Coding Challenges state ---
  const [codingWeek, setCodingWeek] = useState<'all' | number>(state.profile.currentWeek);
  const [codingHints, setCodingHints] = useState<Record<string, boolean>>({});

  // --- Weak concepts form ---
  const [weakWeek, setWeakWeek] = useState<number>(state.profile.currentWeek);
  const [weakTitle, setWeakTitle] = useState('');
  const [weakNotes, setWeakNotes] = useState('');

  // Dynamic topics based on selected week
  const availableTopics = useMemo(() => {
    const base =
      fcWeekFilter === 'all'
        ? FLASHCARDS
        : FLASHCARDS.filter((c) => c.week === fcWeekFilter);
    return Array.from(new Set(base.map((c) => c.topicLabel))).sort();
  }, [fcWeekFilter]);

  useEffect(() => {
    if (fcTopicFilter !== 'all' && !availableTopics.includes(fcTopicFilter)) {
      setFcTopicFilter('all');
    }
  }, [availableTopics, fcTopicFilter]);

  const cardById = useMemo(() => {
    const map = new Map(FLASHCARDS.map((c) => [c.id, c]));
    return map;
  }, []);

  const filteredCards = useMemo(() => {
    return fcOrderIds
      .map((id) => cardById.get(id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .filter((c) => {
        if (fcWeekFilter !== 'all' && c.week !== fcWeekFilter) return false;
        if (fcTopicFilter !== 'all' && c.topicLabel !== fcTopicFilter) return false;
        const st: FlashcardMastery = state.flashcardStates[c.id]?.status ?? 'unreviewed';
        if (fcStatusFilter !== 'all' && st !== fcStatusFilter) return false;
        return true;
      });
  }, [fcOrderIds, cardById, fcWeekFilter, fcTopicFilter, fcStatusFilter, state.flashcardStates]);

  const safeFcIndex = filteredCards.length > 0 ? Math.min(fcIndex, filteredCards.length - 1) : 0;
  const activeCard = filteredCards[safeFcIndex] ?? null;
  const activeCardStatus: FlashcardMastery = activeCard
    ? state.flashcardStates[activeCard.id]?.status ?? 'unreviewed'
    : 'unreviewed';

  const flashcardStats = useMemo(() => {
    let known = 0;
    let needsReview = 0;
    let unreviewed = 0;
    FLASHCARDS.forEach((c) => {
      const st = state.flashcardStates[c.id]?.status ?? 'unreviewed';
      if (st === 'known') known += 1;
      else if (st === 'needs_review') needsReview += 1;
      else unreviewed += 1;
    });
    return { known, needsReview, unreviewed, total: FLASHCARDS.length };
  }, [state.flashcardStates]);

  const goPrevCard = useCallback(() => {
    if (filteredCards.length === 0) return;
    setIsFlipped(false);
    setFcIndex((i) => (i <= 0 ? filteredCards.length - 1 : i - 1));
  }, [filteredCards.length]);

  const goNextCard = useCallback(() => {
    if (filteredCards.length === 0) return;
    setIsFlipped(false);
    setFcIndex((i) => (i >= filteredCards.length - 1 ? 0 : i + 1));
  }, [filteredCards.length]);

  const handleMarkCard = useCallback(
    (status: 'known' | 'needs_review') => {
      if (!activeCard) return;
      setFlashcardStatus(activeCard.id, status, activeCard.week);
      if (filteredCards.length > 1) {
        setIsFlipped(false);
        setFcIndex((i) => (i >= filteredCards.length - 1 ? 0 : i + 1));
      }
    },
    [activeCard, filteredCards.length, setFlashcardStatus]
  );

  // Keyboard shortcuts while on Flashcards tab (ignore when typing in inputs/selects)
  useEffect(() => {
    if (activeTab !== 'flashcards') return;
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNextCard();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrevCard();
      } else if (e.key.toLowerCase() === 'k' && activeCard) {
        handleMarkCard('known');
      } else if (e.key.toLowerCase() === 'r' && activeCard) {
        handleMarkCard('needs_review');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeTab, activeCard, goNextCard, goPrevCard, handleMarkCard]);

  const handleShuffle = () => {
    const copy = [...fcOrderIds];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    setFcOrderIds(copy);
    setFcIndex(0);
    setIsFlipped(false);
  };

  // Quiz computations
  const weekQuizzes = useMemo(() => getQuizzesForWeek(quizWeek), [quizWeek]);
  const quizResult = useMemo(() => {
    if (!quizSubmitted) return null;
    let score = 0;
    const missed: typeof weekQuizzes = [];
    weekQuizzes.forEach((q) => {
      if (quizSelections[q.id] === q.correctIndex) score += 1;
      else missed.push(q);
    });
    return { score, total: weekQuizzes.length, missed };
  }, [quizSubmitted, weekQuizzes, quizSelections]);

  const handleSubmitQuiz = () => {
    let score = 0;
    const missedIds: string[] = [];
    weekQuizzes.forEach((q) => {
      if (quizSelections[q.id] === q.correctIndex) score += 1;
      else missedIds.push(q.topicLabel);
    });
    setQuizSubmitted(true);
    recordQuizAttempt(quizWeek, score, weekQuizzes.length, missedIds);
  };

  const weekShortAnswers = useMemo(() => getShortAnswersForWeek(saWeek), [saWeek]);
  const filteredCodingExercises = useMemo(
    () =>
      codingWeek === 'all'
        ? PRACTICAL_EXERCISES
        : PRACTICAL_EXERCISES.filter((e) => e.week === codingWeek),
    [codingWeek]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A] tracking-tight">
            Revision &amp; Assessments
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Curated offline active-recall bank grounded in the 20-week DataMites syllabus and
            verified supplements. Zero external AI API calls.
          </p>
        </div>
        <ProvenanceInline label="SUPPLEMENTARY_PRACTICE_PROPOSED" />
      </div>

      {/* Sub-navigation tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E2E8F0] pb-2">
        {(
          [
            { id: 'flashcards', label: `Interactive Flashcards (${FLASHCARDS.length})` },
            { id: 'quizzes', label: 'Weekly Quizzes' },
            { id: 'short_answer', label: 'Short-Answer Checks' },
            { id: 'coding', label: 'Coding Challenges' },
            {
              id: 'weak_concepts',
              label: `Weak Concepts & History (${state.weakConcepts.filter((w) => !w.resolved).length})`,
            },
          ] as { id: RevisionTab; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === t.id
                ? 'bg-[#2563EB] text-white'
                : 'bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: INTERACTIVE FLASHCARDS */}
      {activeTab === 'flashcards' && (
        <div className="space-y-5">
          {/* Mastery Summary + Filter Controls */}
          <SectionCard className="p-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-4 text-xs tabular-nums">
                <span className="font-medium text-[#047857]">
                  Known: <span className="font-semibold">{flashcardStats.known}</span>
                </span>
                <span className="font-medium text-[#B45309]">
                  Needs Review: <span className="font-semibold">{flashcardStats.needsReview}</span>
                </span>
                <span className="font-medium text-[#64748B]">
                  Unreviewed: <span className="font-semibold">{flashcardStats.unreviewed}</span>
                </span>
              </div>
              <div className="w-full md:w-56">
                <ProgressBar
                  value={flashcardStats.known}
                  max={flashcardStats.total}
                  colorClass="bg-[#059669]"
                  heightClass="h-1.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3 border-t border-[#F1F5F9]">
              <select
                aria-label="Filter flashcards by DataMites week"
                value={fcWeekFilter}
                onChange={(e) => {
                  setFcWeekFilter(e.target.value === 'all' ? 'all' : Number(e.target.value));
                  setFcIndex(0);
                  setIsFlipped(false);
                }}
                className="px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
              >
                <option value="all">All 20 DataMites Weeks</option>
                {Array.from({ length: 20 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>
                    Week {w} — {getCourseForWeek(w).title}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter flashcards by topic"
                value={fcTopicFilter}
                onChange={(e) => {
                  setFcTopicFilter(e.target.value);
                  setFcIndex(0);
                  setIsFlipped(false);
                }}
                className="px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
              >
                <option value="all">All Topics ({availableTopics.length})</option>
                {availableTopics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter flashcards by card status"
                value={fcStatusFilter}
                onChange={(e) => {
                  setFcStatusFilter(e.target.value as 'all' | FlashcardMastery);
                  setFcIndex(0);
                  setIsFlipped(false);
                }}
                className="px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
              >
                <option value="all">All Statuses</option>
                <option value="unreviewed">Unreviewed</option>
                <option value="needs_review">Needs Review</option>
                <option value="known">Known</option>
              </select>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShuffle}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-xs font-medium text-[#334155] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Shuffle</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFcOrderIds(FLASHCARDS.map((c) => c.id));
                    setFcIndex(0);
                    setIsFlipped(false);
                  }}
                  className="px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-medium text-[#475569] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Reset Order
                </button>
              </div>
            </div>
          </SectionCard>

          {/* Interactive 3D Flashcard Deck */}
          {!activeCard ? (
            <SectionCard className="p-10 text-center space-y-2">
              <Layers className="w-8 h-8 text-[#94A3B8] mx-auto" />
              <p className="text-sm font-medium text-[#0F172A]">
                No flashcards match the current filter
              </p>
              <button
                type="button"
                onClick={() => {
                  setFcWeekFilter('all');
                  setFcTopicFilter('all');
                  setFcStatusFilter('all');
                  setFcIndex(0);
                }}
                className="mt-2 px-3.5 py-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-medium text-[#0F172A] cursor-pointer"
              >
                Reset filters
              </button>
            </SectionCard>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {/* Progress indicator */}
              <div className="flex items-center justify-between text-xs text-[#64748B] px-1">
                <span className="tabular-nums font-medium text-[#0F172A]">
                  Card {safeFcIndex + 1} of {filteredCards.length}
                </span>
                <div className="flex items-center gap-2">
                  <span>Week {activeCard.week}</span>
                  <span>·</span>
                  <span>{activeCard.topicLabel}</span>
                  <span>·</span>
                  <span
                    className={`font-semibold ${
                      activeCardStatus === 'known'
                        ? 'text-[#047857]'
                        : activeCardStatus === 'needs_review'
                          ? 'text-[#B45309]'
                          : 'text-[#64748B]'
                    }`}
                  >
                    {activeCardStatus === 'known'
                      ? 'Known'
                      : activeCardStatus === 'needs_review'
                        ? 'Needs Review'
                        : 'Unreviewed'}
                  </span>
                </div>
              </div>

              {/* 3D Flip Card */}
              <div
                role="button"
                tabIndex={0}
                aria-label={isFlipped ? 'Show question front' : 'Flip card to reveal answer'}
                onClick={() => setIsFlipped((f) => !f)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setIsFlipped((f) => !f);
                  }
                }}
                className="perspective-1000 cursor-pointer select-none"
              >
                <div
                  className={`relative w-full min-h-[290px] sm:min-h-[310px] transition-transform duration-500 preserve-3d ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* FRONT */}
                  <div className="absolute inset-0 backface-hidden bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-sm">
                    <div className="flex items-center justify-between gap-2 text-xs text-[#64748B]">
                      <span className="font-semibold uppercase tracking-wider text-[#2563EB]">
                        Question · Week {activeCard.week}
                      </span>
                      <ProvenanceInline label={activeCard.provenance} />
                    </div>

                    <div className="my-auto py-6 text-center">
                      <p className="text-lg sm:text-xl font-semibold text-[#0F172A] leading-snug">
                        {activeCard.front}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                      <span>Topic: {activeCard.topicLabel}</span>
                      <span>Click card or press Space to flip</span>
                    </div>
                  </div>

                  {/* BACK */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#F8FAFC] border border-[#BFDBFE] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-sm overflow-y-auto">
                    <div className="flex items-center justify-between gap-2 text-xs text-[#64748B]">
                      <span className="font-semibold uppercase tracking-wider text-[#059669]">
                        Answer &amp; Definition
                      </span>
                      <span className="text-[#475569]">{activeCard.topicLabel}</span>
                    </div>

                    <div className="my-auto py-4 space-y-4">
                      <p className="text-sm sm:text-base text-[#0F172A] leading-relaxed">
                        {activeCard.back}
                      </p>
                      <div className="p-3.5 rounded-lg bg-white border border-[#E2E8F0]">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#2563EB] mb-1">
                          Practical AI Engineering Nuance
                        </p>
                        <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
                          {activeCard.practicalNuance}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                      <span>Click to flip back</span>
                      <span>Press K (Known) or R (Needs Review)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={goPrevCard}
                    className="inline-flex items-center justify-center gap-1 px-3.5 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-medium text-[#334155] cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Prev</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFlipped((f) => !f)}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-medium text-[#0F172A] cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Flip Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={goNextCard}
                    className="inline-flex items-center justify-center gap-1 px-3.5 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-medium text-[#334155] cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleMarkCard('needs_review');
                    }}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#B45309] text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Needs Review</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleMarkCard('known');
                    }}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Known</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    addWeakConcept({
                      week: activeCard.week,
                      topicId: activeCard.moduleId,
                      title: activeCard.topicLabel,
                      notes: activeCard.front,
                      source: 'flashcard',
                    })
                  }
                  className="text-xs text-[#64748B] hover:text-[#B45309] cursor-pointer"
                >
                  + Copy this concept to Weak Concepts Queue
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WEEKLY MULTIPLE-CHOICE QUIZZES */}
      {activeTab === 'quizzes' && (
        <div className="space-y-4">
          <SectionCard className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#0F172A]">
                Offline Concept Quiz · Week {quizWeek}
              </h2>
              <p className="text-xs text-[#64748B]">
                {getCourseForWeek(quizWeek).title} ({weekQuizzes.length} questions)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                aria-label="Select quiz week"
                value={quizWeek}
                onChange={(e) => {
                  setQuizWeek(Number(e.target.value));
                  setQuizSelections({});
                  setQuizSubmitted(false);
                }}
                className="px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>
                    Week {w} — {getCourseForWeek(w).title}
                  </option>
                ))}
              </select>
              {quizSubmitted && (
                <button
                  type="button"
                  onClick={() => {
                    setQuizSelections({});
                    setQuizSubmitted(false);
                  }}
                  className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs font-medium text-[#334155] hover:bg-[#F8FAFC] cursor-pointer"
                >
                  Retake
                </button>
              )}
            </div>
          </SectionCard>

          {quizResult && (
            <SectionCard className="p-4 bg-[#EFF6FF] border-[#BFDBFE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#0F172A] tabular-nums">
                  Score: {quizResult.score} / {quizResult.total} (
                  {Math.round((quizResult.score / Math.max(1, quizResult.total)) * 100)}%)
                </p>
                <p className="text-xs text-[#334155]">
                  Attempt recorded in your Revision History and Analytics.
                </p>
              </div>
              {quizResult.missed.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    quizResult.missed.forEach((m) =>
                      addWeakConcept({
                        week: m.week,
                        topicId: m.moduleId,
                        title: m.topicLabel,
                        notes: `Missed quiz question: ${m.question}`,
                        source: 'quiz',
                      })
                    );
                  }}
                  className="px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Add {quizResult.missed.length} Missed to Weak Concepts
                </button>
              )}
            </SectionCard>
          )}

          <div className="space-y-4">
            {weekQuizzes.map((q, idx) => {
              const chosen = quizSelections[q.id];
              return (
                <SectionCard key={q.id} className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#64748B]">
                    <span className="font-semibold text-[#2563EB]">
                      Question {idx + 1} · {q.topicLabel}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#0F172A]">{q.question}</p>
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = chosen === optIdx;
                      const isCorrect = q.correctIndex === optIdx;
                      let optionClasses =
                        'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#334155]';
                      if (quizSubmitted) {
                        if (isCorrect) {
                          optionClasses =
                            'border-[#A7F3D0] bg-[#ECFDF5] text-[#047857] font-medium';
                        } else if (isSelected && !isCorrect) {
                          optionClasses = 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]';
                        }
                      } else if (isSelected) {
                        optionClasses =
                          'border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8] font-medium';
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          disabled={quizSubmitted}
                          onClick={() =>
                            setQuizSelections((prev) => ({ ...prev, [q.id]: optIdx }))
                          }
                          className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm transition-colors cursor-pointer ${optionClasses}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {quizSubmitted && (
                    <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#334155]">
                      <span className="font-semibold text-[#0F172A]">Explanation:</span>{' '}
                      {q.explanation}
                    </div>
                  )}
                </SectionCard>
              );
            })}
          </div>

          {!quizSubmitted && weekQuizzes.length > 0 && (
            <div className="flex justify-end">
              <button
                type="button"
                disabled={Object.keys(quizSelections).length < weekQuizzes.length}
                onClick={handleSubmitQuiz}
                className="px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-[#CBD5E1] text-white text-sm font-medium cursor-pointer"
              >
                Grade Quiz ({Object.keys(quizSelections).length}/{weekQuizzes.length} answered)
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SHORT-ANSWER CONCEPTUAL CHECKS */}
      {activeTab === 'short_answer' && (
        <div className="space-y-4">
          <SectionCard className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#0F172A]">
                Short-Answer Conceptual Checks · Week {saWeek}
              </h2>
              <p className="text-xs text-[#64748B]">
                Write your explanation first, then compare against the model answer and key
                checkpoints.
              </p>
            </div>
            <select
              aria-label="Select short answer week"
              value={saWeek}
              onChange={(e) => setSaWeek(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
            >
              {Array.from({ length: 20 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  Week {w} — {getCourseForWeek(w).title}
                </option>
              ))}
            </select>
          </SectionCard>

          {weekShortAnswers.map((sa) => {
            const revealed = Boolean(saRevealed[sa.id]);
            return (
              <SectionCard key={sa.id} className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs text-[#2563EB] font-semibold">
                  <HelpCircle className="w-4 h-4" />
                  <span>{sa.topicLabel}</span>
                </div>
                <p className="text-sm font-medium text-[#0F172A]">{sa.prompt}</p>
                <textarea
                  rows={4}
                  value={saDrafts[sa.id] ?? ''}
                  onChange={(e) => setSaDrafts((p) => ({ ...p, [sa.id]: e.target.value }))}
                  placeholder="Draft your explanation in your own words before revealing the model answer..."
                  className="w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A]"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSaRevealed((p) => ({ ...p, [sa.id]: !revealed }))}
                    className="px-3.5 py-2 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-medium cursor-pointer"
                  >
                    {revealed ? 'Hide Model Answer' : 'Reveal Model Answer & Checkpoints'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      addWeakConcept({
                        week: sa.week,
                        topicId: sa.moduleId,
                        title: sa.topicLabel,
                        notes: sa.prompt,
                        source: 'short_answer',
                      })
                    }
                    className="px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
                  >
                    Flag as Weak Concept
                  </button>
                </div>

                {revealed && (
                  <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-3 text-xs text-[#334155]">
                    <div>
                      <p className="font-semibold text-[#0F172A] mb-1">Model Answer</p>
                      <p className="leading-relaxed">{sa.modelAnswer}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#0F172A] mb-1">Key Checkpoints</p>
                      <ul className="list-disc pl-4 space-y-1">
                        {sa.keyCheckpoints.map((cp, idx) => (
                          <li key={idx}>{cp}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </SectionCard>
            );
          })}
        </div>
      )}

      {/* TAB 4: CODING CHALLENGES */}
      {activeTab === 'coding' && (
        <div className="space-y-4">
          <SectionCard className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#0F172A]">
                Offline Coding &amp; Debugging Challenges
              </h2>
              <p className="text-xs text-[#64748B]">
                Synced directly with your Weekly Study Room practical exercise logs.
              </p>
            </div>
            <select
              aria-label="Filter coding challenges by week"
              value={codingWeek}
              onChange={(e) =>
                setCodingWeek(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
            >
              <option value="all">All 20 Weeks ({PRACTICAL_EXERCISES.length})</option>
              {Array.from({ length: 20 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  Week {w}
                </option>
              ))}
            </select>
          </SectionCard>

          <div className="space-y-4">
            {filteredCodingExercises.map((ex) => {
              const log = state.practiceLogs[ex.id];
              const status = log?.status ?? 'not_started';
              const showHint = Boolean(codingHints[ex.id]);
              return (
                <SectionCard key={ex.id} className="p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-[#2563EB] font-semibold">
                        <Code2 className="w-4 h-4" />
                        <span>
                          Week {ex.week} · {ex.type.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-[#0F172A]">{ex.title}</h3>
                      <p className="text-xs text-[#334155] leading-relaxed">{ex.prompt}</p>
                    </div>
                    <select
                      aria-label={`Status for ${ex.title}`}
                      value={status}
                      onChange={(e) =>
                        updatePracticeLog(ex.id, ex.week, {
                          status: e.target.value as 'not_started' | 'in_progress' | 'completed',
                        })
                      }
                      className="px-2.5 py-1.5 rounded-md border border-[#E2E8F0] bg-white text-xs font-medium text-[#0F172A] shrink-0 cursor-pointer"
                    >
                      <option value="not_started">Not started</option>
                      <option value="in_progress">In progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  {ex.starterCode && (
                    <pre className="p-3 rounded-lg bg-[#0F172A] text-[#F8FAFC] text-xs font-mono overflow-x-auto">
                      <code>{ex.starterCode}</code>
                    </pre>
                  )}

                  <button
                    type="button"
                    onClick={() => setCodingHints((p) => ({ ...p, [ex.id]: !showHint }))}
                    className="text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] cursor-pointer"
                  >
                    {showHint ? 'Hide Hint & Reference Approach' : 'Show Hint & Reference Approach'}
                  </button>

                  {showHint && (
                    <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#334155] space-y-1">
                      <p>
                        <span className="font-semibold text-[#0F172A]">Hint:</span> {ex.hint}
                      </p>
                      <p>
                        <span className="font-semibold text-[#0F172A]">Reference:</span>{' '}
                        {ex.referenceApproach}
                      </p>
                    </div>
                  )}
                </SectionCard>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: WEAK CONCEPTS & REVISION HISTORY */}
      {activeTab === 'weak_concepts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <SectionCard className="p-5 space-y-4">
              <h2 className="text-base font-semibold text-[#0F172A]">Weak Concepts Queue</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!weakTitle.trim()) return;
                  addWeakConcept({
                    week: weakWeek,
                    title: weakTitle.trim(),
                    notes: weakNotes.trim(),
                    source: 'manual',
                  });
                  setWeakTitle('');
                  setWeakNotes('');
                }}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2.5"
              >
                <select
                  value={weakWeek}
                  onChange={(e) => setWeakWeek(Number(e.target.value))}
                  className="sm:col-span-3 px-2.5 py-2 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
                >
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w}>
                      Week {w}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  required
                  value={weakTitle}
                  onChange={(e) => setWeakTitle(e.target.value)}
                  placeholder="Concept name..."
                  className="sm:col-span-5 px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A]"
                />
                <input
                  type="text"
                  value={weakNotes}
                  onChange={(e) => setWeakNotes(e.target.value)}
                  placeholder="Notes (optional)"
                  className="sm:col-span-4 px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A]"
                />
                <button
                  type="submit"
                  className="sm:col-span-12 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Weak Concept</span>
                </button>
              </form>

              {state.weakConcepts.length === 0 ? (
                <p className="py-6 text-xs text-[#64748B] text-center">
                  No weak concepts logged yet. Flag concepts from the Study Room, Flashcards, or
                  missed quiz questions.
                </p>
              ) : (
                <div className="divide-y divide-[#F1F5F9]">
                  {state.weakConcepts.map((wc) => (
                    <div
                      key={wc.id}
                      className="py-3 flex items-start justify-between gap-3"
                    >
                      <label className="flex items-start gap-2.5 cursor-pointer min-w-0">
                        <input
                          type="checkbox"
                          checked={wc.resolved}
                          onChange={() => toggleWeakConceptResolved(wc.id)}
                          className="mt-1 h-4 w-4 rounded border-[#CBD5E1] text-[#059669]"
                        />
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-medium ${
                              wc.resolved ? 'line-through text-[#94A3B8]' : 'text-[#0F172A]'
                            }`}
                          >
                            {wc.title}
                          </p>
                          <p className="text-xs text-[#64748B]">
                            Week {wc.week} · source: {wc.source}
                          </p>
                          {wc.notes && (
                            <p className="text-xs text-[#475569] mt-0.5">{wc.notes}</p>
                          )}
                        </div>
                      </label>
                      <button
                        type="button"
                        aria-label="Delete weak concept"
                        onClick={() => deleteWeakConcept(wc.id)}
                        className="p-1 text-[#94A3B8] hover:text-[#DC2626] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          <div className="lg:col-span-5">
            <SectionCard className="p-5 space-y-3">
              <h2 className="text-base font-semibold text-[#0F172A]">Quiz Attempt History</h2>
              {state.quizAttempts.length === 0 ? (
                <p className="py-6 text-xs text-[#64748B] text-center">
                  Complete any weekly quiz to record scores here.
                </p>
              ) : (
                <div className="divide-y divide-[#F1F5F9]">
                  {state.quizAttempts.map((att) => {
                    const pct = Math.round((att.score / Math.max(1, att.total)) * 100);
                    return (
                      <div key={att.id} className="py-2.5 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-[#0F172A]">
                            Week {att.week} Quiz
                          </p>
                          <p className="text-[11px] text-[#64748B]">
                            {new Date(att.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-semibold tabular-nums ${
                            pct >= 70 ? 'text-[#047857]' : 'text-[#B45309]'
                          }`}
                        >
                          {att.score}/{att.total} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
}
