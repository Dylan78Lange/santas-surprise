const PRESENT_IMAGES = ['present.jpeg', 'present2.jpeg', 'present3.jpeg', 'present4.jpeg'];
const PRESENT_COUNT = 16;
const JOKE_CHANCE = 0.5;
const NORMAL_ROUNDS = 3;
const SUDDEN_DEATH = NORMAL_ROUNDS;
const GHOUL_IMAGES = ['ghoulelf.jpeg', 'ghoulreindeer.jpeg', 'ghoulsanta.jpeg', 'ghoulsnowman.jpeg'];
const SCARE_MS = 2000;
const SCARE_VOLUME = 0.7;
const WHEEL_SLICES = 8;
const WHEEL_SPINS = 5;
const WHEEL_MS = 4000;
const WHEEL_COLORS = ['#b3202a', '#1f7a3a'];

const JOKES = [
  'What do snowmen eat for breakfast? Frosted Flakes.',
  'Why did Santa go to music school? To improve his wrapping.',
  'What do elves learn in school? The elf-abet.',
  'Why was the gingerbread man so sad? He felt crumby.',
  "What's a snowman's favorite place to dance? A snowball.",
  'Why did the Grinch bring a ladder? To go over the top.',
  'What do you call a snowman in July? A puddle.',
  'Why does Santa have three gardens? So he can ho, ho, ho.',
  'What do reindeer say before they tell a joke? This will sleigh you.',
  'How does a snowman get around? By icicle.',
  "What's Santa's favorite kind of pizza? One that's deep pan, crisp, and even.",
  'Why did the cookie go to the doctor? It was feeling crumbly.',
  'What do you get when you cross a snowman with a vampire? Frostbite.',
  "What's an elf's favorite music? Wrap.",
  "Why couldn't the gingerbread man be a secret agent? He kept getting spotted by the milk.",
];

const CHARACTERS = [
  { id: 'santa', name: 'Santa', image: 'santa.jpeg' },
  { id: 'elf', name: 'Elf', image: 'elf.jpeg' },
  { id: 'gingerbread', name: 'Gingerbread Man', image: 'gingerbreadman.jpeg' },
  { id: 'snowman', name: 'Snowman', image: 'snowman.jpeg' },
  { id: 'grinch', name: 'Grinch', image: 'grinch.jpeg' },
  { id: 'rudolph', name: 'Rudolph', image: 'Rudolph.jpeg' },
];

const selectEl = document.getElementById('select');
const selectTitleEl = document.getElementById('selectTitle');
const charactersEl = document.getElementById('characters');
const nameScreenEl = document.getElementById('nameScreen');
const namePicEl = document.getElementById('namePic');
const nameTitleEl = document.getElementById('nameTitle');
const nameInputEl = document.getElementById('nameInput');
const nameContinueEl = document.getElementById('nameContinue');
const wheelScreenEl = document.getElementById('wheelScreen');
const wheelTitleEl = document.getElementById('wheelTitle');
const wheelCanvas = document.getElementById('wheel');
const wheelLegendEl = document.getElementById('wheelLegend');
const wheelResultEl = document.getElementById('wheelResult');
const spinEl = document.getElementById('spin');
const startSuddenDeathEl = document.getElementById('startSuddenDeath');
const gameEl = document.getElementById('game');
const presentsEl = document.getElementById('presents');
const messageEl = document.getElementById('message');
const turnEl = document.getElementById('turn');
const scoreEl = document.getElementById('score');
const actionEl = document.getElementById('action');
const scareEl = document.getElementById('scare');
const scareImgEl = document.getElementById('scareImg');

scareImgEl.onerror = () => {
  scareImgEl.hidden = true;
};
GHOUL_IMAGES.forEach(file => {
  new Image().src = file; // load them ahead of time so the scare appears instantly
});

let audioContext;
let scareTimer;

