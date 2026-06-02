// Nudge Timer Hybrid Logic

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// 3 Phase 시간 왜곡 계산 (전체 시간 기준)
function getThreePhaseTourbillonTimer(totalDisplayedSeconds) {
  const warpFactors = [1.2, 1.0, 0.8];
  const phasePercentages = [0.6, 0.1, 0.3];
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

  function getDisplayedTime(realTimeElapsed) {
    if (realTimeElapsed <= 0) return 0;
    if (realTimeElapsed >= phaseBoundaries[3]) return totalDisplayedSeconds;
    
    let displayed = 0;
    if (realTimeElapsed <= phaseBoundaries[1]) {
      displayed = realTimeElapsed * warpFactors[0] * correction;
    } else if (realTimeElapsed <= phaseBoundaries[2]) {
      displayed = phaseDisplayed[0] + (realTimeElapsed - phaseBoundaries[1]) * warpFactors[1] * correction;
    } else {
      displayed = phaseDisplayed[0] + phaseDisplayed[1] + (realTimeElapsed - phaseBoundaries[2]) * warpFactors[2] * correction;
    }
    return Math.min(displayed, totalDisplayedSeconds);
  }

  return { warpFactors, phaseReal, correction, getDisplayedTime };
}

// --- 상태 관리 ---
let timerInterval = null;
let isNudgeMode = localStorage.getItem('nudgeMode') === null ? true : localStorage.getItem('nudgeMode') === 'true';
let isDarkMode = localStorage.getItem('darkMode') === 'true';

let stages = [];
try {
  const saved = localStorage.getItem('nudgeStages');
  if (saved) {
    stages = JSON.parse(saved);
  }
} catch (e) {
  stages = [];
}

let timerState = {
  running: false,
  elapsed: 0, // 실제 경과 시간(초)
  totalDisplayedSeconds: 20 * 60, // 기본 20분
  originalDisplayedSeconds: 20 * 60,
  timerCore: null,
  currentStageIndex: -1
};

let stageBoundaries = []; // 단계 표시 시간 기준 누적 경계 (초)

function recalcBoundaries() {
  stageBoundaries = [];
  let accumulated = 0;
  stages.forEach(stage => {
    accumulated += stage.minutes * 60;
    stageBoundaries.push(accumulated);
  });
}

function initTimerState(fromInput = false) {
  if (stages.length > 0) {
    timerState.totalDisplayedSeconds = stages.reduce((acc, stage) => acc + stage.minutes * 60, 0);
    recalcBoundaries();
  } else {
    // V1 단일 타이머 방식
    if (!fromInput) {
      const min = parseInt(document.getElementById('minuteInput').value, 10) || 20;
      timerState.totalDisplayedSeconds = min * 60;
    }
    stageBoundaries = [];
  }
  
  timerState.originalDisplayedSeconds = timerState.totalDisplayedSeconds;
  timerState.timerCore = getThreePhaseTourbillonTimer(timerState.totalDisplayedSeconds);
  timerState.elapsed = 0;
  timerState.currentStageIndex = -1;
  timerState.running = false;
  
  renderTrackFlags();
  updateUI();
  updateStageText();
}

// --- UI 렌더링 ---
function renderTrackFlags() {
  const container = document.getElementById('trackFlags');
  if (!container) return;
  container.innerHTML = '';
  
  if (stages.length <= 1) return; // 단계가 없거나 1개면 마커 불필요

  const total = timerState.totalDisplayedSeconds;
  if (total <= 0) return;

  for (let i = 0; i < stageBoundaries.length - 1; i++) {
    const boundary = stageBoundaries[i];
    const percent = (boundary / total) * 100;
    
    const marker = document.createElement('div');
    marker.className = 'absolute top-0 h-full w-0.5 bg-white opacity-60';
    marker.style.left = `${percent}%`;
    container.appendChild(marker);
  }
}

