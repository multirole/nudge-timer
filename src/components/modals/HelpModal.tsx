import { useTimerStore } from '../../store/timerStore';

interface Props { onClose: () => void; }

export default function HelpModal({ onClose }: Props) {
  const { nudgeIntensity } = useTimerStore();
  const lo = (1 - nudgeIntensity).toFixed(1);
  const hi = (1 + nudgeIntensity).toFixed(1);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Nudge Timer</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', fontSize: '1rem' }}>×</button>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--ink-mid)', lineHeight: 1.8, marginBottom: '1.5rem', letterSpacing: '0.02em' }}>
          시간의 흐름을 3구간으로 나눠 체감 속도를 조정하는 타이머입니다.
          초반에는 빠르게, 마지막에는 느리게 느껴지도록 설계되었습니다.
        </p>

        <div>
          {[
            { label: '초반 60%', desc: `${hi}× 속도 — 집중 유도` },
            { label: '중반 10%', desc: '1.0× 속도 — 안정 구간' },
            { label: '후반 30%', desc: `${lo}× 속도 — 마무리 여유` },
          ].map(item => (
            <div key={item.label} className="help-item">
              <span className="help-item-label">{item.label}</span>
              <span className="help-item-desc">{item.desc}</span>
            </div>
          ))}
        </div>

        <p style={{ fontSize: '0.7rem', color: 'var(--ink-faint)', marginTop: '1.5rem', letterSpacing: '0.05em' }}>
          현재 Nudge Intensity: <strong style={{ color: 'var(--navy)' }}>{nudgeIntensity.toFixed(1)}</strong> — Settings에서 변경할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
