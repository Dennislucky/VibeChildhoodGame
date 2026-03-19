const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");
const restartButton = document.getElementById("restartButton");
const modeSelect = document.getElementById("modeSelect");
const enemyCountLabel = document.getElementById("enemyCount");
const playerHpLabel = document.getElementById("playerHp");
const playerHpTextLabel = document.getElementById("playerHpText");
const terrainSeedLabel = document.getElementById("terrainSeed");
const messageOverlay = document.getElementById("messageOverlay");

const TILE_SIZE = 32;
const COLS = canvas.width / TILE_SIZE;
const ROWS = canvas.height / TILE_SIZE;
const PLAYER_SPEED = 150;
const ENEMY_SPEED = 92;
const BULLET_SPEED = 340;
const PLAYER_FIRE_COOLDOWN = 260;
const ENEMY_FIRE_COOLDOWN = 720;
const MAX_ENEMIES = 6;
const SPAWN_SAFE_RADIUS = 2;

const TILE = {
    EMPTY: 0,
    BRICK: 1,
    STEEL: 2,
    WATER: 3,
    BUSH: 4
};

const DIRECTION = {
    up: { x: 0, y: -1, angle: -Math.PI / 2 },
    down: { x: 0, y: 1, angle: Math.PI / 2 },
    left: { x: -1, y: 0, angle: Math.PI },
    right: { x: 1, y: 0, angle: 0 }
};

const keys = new Set();
const GAME_MODE = {
    SINGLE: "single",
    COOP: "coop"
};

let state;
let lastFrame = 0;
let currentMode = GAME_MODE.SINGLE;

