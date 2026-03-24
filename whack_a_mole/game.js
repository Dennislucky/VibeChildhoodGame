const grid = document.getElementById('grid');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const comboEl = document.getElementById('combo');
const startBtn = document.getElementById('startBtn');
const messageEl = document.getElementById('message');

const HOLES = 9;
const GAME_TIME = 30;
let score, combo, timeLeft, gameTimer, moleTimer, running;
const holes = [];

// Create holes
for (let i = 0; i < HOLES; i++) {
    const hole = document.createElement('div');
    hole.className = 'hole';
    hole.innerHTML = '<div class="mole">🐹</div>';
    hole.addEventListener('click', () => whack(i));
    grid.appendChild(hole);
    holes.push(hole);
}

function whack(index) {
    if (!running) return;
    const hole = holes[index];
    if (!hole.classList.contains('active')) {
        combo = 0;
        comboEl.textContent = combo;
        return;
    }
    hole.classList.remove('active');
    hole.classList.add('hit');
    
    combo++;
    comboEl.textContent = combo;
    const points = 10 + (combo > 1 ? combo * 5 : 0);
    score += points;
    scoreEl.textContent = score;

    // Hit effect
    const effect = document.createElement('div');
    effect.className = 'hit-effect';
    effect.textContent = combo > 1 ? `+${points} x${combo}!` : `+${points}`;
    hole.appendChild(effect);
    setTimeout(() => { effect.remove(); hole.classList.remove('hit'); }, 500);
}

function showMole() {
    if (!running) return;
    // Hide all
    holes.forEach(h => h.classList.remove('active'));
    
    // Show 1-2 moles
    const count = Math.random() > 0.7 ? 2 : 1;
    const indices = [];
    while (indices.length < count) {
        const r = Math.floor(Math.random() * HOLES);
        if (!indices.includes(r)) indices.push(r);
    }
    indices.forEach(i => holes[i].classList.add('active'));

    // Speed increases over time
    const speed = Math.max(500, 1200 - (GAME_TIME - timeLeft) * 20);
    moleTimer = setTimeout(() => {
        holes.forEach(h => h.classList.remove('active'));
        if (running) moleTimer = setTimeout(showMole, 200);
    }, speed);
}

function startGame() {
    score = 0; combo = 0; timeLeft = GAME_TIME; running = true;
    scoreEl.textContent = 0;
    comboEl.textContent = 0;
    timerEl.textContent = timeLeft;
    messageEl.textContent = '快点打地鼠！';
    startBtn.disabled = true;

    gameTimer = setInterval(() => {
        timeLeft--;
        timerEl.textContent = timeLeft;
        if (timeLeft <= 0) endGame();
    }, 1000);

    setTimeout(showMole, 500);
}

function endGame() {
    running = false;
    clearInterval(gameTimer);
    clearTimeout(moleTimer);
    holes.forEach(h => h.classList.remove('active'));
    startBtn.disabled = false;
    messageEl.textContent = `游戏结束！最终得分: ${score} 分`;
}

startBtn.addEventListener('click', startGame);
