// 超级米拉奇 - Super Miraqi
// 经典横版过关冒险游戏

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 500;

let gameRunning = false;
let score = 0;
let currentLevel = 1;
const MAX_LEVEL = 3;
let cameraX = 0;
let keys = {};
let animFrame;

// 玩家
const player = {
    x: 50, y: 0, w: 32, h: 48,
    vx: 0, vy: 0,
    speed: 4, jumpForce: -12,
    hp: 100, maxHp: 100,
    onGround: false,
    facing: 1, // 1=right, -1=left
    attacking: false, attackTimer: 0,
    invincible: 0,
    frame: 0, frameTimer: 0
};

let platforms = [];
let enemies = [];
let coins = [];
let particles = [];
let levelWidth = 3200;

// 关卡生成
function generateLevel(lvl) {
    platforms = [];
    enemies = [];
    coins = [];
    particles = [];
    levelWidth = 2400 + lvl * 800;
    cameraX = 0;
    
    // 地面
    for (let x = 0; x < levelWidth; x += 80) {
        // 加入一些间隙
        if (lvl > 1 && Math.random() < 0.08 && x > 200 && x < levelWidth - 300) continue;
        platforms.push({ x, y: 450, w: 80, h: 50, type: 'ground' });
    }
    
    // 浮空平台
    const platCount = 15 + lvl * 8;
    for (let i = 0; i < platCount; i++) {
        const px = 200 + Math.random() * (levelWidth - 400);
        const py = 200 + Math.random() * 200;
        const pw = 60 + Math.random() * 80;
        platforms.push({ x: px, y: py, w: pw, h: 16, type: 'platform' });
    }
    
    // 敌人
    const enemyCount = 8 + lvl * 5;
    for (let i = 0; i < enemyCount; i++) {
        const ex = 300 + Math.random() * (levelWidth - 600);
        const etype = Math.random() < 0.3 + lvl * 0.1 ? 'flying' : 'ground';
        enemies.push({
            x: ex, y: etype === 'flying' ? 250 + Math.random() * 100 : 402,
            w: 30, h: 30,
            vx: (1 + Math.random()) * (Math.random() < 0.5 ? 1 : -1),
            vy: 0,
            type: etype,
            hp: etype === 'flying' ? 1 : 2,
            startX: ex,
            range: 80 + Math.random() * 120,
            frame: 0, frameTimer: 0
        });
    }
    
    // 金币
    const coinCount = 20 + lvl * 10;
    for (let i = 0; i < coinCount; i++) {
        coins.push({
            x: 100 + Math.random() * (levelWidth - 200),
            y: 150 + Math.random() * 280,
            w: 16, h: 16,
            collected: false,
            bob: Math.random() * Math.PI * 2
        });
    }
    
    // 关卡终点
    platforms.push({ x: levelWidth - 100, y: 350, w: 80, h: 100, type: 'goal' });
    
    // 重置玩家
    player.x = 50;
    player.y = 350;
    player.vx = 0;
    player.vy = 0;
    player.hp = player.maxHp;
    player.onGround = false;
    player.invincible = 0;
    updateHUD();
}

// 碰撞检测
function rectCollide(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
}

