import React, { useMemo, useState } from 'react';
import { BookText, CheckCircle2, ChevronDown, ChevronRight, Plus, Search, Trash2 } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { JournalEntryRecord } from '../types';
import { SectionCard } from '../components/StatusPrimitives';

function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

interface JournalFormState {
  id?: string;
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
}

export function JournalView() {
  const { state, saveJournalEntry, deleteJournalEntry } = useAppState();

  const createBlank = (): JournalFormState => ({
    date: todayDateStr(),
    week: state.profile.currentWeek,
    learnedToday: '',
    implemented: '',
    problemsEncountered: '',
    howSolved: '',
    unclearConcepts: '',
    mentorQuestions: '',
    mentorResolved: false,
    nextSession: '',
  });

  const [form, setForm] = useState<JournalFormState>(createBlank);
  const [searchQuery, setSearchQuery] = useState('');
  const [weekFilter, setWeekFilter] = useState<'all' | number>('all');
  const [onlyUnresolvedMentor, setOnlyUnresolvedMentor] = useState(false);

  // 3 collapsible form section states
  const [sectionsOpen, setSectionsOpen] = useState({
    understanding: true,
    codeBugs: true,
    mentorNext: true,
  });

  const toggleSection = (sec: 'understanding' | 'codeBugs' | 'mentorNext') => {
    setSectionsOpen((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.journalEntries.filter((e) => {
      if (weekFilter !== 'all' && e.week !== weekFilter) return false;
      if (onlyUnresolvedMentor && (!e.mentorQuestions.trim() || e.mentorResolved)) return false;
      if (q) {
        const hay = `${e.learnedToday} ${e.implemented} ${e.problemsEncountered} ${e.howSolved} ${e.unclearConcepts} ${e.mentorQuestions} ${e.nextSession}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [state.journalEntries, searchQuery, weekFilter, onlyUnresolvedMentor]);

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form.learnedToday.trim() && !form.implemented.trim()) return;
    saveJournalEntry(
      {
        date: form.date || todayDateStr(),
        week: form.week,
        learnedToday: form.learnedToday.trim(),
        implemented: form.implemented.trim(),
        problemsEncountered: form.problemsEncountered.trim(),
        howSolved: form.howSolved.trim(),
        unclearConcepts: form.unclearConcepts.trim(),
        mentorQuestions: form.mentorQuestions.trim(),
        mentorResolved: form.mentorResolved,
        nextSession: form.nextSession.trim(),
      },
      form.id
    );
    setForm(createBlank());
  };

  const handleEdit = (entry: JournalEntryRecord) => {
    setForm({
      id: entry.id,
      date: entry.date,
      week: entry.week,
      learnedToday: entry.learnedToday,
      implemented: entry.implemented,
      problemsEncountered: entry.problemsEncountered,
      howSolved: entry.howSolved,
      unclearConcepts: entry.unclearConcepts,
      mentorQuestions: entry.mentorQuestions,
      mentorResolved: entry.mentorResolved,
      nextSession: entry.nextSession,
    });
    // Ensure all sections are expanded when editing
    setSectionsOpen({ understanding: true, codeBugs: true, mentorNext: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleMentorResolved = (entry: JournalEntryRecord) => {
    saveJournalEntry(
      {
        date: entry.date,
        week: entry.week,
        learnedToday: entry.learnedToday,
        implemented: entry.implemented,
        problemsEncountered: entry.problemsEncountered,
        howSolved: entry.howSolved,
        unclearConcepts: entry.unclearConcepts,
        mentorQuestions: entry.mentorQuestions,
        mentorResolved: !entry.mentorResolved,
        nextSession: entry.nextSession,
      },
      entry.id
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-medium text-[var(--color-ink)] tracking-tight">
          Learning Journal
        </h1>
        <p className="text-sm text-[var(--color-secondary)] mt-1 max-w-3xl">
          Capture structured engineering reflections, debugging breakthroughs, unclear concepts, and
          questions for your DataMites mentor.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Structured 7-Field Form Grouped in 3 Collapsible Sections */}
        <SectionCard className="lg:col-span-5 p-4 sm:p-5 self-start border border-[var(--color-line)] bg-[var(--color-surface)]">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--color-line)]">
            <h2 className="text-base font-display font-semibold text-[var(--color-ink)]">
              {form.id ? 'Edit Journal Entry' : 'New Study Reflection'}
            </h2>
            {form.id && (
              <button
                type="button"
                onClick={() => setForm(createBlank())}
                className="min-h-[44px] text-xs font-mono text-[var(--color-secondary)] hover:text-[var(--color-ink)] underline cursor-pointer inline-flex items-center"
              >
                Cancel edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Meta Row: Date & Week */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="min-h-[44px] w-full px-2.5 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-mono text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)]"
                />
              </div>
              <div>
                <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1">
                  DataMites Week
                </label>
                <select
                  value={form.week}
                  onChange={(e) => setForm({ ...form, week: Number(e.target.value) })}
                  className="min-h-[44px] w-full px-2.5 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-mono text-[var(--color-ink)] cursor-pointer focus:outline-none focus:border-[var(--color-ink)]"
                >
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w}>
                      Week {w}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section 1: Understanding */}
            <div className="border border-[var(--color-line-soft)] bg-[var(--color-surface)] overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('understanding')}
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-[var(--color-sunken)] border-b border-[var(--color-line-soft)] flex items-center justify-between text-left cursor-pointer select-none"
              >
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-ink)]">
                  1. Understanding
                </span>
                {sectionsOpen.understanding ? (
                  <ChevronDown className="w-4 h-4 text-[var(--color-secondary)] shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[var(--color-secondary)] shrink-0" />
                )}
              </button>
              {sectionsOpen.understanding && (
                <div className="p-3.5 space-y-3">
                  <div>
                    <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1">
                      1. What I learned today
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={form.learnedToday}
                      onChange={(e) => setForm({ ...form, learnedToday: e.target.value })}
                      placeholder="Key concepts understood from DataMites or supplements..."
                      className="w-full px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs text-[var(--color-ink)] font-body focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1">
                      5. Concepts I still do not understand
                    </label>
                    <textarea
                      rows={2}
                      value={form.unclearConcepts}
                      onChange={(e) => setForm({ ...form, unclearConcepts: e.target.value })}
                      placeholder="Concepts requiring revision or clarification..."
                      className="w-full px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs text-[var(--color-ink)] font-body focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Code & Bugs */}
            <div className="border border-[var(--color-line-soft)] bg-[var(--color-surface)] overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('codeBugs')}
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-[var(--color-sunken)] border-b border-[var(--color-line-soft)] flex items-center justify-between text-left cursor-pointer select-none"
              >
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-ink)]">
                  2. Code &amp; Bugs
                </span>
                {sectionsOpen.codeBugs ? (
                  <ChevronDown className="w-4 h-4 text-[var(--color-secondary)] shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[var(--color-secondary)] shrink-0" />
                )}
              </button>
              {sectionsOpen.codeBugs && (
                <div className="p-3.5 space-y-3">
                  <div>
                    <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1">
                      2. What I implemented
                    </label>
                    <textarea
                      rows={2}
                      value={form.implemented}
                      onChange={(e) => setForm({ ...form, implemented: e.target.value })}
                      placeholder="Scripts, notebooks, models, or experiments coded..."
                      className="w-full px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs text-[var(--color-ink)] font-body focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1">
                      3. Problems encountered
                    </label>
                    <textarea
                      rows={2}
                      value={form.problemsEncountered}
                      onChange={(e) => setForm({ ...form, problemsEncountered: e.target.value })}
                      placeholder="Bugs, shape mismatches, environment issues, or math confusion..."
                      className="w-full px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs text-[var(--color-ink)] font-body focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1">
                      4. How I solved them
                    </label>
                    <textarea
                      rows={2}
                      value={form.howSolved}
                      onChange={(e) => setForm({ ...form, howSolved: e.target.value })}
                      placeholder="Root cause, insight, and solution..."
                      className="w-full px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs text-[var(--color-ink)] font-body focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Mentor & Next */}
            <div className="border border-[var(--color-line-soft)] bg-[var(--color-surface)] overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('mentorNext')}
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-[var(--color-sunken)] border-b border-[var(--color-line-soft)] flex items-center justify-between text-left cursor-pointer select-none"
              >
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-ink)]">
                  3. Mentor &amp; Next
                </span>
                {sectionsOpen.mentorNext ? (
                  <ChevronDown className="w-4 h-4 text-[var(--color-secondary)] shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[var(--color-secondary)] shrink-0" />
                )}
              </button>
              {sectionsOpen.mentorNext && (
                <div className="p-3.5 space-y-3">
                  <div>
                    <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1">
                      6. Questions to ask the DataMites mentor
                    </label>
                    <textarea
                      rows={2}
                      value={form.mentorQuestions}
                      onChange={(e) => setForm({ ...form, mentorQuestions: e.target.value })}
                      placeholder="Specific questions for your next live class or mentoring session..."
                      className="w-full px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs text-[var(--color-ink)] font-body focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1">
                      7. Next study session
                    </label>
                    <input
                      type="text"
                      value={form.nextSession}
                      onChange={(e) => setForm({ ...form, nextSession: e.target.value })}
                      placeholder="Exact next task to start with..."
                      className="min-h-[44px] w-full px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs text-[var(--color-ink)] font-body focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="min-h-[44px] w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[var(--color-signal)] border border-[var(--color-ink)] text-xs font-mono font-bold text-[var(--color-ink)] hover:brightness-95 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{form.id ? 'Update Entry' : 'Save Journal Entry'}</span>
            </button>
          </form>
        </SectionCard>

        {/* Entries List: Editorial History */}
        <div className="lg:col-span-7 space-y-4">
          <SectionCard className="p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center border border-[var(--color-line)] bg-[var(--color-surface)]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[var(--color-secondary)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search journal entries..."
                className="w-full min-h-[44px] pl-9 pr-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-body text-[var(--color-ink)] placeholder:text-[var(--color-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)]"
              />
            </div>
            <select
              aria-label="Filter journal by week"
              value={weekFilter}
              onChange={(e) =>
                setWeekFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="min-h-[44px] px-2.5 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-mono text-[var(--color-ink)] cursor-pointer focus:outline-none focus:border-[var(--color-ink)]"
            >
              <option value="all">All Weeks</option>
              {Array.from({ length: 20 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  Week {w}
                </option>
              ))}
            </select>
            <label className="min-h-[44px] inline-flex items-center gap-2 text-xs font-mono text-[var(--color-ink)] whitespace-nowrap shrink-0 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyUnresolvedMentor}
                onChange={(e) => setOnlyUnresolvedMentor(e.target.checked)}
                className="h-4 w-4 rounded-none border border-[var(--color-line)] accent-[var(--color-ink)]"
              />
              <span>Unresolved Mentor Qs</span>
            </label>
          </SectionCard>

          {filteredEntries.length === 0 ? (
            <SectionCard className="p-10 text-center border border-[var(--color-line)] bg-[var(--color-surface)]">
              <BookText className="w-8 h-8 text-[var(--color-secondary)] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[var(--color-ink)]">No journal entries found</p>
              <p className="text-xs text-[var(--color-secondary)] font-mono mt-1">
                Log what you built and learned after each study session.
              </p>
            </SectionCard>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <SectionCard key={entry.id} className="p-4 sm:p-5 space-y-3.5 border border-[var(--color-line)] bg-[var(--color-surface)]">
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--color-line-soft)]">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="font-semibold text-[var(--color-ink)] tabular-nums">
                        {entry.date}
                      </span>
                      <span className="text-[var(--color-line)]">·</span>
                      <span className="font-semibold text-[var(--color-ink)] bg-[var(--color-sunken)] border border-[var(--color-line-soft)] px-1.5 py-0.5">
                        Week {entry.week}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(entry)}
                        className="min-h-[44px] min-w-[44px] px-2.5 py-1.5 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-mono font-medium text-[var(--color-ink)] hover:bg-[var(--color-sunken)] cursor-pointer inline-flex items-center justify-center transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        aria-label="Delete journal entry"
                        onClick={() => deleteJournalEntry(entry.id)}
                        className="min-h-[44px] min-w-[44px] p-2 border border-[var(--color-line-soft)] text-[var(--color-secondary)] hover:text-[var(--color-ink)] hover:border-[var(--color-ink)] hover:bg-[var(--color-sunken)] cursor-pointer inline-flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs leading-relaxed text-[var(--color-secondary)]">
                    {entry.learnedToday && (
                      <p className="break-words">
                        <span className="font-mono font-semibold text-[var(--color-ink)]">Learned:</span>{' '}
                        {entry.learnedToday}
                      </p>
                    )}
                    {entry.implemented && (
                      <p className="break-words">
                        <span className="font-mono font-semibold text-[var(--color-ink)]">Implemented:</span>{' '}
                        {entry.implemented}
                      </p>
                    )}
                    {entry.problemsEncountered && (
                      <p className="break-words">
                        <span className="font-mono font-semibold text-[var(--color-ink)]">Problems:</span>{' '}
                        {entry.problemsEncountered}
                      </p>
                    )}
                    {entry.howSolved && (
                      <p className="break-words">
                        <span className="font-mono font-semibold text-[var(--color-ink)]">Solved by:</span>{' '}
                        {entry.howSolved}
                      </p>
                    )}
                    {entry.unclearConcepts && (
                      <p className="break-words">
                        <span className="font-mono font-semibold text-[var(--color-ink)] underline">Still unclear:</span>{' '}
                        {entry.unclearConcepts}
                      </p>
                    )}
                    {entry.mentorQuestions && (
                      <div className="p-3 border border-[var(--color-line)] bg-[var(--color-sunken)]/40 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <p className="text-[var(--color-ink)] break-words">
                          <span className="font-mono font-semibold">Mentor question:</span>{' '}
                          {entry.mentorQuestions}
                        </p>
                        <button
                          type="button"
                          onClick={() => toggleMentorResolved(entry)}
                          className={`min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-mono font-medium whitespace-nowrap shrink-0 cursor-pointer select-none transition-colors ${
                            entry.mentorResolved
                              ? 'border border-[var(--color-ink)] bg-[var(--color-sunken)] text-[var(--color-ink)] font-bold'
                              : 'border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-secondary)] hover:text-[var(--color-ink)] hover:border-[var(--color-ink)]'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{entry.mentorResolved ? 'Answered' : 'Mark Answered'}</span>
                        </button>
                      </div>
                    )}
                    {entry.nextSession && (
                      <p className="break-words font-mono text-[11px] text-[var(--color-ink)] pt-1">
                        <span className="font-semibold uppercase tracking-wider text-[var(--color-secondary)]">Next session:</span>{' '}
                        {entry.nextSession}
                      </p>
                    )}
                  </div>
                </SectionCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
