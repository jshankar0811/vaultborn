// ─── Constants ───────────────────────────────────────────────────────────────

const TILE = 20;
const COLS = 35;
const ROWS = 28;
const MAX_FLOORS = 5;

const T = { WALL: 0, FLOOR: 1, STAIRS: 2 };

const COLORS = {
  wall: '#1a1a28', wallEdge: '#2a2a40',
  floor: '#141420', floorDot: '#1e1e2e',
  stairs: '#a070d0', player: '#e8c87a',
};

const ENEMY_TYPES = [
  { name: 'Rat',      ch: 'r', color: '#8a6a4a', hp: 4,  atk: 2, def: 0, xp: 2,  gold: [0,2]  },
  { name: 'Goblin',   ch: 'g', color: '#6a8a4a', hp: 8,  atk: 3, def: 1, xp: 5,  gold: [1,4]  },
  { name: 'Skeleton', ch: 's', color: '#9090a0', hp: 12, atk: 4, def: 2, xp: 8,  gold: [2,6]  },
  { name: 'Orc',      ch: 'o', color: '#6a9050', hp: 18, atk: 6, def: 3, xp: 14, gold: [3,8]  },
  { name: 'Troll',    ch: 'T', color: '#508060', hp: 28, atk: 8, def: 4, xp: 22, gold: [5,12] },
  { name: 'Lich',     ch: 'L', color: '#c050e0', hp: 40, atk: 12,def: 5, xp: 50, gold: [10,25]},
];

const ITEM_TYPES = [
  { name: 'Health Potion',  ch: '!', color: '#e05050', type: 'potion',  value: 15 },
  { name: 'Max Potion',     ch: '!', color: '#ff8888', type: 'maxpot',  value: 999 },
  { name: 'Iron Sword',     ch: '/', color: '#9090c0', type: 'weapon',  value: 3  },
  { name: 'Steel Sword',    ch: '/', color: '#c0c0e0', type: 'weapon',  value: 5  },
  { name: 'Dragonblade',    ch: '/', color: '#e06030', type: 'weapon',  value: 8  },
  { name: 'Leather Armor',  ch: ']', color: '#8a6a4a', type: 'armor',   value: 2  },
  { name: 'Chain Mail',     ch: ']', color: '#8090a0', type: 'armor',   value: 4  },
  { name: 'Plate Armor',    ch: ']', color: '#c0c8d0', type: 'armor',   value: 6  },
  { name: 'Gold Coin',      ch: '$', color: '#e8c87a', type: 'gold',    value: 10 },
];

// ─── State ───────────────────────────────────────────────────────────────────

let state = {};

function initState() {
  state = {
    floor: 1,
    map: [],
    rooms: [],
    entities: [],
    player: {
      x: 0, y: 0,
      hp: 20, maxHp: 20,
      atk: 4, def: 1,
      xp: 0, level: 1,
      gold: 0,
      inventory: [],
      weapon: null,
      armor: null,
    },
    visible: new Set(),
    explored: new Set(),
    turn: 0,
    over: false,
    won: false,
  };
  generateFloor();
  updateHUD();
  render();
}

// ─── Map generation ──────────────────────────────────────────────────────────

function generateFloor() {
  state.map = Array.from({ length: ROWS }, () => new Array(COLS).fill(T.WALL));
  state.rooms = [];
  state.entities = [];
  state.visible = new Set();

  const rooms = [];
  const attempts = 60;
  for (let i = 0; i < attempts; i++) {
    const w = randi(5, 11);
    const h = randi(4, 8);
    const x = randi(1, COLS - w - 1);
    const y = randi(1, ROWS - h - 1);
    if (!rooms.some(r => rectsOverlap(r, { x, y, w, h }, 1))) {
      rooms.push({ x, y, w, h });
      carveRoom(x, y, w, h);
    }
  }

  for (let i = 1; i < rooms.length; i++) {
    const a = roomCenter(rooms[i - 1]);
    const b = roomCenter(rooms[i]);
    carveCorridor(a, b);
  }

  state.rooms = rooms;

  const lastRoom = rooms[rooms.length - 1];
  const sc = roomCenter(lastRoom);
  state.map[sc.y][sc.x] = T.STAIRS;

  const fc = roomCenter(rooms[0]);
  state.player.x = fc.x;
  state.player.y = fc.y;

  for (let i = 1; i < rooms.length; i++) {
    populateRoom(rooms[i]);
  }

  computeFOV();
}

function carveRoom(x, y, w, h) {
  for (let row = y; row < y + h; row++)
    for (let col = x; col < x + w; col++)
      state.map[row][col] = T.FLOOR;
}

