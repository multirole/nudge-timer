import { useEffect, useState, useRef } from 'react';
import { useTimerStore } from '../../store/timerStore';
import { getDisplayedTimeWithStages } from '../../lib/nudgeMath';

export default function NudgeMessage() {
  const { totalSeconds, elapsed, isRunning, stages, currentStageIndex, isNudgeMode, nudgeIntensity } = useTimerStore();
  const [msg, setMsg] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const queueRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);
  const processVersion = useRef(0);

  const prevElapsed = useRef(elapsed);
  const prevRunning = useRef(isRunning);
  const prevStage = useRef(currentStageIndex);

  const processQueue = async (version: number) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    while (queueRef.current.length > 0) {
      if (processVersion.current !== version) return;
      const text = queueRef.current.shift()!;
      setMsg(text);
      
      // DOM 렌더링 후 페이드인
      await new Promise(res => setTimeout(res, 50));
      if (processVersion.current !== version) return;
      setVisible(true);
      
      // 표시 시간
      await new Promise(res => setTimeout(res, 3500));
      if (processVersion.current !== version) return;
      setVisible(false);
      
      // 페이드아웃 대기 (CSS transition)
      await new Promise(res => setTimeout(res, 500));
      if (processVersion.current !== version) return;
      setMsg(null);
    }

    if (processVersion.current === version) {
      isProcessingRef.current = false;
    }
  };

  const show = (m: string | string[], force = false) => {
    const msgs = Array.isArray(m) ? m : [m];
    if (msgs.length > 0) {
      if (force) {
        processVersion.current += 1;
        queueRef.current = [];
        setVisible(false);
        setMsg(null);
        isProcessingRef.current = false;
        setTimeout(() => {
          queueRef.current.push(...msgs);
          processQueue(processVersion.current);
        }, 50);
        return;
      }
      queueRef.current.push(...msgs);
      processQueue(processVersion.current);
    }
  };

  useEffect(() => {
    const now = isNudgeMode ? getDisplayedTimeWithStages(stages, totalSeconds, elapsed, nudgeIntensity) : elapsed;
    const prev = isNudgeMode ? getDisplayedTimeWithStages(stages, totalSeconds, prevElapsed.current, nudgeIntensity) : prevElapsed.current;
    const pct = totalSeconds > 0 ? (now / totalSeconds) * 100 : 0;
    const prevPct = totalSeconds > 0 ? (prev / totalSeconds) * 100 : 0;

    const currentStage = stages[currentStageIndex];

    // 시작 메시지 처리 (첫 번째 스테이지)
    if (isRunning && !prevRunning.current && elapsed < 1) {
      const startMsgs = stages.length > 0 && stages[0].messages ? stages[0].messages.filter(m => m.displayMode === 'start') : [];
      const messagesToQueue = ['시작합니다. 집중해봐요.'];
      if (startMsgs.length > 0) {
        messagesToQueue.push(...startMsgs.map(m => m.text));
      }
      show(messagesToQueue);
    }
    
    // 시작 메시지 처리 (다음 스테이지로 넘어갈 때)
    if (isRunning && currentStageIndex !== prevStage.current && currentStageIndex > 0 && currentStageIndex < stages.length) {
      const startMsgs = currentStage ? (currentStage.messages || []).filter(m => m.displayMode === 'start') : [];
      const messagesToQueue = [`${currentStage?.name} 단계로 넘어갑니다.`];
      if (startMsgs.length > 0) {
        messagesToQueue.push(...startMsgs.map(m => m.text));
      }
      show(messagesToQueue);
    }

    // 주기적 메시지 처리
    if (isRunning && currentStage && currentStageIndex === prevStage.current) {
      const periodicMsgs = (currentStage.messages || []).filter(m => m.displayMode === 'periodic');
      if (periodicMsgs.length > 0) {
        let accumulated = 0;
        for (let i = 0; i < currentStageIndex; i++) {
          if (stages[i]) accumulated += stages[i].minutes * 60;
        }
        const stageElapsed = now - accumulated;
        const prevStageElapsed = prev - accumulated;

        // 진행바(단계) 기준으로 10번 균등하게 알림 (단, 최소 5초 간격)
        const stageDuration = currentStage.minutes * 60;
        const interval = Math.max(5, Math.floor(stageDuration / 10));
        
        const currentTick = Math.floor(stageElapsed / interval);
        const prevTick = Math.floor(prevStageElapsed / interval);

        if (currentTick > prevTick && currentTick > 0) {
          const msgToShow = periodicMsgs[(currentTick - 1) % periodicMsgs.length];
          show(msgToShow.text);
        }
      }
    }

    // 기본 시간/상태 경고
    if (isRunning && elapsed >= totalSeconds && prevElapsed.current < totalSeconds)
      show('종료. 수고했어요.', true);
    if (isRunning && pct >= 50 && prevPct < 50)
      show('절반 경과.');
    if (isRunning && pct >= 80 && prevPct < 80)
      show('마무리 단계입니다.');
    if (isRunning && totalSeconds > 180 && (totalSeconds - now) <= 60 && (totalSeconds - prev) > 60)
      show('1분 남았습니다.');

    prevElapsed.current = elapsed;
    prevRunning.current = isRunning;
    prevStage.current = currentStageIndex;
  }, [elapsed, isRunning, currentStageIndex, totalSeconds, stages, isNudgeMode, nudgeIntensity]);

  return (
    <div className="nudge-msg-wrap">
      <span className={`nudge-msg ${visible ? '' : 'hidden'}`}>
        {msg}
      </span>
    </div>
  );
}
