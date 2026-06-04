import { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import BigTimerDisplay from './components/timer/BigTimerDisplay';
import TimelineBar from './components/timer/TimelineBar';
import TimerControls from './components/controls/TimerControls';
import TimeAdjustButtons from './components/controls/TimeAdjustButtons';

import NudgeMessage from './components/timer/NudgeMessage';
import StageLabel from './components/timer/StageLabel';
import BreakModal from './components/modals/BreakModal';
import { useTimerTick } from './hooks/useTimer';

function CurrentClock({ onClick }: { onClick?: () => void }) {
  const [time, setTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    };
    // Sync to the next minute boundary
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    const timeout = setTimeout(() => {
      tick();
      const interval = setInterval(tick, 60000);
      return () => clearInterval(interval);
    }, msUntilNextMinute);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <span onClick={onClick} style={{
      cursor: onClick ? 'pointer' : 'default',
      fontSize: '1.0rem',
      fontWeight: 400,
      letterSpacing: '0.18em',
      color: 'var(--ink-faint)',
      fontVariantNumeric: 'tabular-nums',
      fontFamily: "'Inter Variable', sans-serif",
    }}>
      {time}
    </span>
  );
}

function BigClockDisplay({ onClick }: { onClick: () => void }) {
  const [time, setTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    };
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    const timeout = setTimeout(() => {
      tick();
      const interval = setInterval(tick, 60000);
      return () => clearInterval(interval);
    }, msUntilNextMinute);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div 
      className="timer-display" 
      onClick={onClick} 
      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, margin: '4rem 0' }}
      title="타이머로 돌아가기"
    >
      <span className="timer-number" style={{ transition: 'all 0.3s' }}>
        {time}
      </span>
      <div style={{ fontSize: '0.85rem', color: 'var(--ink-faint)', letterSpacing: '0.1em', marginTop: '2rem', opacity: 0.6 }}>
        클릭하여 타이머로 돌아가기
      </div>
    </div>
  );
}

export default function App() {
  const [showBreak, setShowBreak] = useState(false);
  const [isClockMode, setIsClockMode] = useState(false);
  useTimerTick();

  return (
    <div className="app-shell">
      <div className="app-card">
        <Header />

        {isClockMode ? (
          <BigClockDisplay onClick={() => setIsClockMode(false)} />
        ) : (
          <>
            {/* Stage label */}
            <StageLabel />
            {/* Big number */}
            <BigTimerDisplay />
            {/* Progress rule */}
            <TimelineBar />
            {/* Nudge message */}
            <NudgeMessage />
            {/* Controls */}
            <TimerControls />
            <TimeAdjustButtons />
          </>
        )}

        {/* Footer row inside card */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--rule)',
        }}>
          <CurrentClock onClick={() => setIsClockMode(true)} />
          <button
            onClick={() => setShowBreak(true)}
            style={{
              background: 'none', border: 'none', color: 'var(--ink-faint)',
              fontSize: '1.0rem', letterSpacing: '0.1em', cursor: 'pointer',
              textDecoration: 'underline', textUnderlineOffset: '4px',
              fontFamily: "'Inter Variable', sans-serif",
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--ink-light)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-faint)'}
          >
            Take a break...
          </button>
        </div>
      </div>

      {showBreak && <BreakModal onClose={() => setShowBreak(false)} />}
    </div>
  );
}
