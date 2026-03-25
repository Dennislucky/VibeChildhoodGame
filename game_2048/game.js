const boardEl = document.getElementById('board');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const messageEl = document.getElementById('message');
const newGameBtn = document.getElementById('newGameBtn');

const SIZE = 4;
let grid, score, best, moved;

function init() {
    grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    score = 0;
    best = parseInt(localStorage.getItem('best2048') || '0');
    scoreEl.textContent = score;
    bestEl.textContent = best;
    messageEl.textContent = '使用方向键滑动合并数字';
    addTile();
    addTile();
    render();
}

function addTile() {
    const empty = [];
    for (let r = 0; r < SIZE; r++)
        for (let c = 0; c < SIZE; c++)
            if (grid[r][c] === 0) empty.push({ r, c });
    if (empty.length === 0) return;
    const cell = empty[Math.floor(Math.random() * empty.length)];
    grid[cell.r][cell.c] = Math.random() < 0.9 ? 2 : 4;
    return cell;
}

function render(newCell) {
    boardEl.innerHTML = '';
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const tile = document.createElement('div');
            const val = grid[r][c];
            const cls = val <= 2048 ? `tile-${val}` : 'tile-super';
            tile.className = `tile ${cls}`;
            if (newCell && newCell.r === r && newCell.c === c) tile.classList.add('tile-new');
            tile.textContent = val || '';
            boardEl.appendChild(tile);
        }
    }
}

function slide(row) {
    let arr = row.filter(v => v !== 0);
    moved = moved || arr.length !== row.filter(v => v !== 0).length || arr.some((v, i) => {
        const origFiltered = row.filter(v2 => v2 !== 0);
        return v !== origFiltered[i];
    });
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) {
            arr[i] *= 2;
            score += arr[i];
            arr.splice(i + 1, 1);
            moved = true;
        }
    }
    while (arr.length < SIZE) arr.push(0);
    // Check if row actually changed
    for (let i = 0; i < SIZE; i++) {
        if (arr[i] !== row[i]) moved = true;
    }
    return arr;
}

function move(dir) {
    moved = false;
    let rotated = JSON.parse(JSON.stringify(grid));

    if (dir === 'left') {
        for (let r = 0; r < SIZE; r++) grid[r] = slide(grid[r]);
    } else if (dir === 'right') {
        for (let r = 0; r < SIZE; r++) grid[r] = slide(grid[r].reverse()).reverse();
    } else if (dir === 'up') {
        for (let c = 0; c < SIZE; c++) {
            let col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
            col = slide(col);
            for (let r = 0; r < SIZE; r++) grid[r][c] = col[r];
        }
    } else if (dir === 'down') {
        for (let c = 0; c < SIZE; c++) {
            let col = [grid[3][c], grid[2][c], grid[1][c], grid[0][c]];
            col = slide(col);
            for (let r = 0; r < SIZE; r++) grid[r][c] = col[SIZE - 1 - r];
        }
    }

    if (moved) {
        const newCell = addTile();
        scoreEl.textContent = score;
        if (score > best) {
            best = score;
            bestEl.textContent = best;
            localStorage.setItem('best2048', String(best));
        }
        render(newCell);
        if (checkWin()) messageEl.textContent = '🎉 恭喜你达到2048！继续挑战更高分！';
        if (checkLose()) messageEl.textContent = '游戏结束！没有可用的移动了';
    }
}

function checkWin() {
    return grid.some(row => row.some(v => v === 2048));
}

function checkLose() {
    for (let r = 0; r < SIZE; r++)
        for (let c = 0; c < SIZE; c++) {
            if (grid[r][c] === 0) return false;
            if (c < SIZE - 1 && grid[r][c] === grid[r][c + 1]) return false;
            if (r < SIZE - 1 && grid[r][c] === grid[r + 1][c]) return false;
        }
    return true;
}

document.addEventListener('keydown', e => {
    const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
    if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
});

// Swipe support
let startX, startY;
boardEl.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
});
boardEl.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    const absDx = Math.abs(dx), absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) < 30) return;
    if (absDx > absDy) move(dx > 0 ? 'right' : 'left');
    else move(dy > 0 ? 'down' : 'up');
});

newGameBtn.addEventListener('click', init);
init();
