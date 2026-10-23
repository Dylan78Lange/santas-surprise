const PRESENT_IMAGES = ['present.jpeg', 'present2.jpeg', 'present3.jpeg', 'present4.jpeg'];
const PRESENT_COUNT = 12;

const presentsEl = document.getElementById('presents');

let round = 0;

function showPresents() {
  presentsEl.innerHTML = '';

  for (let i = 0; i < PRESENT_COUNT; i++) {
    const button = document.createElement('button');
    button.className = 'present';

    const img = document.createElement('img');
    img.src = PRESENT_IMAGES[round % PRESENT_IMAGES.length];
    img.alt = 'Present ' + (i + 1);

    button.appendChild(img);
    presentsEl.appendChild(button);
  }
}

showPresents();
