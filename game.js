const PRESENT_IMAGES = ['present.jpeg', 'present2.jpeg', 'present3.jpeg', 'present4.jpeg'];
const PRESENT_COUNT = 12;
const JOKE_CHANCE = 0.5;

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

const presentsEl = document.getElementById('presents');
const messageEl = document.getElementById('message');
const turnEl = document.getElementById('turn');
const scoreEl = document.getElementById('score');

let round = 0;
let bombIndex;
let jokesLeft;
let openedCount;
let roundOver;
let currentPlayer;
const scores = [0, 0];

function playerName(player) {
  return 'Player ' + (player + 1);
}

function updateStatus() {
  scoreEl.textContent = playerName(0) + ': ' + scores[0] + '   ' + playerName(1) + ': ' + scores[1];
  turnEl.textContent = roundOver ? 'Round over' : playerName(currentPlayer) + "'s turn";
}

function endRound() {
  roundOver = true;
  document.querySelectorAll('.present').forEach(button => {
    button.disabled = true;
  });
  updateStatus();
}

function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function openPresent(button, index) {
  if (roundOver) return;

  button.classList.add('opened');
  button.disabled = true;
  openedCount++;

  if (index === bombIndex) {
    const other = 1 - currentPlayer;
    scores[other]++;
    messageEl.textContent = 'BOMB! ' + playerName(other) + ' gets a point.';
    endRound();
    return;
  }

  let text = 'You are safe!';
  if (Math.random() < JOKE_CHANCE && jokesLeft.length > 0) {
    text += ' ' + jokesLeft.pop();
  }

  if (PRESENT_COUNT - openedCount === 1) {
    scores[0]++;
    scores[1]++;
    text += ' Only one present left, so both players get a point.';
    messageEl.textContent = text;
    endRound();
    return;
  }

  messageEl.textContent = text;
  currentPlayer = 1 - currentPlayer;
  updateStatus();
}

function showPresents() {
  presentsEl.innerHTML = '';
  messageEl.textContent = '';
  bombIndex = Math.floor(Math.random() * PRESENT_COUNT);
  jokesLeft = shuffle(JOKES);
  openedCount = 0;
  roundOver = false;
  currentPlayer = 0;
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

showPresents();
