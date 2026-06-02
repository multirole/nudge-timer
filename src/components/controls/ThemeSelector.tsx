import { useTimerStore } from '../../store/timerStore';
import type { Theme } from '../../types';

const THEMES: { id: Theme; label: string }[] = [
  { id: 'runner', label: 'Runner' },
  { id: 'rocket', label: 'Rocket' },
];

export default function ThemeSelector() {
  const { theme, setTheme } = useTimerStore();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      {THEMES.map(t => (
        <button
          key={t.id}
          className="icon-btn"
          onClick={() => setTheme(t.id)}
          style={{
            color: theme === t.id ? 'var(--navy)' : 'var(--ink-faint)',
            borderBottom: theme === t.id ? '1px solid var(--navy)' : '1px solid transparent',
            paddingBottom: '2px',
            fontSize: '0.6rem',
            letterSpacing: '0.18em',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