function createRng(seed) {
    let value = seed >>> 0;

    return function next() {
        value += 0x6d2b79f5;
        let result = Math.imul(value ^ value >>> 15, 1 | value);
        result ^= result + Math.imul(result ^ result >>> 7, 61 | result);
        return ((result ^ result >>> 14) >>> 0) / 4294967296;
    };
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function rectsOverlap(first, second) {
    return first.x < second.x + second.width
        && first.x + first.width > second.x
        && first.y < second.y + second.height
        && first.y + first.height > second.y;
}

function circleRectOverlap(circle, rect) {
    const closestX = clamp(circle.x, rect.x, rect.x + rect.width);
    const closestY = clamp(circle.y, rect.y, rect.y + rect.height);
    const deltaX = circle.x - closestX;
    const deltaY = circle.y - closestY;
    return deltaX * deltaX + deltaY * deltaY <= circle.radius * circle.radius;
}

function tileBlocksMovement(tile) {
    return tile === TILE.BRICK || tile === TILE.STEEL || tile === TILE.WATER;
}

function tileBlocksBullet(tile) {
    return tile === TILE.BRICK || tile === TILE.STEEL || tile === TILE.WATER;
}

function createTank(x, y, color, isPlayer = false) {
    const maxHp = isPlayer ? 5 : 3;

    return {
        x,
        y,
        width: 26,
        height: 26,
        direction: "up",
        color,
        speed: isPlayer ? PLAYER_SPEED : ENEMY_SPEED,
        isPlayer,
        maxHp,
        hp: maxHp,
        fireCooldown: 0,
        aiDecisionTimer: 0,
        moveIntent: { x: 0, y: 0 },
        shootIntent: false,
        stuckTime: 0,
        previousX: x,
        previousY: y
    };
}

function tankBounds(tank) {
    return {
        x: tank.x - tank.width / 2,
        y: tank.y - tank.height / 2,
        width: tank.width,
        height: tank.height
    };
}

function bulletSpawnPoint(tank) {
    const direction = DIRECTION[tank.direction];
    return {
        x: tank.x + direction.x * (tank.width / 2 + 6),
        y: tank.y + direction.y * (tank.height / 2 + 6)
    };
}

function createBullet(owner) {
    const direction = DIRECTION[owner.direction];
    const spawn = bulletSpawnPoint(owner);

    return {
        x: spawn.x,
        y: spawn.y,
        radius: 4,
        velocityX: direction.x * BULLET_SPEED,
        velocityY: direction.y * BULLET_SPEED,
        owner,
        active: true
    };
}

function cellRect(col, row) {
    return {
        x: col * TILE_SIZE,
        y: row * TILE_SIZE,
        width: TILE_SIZE,
        height: TILE_SIZE
    };
}

function isSafeZone(col, row, points) {
    return points.some((point) => Math.abs(point.col - col) <= SPAWN_SAFE_RADIUS && Math.abs(point.row - row) <= SPAWN_SAFE_RADIUS);
}

function generateTerrain(seed) {
    const random = createRng(seed);
    const map = Array.from({ length: ROWS }, () => Array(COLS).fill(TILE.EMPTY));
    const safePoints = [
        { col: 2, row: ROWS - 3 },
        { col: COLS - 3, row: 2 },
        { col: Math.floor(COLS / 2), row: 2 },
        { col: 2, row: 2 },
        { col: COLS - 3, row: ROWS - 3 }
    ];

    for (let row = 0; row < ROWS; row += 1) {
        for (let col = 0; col < COLS; col += 1) {
            if (row === 0 || col === 0 || row === ROWS - 1 || col === COLS - 1) {
                map[row][col] = TILE.STEEL;
            }
        }
    }

    for (let cluster = 0; cluster < 90; cluster += 1) {
        const baseCol = 1 + Math.floor(random() * (COLS - 2));
        const baseRow = 1 + Math.floor(random() * (ROWS - 2));
        const width = 1 + Math.floor(random() * 3);
        const height = 1 + Math.floor(random() * 3);
        const tileTypeRoll = random();

        for (let row = baseRow; row < baseRow + height && row < ROWS - 1; row += 1) {
            for (let col = baseCol; col < baseCol + width && col < COLS - 1; col += 1) {
                if (isSafeZone(col, row, safePoints)) {
                    continue;
                }

                if (tileTypeRoll < 0.55) {
                    map[row][col] = TILE.BRICK;
                } else if (tileTypeRoll < 0.75) {
                    map[row][col] = TILE.WATER;
                } else if (tileTypeRoll < 0.9) {
                    map[row][col] = TILE.STEEL;
                } else {
                    map[row][col] = TILE.BUSH;
                }
            }
        }
    }

    for (let row = 2; row < ROWS - 2; row += 4) {
        for (let col = 2; col < COLS - 2; col += 5) {
            if (!isSafeZone(col, row, safePoints) && random() < 0.65) {
                map[row][col] = TILE.BRICK;
                if (random() < 0.55) {
                    map[row][col + 1] = TILE.BRICK;
                }
                if (random() < 0.4) {
                    map[row + 1][col] = TILE.BUSH;
                }
            }
        }
    }

    safePoints.forEach((point) => {
        for (let row = point.row - SPAWN_SAFE_RADIUS; row <= point.row + SPAWN_SAFE_RADIUS; row += 1) {
            for (let col = point.col - SPAWN_SAFE_RADIUS; col <= point.col + SPAWN_SAFE_RADIUS; col += 1) {
                if (row > 0 && row < ROWS - 1 && col > 0 && col < COLS - 1) {
                    map[row][col] = TILE.EMPTY;
                }
            }
        }
    });

    return map;
}

function tileCenter(col, row) {
    return {
        x: (col + 0.5) * TILE_SIZE,
        y: (row + 0.5) * TILE_SIZE
    };
}

function areaIsOpen(map, centerCol, centerRow, radius) {
    for (let row = centerRow - radius; row <= centerRow + radius; row += 1) {
        for (let col = centerCol - radius; col <= centerCol + radius; col += 1) {
            if (row <= 0 || row >= ROWS - 1 || col <= 0 || col >= COLS - 1) {
                return false;
            }

            if (tileBlocksMovement(map[row][col])) {
                return false;
            }
        }
    }

    return true;
}

function chooseEnemySpawnPoints(map, seed, count, players) {
    const random = createRng(seed ^ 0x9e3779b9);
    const candidates = [];
    const playerPositions = players.map((player) => ({
        col: Math.floor(player.x / TILE_SIZE),
        row: Math.floor(player.y / TILE_SIZE)
    }));

    for (let row = 2; row < ROWS - 2; row += 1) {
        for (let col = 2; col < COLS - 2; col += 1) {
            const tooCloseToPlayer = playerPositions.some((playerPosition) => {
                const distanceToPlayer = Math.abs(col - playerPosition.col) + Math.abs(row - playerPosition.row);
                return distanceToPlayer < 9;
            });

            if (tooCloseToPlayer) {
                continue;
            }

            if (!areaIsOpen(map, col, row, 1)) {
                continue;
            }

            candidates.push({ col, row, weight: random() });
        }
    }

    candidates.sort((left, right) => left.weight - right.weight);

    const selected = [];
    for (const candidate of candidates) {
        const overlaps = selected.some((point) => Math.abs(point.col - candidate.col) < 3 && Math.abs(point.row - candidate.row) < 3);
        if (overlaps) {
            continue;
        }

        selected.push(candidate);
        if (selected.length === count) {
            break;
        }
    }

    if (selected.length < count) {
        const fallback = [
            { col: 2, row: 2 },
            { col: COLS - 3, row: 2 },
            { col: Math.floor(COLS / 2), row: 2 },
            { col: 2, row: Math.floor(ROWS / 2) },
            { col: COLS - 3, row: Math.floor(ROWS / 2) },
            { col: Math.floor(COLS / 2), row: ROWS - 4 }
        ];

        for (const point of fallback) {
            if (!areaIsOpen(map, point.col, point.row, 1)) {
                continue;
            }

            const overlaps = selected.some((item) => Math.abs(item.col - point.col) < 3 && Math.abs(item.row - point.row) < 3);
            if (!overlaps) {
                selected.push(point);
            }

            if (selected.length === count) {
                break;
            }
        }
    }

    return selected.slice(0, count).map((point) => tileCenter(point.col, point.row));
}

function createPlayers(mode) {
    const players = [createTank(TILE_SIZE * 2.5, TILE_SIZE * (ROWS - 2.5), "#ffd166", true)];
    players[0].name = "1P";

    if (mode === GAME_MODE.COOP) {
        const secondPlayer = createTank(TILE_SIZE * (COLS - 2.5), TILE_SIZE * (ROWS - 2.5), "#8ecae6", true);
        secondPlayer.name = "2P";
        players.push(secondPlayer);
    }

    return players;
}

function createState(mode = currentMode, seed = Math.floor(Date.now() % 1000000)) {
    const terrain = generateTerrain(seed);
    const players = createPlayers(mode);
    const enemyColors = ["#ff6b6b", "#e85d04", "#f77f00", "#ff7b72", "#ff9f1c", "#ff8fab"];
    const spawnPoints = chooseEnemySpawnPoints(terrain, seed, MAX_ENEMIES, players);
    const enemies = spawnPoints.map((spawn, index) => {
        const enemy = createTank(spawn.x, spawn.y, enemyColors[index % enemyColors.length]);
        const directions = Object.keys(DIRECTION);
        enemy.direction = directions[(seed + index) % directions.length];
        enemy.moveIntent.x = DIRECTION[enemy.direction].x;
        enemy.moveIntent.y = DIRECTION[enemy.direction].y;
        enemy.aiDecisionTimer = 0.2 * index;
        return enemy;
    });

    return {
        mode,
        seed,
        map: terrain,
        players,
        enemies,
        bullets: [],
        explosions: [],
        gameOver: false,
        victory: false,
        flashTimer: 0
    };
}

function setMessage(text) {
    if (!text) {
        messageOverlay.textContent = "";
        messageOverlay.classList.add("hidden");
        return;
    }

    messageOverlay.textContent = text;
    messageOverlay.classList.remove("hidden");
}

function tileAtPixel(x, y) {
    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);

    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) {
        return { tile: TILE.STEEL, col, row };
    }

    return { tile: state.map[row][col], col, row };
}

