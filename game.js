// Vaultborn — full-featured roguelike

const TILE  = 24;
const COLS  = 32;
const ROWS  = 25;

const T = { WALL: 0, FLOOR: 1, STAIRS: 2, TRAP: 3 };

// ── Floor themes ──────────────────────────────────────────────────────────────
const FLOOR_THEMES = [
  { name: 'Stone Vault',     wall: '#0e0e22', wallEdge: '#1c1c36', floorRGB: [7,7,14],   fogRGB: [0,0,10],  torchTint: '#e8a850' },
  { name: 'Ancient Crypt',   wall: '#0a1022', wallEdge: '#141e3a', floorRGB: [5,6,14],   fogRGB: [0,0,14],  torchTint: '#7090f0' },
  { name: 'Dark Cavern',     wall: '#120e08', wallEdge: '#241c10', floorRGB: [10,8,5],   fogRGB: [4,2,0],   torchTint: '#ff9840' },
  { name: 'Infernal Depths', wall: '#1e0808', wallEdge: '#381010', floorRGB: [14,5,4],   fogRGB: [10,0,0],  torchTint: '#ff4020' },
  { name: 'The Abyss',       wall: '#0c0818', wallEdge: '#181030', floorRGB: [6,4,14],   fogRGB: [4,0,12],  torchTint: '#c060ff' },
];

// ── Enemy types ───────────────────────────────────────────────────────────────
const ENEMY_TYPES = [
  { name: 'Rat',      ch: 'r', color: '#886644', hp: 5,  maxHp: 5,  atk: 2,  def: 0, xp: 3,  gold: [0,2],   minFloor: 1 },
  { name: 'Goblin',   ch: 'g', color: '#7aaa5a', hp: 9,  maxHp: 9,  atk: 3,  def: 1, xp: 5,  gold: [1,4],   minFloor: 1, status: { type: 'poison',  magnitude: 1, duration: 3 } },
  { name: 'Skeleton', ch: 's', color: '#c0bca0', hp: 12, maxHp: 12, atk: 4,  def: 2, xp: 8,  gold: [2,6],   minFloor: 2 },
  { name: 'Orc',      ch: 'o', color: '#6aaa60', hp: 20, maxHp: 20, atk: 6,  def: 3, xp: 14, gold: [3,8],   minFloor: 2, status: { type: 'burn',    magnitude: 2, duration: 2 } },
  { name: 'Troll',    ch: 'T', color: '#508050', hp: 32, maxHp: 32, atk: 9,  def: 4, xp: 28, gold: [6,14],  minFloor: 3 },
  { name: 'Vampire',  ch: 'V', color: '#c040c0', hp: 28, maxHp: 28, atk: 10, def: 3, xp: 32, gold: [8,18],  minFloor: 3, status: { type: 'weaken',  magnitude: 3, duration: 4 } },
  { name: 'Lich',     ch: 'L', color: '#d060f0', hp: 42, maxHp: 42, atk: 12, def: 5, xp: 50, gold: [10,25], minFloor: 4, status: { type: 'poison',  magnitude: 2, duration: 5 } },
];

const BOSS_TEMPLATE = {
  name: 'Vault Warden', ch: 'W', color: '#ff4040',
  hp: 120, maxHp: 120, atk: 14, def: 7, xp: 200,
  gold: [50, 90], isBoss: true, phase: 1,
};

// ── Item pools ─────────────────────────────────────────────────────────────────
const ITEM_TYPES = [
  { name: 'Health Potion',  ch: '!', color: '#e04040', type: 'potion',  value: 20 },
  { name: 'Big Potion',     ch: '!', color: '#ff8080', type: 'potion',  value: 40 },
  { name: 'Short Sword',    ch: '/', color: '#b0b8c0', type: 'weapon',  value: 3  },
  { name: 'Long Sword',     ch: '/', color: '#d0d8e0', type: 'weapon',  value: 6  },
  { name: 'Battle Axe',     ch: '/', color: '#e8a040', type: 'weapon',  value: 9  },
  { name: 'Leather Armor',  ch: '[', color: '#886644', type: 'armor',   value: 2  },
  { name: 'Chain Mail',     ch: '[', color: '#888898', type: 'armor',   value: 4  },
  { name: 'Plate Armor',    ch: '[', color: '#a8a8c0', type: 'armor',   value: 6  },
  { name: 'Gold Coin',      ch: '$', color: '#e8c86a', type: 'gold',    value: 10 },
  { name: 'Gold Pile',      ch: '$', color: '#f0d870', type: 'gold',    value: 25 },
  { name: 'Fireball Scroll',ch: '?', color: '#f07020', type: 'scroll',  effect: 'fireball' },
  { name: 'Blink Scroll',   ch: '?', color: '#8050e0', type: 'scroll',  effect: 'blink'    },
  { name: 'Reveal Scroll',  ch: '?', color: '#50a8e0', type: 'scroll',  effect: 'reveal'   },
];

const SHOP_POOL = [
  { name: 'Health Potion',   price: 20,  type: 'potion', value: 20, desc: 'Restores 20 HP' },
  { name: 'Big Potion',      price: 35,  type: 'potion', value: 40, desc: 'Restores 40 HP' },
  { name: 'Short Sword',     price: 40,  type: 'weapon', value: 3,  desc: '+3 attack' },
  { name: 'Long Sword',      price: 80,  type: 'weapon', value: 6,  desc: '+6 attack' },
  { name: 'Battle Axe',      price: 140, type: 'weapon', value: 9,  desc: '+9 attack' },
  { name: 'Leather Armor',   price: 30,  type: 'armor',  value: 2,  desc: '+2 defense' },
  { name: 'Chain Mail',      price: 65,  type: 'armor',  value: 4,  desc: '+4 defense' },
  { name: 'Plate Armor',     price: 120, type: 'armor',  value: 6,  desc: '+6 defense' },
  { name: 'Fireball Scroll', price: 50,  type: 'scroll', effect: 'fireball', desc: 'Blasts nearby enemies' },
  { name: 'Blink Scroll',    price: 40,  type: 'scroll', effect: 'blink',    desc: 'Teleport to safety' },
  { name: 'Reveal Scroll',   price: 30,  type: 'scroll', effect: 'reveal',   desc: 'Reveal entire floor' },
];

const SHOP_FLAVORS = [
  "A hooded figure steps from the shadows.",
  "The merchant smells of sulfur and old coin.",
  "A grinning skull behind a makeshift stall.",
  "Trade now — the darkness grows impatient.",
];

