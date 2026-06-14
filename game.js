'use strict';

// ─── Constants ───────────────────────────────────────────────────────────────
const TILE      = 24;
const COLS      = 32;
const ROWS      = 25;
const MAX_FLOORS = 5;
const SIGHT     = 7;

const T = { WALL: 0, FLOOR: 1, STAIRS: 2 };

const ENEMY_TYPES = [
  { name: 'Rat',      ch: 'r', color: '#9a7a5a', hp: 4,  atk: 2,  def: 0, xp: 2,  gold: [0, 2]   },
  { name: 'Goblin',   ch: 'g', color: '#7aaa5a', hp: 8,  atk: 3,  def: 1, xp: 5,  gold: [1, 4]   },
  { name: 'Skeleton', ch: 's', color: '#b0b0c0', hp: 12, atk: 4,  def: 2, xp: 8,  gold: [2, 6]   },
  { name: 'Orc',      ch: 'o', color: '#6aaa60', hp: 18, atk: 6,  def: 3, xp: 14, gold: [3, 8]   },
  { name: 'Troll',    ch: 'T', color: '#50a870', hp: 28, atk: 8,  def: 4, xp: 22, gold: [5, 12]  },
  { name: 'Lich',     ch: 'L', color: '#d060f0', hp: 40, atk: 12, def: 5, xp: 50, gold: [10, 25] },
];

const ITEM_TYPES = [
  { name: 'Health Potion', ch: '!', color: '#f05050', type: 'potion', value: 15  },
  { name: 'Max Potion',    ch: '!', color: '#ff9090', type: 'maxpot', value: 999 },
  { name: 'Iron Sword',    ch: '/', color: '#9090d0', type: 'weapon', value: 3   },
  { name: 'Steel Sword',   ch: '/', color: '#c0c8f0', type: 'weapon', value: 5   },
  { name: 'Dragonblade',   ch: '/', color: '#f07030', type: 'weapon', value: 8   },
  { name: 'Leather Armor', ch: ']', color: '#9a7a5a', type: 'armor',  value: 2   },
  { name: 'Chain Mail',    ch: ']', color: '#90a0b8', type: 'armor',  value: 4   },
  { name: 'Plate Armor',   ch: ']', color: '#d0d8e0', type: 'armor',  value: 6   },
  { name: 'Gold Coin',     ch: '$', color: '#f0d080', type: 'gold',   value: 10  },
];

// ─── Canvas ──────────────────────────────────────────────────────────────────
const canvas = document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');
canvas.width  = COLS * TILE;
canvas.height = ROWS * TILE;

// ─── Animation state ─────────────────────────────────────────────────────────
let particles   = [];
let shakeFrames = 0;
let shakeAmt    = 0;
let animTick    = 0;
let floorVariants = {};
let state       = {};

// ─── Init ────────────────────────────────────────────────────────────────────
function initState() {
  state = {
    floor: 1, map: [], rooms: [], entities: [],
    player: { x:0, y:0, hp:20, maxHp:20, atk:4, def:1, xp:0, level:1, gold:0, inventory:[], weapon:null, armor:null },
    visible: new Set(), explored: new Set(),
    turn: 0, over: false, won: false,
  };
  particles = [];
  generateFloor();
  updateHUD();
}

// ─── Map generation ──────────────────────────────────────────────────────────
function generateFloor() {
  state.map = Array.from({ length: ROWS }, () => new Array(COLS).fill(T.WALL));
  state.rooms = []; state.entities = []; state.visible = new Set(); floorVariants = {};
  const rooms = [];
  for (let i = 0; i < 60; i++) {
    const w=randi(5,11), h=randi(4,8), x=randi(1,COLS-w-1), y=randi(1,ROWS-h-1);
    if (!rooms.some(r => rectsOverlap(r, {x,y,w,h}, 1))) { rooms.push({x,y,w,h}); carveRoom(x,y,w,h); }
  }
  for (let i = 1; i < rooms.length; i++) carveCorridor(roomCenter(rooms[i-1]), roomCenter(rooms[i]));
  for (let row = 0; row < ROWS; row++)
    for (let col = 0; col < COLS; col++)
      if (state.map[row][col] !== T.WALL) floorVariants[`${col},${row}`] = Math.random();
  state.rooms = rooms;
  const sc = roomCenter(rooms[rooms.length-1]);
  state.map[sc.y][sc.x] = T.STAIRS;
  const fc = roomCenter(rooms[0]);
  state.player.x = fc.x; state.player.y = fc.y;
  for (let i = 1; i < rooms.length; i++) populateRoom(rooms[i]);
  computeFOV();
}

