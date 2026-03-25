const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const messageEl = document.getElementById('message');
const W = canvas.width, H = canvas.height;

let player, bullets, enemies, particles, stars;
let score, lives, running, shootTimer, enemyTimer, frame;
const keys = {};

function init() {
    player = { x: W / 2, y: H - 60, w: 30, h: 30, speed: 5 };
    bullets = []; enemies = []; particles = [];
    score = 0; lives = 3; frame = 0;
    scoreEl.textContent = 0;
    livesEl.textContent = '❤️'.repeat(lives);
    // Stars
    stars = Array.from({ length: 80 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        speed: 0.5 + Math.random() * 2, size: Math.random() * 2 + 0.5
    }));
}

function spawnEnemy() {
    const type = Math.random();
    let e;
    if (type > 0.85) {
        e = { x: Math.random() * (W - 40) + 20, y: -40, w: 35, h: 35, speed: 1.5, hp: 3, color: '#ff4757', points: 30, emoji: '🛸' };
    } else if (type > 0.5) {
        e = { x: Math.random() * (W - 30) + 15, y: -30, w: 28, h: 28, speed: 2.5, hp: 1, color: '#ffa502', points: 10, emoji: '🔴' };
    } else {
        e = { x: Math.random() * (W - 25) + 12, y: -25, w: 24, h: 24, speed: 2, hp: 2, color: '#ff6348', points: 20, emoji: '💥' };
    }
    enemies.push(e);
}

function explode(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x, y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
            life: 20 + Math.random() * 15, color
        });
    }
}

function collides(a, b) {
    return a.x - a.w / 2 < b.x + b.w / 2 && a.x + a.w / 2 > b.x - b.w / 2 &&
           a.y - a.h / 2 < b.y + b.h / 2 && a.y + a.h / 2 > b.y - b.h / 2;
}

function update() {
    frame++;
    // Player movement
    if (keys['ArrowLeft'] && player.x > player.w / 2) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < W - player.w / 2) player.x += player.speed;
    if (keys['ArrowUp'] && player.y > player.h / 2) player.y -= player.speed;
    if (keys['ArrowDown'] && player.y < H - player.h / 2) player.y += player.speed;

    // Auto shoot
    if (frame % 8 === 0) {
        bullets.push({ x: player.x, y: player.y - player.h / 2, w: 4, h: 12, speed: 8 });
    }

    // Spawn enemies
    const spawnRate = Math.max(20, 60 - Math.floor(score / 100));
    if (frame % spawnRate === 0) spawnEnemy();

    // Update bullets
    bullets.forEach(b => b.y -= b.speed);
    bullets = bullets.filter(b => b.y > -20);

    // Update enemies
    enemies.forEach(e => e.y += e.speed);

    // Bullet-enemy collision
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (collides(bullets[i], enemies[j])) {
                enemies[j].hp--;
                bullets.splice(i, 1);
                if (enemies[j].hp <= 0) {
                    score += enemies[j].points;
                    scoreEl.textContent = score;
                    explode(enemies[j].x, enemies[j].y, enemies[j].color);
                    enemies.splice(j, 1);
                }
                break;
            }
        }
    }

    // Enemy-player collision
    for (let j = enemies.length - 1; j >= 0; j--) {
        if (enemies[j].y > H + 20) { enemies.splice(j, 1); continue; }
        if (collides(player, enemies[j])) {
            explode(enemies[j].x, enemies[j].y, '#ff4757');
            enemies.splice(j, 1);
            lives--;
            livesEl.textContent = '❤️'.repeat(Math.max(0, lives));
            if (lives <= 0) return gameOver();
        }
    }

    // Update particles
    particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
    particles = particles.filter(p => p.life > 0);

    // Update stars
    stars.forEach(s => { s.y += s.speed; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } });
}

function draw() {
    ctx.fillStyle = '#050520';
    ctx.fillRect(0, 0, W, H);

    // Stars
    stars.forEach(s => {
        ctx.fillStyle = `rgba(255,255,255,${0.3 + s.speed / 3})`;
        ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // Bullets
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#0ff';
    bullets.forEach(b => {
        ctx.fillStyle = '#0ff';
        ctx.fillRect(b.x - b.w / 2, b.y, b.w, b.h);
    });
    ctx.shadowBlur = 0;

    // Player
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🛩️', player.x, player.y + 10);

    // Enemies
    enemies.forEach(e => {
        ctx.font = `${e.w}px Arial`;
        ctx.fillText(e.emoji, e.x, e.y + e.h / 3);
    });

    // Particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life / 30;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function gameLoop() {
    if (!running) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    running = false;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ff4757';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', W / 2, H / 2 - 20);
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText(`最终得分: ${score}`, W / 2, H / 2 + 20);
    messageEl.textContent = '按空格键重新开始';
}

function startGame() {
    init();
    running = true;
    messageEl.textContent = '←→↑↓移动 | 自动射击';
    gameLoop();
}

document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.code === 'Space') { e.preventDefault(); if (!running) startGame(); }
});
document.addEventListener('keyup', e => { keys[e.key] = false; });

// Touch / mouse control
let touching = false;
canvas.addEventListener('mousedown', e => { touching = true; movePlayer(e); });
canvas.addEventListener('mousemove', e => { if (touching) movePlayer(e); });
canvas.addEventListener('mouseup', () => { touching = false; });
canvas.addEventListener('touchstart', e => { e.preventDefault(); movePlayer(e.touches[0]); if (!running) startGame(); });
canvas.addEventListener('touchmove', e => { e.preventDefault(); movePlayer(e.touches[0]); });
function movePlayer(e) {
    const rect = canvas.getBoundingClientRect();
    player.x = (e.clientX - rect.left) * (W / rect.width);
    player.y = (e.clientY - rect.top) * (H / rect.height);
}

init(); draw();