function canTankMoveTo(tank, nextX, nextY) {
    const bounds = {
        x: nextX - tank.width / 2,
        y: nextY - tank.height / 2,
        width: tank.width,
        height: tank.height
    };
    const minCol = Math.floor(bounds.x / TILE_SIZE);
    const maxCol = Math.floor((bounds.x + bounds.width) / TILE_SIZE);
    const minRow = Math.floor(bounds.y / TILE_SIZE);
    const maxRow = Math.floor((bounds.y + bounds.height) / TILE_SIZE);

    for (let row = minRow; row <= maxRow; row += 1) {
        for (let col = minCol; col <= maxCol; col += 1) {
            if (row < 0 || row >= ROWS || col < 0 || col >= COLS) {
                return false;
            }

            if (tileBlocksMovement(state.map[row][col])) {
                return false;
            }
        }
    }

    const occupants = tank.isPlayer
        ? [...state.players.filter((player) => player !== tank), ...state.enemies]
        : [...state.players, ...state.enemies.filter((enemy) => enemy !== tank)];
    for (const other of occupants) {
        if (other.hp <= 0) {
            continue;
        }

        if (rectsOverlap(bounds, tankBounds(other))) {
            return false;
        }
    }

    return true;
}

function moveTank(tank, deltaTime) {
    const distance = tank.speed * deltaTime;
    const targetX = tank.x + tank.moveIntent.x * distance;
    const targetY = tank.y + tank.moveIntent.y * distance;
    let moved = false;

    tank.previousX = tank.x;
    tank.previousY = tank.y;

    if (tank.moveIntent.x !== 0 && canTankMoveTo(tank, targetX, tank.y)) {
        tank.x = targetX;
        moved = true;
    }

    if (tank.moveIntent.y !== 0 && canTankMoveTo(tank, tank.x, targetY)) {
        tank.y = targetY;
        moved = true;
    }

    if (!moved && (tank.moveIntent.x !== 0 || tank.moveIntent.y !== 0)) {
        tank.stuckTime += deltaTime;
    } else {
        tank.stuckTime = 0;
    }
}

