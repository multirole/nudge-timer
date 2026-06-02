import { useTimerStore } from '../../store/timerStore';
import { formatTime, getDisplayedTimeWithStages } from '../../lib/nudgeMath';

export default function BigTimerDisplay() {
  const { totalSeconds, elapsed, isNudgeMode, stages, nudgeIntensity } = useTimerStore();

  const displayed = isNudgeMode ? getDisplayedTimeWithStages(stages, totalSeconds, elapsed, nudgeIntensity) : elapsed;
  const remaining = Math.max(0, totalSeconds - displayed);
  const percent = totalSeconds > 0 ? (displayed / totalSeconds) * 100 : 0;
  const isFinished = elapsed >= totalSeconds && totalSeconds > 0;
  const isWarning = !isFinished && (remaining / 60 <= 1 || percent >= 95);

  return (
    <div className="timer-display">
      <span className={`timer-number ${isWarning ? 'warning' : ''} ${isFinished ? 'finished' : ''}`}>
        {formatTime(remaining)}
      </span>
    </div>
  );
}
