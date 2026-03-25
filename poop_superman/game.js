// 大便超人 - Poop Superman
// 横版飞行射击游戏

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 500;

let gameRunning = false;
let score = 0;
let lives = 3;
let energy = 100;
let scrollSpeed = 2;
let difficulty = 1;
let animFrame;
let bestScore = parseInt(localStorage.getItem('poopSupermanBest') || '0');

const keys = {};
let touchY = null;

const hero = {
    x: 120, y: 250, w: 40, h: 40,
    vy: 0,
    invincible: 0,
    frame: 0, frameTimer: 0,
    cape: 0
};

let bombs = [];       // 玩家的便便炸弹
let enemies = [];     // 敌人
let buildings = [];   // 背景建筑
let clouds = [];      // 云朵
let particles = [];   // 粒子
let powerups = [];    // 道具
let bgOffset = 0;

function initBackground() {
    buildings = [];
    clouds = [];
    for (let i = 0; i < 15; i++) {
        buildings.push({
            x: i * 120,
            w: 40 + Math.random() * 60,
            h: 80 + Math.random() * 150,
            color: `hsl(${Math.random()*30 + 10}, 20%, ${30 + Math.random()*20}%)`
        });
    }
    for (let i = 0; i < 8; i++) {
        clouds.push({
            x: Math.random() * canvas.width,
            y: 30 + Math.random() * 120,
            w: 50 + Math.random() * 80,
            speed: 0.3 + Math.random() * 0.5
        });
    }
}

function spawnEnemy() {
    const types = ['bird', 'plane', 'ufo'];
    const type = types[Math.floor(Math.random() * Math.min(types.length, 1 + difficulty))];
    
    const e = {
        x: canvas.width + 30,
        y: 40 + Math.random() * (canvas.height - 140),
        w: 35, h: 25,
        type, speed: 2 + Math.random() * difficulty,
        hp: type === 'ufo' ? 3 : type === 'plane' ? 2 : 1,
        frame: 0, frameTimer: 0,
        shootTimer: type === 'ufo' ? 60 : 0,
        amplitude: type === 'bird' ? 30 + Math.random() * 20 : 0,
        baseY: 0
    };
    e.baseY = e.y;
    enemies.push(e);
}

function spawnPowerup() {
    const type = Math.random() < 0.5 ? 'heart' : 'star';
    powerups.push({
        x: canvas.width + 20,
        y: 50 + Math.random() * (canvas.height - 150),
        w: 20, h: 20,
        type,
        speed: 1.5
    });
}

function shootBomb() {
    if (energy < 10) return;
    energy -= 10;
    
    bombs.push({
        x: hero.x + hero.w,
        y: hero.y + hero.h / 2,
        vx: 8, vy: 2,
        size: 10,
        life: 80
    });
}