function updatePlayerIntent(player, controls) {
    const horizontal = Number(keys.has(controls.right)) - Number(keys.has(controls.left));
    const vertical = Number(keys.has(controls.down)) - Number(keys.has(controls.up));
    player.moveIntent.x = 0;
    player.moveIntent.y = 0;

    if (horizontal !== 0) {
        player.moveIntent.x = horizontal;
        player.direction = horizontal > 0 ? "right" : "left";
    } else if (vertical !== 0) {
        player.moveIntent.y = vertical;
        player.direction = vertical > 0 ? "down" : "up";
    }
}

function getLivingPlayers() {
    return state.players.filter((player) => player.hp > 0);
}

function getClosestLivingPlayer(enemy) {
    const livingPlayers = getLivingPlayers();

    if (livingPlayers.length === 0) {
        return null;
    }

    return livingPlayers.reduce((closest, candidate) => {
        const closestDistance = Math.hypot(closest.x - enemy.x, closest.y - enemy.y);
        const candidateDistance = Math.hypot(candidate.x - enemy.x, candidate.y - enemy.y);
        return candidateDistance < closestDistance ? candidate : closest;
    });
}

function chooseEnemyDirection(enemy) {
    const target = getClosestLivingPlayer(enemy);
    if (!target) {
        enemy.moveIntent.x = 0;
        enemy.moveIntent.y = 0;
        return;
    }

    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const prioritizePlayer = Math.random() < 0.6;

    if (prioritizePlayer) {
        if (Math.abs(dx) > Math.abs(dy)) {
            enemy.direction = dx > 0 ? "right" : "left";
        } else {
            enemy.direction = dy > 0 ? "down" : "up";
        }
    } else {
        const directions = Object.keys(DIRECTION);
        enemy.direction = directions[Math.floor(Math.random() * directions.length)];
    }

    enemy.moveIntent.x = DIRECTION[enemy.direction].x;
    enemy.moveIntent.y = DIRECTION[enemy.direction].y;
}

