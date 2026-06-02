import { useTimerStore } from '../../store/timerStore';
import { getDisplayedTimeWithStages } from '../../lib/nudgeMath';

export default function StageLabel() {
  const { stages, elapsed, totalSeconds, isRunning, isNudgeMode, nudgeIntensity } = useTimerStore();

  if (stages.length === 0) {
    return <div className="stage-label" style={{ marginBottom: '2rem' }}><span className="stage-label-text">&nbsp;</span></div>;
  }

  const displayed = isNudgeMode ? getDisplayedTimeWithStages(stages, totalSeconds, elapsed, nudgeIntensity) : elapsed;
  const remaining = Math.max(0, totalSeconds - displayed);
  const percent = totalSeconds > 0 ? (displayed / totalSeconds) * 100 : 0;
  const isBreak = stages.length === 1 && stages[0].name === '휴식';
  const isWarning = (remaining / 60 <= 1 || percent >= 95) && isRunning;

  // Determine current stage index
  let idx = stages.length - 1;
  let acc = 0;
  for (let i = 0; i < stages.length; i++) {
    acc += stages[i].minutes * 60;
    if (displayed < acc) { idx = i; break; }
  }

  const isNotStarted = elapsed === 0 && !isRunning;
  const isFinished = elapsed >= totalSeconds && totalSeconds > 0;

  // Edge cases handling
  if (isNotStarted) idx = 0;
  if (isFinished) idx = stages.length; // beyond last

  const prevStage = (idx > 0 && idx <= stages.length && !isBreak) ? stages[idx - 1] : null;
  const currentStage = isFinished ? { name: isBreak ? '휴식' : '모든 활동 완료' } : stages[idx];
  const nextStage = idx < stages.length - 1 ? stages[idx + 1] : null;

  return (
    <div className="stage-label" style={{ marginBottom: '2rem', width: '100%' }}>
      {/* STAGE X / Y Header */}
      <div style={{
        fontSize: '1.1rem', fontWeight: 600, letterSpacing: '0.2em',
        color: 'var(--ink-faint)', textTransform: 'uppercase', marginBottom: '1.2rem',
        textAlign: 'center'
      }}>
        {isNotStarted ? 'READY' : isFinished ? 'FINISH' : `STAGE ${idx + 1} / ${stages.length}`}
      </div>

      {/* Subway Station Style Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gap: '2.5rem',
        alignItems: 'baseline',
        width: '100%',
        padding: '0 2rem'
      }}>
        {/* Previous Stage (Left) */}
        <div style={{
          textAlign: 'right',
          fontSize: 'clamp(1.2rem, min(3vw, 4vh), 2.5rem)',
          color: 'var(--ink-faint)',
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {prevStage && <span style={{ opacity: 0.6 }}>{prevStage.name}</span>}
        </div>

        {/* Current Stage (Center) */}
        <div style={{
          textAlign: 'center',
          fontSize: 'clamp(3rem, min(7vw, 12vh), 6rem)',
          fontWeight: 200,
          color: isFinished ? 'var(--ink-faint)' : 'var(--ink)',
          letterSpacing: '-0.02em',
          whiteSpace: 'nowrap',
        }} className={isWarning && !isFinished ? 'warning-pulse' : ''}>
          {currentStage.name}
        </div>

        {/* Next Stage (Right) */}
        <div style={{
          textAlign: 'left',
          fontSize: 'clamp(1.2rem, min(3vw, 4vh), 2.5rem)',
          color: 'var(--ink-faint)',
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {nextStage && <span style={{ opacity: 0.6 }}>{nextStage.name}</span>}
        </div>
      </div>
    </div>
  );
}
