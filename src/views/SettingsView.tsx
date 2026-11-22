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
    <div className="space-y-6 max-w-4xl pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-medium text-[var(--color-ink)] tracking-tight">
          Settings &amp; Sync
        </h1>
        <p className="text-sm text-[var(--color-secondary)] mt-1">
          Configure your active DataMites week, weekly hour targets, Firebase cloud sync, and local
          JSON backups.
        </p>
      </div>

      {/* Profile & Active Week */}
      <SectionCard className="p-4 sm:p-5 space-y-4 border border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--color-line)]">
          <div>
            <h2 className="text-base font-display font-semibold text-[var(--color-ink)]">
              Learner Profile &amp; Pace
            </h2>
            <p className="text-xs font-mono text-[var(--color-secondary)]">
              Adjust your active DataMites week or weekly study commitment at any time.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowOnboardingModal(true)}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sunken)] text-xs font-mono text-[var(--color-ink)] whitespace-nowrap shrink-0 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
            <span>Re-run Onboarding</span>
          </button>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1">
                Learner Name
              </label>
              <input
                type="text"
                value={learnerName}
                onChange={(e) => setLearnerName(e.target.value)}
                className="min-h-[44px] w-full px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-sm font-body text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1">
                Active DataMites Week
              </label>
              <select
                value={state.profile.currentWeek}
                onChange={(e) => updateProfile({ currentWeek: Number(e.target.value) })}
                className="min-h-[44px] w-full px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-mono text-[var(--color-ink)] cursor-pointer focus:outline-none focus:border-[var(--color-ink)]"
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
              <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1">
                Live Training (hrs/week)
              </label>
              <input
                type="number"
                min={0}
                max={60}
                value={liveHours}
                onChange={(e) => setLiveHours(Number(e.target.value))}
                className="min-h-[44px] w-full px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-sm font-mono text-[var(--color-ink)] tabular-nums focus:outline-none focus:border-[var(--color-ink)]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1">
                Self-Study &amp; Revision (hrs/week)
              </label>
              <input
                type="number"
                min={0}
                max={60}
                value={selfHours}
                onChange={(e) => setSelfHours(Number(e.target.value))}
                className="min-h-[44px] w-full px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-sm font-mono text-[var(--color-ink)] tabular-nums focus:outline-none focus:border-[var(--color-ink)]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-medium text-[var(--color-secondary)] mb-1">
                Hands-on Practice (hrs/week)
              </label>
              <input
                type="number"
                min={0}
                max={60}
                value={practiceHours}
                onChange={(e) => setPracticeHours(Number(e.target.value))}
                className="min-h-[44px] w-full px-3 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-sm font-mono text-[var(--color-ink)] tabular-nums focus:outline-none focus:border-[var(--color-ink)]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="min-h-[44px] px-5 py-2 border border-[var(--color-ink)] bg-[var(--color-signal)] text-[var(--color-ink)] text-xs font-mono font-bold hover:brightness-95 cursor-pointer transition-colors"
          >
            Save Preferences
          </button>
        </form>
      </SectionCard>

      {/* Firebase Cloud Sync + Local Fallback */}
      <SectionCard className="p-4 sm:p-5 space-y-4 border border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--color-line)]">
          <div>
            <h2 className="text-base font-display font-semibold text-[var(--color-ink)]">
              Firebase Cloud Sync &amp; Local Persistence
            </h2>
            <p className="text-xs text-[var(--color-secondary)] mt-0.5">
              All progress saves automatically to your browser&apos;s local storage right away.
              Sign in with Google to also sync your workspace across devices via Firestore.
            </p>
          </div>
          <Cloud className="w-5 h-5 text-[var(--color-ink)] shrink-0" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-[var(--color-line)] bg-[var(--color-sunken)]/40">
          <div className="space-y-1.5 text-xs">
            <p className="font-semibold text-[var(--color-ink)] font-body">
              {user ? `Signed in as ${user.email}` : 'Local Storage Mode (Not signed in)'}
            </p>
            <p className="font-mono text-[var(--color-secondary)]">
              Sync state:{' '}
              <span className="font-semibold text-[var(--color-ink)]">
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
              <p className="text-xs font-mono text-[var(--color-ink)] border-l-2 border-[var(--color-ink)] pl-2 mt-1">
                Cloud sync is not configured for this deployment (missing{' '}
                {missingFirebaseEnv.join(', ')}). Your progress is saved on this device only.
              </p>
            )}
            {syncError && <p className="text-xs font-mono text-[var(--color-ink)]">{syncError}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => void syncNow()}
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sunken)] text-xs font-mono font-medium text-[var(--color-ink)] cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync Now</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 border border-[var(--color-line-soft)] bg-[var(--color-surface)] hover:bg-[var(--color-sunken)] hover:border-[var(--color-ink)] text-xs font-mono font-medium text-[var(--color-secondary)] hover:text-[var(--color-ink)] cursor-pointer transition-colors"
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
                className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 border border-[var(--color-ink)] bg-[var(--color-signal)] text-[var(--color-ink)] text-xs font-mono font-bold hover:brightness-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>
      </SectionCard>

      {/* JSON Export / Import & Reset */}
      <SectionCard className="p-4 sm:p-5 space-y-4 border border-[var(--color-line)] bg-[var(--color-surface)]">
        <h2 className="text-base font-display font-semibold text-[var(--color-ink)] pb-3 border-b border-[var(--color-line)]">
          Backup, Restore &amp; Reset
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadJson}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sunken)] text-xs font-mono font-medium text-[var(--color-ink)] cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4 text-[var(--color-ink)]" />
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
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sunken)] text-xs font-mono font-medium text-[var(--color-ink)] cursor-pointer transition-colors"
          >
            <Upload className="w-4 h-4 text-[var(--color-ink)]" />
            <span>Restore JSON Backup</span>
          </button>

          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--color-ink)] hover:bg-[var(--color-sunken)] text-xs font-mono font-medium text-[var(--color-secondary)] hover:text-[var(--color-ink)] cursor-pointer sm:ml-auto transition-colors"
          >
            <AlertTriangle className="w-4 h-4 text-[var(--color-ink)]" />
            <span>Reset All Progress</span>
          </button>
        </div>

        {importError && (
          <p className="text-xs font-mono text-[var(--color-ink)] border border-[var(--color-line)] bg-[var(--color-sunken)] p-2.5">
            {importError}
          </p>
        )}

        {localBackups.length > 0 && (
          <div className="pt-3 border-t border-[var(--color-line-soft)] space-y-2">
            <p className="text-xs font-mono font-semibold text-[var(--color-ink)] uppercase tracking-wider">
              Automatic safety backups on this device
            </p>
            <p className="text-xs text-[var(--color-secondary)]">
              A copy of your local data is saved automatically before it is first merged into a
              Google account, so nothing is lost if a merge is not what you expected.
            </p>
            <ul className="space-y-1.5">
              {localBackups.map((b) => (
                <li
                  key={b.key}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 border border-[var(--color-line-soft)] bg-[var(--color-surface)] text-xs font-mono text-[var(--color-secondary)]"
                >
                  <span className="truncate">
                    {new Date(b.createdAt).toLocaleString()} ·{' '}
                    {b.reason === 'otheraccount' ? 'data from another account' : 'before first sync'} ·{' '}
                    {Math.max(1, Math.round(b.bytes / 1024))} KB
                  </span>
                  <button
                    type="button"
                    onClick={() => downloadLocalBackup(b.key)}
                    className="min-h-[44px] inline-flex items-center gap-1 px-3 py-1 border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sunken)] text-[11px] font-mono font-medium text-[var(--color-ink)] cursor-pointer shrink-0 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-[var(--color-ink)]" />
                    <span>Download</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </SectionCard>

      {/* In-App Confirmation Modal for Reset (Restrained Ink destructive styling, accessible above mobile nav) */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-ink)]/50 p-4">
          <div className="bg-[var(--color-surface)] border-2 border-[var(--color-ink)] max-w-md w-full p-5 sm:p-6 space-y-4 shadow-none">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[var(--color-ink)] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-display font-bold text-[var(--color-ink)]">
                  Reset all learning progress?
                </h3>
                <p className="text-xs text-[var(--color-secondary)] mt-1.5 leading-relaxed">
                  This clears all topic statuses, study sessions, flashcards, quizzes, projects, and
                  journal entries and re-opens onboarding.{' '}
                  {user
                    ? 'You are signed in, so your cloud copy is deleted too and other devices will reset as well.'
                    : 'Only this device is affected while you are signed out.'}{' '}
                  Export a JSON backup first if you want to keep a copy.
                </p>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-3 border-t border-[var(--color-line-soft)]">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="min-h-[44px] px-4 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-sunken)] text-xs font-mono font-medium text-[var(--color-secondary)] hover:text-[var(--color-ink)] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetAllProgress();
                  setShowResetModal(false);
                }}
                className="min-h-[44px] px-4 py-2 border-2 border-[var(--color-ink)] bg-[var(--color-sunken)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] text-xs font-mono font-bold text-[var(--color-ink)] cursor-pointer transition-colors"
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