function enemyHasShotLine(enemy) {
    for (const player of getLivingPlayers()) {
        const sameColumn = Math.abs(enemy.x - player.x) < TILE_SIZE * 0.45;
        const sameRow = Math.abs(enemy.y - player.y) < TILE_SIZE * 0.45;

        if (!sameColumn && !sameRow) {
            continue;
        }

        const stepX = sameRow ? Math.sign(player.x - enemy.x) * 8 : 0;
        const stepY = sameColumn ? Math.sign(player.y - enemy.y) * 8 : 0;
        let cursorX = enemy.x;
        let cursorY = enemy.y;
        let blocked = false;

        while (Math.abs(cursorX - player.x) > 8 || Math.abs(cursorY - player.y) > 8) {
            cursorX += stepX;
            cursorY += stepY;
            const hit = tileAtPixel(cursorX, cursorY);
            if (tileBlocksBullet(hit.tile)) {
                blocked = true;
                break;
            }
        }

        if (blocked) {
            continue;
        }

        if (sameColumn) {
            enemy.direction = player.y > enemy.y ? "down" : "up";
        } else {
            enemy.direction = player.x > enemy.x ? "right" : "left";
        }

        enemy.moveIntent.x = 0;
        enemy.moveIntent.y = 0;
        return true;
    }

    return false;
}

function updateEnemyAI(enemy, deltaTime) {
    enemy.aiDecisionTimer -= deltaTime;

    if (enemy.aiDecisionTimer <= 0 || enemy.stuckTime > 0.35) {
        enemy.aiDecisionTimer = 0.45 + Math.random() * 0.9;
        chooseEnemyDirection(enemy);
    }

    if (enemyHasShotLine(enemy) && Math.random() < 0.04) {
        enemy.shootIntent = true;
    } else if (Math.random() < 0.006) {
        enemy.shootIntent = true;
    }
}

function fireIfNeeded(tank) {
    if (!tank.shootIntent || tank.fireCooldown > 0 || tank.hp <= 0) {
        return;
    }

    const bullet = createBullet(tank);
    const spawnTile = tileAtPixel(bullet.x, bullet.y);
    if (!tileBlocksBullet(spawnTile.tile)) {
        state.bullets.push(bullet);
        tank.fireCooldown = tank.isPlayer ? PLAYER_FIRE_COOLDOWN : ENEMY_FIRE_COOLDOWN;
    }
}

function damageTank(tank, amount) {
    tank.hp -= amount;
    state.explosions.push({ x: tank.x, y: tank.y, radius: 8, life: 0.26 });

    if (tank.hp <= 0) {
        state.explosions.push({ x: tank.x, y: tank.y, radius: 18, life: 0.6 });
    }
}

function updateBullets(deltaTime) {
    for (const bullet of state.bullets) {
        if (!bullet.active) {
            continue;
        }

        bullet.x += bullet.velocityX * deltaTime;
        bullet.y += bullet.velocityY * deltaTime;

        const impact = tileAtPixel(bullet.x, bullet.y);
        if (tileBlocksBullet(impact.tile)) {
            bullet.active = false;
            state.explosions.push({ x: bullet.x, y: bullet.y, radius: 6, life: 0.18 });

            if (impact.tile === TILE.BRICK) {
                state.map[impact.row][impact.col] = TILE.EMPTY;
            }
            continue;
        }

        const possibleTargets = bullet.owner.isPlayer ? state.enemies : state.players;
        for (const target of possibleTargets) {
            if (target.hp <= 0) {
                continue;
            }

            if (circleRectOverlap(bullet, tankBounds(target))) {
                bullet.active = false;
                damageTank(target, 1);
                break;
            }
        }
    }

    state.bullets = state.bullets.filter((bullet) => bullet.active);
}