function playScareSound() {
  try {
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    const now = audioContext.currentTime;
    const length = 1.8;

    const master = audioContext.createGain();
    master.gain.value = SCARE_VOLUME;

    const distortion = audioContext.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) curve[i] = Math.tanh((i / 128 - 1) * 4);
    distortion.curve = curve;
    distortion.connect(master);
    master.connect(audioContext.destination);

    // harsh noise burst
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * length, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;
    const highpass = audioContext.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 3000;
    const noiseGain = audioContext.createGain();
    noiseGain.gain.setValueAtTime(1, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + length);
    noise.connect(highpass);
    highpass.connect(noiseGain);
    noiseGain.connect(distortion);
    noise.start(now);

    // screams and a low thump
    [['sawtooth', 300, 1500], ['square', 220, 950], ['sawtooth', 90, 40]].forEach(([type, from, to]) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(from, now);
      osc.frequency.exponentialRampToValueAtTime(to, now + length);
      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + length);
      osc.connect(gain);
      gain.connect(distortion);
      osc.start(now);
      osc.stop(now + length);
    });
  } catch (error) {
    // no sound available, the picture still shows
  }
}

function playJumpScare() {
  clearTimeout(scareTimer);
  scareImgEl.hidden = false;
  scareImgEl.src = GHOUL_IMAGES[Math.floor(Math.random() * GHOUL_IMAGES.length)];
  scareEl.hidden = false;
  playScareSound();
  scareTimer = setTimeout(() => {
    scareEl.hidden = true;
  }, SCARE_MS);
}

let round;
let bombIndex;
let jokesLeft;
let openedCount;
let roundOver;
let currentPlayer;
let gameOver;
let scores;
let chosen = [null, null];
let names = [null, null];
let suddenDeathFirst = 0;
let wheelTimer;

// Picks which player wins the spin, then works out how far to turn the wheel
// so the pointer at the top ends on one of that player's slices.
function computeSpin(winner) {
  const sliceDegrees = 360 / WHEEL_SLICES;
  const slices = [];
  for (let i = 0; i < WHEEL_SLICES; i++) {
    if (i % 2 === winner) slices.push(i);
  }
  const slice = slices[Math.floor(Math.random() * slices.length)];
  const angle = slice * sliceDegrees + 6 + Math.random() * (sliceDegrees - 12);
  return WHEEL_SPINS * 360 + (360 - angle);
}

function drawWheel() {
  const context = wheelCanvas.getContext('2d');
  const size = wheelCanvas.width;
  const center = size / 2;
  const radius = center - 6;
  const sliceAngle = (Math.PI * 2) / WHEEL_SLICES;

  context.clearRect(0, 0, size, size);
  for (let i = 0; i < WHEEL_SLICES; i++) {
    const start = -Math.PI / 2 + i * sliceAngle;
    context.beginPath();
    context.moveTo(center, center);
    context.arc(center, center, radius, start, start + sliceAngle);
    context.closePath();
    context.fillStyle = WHEEL_COLORS[i % 2];
    context.fill();
    context.lineWidth = 4;
    context.strokeStyle = '#fff';
    context.stroke();
  }

  chosen.forEach((character, player) => {
    const img = new Image();
    img.onload = () => {
      const avatar = radius * 0.32;
      for (let i = player; i < WHEEL_SLICES; i += 2) {
        const middle = -Math.PI / 2 + (i + 0.5) * sliceAngle;
        context.save();
        context.translate(center + Math.cos(middle) * radius * 0.68, center + Math.sin(middle) * radius * 0.68);
        context.rotate(middle + Math.PI / 2);
        context.beginPath();
        context.arc(0, 0, avatar / 2, 0, Math.PI * 2);
        context.clip();
        context.drawImage(img, -avatar / 2, -avatar / 2, avatar, avatar);
        context.restore();
      }
    };
    img.src = character.image;
  });
}

function showWheel() {
  clearTimeout(wheelTimer);
  gameEl.hidden = true;
  wheelScreenEl.hidden = false;
  wheelTitleEl.textContent = 'Spin the wheel to see who goes first in sudden death';
  wheelLegendEl.textContent = '';
  [0, 1].forEach(player => {
    const part = document.createElement('span');
    part.textContent = playerName(player);
    part.style.color = player === 0 ? '#ff6b6b' : '#6bdc8b';
    if (player === 1) wheelLegendEl.append('   ');
    wheelLegendEl.appendChild(part);
  });
  wheelResultEl.textContent = '';
  startSuddenDeathEl.hidden = true;
  spinEl.hidden = false;
  spinEl.disabled = false;
  wheelCanvas.style.transition = 'none';
  wheelCanvas.style.transform = 'rotate(0deg)';
  drawWheel();
}

