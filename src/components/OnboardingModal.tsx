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
      className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-2xl w-full shadow-xl overflow-hidden my-auto">
        <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 id="onboarding-title" className="text-lg font-bold text-[#0F172A]">
                Configure Your AI Engineer Command Center
              </h2>
              <p className="text-sm text-[#475569] mt-0.5">
                Start from your exact current DataMites week — never forced back to Week 1.
              </p>
            </div>
          </div>
          {state.profile.onboardingCompleted && (
            <button
              type="button"
              onClick={() => setShowOnboardingModal(false)}
              className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer"
              aria-label="Close setup modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Fixed 4-Tier Learning Hierarchy */}
          <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#475569] mb-2.5">
              <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
              Fixed Learning Priority Hierarchy
            </div>
            <ol className="grid sm:grid-cols-2 gap-2 text-xs text-[#334155]">
              <li className="flex items-start gap-2">
                <span className="font-mono font-bold text-[#2563EB]">1.</span>
                <span>
                  <strong className="text-[#0F172A]">DataMites AI Engineer</strong> — Official master sequence (Weeks 1–20)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono font-bold text-[#2563EB]">2.</span>
                <span>
                  <strong className="text-[#0F172A]">CodeWithHarry Python Bootcamp</strong> — Main Python & Git supplement
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono font-bold text-[#2563EB]">3.</span>
                <span>
                  <strong className="text-[#0F172A]">CodeWithHarry Data Science</strong> — Main DS & ML supplement (Hindi)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono font-bold text-[#2563EB]">4.</span>
                <span>
                  <strong className="text-[#0F172A]">SSD Archive Courses</strong> — Targeted essential gap-fillers only
                </span>
              </li>
            </ol>
          </div>

          {/* Name & Active Week */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="onb-name" className="block text-sm font-medium text-[#0F172A] mb-1.5">
                Your Name
              </label>
              <input
                id="onb-name"
                type="text"
                maxLength={100}
                value={learnerName}
                onChange={(e) => setLearnerName(e.target.value)}
                placeholder="e.g. Rohan Sharma"
                className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label htmlFor="onb-week" className="block text-sm font-medium text-[#0F172A] mb-1.5">
                Actual Current DataMites Week
              </label>
              <select
                id="onb-week"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
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
          <div className="rounded-lg border border-[#BFDBFE] bg-[#EFF6FF]/60 px-4 py-3 text-sm">
            <div className="font-semibold text-[#1E3A8A]">
              Selected: Week {selectedWeek} · {previewCourse.title}
            </div>
            <p className="text-xs text-[#334155] mt-0.5">
              {previewCourse.courseCode} · {previewCourse.liveHours}h official course live training · Tools:{' '}
              {previewCourse.tools.join(', ')}
            </p>
          </div>

          {selectedWeek > 1 && (
            <label className="flex items-start gap-2.5 p-3.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] cursor-pointer">
              <input
                type="checkbox"
                checked={markPriorCompleted}
                onChange={(e) => setMarkPriorCompleted(e.target.checked)}
                className="mt-0.5 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
              />
              <span className="text-sm text-[#334155]">
                <strong className="text-[#0F172A] font-medium">
                  Mark Weeks 1–{selectedWeek - 1} official subtopics as Complete
                </strong>
                <span className="block text-xs text-[#64748B] mt-0.5">
                  You can still adjust any individual module or flag topics for revision later in Official Curriculum.
                </span>
              </span>
            </label>
          )}

          {/* Weekly Hours Target */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#0F172A]">Weekly Study Time Budget</span>
              <span className="text-xs text-[#64748B] tabular-nums">
                Total: {liveHours + selfHours + practiceHours}h / week (Brochure baseline: 20h)
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="onb-live" className="block text-xs text-[#475569] mb-1">
                  Live Training (h)
                </label>
                <input
                  id="onb-live"
                  type="number"
                  min={0}
                  max={40}
                  value={liveHours}
                  onChange={(e) => setLiveHours(Math.max(0, Math.min(40, Number(e.target.value) || 0)))}
                  className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] text-sm tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="onb-self" className="block text-xs text-[#475569] mb-1">
                  Self-Study & Rev (h)
                </label>
                <input
                  id="onb-self"
                  type="number"
                  min={0}
                  max={40}
                  value={selfHours}
                  onChange={(e) => setSelfHours(Math.max(0, Math.min(40, Number(e.target.value) || 0)))}
                  className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] text-sm tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="onb-prac" className="block text-xs text-[#475569] mb-1">
                  Practice & Projects (h)
                </label>
                <input
                  id="onb-prac"
                  type="number"
                  min={0}
                  max={40}
                  value={practiceHours}
                  onChange={(e) => setPracticeHours(Math.max(0, Math.min(40, Number(e.target.value) || 0)))}
                  className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] text-sm tabular-nums"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
              <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
              <span>Saves automatically locally + syncs to Firebase when signed in.</span>
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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