function update() {
    if (!gameRunning) return;
    
    // 难度递增
    difficulty = 1 + score / 500;
    scrollSpeed = 2 + score / 1000;
    
    // 玩家移动
    if (keys['ArrowUp'] || keys['w']) hero.vy -= 0.6;
    if (keys['ArrowDown'] || keys['s']) hero.vy += 0.6;
    
    if (touchY !== null) {
        const diff = touchY - hero.y;
        hero.vy += diff * 0.05;
    }
    
    hero.vy *= 0.92;
    hero.y += hero.vy;
    hero.y = Math.max(10, Math.min(canvas.height - hero.h - 40, hero.y));
    
    // 无敌时间
    if (hero.invincible > 0) hero.invincible--;
    
    // 能量恢复
    if (energy < 100) energy += 0.15;
    
    // 动画
    hero.frameTimer++;
    if (hero.frameTimer > 6) { hero.frame = (hero.frame + 1) % 4; hero.frameTimer = 0; }
    hero.cape += 0.15;
    
    // 便便炸弹
    for (let i = bombs.length - 1; i >= 0; i--) {
        const b = bombs[i];
        b.x += b.vx;
        b.y += b.vy;
        b.vy += 0.08;
        b.life--;
        
        if (b.life <= 0 || b.x > canvas.width || b.y > canvas.height) {
            // 砸到地面爆炸
            if (b.y > canvas.height - 50) {
                spawnSplatParticles(b.x, canvas.height - 50);
                score += 5;
            }
            bombs.splice(i, 1);
            continue;
        }
        
        // 击中敌人
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (Math.hypot(b.x - (e.x + e.w/2), b.y - (e.y + e.h/2)) < 25) {
                e.hp--;
                spawnSplatParticles(b.x, b.y);
                bombs.splice(i, 1);
                
                if (e.hp <= 0) {
                    score += e.type === 'ufo' ? 150 : e.type === 'plane' ? 100 : 50;
                    spawnExplosion(e.x, e.y);
                    enemies.splice(j, 1);
                }
                break;
            }
        }
    }
    
    // 敌人
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.x -= e.speed + scrollSpeed;
        
        if (e.type === 'bird') {
            e.y = e.baseY + Math.sin(Date.now() / 500 + e.baseY) * e.amplitude;
        }
        
        e.frameTimer++;
        if (e.frameTimer > 8) { e.frame = (e.frame + 1) % 2; e.frameTimer = 0; }
        
        // UFO射击
        if (e.type === 'ufo') {
            e.shootTimer--;
            if (e.shootTimer <= 0) {
                e.shootTimer = Math.max(30, 80 - difficulty * 5);
                // 发射子弹
                const angle = Math.atan2(hero.y - e.y, hero.x - e.x);
                enemies.push({
                    x: e.x, y: e.y + e.h/2,
                    w: 8, h: 8,
                    type: 'bullet',
                    speed: 4,
                    vx: Math.cos(angle) * 4,
                    vy: Math.sin(angle) * 4,
                    hp: 1, frame: 0, frameTimer: 0
                });
            }
        }
        
        // 子弹移动
        if (e.type === 'bullet') {
            e.x += (e.vx || 0);
            e.y += (e.vy || 0);
        }
        
        if (e.x < -50) { enemies.splice(i, 1); continue; }
        
        // 碰撞玩家
        if (hero.invincible <= 0 &&
            Math.abs((e.x + e.w/2) - (hero.x + hero.w/2)) < 30 &&
            Math.abs((e.y + e.h/2) - (hero.y + hero.h/2)) < 30) {
            lives--;
            hero.invincible = 90;
            spawnExplosion(hero.x, hero.y);
            if (e.type === 'bullet') enemies.splice(i, 1);
            
            if (lives <= 0) {
                gameOver();
                return;
            }
        }
    }
    
    // 道具
    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        p.x -= p.speed + scrollSpeed;
        
        if (p.x < -30) { powerups.splice(i, 1); continue; }
        
        if (Math.hypot(p.x - hero.x, p.y - hero.y) < 30) {
            if (p.type === 'heart') {
                lives = Math.min(5, lives + 1);
            } else {
                score += 200;
                energy = 100;
            }
            spawnParticles(p.x, p.y, p.type === 'heart' ? '#ff4444' : '#FFD700', 10);
            powerups.splice(i, 1);
        }
    }
    
    // 生成
    if (Math.random() < 0.02 + difficulty * 0.005) spawnEnemy();
    if (Math.random() < 0.003) spawnPowerup();
    
    // 背景滚动
    bgOffset += scrollSpeed;
    
    for (const c of clouds) {
        c.x -= c.speed;
        if (c.x < -c.w) c.x = canvas.width + c.w;
    }
    
    // 粒子
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.1;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
    
    updateHUD();
}

function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 20 + Math.random() * 15,
            color, size: 2 + Math.random() * 4
        });
    }
}

function spawnSplatParticles(x, y) {
    for (let i = 0; i < 12; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 20 + Math.random() * 15,
            color: Math.random() < 0.5 ? '#8B4513' : '#D2691E',
            size: 3 + Math.random() * 5
        });
    }
}

