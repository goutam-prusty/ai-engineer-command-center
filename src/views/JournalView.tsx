import React, { useMemo, useState } from 'react';
import { BookText, CheckCircle2, Plus, Search, Trash2 } from 'lucide-react';
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
        <h1 className="text-2xl font-semibold text-[#0F172A] tracking-tight">Learning Journal</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Capture structured engineering reflections, debugging breakthroughs, unclear concepts, and
          questions for your DataMites mentor.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Structured 7-Field Form */}
        <SectionCard className="lg:col-span-5 p-5 self-start">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <h2 className="text-base font-semibold text-[#0F172A]">
              {form.id ? 'Edit Journal Entry' : 'New Study Reflection'}
            </h2>
            {form.id && (
              <button
                type="button"
                onClick={() => setForm(createBlank())}
                className="text-xs text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                Cancel edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#334155] mb-1">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#334155] mb-1">
                  DataMites Week
                </label>
                <select
                  value={form.week}
                  onChange={(e) => setForm({ ...form, week: Number(e.target.value) })}
                  className="w-full px-2.5 py-2 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
                >
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w}>
                      Week {w}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#334155] mb-1">
                1. What I learned today
              </label>
              <textarea
                rows={2}
                required
                value={form.learnedToday}
                onChange={(e) => setForm({ ...form, learnedToday: e.target.value })}
                placeholder="Key concepts understood from DataMites or supplements..."
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#334155] mb-1">
                2. What I implemented
              </label>
              <textarea
                rows={2}
                value={form.implemented}
                onChange={(e) => setForm({ ...form, implemented: e.target.value })}
                placeholder="Scripts, notebooks, models, or experiments coded..."
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#334155] mb-1">
                3. Problems encountered
              </label>
              <textarea
                rows={2}
                value={form.problemsEncountered}
                onChange={(e) => setForm({ ...form, problemsEncountered: e.target.value })}
                placeholder="Bugs, shape mismatches, environment issues, or math confusion..."
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#334155] mb-1">
                4. How I solved them
              </label>
              <textarea
                rows={2}
                value={form.howSolved}
                onChange={(e) => setForm({ ...form, howSolved: e.target.value })}
                placeholder="Root cause and fix..."
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#334155] mb-1">
                5. Concepts I still do not understand
              </label>
              <textarea
                rows={2}
                value={form.unclearConcepts}
                onChange={(e) => setForm({ ...form, unclearConcepts: e.target.value })}
                placeholder="Concepts requiring revision..."
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#334155] mb-1">
                6. Questions to ask the DataMites mentor
              </label>
              <textarea
                rows={2}
                value={form.mentorQuestions}
                onChange={(e) => setForm({ ...form, mentorQuestions: e.target.value })}
                placeholder="Specific questions for your next live class or mentoring session..."
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#334155] mb-1">
                7. Next study session
              </label>
              <input
                type="text"
                value={form.nextSession}
                onChange={(e) => setForm({ ...form, nextSession: e.target.value })}
                placeholder="Exact next task to start with..."
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A]"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{form.id ? 'Update Entry' : 'Save Journal Entry'}</span>
            </button>
          </form>
        </SectionCard>

        {/* Entries List */}
        <div className="lg:col-span-7 space-y-4">
          <SectionCard className="p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search journal entries..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E2E8F0] text-xs text-[#0F172A]"
              />
            </div>
            <select
              aria-label="Filter journal by week"
              value={weekFilter}
              onChange={(e) =>
                setWeekFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="px-2.5 py-2 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#0F172A]"
            >
              <option value="all">All Weeks</option>
              {Array.from({ length: 20 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  Week {w}
                </option>
              ))}
            </select>
            <label className="inline-flex items-center gap-1.5 text-xs text-[#334155] whitespace-nowrap shrink-0 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyUnresolvedMentor}
                onChange={(e) => setOnlyUnresolvedMentor(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-[#CBD5E1] text-[#2563EB]"
              />
              <span>Unresolved Mentor Qs</span>
            </label>
          </SectionCard>

          {filteredEntries.length === 0 ? (
            <SectionCard className="p-10 text-center">
              <BookText className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
              <p className="text-sm font-medium text-[#0F172A]">No journal entries yet</p>
              <p className="text-xs text-[#64748B] mt-1">
                Log what you built and learned after each study session.
              </p>
            </SectionCard>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <SectionCard key={entry.id} className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#F1F5F9]">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-[#0F172A] tabular-nums">
                        {entry.date}
                      </span>
                      <span className="text-[#94A3B8]">·</span>
                      <span className="font-semibold text-[#2563EB]">Week {entry.week}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(entry)}
                        className="text-xs text-[#475569] hover:text-[#0F172A] px-2 py-1 rounded hover:bg-[#F8FAFC] cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        aria-label="Delete journal entry"
                        onClick={() => deleteJournalEntry(entry.id)}
                        className="p-1 text-[#94A3B8] hover:text-[#DC2626] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-[#334155]">
                    {entry.learnedToday && (
                      <p>
                        <span className="font-semibold text-[#0F172A]">Learned:</span>{' '}
                        {entry.learnedToday}
                      </p>
                    )}
                    {entry.implemented && (
                      <p>
                        <span className="font-semibold text-[#0F172A]">Implemented:</span>{' '}
                        {entry.implemented}
                      </p>
                    )}
                    {entry.problemsEncountered && (
                      <p>
                        <span className="font-semibold text-[#0F172A]">Problems:</span>{' '}
                        {entry.problemsEncountered}
                      </p>
                    )}
                    {entry.howSolved && (
                      <p>
                        <span className="font-semibold text-[#0F172A]">Solved by:</span>{' '}
                        {entry.howSolved}
                      </p>
                    )}
                    {entry.unclearConcepts && (
                      <p>
                        <span className="font-semibold text-[#B45309]">Still unclear:</span>{' '}
                        {entry.unclearConcepts}
                      </p>
                    )}
                    {entry.mentorQuestions && (
                      <div className="p-3 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] flex items-start justify-between gap-3">
                        <p className="text-[#92400E]">
                          <span className="font-semibold">Mentor question:</span>{' '}
                          {entry.mentorQuestions}
                        </p>
                        <button
                          type="button"
                          onClick={() => toggleMentorResolved(entry)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                            entry.mentorResolved
                              ? 'bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]'
                              : 'bg-white text-[#B45309] border border-[#FDE68A]'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{entry.mentorResolved ? 'Answered' : 'Mark Answered'}</span>
                        </button>
                      </div>
                    )}
                    {entry.nextSession && (
                      <p>
                        <span className="font-semibold text-[#2563EB]">Next session:</span>{' '}
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