function carveCorridor(a, b) {
  let { x, y } = a;
  while (x !== b.x) { state.map[y][x] = T.FLOOR; x += x < b.x ? 1 : -1; }
  while (y !== b.y) { state.map[y][x] = T.FLOOR; y += y < b.y ? 1 : -1; }
}

function populateRoom(room) {
  const floor = state.floor;
  const enemyCount = randi(0, Math.min(3, floor));
  const pool = ENEMY_TYPES.slice(0, Math.min(floor + 1, ENEMY_TYPES.length));

  for (let i = 0; i < enemyCount; i++) {
    const pos = randomFloorInRoom(room);
    if (!pos) continue;
    const type = pool[randi(0, pool.length - 1)];
    state.entities.push({
      kind: 'enemy',
      ...JSON.parse(JSON.stringify(type)),
      x: pos.x, y: pos.y,
      maxHp: type.hp,
    });
  }

  if (Math.random() < 0.6) {
    const pos = randomFloorInRoom(room);
    if (pos) {
      const itemPool = ITEM_TYPES.filter(it =>
        it.type !== 'weapon' || floor >= 2 || it.name === 'Iron Sword'
      );
      const type = itemPool[randi(0, itemPool.length - 1)];
      state.entities.push({ kind: 'item', ...type, x: pos.x, y: pos.y });
    }
  }
}

function randomFloorInRoom(room) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const x = randi(room.x, room.x + room.w - 1);
    const y = randi(room.y, room.y + room.h - 1);
    if (state.map[y][x] === T.FLOOR && !entityAt(x, y) &&
        !(state.player.x === x && state.player.y === y)) {
      return { x, y };
    }
  }
  return null;
}

// ─── FOV ─────────────────────────────────────────────────────────────────────

const SIGHT = 6;

function computeFOV() {
  state.visible.clear();
  const { x: px, y: py } = state.player;
  for (let angle = 0; angle < 360; angle += 2) {
    const rad = (angle * Math.PI) / 180;
    let rx = px + 0.5, ry = py + 0.5;
    const dx = Math.cos(rad), dy = Math.sin(rad);
    for (let step = 0; step < SIGHT; step++) {
      const cx = Math.floor(rx), cy = Math.floor(ry);
      if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) break;
      const key = `${cx},${cy}`;
      state.visible.add(key);
      state.explored.add(key);
      if (state.map[cy][cx] === T.WALL) break;
      rx += dx; ry += dy;
    }
  }
}

// ─── Rendering ───────────────────────────────────────────────────────────────

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width  = COLS * TILE;
canvas.height = ROWS * TILE;

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#08080f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const key = `${col},${row}`;
      const vis  = state.visible.has(key);
      const expl = state.explored.has(key);
      if (!expl) continue;
      drawTile(col, row, state.map[row][col], vis ? 1 : 0.25);
    }
  }

  for (const e of state.entities) {
    const key = `${e.x},${e.y}`;
    if (!state.visible.has(key)) continue;
    drawChar(e.x, e.y, e.ch, e.color);
  }

  ctx.save();
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#e8c87a66';
  drawChar(state.player.x, state.player.y, '@', COLORS.player);
  ctx.restore();
}

function drawTile(col, row, tile, alpha) {
  const x = col * TILE, y = row * TILE;
  ctx.globalAlpha = alpha;

  if (tile === T.WALL) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = COLORS.wallEdge;
    ctx.fillRect(x, y, TILE, 1);
    ctx.fillRect(x, y, 1, TILE);
  } else if (tile === T.FLOOR) {
    ctx.fillStyle = COLORS.floor;
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = COLORS.floorDot;
    ctx.fillRect(x + TILE/2 - 1, y + TILE/2 - 1, 2, 2);
  } else if (tile === T.STAIRS) {
    ctx.fillStyle = COLORS.floor;
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = COLORS.stairs;
    ctx.font = `${TILE - 2}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('>', x + TILE / 2, y + TILE / 2);
  }

  ctx.globalAlpha = 1;
}

function drawChar(col, row, ch, color) {
  const x = col * TILE, y = row * TILE;
  ctx.fillStyle = color;
  ctx.font = `bold ${TILE - 2}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ch, x + TILE / 2, y + TILE / 2);
}

// ─── HUD & Log ───────────────────────────────────────────────────────────────

function updateHUD() {
  const p = state.player;
  document.getElementById('hud-hp').textContent    = `HP: ${p.hp}/${p.maxHp}`;
  document.getElementById('hud-atk').textContent   = `ATK: ${totalAtk()}`;
  document.getElementById('hud-def').textContent   = `DEF: ${totalDef()}`;
  document.getElementById('hud-floor').textContent = `Floor: ${state.floor}`;
  document.getElementById('hud-gold').textContent  = `Gold: ${p.gold}`;
  renderInventory();
}

