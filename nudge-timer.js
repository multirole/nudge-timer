function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// 3 Phase + Tourbillon (PRD 기반, 각 Phase warp factor 고정)
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

  // 실제 시간에 따른 warp factor (고정)
  function getWarpFactor(realTime) {
    if (realTime < phaseBoundaries[1]) {
      return warpFactors[0];
    } else if (realTime < phaseBoundaries[2]) {
      return warpFactors[1];
    } else {
      return warpFactors[2];
    }
  }

  // 실제 시간 → 표시 시간
  function getDisplayedTime(realTimeElapsed) {
    if (realTimeElapsed <= 0) return 0;
    let displayed = 0;
    if (realTimeElapsed <= phaseBoundaries[1]) {
      displayed = realTimeElapsed * warpFactors[0];
    } else if (realTimeElapsed <= phaseBoundaries[2]) {
      displayed = phaseDisplayed[0] + (realTimeElapsed - phaseBoundaries[1]) * warpFactors[1];
    } else {
      displayed = phaseDisplayed[0] + phaseDisplayed[1] + (realTimeElapsed - phaseBoundaries[2]) * warpFactors[2];
    }
    return displayed;
  }

  // 표시 시간 → 실제 시간 (역방향)
  function getRealTimeFromDisplayed(displayedTime) {
    if (displayedTime <= phaseDisplayed[0]) {
      return displayedTime / warpFactors[0];
    } else if (displayedTime <= phaseDisplayed[0] + phaseDisplayed[1]) {
      return phaseBoundaries[1] + (displayedTime - phaseDisplayed[0]) / warpFactors[1];
    } else {
      return phaseBoundaries[2] + (displayedTime - phaseDisplayed[0] - phaseDisplayed[1]) / warpFactors[2];
    }
  }

  return {
    warpFactors,
    phaseDisplayed,
    phaseReal,
    correction,
    phaseBoundaries,
    totalReal,
    getWarpFactor,
    getDisplayedTime,
    getRealTimeFromDisplayed,
  };
}

let timerInterval = null;
let timerState = {
  running: false,
  remaining: 20 * 60, // default 20:00
  totalDisplayedSeconds: 20 * 60,
  originalDisplayedSeconds: 20 * 60, // 원래 설정된 시간 보존
  timer: getThreePhaseTourbillonTimer(20 * 60),
  elapsed: 0, // 경과 시간(초)
};

function updateUI() {
  // 진행바: 경과 시간 기준
  const percent = Math.min(100, (timerState.elapsed / timerState.totalDisplayedSeconds) * 100);
  document.getElementById('bigTime').textContent = formatTime(timerState.remaining);
  document.getElementById('progressBar').style.width = percent + '%';
  document.getElementById('startBtn').disabled = timerState.running || timerState.remaining <= 0;
  document.getElementById('pauseBtn').disabled = !timerState.running;
  document.getElementById('resetBtn').disabled = timerState.remaining === timerState.totalDisplayedSeconds && !timerState.running;
}

function tick() {
  if (!timerState.running) return;
  if (timerState.remaining > 0) {
    // 실제 시간 0.1초 경과 (더 부드러운 업데이트)
    timerState.elapsed += 0.1;
    
    // 넛지 타이머를 사용하여 표시 시간 계산
    const displayedTimeElapsed = timerState.timer.getDisplayedTime(timerState.elapsed);
    const newRemaining = timerState.totalDisplayedSeconds - displayedTimeElapsed;
    
    // 남은 시간이 0 이하가 되면 타이머 종료
    if (newRemaining <= 0) {
      timerState.remaining = 0;
      stopTimer();
      // Optionally: alert("Time's up!");
    } else {
      timerState.remaining = newRemaining;
    }
    
    updateUI();
  }
}

function startTimer() {
  if (timerState.running || timerState.remaining <= 0) return;
  timerState.running = true;
  timerInterval = setInterval(tick, 100); // 100ms마다 업데이트 (더 부드러운 효과)
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
  timerState.remaining = timerState.originalDisplayedSeconds;
  timerState.totalDisplayedSeconds = timerState.originalDisplayedSeconds;
  timerState.timer = getThreePhaseTourbillonTimer(timerState.originalDisplayedSeconds);
  timerState.elapsed = 0;
  stopTimer();
  updateUI();
  
  // 테스트 로그 지우기
  const logDiv = document.getElementById('phaseTestLog');
  if (logDiv) {
    logDiv.innerHTML = '';
  }
}

// 드롭다운과 입력박스 연동 및 시간 설정 기능
const minutesSelect = document.getElementById('minutes');
const minuteInput = document.getElementById('minuteInput');
const minuteLabel = document.getElementById('minuteLabel');
const timerInputContainer = document.getElementById('timerInputContainer');
const customInputWrapper = document.getElementById('customInputWrapper');

