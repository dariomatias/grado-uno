import { useState } from 'react';
import { StoreProvider, useStore } from './ui/store.tsx';
import { Header } from './ui/components/Header.tsx';
import { KeyControls } from './ui/components/KeyControls.tsx';
import { DegreeCards } from './ui/components/DegreeCards.tsx';
import { DegreeDetail } from './ui/components/DegreeDetail.tsx';
import { QuickStart } from './ui/components/QuickStart.tsx';
import { ProgressionTray } from './ui/components/ProgressionTray.tsx';
import { Preferences } from './ui/components/Preferences.tsx';

function Workspace() {
  const [prefsOpen, setPrefsOpen] = useState(false);
  const { vm } = useStore();
  const hasProgression = vm.progression.slots.length > 0;

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <main
        className="mx-auto max-w-md space-y-4 px-4 pt-[max(1rem,env(safe-area-inset-top))]"
        style={{ paddingBottom: hasProgression ? '14rem' : '2rem' }}
      >
        <Header onOpenPreferences={() => setPrefsOpen(true)} />
        <KeyControls />
        <DegreeCards />
        <DegreeDetail />
        <QuickStart />
      </main>

      {hasProgression && (
        <div className="fixed inset-x-0 bottom-0 z-40">
          <div className="mx-auto max-w-md">
            <ProgressionTray />
          </div>
        </div>
      )}

      {prefsOpen && <Preferences onClose={() => setPrefsOpen(false)} />}
    </div>
  );
}

export function App() {
  return (
    <StoreProvider>
      <Workspace />
    </StoreProvider>
  );
}