function totalAtk() { return state.player.atk + (state.player.weapon ? state.player.weapon.value : 0); }
function totalDef() { return state.player.def + (state.player.armor  ? state.player.armor.value  : 0); }

function renderInventory() {
  const ul = document.getElementById('inventory-list');
  ul.innerHTML = '';
  if (state.player.weapon) {
    const li = document.createElement('li');
    li.textContent = `[W] ${state.player.weapon.name}`;
    ul.appendChild(li);
  }
  if (state.player.armor) {
    const li = document.createElement('li');
    li.textContent = `[A] ${state.player.armor.name}`;
    ul.appendChild(li);
  }
  for (const item of state.player.inventory) {
    const li = document.createElement('li');
    li.textContent = item.name;
    ul.appendChild(li);
  }
}

const logEl = document.getElementById('message-log');

function log(msg, cls = '') {
  logEl.querySelectorAll('li.new').forEach(el => el.classList.remove('new'));
  const li = document.createElement('li');
  li.textContent = msg;
  li.className = cls ? `new ${cls}` : 'new';
  logEl.prepend(li);
  while (logEl.children.length > 40) logEl.removeChild(logEl.lastChild);
}

// ─── Input ───────────────────────────────────────────────────────────────────

const DIRS = {
  ArrowUp:    { dx: 0, dy: -1 }, ArrowDown:  { dx: 0, dy: 1 },
  ArrowLeft:  { dx: -1, dy: 0 }, ArrowRight: { dx: 1, dy: 0 },
  w: { dx: 0, dy: -1 }, s: { dx: 0, dy: 1 },
  a: { dx: -1, dy: 0 }, d: { dx: 1, dy: 0 },
  k: { dx: 0, dy: -1 }, j: { dx: 0, dy: 1 },
  h: { dx: -1, dy: 0 }, l: { dx: 1, dy: 0 },
};

document.addEventListener('keydown', e => {
  if (state.over) return;
  if (e.key === 'p' || e.key === 'P') { usePotionFromInventory(); return; }
  const dir = DIRS[e.key];
  if (!dir) return;
  e.preventDefault();
  movePlayer(dir.dx, dir.dy);
});

// ─── Player actions ──────────────────────────────────────────────────────────

function movePlayer(dx, dy) {
  const nx = state.player.x + dx;
  const ny = state.player.y + dy;
  if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return;
  if (state.map[ny][nx] === T.WALL) return;

  const enemy = entityAt(nx, ny, 'enemy');
  if (enemy) { attackEnemy(enemy); endTurn(); return; }

  state.player.x = nx;
  state.player.y = ny;

  const item = entityAt(nx, ny, 'item');
  if (item) pickupItem(item);

  if (state.map[ny][nx] === T.STAIRS) { descendStairs(); return; }
  endTurn();
}

function attackEnemy(enemy) {
  const dmg = Math.max(1, totalAtk() - enemy.def + randi(-1, 1));
  enemy.hp -= dmg;
  log(`You hit the ${enemy.name} for ${dmg} damage.`, 'combat');
  if (enemy.hp <= 0) { killEnemy(enemy); return; }

  const eDmg = Math.max(1, enemy.atk - totalDef() + randi(-1, 1));
  state.player.hp -= eDmg;
  log(`${enemy.name} hits you for ${eDmg} damage.`, 'combat');
  if (state.player.hp <= 0) gameOver(false);
}

function killEnemy(enemy) {
  const gold = randi(enemy.gold[0], enemy.gold[1]);
  state.player.gold += gold;
  state.player.xp += enemy.xp;
  state.entities = state.entities.filter(e => e !== enemy);
  log(`${enemy.name} defeated! +${enemy.xp}xp${gold ? `, +${gold}g` : ''}`, 'item');
  checkLevelUp();
}

function checkLevelUp() {
  const threshold = state.player.level * 15;
  if (state.player.xp >= threshold) {
    state.player.level++;
    state.player.xp -= threshold;
    state.player.maxHp += 8;
    state.player.hp = Math.min(state.player.hp + 8, state.player.maxHp);
    state.player.atk += 1;
    log(`Level up! Now level ${state.player.level}.`, 'system');
  }
}

