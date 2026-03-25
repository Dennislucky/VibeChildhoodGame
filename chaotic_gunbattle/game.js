// 混乱大枪战 - Chaotic Gun Battle
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

let gameRunning = false;
let kills = 0;
let wave = 1;
let waveTimer = 0;
let animFrame;

const keys = {};
let mouse = { x: 400, y: 300, down: false };

// 武器定义
const WEAPONS = [
    { name: '手枪', ammo: 12, maxAmmo: 12, damage: 25, fireRate: 12, bulletSpeed: 12, spread: 0.05, reloadTime: 60, bulletSize: 3, color: '#FFD700' },
    { name: '冲锋枪', ammo: 30, maxAmmo: 30, damage: 15, fireRate: 4, bulletSpeed: 14, spread: 0.12, reloadTime: 90, bulletSize: 2, color: '#FF6B35' },
    { name: '霰弹枪', ammo: 6, maxAmmo: 6, damage: 12, fireRate: 25, bulletSpeed: 10, spread: 0.3, reloadTime: 120, bulletSize: 3, pellets: 8, color: '#FF4444' }
];

const player = {
    x: 400, y: 300, w: 24, h: 24,
    hp: 100, maxHp: 100,
    speed: 3.5,
    weapon: 0,
    fireCooldown: 0,
    reloading: false,
    reloadTimer: 0,
    angle: 0,
    invincible: 0
};

let bullets = [];
let enemies = [];
let enemyBullets = [];
let particles = [];
let pickups = [];
let obstacles = [];

// 障碍物生成
function generateObstacles() {
    obstacles = [];
    const count = 8 + wave * 2;
    for (let i = 0; i < count; i++) {
        let ox, oy;
        do {
            ox = 50 + Math.random() * (canvas.width - 100);
            oy = 50 + Math.random() * (canvas.height - 100);
        } while (Math.hypot(ox - player.x, oy - player.y) < 100);
        
        obstacles.push({
            x: ox, y: oy,
            w: 30 + Math.random() * 40,
            h: 30 + Math.random() * 40,
            hp: 3
        });
    }
}

function spawnWave() {
    const count = 5 + wave * 3;
    for (let i = 0; i < count; i++) {
        let ex, ey;
        const side = Math.floor(Math.random() * 4);
        if (side === 0) { ex = -20; ey = Math.random() * canvas.height; }
        else if (side === 1) { ex = canvas.width + 20; ey = Math.random() * canvas.height; }
        else if (side === 2) { ex = Math.random() * canvas.width; ey = -20; }
        else { ex = Math.random() * canvas.width; ey = canvas.height + 20; }
        
        const type = Math.random() < 0.3 + wave * 0.05 ? 'shooter' : 'rusher';
        enemies.push({
            x: ex, y: ey, w: 20, h: 20,
            hp: type === 'shooter' ? 40 + wave * 5 : 25 + wave * 5,
            maxHp: type === 'shooter' ? 40 + wave * 5 : 25 + wave * 5,
            speed: type === 'shooter' ? 1.2 : 2.5 + wave * 0.15,
            type,
            fireCooldown: 0,
            fireRate: Math.max(30, 80 - wave * 5),
            hit: 0
        });
    }
}

function rectCollide(a, b) {
    return a.x - a.w/2 < b.x + b.w/2 && a.x + a.w/2 > b.x - b.w/2 &&
           a.y - a.h/2 < b.y + b.h/2 && a.y + a.h/2 > b.y - b.h/2;
}

function pointInRect(px, py, r) {
    return px > r.x - r.w/2 && px < r.x + r.w/2 && py > r.y - r.h/2 && py < r.y + r.h/2;
}

function shoot() {
    const w = WEAPONS[player.weapon];
    if (player.reloading || player.fireCooldown > 0 || w.ammo <= 0) return;
    
    const pellets = w.pellets || 1;
    for (let i = 0; i < pellets; i++) {
        const angle = player.angle + (Math.random() - 0.5) * w.spread;
        bullets.push({
            x: player.x, y: player.y,
            vx: Math.cos(angle) * w.bulletSpeed,
            vy: Math.sin(angle) * w.bulletSpeed,
            damage: w.damage,
            size: w.bulletSize,
            color: w.color,
            life: 60
        });
    }
    w.ammo--;
    player.fireCooldown = w.fireRate;
    
    // 枪口闪光
    spawnParticles(player.x + Math.cos(player.angle) * 20, player.y + Math.sin(player.angle) * 20, w.color, 3, 3);
    
    if (w.ammo <= 0) reload();
}

