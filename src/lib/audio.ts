/**
 * Web Audio API를 이용해 외부 URL 없이 로컬에서 효과음을 생성합니다.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

/** 짧은 알림음 (단계 전환 시) */
export function playStageChime() {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(660, ac.currentTime + 0.3);

  gain.gain.setValueAtTime(0.3, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);

  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.5);
}

/** 완료음 (타이머 종료 시) */
export function playFinishSound() {
  const ac = getCtx();
  const notes = [523, 659, 784]; // C5 E5 G5 (메이저 코드 아르페지오)

  notes.forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ac.currentTime + i * 0.15);

    gain.gain.setValueAtTime(0, ac.currentTime + i * 0.15);
    gain.gain.linearRampToValueAtTime(0.35, ac.currentTime + i * 0.15 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.15 + 1.2);

    osc.start(ac.currentTime + i * 0.15);
    osc.stop(ac.currentTime + i * 0.15 + 1.2);
  });
}
