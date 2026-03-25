// 疯狂小人战斗 - Crazy Stickman Fight
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 500;

let gameRunning = false;
let gameMode = 'single'; // 'single' or 'pvp'
let round = 1;
let maxRounds = 3;
let timer = 60;
let timerInterval;
let animFrame;
let aiLevel = 1;

const keys = {};
let particles = [];
let hitEffects = [];

function createFighter(x, color, facing) {
    return {
        x, y: 350, w: 30, h: 60,
        vx: 0, vy: 0,
        hp: 100, maxHp: 100,
        speed: 4, jumpForce: -12,
        onGround: false,
        facing, // 1 = right, -1 = left
        color,
        state: 'idle', // idle, walk, jump, punch, kick, hit, block
        stateTimer: 0,
        attackCooldown: 0,
        combo: 0,
        wins: 0,
        // 动画
        frame: 0, frameTimer: 0,
        // 攻击
        punchDamage: 10,
        kickDamage: 15,
        punchRange: 45,
        kickRange: 55,
        hitStun: 0
    };
}

let p1, p2;

const GROUND_Y = 420;
const PLATFORMS = [
    { x: 100, y: 320, w: 150, h: 12 },
    { x: 550, y: 320, w: 150, h: 12 },
    { x: 300, y: 230, w: 200, h: 12 }
];

function update() {
    if (!gameRunning) return;
    
    updateFighter(p1, {
        left: keys['a'], right: keys['d'],
        jump: keys['w'], punch: keys['f'], kick: keys['g']
    });
    
    if (gameMode === 'pvp') {
        updateFighter(p2, {
            left: keys['arrowleft'], right: keys['arrowright'],
            jump: keys['arrowup'], punch: keys['k'], kick: keys['l']
        });
    } else {
        updateAI(p2);
    }
    
    // 面向对手
    if (p1.state === 'idle' || p1.state === 'walk') {
        p1.facing = p1.x < p2.x ? 1 : -1;
    }
    if (p2.state === 'idle' || p2.state === 'walk') {
        p2.facing = p2.x < p1.x ? 1 : -1;
    }
    
    // 粒子
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.15;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
    
    // 打击特效
    for (let i = hitEffects.length - 1; i >= 0; i--) {
        hitEffects[i].life--;
        if (hitEffects[i].life <= 0) hitEffects.splice(i, 1);
    }
    
    // 更新HUD
    document.getElementById('p1-hp').style.width = Math.max(0, (p1.hp / p1.maxHp) * 100) + '%';
    document.getElementById('p2-hp').style.width = Math.max(0, (p2.hp / p2.maxHp) * 100) + '%';
    
    // 胜负判定
    if (p1.hp <= 0 || p2.hp <= 0) {
        if (p1.hp <= 0) p2.wins++;
        else p1.wins++;
        
        if (p1.wins >= 2 || p2.wins >= 2 || round >= maxRounds) {
            endMatch();
        } else {
            round++;
            if (gameMode === 'single') aiLevel++;
            resetRound();
        }
    }
}

function updateFighter(f, input) {
    // 受击硬直
    if (f.hitStun > 0) {
        f.hitStun--;
        f.vy += 0.6;
        f.y += f.vy;
        f.x += f.vx;
        f.vx *= 0.9;
        checkGround(f);
        return;
    }
    
    // 攻击状态
    if (f.state === 'punch' || f.state === 'kick') {
        f.stateTimer--;
        if (f.stateTimer <= 0) {
            f.state = 'idle';
            f.attackCooldown = 8;
        }
        // 攻击判定（在攻击动画中间）
        if (f.stateTimer === 8) {
            const target = f === p1 ? p2 : p1;
            const range = f.state === 'punch' ? f.punchRange : f.kickRange;
            const damage = f.state === 'punch' ? f.punchDamage : f.kickDamage;
            
            const dx = target.x - f.x;
            const dy = target.y - f.y;
            if (Math.abs(dx) < range && Math.abs(dy) < 50 &&
                Math.sign(dx) === f.facing) {
                // 命中
                target.hp -= damage;
                target.hitStun = 15;
                target.vx = f.facing * 6;
                target.vy = -4;
                target.state = 'hit';
                
                f.combo++;
                
                const hitX = (f.x + target.x) / 2;
                const hitY = f.y - 20;
                hitEffects.push({ x: hitX, y: hitY, life: 15, type: f.state, damage });
                spawnParticles(hitX, hitY, f.color, 8);
                
                // 屏幕震动效果
                canvas.style.transform = `translate(${(Math.random()-0.5)*4}px, ${(Math.random()-0.5)*4}px)`;
                setTimeout(() => canvas.style.transform = '', 50);
            } else {
                f.combo = 0;
            }
        }
        f.vy += 0.6;
        f.y += f.vy;
        checkGround(f);
        return;
    }
    
    if (f.attackCooldown > 0) f.attackCooldown--;
    
    // 移动
    f.vx = 0;
    if (input.left) { f.vx = -f.speed; f.state = 'walk'; }
    else if (input.right) { f.vx = f.speed; f.state = 'walk'; }
    else { if (f.state === 'walk') f.state = 'idle'; }
    
    if (input.jump && f.onGround) {
        f.vy = f.jumpForce;
        f.onGround = false;
        f.state = 'jump';
    }
    
    if (input.punch && f.attackCooldown <= 0 && f.onGround) {
        f.state = 'punch';
        f.stateTimer = 15;
        f.vx = 0;
    }
    
    if (input.kick && f.attackCooldown <= 0 && f.onGround) {
        f.state = 'kick';
        f.stateTimer = 20;
        f.vx = 0;
    }
    
    // 物理
    f.vy += 0.6;
    f.x += f.vx;
    f.y += f.vy;
    
    // 边界
    if (f.x < 15) f.x = 15;
    if (f.x > canvas.width - 15) f.x = canvas.width - 15;
    
    checkGround(f);
    
    // 动画
    f.frameTimer++;
    if (f.frameTimer > 8) { f.frame = (f.frame + 1) % 4; f.frameTimer = 0; }
}