function updateEffects(deltaTime) {
    state.explosions = state.explosions
        .map((explosion) => ({
            ...explosion,
            radius: explosion.radius + deltaTime * 60,
            life: explosion.life - deltaTime
        }))
        .filter((explosion) => explosion.life > 0);
}

function updateHud() {
    enemyCountLabel.textContent = String(state.enemies.filter((enemy) => enemy.hp > 0).length);
    playerHpLabel.textContent = state.players
        .map((player) => `${player.name}:${Math.max(0, player.hp)}`)
        .join(" / ");
    playerHpTextLabel.textContent = state.mode === GAME_MODE.COOP ? "双人生命" : "玩家生命";
    terrainSeedLabel.textContent = String(state.seed);
}

function handleWinLoss() {
    if (state.players.every((player) => player.hp <= 0) && !state.gameOver) {
        state.gameOver = true;
        state.victory = false;
        setMessage(state.mode === GAME_MODE.COOP ? "任务失败\n双人全灭\n按按钮重开" : "任务失败\n坦克已被击毁\n按按钮重开");
    }

    if (state.enemies.every((enemy) => enemy.hp <= 0) && !state.gameOver) {
        state.gameOver = true;
        state.victory = true;
        setMessage("胜利\n敌军已清空");
    }
}

function update(deltaTime) {
    if (state.gameOver) {
        updateEffects(deltaTime);
        updateHud();
        return;
    }

    const playerControls = [
        { up: "w", down: "s", left: "a", right: "d", fire: " " },
        { up: "arrowup", down: "arrowdown", left: "arrowleft", right: "arrowright", fire: "l" }
    ];

    state.players.forEach((player, index) => {
        if (player.hp <= 0) {
            player.moveIntent.x = 0;
            player.moveIntent.y = 0;
            player.shootIntent = false;
            return;
        }

        updatePlayerIntent(player, playerControls[index]);
        player.shootIntent = keys.has(playerControls[index].fire);
        player.fireCooldown = Math.max(0, player.fireCooldown - deltaTime * 1000);
        moveTank(player, deltaTime);
        fireIfNeeded(player);
    });

    for (const enemy of state.enemies) {
        if (enemy.hp <= 0) {
            continue;
        }

        enemy.fireCooldown = Math.max(0, enemy.fireCooldown - deltaTime * 1000);
        enemy.shootIntent = false;
        updateEnemyAI(enemy, deltaTime);
        moveTank(enemy, deltaTime);
        fireIfNeeded(enemy);
    }

    updateBullets(deltaTime);
    updateEffects(deltaTime);
    handleWinLoss();
    updateHud();
}

function drawTerrain() {
    for (let row = 0; row < ROWS; row += 1) {
        for (let col = 0; col < COLS; col += 1) {
            const tile = state.map[row][col];
            const x = col * TILE_SIZE;
            const y = row * TILE_SIZE;

            context.fillStyle = (row + col) % 2 === 0 ? "#33461f" : "#2d3d1c";
            context.fillRect(x, y, TILE_SIZE, TILE_SIZE);

            if (tile === TILE.EMPTY) {
                continue;
            }

            if (tile === TILE.BRICK) {
                context.fillStyle = "#9a5630";
                context.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                context.fillStyle = "#6f3c22";
                context.fillRect(x + 2, y + 10, TILE_SIZE - 4, 4);
                context.fillRect(x + 9, y + 2, 4, TILE_SIZE - 4);
            } else if (tile === TILE.STEEL) {
                context.fillStyle = "#7e8f98";
                context.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                context.strokeStyle = "#b8c2c7";
                context.lineWidth = 2;
                context.strokeRect(x + 5, y + 5, TILE_SIZE - 10, TILE_SIZE - 10);
            } else if (tile === TILE.WATER) {
                context.fillStyle = "#2b84c9";
                context.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                context.strokeStyle = "rgba(255,255,255,0.28)";
                context.beginPath();
                context.moveTo(x + 2, y + 18);
                context.bezierCurveTo(x + 8, y + 10, x + 18, y + 24, x + 30, y + 16);
                context.stroke();
            } else if (tile === TILE.BUSH) {
                context.fillStyle = "#3f7a31";
                context.beginPath();
                context.arc(x + 9, y + 17, 8, 0, Math.PI * 2);
                context.arc(x + 18, y + 13, 10, 0, Math.PI * 2);
                context.arc(x + 23, y + 20, 6, 0, Math.PI * 2);
                context.fill();
            }
        }
    }
}