function carveRoom(x, y, w, h) {
  for (let row = y; row < y+h; row++) for (let col = x; col < x+w; col++) state.map[row][col] = T.FLOOR;
}
function carveCorridor(a, b) {
  let {x, y} = a;
  while (x !== b.x) { state.map[y][x] = T.FLOOR; x += x < b.x ? 1 : -1; }
  while (y !== b.y) { state.map[y][x] = T.FLOOR; y += y < b.y ? 1 : -1; }
}
function populateRoom(room) {
  const fl = state.floor, pool = ENEMY_TYPES.slice(0, Math.min(fl+1, ENEMY_TYPES.length));
  for (let i = 0; i < randi(0, Math.min(3, fl)); i++) {
    const pos = randomFloorInRoom(room); if (!pos) continue;
    const type = pool[randi(0, pool.length-1)];
    state.entities.push({ kind:'enemy', ...JSON.parse(JSON.stringify(type)), x:pos.x, y:pos.y, maxHp:type.hp, hitFlash:0 });
  }
  if (Math.random() < 0.65) {
    const pos = randomFloorInRoom(room); if (!pos) return;
    const ipool = ITEM_TYPES.filter(it => it.type !== 'weapon' || fl >= 2 || it.name === 'Iron Sword');
    const type = ipool[randi(0, ipool.length-1)];
    state.entities.push({ kind:'item', ...type, x:pos.x, y:pos.y });
  }
}
function randomFloorInRoom(room) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const x = randi(room.x, room.x+room.w-1), y = randi(room.y, room.y+room.h-1);
    if (state.map[y][x] === T.FLOOR && !entityAt(x,y) && !(state.player.x===x && state.player.y===y)) return {x, y};
  }
  return null;
}

// ─── FOV ─────────────────────────────────────────────────────────────────────
function computeFOV() {
  state.visible.clear();
  const {x:px, y:py} = state.player;
  for (let angle = 0; angle < 360; angle += 2) {
    const rad = (angle * Math.PI) / 180;
    let rx = px+0.5, ry = py+0.5;
    const dx = Math.cos(rad), dy = Math.sin(rad);
    for (let step = 0; step < SIGHT; step++) {
      const cx = Math.floor(rx), cy = Math.floor(ry);
      if (cx<0||cx>=COLS||cy<0||cy>=ROWS) break;
      const key = `${cx},${cy}`;
      state.visible.add(key); state.explored.add(key);
      if (state.map[cy][cx] === T.WALL) break;
      rx += dx; ry += dy;
    }
  }
}

// ─── Particles ───────────────────────────────────────────────────────────────
function spawnDmgNumber(col, row, text, color) {
  particles.push({ x:col*TILE+TILE/2+randi(-6,6), y:row*TILE, dx:(Math.random()-0.5)*0.4, dy:-1.7, gravity:0, life:1, decay:0.022, text, color, isText:true, size:22 });
}
function spawnHitSparks(col, row, color) {
  for (let i = 0; i < 8; i++) {
    const a = Math.random()*Math.PI*2, s = 1.2+Math.random()*2.8;
    particles.push({ x:col*TILE+TILE/2, y:row*TILE+TILE/2, dx:Math.cos(a)*s, dy:Math.sin(a)*s-0.5, gravity:0.12, life:1, decay:0.05, color, size:2.5+Math.random()*2.5 });
  }
}
function spawnDeathBurst(col, row, color) {
  for (let i = 0; i < 20; i++) {
    const a = (i/20)*Math.PI*2, s = 1.5+Math.random()*4;
    particles.push({ x:col*TILE+TILE/2, y:row*TILE+TILE/2, dx:Math.cos(a)*s, dy:Math.sin(a)*s, gravity:0.1, life:1, decay:0.032, color, size:4+Math.random()*5 });
  }
}
function spawnGoldSparkle(col, row) {
  for (let i = 0; i < 10; i++) {
    const a = Math.random()*Math.PI*2, s = 0.6+Math.random()*2;
    particles.push({ x:col*TILE+TILE/2+(Math.random()-0.5)*8, y:row*TILE+TILE/2+(Math.random()-0.5)*8, dx:Math.cos(a)*s, dy:Math.sin(a)*s-1.2, gravity:0.08, life:1, decay:0.038, color:'#f0d060', size:2+Math.random()*3 });
  }
}
function maybeSpawnAmbient() {
  if (Math.random() > 0.055) return;
  const arr = [...state.visible]; if (!arr.length) return;
  const key = arr[randi(0, arr.length-1)];
  const [c, r] = key.split(',').map(Number);
  if (state.map[r]?.[c] !== T.FLOOR) return;
  particles.push({ x:c*TILE+Math.random()*TILE, y:r*TILE+Math.random()*TILE, dx:(Math.random()-0.5)*0.14, dy:-0.18-Math.random()*0.22, gravity:0, life:1, decay:0.006+Math.random()*0.006, color:'#ffffff', size:0.7+Math.random()*0.7, ambient:true });
}
function updateParticles() {
  for (const p of particles) { p.x+=p.dx; p.y+=p.dy; p.dy+=p.gravity||0; p.life-=p.decay; }
  particles = particles.filter(p => p.life > 0);
}