function updateStageText() {
  const stageTextElem = document.getElementById('currentStageText');
  
  if (stages.length === 0) {
    stageTextElem.textContent = "";
    return;
  }

  if (timerState.elapsed === 0 && !timerState.running) {
    stageTextElem.textContent = "[준비 중이에요!]";
    return;
  }
  
  if (timerState.currentStageIndex >= stages.length) {
    stageTextElem.textContent = "[모든 활동 완료!]";
    return;
  }
  
  if (timerState.currentStageIndex >= 0 && timerState.currentStageIndex < stages.length) {
    const currentName = stages[timerState.currentStageIndex].name;
    stageTextElem.textContent = `[현재: ${currentName}]`;
  }
}

function updateUI() {
  const bigTimeElement = document.getElementById('bigTime');
  const progressBarElement = document.getElementById('progressBar');
  const progressTooltip = document.getElementById('progressTooltip');
  
  const displayedTimeElapsed = isNudgeMode 
    ? timerState.timerCore.getDisplayedTime(timerState.elapsed)
    : timerState.elapsed;
    
  const remainingTotal = Math.max(0, timerState.totalDisplayedSeconds - displayedTimeElapsed);
  
  bigTimeElement.textContent = formatTime(remainingTotal);
  
  const percent = timerState.totalDisplayedSeconds > 0 
    ? Math.min(100, (displayedTimeElapsed / timerState.totalDisplayedSeconds) * 100)
    : 0;
    
  progressBarElement.style.width = `${percent}%`;

  // 시간 경고 시스템 (V1 기능 복구)
  const remainingMinutes = remainingTotal / 60;
  if (remainingMinutes <= 1 || percent >= 95) {
    bigTimeElement.style.color = '#dc2626'; // 빨간색
    progressBarElement.style.backgroundColor = '#dc2626';
  } else {
    bigTimeElement.style.color = isDarkMode ? '#ffffff' : '#1f2937';
    progressBarElement.style.backgroundColor = '#3b82f6'; // blue-500
  }

  // Stage 계산
  if (stages.length > 0) {
    let newStageIndex = 0;
    for (let i = 0; i < stageBoundaries.length; i++) {
      if (displayedTimeElapsed < stageBoundaries[i]) {
        newStageIndex = i;
        break;
      }
    }
    if (displayedTimeElapsed >= timerState.totalDisplayedSeconds) {
      newStageIndex = stages.length; // Finished
    }
    
    // 단계 전환 이벤트
    if (newStageIndex !== timerState.currentStageIndex && timerState.running) {
      timerState.currentStageIndex = newStageIndex;
      updateStageText();
      
      if (newStageIndex < stages.length && newStageIndex > 0) {
        playSound('soundStageChange');
      } else if (newStageIndex === stages.length) {
        playSound('soundFinish');
        showConfetti();
        stopTimer();
      }
    } else if (!timerState.running && timerState.elapsed === 0) {
      timerState.currentStageIndex = -1;
    }
  } else {
    // 단일 타이머 종료 시
    if (remainingTotal <= 0 && timerState.running) {
      playSound('soundFinish');
      showConfetti();
      stopTimer();
    }
  }

  // 버튼 상태
  document.getElementById('startBtn').disabled = timerState.running || remainingTotal <= 0;
  document.getElementById('pauseBtn').disabled = !timerState.running;
  document.getElementById('resetBtn').disabled = timerState.elapsed === 0 && !timerState.running;
}

function playSound(id) {
  const audio = document.getElementById(id);
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(e => console.log('Audio play failed:', e));
  }
}

function showConfetti() {
  if (typeof confetti !== 'undefined') {
    var duration = 3000;
    var end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }
}

function tick() {
  if (!timerState.running) return;
  timerState.elapsed += 0.1;
  updateUI();
}

function startTimer() {
  if (timerState.running || timerState.elapsed >= timerState.totalDisplayedSeconds) return;
  if (timerState.totalDisplayedSeconds <= 0) return;
  
  if (timerState.elapsed === 0 && stages.length > 0) {
    timerState.currentStageIndex = 0;
    updateStageText();
  }
  
  timerState.running = true;
  timerInterval = setInterval(tick, 100);
  updateUI();
}

