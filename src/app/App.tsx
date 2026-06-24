import { InstallPWABanner } from '../components/InstallPWABanner';
import { BackgroundGlow } from '../components/BackgroundGlow';
import { FloatingParticles } from '../components/FloatingParticles';
import { MiniRobot } from '../components/MiniRobot';
import { useGameState } from '../hooks/useGameState';
import { EndScreen } from '../screens/EndScreen';
import { GameScreen } from '../screens/GameScreen';
import { LevelSelectScreen } from '../screens/LevelSelectScreen';
import { ModeSelectScreen } from '../screens/ModeSelectScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TutorialScreen } from '../screens/TutorialScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import '../styles/globals.css';

export default function App() {
  const {
    settings,
    game,
    effectiveTarget,
    updateSettings,
    navigate,
    setMode,
    setLevel,
    setGameFormat,
    setScoringMode,
    setCoupleTaskMode,
    setContentMode,
    setPlayerNames,
    setEveningName,
    setTargetScore,
    setCustomTargetScore,
    setRoundCount,
    goToTutorial,
    startGame,
    startSpin,
    handleSpinEnd,
    completeTask,
    skipTask,
    replaceTask,
    taskTooEasy,
    taskTooHard,
    markFunniest,
    endGame,
    newGame,
    playAgain,
    resetScores,
    toggleSound,
  } = useGameState();

  return (
    <main className="app-shell" dir="rtl">
      <BackgroundGlow />
      <FloatingParticles />
      <InstallPWABanner />

      {game.screen === 'welcome' && (
        <WelcomeScreen
          onStart={() => navigate('mode-select')}
          onSettings={() => navigate('settings')}
        />
      )}

      {game.screen === 'mode-select' && (
        <ModeSelectScreen
          selected={game.mode}
          onSelect={setMode}
          onContinue={() => navigate('level-select')}
          onBack={() => navigate('welcome')}
        />
      )}

      {game.screen === 'level-select' && (
        <LevelSelectScreen
          level={game.level}
          gameFormat={game.gameFormat}
          scoringMode={game.scoringMode}
          coupleTaskMode={game.coupleTaskMode}
          contentMode={game.contentMode}
          roundCount={game.roundTarget}
          targetScore={game.targetScore}
          customTargetScore={game.customTargetScore}
          eveningName={game.eveningName}
          playerOneName={game.playerOneName}
          playerTwoName={game.playerTwoName}
          playerOneColor={settings.playerOneColor}
          playerTwoColor={settings.playerTwoColor}
          playerOneAvatar={settings.playerOneAvatar}
          playerTwoAvatar={settings.playerTwoAvatar}
          onLevelSelect={setLevel}
          onFormatChange={setGameFormat}
          onScoringChange={setScoringMode}
          onCoupleModeChange={setCoupleTaskMode}
          onContentModeChange={setContentMode}
          onRoundCountChange={setRoundCount}
          onTargetScoreSelect={setTargetScore}
          onCustomTargetChange={setCustomTargetScore}
          onEveningNameChange={setEveningName}
          onPlayerNamesChange={setPlayerNames}
          onPlayerColorsChange={(c1, c2) => updateSettings({ playerOneColor: c1, playerTwoColor: c2 })}
          onPlayerAvatarsChange={(a1, a2) => updateSettings({ playerOneAvatar: a1, playerTwoAvatar: a2 })}
          onContinue={goToTutorial}
          onBack={() => navigate('mode-select')}
        />
      )}

      {game.screen === 'tutorial' && (
        <TutorialScreen onStart={startGame} onBack={() => navigate('level-select')} />
      )}

      {game.screen === 'game' && (
        <GameScreen
          key={game.stats.startTime}
          settings={settings}
          game={game}
          effectiveTarget={effectiveTarget}
          currentPlayerName={game.currentPlayerIndex === 0 ? game.playerOneName : game.playerTwoName}
          contentMode={game.contentMode}
          onStartSpin={startSpin}
          onSpinEnd={handleSpinEnd}
          onComplete={completeTask}
          onSkip={skipTask}
          onReplaceTask={replaceTask}
          onTooEasy={taskTooEasy}
          onTooHard={taskTooHard}
          onMarkFunniest={markFunniest}
          onEndGame={endGame}
          onToggleSound={toggleSound}
        />
      )}

      {game.screen === 'end' && (
        <EndScreen
          game={game}
          settings={settings}
          onNewGame={newGame}
          onPlayAgain={playAgain}
          onHome={newGame}
        />
      )}

      {game.screen === 'settings' && (
        <SettingsScreen
          settings={settings}
          onUpdate={updateSettings}
          onResetScores={resetScores}
          onBack={() => navigate('welcome')}
        />
      )}

      <MiniRobot
        game={game}
        settings={settings}
        effectiveTarget={effectiveTarget}
        soundEnabled={settings.soundEnabled}
      />
    </main>
  );
}