// ─── Render loop ─────────────────────────────────────────────────────────────
function gameLoop() {
  animTick++;
  maybeSpawnAmbient();
  updateParticles();
  render();
  requestAnimationFrame(gameLoop);
}

function render() {
  ctx.save();
  if (shakeFrames > 0) {
    ctx.translate((Math.random()-0.5)*shakeAmt*(shakeFrames/10)*2, (Math.random()-0.5)*shakeAmt*(shakeFrames/10)*2);
    shakeFrames--;
  }
  ctx.fillStyle = '#03030c'; ctx.fillRect(-30,-30,canvas.width+60,canvas.height+60);

  for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLS; col++) {
    const key = `${col},${row}`;
    if (!state.explored.has(key)) continue;
    drawTile(col, row, state.map[row][col], state.visible.has(key) ? 1 : 0.16);
  }

  for (const e of state.entities) {
    if (e.kind !== 'item' || !state.visible.has(`${e.x},${e.y}`)) continue;
    const pulse = 0.75+Math.sin(animTick*0.07+e.x*0.9+e.y*0.7)*0.25;
    drawGlowChar(e.x, e.y, e.ch, e.color, 10*pulse);
  }
  for (const e of state.entities) {
    if (e.kind !== 'enemy' || !state.visible.has(`${e.x},${e.y}`)) continue;
    const flash = e.hitFlash > 0; const col2 = flash ? '#ffffff' : e.color;
    if (e.hitFlash > 0) e.hitFlash--;
    drawGlowChar(e.x, e.y, e.ch, col2, flash ? 22 : 11);
  }
  const pg = 14+Math.sin(animTick*0.045)*5;
  drawGlowChar(state.player.x, state.player.y, '@', '#f0d080', pg);

  drawLighting();

  for (const p of particles) {
    ctx.save(); ctx.globalAlpha = Math.max(0, p.life) * (p.ambient ? 0.25 : 1);
    if (p.isText) {
      ctx.shadowBlur=12; ctx.shadowColor=p.color; ctx.fillStyle=p.color;
      ctx.font=`${p.size||18}px 'VT323',monospace`; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(p.text, p.x, p.y);
    } else {
      ctx.shadowBlur=p.ambient?4:10; ctx.shadowColor=p.color; ctx.fillStyle=p.color;
      const s=(p.size||3)*p.life; ctx.beginPath(); ctx.arc(p.x,p.y,Math.max(0.4,s/2),0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  ctx.save(); ctx.globalAlpha=0.032; ctx.fillStyle='#000';
  for (let sy=0; sy<canvas.height; sy+=3) ctx.fillRect(0,sy,canvas.width,1);
  ctx.restore();

  ctx.restore();
}

function drawTile(col, row, tile, alpha) {
  const x=col*TILE, y=row*TILE; ctx.globalAlpha=alpha;
  if (tile === T.WALL) {
    ctx.fillStyle='#0e0e22'; ctx.fillRect(x,y,TILE,TILE);
    ctx.fillStyle='#1a1a34'; ctx.fillRect(x,y,TILE,1); ctx.fillRect(x,y,1,TILE);
    ctx.fillStyle='#08081a'; ctx.fillRect(x,y+TILE-1,TILE,1); ctx.fillRect(x+TILE-1,y,1,TILE);
  } else if (tile === T.FLOOR) {
    const v=floorVariants[`${col},${row}`]??0.5, b=Math.floor(v*6);
    ctx.fillStyle=`rgb(${7+b},${7+b},${13+b})`; ctx.fillRect(x,y,TILE,TILE);
    if (v>0.88) { ctx.fillStyle='#121222'; ctx.fillRect(x+4,y+5,3,1); }
    ctx.fillStyle='#131325'; ctx.fillRect(x+TILE/2-1,y+TILE/2-1,2,2);
  } else if (tile === T.STAIRS) {
    ctx.fillStyle='#09091c'; ctx.fillRect(x,y,TILE,TILE); ctx.save();
    ctx.shadowBlur=10+Math.sin(animTick*0.05)*5; ctx.shadowColor='#b080f0'; ctx.fillStyle='#c898f8';
    ctx.font=`${TILE+4}px 'VT323',monospace`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('>',x+TILE/2,y+TILE/2+1); ctx.restore();
  }
  ctx.globalAlpha=1;
}

function drawGlowChar(col, row, ch, color, glowSize) {
  ctx.save(); ctx.shadowBlur=glowSize; ctx.shadowColor=color; ctx.fillStyle=color;
  ctx.font=`${TILE+4}px 'VT323',monospace`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(ch, col*TILE+TILE/2, row*TILE+TILE/2+1); ctx.restore();
}

function drawLighting() {
  const px=state.player.x*TILE+TILE/2, py=state.player.y*TILE+TILE/2;
  const f=Math.sin(animTick*0.071)*12+Math.sin(animTick*0.19)*6;
  const grad = ctx.createRadialGradient(px,py,(SIGHT*TILE*0.52+f)*0.08,px,py,SIGHT*TILE*1.08+f);
  grad.addColorStop(0,'rgba(0,0,0,0)'); grad.addColorStop(0.38,'rgba(0,0,6,0.12)');
  grad.addColorStop(0.65,'rgba(0,0,8,0.60)'); grad.addColorStop(0.85,'rgba(0,0,10,0.88)');
  grad.addColorStop(1,'rgba(0,0,12,0.98)');
  ctx.fillStyle=grad; ctx.fillRect(-30,-30,canvas.width+60,canvas.height+60);
}

// ─── HUD ─────────────────────────────────────────────────────────────────────
function updateHUD() {
  const p=state.player;
  document.getElementById('hud-level').textContent=`LVL ${p.level}`;
  document.getElementById('hud-floor').textContent=`FLOOR ${state.floor}`;
  document.getElementById('hud-gold').textContent=`${p.gold}g`;
  const hpPct=p.hp/p.maxHp;
  const hpColor=hpPct>0.5?'#48cc58':hpPct>0.25?'#d0a028':'#e02828';
  document.getElementById('hp-text').textContent=`${p.hp}/${p.maxHp}`;
  const hf=document.getElementById('hp-fill');
  hf.style.width=`${hpPct*100}%`; hf.style.background=hpColor; hf.style.boxShadow=`0 0 6px ${hpColor}`;
  const xt=p.level*15;
  document.getElementById('xp-text').textContent=`${p.xp}/${xt}`;
  document.getElementById('xp-fill').style.width=`${Math.min(1,p.xp/xt)*100}%`;
  document.getElementById('hud-atk').textContent=totalAtk();
  document.getElementById('hud-def').textContent=totalDef();
  const ws=document.getElementById('equip-weapon'), as=document.getElementById('equip-armor');
  if (p.weapon) { ws.textContent=`[W] ${p.weapon.name}`; ws.classList.remove('empty'); } else { ws.textContent='[ no weapon ]'; ws.classList.add('empty'); }
  if (p.armor)  { as.textContent=`[A] ${p.armor.name}`;  as.classList.remove('empty'); } else { as.textContent='[ no armor ]';  as.classList.add('empty'); }
  renderInventory();
}
function renderInventory() {
  const ul=document.getElementById('inventory-list'); ul.innerHTML='';
  if (!state.player.inventory.length) { const li=document.createElement('li'); li.textContent='empty'; li.style.color='#3a3a55'; ul.appendChild(li); return; }
  for (const item of state.player.inventory) { const li=document.createElement('li'); li.textContent=item.name; ul.appendChild(li); }
}
const logEl=document.getElementById('message-log');
function log(msg, cls='') {
  logEl.querySelectorAll('li.new').forEach(el=>el.classList.remove('new'));
  const li=document.createElement('li'); li.textContent=msg; li.className=cls?`new ${cls}`:'new';
  logEl.prepend(li); while(logEl.children.length>50) logEl.removeChild(logEl.lastChild);
}

// ─── Input ───────────────────────────────────────────────────────────────────
const DIRS = { ArrowUp:{dx:0,dy:-1},ArrowDown:{dx:0,dy:1},ArrowLeft:{dx:-1,dy:0},ArrowRight:{dx:1,dy:0}, w:{dx:0,dy:-1},s:{dx:0,dy:1},a:{dx:-1,dy:0},d:{dx:1,dy:0}, k:{dx:0,dy:-1},j:{dx:0,dy:1},h:{dx:-1,dy:0},l:{dx:1,dy:0} };
document.addEventListener('keydown', e => {
  if (state.over) return;
  if (e.key==='p'||e.key==='P') { usePotionFromInventory(); return; }
  const dir=DIRS[e.key]; if (!dir) return; e.preventDefault(); movePlayer(dir.dx, dir.dy);
});

// ─── Player actions ──────────────────────────────────────────────────────────
function movePlayer(dx, dy) {
  const nx=state.player.x+dx, ny=state.player.y+dy;
  if (nx<0||nx>=COLS||ny<0||ny>=ROWS||state.map[ny][nx]===T.WALL) return;
  const enemy=entityAt(nx,ny,'enemy');
  if (enemy) { attackEnemy(enemy); endTurn(); return; }
  state.player.x=nx; state.player.y=ny;
  const item=entityAt(nx,ny,'item'); if (item) pickupItem(item);
  if (state.map[ny][nx]===T.STAIRS) { descendStairs(); return; }
  endTurn();
}
function attackEnemy(enemy) {
  const dmg=Math.max(1,totalAtk()-enemy.def+randi(-1,1));
  enemy.hp-=dmg; enemy.hitFlash=6;
  spawnHitSparks(enemy.x,enemy.y,enemy.color); spawnDmgNumber(enemy.x,enemy.y,`-${dmg}`,'#ff5050');
  log(`You hit ${enemy.name} for ${dmg}.`,'combat');
  if (enemy.hp<=0) { killEnemy(enemy); return; }
  const eDmg=Math.max(1,enemy.atk-totalDef()+randi(-1,1));
  state.player.hp-=eDmg; shakeFrames=9; shakeAmt=Math.min(eDmg,9);
  spawnDmgNumber(state.player.x,state.player.y,`-${eDmg}`,'#ff2020');
  log(`${enemy.name} hits you for ${eDmg}.`,'combat');
  if (state.player.hp<=0) gameOver(false);
}
function killEnemy(enemy) {
  const gold=randi(enemy.gold[0],enemy.gold[1]);
  state.player.gold+=gold; state.player.xp+=enemy.xp;
  spawnDeathBurst(enemy.x,enemy.y,enemy.color); if (gold) spawnGoldSparkle(enemy.x,enemy.y);
  state.entities=state.entities.filter(e=>e!==enemy);
  log(`${enemy.name} slain! +${enemy.xp}xp${gold?` +${gold}g`:''}`, 'item');
  checkLevelUp();
}
function checkLevelUp() {
  const thresh=state.player.level*15;
  if (state.player.xp>=thresh) {
    state.player.level++; state.player.xp-=thresh; state.player.maxHp+=8;
    state.player.hp=Math.min(state.player.hp+8,state.player.maxHp); state.player.atk++;
    spawnDeathBurst(state.player.x,state.player.y,'#f0d080');
    log(`Level up! Now level ${state.player.level}.`,'system');
  }
}
function pickupItem(item) {
  state.entities=state.entities.filter(e=>e!==item);
  if (item.type==='gold') { state.player.gold+=item.value; spawnGoldSparkle(item.x,item.y); log(`Picked up ${item.value} gold.`,'item'); return; }
  if (item.type==='potion'||item.type==='maxpot') { state.player.inventory.push(item); log(`Picked up ${item.name}. (P to use)`,'item'); return; }
  if (item.type==='weapon') { log(state.player.weapon?`Swapped ${state.player.weapon.name} for ${item.name}.`:`Equipped ${item.name}.`,'item'); state.player.weapon=item; return; }
  if (item.type==='armor')  { log(state.player.armor ?`Swapped ${state.player.armor.name} for ${item.name}.` :`Equipped ${item.name}.`,'item'); state.player.armor=item; }
}
function usePotionFromInventory() {
  const idx=state.player.inventory.findIndex(i=>i.type==='potion'||i.type==='maxpot');
  if (idx===-1) { log('No potions.'); return; }
  const pot=state.player.inventory.splice(idx,1)[0];
  const healed=Math.min(pot.type==='maxpot'?9999:pot.value, state.player.maxHp-state.player.hp);
  state.player.hp+=healed; spawnHitSparks(state.player.x,state.player.y,'#48cc58');
  log(`Used ${pot.name}. Healed ${healed} HP.`,'item'); endTurn();
}
function descendStairs() {
  if (state.floor>=MAX_FLOORS) { gameOver(true); return; }
  state.floor++; log(`You descend to floor ${state.floor}...`,'system');
  generateFloor(); updateHUD();
}
function endTurn() {
  state.turn++; moveEnemies(); computeFOV(); updateHUD();
}
function moveEnemies() {
  if (state.over) return;
  for (const e of state.entities) {
    if (e.kind!=='enemy'||!state.visible.has(`${e.x},${e.y}`)) continue;
    const dx=state.player.x-e.x, dy=state.player.y-e.y;
    if (Math.abs(dx)+Math.abs(dy)===1) {
      const eDmg=Math.max(1,e.atk-totalDef()+randi(-1,1));
      state.player.hp-=eDmg; shakeFrames=7; shakeAmt=Math.min(eDmg,7);
      spawnDmgNumber(state.player.x,state.player.y,`-${eDmg}`,'#ff2020');
      log(`${e.name} hits you for ${eDmg}.`,'combat');
      if (state.player.hp<=0) { gameOver(false); return; }
    } else {
      const sx=dx?Math.sign(dx):0, sy=dy?Math.sign(dy):0;
      const moves=Math.abs(dx)>=Math.abs(dy)?[[sx,0],[0,sy],[sx,sy]]:[[0,sy],[sx,0],[sx,sy]];
      for (const [ex,ey] of moves) {
        const nx=e.x+ex, ny=e.y+ey;
        if (nx<0||nx>=COLS||ny<0||ny>=ROWS||state.map[ny][nx]===T.WALL||entityAt(nx,ny,'enemy')||state.player.x===nx&&state.player.y===ny) continue;
        e.x=nx; e.y=ny; break;
      }
    }
  }
}
function gameOver(won) {
  state.over=true; state.won=won;
  const overlay=document.getElementById('overlay'), title=document.getElementById('overlay-title');
  const stats=document.getElementById('overlay-stats'), msg=document.getElementById('overlay-msg');
  overlay.classList.remove('hidden');
  if (won) { title.textContent='ESCAPED'; title.style.color='#e8c87a'; stats.textContent=`Floor ${state.floor} • Level ${state.player.level} • ${state.player.gold}g`; msg.textContent='You clawed your way out of the vault.'; }
  else     { title.textContent='YOU DIED'; title.style.color='#e02828'; stats.textContent=`Floor ${state.floor} • Level ${state.player.level} • ${state.player.gold}g`; msg.textContent='The vault claims another soul.'; }
}
document.getElementById('overlay-btn').addEventListener('click', () => { document.getElementById('overlay').classList.add('hidden'); initState(); });

// ─── Helpers ─────────────────────────────────────────────────────────────────
function randi(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }
function roomCenter(r)   { return {x:Math.floor(r.x+r.w/2), y:Math.floor(r.y+r.h/2)}; }
function rectsOverlap(a, b, pad=0) { return a.x-pad<b.x+b.w&&a.x+a.w+pad>b.x&&a.y-pad<b.y+b.h&&a.y+a.h+pad>b.y; }
function entityAt(x, y, kind=null) { return state.entities.find(e=>e.x===x&&e.y===y&&(!kind||e.kind===kind))??null; }
function totalAtk() { return state.player.atk+(state.player.weapon?.value??0); }
function totalDef() { return state.player.def+(state.player.armor?.value??0); }

// ─── Boot ─────────────────────────────────────────────────────────────────────
log('You wake in the vault. Find the stairs (>) on each floor.', 'system');
log('Move: WASD / arrows / hjkl  |  Potion: P', 'system');
initState();
requestAnimationFrame(gameLoop);
