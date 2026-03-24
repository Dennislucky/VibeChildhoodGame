const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nctx = nextCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const linesEl = document.getElementById('lines');
const messageEl = document.getElementById('message');

const COLS = 10, ROWS = 20, SZ = 25;
const COLORS = ['#00f0f0','#0000f0','#f0a000','#f0f000','#00f000','#a000f0','#f00000'];
const SHAPES = [
    [[1,1,1,1]],
    [[1,0,0],[1,1,1]],
    [[0,0,1],[1,1,1]],
    [[1,1],[1,1]],
    [[0,1,1],[1,1,0]],
    [[0,1,0],[1,1,1]],
    [[1,1,0],[0,1,1]]
];

let board, current, next, pos, score, level, lines, dropTimer, running, speed;

function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function randomPiece() {
    const i = Math.floor(Math.random() * SHAPES.length);
    return { shape: SHAPES[i].map(r => [...r]), color: i + 1 };
}

function rotate(shape) {
    const rows = shape.length, cols = shape[0].length;
    const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
            rotated[c][rows - 1 - r] = shape[r][c];
    return rotated;
}

function valid(shape, px, py) {
    for (let r = 0; r < shape.length; r++)
        for (let c = 0; c < shape[r].length; c++)
            if (shape[r][c]) {
                const x = px + c, y = py + r;
                if (x < 0 || x >= COLS || y >= ROWS) return false;
                if (y >= 0 && board[y][x]) return false;
            }
    return true;
}

function place() {
    const s = current.shape;
    for (let r = 0; r < s.length; r++)
        for (let c = 0; c < s[r].length; c++)
            if (s[r][c] && pos.y + r >= 0)
                board[pos.y + r][pos.x + c] = current.color;
    clearLines();
    current = next;
    next = randomPiece();
    pos = { x: Math.floor((COLS - current.shape[0].length) / 2), y: -current.shape.length };
    drawNext();
    if (!valid(current.shape, pos.x, pos.y + 1)) gameOver();
}

function clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r].every(c => c !== 0)) {
            board.splice(r, 1);
            board.unshift(Array(COLS).fill(0));
            cleared++;
            r++;
        }
    }
    if (cleared > 0) {
        const pts = [0, 100, 300, 500, 800];
        score += (pts[cleared] || 800) * level;
        lines += cleared;
        level = Math.floor(lines / 10) + 1;
        speed = Math.max(100, 800 - (level - 1) * 70);
        scoreEl.textContent = score;
        levelEl.textContent = level;
        linesEl.textContent = lines;
    }
}

function drawBlock(context, x, y, colorIdx, size) {
    if (colorIdx === 0) return;
    const color = COLORS[colorIdx - 1];
    context.fillStyle = color;
    context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
    context.fillStyle = 'rgba(255,255,255,0.2)';
    context.fillRect(x * size + 1, y * size + 1, size - 2, 3);
    context.fillRect(x * size + 1, y * size + 1, 3, size - 2);
}

function draw() {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
            ctx.strokeRect(c * SZ, r * SZ, SZ, SZ);
    // Board
    for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
            drawBlock(ctx, c, r, board[r][c], SZ);
    // Current piece
    if (current) {
        const s = current.shape;
        for (let r = 0; r < s.length; r++)
            for (let c = 0; c < s[r].length; c++)
                if (s[r][c] && pos.y + r >= 0)
                    drawBlock(ctx, pos.x + c, pos.y + r, current.color, SZ);
    }
}

function drawNext() {
    nctx.fillStyle = 'rgba(10,10,26,1)';
    nctx.fillRect(0, 0, 100, 100);
    if (!next) return;
    const s = next.shape;
    const ox = Math.floor((4 - s[0].length) / 2);
    const oy = Math.floor((4 - s.length) / 2);
    for (let r = 0; r < s.length; r++)
        for (let c = 0; c < s[r].length; c++)
            if (s[r][c]) drawBlock(nctx, ox + c, oy + r, next.color, 25);
}

function drop() {
    if (!running) return;
    if (valid(current.shape, pos.x, pos.y + 1)) {
        pos.y++;
    } else {
        place();
    }
    draw();
    dropTimer = setTimeout(drop, speed);
}

function gameOver() {
    running = false;
    clearTimeout(dropTimer);
    messageEl.textContent = `游戏结束！得分: ${score}  按空格重新开始`;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff4757';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2);
}

function startGame() {
    board = createBoard();
    score = 0; level = 1; lines = 0; speed = 800; running = true;
    scoreEl.textContent = 0; levelEl.textContent = 1; linesEl.textContent = 0;
    current = randomPiece();
    next = randomPiece();
    pos = { x: Math.floor((COLS - current.shape[0].length) / 2), y: 0 };
    drawNext();
    messageEl.textContent = '↑旋转 ↓加速 ←→移动';
    clearTimeout(dropTimer);
    drop();
}

document.addEventListener('keydown', e => {
    if (e.code === 'Space') { e.preventDefault(); startGame(); return; }
    if (!running) return;
    switch (e.key) {
        case 'ArrowLeft':
            if (valid(current.shape, pos.x - 1, pos.y)) pos.x--;
            break;
        case 'ArrowRight':
            if (valid(current.shape, pos.x + 1, pos.y)) pos.x++;
            break;
        case 'ArrowDown':
            if (valid(current.shape, pos.x, pos.y + 1)) { pos.y++; score++; scoreEl.textContent = score; }
            break;
        case 'ArrowUp':
            const rotated = rotate(current.shape);
            if (valid(rotated, pos.x, pos.y)) current.shape = rotated;
            break;
    }
    e.preventDefault();
    draw();
});

draw();
