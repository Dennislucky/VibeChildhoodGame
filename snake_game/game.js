const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const messageEl = document.getElementById('message');

const GRID = 20;
const COLS = canvas.width / GRID;
const ROWS = canvas.height / GRID;

let snake, food, direction, nextDirection, score, highScore, gameLoop, running;

function init() {
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    highScore = parseInt(localStorage.getItem('snakeHigh') || '0');
    scoreEl.textContent = score;
    highScoreEl.textContent = highScore;
    running = false;
    spawnFood();
    draw();
}

function spawnFood() {
    do {
        food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (snake.some(s => s.x === food.x && s.y === food.y));
}

function draw() {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    for (let i = 0; i < COLS; i++) {
        for (let j = 0; j < ROWS; j++) {
            ctx.strokeRect(i * GRID, j * GRID, GRID, GRID);
        }
    }

    // Draw food
    ctx.fillStyle = '#ff4757';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff4757';
    ctx.beginPath();
    ctx.arc(food.x * GRID + GRID / 2, food.y * GRID + GRID / 2, GRID / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw snake
    snake.forEach((seg, i) => {
        const ratio = 1 - i / snake.length;
        ctx.fillStyle = `hsl(140, 80%, ${30 + ratio * 40}%)`;
        ctx.shadowBlur = i === 0 ? 10 : 0;
        ctx.shadowColor = '#53d769';
        const pad = i === 0 ? 1 : 2;
        ctx.fillRect(seg.x * GRID + pad, seg.y * GRID + pad, GRID - pad * 2, GRID - pad * 2);
    });
    ctx.shadowBlur = 0;
}

function update() {
    direction = nextDirection;
    const head = { ...snake[0] };

    switch (direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }

    // Wall collision
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) return gameOver();
    // Self collision
    if (snake.some(s => s.x === head.x && s.y === head.y)) return gameOver();

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreEl.textContent = score;
        if (score > highScore) {
            highScore = score;
            highScoreEl.textContent = highScore;
            localStorage.setItem('snakeHigh', String(highScore));
        }
        spawnFood();
    } else {
        snake.pop();
    }
    draw();
}

function gameOver() {
    clearInterval(gameLoop);
    running = false;
    messageEl.textContent = `游戏结束！得分: ${score}  按空格重新开始`;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff4757';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2);
}

function startGame() {
    if (running) return;
    init();
    running = true;
    messageEl.textContent = '使用方向键控制蛇的方向';
    gameLoop = setInterval(update, 120);
}

document.addEventListener('keydown', e => {
    if (e.code === 'Space') { e.preventDefault(); startGame(); return; }
    const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
    const dir = map[e.key];
    if (!dir) return;
    e.preventDefault();
    const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
    if (dir !== opposites[direction]) nextDirection = dir;
});

// Mobile controls
['Up', 'Down', 'Left', 'Right'].forEach(d => {
    const btn = document.getElementById('btn' + d);
    if (btn) btn.addEventListener('click', () => {
        const dir = d.toLowerCase();
        const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
        if (dir !== opposites[direction]) nextDirection = dir;
        if (!running) startGame();
    });
});

init();