function drawTank(tank) {
    if (tank.hp <= 0) {
        return;
    }

    context.save();
    context.translate(tank.x, tank.y);
    context.rotate(DIRECTION[tank.direction].angle);

    context.fillStyle = tank.color;
    context.fillRect(-tank.width / 2, -tank.height / 2, tank.width, tank.height);
    context.fillStyle = "rgba(40, 24, 16, 0.36)";
    context.fillRect(-tank.width / 2 + 4, -tank.height / 2 + 4, tank.width - 8, tank.height - 8);

    context.fillStyle = "rgba(73, 48, 28, 0.85)";
    context.fillRect(-tank.width / 2, -tank.height / 2, 6, tank.height);
    context.fillRect(tank.width / 2 - 6, -tank.height / 2, 6, tank.height);

    context.fillStyle = tank.isPlayer ? "#fff3bf" : "#ffd9c2";
    context.fillRect(-4, -5, tank.width / 2 + 10, 10);
    context.beginPath();
    context.arc(0, 0, 7, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "rgba(0, 0, 0, 0.22)";
    context.fillRect(-tank.width / 2, tank.height / 2 - 2, tank.width, 4);
    context.restore();

    context.fillStyle = "rgba(0, 0, 0, 0.45)";
    context.fillRect(tank.x - 14, tank.y - 24, 28, 4);
    context.fillStyle = tank.isPlayer ? "#f6bd60" : "#f07167";
    context.fillRect(tank.x - 14, tank.y - 24, 28 * (tank.hp / (tank.isPlayer ? 5 : 3)), 4);
}

function drawBullets() {
    for (const bullet of state.bullets) {
        context.fillStyle = bullet.owner.isPlayer ? "#ffe66d" : "#ffb703";
        context.beginPath();
        context.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        context.fill();
    }
}

function drawEffects() {
    for (const explosion of state.explosions) {
        const alpha = clamp(explosion.life / 0.6, 0, 1);
        context.fillStyle = `rgba(255, 187, 80, ${alpha})`;
        context.beginPath();
        context.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = `rgba(255, 96, 32, ${alpha * 0.6})`;
        context.beginPath();
        context.arc(explosion.x, explosion.y, explosion.radius * 0.5, 0, Math.PI * 2);
        context.fill();
    }
}

function drawMiniMapFrame() {
    context.save();
    context.globalAlpha = 0.2;
    context.strokeStyle = "#f2e8cf";
    context.lineWidth = 3;
    context.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    context.restore();
}

function render() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawTerrain();
    drawBullets();
    state.players.forEach(drawTank);
    state.enemies.forEach(drawTank);
    drawEffects();
    drawMiniMapFrame();
}

function frame(timestamp) {
    const deltaTime = Math.min((timestamp - lastFrame) / 1000 || 0, 0.032);
    lastFrame = timestamp;
    update(deltaTime);
    render();
    requestAnimationFrame(frame);
}

function resetGame() {
    keys.clear();
    state = createState(currentMode);
    setMessage("");
    updateHud();
}

window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
        event.preventDefault();
    }
    keys.add(key);
});

window.addEventListener("keyup", (event) => {
    keys.delete(event.key.toLowerCase());
});

restartButton.addEventListener("click", () => {
    resetGame();
});

modeSelect.addEventListener("change", () => {
    currentMode = modeSelect.value;
    resetGame();
});

modeSelect.value = currentMode;
resetGame();
requestAnimationFrame(frame);