function spinWheel() {
  spinEl.disabled = true;
  const winner = Math.floor(Math.random() * 2);
  const rotation = computeSpin(winner);
  wheelCanvas.getBoundingClientRect(); // make the browser apply the reset before turning
  wheelCanvas.style.transition = 'transform ' + WHEEL_MS + 'ms cubic-bezier(0.12, 0.6, 0.1, 1)';
  wheelCanvas.style.transform = 'rotate(' + rotation + 'deg)';
  wheelTimer = setTimeout(() => {
    suddenDeathFirst = winner;
    wheelResultEl.textContent = playerName(winner) + ' goes first!';
    spinEl.hidden = true;
    startSuddenDeathEl.hidden = false;
  }, WHEEL_MS + 150);
}

spinEl.onclick = spinWheel;
startSuddenDeathEl.onclick = () => {
  wheelScreenEl.hidden = true;
  gameEl.hidden = false;
  startRound(SUDDEN_DEATH);
};

function playerName(player) {
  const character = chosen[player];
  const name = names[player];
  if (!character || !name) return 'Player ' + (player + 1);
  const label = name + ' (' + character.name + ')';
  const other = 1 - player;
  if (chosen[other] && names[other] && label === names[other] + ' (' + chosen[other].name + ')') {
    return name + ' ' + (player + 1) + ' (' + character.name + ')';
  }
  return label;
}

function showName(player, character) {
  selectEl.hidden = true;
  nameScreenEl.hidden = false;
  namePicEl.src = character.image;
  namePicEl.alt = character.name;
  nameTitleEl.textContent = 'Player ' + (player + 1) + ', what is your name?';
  nameInputEl.value = '';
  nameContinueEl.disabled = true;
  nameInputEl.focus();
  nameContinueEl.onclick = () => {
    const typed = nameInputEl.value.trim();
    if (!typed) return;
    chosen[player] = character;
    names[player] = typed;
    nameScreenEl.hidden = true;
    if (player === 0) {
      showSelect(1);
    } else {
      gameEl.hidden = false;
      startRound(0);
    }
  };
}

nameInputEl.addEventListener('input', () => {
  nameContinueEl.disabled = nameInputEl.value.trim() === '';
});

nameInputEl.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !nameContinueEl.disabled) nameContinueEl.click();
});

function showSelect(player) {
  gameEl.hidden = true;
  wheelScreenEl.hidden = true;
  nameScreenEl.hidden = true;
  clearTimeout(wheelTimer);
  selectEl.hidden = false;
  selectTitleEl.textContent = 'Player ' + (player + 1) + ', choose your character';
  charactersEl.innerHTML = '';

  CHARACTERS.forEach(character => {
    const button = document.createElement('button');
    button.className = 'character';
    button.addEventListener('click', () => showName(player, character));

    const img = document.createElement('img');
    img.src = character.image;
    img.alt = character.name;

    const label = document.createElement('span');
    label.textContent = character.name;

    button.appendChild(img);
    button.appendChild(label);
    charactersEl.appendChild(button);
  });
}

function roundLabel() {
  return round === SUDDEN_DEATH ? 'Sudden death' : 'Round ' + (round + 1) + ' of ' + NORMAL_ROUNDS;
}

function updateStatus() {
  scoreEl.innerHTML = '';
  [0, 1].forEach(player => {
    const item = document.createElement('div');
    item.className = 'scoreItem';

    const img = document.createElement('img');
    img.src = chosen[player].image;
    img.alt = chosen[player].name;

    const text = document.createElement('span');
    text.textContent = playerName(player) + ': ' + scores[player];

    item.appendChild(img);
    item.appendChild(text);
    scoreEl.appendChild(item);
  });
  const turn = roundOver ? 'Round over' : playerName(currentPlayer) + "'s turn";
  turnEl.textContent = roundLabel() + ' · ' + turn;
}

