import { useTimerStore } from '../../store/timerStore';

export default function TimerControls() {
  const { isRunning, elapsed, totalSeconds, start, pause, reset } = useTimerStore();
  const isFinished = elapsed >= totalSeconds && totalSeconds > 0;

  return (
    <div className="controls-row">
      <button className="ctrl-btn primary" onClick={start} disabled={isRunning || isFinished}>
        Start
      </button>
      <button className="ctrl-btn" onClick={pause} disabled={!isRunning}>
        Pause
      </button>
      <button className="ctrl-btn" onClick={() => window.location.reload()}>
        Reset
      </button>
    </div>
  );
}