// 드롭다운 변경 시 입력박스와 타이머 동기화
minutesSelect.addEventListener('change', function() {
  const selectedValue = this.value;
  
  if (selectedValue === 'custom') {
    // 입력박스와 라벨 보이기
    customInputWrapper.style.display = 'flex';
    minuteInput.disabled = false;
    setTimeout(() => {
      minuteInput.focus();
    }, 300);
    // 입력박스의 현재 값으로 타이머 설정
    const min = parseInt(minuteInput.value, 10);
    timerState.totalDisplayedSeconds = min * 60;
    timerState.originalDisplayedSeconds = min * 60;
    timerState.remaining = min * 60;
    timerState.timer = getThreePhaseTourbillonTimer(min * 60);
    timerState.elapsed = 0;
  } else {
    // 입력박스와 라벨 숨기기
    customInputWrapper.style.display = 'none';
    minuteInput.disabled = true;
    const min = parseInt(selectedValue, 10);
    minuteInput.value = min;
    timerState.totalDisplayedSeconds = min * 60;
    timerState.originalDisplayedSeconds = min * 60;
    timerState.remaining = min * 60;
    timerState.timer = getThreePhaseTourbillonTimer(min * 60);
    timerState.elapsed = 0;
  }
  updateUI();
});

// 입력박스 변경 시 타이머 동기화 (직접 입력 모드에서만)
minuteInput.addEventListener('input', function() {
  if (minutesSelect.value === 'custom') {
    let min = parseInt(this.value, 10);
    if (isNaN(min) || min < 1) min = 1;
    if (min > 180) min = 180;
    this.value = min;
    timerState.totalDisplayedSeconds = min * 60;
    timerState.originalDisplayedSeconds = min * 60;
    timerState.remaining = min * 60;
    timerState.timer = getThreePhaseTourbillonTimer(min * 60);
    timerState.elapsed = 0;
    updateUI();
  }
});

// 드롭다운과 입력박스 초기 동기화
window.addEventListener('DOMContentLoaded', function() {
  minuteInput.value = minutesSelect.value;
  minuteInput.disabled = true;
  customInputWrapper.style.display = 'none';
});

// 시간 추가/감소 버튼 기능
function addMinutes(min) {
  // 경과 시간은 그대로 두고, 남은 시간만 조정
  timerState.remaining += min * 60;
  // 최대 제한(3시간) 적용
  const maxSec = 180 * 60;
  if (timerState.remaining > maxSec) timerState.remaining = maxSec;
  if (timerState.remaining < 0) timerState.remaining = 0;
  // 남은 시간에 맞게 넛지 타이머 재계산 (원래 설정 시간은 보존)
  timerState.totalDisplayedSeconds = timerState.remaining + timerState.elapsed;
  timerState.timer = getThreePhaseTourbillonTimer(timerState.totalDisplayedSeconds);
  updateUI();
}
document.getElementById('add1min').addEventListener('click', function() { addMinutes(1); });
document.getElementById('add5min').addEventListener('click', function() { addMinutes(5); });
document.getElementById('add10min').addEventListener('click', function() { addMinutes(10); });
document.getElementById('sub1min').addEventListener('click', function() { addMinutes(-1); });
document.getElementById('sub5min').addEventListener('click', function() { addMinutes(-5); });
document.getElementById('sub10min').addEventListener('click', function() { addMinutes(-10); });

// 테스트용 Phase 정보 출력 함수
function logPhaseInfo(action) {
  const logDiv = document.getElementById('phaseTestLog');
  const t = timerState.totalDisplayedSeconds;
  const timer = getThreePhaseTourbillonTimer(t);
  const html = `
    <div class="mb-2">
      <b>[${action}]</b> 총 표시시간: <b>${Math.round(t/60)}분</b><br/>
      Phase1: <span class="text-blue-700">${timer.phaseReal[0].toFixed(1)}s</span> (warp ${timer.warpFactors[0]}) |
      Phase2: <span class="text-blue-700">${timer.phaseReal[1].toFixed(1)}s</span> (warp ${timer.warpFactors[1]}) |
      Phase3: <span class="text-blue-700">${timer.phaseReal[2].toFixed(1)}s</span> (warp ${timer.warpFactors[2]})<br/>
      <span class="text-gray-500">보정값: ${timer.correction.toFixed(4)}</span>
    </div>
  `;
  logDiv.innerHTML += html;
}

// Start 버튼에 테스트 로그 추가
const origStartBtnHandler = startTimer;
function startTimerWithLog() {
  logPhaseInfo('Start');
  origStartBtnHandler();
}
document.getElementById('startBtn').removeEventListener('click', startTimer);
document.getElementById('startBtn').addEventListener('click', startTimerWithLog);

// +분, -분 버튼에 테스트 로그 추가
['add1min','add5min','add10min','sub1min','sub5min','sub10min'].forEach(id => {
  const btn = document.getElementById(id);
  if (!btn) return;
  const orig = btn.onclick || btn.__onclick || null;
  btn.addEventListener('click', function() {
    logPhaseInfo(btn.textContent);
    // 기졸 핸들러 실행
    if (orig) orig();
  });
});

document.getElementById('pauseBtn').addEventListener('click', pauseTimer);
document.getElementById('resetBtn').addEventListener('click', resetTimer);

window.onload = function() {
  timerState.remaining = timerState.totalDisplayedSeconds;
  updateUI();
};

// 도움말 모달 동작
const helpBtn = document.getElementById('helpBtn');
const helpModal = document.getElementById('helpModal');
const closeHelpModal = document.getElementById('closeHelpModal');

helpBtn.addEventListener('click', function() {
  helpModal.classList.remove('hidden');
});

closeHelpModal.addEventListener('click', function() {
  helpModal.classList.add('hidden');
});

// 모달 바깥 클릭 시 닫기
helpModal.addEventListener('mousedown', function(e) {
  if (e.target === helpModal) {
    helpModal.classList.add('hidden');
  }
}); 