import { useTimerStore } from '../../store/timerStore';
import { getThreePhaseTourbillonTimer } from '../../lib/nudgeMath';

/** Minimal horizontal track — linear scale, like a watch's linear complication */
export default function RunnerTheme() {
  const { totalSeconds, elapsed, isNudgeMode, stages } = useTimerStore();

  const timerCore = getThreePhaseTourbillonTimer(totalSeconds);
  const displayed = isNudgeMode ? timerCore.getDisplayedTime(elapsed) : elapsed;
  const pct = totalSeconds > 0 ? Math.min(100, (displayed / totalSeconds) * 100) : 0;
  const isWarning = pct >= 95;
  const color = isWarning ? 'var(--warning)' : 'var(--navy)';

  // Stage boundaries
  const boundaries: number[] = [];
  let acc = 0;
  if (stages.length > 1) {
    stages.slice(0, -1).forEach(s => {
      acc += s.minutes * 60;
      boundaries.push((acc / totalSeconds) * 100);
    });
  }

  // SVG dimensions
  const SVG_W = 680, SVG_H = 60;
  const TRACK_Y = 36, TRACK_X0 = 12, TRACK_X1 = SVG_W - 12;
  const trackW = TRACK_X1 - TRACK_X0;
  const dotX = TRACK_X0 + (trackW * pct) / 100;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        {/* Base track */}
        <line x1={TRACK_X0} y1={TRACK_Y} x2={TRACK_X1} y2={TRACK_Y}
          stroke="var(--rule)" strokeWidth="1" />

        {/* Filled portion */}
        <line x1={TRACK_X0} y1={TRACK_Y} x2={TRACK_X0 + (trackW * pct) / 100} y2={TRACK_Y}
          stroke={color} strokeWidth="1.5" />

        {/* Stage major ticks */}
        {boundaries.map((b, i) => (
          <g key={i}>
            <line
              x1={TRACK_X0 + (trackW * b) / 100}
              y1={TRACK_Y - 10}
              x2={TRACK_X0 + (trackW * b) / 100}
              y2={TRACK_Y + 4}
              stroke={b <= pct ? color : 'var(--ink-faint)'}
              strokeWidth="1"
            />
          </g>
        ))}

        {/* End cap */}
        <line x1={TRACK_X1} y1={TRACK_Y - 8} x2={TRACK_X1} y2={TRACK_Y + 4}
          stroke="var(--ink-mid)" strokeWidth="1" />

        {/* Start cap */}
        <line x1={TRACK_X0} y1={TRACK_Y - 5} x2={TRACK_X0} y2={TRACK_Y + 4}
          stroke="var(--ink-faint)" strokeWidth="1" />

        {/* Moving dot */}
        {elapsed > 0 && (
          <circle
            cx={dotX}
            cy={TRACK_Y}
            r="4.5"
            fill={color}
            stroke="white"
            strokeWidth="2"
          />
        )}

        {/* Labels */}
        <text x={TRACK_X0} y={TRACK_Y + 16} fill="var(--ink-faint)"
          fontSize="7" fontFamily="Inter Variable" letterSpacing="1" textAnchor="middle">
          0
        </text>
        <text x={TRACK_X1} y={TRACK_Y + 16} fill="var(--ink-faint)"
          fontSize="7" fontFamily="Inter Variable" letterSpacing="1" textAnchor="middle">
          FINISH
        </text>
      </svg>
    </div>
  );
}
