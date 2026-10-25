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
  'What do you call an elf who sings? A wrapper.',
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

// Every safe present has a prize inside. A higher weight means it turns up more
// often; the diamond is very rare (about 1 present in 115).
const PRIZES = [
  { name: 'Sweets', found: 'some sweets', emoji: '🍬', weight: 14 },
  { name: 'Lollipop', found: 'a lollipop', emoji: '🍭', weight: 10 },
  { name: 'Chocolate', found: 'a chocolate bar', emoji: '🍫', weight: 10 },
  { name: 'Cookie', found: 'a cookie', emoji: '🍪', weight: 10 },
  { name: 'Teddy bear', found: 'a teddy bear', emoji: '🧸', weight: 8 },
  { name: 'Dinosaur', found: 'a toy dinosaur', emoji: '🦕', weight: 8 },
  { name: 'Yo-yo', found: 'a yo-yo', emoji: '🪀', weight: 8 },
  { name: 'Balloon', found: 'a balloon', emoji: '🎈', weight: 8 },
  { name: 'Christmas socks', found: 'some Christmas socks', emoji: '🧦', weight: 6 },
  { name: 'Football', found: 'a football', emoji: '⚽', weight: 6 },
  { name: 'Kite', found: 'a kite', emoji: '🪁', weight: 5 },
  { name: 'Toy train', found: 'a toy train', emoji: '🚂', weight: 5 },
  { name: 'Robot', found: 'a robot', emoji: '🤖', weight: 4 },
  { name: 'Video game', found: 'a video game', emoji: '🎮', weight: 2 },
  { name: 'Diamond', found: 'a DIAMOND', emoji: '💎', weight: 1, rare: true },
];
const PRIZE_SHOW_MS = 1600; // how long an everyday prize stays on the board; diamonds stay
const RESULT_DELAY_MS = 900; // a short look at the last present before the result pops up