function update() {
    if (!gameRunning) return;
    
    // 玩家移动
    player.vx = 0;
    if (keys['ArrowLeft'] || keys['a'] || keys['left']) { player.vx = -player.speed; player.facing = -1; }
    if (keys['ArrowRight'] || keys['d'] || keys['right']) { player.vx = player.speed; player.facing = 1; }
    if ((keys['ArrowUp'] || keys['w'] || keys['jump']) && player.onGround) {
        player.vy = player.jumpForce;
        player.onGround = false;
    }
    if (keys[' '] || keys['attack']) {
        if (!player.attacking) {
            player.attacking = true;
            player.attackTimer = 15;
        }
    }
    
    // 重力
    player.vy += 0.6;
    if (player.vy > 15) player.vy = 15;
    
    player.x += player.vx;
    player.y += player.vy;
    
    // 平台碰撞
    player.onGround = false;
    for (const p of platforms) {
        if (p.type === 'goal') continue;
        if (rectCollide(player, p)) {
            // 从上方落下
            if (player.vy > 0 && player.y + player.h - player.vy <= p.y + 5) {
                player.y = p.y - player.h;
                player.vy = 0;
                player.onGround = true;
            }
            // 从下方撞击
            else if (player.vy < 0 && player.y - player.vy >= p.y + p.h - 5) {
                player.y = p.y + p.h;
                player.vy = 0;
            }
            // 侧面碰撞
            else if (player.vx > 0) {
                player.x = p.x - player.w;
            } else if (player.vx < 0) {
                player.x = p.x + p.w;
            }
        }
    }
    
    // 掉落检测
    if (player.y > canvas.height + 100) {
        player.hp = 0;
    }
    
    // 攻击
    if (player.attacking) {
        player.attackTimer--;
        if (player.attackTimer <= 0) player.attacking = false;
        
        const atkBox = {
            x: player.facing > 0 ? player.x + player.w : player.x - 40,
            y: player.y + 5,
            w: 40, h: 40
        };
        
        for (let i = enemies.length - 1; i >= 0; i--) {
            if (rectCollide(atkBox, enemies[i])) {
                enemies[i].hp--;
                enemies[i].vx = player.facing * 5;
                if (enemies[i].hp <= 0) {
                    score += enemies[i].type === 'flying' ? 150 : 100;
                    spawnParticles(enemies[i].x, enemies[i].y, '#ff4444', 8);
                    enemies.splice(i, 1);
                }
            }
        }
    }
    
    // 无敌时间
    if (player.invincible > 0) player.invincible--;
    
    // 敌人更新
    for (const e of enemies) {
        if (e.type === 'ground') {
            e.x += e.vx;
            if (Math.abs(e.x - e.startX) > e.range) e.vx *= -1;
        } else {
            e.x += e.vx;
            e.y += Math.sin(Date.now() / 300 + e.startX) * 0.8;
            if (Math.abs(e.x - e.startX) > e.range) e.vx *= -1;
        }
        
        // 敌人碰撞玩家
        if (player.invincible <= 0 && rectCollide(player, e)) {
            // 踩踏
            if (player.vy > 0 && player.y + player.h < e.y + e.h / 2 + 10) {
                e.hp--;
                player.vy = -8;
                score += 50;
                if (e.hp <= 0) {
                    spawnParticles(e.x, e.y, '#ff4444', 8);
                    enemies.splice(enemies.indexOf(e), 1);
                }
            } else {
                player.hp -= 20;
                player.invincible = 60;
                player.vx = -player.facing * 5;
                player.vy = -5;
                spawnParticles(player.x, player.y, '#ffaa00', 5);
            }
        }
        
        e.frameTimer++;
        if (e.frameTimer > 10) { e.frame = (e.frame + 1) % 2; e.frameTimer = 0; }
    }
    
    // 金币
    for (const c of coins) {
        if (!c.collected && rectCollide(player, c)) {
            c.collected = true;
            score += 10;
            spawnParticles(c.x, c.y, '#ffcc00', 5);
        }
        c.bob += 0.05;
    }
    
    // 检查到达终点
    const goal = platforms.find(p => p.type === 'goal');
    if (goal && rectCollide(player, goal)) {
        if (currentLevel < MAX_LEVEL) {
            currentLevel++;
            generateLevel(currentLevel);
            return;
        } else {
            winGame();
            return;
        }
    }
    
    // 粒子
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
    
    // 摄像机
    const targetCamX = player.x - canvas.width / 3;
    cameraX += (targetCamX - cameraX) * 0.08;
    if (cameraX < 0) cameraX = 0;
    if (cameraX > levelWidth - canvas.width) cameraX = levelWidth - canvas.width;
    
    // 边界
    if (player.x < 0) player.x = 0;
    if (player.x > levelWidth - player.w) player.x = levelWidth - player.w;
    
    // 动画帧
    if (player.vx !== 0) {
        player.frameTimer++;
        if (player.frameTimer > 6) { player.frame = (player.frame + 1) % 4; player.frameTimer = 0; }
    } else {
        player.frame = 0;
    }
    
    // HP检查
    if (player.hp <= 0) {
        gameOver();
        return;
    }
    
    updateHUD();
}

