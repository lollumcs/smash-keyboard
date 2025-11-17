const comboDisplay = document.getElementById('combo');
const timerDisplay = document.getElementById('timer');
const messageDisplay = document.getElementById('message');
const bestComboDisplay = document.getElementById('bestCombo');
const startBtn = document.getElementById('startBtn');
const endImage = document.getElementById('endImage');

const totalTime = 3; // total game time in seconds
let combo = 0;
let timeLeft = totalTime;
let timerId = null;
let gameActive = false;

const lastFiveKeys = [];

// Load best combo from localStorage or 0 if none
let bestCombo = parseInt(localStorage.getItem('bestCombo')) || 0;
bestComboDisplay.textContent = `Best Combo: ${bestCombo}`;

// Set initial timer display on page load
timerDisplay.textContent = `Time Left: ${totalTime.toFixed(2)}s`;

function updateTimer() {
  timeLeft -= 0.05;
  if (timeLeft <= 0) {
    timeLeft = 0;
    timerDisplay.textContent = `Time Left: 0.00s`;
    endGame();
  } else {
    timerDisplay.textContent = `Time Left: ${timeLeft.toFixed(2)}s`;
  }
}

function startGame() {
  combo = 0;
  timeLeft = totalTime;
  lastFiveKeys.length = 0;
  comboDisplay.textContent = `Combo: 0`;
  messageDisplay.textContent = 'Smash those keys!';
  timerDisplay.textContent = `Time Left: ${timeLeft.toFixed(2)}s`;
  gameActive = true;
  startBtn.style.display = 'none';

  endImage.style.display = 'none'; // hide image on new game start

  if (timerId) clearInterval(timerId);
  timerId = setInterval(updateTimer, 50);
}

function endGame() {
  gameActive = false;
  clearInterval(timerId);

  if (combo > bestCombo) {
    bestCombo = combo;
    localStorage.setItem('bestCombo', bestCombo);
    bestComboDisplay.textContent = `Best Combo: ${bestCombo}`;
    messageDisplay.textContent = `🔥 NEW RECORD! Your final combo: ${combo} 🔥`;
  } else {
    messageDisplay.textContent = `Time’s up! Your final combo: ${combo} 🔥`;
  }

  // Show the "go away" image when the round ends
  endImage.style.display = 'block';

  startBtn.style.display = 'inline-block';
}

function onKeyPress(event) {
  if (!gameActive) return;

  let pressed = event.key.toUpperCase();

  // Only consider A-Z, 0-9 keys for combo tracking
  if (!pressed.match(/^[A-Z0-9]$/)) {
    messageDisplay.textContent = `Ignore "${event.key}". Smash A-Z or 0-9 keys only!`;
    return;
  }

  if (lastFiveKeys.includes(pressed)) {
    messageDisplay.textContent = `Whoa! "${pressed}" was just smashed — combo stays at ${combo}.`;
    messageDisplay.classList.add('shake');
    setTimeout(() => messageDisplay.classList.remove('shake'), 300);
  } else {
    combo++;
    comboDisplay.textContent = `Combo: ${combo}`;
    messageDisplay.textContent = `Nice! Combo hit ${combo}! Keep smashing!`;
    comboDisplay.classList.add('shake');
    setTimeout(() => comboDisplay.classList.remove('shake'), 300);

    lastFiveKeys.push(pressed);
    if (lastFiveKeys.length > 5) {
      lastFiveKeys.shift();
    }
  }
}

startBtn.addEventListener('click', startGame);
window.addEventListener('keydown', onKeyPress);
