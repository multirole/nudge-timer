import type { Stage, CustomMessage } from '../../types';
import { useState } from 'react';
import { useTimerStore } from '../../store/timerStore';

interface Props { onClose: () => void; }

export default function SettingsModal({ onClose }: Props) {
  const { stages, setStages, nudgeIntensity, setNudgeIntensity } = useTimerStore();
  // Ensure existing stages have a messages array (migration for older data)
  const [local, setLocal] = useState<Stage[]>(stages.map(s => {
    let initialMessages = s.messages;
    if (!initialMessages) {
      initialMessages = (s as any).nudgeMessage ? [{ id: String(Date.now()), text: (s as any).nudgeMessage, displayMode: 'start' }] : [];
    }
    return { ...s, messages: initialMessages };
  }));
  const [localIntensity, setLocalIntensity] = useState<number>(nudgeIntensity);

  const add = () =>
    setLocal([...local, { id: String(Date.now()), name: '', minutes: 5, messages: [] }]);
  const remove = (id: string) => setLocal(local.filter(s => s.id !== id));
  const update = (id: string, f: keyof Stage, v: any) =>
    setLocal(local.map(s => s.id === id ? { ...s, [f]: v } : s));

  // Message helpers
  const addMsg = (stageId: string) => {
    setLocal(local.map(s => s.id === stageId ? {
      ...s,
      messages: [...(s.messages || []), { id: String(Date.now()), text: '', displayMode: 'start' }]
    } : s));
  };
  const removeMsg = (stageId: string, msgId: string) => {
    setLocal(local.map(s => s.id === stageId ? {
      ...s,
      messages: s.messages.filter(m => m.id !== msgId)
    } : s));
  };
  const updateMsg = (stageId: string, msgId: string, field: keyof CustomMessage, value: any) => {
    setLocal(local.map(s => s.id === stageId ? {
      ...s,
      messages: s.messages.map(m => m.id === msgId ? { ...m, [field]: value } : m)
    } : s));
  };

  const save = () => {
    // Filter empty stages and empty messages
    const finalStages = local
      .filter(s => s.name.trim() && s.minutes > 0)
      .map(s => ({
        ...s,
        messages: (s.messages || []).filter(m => m.text.trim() !== '')
      }));
    setStages(finalStages);
    setNudgeIntensity(localIntensity);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-title">Activity Stages</div>

        {local.map((s, i) => (
          <div className="modal-stage-row" key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', alignItems: 'stretch' }}>
            {/* Stage Basic Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="modal-stage-num">{String(i + 1).padStart(2, '0')}</span>
              <input
                className="modal-input"
                placeholder="활동 이름"
                value={s.name}
                onChange={e => update(s.id, 'name', e.target.value)}
              />
              <input
                className="modal-input num"
                type="number" min={1} max={120}
                value={s.minutes}
                onChange={e => update(s.id, 'minutes', parseInt(e.target.value) || 0)}
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--ink-faint)', flexShrink: 0 }}>min</span>
              <button className="modal-remove-btn" onClick={() => remove(s.id)}>×</button>
            </div>

            {/* Custom Messages */}
            <div style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {s.messages && s.messages.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    className="modal-input"
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0', color: 'var(--ink-mid)', borderBottom: '1px dashed var(--rule)' }}
                    placeholder="메시지 입력 (예: 가위 사용 주의)"
                    value={m.text}
                    onChange={e => updateMsg(s.id, m.id, 'text', e.target.value)}
                  />
                  <select 
                    value={m.displayMode} 
                    onChange={e => updateMsg(s.id, m.id, 'displayMode', e.target.value)}
                    style={{
                      fontSize: '0.65rem', padding: '0.2rem', color: 'var(--ink-mid)',
                      background: 'transparent', border: '1px solid var(--rule)', borderRadius: '4px', outline: 'none', cursor: 'pointer'
                    }}
                  >
                    <option value="start">시작할 때</option>
                    <option value="periodic">주기적으로</option>
                  </select>
                  <button className="modal-remove-btn" style={{ fontSize: '1rem', padding: '0 0.2rem' }} onClick={() => removeMsg(s.id, m.id)}>×</button>
                </div>
              ))}
              <button 
                onClick={() => addMsg(s.id)}
                style={{
                  background: 'none', border: 'none', color: 'var(--navy)', cursor: 'pointer',
                  fontSize: '0.65rem', textAlign: 'left', padding: '0.2rem 0', fontWeight: 500, letterSpacing: '0.05em'
                }}
              >
                + 알림 메시지 추가
              </button>
            </div>
          </div>
        ))}

        {local.length === 0 && (
          <p style={{ color: 'var(--ink-faint)', fontSize: '0.75rem', padding: '1rem 0', letterSpacing: '0.05em' }}>
            No stages. Add one below.
          </p>
        )}

        <button className="modal-add-btn" onClick={add}>+ Add stage</button>

        {/* Nudge Intensity */}
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--rule)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.18em', color: 'var(--ink-mid)', textTransform: 'uppercase' }}>
              Nudge Intensity
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--navy)', fontVariantNumeric: 'tabular-nums' }}>
              {localIntensity.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min={0.1} max={0.3} step={0.1}
            value={localIntensity}
            onChange={e => setLocalIntensity(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--navy)', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
            <span style={{ fontSize: '0.55rem', color: 'var(--ink-faint)', letterSpacing: '0.1em' }}>약함 (0.1)</span>
            <span style={{ fontSize: '0.55rem', color: 'var(--ink-faint)', letterSpacing: '0.1em' }}>기본 (0.2)</span>
            <span style={{ fontSize: '0.55rem', color: 'var(--ink-faint)', letterSpacing: '0.1em' }}>강함 (0.3)</span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="ctrl-btn" onClick={onClose}>Cancel</button>
          <button className="ctrl-btn primary" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}
