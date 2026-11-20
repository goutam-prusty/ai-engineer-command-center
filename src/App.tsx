import React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppStateProvider, useAppState } from './context/AppStateContext';
import { AppShell } from './components/AppShell';
import { OnboardingModal } from './components/OnboardingModal';
import { DashboardView } from './views/DashboardView';
import { LearningPlanView } from './views/LearningPlanView';
import { CurriculumView } from './views/CurriculumView';
import { WeeklyStudyRoomView } from './views/WeeklyStudyRoomView';
import { ResourceLibraryView } from './views/ResourceLibraryView';
import { ProjectsView } from './views/ProjectsView';
import { RevisionView } from './views/RevisionView';
import { AnalyticsView } from './views/AnalyticsView';
import { JournalView } from './views/JournalView';
import { SettingsView } from './views/SettingsView';

function MainContent() {
  const { activeSection } = useAppState();

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardView />;
      case 'plan':
        return <LearningPlanView />;
      case 'curriculum':
        return <CurriculumView />;
      case 'study-room':
        return <WeeklyStudyRoomView />;
      case 'resources':
        return <ResourceLibraryView />;
      case 'projects':
        return <ProjectsView />;
      case 'revision':
        return <RevisionView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'journal':
        return <JournalView />;
      case 'settings':
        return <SettingsView />;
    }
  };

  return (
    <>
      <AppShell>{renderSection()}</AppShell>
      <OnboardingModal />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppStateProvider>
        <MainContent />
      </AppStateProvider>
    </ErrorBoundary>
  );
}
