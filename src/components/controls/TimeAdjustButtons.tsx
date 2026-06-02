import { useTimerStore } from '../../store/timerStore';

const PLUS  = [1, 5, 10];
const MINUS = [-1, -5, -10];

export default function TimeAdjustButtons() {
  const addMinutes = useTimerStore(s => s.addMinutes);

  return (
    <div style={{ marginTop: '0.1rem' }}>
      <div className="adjust-row">
        {PLUS.map(m => (
          <button key={m} className="adj-btn" onClick={() => addMinutes(m)}>
            +{m} min
          </button>
        ))}
        <span style={{ color: 'var(--ink-faint)', fontSize: '0.7rem', alignSelf: 'center' }}>·</span>
        {MINUS.map(m => (
          <button key={m} className="adj-btn minus" onClick={() => addMinutes(m)}>
            {m} min
          </button>
        ))}
      </div>
    </div>
  );
}