const CHARACTERS = [
  { id: 'santa', name: 'Santa', image: 'santa.jpeg' },
  { id: 'elf', name: 'Boy Elf', image: 'elf.jpeg' },
  { id: 'gingerbread', name: 'Gingerbread Man', image: 'gingerbreadman.jpeg', label: 'Ginger\u00ADbread Man' }, // soft hyphen so it fits on phones
  { id: 'snowman', name: 'Snowman', image: 'snowman.jpeg' },
  { id: 'girlelf', name: 'Girl Elf', image: 'girlelf.jpeg' },
  { id: 'reindeer', name: 'Reindeer', image: 'reindeer.jpeg' },
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
const resultEl = document.getElementById('result');
const resultTitleEl = document.getElementById('resultTitle');
const resultTextEl = document.getElementById('resultText');
const resultPlayersEl = document.getElementById('resultPlayers');
const resultButtonEl = document.getElementById('resultButton');
const resultFeedbackEl = document.getElementById('resultFeedback');

// Anonymous game stats for Umami (see index.html). Does nothing if the stats
// script is blocked or not loaded, or when testing locally.
function track(name, data) {
  try {
    if (window.umami) window.umami.track(name, data);
  } catch (error) {
    // stats must never break the game
  }
}

let gameInProgress = false; // for counting games people leave before the end
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

function prepareAudio() {
  try {
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    loadScareSounds();
    loadVinylSounds();
  } catch (error) {
    // no sound available
  }
}

// ---- recorded scare sounds (the mp3 files) ----
const SCARE_SOUNDS = ['jumpsound01.mp3', 'jumpsound02.mp3', 'jumpsound03.mp3', 'jumpsound04.mp3', 'jumpsound05.mp3'];
const SCARE_SOUND_MAX_SECONDS = 3; // longer sounds are faded out after this
const SCREAM = 'scream'; // the scream made in code is one more choice
const scareBuffers = {};
let scareSoundsLoading = false;

function loadScareSounds() {
  if (!audioContext || scareSoundsLoading) return;
  scareSoundsLoading = true;
  SCARE_SOUNDS.forEach(file => {
    fetch(file)
      .then(response => response.arrayBuffer())
      .then(data => audioContext.decodeAudioData(data))
      .then(buffer => {
        scareBuffers[file] = buffer;
      })
      .catch(() => {
        // not loaded (for example the page was opened as a file), the fallback below is used
      });
  });
}

// returns false if this sound could not be played
function playRecordedScare(file) {
  try {
    const buffer = scareBuffers[file];
    if (buffer) {
      const now = audioContext.currentTime;
      const source = audioContext.createBufferSource();
      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(SCARE_VOLUME, now);
      gain.gain.setValueAtTime(SCARE_VOLUME, now + SCARE_SOUND_MAX_SECONDS - 0.4);
      gain.gain.linearRampToValueAtTime(0, now + SCARE_SOUND_MAX_SECONDS);
      source.buffer = buffer;
      source.connect(gain);
      gain.connect(audioContext.destination);
      source.start(now);
      source.stop(now + SCARE_SOUND_MAX_SECONDS);
      return true;
    }
    const audio = new Audio(file); // plain audio element, also works when the page is opened as a file
    audio.volume = SCARE_VOLUME;
    audio.play().catch(() => playSyntheticScream());
    setTimeout(() => audio.pause(), SCARE_SOUND_MAX_SECONDS * 1000);
    return true;
  } catch (error) {
    return false;
  }
}

function playScareSound() {
  prepareAudio();
  const choices = SCARE_SOUNDS.concat(SCREAM);
  const choice = choices[Math.floor(Math.random() * choices.length)];
  if (choice === SCREAM || !playRecordedScare(choice)) playSyntheticScream();
}

function playSyntheticScream() {
  try {
    prepareAudio();
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

// ---- Christmas music: two old carols (public domain) played with a bell sound ----
const MUSIC_VOLUME = 0.22;
const NOTE_SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function noteFrequency(name) {
  const [, letter, accidental, octave] = name.match(/^([A-G])([#b]?)(\d)$/);
  const shift = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;
  const midi = 12 * (Number(octave) + 1) + NOTE_SEMITONES[letter] + shift + 12; // an octave up, brighter
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// [note, beats]; a null note is a rest
const JINGLE_BELLS = [
  ['E4', 1], ['E4', 1], ['E4', 2], ['E4', 1], ['E4', 1], ['E4', 2],
  ['E4', 1], ['G4', 1], ['C4', 1.5], ['D4', 0.5], ['E4', 4],
  ['F4', 1], ['F4', 1], ['F4', 1.5], ['F4', 0.5], ['F4', 1], ['E4', 1], ['E4', 1], ['E4', 0.5], ['E4', 0.5],
  ['E4', 1], ['D4', 1], ['D4', 1], ['E4', 1], ['D4', 2], ['G4', 2],
  ['E4', 1], ['E4', 1], ['E4', 2], ['E4', 1], ['E4', 1], ['E4', 2],
  ['E4', 1], ['G4', 1], ['C4', 1.5], ['D4', 0.5], ['E4', 4],
  ['F4', 1], ['F4', 1], ['F4', 1], ['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['E4', 0.5], ['E4', 0.5],
  ['G4', 1], ['G4', 1], ['F4', 1], ['D4', 1], ['C4', 4],
  [null, 2],
];

const WE_WISH_YOU = [
  ['D4', 1], ['G4', 1], ['G4', 0.5], ['A4', 0.5], ['G4', 0.5], ['F#4', 0.5],
  ['E4', 1], ['E4', 1], ['E4', 1], ['A4', 1], ['A4', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 0.5],
  ['F#4', 1], ['D4', 1], ['D4', 1], ['B4', 1], ['B4', 0.5], ['C5', 0.5], ['B4', 0.5], ['A4', 0.5],
  ['G4', 1], ['E4', 1], ['D4', 0.5], ['D4', 0.5], ['E4', 1], ['A4', 1], ['F#4', 1], ['G4', 3],
  [null, 2],
];

// Joy to the World, in D major (Lowell Mason's 1839 tune)
const JOY_TO_THE_WORLD = [
  ['D5', 1], ['C#5', 0.75], ['B4', 0.25], ['A4', 1.5], ['G4', 0.5], ['F#4', 1], ['E4', 1],
  ['D4', 1.5], ['A4', 0.5], ['B4', 1.5], ['B4', 0.5], ['C#5', 1.5], ['C#5', 0.5], ['D5', 3.5],
  ['D5', 0.5], ['D5', 0.5], ['C#5', 0.5], ['B4', 0.5], ['A4', 0.5], ['A4', 0.75], ['G4', 0.25], ['F#4', 0.5],
  ['D5', 0.5], ['D5', 0.5], ['C#5', 0.5], ['B4', 0.5], ['A4', 0.5], ['A4', 0.75], ['G4', 0.25], ['F#4', 0.5],
  ['F#4', 0.5], ['F#4', 0.5], ['F#4', 0.5], ['F#4', 0.5], ['F#4', 0.25], ['G4', 0.25], ['A4', 1.5], ['G4', 0.25], ['F#4', 0.25],
  ['E4', 0.5], ['E4', 0.5], ['E4', 0.5], ['E4', 0.25], ['F#4', 0.25], ['G4', 1.5], ['F#4', 0.25], ['E4', 0.25],
  ['F#4', 0.5], ['D5', 1], ['B4', 0.5], ['A4', 0.75], ['G4', 0.25], ['F#4', 0.5], ['G4', 0.5],
  ['F#4', 1], ['E4', 1], ['D4', 2],
  [null, 2],
];

// Hark! The Herald Angels Sing, in F major (Mendelssohn's tune)
const HARK_THE_HERALD = [
  ['C4', 1], ['F4', 1], ['F4', 1.5], ['E4', 0.5], ['F4', 1], ['A4', 1], ['A4', 1], ['G4', 1],
  ['C5', 1], ['C5', 1], ['C5', 1.5], ['Bb4', 0.5], ['A4', 1], ['G4', 1], ['A4', 2],
  ['C4', 1], ['F4', 1], ['F4', 1.5], ['E4', 0.5], ['F4', 1], ['A4', 1], ['A4', 1], ['G4', 1],
  ['C5', 1], ['G4', 1], ['G4', 1.5], ['E4', 0.5], ['E4', 1], ['D4', 1], ['C4', 2],
  ['C5', 1], ['C5', 1], ['C5', 1], ['F4', 1], ['Bb4', 1], ['A4', 1], ['A4', 1], ['G4', 1],
  ['C5', 1], ['C5', 1], ['C5', 1], ['F4', 1], ['Bb4', 1], ['A4', 1], ['A4', 1], ['G4', 1],
  ['D5', 1], ['D5', 1], ['D5', 1], ['C5', 1], ['Bb4', 1], ['A4', 1], ['Bb4', 2],
  ['G4', 1], ['A4', 0.5], ['Bb4', 0.5], ['C5', 1.5], ['F4', 0.5], ['F4', 1], ['G4', 1], ['A4', 2],
  ['D5', 1.5], ['D5', 0.5], ['D5', 1], ['C5', 1], ['Bb4', 1], ['A4', 1], ['Bb4', 2],
  ['G4', 1], ['A4', 0.5], ['Bb4', 0.5], ['C5', 1.5], ['F4', 0.5], ['F4', 1], ['G4', 1], ['F4', 2],
  [null, 2],
];

// O Tannenbaum, in G major: the tune, the middle part, then the tune again
const O_TANNENBAUM_TUNE = [
  ['D4', 0.5], ['G4', 0.75], ['G4', 0.25], ['G4', 1], ['A4', 1],
  ['B4', 0.75], ['B4', 0.25], ['B4', 1.5], ['B4', 0.5],
  ['A4', 0.5], ['B4', 0.5], ['C5', 1], ['F#4', 1], ['A4', 1], ['G4', 1], [null, 0.5],
];
const O_TANNENBAUM_MIDDLE = [
  ['D5', 0.5], ['D5', 0.5], ['B4', 0.5], ['E5', 1.5], ['D5', 0.5],
  ['D5', 0.5], ['C5', 0.5], ['C5', 1.5], ['C5', 0.5],
  ['C5', 0.5], ['A4', 0.5], ['D5', 1.5], ['C5', 0.5],
  ['C5', 0.5], ['B4', 0.5], ['B4', 1], [null, 0.5],
];
const O_TANNENBAUM = [...O_TANNENBAUM_TUNE, ...O_TANNENBAUM_MIDDLE, ...O_TANNENBAUM_TUNE, [null, 2]];

// seconds is how long one quarter note lasts
const SONGS = [
  { name: 'Jingle Bells', notes: JINGLE_BELLS, seconds: 0.38 },
  { name: 'We Wish You a Merry Christmas', notes: WE_WISH_YOU, seconds: 0.44 },
  { name: 'Joy to the World', notes: JOY_TO_THE_WORLD, seconds: 0.5 },
  { name: 'Hark! The Herald Angels Sing', notes: HARK_THE_HERALD, seconds: 0.5 },
  { name: 'O Tannenbaum', notes: O_TANNENBAUM, seconds: 0.5 },
].map(song => ({
  name: song.name,
  notes: song.notes.map(([note, beats]) => ({ frequency: note ? noteFrequency(note) : null, seconds: beats * song.seconds })),
}));

let musicOn = false;
let musicWanted = false;
let musicMuted = false;
let musicGain;
let musicTimer;
let playlist = []; // the order the songs play in, shuffled each time the music starts
let songIndex = 0;
let noteIndex = 0;
let lastSongStarted = -1;
let nextNoteTime = 0;

function shuffledSongOrder() {
  const order = shuffle(SONGS.map((song, i) => i));
  if (order.length > 1 && order[0] === lastSongStarted) order.push(order.shift()); // don't repeat the last song
  return order;
}

function playBell(frequency, time, seconds) {
  const gain = audioContext.createGain();
  const ring = Math.max(seconds, 0.3) + 0.3;
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.5, time + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + ring);
  [[frequency, 'sine', 1], [frequency * 2, 'triangle', 0.35], [frequency * 3.01, 'sine', 0.12]].forEach(([pitch, type, level]) => {
    const osc = audioContext.createOscillator();
    const part = audioContext.createGain();
    osc.type = type;
    osc.frequency.value = pitch;
    part.gain.value = level;
    osc.connect(part);
    part.connect(gain);
    osc.start(time);
    osc.stop(time + ring + 0.05);
  });
  gain.connect(musicGain);
}

function scheduleMusic() {
  while (nextNoteTime < audioContext.currentTime + 0.4) {
    const song = SONGS[playlist[songIndex]];
    if (noteIndex === 0) lastSongStarted = playlist[songIndex];
    const note = song.notes[noteIndex];
    if (note.frequency) playBell(note.frequency, nextNoteTime, note.seconds);
    nextNoteTime += note.seconds;
    noteIndex++;
    if (noteIndex >= song.notes.length) {
      noteIndex = 0;
      songIndex++;
      if (songIndex >= playlist.length) {
        playlist = shuffledSongOrder();
        songIndex = 0;
      }
    }
  }
}

// ---- vinyl crackle before the carols (sounds by lulyc, CC BY 3.0, see CREDITS.txt) ----
const VINYL_SOUNDS = ['vinylstart1.mp3', 'vinylstart2.mp3', 'vinylstart3.mp3'];
const VINYL_LEAD_SECONDS = 3; // the carols start this long after the crackle begins
const VINYL_LEVEL = 0.9; // the loudest crackle in each recording is raised to this
const vinylBuffers = {};
const vinylLevels = {};
let vinylLoading = false;
let vinylSource;
let vinylGain;

function loadVinylSounds() {
  if (!audioContext || vinylLoading) return;
  vinylLoading = true;
  VINYL_SOUNDS.forEach(file => {
    fetch(file)
      .then(response => response.arrayBuffer())
      .then(data => audioContext.decodeAudioData(data))
      .then(buffer => {
        let peak = 0.01;
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
          buffer.getChannelData(channel).forEach(sample => {
            peak = Math.max(peak, Math.abs(sample));
          });
        }
        vinylLevels[file] = Math.min(3, VINYL_LEVEL / peak); // the quiet recordings are made louder
        vinylBuffers[file] = buffer;
      })
      .catch(() => {
        // not loaded (for example the page was opened as a file): the carols just start without it
      });
  });
}

// plays a random crackle, returns how many seconds the carols should wait
function startVinyl() {
  const loaded = VINYL_SOUNDS.filter(file => vinylBuffers[file]);
  if (!loaded.length) return 0;
  const file = loaded[Math.floor(Math.random() * loaded.length)];
  const start = audioContext.currentTime + 0.1;
  const level = vinylLevels[file];
  vinylGain = audioContext.createGain();
  vinylGain.gain.setValueAtTime(level, start);
  vinylGain.gain.setValueAtTime(level, start + VINYL_LEAD_SECONDS);
  vinylGain.gain.linearRampToValueAtTime(level * 0.45, start + VINYL_LEAD_SECONDS + 1); // softer under the carols
  vinylSource = audioContext.createBufferSource();
  vinylSource.buffer = vinylBuffers[file];
  vinylSource.connect(vinylGain);
  vinylGain.connect(audioContext.destination);
  vinylSource.start(start);
  return VINYL_LEAD_SECONDS;
}

function stopVinyl() {
  if (!vinylGain) return;
  const gain = vinylGain;
  const source = vinylSource;
  vinylGain = null;
  vinylSource = null;
  gain.gain.cancelScheduledValues(audioContext.currentTime);
  gain.gain.setTargetAtTime(0, audioContext.currentTime, 0.02);
  setTimeout(() => {
    try {
      source.stop();
    } catch (error) {
      // it had already finished
    }
    gain.disconnect();
  }, 600);
}

function startMusic(withVinyl = false) {
  if (!musicWanted || musicMuted || musicOn) return;
  prepareAudio();
  if (!audioContext) return;
  musicOn = true;
  musicGain = audioContext.createGain();
  musicGain.gain.value = MUSIC_VOLUME;
  musicGain.connect(audioContext.destination);
  playlist = shuffledSongOrder(); // a fresh shuffled order, starting with a whole song
  songIndex = 0;
  noteIndex = 0;
  const lead = withVinyl ? startVinyl() : 0;
  nextNoteTime = audioContext.currentTime + 0.1 + lead;
  scheduleMusic();
  musicTimer = setInterval(scheduleMusic, 100);
}

function stopMusic() {
  if (!musicOn) return;
  musicOn = false;
  clearInterval(musicTimer);
  stopVinyl();
  const gain = musicGain;
  gain.gain.cancelScheduledValues(audioContext.currentTime);
  gain.gain.setTargetAtTime(0, audioContext.currentTime, 0.02); // cut notes that are already queued
  setTimeout(() => gain.disconnect(), 600);
}

function setMusicWanted(wanted, withVinyl = false) {
  musicWanted = wanted;
  if (wanted) startMusic(withVinyl);
  else stopMusic();
}

const muteEl = document.getElementById('mute');
muteEl.onclick = () => {
  musicMuted = !musicMuted;
  muteEl.textContent = musicMuted ? '🔇' : '🔊';
  muteEl.setAttribute('aria-label', musicMuted ? 'Turn music on' : 'Turn music off');
  if (musicMuted) stopMusic();
  else startMusic();
};

function playJumpScare() {
  setMusicWanted(false);
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
let roundStartScores;
let prizes; // every prize each player found this game
let roundPrizes; // just this round's
let resultTimer;
let chosen = [null, null];
let names = [null, null];
let suddenDeathFirst = 0;

const BOT_NAMES = ['Jingle-Bot', 'Tinsel', 'Sparky', 'Beepo', 'Frosty-Bot', 'Bolt'];
let BOT_THINK_MS = 1500;
let vsBot = false;
let botTimer;

function isBotTurn() {
  return vsBot && currentPlayer === 1 && !roundOver;
}

// The bot is always player 2. It has no clue where the bomb is, so it just
// picks a random present that is still there, after a short pause.
function botTurn() {
  clearTimeout(botTimer);
  if (!isBotTurn()) return;
  botTimer = setTimeout(() => {
    if (!isBotTurn()) return;
    const available = [...presentsEl.querySelectorAll('.present')].filter(button => !button.disabled);
    const button = available[Math.floor(Math.random() * available.length)];
    openPresent(button, Number(button.dataset.index));
  }, BOT_THINK_MS);
}

function assignBot() {
  chosen[1] = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
  names[1] = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
}
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

// A player who typed no name (or typed the character's own name) is shown as
// just the character, like "Santa". A typed name is shown like "Sam (Santa)".
function nameParts(player) {
  const character = chosen[player];
  const typed = (names[player] || '').trim();
  const isDefault = !typed || typed.toLowerCase() === character.name.toLowerCase();
  return { base: isDefault ? character.name : typed, suffix: isDefault ? '' : ' (' + character.name + ')' };
}

function playerName(player) {
  if (!chosen[player]) return 'Player ' + (player + 1);
  const mine = nameParts(player);
  const other = 1 - player;
  if (chosen[other]) {
    const theirs = nameParts(other);
    if (mine.base + mine.suffix === theirs.base + theirs.suffix) {
      return mine.base + ' ' + (player + 1) + mine.suffix; // same name twice, so "Santa 1" and "Santa 2"
    }
  }
  return mine.base + mine.suffix;
}

function showName(player, character) {
  selectEl.hidden = true;
  nameScreenEl.hidden = false;
  namePicEl.src = character.image;
  namePicEl.alt = character.name;
  nameTitleEl.textContent = vsBot ? 'What is your name?' : 'Player ' + (player + 1) + ', what is your name?';
  nameInputEl.value = '';
  nameInputEl.placeholder = 'Leave blank to be ' + character.name;
  nameInputEl.focus();
  nameContinueEl.onclick = () => {
    chosen[player] = character;
    names[player] = nameInputEl.value.trim(); // blank means the character's name is used
    track('character', { character: character.name, mode: vsBot ? 'bot' : 'friend' });

    nameScreenEl.hidden = true;
    if (player === 0 && !vsBot) {
      showSelect(1);
    } else {
      if (vsBot) assignBot();
      gameEl.hidden = false;
      gameInProgress = true;
      track('game-start', { mode: vsBot ? 'bot' : 'friend' });
      startRound(0);
    }
  };
}

nameInputEl.addEventListener('keydown', event => {
  if (event.key === 'Enter') nameContinueEl.click();
});

function showSelect(player) {
  gameEl.hidden = true;
  wheelScreenEl.hidden = true;
  nameScreenEl.hidden = true;
  clearTimeout(wheelTimer);
  selectEl.hidden = false;
  selectTitleEl.textContent = vsBot ? 'Choose your character' : 'Player ' + (player + 1) + ', choose your character';
  charactersEl.innerHTML = '';

  CHARACTERS.forEach(character => {
    const button = document.createElement('button');
    button.className = 'character';
    button.addEventListener('click', () => showName(player, character));

    const img = document.createElement('img');
    img.src = character.image;
    img.alt = character.name;

    const label = document.createElement('span');
    label.textContent = character.label || character.name;

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

function randomPrize() {
  const total = PRIZES.reduce((sum, prize) => sum + prize.weight, 0);
  let pick = Math.random() * total;
  for (const prize of PRIZES) {
    pick -= prize.weight;
    if (pick < 0) return prize;
  }
  return PRIZES[0];
}

// a row of prizes like "🧸 2  🍬 1", in the PRIZES order, rarest last
function prizeList(list) {
  const row = document.createElement('div');
  row.className = 'prizeList';
  if (list.length === 0) {
    row.textContent = 'No prizes';
    return row;
  }
  PRIZES.forEach(prize => {
    const count = list.filter(found => found === prize).length;
    if (count === 0) return;
    const chip = document.createElement('span');
    chip.className = 'prizeChip' + (prize.rare ? ' rare' : '');
    chip.title = prize.name;
    chip.setAttribute('aria-label', count + ' ' + prize.name);
    chip.textContent = prize.emoji + (count > 1 ? ' ×' + count : '');
    row.appendChild(chip);
  });
  return row;
}

// The pop-up after each round, and at the end of the game. `final` shows the
// prizes from the whole game and crowns the winner.
function showResult({ title, text, final, winner, buttonLabel, onContinue }) {
  resultTitleEl.textContent = title;
  resultTextEl.textContent = text;
  resultPlayersEl.innerHTML = '';

  [0, 1].forEach(player => {
    const card = document.createElement('div');
    card.className = 'resultPlayer' + (player === winner ? ' winner' : '');

    const img = document.createElement('img');
    img.src = chosen[player].image;
    img.alt = chosen[player].name;

    const name = document.createElement('p');
    name.className = 'resultName';
    name.textContent = (player === winner ? '🏆 ' : '') + playerName(player);

    const points = document.createElement('p');
    points.className = 'resultPoints';
    const gained = scores[player] - roundStartScores[player];
    points.textContent = final || round === SUDDEN_DEATH
      ? 'Score: ' + scores[player]
      : '+' + gained + ' this round · Score: ' + scores[player];

    const found = final ? prizes[player] : roundPrizes[player];
    const label = document.createElement('p');
    label.className = 'resultLabel';
    label.textContent = final ? 'Prizes this game (' + found.length + ')' : 'Prizes this round';

    card.append(img, name, points, label, prizeList(found));
    resultPlayersEl.appendChild(card);
  });

  resultFeedbackEl.hidden = !final;
  resultButtonEl.textContent = buttonLabel;
  resultButtonEl.onclick = () => {
    resultEl.hidden = true;
    onContinue();
  };
  resultEl.hidden = false;
  resultButtonEl.focus();
}

function hideResult() {
  clearTimeout(resultTimer);
  resultEl.hidden = true;
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

  let what;
  if (bombOpener === null) {
    what = 'Only the bomb was left, so both players get a point.';
  } else if (round === SUDDEN_DEATH) {
    what = playerName(bombOpener) + ' opened the bomb!';
  } else {
    what = playerName(bombOpener) + ' opened the bomb, so ' + playerName(1 - bombOpener) + ' gets a point.';
  }
  const finalScore = 'Final score ' + scores[0] + ' – ' + scores[1] + '.';

  let result;
  if (round === SUDDEN_DEATH) {
    gameOver = true;
    const winner = 1 - bombOpener;
    trackFinish(winner);
    result = { title: playerName(winner) + ' wins!', text: what + ' ' + finalScore, final: true, winner, buttonLabel: 'Play again', onContinue: showHome };
  } else if (round < NORMAL_ROUNDS - 1) {
    result = { title: 'Round ' + (round + 1) + ' result', text: what, buttonLabel: 'Next round', onContinue: () => startRound(round + 1) };
  } else if (scores[0] === scores[1]) {
    result = { title: "It's a tie!", text: what + ' ' + scores[0] + ' – ' + scores[1] + ', so it goes to sudden death.', buttonLabel: 'Spin the wheel', onContinue: showWheel };
  } else {
    gameOver = true;
    const winner = scores[0] > scores[1] ? 0 : 1;
    trackFinish(winner);
    result = { title: playerName(winner) + ' wins the game!', text: what + ' ' + finalScore, final: true, winner, buttonLabel: 'Play again', onContinue: showHome };
  }

  // after a bomb, wait for the jump scare to finish first
  clearTimeout(resultTimer);
  resultTimer = setTimeout(() => showResult(result), bombOpener === null ? RESULT_DELAY_MS : SCARE_MS + 200);
}

function trackFinish(winner) {
  gameInProgress = false;
  track('game-finish', {
    mode: vsBot ? 'bot' : 'friend',
    winner: vsBot ? (winner === 0 ? 'player' : 'bot') : chosen[winner].name,
    suddenDeath: round === SUDDEN_DEATH,
    diamonds: prizes[0].concat(prizes[1]).filter(prize => prize.rare).length,
  });
}

// puts what was inside on the opened present's spot; with `fade` it goes away
// again once the player has had a look
function revealPresent(button, emoji, rare, fade) {
  const inside = document.createElement('span');
  inside.className = 'inside' + (rare ? ' rare' : '');
  inside.textContent = emoji;
  inside.setAttribute('aria-hidden', 'true');
  button.appendChild(inside);
  if (fade) setTimeout(() => inside.classList.add('gone'), PRIZE_SHOW_MS);
}

function openPresent(button, index) {
  if (roundOver) return;

  button.classList.add('opened');
  button.disabled = true;
  openedCount++;

  if (index === bombIndex) {
    revealPresent(button, '💣');
    playJumpScare();
    const other = 1 - currentPlayer;
    if (round !== SUDDEN_DEATH) scores[other]++;
    messageEl.textContent = 'BOMB!' + (round === SUDDEN_DEATH ? '' : ' ' + playerName(other) + ' gets a point.');
    endRound(currentPlayer);
    return;
  }

  const prize = randomPrize();
  prizes[currentPlayer].push(prize);
  roundPrizes[currentPlayer].push(prize);
  revealPresent(button, prize.emoji, prize.rare, !prize.rare);
  if (prize.rare) track('diamond', { character: chosen[currentPlayer].name, bot: vsBot && currentPlayer === 1 });
  button.setAttribute('aria-label', prize.name);

  let text = prize.rare
    ? 'WOW! ' + playerName(currentPlayer) + ' found ' + prize.found + ' ' + prize.emoji + '!'
    : 'Safe! ' + playerName(currentPlayer) + ' found ' + prize.found + ' ' + prize.emoji + '.';
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
  botTurn();
}

function startRound(newRound) {
  setMusicWanted(false); // every round starts the music again, even if it was still playing
  setMusicWanted(true, true); // with a random vinyl crackle first
  clearTimeout(botTimer);
  round = newRound;
  presentsEl.innerHTML = '';
  messageEl.textContent = '';
  hideResult();
  roundStartScores = scores.slice();
  roundPrizes = [[], []];
  bombIndex = Math.floor(Math.random() * PRESENT_COUNT);
  jokesLeft = shuffle(JOKES);
  openedCount = 0;
  roundOver = false;
  currentPlayer = firstPlayerOfRound();
  updateStatus();

  for (let i = 0; i < PRESENT_COUNT; i++) {
    const button = document.createElement('button');
    button.className = 'present';
    button.dataset.index = i;
    button.addEventListener('click', () => {
      if (isBotTurn()) return; // wait for the bot to pick
      openPresent(button, i);
    });

    const img = document.createElement('img');
    img.src = PRESENT_IMAGES[round % PRESENT_IMAGES.length];
    img.alt = 'Present ' + (i + 1);

    button.appendChild(img);
    presentsEl.appendChild(button);
  }
  botTurn();
}

function startGame() {
  setMusicWanted(false); // music waits until the first round begins
  clearTimeout(botTimer);
  scores = [0, 0];
  prizes = [[], []];
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

let warningSeen = false;

// asks "friend or bot?" again, for example after a game ends
function showMode() {
  setMusicWanted(false); // no music in the menus
  clearTimeout(botTimer);
  clearTimeout(wheelTimer);
  hideResult();
  gameEl.hidden = true;
  wheelScreenEl.hidden = true;
  selectEl.hidden = true;
  nameScreenEl.hidden = true;
  document.getElementById('mode').hidden = false;
}

function chooseMode(withBot) {
  vsBot = withBot;
  prepareAudio(); // a click is needed before a browser lets the scare sound play
  document.getElementById('mode').hidden = true;
  if (warningSeen) {
    startGame();
  } else {
    document.getElementById('warning').hidden = false;
  }
}

const homeButtonEl = document.getElementById('homeButton');

// back to the very first screen, from anywhere
function showHome() {
  if (gameInProgress) {
    gameInProgress = false;
    track('game-quit', { mode: vsBot ? 'bot' : 'friend', round: round === SUDDEN_DEATH ? 'sudden death' : round + 1 });
  }
  showMode();
  document.getElementById('mode').hidden = true;
  document.getElementById('warning').hidden = true;
  homeButtonEl.hidden = true;
  document.getElementById('home').hidden = false;
}
homeButtonEl.onclick = showHome;

document.getElementById('play').onclick = () => {
  prepareAudio(); // a click is needed before a browser lets any sound play
  document.getElementById('home').hidden = true;
  homeButtonEl.hidden = false;
  showMode();
};
document.getElementById('playFriend').onclick = () => chooseMode(false);
document.getElementById('playBot').onclick = () => chooseMode(true);

document.getElementById('warningContinue').onclick = () => {
  warningSeen = true;
  document.getElementById('warning').hidden = true;
  startGame();
};
