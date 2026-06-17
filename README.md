# Vaultborn

A browser-based roguelike dungeon crawler. Descend 5 floors, fight your way through increasingly dangerous enemies, and defeat the **Vault Warden** to claim the vault's treasure.

**[Play in browser](https://jshankar0811.github.io/vaultborn)** <!-- enable GitHub Pages to activate this link -->

---

## Gameplay

You are `@`. Navigate a procedurally generated dungeon, collect loot, level up, and survive.

- **5 floors** — each with a unique visual theme and harder enemies
- **Floor 5** — no stairs. The Vault Warden awaits.
- Reach the stairs (`>`) to open the **merchant shop**, then descend

### Controls

| Key | Action |
|-----|--------|
| `W A S D` / Arrow keys / `H J K L` | Move / attack |
| `P` | Use health potion |
| `U` | Use scroll |
| Click | Move to tile / attack adjacent enemy |
| Hover | Inspect enemy or item stats |

---

## Features

- **Procedural dungeons** — BSP-style room placement with corridor carving, unique layout every run
- **Raycasting FOV** — torch-lit fog of war, explored tiles stay on the map
- **5 floor themes** — Stone Vault, Ancient Crypt, Dark Cavern, Infernal Depths, The Abyss
- **7 enemy types** — Rat, Goblin, Skeleton, Orc, Troll, Vampire, Lich — scaling by floor
- **Boss fight** — Vault Warden has a 2-phase enrage: drops to 50% HP and calls skeleton minions
- **Status effects** — poison, burn, and weaken applied by certain enemies and traps
- **Hidden traps** — spike (damage + screen shake) and gas (poison)
- **Scrolls** — Fireball (AoE blast), Blink (teleport), Reveal (full map)
- **Merchant shop** — 4 random items between floors; buy weapons, armor, potions, scrolls
- **Equipment system** — wield weapons and armor; swapping drops the old item on the floor
- **Minimap** — fog-of-war-aware overview canvas in the sidebar
- **HP bars** — per-enemy health bars rendered above each character
- **Inspect tooltip** — hover any visible entity to see stats
- **Click-to-move** — BFS pathfinding across the dungeon on click
- **Particle system** — damage numbers, sparks, death bursts, gold sparkles, ambient dust
- **Torch lighting** — radial gradient vignette with per-theme tint color and flicker
- **Blood splatter** — persistent stains at enemy death locations
- **Synthesized audio** — all SFX generated via Web Audio API (no audio files)
- **High score leaderboard** — top 8 runs saved in LocalStorage
- **Fade transitions** — black crossfade between floors

---

## Running Locally

No build step, no dependencies.

```bash
git clone https://github.com/jshankar0811/vaultborn.git
cd vaultborn
# open index.html in any modern browser
```

Or serve it locally to avoid any browser file:// restrictions:

```bash
npx serve .
# then open http://localhost:3000
```

---

## Project Structure

```
vaultborn/
├── index.html   # Layout, overlays (shop, game over, tooltip, minimap)
├── style.css    # Dark theme, panels, animations, overlay styles
└── game.js      # All game logic — ~700 lines, zero dependencies
```

---

## Tech

- **HTML5 Canvas** — tile rendering, particles, lighting
- **Vanilla JS** — no frameworks, no bundler
- **Web Audio API** — oscillators and noise buffers for all sound effects
- **LocalStorage** — persistent high score leaderboard

---

## Development History

| Commit | Description |
|--------|-------------|
| Initial build | Basic dungeon, FOV, turn-based combat, items |
| Visual overhaul | Particle system, torch lighting, VT323 font, rAF render loop |
| Full feature set | Boss, shop, audio, minimap, scrolls, traps, themes, high scores |

---

*Built with [Claude Code](https://claude.ai/code)*