function reload() {
    if (player.reloading) return;
    const w = WEAPONS[player.weapon];
    if (w.ammo === w.maxAmmo) return;
    player.reloading = true;
    player.reloadTimer = w.reloadTime;
    document.getElementById('reload-bar').style.display = 'block';
}

function switchWeapon(idx) {
    if (idx >= 0 && idx < WEAPONS.length && idx !== player.weapon) {
        player.weapon = idx;
        player.reloading = false;
        player.fireCooldown = 10;
        document.getElementById('reload-bar').style.display = 'none';
    }
}

function spawnParticles(x, y, color, count, speed) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * speed * 2,
            vy: (Math.random() - 0.5) * speed * 2,
            life: 15 + Math.random() * 15,
            color,
            size: 2 + Math.random() * 3
        });
    }
}

function update() {
    if (!gameRunning) return;
    
    // 玩家移动
    let dx = 0, dy = 0;
    if (keys['w'] || keys['ArrowUp']) dy = -1;
    if (keys['s'] || keys['ArrowDown']) dy = 1;
    if (keys['a'] || keys['ArrowLeft']) dx = -1;
    if (keys['d'] || keys['ArrowRight']) dx = 1;
    
    if (dx && dy) { dx *= 0.707; dy *= 0.707; }
    
    const newX = player.x + dx * player.speed;
    const newY = player.y + dy * player.speed;
    
    // 边界和障碍物碰撞
    let canMoveX = newX > 12 && newX < canvas.width - 12;
    let canMoveY = newY > 12 && newY < canvas.height - 12;
    
    for (const o of obstacles) {
        if (o.hp <= 0) continue;
        const testX = { x: newX, y: player.y, w: player.w, h: player.h };
        const testY = { x: player.x, y: newY, w: player.w, h: player.h };
        const obs = { x: o.x + o.w/2, y: o.y + o.h/2, w: o.w, h: o.h };
        if (rectCollide(testX, obs)) canMoveX = false;
        if (rectCollide(testY, obs)) canMoveY = false;
    }
    
    if (canMoveX) player.x = newX;
    if (canMoveY) player.y = newY;
    
    // 瞄准角度
    player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    
    // 射击
    if (mouse.down && !player.reloading) shoot();
    if (player.fireCooldown > 0) player.fireCooldown--;
    
    // 换弹
    if (player.reloading) {
        player.reloadTimer--;
        const w = WEAPONS[player.weapon];
        const progress = 1 - player.reloadTimer / w.reloadTime;
        document.getElementById('reload-fill').style.width = (progress * 100) + '%';
        if (player.reloadTimer <= 0) {
            w.ammo = w.maxAmmo;
            player.reloading = false;
            document.getElementById('reload-bar').style.display = 'none';
        }
    }
    
    if (player.invincible > 0) player.invincible--;
    
    // 子弹更新
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx; b.y += b.vy; b.life--;
        
        // 击中障碍物
        let hitObs = false;
        for (const o of obstacles) {
            if (o.hp <= 0) continue;
            if (b.x > o.x && b.x < o.x + o.w && b.y > o.y && b.y < o.y + o.h) {
                o.hp--;
                hitObs = true;
                spawnParticles(b.x, b.y, '#888', 3, 2);
                if (o.hp <= 0) spawnParticles(o.x + o.w/2, o.y + o.h/2, '#aa8855', 10, 4);
                break;
            }
        }
        
        if (hitObs || b.life <= 0 || b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            bullets.splice(i, 1);
            continue;
        }
        
        // 击中敌人
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (Math.hypot(b.x - e.x, b.y - e.y) < 15) {
                e.hp -= b.damage;
                e.hit = 5;
                spawnParticles(b.x, b.y, '#ff4444', 4, 3);
                bullets.splice(i, 1);
                
                if (e.hp <= 0) {
                    kills++;
                    spawnParticles(e.x, e.y, '#ff0000', 12, 5);
                    // 掉落
                    if (Math.random() < 0.2) {
                        pickups.push({
                            x: e.x, y: e.y,
                            type: Math.random() < 0.5 ? 'hp' : 'ammo',
                            life: 300
                        });
                    }
                    enemies.splice(j, 1);
                }
                break;
            }
        }
    }
    
    // 敌人子弹
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        b.x += b.vx; b.y += b.vy; b.life--;
        
        if (b.life <= 0 || b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            enemyBullets.splice(i, 1);
            continue;
        }
        
        if (player.invincible <= 0 && Math.hypot(b.x - player.x, b.y - player.y) < 14) {
            player.hp -= b.damage;
            player.invincible = 30;
            spawnParticles(player.x, player.y, '#ff8800', 5, 3);
            enemyBullets.splice(i, 1);
        }
    }
    
    // 敌人AI
    for (const e of enemies) {
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        
        if (e.hit > 0) e.hit--;
        
        if (e.type === 'rusher') {
            e.x += Math.cos(angle) * e.speed;
            e.y += Math.sin(angle) * e.speed;
            
            if (dist < 20 && player.invincible <= 0) {
                player.hp -= 15;
                player.invincible = 30;
                spawnParticles(player.x, player.y, '#ff8800', 5, 3);
            }
        } else {
            // Shooter AI
            if (dist > 200) {
                e.x += Math.cos(angle) * e.speed;
                e.y += Math.sin(angle) * e.speed;
            } else if (dist < 120) {
                e.x -= Math.cos(angle) * e.speed * 0.5;
                e.y -= Math.sin(angle) * e.speed * 0.5;
            }
            
            e.fireCooldown--;
            if (e.fireCooldown <= 0) {
                e.fireCooldown = e.fireRate;
                const spread = (Math.random() - 0.5) * 0.2;
                enemyBullets.push({
                    x: e.x, y: e.y,
                    vx: Math.cos(angle + spread) * 5,
                    vy: Math.sin(angle + spread) * 5,
                    damage: 8 + wave,
                    life: 80
                });
            }
        }
        
        // 边界
        e.x = Math.max(10, Math.min(canvas.width - 10, e.x));
        e.y = Math.max(10, Math.min(canvas.height - 10, e.y));
    }
    
    // 拾取物
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        p.life--;
        if (p.life <= 0) { pickups.splice(i, 1); continue; }
        
        if (Math.hypot(p.x - player.x, p.y - player.y) < 20) {
            if (p.type === 'hp') {
                player.hp = Math.min(player.maxHp, player.hp + 25);
            } else {
                WEAPONS[player.weapon].ammo = WEAPONS[player.weapon].maxAmmo;
                player.reloading = false;
                document.getElementById('reload-bar').style.display = 'none';
            }
            spawnParticles(p.x, p.y, p.type === 'hp' ? '#44ff44' : '#ffaa00', 8, 3);
            pickups.splice(i, 1);
        }
    }
    
    // 粒子
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.95; p.vy *= 0.95;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
    
    // 波次管理
    if (enemies.length === 0) {
        waveTimer++;
        if (waveTimer > 90) {
            wave++;
            waveTimer = 0;
            generateObstacles();
            spawnWave();
        }
    }
    
    if (player.hp <= 0) {
        gameOver();
        return;
    }
    
    updateHUD();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 背景网格
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    
    // 障碍物
    for (const o of obstacles) {
        if (o.hp <= 0) continue;
        ctx.fillStyle = o.hp > 2 ? '#555555' : o.hp > 1 ? '#665544' : '#774433';
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(o.x, o.y, o.w, o.h);
    }
    
    // 拾取物
    for (const p of pickups) {
        const alpha = p.life < 60 ? (p.life / 60) : 1;
        ctx.globalAlpha = alpha;
        if (p.type === 'hp') {
            ctx.fillStyle = '#44ff44';
            ctx.fillRect(p.x - 6, p.y - 2, 12, 4);
            ctx.fillRect(p.x - 2, p.y - 6, 4, 12);
        } else {
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = '8px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('A', p.x, p.y + 3);
        }
        ctx.globalAlpha = 1;
    }
    
    // 敌人
    for (const e of enemies) {
        ctx.save();
        if (e.hit > 0) ctx.fillStyle = '#ffffff';
        else if (e.type === 'rusher') ctx.fillStyle = '#E53935';
        else ctx.fillStyle = '#FF8F00';
        
        ctx.translate(e.x, e.y);
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        ctx.rotate(angle);
        
        // 身体
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // 武器 (shooter only)
        if (e.type === 'shooter') {
            ctx.fillStyle = '#555';
            ctx.fillRect(8, -2, 12, 4);
        }
        
        ctx.restore();
        
        // HP条
        if (e.hp < e.maxHp) {
            ctx.fillStyle = '#333';
            ctx.fillRect(e.x - 12, e.y - 18, 24, 3);
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(e.x - 12, e.y - 18, 24 * (e.hp / e.maxHp), 3);
        }
    }
    
    // 玩家
    ctx.save();
    if (player.invincible > 0 && Math.floor(player.invincible / 2) % 2) {
        ctx.globalAlpha = 0.4;
    }
    
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    
    // 身体
    ctx.fillStyle = '#2196F3';
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // 枪
    const w = WEAPONS[player.weapon];
    ctx.fillStyle = '#888';
    ctx.fillRect(10, -3, w.name === '霰弹枪' ? 20 : 15, 6);
    ctx.fillStyle = '#666';
    ctx.fillRect(10, -2, w.name === '霰弹枪' ? 20 : 15, 2);
    
    ctx.restore();
    
    // 子弹
    for (const b of bullets) {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
        // 拖尾
        ctx.fillStyle = b.color + '66';
        ctx.beginPath();
        ctx.arc(b.x - b.vx * 0.5, b.y - b.vy * 0.5, b.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 敌方子弹
    for (const b of enemyBullets) {
        ctx.fillStyle = '#FF5252';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 粒子
    for (const p of particles) {
        ctx.globalAlpha = p.life / 30;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    // 波次提示
    if (enemies.length === 0 && waveTimer > 0) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 30px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`第 ${wave + 1} 波即将到来...`, canvas.width / 2, canvas.height / 2);
    }
    
    // 准心
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mouse.x - 16, mouse.y);
    ctx.lineTo(mouse.x - 8, mouse.y);
    ctx.moveTo(mouse.x + 8, mouse.y);
    ctx.lineTo(mouse.x + 16, mouse.y);
    ctx.moveTo(mouse.x, mouse.y - 16);
    ctx.lineTo(mouse.x, mouse.y - 8);
    ctx.moveTo(mouse.x, mouse.y + 8);
    ctx.lineTo(mouse.x, mouse.y + 16);
    ctx.stroke();
}