// ── Canvas & context ──────────────────────────────────────────────────────────
const canvas  = document.getElementById('game-canvas');
const ctx     = canvas.getContext('2d');
canvas.width  = COLS * TILE;
canvas.height = ROWS * TILE;

const mm    = document.getElementById('minimap');
const mmCtx = mm.getContext('2d');

// ── Audio ─────────────────────────────────────────────────────────────────────
let _ac = null;
function ac() {
  if (!_ac) { try { _ac = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return null; } }
  if (_ac.state === 'suspended') _ac.resume();
  return _ac;
}

function osc(freq, type, dur, vol, startFreq) {
  const a = ac(); if (!a) return;
  const g = a.createGain();
  g.gain.setValueAtTime(vol, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
  const o = a.createOscillator(); o.type = type;
  if (startFreq) {
    o.frequency.setValueAtTime(startFreq, a.currentTime);
    o.frequency.exponentialRampToValueAtTime(freq, a.currentTime + dur * 0.6);
  } else {
    o.frequency.setValueAtTime(freq, a.currentTime);
  }
  o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + dur + 0.05);
}

function noise(dur, vol, filterFreq) {
  const a = ac(); if (!a) return;
  const bufLen = Math.ceil(a.sampleRate * dur);
  const buf  = a.createBuffer(1, bufLen, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource(); src.buffer = buf;
  const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filterFreq;
  const g = a.createGain();
  g.gain.setValueAtTime(vol, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
  src.connect(f); f.connect(g); g.connect(a.destination);
  src.start(); src.stop(a.currentTime + dur + 0.05);
}

function chord(freqs, type, dur, vol) {
  freqs.forEach((f, i) => { setTimeout(() => osc(f, type, dur, vol), i * 80); });
}

const sfx = {
  hit:       () => { osc(80,  'square',   0.10, 0.14, 220); },
  playerHit: () => { osc(55,  'sawtooth', 0.18, 0.20, 150); },
  death:     () => { osc(40,  'sawtooth', 0.38, 0.20, 200); noise(0.3, 0.15, 300); },
  pickup:    () => { chord([440, 660], 'sine', 0.15, 0.10); },
  gold:      () => { chord([523, 659, 784], 'sine', 0.14, 0.09); },
  levelUp:   () => { chord([261, 330, 392, 523], 'sine', 0.22, 0.15); },
  stairs:    () => { osc(200, 'sine', 0.5, 0.12, 500); },
  potion:    () => { noise(0.25, 0.12, 900); chord([440, 554], 'sine', 0.20, 0.07); },
  fireball:  () => { noise(0.5, 0.35, 200); osc(40, 'sine', 0.4, 0.25, 90); },
  blink:     () => { chord([800, 400, 1200], 'sine', 0.08, 0.13); },
  reveal:    () => { chord([440, 554, 659, 880], 'sine', 0.28, 0.09); },
  trap:      () => { osc(100, 'square', 0.14, 0.25, 300); noise(0.15, 0.2, 400); },
  bossPhase: () => { chord([55, 82, 110], 'sawtooth', 0.8, 0.10); },
  victory:   () => { chord([261, 329, 392, 523, 659, 784], 'sine', 0.28, 0.14); },
  gameOver:  () => { chord([220, 185, 165, 147], 'sine', 0.38, 0.14); },
  footstep:  () => { if (Math.random() > 0.35) return; noise(0.06, 0.05, 350 + Math.random()*200); },
};

// ── Game state ────────────────────────────────────────────────────────────────
let state = {};
let particles  = [];
let bloodStains = [];
let shakeFrames = 0;
let torchFlicker = 0;
let clickPath = null;

function randi(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr)        { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ── Map generation ─────────────────────────────────────────────────────────────
function makeMap() {
  const map   = Array.from({ length: ROWS }, () => Array(COLS).fill(T.WALL));
  const rooms = [];

  for (let attempt = 0; attempt < 200; attempt++) {
    const w = randi(5, 11), h = randi(4, 8);
    const x = randi(1, COLS - w - 2), y = randi(1, ROWS - h - 2);
    const overlaps = rooms.some(r => x < r.x+r.w+1 && x+w+1 > r.x && y < r.y+r.h+1 && y+h+1 > r.y);
    if (overlaps) continue;
    for (let ry = y; ry < y+h; ry++) for (let rx = x; rx < x+w; rx++) map[ry][rx] = T.FLOOR;
    if (rooms.length > 0) {
      const prev = rooms[rooms.length-1];
      const cx1 = randi(prev.x, prev.x+prev.w-1), cy1 = randi(prev.y, prev.y+prev.h-1);
      const cx2 = randi(x, x+w-1),                cy2 = randi(y, y+h-1);
      let ax = cx1, ay = cy1;
      while (ax !== cx2) { map[ay][ax] = T.FLOOR; ax += Math.sign(cx2 - cx1); }
      while (ay !== cy2) { map[ay][ax] = T.FLOOR; ay += Math.sign(cy2 - cy1); }
    }
    rooms.push({ x, y, w, h, cx: x + Math.floor(w/2), cy: y + Math.floor(h/2) });
    if (rooms.length >= 10) break;
  }
  return { map, rooms };
}

// ── Floor generation ───────────────────────────────────────────────────────────
function generateFloor() {
  const floor      = state.floor;
  const isBossFloor = floor === 5;
  const theme      = FLOOR_THEMES[(floor - 1) % FLOOR_THEMES.length];
  state.theme      = theme;
  bloodStains      = [];
  particles        = [];
  clickPath        = null;

  const { map, rooms } = makeMap();
  state.map     = map;
  state.rooms   = rooms;
  state.entities = [];

  const startRoom = rooms[0];
  state.player.x  = startRoom.cx;
  state.player.y  = startRoom.cy;

  const lastRoom = rooms[rooms.length - 1];
  if (!isBossFloor) {
    map[lastRoom.cy][lastRoom.cx] = T.STAIRS;
  } else {
    state.entities.push({
      kind: 'enemy', ...BOSS_TEMPLATE,
      hp: BOSS_TEMPLATE.maxHp, phase: 1, color: BOSS_TEMPLATE.color,
      x: lastRoom.cx, y: lastRoom.cy, status: null,
    });
  }

  // Enemies
  const enemyPool  = ENEMY_TYPES.filter(e => e.minFloor <= floor);
  const numEnemies = randi(3 + floor, 6 + floor * 2);
  for (let i = 0; i < numEnemies; i++) {
    const room = pick(rooms.slice(1));
    const type = pick(enemyPool);
    let ex = 0, ey = 0;
    for (let attempt = 0; attempt < 20; attempt++) {
      ex = randi(room.x, room.x + room.w - 1);
      ey = randi(room.y, room.y + room.h - 1);
      if (!entityAt(ex, ey)) break;
    }
    if (entityAt(ex, ey)) continue;
    state.entities.push({
      kind: 'enemy', name: type.name, ch: type.ch, color: type.color,
      hp: type.hp, maxHp: type.hp, atk: type.atk, def: type.def,
      xp: type.xp, gold: type.gold, x: ex, y: ey,
      status: type.status ? { ...type.status } : null,
      isBoss: false,
    });
  }

  // Traps
  const numTraps = randi(2, 3 + floor);
  for (let i = 0; i < numTraps; i++) {
    const room = pick(rooms.slice(1));
    const tx   = randi(room.x, room.x + room.w - 1);
    const ty   = randi(room.y, room.y + room.h - 1);
    if (map[ty][tx] === T.FLOOR && !entityAt(tx, ty)) {
      state.entities.push({ kind: 'trap', trapType: pick(['spike','gas']), x: tx, y: ty, triggered: false });
    }
  }

  // Items
  const numItems = randi(3, 5 + floor);
  for (let i = 0; i < numItems; i++) {
    const room = pick(rooms.slice(1));
    const ix   = randi(room.x, room.x + room.w - 1);
    const iy   = randi(room.y, room.y + room.h - 1);
    if (map[iy][ix] === T.FLOOR && !entityAt(ix, iy)) {
      const type = pick(ITEM_TYPES);
      state.entities.push({ kind: 'item', ...type, x: ix, y: iy });
    }
  }

  state.visible  = new Set();
  state.explored = new Set();
  computeFOV();
  updateHUD();
  updateMinimap();
  log(`Floor ${floor}: ${theme.name}`, 'system');
  if (isBossFloor) log('A terrifying presence lurks ahead...', 'boss');
}

// ── Entity helpers ─────────────────────────────────────────────────────────────
function entityAt(x, y, kind) {
  return state.entities.find(e => e.x === x && e.y === y && (kind ? e.kind === kind : e.kind !== 'trap'));
}

// ── FOV ────────────────────────────────────────────────────────────────────────
function computeFOV() {
  state.visible = new Set();
  const px = state.player.x, py = state.player.y;
  const R  = 7;
  for (let angle = 0; angle < 360; angle++) {
    const rad = angle * Math.PI / 180;
    let rx = px, ry = py;
    const ddx = Math.cos(rad), ddy = Math.sin(rad);
    for (let step = 0; step <= R; step++) {
      const tx = Math.round(rx), ty = Math.round(ry);
      if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) break;
      const key = `${tx},${ty}`;
      state.visible.add(key);
      state.explored.add(key);
      if (state.map[ty][tx] === T.WALL) break;
      rx += ddx; ry += ddy;
    }
  }
}

// ── BFS pathfinding ────────────────────────────────────────────────────────────
function bfs(sx, sy, tx, ty) {
  if (state.map[ty]?.[tx] === T.WALL) return null;
  const queue = [[sx, sy]];
  const prev  = { [`${sx},${sy}`]: null };
  const DIRS  = [[0,-1],[0,1],[-1,0],[1,0]];
  while (queue.length) {
    const [cx, cy] = queue.shift();
    if (cx === tx && cy === ty) break;
    for (const [ddx, ddy] of DIRS) {
      const nx = cx+ddx, ny = cy+ddy, key = `${nx},${ny}`;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
      if (state.map[ny][nx] === T.WALL) continue;
      if (key in prev) continue;
      const ent = entityAt(nx, ny, 'enemy');
      if (ent && (nx !== tx || ny !== ty)) continue;
      prev[key] = [cx, cy]; queue.push([nx, ny]);
    }
  }
  const target = `${tx},${ty}`;
  if (!(target in prev)) return null;
  const path = []; let cur = [tx, ty];
  while (cur) { path.unshift(cur); cur = prev[`${cur[0]},${cur[1]}`]; }
  return path;
}

// ── Combat ─────────────────────────────────────────────────────────────────────
function totalDef() {
  const base     = state.player.def + (state.player.armor?.value ?? 0);
  const weakened = state.player.effects?.some(e => e.type === 'weaken') ?? false;
  return Math.max(0, base - (weakened ? 3 : 0));
}

function totalAtk() {
  return state.player.atk + (state.player.weapon?.value ?? 0);
}

function attackEnemy(enemy) {
  const dmg = Math.max(1, totalAtk() - enemy.def + randi(-1, 2));
  enemy.hp -= dmg;
  spawnDmgNum(enemy.x, enemy.y, dmg, '#ff8060');
  spawnSparks(enemy.x, enemy.y, '#ff6040', 6);
  sfx.hit();

  if (enemy.isBoss && enemy.phase === 1 && enemy.hp <= enemy.maxHp * 0.5 && enemy.hp > 0) {
    enemy.phase = 2; enemy.atk += 5; enemy.color = '#ff6020';
    spawnBurst(enemy.x, enemy.y, '#ff4020', 30);
    sfx.bossPhase();
    log('THE VAULT WARDEN ENRAGES! [Phase 2!]', 'boss');
    spawnMinions(enemy.x, enemy.y);
  }

  if (enemy.hp <= 0) {
    sfx.death();
    spawnBurst(enemy.x, enemy.y, enemy.color, 20);
    bloodStains.push({ x: enemy.x, y: enemy.y, r: Math.random() });
    log(`You slay the ${enemy.name}!`, 'combat');
    state.player.xp += enemy.xp;
    state.player.kills = (state.player.kills || 0) + 1;
    const goldAmt = randi(enemy.gold[0], enemy.gold[1]);
    if (goldAmt > 0) { state.player.gold += goldAmt; spawnGoldSparkles(enemy.x, enemy.y, goldAmt); sfx.gold(); }
    state.entities = state.entities.filter(e => e !== enemy);
    checkLevelUp();
    if (enemy.isBoss) { setTimeout(() => gameOver(true), 1200); }
  }
}

function spawnMinions(bx, by) {
  [[bx-1, by],[bx+1, by]].forEach(([mx, my]) => {
    if (state.map[my]?.[mx] === T.FLOOR && !entityAt(mx, my)) {
      state.entities.push({
        kind: 'enemy', name: 'Skeleton', ch: 's', color: '#c0bca0',
        hp: 12, maxHp: 12, atk: 4, def: 2, xp: 8, gold: [2,6],
        x: mx, y: my, isBoss: false, status: null,
      });
    }
  });
}

function attackPlayer(enemy) {
  const dmg = Math.max(1, enemy.atk - totalDef() + randi(-1, 2));
  state.player.hp -= dmg;
  spawnDmgNum(state.player.x, state.player.y, dmg, '#ff4040');
  sfx.playerHit();
  shakeFrames = 8;
  if (enemy.status && Math.random() < 0.45) applyStatusEffect({ ...enemy.status });
  if (state.player.hp <= 0) gameOver(false);
}

function checkLevelUp() {
  const xpNeeded = state.player.level * 15;
  if (state.player.xp >= xpNeeded) {
    state.player.xp -= xpNeeded;
    state.player.level++;
    state.player.maxHp += 8;
    state.player.hp = Math.min(state.player.hp + 10, state.player.maxHp);
    state.player.atk++;
    state.player.def++;
    sfx.levelUp();
    spawnBurst(state.player.x, state.player.y, '#e8c87a', 25);
    log(`Level up! Now level ${state.player.level}.`, 'system');
  }
}

// ── Status effects ─────────────────────────────────────────────────────────────
function applyStatusEffect(eff) {
  const existing = state.player.effects.find(e => e.type === eff.type);
  if (existing) { existing.duration = Math.max(existing.duration, eff.duration); return; }
  state.player.effects.push({ ...eff });
  log(`You are ${eff.type === 'weaken' ? 'weakened' : eff.type + 'ed'}!`, 'combat');
}

function applyPlayerEffects() {
  const toRemove = [];
  for (const eff of state.player.effects) {
    if (eff.type === 'poison') {
      state.player.hp -= eff.magnitude;
      spawnDmgNum(state.player.x, state.player.y, eff.magnitude, '#60c840');
    } else if (eff.type === 'burn') {
      state.player.hp -= eff.magnitude;
      spawnSparks(state.player.x, state.player.y, '#f06020', 4);
      spawnDmgNum(state.player.x, state.player.y, eff.magnitude, '#f08040');
    }
    eff.duration--;
    if (eff.duration <= 0) toRemove.push(eff);
  }
  state.player.effects = state.player.effects.filter(e => !toRemove.includes(e));
  if (state.player.hp <= 0 && !state.over) gameOver(false);
}

// ── Items ──────────────────────────────────────────────────────────────────────
function pickupItem(item) {
  state.entities = state.entities.filter(e => e !== item);
  if (item.type === 'gold') {
    state.player.gold += item.value;
    spawnGoldSparkles(item.x, item.y, item.value);
    sfx.gold();
    log(`Picked up ${item.value} gold.`, 'item');
  } else if (item.type === 'potion') {
    state.player.inventory.push({ name: item.name, type: 'potion', value: item.value });
    sfx.pickup();
    log(`Picked up ${item.name}.`, 'item');
  } else if (item.type === 'scroll') {
    state.player.inventory.push({ name: item.name, type: 'scroll', effect: item.effect });
    sfx.pickup();
    log(`Picked up ${item.name}.`, 'item');
  } else if (item.type === 'weapon') {
    if (state.player.weapon) state.entities.push({ kind: 'item', ...state.player.weapon, x: item.x, y: item.y });
    state.player.weapon = { name: item.name, value: item.value, type: 'weapon' };
    sfx.pickup();
    log(`Equipped ${item.name} (+${item.value} ATK).`, 'item');
  } else if (item.type === 'armor') {
    if (state.player.armor) state.entities.push({ kind: 'item', ...state.player.armor, x: item.x, y: item.y });
    state.player.armor = { name: item.name, value: item.value, type: 'armor' };
    sfx.pickup();
    log(`Equipped ${item.name} (+${item.value} DEF).`, 'item');
  }
}

function usePotion() {
  const idx = state.player.inventory.findIndex(i => i.type === 'potion');
  if (idx === -1) { log('No potions in bag.', 'system'); return; }
  const pot    = state.player.inventory.splice(idx, 1)[0];
  const healed = Math.min(pot.value, state.player.maxHp - state.player.hp);
  state.player.hp += healed;
  sfx.potion();
  spawnBurst(state.player.x, state.player.y, '#60ff60', 12);
  log(`Used ${pot.name}, restored ${healed} HP.`, 'item');
  endTurn();
}

function useScroll() {
  const idx = state.player.inventory.findIndex(i => i.type === 'scroll');
  if (idx === -1) { log('No scrolls in bag.', 'system'); return; }
  const scroll = state.player.inventory.splice(idx, 1)[0];
  activateScroll(scroll.effect);
  endTurn();
}

function activateScroll(effect) {
  if (effect === 'fireball') {
    sfx.fireball();
    log('FIREBALL! Nearby enemies take 15 damage!', 'system');
    const toKill = [];
    state.entities.filter(e => e.kind === 'enemy').forEach(e => {
      const dist = Math.abs(e.x - state.player.x) + Math.abs(e.y - state.player.y);
      if (dist <= 4) {
        e.hp -= 15;
        spawnBurst(e.x, e.y, '#ff6020', 18);
        if (e.hp <= 0) toKill.push(e);
      }
    });
    toKill.forEach(e => {
      sfx.death();
      state.player.xp += e.xp;
      state.player.gold += randi(e.gold[0], e.gold[1]);
      bloodStains.push({ x: e.x, y: e.y, r: Math.random() });
      state.entities = state.entities.filter(x => x !== e);
      state.player.kills++;
    });
    if (toKill.length) checkLevelUp();
  } else if (effect === 'blink') {
    sfx.blink();
    spawnBurst(state.player.x, state.player.y, '#8060e0', 15);
    const floors = [];
    for (let ry = 0; ry < ROWS; ry++) for (let rx = 0; rx < COLS; rx++) {
      if (state.map[ry][rx] === T.FLOOR && !entityAt(rx, ry)) floors.push([rx, ry]);
    }
    if (floors.length) {
      const [bx, by] = pick(floors);
      state.player.x = bx; state.player.y = by;
      computeFOV(); updateMinimap();
      spawnBurst(bx, by, '#c0a0ff', 15);
      log('You blink across the dungeon!', 'system');
    }
  } else if (effect === 'reveal') {
    sfx.reveal();
    for (let ry = 0; ry < ROWS; ry++) for (let rx = 0; rx < COLS; rx++) state.explored.add(`${rx},${ry}`);
    updateMinimap();
    log('The floor layout is revealed!', 'system');
  }
}

// ── Traps ──────────────────────────────────────────────────────────────────────
function checkTrap(x, y) {
  const trap = state.entities.find(e => e.kind === 'trap' && e.x === x && e.y === y && !e.triggered);
  if (!trap) return;
  trap.triggered = true;
  sfx.trap();
  shakeFrames = 6;
  if (trap.trapType === 'spike') {
    const dmg = randi(4 + state.floor, 8 + state.floor * 2);
    state.player.hp -= dmg;
    spawnDmgNum(x, y, dmg, '#ff4040');
    log(`Spike trap! Took ${dmg} damage!`, 'combat');
    if (state.player.hp <= 0) gameOver(false);
  } else {
    applyStatusEffect({ type: 'poison', magnitude: 1, duration: 4 });
    log('Gas trap! You are poisoned!', 'combat');
  }
}

// ── Movement & turn ────────────────────────────────────────────────────────────
function tryMove(dx, dy) {
  if (state.over || state.shopOpen) return;
  const nx = state.player.x + dx, ny = state.player.y + dy;
  if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return;
  if (state.map[ny][nx] === T.WALL) return;

  const enemy = entityAt(nx, ny, 'enemy');
  if (enemy) { attackEnemy(enemy); endTurn(); return; }

  state.player.x = nx; state.player.y = ny;
  sfx.footstep();
  checkTrap(nx, ny);

  const item = entityAt(nx, ny, 'item');
  if (item) pickupItem(item);

  if (state.map[ny][nx] === T.STAIRS) { sfx.stairs(); openShop(); return; }

  endTurn();
}

function endTurn() {
  state.turn++;
  applyPlayerEffects();
  moveEnemies();
  computeFOV();
  updateHUD();
  updateMinimap();
}

function moveEnemies() {
  for (const e of state.entities.filter(e => e.kind === 'enemy')) {
    const dist = Math.abs(e.x - state.player.x) + Math.abs(e.y - state.player.y);
    if (!state.visible.has(`${e.x},${e.y}`) && dist > 10) continue;
    if (dist === 1) { attackPlayer(e); continue; }
    const path = bfs(e.x, e.y, state.player.x, state.player.y);
    if (path && path.length >= 2) {
      const [nx, ny] = path[1];
      if (!entityAt(nx, ny, 'enemy')) { e.x = nx; e.y = ny; }
    }
  }
}

// ── Shop ───────────────────────────────────────────────────────────────────────
function openShop() {
  state.shopOpen = true;
  state.shopInventory = [...SHOP_POOL].sort(() => Math.random() - 0.5).slice(0, 4);

  document.getElementById('shop-flavor').textContent     = pick(SHOP_FLAVORS);
  document.getElementById('shop-gold-amount').textContent = state.player.gold;

  const list = document.getElementById('shop-items-list');
  list.innerHTML = '';
  state.shopInventory.forEach((item, i) => {
    const row  = document.createElement('div'); row.className = 'shop-item';
    const info = document.createElement('div'); info.className = 'shop-item-info';
    info.innerHTML = `<div class="shop-item-name">${item.name}</div><div class="shop-item-desc">${item.desc}</div>`;
    const price = document.createElement('div'); price.className = 'shop-item-price';
    price.textContent = item.price + 'g';
    const btn = document.createElement('button'); btn.className = 'shop-buy-btn';
    btn.textContent = 'BUY';
    btn.disabled = state.player.gold < item.price;
    btn.onclick = () => buyShopItem(i, btn);
    row.appendChild(info); row.appendChild(price); row.appendChild(btn);
    list.appendChild(row);
  });

  document.getElementById('shop-overlay').classList.remove('hidden');
}

function buyShopItem(i, btn) {
  const item = state.shopInventory[i];
  if (!item || state.player.gold < item.price) return;
  state.player.gold -= item.price;
  sfx.pickup();

  if (item.type === 'potion') {
    state.player.inventory.push({ name: item.name, type: 'potion', value: item.value });
  } else if (item.type === 'scroll') {
    state.player.inventory.push({ name: item.name, type: 'scroll', effect: item.effect });
  } else if (item.type === 'weapon') {
    state.player.weapon = { name: item.name, value: item.value, type: 'weapon' };
  } else if (item.type === 'armor') {
    state.player.armor = { name: item.name, value: item.value, type: 'armor' };
  }
  log(`Bought ${item.name}.`, 'item');
  state.shopInventory[i] = null;

  btn.disabled = true; btn.textContent = 'SOLD';
  document.getElementById('shop-gold-amount').textContent = state.player.gold;

  // Refresh affordability for remaining items
  const allBtns = document.querySelectorAll('.shop-buy-btn');
  allBtns.forEach((b, idx) => {
    const it = state.shopInventory[idx];
    if (it && !b.disabled) b.disabled = state.player.gold < it.price;
  });
  updateHUD();
}

function closeShop() {
  state.shopOpen = false;
  document.getElementById('shop-overlay').classList.add('hidden');
  const fade = document.getElementById('fade-overlay');
  fade.style.opacity = '1';
  setTimeout(() => {
    state.floor++;
    generateFloor();
    updateHUD();
    updateMinimap();
    setTimeout(() => { fade.style.opacity = '0'; }, 60);
  }, 460);
}

// ── High scores ────────────────────────────────────────────────────────────────
function saveScore(entry) {
  const scores = JSON.parse(localStorage.getItem('vaultborn_scores') || '[]');
  scores.push(entry);
  scores.sort((a, b) => (b.won - a.won) || b.floor - a.floor || b.level - a.level || b.gold - a.gold);
  localStorage.setItem('vaultborn_scores', JSON.stringify(scores.slice(0, 8)));
}

function renderHighScores() {
  const scores    = JSON.parse(localStorage.getItem('vaultborn_scores') || '[]');
  const container = document.getElementById('high-scores-list');
  container.innerHTML = '';
  if (!scores.length) { container.textContent = 'No runs yet.'; return; }
  scores.forEach((s, i) => {
    const row     = document.createElement('div'); row.className = 'hs-row';
    const outcome = s.won
      ? '<span class="hs-won">WON</span>'
      : '<span class="hs-died">Died</span>';
    row.innerHTML = `<span>#${i+1} Fl${s.floor} Lv${s.level}</span><span>${s.gold}g ${s.kills}k</span>${outcome}`;
    container.appendChild(row);
  });
}

// ── Game over ──────────────────────────────────────────────────────────────────
function gameOver(won) {
  if (state.over) return;
  state.over = true; state.won = won;
  won ? sfx.victory() : sfx.gameOver();

  saveScore({ floor: state.floor, level: state.player.level, gold: state.player.gold, kills: state.player.kills || 0, won, ts: Date.now() });

  const title = document.getElementById('overlay-title');
  title.textContent = won ? 'VICTORY!' : 'YOU DIED';
  title.style.color = won ? '#e8c87a' : '#c84040';
  document.getElementById('overlay-stats').textContent =
    `Floor ${state.floor}  ·  Level ${state.player.level}  ·  ${state.player.gold}g  ·  ${state.player.kills} kills`;
  document.getElementById('overlay-msg').textContent = won
    ? "The Vault Warden falls. You claim the vault's treasure and emerge victorious!"
    : "The darkness swallows you. Your legend fades... for now.";

  renderHighScores();
  document.getElementById('overlay').classList.remove('hidden');
}

// ── HUD ────────────────────────────────────────────────────────────────────────
function updateHUD() {
  const p = state.player;
  document.getElementById('hud-level').textContent = `LVL ${p.level}`;
  document.getElementById('hud-floor').textContent = `FLOOR ${state.floor}`;
  document.getElementById('hud-gold').textContent  = `${p.gold}g`;
  document.getElementById('hp-text').textContent   = `${p.hp}/${p.maxHp}`;
  document.getElementById('xp-text').textContent   = `${p.xp}/${p.level * 15}`;
  document.getElementById('hud-atk').textContent   = totalAtk();
  document.getElementById('hud-def').textContent   = totalDef();

  const hpFill = document.getElementById('hp-fill');
  hpFill.style.width      = clamp(p.hp / p.maxHp * 100, 0, 100) + '%';
  hpFill.style.background = p.hp < p.maxHp * 0.3 ? '#d84040' : p.hp < p.maxHp * 0.6 ? '#d8a040' : '#48cc58';
  document.getElementById('xp-fill').style.width = clamp(p.xp / (p.level * 15) * 100, 0, 100) + '%';

  document.getElementById('equip-weapon').textContent = p.weapon ? `⚔ ${p.weapon.name}` : '[ no weapon ]';
  document.getElementById('equip-weapon').className   = 'equip-slot' + (p.weapon ? '' : ' empty');
  document.getElementById('equip-armor').textContent  = p.armor  ? `🛡 ${p.armor.name}`  : '[ no armor ]';
  document.getElementById('equip-armor').className    = 'equip-slot' + (p.armor  ? '' : ' empty');

  const invList = document.getElementById('inventory-list');
  invList.innerHTML = '';
  p.inventory.forEach(it => {
    const li = document.createElement('li');
    li.textContent = it.type === 'scroll' ? `? ${it.name}` : `! ${it.name}`;
    li.style.color  = it.type === 'scroll' ? '#8080e0' : '#80c880';
    invList.appendChild(li);
  });

  const effRow  = document.getElementById('effects-row');
  const effList = document.getElementById('effects-list');
  if (p.effects?.length) {
    effRow.classList.remove('hidden');
    effList.innerHTML = '';
    p.effects.forEach(e => {
      const tag = document.createElement('span');
      tag.className   = `effect-tag ${e.type}`;
      tag.textContent = `${e.type} (${e.duration})`;
      effList.appendChild(tag);
    });
  } else {
    effRow.classList.add('hidden');
  }
}

// ── Minimap ────────────────────────────────────────────────────────────────────
function updateMinimap() {
  mmCtx.fillStyle = '#04040e';
  mmCtx.fillRect(0, 0, mm.width, mm.height);

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const key  = `${col},${row}`;
      const expl = state.explored.has(key);
      if (!expl) continue;
      const vis  = state.visible.has(key);
      const tile = state.map[row][col];
      mmCtx.fillStyle =
        tile === T.WALL   ? (vis ? '#282844' : '#141424')
        : tile === T.STAIRS ? '#c090f8'
        : (vis ? '#484868' : '#242440');
      mmCtx.fillRect(col * 4, row * 3, 4, 3);
    }
  }
  state.entities.filter(e => e.kind === 'enemy' && state.visible.has(`${e.x},${e.y}`)).forEach(e => {
    mmCtx.fillStyle = e.isBoss ? '#ff4040' : '#d84040';
    mmCtx.fillRect(e.x * 4, e.y * 3, 4, 3);
  });
  state.entities.filter(e => e.kind === 'item' && state.visible.has(`${e.x},${e.y}`)).forEach(e => {
    mmCtx.fillStyle = '#50c860';
    mmCtx.fillRect(e.x * 4, e.y * 3, 4, 3);
  });
  mmCtx.fillStyle = '#f0d080';
  mmCtx.fillRect(state.player.x * 4, state.player.y * 3, 4, 3);
}

