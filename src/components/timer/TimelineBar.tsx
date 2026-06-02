import { useState, useRef, useCallback } from 'react';
import { useTimerStore } from '../../store/timerStore';
import { getDisplayedTimeWithStages, getRealTimeWithStages, formatTime } from '../../lib/nudgeMath';

// Generate evenly spaced minor tick marks
const MINOR_TICKS = 20;

export default function TimelineBar() {
  const { totalSeconds, elapsed, setElapsed, isNudgeMode, stages, nudgeIntensity, isRunning, start } = useTimerStore();
  const [hover, setHover] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  
  // local dragging state for smooth UI updates
  const [dragPct, setDragPct] = useState<number | null>(null);
  const wasRunningRef = useRef(false);

  const displayed = isNudgeMode ? getDisplayedTimeWithStages(stages, totalSeconds, elapsed, nudgeIntensity) : elapsed;
  
  const actualPercent = totalSeconds > 0 ? Math.min(100, (displayed / totalSeconds) * 100) : 0;
  const percent = dragPct !== null ? dragPct : actualPercent;
  
  const isWarning = (totalSeconds - (percent / 100 * totalSeconds)) / 60 <= 1 || percent >= 95;

  const updateProgress = useCallback((clientX: number) => {
    if (!trackRef.current || totalSeconds <= 0) return;
    const rect = trackRef.current.getBoundingClientRect();
    let p = (clientX - rect.left) / rect.width;
    p = Math.max(0, Math.min(1, p));
    
    setDragPct(p * 100);
    
    const targetDisplayed = p * totalSeconds;
    const targetReal = isNudgeMode ? getRealTimeWithStages(stages, totalSeconds, targetDisplayed, nudgeIntensity) : targetDisplayed;
    setElapsed(targetReal);
  }, [totalSeconds, isNudgeMode, stages, setElapsed, nudgeIntensity]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    updateProgress(e.clientX);
  }, [updateProgress]);

  const handlePointerUp = useCallback(() => {
    setDragPct(null);
    // Resume if it was running before drag
    if (wasRunningRef.current) {
      start();
    }
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  }, [handlePointerMove, start]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!trackRef.current) return;
    // Remember running state before drag starts
    wasRunningRef.current = isRunning;
    // Capture pointer so it continues to fire events even outside the element
    e.currentTarget.setPointerCapture(e.pointerId);
    updateProgress(e.clientX);
    
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Stage boundaries (as percentage)
  const stageBoundaries: { pct: number; name: string }[] = [];
  let acc = 0;
  if (stages.length > 1) {
    stages.slice(0, -1).forEach(s => {
      acc += s.minutes * 60;
      stageBoundaries.push({ pct: (acc / totalSeconds) * 100, name: s.name });
    });
  }

  return (
    <div
      ref={trackRef}
      className="progress-area"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onPointerDown={handlePointerDown}
      style={{ cursor: 'pointer', padding: '1rem 0' }}
    >
      {/* Tooltip */}
      <div className="progress-tooltip" style={{ opacity: hover || dragPct !== null ? 1 : 0 }}>
        {formatTime(totalSeconds)} total · {formatTime(dragPct !== null ? (dragPct/100)*totalSeconds : displayed)} elapsed
      </div>

      {/* Tick marks row */}
      <div className="tick-row" style={{ pointerEvents: 'none' }}>
        {/* Minor ticks */}
        {Array.from({ length: MINOR_TICKS - 1 }).map((_, i) => (
          <div
            key={`m${i}`}
            className="tick-mark minor"
            style={{ left: `${((i + 1) / MINOR_TICKS) * 100}%` }}
          />
        ))}
        {/* Stage major ticks */}
        {stageBoundaries.map((b, i) => (
          <div
            key={`s${i}`}
            className="tick-mark major"
            style={{ left: `${b.pct}%` }}
          />
        ))}
      </div>

      {/* Progress rule */}
      <div className="progress-rule" style={{ pointerEvents: 'none' }}>
        <div
          className={`progress-fill-line ${isWarning ? 'warning' : ''}`}
          style={{ width: `${percent}%`, transition: dragPct !== null ? 'none' : 'width 0.3s linear' }}
        />
        {(elapsed > 0 || dragPct !== null) && (
          <div
            className={`progress-dot ${isWarning ? 'warning' : ''}`}
            style={{ left: `${percent}%`, transition: dragPct !== null ? 'none' : 'left 0.3s linear' }}
          />
        )}
      </div>

      {/* Stage name labels */}
      {stageBoundaries.length > 0 && (
        <div className="stage-names-row" style={{ pointerEvents: 'none' }}>
          {stageBoundaries.map((b, i) => (
            <span
              key={i}
              className={`stage-name-label ${b.pct <= percent ? 'passed' : ''}`}
              style={{ left: `${b.pct}%` }}
            >
              {b.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
