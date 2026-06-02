import { useState, useEffect } from 'react';
import { useTimerStore } from '../../store/timerStore';

interface Props { onClose: () => void; }

type Mode = 'DURATION' | 'TARGET';

function getRoundedCurrentTime() {
  const d = new Date();
  const m = d.getMinutes();
  const rem = m % 5;
  if (rem !== 0) d.setMinutes(m + (5 - rem));
  return { hh: d.getHours(), mm: d.getMinutes() };
}

export default function BreakModal({ onClose }: Props) {
  const { setStages, start, reset } = useTimerStore();
  const [mode, setMode] = useState<Mode>('DURATION');
  
  // Duration state
  const [durationMins, setDurationMins] = useState(10);
  
  // Target state
  const [hh, setHh] = useState(10);
  const [mm, setMm] = useState(0);

  useEffect(() => {
    const { hh: initialHh, mm: initialMm } = getRoundedCurrentTime();
    setHh(initialHh);
    setMm(initialMm);
  }, []);

  const setTargetMinutes = (mins: number) => {
    // setStages resets elapsed automatically, then start
    setStages([{
      id: String(Date.now()),
      name: '\ud734\uc2dd',
      minutes: mins
    }]);
    // Wait 2 ticks for Zustand state to flush, then start
    requestAnimationFrame(() => requestAnimationFrame(() => start()));
    onClose();
  };

  const applyTargetTime = () => {
    if (mode === 'DURATION') {
      if (durationMins > 0) setTargetMinutes(durationMins);
      return;
    }

    const now = new Date();
    const target = new Date();
    target.setHours(hh, mm, 0, 0);

    if (target.getTime() <= now.getTime()) {
      alert('현재 시각보다 이후의 시각을 설정해주세요.');
      return;
    }

    const diffMs = target.getTime() - now.getTime();
    const diffMins = diffMs / 60000;

    if (diffMins > 0) {
      setTargetMinutes(diffMins);
    }
  };

  const bumpHour = (dir: 1 | -1) => setHh((prev) => (prev + dir + 24) % 24);
  const bumpMin = (dir: 1 | -1) => setMm((prev) => (prev + dir + 60) % 60);
  const bumpDuration = (dir: 1 | -1) => setDurationMins((prev) => Math.max(1, prev + dir));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: '320px', padding: '2rem' }}>
        
        {/* Mode Toggle Tabs */}
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem', justifyContent: 'center' }}>
          <button 
            onClick={() => setMode('DURATION')}
            style={{ 
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.65rem', letterSpacing: '0.1em',
              color: mode === 'DURATION' ? 'var(--navy)' : 'var(--ink-faint)',
              fontWeight: mode === 'DURATION' ? 600 : 400,
              paddingBottom: '0.4rem',
              borderBottom: mode === 'DURATION' ? '2px solid var(--navy)' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            DURATION
          </button>
          <button 
            onClick={() => setMode('TARGET')}
            style={{ 
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.65rem', letterSpacing: '0.1em',
              color: mode === 'TARGET' ? 'var(--navy)' : 'var(--ink-faint)',
              fontWeight: mode === 'TARGET' ? 600 : 400,
              paddingBottom: '0.4rem',
              borderBottom: mode === 'TARGET' ? '2px solid var(--navy)' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            TARGET TIME
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {mode === 'DURATION' && (
            <div>
              <div style={{ fontSize: '0.55rem', color: 'var(--ink-faint)', letterSpacing: '0.15em', marginBottom: '1rem', textAlign: 'center' }}>
                쉬는 시간 (분)
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', fontSize: '1rem', padding: '0.5rem', transition: 'color 0.2s' }} onClick={() => bumpDuration(1)} onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-faint)'}>▲</button>
                  <div style={{ fontSize: '3.5rem', fontWeight: 200, width: '6rem', textAlign: 'center', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                    {durationMins}
                  </div>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', fontSize: '1rem', padding: '0.5rem', transition: 'color 0.2s' }} onClick={() => bumpDuration(-1)} onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-faint)'}>▼</button>
                </div>
              </div>
            </div>
          )}

          {mode === 'TARGET' && (
            <div>
              <div style={{ fontSize: '0.55rem', color: 'var(--ink-faint)', letterSpacing: '0.15em', marginBottom: '1rem', textAlign: 'center' }}>
                도착 시각
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
                {/* Hour */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', fontSize: '1rem', padding: '0.5rem', transition: 'color 0.2s' }} onClick={() => bumpHour(1)} onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-faint)'}>▲</button>
                  <div style={{ fontSize: '3rem', fontWeight: 200, width: '4.5rem', textAlign: 'center', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                    {String(hh).padStart(2, '0')}
                  </div>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', fontSize: '1rem', padding: '0.5rem', transition: 'color 0.2s' }} onClick={() => bumpHour(-1)} onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-faint)'}>▼</button>
                </div>
                
                <div style={{ fontSize: '3rem', fontWeight: 200, color: 'var(--ink-light)', paddingBottom: '0.2rem' }}>:</div>
                
                {/* Minute */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', fontSize: '1rem', padding: '0.5rem', transition: 'color 0.2s' }} onClick={() => bumpMin(1)} onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-faint)'}>▲</button>
                  <div style={{ fontSize: '3rem', fontWeight: 200, width: '4.5rem', textAlign: 'center', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                    {String(mm).padStart(2, '0')}
                  </div>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', fontSize: '1rem', padding: '0.5rem', transition: 'color 0.2s' }} onClick={() => bumpMin(-1)} onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-faint)'}>▼</button>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', width: '100%' }}>
            <button className="ctrl-btn" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button className="ctrl-btn primary" style={{ flex: 1 }} onClick={applyTargetTime}>
              START
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
