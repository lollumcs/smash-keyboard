import { encodeToken, decodeToken } from './scripts/token.js';

const comboDisplay = document.getElementById('combo');
const timerDisplay = document.getElementById('timer');
const messageDisplay = document.getElementById('message');
const bestComboDisplay = document.getElementById('bestCombo');
const startBtn = document.getElementById('startBtn');
const endImage = document.getElementById('endImage');
const clearHighScoreBtn = document.getElementById('clearHighScoreBtn');
const copyChallengeBtn = document.getElementById('copyChallengeBtn');

const rageTexts = [
  "Trigger their rage!",
  "Start the chaos!",
  "Bring the fury!",
  "Smash or crash!",
  "Make ‘em lose it!",
  "Challenge the beast!",
  "Keyboard carnage!",
  "Set off the rage!",
  "Unleash the beast!",
  "Fight for the throne!",
  "Smash this!",
  "Break their keyboard!",
  "Throw down!",
  "Rage challenge!",
  "Make ‘em rage!",
  "Unleash fury!",
  "Beat this or rage quit!",
  "Show no mercy!",
  "Keyboard demolition!",
  "Start a smash war!"
];

function updateChallengeButtonText() {
  const randomIndex = Math.floor(Math.random() * rageTexts.length);
  copyChallengeBtn.innerHTML  = '<i class="fas fa-clipboard"></i> ' + rageTexts[randomIndex];
}


const totalTime = 5;
let combo = 0;
let timeLeft = totalTime;
let timerId = null;
let gameActive = false;
let challengeScore = null;

const lastFiveKeys = [];

let bestCombo = parseInt(localStorage.getItem('bestCombo')) || 0;
bestComboDisplay.textContent = `Best Combo: ${bestCombo}`;
timerDisplay.textContent = `Time Left: ${totalTime.toFixed(2)}s`;

/* ============================
   LOAD CHALLENGE TOKEN FROM URL
   ============================ */
(async function loadChallengeFromURL() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("challenge");
  if (!token) return;

  const decoded = await decodeToken(token);
  console.log("Loaded challenge token:", decoded);

  if (!decoded || typeof decoded.score !== "number") {
    alert("Invalid or corrupted challenge token!");
    return;
  }

  challengeScore = decoded.score;
  messageDisplay.textContent = `Challenge loaded! Score to beat: ${challengeScore}`;
})();

/* ============================
   GAME LOOP + TIMER
   ============================ */
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
  clearHighScoreBtn.style.display = 'none';
  endImage.style.display = 'none';

  if (timerId) clearInterval(timerId);
  timerId = setInterval(updateTimer, 50);

  if (isTouchDevice) {
    tapZonesContainer.classList.add('active');
    tapZones.forEach((zone, i) => {
      zone.style.display = 'flex';
      moveZone(zone, i);
    });
  }
}

/* ============================
   END GAME
   ============================ */
function endGame() {
  gameActive = false;
  clearInterval(timerId);

  // --- Determine challenge message ---
  let challengeMessage = "";
  if (challengeScore !== null) {
    if (combo > challengeScore) {
      challengeMessage = `You SMASHED the challenge! The keyboard feels your fury! (Target was ${challengeScore})`;
    } else if (combo === challengeScore) {
      challengeMessage = `You MATCHED the challenge! The keys survived... barely! (Target was ${challengeScore})`;
    } else {
      challengeMessage = `You gave it a good try, but the keyboard won this time. Smash harder! (Target was ${challengeScore})`;
    }
  }

  // --- Normal high score logic ---
  if (combo > bestCombo) {
    bestCombo = combo;
    localStorage.setItem('bestCombo', bestCombo);
    bestComboDisplay.textContent = `Best Combo: ${bestCombo}`;
    messageDisplay.textContent = `NEW RECORD! Your final combo: ${combo}`;
    endImage.src = 'static/img/anger.gif';
  } else {
    messageDisplay.textContent = `Time’s up! Your final combo: ${combo}`;
    endImage.src = 'static/img/go-away.jpg';
  }

  // --- Append challenge result message ---
  if (challengeMessage) {
    messageDisplay.innerHTML += `<span class="challenge-message">${challengeMessage}</span>`;
  }

  // Image animation
  endImage.style.display = 'none';
  endImage.onload = () => {
    setTimeout(() => {
      endImage.style.display = 'block';
    }, 20);
  };

  clearHighScoreBtn.style.display = 'inline-block';
  startBtn.style.display = 'inline-block';

  if (isTouchDevice) {
    tapZonesContainer.classList.remove('active');
    tapZones.forEach(zone => (zone.style.display = 'none'));
  }

  // Token export and copy button setup
  (async () => {
    const deviceType = isTouchDevice ? "mobile" : "desktop";

    const token = await encodeToken(combo, deviceType);
    console.log("Export token:", token);

    const decoded = await decodeToken(token);
    console.log("Decoded token:", decoded);

    const url = `${location.origin}${location.pathname}?challenge=${token}`;
    copyChallengeBtn.dataset.url = url;
    copyChallengeBtn.style.display = "inline-block";
    updateChallengeButtonText();
  })();
}