function showAction(label, onClick) {
  actionEl.textContent = label;
  actionEl.onclick = onClick;
  actionEl.hidden = false;
}

function firstPlayerOfRound() {
  if (round === SUDDEN_DEATH) return suddenDeathFirst;
  return round % 2;
}

function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function endRound(bombOpener) {
  roundOver = true;
  document.querySelectorAll('.present').forEach(button => {
    button.disabled = true;
  });
  updateStatus();

  if (round === SUDDEN_DEATH) {
    gameOver = true;
    const winner = 1 - bombOpener;
    messageEl.textContent += ' ' + playerName(winner) + ' wins!';
    showAction('Play again', startGame);
  } else if (round < NORMAL_ROUNDS - 1) {
    showAction('Next round', () => startRound(round + 1));
  } else if (scores[0] === scores[1]) {
    messageEl.textContent += " It's a tie! Time for sudden death.";
    showAction('Spin the wheel', showWheel);
  } else {
    gameOver = true;
    const winner = scores[0] > scores[1] ? 0 : 1;
    messageEl.textContent += ' ' + playerName(winner) + ' wins the game!';
    showAction('Play again', startGame);
  }
}

function openPresent(button, index) {
  if (roundOver) return;

  button.classList.add('opened');
  button.disabled = true;
  openedCount++;

  if (index === bombIndex) {
    playJumpScare();
    const other = 1 - currentPlayer;
    if (round !== SUDDEN_DEATH) scores[other]++;
    messageEl.textContent = 'BOMB!' + (round === SUDDEN_DEATH ? '' : ' ' + playerName(other) + ' gets a point.');
    endRound(currentPlayer);
    return;
  }

  let text = 'You are safe!';
  if (Math.random() < JOKE_CHANCE && jokesLeft.length > 0) {
    text += ' ' + jokesLeft.pop();
  }

  if (round !== SUDDEN_DEATH && PRESENT_COUNT - openedCount === 1) {
    scores[0]++;
    scores[1]++;
    text += ' Only one present left, so both players get a point.';
    messageEl.textContent = text;
    endRound(null);
    return;
  }

  messageEl.textContent = text;
  currentPlayer = 1 - currentPlayer;
  updateStatus();
}

function startRound(newRound) {
  round = newRound;
  presentsEl.innerHTML = '';
  messageEl.textContent = '';
  actionEl.hidden = true;
  bombIndex = Math.floor(Math.random() * PRESENT_COUNT);
  jokesLeft = shuffle(JOKES);
  openedCount = 0;
  roundOver = false;
  currentPlayer = firstPlayerOfRound();
  updateStatus();

  for (let i = 0; i < PRESENT_COUNT; i++) {
    const button = document.createElement('button');
    button.className = 'present';
    button.addEventListener('click', () => openPresent(button, i));

    const img = document.createElement('img');
    img.src = PRESENT_IMAGES[round % PRESENT_IMAGES.length];
    img.alt = 'Present ' + (i + 1);

    button.appendChild(img);
    presentsEl.appendChild(button);
  }
}

function startGame() {
  scores = [0, 0];
  gameOver = false;
  chosen = [null, null];
  names = [null, null];
  showSelect(0);
}

// where each home screen character floats (left %, top %), in CHARACTERS order
const HOME_POSITIONS = [[14, 14], [86, 12], [8, 48], [92, 52], [22, 88], [78, 88]];

CHARACTERS.forEach((character, i) => {
  const img = document.createElement('img');
  img.src = character.image;
  img.alt = character.name;
  img.style.left = HOME_POSITIONS[i][0] + '%';
  img.style.top = HOME_POSITIONS[i][1] + '%';
  img.style.animationDuration = 4 + (i % 3) + 's';
  img.style.animationDelay = '-' + i * 0.9 + 's';
  document.getElementById('homeCharacters').appendChild(img);
});

document.getElementById('play').onclick = () => {
  document.getElementById('home').hidden = true;
  document.getElementById('warning').hidden = false;
};

document.getElementById('warningContinue').onclick = () => {
  document.getElementById('warning').hidden = true;
  startGame();
};
