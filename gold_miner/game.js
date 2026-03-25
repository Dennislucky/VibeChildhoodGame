// 黄金矿工 - Gold Miner
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 550;

let gameRunning = false;
let money = 0;
let level = 1;
let target = 200;
let timer = 30;
let timerInterval;
let animFrame;

// 钩子
const hook = {
    x: 400, y: 60,
    angle: 0,        // 摆动角度
    swingSpeed: 0.02, // 摆动速度
    swingDir: 1,
    state: 'swing',   // swing, dropping, pulling
    lineLen: 0,       // 绳索长度
    maxLen: 500,
    dropSpeed: 5,
    pullSpeed: 3,
    grabbed: null      // 抓到的物品
};

let items = []; // 地下物品
let particles = [];
let scorePopups = [];

const ITEM_TYPES = {
    smallGold: { color: '#FFD700', value: 50, size: 15, weight: 1, label: '小金块' },
    bigGold: { color: '#FFA000', value: 200, size: 30, weight: 3, label: '大金块' },
    diamond: { color: '#00BCD4', value: 500, size: 12, weight: 0.5, label: '钻石' },
    rock: { color: '#9E9E9E', value: 10, size: 25, weight: 4, label: '石头' },
    bone: { color: '#EFEBE9', value: 5, size: 20, weight: 1, label: '骨头' },
    dynamite: { color: '#F44336', value: 0, size: 14, weight: 0.5, label: '炸药' }
};

function generateItems() {
    items = [];
    const count = 8 + level * 3;
    
    for (let i = 0; i < count; i++) {
        const types = Object.keys(ITEM_TYPES);
        // 随关卡调整概率
        let weights;
        if (level <= 2) {
            weights = [35, 15, 5, 25, 15, 5];
        } else {
            weights = [25, 20, 10, 20, 10, 15];
        }
        
        let total = weights.reduce((a, b) => a + b, 0);
        let r = Math.random() * total;
        let typeIdx = 0;
        for (let w = 0; w < weights.length; w++) {
            r -= weights[w];
            if (r <= 0) { typeIdx = w; break; }
        }
        
        const typeName = types[typeIdx];
        const type = ITEM_TYPES[typeName];
        
        let ix, iy;
        let overlap;
        let attempts = 0;
        do {
            overlap = false;
            ix = type.size + Math.random() * (canvas.width - type.size * 2);
            iy = 130 + Math.random() * (canvas.height - 160);
            for (const existing of items) {
                if (Math.hypot(ix - existing.x, iy - existing.y) < type.size + existing.size + 10) {
                    overlap = true;
                    break;
                }
            }
            attempts++;
        } while (overlap && attempts < 50);
        
        items.push({
            x: ix, y: iy,
            size: type.size,
            color: type.color,
            value: type.value + Math.floor(level * type.value * 0.1),
            weight: type.weight,
            type: typeName,
            label: type.label,
            shine: Math.random() * Math.PI * 2
        });
    }
}