/* ============================
   KEY / TAP HANDLING
   ============================ */
function onKeyPress(event) {
  if (!gameActive) return;

  let pressed = event.key.toUpperCase();
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
    if (lastFiveKeys.length > 5) lastFiveKeys.shift();
  }

}

clearHighScoreBtn.addEventListener('click', () => {
  localStorage.removeItem('bestCombo');
  bestCombo = 0;
  bestComboDisplay.textContent = `Best Combo: 0`;
  messageDisplay.textContent = 'High score cleared! Smash to set a new record!';
});

copyChallengeBtn.addEventListener('click', async () => {
  const url = copyChallengeBtn.dataset.url;

  try {
    await navigator.clipboard.writeText(url);
    copyChallengeBtn.textContent = "✔️";
    setTimeout(() => { copyChallengeBtn.textContent = "Copied!"; }, 1500);
  } catch (err) {
    alert("Copy failed — your browser may block clipboard access.");
  }
});

/* ============================
   MOBILE TOUCH SMASH
   ============================ */
function onTouchSmash() {
  if (!gameActive) return;

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const randomChar = chars[Math.floor(Math.random() * chars.length)];

  onKeyPress({ key: randomChar });

  if (navigator.vibrate) navigator.vibrate(25);
}

startBtn.addEventListener('click', startGame);
window.addEventListener('keydown', onKeyPress);

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
const tapZonesContainer = document.getElementById('tapZonesContainer');
const numZones = 8;
const zoneSize = 80;
const padding = 10;

const tapZones = [];
const tapZonesPositions = [];

function getContainerSize() {
  const rect = tapZonesContainer.getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}

function isOverlapping(x1, y1, x2, y2) {
  return !(x1 + zoneSize + padding < x2 ||
            x2 + zoneSize + padding < x1 ||
            y1 + zoneSize + padding < y2 ||
            y2 + zoneSize + padding < y1);
}

function randomPositionAvoidOverlap(index) {
  const { width, height } = getContainerSize();
  const maxX = width - zoneSize;
  const maxY = height - zoneSize;

  let x, y;
  let attempts = 0;

  do {
    x = Math.random() * maxX;
    y = Math.random() * maxY;

    let overlap = false;
    for (let i = 0; i < tapZonesPositions.length; i++) {
      if (i === index) continue;
      const pos = tapZonesPositions[i];
      if (pos && isOverlapping(x, y, pos.x, pos.y)) {
        overlap = true;
        break;
      }
    }

    if (!overlap) return { x, y };
    attempts++;
  } while (attempts < 200);

  return { x, y };
}

function moveZone(zone, index) {
  const { x, y } = randomPositionAvoidOverlap(index);
  zone.style.transform = `translate(${x}px, ${y}px)`;
  tapZonesPositions[index] = { x, y };
}

for (let i = 0; i < numZones; i++) {
  const zone = document.createElement('div');
  zone.classList.add('tap-zone');
  zone.textContent = `SMASH ME!`;
  zone.style.position = 'absolute';
  zone.style.width = `${zoneSize}px`;
  zone.style.height = `${zoneSize}px`;
  zone.style.display = 'none';

  tapZones.push(zone);
  tapZonesContainer.appendChild(zone);
  tapZonesPositions.push(null);

  zone.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (!gameActive) return;
    onTouchSmash();
    moveZone(zone, i);
  });
}