function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6 - 2,
            life: 20 + Math.random() * 20,
            color, size: 3 + Math.random() * 4
        });
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 天空背景
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (currentLevel === 1) {
        gradient.addColorStop(0, '#4FC3F7');
        gradient.addColorStop(1, '#81D4FA');
    } else if (currentLevel === 2) {
        gradient.addColorStop(0, '#FF8A65');
        gradient.addColorStop(1, '#FFCC80');
    } else {
        gradient.addColorStop(0, '#5C6BC0');
        gradient.addColorStop(1, '#7986CB');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 远景山脉
    drawMountains();
    
    ctx.save();
    ctx.translate(-cameraX, 0);
    
    // 平台
    for (const p of platforms) {
        if (p.x + p.w < cameraX - 50 || p.x > cameraX + canvas.width + 50) continue;
        if (p.type === 'ground') {
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(p.x, p.y, p.w, p.h);
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(p.x, p.y + 10, p.w, p.h - 10);
            // 草丛纹理
            ctx.fillStyle = '#66BB6A';
            for (let gx = p.x; gx < p.x + p.w; gx += 8) {
                ctx.fillRect(gx, p.y - 2, 6, 5);
            }
        } else if (p.type === 'platform') {
            ctx.fillStyle = '#795548';
            ctx.fillRect(p.x, p.y, p.w, p.h);
            ctx.fillStyle = '#8D6E63';
            ctx.fillRect(p.x + 2, p.y + 2, p.w - 4, 4);
        } else if (p.type === 'goal') {
            // 终点旗帜
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(p.x + 35, p.y, 10, p.h);
            ctx.fillStyle = '#FF1744';
            ctx.beginPath();
            ctx.moveTo(p.x + 45, p.y);
            ctx.lineTo(p.x + 80, p.y + 20);
            ctx.lineTo(p.x + 45, p.y + 40);
            ctx.fill();
            // 闪光效果
            ctx.fillStyle = `rgba(255, 215, 0, ${0.3 + Math.sin(Date.now() / 300) * 0.2})`;
            ctx.beginPath();
            ctx.arc(p.x + 50, p.y + 50, 40, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 金币
    for (const c of coins) {
        if (c.collected) continue;
        if (c.x < cameraX - 20 || c.x > cameraX + canvas.width + 20) continue;
        const bobY = Math.sin(c.bob) * 3;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(c.x + 8, c.y + 8 + bobY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFF176';
        ctx.beginPath();
        ctx.arc(c.x + 6, c.y + 6 + bobY, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 敌人
    for (const e of enemies) {
        if (e.x < cameraX - 50 || e.x > cameraX + canvas.width + 50) continue;
        if (e.type === 'ground') {
            // 地面怪物 - 刺猬样
            ctx.fillStyle = '#E53935';
            ctx.fillRect(e.x, e.y, e.w, e.h);
            // 眼睛
            ctx.fillStyle = '#fff';
            const eyeX = e.vx > 0 ? e.x + 18 : e.x + 6;
            ctx.fillRect(eyeX, e.y + 8, 8, 8);
            ctx.fillStyle = '#000';
            ctx.fillRect(eyeX + 2, e.y + 10, 4, 4);
            // 刺
            ctx.fillStyle = '#B71C1C';
            for (let si = 0; si < 4; si++) {
                ctx.beginPath();
                ctx.moveTo(e.x + si * 10, e.y);
                ctx.lineTo(e.x + si * 10 + 5, e.y - 8);
                ctx.lineTo(e.x + si * 10 + 10, e.y);
                ctx.fill();
            }
        } else {
            // 飞行怪物 - 蝙蝠样
            ctx.fillStyle = '#7B1FA2';
            ctx.beginPath();
            ctx.arc(e.x + 15, e.y + 15, 12, 0, Math.PI * 2);
            ctx.fill();
            // 翅膀
            const wingY = e.frame === 0 ? -5 : 5;
            ctx.fillStyle = '#9C27B0';
            ctx.beginPath();
            ctx.ellipse(e.x, e.y + 12 + wingY, 12, 6, -0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(e.x + 30, e.y + 12 + wingY, 12, 6, 0.3, 0, Math.PI * 2);
            ctx.fill();
            // 眼睛
            ctx.fillStyle = '#FF5252';
            ctx.fillRect(e.x + 10, e.y + 10, 4, 4);
            ctx.fillRect(e.x + 18, e.y + 10, 4, 4);
        }
    }
    
    // 玩家
    drawPlayer();
    
    // 粒子
    for (const p of particles) {
        ctx.globalAlpha = p.life / 40;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    
    ctx.restore();
}

function drawPlayer() {
    ctx.save();
    
    // 无敌闪烁
    if (player.invincible > 0 && Math.floor(player.invincible / 3) % 2) {
        ctx.globalAlpha = 0.4;
    }
    
    const px = player.x;
    const py = player.y;
    
    ctx.save();
    if (player.facing < 0) {
        ctx.translate(px + player.w / 2, 0);
        ctx.scale(-1, 1);
        ctx.translate(-(px + player.w / 2), 0);
    }
    
    // 身体
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(px + 6, py + 16, 20, 20);
    
    // 头
    ctx.fillStyle = '#FFCC80';
    ctx.beginPath();
    ctx.arc(px + 16, py + 12, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // 头发/帽子
    ctx.fillStyle = '#FF5722';
    ctx.beginPath();
    ctx.ellipse(px + 16, py + 5, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(px + 4, py + 4, 24, 5);
    
    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.fillRect(px + 14, py + 8, 7, 6);
    ctx.fillStyle = '#000';
    ctx.fillRect(px + 17, py + 9, 3, 4);
    
    // 腿 (动画)
    ctx.fillStyle = '#1565C0';
    const legOffset = player.onGround ? Math.sin(player.frame * Math.PI / 2) * 4 : 0;
    ctx.fillRect(px + 8, py + 36, 7, 12 + legOffset);
    ctx.fillRect(px + 18, py + 36, 7, 12 - legOffset);
    
    // 鞋子
    ctx.fillStyle = '#795548';
    ctx.fillRect(px + 6, py + 44 + legOffset, 10, 4);
    ctx.fillRect(px + 17, py + 44 - legOffset, 10, 4);
    
    // 攻击效果
    if (player.attacking) {
        ctx.fillStyle = 'rgba(255, 235, 59, 0.7)';
        ctx.beginPath();
        ctx.arc(px + player.w + 10, py + 20, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FF9800';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px + player.w + 10, py + 20, 18, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    ctx.restore();
    ctx.restore();
}

function drawMountains() {
    const parallax = cameraX * 0.2;
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    for (let i = 0; i < 6; i++) {
        const mx = i * 250 - parallax % 250;
        ctx.beginPath();
        ctx.moveTo(mx - 50, canvas.height);
        ctx.lineTo(mx + 80, 200 + Math.sin(i * 1.5) * 50);
        ctx.lineTo(mx + 210, canvas.height);
        ctx.fill();
    }
    
    // 云朵
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 5; i++) {
        const cx = (i * 300 + 100 - parallax * 0.5) % (canvas.width + 200) - 100;
        const cy = 60 + i * 25;
        ctx.beginPath();
        ctx.arc(cx, cy, 25, 0, Math.PI * 2);
        ctx.arc(cx + 25, cy - 10, 20, 0, Math.PI * 2);
        ctx.arc(cx + 50, cy, 25, 0, Math.PI * 2);
        ctx.fill();
    }
}

function updateHUD() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = currentLevel;
    document.getElementById('hp-fill').style.width = Math.max(0, (player.hp / player.maxHp) * 100) + '%';
}

function gameLoop() {
    update();
    draw();
    animFrame = requestAnimationFrame(gameLoop);
}

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('gameover-screen').style.display = 'none';
    document.getElementById('win-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    
    score = 0;
    currentLevel = 1;
    gameRunning = true;
    generateLevel(1);
    
    if (animFrame) cancelAnimationFrame(animFrame);
    gameLoop();
}

function gameOver() {
    gameRunning = false;
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('gameover-screen').style.display = 'block';
    document.getElementById('final-score').textContent = score;
    document.getElementById('final-level').textContent = currentLevel;
}

function winGame() {
    gameRunning = false;
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('win-screen').style.display = 'block';
    document.getElementById('win-score').textContent = score;
}

// 键盘控制
document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
});
document.addEventListener('keyup', e => { keys[e.key] = false; });

// 手机触控
function setupMobileBtn(id, key) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('touchstart', e => { e.preventDefault(); keys[key] = true; });
    btn.addEventListener('touchend', e => { e.preventDefault(); keys[key] = false; });
    btn.addEventListener('mousedown', e => { keys[key] = true; });
    btn.addEventListener('mouseup', e => { keys[key] = false; });
}
setupMobileBtn('btn-left', 'left');
setupMobileBtn('btn-right', 'right');
setupMobileBtn('btn-jump', 'jump');
setupMobileBtn('btn-attack', 'attack');