function pickupItem(item) {
  state.entities = state.entities.filter(e => e !== item);
  if (item.type === 'gold') {
    state.player.gold += item.value;
    log(`Picked up ${item.value} gold.`, 'item');
    return;
  }
  if (item.type === 'potion' || item.type === 'maxpot') {
    state.player.inventory.push(item);
    log(`Picked up ${item.name}. Press [P] to use.`, 'item');
    return;
  }
  if (item.type === 'weapon') {
    log(state.player.weapon ? `Swapped ${state.player.weapon.name} for ${item.name}.` : `Equipped ${item.name}.`, 'item');
    state.player.weapon = item; return;
  }
  if (item.type === 'armor') {
    log(state.player.armor ? `Swapped ${state.player.armor.name} for ${item.name}.` : `Equipped ${item.name}.`, 'item');
    state.player.armor = item;
  }
}

function usePotionFromInventory() {
  const idx = state.player.inventory.findIndex(i => i.type === 'potion' || i.type === 'maxpot');
  if (idx === -1) { log('No potions in inventory.'); return; }
  const pot = state.player.inventory.splice(idx, 1)[0];
  const healed = Math.min(pot.type === 'maxpot' ? 9999 : pot.value, state.player.maxHp - state.player.hp);
  state.player.hp += healed;
  log(`Used ${pot.name}. Healed ${healed} HP.`, 'item');
  endTurn();
}

function descendStairs() {
  if (state.floor >= MAX_FLOORS) { gameOver(true); return; }
  state.floor++;
  log(`You descend to floor ${state.floor}...`, 'system');
  generateFloor();
  updateHUD();
  render();
}

// ─── Enemy AI ────────────────────────────────────────────────────────────────

function endTurn() {
  state.turn++;
  moveEnemies();
  computeFOV();
  updateHUD();
  render();
}

function moveEnemies() {
  if (state.over) return;
  for (const e of state.entities) {
    if (e.kind !== 'enemy') continue;
    if (!state.visible.has(`${e.x},${e.y}`)) continue;
    const dx = state.player.x - e.x;
    const dy = state.player.y - e.y;
    if (Math.abs(dx) + Math.abs(dy) === 1) {
      const eDmg = Math.max(1, e.atk - totalDef() + randi(-1, 1));
      state.player.hp -= eDmg;
      log(`${e.name} hits you for ${eDmg} damage.`, 'combat');
      if (state.player.hp <= 0) { gameOver(false); return; }
    } else {
      const sx = dx !== 0 ? Math.sign(dx) : 0;
      const sy = dy !== 0 ? Math.sign(dy) : 0;
      const moves = Math.abs(dx) >= Math.abs(dy)
        ? [[sx, 0], [0, sy], [sx, sy]]
        : [[0, sy], [sx, 0], [sx, sy]];
      for (const [ex, ey] of moves) {
        const nx = e.x + ex, ny = e.y + ey;
        if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
        if (state.map[ny][nx] === T.WALL) continue;
        if (entityAt(nx, ny, 'enemy')) continue;
        if (state.player.x === nx && state.player.y === ny) continue;
        e.x = nx; e.y = ny; break;
      }
    }
  }
}

// ─── Game over ───────────────────────────────────────────────────────────────

function gameOver(won) {
  state.over = true;
  state.won  = won;
  updateHUD(); render();
  const overlay = document.getElementById('overlay');
  const title   = document.getElementById('overlay-title');
  const msg     = document.getElementById('overlay-msg');
  overlay.classList.remove('hidden');
  if (won) {
    title.textContent = 'VAULTBORN'; title.style.color = '#e8c87a';
    msg.textContent = `Escaped! Floor ${state.floor}, level ${state.player.level}, gold: ${state.player.gold}.`;
  } else {
    title.textContent = 'YOU DIED'; title.style.color = '#e05050';
    msg.textContent = `Floor ${state.floor} • Level ${state.player.level} • Gold ${state.player.gold}`;
  }
}

document.getElementById('overlay-btn').addEventListener('click', () => {
  document.getElementById('overlay').classList.add('hidden');
  initState();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randi(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function roomCenter(r)   { return { x: Math.floor(r.x + r.w/2), y: Math.floor(r.y + r.h/2) }; }
function rectsOverlap(a, b, pad = 0) {
  return a.x-pad < b.x+b.w && a.x+a.w+pad > b.x && a.y-pad < b.y+b.h && a.y+a.h+pad > b.y;
}
function entityAt(x, y, kind = null) {
  return state.entities.find(e => e.x===x && e.y===y && (!kind || e.kind===kind)) || null;
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

log('You wake in the vault. Find the stairs (>) on each floor.', 'system');
log('Move: WASD / Arrow keys / hjkl  |  Use potion: P', 'system');
initState();
