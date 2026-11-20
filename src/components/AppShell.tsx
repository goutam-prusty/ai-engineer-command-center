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
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col lg:flex-row overflow-x-hidden">
      {/* Persistent Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-white border-r border-[#E2E8F0] sticky top-0 h-screen">
        <div className="px-5 py-4 border-b border-[#E2E8F0]">
          <button
            type="button"
            onClick={() => handleNav('dashboard')}
            className="flex items-center gap-2.5 text-left w-full cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-[#0F172A] leading-tight truncate">
                AI Engineer Command
              </div>
              <div className="text-[11px] text-[#64748B] truncate">
                DataMites 20-Week Master Track
              </div>
            </div>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#EFF6FF] text-[#1D4ED8]'
                    : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-3.5 border-t border-[#E2E8F0] bg-[#F8FAFC]/60">
          <div className="flex items-center justify-between text-xs text-[#475569]">
            <span className="font-semibold text-[#0F172A] tabular-nums">
              Week {state.profile.currentWeek} of 20
            </span>
            <span className="font-mono text-[11px] text-[#64748B]">{currentCourse.courseCode}</span>
          </div>
          <p className="text-xs text-[#64748B] truncate mt-0.5">{currentCourse.title}</p>
          <button
            type="button"
            onClick={() => (user ? void syncNow() : handleNav('settings'))}
            className="mt-2.5 w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#475569] hover:text-[#0F172A] hover:border-[#CBD5E1] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5 truncate">
              {user && syncStatus === 'synced' ? (
                <Cloud className="w-3.5 h-3.5 text-[#059669] shrink-0" />
              ) : syncStatus === 'syncing' ? (
                <RefreshCw className="w-3.5 h-3.5 text-[#2563EB] animate-spin shrink-0" />
              ) : (
                <CloudOff className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
              )}
              <span className="truncate">
                {user
                  ? syncStatus === 'syncing'
                    ? 'Syncing cloud...'
                    : syncStatus === 'error'
                      ? 'Sync issue (local saved)'
                      : 'Cloud synced'
                  : 'Local storage active'}
              </span>
            </span>
            <span className="text-[11px] text-[#2563EB] font-medium shrink-0 ml-2">
              {user ? 'Sync' : 'Connect'}
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#0F172A]/30 backdrop-blur-[1px]"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-white h-full border-r border-[#E2E8F0] flex flex-col shadow-lg">
            <div className="px-4 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#2563EB] text-white flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-[#0F172A] truncate">AI Engineer Command</span>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#EFF6FF] text-[#1D4ED8]'
                        : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="px-4 py-3 border-t border-[#E2E8F0] text-xs text-[#64748B]">
              Active: <span className="font-semibold text-[#0F172A]">Week {state.profile.currentWeek}</span> · {currentCourse.title}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Compact Top Header */}
        <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-xs border-b border-[#E2E8F0] px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden p-1.5 -ml-1 rounded-lg text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-bold text-[#0F172A] truncate">
              {activeMeta.label}
            </h1>
            <span className="hidden sm:inline text-xs text-[#64748B] truncate">
              · Week {state.profile.currentWeek} ({currentCourse.title})
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleNav('settings')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs font-medium text-[#475569] hover:text-[#0F172A] hover:border-[#CBD5E1] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {user ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-[#059669]" />
                  <span className="hidden sm:inline max-w-[140px] truncate">{user.displayName || user.email}</span>
                  <span className="sm:hidden">Synced</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Local</span>
                </>
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-5 sm:py-6 pb-20 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Compact Mobile Bottom Navigation (<= 56px height) */}
      <nav
        aria-label="Mobile quick navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-14 bg-white border-t border-[#E2E8F0] grid grid-cols-4 px-1"
      >
        {MOBILE_BOTTOM_NAV.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium cursor-pointer ${
                active ? 'text-[#2563EB]' : 'text-[#64748B]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-16 lg:bottom-5 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)]">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-[#E2E8F0] shadow-md rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2.5 text-sm text-[#0F172A]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 ${
                    t.tone === 'warning' ? 'text-[#D97706]' : 'text-[#059669]'
                  }`}
                />
                <span className="truncate">{t.text}</span>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="p-0.5 text-[#94A3B8] hover:text-[#475569] cursor-pointer"
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
