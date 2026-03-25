# 🎮 VibeChildhoodGame - 童年经典小游戏合集

> 重温4399童年记忆！纯前端HTML5/Canvas实现的经典小游戏合集，无需安装，打开浏览器即可畅玩。

## 📋 游戏目录

| # | 游戏 | 类型 | 说明 |
|---|------|------|------|
| 1 | [🛩️ 飞机大战](./aircraft_battle/) | 射击 | 经典纵版射击，多种敌机，粒子爆炸效果 |
| 2 | [🔢 2048](./game_2048/) | 益智 | 数字合并益智游戏，支持触屏滑动 |
| 3 | [🃏 AI智能卡牌](./SMARTCARD_GAME/) | 卡牌 | AI对战卡牌游戏，12张主题卡牌，8种战场 |
| 4 | [🐍 贪吃蛇](./snake_game/) | 休闲 | 经典贪吃蛇，渐变蛇身，触控支持 |
| 5 | [🎯 坦克大战](./tank_world/) | 对战 | 坦克双人对战，随机地图，AI敌人 |
| 6 | [🧱 俄罗斯方块](./tetris_game/) | 益智 | 经典方块消除，7种方块，难度递增 |
| 7 | [🔨 打地鼠](./whack_a_mole/) | 休闲 | 限时打地鼠，连击加分，速度递增 |
| 8 | [⚔️ 造梦西游](./zaomeng_sample/) | RPG | 横版动作RPG，4个角色，技能系统 |
| 9 | [🦸 超级米拉奇](./super_miraqi/) | 冒险 | 横版过关冒险，3个关卡，踩踏攻击 |
| 10 | [🔫 混乱大枪战](./chaotic_gunbattle/) | 射击 | 俯视角射击，3种武器，波次生存 |
| 11 | [⚔️ 疯狂小人战斗](./crazy_stickman/) | 格斗 | 火柴人格斗，单人/双人模式，连击系统 |
| 12 | [💩 大便超人](./poop_superman/) | 飞行 | 横版飞行射击，便便炸弹，多种敌人 |
| 13 | [⛏️ 黄金矿工](./gold_miner/) | 休闲 | 经典挖矿游戏，多种宝物，关卡挑战 |

## 🚀 快速开始

### 方法一：直接打开
每个游戏文件夹中的 `index.html` 可直接用浏览器打开运行，无需任何服务器或依赖。

### 方法二：本地服务器（推荐）
```bash
# 使用 Python
python -m http.server 8080

# 使用 Node.js
npx serve .

# 使用 VS Code Live Server 插件
# 右键 index.html -> Open with Live Server
```

## 🎮 操作说明

### 通用控制
- **方向键 / WASD**: 移动
- **空格**: 特殊操作（攻击/射击/下钩等）
- **手机**: 各游戏均支持触控操作

### 各游戏特殊按键
| 游戏 | 按键 |
|------|------|
| 飞机大战 | 方向键/鼠标移动，自动射击 |
| 2048 | 方向键/滑动 |
| 贪吃蛇 | 方向键/虚拟按钮 |
| 坦克大战 | P1: WASD+空格，P2: 方向键+Enter |
| 俄罗斯方块 | 方向键（↑旋转，↓加速） |
| 打地鼠 | 鼠标点击 |
| 造梦西游 | 方向键+J/K/L技能 |
| 超级米拉奇 | 方向键+空格攻击 |
| 混乱大枪战 | WASD+鼠标射击，R换弹，1/2/3切枪 |
| 疯狂小人战斗 | P1: AD+W+FG，P2: ←→+↑+KL |
| 大便超人 | ↑↓飞行+空格投弹 |
| 黄金矿工 | ↓/空格/点击放钩 |

## 🛠️ 技术栈

- **HTML5 Canvas**: 游戏渲染引擎
- **原生 JavaScript**: 游戏逻辑（无框架依赖）
- **CSS3**: UI界面和动画效果
- **localStorage**: 本地最高分存储

## 📁 项目结构

```
VibeChildhoodGame/
├── README.md                 # 项目文档
├── aircraft_battle/          # 飞机大战
├── game_2048/                # 2048
├── SMARTCARD_GAME/           # AI智能卡牌
├── snake_game/               # 贪吃蛇
├── tank_world/               # 坦克大战
├── tetris_game/              # 俄罗斯方块
├── whack_a_mole/             # 打地鼠
├── zaomeng_sample/           # 造梦西游
├── super_miraqi/             # 超级米拉奇
├── chaotic_gunbattle/        # 混乱大枪战
├── crazy_stickman/           # 疯狂小人战斗
├── poop_superman/            # 大便超人
└── gold_miner/               # 黄金矿工
```

每个游戏文件夹通常包含：
- `index.html` - 游戏页面
- `game.js` - 游戏逻辑
- `style.css` - 样式文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/new-game`)
3. 提交更改 (`git commit -m 'Add new game'`)
4. 推送分支 (`git push origin feature/new-game`)
5. 提交 Pull Request

## 📄 License

MIT License - 可自由使用、修改和分发。
