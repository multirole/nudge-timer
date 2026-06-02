import type { Stage } from '../types';

export function formatTime(sec: number): string {
  const ceilSec = Math.ceil(sec);
  const m = Math.floor(ceilSec / 60);
  const s = Math.floor(ceilSec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export interface NudgeTimerCore {
  warpFactors: number[];
  phaseReal: number[];
  correction: number;
  getDisplayedTime: (realTimeElapsed: number) => number;
  getRealTime: (displayedTime: number) => number;
}

export function getThreePhaseTourbillonTimer(totalDisplayedSeconds: number, nudgeIntensity = 0.2): NudgeTimerCore {
  const warpFactors = [1 + nudgeIntensity, 1.0, 1 - nudgeIntensity];
  const phasePercentages = [0.6, 0.1, 0.3];
  
  if (totalDisplayedSeconds <= 0) {
    return {
      warpFactors,
      phaseReal: [0, 0, 0],
      correction: 1,
      getDisplayedTime: () => 0,
      getRealTime: () => 0
    };
  }

  const phaseDisplayed = phasePercentages.map(p => totalDisplayedSeconds * p);
  let phaseReal = phaseDisplayed.map((d, i) => d / warpFactors[i]);
  const totalReal = phaseReal.reduce((a, b) => a + b, 0);
  
  const correction = totalDisplayedSeconds / totalReal;
  phaseReal = phaseReal.map(r => r * correction);
  
  const phaseBoundaries = [
    0,
    phaseReal[0],
    phaseReal[0] + phaseReal[1],
    phaseReal.reduce((a, b) => a + b, 0),
  ];

  const effectiveSpeeds = warpFactors.map(w => w / correction);

  function getDisplayedTime(realTimeElapsed: number): number {
    if (realTimeElapsed <= 0) return 0;
    if (realTimeElapsed >= phaseBoundaries[3]) return totalDisplayedSeconds;
    
    let displayed = 0;
    if (realTimeElapsed <= phaseBoundaries[1]) {
      displayed = realTimeElapsed * effectiveSpeeds[0];
    } else if (realTimeElapsed <= phaseBoundaries[2]) {
      displayed = phaseDisplayed[0] + (realTimeElapsed - phaseBoundaries[1]) * effectiveSpeeds[1];
    } else {
      displayed = phaseDisplayed[0] + phaseDisplayed[1] + (realTimeElapsed - phaseBoundaries[2]) * effectiveSpeeds[2];
    }
    return Math.min(displayed, totalDisplayedSeconds);
  }

  function getRealTime(displayedTime: number): number {
    if (displayedTime <= 0) return 0;
    if (displayedTime >= totalDisplayedSeconds) return phaseBoundaries[3];
    
    if (displayedTime <= phaseDisplayed[0]) {
      return displayedTime / effectiveSpeeds[0];
    } else if (displayedTime <= phaseDisplayed[0] + phaseDisplayed[1]) {
      return phaseBoundaries[1] + (displayedTime - phaseDisplayed[0]) / effectiveSpeeds[1];
    } else {
      return phaseBoundaries[2] + (displayedTime - phaseDisplayed[0] - phaseDisplayed[1]) / effectiveSpeeds[2];
    }
  }

  return { warpFactors, phaseReal, correction, getDisplayedTime, getRealTime };
}

export function getDisplayedTimeWithStages(stages: Stage[], totalSeconds: number, realTimeElapsed: number, nudgeIntensity = 0.2): number {
  if (stages.length === 0) {
    const core = getThreePhaseTourbillonTimer(totalSeconds, nudgeIntensity);
    return core.getDisplayedTime(realTimeElapsed);
  }
  
  let accumulatedReal = 0;
  let accumulatedDisplayed = 0;
  
  for (const stage of stages) {
    const stageDurationSeconds = stage.minutes * 60;
    const stageEndReal = accumulatedReal + stageDurationSeconds;
    
    if (realTimeElapsed >= stageEndReal) {
      accumulatedReal += stageDurationSeconds;
      accumulatedDisplayed += stageDurationSeconds;
    } else if (realTimeElapsed >= accumulatedReal) {
      const timeInStageReal = realTimeElapsed - accumulatedReal;
      const core = getThreePhaseTourbillonTimer(stageDurationSeconds, nudgeIntensity);
      const timeInStageDisplayed = core.getDisplayedTime(timeInStageReal);
      return accumulatedDisplayed + timeInStageDisplayed;
    }
  }
  
  if (realTimeElapsed >= accumulatedReal) {
    return accumulatedDisplayed + (realTimeElapsed - accumulatedReal);
  }
  return accumulatedDisplayed;
}

export function getRealTimeWithStages(stages: Stage[], totalSeconds: number, displayedTime: number, nudgeIntensity = 0.2): number {
  if (stages.length === 0) {
    const core = getThreePhaseTourbillonTimer(totalSeconds, nudgeIntensity);
    return core.getRealTime(displayedTime);
  }
  
  let accumulatedReal = 0;
  let accumulatedDisplayed = 0;
  
  for (const stage of stages) {
    const stageDurationSeconds = stage.minutes * 60;
    const stageEndDisplayed = accumulatedDisplayed + stageDurationSeconds;
    
    if (displayedTime >= stageEndDisplayed) {
      accumulatedReal += stageDurationSeconds;
      accumulatedDisplayed += stageDurationSeconds;
    } else if (displayedTime >= accumulatedDisplayed) {
      const timeInStageDisplayed = displayedTime - accumulatedDisplayed;
      const core = getThreePhaseTourbillonTimer(stageDurationSeconds, nudgeIntensity);
      const timeInStageReal = core.getRealTime(timeInStageDisplayed);
      return accumulatedReal + timeInStageReal;
    }
  }
  
  if (displayedTime >= accumulatedDisplayed) {
    return accumulatedReal + (displayedTime - accumulatedDisplayed);
  }
  return accumulatedReal;
}