function checkGround(f) {
    f.onGround = false;
    
    // 地面
    if (f.y + f.h / 2 >= GROUND_Y) {
        f.y = GROUND_Y - f.h / 2;
        f.vy = 0;
        f.onGround = true;
        if (f.state === 'jump' || f.state === 'hit') f.state = 'idle';
    }
    
    // 平台
    for (const p of PLATFORMS) {
        if (f.vy >= 0 &&
            f.x > p.x && f.x < p.x + p.w &&
            f.y + f.h / 2 >= p.y && f.y + f.h / 2 <= p.y + p.h + f.vy + 2) {
            f.y = p.y - f.h / 2;
            f.vy = 0;
            f.onGround = true;
            if (f.state === 'jump' || f.state === 'hit') f.state = 'idle';
        }
    }
}

function updateAI(ai) {
    const target = p1;
    const dx = target.x - ai.x;
    const dy = target.y - ai.y;
    const dist = Math.abs(dx);
    
    const input = { left: false, right: false, jump: false, punch: false, kick: false };
    
    // AI决策
    const aggression = 0.3 + aiLevel * 0.15;
    const reaction = Math.max(5, 20 - aiLevel * 3);
    
    if (Math.random() < aggression) {
        if (dist > 60) {
            if (dx > 0) input.right = true;
            else input.left = true;
        }
        
        if (dist < 55 && Math.random() < 0.15 + aiLevel * 0.05) {
            if (Math.random() < 0.5) input.punch = true;
            else input.kick = true;
        }
        
        // 跳跃到平台
        if (dy > 50 && Math.random() < 0.05) input.jump = true;
        
        // 躲避
        if (target.state === 'punch' || target.state === 'kick') {
            if (dist < 70 && Math.random() < 0.3) {
                input.jump = true;
                if (dx > 0) input.left = true;
                else input.right = true;
            }
        }
    }
    
    updateFighter(ai, input);
}

function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8 - 2,
            life: 15 + Math.random() * 15,
            color, size: 2 + Math.random() * 4
        });
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 背景
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#1a1a2e');
    bgGrad.addColorStop(1, '#16213e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 地面
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
    ctx.fillStyle = '#636e72';
    ctx.fillRect(0, GROUND_Y, canvas.width, 3);
    
    // 平台
    for (const p of PLATFORMS) {
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#636e72';
        ctx.fillRect(p.x, p.y, p.w, 3);
    }
    
    // 打击特效
    for (const h of hitEffects) {
        ctx.globalAlpha = h.life / 15;
        ctx.fillStyle = '#FFD700';
        ctx.font = `bold ${20 + (15 - h.life) * 2}px sans-serif`;
        ctx.textAlign = 'center';
        const text = h.type === 'punch' ? '💥' : '⚡';
        ctx.fillText(text, h.x, h.y - (15 - h.life) * 2);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`-${h.damage}`, h.x, h.y - 25 - (15 - h.life) * 2);
        ctx.globalAlpha = 1;
    }
    
    // 绘制火柴人
    drawStickman(p1);
    drawStickman(p2);
    
    // 粒子
    for (const p of particles) {
        ctx.globalAlpha = p.life / 30;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    // Combo显示
    if (p1.combo > 1) {
        ctx.fillStyle = '#42A5F5';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${p1.combo} COMBO!`, 20, canvas.height - 20);
    }
    if (p2.combo > 1) {
        ctx.fillStyle = '#EF5350';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${p2.combo} COMBO!`, canvas.width - 20, canvas.height - 20);
    }
}

