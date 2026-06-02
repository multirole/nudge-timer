import { useTimerStore } from '../../store/timerStore';
import { getThreePhaseTourbillonTimer } from '../../lib/nudgeMath';

/** Minimal vertical altitude gauge — precision instrument aesthetic */
export default function RocketTheme() {
  const { totalSeconds, elapsed, isNudgeMode, stages } = useTimerStore();

  const timerCore = getThreePhaseTourbillonTimer(totalSeconds);
  const displayed = isNudgeMode ? timerCore.getDisplayedTime(elapsed) : elapsed;
  const pct = totalSeconds > 0 ? Math.min(100, (displayed / totalSeconds) * 100) : 0;
  const isWarning = pct >= 95;
  const color = isWarning ? 'var(--warning)' : 'var(--navy)';

  const boundaries: number[] = [];
  let acc = 0;
  if (stages.length > 1) {
    stages.slice(0, -1).forEach(s => {
      acc += s.minutes * 60;
      boundaries.push((acc / totalSeconds) * 100);
    });
  }

  // SVG
  const SVG_W = 680, SVG_H = 60;
  // Left vertical gauge
  const GAUGE_X = 48, GAUGE_Y0 = 8, GAUGE_Y1 = SVG_H - 12;
  const gaugeH = GAUGE_Y1 - GAUGE_Y0;
  const dotY = GAUGE_Y1 - (gaugeH * pct) / 100;
  // Right text area
  const TEXT_X = GAUGE_X + 24;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        {/* Vertical track */}
        <line x1={GAUGE_X} y1={GAUGE_Y0} x2={GAUGE_X} y2={GAUGE_Y1}
          stroke="var(--rule)" strokeWidth="1" />

        {/* Filled portion (bottom up) */}
        <line x1={GAUGE_X} y1={GAUGE_Y1} x2={GAUGE_X} y2={dotY}
          stroke={color} strokeWidth="1.5" />

        {/* Scale ticks */}
        {[0, 25, 50, 75, 100].map(p => {
          const ty = GAUGE_Y1 - (gaugeH * p) / 100;
          return (
            <g key={p}>
              <line x1={GAUGE_X - 5} y1={ty} x2={GAUGE_X} y2={ty}
                stroke="var(--ink-faint)" strokeWidth="0.8" />
              <text x={GAUGE_X - 8} y={ty + 2.5}
                fill="var(--ink-faint)" fontSize="6" fontFamily="Inter Variable"
                textAnchor="end" letterSpacing="0.5">
                {p}
              </text>
            </g>
          );
        })}

        {/* Stage ticks */}
        {boundaries.map((b, i) => {
          const ty = GAUGE_Y1 - (gaugeH * b) / 100;
          return (
            <line key={i}
              x1={GAUGE_X - 8} y1={ty} x2={GAUGE_X} y2={ty}
              stroke={b <= pct ? color : 'var(--ink-faint)'}
              strokeWidth="1" />
          );
        })}

        {/* Moving dot */}
        {elapsed > 0 && (
          <circle cx={GAUGE_X} cy={dotY} r="4"
            fill={color} stroke="white" strokeWidth="2" />
        )}

        {/* Altitude label */}
        <text x={TEXT_X} y={GAUGE_Y0 + 10}
          fill="var(--ink-faint)" fontSize="7" fontFamily="Inter Variable" letterSpacing="1.5">
          ALT
        </text>
        <text x={TEXT_X} y={GAUGE_Y0 + 22}
          fill={color} fontSize="20" fontFamily="Inter Variable" fontWeight="200"
          letterSpacing="-0.5">
          {Math.round(pct)}
        </text>
        <text x={TEXT_X + 30} y={GAUGE_Y0 + 21}
          fill="var(--ink-faint)" fontSize="8" fontFamily="Inter Variable">
          %
        </text>


      </svg>
    </div>
  );
}