// ── Particles ──────────────────────────────────────────────────────────────────
function spawnDmgNum(tx, ty, dmg, color) {
  particles.push({ type: 'dmg', text: String(dmg), color, x: (tx + 0.5)*TILE, y: (ty + 0.3)*TILE, vy: -1.4 - Math.random(), life: 1, maxLife: 1 });
}
function spawnSparks(tx, ty, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random()*Math.PI*2, s = 1 + Math.random()*2;
    particles.push({ type: 'spark', color, x: (tx+0.5)*TILE, y: (ty+0.5)*TILE, vx: Math.cos(a)*s, vy: Math.sin(a)*s, life: 0.6+Math.random()*0.4, maxLife: 1 });
  }
}
function spawnBurst(tx, ty, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random()*Math.PI*2, s = 1.5 + Math.random()*3;
    particles.push({ type: 'spark', color, x: (tx+0.5)*TILE, y: (ty+0.5)*TILE, vx: Math.cos(a)*s, vy: Math.sin(a)*s, life: 0.8+Math.random()*0.6, maxLife: 1.4 });
  }
}
function spawnGoldSparkles(tx, ty, amount) {
  const n = Math.min(Math.ceil(amount / 3), 18);
  for (let i = 0; i < n; i++) {
    const a = Math.random()*Math.PI*2, s = 0.8 + Math.random()*2;
    particles.push({ type: 'spark', color: Math.random() < 0.5 ? '#f0d060' : '#fff4a0', x: (tx+0.5)*TILE, y: (ty+0.5)*TILE, vx: Math.cos(a)*s, vy: Math.sin(a)*s, life: 0.5+Math.random()*0.5, maxLife: 1 });
  }
}

