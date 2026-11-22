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
          <h1 className="text-2xl font-display font-medium text-[var(--color-ink)] tracking-tight">
            Revision &amp; Assessments
          </h1>
          <p className="text-sm text-[var(--color-secondary)] mt-1">
            Curated offline active-recall bank grounded in the 20-week DataMites syllabus and
            verified supplements. Zero external AI API calls.
          </p>
        </div>
        <ProvenanceInline label="SUPPLEMENTARY_PRACTICE_PROPOSED" />
      </div>

      {/* Sub-navigation tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--color-line-soft)] pb-2">
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
            className={`min-h-[44px] px-3.5 py-2 text-xs font-mono transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === t.id
                ? 'bg-[var(--color-ink)] text-[var(--color-paper)] border border-[var(--color-ink)] font-semibold'
                : 'bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-secondary)] hover:bg-[var(--color-sunken)]'
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
              <div className="flex flex-wrap items-center gap-4 text-xs tabular-nums font-mono">
                <span className="font-medium text-[var(--color-ink)]">
                  Known: <span className="font-bold">{flashcardStats.known}</span>
                </span>
                <span className="font-medium text-[var(--color-secondary)]">
                  Needs Review: <span className="font-semibold text-[var(--color-ink)]">{flashcardStats.needsReview}</span>
                </span>
                <span className="font-medium text-[var(--color-secondary)]">
                  Unreviewed: <span className="font-semibold">{flashcardStats.unreviewed}</span>
                </span>
              </div>
              <div className="w-full md:w-56">
                <ProgressBar
                  value={flashcardStats.known}
                  max={flashcardStats.total}
                  colorClass="bg-[var(--color-ink)]"
                  heightClass="h-1.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3 border-t border-[var(--color-line-soft)]">
              <select
                aria-label="Filter flashcards by DataMites week"
                value={fcWeekFilter}
                onChange={(e) => {
                  setFcWeekFilter(e.target.value === 'all' ? 'all' : Number(e.target.value));
                  setFcIndex(0);
                  setIsFlipped(false);
                }}
                className="min-h-[44px] px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs text-[var(--color-ink)]"
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
                className="min-h-[44px] px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs text-[var(--color-ink)]"
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
                className="min-h-[44px] px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs text-[var(--color-ink)]"
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
                  className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sunken)] active:bg-[var(--color-sunken)] text-xs font-medium text-[var(--color-ink)] whitespace-nowrap shrink-0 cursor-pointer"
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
                  className="min-h-[44px] px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sunken)] active:bg-[var(--color-sunken)] text-xs font-medium text-[var(--color-secondary)] hover:text-[var(--color-ink)] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Reset Order
                </button>
              </div>
            </div>
          </SectionCard>

          {/* Interactive 3D Flashcard Deck */}
          {!activeCard ? (
            <SectionCard className="p-8 sm:p-10 text-center space-y-2">
              <Layers className="w-8 h-8 text-[var(--color-secondary)] mx-auto" />
              <p className="text-sm font-medium text-[var(--color-ink)]">
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
                className="mt-2 min-h-[44px] px-3.5 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sunken)] text-xs font-medium text-[var(--color-ink)] cursor-pointer"
              >
                Reset filters
              </button>
            </SectionCard>
          ) : (
            <div className="w-full max-w-3xl mx-auto space-y-4 px-0 sm:px-1">
              {/* Progress indicator */}
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs text-[var(--color-secondary)] px-1">
                <span className="tabular-nums font-mono font-bold text-[var(--color-ink)] shrink-0">
                  Card {safeFcIndex + 1} of {filteredCards.length}
                </span>
                <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs min-w-0">
                  <span className="shrink-0 font-medium text-[var(--color-ink)]">Week {activeCard.week}</span>
                  <span className="text-[var(--color-line-soft)]">·</span>
                  <span className="truncate max-w-[130px] sm:max-w-[260px] md:max-w-none text-[var(--color-secondary)]" title={activeCard.topicLabel}>
                    {activeCard.topicLabel}
                  </span>
                  <span className="text-[var(--color-line-soft)]">·</span>
                  <span
                    className={`font-semibold shrink-0 ${
                      activeCardStatus === 'known'
                        ? 'text-[var(--color-ink)] font-bold'
                        : activeCardStatus === 'needs_review'
                          ? 'text-[var(--color-ink)] underline decoration-[var(--color-line)]'
                          : 'text-[var(--color-secondary)]'
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
                  className={`relative w-full min-h-[350px] sm:min-h-[320px] transition-transform duration-500 preserve-3d ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* FRONT */}
                  <div className="absolute inset-0 backface-hidden bg-[var(--color-surface)] border border-[var(--color-line)] p-5 sm:p-8 flex flex-col justify-between shadow-none">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono font-bold text-[11px] tracking-wider uppercase text-[var(--color-ink)]">
                        Question · Week {activeCard.week}
                      </span>
                      <ProvenanceInline label={activeCard.provenance} />
                    </div>

                    <div className="my-auto py-5 sm:py-6 text-center">
                      <p className="text-base sm:text-xl font-display font-medium text-[var(--color-ink)] leading-snug">
                        {activeCard.front}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[var(--color-secondary)] border-t border-[var(--color-line-soft)] pt-3">
                      <span className="truncate max-w-[180px] sm:max-w-none text-[11px] sm:text-xs">
                        Topic: {activeCard.topicLabel}
                      </span>
                      <span className="text-[11px] shrink-0">
                        <span className="hidden sm:inline">Click card or press Space to flip</span>
                        <span className="sm:hidden">Tap card to flip</span>
                      </span>
                    </div>
                  </div>

                  {/* BACK */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[var(--color-sunken)] border border-[var(--color-line)] p-5 sm:p-8 flex flex-col justify-between shadow-none overflow-y-auto">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono font-bold text-[11px] tracking-wider uppercase text-[var(--color-ink)]">
                        Answer &amp; Definition
                      </span>
                      <span className="text-[var(--color-secondary)] text-[11px] sm:text-xs truncate max-w-[150px] sm:max-w-none">
                        {activeCard.topicLabel}
                      </span>
                    </div>

                    <div className="my-auto py-3 sm:py-4 space-y-3">
                      <p className="text-xs sm:text-sm text-[var(--color-ink)] leading-relaxed font-body">
                        {activeCard.back}
                      </p>
                      <div className="p-3 bg-[var(--color-surface)] border border-[var(--color-line-soft)]">
                        <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--color-ink)] mb-1">
                          Practical AI Engineering Nuance
                        </p>
                        <p className="text-xs text-[var(--color-secondary)] leading-relaxed">
                          {activeCard.practicalNuance}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[var(--color-secondary)] border-t border-[var(--color-line-soft)] pt-3">
                      <span className="text-[11px]">
                        <span className="hidden sm:inline">Click to flip back</span>
                        <span className="sm:hidden">Tap to flip back</span>
                      </span>
                      <span className="hidden sm:inline text-[11px]">
                        Press K (Known) or R (Needs Review)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div className="space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3 pt-1">
                {/* Navigation Row: On mobile 3 equal columns; on desktop flex */}
                <div className="grid grid-cols-3 gap-2 w-full sm:w-auto sm:flex sm:items-center">
                  <button
                    type="button"
                    onClick={goPrevCard}
                    aria-label="Previous flashcard"
                    className="min-h-[44px] inline-flex items-center justify-center gap-1 px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sunken)] active:bg-[var(--color-sunken)] text-xs font-medium text-[var(--color-ink)] cursor-pointer select-none"
                  >
                    <ChevronLeft className="w-4 h-4 shrink-0" />
                    <span>Prev</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFlipped((f) => !f)}
                    aria-label={isFlipped ? 'Flip to question' : 'Flip to answer'}
                    className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sunken)] active:bg-[var(--color-sunken)] text-xs font-medium text-[var(--color-ink)] cursor-pointer select-none"
                  >
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                    <span>Flip</span>
                  </button>
                  <button
                    type="button"
                    onClick={goNextCard}
                    aria-label="Next flashcard"
                    className="min-h-[44px] inline-flex items-center justify-center gap-1 px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sunken)] active:bg-[var(--color-sunken)] text-xs font-medium text-[var(--color-ink)] cursor-pointer select-none"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4 shrink-0" />
                  </button>
                </div>

                {/* Mastery Rating Row: On mobile 2 equal columns; on desktop flex */}
                <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
                  <button
                    type="button"
                    onClick={() => handleMarkCard('needs_review')}
                    aria-label="Mark flashcard as needs review"
                    className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sunken)] active:bg-[var(--color-sunken)] text-[var(--color-ink)] text-xs font-semibold cursor-pointer select-none"
                  >
                    <Flag className="w-3.5 h-3.5 shrink-0" />
                    <span>Needs Review</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkCard('known')}
                    aria-label="Mark flashcard as known"
                    className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 border border-[var(--color-ink)] bg-[var(--color-ink)] hover:bg-[var(--color-secondary)] active:bg-[var(--color-secondary)] text-[var(--color-paper)] text-xs font-semibold cursor-pointer select-none"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Mark Known</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-1">
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
                  className="min-h-[44px] py-2 text-xs text-[var(--color-secondary)] hover:text-[var(--color-ink)] cursor-pointer inline-flex items-center gap-1"
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
              <h2 className="text-base font-serif font-bold text-[var(--color-ink)]">
                Offline Concept Quiz · Week {quizWeek}
              </h2>
              <p className="text-xs font-mono text-[var(--color-secondary)] mt-0.5">
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
                className="min-h-[44px] px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-mono text-[var(--color-ink)]"
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
                  className="min-h-[44px] px-3.5 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sunken)] text-xs font-mono font-bold text-[var(--color-ink)] cursor-pointer"
                >
                  Retake
                </button>
              )}
            </div>
          </SectionCard>

          {quizResult && (
            <SectionCard className="p-4 bg-[var(--color-sunken)] border border-[var(--color-line)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-mono font-bold text-[var(--color-ink)] tabular-nums">
                  Score: {quizResult.score} / {quizResult.total} (
                  {Math.round((quizResult.score / Math.max(1, quizResult.total)) * 100)}%)
                </p>
                <p className="text-xs text-[var(--color-secondary)] mt-0.5">
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
                  className="min-h-[44px] px-3.5 py-2 border border-[var(--color-ink)] bg-[var(--color-signal)] text-[var(--color-ink)] text-xs font-mono font-bold hover:brightness-95 whitespace-nowrap shrink-0 cursor-pointer"
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
                  <div className="flex items-center justify-between text-xs font-mono text-[var(--color-secondary)]">
                    <span className="font-bold text-[var(--color-ink)]">
                      Question {idx + 1} · {q.topicLabel}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[var(--color-ink)]">{q.question}</p>
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = chosen === optIdx;
                      const isCorrect = q.correctIndex === optIdx;
                      let optionClasses =
                        'border-[var(--color-line-soft)] bg-[var(--color-surface)] hover:bg-[var(--color-sunken)] text-[var(--color-ink)]';
                      if (quizSubmitted) {
                        if (isCorrect) {
                          optionClasses =
                            'border-2 border-[var(--color-ink)] bg-[var(--color-surface)] text-[var(--color-ink)] font-bold';
                        } else if (isSelected && !isCorrect) {
                          optionClasses = 'border border-[var(--color-line)] bg-[var(--color-sunken)] text-[var(--color-secondary)] line-through';
                        } else {
                          optionClasses = 'border border-[var(--color-line-soft)] bg-[var(--color-surface)] text-[var(--color-secondary)] opacity-60';
                        }
                      } else if (isSelected) {
                        optionClasses =
                          'border-2 border-[var(--color-ink)] bg-[var(--color-sunken)] text-[var(--color-ink)] font-bold';
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          disabled={quizSubmitted}
                          onClick={() =>
                            setQuizSelections((prev) => ({ ...prev, [q.id]: optIdx }))
                          }
                          className={`min-h-[44px] w-full text-left px-3.5 py-2.5 border text-xs sm:text-sm font-mono transition-colors cursor-pointer ${optionClasses}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {quizSubmitted && (
                    <div className="p-3 bg-[var(--color-sunken)]/50 border border-[var(--color-line-soft)] text-xs text-[var(--color-secondary)]">
                      <span className="font-mono font-bold text-[var(--color-ink)]">Explanation:</span>{' '}
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
                className="min-h-[44px] px-5 py-2.5 border border-[var(--color-ink)] bg-[var(--color-signal)] disabled:bg-[var(--color-sunken)] disabled:text-[var(--color-secondary)] text-[var(--color-ink)] text-xs font-mono font-bold cursor-pointer transition-colors"
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
              <h2 className="text-base font-serif font-bold text-[var(--color-ink)]">
                Short-Answer Conceptual Checks · Week {saWeek}
              </h2>
              <p className="text-xs text-[var(--color-secondary)] mt-0.5">
                Write your explanation first, then compare against the model answer and key
                checkpoints.
              </p>
            </div>
            <select
              aria-label="Select short answer week"
              value={saWeek}
              onChange={(e) => setSaWeek(Number(e.target.value))}
              className="min-h-[44px] px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-mono text-[var(--color-ink)]"
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
                <div className="flex items-center gap-2 text-xs text-[var(--color-ink)] font-mono font-bold">
                  <HelpCircle className="w-4 h-4 text-[var(--color-ink)]" />
                  <span>{sa.topicLabel}</span>
                </div>
                <p className="text-sm font-medium text-[var(--color-ink)]">{sa.prompt}</p>
                <textarea
                  rows={4}
                  value={saDrafts[sa.id] ?? ''}
                  onChange={(e) => setSaDrafts((p) => ({ ...p, [sa.id]: e.target.value }))}
                  placeholder="Draft your explanation in your own words before revealing the model answer..."
                  className="w-full px-3 py-2.5 border border-[var(--color-line)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)]"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSaRevealed((p) => ({ ...p, [sa.id]: !revealed }))}
                    className="min-h-[44px] px-3.5 py-2 border border-[var(--color-ink)] bg-[var(--color-ink)] hover:bg-[var(--color-secondary)] text-[var(--color-paper)] text-xs font-mono font-bold cursor-pointer transition-colors"
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
                    className="min-h-[44px] px-3.5 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-mono text-[var(--color-ink)] hover:bg-[var(--color-sunken)] cursor-pointer transition-colors"
                  >
                    Flag as Weak Concept
                  </button>
                </div>

                {revealed && (
                  <div className="p-4 bg-[var(--color-sunken)]/50 border border-[var(--color-line-soft)] space-y-3 text-xs text-[var(--color-secondary)]">
                    <div>
                      <p className="font-mono font-bold uppercase tracking-wider text-[11px] text-[var(--color-ink)] mb-1">Model Answer</p>
                      <p className="leading-relaxed">{sa.modelAnswer}</p>
                    </div>
                    <div>
                      <p className="font-mono font-bold uppercase tracking-wider text-[11px] text-[var(--color-ink)] mb-1">Key Checkpoints</p>
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
              <h2 className="text-base font-serif font-bold text-[var(--color-ink)]">
                Offline Coding &amp; Debugging Challenges
              </h2>
              <p className="text-xs text-[var(--color-secondary)] mt-0.5">
                Synced directly with your Weekly Study Room practical exercise logs.
              </p>
            </div>
            <select
              aria-label="Filter coding challenges by week"
              value={codingWeek}
              onChange={(e) =>
                setCodingWeek(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="min-h-[44px] px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-mono text-[var(--color-ink)]"
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
                      <div className="flex items-center gap-2 text-xs text-[var(--color-ink)] font-mono font-bold">
                        <Code2 className="w-4 h-4 text-[var(--color-ink)]" />
                        <span>
                          Week {ex.week} · {ex.type.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="text-sm font-serif font-bold text-[var(--color-ink)]">{ex.title}</h3>
                      <p className="text-xs text-[var(--color-secondary)] leading-relaxed">{ex.prompt}</p>
                    </div>
                    <select
                      aria-label={`Status for ${ex.title}`}
                      value={status}
                      onChange={(e) =>
                        updatePracticeLog(ex.id, ex.week, {
                          status: e.target.value as 'not_started' | 'in_progress' | 'completed',
                        })
                      }
                      className="min-h-[44px] px-2.5 py-1.5 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-mono text-[var(--color-ink)] shrink-0 cursor-pointer"
                    >
                      <option value="not_started">Not started</option>
                      <option value="in_progress">In progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  {ex.starterCode && (
                    <pre className="p-3 bg-[var(--color-ink)] text-[var(--color-surface)] text-xs font-mono overflow-x-auto border border-[var(--color-line)]">
                      <code>{ex.starterCode}</code>
                    </pre>
                  )}

                  <button
                    type="button"
                    onClick={() => setCodingHints((p) => ({ ...p, [ex.id]: !showHint }))}
                    className="min-h-[44px] inline-flex items-center text-xs font-mono font-bold text-[var(--color-ink)] hover:underline cursor-pointer"
                  >
                    {showHint ? 'Hide Hint & Reference Approach' : 'Show Hint & Reference Approach'}
                  </button>

                  {showHint && (
                    <div className="p-3 bg-[var(--color-sunken)]/50 border border-[var(--color-line-soft)] text-xs text-[var(--color-secondary)] space-y-1 font-mono">
                      <p>
                        <span className="font-bold text-[var(--color-ink)]">Hint:</span> {ex.hint}
                      </p>
                      <p>
                        <span className="font-bold text-[var(--color-ink)]">Reference:</span>{' '}
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
              <h2 className="text-base font-serif font-bold text-[var(--color-ink)]">Weak Concepts Queue</h2>
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
                  className="min-h-[44px] sm:col-span-3 px-2.5 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-mono text-[var(--color-ink)]"
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
                  className="min-h-[44px] sm:col-span-5 px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs text-[var(--color-ink)]"
                />
                <input
                  type="text"
                  value={weakNotes}
                  onChange={(e) => setWeakNotes(e.target.value)}
                  placeholder="Notes (optional)"
                  className="min-h-[44px] sm:col-span-4 px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs text-[var(--color-ink)]"
                />
                <button
                  type="submit"
                  className="min-h-[44px] sm:col-span-12 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 border border-[var(--color-ink)] bg-[var(--color-signal)] text-[var(--color-ink)] text-xs font-mono font-bold hover:brightness-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Weak Concept</span>
                </button>
              </form>

              {state.weakConcepts.length === 0 ? (
                <p className="py-6 text-xs font-mono text-[var(--color-secondary)] text-center">
                  No weak concepts logged yet. Flag concepts from the Study Room, Flashcards, or
                  missed quiz questions.
                </p>
              ) : (
                <div className="divide-y divide-[var(--color-line-soft)]">
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
                          className="mt-1 h-4 w-4 border border-[var(--color-line)] text-[var(--color-ink)] accent-[var(--color-ink)]"
                        />
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-medium ${
                              wc.resolved ? 'line-through text-[var(--color-secondary)]' : 'text-[var(--color-ink)]'
                            }`}
                          >
                            {wc.title}
                          </p>
                          <p className="text-xs font-mono text-[var(--color-secondary)]">
                            Week {wc.week} · source: {wc.source}
                          </p>
                          {wc.notes && (
                            <p className="text-xs text-[var(--color-secondary)] mt-0.5">{wc.notes}</p>
                          )}
                        </div>
                      </label>
                      <button
                        type="button"
                        aria-label="Delete weak concept"
                        onClick={() => deleteWeakConcept(wc.id)}
                        className="min-h-[44px] min-w-[44px] p-2 text-[var(--color-secondary)] hover:text-[var(--color-ink)] cursor-pointer inline-flex items-center justify-center"
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
              <h2 className="text-base font-serif font-bold text-[var(--color-ink)]">Quiz Attempt History</h2>
              {state.quizAttempts.length === 0 ? (
                <p className="py-6 text-xs font-mono text-[var(--color-secondary)] text-center">
                  Complete any weekly quiz to record scores here.
                </p>
              ) : (
                <div className="divide-y divide-[var(--color-line-soft)]">
                  {state.quizAttempts.map((att) => {
                    const pct = Math.round((att.score / Math.max(1, att.total)) * 100);
                    return (
                      <div key={att.id} className="py-2.5 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-mono font-bold text-[var(--color-ink)]">
                            Week {att.week} Quiz
                          </p>
                          <p className="text-[11px] font-mono text-[var(--color-secondary)]">
                            {new Date(att.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-xs font-mono font-bold tabular-nums text-[var(--color-ink)]">
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
