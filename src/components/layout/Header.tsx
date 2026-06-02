import { useState } from 'react';
import { useTimerStore } from '../../store/timerStore';
import SettingsModal from '../modals/SettingsModal';
import HelpModal from '../modals/HelpModal';

export default function Header() {
  const { isNudgeMode, setNudgeMode } = useTimerStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <div className="top-bar">
        {/* Wordmark */}
        <span 
          className="wordmark" 
          style={{ cursor: 'pointer' }}
          onClick={() => window.location.href = '/'}
          title="처음으로 돌아가기"
        >
          Nudge Timer
        </span>

        {/* Right side */}
        <div className="top-actions">
          {/* Nudge toggle */}
          <div className="nudge-toggle" onClick={() => setNudgeMode(!isNudgeMode)}>
            <div className={`nudge-track ${isNudgeMode ? 'on' : ''}`}>
              <div className="nudge-thumb" />
            </div>
            <span className="nudge-toggle-label">
              {isNudgeMode ? 'Nudge' : 'Normal'}
            </span>
          </div>

          {/* Fullscreen */}
          <button className="icon-btn" title="전체화면" onClick={() => {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen();
            else document.exitFullscreen();
          }}>
            Full
          </button>

          {/* Settings */}
          <button className="icon-btn" onClick={() => setShowSettings(true)}>
            Settings
          </button>

          {/* Help */}
          <button className="icon-btn" onClick={() => setShowHelp(true)}>
            ?
          </button>
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </>
  );
}