function pauseTimer() {
  timerState.running = false;
  if (timerInterval) clearInterval(timerInterval);
  updateUI();
}

function stopTimer() {
  timerState.running = false;
  if (timerInterval) clearInterval(timerInterval);
  updateUI();
}

function resetTimer() {
  stopTimer();
  timerState.elapsed = 0;
  if (stages.length > 0) {
    timerState.currentStageIndex = -1;
  }
  
  // 원래 설정된 시간으로 롤백 (시간 가감으로 변경된 것 초기화)
  timerState.totalDisplayedSeconds = timerState.originalDisplayedSeconds;
  timerState.timerCore = getThreePhaseTourbillonTimer(timerState.totalDisplayedSeconds);
  if (stages.length > 0) recalcBoundaries();
  
  updateUI();
  updateStageText();
  
  const logContent = document.getElementById('testLogContent');
  if (logContent) logContent.innerHTML = '';
}

// --- V1 드롭다운 / 직접입력 연동 ---
const minutesSelect = document.getElementById('minutes');
const minuteInput = document.getElementById('minuteInput');
const customInputWrapper = document.getElementById('customInputWrapper');

minutesSelect.addEventListener('change', function() {
  if (stages.length > 0) return; // 단계가 있으면 드롭다운 무시

  const selectedValue = this.value;
  if (selectedValue === 'custom') {
    customInputWrapper.style.display = 'flex';
    minuteInput.disabled = false;
    setTimeout(() => minuteInput.focus(), 300);
    const min = parseInt(minuteInput.value, 10) || 1;
    timerState.totalDisplayedSeconds = min * 60;
  } else {
    customInputWrapper.style.display = 'none';
    minuteInput.disabled = true;
    const min = parseInt(selectedValue, 10);
    minuteInput.value = min;
    timerState.totalDisplayedSeconds = min * 60;
  }
  initTimerState(true);
});

minuteInput.addEventListener('input', function() {
  if (stages.length > 0 || minutesSelect.value !== 'custom') return;
  let min = parseInt(this.value, 10);
  if (isNaN(min) || min < 1) min = 1;
  if (min > 180) min = 180;
  this.value = min;
  timerState.totalDisplayedSeconds = min * 60;
  initTimerState(true);
});

// --- 시간 가감 버튼 (+1, -5 등) ---
function addMinutes(min) {
  // 표시 시간 기준으로 변경
  const displayedTimeElapsed = isNudgeMode 
    ? timerState.timerCore.getDisplayedTime(timerState.elapsed)
    : timerState.elapsed;
    
  let currentRemaining = timerState.totalDisplayedSeconds - displayedTimeElapsed;
  currentRemaining += min * 60;
  
  const maxSec = 180 * 60;
  if (currentRemaining > maxSec) currentRemaining = maxSec;
  if (currentRemaining < 0) currentRemaining = 0;
  
  timerState.totalDisplayedSeconds = currentRemaining + displayedTimeElapsed;
  timerState.timerCore = getThreePhaseTourbillonTimer(timerState.totalDisplayedSeconds);
  
  if (stages.length > 0) {
    // 단계를 쓰고 있을 때는 마지막 단계 시간을 늘리거나 줄이는 것으로 간주
    // 복잡도를 피하기 위해 단순히 전체 totalDisplayedSeconds만 업데이트하고, 
    // boundary는 비율에 맞춰 늘리거나, 그냥 무시. 여기서는 비율 맞춰 스케일링
    const scale = timerState.totalDisplayedSeconds / timerState.originalDisplayedSeconds;
    stageBoundaries = [];
    let accumulated = 0;
    stages.forEach(stage => {
      accumulated += (stage.minutes * 60) * scale;
      stageBoundaries.push(accumulated);
    });
    renderTrackFlags();
  }
  
  updateUI();
}

document.getElementById('add1min').addEventListener('click', () => addMinutes(1));
document.getElementById('add5min').addEventListener('click', () => addMinutes(5));
document.getElementById('add10min').addEventListener('click', () => addMinutes(10));
document.getElementById('sub1min').addEventListener('click', () => addMinutes(-1));
document.getElementById('sub5min').addEventListener('click', () => addMinutes(-5));
document.getElementById('sub10min').addEventListener('click', () => addMinutes(-10));

