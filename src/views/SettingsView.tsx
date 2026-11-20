import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Cloud,
  Download,
  LogIn,
  LogOut,
  RefreshCw,
  RotateCcw,
  Upload,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { getCourseForWeek } from '../data/curriculum';
import { SectionCard } from '../components/StatusPrimitives';

export function SettingsView() {
  const {
    state,
    updateProfile,
    setShowOnboardingModal,
    user,
    syncStatus,
    lastSyncedAt,
    syncError,
    handleGoogleSignIn,
    handleSignOut,
    syncNow,
    cloudConfigured,
    missingFirebaseEnv,
    pendingSyncCount,
    localBackups,
    downloadLocalBackup,
    exportBackupJson,
    importBackupJson,
    resetAllProgress,
    pushToast,
  } = useAppState();

  const [learnerName, setLearnerName] = useState(state.profile.learnerName);
  const [liveHours, setLiveHours] = useState(state.profile.weeklyLiveHours);
  const [selfHours, setSelfHours] = useState(state.profile.weeklySelfStudyHours);
  const [practiceHours, setPracticeHours] = useState(state.profile.weeklyPracticeHours);
  const [showResetModal, setShowResetModal] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      learnerName: learnerName.trim() || 'AI Engineer Learner',
      weeklyLiveHours: Math.max(0, Math.min(60, Number(liveHours) || 0)),
      weeklySelfStudyHours: Math.max(0, Math.min(60, Number(selfHours) || 0)),
      weeklyPracticeHours: Math.max(0, Math.min(60, Number(practiceHours) || 0)),
    });
    pushToast('Learner preferences saved.', 'success');
  };

  const handleDownloadJson = () => {
    const content = exportBackupJson();
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-engineer-command-center-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast('JSON backup exported.', 'success');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const result = importBackupJson(text);
      if (!result.ok) {
        setImportError(result.error || 'Unable to parse backup JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-[#0F172A] tracking-tight">Settings &amp; Sync</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Configure your active DataMites week, weekly hour targets, Firebase cloud sync, and local
          JSON backups.
        </p>
      </div>

      {/* Profile & Active Week */}
      <SectionCard className="p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0]">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A]">Learner Profile &amp; Pace</h2>
            <p className="text-xs text-[#64748B]">
              Adjust your active DataMites week or weekly study commitment at any time.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowOnboardingModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-medium text-[#334155] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-run Onboarding</span>
          </button>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#334155] mb-1">Learner Name</label>
              <input
                type="text"
                value={learnerName}
                onChange={(e) => setLearnerName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#334155] mb-1">
                Active DataMites Week
              </label>
              <select
                value={state.profile.currentWeek}
                onChange={(e) => updateProfile({ currentWeek: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A]"
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>
                    Week {w} — {getCourseForWeek(w).title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#334155] mb-1">
                Live Training (hrs/week)
              </label>
              <input
                type="number"
                min={0}
                max={60}
                value={liveHours}
                onChange={(e) => setLiveHours(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#334155] mb-1">
                Self-Study &amp; Revision (hrs/week)
              </label>
              <input
                type="number"
                min={0}
                max={60}
                value={selfHours}
                onChange={(e) => setSelfHours(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#334155] mb-1">
                Hands-on Practice (hrs/week)
              </label>
              <input
                type="number"
                min={0}
                max={60}
                value={practiceHours}
                onChange={(e) => setPracticeHours(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] tabular-nums"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium cursor-pointer"
          >
            Save Preferences
          </button>
        </form>
      </SectionCard>

      {/* Firebase Cloud Sync + Local Fallback */}
      <SectionCard className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A]">
              Firebase Cloud Sync &amp; Local Persistence
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              All progress saves automatically to your browser&apos;s local storage right away.
              Sign in with Google to also sync your workspace across devices via Firestore.
            </p>
          </div>
          <Cloud className="w-5 h-5 text-[#2563EB] shrink-0" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
          <div className="space-y-1 text-xs">
            <p className="font-semibold text-[#0F172A]">
              {user ? `Signed in as ${user.email}` : 'Local Storage Mode (Not signed in)'}
            </p>
            <p className="text-[#64748B]">
              Sync state:{' '}
              <span className="font-medium text-[#334155]">
                {syncStatus === 'synced'
                  ? 'Synced with Firebase'
                  : syncStatus === 'syncing'
                    ? 'Syncing...'
                    : syncStatus === 'offline'
                      ? 'Offline (changes are saved here and will sync when you reconnect)'
                      : syncStatus === 'error'
                        ? 'Cloud sync paused (local fallback active)'
                        : 'Saving locally'}
              </span>
              {lastSyncedAt && (
                <> · Last synced {new Date(lastSyncedAt).toLocaleTimeString()}</>
              )}
              {user && pendingSyncCount > 0 && (
                <> · {pendingSyncCount} change{pendingSyncCount === 1 ? '' : 's'} sending</>
              )}
            </p>
            {!cloudConfigured && (
              <p className="text-[#B45309]">
                Cloud sync is not configured for this deployment (missing{' '}
                {missingFirebaseEnv.join(', ')}). Your progress is saved on this device only.
              </p>
            )}
            {syncError && <p className="text-[#B45309]">{syncError}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => void syncNow()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F1F5F9] text-xs font-medium text-[#0F172A] cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync Now</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#FEF2F2] hover:text-[#DC2626] text-xs font-medium text-[#475569] cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={!cloudConfigured}
                onClick={() => void handleGoogleSignIn()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>
      </SectionCard>

      {/* JSON Export / Import & Reset */}
      <SectionCard className="p-5 space-y-4">
        <h2 className="text-base font-semibold text-[#0F172A] pb-3 border-b border-[#E2E8F0]">
          Backup, Restore &amp; Reset
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadJson}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-medium text-[#0F172A] cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#2563EB]" />
            <span>Export JSON Backup</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-medium text-[#0F172A] cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[#059669]" />
            <span>Restore JSON Backup</span>
          </button>

          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#FECACA] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-xs font-medium text-[#B91C1C] cursor-pointer ml-auto"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Reset All Progress</span>
          </button>
        </div>

        {importError && <p className="text-xs text-[#DC2626]">{importError}</p>}

        {localBackups.length > 0 && (
          <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
            <p className="text-xs font-semibold text-[#0F172A]">Automatic safety backups on this device</p>
            <p className="text-xs text-[#64748B]">
              A copy of your local data is saved automatically before it is first merged into a
              Google account, so nothing is lost if a merge is not what you expected.
            </p>
            <ul className="space-y-1.5">
              {localBackups.map((b) => (
                <li key={b.key} className="flex items-center justify-between gap-3 text-xs text-[#475569]">
                  <span className="truncate">
                    {new Date(b.createdAt).toLocaleString()} ·{' '}
                    {b.reason === 'otheraccount' ? 'data from another account' : 'before first sync'} ·{' '}
                    {Math.max(1, Math.round(b.bytes / 1024))} KB
                  </span>
                  <button
                    type="button"
                    onClick={() => downloadLocalBackup(b.key)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[11px] font-medium text-[#0F172A] cursor-pointer shrink-0"
                  >
                    <Download className="w-3 h-3 text-[#2563EB]" />
                    <span>Download</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </SectionCard>

      {/* In-App Confirmation Modal for Reset (No window.confirm) */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-semibold text-[#0F172A]">
                  Reset all learning progress?
                </h3>
                <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                  This clears all topic statuses, study sessions, flashcards, quizzes, projects, and
                  journal entries and re-opens onboarding.{' '}
                  {user
                    ? 'You are signed in, so your cloud copy is deleted too and other devices will reset as well.'
                    : 'Only this device is affected while you are signed out.'}{' '}
                  Export a JSON backup first if you want to keep a copy.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-3.5 py-2 rounded-lg border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetAllProgress();
                  setShowResetModal(false);
                }}
                className="px-3.5 py-2 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-medium cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