function drawStickman(f) {
    ctx.save();
    ctx.translate(f.x, f.y);
    
    const s = f.facing;
    const bodyColor = f.color;
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    // 受击闪白
    if (f.hitStun > 0 && Math.floor(f.hitStun / 2) % 2) {
        ctx.strokeStyle = '#fff';
    }
    
    // 头
    ctx.beginPath();
    ctx.arc(0, -25, 10, 0, Math.PI * 2);
    ctx.stroke();
    
    // 身体
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(0, 10);
    ctx.stroke();
    
    if (f.state === 'punch') {
        // 拳击动画
        const progress = f.stateTimer / 15;
        // 出拳手
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(s * 25 * (1 - progress), -10 - 5 * Math.sin(progress * Math.PI));
        ctx.stroke();
        // 另一只手
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(-s * 10, 0);
        ctx.stroke();
    } else if (f.state === 'kick') {
        // 踢击动画
        const progress = f.stateTimer / 20;
        // 手臂
        ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(s * 12, -5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(-s * 12, -5); ctx.stroke();
        // 踢腿
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.lineTo(s * 28 * (1 - progress), 10 + 5 * Math.sin(progress * Math.PI));
        ctx.stroke();
        // 另一条腿
        ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(-s * 10, 25); ctx.stroke();
    } else if (f.state === 'walk') {
        // 行走动画
        const legSwing = Math.sin(f.frame * Math.PI / 2) * 12;
        const armSwing = Math.sin(f.frame * Math.PI / 2) * 8;
        // 手臂
        ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(s * armSwing, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(-s * armSwing, 0); ctx.stroke();
        // 腿
        ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(legSwing, 25); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(-legSwing, 25); ctx.stroke();
    } else if (f.state === 'jump') {
        // 跳跃姿势
        ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(s * 15, -15); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(-s * 10, -5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(8, 18); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(-8, 18); ctx.stroke();
    } else {
        // 待机
        ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(s * 12, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(-s * 8, 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(6, 25); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(-6, 25); ctx.stroke();
    }
    
    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.fillRect(s * 3 - 1, -28, 3, 3);
    
    ctx.restore();
}

function resetRound() {
    p1.x = 200; p1.y = 350; p1.vx = 0; p1.vy = 0;
    p1.hp = p1.maxHp; p1.state = 'idle'; p1.hitStun = 0;
    p1.combo = 0; p1.attackCooldown = 0;
    
    p2.x = 600; p2.y = 350; p2.vx = 0; p2.vy = 0;
    p2.hp = p2.maxHp; p2.state = 'idle'; p2.hitStun = 0;
    p2.combo = 0; p2.attackCooldown = 0;
    
    timer = 60;
    particles = [];
    hitEffects = [];
    
    document.getElementById('round-text').textContent = `第 ${round} 回合`;
    document.getElementById('timer').textContent = timer;
}

function endMatch() {
    gameRunning = false;
    clearInterval(timerInterval);
    
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';
    
    let winner;
    if (p1.wins > p2.wins) winner = 'P1';
    else if (p2.wins > p1.wins) winner = gameMode === 'single' ? 'CPU' : 'P2';
    else winner = '平局';
    
    document.getElementById('result-text').textContent =
        winner === '平局' ? '⚔️ 平局！' : `🏆 ${winner} 获胜！`;
    document.getElementById('result-detail').textContent =
        `P1 ${p1.wins} - ${p2.wins} ${gameMode === 'single' ? 'CPU' : 'P2'}`;
}

function gameLoop() {
    update();
    draw();
    if (gameRunning) animFrame = requestAnimationFrame(gameLoop);
}

function startGame(mode) {
    gameMode = mode;
    round = 1;
    aiLevel = 1;
    
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    
    document.getElementById('p2-name').textContent = mode === 'single' ? 'CPU' : 'P2';
    
    p1 = createFighter(200, '#42A5F5', 1);
    p2 = createFighter(600, '#EF5350', -1);
    
    resetRound();
    gameRunning = true;
    
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!gameRunning) return;
        timer--;
        document.getElementById('timer').textContent = timer;
        if (timer <= 0) {
            // 时间到，HP多的赢
            if (p1.hp >= p2.hp) p2.hp = 0; else p1.hp = 0;
        }
    }, 1000);
    
    if (animFrame) cancelAnimationFrame(animFrame);
    gameLoop();
}

// 输入
document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
        e.preventDefault();
    }
});
document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
