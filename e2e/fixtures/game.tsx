import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GameScreen } from '../../src/screens/GameScreen';
import { EndScreen } from '../../src/screens/EndScreen';
import { useGameState } from '../../src/hooks/useGameState';
import { useDeviceLayout } from '../../src/hooks/useDeviceLayout';
import { createTestGameState } from '../../src/utils/gameSimulator';
import { filterTasks } from '../../src/utils/taskSelection';
import '../../src/styles/globals.css';
import '../../src/styles/responsive.css';
import '../../src/styles/tokens.css';
import '../../src/styles/friendly.css';
import '../../src/styles/premium.css';
import '../../src/styles/cinematic.css';
import '../../src/styles/experience.css';

declare global { interface Window {
  audit: ReturnType<typeof useGameState>;
  auditSeed: (timed?: boolean) => void;
} }
let version = 0;
export function Fixture() {
  const api = useGameState();
  useDeviceLayout();
  useEffect(() => {
    window.audit = api;
    window.auditSeed = (timed = false) => api.applyRemoteSnapshot(createTestGameState({
      contentMode: 'tasks', scoringMode: 'cooperative', targetScore: 10,
      currentTask: timed ? null : filterTasks('mixed', 'easy', [], false)[0],
      ...(timed ? { timeLimitSeconds: 3, timeRemainingSeconds: 3, timeDeadlineMs: Date.now() + 3000 } : {}),
    }), ++version);
  }, [api]);
  return <>
    <pre id="audit-state" hidden>{JSON.stringify(api.game)}</pre>
    {api.game.screen === 'end' && <EndScreen game={api.game} settings={api.settings}
      onPlayAgain={api.playAgain} onNewGame={api.newGame} onHome={() => api.navigate('welcome')} />}
    {api.game.screen === 'game' && <GameScreen
      settings={api.settings} game={api.game} effectiveTarget={api.effectiveTarget}
      currentPlayerName={api.currentPlayerName} contentMode={api.game.contentMode}
      onStartSpin={api.startSpin} onSpinEnd={api.handleSpinEnd} onComplete={api.completeTask}
      onSkip={api.skipTask} onReplaceTask={api.replaceTask} onTooEasy={api.taskTooEasy}
      onTooHard={api.taskTooHard} onMarkFunniest={api.markFunniest} onEndGame={api.endGame}
      onToggleSound={api.toggleSound} onPause={api.pauseGame} onResume={api.resumeGame}
      onUndo={api.undoLast} onExitToHome={() => api.navigate('welcome')}
      onOpenSettings={() => api.navigate('settings')} onRestart={api.playAgain}
    />}
  </>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Fixture /></StrictMode>);
