const PRESENT_IMAGES = ['present.jpeg', 'present2.jpeg', 'present3.jpeg', 'present4.jpeg'];
const PRESENT_COUNT = 12;
const JOKE_CHANCE = 0.5;
const NORMAL_ROUNDS = 3;
const SUDDEN_DEATH = NORMAL_ROUNDS;

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
];

const selectEl = document.getElementById('select');
const selectTitleEl = document.getElementById('selectTitle');
const charactersEl = document.getElementById('characters');
const gameEl = document.getElementById('game');
const presentsEl = document.getElementById('presents');
const messageEl = document.getElementById('message');
const turnEl = document.getElementById('turn');
const scoreEl = document.getElementById('score');
const actionEl = document.getElementById('action');

let round;
let bombIndex;
let jokesLeft;
let openedCount;
let roundOver;
let currentPlayer;
let gameOver;
let scores;
let chosen = [null, null];

function playerName(player) {
  const character = chosen[player];
  if (!character) return 'Player ' + (player + 1);
  if (chosen[0] === chosen[1]) return character.name + ' ' + (player + 1);
  return character.name;
}

function showSelect(player) {
  gameEl.hidden = true;
  selectEl.hidden = false;
  selectTitleEl.textContent = 'Player ' + (player + 1) + ', choose your character';
  charactersEl.innerHTML = '';

  CHARACTERS.forEach(character => {
    const button = document.createElement('button');
    button.className = 'character';
    button.addEventListener('click', () => chooseCharacter(player, character));

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

function chooseCharacter(player, character) {
  chosen[player] = character;
  if (player === 0) {
    showSelect(1);
  } else {
    selectEl.hidden = true;
    gameEl.hidden = false;
    startRound(0);
  }
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
  if (round === SUDDEN_DEATH) return Math.floor(Math.random() * 2); // placeholder until the wheel is built
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
    showAction('Start sudden death', () => startRound(SUDDEN_DEATH));
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
  showSelect(0);
}

startGame();