function spawnAmbientDust() {
  if (Math.random() > 0.08 || !state.visible.size) return;
  const keys = [...state.visible];
  const key  = keys[Math.floor(Math.random() * keys.length)];
  const [cx, cy] = key.split(',').map(Number);
  if (state.map[cy]?.[cx] !== T.FLOOR) return;
  particles.push({ type: 'dust', x: (cx + Math.random())*TILE, y: (cy + Math.random())*TILE, vx: (Math.random()-0.5)*0.3, vy: -0.2 - Math.random()*0.3, life: 2 + Math.random()*2, maxLife: 4, size: 1 + Math.random()*1.5 });
}

function updateParticles() {
  spawnAmbientDust();
  particles = particles.filter(p => {
    p.x += (p.vx || 0); p.y += (p.vy || 0);
    p.life -= 0.016;
    if (p.type === 'spark') { p.vx = (p.vx||0)*0.9; p.vy = (p.vy||0)*0.9 + 0.12; }
    return p.life > 0;
  });
}

// ── Render ─────────────────────────────────────────────────────────────────────
function render() {
  const theme = state.theme || FLOOR_THEMES[0];
  torchFlicker += 0.04;

  let shakeX = 0, shakeY = 0;
  if (shakeFrames > 0) { shakeX = (Math.random()-0.5)*6; shakeY = (Math.random()-0.5)*6; shakeFrames--; }
  ctx.save();
  ctx.translate(shakeX, shakeY);

  ctx.fillStyle = theme.wall;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const [fr, fg, fb]     = theme.floorRGB;
  const [fogR, fogG, fogB] = theme.fogRGB;

  // Blood
  bloodStains.forEach(b => {
    if (!state.explored.has(`${b.x},${b.y}`)) return;
    const px = b.x*TILE, py = b.y*TILE;
    const fade = state.visible.has(`${b.x},${b.y}`) ? 0.35 : 0.12;
    ctx.save(); ctx.globalAlpha = fade; ctx.fillStyle = '#800020';
    ctx.beginPath();
    ctx.ellipse(px+TILE*0.5, py+TILE*0.55, TILE*0.28*(0.7+b.r*0.6), TILE*0.18*(0.7+b.r*0.6), b.r*Math.PI, 0, Math.PI*2);
    ctx.fill(); ctx.restore();
  });

  // Tiles
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const key  = `${col},${row}`;
      const vis  = state.visible.has(key);
      const expl = state.explored.has(key);
      if (!expl) continue;

      const tile = state.map[row][col];
      const px   = col*TILE, py = row*TILE;

      if (tile === T.WALL) {
        ctx.fillStyle = vis ? theme.wallEdge : theme.wall;
        ctx.fillRect(px, py, TILE, TILE);
        if (vis) {
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.fillRect(px+TILE-3, py, 3, TILE);
          ctx.fillRect(px, py+TILE-3, TILE, 3);
        }
      } else {
        const br = vis ? 1.0 : 0.35;
        ctx.fillStyle = `rgb(${Math.round(fr*br)},${Math.round(fg*br)},${Math.round(fb*br)})`;
        ctx.fillRect(px, py, TILE, TILE);
        if (vis) {
          ctx.strokeStyle = `rgba(${fr+4},${fg+4},${fb+8},0.3)`;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px+0.5, py+0.5, TILE-1, TILE-1);
        }
        if (tile === T.STAIRS && vis) {
          ctx.fillStyle = '#8050c8';
          ctx.font = `${TILE-4}px monospace`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.shadowColor = '#c090f8'; ctx.shadowBlur = 12;
          ctx.fillText('>', px+TILE/2, py+TILE/2+1);
          ctx.shadowBlur = 0;
        }
      }
    }
  }

  // Triggered traps
  state.entities.filter(e => e.kind === 'trap' && e.triggered && state.visible.has(`${e.x},${e.y}`)).forEach(e => {
    ctx.fillStyle = e.trapType === 'spike' ? '#c04040' : '#60c040';
    ctx.font = `${TILE-6}px monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('^', e.x*TILE+TILE/2, e.y*TILE+TILE/2+1);
  });

  // Items
  state.entities.filter(e => e.kind === 'item' && state.visible.has(`${e.x},${e.y}`)).forEach(e => {
    ctx.fillStyle = e.color;
    ctx.font = `${TILE-5}px monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = e.color; ctx.shadowBlur = 8;
    ctx.fillText(e.ch, e.x*TILE+TILE/2, e.y*TILE+TILE/2+1);
    ctx.shadowBlur = 0;
  });

  // Enemies with HP bars
  state.entities.filter(e => e.kind === 'enemy' && state.visible.has(`${e.x},${e.y}`)).forEach(e => {
    const px = e.x*TILE, py = e.y*TILE;
    const barW = TILE-2, barH = 3;
    ctx.fillStyle = '#200808'; ctx.fillRect(px+1, py+1, barW, barH);
    const ratio     = clamp(e.hp / e.maxHp, 0, 1);
    ctx.fillStyle   = ratio > 0.6 ? '#50d060' : ratio > 0.3 ? '#d0a030' : '#d03030';
    ctx.fillRect(px+1, py+1, Math.round(barW*ratio), barH);

    ctx.fillStyle = e.color;
    ctx.font = `bold ${TILE-4}px monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = e.color; ctx.shadowBlur = e.isBoss ? 20 : 10;
    ctx.fillText(e.ch, px+TILE/2, py+TILE/2+3);
    ctx.shadowBlur = 0;
  });

  // Player
  {
    const px = state.player.x*TILE, py = state.player.y*TILE;
    const pulse = 0.7 + 0.3*Math.sin(torchFlicker*2);
    ctx.fillStyle = '#f0d080';
    ctx.font = `bold ${TILE-2}px monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = `rgba(240,200,80,${pulse})`; ctx.shadowBlur = 18*pulse;
    ctx.fillText('@', px+TILE/2, py+TILE/2+1);
    ctx.shadowBlur = 0;
  }

  // Particles
  particles.forEach(p => {
    if (p.type === 'dmg') {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle   = p.color;
      ctx.font = `bold 12px 'VT323', monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(p.text, p.x, p.y);
      ctx.globalAlpha = 1;
    } else if (p.type === 'spark') {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle   = p.color;
      ctx.fillRect(p.x-2, p.y-2, 3, 3);
      ctx.globalAlpha = 1;
    } else if (p.type === 'dust') {
      ctx.globalAlpha = (p.life / p.maxLife) * 0.3;
      ctx.fillStyle   = '#8080a0';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    }
  });

  // Torch vignette
  {
    const px = (state.player.x+0.5)*TILE, py = (state.player.y+0.5)*TILE;
    const flicker = 1 + 0.06*Math.sin(torchFlicker*3.7) + 0.04*Math.sin(torchFlicker*7.3);
    const r2 = TILE*9*flicker;
    const r1 = TILE*4.5*flicker;
    const grad = ctx.createRadialGradient(px, py, r1, px, py, r2);
    grad.addColorStop(0,   'rgba(0,0,0,0)');
    grad.addColorStop(0.6, `rgba(${fogR},${fogG},${fogB},0.55)`);
    grad.addColorStop(1,   `rgba(${fogR},${fogG},${fogB},0.97)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Tint glow
    ctx.globalAlpha = 0.14 * flicker;
    ctx.fillStyle   = theme.torchTint;
    ctx.beginPath(); ctx.arc(px, py, TILE*3.5*flicker, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ── Input ──────────────────────────────────────────────────────────────────────
canvas.addEventListener('click', e => {
  if (state.over || state.shopOpen) return;
  const rect  = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  const tx = Math.floor((e.clientX - rect.left) * scaleX / TILE);
  const ty = Math.floor((e.clientY - rect.top)  * scaleY / TILE);
  if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) return;
  if (!state.explored.has(`${tx},${ty}`)) return;

  const enemy = entityAt(tx, ty, 'enemy');
  if (enemy && state.visible.has(`${tx},${ty}`)) {
    const dist = Math.abs(enemy.x - state.player.x) + Math.abs(enemy.y - state.player.y);
    if (dist === 1) { attackEnemy(enemy); endTurn(); return; }
  }

  const path = bfs(state.player.x, state.player.y, tx, ty);
  if (path && path.length > 1) clickPath = path.slice(1);
});

canvas.addEventListener('mousemove', e => {
  if (state.over || state.shopOpen) return;
  const rect   = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  const tx = Math.floor((e.clientX - rect.left) * scaleX / TILE);
  const ty = Math.floor((e.clientY - rect.top)  * scaleY / TILE);
  const tt = document.getElementById('inspect-tooltip');

  if (!state.visible?.has(`${tx},${ty}`)) { tt.classList.add('hidden'); return; }

  const enemy = entityAt(tx, ty, 'enemy');
  const item  = entityAt(tx, ty, 'item');

  if (enemy) {
    tt.classList.remove('hidden');
    document.getElementById('tt-name').textContent  = enemy.name + (enemy.isBoss ? ' [BOSS]' : '');
    document.getElementById('tt-stats').innerHTML   = `HP: ${enemy.hp}/${enemy.maxHp}<br>ATK: ${enemy.atk}  DEF: ${enemy.def}`;
    tt.style.left = (e.clientX + 14) + 'px';
    tt.style.top  = (e.clientY - 10) + 'px';
  } else if (item) {
    tt.classList.remove('hidden');
    document.getElementById('tt-name').textContent  = item.name;
    document.getElementById('tt-stats').textContent =
      item.type === 'potion' ? `Restores ${item.value} HP`
      : item.type === 'weapon' ? `+${item.value} ATK`
      : item.type === 'armor'  ? `+${item.value} DEF`
      : item.type === 'gold'   ? `${item.value} gold`
      : item.type === 'scroll' ? `Scroll: ${item.effect}`
      : '';
    tt.style.left = (e.clientX + 14) + 'px';
    tt.style.top  = (e.clientY - 10) + 'px';
  } else {
    tt.classList.add('hidden');
  }
});

canvas.addEventListener('mouseleave', () => {
  document.getElementById('inspect-tooltip').classList.add('hidden');
});

document.addEventListener('keydown', e => {
  if (state.over || state.shopOpen) return;
  clickPath = null;
  switch (e.key) {
    case 'ArrowUp':    case 'w': case 'W': case 'k': tryMove( 0,-1); break;
    case 'ArrowDown':  case 's': case 'S': case 'j': tryMove( 0, 1); break;
    case 'ArrowLeft':  case 'a': case 'A': case 'h': tryMove(-1, 0); break;
    case 'ArrowRight': case 'd': case 'D': case 'l': tryMove( 1, 0); break;
    case 'p': case 'P': if (!state.over && !state.shopOpen) { usePotion(); updateHUD(); } break;
    case 'u': case 'U': if (!state.over && !state.shopOpen) { useScroll(); updateHUD(); } break;
  }
});

// ── Message log ────────────────────────────────────────────────────────────────
function log(text, cls = 'new') {
  const ul = document.getElementById('message-log');
  // Age current new entries
  for (const li of ul.children) li.classList.remove('new');
  const li = document.createElement('li');
  li.textContent = text; li.className = cls;
  ul.prepend(li);
  while (ul.children.length > 60) ul.removeChild(ul.lastChild);
}

// ── Game loop ──────────────────────────────────────────────────────────────────
function loop() {
  if (clickPath && clickPath.length > 0 && !state.over && !state.shopOpen) {
    const [nx, ny] = clickPath[0];
    tryMove(nx - state.player.x, ny - state.player.y);
    clickPath.shift();
    if (clickPath.length === 0) clickPath = null;
  }
  updateParticles();
  render();
  requestAnimationFrame(loop);
}

// ── Init ───────────────────────────────────────────────────────────────────────
function initGame() {
  state = {
    floor: 1, map: [], rooms: [], entities: [], theme: FLOOR_THEMES[0],
    player: {
      x: 0, y: 0, hp: 24, maxHp: 24, atk: 4, def: 1,
      xp: 0, level: 1, gold: 0, kills: 0,
      inventory: [], weapon: null, armor: null, effects: [],
    },
    visible: new Set(), explored: new Set(),
    turn: 0, over: false, won: false, shopOpen: false, shopInventory: [],
  };
  document.getElementById('overlay').classList.add('hidden');
  document.getElementById('shop-overlay').classList.add('hidden');
  document.getElementById('inspect-tooltip').classList.add('hidden');
  bloodStains = []; particles = []; clickPath = null; shakeFrames = 0;
  generateFloor();
  log('You descend into the vault...', 'system');
  log('Survive 5 floors and defeat the Vault Warden.', 'system');
}

document.getElementById('overlay-btn').addEventListener('click', initGame);
document.getElementById('shop-leave').addEventListener('click', closeShop);

initGame();
requestAnimationFrame(loop);