// --- 메인 버튼 연동 ---
function logPhaseInfo(action) {
  const logContent = document.getElementById('testLogContent');
  if (!logContent) return;
  const t = timerState.totalDisplayedSeconds;
  
  if (isNudgeMode) {
    const timer = getThreePhaseTourbillonTimer(t);
    const html = `
      <div class="mb-2">
        <b>[${action}]</b> 총 표시시간: <b>${Math.round(t/60)}분</b> <span class="text-purple-600 dark:text-purple-400">(넛지 모드)</span><br/>
        Phase1: <span class="text-blue-700">${(timer.phaseReal[0]||0).toFixed(1)}s</span> (warp ${timer.warpFactors[0]}) |
        Phase2: <span class="text-blue-700">${(timer.phaseReal[1]||0).toFixed(1)}s</span> (warp ${timer.warpFactors[1]}) |
        Phase3: <span class="text-blue-700">${(timer.phaseReal[2]||0).toFixed(1)}s</span> (warp ${timer.warpFactors[2]})<br/>
        <span class="text-gray-500">보정값: ${timer.correction.toFixed(4)}</span>
      </div>
    `;
    logContent.innerHTML += html;
  } else {
    const html = `
      <div class="mb-2">
        <b>[${action}]</b> 총 표시시간: <b>${Math.round(t/60)}분</b> <span class="text-gray-600 dark:text-gray-400">(일반 모드)</span><br/>
        <span class="text-gray-500">실제 시간과 동일하게 진행됩니다.</span>
      </div>
    `;
    logContent.innerHTML += html;
  }
}

function startTimerWithLog() {
  logPhaseInfo('Start');
  startTimer();
}

document.getElementById('startBtn').addEventListener('click', startTimerWithLog);
document.getElementById('pauseBtn').addEventListener('click', pauseTimer);
document.getElementById('resetBtn').addEventListener('click', resetTimer);

['add1min','add5min','add10min','sub1min','sub5min','sub10min'].forEach(id => {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.addEventListener('click', function() {
    logPhaseInfo(btn.textContent);
  });
});

// --- 아코디언 및 진행바 툴팁 ---
window.toggleTestLog = function() {
  const content = document.getElementById('testLogContent');
  const toggle = document.getElementById('testLogToggle');
  
  if (content.style.display === 'none') {
    content.style.display = 'block';
    toggle.textContent = '▼';
    toggle.style.transform = 'rotate(0deg)';
  } else {
    content.style.display = 'none';
    toggle.textContent = '▶';
    toggle.style.transform = 'rotate(-90deg)';
  }
};

let progressTooltipInterval = null;
const progressBarWrapper = document.getElementById('progressBar')?.parentElement;
const progressTooltip = document.getElementById('progressTooltip');

function updateTooltip() {
  const totalSec = timerState.totalDisplayedSeconds;
  const elapsedSec = isNudgeMode 
    ? timerState.timerCore.getDisplayedTime(timerState.elapsed)
    : timerState.elapsed;
  progressTooltip.textContent = `총 시간: ${formatTime(totalSec)} / 경과: ${formatTime(elapsedSec)}`;
}

if (progressBarWrapper && progressTooltip) {
  progressBarWrapper.addEventListener('mouseenter', () => {
    updateTooltip();
    progressTooltip.classList.remove('hidden');
    progressTooltipInterval = setInterval(updateTooltip, 100);
  });
  progressBarWrapper.addEventListener('mouseleave', () => {
    progressTooltip.classList.add('hidden');
    if (progressTooltipInterval) clearInterval(progressTooltipInterval);
  });
}