function update() {
    if (!gameRunning) return;
    
    if (hook.state === 'swing') {
        hook.angle += hook.swingSpeed * hook.swingDir;
        if (hook.angle > 1.3) hook.swingDir = -1;
        if (hook.angle < -1.3) hook.swingDir = 1;
    }
    else if (hook.state === 'dropping') {
        hook.lineLen += hook.dropSpeed;
        
        // 检查碰撞
        const tipX = hook.x + Math.sin(hook.angle) * hook.lineLen;
        const tipY = hook.y + Math.cos(hook.angle) * hook.lineLen;
        
        for (const item of items) {
            if (Math.hypot(tipX - item.x, tipY - item.y) < item.size) {
                hook.grabbed = item;
                hook.state = 'pulling';
                hook.pullSpeed = Math.max(1, 3 - item.weight * 0.5);
                break;
            }
        }
        
        // 到达最大长度或超出画布
        if (hook.lineLen >= hook.maxLen || tipY >= canvas.height - 10 ||
            tipX < 0 || tipX > canvas.width) {
            hook.state = 'pulling';
            hook.pullSpeed = 4;
        }
    }
    else if (hook.state === 'pulling') {
        hook.lineLen -= hook.pullSpeed;
        
        if (hook.grabbed) {
            const tipX = hook.x + Math.sin(hook.angle) * hook.lineLen;
            const tipY = hook.y + Math.cos(hook.angle) * hook.lineLen;
            hook.grabbed.x = tipX;
            hook.grabbed.y = tipY;
        }
        
        if (hook.lineLen <= 0) {
            hook.lineLen = 0;
            if (hook.grabbed) {
                if (hook.grabbed.type === 'dynamite') {
                    // 炸药爆炸
                    spawnExplosion(hook.x, hook.y);
                } else {
                    money += hook.grabbed.value;
                    scorePopups.push({
                        x: hook.x, y: hook.y - 20,
                        text: `+$${hook.grabbed.value}`,
                        life: 40,
                        color: hook.grabbed.type.includes('Gold') || hook.grabbed.type === 'diamond' ? '#FFD700' : '#fff'
                    });
                }
                items.splice(items.indexOf(hook.grabbed), 1);
                hook.grabbed = null;
            }
            hook.state = 'swing';
        }
    }
    
    // 物品闪光
    for (const item of items) {
        item.shine += 0.03;
    }
    
    // 分数弹出
    for (let i = scorePopups.length - 1; i >= 0; i--) {
        scorePopups[i].y -= 1;
        scorePopups[i].life--;
        if (scorePopups[i].life <= 0) scorePopups.splice(i, 1);
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

function spawnExplosion(x, y) {
    for (let i = 0; i < 20; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 20 + Math.random() * 20,
            color: ['#FF5722','#FF9800','#FFEB3B','#fff'][Math.floor(Math.random()*4)],
            size: 3 + Math.random() * 5
        });
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 天空
    ctx.fillStyle = '#4FC3F7';
    ctx.fillRect(0, 0, canvas.width, 100);
    
    // 地表
    const groundGrad = ctx.createLinearGradient(0, 90, 0, canvas.height);
    groundGrad.addColorStop(0, '#8B4513');
    groundGrad.addColorStop(0.05, '#6D3200');
    groundGrad.addColorStop(0.3, '#4E2600');
    groundGrad.addColorStop(1, '#2E1500');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, 90, canvas.width, canvas.height - 90);
    
    // 草地
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, 85, canvas.width, 12);
    
    // 地下纹理
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    for (let dx = 0; dx < canvas.width; dx += 60) {
        for (let dy = 120; dy < canvas.height; dy += 60) {
            ctx.beginPath();
            ctx.arc(dx + Math.sin(dy) * 10, dy, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 矿工小人
    drawMiner();
    
    // 绳索和钩子
    drawHook();
    
    // 物品
    for (const item of items) {
        if (item === hook.grabbed) continue; // 被抓的跟着钩子画
        drawItem(item);
    }
    
    // 被抓的物品
    if (hook.grabbed) {
        drawItem(hook.grabbed);
    }
    
    // 分数弹出
    for (const sp of scorePopups) {
        ctx.globalAlpha = sp.life / 40;
        ctx.fillStyle = sp.color;
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(sp.text, sp.x, sp.y);
    }
    ctx.globalAlpha = 1;
    
    // 粒子
    for (const p of particles) {
        ctx.globalAlpha = p.life / 40;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawMiner() {
    const mx = hook.x;
    const my = 45;
    
    // 身体
    ctx.fillStyle = '#F44336';
    ctx.fillRect(mx - 8, my, 16, 20);
    
    // 头
    ctx.fillStyle = '#FFCC80';
    ctx.beginPath();
    ctx.arc(mx, my - 5, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // 帽子
    ctx.fillStyle = '#795548';
    ctx.fillRect(mx - 12, my - 15, 24, 8);
    ctx.fillRect(mx - 8, my - 20, 16, 8);
    
    // 眼睛
    ctx.fillStyle = '#000';
    ctx.fillRect(mx - 4, my - 7, 3, 3);
    ctx.fillRect(mx + 2, my - 7, 3, 3);
    
    // 手臂 (操作钩子的动作)
    ctx.strokeStyle = '#FFCC80';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(mx - 8, my + 8);
    ctx.lineTo(mx - 15, my + 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mx + 8, my + 8);
    ctx.lineTo(mx + 15, my + 20);
    ctx.stroke();
    
    // 腿
    ctx.strokeStyle = '#1565C0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(mx - 4, my + 20);
    ctx.lineTo(mx - 6, my + 35);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mx + 4, my + 20);
    ctx.lineTo(mx + 6, my + 35);
    ctx.stroke();
}

function drawHook() {
    const tipX = hook.x + Math.sin(hook.angle) * hook.lineLen;
    const tipY = hook.y + Math.cos(hook.angle) * hook.lineLen;
    
    // 绳索
    ctx.strokeStyle = '#8D6E63';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hook.x, hook.y);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
    
    // 钩子
    ctx.save();
    ctx.translate(tipX, tipY);
    ctx.rotate(-hook.angle);
    
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    // 钩子形状
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(0, 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-8, 5);
    ctx.lineTo(0, -2);
    ctx.lineTo(8, 5);
    ctx.stroke();
    
    ctx.restore();
}

function drawItem(item) {
    ctx.save();
    ctx.translate(item.x, item.y);
    
    if (item.type === 'smallGold' || item.type === 'bigGold') {
        // 金块
        const s = item.size;
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.moveTo(-s, s * 0.3);
        ctx.lineTo(-s * 0.6, -s * 0.5);
        ctx.lineTo(s * 0.6, -s * 0.5);
        ctx.lineTo(s, s * 0.3);
        ctx.lineTo(s * 0.7, s * 0.5);
        ctx.lineTo(-s * 0.7, s * 0.5);
        ctx.closePath();
        ctx.fill();
        
        // 高光
        ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(item.shine) * 0.2})`;
        ctx.fillRect(-s * 0.3, -s * 0.3, s * 0.4, s * 0.3);
        
        // 闪光效果
        if (Math.sin(item.shine * 3) > 0.95) {
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.beginPath();
            ctx.arc(s * 0.3, -s * 0.2, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    else if (item.type === 'diamond') {
        const s = item.size;
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s, 0);
        ctx.lineTo(0, s);
        ctx.lineTo(-s, 0);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = `rgba(255,255,255,${0.4 + Math.sin(item.shine * 2) * 0.3})`;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.7);
        ctx.lineTo(s * 0.4, -s * 0.1);
        ctx.lineTo(0, s * 0.1);
        ctx.lineTo(-s * 0.3, -s * 0.2);
        ctx.closePath();
        ctx.fill();
    }
    else if (item.type === 'rock') {
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(0, 0, item.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#757575';
        ctx.beginPath();
        ctx.arc(-5, -5, item.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(8, 3, item.size * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }
    else if (item.type === 'bone') {
        ctx.fillStyle = item.color;
        ctx.fillRect(-item.size * 0.5, -3, item.size, 6);
        ctx.beginPath();
        ctx.arc(-item.size * 0.5, -3, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-item.size * 0.5, 3, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(item.size * 0.5, -3, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(item.size * 0.5, 3, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    else if (item.type === 'dynamite') {
        ctx.fillStyle = '#F44336';
        ctx.fillRect(-5, -item.size * 0.5, 10, item.size);
        ctx.fillStyle = '#FFEB3B';
        ctx.fillRect(-6, -item.size * 0.5, 12, 4);
        // 引线
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -item.size * 0.5);
        ctx.quadraticCurveTo(5, -item.size * 0.5 - 8, 0, -item.size * 0.5 - 12);
        ctx.stroke();
        // 火花
        const spark = Math.sin(Date.now() / 100) > 0;
        if (spark) {
            ctx.fillStyle = '#FF9800';
            ctx.beginPath();
            ctx.arc(0, -item.size * 0.5 - 12, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    ctx.restore();
}

function updateHUD() {
    document.getElementById('money').textContent = money;
    document.getElementById('level').textContent = level;
    document.getElementById('target').textContent = target;
}

function gameLoop() {
    update();
    draw();
    if (gameRunning) animFrame = requestAnimationFrame(gameLoop);
}

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('gameover-screen').style.display = 'none';
    document.getElementById('level-clear').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    
    money = 0; level = 1;
    target = 200;
    startLevel();
}

function startLevel() {
    timer = 30 + level * 5;
    hook.state = 'swing';
    hook.angle = 0;
    hook.lineLen = 0;
    hook.grabbed = null;
    hook.swingSpeed = 0.02 + level * 0.002;
    particles = [];
    scorePopups = [];
    
    generateItems();
    gameRunning = true;
    updateHUD();
    document.getElementById('timer').textContent = timer;
    
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!gameRunning) return;
        timer--;
        document.getElementById('timer').textContent = timer;
        if (timer <= 0) {
            clearInterval(timerInterval);
            gameRunning = false;
            if (money >= target) {
                levelClear();
            } else {
                gameOver();
            }
        }
    }, 1000);
    
    if (animFrame) cancelAnimationFrame(animFrame);
    gameLoop();
}

function levelClear() {
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('level-clear').style.display = 'block';
    document.getElementById('level-money').textContent = money;
}

function nextLevel() {
    level++;
    target = Math.floor(target * 1.5);
    document.getElementById('level-clear').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    startLevel();
}

function gameOver() {
    gameRunning = false;
    clearInterval(timerInterval);
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('gameover-screen').style.display = 'block';
    document.getElementById('final-money').textContent = money;
    document.getElementById('final-target').textContent = target;
    document.getElementById('final-level').textContent = level;
}

function dropHook() {
    if (hook.state === 'swing') {
        hook.state = 'dropping';
        hook.lineLen = 0;
    }
}

// 控制
document.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 's') {
        e.preventDefault();
        dropHook();
    }
});

canvas.addEventListener('click', () => dropHook());
canvas.addEventListener('touchstart', e => { e.preventDefault(); dropHook(); });