function spawnExplosion(x, y) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 25 + Math.random() * 20,
            color: ['#FF5722', '#FF9800', '#FFEB3B', '#fff'][Math.floor(Math.random()*4)],
            size: 3 + Math.random() * 6
        });
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 天空
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#4FC3F7');
    skyGrad.addColorStop(0.7, '#B3E5FC');
    skyGrad.addColorStop(1, '#E0F7FA');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 太阳
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath();
    ctx.arc(700, 60, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,235,59,0.3)';
    ctx.beginPath();
    ctx.arc(700, 60, 50, 0, Math.PI * 2);
    ctx.fill();
    
    // 云
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (const c of clouds) {
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.w * 0.3, 0, Math.PI * 2);
        ctx.arc(c.x + c.w * 0.25, c.y - c.w * 0.12, c.w * 0.25, 0, Math.PI * 2);
        ctx.arc(c.x + c.w * 0.5, c.y, c.w * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 建筑
    for (const b of buildings) {
        const bx = ((b.x - bgOffset * 0.3) % (15 * 120) + 15 * 120) % (15 * 120) - 120;
        ctx.fillStyle = b.color;
        ctx.fillRect(bx, canvas.height - b.h, b.w, b.h);
        // 窗户
        ctx.fillStyle = 'rgba(255,255,150,0.5)';
        for (let wy = canvas.height - b.h + 15; wy < canvas.height - 15; wy += 25) {
            for (let wx = bx + 8; wx < bx + b.w - 8; wx += 15) {
                ctx.fillRect(wx, wy, 8, 12);
            }
        }
    }
    
    // 地面
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
    
    // 道具
    for (const p of powerups) {
        const bob = Math.sin(Date.now() / 300 + p.x) * 3;
        if (p.type === 'heart') {
            ctx.fillStyle = '#ff4444';
            ctx.font = '20px sans-serif';
            ctx.fillText('❤️', p.x - 10, p.y + 6 + bob);
        } else {
            ctx.fillStyle = '#FFD700';
            ctx.font = '20px sans-serif';
            ctx.fillText('⭐', p.x - 10, p.y + 6 + bob);
        }
    }
    
    // 敌人
    for (const e of enemies) {
        if (e.type === 'bird') {
            drawBird(e);
        } else if (e.type === 'plane') {
            drawPlane(e);
        } else if (e.type === 'ufo') {
            drawUFO(e);
        } else if (e.type === 'bullet') {
            ctx.fillStyle = '#FF1744';
            ctx.beginPath();
            ctx.arc(e.x, e.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,23,68,0.3)';
            ctx.beginPath();
            ctx.arc(e.x, e.y, 7, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 便便炸弹
    for (const b of bombs) {
        drawPoop(b.x, b.y, b.size);
        // 拖尾
        ctx.fillStyle = 'rgba(139,69,19,0.3)';
        ctx.beginPath();
        ctx.arc(b.x - 8, b.y - 4, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 大便超人
    drawHero();
    
    // 粒子
    for (const p of particles) {
        ctx.globalAlpha = p.life / 35;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawHero() {
    ctx.save();
    
    if (hero.invincible > 0 && Math.floor(hero.invincible / 3) % 2) {
        ctx.globalAlpha = 0.4;
    }
    
    const hx = hero.x;
    const hy = hero.y;
    
    // 披风
    ctx.fillStyle = '#FF1744';
    ctx.beginPath();
    const capeWave = Math.sin(hero.cape) * 5;
    ctx.moveTo(hx + 5, hy + 10);
    ctx.quadraticCurveTo(hx - 15, hy + 25 + capeWave, hx - 10, hy + 40);
    ctx.quadraticCurveTo(hx - 5, hy + 35, hx + 5, hy + 30);
    ctx.fill();
    
    // 身体 (便便形状)
    ctx.fillStyle = '#8B4513';
    // 底部
    ctx.beginPath();
    ctx.ellipse(hx + 20, hy + 28, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    // 中间
    ctx.beginPath();
    ctx.ellipse(hx + 20, hy + 18, 12, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    // 顶部 (卷)
    ctx.beginPath();
    ctx.ellipse(hx + 22, hy + 8, 8, 8, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // 高光
    ctx.fillStyle = '#A0522D';
    ctx.beginPath();
    ctx.ellipse(hx + 16, hy + 15, 4, 6, -0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(hx + 18, hy + 16, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(hx + 28, hy + 16, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(hx + 20, hy + 16, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(hx + 30, hy + 16, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // 笑脸
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(hx + 24, hy + 22, 6, 0.1, Math.PI - 0.1);
    ctx.stroke();
    
    // S标志
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('S', hx + 17, hy + 32);
    
    // 手臂 (伸向前方)
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    const armY = hy + 20 + Math.sin(hero.frame * 0.5) * 2;
    ctx.beginPath();
    ctx.moveTo(hx + 35, armY);
    ctx.lineTo(hx + 48, armY - 5);
    ctx.stroke();
    
    // 拳头
    ctx.fillStyle = '#A0522D';
    ctx.beginPath();
    ctx.arc(hx + 48, armY - 5, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawPoop(x, y, size) {
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.ellipse(x, y + 2, size * 0.8, size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x, y - 2, size * 0.6, size * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 1, y - 5, size * 0.3, size * 0.3, 0.3, 0, Math.PI * 2);
    ctx.fill();
}

function drawBird(e) {
    ctx.fillStyle = '#E53935';
    ctx.beginPath();
    ctx.ellipse(e.x + e.w/2, e.y + e.h/2, e.w/2, e.h/2, 0, 0, Math.PI * 2);
    ctx.fill();
    // 翅膀
    ctx.fillStyle = '#C62828';
    const wingFlap = e.frame === 0 ? -8 : 5;
    ctx.beginPath();
    ctx.ellipse(e.x + e.w/2 - 5, e.y + wingFlap + e.h/2, 12, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(e.x + 8, e.y + e.h/2 - 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(e.x + 7, e.y + e.h/2 - 3, 2, 0, Math.PI * 2);
    ctx.fill();
    // 嘴
    ctx.fillStyle = '#FF9800';
    ctx.beginPath();
    ctx.moveTo(e.x, e.y + e.h/2);
    ctx.lineTo(e.x - 8, e.y + e.h/2 + 3);
    ctx.lineTo(e.x, e.y + e.h/2 + 5);
    ctx.fill();
}

function drawPlane(e) {
    ctx.fillStyle = '#607D8B';
    ctx.fillRect(e.x, e.y + 8, e.w, 12);
    ctx.fillStyle = '#90A4AE';
    // 机翼
    ctx.beginPath();
    ctx.moveTo(e.x + 10, e.y + 14);
    ctx.lineTo(e.x + 20, e.y);
    ctx.lineTo(e.x + 25, e.y + 8);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(e.x + 10, e.y + 14);
    ctx.lineTo(e.x + 20, e.y + 28);
    ctx.lineTo(e.x + 25, e.y + 20);
    ctx.fill();
    // 机头
    ctx.fillStyle = '#F44336';
    ctx.beginPath();
    ctx.moveTo(e.x, e.y + 8);
    ctx.lineTo(e.x - 8, e.y + 14);
    ctx.lineTo(e.x, e.y + 20);
    ctx.fill();
}

function drawUFO(e) {
    // 光束
    ctx.fillStyle = `rgba(76,175,80,${0.15 + Math.sin(Date.now()/200) * 0.1})`;
    ctx.beginPath();
    ctx.moveTo(e.x + 5, e.y + e.h);
    ctx.lineTo(e.x - 15, e.y + e.h + 60);
    ctx.lineTo(e.x + e.w + 15, e.y + e.h + 60);
    ctx.lineTo(e.x + e.w - 5, e.y + e.h);
    ctx.fill();
    
    // 碟身
    ctx.fillStyle = '#78909C';
    ctx.beginPath();
    ctx.ellipse(e.x + e.w/2, e.y + e.h/2 + 3, e.w/2 + 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 舱罩
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.ellipse(e.x + e.w/2, e.y + e.h/2 - 3, 10, 10, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.ellipse(e.x + e.w/2 - 3, e.y + e.h/2 - 6, 4, 5, 0, Math.PI, 0);
    ctx.fill();
    
    // 灯
    const lightPhase = Date.now() / 100;
    for (let li = 0; li < 5; li++) {
        const lAngle = li * Math.PI * 2 / 5 + lightPhase;
        const lx = e.x + e.w/2 + Math.cos(lAngle) * (e.w/2 + 2);
        const ly = e.y + e.h/2 + 3 + Math.sin(lAngle) * 4;
        ctx.fillStyle = li % 2 === 0 ? '#FFEB3B' : '#FF5722';
        ctx.beginPath();
        ctx.arc(lx, ly, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function updateHUD() {
    document.getElementById('lives').textContent = lives;
    document.getElementById('score').textContent = score;
    document.getElementById('energy').textContent = Math.floor(energy);
}

function gameLoop() {
    update();
    draw();
    if (gameRunning) animFrame = requestAnimationFrame(gameLoop);
}

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('gameover-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    
    score = 0; lives = 3; energy = 100; difficulty = 1; scrollSpeed = 2;
    hero.x = 120; hero.y = 250; hero.vy = 0; hero.invincible = 0;
    bombs = []; enemies = []; particles = []; powerups = [];
    bgOffset = 0;
    
    initBackground();
    gameRunning = true;
    updateHUD();
    
    if (animFrame) cancelAnimationFrame(animFrame);
    gameLoop();
}

function gameOver() {
    gameRunning = false;
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('poopSupermanBest', bestScore.toString());
    }
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('gameover-screen').style.display = 'block';
    document.getElementById('final-score').textContent = score;
    document.getElementById('best-score').textContent = bestScore;
}

// 控制
document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === ' ') { e.preventDefault(); shootBomb(); }
    if (['ArrowUp','ArrowDown'].includes(e.key)) e.preventDefault();
});
document.addEventListener('keyup', e => { keys[e.key] = false; });

// 触控
canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const ty = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height);
    const tx = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
    touchY = ty;
    if (tx > canvas.width / 2) shootBomb();
});
canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    touchY = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height);
});
canvas.addEventListener('touchend', () => { touchY = null; });
