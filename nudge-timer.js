// Nudge Timer V2 로직 (단계별 활동 지원)

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

  return { getDisplayedTime };
}

// --- 상태 관리 ---
let timerInterval = null;
let isNudgeMode = localStorage.getItem('nudgeMode') === null ? true : localStorage.getItem('nudgeMode') === 'true';
let isDarkMode = localStorage.getItem('darkMode') === 'true';

// 기본 단계 데이터
const defaultStages = [
  { name: '설명 듣기', minutes: 5 },
  { name: '만들기 활동', minutes: 10 },
  { name: '정리하기', minutes: 5 }
];

let stages = [];
try {
  const saved = localStorage.getItem('nudgeStages');
  stages = saved ? JSON.parse(saved) : defaultStages;
} catch (e) {
  stages = defaultStages;
}

let timerState = {
  running: false,
  elapsed: 0, // 실제 경과 시간(초)
  totalDisplayedSeconds: 0,
  timerCore: null,
  currentStageIndex: -1
};

// 단계 경계 계산
let stageBoundaries = []; // 표시 시간 기준 누적 경계 (초)

function initTimerState() {
  timerState.totalDisplayedSeconds = stages.reduce((acc, stage) => acc + stage.minutes * 60, 0);
  timerState.timerCore = getThreePhaseTourbillonTimer(timerState.totalDisplayedSeconds);
  timerState.elapsed = 0;
  timerState.currentStageIndex = -1;
  timerState.running = false;
  
  let accumulated = 0;
  stageBoundaries = [];
  stages.forEach(stage => {
    accumulated += stage.minutes * 60;
    stageBoundaries.push(accumulated);
  });
  
  renderTrackFlags();
  updateUI();
  updateStageText();
}

// --- UI 렌더링 ---
function renderTrackFlags() {
  const container = document.getElementById('trackFlags');
  if (!container) return;
  container.innerHTML = '';
  
  const total = timerState.totalDisplayedSeconds;
  if (total <= 0) return;

  // 마지막 단계의 깃발(100%)은 생략하거나 도착 지점으로 표현
  for (let i = 0; i < stageBoundaries.length - 1; i++) {
    const boundary = stageBoundaries[i];
    const percent = (boundary / total) * 100;
    
    const flag = document.createElement('div');
    flag.className = 'absolute top-0 flex flex-col items-center transform -translate-x-1/2 -translate-y-full pb-2';
    flag.style.left = `${percent}%`;
    flag.innerHTML = `
      <div class="text-2xl filter drop-shadow-sm">🚩</div>
      <div class="h-8 w-1 bg-gray-400 dark:bg-gray-500 rounded-full mt-1"></div>
    `;
    container.appendChild(flag);
  }
  
  // 도착 지점 (100%)
  const finishFlag = document.createElement('div');
  finishFlag.className = 'absolute top-0 flex flex-col items-center transform -translate-x-1/2 -translate-y-full pb-2';
  finishFlag.style.left = `100%`;
  finishFlag.innerHTML = `
    <div class="text-2xl filter drop-shadow-sm">🏁</div>
    <div class="h-8 w-1 bg-gray-400 dark:bg-gray-500 rounded-full mt-1"></div>
  `;
  container.appendChild(finishFlag);
}

function updateStageText() {
  const stageTextElem = document.getElementById('currentStageText');
  
  if (timerState.elapsed === 0 && !timerState.running) {
    stageTextElem.textContent = "준비 중이에요! ▶️ 시작을 눌러주세요";
    stageTextElem.classList.remove('text-red-500');
    return;
  }
  
  if (timerState.currentStageIndex >= stages.length) {
    stageTextElem.textContent = "🎉 모든 활동이 끝났어요! 🎉";
    stageTextElem.classList.remove('text-red-500');
    return;
  }
  
  if (timerState.currentStageIndex >= 0 && timerState.currentStageIndex < stages.length) {
    const currentName = stages[timerState.currentStageIndex].name;
    stageTextElem.textContent = `지금은 [${currentName}] 시간이에요!`;
    
    // 남은 시간이 1분 이하일 때 색상 변경
    const displayedTimeElapsed = isNudgeMode 
      ? timerState.timerCore.getDisplayedTime(timerState.elapsed)
      : timerState.elapsed;
      
    const currentStageEnd = stageBoundaries[timerState.currentStageIndex];
    const remainingInStage = currentStageEnd - displayedTimeElapsed;
    
    if (remainingInStage <= 60 && remainingInStage > 0) {
      stageTextElem.classList.add('text-red-500');
      stageTextElem.classList.add('animate-pulse');
    } else {
      stageTextElem.classList.remove('text-red-500');
      stageTextElem.classList.remove('animate-pulse');
    }
  }
}

