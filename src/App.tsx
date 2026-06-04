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
  const [showSeconds, setShowSeconds] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // 100ms 간격으로 업데이트하여 초와 깜빡임을 부드럽게 처리
    const interval = setInterval(() => setNow(new Date()), 100);
    return () => clearInterval(interval);
  }, []);

  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  
  // 500ms 켜지고 500ms 꺼짐 (깜빡임 효과)
  const showColon = now.getMilliseconds() < 500;

  return (
    <div 
      className="timer-display" 
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, margin: '4rem 0' }}
    >
      <span 
        className="timer-number" 
        style={{ cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'baseline' }}
        onClick={onClick}
        title="타이머로 돌아가기"
      >
        <span>{hh}</span>
        <span style={{ opacity: showColon ? 1 : 0, transition: 'opacity 0.1s', margin: '0 -0.05em' }}>:</span>
        <span>{mm}</span>
        {showSeconds && (
          <>
            <span style={{ opacity: showColon ? 1 : 0, transition: 'opacity 0.1s', margin: '0 -0.05em' }}>:</span>
            <span>{ss}</span>
          </>
        )}
      </span>
      
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
        <button 
          onClick={() => setShowSeconds(prev => !prev)}
          style={{
            background: 'none', border: '1px solid var(--rule)', borderRadius: '20px',
            color: 'var(--ink-faint)', fontSize: '0.75rem', padding: '0.5rem 1.2rem',
            cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.05em'
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--ink)'; e.currentTarget.style.borderColor = 'var(--ink-light)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-faint)'; e.currentTarget.style.borderColor = 'var(--rule)'; }}
        >
          초 표시 {showSeconds ? '끄기' : '켜기'}
        </button>
        <button 
          onClick={onClick}
          style={{
            background: 'none', border: '1px solid var(--rule)', borderRadius: '20px',
            color: 'var(--ink-faint)', fontSize: '0.75rem', padding: '0.5rem 1.2rem',
            cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.05em'
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--ink)'; e.currentTarget.style.borderColor = 'var(--ink-light)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-faint)'; e.currentTarget.style.borderColor = 'var(--rule)'; }}
        >
          타이머로 돌아가기
        </button>
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