function updateHUD() {
    document.getElementById('hp').textContent = Math.max(0, Math.ceil(player.hp));
    document.getElementById('kills').textContent = kills;
    document.getElementById('wave').textContent = wave;
    const w = WEAPONS[player.weapon];
    document.getElementById('weapon-name').textContent = w.name;
    document.getElementById('ammo').textContent = w.ammo;
    document.getElementById('max-ammo').textContent = w.maxAmmo;
}

function gameLoop() {
    update();
    draw();
    animFrame = requestAnimationFrame(gameLoop);
}

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('gameover-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    
    kills = 0; wave = 1; waveTimer = 0;
    player.x = 400; player.y = 300;
    player.hp = player.maxHp;
    player.weapon = 0;
    player.reloading = false;
    player.invincible = 0;
    WEAPONS.forEach(w => w.ammo = w.maxAmmo);
    bullets = []; enemies = []; enemyBullets = []; particles = []; pickups = [];
    
    gameRunning = true;
    generateObstacles();
    spawnWave();
    updateHUD();
    document.getElementById('reload-bar').style.display = 'none';
    
    if (animFrame) cancelAnimationFrame(animFrame);
    gameLoop();
}

function gameOver() {
    gameRunning = false;
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('gameover-screen').style.display = 'block';
    document.getElementById('final-kills').textContent = kills;
    document.getElementById('final-wave').textContent = wave;
}

// 输入
document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === 'r' || e.key === 'R') reload();
    if (e.key === '1') switchWeapon(0);
    if (e.key === '2') switchWeapon(1);
    if (e.key === '3') switchWeapon(2);
});
document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
});
canvas.addEventListener('mousedown', e => { e.preventDefault(); mouse.down = true; });
canvas.addEventListener('mouseup', e => { mouse.down = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());
