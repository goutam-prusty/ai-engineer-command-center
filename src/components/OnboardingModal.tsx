import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, GraduationCap, Layers, X } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { getCourseForWeek } from '../data/curriculum';

export function OnboardingModal() {
  const { state, showOnboardingModal, setShowOnboardingModal, completeOnboarding } = useAppState();

  const [learnerName, setLearnerName] = useState(
    state.profile.learnerName === 'AI Engineer Learner' ? '' : state.profile.learnerName
  );
  const [selectedWeek, setSelectedWeek] = useState(state.profile.currentWeek || 1);
  const [markPriorCompleted, setMarkPriorCompleted] = useState(false);
  const [liveHours, setLiveHours] = useState(state.profile.weeklyLiveHours || 8);
  const [selfHours, setSelfHours] = useState(state.profile.weeklySelfStudyHours || 8);
  const [practiceHours, setPracticeHours] = useState(state.profile.weeklyPracticeHours || 4);

  if (!showOnboardingModal) return null;

  const previewCourse = getCourseForWeek(selectedWeek);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    completeOnboarding({
      learnerName: learnerName.trim() || 'AI Engineer Learner',
      currentWeek: selectedWeek,
      markPriorCompleted: selectedWeek > 1 && markPriorCompleted,
      weeklyLiveHours: liveHours,
      weeklySelfStudyHours: selfHours,
      weeklyPracticeHours: practiceHours,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[var(--color-ink)]/50 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="bg-[var(--color-surface)] border-2 border-[var(--color-ink)] max-w-2xl w-full shadow-none overflow-hidden my-auto">
        <div className="px-6 py-5 border-b border-[var(--color-line)] bg-[var(--color-surface)] flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 border border-[var(--color-line)] bg-[var(--color-sunken)] text-[var(--color-ink)] flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 id="onboarding-title" className="text-lg font-serif font-bold text-[var(--color-ink)]">
                Configure Your AI Engineer Command Center
              </h2>
              <p className="text-xs text-[var(--color-secondary)] mt-0.5">
                Start from your exact current DataMites week — never forced back to Week 1.
              </p>
            </div>
          </div>
          {state.profile.onboardingCompleted && (
            <button
              type="button"
              onClick={() => setShowOnboardingModal(false)}
              className="min-h-[44px] min-w-[44px] p-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-sunken)] cursor-pointer flex items-center justify-center transition-colors"
              aria-label="Close setup modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Fixed 4-Tier Learning Hierarchy */}
          <div className="border border-[var(--color-line)] bg-[var(--color-sunken)]/50 p-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-ink)] mb-2.5">
              <Layers className="w-3.5 h-3.5 text-[var(--color-ink)]" />
              Fixed Learning Priority Hierarchy
            </div>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[var(--color-secondary)]">
              <li className="flex items-start gap-2">
                <span className="font-mono font-bold text-[var(--color-ink)]">1.</span>
                <span>
                  <strong className="text-[var(--color-ink)]">DataMites AI Engineer</strong> — Official master sequence (Weeks 1–20)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono font-bold text-[var(--color-ink)]">2.</span>
                <span>
                  <strong className="text-[var(--color-ink)]">CodeWithHarry Python Bootcamp</strong> — Main Python & Git supplement
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono font-bold text-[var(--color-ink)]">3.</span>
                <span>
                  <strong className="text-[var(--color-ink)]">CodeWithHarry Data Science</strong> — Main DS & ML supplement (Hindi)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono font-bold text-[var(--color-ink)]">4.</span>
                <span>
                  <strong className="text-[var(--color-ink)]">SSD Archive Courses</strong> — Targeted essential gap-fillers only
                </span>
              </li>
            </ol>
          </div>

          {/* Name & Active Week */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="onb-name" className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-ink)] mb-1.5">
                Your Name
              </label>
              <input
                id="onb-name"
                type="text"
                maxLength={100}
                value={learnerName}
                onChange={(e) => setLearnerName(e.target.value)}
                placeholder="e.g. Rohan Sharma"
                className="min-h-[44px] w-full px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] focus:ring-1 focus:ring-[var(--color-ink)]"
              />
            </div>

            <div>
              <label htmlFor="onb-week" className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-ink)] mb-1.5">
                Actual Current DataMites Week
              </label>
              <select
                id="onb-week"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="min-h-[44px] w-full px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] focus:ring-1 focus:ring-[var(--color-ink)]"
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((w) => {
                  const c = getCourseForWeek(w);
                  return (
                    <option key={w} value={w}>
                      Week {w} — {c.title} ({c.courseCode})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Preview of selected week */}
          <div className="border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-sm">
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">
              Selected: Week {selectedWeek} · {previewCourse.title}
            </div>
            <p className="text-xs text-[var(--color-secondary)] mt-1 font-mono">
              {previewCourse.courseCode} · {previewCourse.liveHours}h official course live training · Tools:{' '}
              {previewCourse.tools.join(', ')}
            </p>
          </div>

          {selectedWeek > 1 && (
            <label className="min-h-[44px] flex items-start gap-3 p-3.5 border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sunken)] cursor-pointer select-none transition-colors">
              <input
                type="checkbox"
                checked={markPriorCompleted}
                onChange={(e) => setMarkPriorCompleted(e.target.checked)}
                className="mt-0.5 w-4 h-4 border border-[var(--color-line)] text-[var(--color-ink)] accent-[var(--color-ink)] focus:ring-0"
              />
              <span className="text-xs text-[var(--color-ink)]">
                <strong className="text-[var(--color-ink)] font-bold">
                  Mark Weeks 1–{selectedWeek - 1} official subtopics as Complete
                </strong>
                <span className="block text-[11px] text-[var(--color-secondary)] mt-0.5 font-mono">
                  You can still adjust any individual module or flag topics for revision later in Official Curriculum.
                </span>
              </span>
            </label>
          )}

          {/* Weekly Hours Target */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-ink)]">
                Weekly Study Time Budget
              </span>
              <span className="text-xs font-mono text-[var(--color-secondary)] tabular-nums">
                Total: {liveHours + selfHours + practiceHours}h / week (Baseline: 20h)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="onb-live" className="block text-[11px] font-mono text-[var(--color-secondary)] mb-1">
                  Live Training (h)
                </label>
                <input
                  id="onb-live"
                  type="number"
                  min={0}
                  max={40}
                  value={liveHours}
                  onChange={(e) => setLiveHours(Math.max(0, Math.min(40, Number(e.target.value) || 0)))}
                  className="min-h-[44px] w-full px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-sm font-mono text-[var(--color-ink)] tabular-nums focus:outline-none focus:border-[var(--color-ink)] focus:ring-1 focus:ring-[var(--color-ink)]"
                />
              </div>
              <div>
                <label htmlFor="onb-self" className="block text-[11px] font-mono text-[var(--color-secondary)] mb-1">
                  Self-Study & Rev (h)
                </label>
                <input
                  id="onb-self"
                  type="number"
                  min={0}
                  max={40}
                  value={selfHours}
                  onChange={(e) => setSelfHours(Math.max(0, Math.min(40, Number(e.target.value) || 0)))}
                  className="min-h-[44px] w-full px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-sm font-mono text-[var(--color-ink)] tabular-nums focus:outline-none focus:border-[var(--color-ink)] focus:ring-1 focus:ring-[var(--color-ink)]"
                />
              </div>
              <div>
                <label htmlFor="onb-prac" className="block text-[11px] font-mono text-[var(--color-secondary)] mb-1">
                  Practice & Projects (h)
                </label>
                <input
                  id="onb-prac"
                  type="number"
                  min={0}
                  max={40}
                  value={practiceHours}
                  onChange={(e) => setPracticeHours(Math.max(0, Math.min(40, Number(e.target.value) || 0)))}
                  className="min-h-[44px] w-full px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-sm font-mono text-[var(--color-ink)] tabular-nums focus:outline-none focus:border-[var(--color-ink)] focus:ring-1 focus:ring-[var(--color-ink)]"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--color-line)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-secondary)] font-mono">
              <CheckCircle2 className="w-4 h-4 text-[var(--color-ink)] shrink-0" />
              <span>Saves locally + syncs to Firebase when signed in.</span>
            </div>
            <button
              type="submit"
              className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-[var(--color-ink)] bg-[var(--color-signal)] text-[var(--color-ink)] text-xs font-mono font-bold hover:brightness-95 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Open Week {selectedWeek} Study Room
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
