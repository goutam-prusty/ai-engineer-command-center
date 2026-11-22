import React, { useState } from 'react';
import {
  BarChart3,
  BookMarked,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Cloud,
  CloudOff,
  FolderGit2,
  GraduationCap,
  LayoutDashboard,
  Library,
  Menu,
  NotebookPen,
  RefreshCw,
  Settings,
  X,
} from 'lucide-react';
import { NavSection } from '../types';
import { useAppState } from '../context/AppStateContext';
import { getCourseForWeek } from '../data/curriculum';

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'plan', label: 'My Learning Plan', icon: CalendarDays },
  { id: 'curriculum', label: 'Official Curriculum', icon: GraduationCap },
  { id: 'study-room', label: 'Weekly Study Room', icon: BookOpen },
  { id: 'resources', label: 'Resource Library', icon: Library },
  { id: 'projects', label: 'Projects & Portfolio', icon: FolderGit2 },
  { id: 'revision', label: 'Revision & Assessments', icon: BookMarked },
  { id: 'analytics', label: 'Progress Analytics', icon: BarChart3 },
  { id: 'journal', label: 'Learning Journal', icon: NotebookPen },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const MOBILE_BOTTOM_NAV: { id: NavSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'study-room', label: 'Study', icon: BookOpen },
  { id: 'curriculum', label: 'Syllabus', icon: GraduationCap },
  { id: 'revision', label: 'Revision', icon: BookMarked },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    state,
    activeSection,
    setActiveSection,
    user,
    syncStatus,
    syncNow,
    toasts,
    dismissToast,
  } = useAppState();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const currentCourse = getCourseForWeek(state.profile.currentWeek);
  const activeMeta = NAV_ITEMS.find((i) => i.id === activeSection) ?? NAV_ITEMS[0];

  const handleNav = (section: NavSection) => {
    setActiveSection(section);
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] font-body flex flex-col lg:flex-row overflow-x-hidden">
      {/* Persistent Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-line)] sticky top-0 h-screen select-none">
        {/* Brand Header */}
        <div className="px-4 py-4 border-b border-[var(--color-line)] bg-[var(--color-surface)]">
          <button
            type="button"
            onClick={() => handleNav('dashboard')}
            className="flex items-center gap-3 text-left w-full cursor-pointer group"
          >
            {/* Square wordmark tile inspired by Paper & Signal identity */}
            <div className="w-9 h-9 bg-[var(--color-ink)] text-[var(--color-surface)] border border-[var(--color-ink)] flex items-center justify-center font-display font-bold text-base shrink-0 tracking-tight transition-transform group-hover:scale-[1.02]">
              AI<span className="text-[var(--color-signal)]">.</span>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-display font-bold text-[var(--color-ink)] leading-tight">
                AI Engineer Command Center
              </div>
              <div className="font-mono text-[10px] text-[var(--color-secondary)] uppercase tracking-wider mt-0.5">
                DataMites 20-Week Master
              </div>
            </div>
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-body transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                  active
                    ? 'bg-[var(--color-sunken)] text-[var(--color-ink)] font-semibold border-[var(--color-line)] border-l-3 !border-l-[var(--color-ink)]'
                    : 'text-[var(--color-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-sunken)]/60 border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    active ? 'text-[var(--color-ink)]' : 'text-[var(--color-secondary)]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer: Active Pace & Cloud Sync */}
        <div className="px-4 py-3.5 border-t border-[var(--color-line)] bg-[var(--color-paper)]">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono font-bold text-[var(--color-ink)] tabular-nums">
              Week {state.profile.currentWeek} of 20
            </span>
            <span className="font-mono text-[10px] text-[var(--color-secondary)] px-1.5 py-0.5 bg-[var(--color-sunken)] border border-[var(--color-line)]">
              {currentCourse.courseCode}
            </span>
          </div>
          <p className="text-xs text-[var(--color-secondary)] truncate mt-1 font-body">
            {currentCourse.title}
          </p>

          <button
            type="button"
            onClick={() => (user ? void syncNow() : handleNav('settings'))}
            className="mt-2.5 w-full flex items-center justify-between px-2.5 py-1.5 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs text-[var(--color-ink)] hover:bg-[var(--color-sunken)] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5 truncate">
              {user && syncStatus === 'synced' ? (
                <Cloud className="w-3.5 h-3.5 text-[var(--color-ink)] shrink-0" />
              ) : syncStatus === 'syncing' ? (
                <RefreshCw className="w-3.5 h-3.5 text-[var(--color-ink)] animate-spin shrink-0" />
              ) : (
                <CloudOff className="w-3.5 h-3.5 text-[var(--color-secondary)] shrink-0" />
              )}
              <span className="truncate font-mono text-[11px]">
                {user
                  ? syncStatus === 'syncing'
                    ? 'Syncing cloud...'
                    : syncStatus === 'offline'
                      ? 'Offline (saved)'
                      : syncStatus === 'error'
                        ? 'Sync issue (local)'
                        : 'Cloud synced'
                  : 'Local storage active'}
              </span>
            </span>

            {user && syncStatus === 'synced' ? (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-[var(--color-ink)] shrink-0 ml-1.5">
                <span className="w-2 h-2 rounded-none bg-[var(--color-signal)] border border-[var(--color-ink)]" />
                Live
              </span>
            ) : (
              <span className="font-mono text-[10px] font-semibold text-[var(--color-ink)] underline shrink-0 ml-1.5">
                {user ? 'Sync' : 'Connect'}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[var(--color-ink)]/40 transition-opacity"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] bg-[var(--color-surface)] h-full border-r border-[var(--color-line)] flex flex-col">
            {/* Drawer Header */}
            <div className="px-4 py-3.5 border-b border-[var(--color-line)] flex items-center justify-between gap-2 bg-[var(--color-surface)]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 bg-[var(--color-ink)] text-[var(--color-surface)] border border-[var(--color-ink)] flex items-center justify-center font-display font-bold text-xs shrink-0 tracking-tight">
                  AI<span className="text-[var(--color-signal)]">.</span>
                </div>
                <span className="text-xs font-display font-bold text-[var(--color-ink)] leading-tight truncate">
                  AI Engineer Command Center
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-1.5 text-[var(--color-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-sunken)] border border-transparent hover:border-[var(--color-line)] cursor-pointer"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Navigation List with 44px+ touch targets */}
            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNav(item.id)}
                    className={`w-full min-h-[2.75rem] flex items-center gap-3 px-3 py-2 text-sm font-body font-medium transition-colors cursor-pointer border ${
                      active
                        ? 'bg-[var(--color-sunken)] text-[var(--color-ink)] font-semibold border-[var(--color-line)] border-l-3 !border-l-[var(--color-ink)]'
                        : 'text-[var(--color-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-sunken)] border-transparent'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        active ? 'text-[var(--color-ink)]' : 'text-[var(--color-secondary)]'
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Drawer Footer */}
            <div className="px-4 py-3 border-t border-[var(--color-line)] bg-[var(--color-paper)] text-xs font-mono text-[var(--color-secondary)]">
              Active: <span className="font-bold text-[var(--color-ink)]">Week {state.profile.currentWeek}</span> · {currentCourse.title}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col bg-[var(--color-paper)]">
        {/* Compact Top Header */}
        <header className="sticky top-0 z-30 h-14 bg-[var(--color-paper)] border-b border-[var(--color-line)] px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 text-[var(--color-ink)] hover:bg-[var(--color-sunken)] border border-transparent hover:border-[var(--color-line)] cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 bg-[var(--color-ink)] text-[var(--color-surface)] border border-[var(--color-ink)] flex items-center justify-center font-display font-bold text-[10px] shrink-0 tracking-tight lg:hidden">
                AI<span className="text-[var(--color-signal)]">.</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-display font-bold text-[var(--color-ink)] truncate leading-tight">
                  {activeMeta.label}
                </h1>
                <span className="hidden sm:inline text-xs font-mono text-[var(--color-secondary)] truncate">
                  · Week {state.profile.currentWeek} ({currentCourse.courseCode})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleNav('settings')}
              className="min-h-[36px] sm:min-h-[44px] inline-flex items-center gap-1.5 px-2.5 py-1 border border-[var(--color-line)] bg-[var(--color-surface)] text-xs font-mono text-[var(--color-ink)] hover:bg-[var(--color-sunken)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {user ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-[var(--color-ink)]" />
                  <span className="hidden sm:inline max-w-[140px] truncate">{user.displayName || user.email}</span>
                  <span className="sm:hidden">Synced</span>
                  <span className="w-1.5 h-1.5 rounded-none bg-[var(--color-signal)] border border-[var(--color-ink)]" />
                </>
              ) : (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                  <span>Local</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Content Container: Centered max-w-[76rem] with safe-area bottom clearance */}
        <main className="flex-1 w-full max-w-[76rem] mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6 pb-24 sm:pb-20 lg:pb-12">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation (<= 56px height, min 44px touch targets) */}
      <nav
        aria-label="Mobile quick navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-14 bg-[var(--color-surface)] border-t border-[var(--color-line)] grid grid-cols-4 px-1"
      >
        {MOBILE_BOTTOM_NAV.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-body transition-colors cursor-pointer relative ${
                active
                  ? 'text-[var(--color-ink)] font-bold after:absolute after:top-0 after:inset-x-3 after:h-0.5 after:bg-[var(--color-signal)] after:border-b after:border-[var(--color-ink)]'
                  : 'text-[var(--color-secondary)] hover:text-[var(--color-ink)]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-20 lg:bottom-5 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)]">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="bg-[var(--color-surface)] border border-[var(--color-line)] border-l-4 border-l-[var(--color-ink)] p-3 text-xs font-body text-[var(--color-ink)] flex items-center justify-between gap-2.5"
            >
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--color-ink)]" />
                <span className="truncate">{t.text}</span>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="min-h-[32px] min-w-[32px] flex items-center justify-center p-1 text-[var(--color-secondary)] hover:text-[var(--color-ink)] cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