function updateUI() {
  const bigTimeElement = document.getElementById('bigTime');
  const progressBarElement = document.getElementById('progressBar');
  const trackCharacter = document.getElementById('trackCharacter');
  
  const displayedTimeElapsed = isNudgeMode 
    ? timerState.timerCore.getDisplayedTime(timerState.elapsed)
    : timerState.elapsed;
    
  const remainingTotal = Math.max(0, timerState.totalDisplayedSeconds - displayedTimeElapsed);
  
  bigTimeElement.textContent = formatTime(remainingTotal);
  
  const percent = timerState.totalDisplayedSeconds > 0 
    ? Math.min(100, (displayedTimeElapsed / timerState.totalDisplayedSeconds) * 100)
    : 0;
    
  progressBarElement.style.width = `${percent}%`;
  trackCharacter.style.left = `calc(${percent}% + 16px)`;

  // Stage 계산
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
  
  // 단계가 바뀌었을 때
  if (newStageIndex !== timerState.currentStageIndex && timerState.running) {
    timerState.currentStageIndex = newStageIndex;
    updateStageText();
    
    // 소리 재생
    if (newStageIndex < stages.length && newStageIndex > 0) {
      playSound('soundStageChange');
    } else if (newStageIndex === stages.length) {
      playSound('soundFinish');
      showConfetti();
      stopTimer();
    }
  } else if (!timerState.running && timerState.elapsed === 0) {
    timerState.currentStageIndex = -1; // Ready state
  }

  // 버튼 상태
  document.getElementById('startBtn').disabled = timerState.running || remainingTotal <= 0;
  document.getElementById('pauseBtn').disabled = !timerState.running;
  document.getElementById('resetBtn').disabled = timerState.elapsed === 0;
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
  if (timerState.totalDisplayedSeconds === 0) return; // 단계가 없을 때
  
  if (timerState.elapsed === 0) {
    timerState.currentStageIndex = 0; // 시작
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
  timerState.currentStageIndex = -1;
  updateUI();
  updateStageText();
}

// --- 컨트롤 버튼 연동 ---
document.getElementById('startBtn').addEventListener('click', startTimer);
document.getElementById('pauseBtn').addEventListener('click', pauseTimer);
document.getElementById('resetBtn').addEventListener('click', resetTimer);

// --- 모달 및 설정 로직 ---
const settingsModal = document.getElementById('settingsModal');
const settingsBtn = document.getElementById('settingsBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const addStageBtn = document.getElementById('addStageBtn');
const stagesContainer = document.getElementById('stagesContainer');

function renderSettingsStages() {
  stagesContainer.innerHTML = '';
  stages.forEach((stage, index) => {
    addStageRow(stage.name, stage.minutes, index);
  });
}

function addStageRow(name = '', minutes = 5, index = -1) {
  const div = document.createElement('div');
  div.className = 'flex gap-2 items-center stage-row';
  div.innerHTML = `
    <input type="text" class="stage-name flex-1 border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700 dark:text-white" placeholder="예: 색칠하기" value="${name}">
    <input type="number" class="stage-minutes w-20 border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-center dark:bg-gray-700 dark:text-white" min="1" max="60" value="${minutes}">
    <span class="text-gray-500 dark:text-gray-400">분</span>
    <button class="remove-stage-btn text-red-500 hover:text-red-700 p-2 font-bold text-xl ml-2">&times;</button>
  `;
  
  div.querySelector('.remove-stage-btn').addEventListener('click', () => {
    div.remove();
  });
  
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

addStageBtn.addEventListener('click', () => {
  addStageRow('새 활동', 5);
});

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
  
  if (newStages.length === 0) {
    alert("최소 1개 이상의 활동 단계가 필요합니다.");
    return;
  }
  
  stages = newStages;
  localStorage.setItem('nudgeStages', JSON.stringify(stages));
  
  initTimerState();
  settingsModal.classList.add('hidden');
});

// --- 다크 모드 & 넛지 토글 ---
function applyDarkMode() {
  const darkModeBtn = document.getElementById('darkModeToggleBtn');
  if (isDarkMode) {
    document.documentElement.classList.add('dark');
    if (darkModeBtn) darkModeBtn.textContent = '☀️';
  } else {
    document.documentElement.classList.remove('dark');
    if (darkModeBtn) darkModeBtn.textContent = '🌙';
  }
}

document.getElementById('darkModeToggleBtn').addEventListener('click', () => {
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
    updateUI();
  });
}

// --- 초기화 ---
window.onload = () => {
  applyDarkMode();
  initTimerState();
};