// --- 모달 및 설정 로직 ---
const settingsModal = document.getElementById('settingsModal');
const settingsBtn = document.getElementById('settingsBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const addStageBtn = document.getElementById('addStageBtn');
const stagesContainer = document.getElementById('stagesContainer');

const helpBtn = document.getElementById('helpBtn');
const helpModal = document.getElementById('helpModal');
const closeHelpModal = document.getElementById('closeHelpModal');

function renderSettingsStages() {
  stagesContainer.innerHTML = '';
  stages.forEach((stage, index) => {
    addStageRow(stage.name, stage.minutes);
  });
}

function addStageRow(name = '', minutes = 5) {
  const div = document.createElement('div');
  div.className = 'flex gap-2 items-center stage-row';
  div.innerHTML = `
    <input type="text" class="stage-name flex-1 border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700 dark:text-white" placeholder="예: 색칠하기" value="${name}">
    <input type="number" class="stage-minutes w-20 border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-center dark:bg-gray-700 dark:text-white" min="1" max="60" value="${minutes}">
    <span class="text-gray-500 dark:text-gray-400">분</span>
    <button class="remove-stage-btn text-red-500 hover:text-red-700 p-2 font-bold text-xl ml-2">&times;</button>
  `;
  div.querySelector('.remove-stage-btn').addEventListener('click', () => div.remove());
  stagesContainer.appendChild(div);
}

settingsBtn.addEventListener('click', () => {
  pauseTimer();
  renderSettingsStages();
  settingsModal.classList.remove('hidden');
});

closeSettingsBtn.addEventListener('click', () => {
  settingsModal.classList.add('hidden');
});

addStageBtn.addEventListener('click', () => addStageRow('새 활동', 5));

saveSettingsBtn.addEventListener('click', () => {
  const rows = document.querySelectorAll('.stage-row');
  const newStages = [];
  rows.forEach(row => {
    const name = row.querySelector('.stage-name').value.trim();
    const minutes = parseInt(row.querySelector('.stage-minutes').value, 10);
    if (name && !isNaN(minutes) && minutes > 0) {
      newStages.push({ name, minutes });
    }
  });
  
  stages = newStages;
  if (stages.length > 0) {
    localStorage.setItem('nudgeStages', JSON.stringify(stages));
  } else {
    localStorage.removeItem('nudgeStages');
  }
  
  initTimerState();
  settingsModal.classList.add('hidden');
});

helpBtn.addEventListener('click', () => helpModal.classList.remove('hidden'));
closeHelpModal.addEventListener('click', () => helpModal.classList.add('hidden'));
[helpModal, settingsModal].forEach(modal => {
  modal.addEventListener('mousedown', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });
});

// --- 다크 모드 & 넛지 토글 ---
function applyDarkMode() {
  const darkModeBtn = document.getElementById('darkModeBtn');
  if (isDarkMode) {
    document.documentElement.classList.add('dark');
    if (darkModeBtn) { darkModeBtn.textContent = '☀️'; darkModeBtn.title = '일반모드'; }
  } else {
    document.documentElement.classList.remove('dark');
    if (darkModeBtn) { darkModeBtn.textContent = '🌙'; darkModeBtn.title = '야간모드'; }
  }
}

document.getElementById('darkModeBtn').addEventListener('click', () => {
  isDarkMode = !isDarkMode;
  localStorage.setItem('darkMode', isDarkMode);
  applyDarkMode();
});

const nudgeSwitch = document.getElementById('nudgeSwitch');
if (nudgeSwitch) {
  nudgeSwitch.checked = isNudgeMode;
  nudgeSwitch.addEventListener('change', () => {
    isNudgeMode = nudgeSwitch.checked;
    localStorage.setItem('nudgeMode', isNudgeMode);
    document.getElementById('mainTitle').textContent = isNudgeMode ? 'Nudge Timer' : 'Timer';
    updateUI();
  });
  document.getElementById('mainTitle').textContent = isNudgeMode ? 'Nudge Timer' : 'Timer';
}

// --- 초기화 ---
window.addEventListener('DOMContentLoaded', () => {
  minuteInput.value = minutesSelect.value;
  minuteInput.disabled = true;
  customInputWrapper.style.display = 'none';
  
  applyDarkMode();
  initTimerState();
});