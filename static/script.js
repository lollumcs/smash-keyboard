const comboDisplay = document.getElementById('combo');
const timerDisplay = document.getElementById('timer');
const messageDisplay = document.getElementById('message');
const bestComboDisplay = document.getElementById('bestCombo');
const startBtn = document.getElementById('startBtn');
const endImage = document.getElementById('endImage');
const clearHighScoreBtn = document.getElementById('clearHighScoreBtn');

const totalTime = 5; // total game time in seconds
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
    messageDisplay.textContent = `NEW RECORD! Your final combo: ${combo}`;
  } else {
    messageDisplay.textContent = `Time’s up! Your final combo: ${combo}`;
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

clearHighScoreBtn.addEventListener('click', () => {
  localStorage.removeItem('bestCombo');
  bestCombo = 0;
  bestComboDisplay.textContent = `Best Combo: ${bestCombo}`;
  messageDisplay.textContent = 'High score cleared! Smash to set a new record!';
});

/* ============================
   MOBILE / TOUCH SMASH SUPPORT
   ============================ */

// Treat a mobile tap as a "virtual keypress" with a random A–Z character.
function onTouchSmash() {
  if (!gameActive) return;

  // Pick a random A–Z or 0–9
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const randomChar = chars[Math.floor(Math.random() * chars.length)];

  // Reuse your existing keypress handler
  onKeyPress({ key: randomChar });

  // Optional: tiny vibration feedback (safe fallback)
  if (navigator.vibrate) navigator.vibrate(25);
}

// // Taps anywhere on the screen smash
// window.addEventListener('pointerdown', (e) => {
//   // Prevent smashes on UI buttons
//   if (e.target === startBtn || e.target === clearHighScoreBtn) return;
//   if (e.target.tagName === "BUTTON") return;

//   onTouchSmash();
// });

startBtn.addEventListener('click', startGame);
window.addEventListener('keydown', onKeyPress);

const tapZonesContainer = document.getElementById('tapZonesContainer');
const numZones = 5;
const zoneSize = 80; // match CSS width/height
const padding = 10; // minimum space between zones

const tapZones = [];
const tapZonesPositions = [];

// Get container size for calculations
function getContainerSize() {
  const rect = tapZonesContainer.getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}

// Check if two zones overlap (square bounding boxes)
function isOverlapping(x1, y1, x2, y2) {
  return !(x1 + zoneSize + padding < x2 ||
           x2 + zoneSize + padding < x1 ||
           y1 + zoneSize + padding < y2 ||
           y2 + zoneSize + padding < y1);
}

// Generate random position that doesn't overlap existing zones
function randomPositionAvoidOverlap(index) {
  const { width, height } = getContainerSize();
  const maxX = width - zoneSize;
  const maxY = height - zoneSize;

  let x, y;
  let attempts = 0;
  const maxAttempts = 200;

  do {
    x = Math.random() * maxX;
    y = Math.random() * maxY;

    let overlap = false;
    for (let i = 0; i < tapZonesPositions.length; i++) {
      if (i === index) continue; // skip self when repositioning
      const pos = tapZonesPositions[i];
      if (pos && isOverlapping(x, y, pos.x, pos.y)) {
        overlap = true;
        break;
      }
    }

    if (!overlap) return { x, y };

    attempts++;
  } while (attempts < maxAttempts);

  // If can't find a good position, just return last tried position
  return { x, y };
}

// Move zone to a non-overlapping position and save it
function moveZone(zone, index) {
  const { x, y } = randomPositionAvoidOverlap(index);
  zone.style.transform = `translate(${x}px, ${y}px)`;
  tapZonesPositions[index] = { x, y };
}

// Create tap zones, set initial positions, add event listeners
for (let i = 0; i < numZones; i++) {
  const zone = document.createElement('div');
  zone.classList.add('tap-zone');
  zone.textContent = `Tap ${i + 1}`;
  zone.style.position = 'absolute';
  zone.style.width = `${zoneSize}px`;
  zone.style.height = `${zoneSize}px`;

  tapZones.push(zone);
  tapZonesContainer.appendChild(zone);
  tapZonesPositions.push(null); // reserve spot

  moveZone(zone, i);

  zone.addEventListener('pointerdown', (e) => {
    e.preventDefault();

    if (!gameActive) return;

    onTouchSmash();

    moveZone(zone, i);
  });
}