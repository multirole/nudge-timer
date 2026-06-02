import { useTimerStore } from '../../store/timerStore';
import { getThreePhaseTourbillonTimer } from '../../lib/nudgeMath';

/** Minimal lab-vessel water fill — precision instrument aesthetic */
export default function WaterTheme() {
  const { totalSeconds, elapsed, isNudgeMode } = useTimerStore();

  const timerCore = getThreePhaseTourbillonTimer(totalSeconds);
  const displayed = isNudgeMode ? timerCore.getDisplayedTime(elapsed) : elapsed;
  const pct = totalSeconds > 0 ? Math.min(100, (displayed / totalSeconds) * 100) : 0;
  const isWarning = pct >= 95;

  const fillColor = isWarning ? 'var(--warning)' : 'var(--navy)';
  const fillAlpha = isWarning ? 'rgba(185,28,28,0.08)' : 'rgba(27,58,138,0.06)';

  // Vessel dimensions
  const W = 40, H = 80;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2.5rem' }}>
      {/* SVG vessel */}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} overflow="visible">
        {/* vessel outline */}
        <rect x="0.5" y="0.5" width={W - 1} height={H - 1} fill={fillAlpha} stroke={fillColor} strokeWidth="0.8" />
        {/* fill level */}
        <rect
          x="0.5"
          y={0.5 + (H - 1) * (1 - pct / 100)}
          width={W - 1}
          height={(H - 1) * (pct / 100)}
          fill={fillColor}
          opacity="0.15"
        />
        {/* fill line */}
        <line
          x1="0.5" x2={W - 0.5}
          y1={0.5 + (H - 1) * (1 - pct / 100)}
          y2={0.5 + (H - 1) * (1 - pct / 100)}
          stroke={fillColor}
          strokeWidth="1.2"
        />
        {/* scale ticks on right edge */}
        {[25, 50, 75].map(p => (
          <line
            key={p}
            x1={W - 6} x2={W - 0.5}
            y1={0.5 + (H - 1) * (1 - p / 100)}
            y2={0.5 + (H - 1) * (1 - p / 100)}
            stroke={fillColor}
            strokeWidth="0.6"
            opacity="0.4"
          />
        ))}
      </svg>

    </div>
  );
}
