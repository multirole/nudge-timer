import { create } from 'zustand';
import type { Stage, Theme } from '../types';
import { getDisplayedTimeWithStages, getRealTimeWithStages } from '../lib/nudgeMath';
import { playStageChime, playFinishSound } from '../lib/audio';
import confetti from 'canvas-confetti';

// External audio removed - using Web Audio API via lib/audio.ts

const showConfetti = () => {
  const duration = 3000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
    confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
};

interface TimerState {
  // Timer State
  elapsed: number;
  totalSeconds: number;
  isRunning: boolean;
  isNudgeMode: boolean;
  currentStageIndex: number;
  
  // Settings
  stages: Stage[];
  theme: Theme;
  isDarkMode: boolean;
  nudgeIntensity: number;

  // Actions
  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
  setElapsed: (sec: number) => void;
  addMinutes: (min: number) => void;
  setTotalSeconds: (sec: number) => void;
  setStages: (stages: Stage[]) => void;
  setTheme: (theme: Theme) => void;
  setNudgeMode: (isNudge: boolean) => void;
  setNudgeIntensity: (intensity: number) => void;
  toggleDarkMode: () => void;
}

export const useTimerStore = create<TimerState>((set) => ({
  elapsed: 0,
  totalSeconds: 10 * 60,
  isRunning: false,
  isNudgeMode: true,
  currentStageIndex: -1,
  
  stages: [],
  theme: 'runner',
  isDarkMode: false,
  nudgeIntensity: 0.2,

  start: () => set((state) => {
    if (state.elapsed >= state.totalSeconds) return state;
    return { 
      isRunning: true,
      currentStageIndex: state.stages.length > 0 && state.elapsed === 0 ? 0 : state.currentStageIndex
    };
  }),
  
  pause: () => set({ isRunning: false }),
  
  reset: () => set((state) => {
    const defaultTotal = state.stages.length > 0 
      ? state.stages.reduce((acc, s) => acc + s.minutes * 60, 0)
      : 10 * 60;
      
    return {
      elapsed: 0,
      isRunning: false,
      currentStageIndex: -1,
      totalSeconds: defaultTotal
    };
  }),

  tick: () => set((state) => {
    if (!state.isRunning) return state;
    const newElapsed = state.elapsed + 0.1;
    
    // Check if finished
    if (newElapsed >= state.totalSeconds) {
      playFinishSound();
      const isBreak = state.stages.length === 1 && state.stages[0].name === '쉬는 시간';
      if (!isBreak) {
        showConfetti();
      }
      return { elapsed: state.totalSeconds, isRunning: false, currentStageIndex: state.stages.length };
    }

    // Update current stage index
    let newStageIndex = state.currentStageIndex;
    if (state.stages.length > 0) {
      const displayedTimeElapsed = state.isNudgeMode 
        ? getDisplayedTimeWithStages(state.stages, state.totalSeconds, newElapsed, state.nudgeIntensity)
        : newElapsed;
        
      let accumulated = 0;
      for (let i = 0; i < state.stages.length; i++) {
        accumulated += state.stages[i].minutes * 60;
        if (displayedTimeElapsed < accumulated) {
          newStageIndex = i;
          break;
        }
      }
    }

    if (newStageIndex !== state.currentStageIndex && newStageIndex > 0 && newStageIndex < state.stages.length) {
      playStageChime();
    }

    return { elapsed: newElapsed, currentStageIndex: newStageIndex };
  }),

  setElapsed: (sec: number) => set((state) => {
    let newElapsed = Math.max(0, Math.min(sec, state.totalSeconds));
    
    // Update stage index based on new elapsed time
    let newStageIndex = state.currentStageIndex;
    if (state.stages.length > 0) {
      const displayedTimeElapsed = state.isNudgeMode 
        ? getDisplayedTimeWithStages(state.stages, state.totalSeconds, newElapsed, state.nudgeIntensity)
        : newElapsed;
        
      let accumulated = 0;
      for (let i = 0; i < state.stages.length; i++) {
        accumulated += state.stages[i].minutes * 60;
        if (displayedTimeElapsed < accumulated) {
          newStageIndex = i;
          break;
        }
      }
      if (displayedTimeElapsed >= state.totalSeconds) {
        newStageIndex = state.stages.length;
      }
    }

    return { elapsed: newElapsed, currentStageIndex: newStageIndex, isRunning: false };
  }),

  addMinutes: (min: number) => set((state) => {
    const displayedTimeElapsed = state.isNudgeMode 
      ? getDisplayedTimeWithStages(state.stages, state.totalSeconds, state.elapsed, state.nudgeIntensity)
      : state.elapsed;

    let newTotal = state.totalSeconds + (min * 60);
    const maxSec = 180 * 60;
    if (newTotal > maxSec) newTotal = maxSec;
    // ensure newTotal is at least greater than displayedTimeElapsed if we subtracted too much
    if (newTotal < displayedTimeElapsed) newTotal = displayedTimeElapsed;

    // Scaling stages if they exist
    let newStages = [...state.stages];
    if (newStages.length > 0 && state.totalSeconds > 0) {
       const scale = newTotal / state.totalSeconds;
       newStages = newStages.map(s => ({ ...s, minutes: s.minutes * scale }));
    }

    const newElapsed = state.isNudgeMode 
      ? getRealTimeWithStages(newStages, newTotal, displayedTimeElapsed, state.nudgeIntensity)
      : displayedTimeElapsed;

    return { totalSeconds: newTotal, stages: newStages, elapsed: newElapsed };
  }),

  setTotalSeconds: (sec: number) => set({ totalSeconds: sec }),

  setStages: (stages: Stage[]) => set(() => {
    const total = stages.reduce((acc, s) => acc + s.minutes * 60, 0);
    return { stages, totalSeconds: total > 0 ? total : 20 * 60, elapsed: 0, isRunning: false, currentStageIndex: -1 };
  }),

  setTheme: (theme: Theme) => set({ theme }),

  setNudgeMode: (isNudgeMode: boolean) => set((state) => {
    if (state.isNudgeMode === isNudgeMode) return {};

    let newElapsed = state.elapsed;
    if (state.isNudgeMode && !isNudgeMode) {
      newElapsed = getDisplayedTimeWithStages(state.stages, state.totalSeconds, state.elapsed, state.nudgeIntensity);
    } else if (!state.isNudgeMode && isNudgeMode) {
      newElapsed = getRealTimeWithStages(state.stages, state.totalSeconds, state.elapsed, state.nudgeIntensity);
    }

    return { isNudgeMode, elapsed: newElapsed };
  }),

  setNudgeIntensity: (nudgeIntensity: number) => set({ nudgeIntensity }),

  toggleDarkMode: () => set((state) => {
    const nextDark = !state.isDarkMode;
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { isDarkMode: nextDark };
  }),
}));
