// ==========================================
// 造梦西游 - 横版动作RPG Demo
// ==========================================

(function () {
    'use strict';

    // ========== 数据定义 ==========

    // 角色基础数据
    const CHARACTER_DATA = {
        wukong: {
            name: '孙悟空', color: '#d4a017', bodyColor: '#d4a017',
            baseAtk: 15, baseDef: 8, baseHp: 120, baseMp: 60,
            atkGrowth: 4, defGrowth: 2, hpGrowth: 15, mpGrowth: 8,
            speed: 5, jumpPower: 14, critRate: 0.1,
            skills: {
                normal: { name: '金箍棒击', damage: 1.0, range: 70, mp: 0 },
                skill: { name: '七十二变', damage: 2.5, range: 120, mp: 15, cd: 3000 },
                ultimate: { name: '大闹天宫', damage: 5.0, range: 250, mp: 30, rageCost: 100 }
            },
            width: 40, height: 60
        },
        bajie: {
            name: '猪八戒', color: '#e8a0b0', bodyColor: '#e8a0b0',
            baseAtk: 12, baseDef: 14, baseHp: 180, baseMp: 40,
            atkGrowth: 3, defGrowth: 4, hpGrowth: 25, mpGrowth: 5,
            speed: 3.5, jumpPower: 11, critRate: 0.05,
            skills: {
                normal: { name: '九齿钉耙', damage: 1.1, range: 65, mp: 0 },
                skill: { name: '天蓬猛击', damage: 2.2, range: 100, mp: 12, cd: 3500 },
                ultimate: { name: '天河翻涌', damage: 4.5, range: 220, mp: 25, rageCost: 100 }
            },
            width: 48, height: 58
        },
        wujing: {
            name: '沙悟净', color: '#4a90d9', bodyColor: '#4a90d9',
            baseAtk: 11, baseDef: 11, baseHp: 150, baseMp: 55,
            atkGrowth: 3, defGrowth: 3, hpGrowth: 18, mpGrowth: 7,
            speed: 4, jumpPower: 12, critRate: 0.08,
            skills: {
                normal: { name: '降妖宝杖', damage: 1.0, range: 60, mp: 0 },
                skill: { name: '流沙旋涡', damage: 2.0, range: 110, mp: 14, cd: 3000 },
                ultimate: { name: '卷帘天威', damage: 4.8, range: 230, mp: 28, rageCost: 100 }
            },
            width: 44, height: 62
        },
        tangseng: {
            name: '唐三藏', color: '#d4d4d4', bodyColor: '#c0b090',
            baseAtk: 8, baseDef: 6, baseHp: 100, baseMp: 100,
            atkGrowth: 2, defGrowth: 1, hpGrowth: 10, mpGrowth: 15,
            speed: 3.5, jumpPower: 11, critRate: 0.03,
            skills: {
                normal: { name: '佛光普照', damage: 0.9, range: 150, mp: 0, projectile: true },
                skill: { name: '紧箍咒', damage: 3.0, range: 200, mp: 20, cd: 2500, projectile: true },
                ultimate: { name: '如来神掌', damage: 6.0, range: 300, mp: 40, rageCost: 100 }
            },
            width: 36, height: 58
        }
    };

    // 关卡数据
    const STAGES = [
        {
            name: '第一关：花果山',
            bgColors: ['#87CEEB', '#228B22', '#8B4513'],
            groundColor: '#3a7a2a',
            enemies: [
                { type: 'monkey', count: 5 },
                { type: 'wolf', count: 3 }
            ],
            boss: {
                type: 'mixian', name: '弥仙',
                hp: 300, atk: 12, def: 5,
                color: '#8B0000', width: 60, height: 75,
                speed: 2.5, skills: ['charge', 'slam'],
                expReward: 80, goldReward: 50
            },
            platforms: [
                { x: 150, y: 420, w: 120, h: 20 },
                { x: 400, y: 360, w: 150, h: 20 },
                { x: 700, y: 400, w: 130, h: 20 }
            ]
        },
        {
            name: '第二关：黑风山',
            bgColors: ['#2F2F4F', '#1a1a2e', '#3a2a1a'],
            groundColor: '#2a2a1a',
            enemies: [
                { type: 'bear', count: 4 },
                { type: 'demon', count: 4 }
            ],
            boss: {
                type: 'heifeng', name: '黑风怪',
                hp: 500, atk: 18, def: 10,
                color: '#1a1a1a', width: 65, height: 80,
                speed: 3, skills: ['charge', 'slam', 'darkBlast'],
                expReward: 150, goldReward: 100
            },
            platforms: [
                { x: 100, y: 400, w: 100, h: 20 },
                { x: 350, y: 340, w: 140, h: 20 },
                { x: 600, y: 380, w: 120, h: 20 },
                { x: 830, y: 320, w: 100, h: 20 }
            ]
        },
        {
            name: '第三关：火焰山',
            bgColors: ['#FF4500', '#8B0000', '#4a1a0a'],
            groundColor: '#5a2a0a',
            enemies: [
                { type: 'fireDemon', count: 5 },
                { type: 'lavaGolem', count: 3 }
            ],
            boss: {
                type: 'niuMoWang', name: '牛魔王',
                hp: 800, atk: 25, def: 15,
                color: '#4a0000', width: 75, height: 90,
                speed: 2.8, skills: ['charge', 'slam', 'fireBreath', 'stomp'],
                expReward: 250, goldReward: 180
            },
            platforms: [
                { x: 120, y: 410, w: 110, h: 20 },
                { x: 300, y: 350, w: 130, h: 20 },
                { x: 550, y: 300, w: 100, h: 20 },
                { x: 750, y: 370, w: 140, h: 20 }
            ]
        },
        {
            name: '第四关：天宫',
            bgColors: ['#FFD700', '#87CEEB', '#E6E6FA'],
            groundColor: '#c0b080',
            enemies: [
                { type: 'heavenlySoldier', count: 6 },
                { type: 'heavenlyGeneral', count: 3 }
            ],
            boss: {
                type: 'erLangShen', name: '二郎神',
                hp: 1200, atk: 35, def: 20,
                color: '#4169E1', width: 55, height: 85,
                speed: 4, skills: ['charge', 'slam', 'thirdEye', 'dogAttack', 'tripleStrike'],
                expReward: 400, goldReward: 300
            },
            platforms: [
                { x: 100, y: 380, w: 120, h: 20 },
                { x: 300, y: 320, w: 100, h: 20 },
                { x: 500, y: 280, w: 130, h: 20 },
                { x: 700, y: 350, w: 110, h: 20 },
                { x: 850, y: 300, w: 100, h: 20 }
            ]
        }
    ];

    // 怪物模板
    const ENEMY_TEMPLATES = {
        monkey: { name: '山猴', hp: 40, atk: 5, def: 2, speed: 2, color: '#8B6914', width: 30, height: 40, exp: 10, gold: 5 },
        wolf: { name: '妖狼', hp: 60, atk: 8, def: 3, speed: 3, color: '#555555', width: 35, height: 38, exp: 15, gold: 8 },
        bear: { name: '黑熊精', hp: 80, atk: 10, def: 6, speed: 2, color: '#2a1a0a', width: 42, height: 50, exp: 20, gold: 12 },
        demon: { name: '小妖', hp: 55, atk: 9, def: 4, speed: 3.5, color: '#6a2a6a', width: 32, height: 42, exp: 18, gold: 10 },
        fireDemon: { name: '火焰精', hp: 90, atk: 14, def: 5, speed: 2.8, color: '#FF4500', width: 35, height: 45, exp: 28, gold: 18 },
        lavaGolem: { name: '熔岩巨人', hp: 150, atk: 18, def: 12, speed: 1.5, color: '#8B0000', width: 50, height: 60, exp: 40, gold: 25 },
        heavenlySoldier: { name: '天兵', hp: 100, atk: 16, def: 8, speed: 3, color: '#B8860B', width: 34, height: 48, exp: 35, gold: 20 },
        heavenlyGeneral: { name: '天将', hp: 180, atk: 22, def: 14, speed: 2.5, color: '#DAA520', width: 45, height: 55, exp: 55, gold: 35 }
    };

    // 装备池
    const ITEM_POOL = [
        { id: 'sword1', name: '铁棒', type: 'weapon', rarity: 'common', atk: 3, desc: '普通铁棒' },
        { id: 'sword2', name: '玄铁棒', type: 'weapon', rarity: 'rare', atk: 8, desc: '坚固的玄铁棒' },
        { id: 'sword3', name: '如意金箍棒', type: 'weapon', rarity: 'legendary', atk: 18, crit: 0.05, desc: '定海神针铁' },
        { id: 'armor1', name: '布衣', type: 'armor', rarity: 'common', def: 3, hp: 20, desc: '普通布衣' },
        { id: 'armor2', name: '锁子甲', type: 'armor', rarity: 'rare', def: 8, hp: 50, desc: '坚固的铠甲' },
        { id: 'armor3', name: '锁子黄金甲', type: 'armor', rarity: 'epic', def: 15, hp: 100, desc: '太上老君所赐' },
        { id: 'acc1', name: '护身符', type: 'accessory', rarity: 'common', def: 2, mp: 20, desc: '简单的护身符' },
        { id: 'acc2', name: '紫金铃', type: 'accessory', rarity: 'rare', atk: 5, crit: 0.05, desc: '增强攻击的铃铛' },
        { id: 'acc3', name: '月光宝盒', type: 'accessory', rarity: 'epic', atk: 8, def: 8, crit: 0.08, desc: '神秘宝物' },
        { id: 'potion1', name: '仙丹', type: 'consumable', rarity: 'common', healHp: 50, desc: '恢复50点生命' },
        { id: 'potion2', name: '蟠桃', type: 'consumable', rarity: 'rare', healHp: 150, desc: '恢复150点生命' },
        { id: 'potion3', name: '还魂丹', type: 'consumable', rarity: 'epic', healMp: 80, desc: '恢复80点法力' },
        { id: 'sword4', name: '降妖剑', type: 'weapon', rarity: 'epic', atk: 13, crit: 0.03, desc: '专克妖邪之物' },
        { id: 'armor4', name: '菩提叶甲', type: 'armor', rarity: 'legendary', def: 22, hp: 150, mp: 30, desc: '菩提祖师遗物' },
        { id: 'acc4', name: '定风珠', type: 'accessory', rarity: 'legendary', def: 12, atk: 12, crit: 0.1, desc: '可定天地之风' }
    ];

    // ========== 游戏状态 ==========
    const GROUND_Y = 500;
    const CANVAS_W = 1000;
    const CANVAS_H = 600;
    const GRAVITY = 0.6;

    let canvas, ctx;
    let gameState = 'menu'; // menu, playing, paused
    let keys = {};
    let lastTime = 0;
    let animFrame = 0;

    let player = null;
    let enemies = [];
    let projectiles = [];
    let particles = [];
    let damageNumbers = [];
    let camera = { x: 0 };
    let worldWidth = 2000;

    // 游戏数据
    let gameData = {
        charType: 'wukong',
        level: 1,
        exp: 0,
        expToNext: 100,
        gold: 0,
        score: 0,
        currentStage: 0,
        inventory: [],
        equipped: { weapon: null, armor: null, accessory: null },
        stats: { totalKills: 0, totalDamage: 0, bossKills: 0, deaths: 0, playTime: 0 }
    };

    let stage = null;
    let bossSpawned = false;
    let enemiesRemaining = 0;
    let skillCooldowns = { skill: 0, ultimate: 0 };
    let playerRage = 0;
    let comboCount = 0;
    let comboTimer = 0;
    let attackAnim = 0;
    let stageTransition = false;
    let playStartTime = 0;

    // ========== DOM Elements ==========
    const $ = (id) => document.getElementById(id);

    // ========== 初始化 ==========
    function init() {
        canvas = $('gameCanvas');
        ctx = canvas.getContext('2d');

        setupEventListeners();
        checkSaveExists();
    }

    function setupEventListeners() {
        // 键盘
        document.addEventListener('keydown', (e) => {
            keys[e.key.toLowerCase()] = true;
            if (e.key === 'Escape') togglePause();
        });
        document.addEventListener('keyup', (e) => {
            keys[e.key.toLowerCase()] = false;
        });

        // 菜单按钮
        $('btn-new-game').addEventListener('click', () => showScreen('char-select'));
        $('btn-load-game').addEventListener('click', loadGame);
        $('btn-help').addEventListener('click', () => showScreen('help-screen'));
        $('btn-back-menu').addEventListener('click', () => showScreen('main-menu'));
        $('btn-back-help').addEventListener('click', () => showScreen('main-menu'));

        // 角色选择
        document.querySelectorAll('.char-card').forEach(card => {
            card.addEventListener('click', () => {
                const charType = card.dataset.char;
                startNewGame(charType);
            });
        });

        // 暂停菜单
        $('btn-resume').addEventListener('click', togglePause);
        $('btn-inventory').addEventListener('click', showInventory);
        $('btn-save').addEventListener('click', () => { saveGame(); togglePause(); });
        $('btn-quit').addEventListener('click', quitToMenu);

        // 背包
        $('btn-close-inv').addEventListener('click', () => $('inventory-screen').classList.add('hidden'));

        // 关卡通过
        $('btn-next-stage').addEventListener('click', nextStage);

        // 游戏结束
        $('btn-retry').addEventListener('click', retryStage);
        $('btn-go-menu').addEventListener('click', quitToMenu);

        // 升级
        $('btn-level-ok').addEventListener('click', () => {
            $('level-up-notice').classList.add('hidden');
            gameState = 'playing';
        });
    }

    function showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        $(id).classList.add('active');
    }

    function checkSaveExists() {
        const save = localStorage.getItem('zaomeng_save');
        $('btn-load-game').style.display = save ? 'block' : 'none';
    }

    // ========== 新游戏 ==========
    function startNewGame(charType) {
        gameData = {
            charType: charType,
            level: 1,
            exp: 0,
            expToNext: 100,
            gold: 0,
            score: 0,
            currentStage: 0,
            inventory: [],
            equipped: { weapon: null, armor: null, accessory: null },
            stats: { totalKills: 0, totalDamage: 0, bossKills: 0, deaths: 0, playTime: 0 }
        };
        initStage(0);
        showScreen('game-screen');
        gameState = 'playing';
        playStartTime = Date.now();
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }

    // ========== 关卡初始化 ==========
    function initStage(stageIndex) {
        if (stageIndex >= STAGES.length) {
            stageIndex = STAGES.length - 1; // 最后一关循环
        }
        gameData.currentStage = stageIndex;
        stage = STAGES[stageIndex];
        bossSpawned = false;

        // 初始化玩家
        const charData = CHARACTER_DATA[gameData.charType];
        const stats = calcPlayerStats();
        player = {
            x: 100, y: GROUND_Y - charData.height,
            vx: 0, vy: 0,
            width: charData.width, height: charData.height,
            hp: stats.maxHp, maxHp: stats.maxHp,
            mp: stats.maxMp, maxMp: stats.maxMp,
            atk: stats.atk, def: stats.def,
            speed: charData.speed,
            jumpPower: charData.jumpPower,
            critRate: stats.critRate,
            grounded: true,
            facing: 1, // 1=right, -1=left
            attacking: false,
            attackTimer: 0,
            invincible: 0,
            color: charData.bodyColor,
            charData: charData
        };

        playerRage = 0;
        skillCooldowns = { skill: 0, ultimate: 0 };
        comboCount = 0;
        comboTimer = 0;

        // 生成敌人
        enemies = [];
        let totalEnemies = 0;
        for (const eg of stage.enemies) {
            const template = ENEMY_TEMPLATES[eg.type];
            for (let i = 0; i < eg.count; i++) {
                const scaleFactor = 1 + stageIndex * 0.15;
                enemies.push(createEnemy(template, scaleFactor));
                totalEnemies++;
            }
        }
        enemiesRemaining = totalEnemies;

        projectiles = [];
        particles = [];
        damageNumbers = [];
        camera.x = 0;

        updateHUD();
        $('boss-hp-container').classList.add('hidden');
        $('stage-name').textContent = stage.name;
    }

    function createEnemy(template, scale) {
        return {
            x: 300 + Math.random() * (worldWidth - 500),
            y: GROUND_Y - template.height,
            vx: 0, vy: 0,
            width: template.width, height: template.height,
            hp: Math.floor(template.hp * scale),
            maxHp: Math.floor(template.hp * scale),
            atk: Math.floor(template.atk * scale),
            def: Math.floor(template.def * scale),
            speed: template.speed,
            color: template.color,
            name: template.name,
            exp: Math.floor(template.exp * scale),
            gold: Math.floor(template.gold * scale),
            grounded: true,
            facing: -1,
            isBoss: false,
            attackTimer: 0,
            attackCd: 1500 + Math.random() * 1000,
            ai: { state: 'idle', timer: 0 },
            invincible: 0
        };
    }

    function createBoss(bossData) {
        const scale = 1 + gameData.currentStage * 0.1;
        return {
            x: worldWidth - 300,
            y: GROUND_Y - bossData.height,
            vx: 0, vy: 0,
            width: bossData.width, height: bossData.height,
            hp: Math.floor(bossData.hp * scale),
            maxHp: Math.floor(bossData.hp * scale),
            atk: Math.floor(bossData.atk * scale),
            def: Math.floor(bossData.def * scale),
            speed: bossData.speed,
            color: bossData.color,
            name: bossData.name,
            exp: bossData.expReward,
            gold: bossData.goldReward,
            grounded: true,
            facing: -1,
            isBoss: true,
            attackTimer: 0,
            attackCd: 2000,
            ai: { state: 'idle', timer: 0 },
            skills: bossData.skills,
            currentSkill: null,
            skillTimer: 0,
            invincible: 0
        };
    }

    // ========== 属性计算 ==========
    function calcPlayerStats() {
        const cd = CHARACTER_DATA[gameData.charType];
        const lv = gameData.level;
        let atk = cd.baseAtk + cd.atkGrowth * (lv - 1);
        let def = cd.baseDef + cd.defGrowth * (lv - 1);
        let maxHp = cd.baseHp + cd.hpGrowth * (lv - 1);
        let maxMp = cd.baseMp + cd.mpGrowth * (lv - 1);
        let critRate = cd.critRate;

        // 装备加成
        for (const slot of ['weapon', 'armor', 'accessory']) {
            const item = gameData.equipped[slot];
            if (item) {
                if (item.atk) atk += item.atk;
                if (item.def) def += item.def;
                if (item.hp) maxHp += item.hp;
                if (item.mp) maxMp += item.mp;
                if (item.crit) critRate += item.crit;
            }
        }

        return { atk, def, maxHp, maxMp, critRate };
    }

    // ========== 游戏主循环 ==========
    function gameLoop(timestamp) {
        if (gameState !== 'playing') {
            if (gameState !== 'menu') requestAnimationFrame(gameLoop);
            return;
        }

        const dt = Math.min(timestamp - lastTime, 33); // cap at ~30fps delta
        lastTime = timestamp;
        animFrame++;

        update(dt);
        render();

        requestAnimationFrame(gameLoop);
    }

    // ========== 更新 ==========
    function update(dt) {
        updatePlayer(dt);
        updateEnemies(dt);
        updateProjectiles(dt);
        updateParticles(dt);
        updateDamageNumbers(dt);
        updateCamera();
        updateCooldowns(dt);
        updateCombo(dt);
        checkStageProgress();
        updateHUD();
    }

    function updatePlayer(dt) {
        if (!player) return;

        // 移动
        let moveX = 0;
        if (keys['arrowleft'] || keys['a']) { moveX = -1; player.facing = -1; }
        if (keys['arrowright'] || keys['d']) { moveX = 1; player.facing = 1; }
        player.vx = moveX * player.speed;

        // 跳跃
        if ((keys['arrowup'] || keys['w']) && player.grounded) {
            player.vy = -player.jumpPower;
            player.grounded = false;
        }

        // 攻击
        if (keys['j'] && !player.attacking) {
            playerAttack('normal');
        }
        if (keys['k'] && !player.attacking && skillCooldowns.skill <= 0 && player.mp >= player.charData.skills.skill.mp) {
            playerAttack('skill');
        }
        if (keys['l'] && !player.attacking && playerRage >= 100 && player.mp >= (player.charData.skills.ultimate.mp || 0)) {
            playerAttack('ultimate');
        }

        // 物理
        player.vy += GRAVITY;
        player.x += player.vx;
        player.y += player.vy;

        // 地面碰撞
        if (player.y >= GROUND_Y - player.height) {
            player.y = GROUND_Y - player.height;
            player.vy = 0;
            player.grounded = true;
        }

        // 平台碰撞
        if (stage && stage.platforms) {
            for (const p of stage.platforms) {
                if (player.vy > 0 &&
                    player.x + player.width > p.x && player.x < p.x + p.w &&
                    player.y + player.height >= p.y && player.y + player.height <= p.y + p.h + 10) {
                    player.y = p.y - player.height;
                    player.vy = 0;
                    player.grounded = true;
                }
            }
        }

        // 边界
        player.x = Math.max(0, Math.min(worldWidth - player.width, player.x));

        // 攻击动画
        if (player.attacking) {
            player.attackTimer -= dt;
            if (player.attackTimer <= 0) {
                player.attacking = false;
            }
        }

        // 无敌帧
        if (player.invincible > 0) player.invincible -= dt;

        // MP回复
        if (animFrame % 120 === 0) {
            player.mp = Math.min(player.maxMp, player.mp + 2);
        }
    }

    function playerAttack(type) {
        const skillData = player.charData.skills[type];
        player.attacking = true;
        player.attackTimer = 300;
        attackAnim = 300;

        // MP消耗
        if (skillData.mp > 0) player.mp -= skillData.mp;

        // 怒气消耗/积攒
        if (type === 'ultimate') {
            playerRage = 0;
        }

        // 冷却
        if (type === 'skill') {
            skillCooldowns.skill = skillData.cd;
        }

        // 发射投射物或范围攻击
        if (skillData.projectile || type === 'ultimate') {
            createProjectile(type, skillData);
        }

        // 检测命中
        const stats = calcPlayerStats();
        const damage = Math.floor(stats.atk * skillData.damage);
        const attackBox = {
            x: player.facing > 0 ? player.x + player.width : player.x - skillData.range,
            y: player.y - 10,
            width: skillData.range,
            height: player.height + 20
        };

        // 攻击特效
        spawnAttackEffect(player, type);

        for (const enemy of enemies) {
            if (enemy.hp <= 0) continue;
            if (rectCollide(attackBox, enemy)) {
                const isCrit = Math.random() < stats.critRate;
                let dmg = Math.max(1, damage - enemy.def + (isCrit ? Math.floor(damage * 0.5) : 0));
                enemy.hp -= dmg;
                enemy.invincible = 200;
                enemy.vx = player.facing * 5;
                enemy.vy = -3;

                gameData.stats.totalDamage += dmg;
                addDamageNumber(enemy.x + enemy.width / 2, enemy.y, dmg, isCrit);

                comboCount++;
                comboTimer = 2000;

                if (type !== 'ultimate') {
                    playerRage = Math.min(100, playerRage + 5 + (isCrit ? 5 : 0));
                }

                if (enemy.hp <= 0) {
                    onEnemyKill(enemy);
                }
            }
        }
    }

    function createProjectile(type, skillData) {
        projectiles.push({
            x: player.x + (player.facing > 0 ? player.width : 0),
            y: player.y + player.height / 2 - 10,
            vx: player.facing * 8,
            vy: 0,
            width: type === 'ultimate' ? 60 : 20,
            height: type === 'ultimate' ? 40 : 15,
            damage: Math.floor(calcPlayerStats().atk * skillData.damage),
            color: type === 'ultimate' ? '#FFD700' : '#87CEEB',
            lifetime: 1000,
            isUltimate: type === 'ultimate',
            owner: 'player'
        });
    }

    function onEnemyKill(enemy) {
        gameData.exp += enemy.exp;
        gameData.gold += enemy.gold;
        gameData.score += enemy.exp * 10;
        gameData.stats.totalKills++;

        if (enemy.isBoss) {
            gameData.stats.bossKills++;
        }

        // 击杀特效
        for (let i = 0; i < 15; i++) {
            particles.push({
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6 - 2,
                life: 500 + Math.random() * 500,
                color: enemy.isBoss ? '#FFD700' : enemy.color,
                size: enemy.isBoss ? 5 : 3
            });
        }

        // 掉落装备
        if (Math.random() < (enemy.isBoss ? 0.8 : 0.15)) {
            dropItem(enemy);
        }

        if (!enemy.isBoss) {
            enemiesRemaining--;
        }

        // 检测升级
        checkLevelUp();
    }

    function dropItem(enemy) {
        const rarity = enemy.isBoss ? getRandomRarity(0.1, 0.3, 0.4) : getRandomRarity(0.6, 0.3, 0.08);
        const candidates = ITEM_POOL.filter(i => i.rarity === rarity);
        if (candidates.length === 0) return;
        const item = { ...candidates[Math.floor(Math.random() * candidates.length)] };
        gameData.inventory.push(item);

        addDamageNumber(enemy.x + enemy.width / 2, enemy.y - 20,
            `获得 ${item.name}`, false, getRarityColor(item.rarity));
    }

    function getRandomRarity(commonChance, rareChance, epicChance) {
        const r = Math.random();
        if (r < commonChance) return 'common';
        if (r < commonChance + rareChance) return 'rare';
        if (r < commonChance + rareChance + epicChance) return 'epic';
        return 'legendary';
    }

    function getRarityColor(rarity) {
        const colors = { common: '#808080', rare: '#4a90d9', epic: '#a855f7', legendary: '#ffd700' };
        return colors[rarity] || '#fff';
    }

    function checkLevelUp() {
        while (gameData.exp >= gameData.expToNext) {
            gameData.exp -= gameData.expToNext;
            gameData.level++;
            gameData.expToNext = Math.floor(100 * Math.pow(1.3, gameData.level - 1));

            const stats = calcPlayerStats();
            player.maxHp = stats.maxHp;
            player.maxMp = stats.maxMp;
            player.hp = stats.maxHp;
            player.mp = stats.maxMp;
            player.atk = stats.atk;
            player.def = stats.def;
            player.critRate = stats.critRate;

            gameState = 'paused';
            $('level-up-text').textContent = `达到 Lv.${gameData.level}`;
            $('level-up-stats').textContent = `攻击+${CHARACTER_DATA[gameData.charType].atkGrowth} 防御+${CHARACTER_DATA[gameData.charType].defGrowth} 生命+${CHARACTER_DATA[gameData.charType].hpGrowth} 法力+${CHARACTER_DATA[gameData.charType].mpGrowth}`;
            $('level-up-notice').classList.remove('hidden');
        }
    }

    // ========== 敌人AI ==========
    function updateEnemies(dt) {
        for (const e of enemies) {
            if (e.hp <= 0) continue;

            // AI状态机
            const dist = Math.abs(e.x - player.x);
            const dir = player.x > e.x ? 1 : -1;

            if (e.isBoss) {
                updateBossAI(e, dt, dist, dir);
            } else {
                updateEnemyAI(e, dt, dist, dir);
            }

            // 物理
            e.vy += GRAVITY;
            e.x += e.vx;
            e.y += e.vy;

            // 地面
            if (e.y >= GROUND_Y - e.height) {
                e.y = GROUND_Y - e.height;
                e.vy = 0;
                e.grounded = true;
            }

            // 平台
            if (stage && stage.platforms) {
                for (const p of stage.platforms) {
                    if (e.vy > 0 &&
                        e.x + e.width > p.x && e.x < p.x + p.w &&
                        e.y + e.height >= p.y && e.y + e.height <= p.y + p.h + 10) {
                        e.y = p.y - e.height;
                        e.vy = 0;
                        e.grounded = true;
                    }
                }
            }

            e.x = Math.max(0, Math.min(worldWidth - e.width, e.x));

            // 无敌帧
            if (e.invincible > 0) e.invincible -= dt;

            // 碰撞伤害
            if (player.invincible <= 0 && rectCollide(player, e) && e.hp > 0) {
                const dmg = Math.max(1, e.atk - player.def);
                player.hp -= dmg;
                player.invincible = 500;
                player.vx = (player.x > e.x ? 1 : -1) * 6;
                player.vy = -5;
                addDamageNumber(player.x + player.width / 2, player.y, dmg, false, '#ff4444');

                if (player.hp <= 0) {
                    onPlayerDeath();
                }
            }

            // 减速
            e.vx *= 0.9;
        }

        // 清除死亡敌人
        enemies = enemies.filter(e => e.hp > 0 || e.invincible > -500);
    }

    function updateEnemyAI(e, dt, dist, dir) {
        e.ai.timer -= dt;
        e.attackTimer -= dt;

        if (dist < 300) {
            // 接近玩家
            e.facing = dir;
            if (dist > 50) {
                e.vx = dir * e.speed * 0.7;
            } else if (e.attackTimer <= 0) {
                // 攻击
                enemyAttack(e);
                e.attackTimer = e.attackCd;
            }
        } else if (e.ai.timer <= 0) {
            // 随机巡逻
            e.ai.state = Math.random() > 0.3 ? 'patrol' : 'idle';
            e.ai.timer = 1000 + Math.random() * 2000;
            if (e.ai.state === 'patrol') {
                e.facing = Math.random() > 0.5 ? 1 : -1;
            }
        }

        if (e.ai.state === 'patrol' && dist >= 300) {
            e.vx = e.facing * e.speed * 0.4;
        }
    }

    function updateBossAI(boss, dt, dist, dir) {
        boss.ai.timer -= dt;
        boss.attackTimer -= dt;
        boss.facing = dir;

        if (boss.ai.timer <= 0) {
            // 选择行为
            const r = Math.random();
            if (r < 0.3 && dist > 100) {
                boss.ai.state = 'approach';
                boss.ai.timer = 1500;
            } else if (r < 0.6) {
                boss.ai.state = 'attack';
                boss.ai.timer = 800;
            } else {
                boss.ai.state = 'skill';
                boss.ai.timer = 1200;
            }
        }

        switch (boss.ai.state) {
            case 'approach':
                if (dist > 60) {
                    boss.vx = dir * boss.speed;
                }
                break;
            case 'attack':
                if (dist < 80 && boss.attackTimer <= 0) {
                    enemyAttack(boss);
                    boss.attackTimer = boss.attackCd;
                    boss.ai.state = 'idle';
                    boss.ai.timer = 500;
                } else if (dist >= 80) {
                    boss.vx = dir * boss.speed * 1.5;
                }
                break;
            case 'skill':
                if (boss.attackTimer <= 0) {
                    bossSkillAttack(boss);
                    boss.attackTimer = boss.attackCd * 1.5;
                    boss.ai.state = 'idle';
                    boss.ai.timer = 1000;
                }
                break;
        }
    }

    function enemyAttack(enemy) {
        if (player.invincible > 0) return;
        const attackRange = enemy.isBoss ? 80 : 50;
        const attackBox = {
            x: enemy.facing > 0 ? enemy.x + enemy.width : enemy.x - attackRange,
            y: enemy.y,
            width: attackRange,
            height: enemy.height
        };

        if (rectCollide(attackBox, player)) {
            const dmg = Math.max(1, enemy.atk - player.def);
            player.hp -= dmg;
            player.invincible = 400;
            player.vx = (player.x > enemy.x ? 1 : -1) * 8;
            player.vy = -4;
            addDamageNumber(player.x + player.width / 2, player.y, dmg, false, '#ff4444');

            if (player.hp <= 0) onPlayerDeath();
        }

        // 攻击特效
        spawnAttackEffect(enemy, 'normal');
    }

    function bossSkillAttack(boss) {
        // Boss特殊技能
        const skillIdx = Math.floor(Math.random() * (boss.skills ? boss.skills.length : 1));
        const skill = boss.skills ? boss.skills[skillIdx] : 'charge';

        switch (skill) {
            case 'charge':
                boss.vx = boss.facing * 12;
                boss.vy = -5;
                break;
            case 'slam':
                if (Math.abs(boss.x - player.x) < 150) {
                    const dmg = Math.max(1, Math.floor(boss.atk * 1.5) - player.def);
                    if (player.invincible <= 0) {
                        player.hp -= dmg;
                        player.invincible = 600;
                        player.vy = -10;
                        addDamageNumber(player.x + player.width / 2, player.y, dmg, false, '#ff0000');
                        if (player.hp <= 0) onPlayerDeath();
                    }
                    // 震地特效
                    for (let i = 0; i < 10; i++) {
                        particles.push({
                            x: boss.x + boss.width / 2 + (Math.random() - 0.5) * 200,
                            y: GROUND_Y - 5,
                            vx: (Math.random() - 0.5) * 4,
                            vy: -Math.random() * 8,
                            life: 400, color: '#8B4513', size: 4
                        });
                    }
                }
                break;
            case 'darkBlast':
            case 'fireBreath':
            case 'thirdEye':
                projectiles.push({
                    x: boss.x + (boss.facing > 0 ? boss.width : 0),
                    y: boss.y + boss.height / 3,
                    vx: boss.facing * 6,
                    vy: 0,
                    width: 30, height: 25,
                    damage: Math.floor(boss.atk * 1.8),
                    color: skill === 'fireBreath' ? '#FF4500' : skill === 'thirdEye' ? '#FFD700' : '#4a004a',
                    lifetime: 1500,
                    owner: 'enemy'
                });
                break;
            case 'stomp':
                boss.vy = -15;
                setTimeout(() => {
                    if (boss.hp > 0 && player && Math.abs(boss.x - player.x) < 120) {
                        if (player.invincible <= 0) {
                            const dmg = Math.max(1, Math.floor(boss.atk * 2) - player.def);
                            player.hp -= dmg;
                            player.invincible = 600;
                            addDamageNumber(player.x, player.y, dmg, false, '#ff0000');
                            if (player.hp <= 0) onPlayerDeath();
                        }
                    }
                }, 600);
                break;
            case 'dogAttack':
            case 'tripleStrike':
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        if (boss.hp <= 0) return;
                        projectiles.push({
                            x: boss.x + (boss.facing > 0 ? boss.width : 0),
                            y: boss.y + boss.height / 3 + (i - 1) * 20,
                            vx: boss.facing * 7,
                            vy: (i - 1) * 1.5,
                            width: 20, height: 15,
                            damage: Math.floor(boss.atk * 1.2),
                            color: '#DAA520',
                            lifetime: 1200,
                            owner: 'enemy'
                        });
                    }, i * 200);
                }
                break;
        }
    }

    // ========== 投射物 ==========
    function updateProjectiles(dt) {
        for (const p of projectiles) {
            p.x += p.vx;
            p.y += p.vy;
            p.lifetime -= dt;

            // 玩家投射物碰撞敌人
            if (p.owner === 'player') {
                for (const e of enemies) {
                    if (e.hp <= 0 || e.invincible > 0) continue;
                    if (rectCollide(p, e)) {
                        const dmg = Math.max(1, p.damage - e.def);
                        e.hp -= dmg;
                        e.invincible = 200;
                        addDamageNumber(e.x + e.width / 2, e.y, dmg, false);
                        p.lifetime = 0;
                        if (e.hp <= 0) onEnemyKill(e);
                        break;
                    }
                }
            }
            // 敌人投射物碰撞玩家
            else if (p.owner === 'enemy' && player.invincible <= 0) {
                if (rectCollide(p, player)) {
                    const dmg = Math.max(1, p.damage - player.def);
                    player.hp -= dmg;
                    player.invincible = 400;
                    addDamageNumber(player.x + player.width / 2, player.y, dmg, false, '#ff4444');
                    p.lifetime = 0;
                    if (player.hp <= 0) onPlayerDeath();
                }
            }

            // 粒子尾迹
            if (animFrame % 3 === 0) {
                particles.push({
                    x: p.x + p.width / 2,
                    y: p.y + p.height / 2,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    life: 200,
                    color: p.color,
                    size: 2
                });
            }
        }
        projectiles = projectiles.filter(p => p.lifetime > 0);
    }

    // ========== 粒子效果 ==========
    function updateParticles(dt) {
        for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= dt;
        }
        particles = particles.filter(p => p.life > 0);
    }

    function updateDamageNumbers(dt) {
        for (const d of damageNumbers) {
            d.y -= 1;
            d.life -= dt;
            d.alpha = Math.max(0, d.life / d.maxLife);
        }
        damageNumbers = damageNumbers.filter(d => d.life > 0);
    }

    function addDamageNumber(x, y, value, isCrit, color) {
        damageNumbers.push({
            x, y,
            value: typeof value === 'string' ? value : (isCrit ? value + '!' : String(value)),
            color: color || (isCrit ? '#FFD700' : '#FFFFFF'),
            life: 1000, maxLife: 1000,
            alpha: 1,
            size: isCrit ? 24 : 18
        });
    }

    function spawnAttackEffect(entity, type) {
        const colors = {
            normal: '#fff',
            skill: '#87CEEB',
            ultimate: '#FFD700'
        };
        const count = type === 'ultimate' ? 20 : type === 'skill' ? 10 : 5;
        for (let i = 0; i < count; i++) {
            particles.push({
                x: entity.x + (entity.facing > 0 ? entity.width + 10 : -10),
                y: entity.y + entity.height / 2 + (Math.random() - 0.5) * 30,
                vx: entity.facing * (2 + Math.random() * 4),
                vy: (Math.random() - 0.5) * 4,
                life: 200 + Math.random() * 300,
                color: colors[type] || '#fff',
                size: type === 'ultimate' ? 4 : 2
            });
        }
    }

    // ========== 摄像机 ==========
    function updateCamera() {
        const targetX = player.x - CANVAS_W / 2 + player.width / 2;
        camera.x += (targetX - camera.x) * 0.1;
        camera.x = Math.max(0, Math.min(worldWidth - CANVAS_W, camera.x));
    }

    function updateCooldowns(dt) {
        if (skillCooldowns.skill > 0) skillCooldowns.skill -= dt;
        if (attackAnim > 0) attackAnim -= dt;
    }

    function updateCombo(dt) {
        if (comboTimer > 0) {
            comboTimer -= dt;
            if (comboTimer <= 0) comboCount = 0;
        }
    }

    // ========== 关卡进度 ==========
    function checkStageProgress() {
        if (stageTransition) return;

        // 所有小怪死完后出Boss
        if (!bossSpawned && enemiesRemaining <= 0) {
            bossSpawned = true;
            const bossEntity = createBoss(stage.boss);
            enemies.push(bossEntity);
            $('boss-hp-container').classList.remove('hidden');
            $('boss-name').textContent = stage.boss.name;
            updateBossHUD(bossEntity);
        }

        // Boss死亡 -> 通关
        if (bossSpawned) {
            const boss = enemies.find(e => e.isBoss);
            if (boss) {
                updateBossHUD(boss);
                if (boss.hp <= 0) {
                    onStageClear();
                }
            }
        }
    }

    function updateBossHUD(boss) {
        const pct = Math.max(0, boss.hp / boss.maxHp * 100);
        $('boss-hp-bar').style.width = pct + '%';
        $('boss-hp-text').textContent = `${Math.max(0, boss.hp)}/${boss.maxHp}`;
    }

    function onStageClear() {
        stageTransition = true;
        gameState = 'paused';

        const rewards = {
            exp: stage.boss.expReward,
            gold: stage.boss.goldReward,
            score: stage.boss.expReward * 20
        };
        gameData.score += rewards.score;

        $('clear-title').textContent = `${stage.name} 通关！`;
        $('clear-rewards').innerHTML = `
            <p style="color:#a0ffa0">经验值 +${rewards.exp}</p>
            <p style="color:#ffd700">金币 +${rewards.gold}</p>
            <p style="color:#a0d0ff">得分 +${rewards.score}</p>
            <p style="color:#e0d0b0; margin-top:10px">击杀数: ${gameData.stats.totalKills}</p>
            <p style="color:#e0d0b0">连击最高: ${comboCount}</p>
        `;
        $('stage-clear').classList.remove('hidden');

        // 自动保存
        saveGame();
    }

    function nextStage() {
        stageTransition = false;
        $('stage-clear').classList.add('hidden');
        $('boss-hp-container').classList.add('hidden');

        if (gameData.currentStage + 1 >= STAGES.length) {
            // 全部通关
            alert('恭喜你！你已通关所有关卡！游戏目前Demo到此结束。');
            quitToMenu();
            return;
        }

        initStage(gameData.currentStage + 1);
        gameState = 'playing';
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }

    function onPlayerDeath() {
        gameData.stats.deaths++;
        gameState = 'paused';
        $('game-over').classList.remove('hidden');
        saveGame();
    }

    function retryStage() {
        $('game-over').classList.add('hidden');
        initStage(gameData.currentStage);
        gameState = 'playing';
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }

    // ========== 碰撞检测 ==========
    function rectCollide(a, b) {
        return a.x < b.x + b.width && a.x + a.width > b.x &&
            a.y < b.y + b.height && a.y + a.height > b.y;
    }

    // ========== 渲染 ==========
    function render() {
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

        // 背景
        renderBackground();

        ctx.save();
        ctx.translate(-camera.x, 0);

        // 平台
        renderPlatforms();

        // 玩家
        renderPlayer();

        // 敌人
        renderEnemies();

        // 投射物
        renderProjectiles();

        // 粒子
        renderParticles();

        // 伤害数字
        renderDamageNumbers();

        ctx.restore();

        // 连击显示
        renderCombo();
    }

    function renderBackground() {
        if (!stage) return;
        const colors = stage.bgColors;

        // 天空渐变
        const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
        skyGrad.addColorStop(0, colors[0]);
        skyGrad.addColorStop(0.6, colors[1]);
        skyGrad.addColorStop(1, colors[2]);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // 远景山
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        for (let i = 0; i < 5; i++) {
            const mx = i * 300 - camera.x * 0.2;
            drawMountain(mx, GROUND_Y - 100, 200, 120);
        }

        // 中景树
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        for (let i = 0; i < 8; i++) {
            const tx = i * 200 - camera.x * 0.4;
            drawTree(tx, GROUND_Y - 50, 15, 60);
        }

        // 地面
        ctx.fillStyle = stage.groundColor;
        ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

        // 地面纹理
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        for (let x = -camera.x % 40; x < CANVAS_W; x += 40) {
            ctx.fillRect(x, GROUND_Y + 2, 20, 3);
        }
    }

    function drawMountain(x, baseY, w, h) {
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.lineTo(x + w / 2, baseY - h);
        ctx.lineTo(x + w, baseY);
        ctx.closePath();
        ctx.fill();
    }

    function drawTree(x, baseY, trunkW, height) {
        ctx.fillRect(x - trunkW / 2, baseY - height, trunkW, height);
        ctx.beginPath();
        ctx.arc(x, baseY - height, 25, 0, Math.PI * 2);
        ctx.fill();
    }

    function renderPlatforms() {
        if (!stage || !stage.platforms) return;
        for (const p of stage.platforms) {
            ctx.fillStyle = '#5a4a3a';
            ctx.fillRect(p.x, p.y, p.w, p.h);
            ctx.fillStyle = '#7a6a4a';
            ctx.fillRect(p.x, p.y, p.w, 4);
            ctx.strokeStyle = '#3a2a1a';
            ctx.lineWidth = 1;
            ctx.strokeRect(p.x, p.y, p.w, p.h);
        }
    }

    function renderPlayer() {
        if (!player) return;
        const p = player;
        const blink = p.invincible > 0 && Math.floor(animFrame / 3) % 2 === 0;
        if (blink) return;

        ctx.save();
        ctx.translate(p.x + p.width / 2, p.y + p.height);
        if (p.facing < 0) ctx.scale(-1, 1);

        // 身体
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.width / 2, -p.height, p.width, p.height);

        // 头
        const headSize = p.width * 0.7;
        ctx.fillStyle = lightenColor(p.color, 30);
        ctx.beginPath();
        ctx.arc(0, -p.height - headSize / 2 + 5, headSize / 2, 0, Math.PI * 2);
        ctx.fill();

        // 眼睛
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(5, -p.height - headSize / 2 + 3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(6, -p.height - headSize / 2 + 2, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // 武器 (攻击时动画)
        if (p.attacking || attackAnim > 0) {
            const swingAngle = (attackAnim / 300) * Math.PI * 0.8 - Math.PI * 0.2;
            ctx.save();
            ctx.translate(p.width / 2, -p.height * 0.5);
            ctx.rotate(swingAngle);
            ctx.fillStyle = '#8B8B00';
            ctx.fillRect(0, -3, 40, 6);
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(35, -5, 10, 10);
            ctx.restore();
        } else {
            // 静止时武器
            ctx.fillStyle = '#8B8B00';
            ctx.fillRect(p.width / 2 - 5, -p.height * 0.6, 30, 4);
        }

        // 腿部走路动画
        const walkCycle = Math.sin(animFrame * 0.2) * 5;
        ctx.fillStyle = darkenColor(p.color, 30);
        ctx.fillRect(-p.width / 4 - 5, -8 + walkCycle, 8, 10);
        ctx.fillRect(p.width / 4 - 3, -8 - walkCycle, 8, 10);

        ctx.restore();

        // 名字
        ctx.fillStyle = '#ffd700';
        ctx.font = '12px "Microsoft YaHei"';
        ctx.textAlign = 'center';
        ctx.fillText(CHARACTER_DATA[gameData.charType].name, p.x + p.width / 2, p.y - 15);

        // HP条
        renderEntityHpBar(p);
    }

    function renderEnemies() {
        for (const e of enemies) {
            if (e.hp <= 0) continue;
            const blink = e.invincible > 0 && Math.floor(animFrame / 3) % 2 === 0;
            if (blink) continue;

            ctx.save();
            ctx.translate(e.x + e.width / 2, e.y + e.height);
            if (e.facing < 0) ctx.scale(-1, 1);

            // 身体
            ctx.fillStyle = e.color;
            ctx.fillRect(-e.width / 2, -e.height, e.width, e.height);

            // 头
            const headSize = e.width * 0.6;
            ctx.fillStyle = lightenColor(e.color, 20);
            ctx.beginPath();
            ctx.arc(0, -e.height - headSize / 2 + 5, headSize / 2, 0, Math.PI * 2);
            ctx.fill();

            // Boss特效
            if (e.isBoss) {
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, -e.height - headSize / 2 + 5, headSize / 2 + 5, 0, Math.PI * 2);
                ctx.stroke();

                // Boss光环
                ctx.globalAlpha = 0.2 + Math.sin(animFrame * 0.05) * 0.1;
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.arc(0, -e.height / 2, e.width, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            // 眼睛
            ctx.fillStyle = e.isBoss ? '#ff0000' : '#ff4444';
            ctx.beginPath();
            ctx.arc(4, -e.height - headSize / 2 + 3, 2.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();

            // 名字
            ctx.fillStyle = e.isBoss ? '#ff4444' : '#e0d0b0';
            ctx.font = e.isBoss ? 'bold 14px "Microsoft YaHei"' : '11px "Microsoft YaHei"';
            ctx.textAlign = 'center';
            ctx.fillText(e.name, e.x + e.width / 2, e.y - 18);

            renderEntityHpBar(e);
        }
    }

    function renderEntityHpBar(entity) {
        const barW = Math.max(entity.width, 40);
        const barH = 4;
        const barX = entity.x + entity.width / 2 - barW / 2;
        const barY = entity.y - 10;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX, barY, barW, barH);

        const pct = Math.max(0, entity.hp / entity.maxHp);
        const hue = pct > 0.5 ? '#4CAF50' : pct > 0.25 ? '#FF9800' : '#f44336';
        ctx.fillStyle = hue;
        ctx.fillRect(barX, barY, barW * pct, barH);
    }

    function renderProjectiles() {
        for (const p of projectiles) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            if (p.isUltimate) {
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 15;
            }
            ctx.ellipse(p.x + p.width / 2, p.y + p.height / 2, p.width / 2, p.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        }
    }

    function renderParticles() {
        for (const p of particles) {
            ctx.globalAlpha = Math.max(0, p.life / 500);
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        ctx.globalAlpha = 1;
    }

    function renderDamageNumbers() {
        for (const d of damageNumbers) {
            ctx.globalAlpha = d.alpha;
            ctx.fillStyle = d.color;
            ctx.font = `bold ${d.size}px "Microsoft YaHei"`;
            ctx.textAlign = 'center';
            ctx.fillText(d.value, d.x, d.y);
        }
        ctx.globalAlpha = 1;
    }

    function renderCombo() {
        if (comboCount > 1) {
            ctx.fillStyle = `rgba(255, 215, 0, ${Math.min(1, comboTimer / 500)})`;
            ctx.font = `bold ${20 + Math.min(comboCount, 20)}px "Microsoft YaHei"`;
            ctx.textAlign = 'right';
            ctx.fillText(`${comboCount} 连击!`, CANVAS_W - 20, CANVAS_H - 30);
        }
    }

    // ========== HUD更新 ==========
    function updateHUD() {
        if (!player) return;

        $('hud-char-name').textContent = CHARACTER_DATA[gameData.charType].name;
        $('hud-level').textContent = `Lv.${gameData.level}`;

        const hpPct = Math.max(0, player.hp / player.maxHp * 100);
        $('hp-bar').style.width = hpPct + '%';
        $('hp-text').textContent = `${Math.max(0, Math.floor(player.hp))}/${player.maxHp}`;

        const mpPct = Math.max(0, player.mp / player.maxMp * 100);
        $('mp-bar').style.width = mpPct + '%';
        $('mp-text').textContent = `${Math.max(0, Math.floor(player.mp))}/${player.maxMp}`;

        $('rage-bar').style.width = playerRage + '%';
        $('rage-text').textContent = `${Math.floor(playerRage)}/100`;

        const expPct = gameData.expToNext > 0 ? (gameData.exp / gameData.expToNext * 100) : 0;
        $('exp-bar').style.width = expPct + '%';
        $('exp-text').textContent = `${gameData.exp}/${gameData.expToNext}`;

        $('hud-gold').textContent = `💰 ${gameData.gold}`;
        $('hud-score').textContent = `得分: ${gameData.score}`;

        // 技能冷却
        if (skillCooldowns.skill > 0) {
            const cd = CHARACTER_DATA[gameData.charType].skills.skill.cd;
            $('skill-k-cd').style.height = (skillCooldowns.skill / cd * 100) + '%';
        } else {
            $('skill-k-cd').style.height = '0%';
        }

        const ragePct = 100 - playerRage;
        $('skill-l-cd').style.height = ragePct + '%';
    }

    // ========== 暂停 ==========
    function togglePause() {
        if (gameState === 'playing') {
            gameState = 'paused';
            $('pause-menu').classList.remove('hidden');
        } else if (gameState === 'paused' && !$('pause-menu').classList.contains('hidden')) {
            gameState = 'playing';
            $('pause-menu').classList.add('hidden');
            lastTime = performance.now();
            requestAnimationFrame(gameLoop);
        }
    }

    function quitToMenu() {
        gameState = 'menu';
        $('pause-menu').classList.add('hidden');
        $('game-over').classList.add('hidden');
        $('stage-clear').classList.add('hidden');
        $('level-up-notice').classList.add('hidden');
        $('inventory-screen').classList.add('hidden');
        showScreen('main-menu');
        checkSaveExists();
    }

    // ========== 背包/装备 ==========
    function showInventory() {
        $('pause-menu').classList.add('hidden');
        $('inventory-screen').classList.remove('hidden');

        const stats = calcPlayerStats();
        $('inv-level').textContent = gameData.level;
        $('inv-atk').textContent = stats.atk;
        $('inv-def').textContent = stats.def;
        $('inv-hp').textContent = stats.maxHp;
        $('inv-mp').textContent = stats.maxMp;
        $('inv-crit').textContent = Math.floor(stats.critRate * 100) + '%';
        $('inv-gold').textContent = gameData.gold;

        // 已装备
        for (const slot of ['weapon', 'armor', 'accessory']) {
            const item = gameData.equipped[slot];
            const el = $(`equip-${slot}`);
            if (item) {
                el.textContent = item.name;
                el.style.color = getRarityColor(item.rarity);
            } else {
                el.textContent = '无';
                el.style.color = '#888';
            }
        }

        // 背包物品
        const invEl = $('inv-items');
        invEl.innerHTML = '';
        gameData.inventory.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = `inv-item rarity-${item.rarity}`;

            const isEquipped = Object.values(gameData.equipped).some(e => e && e.id === item.id);
            if (isEquipped) div.classList.add('equipped');

            let statText = '';
            if (item.atk) statText += `攻+${item.atk} `;
            if (item.def) statText += `防+${item.def} `;
            if (item.hp) statText += `血+${item.hp} `;
            if (item.mp) statText += `蓝+${item.mp} `;
            if (item.crit) statText += `暴+${Math.floor(item.crit * 100)}%`;
            if (item.healHp) statText += `回血${item.healHp}`;
            if (item.healMp) statText += `回蓝${item.healMp}`;

            div.innerHTML = `<span class="item-name" style="color:${getRarityColor(item.rarity)}">${item.name}</span><span class="item-stat">${statText}</span>`;

            div.addEventListener('click', () => {
                onItemClick(item, idx);
                showInventory(); // refresh
            });

            invEl.appendChild(div);
        });
    }

    function onItemClick(item, idx) {
        if (item.type === 'consumable') {
            // 使用消耗品
            if (item.healHp && player) {
                player.hp = Math.min(player.maxHp, player.hp + item.healHp);
            }
            if (item.healMp && player) {
                player.mp = Math.min(player.maxMp, player.mp + item.healMp);
            }
            gameData.inventory.splice(idx, 1);
        } else if (['weapon', 'armor', 'accessory'].includes(item.type)) {
            // 装备/卸下
            const currentEquip = gameData.equipped[item.type];
            if (currentEquip && currentEquip.id === item.id) {
                // 卸下
                gameData.equipped[item.type] = null;
            } else {
                // 装备
                gameData.equipped[item.type] = item;
            }
            // 重新计算属性
            if (player) {
                const stats = calcPlayerStats();
                player.maxHp = stats.maxHp;
                player.maxMp = stats.maxMp;
                player.atk = stats.atk;
                player.def = stats.def;
                player.critRate = stats.critRate;
                player.hp = Math.min(player.hp, player.maxHp);
                player.mp = Math.min(player.mp, player.maxMp);
            }
        }
    }

    // ========== 存档/读档 ==========
    function saveGame() {
        if (playStartTime > 0) {
            gameData.stats.playTime += (Date.now() - playStartTime);
            playStartTime = Date.now();
        }

        const saveData = {
            version: 1,
            timestamp: Date.now(),
            gameData: gameData,
            playerHp: player ? player.hp : 0,
            playerMp: player ? player.mp : 0
        };

        try {
            localStorage.setItem('zaomeng_save', JSON.stringify(saveData));
            addDamageNumber(player ? player.x + player.width / 2 : 500,
                player ? player.y - 30 : 300, '已保存', false, '#00ff00');
        } catch (e) {
            console.error('Save failed:', e);
        }
    }

    function loadGame() {
        try {
            const raw = localStorage.getItem('zaomeng_save');
            if (!raw) {
                alert('没有找到存档！');
                return;
            }

            const saveData = JSON.parse(raw);
            gameData = saveData.gameData;

            initStage(gameData.currentStage);

            // 恢复玩家状态
            if (player) {
                player.hp = saveData.playerHp || player.maxHp;
                player.mp = saveData.playerMp || player.maxMp;
            }

            showScreen('game-screen');
            gameState = 'playing';
            playStartTime = Date.now();
            lastTime = performance.now();
            requestAnimationFrame(gameLoop);
        } catch (e) {
            console.error('Load failed:', e);
            alert('存档读取失败！');
        }
    }

    // ========== 工具函数 ==========
    function lightenColor(hex, amount) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.min(255, (num >> 16) + amount);
        const g = Math.min(255, ((num >> 8) & 0x00FF) + amount);
        const b = Math.min(255, (num & 0x0000FF) + amount);
        return `rgb(${r},${g},${b})`;
    }

    function darkenColor(hex, amount) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.max(0, (num >> 16) - amount);
        const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
        const b = Math.max(0, (num & 0x0000FF) - amount);
        return `rgb(${r},${g},${b})`;
    }

    // ========== 启动 ==========
    document.addEventListener('DOMContentLoaded', init);

})();
