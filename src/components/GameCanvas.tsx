import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import seedrandom from 'seedrandom';
import { generateDungeon, Room } from '../lib/dungeonGenerator';
import { Settings, Keyboard, ArrowRight, Shield, Swords, Zap, Heart, Coins, Trophy, X, Save, Trash2 } from 'lucide-react';
import { WEAPONS } from '../game/weapons';
import { RELICS } from '../game/relics';
import { ENEMY_NAMES, ENEMY_PIXEL_ARTS } from '../game/enemies';
import { POTIONS, GEMS } from '../game/items';
import { GRID_SIZE, WIDTH, HEIGHT } from '../game/constants';
import { globalAudio as audio } from '../game/audio';
import { GameSettings, HeroClass } from './StartScreen';
import ShopUI from './ShopUI';
import UIPanel from './UIPanel';
import BestiaryUI from './BestiaryUI';
import { TrophiesUI } from './TrophiesUI';
import { TROPHIES } from '../game/trophies';
import SkillTreeUI from './SkillTreeUI';
import LevelUpSlotMachineUI from './LevelUpSlotMachineUI';


function getEnemyDefense(type: Enemy['type']): { physicalDefense: number, magicalDefense: number } {
    switch (type) {
        case 'specter': return { physicalDefense: 80, magicalDefense: 0 };
        case 'mage': return { physicalDefense: 0, magicalDefense: 40 };
        case 'warrior': return { physicalDefense: 10, magicalDefense: 0 };
        case 'skeleton': return { physicalDefense: 5, magicalDefense: 0 };
        case 'archer': return { physicalDefense: 5, magicalDefense: 0 };
        case 'miniboss': return { physicalDefense: 15, magicalDefense: 15 };
        case 'boss':
        case 'slimmy':
        case 'serpent':
        case 'shadow_reaper': 
        case 'void_architect':
            return { physicalDefense: 30, magicalDefense: 30 };
        case 'vampire': return { physicalDefense: 10, magicalDefense: 20 };
        case 'shield_bearer': return { physicalDefense: 50, magicalDefense: 10 };
        case 'necromancer': return { physicalDefense: 5, magicalDefense: 30 };
        case 'charger': return { physicalDefense: 15, magicalDefense: 5 };
        case 'bomber': return { physicalDefense: 0, magicalDefense: 0 };
        case 'teleporter': return { physicalDefense: 0, magicalDefense: 40 };
        default: return { physicalDefense: 0, magicalDefense: 0 };
    }
}

function getBossName(type: string, lang: 'it' | 'en' = 'it'): string {
    const names: Record<string, { it: string, en: string }> = {
        boss: {
            it: 'GOLEM DI NEON 🤖',
            en: 'NEON GOLEM 🤖'
        },
        slimmy: {
            it: 'RE SLIME 👑',
            en: 'KING SLIME 👑'
        },
        serpent: {
            it: 'ANTICO SERPENTE 🐉',
            en: 'ELDER SERPENT 🐉'
        },
        shadow_reaper: {
            it: 'MIETITORE D\'OMBRE 💀',
            en: 'SHADOW REAPER 💀'
        },
        void_architect: {
            it: 'ARCHITETTO DEL VUOTO 🌀',
            en: 'VOID ARCHITECT 🌀'
        }
    };
    return names[type]?.[lang] || (lang === 'it' ? 'BOSS SUPREMO' : 'SUPREME BOSS');
}

interface Enemy {
    id: number;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    speed: number;
    size: number;
    type: 'warrior' | 'archer' | 'mage' | 'skeleton' | 'miniboss' | 'boss' | 'nest' | 'specter' | 'slimmy' | 'serpent' | 'vampire' | 'shadow_reaper' | 'charger' | 'teleporter' | 'shield_bearer' | 'bomber' | 'necromancer' | 'void_architect';
    baseType?: 'warrior' | 'archer' | 'mage' | 'skeleton' | 'vampire' | 'specter' | 'charger' | 'teleporter' | 'shield_bearer' | 'bomber' | 'necromancer';
    level: number;
    physicalDefense: number;
    magicalDefense: number;
    segments?: {x: number, y: number}[];
    state?: 'patrol' | 'chase' | 'attack' | 'unstucking' | 'evade' | 'flee';
    unstuckDir?: number;
    targetX?: number;
    targetY?: number;
    attackCd?: number;
    stunTimer?: number;
    isAmbushEnemy?: boolean;
    isBubbleTrapped?: boolean;
    freezeTimer?: number;
    slashCd?: number;
    slashAngle?: number;
    spawnTimer?: number;
    lastX?: number;
    lastY?: number;
    stuckTimer?: number;
    evadeTimer?: number;
    evadeDirX?: number;
    evadeDirY?: number;
    dir?: 'up' | 'down' | 'left' | 'right';
    jumpTimer?: number;
    roomId?: number;
    jumpTargetX?: number;
    jumpTargetY?: number;
    z?: number; // Vertical height for jump
    bossPatternType?: 'single' | 'omni';
    poisonTimer?: number;
    poisonDamagePerSec?: number;
    slowTimer?: number;
    slowRatio?: number;
    corrodedArmorRatio?: number;
    originalSpeed?: number;
    losCheckTimer?: number;
    lastLos?: boolean;
    serpentDashTimer?: number;
    fuseTimer?: number;
    isIgnited?: boolean;
    isDeadFuse?: boolean;
    isDeadFuseTriggered?: boolean;
    harpoonedDuration?: number;
    isRocketTrapped?: boolean;
    rocketTimer?: number;
}

interface LootItem {
    x: number;
    y: number;
    z: number;
    vz: number;
    vx: number;
    vy: number;
    type: 'gold' | 'potion_hp' | 'potion_mp' | 'potion_xp' | 'potion_speed' | 'potion_str' | 'potion_crit' | 'gem' | 'weapon' | 'crystal' | 'diamond' | 'cosmetic' | 'pet' | 'relic';
    value: number | string;
    color: string;
    rarityColor?: string;
    rarity?: string;
    isMagic?: boolean;
    isIdentified?: boolean;
    name?: string;
    spawnTime?: number;
    special_behavior?: string;
}

interface Projectile {
    x: number;
    y: number;
    vx: number;
    vy: number;
    isEnemy?: boolean;
    shooterId?: number;
    shooterType?: Enemy['type'];
    shooterLevel?: number;
    curve?: number;
    homing?: boolean;
    homingRange?: number;
    aoeRadius?: number;
    magnetic?: boolean;
    isBoomerang?: boolean;
    phase?: 'OUT' | 'RETURN';
    timer?: number;
    spawnX?: number; // For boomerang return
    spawnY?: number;
    color?: string;
    bounces?: number;
    hitIds?: number[]; // To prevent multi-hits in one pass
    isHighLevel?: boolean;
    mStacks?: number;
    special_behavior?: string;
    isPhysical?: boolean;
    damageMult?: number;
    pierce?: boolean;
    isCritical?: boolean;
    isBubble?: boolean;
    isLaser?: boolean;
    isIceCrystal?: boolean;
    size?: number;
    isLegendaryStar?: boolean;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
    targetX?: number;
    targetY?: number;
    type?: 'normal' | 'shockwave' | 'vampire_heal' | 'star';
    rotation?: number;
    vr?: number;
    text?: string;
    fontSize?: number;
    noGravity?: boolean;
    active?: boolean;
}

interface Corpse {
    x: number;
    y: number;
    type: Enemy['type'];
    timer: number;
    maxTimer: number;
    alpha: number;
    id: number;
    suckStarted: boolean;
}

interface BackgroundElement {
    x: number;
    y: number;
    size: number;
    color: string;
    parallax: number;
    opacity: number;
    type: 'star' | 'nebula' | 'dust' | 'floor_detail' | 'foreground_dust';
}

interface Pet {
    id: number;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    level: number;
    size: number;
    speed: number;
    attackCd: number;
    targetId?: number;
    state: 'follow' | 'chase';
}

const StatRow = ({ label, val, color }: { label: string, val: number | string, color: string }) => (
    <div className="flex justify-between items-end border-b border-slate-800/50 pb-2 group">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-slate-300 transition-colors italic">{label}</span>
        <span className={`text-2xl font-black italic underline decoration-slate-800 ${color}`}>{val}</span>
    </div>
);

function getNextExp(lvl: number): number {
    const baseMobXp = 30;
    let mobsNeeded = 3;
    switch (lvl) {
        case 1: mobsNeeded = 3; break;
        case 2: mobsNeeded = 4; break;
        case 3: mobsNeeded = 6; break;
        case 4: mobsNeeded = 10; break;
        case 5: mobsNeeded = 15; break;
        default:
            // Progressive growth for higher levels up to 10
            let current = 15;
            for (let i = 5; i < Math.min(lvl, 10); i++) {
                current = Math.floor(current * 1.5);
            }
            if (lvl > 10) {
                 // Prevent impossible scaling: linear additions after 10
                 current += (lvl - 10) * 20; 
            }
            mobsNeeded = current;
    }
    return mobsNeeded * baseMobXp;
}

function getExpFromMob(mobLevel: number, playerLevel: number, extraXpPct: number = 0, difficulty: number = 3): number {
    const baseExp = 40;
    const diff = mobLevel - playerLevel;
    let xp = baseExp;
    if (diff > 0) {
        xp = Math.floor(baseExp * Math.pow(1.5, diff * 0.5));
    } else {
        xp = Math.floor(baseExp / Math.max(1, (playerLevel - mobLevel) * 0.2 + 1));
    }
    const expMult = 1.4 - (difficulty - 1) * 0.1;
    return Math.floor(xp * (1 + extraXpPct / 100) * expMult);
}

export default function GameCanvas({ settings, heroClass, onExit, onLoadSlot }: { settings: GameSettings, heroClass: HeroClass, onExit?: () => void, onLoadSlot?: (saveData: any) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settingsRef = useRef(settings);
  
  const stats = useRef({ 
    hp: 100, maxHp: 100, mp: 50, maxMp: 50, exp: 0, nextExp: getNextExp(1), lvl: 1, 
    gold: 0, score: 0, kills: 0, initialEnemies: 0, 
    physicalWeapon: 'Spada Base', physicalWeaponRarity: 'common', physicalStacks: 1, 
    magicWeapon: 'Bacchetta Base', magicWeaponRarity: 'common', magicStacks: 1, 
    strength: 6, magicPower: 6, mpRegenBoost: 0, extraGoldPct: 0, extraXpGainPct: 0, 
    dungeonLevel: settings.startLevel || 1, critChance: 0.05, 
    skillPoints: 0, 
    hpLevel: 0, mpLevel: 0, strLevel: 0, magicLevel: 0, mpRegenLevel: 0, speedLevel: 0,
    // Skill Tree Stats
    defense: 0,
    hpRegen: 0,
    critDamage: 1.5,
    cooldownReduction: 0,
    attackSpeed: 1,
    physDmgMult: 1,
    magicDmgMult: 1,
    manaCostRed: 0,
    skillLevels: {} as Record<string, number>,
    pendingShopWeapons: [] as any[],
    relics: [] as any[],
    bestiaryKills: {} as Record<string, number>,
    // Trophy Stats
    ratsKilled: 0,
    itemsCollected: 0,
    noHitStreak: 0,
    secretRoomsFound: 0,
    electricBossKills: 0,
    roomsCleared: 0,
    rareDropsCollected: 0,
    jukeboxesUsed: 0,
    weaponsCollected: 0,
    weaponsUpgraded: 0,
    unlockedTrophies: [] as string[]
  });
  const activeSeed = useRef(settings.seed || Math.random().toString(36).substring(7));
  // Keep the seed synchronized inside settingsRef for robust continue and saves
  settingsRef.current.seed = activeSeed.current;

  const startTime = useRef(Date.now());
  const hasLoaded = useRef(false);
  const [autosaveEnabled, setAutosaveEnabled] = useState(() => localStorage.getItem('autosave_enabled') !== 'false');

  useEffect(() => {
      const saved = localStorage.getItem('player_stats');
      if (saved) {
           stats.current = JSON.parse(saved);
           const savedTrophies = localStorage.getItem('unlocked_trophies');
           if (savedTrophies) {
             stats.current.unlockedTrophies = JSON.parse(savedTrophies);
           }
          hasLoaded.current = true;
      }
      localStorage.setItem('game_interrupted', 'true');
  }, []);
  
  const saveGameState = useCallback(() => {
      if (!isGameOver.current && autosaveEnabled) {
          try {
              localStorage.setItem('player_stats', JSON.stringify(stats.current));
              localStorage.setItem('unlocked_trophies', JSON.stringify(stats.current.unlockedTrophies));
              
              // Keep settings seed up to date and save it
              settingsRef.current.seed = activeSeed.current;
              localStorage.setItem('neonDungeonSettings', JSON.stringify(settingsRef.current));
              
              localStorage.setItem('game_interrupted', 'true');
          } catch (e) {
              console.error('Failed to autosave game state:', e);
          }
      }
  }, [autosaveEnabled]);
  
  useEffect(() => {
      const interval = setInterval(() => {
          saveGameState();
      }, 240000);
      return () => clearInterval(interval);
  }, [saveGameState]);
  
  useEffect(() => {
    if (hasLoaded.current) return;
    if (heroClass === 'mage') {
      stats.current = { ...stats.current, hp: 80, maxHp: 80, strength: 4, critChance: 0.05, magicWeapon: 'Bacchetta Bastarda', defense: 0, hpRegen: 2, critDamage: 1.8, cooldownReduction: 0.1 };
    } else if (heroClass === 'paladin') {
      stats.current = { ...stats.current, hp: 120, maxHp: 120, strength: 6, critChance: 0.07, physicalWeapon: 'Martello Santificatore', defense: 10, hpRegen: 5, critDamage: 1.5, cooldownReduction: 0 };
    } else {
      stats.current = { ...stats.current, hp: 150, maxHp: 150, strength: 8, critChance: 0.1, physicalWeapon: 'Spada del Destino', defense: 5, hpRegen: 3, critDamage: 1.6, cooldownReduction: 0.05 };
    }
  }, [heroClass]);
  const initialDungeon = useMemo(() => generateDungeon(WIDTH, HEIGHT, stats.current.dungeonLevel, activeSeed.current), []);
  
  const backgroundElements = useMemo(() => {
    const rng = seedrandom(activeSeed.current + "_bg");
    const elements: BackgroundElement[] = [];
    
    // Far layers (tiny stars, very slow)
    for (let i = 0; i < 200; i++) {
        elements.push({
            x: rng() * WIDTH * GRID_SIZE * 1.5 - (WIDTH * GRID_SIZE * 0.25),
            y: rng() * HEIGHT * GRID_SIZE * 1.5 - (HEIGHT * GRID_SIZE * 0.25),
            size: 0.5 + rng() * 1.5,
            color: rng() < 0.8 ? '#ffffff' : (rng() < 0.5 ? '#a5f3fc' : '#fecdd3'),
            parallax: 0.1 + rng() * 0.05,
            opacity: 0.2 + rng() * 0.5,
            type: 'star'
        });
    }

    // Mid layers (dust, larger stars)
    for (let i = 0; i < 60; i++) {
        elements.push({
            x: rng() * WIDTH * GRID_SIZE * 1.2,
            y: rng() * HEIGHT * GRID_SIZE * 1.2,
            size: 1.5 + rng() * 2,
            color: rng() < 0.6 ? '#6366f1' : '#ec4899',
            parallax: 0.3 + rng() * 0.15,
            opacity: 0.1 + rng() * 0.2,
            type: 'dust'
        });
    }

    // Nebula clusters (large faint clouds)
    for (let i = 0; i < 15; i++) {
        elements.push({
            x: rng() * WIDTH * GRID_SIZE,
            y: rng() * HEIGHT * GRID_SIZE,
            size: 200 + rng() * 400,
            color: rng() < 0.5 ? '#1e1b4b' : '#312e81',
            parallax: 0.2 + rng() * 0.1,
            opacity: 0.05 + rng() * 0.1,
            type: 'nebula'
        });
    }

    // Floor Parallax Details (Deep cracks or patterns below the tiles)
    for (let i = 0; i < 120; i++) {
        elements.push({
            x: rng() * WIDTH * GRID_SIZE,
            y: rng() * HEIGHT * GRID_SIZE,
            size: 10 + rng() * 60,
            color: rng() < 0.5 ? '#1e293b' : '#0f172a',
            parallax: 0.85, // Moves slightly slower than main grid (1.0)
            opacity: 0.15 + rng() * 0.1,
            type: 'floor_detail'
        });
    }

    // Foreground Dust (Very close, moves fast)
    for (let i = 0; i < 30; i++) {
        elements.push({
            x: rng() * (WIDTH * GRID_SIZE + 1000),
            y: rng() * (HEIGHT * GRID_SIZE + 1000),
            size: 100 + rng() * 300,
            color: rng() < 0.5 ? '#94a3b8' : '#64748b',
            parallax: 1.4, // Moves faster than player
            opacity: 0.02 + rng() * 0.05,
            type: 'foreground_dust'
        });
    }

    return elements;
  }, [activeSeed.current]);

  const currentDungeon = useRef(initialDungeon);
  const dungeon = useRef(initialDungeon.grid);
  const rooms = useRef<Room[]>(initialDungeon.rooms);
  const revealedRooms = useRef<Set<number>>(new Set());
  const clearedRoomIndices = useRef<Set<number>>(new Set());
  const triggeredAmbushes = useRef<Set<number>>(new Set());
  const merchants = useRef<{x: number, y: number, roomId: number}[]>([]);
  const exploredTiles = useRef<Set<string>>(new Set());
  const revealOpacities = useRef<Record<number, number>>({});
  const activeAmbush = useRef<{ x: number, y: number, w: number, h: number, roomId: number } | null>(null);
  const secretTileToRoom = useRef<Record<string, number>>({});
  const revealedSecretDoors = useRef<Record<string, number>>({});
  const secretGlimmers = useRef<Record<string, number>>({});

  // Initialize secret room mapping for the first level and any subsequent level
  useEffect(() => {
    const d = initialDungeon; 
    if (d) {
        const secretMap: Record<string, number> = {};
        d.rooms.forEach((r, idx) => {
            if (r.isSecret) {
                for (let iy = r.y; iy < r.y + r.h; iy++) {
                    for (let ix = r.x; ix < r.x + r.w; ix++) {
                        secretMap[`${iy}_${ix}`] = idx;
                    }
                }
            }
        });
        secretTileToRoom.current = secretMap;
    }
  }, [initialDungeon]);
  
  // Calculate center of first room for spawn, adding GRID_SIZE/2 to center inside the tile
  const startX = initialDungeon.rooms[0].cx * GRID_SIZE + GRID_SIZE / 2;
  const startY = initialDungeon.rooms[0].cy * GRID_SIZE + GRID_SIZE / 2;
  const player = useRef({ x: startX, y: startY, facing: 'down', aimAngle: Math.PI / 2, magicCd: 0, attackCd: 0, lastAttackTime: 0, lastPickupTime: 0, flashTimer: 0, chargeTimer: 0, isDraining: false, currentAttackHitIds: new Set<number>(), harpoonedEnemyId: null as null | number, burstCount: 0, burstTimer: 0, vx: 0, vy: 0, dashTimer: 0, dashCd: 0, dashDirX: 0, dashDirY: 0, comboCount: 0, lastHitTime: 0 });
  const killerRef = useRef<{ type: Enemy['type'], level: number, damage?: number } | null>(null);
  const lastHitMobRef = useRef<{ type: Enemy['type'], level: number, id?: number, maxHp?: number, hitTime?: number, deathTime?: number | null } | null>(null);
  const lastPhysPressed = useRef(false);
  const nearbyWeaponRef = useRef<string | null>(null);

        const checkCollision = (x: number, y: number, overrideSize?: number) => {
            const h = dungeon.current.length;
            const w = dungeon.current[0].length;
            const hitSize = overrideSize ?? 28;
            const half = hitSize / 2;
            const points = [
                {x: x - half, y: y - half},
                {x: x + half, y: y - half},
                {x: x - half, y: y + half},
                {x: x + half, y: y + half}
            ];
            for (let p of points) {
                const gx = Math.floor(p.x / GRID_SIZE);
                const gy = Math.floor(p.y / GRID_SIZE);
                if (gy < 0 || gy >= h || gx < 0 || gx >= w) return true;
                if (dungeon.current[gy]) {
                    const tile = dungeon.current[gy][gx];
                    if (tile === 0 || tile === 2) return true;
                    if (tile === 4) {
                        const rIdx = secretTileToRoom.current[`${gy}_${gx}`];
                        if (rIdx !== undefined && !revealedRooms.current.has(rIdx)) {
                            return true;
                        }
                    }
                }
            }
            return false;
        };

        const pointInWall = (x: number, y: number) => {
            const gx = Math.floor(x / GRID_SIZE);
            const gy = Math.floor(y / GRID_SIZE);
            const h = dungeon.current.length;
            const w = dungeon.current[0].length;
            if (gy < 0 || gy >= h || gx < 0 || gx >= w) return true;
            const tile = dungeon.current[gy][gx];
            if (tile === 0 || tile === 2) return true;
            if (tile === 4) {
                const rIdx = secretTileToRoom.current[`${gy}_${gx}`];
                if (rIdx !== undefined && !revealedRooms.current.has(rIdx)) {
                    return true;
                }
            }
            return false;
        };

        const hasLineOfSight = (x1: number, y1: number, x2: number, y2: number) => {
            const dist = Math.hypot(x2 - x1, y2 - y1);
            const steps = Math.max(1, Math.ceil(dist / 16));
            const stepX = (x2 - x1) / steps;
            const stepY = (y2 - y1) / steps;
            let cx = x1;
            let cy = y1;
            for (let i = 0; i <= steps; i++) {
                if (pointInWall(cx, cy)) return false;
                cx += stepX;
                cy += stepY;
            }
            return true;
        };
  
  const createEnemies = (dungeonData: any, currentLvl: number) => {
      const difficulty = settingsRef.current.difficulty || 3;
      const hpMult = 0.5 + (difficulty - 1) * 0.25;
      const speedMult = 0.8 + (difficulty - 1) * 0.1;
      const countMult = 0.5 + (difficulty - 1) * 0.25;

      const ensRng = seedrandom(dungeonData.seed + '_enemies');
      let totalNormalEnemies = 0;
      const ens = dungeonData.rooms.slice(1).flatMap((room, roomIdx) => {
          if (room.isSecret) return [];
          const roomEnemies: Enemy[] = [];
          const isBossRoom = (roomIdx + 1) === dungeonData.bossRoomIdx;
          const baseCount = (Math.floor(ensRng() * (3 + Math.floor(currentLvl / 2))) + 2 + Math.floor(currentLvl / 3)) * 2;
          const count = isBossRoom ? 1 : Math.min(20, Math.floor(baseCount * countMult));

          for (let k = 0; k < count; k++) {
              if (!isBossRoom && totalNormalEnemies >= 90) {
                  break;
              }
              if (!isBossRoom) {
                  totalNormalEnemies++;
              }
              const startX = (room.x + 1 + ensRng() * (room.w - 2)) * GRID_SIZE + GRID_SIZE / 2;
              const startY = (room.y + 1 + ensRng() * (room.h - 2)) * GRID_SIZE + GRID_SIZE / 2;
              const types: Enemy['type'][] = ['warrior', 'archer', 'mage', 'specter', 'vampire', 'charger', 'teleporter', 'shield_bearer', 'bomber', 'necromancer'];
              let type = types[Math.floor(ensRng() * types.length)];
              // Enemy level scaling: slows down after 100 but stays ahead
              let levelScale = currentLvl;
              if (difficulty >= 7) levelScale *= 1.5; // Inferno jumps in level
              const baseLevel = levelScale > 100 ? 100 + (levelScale - 100) * 1.5 : levelScale;
              const mobLevel = isBossRoom ? baseLevel + 2 : Math.max(1, baseLevel + Math.floor(ensRng() * 10) - 4);
              let hp = Math.floor((100 + mobLevel * 25) * hpMult);
              let speed = (1 + (ensRng() * 0.5) * (1 + Math.min(2, levelScale * 0.05))) * speedMult;
              let size = 15;
              
              if (type === 'archer') { speed = 1.8 * speedMult; hp = Math.floor((80 + mobLevel * 12) * hpMult); }
              else if (type === 'mage') { speed = 0.7 * speedMult; hp = Math.floor((120 + mobLevel * 12) * hpMult); }
              else if (type === 'specter') { speed = (0.4 + Math.min(1.5, levelScale * 0.025)) * speedMult; hp = Math.floor((90 + mobLevel * 18) * hpMult); }
              else if (type === 'vampire') { speed = 1.4 * speedMult; hp = Math.floor((110 + mobLevel * 18) * hpMult); }
              else if (type === 'charger') { speed = 0.8 * speedMult; hp = Math.floor((140 + mobLevel * 30) * hpMult); size = 18; }
              else if (type === 'teleporter') { speed = 1.0 * speedMult; hp = Math.floor((70 + mobLevel * 10) * hpMult); }
              else if (type === 'shield_bearer') { speed = 0.6 * speedMult; hp = Math.floor((180 + mobLevel * 40) * hpMult); size = 20; }
              else if (type === 'bomber') { speed = 1.6 * speedMult; hp = Math.floor((50 + mobLevel * 8) * hpMult); size = 12; }
              else if (type === 'necromancer') { speed = 0.8 * speedMult; hp = Math.floor((130 + mobLevel * 20) * hpMult); size = 18; }

              if (isBossRoom) {
                  const bossTypes: Enemy['type'][] = ['boss', 'slimmy', 'serpent', 'shadow_reaper', 'void_architect'];
                  type = bossTypes[Math.floor(ensRng() * bossTypes.length)];
                  
                  // Legendary Level 100+ Boss
                  const isSuperBoss = levelScale >= 100;
                  const superMult = isSuperBoss ? (1 + (levelScale - 100) * 0.1) : 1;
                  
                  hp = Math.floor((1200 + (levelScale * 800)) * (isSuperBoss ? 2.5 : 1) * hpMult); 
                  size = isSuperBoss ? 60 : 45; 
                  speed = (type === 'slimmy' ? 0.2 : (type === 'void_architect' ? 0.8 : 0.6)) * (isSuperBoss ? 1.2 : 1) * speedMult;
                  if (type === 'serpent') {
                      speed = 1.6 * (isSuperBoss ? 1.2 : 1) * speedMult;
                      size = isSuperBoss ? 50 : 35;
                  }
              }
              else {
                  const distTiles = Math.hypot(room.cx - dungeonData.rooms[0].cx, room.cy - dungeonData.rooms[0].cy);
                  const nestChance = 0.2 + Math.min(0.4, levelScale * 0.02);
                  if (ensRng() < nestChance && distTiles >= 10) { 
                      type = 'nest'; hp = Math.floor((200 + mobLevel * 20) * hpMult); size = 25; speed = 0; 

                      // Chance for miniboss near nest, increasing with dungeon level
                      const minibossChance = (0.05 + Math.min(0.5, levelScale * 0.03)) * (difficulty >= 5 ? 1.5 : 1);
                      if (ensRng() < minibossChance) {
                          const mbX = startX + (ensRng() - 0.5) * 80;
                          const mbY = startY + (ensRng() - 0.5) * 80;
                          const mbLevel = mobLevel + 2;
                          const mbHp = Math.floor((400 + mbLevel * 60) * hpMult);
                          const baseTypes: Enemy['baseType'][] = ['warrior', 'archer', 'mage', 'skeleton', 'vampire'];
                          const base = baseTypes[Math.floor(Math.random() * baseTypes.length)];
                          roomEnemies.push({
                              id: Math.random(),
                              x: mbX, y: mbY,
                              hp: mbHp, maxHp: mbHp, size: 28, type: 'miniboss', speed: 0.7 * speedMult,
                              baseType: base,
                              level: mbLevel,
                              roomId: roomIdx + 1,
                              state: 'patrol', targetX: mbX, targetY: mbY,
                              attackCd: 0,
                              dir: 'down', lastX: mbX, lastY: mbY, stuckTimer: 0,
                              ...getEnemyDefense('miniboss')
                          });

                          // 2 Protective followers
                          for (let i = 0; i < 2; i++) {
                              const fX = mbX + (Math.random() - 0.5) * 60;
                              const fY = mbY + (Math.random() - 0.5) * 60;
                              const fType = Math.random() < 0.5 ? 'warrior' : 'skeleton';
                              const fLevel = mbLevel - 1;
                              const fHp = Math.floor((150 + fLevel * 20) * hpMult);
                              roomEnemies.push({
                                  id: Math.random(),
                                  x: fX, y: fY,
                                  hp: fHp, maxHp: fHp, size: 18, type: fType, speed: 1.2 * speedMult,
                                  level: fLevel,
                                  roomId: roomIdx + 1,
                                  state: 'patrol', targetX: fX, targetY: fY,
                                  attackCd: 0,
                                  dir: 'down', lastX: fX, lastY: fY, stuckTimer: 0,
                                  ...getEnemyDefense(fType)
                              });
                          }
                      }
                  }
              }
              // Removed duplicate startX/startY declaration here
              roomEnemies.push({
                  id: Math.random(),
                  x: startX,
                  y: startY,
                  hp, maxHp: hp, size, type, speed,
                  level: mobLevel,
                  roomId: roomIdx + 1,
                  segments: type === 'serpent' ? Array(12).fill({x: startX, y: startY}) : undefined,
                  state: 'patrol', targetX: startX, targetY: startY,
                  attackCd: 0, spawnTimer: type === 'nest' ? 5 * 60 : 0,
                  dir: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)] as any,
                  lastX: startX, lastY: startY, stuckTimer: 0,
                  ...getEnemyDefense(type)
              });
          }
          return roomEnemies;
      });

      // Pre-settle enemies to prevent overlaps at start
      for (let step = 0; step < 15; step++) {
          ens.forEach((e1, i) => {
              ens.forEach((e2, j) => {
                  if (i >= j) return;
                  const dx = e1.x - e2.x;
                  const dy = e1.y - e2.y;
                  const dv = Math.hypot(dx, dy);
                  const minD = (e1.size + e2.size) * 1.4;
                  if (dv < minD && dv > 0.1) {
                      const angle = Math.atan2(dy, dx);
                      const push = (minD - dv) / 2;
                      e1.x += Math.cos(angle) * push;
                      e1.y += Math.sin(angle) * push;
                      e2.x -= Math.cos(angle) * push;
                      e2.y -= Math.sin(angle) * push;
                  }
              });
          });
      }
      return ens;
  };

  const enemies = useRef<Enemy[]>(createEnemies(initialDungeon, stats.current.dungeonLevel));
  const canSpawnEnemy = (type?: string) => {
      if (type === 'boss' || type === 'slimmy' || type === 'serpent' || type === 'shadow_reaper' || type === 'void_architect') {
          return true; // Always allow bosses to spawn
      }
      return enemies.current.filter(e => e.hp > 0).length < 100; // Cap alive normal/miniboss mobs to 100
  };

  // Helper to find a safe spot around a source (nest, necromancer, etc)
  const findSafeSpawnPosition = (sourceX: number, sourceY: number, size: number, minRadius: number = 30, maxRadius: number = 50) => {
      for (let attempt = 0; attempt < 15; attempt++) {
          const angle = Math.random() * Math.PI * 2;
          const r = minRadius + Math.random() * (maxRadius - minRadius);
          const sx = sourceX + Math.cos(angle) * r;
          const sy = sourceY + Math.sin(angle) * r;
          
          if (!pointInWall(sx, sy)) {
              const overlap = enemies.current.some(other => 
                  other.hp > 0 && Math.hypot(sx - other.x, sy - other.y) < (size + other.size + 8)
              );
              if (!overlap) return { x: sx, y: sy };
          }
      }
      return null;
  };

  const pets = useRef<Pet[]>([]);
  const corpses = useRef<Corpse[]>([]);
  const chests = useRef(initialDungeon.chests);
  stats.current.initialEnemies = enemies.current.length;
  const loot = useRef<LootItem[]>([]);
  const projectiles = useRef<Projectile[]>([]); // Define projectiles
  const nextParticleIndex = useRef(0);
  const particles = useRef<Particle[]>([]);
  if (particles.current.length === 0) {
      const arr: Particle[] = Array.from({ length: 3000 }, () => ({
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          life: 0,
          maxLife: 0,
          color: '',
          size: 0,
          targetX: undefined,
          targetY: undefined,
          type: undefined,
          rotation: undefined,
          vr: undefined,
          text: undefined,
          fontSize: undefined,
          noGravity: false,
          active: false
      }));
      (arr as any).push = (props: Partial<Particle> | Particle) => {
          let found = false;
          const len = arr.length;
          for (let i = 0; i < len; i++) {
              const idx = (nextParticleIndex.current + i) % len;
              const p = arr[idx];
              if (!p.active) {
                  p.x = props.x ?? 0;
                  p.y = props.y ?? 0;
                  p.vx = props.vx ?? 0;
                  p.vy = props.vy ?? 0;
                  p.life = props.life ?? 0;
                  p.maxLife = props.maxLife ?? 0;
                  p.color = props.color ?? '';
                  p.size = props.size ?? 0;
                  p.targetX = props.targetX;
                  p.targetY = props.targetY;
                  p.type = props.type;
                  p.rotation = props.rotation;
                  p.vr = props.vr;
                  p.text = props.text;
                  p.fontSize = props.fontSize;
                  p.noGravity = props.noGravity ?? false;
                  p.active = true;
                  nextParticleIndex.current = (idx + 1) % len;
                  found = true;
                  break;
              }
          }
          if (!found) {
              const idx = nextParticleIndex.current;
              const p = arr[idx];
              p.x = props.x ?? 0;
              p.y = props.y ?? 0;
              p.vx = props.vx ?? 0;
              p.vy = props.vy ?? 0;
              p.life = props.life ?? 0;
              p.maxLife = props.maxLife ?? 0;
              p.color = props.color ?? '';
              p.size = props.size ?? 0;
              p.targetX = props.targetX;
              p.targetY = props.targetY;
              p.type = props.type;
              p.rotation = props.rotation;
              p.vr = props.vr;
              p.text = props.text;
              p.fontSize = props.fontSize;
              p.noGravity = props.noGravity ?? false;
              p.active = true;
              nextParticleIndex.current = (idx + 1) % len;
          }
          return len;
      };
      particles.current = arr;
  }
  const damagePopups = useRef<{id: number, x: number, y: number, value: number | string, alpha: number, startTime: number, color: string, isCritical: boolean}[]>([]);

  const getMitigatedDamage = (rawDmg: number) => {
      const def = stats.current.defense || 0;
      const mitigation = Math.min(0.75, def * 0.015);
      const finalDmg = Math.max(1, Math.floor(rawDmg * (1 - mitigation)));
      if (stats.current.manaAbsorb) {
          const mpGain = Math.max(1, Math.floor(finalDmg * stats.current.manaAbsorb));
          stats.current.mp = Math.min(stats.current.maxMp, stats.current.mp + mpGain);
      }
      return finalDmg;
  };

  const triggerWeaponLevelUpAnimation = (weaponName: string, isMagic: boolean, newLevel: number) => {
      const px = player.current.x;
      const py = player.current.y;
      
      // Play exciting powerup / levelup sound effects
      audio.playPowerUpSound();
      setTimeout(() => {
          audio.playWinSound();
      }, 150);

      // Add intense screen shake proportional to weapon level
      shake.current.time = Math.max(shake.current.time, 18 + newLevel * 4);
      shake.current.intensity = Math.max(shake.current.intensity, 6 + newLevel * 1.5);

      // Define specialized color themes based on level and weapon type
      const basicColor = isMagic ? '#a855f7' : '#eab308'; // Purple for magic, gold for mechanical
      let mainColor = basicColor;
      let auraColors = [basicColor, '#ffffff'];

      if (newLevel >= 8) {
          // Mythic/God level: Rainbow astral theme
          mainColor = '#ff2a5f';
          auraColors = ['#ff2a5f', '#ffaa2b', '#26ffdf', '#9d3bff', '#ffffff'];
      } else if (newLevel >= 5) {
          // Legendary tier: Bright neon cyan & magic mint
          mainColor = '#00ffd2';
          auraColors = ['#00ffd2', '#0099ff', '#ffffff', '#3b82f6'];
      } else if (newLevel >= 3) {
          // Rare tier: Hot pink & magenta
          mainColor = '#ec4899';
          auraColors = ['#ec4899', '#f43f5e', '#a855f7', '#ffffff'];
      }

      // 1. Concentric shockwave expander rings
      const ringCount = Math.min(5, 1 + Math.floor(newLevel / 2));
      for (let r = 0; r < ringCount; r++) {
          setTimeout(() => {
              particles.current.push({
                  x: px,
                  y: py,
                  vx: 0,
                  vy: 0,
                  life: 0,
                  maxLife: 35 + r * 8,
                  color: auraColors[r % auraColors.length],
                  size: 35 + r * 50 + (newLevel * 22),
                  type: 'shockwave',
                  noGravity: true
              });
          }, r * 80);
      }

      // 2. High density burst of star particles
      const starCount = 20 + newLevel * 15;
      for (let s = 0; s < starCount; s++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2.5 + Math.random() * (4.5 + newLevel * 0.9);
          particles.current.push({
              x: px,
              y: py,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed - (1.2 + Math.random() * 2.2), // float upwards
              life: 0,
              maxLife: 35 + Math.random() * 45 + (newLevel * 8),
              color: auraColors[Math.floor(Math.random() * auraColors.length)],
              size: 2.5 + Math.random() * (1.2 + newLevel * 0.4),
              type: 'star',
              rotation: Math.random() * Math.PI * 2,
              vr: (Math.random() - 0.5) * 0.22
          });
      }

      // 3. Floating runic symbols around character
      const symbols = ['★', '✨', '⚡', '⚔', '🔮', '🔱', '💎', '👑', '✦', '✧'];
      const symbolCount = 8 + newLevel * 3;
      for (let i = 0; i < symbolCount; i++) {
          const char = symbols[Math.floor(Math.random() * symbols.length)];
          const angle = Math.random() * Math.PI * 2;
          const radius = 5 + Math.random() * 22;
          particles.current.push({
              x: px + Math.cos(angle) * radius,
              y: py + Math.sin(angle) * radius,
              vx: (Math.random() - 0.5) * 1.5,
              vy: -1.0 - Math.random() * (1.0 + newLevel * 0.35),
              life: 0,
              maxLife: 50 + Math.random() * 40,
              color: auraColors[Math.floor(Math.random() * auraColors.length)],
              size: 0,
              text: char,
              fontSize: 14 + Math.floor(Math.random() * 6),
              noGravity: true
          });
      }

      // 4. Double floating text messages stacked nicely
      const messages = [
          settingsRef.current.language === 'it' ? `POTENZIAMENTO!` : `UPGRADE DETECTED!`,
          `${weaponName.toUpperCase()} LVL. ${newLevel}`
      ];

      messages.forEach((msg, index) => {
          setTimeout(() => {
              particles.current.push({
                  x: px,
                  y: py - 24 - (index * 22),
                  vx: (Math.random() - 0.5) * 0.4,
                  vy: -1.0 - (index * 0.4),
                  life: 0,
                  maxLife: 65 + (newLevel * 8),
                  color: newLevel >= 8 ? '#facc15' : mainColor,
                  size: 0,
                  text: msg,
                  fontSize: 16 + (newLevel >= 8 ? 6 : (newLevel >= 5 ? 3 : 0)),
                  noGravity: true
              });
          }, index * 100);
      });

      // 5. Epic center screen message banner
      const titleText = settingsRef.current.language === 'it' 
          ? `SBLOCCATO LIVELLO ${newLevel}: ${weaponName.toUpperCase()}!` 
          : `UNLOCKED LEVEL ${newLevel}: ${weaponName.toUpperCase()}!`;
          
      levelMessage.current = { text: titleText, timer: 150 };
  };

  const spawnDamagePopup = (x: number, y: number, value: number | string, enemy: Enemy, isCritical: boolean, customColor?: string) => {
    let finalValue = value;
    if (typeof value === 'number' && isNaN(value)) {
        finalValue = 'Boom';
    }
    let color = customColor || '#ffffff';
    if (!customColor) {
        switch (enemy.type) {
            case 'warrior': color = '#718096'; break;
            case 'archer': color = '#63b3ed'; break;
            case 'mage': color = '#9f7aea'; break;
            case 'skeleton': color = '#e2e8f0'; break;
            case 'miniboss': color = '#ecc94b'; break;
            case 'boss': color = '#f56565'; break;
            default: color = '#ffffff';
        }
    }
    
    if (isCritical) {
        // Impact effect for critical hits
        shake.current.time = Math.max(shake.current.time, 15);
        shake.current.intensity = Math.max(shake.current.intensity, 8);
        audio.playCritHitSound();
        
        // Spawn burst particles
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            particles.current.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0,
                maxLife: 20 + Math.random() * 20,
                color: '#f6ad55', // Orange crit color
                size: 2 + Math.random() * 2
            });
        }
    }
    
    damagePopups.current.push({ id: Math.random(), x, y, value: finalValue, alpha: 1.0, startTime: Date.now(), color, isCritical });
  };

  const spawnPlayerDamagePopup = (value: number) => {
    if (value <= 0) return;
    damagePopups.current.push({ 
        id: Math.random(), 
        x: player.current.x, 
        y: player.current.y - 20, 
        value, 
        alpha: 1.0, 
        startTime: Date.now(), 
        color: '#ff0000', 
        isCritical: false 
    });
    
    // Impactful screen shake proportional to damage taken
    shake.current.time = Math.max(shake.current.time, 18);
    shake.current.intensity = Math.max(shake.current.intensity, Math.min(25, 8 + value * 0.45));
    
    // Trigger red screen flash vignette duration
    damageFlash.current = 15;
  };

  const spawnPlayerHitEffect = (x: number, y: number) => {
    // Red blood particles
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        particles.current.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0,
            maxLife: 30 + Math.random() * 20,
            color: '#ef4444', 
            size: 1.5 + Math.random() * 2
        });
    }
    // White impact sparks
    for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        particles.current.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0,
            maxLife: 10 + Math.random() * 10,
            color: '#ffffff',
            size: 1
        });
    }
    // Red shockwave
    particles.current.push({
        x, y,
        vx: 0, vy: 0,
        life: 0,
        maxLife: 20,
        color: 'rgba(255, 0, 0, 0.6)',
        size: 40,
        type: 'shockwave'
    });
  };
  
  // Corpse drawing logic
  const drawCorpses = (ctx: CanvasRenderingContext2D, cx: number, cy: number, canvasWidth: number, canvasHeight: number) => {
      corpses.current.forEach((c) => {
          // Offscreen culling check
          const screenX = c.x + cx;
          const screenY = c.y + cy;
          const size = 30;
          if (screenX < -size || screenX > canvasWidth + size ||
              screenY < -size || screenY > canvasHeight + size) {
              return;
          }

          ctx.save();
          ctx.translate(c.x, c.y);
          ctx.rotate(Math.PI / 2);
          ctx.scale(1.0, 0.7);
          ctx.globalAlpha = c.alpha;
          
          const art = ENEMY_PIXEL_ARTS[c.type as keyof typeof ENEMY_PIXEL_ARTS];
          if (art) {
              const drawSize = 15;
              const pixelSize = drawSize / 4; 
              const startX = -drawSize;
              const startY = -drawSize;
              
              const isMarcio = c.timer <= 1200; // 30 seconds old
              
              for (let r = 0; r < 8; r++) {
                  for (let col = 0; col < 8; col++) {
                      const char = art.pixels[r][col];
                      if (char !== ' ' && art.colors[char]) {
                          if (c.suckStarted) {
                              ctx.fillStyle = `rgba(255, 0, 0, ${c.alpha * 0.4})`;
                              ctx.fillRect(startX + col * pixelSize, startY + r * pixelSize, pixelSize + 0.5, pixelSize + 0.5);
                              ctx.fillStyle = art.colors[char];
                              ctx.globalAlpha = c.alpha * 0.3;
                              ctx.fillRect(startX + col * pixelSize, startY + r * pixelSize, pixelSize + 0.5, pixelSize + 0.5);
                              ctx.globalAlpha = c.alpha;
                          } else {
                              if (isMarcio) {
                                  // Dark/greenish tint for marcio
                                  ctx.fillStyle = `rgba(50, 80, 50, ${c.alpha * 0.8})`;
                                  ctx.fillRect(startX + col * pixelSize, startY + r * pixelSize, pixelSize + 0.5, pixelSize + 0.5);
                                  ctx.fillStyle = art.colors[char];
                                  ctx.globalAlpha = c.alpha * 0.5;
                                  ctx.fillRect(startX + col * pixelSize, startY + r * pixelSize, pixelSize + 0.5, pixelSize + 0.5);
                                  ctx.globalAlpha = c.alpha;
                              } else {
                                  ctx.fillStyle = art.colors[char];
                                  ctx.fillRect(startX + col * pixelSize, startY + r * pixelSize, pixelSize + 0.5, pixelSize + 0.5);
                              }
                          }
                      }
                  }
              }
          } else {
              ctx.fillStyle = '#444';
              ctx.fillRect(-10, -5, 20, 10);
          }
          ctx.restore();
          ctx.globalAlpha = 1.0;
      });
  };
   
  const initLevel = (level: number, keepSeed: boolean = false) => {
      saveGameState();
      // Sustainable growth: growth slows down after level 100
      const growthFactor = level > 100 ? 0.5 : 1.0;
      const effectiveLevel = level > 100 ? 100 + (level - 100) * 0.2 : level;
      
      const width = Math.min(WIDTH + effectiveLevel * 8, WIDTH * 4);
      const height = Math.min(HEIGHT + effectiveLevel * 6, HEIGHT * 4);
      
      if (!keepSeed) {
        activeSeed.current = Math.random().toString(36).substring(7); 
      }
      settingsRef.current.seed = activeSeed.current;
      
      const newDungeon = generateDungeon(width, height, level, activeSeed.current);
      currentDungeon.current = newDungeon;
      dungeon.current = newDungeon.grid;
      rooms.current = newDungeon.rooms;
      revealedRooms.current = new Set();
      clearedRoomIndices.current = new Set();
      triggeredAmbushes.current = new Set();
      activeAmbush.current = null;
      exploredTiles.current = new Set();
      revealOpacities.current = {};
      const secretMap: Record<string, number> = {};
      newDungeon.rooms.forEach((r, idx) => {
          if (r.isSecret) {
              for (let iy = r.y; iy < r.y + r.h; iy++) {
                  for (let ix = r.x; ix < r.x + r.w; ix++) {
                      secretMap[`${iy}_${ix}`] = idx;
                  }
              }
          }
      });
      secretTileToRoom.current = secretMap;
      chests.current = newDungeon.chests;
      
      const startX = newDungeon.rooms[0].cx * GRID_SIZE + GRID_SIZE / 2;
      const startY = newDungeon.rooms[0].cy * GRID_SIZE + GRID_SIZE / 2;
      player.current = { x: startX, y: startY, facing: 'down', aimAngle: Math.PI / 2, magicCd: 0, attackCd: 0, lastAttackTime: 0, lastPickupTime: 0, flashTimer: 0, chargeTimer: 0, isDraining: false, currentAttackHitIds: new Set<number>(), burstCount: 0, burstTimer: 0, vx: 0, vy: 0, dashTimer: 0, dashCd: 0, dashDirX: 0, dashDirY: 0, comboCount: 0, lastHitTime: 0 };
      
      enemies.current = createEnemies(newDungeon, level);
      loot.current = [];
      merchants.current = [];
      
      if (stats.current.pendingShopWeapons && stats.current.pendingShopWeapons.length > 0) {
          const colors = { common: '#a0aec0', uncommon: '#68d391', rare: '#63b3ed', epic: '#a78bfa', legendary: '#ecc94b' };
          stats.current.pendingShopWeapons.forEach((pw: any) => {
              const angle = Math.random() * Math.PI * 2;
              const speed = 1 + Math.random() * 2;
              const rarityColor = colors[pw.rarity as keyof typeof colors] || colors.common;
              loot.current.push({
                  x: startX, y: startY,
                  z: -10, vz: -2,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  type: 'weapon',
                  value: 'Shop Weapon',
                  color: rarityColor,
                  rarityColor: rarityColor,
                  rarity: pw.rarity,
                  isMagic: pw.isMagic,
                  name: pw.name,
                  isIdentified: true,
                  spawnTime: Date.now() / 1000,
                  special_behavior: pw.special_behavior
              });
          });
          stats.current.pendingShopWeapons = []; // Clear after spawning
      }

      // Spawn pending shop chests in starting room
      if (stats.current.inventory && stats.current.inventory.length > 0) {
           stats.current.inventory.filter((item: any) => item.type === 'chest').forEach((c: any) => {
              const rarity = c.rarity as 'common' | 'rare' | 'legendary';
              chests.current.push({                
                  gridX: newDungeon.rooms[0].cx + Math.floor(Math.random() * 2),
                  gridY: newDungeon.rooms[0].cy + Math.floor(Math.random() * 2),
                  hp: rarity === 'legendary' ? 40 : 20,
                  opened: false,
                  rarity: rarity,
                  isGuaranteedWeaponChest: rarity === 'legendary'
              });
           });
           // Remove chests from inventory
           stats.current.inventory = stats.current.inventory.filter((item: any) => item.type !== 'chest');
      }

      projectiles.current = [];
      particles.current.forEach(p => p.active = false);
      corpses.current = [];
      damagePopups.current = [];
      keys.current = {}; 
      bossKilled.current = false;
      portal.current = null;
      revealedSecretDoors.current = {};
      secretGlimmers.current = {};
      
      if (level === 100) {
          levelMessage.current = { text: settings.language === 'it' ? 'ENTITÀ DEL VUOTO IMMINENTE' : 'VOID ENTITY IMMINENT', timer: 180 };
      } else if (level > 100) {
          levelMessage.current = { text: settings.language === 'it' ? `LIVELLO MITICO ${level}` : `MYTHIC LEVEL ${level}`, timer: 120 };
      }

      // Update music based on level
      let trackId = level % 2 === 1 ? 'sottofindomistero1' : 'sottofindomistero2';
      if (level % 10 === 0 && level > 0) {
          trackId = 'alienmusic';
      }
      audio.playBackgroundMusic(trackId);
  };

  const handleReplay = () => {
    // Keep level and weapons, just reset HP and MP to max
    stats.current.hp = stats.current.maxHp;
    stats.current.mp = stats.current.maxMp;
    
    isGameOver.current = false;
    setGameOverData(null);
    pauseRef.current = false;
    setIsPaused(false);
    
    // Regenerate current dungeon with SAME SEED
    // This will reset player position to starting room and respawn enemies
    initLevel(stats.current.dungeonLevel, true);
    
    // Reset game state variables
    startTime.current = Date.now();
  };

  const keys = useRef<Record<string, boolean>>({});
  const lastGamepadPressedZ = useRef(false);
  const lastGamepadPressedX = useRef(false);
  const lastGamepadPressedStart = useRef(false);
  const shake = useRef({ time: 0, intensity: 0 });
  const damageFlash = useRef(0);
  const [isMobile, setIsMobile] = useState(false);

  // Joystick reference for movement
  const joystickRef = useRef<{ 
    active: boolean, 
    startX: number, 
    startY: number, 
    curX: number, 
    curY: number,
    id: number | null 
  }>({
    active: false,
    startX: 0,
    startY: 0,
    curX: 0,
    curY: 0,
    id: null
  });

  const handlePointerDown = (key: string) => (e: React.PointerEvent) => { 
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault(); 
    keys.current[key] = true; 
  };
  const handlePointerUp = (key: string) => (e: React.PointerEvent) => { 
    e.preventDefault(); 
    keys.current[key] = false; 
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [gameOverData, setGameOverData] = useState<{score: number, lvl: number, kills: number, dungeonLvl: number, timeSurvived: number, killer?: { type: string, level: number, damage?: number }} | null>(null);
  const [showShop, setShowShop] = useState(false);
  const shopOpenRef = useRef(false);
  useEffect(() => { shopOpenRef.current = showShop; }, [showShop]);

  const [isMerchantRoom, setIsMerchantRoom] = useState(false);
  const [showSkillTree, setShowSkillTree] = useState(false);
  const skillTreeOpenRef = useRef(false);
  useEffect(() => { skillTreeOpenRef.current = showSkillTree; }, [showSkillTree]);

  const [showLevelUpSlots, setShowLevelUpSlots] = useState(false);
  const levelUpSlotsOpenRef = useRef(false);
  useEffect(() => { levelUpSlotsOpenRef.current = showLevelUpSlots; }, [showLevelUpSlots]);

  const [showLevelUpText, setShowLevelUpText] = useState(false);
  const [showBestiary, setShowBestiary] = useState(false);
  const [showTrophies, setShowTrophies] = useState(false);

  useEffect(() => {
    if (showShop) {
      audio.playShopMusic();
      saveGameState();
    } else {
      audio.stopShopMusic();
    }
  }, [showShop, saveGameState]);
  useEffect(() => {
    const timer = setInterval(() => {
        const now = Date.now();
        setActiveTrackers(prev => {
            const next = { ...prev };
            let changed = false;
            for (const id in next) {
                if (now - next[id] > 4000) {
                    delete next[id];
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [isPaused, setIsPaused] = useState(false);
  const [showOptions, setShowOptions] = useState<any>(false);
  const [showStats, setShowStats] = useState(false);
  const [activeBoss, setActiveBoss] = useState<{ id: number | string; type: string; hp: number; maxHp: number } | null>(null);
  const [hudStats, setHudStats] = useState(() => stats.current);
  const [activeTrackers, setActiveTrackers] = useState<Record<string, number>>({});
  const lastShownStep = useRef<Record<string, number>>({});

  useEffect(() => {
    const initialSteps: Record<string, number> = {};
    TROPHIES.forEach(t => {
      const currentVal = (stats.current as any)[t.statKey] || 0;
      const targetVal = t.targetValue;
      if (targetVal > 0) {
        initialSteps[t.id] = Math.floor(((currentVal / targetVal) * 100) / 10);
      } else {
        initialSteps[t.id] = 0;
      }
    });
    lastShownStep.current = initialSteps;
  }, []);

  const showTrophyProgress = (trophyId: string) => {
    const trophy = TROPHIES.find(t => t.id === trophyId);
    if (!trophy) return;

    const current = (stats.current as any)[trophy.statKey] || 0;
    const target = trophy.targetValue;
    if (target <= 0) return;

    const percent = (current / target) * 100;
    const currentStep = Math.floor(percent / 10); // 0 to 10

    // Lazy initialization if not exists
    if (lastShownStep.current[trophyId] === undefined) {
        lastShownStep.current[trophyId] = currentStep;
        return;
    }

    if (currentStep > lastShownStep.current[trophyId] && currentStep < 10) {
        lastShownStep.current[trophyId] = currentStep;
        setActiveTrackers(prev => ({
            ...prev,
            [trophyId]: Date.now()
        }));
    }
  };

  const checkTrophies = () => {
    const st = stats.current;
    
    // Total Kills
    if (st.kills >= 200 && !st.unlockedTrophies.includes('synthwave_slayer')) {
        st.unlockedTrophies.push('synthwave_slayer');
        levelMessage.current = { text: "SBLOCCATO: Ammazzasynthwave!", timer: 120 };
        audio.playSecretRoomSound();
    }
    
    // Rats (Skeletons)
    if (st.ratsKilled >= 50 && !st.unlockedTrophies.includes('rat_slayer')) {
        st.unlockedTrophies.push('rat_slayer');
        levelMessage.current = { text: "SBLOCCATO: Ratti Laser!", timer: 120 };
        audio.playSecretRoomSound();
    }

    // Items
    if (st.itemsCollected >= 100 && !st.unlockedTrophies.includes('loot_goblin')) {
        st.unlockedTrophies.push('loot_goblin');
        levelMessage.current = { text: "SBLOCCATO: Supremo Goblin!", timer: 120 };
        audio.playSecretRoomSound();
    }

    // Streak
    if (st.noHitStreak >= 20 && !st.unlockedTrophies.includes('photon_ninja')) {
        st.unlockedTrophies.push('photon_ninja');
        levelMessage.current = { text: "SBLOCCATO: Ninja del Fotone!", timer: 120 };
        audio.playSecretRoomSound();
    }

    // Rooms Cleared
    if (st.roomsCleared >= 10 && !st.unlockedTrophies.includes('pixel_survivor')) {
        st.unlockedTrophies.push('pixel_survivor');
        levelMessage.current = { text: "SBLOCCATO: Sopravvissuto Pixel!", timer: 120 };
        audio.playSecretRoomSound();
    }

    // Rare Drops
    if (st.rareDropsCollected >= 50 && !st.unlockedTrophies.includes('cyber_collector')) {
        st.unlockedTrophies.push('cyber_collector');
        levelMessage.current = { text: "SBLOCCATO: Collezionista Cyber!", timer: 120 };
        audio.playSecretRoomSound();
    }

    // Secret Rooms
    if (st.secretRoomsFound >= 10 && !st.unlockedTrophies.includes('neon_archivist')) {
        st.unlockedTrophies.push('neon_archivist');
        levelMessage.current = { text: "SBLOCCATO: Archivista del Neon!", timer: 120 };
        audio.playSecretRoomSound();
    }

    // Electric Boss
    if (st.electricBossKills >= 1 && !st.unlockedTrophies.includes('circuit_breaker')) {
        st.unlockedTrophies.push('circuit_breaker');
        levelMessage.current = { text: "SBLOCCATO: Interruttore Circuiti!", timer: 120 };
        audio.playSecretRoomSound();
    }

    // Weapon Master
    if (st.weaponsCollected >= 25 && !st.unlockedTrophies.includes('weapon_master')) {
        st.unlockedTrophies.push('weapon_master');
        levelMessage.current = { 
            text: settingsRef.current.language === 'it' 
                ? "SBLOCCATO: Maestro d'Armi!" 
                : "UNLOCKED: Weapon Master!", 
            timer: 120 
        };
        audio.playSecretRoomSound();
    }

    // Upgrade Me
    if (st.weaponsUpgraded >= 10 && !st.unlockedTrophies.includes('upgrade_me')) {
        st.unlockedTrophies.push('upgrade_me');
        levelMessage.current = { 
            text: settingsRef.current.language === 'it' 
                ? "SBLOCCATO: Potenziami!" 
                : "UNLOCKED: Upgrade Me!", 
            timer: 120 
        };
        audio.playSecretRoomSound();
    }
  };
  
  const [highlightedStats, setHighlightedStats] = useState<Record<string, boolean>>({});
  const lastStatsRef = useRef({ ...stats.current });

  // Update HUD state periodically for React components
  useEffect(() => {
    const interval = setInterval(() => {
      const currentStats = { ...stats.current };
      
      // Detect permanent stat increases
      const trackedKeys = [
        'strength', 'maxHp', 'maxMp', 'defense', 
        'hpRegen', 'mpRegenBoost', 'critChance', 
        'cooldownReduction', 'attackSpeed'
      ] as const;

      const newHighlights: Record<string, boolean> = { ...highlightedStats };
      let changed = false;

      trackedKeys.forEach(key => {
        if ((currentStats[key] as number) > (lastStatsRef.current[key] as number)) {
          newHighlights[key] = true;
          changed = true;
          
          // Clear after 3 seconds
          setTimeout(() => {
            setHighlightedStats(prev => {
              const next = { ...prev };
              delete next[key];
              return next;
            });
          }, 3000);
        }
      });

      if (changed) {
        setHighlightedStats(newHighlights);
      }

      lastStatsRef.current = currentStats;
      setHudStats(currentStats);
      
      const bossRoomIdx = currentDungeon.current?.bossRoomIdx;
      const bRoom = (bossRoomIdx !== undefined && rooms.current) ? rooms.current[bossRoomIdx] : null;
      const isPlayerInBossRoom = bRoom && 
          player.current &&
          player.current.x >= bRoom.x * GRID_SIZE && 
          player.current.x <= (bRoom.x + bRoom.w) * GRID_SIZE &&
          player.current.y >= bRoom.y * GRID_SIZE && 
          player.current.y <= (bRoom.y + bRoom.h) * GRID_SIZE;

      const boss = isPlayerInBossRoom 
          ? enemies.current.find(e => e.hp > 0 && (e.type === 'boss' || e.type === 'slimmy' || e.type === 'serpent' || e.type === 'shadow_reaper' || e.type === 'void_architect'))
          : null;

      if (boss) {
        setActiveBoss({
          id: boss.id,
          type: boss.type,
          hp: boss.hp,
          maxHp: boss.maxHp
        });
      } else {
        setActiveBoss(null);
      }
    }, 100);
    return () => {
      clearInterval(interval);
    };
  }, []);
  const slotTimeouts = useRef<any[]>([]);
  const [slotMachineState, setSlotMachineState] = useState<{ 
    active: boolean, 
    cx: number, 
    cy: number, 
    mode: 'spinning' | 'stopping' | 'results', 
    reelMode: ['spinning' | 'stopping' | 'stopped', 'spinning' | 'stopping' | 'stopped', 'spinning' | 'stopping' | 'stopped'], 
    resultItems: Partial<LootItem>[], 
    appearTime: number,
    finalItems: Partial<LootItem>[]
  } | null>(null);
  
  // Refs for tracking UI state in gamepad loop
  const slotMachineStateRef = useRef(slotMachineState);
  useEffect(() => { slotMachineStateRef.current = slotMachineState; }, [slotMachineState]);
  
  useEffect(() => {
    if (slotMachineState?.mode === 'spinning') {
        const t = setTimeout(() => {
            const btn = document.getElementById('slot-stop-btn');
            if (btn) btn.click();
        }, 3000);
        return () => clearTimeout(t);
    }
  }, [slotMachineState?.mode]);

    const lastGamepadButtons_UI = useRef<boolean[]>(new Array(16).fill(false));

    useEffect(() => {
        let animId: number;
        const uiLoop = () => {
            const gamepads = navigator.getGamepads();
            const gp = gamepads[0];
            if (!gp) {
                animId = requestAnimationFrame(uiLoop);
                return;
            }

            const currentButtons = gp.buttons.map(b => b.pressed);

            const isJustPressed = (btnIndex: number) => {
                return currentButtons[btnIndex] && !lastGamepadButtons_UI.current[btnIndex];
            };

            // Button 0: A (Confirm / Action)
            if (isJustPressed(0)) {
                if (slotMachineStateRef.current) {
                    const mode = slotMachineStateRef.current.mode;
                    if (mode === 'spinning' || mode === 'stopping') {
                        if (Date.now() - slotMachineStateRef.current.appearTime >= 1000) {
                            document.getElementById('slot-stop-btn')?.click();
                        }
                    } else if (mode === 'results') {
                        document.getElementById('slot-collect-btn')?.click();
                    }
                } else if (skillTreeOpenRef.current) {
                    document.getElementById('skill-upgrade-btn')?.click();
                } else if (shopOpenRef.current) {
                    document.getElementById('shop-continue-btn')?.click();
                }
            }

            // Button 1: B (Cancel / Close)
            if (isJustPressed(1)) {
                if (skillTreeOpenRef.current) {
                    document.getElementById('skill-close-btn')?.click();
                } else if (shopOpenRef.current) {
                    document.getElementById('shop-close-btn')?.click();
                } else if (slotMachineStateRef.current) {
                    document.getElementById('slot-close-btn')?.click();
                } else if (pauseRef.current) {
                    pauseRef.current = false;
                    setIsPaused(false);
                }
            }

            // Button 4: LB / Button 5: RB (Cycle tabs in Skill Tree)
            if (isJustPressed(4)) {
                if (skillTreeOpenRef.current) {
                    document.getElementById('skill-prev-tab-btn')?.click();
                }
            }
            if (isJustPressed(5)) {
                if (skillTreeOpenRef.current) {
                    document.getElementById('skill-next-tab-btn')?.click();
                } else if (slotMachineStateRef.current && slotMachineStateRef.current.mode === 'spinning') {
                    // Also allow RB to dash while playing, but here we are in UI loop
                }
            }

            // Button 9: Start (Pause toggle / Continue)
            if (isJustPressed(9)) {
                if (shopOpenRef.current) {
                    document.getElementById('shop-continue-btn')?.click();
                } else if (slotMachineStateRef.current && slotMachineStateRef.current.mode === 'results') {
                    document.getElementById('slot-collect-btn')?.click();
                } else {
                    pauseRef.current = !pauseRef.current;
                    setIsPaused(pauseRef.current);
                }
            }

            lastGamepadButtons_UI.current = currentButtons;
            animId = requestAnimationFrame(uiLoop);
        };
        animId = requestAnimationFrame(uiLoop);
        return () => cancelAnimationFrame(animId);
    }, []);

  const [renderTrigger, setRenderTrigger] = useState(0); // Used to force re-render when settings change
  const bossKilled = useRef(false);
  const levelMessage = useRef<{ text: string, timer: number } | null>(null);
  const portal = useRef<{ x: number, y: number } | null>(null);
  const isGameOver = useRef(false);
  const pauseRef = useRef(false);

  // Update settingsRef if props change
  useEffect(() => {
    settingsRef.current = settings;
    audio.enabled = settings.audio;
    if (settings.audio) {
        audio.init();
        let trackId = (settings.startLevel || 1) % 2 === 1 ? 'sottofindomistero1' : 'sottofindomistero2';
        if ((settings.startLevel || 1) % 10 === 0 && (settings.startLevel || 1) > 0) {
            trackId = 'alienmusic';
        }
        audio.playBackgroundMusic(trackId);
    } else {
        audio.stopBackgroundMusic();
    }
    
    return () => {
        audio.stopBackgroundMusic();
    }
  }, []);

  const toggleAudio = () => {
      settingsRef.current.audio = !settingsRef.current.audio;
      audio.enabled = settingsRef.current.audio;
      if (audio.enabled) {
          audio.init();
          let trackId = stats.current.dungeonLevel % 2 === 1 ? 'sottofindomistero1' : 'sottofindomistero2';
          if (stats.current.dungeonLevel % 10 === 0 && stats.current.dungeonLevel > 0) {
              trackId = 'alienmusic';
          }
          audio.playBackgroundMusic(trackId);
      } else {
          audio.stopBackgroundMusic();
      }
      localStorage.setItem('neonDungeonSettings', JSON.stringify(settingsRef.current));
      setRenderTrigger(prev => prev + 1);
  };
  
  const toggleLanguage = () => {
      settingsRef.current.language = settingsRef.current.language === 'it' ? 'en' : 'it';
      localStorage.setItem('neonDungeonSettings', JSON.stringify(settingsRef.current));
      setRenderTrigger(prev => prev + 1);
  };

  const toggleShowFps = () => {
      settingsRef.current.showFps = !settingsRef.current.showFps;
      localStorage.setItem('neonDungeonSettings', JSON.stringify(settingsRef.current));
      setRenderTrigger(prev => prev + 1);
  };

  const toggleScanlines = () => {
      settingsRef.current.scanlines = !settingsRef.current.scanlines;
      localStorage.setItem('neonDungeonSettings', JSON.stringify(settingsRef.current));
      setRenderTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let fps = settingsRef.current.fps;
    let lastFpsUpdateTime = 0;
    let frameCount = 0;

    const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const handleKeyDown = (e: KeyboardEvent) => {
        keys.current[e.key] = true;
        const { fire1, fire2 } = settingsRef.current.keys;
        if (e.key === fire1 || (fire1 === 'z' && e.key === 'z')) {
            player.current.lastAttackTime = Date.now();
        }
        if (e.key === 'Escape' && !e.repeat) {
            pauseRef.current = !pauseRef.current;
            setIsPaused(pauseRef.current);
        }
        if (e.key.toLowerCase() === 's' && pauseRef.current && !e.repeat) {
            setShowStats(prev => !prev);
        }
        if (e.key.toLowerCase() === 't' && !e.repeat) {
            if (!showShop && !isGameOver.current) {
                setShowSkillTree(prev => {
                    const next = !prev;
                    pauseRef.current = next;
                    return next;
                });
            }
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => keys.current[e.key] = false;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let requestID: number;
    let lastFrameTime = performance.now();

    const spawnLoot = (x: number, y: number, source: 'normal' | 'miniboss' | 'boss' | 'nest' | 'wall' | 'chest' | 'legendary_chest' | 'warrior' | 'archer' | 'mage' | 'skeleton' | 'crystal' | 'diamond' | 'secret_chest') => {
        const drop = (type: LootItem['type'], value: number | string, color: string, extra: Partial<LootItem> = {}) => {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            loot.current.push({
                x, y,
                z: -5 - Math.random() * 5,
                vz: -2 - Math.random() * 3,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                type, value, color,
                spawnTime: Date.now() / 1000,
                ...extra
            });
            audio.playDropSound(type === 'potion_hp' || type === 'potion_mp' || type === 'potion_xp' ? 'potion' : (type === 'weapon' ? 'weapon' : (type === 'gem' ? 'gem' : (type === 'crystal' ? 'gem' : 'gold'))));
        };

        const getMobLevel = (source: string) => {
            if (source === 'boss') return 10;
            if (source === 'miniboss') return 5;
            return 1;
        };

        const lvl = stats.current.lvl;
        const mobLvl = getMobLevel(source);
        const difficulty = settingsRef.current.difficulty || 3;
        const lootMult = 1.4 - (difficulty - 1) * 0.1;
        const goldBase = Math.floor((mobLvl + Math.random() * mobLvl) * (2 + lvl * 0.2) * lootMult);
        const randomPotionOrGem = () => {
             const r = Math.random();
             if (r < 0.85) {
                 // Drop potion
                 const totalWeight = POTIONS.reduce((sum, p) => sum + p.dropWeight, 0);
                 let rand = Math.random() * totalWeight;
                 for (const p of POTIONS) {
                     rand -= p.dropWeight;
                     if (rand <= 0) {
                         drop(p.type, p.value, p.color);
                         break;
                     }
                 }
             }
             else {
                 // Drop valueable
                 const totalWeight = GEMS.reduce((sum, g) => sum + g.dropWeight, 0);
                 let rand = Math.random() * totalWeight;
                 for (const g of GEMS) {
                     rand -= g.dropWeight;
                     if (rand <= 0) {
                         drop(g.type, g.name, g.color, { value: g.value, rarityColor: g.rarityColor });
                         break;
                     }
                 }
             }
        };

        const createWeapon = (name: string, isMagic: boolean, rarity: 'common' | 'rare' | 'legendary' | 'epic' | 'uncommon', specificWeaponId?: string): Partial<LootItem> => {
            const colors = { common: '#a0aec0', uncommon: '#68d391', rare: '#63b3ed', epic: '#a78bfa', legendary: '#ecc94b' };
            const weaponNames = Object.keys(WEAPONS);
            const actualName = specificWeaponId ? (WEAPONS[specificWeaponId] ? specificWeaponId : weaponNames[0]) : weaponNames[Math.floor(Math.random() * weaponNames.length)];
            const weaponDef = WEAPONS[actualName];
            const finalRarity = weaponDef.rarity || rarity;
            
            return {
                rarityColor: colors[finalRarity],
                rarity: finalRarity,
                isMagic: weaponDef.type !== 'sword' && weaponDef.type !== 'hammer',
                name: actualName,
                isIdentified: true,
                special_behavior: weaponDef.special_behavior
            };
        };

        if (source === 'normal' || source === 'warrior' || source === 'archer' || source === 'mage' || source === 'skeleton') {
            drop('gold', goldBase, '#FFD700');
            if (Math.random() < 0.5 * lootMult) randomPotionOrGem();
            if (Math.random() < 0.15 * lootMult) {
                const commonPool = ['Spada Base', 'Pistola', 'Bacchetta Base'];
                const chosen = commonPool[Math.floor(Math.random() * commonPool.length)];
                drop('weapon', 'Random Weapon', '#a0aec0', createWeapon('Weapon', false, 'common', chosen));
            }
            if (Math.random() < 0.08 * lootMult) drop('crystal', 1, '#ffffff'); 
            if (Math.random() < 0.01 * lootMult) drop('cosmetic', 'Mantello del Destino', '#ff00ff', { rarityColor: '#ff00ff' });
        } else if (source === 'miniboss') {
            drop('gold', goldBase * 10, '#FFD700');
            for(let i=0; i<3; i++) randomPotionOrGem();
            if (Math.random() < 0.1) {
                drop('pet', 'Soul Bond Egg', '#00ffff', { rarityColor: '#00ffff', name: 'Soul Bond Egg' });
            }
            // Higher quality weapons for minibosses
            const weaponRoll = Math.random();
            if (weaponRoll < 0.7) {
                const reqRarity = Math.random() < 0.8 ? 'epic' : 'legendary';
                const epicWeapons = Object.keys(WEAPONS).filter(k => WEAPONS[k].rarity === reqRarity);
                const chosen = epicWeapons.length > 0 ? epicWeapons[Math.floor(Math.random() * epicWeapons.length)] : undefined;
                const rarityColor = reqRarity === 'epic' ? '#a78bfa' : '#ecc94b';
                drop('weapon', (reqRarity === 'epic' ? 'Epic Weapon' : 'Legendary Weapon'), rarityColor, createWeapon('Weapon', false, reqRarity, chosen));
            }
            if (Math.random() < 0.5) drop('crystal', 1 + Math.floor(Math.random() * 3), '#ffffff');
            if (Math.random() < 0.1) drop('cosmetic', 'Corona di Smeraldo', '#50ff50', { rarityColor: '#50ff50' });
        } else if (source === 'boss') {
            audio.playBossDefeatSound();
            drop('gold', goldBase * 20, '#FFD700');
            for(let i=0; i<8; i++) randomPotionOrGem();
            if (Math.random() < 0.35) {
                drop('pet', 'Soul Bond Egg', '#00ffff', { rarityColor: '#00ffff', name: 'Soul Bond Egg' });
            }
            // Guaranteed weapons for boss
            drop('weapon', 'Legendary Weapon', '#ecc94b', createWeapon('Mythic Blade', false, 'legendary'));
            if (Math.random() < 0.5) drop('weapon', 'Epic Weapon', '#a78bfa', createWeapon('Epic Staff', true, 'epic'));
            drop('crystal', 2 + Math.floor(Math.random() * 3), '#ffffff');
        } else if (source === 'legendary_chest') {
            drop('gold', Math.floor(50 + Math.random() * 100), '#FFD700');
            randomPotionOrGem();randomPotionOrGem();
            const legendaryWeapons = Object.keys(WEAPONS).filter(k => WEAPONS[k].rarity === 'mythic' || WEAPONS[k].rarity === 'legendary' || WEAPONS[k].rarity === 'epic');
            const chosen = legendaryWeapons.length > 0 ? legendaryWeapons[Math.floor(Math.random() * legendaryWeapons.length)] : undefined;
            drop('weapon', 'Legendary Weapon', '#ecc94b', createWeapon('Legendary', false, 'legendary', chosen));
            drop('crystal', 1 + Math.floor(Math.random() * 2), '#ffffff');
        } else if (source === 'secret_chest') {
            drop('gold', goldBase * 5, '#FFD700');
            randomPotionOrGem();
            if (Math.random() < 0.3) {
                const relic = RELICS[Math.floor(Math.random() * RELICS.length)];
                drop('relic', relic.name, '#ff00ff', { value: relic.id, rarityColor: '#ff00ff', name: relic.name });
            }
            if (Math.random() < 0.5) drop('crystal', 1, '#ffffff');
        } else if (source === 'diamond') {
            drop('gem', 'Diamante Astrale', '#ffffff', { value: 2000, rarityColor: '#00ffff' });
            for(let i=0; i<5; i++) drop('gold', 20, '#FFD700');
        } else if (source === 'wall' || source === 'chest') {
            drop('gold', Math.floor(5 + Math.random() * 15), '#FFD700');
            if (Math.random() < 0.4) randomPotionOrGem();
            if (Math.random() < 0.1) drop('crystal', 1, '#ffffff');
        } else if (source === 'crystal') {
            const numDrops = 3 + Math.floor(Math.random() * 2);
            for (let i = 0; i < numDrops; i++) {
                if (Math.random() < 0.3) {
                    drop('weapon', 'Legendary Weapon', '#ecc94b', createWeapon('Crystal Sword', true, 'legendary'));
                } else if (Math.random() < 0.5) {
                    drop('weapon', 'Epic Weapon', '#a78bfa', createWeapon('Crystal Wand', true, 'epic'));
                } else {
                    const totalWeight = GEMS.reduce((sum, g) => sum + g.dropWeight, 0);
                    let rand = Math.random() * totalWeight;
                    for (const g of GEMS) {
                        rand -= g.dropWeight;
                        if (rand <= 0) {
                            drop(g.type, g.name, g.color, { value: g.value, rarityColor: g.rarityColor });
                            break;
                        }
                    }
                }
            }
        }
    };

    const registerEnemyKill = (e: Enemy) => {
        if (e.hp > 0) return; // Safety
        
        // Intercept bomber death on first hit: remains dead on floor, explodes after 2 seconds
        if (e.type === 'bomber' && !e.isDeadFuse && !e.isDeadFuseTriggered) {
            e.hp = -1; // keep it dead but in the active enemies array
            e.isDeadFuse = true;
            e.isDeadFuseTriggered = true;
            e.isIgnited = true;
            e.fuseTimer = 120; // 2 seconds at 60fps
            e.speed = 0; // stop moving
            if (audio.playBossCharge) {
                audio.playBossCharge();
            }
            return;
        }
        
        let scoreGain = 0;
        const isBoss = e.type === 'boss' || e.type === 'slimmy' || e.type === 'serpent' || e.type === 'shadow_reaper' || e.type === 'void_architect';
        
        if (e.type === 'miniboss') scoreGain = 300 + stats.current.lvl * 200;
        else if (isBoss) scoreGain = 1000 + stats.current.lvl * 500;
        else scoreGain = Math.floor(Math.random() * 15) + 1;
        
        stats.current.score += scoreGain;
        stats.current.exp += getExpFromMob(e.level || 1, stats.current.lvl, stats.current.extraXpGainPct, settingsRef.current.difficulty || 3);
        stats.current.kills++;
        if (stats.current.kills % 25 === 0) showTrophyProgress('synthwave_slayer');
        stats.current.noHitStreak++;
        if (stats.current.noHitStreak % 5 === 0) showTrophyProgress('photon_ninja');
        
        if (e.type === 'skeleton') {
            stats.current.ratsKilled++;
            showTrophyProgress('rat_slayer');
        }

        if (!stats.current.bestiaryKills) (stats.current as any).bestiaryKills = {};
        const bKills = (stats.current as any).bestiaryKills;
        bKills[e.type] = (bKills[e.type] || 0) + 1;

        // Room Clearance Logic
        if (e.roomId !== undefined && !clearedRoomIndices.current.has(e.roomId)) {
            const enemiesInRoom = enemies.current.filter(other => other.id !== e.id && other.hp > 0 && other.roomId === e.roomId);
            if (enemiesInRoom.length === 0) {
                clearedRoomIndices.current.add(e.roomId);
                const roomObj = rooms.current?.[e.roomId];
                if (roomObj && roomObj.isStanza) {
                    const isPlayerInRoom = player.current &&
                        player.current.x >= roomObj.x * GRID_SIZE &&
                        player.current.x <= (roomObj.x + roomObj.w) * GRID_SIZE &&
                        player.current.y >= roomObj.y * GRID_SIZE &&
                        player.current.y <= (roomObj.y + roomObj.h) * GRID_SIZE;

                    if (isPlayerInRoom) {
                        const goldReward = 20 + stats.current.dungeonLevel * 5;
                        const xpReward = 50 + stats.current.dungeonLevel * 10;
                        stats.current.gold += goldReward;
                        stats.current.exp += xpReward;
                        stats.current.roomsCleared = (stats.current.roomsCleared || 0) + 1;
                        showTrophyProgress('pixel_survivor');
                        levelMessage.current = { 
                            text: settingsRef.current.language === 'it' 
                                ? `STANZA PULITA! (+${goldReward} ORO, +${xpReward} XP)` 
                                : `ROOM CLEARED! (+${goldReward} Gold, +${xpReward} XP)`, 
                            timer: 150 
                        };
                        audio.playSecretRoomSound(); 
                    } else {
                        levelMessage.current = {
                            text: settingsRef.current.language === 'it'
                                ? `STANZA LIBERATA DALL'ESTERNO! (Nessun premio)`
                                : `ROOM CLEARED FROM OUTSIDE! (No reward)`,
                            timer: 150
                        };
                    }
                }
            }
        }

        checkTrophies();

        if (stats.current.soulSourceRegen) {
            stats.current.mp = Math.min(stats.current.maxMp, stats.current.mp + stats.current.soulSourceRegen);
        }
        
        spawnLoot(e.x, e.y, e.type as any);

        corpses.current.push({
            x: e.x, y: e.y, type: e.type, 
            timer: 3000, maxTimer: 3000, alpha: 1.0, 
            id: Math.random(), 
            suckStarted: e.type === 'vampire' || e.type === 'mage'
        });

        if (isBoss) {
            bossKilled.current = true;
            if (stats.current.physicalWeapon === 'thunder_hammer') {
                stats.current.electricBossKills++;
                showTrophyProgress('circuit_breaker');
            }
        }

        // Particle Explosion
        const particleCount = Math.floor(e.size * 2);
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const pDist = Math.random() * e.size;
            const pSpeed = 2 + Math.random() * 5;
            particles.current.push({
                x: e.x + Math.cos(angle) * pDist,
                y: e.y + Math.sin(angle) * pDist,
                vx: Math.cos(angle) * pSpeed,
                vy: Math.sin(angle) * pSpeed - 2,
                life: 0,
                maxLife: 30 + Math.random() * 40,
                color: Math.random() > 0.5 ? '#ff4444' : (Math.random() > 0.5 ? '#ffffff' : '#ffaa00'),
                size: 2 + Math.random() * (e.size / 5)
            });
        }
    };
    
    // Power-based damage calculation helper
    const calculateEnemyDamage = (e: Enemy, rawDmg: number, isPlayer: boolean = true, sourceLvl?: number) => {
        if (e.hp <= 0) return 0;
        
        let dmg = rawDmg;
        // Mastery Bonus: +1% damage for 50+ kills of this specific enemy type
        if (isPlayer && (stats.current.bestiaryKills?.[e.type] || 0) >= 50) {
            dmg *= 1.01;
        }

        // Base boss resistance
        let multiplier = (e.type === 'boss' || e.type === 'slimmy' || e.type === 'serpent' || e.type === 'shadow_reaper' || e.type === 'void_architect') ? 0.5 : 1.0;
        if (e.type === 'miniboss') multiplier = 0.7;

        // Calculate power ratio
        const attackerLvl = isPlayer ? stats.current.lvl : (sourceLvl || 1);
        const attackerPower = isPlayer ? (stats.current.lvl + stats.current.strength * 0.5) : attackerLvl;
        const enemyLevel = e.level || 1;
        
        // ratio > 1 means attacker is stronger
        const powerRatio = attackerPower / Math.max(1, enemyLevel);
        
        let finalMultiplier = multiplier;
        if (powerRatio > 1.2) {
            // Overpowered hero: overcome resistance and boost damage
            // We scale up to 3x damage if player is way overleveled
            const boost = Math.min(3.0, (powerRatio - 0.2) * 1.5); 
            finalMultiplier *= boost;
            
            // Stagger/Falling logic for bosses
            if (isPlayer && (e.type === 'boss' || e.type === 'slimmy' || e.type === 'serpent' || e.type === 'shadow_reaper' || e.type === 'void_architect') && (dmg * finalMultiplier > e.maxHp * 0.03)) {
                // If hitting for more than 3% of max HP, stagger the boss
                e.stunTimer = Math.min(240, (e.stunTimer || 0) + 40); // Boss falls!
                
                // Visual feedback: many yellow stars
                for(let i=0; i<3; i++) {
                    particles.current.push({
                        x: e.x + (Math.random()-0.5)*e.size,
                        y: e.y - e.size,
                        vx: (Math.random() - 0.5) * 4, vy: -Math.random() * 5,
                        life: 0, maxLife: 30, color: '#ffff00', size: 4
                    });
                }
                
                // If very high impact, play extra sound
                if (dmg * finalMultiplier > e.maxHp * 0.1) {
                    audio.playImpactSound();
                }
            }
        } else if (powerRatio < 0.7) {
            // Boss is much stronger than player: extreme resistance
            const penalty = Math.max(0.05, powerRatio + 0.1);
            finalMultiplier *= penalty;
        }

        let calculatedDmg = dmg * finalMultiplier;

        // Apply physical armor shred (Corrosion)
        if (e.physicalDefense > 0) {
            let def = e.physicalDefense;
            if (e.corrodedArmorRatio !== undefined) {
                def = def * e.corrodedArmorRatio;
            }
            calculatedDmg = Math.max(1, calculatedDmg - def * 0.15);
        }

        // Apply Plague Active (+25% damage against poisoned targets)
        if (stats.current.plagueActive && e.poisonTimer && e.poisonTimer > 0) {
            calculatedDmg *= 1.25;
        }

        return Math.floor(calculatedDmg);
    };

    const getEffectMultiplier = (e: Enemy, isPlayer: boolean = true, sourceLvl?: number) => {
        let multiplier = (e.type === 'boss' || e.type === 'slimmy' || e.type === 'serpent' || e.type === 'shadow_reaper' || e.type === 'void_architect') ? 0.35 : 1.0;
        if (e.type === 'miniboss') multiplier = 0.55;
        
        if (e.type === 'charger' || e.type === 'shield_bearer') multiplier *= 0.5;

        const attackerLvl = isPlayer ? stats.current.lvl : (sourceLvl || 1);
        const attackerPower = isPlayer ? (stats.current.lvl + Math.max(stats.current.strength, stats.current.magicPower) * 0.5) : attackerLvl;
        const enemyLevel = e.level || 1;
        const powerRatio = attackerPower / Math.max(1, enemyLevel);
        
        return Math.min(2.5, Math.max(0.15, multiplier * powerRatio));
    };

    const triggerBomberExplosion = (e: Enemy) => {
        if (e.hp <= 0 && !e.isDeadFuse) return;
        
        e.isDeadFuse = false; // complete the dead fuse so it undergoes standard cleanup
        e.hp = -100; // Kill the bomber
        registerEnemyKill(e);
        
        // Screen shake & explosion audio
        shake.current.time = 15;
        if (audio.playBossExplosion) {
            audio.playBossExplosion();
        }
        
        // Explosion boundary: 4 tiles = 160 pixels
        const radius = 160; 
        
        // 1. Dmg to Hero
        const heroDist = Math.hypot(player.current.x - e.x, player.current.y - e.y);
        if (heroDist < radius) {
            const baseDmg = 45 + e.level * 5;
            const mitigatedDmg = getMitigatedDamage(baseDmg);
            killerRef.current = { type: 'bomber', level: e.level, damage: mitigatedDmg };
            stats.current.hp -= mitigatedDmg;
            
            audio.playPlayerHitSound();
            spawnPlayerHitEffect(player.current.x, player.current.y);
            spawnPlayerDamagePopup(mitigatedDmg);
        }
        
        // 2. Dmg to all OTHER mobs in radius
        enemies.current.forEach(otherE => {
            if (otherE !== e && otherE.hp > 0) {
                const mobDist = Math.hypot(otherE.x - e.x, otherE.y - e.y);
                if (mobDist < radius) {
                    // Mobs take huge chunk of damage
                    const mobDmg = Math.floor(100 + e.level * 15);
                    otherE.hp -= mobDmg;
                    spawnDamagePopup(otherE.x, otherE.y, 'Boom', otherE, true, '#ff4500');
                    if (otherE.hp <= 0) {
                        registerEnemyKill(otherE);
                    }
                }
            }
        });
        
        // 3. Gorgeous Particle visual representation
        // Shockwave rings
        particles.current.push({
            x: e.x, y: e.y, vx: 0, vy: 0,
            life: 0, maxLife: 30, color: '#ff3300', size: radius,
            type: 'shockwave', noGravity: true
        });
        particles.current.push({
            x: e.x, y: e.y, vx: 0, vy: 0,
            life: 0, maxLife: 20, color: '#ff9900', size: radius * 0.7,
            type: 'shockwave', noGravity: true
        });
        particles.current.push({
            x: e.x, y: e.y, vx: 0, vy: 0,
            life: 0, maxLife: 15, color: '#ffff00', size: radius * 0.4,
            type: 'shockwave', noGravity: true
        });
        
        // Fiery embers radiating
        for (let i = 0; i < 35; i++) {
            const ang = Math.random() * Math.PI * 2;
            const sp = 2 + Math.random() * 8;
            particles.current.push({
                x: e.x, y: e.y,
                vx: Math.cos(ang) * sp,
                vy: Math.sin(ang) * sp - (Math.random() * 2),
                life: 0, maxLife: 20 + Math.random() * 20,
                color: Math.random() < 0.6 ? '#ff4500' : (Math.random() < 0.8 ? '#ffaa00' : '#ffffff'),
                size: 3 + Math.random() * 5,
                noGravity: Math.random() < 0.5
            });
        }
        
        // Grey smoke clouds
        for (let i = 0; i < 15; i++) {
            const ang = Math.random() * Math.PI * 2;
            const sp = 0.5 + Math.random() * 1.5;
            particles.current.push({
                x: e.x + (Math.random() - 0.5) * 20,
                y: e.y + (Math.random() - 0.5) * 20,
                vx: Math.cos(ang) * sp,
                vy: -Math.random() * 1.0,
                life: 0, maxLife: 40 + Math.random() * 25,
                color: 'rgba(120, 120, 120, 0.5)',
                size: 8 + Math.random() * 12,
                noGravity: true
            });
        }
    };

    // Applies custom dynamic on-hit statuses upon damaging an enemy
    const applyOnHitEffects = (e: Enemy, actualDmg: number) => {
        if (!e || e.hp <= 0) return;
        
        const st = stats.current;
        
        // Bomber fuse start: when the bomber takes its FIRST hit from player
        if (e.type === 'bomber' && e.fuseTimer === undefined) {
            e.fuseTimer = 120; // 2 seconds at 60fps
            e.isIgnited = true;
            if (e.originalSpeed === undefined) {
                e.originalSpeed = e.speed;
            }
            if (audio.playBossCharge) {
                audio.playBossCharge();
            }
        }
        
        // 1. Corrosion (Acid Shred)
        if (st.acidShred) {
            e.corrodedArmorRatio = Math.max(0.1, (e.corrodedArmorRatio || 1) - st.acidShred);
            // Spawn mini acid/corrosive light-green sparks
            for (let i = 0; i < 2; i++) {
                particles.current.push({
                    x: e.x + (Math.random() - 0.5) * 10, y: e.y + (Math.random() - 0.5) * 10,
                    vx: (Math.random() - 0.5) * 1.2, vy: -Math.random() * 1.5,
                    life: 0, maxLife: 15, color: '#a3e635', size: 1.5
                });
            }
        }
        
        // 2. Slow On Hit Chance
        if (st.slowOnHitChance && Math.random() < st.slowOnHitChance) {
            e.slowTimer = 180; // 3 seconds at 60fps
            e.slowRatio = st.slowIntensity || 0.30;
            if (e.originalSpeed === undefined) {
                e.originalSpeed = e.speed;
            }
            e.speed = e.originalSpeed * (1 - e.slowRatio);
            // Ambient icy sparkles
            for (let i = 0; i < 2; i++) {
                particles.current.push({
                    x: e.x + (Math.random() - 0.5) * 10, y: e.y + (Math.random() - 0.5) * 10,
                    vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6,
                    life: 0, maxLife: 18, color: '#38bdf8', size: 1.2
                });
            }
        }
        
        // 3. Poison On Hit Chance
        const poisonChance = st.poisonChance || 0;
        if (poisonChance > 0 && Math.random() < poisonChance) {
            e.poisonTimer = (st.poisonDurationSec || 5) * 60; // in frames
            e.poisonDamagePerSec = st.poisonDmg || 5;
            // Purple/toxic sparkles
            for (let i = 0; i < 3; i++) {
                particles.current.push({
                    x: e.x + (Math.random() - 0.5) * 14, y: e.y + (Math.random() - 0.5) * 14,
                    vx: (Math.random() - 0.5) * 1.0, vy: -Math.random() * 1.5,
                    life: 0, maxLife: 20, color: '#c084fc', size: 1.5
                });
            }
        }
        
        // 4. Lifesteal on Poisoned Targets
        if (st.lifestealOnPoison && e.poisonTimer && e.poisonTimer > 0) {
            const steal = Math.max(1, Math.floor(actualDmg * st.lifestealOnPoison));
            st.hp = Math.min(st.maxHp, st.hp + steal);
            // Green healing dots travelling from hit target to player
            particles.current.push({
                x: e.x, y: e.y,
                vx: (player.current.x - e.x) * 0.08, vy: (player.current.y - e.y) * 0.08,
                life: 0, maxLife: 15, color: '#4ade80', size: 2
            });
        }
    };

    // Game Loop
    const loop = (timestamp: number) => {
        requestID = requestAnimationFrame(loop);
        
        if (pauseRef.current || isGameOver.current) return;
        
        const minFrameTime = 1000 / settingsRef.current.fps;
        let dt = timestamp - lastFrameTime;
        if (dt < minFrameTime - 2) return;
        lastFrameTime = timestamp;

        // Calculate actual FPS
        frameCount++;
        if (!lastFpsUpdateTime) {
            lastFpsUpdateTime = timestamp;
        }
        if (timestamp - lastFpsUpdateTime >= 500) {
            fps = Math.round((frameCount * 1000) / (timestamp - lastFpsUpdateTime || 1));
            frameCount = 0;
            lastFpsUpdateTime = timestamp;
        }
        
        // Cap dt to avoid huge jumps if there was a major lag spike or tab resume (max 10 fps equivalent jump)
        if (dt > 100) dt = 100;
        
        // Time scale based on 60fps reference
        const timeScale = dt / (1000 / 60);
        const time = Date.now() / 1000;

        // Check for secret room discovery and ambushes
        rooms.current.forEach((r, idx) => {
            const px = player.current.x / GRID_SIZE;
            const py = player.current.y / GRID_SIZE;
            const inRoom = (px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h);

            if (r.isSecret && !revealedRooms.current.has(idx)) {
                const wallBroken = r.wallX !== undefined && r.wallY !== undefined && dungeon.current[r.wallY]?.[r.wallX] === 1;
                if (wallBroken || inRoom) {
                    revealedRooms.current.add(idx);
                    revealOpacities.current[idx] = 1.0;
                    audio.playSecretRoomSound();

                    if (r.isSecret) {
                        stats.current.secretRoomsFound++;
                        showTrophyProgress('neon_archivist');
                        checkTrophies();
                    }
                                       
                    if (r.isMerchant) {
                        setIsMerchantRoom(true);
                        setShowShop(true);
                        pauseRef.current = true;
                    }

                    // Particles for discovery
                    for (let i = 0; i < 30; i++) {
                        particles.current.push({
                            x: r.cx * GRID_SIZE,
                            y: r.cy * GRID_SIZE,
                            vx: (Math.random() - 0.5) * 15,
                            vy: (Math.random() - 0.5) * 15,
                            life: 0,
                            maxLife: 60,
                            color: '#fff',
                            size: 4
                        });
                    }
                }
            }

            // Special Event: Ambush!
            // Only trigger if player has entered the physical room boundaries
            if (r.isAmbush && !triggeredAmbushes.current.has(idx) && inRoom) {
                triggeredAmbushes.current.add(idx);
                
                // Mark all existing enemies in this room as ambush enemies
                enemies.current.forEach(e => {
                    if (e.hp > 0 && e.x >= r.x * GRID_SIZE && e.x <= (r.x + r.w) * GRID_SIZE && e.y >= r.y * GRID_SIZE && e.y <= (r.y + r.h) * GRID_SIZE) {
                        e.isAmbushEnemy = true;
                    }
                });
                
                // Spawn special specters
                        for (let i = 0; i < 3 + Math.floor(stats.current.lvl / 10); i++) {
                            if (!canSpawnEnemy('specter')) break;
                            const ang = Math.random() * Math.PI * 2;
                            const sx = r.cx * GRID_SIZE + Math.cos(ang) * 40;
                            const sy = r.cy * GRID_SIZE + Math.sin(ang) * 40;
                            enemies.current.push({
                                id: Math.random(),
                                x: sx, y: sy,
                                hp: 100 + stats.current.lvl * 20,
                                maxHp: 100 + stats.current.lvl * 20,
                                size: 16,
                                type: 'specter',
                                speed: 1.2,
                                level: stats.current.lvl,
                                state: 'chase',
                                attackCd: 30,
                                isAmbushEnemy: true,
                                ...getEnemyDefense('specter')
                            });
                        }
                        
                        // Spawn standard room enemies as part of the dynamic ambush
                        const defaultCount = 4 + Math.floor(Math.random() * 3) + Math.min(8, Math.floor(stats.current.lvl / 15));
                        for (let i = 0; i < defaultCount; i++) {
                            const types: Enemy['type'][] = ['warrior', 'archer', 'mage', 'vampire', 'charger', 'bomber'];
                            const type = types[Math.floor(Math.random() * types.length)];
                            if (!canSpawnEnemy(type)) break;
                            const sx = (r.x + 1 + Math.random() * (r.w - 2)) * GRID_SIZE + GRID_SIZE / 2;
                            const sy = (r.y + 1 + Math.random() * (r.h - 2)) * GRID_SIZE + GRID_SIZE / 2;
                            const difficulty = settingsRef.current.difficulty || 3;
                            const hpMult = 0.5 + (difficulty - 1) * 0.25;
                            const speedMult = 0.8 + (difficulty - 1) * 0.1;

                            let hp = Math.floor((100 + stats.current.lvl * 25) * hpMult);
                            let speed = (1 + Math.random() * 0.5) * speedMult;
                            let size = 15;
                            if (type === 'archer') { speed = 1.8 * speedMult; hp = Math.floor((80 + stats.current.lvl * 12) * hpMult); }
                            else if (type === 'mage') { speed = 0.7 * speedMult; hp = Math.floor((120 + stats.current.lvl * 12) * hpMult); }
                            else if (type === 'vampire') { speed = 1.4 * speedMult; hp = Math.floor((110 + stats.current.lvl * 18) * hpMult); }
                            else if (type === 'charger') { speed = 0.8 * speedMult; hp = Math.floor((140 + stats.current.lvl * 30) * hpMult); size = 18; }
                            else if (type === 'bomber') { speed = 1.6 * speedMult; hp = Math.floor((50 + stats.current.lvl * 8) * hpMult); size = 12; }
                            
                            enemies.current.push({
                                id: Math.random(),
                                x: sx, y: sy,
                                hp: hp,
                                maxHp: hp,
                                size: size,
                                type: type,
                                speed: speed,
                                level: stats.current.lvl,
                                state: 'chase',
                                attackCd: 30,
                                isAmbushEnemy: true,
                                ...getEnemyDefense(type)
                            });
                        }

                        activeAmbush.current = { 
                            x: r.x * GRID_SIZE, 
                            y: r.y * GRID_SIZE, 
                            w: r.w * GRID_SIZE, 
                            h: r.h * GRID_SIZE,
                            roomId: idx
                        };
                        levelMessage.current = { text: settingsRef.current.language === 'it' ? 'IMBOSCATA!' : 'AMBUSH!', timer: 120 };
            }
        });
        
        // Minimap Exploration
        const playerGX = Math.floor(player.current.x / GRID_SIZE);
        const playerGY = Math.floor(player.current.y / GRID_SIZE);
        const vision = 4;
        for (let y = -vision; y <= vision; y++) {
            for (let x = -vision; x <= vision; x++) {
                const tx = playerGX + x;
                const ty = playerGY + y;
                if (ty >= 0 && ty < dungeon.current.length && tx >= 0 && tx < dungeon.current[0].length) {
                    exploredTiles.current.add(`${tx},${ty}`);
                }
            }
        }

        // Update reveal opacities
        Object.keys(revealOpacities.current).forEach(idx => {
            const id = parseInt(idx);
            if (revealOpacities.current[id] > 0) {
                revealOpacities.current[id] -= 0.02 * timeScale;
                if (revealOpacities.current[id] < 0) revealOpacities.current[id] = 0;
            }
        });

        // PLAYER MOVEMENT
        const gp = navigator.getGamepads()[0];
        const gpZ = gp && gp.buttons[0].pressed; // Physical attack (Button 0)
        const gpX = gp && gp.buttons[2].pressed; // Magic is X (Button 2)
        const gpStart = gp && gp.buttons[9].pressed; // Pause (Button 9)
        
        if (gpStart && !lastGamepadPressedStart.current) {
            pauseRef.current = !pauseRef.current;
            setIsPaused(pauseRef.current);
        }
        lastGamepadPressedStart.current = !!gpStart;

        if (gpZ && !lastGamepadPressedZ.current) player.current.lastAttackTime = Date.now();
        lastGamepadPressedZ.current = !!gpZ;
        lastGamepadPressedX.current = !!gpX;

        const curKeys = settingsRef.current.keys;
        const speedBonus = 1 + (stats.current.speedLevel * 0.05); // 5% per level
        const speed = 4 * timeScale * speedBonus;
        let dx = 0;
        let dy = 0;

        // Burst Firing Logic for Pistola and Pistola Mitica
        if (player.current.burstCount > 0) {
            player.current.burstTimer -= 1 * timeScale;
            if (player.current.burstTimer <= 0) {
                player.current.burstCount--;
                
                const weapon = WEAPONS[stats.current.physicalWeapon] || WEAPONS['Spada Base'];
                const isMythic = weapon.special_behavior === 'mythic_burst';
                const isTruth = weapon.special_behavior === 'truth_burst';
                const isLaser = weapon.id === 'pistol_laser';
                const isBubble = weapon.special_behavior === 'bubble_shot';
                const isRocket = weapon.special_behavior === 'homing_rocket';
                
                player.current.burstTimer = isMythic ? 4 : (isTruth ? 3 : (isLaser ? 3 : (isBubble ? 6 : (isRocket ? 10 : 5)))); 
                const pSpeed = isMythic ? 15 : (isTruth ? 18 : (isLaser ? 16 : (isBubble ? 3.5 : (isRocket ? 6 : 12)))); 
                const stacks = stats.current.physicalStacks;
                const shotCount = isMythic ? stacks + 3 : (isTruth ? stacks + 2 : (isLaser ? stacks : (isBubble ? stacks : (isRocket ? 1 : stacks)))); 
                const spawnDist = 15;
                
                for (let i = 0; i < shotCount; i++) {
                    let angle = player.current.aimAngle;
                    let spawnOffsetX = Math.cos(angle) * spawnDist;
                    let spawnOffsetY = Math.sin(angle) * spawnDist;
 
                    if (isLaser) {
                        // Parallel lasers, spread perpendicularly
                        const spreadFactor = 8; // distance between parallel lasers
                        const offset = (i - (shotCount - 1) / 2) * spreadFactor;
                        if (player.current.facing === 'up' || player.current.facing === 'down') {
                            spawnOffsetX += offset;
                        } else {
                            spawnOffsetY += offset;
                        }
                    } else if (!isRocket) {
                        // Add tiny inaccuracy and spread
                        angle += (i - (shotCount - 1) / 2) * (isMythic ? 0.08 : (isTruth ? 0.04 : (isBubble ? 0.15 : 0.05)));
                        angle += (Math.random() - 0.5) * (isMythic ? 0.2 : (isTruth ? 0.05 : (isBubble ? 0.2 : 0.1)));
                    }
                    
                    projectiles.current.push({
                         x: player.current.x + spawnOffsetX,
                         y: player.current.y + spawnOffsetY,
                         vx: Math.cos(angle) * pSpeed,
                         vy: Math.sin(angle) * pSpeed,
                         color: isMythic ? '#00ffff' : (isTruth ? '#ffffff' : (isLaser ? '#ff0000' : (isBubble ? weapon.color : (isRocket ? '#ff4500' : weapon.color)))),
                         isEnemy: false,
                         isPhysical: true,
                         damageMult: isMythic ? 0.9 : (isTruth ? 1.2 : (isLaser ? 0.8 : (isBubble ? 0.5 : (isRocket ? 1.5 : 0.6)))),
                         pierce: isTruth,
                         hitIds: (isTruth || isBubble || isRocket) ? [] : undefined,
                         isBubble: isBubble,
                         isLaser: isLaser,
                         homing: (isBubble || isRocket) ? true : undefined,
                         homingRange: isBubble ? 400 : (isRocket ? 800 : undefined),
                         special_behavior: isRocket ? 'homing_rocket' : undefined,
                         // Larger width based on level! (simulate "massive beam")
                         size: isBubble ? 60 : (isLaser ? 3 + Math.floor(stacks / 2) : undefined)
                    });
                }
                
                if (isLaser) audio.playLaserSound(); else audio.playShootSound(); 
                shake.current.time = isMythic ? 3 : (isTruth ? 1 : (isLaser ? 2 : 2));
                shake.current.intensity = isMythic ? 2 : (isTruth ? 1 : (isLaser ? 1.5 : 1));
            }
        }

        const isDash = keys.current['Shift'] || keys.current[' '] || (gp && gp.buttons[5] && gp.buttons[5].pressed) || (gp && gp.buttons[1] && gp.buttons[1].pressed); // Dash on Shift/Space or RB/B

        const accel = 1.0 * timeScale;
        const decel = 0.8 * timeScale;
        const maxSpeed = 5 * timeScale;

        let inputX = 0;
        let inputY = 0;

        if (joystickRef.current.active) {
            const jdx = joystickRef.current.curX - joystickRef.current.startX;
            const jdy = joystickRef.current.curY - joystickRef.current.startY;
            const dist = Math.hypot(jdx, jdy);
            if (dist > 5) {
                inputX = jdx / Math.min(40, Math.max(20, dist));
                inputY = jdy / Math.min(40, Math.max(20, dist));
                // Cap to 1/-1
                inputX = Math.max(-1, Math.min(1, inputX));
                inputY = Math.max(-1, Math.min(1, inputY));
                
                player.current.aimAngle = Math.atan2(inputY, inputX);
            }
        }
        
        if (gp) {
            // Analog stick indices for movement and aiming
            const moveX = gp.axes[0];
            const moveY = gp.axes[1];
            const aimStickX = gp.axes[2];
            const aimStickY = gp.axes[3];
            
            const stickDeadzone = 0.15;
            
            // Movement stick
            if (Math.hypot(moveX, moveY) > stickDeadzone) {
                inputX = moveX;
                inputY = moveY;
            }
            
            // Aiming stick (360 degrees)
            if (Math.hypot(aimStickX, aimStickY) > stickDeadzone) {
                player.current.aimAngle = Math.atan2(aimStickY, aimStickX);
                // Update facing based on aim stick
                const adx = Math.abs(aimStickX);
                const ady = Math.abs(aimStickY);
                if (adx > ady) {
                    player.current.facing = aimStickX > 0 ? 'right' : 'left';
                } else {
                    player.current.facing = aimStickY > 0 ? 'down' : 'up';
                }
            } else if (Math.hypot(moveX, moveY) > stickDeadzone) {
                // If not using aim stick, aim in movement direction
                player.current.aimAngle = Math.atan2(moveY, moveX);
            }
            
            // D-Pad
            if (gp.buttons[14].pressed) inputX = -1;
            if (gp.buttons[15].pressed) inputX = 1;
            if (gp.buttons[12].pressed) inputY = -1;
            if (gp.buttons[13].pressed) inputY = 1;
        }

        const kbUp = keys.current[curKeys.up] || (curKeys.up === 'w' && keys.current['ArrowUp']);
        const kbDown = keys.current[curKeys.down] || (curKeys.down === 's' && keys.current['ArrowDown']);
        const kbLeft = keys.current[curKeys.left] || (curKeys.left === 'a' && keys.current['ArrowLeft']);
        const kbRight = keys.current[curKeys.right] || (curKeys.right === 'd' && keys.current['ArrowRight']);

        if (kbLeft) inputX = -1;
        if (kbRight) inputX = 1;
        if (kbUp) inputY = -1;
        if (kbDown) inputY = 1;

        // Sync aimAngle with movement if not aiming with stick or joystick
        if ((kbLeft || kbRight || kbUp || kbDown) && (!gp || Math.hypot(gp.axes[2], gp.axes[3]) <= 0.15)) {
            player.current.aimAngle = Math.atan2(inputY, inputX);
        }

        if (player.current.dashCd > 0) player.current.dashCd -= 1 * timeScale;

        if (player.current.dashTimer > 0) {
            player.current.dashTimer -= 1 * timeScale;
            player.current.vx = player.current.dashDirX * 14 * timeScale * speedBonus;
            player.current.vy = player.current.dashDirY * 14 * timeScale * speedBonus;

            // Ghost trailing effect
            const pColor = heroClass === 'mage' ? 'rgba(170, 85, 255, 0.4)' : (heroClass === 'paladin' ? 'rgba(255, 170, 0, 0.4)' : 'rgba(0, 255, 255, 0.4)');
            for (let i = 0; i < 2; i++) {
                particles.current.push({
                    x: player.current.x + (Math.random() - 0.5) * 10,
                    y: player.current.y + (Math.random() - 0.5) * 10,
                    vx: -player.current.vx * 0.1, vy: -player.current.vy * 0.1,
                    life: 0, maxLife: 15, 
                    color: pColor,
                    size: 20
                });
            }

            if (Math.random() < 0.5) {
                particles.current.push({
                    x: player.current.x + (Math.random() - 0.5) * 20,
                    y: player.current.y + (Math.random() - 0.5) * 20,
                    vx: 0, vy: 0, life: 0, maxLife: 15, size: 3, color: '#ffffff'
                });
            }
        } else {
            // Analog inputX/Y from gamepad and keyboard are already calculated above

            if (inputX !== 0 || inputY !== 0) {
                const len = Math.hypot(inputX, inputY);
                if (len > 1) {
                    inputX /= len;
                    inputY /= len;
                }
            }

            if (isDash && player.current.dashCd <= 0 && (inputX !== 0 || inputY !== 0)) {
                player.current.dashTimer = 10;
                player.current.dashCd = 50;
                player.current.dashDirX = inputX;
                player.current.dashDirY = inputY;
                audio.playDashSound();
                player.current.flashTimer = 10;
            } else {
                if (inputX !== 0) {
                    player.current.vx += inputX * accel;
                    if (Math.abs(player.current.vx) > maxSpeed) player.current.vx = Math.sign(player.current.vx) * maxSpeed;
                } else {
                    if (Math.abs(player.current.vx) < decel) player.current.vx = 0;
                    else player.current.vx -= Math.sign(player.current.vx) * decel;
                }

                if (inputY !== 0) {
                    player.current.vy += inputY * accel;
                    if (Math.abs(player.current.vy) > maxSpeed) player.current.vy = Math.sign(player.current.vy) * maxSpeed;
                } else {
                    if (Math.abs(player.current.vy) < decel) player.current.vy = 0;
                    else player.current.vy -= Math.sign(player.current.vy) * decel;
                }
            }
        }

        dx = player.current.vx;
        dy = player.current.vy;

        if (inputX < -0.1) player.current.facing = 'left';
        else if (inputX > 0.1) player.current.facing = 'right';
        else if (inputY < -0.1) player.current.facing = 'up';
        else if (inputY > 0.1) player.current.facing = 'down';
        else if (dx < -0.1) player.current.facing = 'left';
        else if (dx > 0.1) player.current.facing = 'right';
        else if (dy < -0.1) player.current.facing = 'up';
        else if (dy > 0.1) player.current.facing = 'down';

        // Snap to axis on release for precision in corridors
        const isAimingWithStick = gp && Math.hypot(gp.axes[2], gp.axes[3]) > 0.15;
        const isAimingWithJoystick = joystickRef.current.active;
        if (inputX === 0 && inputY === 0 && !isAimingWithStick && !isAimingWithJoystick) {
            if (player.current.facing === 'left') player.current.aimAngle = Math.PI;
            else if (player.current.facing === 'right') player.current.aimAngle = 0;
            else if (player.current.facing === 'up') player.current.aimAngle = -Math.PI / 2;
            else if (player.current.facing === 'down') player.current.aimAngle = Math.PI / 2;
        }

        // Fire magic projectile
        const isMagicPressed = keys.current[curKeys.fire2] || (curKeys.fire2 === 'x' && keys.current['x']) || gpX;
        const isPhysPressed = keys.current[curKeys.fire1] || (curKeys.fire1 === 'z' && keys.current['z']) || gpZ || keys.current['1'];
        
        let pickingUpWeapon = false;
        if (isPhysPressed) {
            for (let i = 0; i < loot.current.length; i++) {
                const l = loot.current[i];
                if (l.type === 'weapon') {
                    const dist = Math.hypot(l.x - player.current.x, l.y - player.current.y);
                    if (dist < 75) {
                        const isIdentical = stats.current.physicalWeapon === l.name || stats.current.magicWeapon === l.name;
                        const canPickupInAmbush = !activeAmbush.current || isIdentical;
                        if (canPickupInAmbush) {
                            pickingUpWeapon = true;
                            break;
                        }
                    }
                }
            }
        }

        const currentMagicWeapon = WEAPONS[stats.current.magicWeapon] || WEAPONS['Bacchetta Base'];
        
        if (currentMagicWeapon.special_behavior === 'auto_star' && player.current.magicCd <= 0) {
            let nearestEnemy = null;
            let minDist = Infinity;
            enemies.current.forEach(e => {
                if(e.hp > 0) {
                   const dist = Math.hypot(e.x - player.current.x, e.y - player.current.y);
                   if (dist < currentMagicWeapon.range && dist < minDist) {
                       if (hasLineOfSight(player.current.x, player.current.y, e.x, e.y) || dist < 192) {
                           minDist = dist;
                           nearestEnemy = e;
                       }
                   }
                }
            });
            
            if (nearestEnemy) {
                player.current.magicCd = currentMagicWeapon.cooldown;
                let angle = Math.atan2(nearestEnemy.y - player.current.y, nearestEnemy.x - player.current.x);

                const pSpeed = 8 * (1 + (stats.current.lvl - 1) * 0.02);
                
                projectiles.current.push({
                    x: player.current.x,
                    y: player.current.y,
                    vx: Math.cos(angle) * pSpeed,
                    vy: Math.sin(angle) * pSpeed,
                    homing: true,
                    homingRange: currentMagicWeapon.homingRange || 400,
                    magnetic: true,
                    color: currentMagicWeapon.color,
                    isEnemy: false,
                    mStacks: stats.current.magicStacks,
                    special_behavior: 'auto_star'
                });
                audio.playShootSound();
            }
        }

        if (isMagicPressed && !pickingUpWeapon && (currentMagicWeapon.special_behavior !== 'auto_star' || currentMagicWeapon.id === 'star_wand')) {
            const mWeapon = currentMagicWeapon;
            const mStacks = stats.current.magicStacks;
            const manaCostRed = stats.current.manaCostRed || 0;
            const baseMana = mWeapon.id === 'star_wand' ? 35 : (mWeapon.special_behavior === 'eclipse' ? 5 : 10);
            const manaCost = (baseMana * Math.max(1, mStacks / 2)) * (1 - manaCostRed);
            
            if (player.current.magicCd <= 0 && stats.current.mp >= manaCost) {
                stats.current.mp -= manaCost;
                if (stats.current.celestialShieldActive) {
                    stats.current.hp = Math.min(stats.current.maxHp, stats.current.hp + 5);
                    stats.current.mp = Math.min(stats.current.maxMp, stats.current.mp + 5);
                }
                const magCdr = (stats.current.cooldownReduction || 0) + (stats.current.magicCooldownReduction || 0);
                const aSpeed = stats.current.attackSpeed || 1;
                player.current.magicCd = Math.max(5, (((mWeapon.cooldown - (mStacks * 2)) / (1 + (stats.current.lvl - 1) * 0.02)) * (1 - magCdr)) / aSpeed);
                shake.current.time = mWeapon.id === 'star_wand' ? 12 : 5;
                
                const pSpeed = 6 * (1 + (stats.current.lvl - 1) * 0.02);
                
                // Magic Critical
                const isCrit = Math.random() < stats.current.critChance;
                const mBaseDmgMult = stats.current.magicDmgMult || 1;
                let mDmgMult = (isCrit ? stats.current.critDamage : 1) * mBaseDmgMult;
                if (mWeapon.special_behavior === 'eclipse') mDmgMult *= 2;
                if (mWeapon.special_behavior === 'obsidian_impact') mDmgMult *= 2.2;
                
                // Multi-shot based on stacks (5 for star_wand)
                const shotCount = mWeapon.id === 'star_wand' ? 5 : mStacks;
                
                let attackAngle = player.current.aimAngle;
                if (mWeapon.aimNearest) {
                    let nearestEnemy = null;
                    let minDist = 600; // Search range
                    enemies.current.forEach(e => {
                        if (e.hp > 0) {
                            const dist = Math.hypot(e.x - player.current.x, e.y - player.current.y);
                            if (dist < minDist) {
                                minDist = dist;
                                nearestEnemy = e;
                            }
                        }
                    });
                    if (nearestEnemy) {
                        attackAngle = Math.atan2(nearestEnemy.y - player.current.y, nearestEnemy.x - player.current.x);
                    }
                }

                for (let i = 0; i < shotCount; i++) {
                    let vx = 0; let vy = 0;
                    let angle = attackAngle;
                    const spawnDist = 15;
                    let spawnOffsetX = Math.cos(angle) * spawnDist;
                    let spawnOffsetY = Math.sin(angle) * spawnDist;
                    
                    if (mWeapon.id === 'ice_scepter') {
                        const isCepSpeed = pSpeed * 2.5;
                        vx = Math.cos(angle) * isCepSpeed;
                        vy = Math.sin(angle) * isCepSpeed;
                    } else if (mWeapon.id === 'star_wand') {
                        angle += (i - (shotCount - 1) / 2) * 0.18;
                        vx = Math.cos(angle) * pSpeed * 1.3;
                        vy = Math.sin(angle) * pSpeed * 1.3;
                    } else {
                        angle += (i - (shotCount - 1) / 2) * 0.2;
                        vx = Math.cos(angle) * pSpeed;
                        vy = Math.sin(angle) * pSpeed;
                    }

                    if (mWeapon.projectile_behavior === 'fast') {
                        vx *= 1.8;
                        vy *= 1.8;
                    }

                    projectiles.current.push({
                        x: player.current.x + spawnOffsetX,
                        y: player.current.y + spawnOffsetY,
                        vx: vx,
                        vy: vy,
                        curve: mWeapon.curve,
                        homing: mWeapon.homing || mWeapon.projectile_behavior === 'homing' || mWeapon.id === 'star_wand',
                        homingRange: mWeapon.homingRange || (mWeapon.projectile_behavior === 'homing' || mWeapon.id === 'star_wand' ? 400 : undefined),
                        magnetic: mWeapon.magnetic || mWeapon.id === 'star_wand',
                        aoeRadius: mWeapon.aoeRadius,
                        isHighLevel: mStacks >= 3,
                        color: mWeapon.id === 'star_wand' ? '#ffd700' : mWeapon.color,
                        isEnemy: false, // Explicitly defined
                        mStacks: mStacks,
                        special_behavior: mWeapon.id === 'star_wand' ? 'auto_star' : mWeapon.special_behavior,
                        isCritical: isCrit,
                        damageMult: mWeapon.id === 'star_wand' ? mDmgMult * 5.0 : mDmgMult,
                        isIceCrystal: mWeapon.id === 'ice_scepter',
                        isLegendaryStar: mWeapon.id === 'star_wand'
                    });

                    // Add magic launch particles
                    for (let j = 0; j < 2; j++) {
                        particles.current.push({
                            x: player.current.x + spawnOffsetX,
                            y: player.current.y + spawnOffsetY,
                            vx: vx * 0.3 + (Math.random() - 0.5) * 4,
                            vy: vy * 0.3 + (Math.random() - 0.5) * 4,
                            life: 0, maxLife: 20 + Math.random() * 20,
                            color: mWeapon.color,
                            size: 2 + Math.random() * 3,
                            rotation: Math.random() * Math.PI * 2,
                            vr: (Math.random() - 0.5) * 0.4
                        });
                    }
                }
            }
        }
        if (player.current.magicCd > 0) player.current.magicCd -= 1 * timeScale;
        if (player.current.attackCd > 0) player.current.attackCd -= 1 * timeScale;

        if (isPhysPressed && !lastPhysPressed.current && slotMachineStateRef.current?.active) {
            document.getElementById('slot-stop-btn')?.click();
        }
        lastPhysPressed.current = isPhysPressed;
        if (isPhysPressed && !pickingUpWeapon) {
            const weapon = WEAPONS[stats.current.physicalWeapon] || WEAPONS['Spada Base'];
            
            // Auto aim for physical weapon if it has aimNearest property
            if (weapon.aimNearest && player.current.attackCd <= 0) {
                let nearestEnemy = null;
                let minDist = 600;
                enemies.current.forEach(e => {
                    if (e.hp > 0) {
                        const dist = Math.hypot(e.x - player.current.x, e.y - player.current.y);
                        if (dist < minDist) {
                            minDist = dist;
                            nearestEnemy = e;
                        }
                    }
                });
                if (nearestEnemy) {
                    player.current.aimAngle = Math.atan2(nearestEnemy.y - player.current.y, nearestEnemy.x - player.current.x);
                }
            }
            if ((weapon.special_behavior === 'burst' || weapon.special_behavior === 'mythic_burst' || weapon.special_behavior === 'truth_burst' || weapon.special_behavior === 'bubble_shot' || weapon.special_behavior === 'homing_rocket') && player.current.attackCd <= 0 && player.current.burstCount <= 0) {
                player.current.burstCount = weapon.special_behavior === 'mythic_burst' ? 5 : (weapon.special_behavior === 'truth_burst' ? 6 : (weapon.id === 'pistol_laser' ? 4 : (weapon.special_behavior === 'bubble_shot' ? 3 : (weapon.special_behavior === 'homing_rocket' ? 1 : 3))));
                player.current.burstTimer = 0; // Fire immediately
                const isPistol = weapon.id.includes('pistol');
                const physCdr = (stats.current.cooldownReduction || 0) + (stats.current.physicalCooldownReduction || 0);
                const aSpeed = stats.current.attackSpeed || 1;
                player.current.attackCd = ((weapon.cooldown / (1 + (stats.current.lvl - 1) * 0.02)) * (isPistol ? 0.7 : 1)) * (1 - physCdr) / aSpeed;
            }

            if (weapon.id === 'thunder_hammer' || weapon.id === 'mythic_pistol' || weapon.id === 'pistol_truth' || weapon.id === 'astral_spear' || weapon.id === 'castle_whip' || weapon.id === 'bubble_gun' || weapon.id === 'bubble_wand_gold' || weapon.id === 'jade_boomerang' || weapon.id === 'rocket_launcher') {
                const stacks = stats.current.physicalStacks;
                player.current.chargeTimer += 1 * timeScale;
                // Visual feedback for charging
                if (player.current.chargeTimer > 30) {
                    const prob = 0.1 + (stacks * 0.15);
                    if (Math.random() < prob) {
                        const angle = Math.random() * Math.PI * 2;
                        const dist = 20 + Math.random() * 10;
                        particles.current.push({
                            x: player.current.x + Math.cos(angle) * dist,
                            y: player.current.y + Math.sin(angle) * dist,
                            vx: -Math.cos(angle) * 3, vy: -Math.sin(angle) * 3,
                            life: 0, maxLife: 15, color: weapon.id === 'mythic_pistol' ? '#ffff00' : (weapon.id === 'pistol_truth' ? '#ffffff' : (weapon.id === 'astral_spear' ? '#00fbff' : (weapon.id === 'castle_whip' ? '#ff0000' : (weapon.id === 'bubble_gun' || weapon.id === 'bubble_wand_gold' ? '#00ccff' : (weapon.id === 'jade_boomerang' ? '#00ffaa' : '#00ffff'))))), size: 0.8 + (stacks * 0.2)
                        });
                    }
                }

                if (player.current.attackCd <= 0) {
                    let hitSomething = false;

                    // Merchant melee hit
                    rooms.current.forEach((r, idx) => {
                        if (r.isMerchant && revealedRooms.current.has(idx)) {
                            const cx = r.cx * GRID_SIZE + GRID_SIZE / 2;
                            const cy = r.cy * GRID_SIZE + GRID_SIZE / 2;
                            const dx = cx - player.current.x;
                            const dy = cy - player.current.y;
                            const dist = Math.hypot(dx, dy);

                            if (dist <= GRID_SIZE * 1.5) {
                                // Check standard 4-way facing direction towards merchant
                                let isFacing = false;
                                if (player.current.facing === 'left' && dx < 0 && Math.abs(dy) < Math.abs(dx)) {
                                    isFacing = true;
                                } else if (player.current.facing === 'right' && dx > 0 && Math.abs(dy) < Math.abs(dx)) {
                                    isFacing = true;
                                } else if (player.current.facing === 'up' && dy < 0 && Math.abs(dx) < Math.abs(dy)) {
                                    isFacing = true;
                                } else if (player.current.facing === 'down' && dy > 0 && Math.abs(dx) < Math.abs(dy)) {
                                    isFacing = true;
                                }

                                // Or check aiming direction (aimAngle is within 60 degrees of merchant)
                                const angleToMerchant = Math.atan2(dy, dx);
                                const angleDiff = Math.atan2(Math.sin(angleToMerchant - player.current.aimAngle), Math.cos(angleToMerchant - player.current.aimAngle));
                                const isAimingAtMerchant = Math.abs(angleDiff) < Math.PI / 3;

                                if (isFacing || isAimingAtMerchant) {
                                    if (!showShop && !isMerchantRoom) {
                                        audio.playSecretRoomSound(); 
                                        setIsMerchantRoom(true);
                                        setShowShop(true);
                                        pauseRef.current = true;
                                        hitSomething = true;
                                    }
                                }
                            }
                        }
                    });

                    // Melee chest hit
                    chests.current.forEach(c => {
                        if (!c.opened) {
                            // Protection: immune if in secret room not yet revealed or during ambush
                            const ridx = secretTileToRoom.current[`${c.gridY}_${c.gridX}`];
                            if (ridx !== undefined && !revealedRooms.current.has(ridx)) return;
                            if (activeAmbush.current && ridx === activeAmbush.current.roomId) return;

                            const cx = c.gridX * GRID_SIZE + GRID_SIZE / 2;
                            const cy = c.gridY * GRID_SIZE + GRID_SIZE / 2;
                            if (Math.hypot(cx - player.current.x, cy - player.current.y) < weapon.range * 1.5) {
                                c.hp -= 50;
                                hitSomething = true;
                                if (c.hp <= 0) {
                                    c.opened = true;
                                    stats.current.score += 200;
                                    const difficulty = settingsRef.current.difficulty || 3;
                                    const diffMult = 1.4 - (difficulty - 1) * 0.1;
                                    if (difficulty < 3) {
                                        stats.current.exp += Math.floor(30 * diffMult); 
                                    }
                                    const gx = c.gridX;
                                    const gy = c.gridY;
                                    const isSecret = secretTileToRoom.current[`${gy}_${gx}`] !== undefined;
                                    if (c.containsDiamond) {
                                        spawnLoot(cx, cy, 'diamond');
                                    } else if (c.rarity === 'legendary') {
                                        audio.playLegendaryChestSound();
                                        pauseRef.current = true;
                                        setIsPaused(true);
                                        const results: Partial<LootItem>[] = [];
                                        results.push({ type: 'weapon', isMagic: false, rarityColor: '#ecc94b', name: 'Legendary ' + Math.floor(Math.random()*100) });
                                        results.push({ type: 'gem', color: '#ee82ee', value: 'Diamante Astrale' });
                                        results.push({ type: 'gold', color: '#FFD700', value: 300 });
                                        setSlotMachineState({ 
                                            active: true, 
                                            cx, 
                                            cy, 
                                            mode: 'spinning',
                                            reelMode: ['spinning', 'spinning', 'spinning'],
                                            resultItems: results,
                                            finalItems: [],
                                            appearTime: Date.now() 
                                        });
                                        audio.playCasinoMusic();
                                    } else if (!c.isGuaranteedWeaponChest) {
                                        spawnLoot(cx, cy, isSecret ? 'secret_chest' : 'chest');
                                    }
                                    if (c.isGuaranteedWeaponChest) {
                                        loot.current.push({
                                            x: cx, y: cy, z: 0, vz: -2, vx: 0, vy: 0,
                                            type: 'weapon', value: 1, color: '#ecc94b',
                                            rarityColor: '#ecc94b', isMagic: false,
                                            name: Object.keys(WEAPONS)[Math.floor(Math.random() * Object.keys(WEAPONS).length)],
                                            isIdentified: true,
                                            spawnTime: Date.now() / 1000
                                        });
                                    }
                                }
                            }
                        }
                    });

                    // Break walls in front
                    let wx = player.current.x;
                    let wy = player.current.y;
                    wx += Math.cos(player.current.aimAngle) * GRID_SIZE;
                    wy += Math.sin(player.current.aimAngle) * GRID_SIZE;
                    
                    const gridX = Math.floor(wx / GRID_SIZE);
                    const gridY = Math.floor(wy / GRID_SIZE);
                    const h = dungeon.current.length;
                    const w = dungeon.current[0].length;
                    if (gridY >= 0 && gridY < h && gridX >= 0 && gridX < w) {
                        if (dungeon.current[gridY][gridX] === 2) {
                            dungeon.current[gridY][gridX] = 1; 
                            hitSomething = true;
                            spawnLoot(gridX * GRID_SIZE + GRID_SIZE/2, gridY * GRID_SIZE + GRID_SIZE/2, 'wall');
                            for (let i = 0; i < 15; i++) {
                                particles.current.push({
                                    x: gridX * GRID_SIZE + GRID_SIZE/2, y: gridY * GRID_SIZE + GRID_SIZE/2,
                                    vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8 - 2,
                                    life: 0, maxLife: 30 + Math.random() * 30, color: '#a0aec0', size: 3 + Math.random() * 4
                                });
                            }
                        }
                    }

                    if (hitSomething) {
                        player.current.attackCd = 15;
                    }
                }
            }

            const isAstralSpearCharging = weapon.id === 'astral_spear' && player.current.chargeTimer > 10;
            if (player.current.attackCd <= 0 && !isAstralSpearCharging) {
                const stacks = stats.current.physicalStacks;
                const physCdr = (stats.current.cooldownReduction || 0) + (stats.current.physicalCooldownReduction || 0);
                const aSpeed = stats.current.attackSpeed || 1;
                
                // All weapons use standard logic for the initial swing/hitbox
                player.current.attackCd = ((weapon.cooldown / (1 + (stats.current.lvl - 1) * 0.02)) * (1 - physCdr)) / aSpeed;
                
                // Recoil for Void Spear: 1/4 tile = 16px
                if (weapon.id === 'void_spear') {
                    const kickDist = 16;
                    let kx = 0;
                    let ky = 0;
                    kx = -Math.cos(player.current.aimAngle) * kickDist;
                    ky = -Math.sin(player.current.aimAngle) * kickDist;

                    if (kx !== 0 || ky !== 0) {
                        // Check collision incrementally to slide as much as possible
                        for (let d = kickDist; d > 0; d--) {
                            const stepX = (kx / kickDist) * d;
                            const stepY = (ky / kickDist) * d;
                            if (!checkCollision(player.current.x + stepX, player.current.y + stepY)) {
                                player.current.x += stepX;
                                player.current.y += stepY;
                                break;
                            }
                        }
                    }
                }

                player.current.currentAttackHitIds.clear();
                player.current.harpoonedEnemyId = null;
                shake.current.time = weapon.type === 'sword' ? 8 : 4;
                    
                    if (weapon.type === 'sword' || weapon.type === 'hammer') {
                        // Melee logic
                        const reach = weapon.range + (stacks * 5);
                        const isHammer = weapon.type === 'hammer';

                        if (isHammer && player.current.attackCd === weapon.cooldown - 1) {
                             // Shockwave effect on start
                             audio.playElectricSound(0.3, 60); // Heavy sound
                             const numSparks = 3 + (stacks * 2);
                             for (let i = 0; i < numSparks; i++) {
                                 const angle = Math.random() * Math.PI * 2;
                                 const s = 3 + Math.random() * (2 + stacks);
                                 particles.current.push({
                                     x: player.current.x, y: player.current.y,
                                     vx: Math.cos(angle) * s, vy: Math.sin(angle) * s,
                                     life: 0, maxLife: 20 + stacks * 2, color: '#FFD700', size: 1.5 + stacks * 0.5
                                 });
                             }
                        }
                        
                        const checkHit = (tx: number, ty: number) => {
                            const dx = tx - player.current.x;
                            const dy = ty - player.current.y;
                            const dist = Math.hypot(dx, dy);
                            if (dist > reach) return false;
                            
                            const angleToEnemy = Math.atan2(dy, dx);
                            let targetFacingAngle = player.current.aimAngle;
                            
                            let diff = Math.abs(angleToEnemy - targetFacingAngle);
                            if (diff > Math.PI) diff = 2 * Math.PI - diff;
                            if (diff > (weapon.angle || Math.PI) / 2) return false;
                            
                            return true;
                        };

                        // All physical hit detection now synchronized with animation scia in render loop
                        // (Removed immediate click-based evaluation)

                        const reachX = player.current.x + Math.cos(player.current.aimAngle) * reach;
                        const reachY = player.current.y + Math.sin(player.current.aimAngle) * reach;
                        const gx = Math.floor(reachX / GRID_SIZE);
                        const gy = Math.floor(reachY / GRID_SIZE);

                        const h = dungeon.current.length;
                        const w = dungeon.current[0].length;
                        if (gy >= 0 && gy < h && gx >= 0 && gx < w && dungeon.current[gy][gx] === 2) {
                            dungeon.current[gy][gx] = 1; // Break wall
                            audio.playSecretRoomSound();
                            // Spawn optional skeletons
                            if (Math.random() < 0.5 && canSpawnEnemy('warrior')) {
                                enemies.current.push({ id: Math.random(), x: gx * GRID_SIZE + GRID_SIZE/2, y: gy * GRID_SIZE + GRID_SIZE/2, hp: 50 + stats.current.dungeonLevel * 10, maxHp: 50 + stats.current.dungeonLevel * 10, size: 12, type: 'warrior', speed: 1, level: stats.current.dungeonLevel, state: 'patrol', targetX: player.current.x, targetY: player.current.y, attackCd: 0, dir: 'down', physicalDefense: 10, magicalDefense: 0 });
                            }
                        }
                        chests.current.forEach(c => {
                            if (!c.opened) {
                                // Protection: immune if in secret room not yet revealed or during ambush
                                const ridx = secretTileToRoom.current[`${c.gridY}_${c.gridX}`];
                                if (ridx !== undefined && !revealedRooms.current.has(ridx)) return;
                                if (activeAmbush.current && ridx === activeAmbush.current.roomId) return;

                                const cx = c.gridX * GRID_SIZE + GRID_SIZE / 2;
                                const cy = c.gridY * GRID_SIZE + GRID_SIZE / 2;
                                if (checkHit(cx, cy)) {
                                    c.hp -= 30;
                                    if (c.hp <= 0) {
                                        c.opened = true;
                                        stats.current.score += 200;
                                        const difficulty = settingsRef.current.difficulty || 3;
                                        const diffMult = 1.4 - (difficulty - 1) * 0.1;
                                        if (difficulty < 3) {
                                            stats.current.exp += Math.floor(30 * diffMult); // Small mob exp
                                        }
                                        if (c.containsDiamond) {
                                            spawnLoot(cx, cy, 'diamond');
                                        } else if (c.rarity === 'legendary') {
                                            audio.playLegendaryChestSound();
                                            pauseRef.current = true;
                                            setIsPaused(true);
                                            
                                            // Prepare results
                                            const results: Partial<LootItem>[] = [];
                                            results.push({ type: 'weapon', isMagic: false, rarityColor: '#ecc94b', name: 'Legendary ' + Math.floor(Math.random()*100) });
                                            results.push({ type: 'gem', color: '#ee82ee', value: 'Diamante Astrale' });
                                            results.push({ type: 'gold', color: '#FFD700', value: 300 });

                                            setSlotMachineState({ 
                                            active: true, 
                                            cx, 
                                            cy, 
                                            mode: 'spinning',
                                            reelMode: ['spinning', 'spinning', 'spinning'],
                                            resultItems: results,
                                            finalItems: [],
                                            appearTime: Date.now() 
                                        });
                                            audio.playCasinoMusic();
                                        } else if (!c.isGuaranteedWeaponChest) {
                                            spawnLoot(cx, cy, 'chest');
                                        }
                                        if (c.isGuaranteedWeaponChest) {
                                             // Force weapon drop
                                             loot.current.push({
                                                 x: cx, y: cy, z: 0, vz: -2, vx: 0, vy: 0,
                                                 type: 'weapon', value: 1, color: '#ecc94b',
                                                 rarityColor: '#ecc94b', isMagic: false, name: Object.keys(WEAPONS)[Math.floor(Math.random() * Object.keys(WEAPONS).length)], isIdentified: true, spawnTime: Date.now() / 1000
                                             });
                                        }
                                        for (let i = 0; i < 15; i++) {
                                            particles.current.push({
                                                x: cx, y: cy,
                                                vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8 - 2,
                                                life: 0, maxLife: 30 + Math.random() * 30,
                                                color: '#FFD700', size: 3 + Math.random() * 4
                                            });
                                        }
                                    }
                                }
                            }
                        });
                        
                        // Check weak walls in front
                        let wx = player.current.x + Math.cos(player.current.aimAngle) * GRID_SIZE;
                        let wy = player.current.y + Math.sin(player.current.aimAngle) * GRID_SIZE;
                        
                        const gridX = Math.floor(wx / GRID_SIZE);
                        const gridY = Math.floor(wy / GRID_SIZE);
                        if (gridY >= 0 && gridY < h && gridX >= 0 && gridX < w) {
                            if (dungeon.current[gridY][gridX] === 2) {
                                dungeon.current[gridY][gridX] = 1; // Break wall
                                spawnLoot(gridX * GRID_SIZE + GRID_SIZE/2, gridY * GRID_SIZE + GRID_SIZE/2, 'wall');
                                for (let i = 0; i < 15; i++) {
                                    particles.current.push({
                                        x: gridX * GRID_SIZE + GRID_SIZE/2, y: gridY * GRID_SIZE + GRID_SIZE/2,
                                        vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8 - 2,
                                        life: 0, maxLife: 30 + Math.random() * 30,
                                        color: '#a0aec0', size: 3 + Math.random() * 4
                                    });
                                }
                                // Chance to spawn skeleton
                                if (Math.random() < 0.2 && canSpawnEnemy('skeleton')) {
                                    enemies.current.push({ 
                                        id: Math.random(),
                                        x: gridX * GRID_SIZE + GRID_SIZE/2, y: gridY * GRID_SIZE + GRID_SIZE/2, 
                                        hp: 80 + stats.current.dungeonLevel * 10, maxHp: 80 + stats.current.dungeonLevel * 10, size: 14, type: 'skeleton', speed: 1.5, 
                                        level: stats.current.dungeonLevel,
                                        state: 'patrol', targetX: player.current.x, targetY: player.current.y, attackCd: 0, dir: 'down', physicalDefense: 5, magicalDefense: 0 
                                    });
                                }
                            }
                        }
                    } else {
                        // Ranged logic (wand / boomerang) running on Z
                        const pSpeed = 6;
                        const isBoomerang = weapon.type === 'boomerang';
                        
                        // Multi-shot based on stacks
                        const shotCount = stacks;
                        
                        for (let i = 0; i < shotCount; i++) {
                            let vx = 0; let vy = 0;
                            let angle = player.current.aimAngle;
                            const spawnDist = 15;
                            let spawnOffsetX = Math.cos(angle) * spawnDist;
                            let spawnOffsetY = Math.sin(angle) * spawnDist;
                            
                            if (weapon.id === 'ice_scepter') {
                                angle += (Math.random() - 0.5) * (20 * Math.PI / 180);
                                const isCepSpeed = pSpeed * 2.5; 
                                vx = Math.cos(angle) * isCepSpeed;
                                vy = Math.sin(angle) * isCepSpeed;
                            } else {
                                angle += (i - (shotCount - 1) / 2) * 0.2;
                                vx = Math.cos(angle) * pSpeed;
                                vy = Math.sin(angle) * pSpeed;
                            }

                            projectiles.current.push({
                                x: player.current.x + spawnOffsetX,
                                y: player.current.y + spawnOffsetY,
                                vx: isBoomerang ? vx * 1.5 : vx,
                                vy: isBoomerang ? vy * 1.5 : vy,
                                curve: weapon.curve !== undefined ? weapon.curve : (isBoomerang ? 0.2 : undefined),
                                homing: weapon.homing,
                                homingRange: weapon.homingRange,
                                aoeRadius: weapon.aoeRadius,
                                magnetic: weapon.magnetic,
                                isBoomerang: isBoomerang,
                                phase: isBoomerang ? 'OUT' : undefined,
                                timer: isBoomerang ? 25 : undefined,
                                bounces: isBoomerang ? 5 : undefined,
                                hitIds: isBoomerang ? [] : undefined,
                                isHighLevel: stacks >= 3,
                                color: weapon.color,
                                special_behavior: weapon.special_behavior,
                                isIceCrystal: weapon.id === 'ice_scepter'
                            });
                        }
                        audio.playShootSound();
                    }
                }
        } else {
            // Key released
            const weapon = WEAPONS[stats.current.physicalWeapon] || WEAPONS['Spada Base'];
            const physCdr = (stats.current.cooldownReduction || 0) + (stats.current.physicalCooldownReduction || 0);
            const aSpeed = stats.current.attackSpeed || 1;
            
            if ((weapon.id === 'bubble_gun' || weapon.id === 'bubble_wand_gold') && player.current.chargeTimer >= 40) {
                // Execute Giant Bubble Trap
                player.current.attackCd = (weapon.cooldown * 2.5 * (1 - physCdr)) / aSpeed;
                audio.playPowerUpSound();
                shake.current.time = 15;

                let angle = player.current.aimAngle;
 
                // Propulsion for the player (small kickback)
                player.current.vx -= Math.cos(angle) * 5;
                player.current.vy -= Math.sin(angle) * 5;

                // Giant Bubble
                projectiles.current.push({
                    x: player.current.x,
                    y: player.current.y,
                    vx: Math.cos(angle) * 4,
                    vy: Math.sin(angle) * 4,
                    color: weapon.id === 'bubble_wand_gold' ? '#ffd700' : '#00ccff',
                    isEnemy: false,
                    isPhysical: true,
                    pierce: true,
                    homing: true,
                    homingRange: 800,
                    hitIds: [],
                    damageMult: weapon.id === 'bubble_wand_gold' ? 7.0 : 10.0,
                    size: weapon.id === 'bubble_wand_gold' ? 120 : 160,
                    isBubble: true,
                    life: 0,
                    maxLife: 100
                });

                // Bubble effect particles
                for (let i = 0; i < 20; i++) {
                    particles.current.push({
                        x: player.current.x, y: player.current.y,
                        vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15,
                        life: 0, maxLife: 30, color: weapon.id === 'bubble_wand_gold' ? '#fff3b0' : '#00eeff', size: 3
                    });
                }
            }

            if (weapon.id === 'rocket_launcher' && player.current.chargeTimer >= 30) {
                player.current.chargeTimer = 0;
                player.current.attackCd = (weapon.cooldown * (1 - physCdr)) / aSpeed;
                audio.playShootSound(); 

                projectiles.current.push({
                    x: player.current.x,
                    y: player.current.y,
                    vx: Math.cos(player.current.aimAngle) * 4,
                    vy: Math.sin(player.current.aimAngle) * 4,
                    color: '#ff4500',
                    isEnemy: false,
                    isPhysical: true,
                    homing: true,
                    homingRange: 800,
                    special_behavior: 'homing_rocket',
                    damageMult: 1.0,
                    hitIds: []
                });
            }

            if (weapon.id === 'castle_whip' && player.current.chargeTimer >= 40) {
                // Execute Grand Cross
                player.current.attackCd = (weapon.cooldown * 3 * (1 - physCdr)) / aSpeed;
                audio.playPowerUpSound();
                shake.current.time = 25;
                shake.current.intensity = 12;

                // Grand Cross effect: Massive circular damage and rising crosses
                for (let i = 0; i < 16; i++) {
                    const angle = (i / 16) * Math.PI * 2;
                    projectiles.current.push({
                        x: player.current.x,
                        y: player.current.y,
                        vx: Math.cos(angle) * 12,
                        vy: Math.sin(angle) * 12,
                        color: '#ffffff',
                        isEnemy: false,
                        isPhysical: true,
                        damageMult: 5.0,
                        size: 20,
                        life: 0,
                        maxLife: 40
                    });
                }

                // Rising cross particles
                for (let i = 0; i < 8; i++) {
                    const rx = player.current.x + (Math.random() - 0.5) * 200;
                    const ry = player.current.y + (Math.random() - 0.5) * 200;
                    particles.current.push({
                        x: rx, y: ry, vx: 0, vy: -4, life: 0, maxLife: 50, color: '#ffffff', size: 5
                    });
                }
            }

            if (weapon.id === 'astral_spear' && player.current.chargeTimer >= 40) {
                // Execute Astral Meteor Dash
                player.current.attackCd = (weapon.cooldown * 2.5 * (1 - physCdr)) / aSpeed;
                audio.playPowerUpSound();
                shake.current.time = 20;

                let angle = player.current.aimAngle;
 
                let nearestEnemy = null;
                let minDist = Infinity;
                
                enemies.current.forEach(e => {
                    const dx = e.x - player.current.x;
                    const dy = e.y - player.current.y;
                    const distSQ = dx*dx + dy*dy;
                    
                    const dist = Math.sqrt(distSQ);
                    if (dist > 0 && dist < 1200) { 
                        const dirX = dx / dist;
                        const dirY = dy / dist;
                        
                        const dot = dirX * Math.cos(angle) + dirY * Math.sin(angle);
                        if (dot > 0.5 && dist < minDist) {
                            minDist = dist;
                            nearestEnemy = e;
                        }
                    }
                });

                if (nearestEnemy) {
                    angle = Math.atan2(nearestEnemy.y - player.current.y, nearestEnemy.x - player.current.x);
                }

                // Propulsion
                player.current.vx = Math.cos(angle) * 28;
                player.current.vy = Math.sin(angle) * 28;
                
                // Giant piercing projectile that represents the dash impact
                projectiles.current.push({
                    x: player.current.x,
                    y: player.current.y,
                    vx: Math.cos(angle) * 2, // Moves slowly with player
                    vy: Math.sin(angle) * 2,
                    color: '#00ffff',
                    isEnemy: false,
                    isPhysical: true,
                    pierce: true,
                    hitIds: [],
                    damageMult: 12.0,
                    size: 60,
                    life: 0,
                    maxLife: 25 // Short lived, only during dash
                });

                // Spawn star trail
                for (let i = 0; i < 15; i++) {
                    setTimeout(() => {
                        particles.current.push({
                            x: player.current.x + (Math.random() - 0.5) * 40,
                            y: player.current.y + (Math.random() - 0.5) * 40,
                            vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
                            life: 0, maxLife: 40, color: '#ffffff', size: 2
                        });
                    }, i * 20);
                }
            }

            if (weapon.id === 'pistol_truth' && player.current.chargeTimer >= 40) {
                // Execute Truth Beam
                player.current.attackCd = (weapon.cooldown * 1.5 * (1 - physCdr)) / aSpeed;
                audio.playPowerUpSound();
                shake.current.time = 15;
                
                let angle = player.current.aimAngle;
 
                // Truth Beam is a massive piercing fast projectile
                projectiles.current.push({
                    x: player.current.x,
                    y: player.current.y,
                    vx: Math.cos(angle) * 25,
                    vy: Math.sin(angle) * 25,
                    color: '#ffffff',
                    isEnemy: false,
                    isPhysical: true,
                    pierce: true,
                    hitIds: [],
                    damageMult: 8.0,
                    size: 15
                });
                
                // Add some beam effect particles
                for (let i=0; i<30; i++) {
                    const dist = i * 20;
                    particles.current.push({
                        x: player.current.x + Math.cos(angle) * dist,
                        y: player.current.y + Math.sin(angle) * dist,
                        vx: 0, vy: 0, life: 0, maxLife: 20, color: '#ffffff', size: 5
                    });
                }
            }

            if (weapon.id === 'mythic_pistol' && player.current.chargeTimer >= 40) {
                // Execute Mythic Homing Shot
                player.current.attackCd = (weapon.cooldown * 0.8 * (1 - physCdr)) / aSpeed;
                audio.playPowerUpSound();
                shake.current.time = 8;
                
                let angle = player.current.aimAngle;
 
                projectiles.current.push({
                    x: player.current.x,
                    y: player.current.y,
                    vx: Math.cos(angle) * 9,
                    vy: Math.sin(angle) * 9,
                    color: '#ffff00',
                    isEnemy: false,
                    isPhysical: true,
                    homing: true,
                    homingRange: 800,
                    damageMult: 3.5,
                    size: 10
                });
            }

            if (weapon.id === 'jade_boomerang' && player.current.chargeTimer >= 40) {
                // Execute Jade Hurricane
                player.current.attackCd = (weapon.cooldown * 2.0 * (1 - physCdr)) / aSpeed;
                audio.playPowerUpSound();
                shake.current.time = 20;

                const count = 5;
                for (let i = 0; i < count; i++) {
                    let angle = player.current.aimAngle;
 
                    angle += (i - (count - 1) / 2) * 0.4;
                    const vx = Math.cos(angle) * 10;
                    const vy = Math.sin(angle) * 10;

                    projectiles.current.push({
                        x: player.current.x,
                        y: player.current.y,
                        vx: vx,
                        vy: vy,
                        curve: 0.1,
                        isEnemy: false,
                        damageMult: 2.5,
                        size: 20,
                        isBoomerang: true,
                        phase: 'OUT',
                        timer: 35,
                        bounces: 8,
                        hitIds: [],
                        color: '#00ffaa'
                    });
                }
            }

            if (weapon.id === 'thunder_hammer' && player.current.chargeTimer > 0) {
                // Execute Hammer Attack based on charge
                const charge = player.current.chargeTimer;
                const stacks = stats.current.physicalStacks;
                
                if (charge >= 30) {
                    // LONG PRESS: Chain Lightning
                    const manaCost = stats.current.maxMp * 0.2;
                    if (stats.current.mp >= manaCost) {
                        stats.current.mp -= manaCost;
                        player.current.attackCd = (weapon.cooldown * 1.5 * (1 - physCdr)) / aSpeed;
                        shake.current.time = 15;
                        audio.playElectricSound(0.5, 40); // Thunder sound
                        
                        // Chain lightning effect: hits enemies in a line or chain
                        // Let's implement a "piercing" lightning beam that stuns
                        let angle = player.current.aimAngle;
 
                        const beamRange = GRID_SIZE * 5;
                        const hitIds = new Set<number>();
                        
                        for (let d = 0; d < beamRange; d += 10) {
                            const bx = player.current.x + Math.cos(angle) * d;
                            const by = player.current.y + Math.sin(angle) * d;
                            
                            // Visuals for beam
                            if (Math.random() < 0.3) {
                                particles.current.push({
                                    x: bx, y: by,
                                    vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
                                    life: 0, maxLife: 20, color: '#00ffff', size: 2
                                });
                            }

                            enemies.current.forEach(e => {
                                if (e.hp > 0 && e.type !== 'nest' && !hitIds.has(e.id) && Math.hypot(e.x - bx, e.y - by) < e.size + 10) {
                                    const isCrit = Math.random() < stats.current.critChance;
                                    let dmg = (40 + stats.current.strength * 2) * (1 + (stacks - 1) * 0.5) * (stats.current.physDmgMult || 1);
                                    if (isCrit) dmg *= stats.current.critDamage;
                                    const actualDmg = calculateEnemyDamage(e, dmg);
                                    e.hp -= actualDmg;
                                    applyOnHitEffects(e, actualDmg);
                                    spawnDamagePopup(e.x, e.y, actualDmg, e, isCrit, weapon.color);
                                    if (e.hp <= 0) {
                                        registerEnemyKill(e);
                                    }
                                    e.stunTimer = 120; // 2 seconds at 60fps
                                    hitIds.add(e.id);
                                    audio.playHitSound('mage');
                                }
                            });
                            
                            if (checkCollision(bx, by)) break;
                        }
                    } else {
                         // Not enough mana, maybe do nothing or short press
                         // player.current.chargeTimer = 0;
                    }
                } else {
                    // SHORT PRESS: Area Bolts
                    player.current.attackCd = ((weapon.cooldown / (1 + (stats.current.lvl - 1) * 0.02)) * (1 - physCdr)) / aSpeed;
                    shake.current.time = 8;
                    audio.playThunderStrikeSound(); 
                    
                    const boltCount = 3 + stacks;
                    // Find targets close to player
                    const nearbyEnemies = enemies.current.filter(e => e.hp > 0 && e.type !== 'nest' && Math.hypot(e.x - player.current.x, e.y - player.current.y) < 250);

                    for (let i = 0; i < boltCount; i++) {
                        const target = nearbyEnemies.length > 0 ? nearbyEnemies[Math.floor(Math.random() * nearbyEnemies.length)] : null;
                        const rx = player.current.x + (Math.random() - 0.5) * 150;
                        const ry = player.current.y + (Math.random() - 0.5) * 150;
                        const tx = target ? target.x : rx;
                        const ty = target ? target.y : ry;
                        
                        // Hit Area around target
                        enemies.current.forEach(e => {
                            if (e.hp > 0 && e.type !== 'nest' && Math.hypot(e.x - tx, e.y - ty) < 64) {
                                const isCrit = Math.random() < stats.current.critChance;
                                let dmg = (15 + stats.current.strength) * (1 + (stacks - 1) * 0.3) * (stats.current.physDmgMult || 1);
                                if (isCrit) dmg *= stats.current.critDamage;
                                const actualDmg = calculateEnemyDamage(e, dmg);
                                e.hp -= actualDmg;
                                applyOnHitEffects(e, actualDmg);
                                spawnDamagePopup(e.x, e.y, actualDmg, e, isCrit, weapon.color);
                                if (e.hp <= 0) {
                                    registerEnemyKill(e);
                                }
                                e.stunTimer = 15; // Shorter stun
                                audio.playHitSound('mage');
                            }
                        });

                        // Lightning strike visuals (Shockwave + sparks instead of vertical line)
                        particles.current.push({
                            x: tx, y: ty,
                            vx: 0, vy: 0,
                            life: 0, maxLife: 15, color: '#00ffff', size: 40,
                            type: 'shockwave'
                        });
                        particles.current.push({
                            x: tx, y: ty,
                            vx: 0, vy: 0,
                            life: 0, maxLife: 15, color: '#ffffff', size: 30,
                            type: 'shockwave'
                        });
                        for (let j = 0; j < 5; j++) {
                           particles.current.push({
                               x: tx, y: ty,
                               vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8,
                               life: 0, maxLife: 20, color: '#ffffff', size: 2
                           });
                           particles.current.push({
                               x: tx, y: ty,
                               vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15,
                               life: 0, maxLife: 15, color: '#00ffff', size: 3
                           });
                        }
                    }
                }
            }
            player.current.chargeTimer = 0;
        }

        // ... (rest of movement logic)
        // Try movement and check collision
        let movedX = false;
        let movedY = false;
        
        // Speed up music if close to level up
        const xpNeed = stats.current.nextExp - stats.current.exp;
        audio.setMusicSpeed(xpNeed <= 30 ? 1.1 : 1.0);

        // Ambush containment check
        const isOutsideAmbush = (nx: number, ny: number) => {
            if (!activeAmbush.current) return false;
            const a = activeAmbush.current;
            const margin = player.current.size || 16;
            return nx < a.x + margin || nx > a.x + a.w - margin || ny < a.y + margin || ny > a.y + a.h - margin;
        };

        if (dx !== 0 && !checkCollision(player.current.x + dx, player.current.y) && !isOutsideAmbush(player.current.x + dx, player.current.y)) {
            player.current.x += dx;
            movedX = true;
        } else if (dx !== 0) {
            player.current.vx = 0;
        }
        if (dy !== 0 && !checkCollision(player.current.x, player.current.y + dy) && !isOutsideAmbush(player.current.x, player.current.y + dy)) {
            player.current.y += dy;
            movedY = true;
        } else if (dy !== 0) {
            player.current.vy = 0;
        }


        // Magnetic alignment to grid center when not actively moving on an axis
        if (!movedX && dx === 0) {
            const targetX = Math.floor(player.current.x / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2;
            player.current.x += (targetX - player.current.x) * 0.15 * timeScale;
            if (Math.abs(targetX - player.current.x) < 0.5 * timeScale) player.current.x = targetX;
        }
        if (!movedY && dy === 0) {
            const targetY = Math.floor(player.current.y / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2;
            player.current.y += (targetY - player.current.y) * 0.15 * timeScale;
            if (Math.abs(targetY - player.current.y) < 0.5 * timeScale) player.current.y = targetY;
        }

        // Projectile movement and collision
        for(let index = projectiles.current.length - 1; index >= 0; index--) {
            const p = projectiles.current[index];
            let hit = false;
            
            // Boomerang homing logic
            if (p.isBoomerang && (p.phase === 'OUT' || (p.bounces !== undefined && p.bounces < 5))) {
                // Find closest enemy for homing
                let closestDist = 250; 
                let target: Enemy | null = null;
                enemies.current.forEach(e => {
                    const d = Math.hypot(e.x - p.x, e.y - p.y);
                    if (e.hp > 0 && d < closestDist) {
                        closestDist = d;
                        target = e;
                    }
                });

                if (target) {
                    const dx = target.x - p.x;
                    const dy = target.y - p.y;
                    const targetAngle = Math.atan2(dy, dx);
                    const currentAngle = Math.atan2(p.vy, p.vx);
                    const speed = Math.hypot(p.vx, p.vy);
                    
                    const angleDiff = targetAngle - currentAngle;
                    const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
                    
                    const homingTurn = 0.15 * timeScale;
                    const newAngle = currentAngle + normalizedDiff * homingTurn;
                    p.vx = Math.cos(newAngle) * speed;
                    p.vy = Math.sin(newAngle) * speed;
                }
            }

            if ((p.curve || p.homing) && !p.isEnemy && !p.isBoomerang) {
                // Rocket Launcher special: go straight while in narrow passages
                let skipHoming = false;
                if (p.special_behavior === 'homing_rocket') {
                    const gx = Math.floor(p.x / GRID_SIZE);
                    const gy = Math.floor(p.y / GRID_SIZE);
                    const isW = (tx: number, ty: number) => {
                        if (ty < 0 || ty >= dungeon.current.length || tx < 0 || tx >= dungeon.current[0].length) return true;
                        return dungeon.current[ty][tx] === 0 || dungeon.current[ty][tx] === 2;
                    };
                    // If in a 1-tile wide horizontal or vertical tunnel, keep straight velocity
                    const horizontalTunnel = isW(gx, gy - 1) && isW(gx, gy + 1);
                    const verticalTunnel = isW(gx - 1, gy) && isW(gx + 1, gy);
                    if (horizontalTunnel || verticalTunnel) {
                        skipHoming = true;
                    }
                }

                if (!skipHoming) {
                    // Find closest enemy
                    let closestDist = p.homingRange || Infinity;
                    let closestEnemy: Enemy | null = null;
                    enemies.current.forEach(e => {
                        const dist = Math.hypot(e.x - p.x, e.y - p.y);
                        if (e.hp > 0 && dist < closestDist) {
                            if (hasLineOfSight(p.x, p.y, e.x, e.y)) {
                                closestDist = dist;
                                closestEnemy = e;
                            }
                        }
                    });

                    if (closestEnemy) {
                        const dx = (closestEnemy as Enemy).x - p.x;
                        const dy = (closestEnemy as Enemy).y - p.y;
                        const angleToEnemy = Math.atan2(dy, dx);
                        const angleProjectile = Math.atan2(p.vy, p.vx);
                        const speed = Math.hypot(p.vx, p.vy);
                        
                        // Simple angular interpolation
                        const angleDiff = angleToEnemy - angleProjectile;
                        // Normalize angle difference to [-PI, PI]
                        const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
                        
                        const homingFactor = p.homing ? 0.85 : (p.curve || 0.2);
                        let newAngle = angleProjectile + normalizedDiff * homingFactor;
                        
                        // Magnetic snapping if very close
                        if (p.magnetic && closestDist < GRID_SIZE * 0.5) {
                            const snappingForce = 0.8;
                            newAngle = angleProjectile + normalizedDiff * snappingForce;
                            // Also boost speed slightly for "snap" feel
                            p.vx *= 1.05;
                            p.vy *= 1.05;
                        }

                        p.vx = speed * Math.cos(newAngle);
                        p.vy = speed * Math.sin(newAngle);
                    }
                }
            }
            if (p.isBubble) {
                // Bubbles wobble and float slightly up
                const time = Date.now() / 120; // Sinusoidal frequency
                const wobble = Math.cos(time) * 0.5; // Magnitude tuned for approx half-tile amplitude
                const float = -0.35; // Slight upward bias
                const currentAngle = Math.atan2(p.vy, p.vx);
                
                // Add velocity perpendicular to movement
                p.vx += (Math.cos(currentAngle + Math.PI/2) * wobble) * timeScale;
                p.vy += (Math.sin(currentAngle + Math.PI/2) * wobble + float) * timeScale;
            }

            if (p.special_behavior === 'serpent_sine') {
                if (p.timer === undefined) p.timer = 0;
                p.timer += timeScale;
                
                const speed = Math.hypot(p.vx, p.vy);
                const baseAngle = Math.atan2(p.vy, p.vx);
                
                const wobbleFreq = 0.22;
                const wobbleAmp = 3.6;
                const wobbleAngle = baseAngle + Math.PI / 2;
                
                p.vx = speed * Math.cos(baseAngle) + Math.cos(wobbleAngle) * Math.sin(p.timer * wobbleFreq) * wobbleAmp;
                p.vy = speed * Math.sin(baseAngle) + Math.sin(wobbleAngle) * Math.sin(p.timer * wobbleFreq) * wobbleAmp;
            }

            if (p.special_behavior === 'serpent_contract') {
                if (p.timer === undefined) p.timer = 0;
                p.timer += timeScale;
                
                const dxFromPlayer = player.current.x - p.x;
                const dyFromPlayer = player.current.y - p.y;
                const distToPlayer = Math.hypot(dxFromPlayer, dyFromPlayer);
                if (distToPlayer > 5) {
                    const angleToPlayer = Math.atan2(dyFromPlayer, dxFromPlayer);
                    const inSpeed = 2.4 + (p.timer * 0.02);
                    const orbitAngle = angleToPlayer + 0.3 * Math.sin(p.timer * 0.05);
                    p.vx = Math.cos(orbitAngle) * inSpeed;
                    p.vy = Math.sin(orbitAngle) * inSpeed;
                }
            }

            if (p.special_behavior === 'serpent_egg') {
                if (p.timer === undefined) p.timer = 70;
                p.timer -= 1 * timeScale;
                
                p.vx *= 0.98;
                p.vy *= 0.98;
                
                p.size = 24 + Math.sin(Date.now() / 90) * 5;
                
                if (p.timer <= 0) {
                    hit = true;
                }
            }

            if (p.isEnemy && p.timer !== undefined && p.special_behavior !== 'serpent_sine' && p.special_behavior !== 'serpent_contract' && p.special_behavior !== 'serpent_egg') {
                p.timer -= 1 * timeScale;
                if (p.timer <= 0) {
                    hit = true;
                }
            }

            p.x += p.vx * timeScale;
            p.y += p.vy * timeScale;

            if (p.special_behavior === 'homing_rocket') {
                if (Math.random() < 0.3) {
                    particles.current.push({
                        x: p.x, y: p.y,
                        vx: (Math.random() - 0.5) * 1, vy: (Math.random() - 0.5) * 1,
                        life: 0, maxLife: 20, color: '#888888', size: 2
                    });
                }
            }

            if (p.isBoomerang && p.color === '#00ffaa') {
                if (Math.random() < 0.4) {
                    particles.current.push({
                        x: p.x, y: p.y,
                        vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
                        life: 0, maxLife: 15, color: '#00ffaa', size: 2
                    });
                }
            }

            // Legendary Projectile Trails (e.g. Bacchetta Bastarda)
            if (!p.isEnemy && p.homing) {
                if (p.isLegendaryStar) {
                    if (Math.random() < 0.70) {
                        const isGold = Math.random() > 0.4;
                        const pColor = isGold ? '#ffd700' : '#ffaa00';
                        particles.current.push({
                            x: p.x, y: p.y,
                            vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3,
                            life: 0, maxLife: 25,
                            color: pColor,
                            size: 2.2 + Math.random() * 2,
                            type: 'star'
                        });
                    }
                } else if (p.special_behavior === 'auto_star') {
                    if (Math.random() < 0.6) {
                        const isBlue = Math.random() > 0.5;
                        const pColor = isBlue ? '#00ccff' : '#ffffff';
                        particles.current.push({
                            x: p.x, y: p.y,
                            vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
                            life: 0, maxLife: 20,
                            color: pColor,
                            size: 1.5 + Math.random()
                        });
                    }
                } else {
                    // Scaling intensity based on level
                    const lvl = stats.current.lvl;
                    const mStacks = p.mStacks || 1;
                    const intensity = (0.1 + mStacks * 0.15) * (1 + (lvl - 1) * 0.05); // Delicate at low stacks, grows with level.
                    
                    // Generate trail particles
                    if (Math.random() < 0.5 * intensity) {
                        const isGold = Math.random() > 0.4;
                        const pColor = isGold ? '#FFD700' : '#FFFFFF';
                        particles.current.push({
                            x: p.x,
                            y: p.y,
                            vx: (Math.random() - 0.5) * 1,
                            vy: (Math.random() - 0.5) * 1,
                            life: 0,
                            maxLife: 30 + (lvl * 5), 
                            color: pColor,
                            size: (1.2 + Math.random() * 1.5) * intensity
                        });
                    }
                    if (Math.random() < 0.15 * intensity) {
                        // Glittering stars
                        particles.current.push({
                            x: p.x, y: p.y,
                            vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3,
                            life: 0, maxLife: 15,
                            color: '#ffffff',
                            size: 1 * intensity
                        });
                    }
                }
            }
            
            // Boomerang behavior
            if (p.isBoomerang) {
                if (p.phase === 'OUT') {
                    p.timer! -= 1 * timeScale;
                    if (p.timer! <= 0) {
                        p.phase = 'RETURN';
                        p.hitIds = []; // Allow hitting enemies again on return
                    }
                } else if (p.phase === 'RETURN') {
                    const dx = player.current.x - p.x;
                    const dy = player.current.y - p.y;
                    const angleToPlayer = Math.atan2(dy, dx);
                    const speed = Math.hypot(p.vx, p.vy) * 1.3; // 30% faster
                    p.vx = speed * Math.cos(angleToPlayer);
                    p.vy = speed * Math.sin(angleToPlayer);
                    
                    // Check if hit player (return)
                    if (Math.hypot(dx, dy) < 20) {
                        hit = true;
                    }
                }
            }
            
            // Wall collision
            const gridX = Math.floor(p.x / GRID_SIZE);
            const gridY = Math.floor(p.y / GRID_SIZE);
            const h = dungeon.current.length;
            const w = dungeon.current[0].length;
            
            if (gridY < 0 || gridY >= h || gridX < 0 || gridX >= w || dungeon.current[gridY][gridX] === 0 || dungeon.current[gridY][gridX] === 2) {
                if (p.isBoomerang && p.bounces && p.bounces > 0) {
                    // Bounce logic
                    p.bounces--;
                    p.hitIds = []; // Reset hit list on bounce
                    
                    // Simple reflection based on where it hit
                    const prevX = p.x - p.vx * timeScale;
                    const prevY = p.y - p.vy * timeScale;
                    const prevGX = Math.floor(prevX / GRID_SIZE);
                    const prevGY = Math.floor(prevY / GRID_SIZE);
                    
                    if (prevGX !== gridX) p.vx *= -1;
                    if (prevGY !== gridY) p.vy *= -1;
                    
                    // Nudge out of wall
                    p.x = prevX + p.vx * timeScale;
                    p.y = prevY + p.vy * timeScale;

                    audio.playBreakWallSound(); // Use simple sound for bounce
                } else {
                    hit = true;
                }
                
                if (!p.isEnemy && gridY >= 0 && gridY < h && gridX >= 0 && gridX < w && dungeon.current[gridY][gridX] === 2) {
                    dungeon.current[gridY][gridX] = 1; // Break wall
                    audio.playSecretRoomSound();
                    if (Math.random() < 0.5 && canSpawnEnemy('warrior')) {
                        enemies.current.push({ id: Math.random(), x: gridX * GRID_SIZE + GRID_SIZE/2, y: gridY * GRID_SIZE + GRID_SIZE/2, hp: 50, maxHp: 50, size: 12, type: 'warrior', speed: 1, level: 1, state: 'patrol', targetX: player.current.x, targetY: player.current.y, attackCd: 0, dir: 'down', physicalDefense: 10, magicalDefense: 0 });
                    }
                }
            }

            // Enemy collision (Friendly fire included)
            enemies.current.forEach((e) => {
                if (e.hp <= 0 || hit) return;
                
                // Rules: 
                // 1. Player projectiles hit ALL enemies.
                // 2. Enemy projectiles can hit ANY enemy EXCEPT the shooter.
                const canHit = !p.isEnemy || (p.isEnemy && p.shooterId !== e.id);
                
                if (canHit && Math.hypot(e.x - p.x, e.y - p.y) < (e.type === 'nest' ? e.size * 1.5 : e.size)) {
                    if (!p.isEnemy) {
                        lastHitMobRef.current = { type: e.type, level: e.level, id: e.id, maxHp: e.maxHp, hitTime: Date.now(), deathTime: null };
                    }
                    
                    // Boomerang does not damage nests
                    if (p.isBoomerang && e.type === 'nest') return;
                    
                    // Prevent multi-hitting same enemy in one frame/phase for piercing or boomerang
                    if ((p.isBoomerang || p.pierce) && p.hitIds?.includes(e.id)) return;
                    
                    if (p.pierce && p.hitIds) p.hitIds.push(e.id);

                    let dmg = 15;
                        if (!p.isEnemy) {
                            const baseDmg = p.isPhysical ? stats.current.strength : Math.floor(stats.current.strength * 0.5);
                            dmg = (p.isPhysical ? 10 : 15) + baseDmg;
                            if (p.damageMult) dmg *= p.damageMult;
                            const actualDmg = calculateEnemyDamage(e, dmg);
                            e.hp -= actualDmg;
                            applyOnHitEffects(e, actualDmg);
                            spawnDamagePopup(e.x, e.y, actualDmg, e, !!p.isCritical, p.color);
                        } else {
                        // Enemy vs Enemy damage
                        dmg = 10 + (p.shooterLevel || 1) * 2;
                        e.hp -= calculateEnemyDamage(e, dmg, false, p.shooterLevel);
                    }

                    audio.playHitSound(e.type);

                    if (p.special_behavior === 'freeze') {
                        e.freezeTimer = 90 * getEffectMultiplier(e);
                    }

                    if (p.special_behavior === 'obsidian_impact') {
                        // Impact particles for Obsidian Bow
                        for (let i = 0; i < 15; i++) {
                            particles.current.push({
                                x: p.x, y: p.y,
                                vx: (Math.random() - 0.5) * 12,
                                vy: (Math.random() - 0.5) * 12,
                                life: 0, maxLife: 30,
                                color: '#a85cf6', size: 3 + Math.random() * 4
                            });
                        }
                    }

                    if (p.isBubble) {
                        e.stunTimer = 180 * getEffectMultiplier(e); // Trap them
                        e.isBubbleTrapped = true;
                    }

                    if (p.special_behavior === 'homing_rocket') {
                        e.isRocketTrapped = true;
                        e.rocketTimer = 120;
                        hit = true;
                    }

                    // AoE Damage
                    if (p.aoeRadius) {
                        const aoeRadiusPx = p.aoeRadius * GRID_SIZE;
                        audio.playThunderStrikeSound(); // Booooom!
                        
                        // Particle ring for AoE
                        for (let i = 0; i < 20; i++) {
                            const angle = (i / 20) * Math.PI * 2;
                            particles.current.push({
                                x: p.x,
                                y: p.y,
                                vx: Math.cos(angle) * 5,
                                vy: Math.sin(angle) * 5,
                                life: 0,
                                maxLife: 30,
                                color: '#ffcc00',
                                size: 4
                            });
                        }

                        enemies.current.forEach(otherE => {
                            if (otherE.id === e.id || otherE.hp <= 0) return;
                            const dist = Math.hypot(otherE.x - p.x, otherE.y - p.y);
                            if (dist < aoeRadiusPx) {
                                let aoeDmgMult = 0.7;
                                if (p.special_behavior === 'obsidian_impact') aoeDmgMult = 0.5;
                                
                                otherE.hp -= Math.floor(dmg * aoeDmgMult); // 70% or 50% damage to nearby enemies
                                
                                // Small feedback for aoe hit
                                for (let i = 0; i < 3; i++) {
                                    particles.current.push({
                                        x: otherE.x,
                                        y: otherE.y,
                                        vx: (Math.random() - 0.5) * 2,
                                        vy: (Math.random() - 0.5) * 2,
                                        life: 0,
                                        maxLife: 10,
                                        color: '#ffaa00',
                                        size: 2
                                    });
                                }
                            }
                        });
                    }

                    // Particle Effect on hit
                    for (let i = 0; i < 5; i++) {
                        particles.current.push({
                            x: p.x,
                            y: p.y,
                            vx: (Math.random() - 0.5) * 4,
                            vy: (Math.random() - 0.5) * 4,
                            life: 0,
                            maxLife: 15 + Math.random() * 15,
                            color: p.isEnemy ? '#ff0000' : '#00ffff',
                            size: 2 + Math.random() * 2
                        });
                    }
                    
                    if (p.isBoomerang || p.pierce) {
                        p.hitIds?.push(e.id);
                    } else {
                        hit = true;
                    }

                    if (e.type !== 'nest' && e.type !== 'boss') { 
                        e.state = 'evade'; 
                        e.evadeTimer = 20;
                        const angleFromHit = Math.atan2(e.y - p.y, e.x - p.x);
                        const dodgeAngle = angleFromHit + (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 0.5 + 0.5);
                        e.evadeDirX = Math.cos(dodgeAngle);
                        e.evadeDirY = Math.sin(dodgeAngle);
                    }
                    
                    if (e.hp <= 0) {
                        registerEnemyKill(e);
                    }
                }
            });

            // Player collision (only for enemy projectiles)
            if (p.isEnemy) {
                if (!hit && player.current.flashTimer <= 0 && Math.hypot(player.current.x - p.x, player.current.y - p.y) < 15) {
                    const difficulty = settingsRef.current.difficulty || 3;
                    const dmgMult = 0.6 + (difficulty - 1) * 0.2;
                    const dmg = Math.floor(15 * dmgMult);
                    const finalDmg = getMitigatedDamage(dmg);
                    if (p.shooterType && p.shooterLevel !== undefined) {
                        killerRef.current = { type: p.shooterType, level: p.shooterLevel, damage: finalDmg };
                    }
                    stats.current.hp -= finalDmg;
                    audio.playPlayerHitSound();
                    spawnPlayerHitEffect(player.current.x, player.current.y);
                    spawnPlayerDamagePopup(finalDmg);
                    hit = true;
                    shake.current.time = 5;
                }
            } else {
                // Merchant collision (only for player projectiles)
                rooms.current.forEach((r, idx) => {
                    if (!hit && r.isMerchant && revealedRooms.current.has(idx)) {
                        const cx = r.cx * GRID_SIZE + GRID_SIZE / 2;
                        const cy = r.cy * GRID_SIZE + GRID_SIZE / 2;
                        if (Math.hypot(cx - p.x, cy - p.y) < 20) {
                            hit = true;

                            const dx = cx - player.current.x;
                            const dy = cy - player.current.y;
                            const dist = Math.hypot(dx, dy);

                            if (dist <= GRID_SIZE * 1.5) {
                                // Check standard 4-way facing direction towards merchant
                                let isFacing = false;
                                if (player.current.facing === 'left' && dx < 0 && Math.abs(dy) < Math.abs(dx)) {
                                    isFacing = true;
                                } else if (player.current.facing === 'right' && dx > 0 && Math.abs(dy) < Math.abs(dx)) {
                                    isFacing = true;
                                } else if (player.current.facing === 'up' && dy < 0 && Math.abs(dx) < Math.abs(dy)) {
                                    isFacing = true;
                                } else if (player.current.facing === 'down' && dy > 0 && Math.abs(dx) < Math.abs(dy)) {
                                    isFacing = true;
                                }

                                // Or check aiming direction (aimAngle is within 60 degrees of merchant)
                                const angleToMerchant = Math.atan2(dy, dx);
                                const angleDiff = Math.atan2(Math.sin(angleToMerchant - player.current.aimAngle), Math.cos(angleToMerchant - player.current.aimAngle));
                                const isAimingAtMerchant = Math.abs(angleDiff) < Math.PI / 3;

                                if (isFacing || isAimingAtMerchant) {
                                    if (!showShop && !isMerchantRoom) {
                                        audio.playSecretRoomSound(); 
                                        setIsMerchantRoom(true);
                                        setShowShop(true);
                                        pauseRef.current = true;
                                    }
                                }
                            }
                        }
                    }
                });

                // Chest collision (only for player projectiles)
                chests.current.forEach(c => {
                    if (!hit && !c.opened) {
                        // Protection: immune if in secret room not yet revealed or during ambush
                        const ridx = secretTileToRoom.current[`${c.gridY}_${c.gridX}`];
                        if (ridx !== undefined && !revealedRooms.current.has(ridx)) return;
                        if (activeAmbush.current && ridx === activeAmbush.current.roomId) return;

                        const cx = c.gridX * GRID_SIZE + GRID_SIZE / 2;
                        const cy = c.gridY * GRID_SIZE + GRID_SIZE / 2;
                        if (Math.hypot(cx - p.x, cy - p.y) < 15) {
                            c.hp -= 25;
                            if (c.hp <= 0) {
                                c.opened = true;
                                const difficulty = settingsRef.current.difficulty || 3;
                                const diffMult = 1.4 - (difficulty - 1) * 0.1;
                                if (difficulty < 3) {
                                    stats.current.exp += Math.floor(30 * diffMult); // Small mob exp
                                }
                                if (c.isGuaranteedWeaponChest) {
                                     // Force weapon drop
                                     loot.current.push({
                                         x: cx, y: cy, z: 0, vz: -2, vx: 0, vy: 0,
                                         type: 'weapon', value: 1, color: '#ecc94b',
                                         rarityColor: '#ecc94b', isMagic: false, name: Object.keys(WEAPONS)[Math.floor(Math.random() * Object.keys(WEAPONS).length)], isIdentified: true, spawnTime: Date.now() / 1000
                                     });
                                } else {
                                     spawnLoot(cx, cy, 'chest');
                                }
                                for (let i = 0; i < 15; i++) {
                                    particles.current.push({
                                        x: cx, y: cy,
                                        vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8 - 2,
                                        life: 0, maxLife: 30 + Math.random() * 30,
                                        color: '#FFD700', size: 3 + Math.random() * 4
                                    });
                                }
                            }
                            hit = true;
                        }
                    }
                });
            }

            if (hit) {
                if (p.special_behavior === 'serpent_egg' && p.timer !== -99) {
                    p.timer = -99; // prevent double trigger
                    const splitCount = 10;
                    for (let i = 0; i < splitCount; i++) {
                        const splitAngle = (Math.PI * 2 / splitCount) * i;
                        projectiles.current.push({
                            x: p.x,
                            y: p.y,
                            vx: Math.cos(splitAngle) * 4.5,
                            vy: Math.sin(splitAngle) * 4.5,
                            isEnemy: true,
                            shooterId: p.shooterId,
                            shooterType: 'serpent',
                            shooterLevel: p.shooterLevel || 5,
                            color: '#adff2f',
                            size: 8,
                            special_behavior: 'serpent_sine'
                        });
                    }
                    // Spawn exploding gas bubbles
                    for (let k = 0; k < 15; k++) {
                        const ang = Math.random() * Math.PI * 2;
                        const sp = 0.5 + Math.random() * 2.5;
                        particles.current.push({
                            x: p.x, y: p.y,
                            vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
                            life: 0, maxLife: 35 + Math.random() * 20,
                            color: 'rgba(154, 205, 50, 0.4)',
                            size: 4 + Math.random() * 6
                        });
                    }
                    audio.playPopSound();
                }
                projectiles.current.splice(index, 1);
            }
        }

        // Clean up dead enemies
        enemies.current = enemies.current.filter(e => e.hp > 0 || e.isDeadFuse);
        
        // Force spawn portal if boss is killed but portal is missing
        if (bossKilled.current && !portal.current) {
             let placed = false;
             const h = dungeon.current.length;
             const w = dungeon.current[0].length;
             while (!placed) {
                 const rx = Math.floor(Math.random() * w) * GRID_SIZE + GRID_SIZE / 2;
                 const ry = Math.floor(Math.random() * h) * GRID_SIZE + GRID_SIZE / 2;
                 if (!checkCollision(rx, ry)) {
                      portal.current = { x: rx, y: ry };
                      placed = true;
                 }
             }
        }

        if (!bossKilled.current && !enemies.current.some(e => e.type === 'boss' || e.type === 'slimmy' || e.type === 'serpent' || e.type === 'shadow_reaper' || e.type === 'void_architect')) {
            bossKilled.current = true;
            audio.stopBackgroundMusic();
            // Spawn hatch in the center of the boss room
            const bossRoom = rooms.current.find((_, idx) => idx === currentDungeon.current.bossRoomIdx);
            if (bossRoom) {
                portal.current = { 
                    x: bossRoom.cx * GRID_SIZE + GRID_SIZE / 2, 
                    y: bossRoom.cy * GRID_SIZE + GRID_SIZE / 2 
                };
            } else {
                // Fallback
                let placed = false;
                const h = dungeon.current.length;
                const w = dungeon.current[0].length;
                while (!placed) {
                    const rx = Math.floor(Math.random() * w) * GRID_SIZE + GRID_SIZE / 2;
                    const ry = Math.floor(Math.random() * h) * GRID_SIZE + GRID_SIZE / 2;
                    if (!checkCollision(rx, ry)) {
                         portal.current = { x: rx, y: ry };
                         placed = true;
                    }
                }
            }
        }

        // Trigger Shop
        if (bossKilled.current && portal.current && !showShop) {
            if (Math.hypot(player.current.x - portal.current.x, player.current.y - portal.current.y) < 30) {
                stats.current.roomsCleared++;
                showTrophyProgress('pixel_survivor');
                setShowShop(true);
            }
        }

        // Enemy logic (movement and damage player)
        if (activeAmbush.current) {
            const hasAmbushEnemies = enemies.current.some(e => e.hp > 0 && e.isAmbushEnemy);
            if (!hasAmbushEnemies) {
                activeAmbush.current = null;
                levelMessage.current = { text: settingsRef.current.language === 'it' ? 'AREA SICURA' : 'AMBUSH CLEARED!', timer: 120 };
            }
        }

        const activeEnemies = enemies.current.filter(e => e.type !== 'nest').length;
        const nestSpeedMultiplier = activeEnemies < 3 ? 0.6 : (activeEnemies < 10 ? 0.8 : 1.0);
        
        // Check if player is in boss room to handle boss regen penalty
        const bossRoomIdx = currentDungeon.current.bossRoomIdx;
        const bRoom = bossRoomIdx !== undefined ? rooms.current[bossRoomIdx] : null;
        const isPlayerInBossRoom = bRoom && 
            player.current.x >= bRoom.x * GRID_SIZE && 
            player.current.x <= (bRoom.x + bRoom.w) * GRID_SIZE &&
            player.current.y >= bRoom.y * GRID_SIZE && 
            player.current.y <= (bRoom.y + bRoom.h) * GRID_SIZE;

        enemies.current.forEach(e => {
            if (e.hp <= 0 && !e.isDeadFuse) return;

            // --- HARPOON DRAG LOGIC ---
            if (player.current.harpoonedEnemyId === e.id) {
                // Mana recharge and DoT (1% mana per frame, 0.5 HP per frame)
                stats.current.mp = Math.min(stats.current.mp + 0.01, stats.current.maxMp);
                e.hp -= 0.5;
                
                // Extended hold: if attack key is held, increase duration.
                const { fire1 } = settingsRef.current.keys;
                if (keys.current[fire1]) {
                    e.harpoonedDuration = Math.min((e.harpoonedDuration || 0) + 1, 300); // Max 5s (300 frames)
                } else {
                    // Detach damage if released
                    if ((e.harpoonedDuration || 0) > 0) {
                        e.hp -= 50;
                        player.current.harpoonedEnemyId = null;
                        e.harpoonedDuration = 0;
                    }
                }
                // Detach if max duration reached
                if ((e.harpoonedDuration || 0) >= 300) {
                   e.hp -= 50;
                   player.current.harpoonedEnemyId = null;
                   e.harpoonedDuration = 0;
                }
            }

            // --- ROCKET TRAP & EXPLOSION LOGIC ---
            if (e.isRocketTrapped) {
                e.rocketTimer = (e.rocketTimer || 0) - 1 * timeScale;
                if (e.rocketTimer <= 0) {
                    // Explode
                    e.isRocketTrapped = false;
                    e.rocketTimer = 0;
                    
                    // Screen shake & explosion audio
                    shake.current.time = 20;
                    if (audio.playBossExplosion) {
                        audio.playBossExplosion();
                    }

                    // Particles (Shockwave and fire)
                    const explosionRadius = 250;
                    particles.current.push({
                        x: e.x, y: e.y, vx: 0, vy: 0,
                        life: 0, maxLife: 25, color: '#ff4500', size: explosionRadius,
                        type: 'shockwave', noGravity: true
                    });
                    particles.current.push({
                        x: e.x, y: e.y, vx: 0, vy: 0,
                        life: 0, maxLife: 15, color: '#ffcc00', size: explosionRadius * 0.6,
                        type: 'shockwave', noGravity: true
                    });

                    for (let i = 0; i < 15; i++) {
                        const pAngle = Math.random() * Math.PI * 2;
                        const pDist = Math.random() * 30;
                        particles.current.push({
                            x: e.x + Math.cos(pAngle) * pDist,
                            y: e.y + Math.sin(pAngle) * pDist,
                            vx: Math.cos(pAngle) * (2 + Math.random() * 6),
                            vy: Math.sin(pAngle) * (2 + Math.random() * 6),
                            life: 0, maxLife: 30 + Math.random() * 20,
                            color: Math.random() < 0.6 ? '#ff4500' : '#ffcc00',
                            size: 4 + Math.random() * 8
                        });
                    }

                    // Area Damage to all enemies
                    const statsForDmg = stats.current;
                    const magicP = (statsForDmg as any).magicPower || 0;
                    const explosionDmg = Math.floor((100 + statsForDmg.lvl * 20) * (magicP * 0.5 + statsForDmg.strength * 0.5 + 1));

                    enemies.current.forEach(otherE => {
                        if (otherE.hp > 0) {
                            const distSet = Math.hypot(e.x - otherE.x, e.y - otherE.y);
                            if (distSet < explosionRadius) {
                                (otherE as any).hp -= explosionDmg;
                                spawnDamagePopup(otherE.x, otherE.y, 'Boom', otherE, true, '#ff4500');
                                if (otherE.hp <= 0) {
                                    registerEnemyKill(otherE);
                                }
                            }
                        }
                    });
                }
            }

            // --- BOMBER COUNTDOWN & EXPLOSION TICK ---
            if (e.type === 'bomber') {
                // Ignite if sees player (and is not already ignited)
                if (e.fuseTimer === undefined && !e.isDeadFuse) {
                    const distToPlayer = Math.hypot(player.current.x - e.x, player.current.y - e.y);
                    // Standard visual range: 450 px
                    if (distToPlayer < 450) {
                        // Immediately run a precise Line of Sight check to detect the hero
                        if (hasLineOfSight(e.x, e.y, player.current.x, player.current.y)) {
                            e.fuseTimer = 120; // 2 seconds at 60fps
                            e.isIgnited = true;
                            if (e.originalSpeed === undefined) {
                                e.originalSpeed = e.speed;
                            }
                            if (audio.playBossCharge) {
                                audio.playBossCharge();
                            }
                        }
                    }
                }

                // Fail-safe ignition: if it has taken any damage but isn't ticking yet, ignite it!
                if (e.hp < e.maxHp && e.fuseTimer === undefined && !e.isDeadFuse) {
                    e.fuseTimer = 120; // 2 seconds at 60fps
                    e.isIgnited = true;
                    if (e.originalSpeed === undefined) {
                        e.originalSpeed = e.speed;
                    }
                    if (audio.playBossCharge) {
                        audio.playBossCharge();
                    }
                }

                if (e.fuseTimer !== undefined && e.fuseTimer > 0) {
                    e.fuseTimer -= 1 * timeScale;
                    
                    // Make it run faster with ignited fuse to pursue the player eagerly as a kamikaze! (unless dead)
                    if (e.isDeadFuse) {
                        e.speed = 0;
                    } else {
                        // Kamikaze chase! Starts at 1.8x speed and accelerates to 3.0x speed as fuse burns down!
                        const pctDone = (120 - e.fuseTimer) / 120;
                        const kamikazeBoost = 1.8 + pctDone * 1.5; // reaches 3.3x speed
                        e.speed = (e.originalSpeed || 1.6) * kamikazeBoost;
                    }
                    
                    // Push sparks from the ignited fuse wire
                    if (Math.random() < 0.6) {
                        particles.current.push({
                            x: e.x + 10 + (Math.random() - 0.5) * 4,
                            y: e.y - e.size * 1.3 + (Math.random() - 0.5) * 4,
                            vx: (Math.random() - 0.5) * 4,
                            vy: -Math.random() * 4,
                            life: 0, maxLife: 15,
                            color: Math.random() < 0.5 ? '#ff4500' : '#ffcc00',
                            size: 2 + Math.random() * 3,
                            noGravity: true
                        });
                    }

                    if (e.fuseTimer <= 0) {
                        triggerBomberExplosion(e);
                        return; // exit early for this exploded bomber
                    }
                }
            }

            // Skip AI updates for dead fusing bombers
            if (e.isDeadFuse) return;

            // Micro-optimization: Line-of-sight is calculated only once every 15 frames to reduce execution lag
            if (e.losCheckTimer === undefined) {
                e.losCheckTimer = Math.floor(Math.random() * 15);
                e.lastLos = false;
            }
            e.losCheckTimer -= 1 * timeScale;
            if (e.losCheckTimer <= 0) {
                e.lastLos = hasLineOfSight(e.x, e.y, player.current.x, player.current.y);
                e.losCheckTimer = 15;
            }

            // --- DEBUFF TICKING & STATUS MANAGEMENT (BIO-ATTACK / POISON / SLOW) ---
            const st = stats.current;

            // 1. Slow Timer countdown
            if (e.slowTimer && e.slowTimer > 0) {
                e.slowTimer -= 1 * timeScale;
                if (e.slowTimer <= 0) {
                    if (e.originalSpeed !== undefined) {
                        e.speed = e.originalSpeed;
                    }
                    e.slowRatio = undefined;
                } else if (e.slowRatio !== undefined && e.originalSpeed !== undefined) {
                    e.speed = e.originalSpeed * (1 - e.slowRatio);
                }
            }

            // 2. Poison Dot tick damage
            if (e.poisonTimer && e.poisonTimer > 0) {
                e.poisonTimer -= 1 * timeScale;
                
                const dotFrameDmg = ((e.poisonDamagePerSec || 5) * (st.poisonDmgMult || 1) / 60) * timeScale;
                e.hp -= dotFrameDmg;

                if (Math.random() < 0.05) {
                    particles.current.push({
                        x: e.x + (Math.random() - 0.5) * e.size,
                        y: e.y + (Math.random() - 0.5) * e.size,
                        vx: (Math.random() - 0.5) * 0.4, vy: -Math.random() * 0.8,
                        life: 0, maxLife: 25, color: '#c084fc', size: 1.5
                    });
                }

                if (st.poisonSpread && Math.random() < (0.3 / 60) * timeScale) {
                    enemies.current.forEach(otherE => {
                        if (otherE !== e && otherE.hp > 0 && !otherE.poisonTimer) {
                            if (Math.hypot(otherE.x - e.x, otherE.y - e.y) < 100) {
                                otherE.poisonTimer = e.poisonTimer;
                                otherE.poisonDamagePerSec = e.poisonDamagePerSec;
                            }
                        }
                    });
                }

                if (e.hp <= 0) {
                    registerEnemyKill(e);
                    
                    if (st.toxicExplosion) {
                        particles.current.push({
                            x: e.x, y: e.y,
                            vx: 0, vy: 0,
                            life: 0, maxLife: 20, color: '#22c55e', size: 60,
                            type: 'shockwave'
                        });
                        
                        enemies.current.forEach(otherE => {
                            if (otherE !== e && otherE.hp > 0 && Math.hypot(otherE.x - e.x, otherE.y - e.y) < 120) {
                                const explDmg = Math.floor((e.poisonDamagePerSec || 5) * 6);
                                otherE.hp -= explDmg;
                                spawnDamagePopup(otherE.x, otherE.y, explDmg, otherE, true, '#22c55e');
                                
                                otherE.poisonTimer = 300;
                                otherE.poisonDamagePerSec = e.poisonDamagePerSec;
                            }
                        });
                    }
                    return;
                }
            }

            // Boss HP Regen if player is cowardly attacking from outside
            if ((e.type === 'boss' || e.type === 'slimmy' || e.type === 'serpent' || e.type === 'shadow_reaper' || e.type === 'void_architect') && e.hp > 0 && e.hp < e.maxHp) {
                if (!isPlayerInBossRoom) {
                    // Massive regen to discourage long-range cheesing
                    e.hp = Math.min(e.maxHp, e.hp + (e.maxHp * 0.01) * timeScale);
                }
            }

            if (e.freezeTimer && e.freezeTimer > 0) {
                e.freezeTimer -= 1 * timeScale;
                if (Math.random() < 0.15) {
                    particles.current.push({
                        x: e.x + (Math.random() - 0.5) * e.size, y: e.y + (Math.random() - 0.5) * e.size,
                        vx: 0, vy: -0.5, life: 0, maxLife: 30, color: '#a0ffff', size: 3
                    });
                }
                return; // Skip logic while frozen
            }

            if (e.stunTimer && e.stunTimer > 0) {
                e.stunTimer -= 1 * timeScale;
                
                // Bubble effect / Wobble Stars
                if (e.isBubbleTrapped) {
                    // Wobble movement logic
                    e.x += Math.sin(time * 15 + e.id) * 0.5 * timeScale;
                    e.y += Math.cos(time * 10 + e.id) * 0.3 * timeScale;

                    if (Math.random() < 0.2) {
                         // Stars
                         particles.current.push({
                            x: e.x + (Math.random() - 0.5) * 30,
                            y: e.y - e.size * 0.8 + (Math.random() - 0.5) * 10,
                            vx: (Math.random() - 0.5) * 1, vy: -0.5, life: 0, maxLife: 20, color: '#ffff00', size: 4,
                            type: 'star', rotation: Math.random() * Math.PI, vr: 0.1
                        });
                    }
                }
                
                if (e.stunTimer <= 0 && e.isBubbleTrapped) {
                    e.isBubbleTrapped = false;
                    // Popping visual
                    for (let i = 0; i < 15; i++) {
                         particles.current.push({
                            x: e.x, y: e.y,
                            vx: (Math.random() - 0.5) * 6,
                            vy: (Math.random() - 0.5) * 6,
                            life: 0, maxLife: 25, color: '#00ccff', size: 4
                        });
                    }
                }
                
                return; // Skip logic while stunned
            }
            if (e.serpentDashTimer && e.serpentDashTimer > 0) {
                e.serpentDashTimer -= 1 * timeScale;
                if (e.serpentDashTimer <= 0) {
                    if (e.originalSpeed !== undefined) {
                        e.speed = e.originalSpeed;
                    } else {
                        e.speed = 1.6;
                    }
                }
            }

            if (e.attackCd && e.attackCd > 0) e.attackCd -= 1 * timeScale;

            const dx = player.current.x - e.x;
            const dy = player.current.y - e.y;
            const dist = Math.hypot(dx, dy);
            const oldX = e.x;
            const oldY = e.y;

            const updateEnemyDir = (en: Enemy, vvx: number, vvy: number) => {
                if (Math.abs(vvx) > Math.abs(vvy)) {
                    en.dir = vvx > 0 ? 'right' : 'left';
                } else if (Math.abs(vvy) > 0) {
                    en.dir = vvy > 0 ? 'down' : 'up';
                }
            };

            // Stuck detection & Sliding movement
            if (e.stuckTimer === undefined) e.stuckTimer = 0;
            if (e.lastX !== undefined && e.lastY !== undefined && e.state === 'chase') {
                if (Math.hypot(e.x - e.lastX, e.y - e.lastY) < 0.5) {
                    e.stuckTimer += 1 * timeScale;
                    if (e.stuckTimer > 20) {
                        e.state = 'unstucking'; // Sliding state
                        e.unstuckDir = Math.random() > 0.5 ? 1 : -1; 
                        e.stuckTimer = 0;
                        // Boss/Miniboss dashes when stuck to get free
                        if (e.type === 'boss') {
                            e.speed = 2; 
                            e.stuckTimer = -40; 
                        } else if (e.type === 'miniboss') {
                            e.speed = 1.6; // Dash speed for miniboss
                            e.stuckTimer = -20;
                        }
                    }
                } else {
                    e.stuckTimer = Math.max(0, e.stuckTimer - 1 * timeScale);
                }
            }
            e.lastX = e.x;
            e.lastY = e.y;

            // Nest logic
            if (e.type === 'nest') {
                if (e.spawnTimer! > 0) e.spawnTimer! = Math.max(0, e.spawnTimer! - 1 * timeScale);
                
                const isSpawning = e.spawnTimer! < 90; // Last 1.5 seconds at 60fps ref

                if (e.spawnTimer! <= 0 && canSpawnEnemy() && activeEnemies < 30 + stats.current.dungeonLevel * 5) {
                    // Spawn logic
                    const minibossChance = bossKilled.current ? 0.6 : 0.4;
                    const isMiniboss = (activeEnemies < 2 && Math.random() < minibossChance) || (bossKilled.current && activeEnemies < 4 && Math.random() < 0.3);

                    if (isMiniboss) {
                        const spot = findSafeSpawnPosition(e.x, e.y, 30);
                        if (spot) {
                            const baseTypes: Enemy['baseType'][] = ['warrior', 'archer', 'mage', 'skeleton', 'vampire'];
                            const base = baseTypes[Math.floor(Math.random() * baseTypes.length)];
                            // Spawn Miniboss
                            enemies.current.push({ 
                                id: Math.random(), x: spot.x, y: spot.y, 
                                hp: 400 + stats.current.dungeonLevel * 60, 
                                maxHp: 400 + stats.current.dungeonLevel * 60, 
                                size: 30, // Double normal size
                                type: 'miniboss', 
                                baseType: base,
                                roomId: e.roomId,
                                speed: 0.8, level: stats.current.dungeonLevel, state: 'patrol', 
                                targetX: player.current.x, targetY: player.current.y, 
                                isAmbushEnemy: e.isAmbushEnemy,
                                attackCd: 0, dir: 'down', ...getEnemyDefense('miniboss') 
                            });
                            // 2 random minions (sgherri)
                            const mobTypes: Enemy['type'][] = ['warrior', 'archer', 'mage', 'skeleton'];
                            for (let i = 0; i < 2; i++) {
                                const mSpot = findSafeSpawnPosition(e.x, e.y, 15);
                                if (mSpot) {
                                    const st = mobTypes[Math.floor(Math.random() * mobTypes.length)];
                                    enemies.current.push({ 
                                        id: Math.random(), 
                                        x: mSpot.x, 
                                        y: mSpot.y, 
                                        hp: 100 + stats.current.dungeonLevel * 15, 
                                        maxHp: 100 + stats.current.dungeonLevel * 15, 
                                        size: 15, type: st, speed: 1.2, 
                                        level: stats.current.dungeonLevel, state: 'patrol', 
                                        targetX: player.current.x, targetY: player.current.y, 
                                        roomId: e.roomId,
                                        isAmbushEnemy: e.isAmbushEnemy,
                                        attackCd: 0, dir: 'down', ...getEnemyDefense(st) 
                                    });
                                }
                            }
                        }
                    } else {
                        const spot = findSafeSpawnPosition(e.x, e.y, 15);
                        if (spot) {
                            const types: Enemy['type'][] = ['warrior', 'archer', 'mage', 'vampire'];
                            const spawnType = types[Math.floor(Math.random() * types.length)];
                            enemies.current.push({ 
                                id: Math.random(), x: spot.x, y: spot.y, 
                                hp: 100 + stats.current.dungeonLevel * 15, 
                                maxHp: 100 + stats.current.dungeonLevel * 15, 
                                size: 15, type: spawnType, 
                                roomId: e.roomId,
                                speed: 1 + Math.random() * 0.5, level: stats.current.dungeonLevel, state: 'patrol', targetX: e.x, targetY: e.y, isAmbushEnemy: e.isAmbushEnemy, attackCd: 0, dir: 'down', ...getEnemyDefense(spawnType as Enemy['type']) 
                            });
                        }
                    }

                    // Reset Timer ONLY after spawn check
                    const levelFactor = Math.max(0.2, 1 - (stats.current.dungeonLevel - 1) * 0.1); 
                    const spawnCooldown = levelFactor * nestSpeedMultiplier;
                    
                    if (activeEnemies === 0) e.spawnTimer = Math.floor(5 * 60 * spawnCooldown);
                    else if (activeEnemies <= 2) e.spawnTimer = Math.floor(10 * 60 * spawnCooldown);
                    else if (activeEnemies >= 10) e.spawnTimer = Math.floor(40 * 60 * spawnCooldown);
                    else {
                        const t = (activeEnemies - 3) / 7; // Scaling from 3 to 10
                        e.spawnTimer = Math.floor((12 + t * 28) * 60 * spawnCooldown);
                    }
                }
                return;
            }

                    // Projectile Avoidance AI
            if (e.type !== 'nest' && e.hp > 0) {
                // Boss Ticks (Vacuum, etc)
                if (e.vacuumTimer && e.vacuumTimer > 0) {
                    e.vacuumTimer -= 1 * timeScale;
                    const force = 1.5 * timeScale;
                    player.current.x += (e.x - player.current.x) / dist * force;
                    player.current.y += (e.y - player.current.y) / dist * force;
                    
                    if (Math.random() < 0.3) {
                         particles.current.push({
                             x: player.current.x + (Math.random()-0.5)*40,
                             y: player.current.y + (Math.random()-0.5)*40,
                             vx: (e.x - player.current.x) * 0.15,
                             vy: (e.y - player.current.y) * 0.15,
                             life: 0, maxLife: 15, size: 2, color: '#ff6600'
                         });
                    }
                }

                for (const proj of projectiles.current) {
                    if (proj.shooterId === e.id) continue;
                    const pdist = Math.hypot(proj.x - e.x, proj.y - e.y);
                    if (pdist < 60) {
                        const projSpeed = Math.hypot(proj.vx, proj.vy);
                        if (projSpeed > 0) {
                            const toEnX = e.x - proj.x;
                            const toEnY = e.y - proj.y;
                            const dot = (proj.vx * toEnX + proj.vy * toEnY) / (pdist * projSpeed);
                            if (dot > 0.7) {
                                // Perpendicular nudge
                                const perpX = -proj.vy / projSpeed;
                                const perpY = proj.vx / projSpeed;
                                const sideDot = toEnX * perpX + toEnY * perpY;
                                const dir = sideDot > 0 ? 1 : -1;
                                const ex = perpX * dir * e.speed * 1.5 * timeScale;
                                const ey = perpY * dir * e.speed * 1.5 * timeScale;
                                if (e.type === 'specter' || e.type === 'serpent' || !checkCollision(e.x + ex, e.y + ey, e.size)) {
                                    e.x += ex;
                                    e.y += ey;
                                }
                                break;
                            }
                        }
                    }
                }
            }

            // AI State Machine (Enemies)
            if (e.type === 'vampire' && dist < 64 && player.current.flashTimer <= 0) { // 2 tiles away (2 * 32)
                const difficulty = settingsRef.current.difficulty || 3;
                const dmgMult = 0.6 + (difficulty - 1) * 0.2;
                const drainAmount = (0.05 * dmgMult) * timeScale; // Small continuous drain
                if (stats.current.hp > 0) {
                    stats.current.hp -= drainAmount;
                    e.hp = Math.min(e.hp + drainAmount * 2, e.maxHp); // Heals itself double what it drains
                }
                
                // Visual effect for drain: particles going from player to vampire
                if (Math.random() < 0.2) {
                    particles.current.push({
                        x: player.current.x,
                        y: player.current.y,
                        vx: (e.x - player.current.x) * 0.1,
                        vy: (e.y - player.current.y) * 0.1,
                        life: 0,
                        maxLife: 20,
                        size: 2,
                        color: '#ff0000',
                        targetX: e.x,
                        targetY: e.y,
                        type: 'vampire_heal'
                    });
                }
            }

            if (e.state === 'patrol') {
                if (dist < 300 && e.lastLos) { 
                    e.state = 'chase'; 
                } else {
                    // Wander logic
                    if (!e.targetX || !e.targetY || Math.hypot(e.targetX - e.x, e.targetY - e.y) < 10) {
                        const angle = Math.random() * Math.PI * 2;
                        const dist = 50 + Math.random() * 100;
                        const tx = e.x + Math.cos(angle) * dist;
                        const ty = e.y + Math.sin(angle) * dist;
                        // Only set target if it's not a wall
                        if (!checkCollision(tx, ty, e.size)) {
                            e.targetX = tx;
                            e.targetY = ty;
                        }
                    } else {
                        const tx = e.targetX - e.x;
                        const ty = e.targetY - e.y;
                        const tDist = Math.hypot(tx, ty);
                        const vx = (tx / tDist) * (e.speed * 0.4 * timeScale);
                        const vy = (ty / tDist) * (e.speed * 0.4 * timeScale);
                        updateEnemyDir(e, vx, vy);
                        
                        if (e.type === 'specter' || !checkCollision(e.x + vx, e.y + vy, e.size)) {
                            e.x += vx;
                            e.y += vy;
                        } else {
                            e.targetX = undefined; // Obstacle, pick new target
                        }
                    }
                }
            } else if (e.state === 'flee') {
                e.evadeTimer = (e.evadeTimer || 60) - 1 * timeScale;
                const vx = -(dx / dist) * e.speed * 1.2 * timeScale;
                const vy = -(dy / dist) * e.speed * 1.2 * timeScale;
                updateEnemyDir(e, vx, vy);
                
                if (e.type === 'specter' || !checkCollision(e.x + vx, e.y + vy, e.size)) {
                    e.x += vx; e.y += vy;
                }
                
                if (e.evadeTimer <= 0 || dist > 400) {
                    e.state = 'chase';
                    e.evadeTimer = 0;
                }
            } else if (e.state === 'unstucking') {
                 // Sliding pattern: move perpendicular to target vector or follow wall
                 let speedMult = 1;
                 if (e.type === 'boss' || e.type === 'miniboss') speedMult = 2;
                 
                 const vx = -(dy / dist) * e.unstuckDir! * e.speed * speedMult * timeScale;
                 const vy = (dx / dist) * e.unstuckDir! * e.speed * speedMult * timeScale;
                 updateEnemyDir(e, vx, vy);

                 if (e.type === 'specter' || e.type === 'serpent' || !checkCollision(e.x + vx, e.y + vy, e.size)) {
                    e.x += vx; e.y += vy;
                 } else {
                    e.unstuckDir = -e.unstuckDir!;
                 }
                 e.stuckTimer++;
                 const limit = (e.type === 'boss' || e.type === 'miniboss') ? 20 : 40;
                 if (e.stuckTimer > limit) { 
                     e.state = 'chase'; 
                     e.stuckTimer = 0; 
                     if (e.type === 'boss') e.speed = 0.5; // Reset boss speed
                      if (e.type === 'miniboss') e.speed = 0.8; // Reset miniboss speed
                 }
            } else if (e.state === 'chase') {
                // Vision limit: Stop chasing if too far or no line of sight
                if ((dist > 600 && e.type !== 'boss' && e.type !== 'slimmy' && e.type !== 'serpent' && e.type !== 'shadow_reaper' && e.type !== 'void_architect' && e.type !== 'miniboss') || !e.lastLos) {
                    e.state = 'patrol';
                    e.targetX = e.x;
                    e.targetY = e.y;
                }
                // Low health flee mechanic
                else if (e.hp < e.maxHp * 0.25 && (e.type === 'archer' || e.type === 'mage' || e.type === 'vampire') && Math.random() < 0.01) {
                    e.state = 'flee';
                    e.evadeTimer = 120;
                }
                else if (dist > 500 && (e.type === 'boss' || e.type === 'slimmy' || e.type === 'serpent' || e.type === 'shadow_reaper' || e.type === 'void_architect')) {
                    const homeX = e.targetX || e.x;
                    const homeY = e.targetY || e.y;
                    const distFromHome = Math.hypot(e.x - homeX, e.y - homeY);
                    
                    // Boss logic: return home if player is too far or boss is too far from home
                    if (dist > 500 && distFromHome > 100) {
                        e.state = 'patrol'; 
                    } else if (dist < 250) {
                        e.state = 'attack'; e.attackCd = 20;
                    } else if (Math.random() < 0.01) {
                         // Random Dash pattern
                         e.state = 'unstucking';
                         e.unstuckDir = Math.random() > 0.5 ? 1 : -1;
                         e.speed = (e.type === 'slimmy' ? 1 : 1.5);
                         e.stuckTimer = 0;
                    }
                }
                
                // Restriction to boss room
                if (e.type === 'boss' || e.type === 'slimmy' || e.type === 'serpent' || e.type === 'shadow_reaper' || e.type === 'void_architect') {
                    const bossRoom = rooms.current[currentDungeon.current.bossRoomIdx];
                    if (bossRoom) {
                        const minX = bossRoom.x * GRID_SIZE;
                        const maxX = (bossRoom.x + bossRoom.w) * GRID_SIZE;
                        const minY = bossRoom.y * GRID_SIZE;
                        const maxY = (bossRoom.y + bossRoom.h) * GRID_SIZE;
                        
                        e.x = Math.max(minX + e.size, Math.min(maxX - e.size, e.x));
                        e.y = Math.max(minY + e.size, Math.min(maxY - e.size, e.y));
                    }
                }

                // Restriction: Prevent enemies from entering the starting room (safe zone)
                const spawnRoom = rooms.current[0];
                if (spawnRoom && e.type !== 'boss' && e.type !== 'void_architect' && e.type !== 'nest') {
                    const margin = 2; // Small margin
                    const minX = spawnRoom.x * GRID_SIZE - margin;
                    const maxX = (spawnRoom.x + spawnRoom.w) * GRID_SIZE + margin;
                    const minY = spawnRoom.y * GRID_SIZE - margin;
                    const maxY = (spawnRoom.y + spawnRoom.h) * GRID_SIZE + margin;
                    
                    const wasOutside = oldX < minX || oldX > maxX || oldY < minY || oldY > maxY;
                    if (wasOutside && e.x > minX && e.x < maxX && e.y > minY && e.y < maxY) {
                        // Push out to the closest side
                        const dxL = Math.abs(e.x - minX);
                        const dxR = Math.abs(e.x - maxX);
                        const dyT = Math.abs(e.y - minY);
                        const dyB = Math.abs(e.y - maxY);
                        const minD = Math.min(dxL, dxR, dyT, dyB);
                        
                        if (minD === dxL) e.x = minX;
                        else if (minD === dxR) e.x = maxX;
                        else if (minD === dyT) e.y = minY;
                        else e.y = maxY;
                    }
                }

                // Restriction: Ambush enemies must stay in their room
                if (e.isAmbushEnemy && activeAmbush.current) {
                    const a = activeAmbush.current;
                    const margin = e.size;
                    e.x = Math.max(a.x + margin, Math.min(a.x + a.w - margin, e.x));
                    e.y = Math.max(a.y + margin, Math.min(a.y + a.h - margin, e.y));
                }
                
                const isRanged = e.type === 'archer' || e.type === 'mage' || (e.type === 'miniboss' && e.baseType !== 'warrior' && e.baseType !== 'skeleton') || e.type === 'slimmy' || e.type === 'serpent' || e.type === 'shadow_reaper' || e.type === 'void_architect' || e.type === 'necromancer' || e.type === 'teleporter';
                const isMelee = e.type === 'warrior' || e.type === 'skeleton' || (e.type === 'miniboss' && (e.baseType === 'warrior' || e.baseType === 'skeleton')) || e.type === 'serpent' || e.type === 'charger' || e.type === 'shield_bearer' || e.type === 'bomber';

                if (isRanged && dist < 250 && e.lastLos) { 
                    e.state = 'attack'; 
                    e.attackCd = (e.type === 'boss' || e.type === 'miniboss') ? 20 : 60 * timeScale; 
                }
                else if (isMelee && dist < 55 && e.lastLos) {
                    e.state = 'attack'; 
                    e.attackCd = (e.type === 'miniboss') ? 10 : 15 * timeScale;
                }
                else if (dist > e.size) {
                    if (e.type === 'slimmy') {
                        // Slimmy Leap Logic
                        if (e.jumpTimer === undefined) e.jumpTimer = 60 + Math.random() * 60;
                        if (e.z === undefined) e.z = 0;
                        
                        if (e.jumpTimer > 0) {
                            e.jumpTimer -= 1 * timeScale;
                            // Pre-jump squish or particles?
                            if (Math.random() < 0.1) {
                                particles.current.push({
                                    x: e.x + (Math.random()-0.5)*20, y: e.y + (Math.random()-0.5)*20,
                                    vx: 0, vy: 0, life: 0, maxLife: 30, color: '#32cd32', size: 4
                                });
                            }
                        } else if (e.jumpTargetX === undefined) {
                            // Target player
                            e.jumpTargetX = player.current.x + (Math.random() - 0.5) * 20;
                            e.jumpTargetY = player.current.y + (Math.random() - 0.5) * 20;
                            const dToJump = Math.hypot(e.jumpTargetX - e.x, e.jumpTargetY - e.y);
                            e.speed = (dToJump / 30); // Use speed field to store distance info for z calc
                            audio.playPopSound();
                        } else {
                            // In mid-leap
                            const jdx = e.jumpTargetX - e.x;
                            const jdy = e.jumpTargetY - e.y;
                            const jdistCurrent = Math.hypot(jdx, jdy);
                            const leapSpeed = 10 * timeScale;
                            
                            if (jdistCurrent < leapSpeed) {
                                e.x = e.jumpTargetX;
                                e.y = e.jumpTargetY;
                                e.z = 0;
                                e.jumpTargetX = undefined;
                                e.jumpTargetY = undefined;
                                e.jumpTimer = 100 + Math.random() * 60;
                                e.attackCd = 10; // Attack right after landing
                                shake.current.time = 8;
                                audio.playImpactSound(); 
                                
                                // Impact Particles
                                for(let i=0; i<20; i++) {
                                    const ang = Math.random() * Math.PI * 2;
                                    const s = 2 + Math.random() * 5;
                                    particles.current.push({
                                        x: e.x, y: e.y, vx: Math.cos(ang)*s, vy: Math.sin(ang)*s,
                                        life: 0, maxLife: 40, color: '#32cd32', size: 6
                                    });
                                }
                            } else {
                                e.x += (jdx / jdistCurrent) * leapSpeed;
                                e.y += (jdy / jdistCurrent) * leapSpeed;
                                // Simple arc height calculation
                                // Total distance was stored in e.speed * 30 roughly
                                const totalD = e.speed! * 30;
                                const progress = 1 - (jdistCurrent / totalD);
                                e.z = Math.sin(progress * Math.PI) * (totalD * 0.5);
                            }
                        }
                        updateEnemyDir(e, dx, dy);
                    } else {
                        let vx = (dx / dist) * e.speed * timeScale;
                        let vy = (dy / dist) * e.speed * timeScale;

                        if (e.type === 'serpent') {
                            // Sinuous slithering movement (sine-wave horizontal sway while moving forward)
                            const slitherFreq = time * 7;
                            const slitherAmp = 1.0; 
                            const perpX = -(dy / dist) * e.speed * timeScale;
                            const perpY = (dx / dist) * e.speed * timeScale;
                            vx += Math.sin(slitherFreq) * perpX * slitherAmp;
                            vy += Math.sin(slitherFreq) * perpY * slitherAmp;
                        }

                        if (e.type === 'miniboss') {
                            // Miniboss Movement patterns
                            const isRangedMB = e.baseType !== 'warrior' && e.baseType !== 'skeleton';
                            if (e.circleDir === undefined) e.circleDir = Math.random() > 0.5 ? 1 : -1;
                            
                            if (isRangedMB) {
                                // Ranged Miniboss: Maintain distance and circle
                                const idealDist = 200;
                                const distError = dist - idealDist;
                                const approachSpeed = distError * 0.05;
                                
                                // Tangential velocity (circling)
                                const tx = -(dy / dist) * e.circleDir * e.speed;
                                const ty = (dx / dist) * e.circleDir * e.speed;
                                
                                // Radial velocity (approach/retreat)
                                const rx = (dx / dist) * approachSpeed;
                                const ry = (dy / dist) * approachSpeed;
                                
                                vx = (tx + rx) * timeScale;
                                vy = (ty + ry) * timeScale;

                                // Occasionally reverse circling direction
                                if (Math.random() < 0.005) e.circleDir *= -1;
                            } else {
                                // Melee Miniboss: Zig-zag approach or Dash
                                if (e.dashTimer === undefined) e.dashTimer = 0;
                                
                                if (e.dashTimer > 0) {
                                    // Dashing!
                                    vx = (dx / dist) * e.speed * 4 * timeScale;
                                    vy = (dy / dist) * e.speed * 4 * timeScale;
                                    e.dashTimer -= 1 * timeScale;
                                    
                                    // Dash trail particles
                                    if (Math.random() < 0.3) {
                                        particles.current.push({
                                            x: e.x, y: e.y, vx: 0, vy: 0, life: 0, maxLife: 20, 
                                            color: '#ffcc0033', size: 10
                                        });
                                    }
                                } else {
                                    // Normal zig-zag approach
                                    const zig = Math.sin(time * 5) * 0.8;
                                    const tx = -(dy / dist) * zig * e.speed;
                                    const ty = (dx / dist) * zig * e.speed;
                                    
                                    vx = ((dx / dist) * e.speed + tx) * timeScale;
                                    vy = ((dy / dist) * e.speed + ty) * timeScale;

                                    // 1% chance to start a dash if within reasonable distance
                                    if (dist < 250 && Math.random() < 0.01) {
                                        e.dashTimer = 20;
                                        audio.playBossCharge && audio.playBossCharge();
                                    }
                                }
                            }
                        } else if (e.type === 'boss') {
                            // Restricted to axes for boss - dominant axis check
                            if (Math.abs(dx) > Math.abs(dy)) {
                                vy = 0;
                                vx = Math.sign(dx) * e.speed * timeScale;
                            } else {
                                vx = 0;
                                vy = Math.sign(dy) * e.speed * timeScale;
                            }
                        } else if (e.type === 'charger') {
                            if (dist < 250 && e.lastLos) {
                                vx = (dx / dist) * e.speed * 3.5 * timeScale;
                                vy = (dy / dist) * e.speed * 3.5 * timeScale;
                                if (Math.random() < 0.2) {
                                    particles.current.push({
                                        x: e.x, y: e.y, vx: 0, vy: 0, life: 0, maxLife: 15, color: '#ff440055', size: 8
                                    });
                                }
                            } else {
                                vx = (dx / dist) * e.speed * timeScale;
                                vy = (dy / dist) * e.speed * timeScale;
                            }
                        } else if (e.type === 'bomber') {
                            const isIgnited = e.fuseTimer !== undefined && e.fuseTimer > 0;
                            const speedMultFactor = isIgnited ? 2.2 : 1.5;
                            vx = (dx / dist) * e.speed * speedMultFactor * timeScale;
                            vy = (dy / dist) * e.speed * speedMultFactor * timeScale;
                            
                            if (isIgnited) {
                                // Intense kamikaze rocket trail sparks!
                                if (Math.random() < 0.6) {
                                     particles.current.push({
                                        x: e.x + (Math.random() - 0.5) * e.size,
                                        y: e.y + (Math.random() - 0.5) * e.size,
                                        vx: -vx * 0.35 + (Math.random() - 0.5) * 1.5,
                                        vy: -vy * 0.35 + (Math.random() - 0.5) * 1.5,
                                        life: 0, maxLife: 18,
                                        color: Math.random() < 0.5 ? '#ff3300' : '#ff9900',
                                        size: 2.5 + Math.random() * 3,
                                        noGravity: true
                                     });
                                }
                            } else {
                                if (Math.random() < 0.1) {
                                     particles.current.push({
                                        x: e.x, y: e.y, vx: 0, vy: 0, life: 0, maxLife: 10, color: '#ff6600', size: 3
                                    });
                                }
                            }
                        } else if (e.type === 'teleporter') {
                            if (dist < 120 && Math.random() < 0.05) {
                                const ang = Math.random() * Math.PI * 2;
                                const tDist = 200;
                                const tx = player.current.x + Math.cos(ang) * tDist;
                                const ty = player.current.y + Math.sin(ang) * tDist;
                                if (!checkCollision(tx, ty, e.size)) {
                                    // Visual effect at old pos
                                    for(let i=0; i<10; i++) {
                                        particles.current.push({
                                            x: e.x, y: e.y, vx: (Math.random()-0.5)*4, vy: (Math.random()-0.5)*4,
                                            life: 0, maxLife: 20, color: '#aa00ff', size: 3
                                        });
                                    }
                                    e.x = tx; e.y = ty;
                                    // Visual effect at new pos
                                    for(let i=0; i<10; i++) {
                                        particles.current.push({
                                            x: e.x, y: e.y, vx: (Math.random()-0.5)*4, vy: (Math.random()-0.5)*4,
                                            life: 0, maxLife: 20, color: '#aa00ff', size: 3
                                        });
                                    }
                                }
                            }
                            vx = (dx / dist) * e.speed * timeScale;
                            vy = (dy / dist) * e.speed * timeScale;
                        } else if (e.type === 'necromancer') {
                            // Maintain distance
                            if (dist < 200) {
                                vx = -(dx / dist) * e.speed * timeScale;
                                vy = -(dy / dist) * e.speed * timeScale;
                            } else if (dist > 350) {
                                vx = (dx / dist) * e.speed * timeScale;
                                vy = (dy / dist) * e.speed * timeScale;
                            } else {
                                vx = 0; vy = 0;
                            }
                        } else {
                            vx = (dx / dist) * e.speed * timeScale;
                            vy = (dy / dist) * e.speed * timeScale;
                        }

                        updateEnemyDir(e, vx, vy);
                        
                        if (e.type === 'specter' || e.type === 'serpent' || !checkCollision(e.x + vx, e.y + vy, e.size)) {
                            e.x += vx;
                            e.y += vy;
                        } else if (!checkCollision(e.x + vx, e.y, e.size)) {
                            e.x += vx;
                        } else if (!checkCollision(e.x, e.y + vy, e.size)) {
                            e.y += vy;
                        } else {
                            // Truly stuck - try pushing out of wall
                            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
                                const testX = e.x + Math.cos(angle) * 10;
                                const testY = e.y + Math.sin(angle) * 10;
                                if (!checkCollision(testX, testY, e.size)) {
                                    e.x = testX;
                                    e.y = testY;
                                    break;
                                }
                            }
                        }
                    }

                    // Serpent segments followup
                    if (e.type === 'serpent' && e.segments && (e.x !== oldX || e.y !== oldY)) {
                        let prevX = e.x;
                        let prevY = e.y;
                        const spacing = e.size * 0.8;
                        for (let s = 0; s < e.segments.length; s++) {
                            const seg = e.segments[s];
                            const d = Math.hypot(prevX - seg.x, prevY - seg.y);
                            if (d > spacing) {
                                const angle = Math.atan2(prevY - seg.y, prevX - seg.x);
                                seg.x = prevX - Math.cos(angle) * spacing;
                                seg.y = prevY - Math.sin(angle) * spacing;
                            }
                            prevX = seg.x;
                            prevY = seg.y;
                        }
                    }

                    // Slimmy slime trail
                    if (e.type === 'slimmy' && Math.random() < 0.1) {
                        particles.current.push({
                            x: e.x + (Math.random()-0.5)*20, y: e.y + (Math.random()-0.5)*20,
                            vx: 0, vy: 0, life: 0, maxLife: 100, color: '#32cd3266', size: 8
                        });
                    }
                }
            } else if (e.state === 'attack') {
                const isMeleeEnemy = e.type === 'warrior' || e.type === 'skeleton' || (e.type === 'miniboss' && e.baseType === 'warrior') || (e.type === 'miniboss' && e.baseType === 'skeleton');
                if (isMeleeEnemy && dist > 70) e.state = 'chase';
                else if (!isMeleeEnemy && dist > 400) e.state = 'chase';
                else if (e.attackCd! > 0) {
                    // Slimmy repositioning during cooldown
                    if (e.type === 'slimmy' && Math.random() < 0.05) {
                        e.state = 'unstucking';
                        e.unstuckDir = Math.random() > 0.5 ? 1 : -1;
                        e.stuckTimer = 0;
                    }
                }
                else {
                    const speed = e.type === 'archer' ? 5 : (e.type === 'mage' ? 3 : 4);
                    
                    if (e.type === 'boss' || e.type === 'slimmy' || e.type === 'serpent' || e.type === 'shadow_reaper' || e.type === 'void_architect') {
                        // Boss Patterns
                        const isRage = e.hp < e.maxHp * 0.4;
                        
                        if (e.type === 'slimmy') {
                            e.attackCd = isRage ? 40 : 70;
                            const pattern = Math.random();
                            
                            if (pattern < 0.35) {
                                // Pattern 1: Slime Wave
                                const count = isRage ? 20 : 12;
                                for (let i = 0; i < count; i++) {
                                    const angle = (Math.PI * 2 / count) * i;
                                    projectiles.current.push({
                                        x: e.x, y: e.y,
                                        vx: Math.cos(angle) * 3, vy: Math.sin(angle) * 3,
                                        isEnemy: true, shooterId: e.id,
                                        shooterType: e.type, shooterLevel: e.level,
                                        color: '#32cd32', isHighLevel: true
                                    });
                                }
                                audio.playSlimeSound();
                            } else if (pattern < 0.7) {
                                // Pattern 2: Triple Glob Cannon (tracking)
                                for (let i = -1; i <= 1; i++) {
                                    const angle = Math.atan2(dy, dx) + i * 0.3;
                                    projectiles.current.push({
                                        x: e.x, y: e.y,
                                        vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5,
                                        isEnemy: true, shooterId: e.id,
                                        shooterType: e.type, shooterLevel: e.level,
                                        color: '#adff2f', isHighLevel: true
                                    });
                                }
                                audio.playShootSound();
                            } else {
                                // Pattern 3: Spawn Mini-Slimes
                                const nearbySlimes = enemies.current.filter(other => other.type === 'warrior' && Math.hypot(other.x - e.x, other.y - e.y) < 250).length;
                                if (nearbySlimes < 6 && canSpawnEnemy('warrior')) {
                                    for (let i = 0; i < (isRage ? 3 : 2); i++) {
                                        const ang = Math.random() * Math.PI * 2;
                                        enemies.current.push({
                                            id: Math.random(),
                                            x: e.x + Math.cos(ang) * 50, y: e.y + Math.sin(ang) * 50,
                                            hp: 50, maxHp: 50, size: 12, type: 'warrior', speed: 1.3,
                                            level: e.level, state: 'chase', targetX: player.current.x, targetY: player.current.y,
                                            attackCd: 30, dir: 'down', ...getEnemyDefense('warrior')
                                        });
                                    }
                                    audio.playPopSound();
                                }
                            }
                            shake.current.time = 8;
                        } else if (e.type === 'serpent') {
                            e.attackCd = isRage ? 22 : 40;
                            const pattern = Math.random();
                            
                            if (pattern < 0.3) {
                                // NEW Pattern 1: Cascade Sinuous Waves (Wave-motion poison bullet sprays)
                                const shotCount = isRage ? 12 : 7;
                                for (let i = 0; i < shotCount; i++) {
                                    const spread = (i - (shotCount - 1) / 2) * 0.18;
                                    const angle = Math.atan2(dy, dx) + spread;
                                    projectiles.current.push({
                                        x: e.x, y: e.y,
                                        vx: Math.cos(angle) * (6 + Math.random() * 2), 
                                        vy: Math.sin(angle) * (6 + Math.random() * 2),
                                        isEnemy: true, shooterId: e.id,
                                        shooterType: e.type, shooterLevel: e.level,
                                        color: '#32cd32', size: 10,
                                        special_behavior: 'serpent_sine'
                                    });
                                }
                                audio.playShootSound();
                            } else if (pattern < 0.55) {
                                // NEW Pattern 2: Poison Trap Ring / Inward Constriction
                                const count = isRage ? 12 : 8;
                                const px = player.current.x;
                                const py = player.current.y;
                                
                                for (let i = 0; i < count; i++) {
                                    const angle = (Math.PI * 2 / count) * i;
                                    const ringRadius = 140; 
                                    const startX = px + Math.cos(angle) * ringRadius;
                                    const startY = py + Math.sin(angle) * ringRadius;
                                    
                                    const vx = -Math.cos(angle) * 3;
                                    const vy = -Math.sin(angle) * 3;
                                    
                                    projectiles.current.push({
                                        x: startX, y: startY,
                                        vx, vy,
                                        isEnemy: true, shooterId: e.id,
                                        shooterType: e.type, shooterLevel: e.level,
                                        color: '#00fa9a', size: 12,
                                        special_behavior: 'serpent_contract'
                                    });
                                }
                                audio.playPopSound();
                            } else if (pattern < 0.8) {
                                // NEW Pattern 3: Rotten Dividing Egg Bombs
                                const count = isRage ? 3 : 2;
                                for (let i = 0; i < count; i++) {
                                    const angle = Math.atan2(dy, dx) + (i - (count - 1) / 2) * 0.4;
                                    projectiles.current.push({
                                        x: e.x, y: e.y,
                                        vx: Math.cos(angle) * 4, vy: Math.sin(angle) * 4,
                                        isEnemy: true, shooterId: e.id,
                                        shooterType: e.type, shooterLevel: e.level,
                                        color: '#adff2f', size: 24, 
                                        special_behavior: 'serpent_egg'
                                    });
                                }
                                audio.playShootSound();
                            } else {
                                // NEW Pattern 4: Toxic Dash Strike & Acid Trail (Dash and stationary clouds)
                                const chargeAngle = Math.atan2(dy, dx);
                                const dragSpeed = isRage ? 4.5 : 3.5;
                                e.speed = dragSpeed;
                                e.serpentDashTimer = 45; // Speed boosted for 45 frames
                                
                                // Leave stationary acid pools
                                for (let i = 0; i < (isRage ? 8 : 5); i++) {
                                    const trailDistancePx = i * 22;
                                    projectiles.current.push({
                                        x: e.x - Math.cos(chargeAngle) * trailDistancePx,
                                        y: e.y - Math.sin(chargeAngle) * trailDistancePx,
                                        vx: (Math.random() - 0.5) * 0.4,
                                        vy: (Math.random() - 0.5) * 0.4,
                                        isEnemy: true, shooterId: e.id,
                                        shooterType: e.type, shooterLevel: e.level,
                                        color: 'rgba(154, 205, 50, 0.7)', size: 14,
                                        timer: 160 
                                    });
                                }
                                
                                // Multi-shot scatter
                                for (let j = 0; j < 3; j++) {
                                    projectiles.current.push({
                                        x: e.x, y: e.y,
                                        vx: Math.cos(chargeAngle + (j - 1) * 0.15) * 8,
                                        vy: Math.sin(chargeAngle + (j - 1) * 0.15) * 8,
                                        isEnemy: true, shooterId: e.id,
                                        shooterType: e.type, shooterLevel: e.level,
                                        color: '#32cd32', size: 9
                                    });
                                }
                                audio.playBossExplosion();
                            }
                            shake.current.time = 8;
                        } else if (e.type === 'shadow_reaper') {
                            e.attackCd = isRage ? 35 : 60;
                            const pattern = Math.random();
                            
                            if (pattern < 0.35) {
                                // Pattern 1: Shadow Grasp - Circular projectiles closing in
                                const count = isRage ? 12 : 8;
                                for (let i = 0; i < count; i++) {
                                    const angle = (Math.PI * 2 / count) * i;
                                    const startDist = 180;
                                    projectiles.current.push({
                                        x: player.current.x + Math.cos(angle) * startDist,
                                        y: player.current.y + Math.sin(angle) * startDist,
                                        vx: -Math.cos(angle) * 3, 
                                        vy: -Math.sin(angle) * 3,
                                        isEnemy: true, shooterId: e.id,
                                        shooterType: e.type, shooterLevel: e.level,
                                        color: '#660099', size: 12
                                    });
                                }
                                audio.playBossCharge && audio.playBossCharge();
                            } else if (pattern < 0.7) {
                                // Pattern 2: Void Rift - Teleport and Blast
                                const angleToPlayer = Math.atan2(player.current.y - e.y, player.current.x - e.x);
                                const teleportDist = 150;
                                const newX = player.current.x + Math.cos(angleToPlayer + Math.PI) * teleportDist;
                                const newY = player.current.y + Math.sin(angleToPlayer + Math.PI) * teleportDist;
                                
                                if (!checkCollision(newX, newY, e.size)) {
                                    e.x = newX;
                                    e.y = newY;
                                }
                                
                                // Blast
                                const blastCount = isRage ? 10 : 7;
                                for (let i = 0; i < blastCount; i++) {
                                    const bAngle = Math.atan2(player.current.y - e.y, player.current.x - e.x) + (i - (blastCount - 1) / 2) * 0.2;
                                    projectiles.current.push({
                                        x: e.x, y: e.y,
                                        vx: Math.cos(bAngle) * 8, vy: Math.sin(bAngle) * 8,
                                        isEnemy: true, shooterId: e.id,
                                        shooterType: e.type, shooterLevel: e.level,
                                        color: '#00ffcc', isHighLevel: true
                                    });
                                }
                                audio.playBossLaser && audio.playBossLaser();
                            } else {
                                // Pattern 3: Cursed Pulse - Expanding rings
                                for (let i = 0; i < 24; i++) {
                                    const ang = (Math.PI * 2 / 24) * i;
                                    projectiles.current.push({
                                        x: e.x, y: e.y,
                                        vx: Math.cos(ang) * 4, vy: Math.sin(ang) * 4,
                                        isEnemy: true, shooterId: e.id,
                                        shooterType: e.type, shooterLevel: e.level,
                                        color: '#2d004d', size: 10
                                    });
                                }
                                audio.playBossExplosion && audio.playBossExplosion();
                            }
                            shake.current.time = 10;
                        } else if (e.type === 'void_architect') {
                            e.attackCd = isRage ? 30 : 50;
                            const hRatio = e.hp / e.maxHp;
                            const phase = hRatio > 0.6 ? 1 : (hRatio > 0.3 ? 2 : 3);
                            
                            if (phase === 1) {
                                // Phase 1: Rapid Bolts
                                const shots = 5;
                                for (let i = 0; i < shots; i++) {
                                    const ang = Math.atan2(dy, dx) + (i - (shots-1)/2) * 0.15;
                                    projectiles.current.push({
                                        x: e.x, y: e.y,
                                        vx: Math.cos(ang) * 9, vy: Math.sin(ang) * 9,
                                        isEnemy: true, shooterId: e.id,
                                        shooterType: e.type, shooterLevel: e.level,
                                        color: '#00ffff', size: 10
                                    });
                                }
                                audio.playShootSound();
                            } else if (phase === 2) {
                                // Phase 2: Teleport and Radial Burst
                                const teleportTargetDist = 180;
                                const angToP = Math.random() * Math.PI * 2;
                                const tx = player.current.x + Math.cos(angToP) * teleportTargetDist;
                                const ty = player.current.y + Math.sin(angToP) * teleportTargetDist;
                                
                                if (!checkCollision(tx, ty, e.size)) {
                                    // Portal effect at old location
                                    for(let i=0; i<15; i++) {
                                        particles.current.push({
                                            x: e.x, y: e.y, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10,
                                            life: 0, maxLife: 30, color: '#00ffff', size: 4
                                        });
                                    }
                                    e.x = tx; e.y = ty;
                                    // Portal effect at new location
                                    for(let i=0; i<15; i++) {
                                        particles.current.push({
                                            x: e.x, y: e.y, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10,
                                            life: 0, maxLife: 30, color: '#00ffff', size: 4
                                        });
                                    }
                                }
                                
                                // Radial Burst
                                const count = 16;
                                for (let i = 0; i < count; i++) {
                                    const ang = (Math.PI * 2 / count) * i;
                                    projectiles.current.push({
                                        x: e.x, y: e.y,
                                        vx: Math.cos(ang) * 5, vy: Math.sin(ang) * 5,
                                        isEnemy: true, shooterId: e.id,
                                        shooterType: e.type, shooterLevel: e.level,
                                        color: '#ff00ff', size: 12, isHighLevel: true
                                    });
                                }
                                audio.playBossLaser && audio.playBossLaser();
                            } else {
                                // Phase 3: Void Summons and Supernova
                                const r = Math.random();
                                if (r < 0.4 && canSpawnEnemy('void_fragment')) {
                                    // Summon 3 Fragments
                                    for (let i = 0; i < 3; i++) {
                                        const ang = Math.random() * Math.PI * 2;
                                        enemies.current.push({
                                            id: Math.random(),
                                            x: e.x + Math.cos(ang) * 100, y: e.y + Math.sin(ang) * 100,
                                            hp: 150, maxHp: 150, size: 20, type: 'void_fragment', speed: 2.2,
                                            level: e.level, state: 'chase', targetX: player.current.x, targetY: player.current.y,
                                            attackCd: 30, dir: 'down', ...getEnemyDefense('teleporter')
                                        });
                                    }
                                    audio.playPopSound();
                                } else {
                                    // Supernova: Center of room or player? Center of boss
                                    for (let i = 0; i < 32; i++) {
                                        const ang = (Math.PI * 2 / 32) * i;
                                        projectiles.current.push({
                                            x: e.x, y: e.y,
                                            vx: Math.cos(ang) * 3, vy: Math.sin(ang) * 3,
                                            isEnemy: true, shooterId: e.id,
                                            shooterType: e.type, shooterLevel: e.level,
                                            color: '#ffffff', size: 15, isHighLevel: true, magnetic: true
                                        });
                                    }
                                    audio.playBossExplosion && audio.playBossExplosion();
                                }
                            }
                            shake.current.time = 12;
                        } else {
                            // NEON OVERLORD (Final Boss)
                            e.attackCd = isRage ? 45 : 80;
                            const pattern = Math.random();
                            
                            if (pattern < 0.35) {
                                // Pattern 1: Neon Grid Cross
                                const shots = isRage ? 12 : 8;
                                for (let j = 0; j < 4; j++) {
                                    const baseAngle = (Math.PI / 2) * j;
                                    for (let i = 1; i <= shots; i++) {
                                        projectiles.current.push({
                                            x: e.x + Math.cos(baseAngle) * i * 35,
                                            y: e.y + Math.sin(baseAngle) * i * 35,
                                            vx: 0, vy: 0, life: 80,
                                            isEnemy: true, shooterId: e.id,
                                            shooterType: e.type, shooterLevel: e.level,
                                            color: '#ff00ff', isHighLevel: true
                                        });
                                    }
                                }
                                audio.playBossLaser();
                            } else if (pattern < 0.7) {
                                // Pattern 2: Vacuum Pulse (Radial shots)
                                const count = isRage ? 36 : 24;
                                for(let i = 0; i < count; i++) {
                                    const angle = (Math.PI * 2 / count) * i;
                                    projectiles.current.push({
                                        x: e.x, y: e.y,
                                        vx: Math.cos(angle) * 2, vy: Math.sin(angle) * 2,
                                        isEnemy: true, shooterId: e.id,
                                        shooterType: e.type, shooterLevel: e.level,
                                        color: '#ff6600'
                                    });
                                }
                                audio.playBossCharge();
                            } else {
                                // Pattern 3: Teleport & Blast
                                const bossRoom = rooms.current[currentDungeon.current.bossRoomIdx];
                                if (bossRoom) {
                                    e.x = (bossRoom.x + 1 + Math.random() * (bossRoom.w - 2)) * GRID_SIZE;
                                    e.y = (bossRoom.y + 1 + Math.random() * (bossRoom.h - 2)) * GRID_SIZE;
                                    
                                    // Massive explosion on arrival
                                    for(let i = 0; i < 24; i++) {
                                        const ang = (Math.PI * 2 / 24) * i;
                                        projectiles.current.push({
                                            x: e.x, y: e.y,
                                            vx: Math.cos(ang) * 6, vy: Math.sin(ang) * 6,
                                            isEnemy: true, shooterId: e.id,
                                            shooterType: e.type, shooterLevel: e.level,
                                            color: '#ffffff'
                                        });
                                    }
                                    audio.playBossExplosion();
                                    e.attackCd = 100;
                                }
                            }
                            shake.current.time = 15;
                        }
                    } else if (e.type === 'miniboss') {
                        const effectiveType = e.baseType || 'warrior';
                        if (effectiveType === 'warrior' || effectiveType === 'skeleton') {
                            e.attackCd = 40; // Faster than normal warrior
                            e.slashCd = 15;
                            e.slashAngle = Math.atan2(dy, dx);
                            if (dist < 70 && player.current.flashTimer <= 0) {
                                const difficulty = settingsRef.current.difficulty || 3;
                                const dmgMult = 0.6 + (difficulty - 1) * 0.2;
                                const dmg = Math.floor((15 + Math.floor(e.level * 0.8)) * dmgMult);
                                const finalDmg = getMitigatedDamage(dmg);
                                killerRef.current = { type: e.type, level: e.level, damage: finalDmg };
                                stats.current.hp -= finalDmg;
                                audio.playPlayerHitSound();
                                spawnPlayerHitEffect(player.current.x, player.current.y);
                                spawnPlayerDamagePopup(finalDmg);
                                shake.current.time = 6;
                            }
                        } else if (effectiveType === 'vampire') {
                            e.attackCd = 30;
                            // Special vampire miniboss burst?
                            for(let i = -2; i <= 2; i++) {
                                const angle = Math.atan2(dy, dx) + i * 0.2;
                                projectiles.current.push({
                                    x: e.x, y: e.y,
                                    vx: Math.cos(angle) * (speed + 1), vy: Math.sin(angle) * (speed + 1),
                                    isEnemy: true, shooterId: e.id,
                                    shooterType: effectiveType, shooterLevel: e.level,
                                    color: '#ff0000'
                                });
                            }
                        } else {
                            // Ranged baseTypes (archer, mage, specter)
                            e.attackCd = effectiveType === 'archer' ? 40 : 80;
                            const shots = effectiveType === 'mage' ? 5 : 3;
                            for(let i = 0; i < shots; i++) {
                                const angle = Math.atan2(dy, dx) + (i - (shots - 1)/2) * 0.2;
                                projectiles.current.push({
                                    x: e.x, y: e.y,
                                    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                                    isEnemy: true, shooterId: e.id,
                                    shooterType: effectiveType, shooterLevel: e.level,
                                    color: effectiveType === 'mage' ? '#9933ff' : undefined
                                });
                            }
                        }
                    } else if (e.type === 'warrior') {
                        e.attackCd = 60;
                        e.slashCd = 15;
                        e.slashAngle = Math.atan2(dy, dx);
                        if (dist < 55 && player.current.flashTimer <= 0) {
                            const difficulty = settingsRef.current.difficulty || 3;
                            const dmgMult = 0.6 + (difficulty - 1) * 0.2;
                            const dmg = Math.floor((10 + Math.floor(e.level * 0.5)) * dmgMult);
                            const finalDmg = getMitigatedDamage(dmg);
                            killerRef.current = { type: e.type, level: e.level, damage: finalDmg };
                            stats.current.hp -= finalDmg;
                            audio.playPlayerHitSound();
                            spawnPlayerHitEffect(player.current.x, player.current.y);
                            spawnPlayerDamagePopup(finalDmg);
                            shake.current.time = 4;
                        }
                    } else if (e.type === 'skeleton') {
                        e.attackCd = 45;
                        e.slashCd = 12;
                        e.slashAngle = Math.atan2(dy, dx);
                        if (dist < 55 && player.current.flashTimer <= 0) {
                            const difficulty = settingsRef.current.difficulty || 3;
                            const dmgMult = 0.6 + (difficulty - 1) * 0.2;
                            const dmg = Math.floor((12 + Math.floor(e.level * 0.6)) * dmgMult);
                            const finalDmg = getMitigatedDamage(dmg);
                            killerRef.current = { type: e.type, level: e.level, damage: finalDmg };
                            stats.current.hp -= finalDmg;
                            audio.playPlayerHitSound();
                            spawnPlayerHitEffect(player.current.x, player.current.y);
                            spawnPlayerDamagePopup(finalDmg);
                            shake.current.time = 4;
                        }
                    } else if (e.type === 'archer') {
                        e.attackCd = 100;
                        projectiles.current.push({
                            x: e.x, y: e.y,
                            vx: Math.cos(Math.atan2(dy, dx)) * speed,
                            vy: Math.sin(Math.atan2(dy, dx)) * speed,
                            isEnemy: true, shooterId: e.id,
                            shooterType: e.type, shooterLevel: e.level
                        });
                        audio.playShootSound();
                        e.state = 'flee'; e.evadeTimer = 60;
                    } else if (e.type === 'mage') {
                        e.attackCd = 150;
                        projectiles.current.push({
                            x: e.x, y: e.y,
                            vx: Math.cos(Math.atan2(dy, dx)) * speed,
                            vy: Math.sin(Math.atan2(dy, dx)) * speed,
                            isEnemy: true, shooterId: e.id,
                            shooterType: e.type, shooterLevel: e.level,
                            color: '#9933ff'
                        });
                        audio.playFireballSound();
                        e.state = 'flee'; e.evadeTimer = 90;
                    } else if (e.type === 'vampire') {
                        e.attackCd = 120;
                        projectiles.current.push({
                            x: e.x, y: e.y,
                            vx: Math.cos(Math.atan2(dy, dx)) * speed,
                            vy: Math.sin(Math.atan2(dy, dx)) * speed,
                            isEnemy: true, shooterId: e.id,
                            shooterType: e.type, shooterLevel: e.level,
                            color: '#ff0000'
                        });
                        audio.playVampireSound();
                        e.state = 'flee'; e.evadeTimer = 60;
                    } else if (e.type === 'charger') {
                        e.attackCd = 40;
                        if (dist < 60 && player.current.flashTimer <= 0) {
                            const dmg = Math.floor((15 + e.level * 2) * (settingsRef.current.difficulty || 3) * 0.3);
                            const finalDmg = getMitigatedDamage(dmg);
                            killerRef.current = { type: e.type, level: e.level, damage: finalDmg };
                            stats.current.hp -= finalDmg;
                            audio.playPlayerHitSound();
                            spawnPlayerHitEffect(player.current.x, player.current.y);
                            spawnPlayerDamagePopup(finalDmg);
                            shake.current.time = 8;
                        }
                    } else if (e.type === 'bomber') {
                        // Bomber doesn't instantly explode on contact anymore.
                        // Instead, it relies on its fuse timer triggered by player hits.
                        e.attackCd = 30;
                    } else if (e.type === 'necromancer') {
                        e.attackCd = 180; // Slow attack
                        if (canSpawnEnemy('skeleton')) {
                            const spot = findSafeSpawnPosition(e.x, e.y, 14, 30, 60);
                            if (spot) {
                                enemies.current.push({
                                    id: Math.random(),
                                    x: spot.x, y: spot.y,
                                    hp: 40 + e.level * 5, maxHp: 40 + e.level * 5,
                                    size: 14, type: 'skeleton', speed: 1.5,
                                    level: e.level, state: 'chase', targetX: player.current.x, targetY: player.current.y,
                                    isAmbushEnemy: e.isAmbushEnemy,
                                    attackCd: 30, dir: 'down',
                                    ...getEnemyDefense('skeleton')
                                });
                                audio.playPopSound();
                            }
                        }
                    } else if (e.type === 'teleporter') {
                        e.attackCd = 80;
                        projectiles.current.push({
                            x: e.x, y: e.y,
                            vx: Math.cos(Math.atan2(dy, dx)) * speed * 1.5,
                            vy: Math.sin(Math.atan2(dy, dx)) * speed * 1.5,
                            isEnemy: true, shooterId: e.id,
                            shooterType: e.type, shooterLevel: e.level,
                            color: '#aa00ff'
                        });
                        audio.playFireballSound && audio.playFireballSound();
                    } else {
                        e.attackCd = 120;
                        projectiles.current.push({
                            x: e.x, y: e.y,
                            vx: (dx / dist) * speed, vy: (dy / dist) * speed,
                            isEnemy: true, shooterId: e.id,
                            shooterType: e.type, shooterLevel: e.level
                        });
                    }
                }
            } else if (e.state === 'evade') {
                if (e.evadeTimer !== undefined && e.evadeTimer > 0) {
                    e.evadeTimer -= 1 * timeScale;
                    const evadeSpeed = e.speed * timeScale;
                    const vx = e.evadeDirX! * evadeSpeed;
                    const vy = e.evadeDirY! * evadeSpeed;
                    updateEnemyDir(e, vx, vy);
                    
                    if (e.type === 'specter' || !checkCollision(e.x + vx, e.y + vy, e.size)) {
                        e.x += vx;
                        e.y += vy;
                    } else if (!checkCollision(e.x + vx, e.y, e.size)) {
                        e.x += vx;
                    } else if (!checkCollision(e.x, e.y + vy, e.size)) {
                        e.y += vy;
                    }
                } else {
                    e.state = 'chase';
                }
            }
            // Damage player if touch
            if (dist < e.size + 10 && player.current.flashTimer <= 0) {
                if (Math.random() < 0.1) {
                    const diffMult = 0.6 + ((settingsRef.current.difficulty || 3) - 1) * 0.2;
                    const rawDamage = (e.type === 'boss' ? 5 : 2) * diffMult;
                    const finalDamage = getMitigatedDamage(rawDamage);
                    killerRef.current = { type: e.type, level: e.level, damage: finalDamage };
                    stats.current.hp -= finalDamage;
                    audio.playPlayerHitSound();
                    spawnPlayerHitEffect(player.current.x, player.current.y);
                    spawnPlayerDamagePopup(finalDamage);
                    shake.current.time = e.type === 'boss' ? 8 : 5;
                    shake.current.intensity = e.type === 'boss' ? 10 : 5;
                }
            }
        });

        // Pet AI logic
        pets.current.forEach(pet => {
            pet.attackCd = Math.max(0, pet.attackCd - 1 * timeScale);
            
            // Find target
            let nearestEnemy: Enemy | null = null;
            let minDist = Infinity;
            enemies.current.forEach(e => {
                if (e.hp > 0) {
                    const d = Math.hypot(e.x - pet.x, e.y - pet.y);
                    if (d < 300 && d < minDist && hasLineOfSight(pet.x, pet.y, e.x, e.y)) {
                        minDist = d;
                        nearestEnemy = e;
                    }
                }
            });

            if (nearestEnemy) {
                pet.state = 'chase';
                pet.targetId = nearestEnemy.id;
                
                const angle = Math.atan2(nearestEnemy.y - pet.y, nearestEnemy.x - pet.x);
                const speed = pet.speed * 1.5 * timeScale;
                
                // Keep some distance to shoot
                if (minDist > 100) {
                    const vx = Math.cos(angle) * speed;
                    const vy = Math.sin(angle) * speed;
                    if (!checkCollision(pet.x + vx, pet.y + vy, pet.size)) {
                        pet.x += vx;
                        pet.y += vy;
                    }
                }

                // Attack logic (Auto-star)
                if (pet.attackCd <= 0) {
                    pet.attackCd = 60; // 1 shot per second approx
                    const pSpeed = 6;
                    projectiles.current.push({
                        x: pet.x, y: pet.y,
                        vx: Math.cos(angle) * pSpeed,
                        vy: Math.sin(angle) * pSpeed,
                        isEnemy: false,
                        shooterId: 999, // Pet ID dummy
                        color: '#00ffff',
                        homing: true,
                        homingRange: 200,
                        special_behavior: 'auto_star',
                        damageMult: 0.5 // Half player damage as requested
                    });
                    audio.playShootSound();
                }
            } else {
                pet.state = 'follow';
                const distToPlayer = Math.hypot(player.current.x - pet.x, player.current.y - pet.y);
                if (distToPlayer > 80) {
                    const angle = Math.atan2(player.current.y - pet.y, player.current.x - pet.x);
                    const speed = pet.speed * 1.2 * timeScale;
                    const vx = Math.cos(angle) * speed;
                    const vy = Math.sin(angle) * speed;
                    if (!checkCollision(pet.x + vx, pet.y + vy, pet.size)) {
                        pet.x += vx;
                        pet.y += vy;
                    }
                }
            }

            // Damage from projectiles
            projectiles.current.forEach(proj => {
                if (proj.isEnemy && Math.hypot(proj.x - pet.x, proj.y - pet.y) < pet.size) {
                    pet.hp -= 10;
                    proj.x = -9999;
                    for(let k=0; k<3; k++) {
                        particles.current.push({
                            x: pet.x, y: pet.y,
                            vx: (Math.random()-0.5)*4, vy: (Math.random()-0.5)*4,
                            life: 0, maxLife: 20, color: '#00ffff', size: 2
                        });
                    }
                }
            });
        });

        pets.current = pets.current.filter(pet => {
            if (pet.hp <= 0) {
                // Death particles
                for (let k = 0; k < 20; k++) {
                   particles.current.push({
                       x: pet.x, y: pet.y,
                       vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
                       life: 0, maxLife: 40, color: '#00ffff', size: 3
                   });
                }
                return false;
            }
            return true;
        });

        // Resolve enemy overlapping (pushing)
        const playerX = player.current.x;
        const playerY = player.current.y;
        enemies.current.forEach((e1, i) => {
            // Optimization: Skip overlapping checks for off-screen/far away enemies to save game execution lag!
            const dist1 = Math.hypot(e1.x - playerX, e1.y - playerY);
            if (dist1 > 450) return;
            
            // Failsafe inside-wall ejection
            const gx = Math.floor(e1.x / GRID_SIZE);
            const gy = Math.floor(e1.y / GRID_SIZE);
            const h = dungeon.current.length;
            const w = dungeon.current[0].length;
            const tile = dungeon.current[gy] ? dungeon.current[gy][gx] : 0;
            const isWalkable = tile === 1 || tile === 3 || tile === 4;
            if (gy < 0 || gy >= h || gx < 0 || gx >= w || !isWalkable) {
                // If stuck deep inside a wall block (0 or 2), gently pull towards player
                e1.x += (player.current.x - e1.x) * 0.05;
                e1.y += (player.current.y - e1.y) * 0.05;
            }

            enemies.current.forEach((e2, j) => {
                if (i >= j) return;
                const minD = e1.size + e2.size;
                const dx = e1.x - e2.x;
                const dy = e1.y - e2.y;
                if (Math.abs(dx) > minD || Math.abs(dy) > minD) return;
                
                const distV = Math.hypot(dx, dy);
                if (distV < minD && distV > 0) {
                    const angle = Math.atan2(e1.y - e2.y, e1.x - e2.x);
                    const overlap = minD - distV;
                    const pushX = Math.cos(angle) * (overlap / 2);
                    const pushY = Math.sin(angle) * (overlap / 2);
                    
                    // Basic wall collision check before applying push (use slightly larger size for safety padding)
                    if (!checkCollision(e1.x + pushX, e1.y + pushY, e1.size + 2)) {
                        e1.x += pushX * 0.8;
                        e1.y += pushY * 0.8;
                    }
                    if (!checkCollision(e2.x - pushX, e2.y - pushY, e2.size + 2)) {
                        e2.x -= pushX * 0.8;
                        e2.y -= pushY * 0.8;
                    }
                }
            });
        });

        // Loot logic
        nearbyWeaponRef.current = null;
        let closestWeaponDist = 95;
        let closestWeaponRefItem: any = null;
        loot.current.forEach(l => {
            if (l.type === 'weapon') {
                const dist = Math.hypot(l.x - player.current.x, l.y - player.current.y);
                if (dist < closestWeaponDist) {
                    closestWeaponDist = dist;
                    closestWeaponRefItem = l;
                    nearbyWeaponRef.current = l.name && WEAPONS[l.name] ? l.name : Object.keys(WEAPONS)[0];
                }
            }
        });

        let pickedUpWeaponThisFrame = false;
        
        for (let i = loot.current.length - 1; i >= 0; i--) {
            const l = loot.current[i];

        // Loot physics and Magnet
        const newX = l.x + l.vx;
        const newY = l.y + l.vy;
        
        // Bounce off walls
        if (checkCollision(newX, newY, 12)) {
            // Find push direction away from walls
            const gx = Math.floor(l.x / GRID_SIZE);
            const gy = Math.floor(l.y / GRID_SIZE);
            const tileCenterX = gx * GRID_SIZE + GRID_SIZE / 2;
            const tileCenterY = gy * GRID_SIZE + GRID_SIZE / 2;
            const pushDirX = tileCenterX - l.x;
            const pushDirY = tileCenterY - l.y;
            const distToCenter = Math.hypot(pushDirX, pushDirY);
            if (distToCenter > 0.1) {
                l.vx += (pushDirX / distToCenter) * 1.5;
                l.vy += (pushDirY / distToCenter) * 1.5;
            }
            l.vx = -l.vx * 0.4;
            l.vy = -l.vy * 0.4;
        } else {
            l.x = newX;
            l.y = newY;
        }
        
        l.vx *= 0.85;
        l.vy *= 0.85;
        l.z += l.vz;
        l.vz += 0.4; // Gravity
        if (l.z >= 0) {
            l.z = 0;
            l.vz *= -0.2; // Bounce
            if (Math.abs(l.vz) < 0.2) l.vz = 0; // Stop
        }
        
        // Magnet effect preparation
        let shouldMagnetize = true;
        
        // Stuck prevention: if definitively in a wall, push toward center of tile (safer than towards player for everything)
        if (checkCollision(l.x, l.y, 8)) {
            const gx = Math.floor(l.x / GRID_SIZE);
            const gy = Math.floor(l.y / GRID_SIZE);
            const tx = gx * GRID_SIZE + GRID_SIZE / 2;
            const ty = gy * GRID_SIZE + GRID_SIZE / 2;
            
            // For weapons, check ownership first for magnet behavior
            if (l.type === 'weapon') {
                const wName = l.name && WEAPONS[l.name] ? l.name : null;
                const isOwned = wName && (wName === stats.current.physicalWeapon || wName === stats.current.magicWeapon);
                if (!isOwned) shouldMagnetize = false;
            }

            if (shouldMagnetize) {
                const pDx = player.current.x - l.x;
                const pDy = player.current.y - l.y;
                const pDist = Math.max(1, Math.hypot(pDx, pDy));
                l.x += (pDx / pDist) * 3;
                l.y += (pDy / pDist) * 3;
            } else {
                l.x += (tx - l.x) * 0.2;
                l.y += (ty - l.y) * 0.2;
            }
        }
        
        // Re-verify magnet effect for weapons if not already done in stuck prevention
        if (l.type === 'weapon') {
            const wName = l.name && WEAPONS[l.name] ? l.name : null;
            const isOwned = wName && (wName === stats.current.physicalWeapon || wName === stats.current.magicWeapon);
            if (!isOwned) {
                shouldMagnetize = false;
            }
        }

        if (shouldMagnetize && l.z === 0 && l.spawnTime && (Date.now() / 1000 - l.spawnTime > 0.4)) {
            const dx = player.current.x - l.x;
            const dy = player.current.y - l.y;
            const dist = Math.hypot(dx, dy);
            if (dist < GRID_SIZE * 3 && dist > 5) {
                const magnetSpeed = (dist < 20 ? 8 : 4) * timeScale;
                const nextX = l.x + (dx / dist) * magnetSpeed;
                const nextY = l.y + (dy / dist) * magnetSpeed;
                if (!checkCollision(nextX, nextY, 8)) {
                    l.x = nextX;
                    l.y = nextY;
                }
            }
        }
            
            // Inter-loot repulsion (improved)
            for(let j = i - 1; j >= 0; j--) {
                const l2 = loot.current[j];
                const dx = l.x - l2.x;
                const dy = l.y - l2.y;
                const distToOther = Math.hypot(dx, dy);
                const minDistance = (l.type === 'weapon' || l2.type === 'weapon') ? 40 : 22;
                if (distToOther < minDistance && distToOther > 0.1) {
                    const angle = Math.atan2(dy, dx);
                    const overlap = minDistance - distToOther;
                    const pushFactor = l.z === 0 ? 0.3 : 0.1;
                    l.x += Math.cos(angle) * overlap * pushFactor;
                    l.y += Math.sin(angle) * overlap * pushFactor;
                    l2.x -= Math.cos(angle) * overlap * pushFactor;
                    l2.y -= Math.sin(angle) * overlap * pushFactor;
                }
            }

            // Piling logic
            if (l.type === 'gold') {
                for(let j = i - 1; j >= 0; j--) {
                    const l2 = loot.current[j];
                    if (l2.type === 'gold') {
                        const distToOther = Math.hypot(l.x - l2.x, l.y - l2.y);
                        if (distToOther < 10) {
                             l.value = (l.value as number) + (l2.value as number);
                             loot.current.splice(j, 1);
                             i--;
                        }
                    }
                }
            }
            
            const dist = Math.hypot(l.x - player.current.x, l.y - player.current.y);
            
             if (l.type === 'relic' && dist < 40) {                
                 const rel = RELICS.find(r => r.id === l.value) || RELICS[0];
                 stats.current.relics.push(rel);
                 rel.effect(stats.current);
                 loot.current.splice(i, 1);
                 audio.playWinSound();
             }
             
             if (l.type === 'weapon' && dist < 95) {
                const pickedName = l.name && WEAPONS[l.name] ? l.name : Object.keys(WEAPONS)[0];
                const isIdentical = stats.current.physicalWeapon === pickedName || stats.current.magicWeapon === pickedName;

                if (l !== closestWeaponRefItem && !isIdentical) continue;
                if (pickedUpWeaponThisFrame) continue;
                
                const pickupCooldownOk = Date.now() - player.current.lastPickupTime > 800; // piccola pausa
                const spawnDelayOk = (Date.now() / 1000) - (l.spawnTime || 0) > 1.5;
                const isExtremelyClose = dist < 45;

                // Existing weapon pickup logic
                const clickedRecently = Date.now() - player.current.lastAttackTime < 300;
                const isFirePressed = pickingUpWeapon || keys.current['e'] || keys.current['E']; 
                // Allow picking up identical items even during ambushes
                const canPickup = !activeAmbush.current || isIdentical;

                // If user is intentionally clicking, bypass the tiny cooldown to prevent "blocked" feeling with 2 weapons
                const isIntentional = clickedRecently || isFirePressed;

                const willPickup = canPickup && ( 
                    (isIdentical && dist < 95) || // Auto pick identical without cooldown up to regular range
                    (isIntentional && spawnDelayOk && pickupCooldownOk)
                );

                if (willPickup) {
                    audio.playWinSound();
                    if (!isIdentical) {
                        player.current.lastPickupTime = Date.now(); // only set cooldown to enforce pause when swapping
                    }
                    pickedUpWeaponThisFrame = true;
                    const wDef = WEAPONS[pickedName];
                    if (wDef.type === 'sword' || wDef.type === 'boomerang' || wDef.type === 'hammer') {
                        stats.current.itemsCollected++;
                        showTrophyProgress('loot_goblin');
                        stats.current.weaponsCollected = (stats.current.weaponsCollected || 0) + 1;
                        showTrophyProgress('weapon_master');
                        if (l.rarity === 'legendary') {
                            stats.current.rareDropsCollected++;
                            showTrophyProgress('cyber_collector');
                        }
                        checkTrophies();

                        if (stats.current.physicalWeapon === pickedName) {
                            const oldStacks = stats.current.physicalStacks;
                            stats.current.physicalStacks = Math.min(9, stats.current.physicalStacks + 1);
                            if (stats.current.physicalStacks > oldStacks) {
                                stats.current.weaponsUpgraded = (stats.current.weaponsUpgraded || 0) + 1;
                                showTrophyProgress('upgrade_me');
                            }
                            triggerWeaponLevelUpAnimation(pickedName, false, stats.current.physicalStacks);
                        } else {
                            stats.current.physicalWeapon = pickedName;
                            stats.current.physicalWeaponRarity = l.rarity || 'common';
                            stats.current.physicalStacks = 1;
                        }
                    } else {
                        stats.current.itemsCollected++;
                        showTrophyProgress('loot_goblin');
                        stats.current.weaponsCollected = (stats.current.weaponsCollected || 0) + 1;
                        showTrophyProgress('weapon_master');
                        if (l.rarity === 'legendary') {
                            stats.current.rareDropsCollected++;
                            showTrophyProgress('cyber_collector');
                        }
                        checkTrophies();

                        if (stats.current.magicWeapon === pickedName) {
                            const oldStacks = stats.current.magicStacks;
                            stats.current.magicStacks = Math.min(9, stats.current.magicStacks + 1);
                            if (stats.current.magicStacks > oldStacks) {
                                stats.current.weaponsUpgraded = (stats.current.weaponsUpgraded || 0) + 1;
                                showTrophyProgress('upgrade_me');
                            }
                            triggerWeaponLevelUpAnimation(pickedName, true, stats.current.magicStacks);
                        } else {
                            stats.current.magicWeapon = pickedName;
                            stats.current.magicWeaponRarity = l.rarity || 'common';
                            stats.current.magicStacks = 1;
                        }
                    }
                    loot.current.splice(i, 1);
                    continue;
                }
            } else if (dist < 48 && l.spawnTime && (Date.now() / 1000 - l.spawnTime > 0.15)) {
                // Automatic Pickup for other items
                if (l.type === 'gold' || l.type === 'potion_hp' || l.type === 'potion_mp' || l.type === 'potion_xp' || l.type === 'potion_speed' || l.type === 'potion_str' || l.type === 'potion_crit' || l.type === 'gem' || l.type === 'crystal' || l.type === 'cosmetic' || l.type === 'relic') {
                        if (l.type === 'relic') {
                            stats.current.maxHp += 20;
                            stats.current.hp += 20;
                            stats.current.mpRegenBoost += 0.2;
                            levelMessage.current = { text: settingsRef.current.language === 'it' ? 'RELIQUIA ANTICA TROVATA!' : 'ANCIENT RELIC FOUND!', timer: 180 };
                            audio.playPowerUpSound();
                        }
                        else if (l.type === 'gold') {
                            const bonus = 1 + (stats.current.extraGoldPct || 0) / 100;
                            stats.current.gold += Math.floor((l.value as number) * bonus);
                            audio.playCoinSound();
                        }
                        else if (l.type === 'potion_hp') { stats.current.hp = Math.min(stats.current.maxHp, stats.current.hp + (l.value as number)); audio.playDropSound('potion'); }
                        else if (l.type === 'potion_mp') { stats.current.mp = Math.min(stats.current.maxMp, stats.current.mp + (l.value as number)); audio.playDropSound('potion'); }
                        else if (l.type === 'potion_xp') { stats.current.exp += (l.value as number); audio.playDropSound('potion'); }
                        else if (l.type === 'potion_speed') { 
                            // Speed boost: temporary stats? No, let's just multiply current speed temporarily
                            player.current.flashTimer = 180; // Repurpose flashTimer for speed visual? Or add new one
                            // Actually let's just give a flat score/gold for now if we don't have a buff system
                            stats.current.score += 500;
                            audio.playWinSound();
                        }
                        else if (l.type === 'potion_str') {
                            stats.current.strength += (l.value as number);
                            audio.playDropSound('potion');
                        }
                        else if (l.type === 'potion_crit') {
                            stats.current.critChance = Math.min(0.5, stats.current.critChance + (l.value as number));
                            audio.playDropSound('potion');
                        }
                        else if (l.type === 'gem') { 
                            if (l.value === 'XP 50%') {
                                stats.current.exp += stats.current.nextExp * 0.5;
                                audio.playDropSound('gem');
                            } else {
                                stats.current.score += 500; 
                                stats.current.gold += 50; // Give some gold so it's noticeable
                                audio.playDropSound('gem'); 
                            }
                        }
                        else if (l.type === 'crystal') { stats.current.score += 1000; stats.current.gold += 250; audio.playDropSound('gem'); spawnLoot(l.x, l.y, 'crystal'); }
                        else if (l.type === 'cosmetic') {
                            stats.current.score += 5000;
                            audio.playWinSound();
                            // Visual feedback
                            for (let k = 0; k < 50; k++) {
                                particles.current.push({
                                    x: player.current.x, y: player.current.y,
                                    vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
                                    life: 0, maxLife: 60, color: l.color, size: Math.random() * 5
                                });
                            }
                        }
                        else if (l.type === 'pet') {
                            const petLvl = Math.max(1, Math.floor(stats.current.lvl / 2));
                            const petHp = Math.floor(stats.current.maxHp / 2);
                            pets.current.push({
                                id: Math.random(),
                                x: l.x, y: l.y,
                                hp: petHp, maxHp: petHp,
                                level: petLvl,
                                size: 12,
                                speed: 2,
                                attackCd: 0,
                                state: 'follow'
                            });
                            audio.playWinSound();
                        }

                        for (let k = 0; k < 5; k++) {
                            particles.current.push({
                                x: l.x, y: l.y,
                                vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4 - 2,
                                life: 0, maxLife: 20 + Math.random() * 10,
                                color: l.color, size: 2 + Math.random() * 2
                            });
                        }
                        loot.current.splice(i, 1);
                        continue;
                    }
                }
            }

        // Screen logic

        // MP Regen
        let finalMpRegenBoost = stats.current.mpRegenBoost;

        for (let i = corpses.current.length - 1; i >= 0; i--) {
            const vc = corpses.current[i];
            vc.timer -= 1 * timeScale;
            
            const distToPlayer = Math.hypot(player.current.x - vc.x, player.current.y - vc.y);
            const canSuck = vc.type === 'vampire' || vc.type === 'mage';
            
            // "marcio" if timer <= 1200 (i.e. > 30 seconds old)
            const isMarcio = vc.timer <= 1200;
            const regenMultiplier = isMarcio ? 0.5 : 1.0;

            if (distToPlayer < 200 && canSuck) {
                vc.suckStarted = true;
                if (Math.random() < 0.1 * regenMultiplier) audio.playSuckSound();
                
                if (vc.type === 'vampire') {
                    // Heal player 
                    if (stats.current.hp < stats.current.maxHp) {
                        stats.current.hp = Math.min(stats.current.maxHp, stats.current.hp + 0.5 * regenMultiplier * timeScale);
                    } else {
                        // Bonus MP regen if HP full
                        const boostBase = (stats.current.mpRegenBoost + 100) * 3 - 100;
                        finalMpRegenBoost = isMarcio ? boostBase / 2 : boostBase;
                    }
                    
                    // Red particles going to player
                    if (Math.random() < 0.3 * regenMultiplier) {
                        particles.current.push({
                            x: vc.x, y: vc.y,
                            vx: (player.current.x - vc.x) * 0.02,
                            vy: (player.current.y - vc.y) * 0.02,
                            life: 0, maxLife: 30,
                            color: '#ff0000', size: 2,
                            targetX: player.current.x, targetY: player.current.y,
                            type: 'vampire_heal'
                        });
                    }
                } else if (vc.type === 'mage') {
                    // Dren MP
                    stats.current.mp = Math.min(stats.current.maxMp, stats.current.mp + 0.8 * regenMultiplier * timeScale);
                    
                    // Blue particles going to player
                    if (Math.random() < 0.3 * regenMultiplier) {
                        particles.current.push({
                            x: vc.x, y: vc.y,
                            vx: (player.current.x - vc.x) * 0.02,
                            vy: (player.current.y - vc.y) * 0.02,
                            life: 0, maxLife: 30,
                            color: '#00ffff', size: 2,
                            targetX: player.current.x, targetY: player.current.y,
                            type: 'vampire_heal'
                        });
                    }
                }
            } else {
                vc.suckStarted = false;
            }

            if (vc.timer < 60) {
                vc.alpha = vc.timer / 60;
            }

            if (vc.timer <= 0) {
                corpses.current.splice(i, 1);
            }
        }

        // HP & MP Regen
        const mpRegenPerSecond = 10.0 * (1 + finalMpRegenBoost / 100);
        stats.current.mp = Math.min(stats.current.maxMp, stats.current.mp + (mpRegenPerSecond / 60) * timeScale);

        if (stats.current.hp < stats.current.maxHp && stats.current.hpRegen > 0) {
            stats.current.hp = Math.min(stats.current.maxHp, stats.current.hp + (stats.current.hpRegen / 60) * timeScale);
        }

        // Level Up Logic
        if (stats.current.exp >= stats.current.nextExp) {
            stats.current.lvl++;
            stats.current.skillPoints++;
            stats.current.exp -= stats.current.nextExp;
            stats.current.nextExp = getNextExp(stats.current.lvl);
            stats.current.maxHp += 10;
            stats.current.hp = stats.current.maxHp;
            stats.current.maxMp += 5;
            stats.current.mp = stats.current.maxMp;
            
            audio.playLevelUpSound();
            stats.current.score += 500 * stats.current.lvl;
            
            setShowLevelUpSlots(true);
            setShowLevelUpText(true);
            setTimeout(() => setShowLevelUpText(false), 2500);
            pauseRef.current = true;
            
            audio.setMusicSpeed(1.0);
            
            // Level up particles
            player.current.flashTimer = 3 * 60; // 3 seconds at 60 fps
            for (let i = 0; i < 12; i++) {
                const angle = (Math.PI * 2 / 12) * i;
                const dist = 150;
                particles.current.push({
                    x: player.current.x + Math.cos(angle) * dist,
                    y: player.current.y + Math.sin(angle) * dist,
                    vx: 0, vy: 0,
                    targetX: player.current.x,
                    targetY: player.current.y,
                    life: 0, maxLife: 60,
                    color: '#00ff88', size: 5
                });
            }
        }

        // Update HUD DOM
        const el = (id: string, fn: (el: HTMLElement) => void) => {
            const e = document.getElementById(id);
            if (e) fn(e);
        };
        const st = stats.current;
        el('hp-text', e => e.textContent = `${Math.floor(st.hp)}/${st.maxHp}`);
        el('hp-bar', e => e.style.width = `${Math.max(0, st.hp/st.maxHp*100)}%`);
        el('mp-text', e => e.textContent = `${Math.floor(st.mp)}/${st.maxMp}`);
        el('mp-bar', e => e.style.width = `${Math.max(0, st.mp/st.maxMp*100)}%`);
        el('lvl-text', e => e.textContent = `${st.lvl}`);
        el('exp-text', e => e.textContent = `${Math.floor(st.exp)}/${st.nextExp}`);
        el('exp-bar', e => e.style.width = `${Math.max(0, st.exp/st.nextExp*100)}%`);
        el('score-text', e => e.textContent = st.score.toString().padStart(5, '0'));
        el('gold-text', e => e.textContent = st.gold.toString());
        el('dungeon-lvl-text', e => e.textContent = st.dungeonLevel.toString());
        
        const mobInfo = lastHitMobRef.current;
        const lang = settingsRef.current.language === 'it' ? 'it' : 'en';
        let mobText = '';
        let mobHpRatio = 0;
        let isMobActive = false;
        let isInRange = false;
        if (mobInfo) {
            const entry = ENEMY_NAMES[mobInfo.type];
            mobText = `${entry ? entry[lang] : mobInfo.type} Lv.${mobInfo.level}`;
            const activeMob = mobInfo.id ? enemies.current.find(e => e.id === mobInfo.id) : null;
            const isAlive = activeMob && activeMob.hp > 0;

            if (isAlive) {
                mobInfo.deathTime = null; // reset if somehow reactivated
                mobHpRatio = Math.max(0, activeMob.hp / (activeMob.maxHp || 1));
                isMobActive = true;
                
                const distPx = Math.hypot(activeMob.x - player.current.x, activeMob.y - player.current.y);
                const distMeters = Math.round(distPx / 32); // Each tile (64px) is about 2 meters
                mobText += ` <span style="font-size: 0.85em; opacity: 0.8; margin-left: 4px; font-variant-numeric: tabular-nums;">${distMeters}m</span>`;

                const wp = WEAPONS[st.physicalWeapon] || WEAPONS['Spada Base'];
                const weaponReach = wp.range || 100;
                if (distPx <= weaponReach * 1.15) { 
                    isInRange = true;
                }
            } else {
                if (mobInfo.deathTime === null || mobInfo.deathTime === undefined) {
                    mobInfo.deathTime = Date.now();
                }
                const elapsedSinceDeath = Date.now() - mobInfo.deathTime;
                if (elapsedSinceDeath < 5000) {
                    isMobActive = true;
                    mobHpRatio = 0;
                    const isIt = settingsRef.current.language === 'it';
                    mobText += ` <span style="font-size: 0.85em; color: #ef4444; opacity: 0.8; margin-left: 4px; font-variant-numeric: tabular-nums; font-weight: bold; letter-spacing: 0.05em;">(${isIt ? 'SCONFITTO' : 'DEFEATED'})</span>`;
                } else {
                    isMobActive = false;
                }
            }
        }
        
        el('weapon-text', e => {
            const plus = st.physicalStacks > 1 ? ` +${st.physicalStacks}` : '';
            e.textContent = `${st.physicalWeapon}${plus}`;
            if (st.physicalStacks >= 9) e.classList.add('legendary-glow');
            else e.classList.remove('legendary-glow');
        });
        el('magic-weapon-text', e => {
            const plus = st.magicStacks > 1 ? ` +${st.magicStacks}` : '';
            e.textContent = `${st.magicWeapon}${plus}`;
            if (st.magicStacks >= 9) e.classList.add('legendary-glow');
            else e.classList.remove('legendary-glow');
        });
        el('mob-target-text', e => {
            let typeIcon = '';
            if (mobInfo && isMobActive) {
                const type = mobInfo.type;
                const def = getEnemyDefense(type);
                
                if (type === 'archer') {
                    typeIcon = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="color: #4ade80; margin-right: 4px;"><path d="m3 3 3 18 4-4 4 4 7-7-4-4L21 3z"></path></svg>`;
                } else if (def.physicalDefense >= 30 || type === 'shield_bearer' || type === 'warrior' || type === 'charger') {
                    typeIcon = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="color: #94a3b8; margin-right: 4px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`;
                } else if (def.magicalDefense >= 20 || type === 'mage' || type === 'teleporter' || type === 'necromancer') {
                    typeIcon = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="color: #a78bfa; margin-right: 4px;"><path d="m15 9h0"></path><path d="m3 21 9-9"></path><path d="M12.2 6.2 11 5"></path><path d="M9 15l-3 3"></path><path d="M19 5l-2.2 2.2"></path></svg>`;
                } else {
                    typeIcon = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="color: #ef4444; margin-right: 4px;"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9"></path><polyline points="13 2 13 9 20 9"></polyline></svg>`;
                }
            }

            e.innerHTML = isMobActive ? `
                <div style="display: flex; align-items: center; justify-content: center; gap: 6px; ${isInRange ? 'color: #ff4444;' : ''}">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="color: ${isInRange ? '#ff4444' : '#ef4444'}; filter: drop-shadow(0 0 2px ${isInRange ? 'rgba(255, 68, 68, 0.8)' : 'rgba(239, 68, 68, 0.5)'});">
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <div style="display: flex; align-items: center;">${typeIcon}${mobText}</div>
                    ${isInRange ? '<span style="font-size: 8px; margin-left: 4px; color: #ff4444; font-weight: 900; letter-spacing: 0.1em; animate-pulse">LOCKED</span>' : ''}
                </div>
                <div style="width: 100px; height: 4px; background: rgba(0,0,0,0.5); border: 1px solid #444; border-radius: 2px; overflow: hidden; margin-top: 4px;">
                    <div style="width: ${mobHpRatio * 100}%; height: 100%; background: ${isInRange ? '#ff0000' : '#ef4444'}; transition: width 0.1s linear;"></div>
                </div>
            ` : (e.innerHTML || ''); // Keep content during fade out for smoother visual
            e.style.opacity = isMobActive ? '1' : '0';
            
            const pulseRate = isInRange ? 150 : 400;
            const pulse = Math.sin(Date.now() / pulseRate) * 0.5 + 0.5; // 0 to 1
            const shadowIntensity = (isInRange ? 0.4 : 0.2) + pulse * (isInRange ? 0.6 : 0.4);
            const shadowColor = isInRange ? 'rgba(255, 68, 68, ' : 'rgba(0, 255, 255, ';

            e.style.transform = isMobActive ? `translate(-50%, 0) scale(${isInRange ? 1.05 + pulse * 0.05 : 1})` : 'translate(-50%, 20px)';
            e.style.textShadow = isMobActive ? `0 0 ${4 + pulse * (isInRange ? 12 : 8)}px ${shadowColor}${shadowIntensity}), 0 0 2px rgba(34, 211, 238, 0.2)` : 'none';
        });
        el('nearby-loot-text', e => {
            const wName = nearbyWeaponRef.current;
            if (wName) {
                const w = WEAPONS[wName];
                const isOwned = wName === stats.current.physicalWeapon || wName === stats.current.magicWeapon;
                const canPickupCurrently = !activeAmbush.current || isOwned;
                
                if (!canPickupCurrently) {
                    const msg = settingsRef.current.language === 'it' 
                        ? `SCONFIGGI NEMICI PER RACCOGLIERE ${w.name.toUpperCase()}` 
                        : `DEFEAT ENEMIES TO PICK UP ${w.name.toUpperCase()}`;
                    e.textContent = msg;
                    e.style.color = '#ef4444';
                    e.classList.remove('animate-pulse');
                } else {
                    const label = settingsRef.current.language === 'it' 
                        ? (isOwned ? `POTENZIA ${w.name.toUpperCase()}` : `RACCOGLI ${w.name.toUpperCase()}`)
                        : (isOwned ? `UPGRADE ${w.name.toUpperCase()}` : `PICK UP ${w.name.toUpperCase()}`);
                    const keyLabel = settingsRef.current.language === 'it' ? 'PREMI ATK' : 'PRESS ATK';
                    e.textContent = `${label} [${keyLabel}]`;
                    e.style.color = '#facc15';
                    if (isOwned) {
                        e.classList.add('animate-pulse');
                    } else {
                        e.classList.remove('animate-pulse');
                    }
                }
                e.style.opacity = '1';
            } else {
                e.style.opacity = '0';
                e.classList.remove('animate-pulse');
            }
        });
        
        // DRAWING
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#050508';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Calculate Camera
        let cx = canvas.width / 2 - player.current.x;
        let cy = canvas.height / 2 - player.current.y;
        
        // Screen shake
        if (shake.current.time > 0) {
            const currentIntensity = Math.max(shake.current.time * 0.3, shake.current.intensity);
            cx += (Math.random() - 0.5) * currentIntensity;
            cy += (Math.random() - 0.5) * currentIntensity;
            shake.current.time -= 1 * timeScale;
            shake.current.intensity *= 0.92;
        } else {
            shake.current.intensity = 0;
        }

        // DRAW PARALLAX BACKGROUND (BEFORE CAMERA TRANSLATE)
        backgroundElements.filter(e => e.type !== 'floor_detail' && e.type !== 'foreground_dust').forEach(el => {
            // Parallax factor: 0.1 means moves at 10% speed of player, looking very far
            const bx = cx * el.parallax;
            const by = cy * el.parallax;
            
            ctx.globalAlpha = el.opacity;
            
            if (el.type === 'nebula') {
                const grad = ctx.createRadialGradient(el.x + bx, el.y + by, 0, el.x + bx, el.y + by, el.size);
                grad.addColorStop(0, el.color);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.fillRect(el.x + bx - el.size, el.y + by - el.size, el.size * 2, el.size * 2);
            } else {
                ctx.fillStyle = el.color;
                // Add a small glitter effect to stars
                const s = el.type === 'star' ? el.size * (0.8 + 0.4 * Math.sin(Date.now() / 500 + el.x)) : el.size;
                ctx.fillRect(el.x + bx, el.y + by, s, s);
            }
        });
        
        // DRAW FLOOR PARALLAX (Deeper textures)
        backgroundElements.filter(e => e.type === 'floor_detail').forEach(el => {
            const bx = cx * el.parallax;
            const by = cy * el.parallax;
            ctx.globalAlpha = el.opacity;
            ctx.fillStyle = el.color;
            ctx.fillRect(el.x + bx, el.y + by, el.size, el.size);
        });
        
        ctx.globalAlpha = 1.0;

        const camX = cx;
        const camY = cy;

        ctx.save();
        ctx.translate(cx, cy);

        // Dungeon
        const isAlienLevel = stats.current.dungeonLevel % 10 === 0 && stats.current.dungeonLevel > 0;
        
        dungeon.current.forEach((row, y) => {
            const screenY = y * GRID_SIZE + camY;
            if (screenY < -GRID_SIZE * 2 || screenY > canvas.height + GRID_SIZE * 2) {
                return;
            }
            row.forEach((cell, x) => {
                const screenX = x * GRID_SIZE + camX;
                if (screenX < -GRID_SIZE * 2 || screenX > canvas.width + GRID_SIZE * 2) {
                    return;
                }
                const secretRoomIdx = cell === 4 ? secretTileToRoom.current[`${y}_${x}`] : undefined;
                const isRevealed = secretRoomIdx !== undefined ? revealedRooms.current.has(secretRoomIdx) : true;
                const revealAlpha = secretRoomIdx !== undefined ? (revealOpacities.current[secretRoomIdx] ?? 1.0) : 0;

                // Function to draw a wall brick at x, y with optional alpha
                const drawWall = (ax: number, ay: number, alpha: number = 1.0) => {
                    ctx.save();
                    ctx.globalAlpha = alpha;
                    const wallDx = (ax * GRID_SIZE + GRID_SIZE/2) - player.current.x;
                    const wallDy = (ay * GRID_SIZE + GRID_SIZE/2) - player.current.y;
                    const wallDist = Math.hypot(wallDx, wallDy);
                    
                    const isSecretDoor = dungeon.current[ay][ax] === 2;
                    let finalGlowAlpha = 0;
                    let finalGlowColor = isAlienLevel ? '#33ffff' : '#00ffd2'; // Neon cyan/mint magical glow
                    
                    if (isSecretDoor) {
                        const doorKey = `${ax}_${ay}`;
                        const isGlimmering = secretGlimmers.current[doorKey] && (Date.now() - secretGlimmers.current[doorKey] < 3000);
                        
                        if (!isGlimmering && !revealedSecretDoors.current[doorKey]) {
                            // Check if on screen to start a new glimmer
                            const screenX = ax * GRID_SIZE + cx;
                            const screenY = ay * GRID_SIZE + cy;
                            if (screenX > -GRID_SIZE && screenX < canvas.width + GRID_SIZE && 
                                screenY > -GRID_SIZE && screenY < canvas.height + GRID_SIZE) {
                                if (Math.random() < 0.0002) {
                                    secretGlimmers.current[doorKey] = Date.now();
                                }
                            }
                        }

                        // Auto-reveal when within 3 tiles to guarantee detection
                        if (wallDist < 3.0 * GRID_SIZE) {
                            if (!revealedSecretDoors.current[doorKey]) {
                                revealedSecretDoors.current[doorKey] = Date.now();
                            }
                        }
                        
                        const startTime = revealedSecretDoors.current[doorKey];
                        const glimmerStartTime = secretGlimmers.current[doorKey];

                        if (wallDist < 1.6 * GRID_SIZE) {
                            // Hero is within 1 tile: MAXIMUM high-vibrancy pulsing magical glow overriding everything
                            finalGlowAlpha = 0.85 + 0.15 * Math.sin(Date.now() / 90);
                            finalGlowColor = isAlienLevel ? '#3bffff' : '#00ffd2';
                        } else if (wallDist < 2.5 * GRID_SIZE) {
                            // Hero is within 2 tiles: prominent pulsing warning glow
                            finalGlowAlpha = 0.55 + 0.15 * Math.sin(Date.now() / 120);
                            finalGlowColor = isAlienLevel ? '#00eaff' : '#00ccff';
                        } else if (glimmerStartTime && (Date.now() - glimmerStartTime < 3000)) {
                            // Rare random glimmer
                            const elapsed = Date.now() - glimmerStartTime;
                            const pulse = Math.sin(elapsed / 180) * 0.5 + 0.5;
                            finalGlowAlpha = 0.40 * pulse;
                            finalGlowColor = isAlienLevel ? '#33ffff' : '#ffb3ff';
                        } else if (startTime && (Date.now() - startTime < 3000)) {
                            // Sensed reaction glow
                            const elapsed = Date.now() - startTime;
                            const fadeFactor = Math.max(0, 1 - elapsed / 3000);
                            finalGlowAlpha = (0.60 + 0.15 * Math.sin(Date.now() / 150)) * fadeFactor;
                            finalGlowColor = isAlienLevel ? '#33ffff' : '#00ffd2';
                        }
                    }
                    
                    // Depth effect on walls
                    // We give secret walls a slightly purplish ancient ruin hue to make them subtly discoverable if you hunt for them
                    let topColor = isSecretDoor ? '#241a30' : '#1a1c23';
                    let frontColor = isSecretDoor ? '#140c1c' : '#0d0d12';
                    
                    if (isAlienLevel) {
                        topColor = isSecretDoor ? '#0e1d24' : '#0d0f14';
                        frontColor = isSecretDoor ? '#060c10' : '#050608';
                    }

                    // Main wall top block
                    ctx.fillStyle = topColor;
                    ctx.fillRect(ax * GRID_SIZE, ay * GRID_SIZE, GRID_SIZE, GRID_SIZE - 6);
                    
                    // Wall front face (creates 3D depth)
                    ctx.fillStyle = frontColor;
                    ctx.fillRect(ax * GRID_SIZE, ay * GRID_SIZE + GRID_SIZE - 6, GRID_SIZE, 6);

                    // Alien circuitry pattern or Brick pattern
                    if (isAlienLevel) {
                        ctx.strokeStyle = isSecretDoor ? 'rgba(0, 255, 255, 0.25)' : 'rgba(0, 255, 200, 0.1)';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        const s = 4;
                        for(let i=1; i<GRID_SIZE/s; i++) {
                            if ((ax*7 + ay*3 + i) % 5 === 0) {
                                ctx.moveTo(ax * GRID_SIZE + i * s, ay * GRID_SIZE);
                                ctx.lineTo(ax * GRID_SIZE + i * s, ay * GRID_SIZE + GRID_SIZE - 6);
                            }
                        }
                        ctx.stroke();
                    } else {
                        // Brick pattern on top face
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                        ctx.fillRect(ax * GRID_SIZE + 2, ay * GRID_SIZE + 2, GRID_SIZE - 4, GRID_SIZE/2 - 6);
                        ctx.fillRect(ax * GRID_SIZE + 2, ay * GRID_SIZE + GRID_SIZE/2 - 2, GRID_SIZE/2 - 3, GRID_SIZE/2 - 5);
                        ctx.fillRect(ax * GRID_SIZE + GRID_SIZE/2 + 1, ay * GRID_SIZE + GRID_SIZE/2 - 2, GRID_SIZE/2 - 3, GRID_SIZE/2 - 5);

                        // Draw explicit cracked overlay on secret walls
                        if (isSecretDoor) {
                            ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)'; // Purple/magenta crack line
                            ctx.lineWidth = 1.5;
                            ctx.beginPath();
                            // Left-to-center crack
                            ctx.moveTo(ax * GRID_SIZE + 4, ay * GRID_SIZE + 4);
                            ctx.lineTo(ax * GRID_SIZE + 16, ay * GRID_SIZE + 15);
                            ctx.lineTo(ax * GRID_SIZE + 12, ay * GRID_SIZE + 26);
                            // Right-to-center crack
                            ctx.moveTo(ax * GRID_SIZE + GRID_SIZE - 4, ay * GRID_SIZE + 8);
                            ctx.lineTo(ax * GRID_SIZE + GRID_SIZE - 15, ay * GRID_SIZE + 18);
                            ctx.lineTo(ax * GRID_SIZE + GRID_SIZE - 8, ay * GRID_SIZE + 28);
                            ctx.stroke();
                        }
                    }

                    // Subtle highlights for edge catching
                    ctx.fillStyle = isAlienLevel ? 'rgba(0, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.04)';
                    ctx.fillRect(ax * GRID_SIZE, ay * GRID_SIZE, GRID_SIZE, 1);
                    ctx.fillRect(ax * GRID_SIZE, ay * GRID_SIZE, 1, GRID_SIZE - 6);

                    // Imperfect stone border / Neon lights
                    const drawBorder = (x: number, y: number, w: number, h: number, side: 'top'|'bottom'|'left'|'right') => {
                        const r = Math.sin(ax * 31.4 + ay * 15.9);
                        const colorVar = Math.floor(r * 20);
                        
                        if (isAlienLevel) {
                            // Neon lighting
                            const isGreen = (ax + ay) % 2 === 0;
                            const neonCol = isGreen ? '#00ffa2' : '#00bbff';
                            ctx.save();
                            const glowPulse = 18 + Math.sin(time * 5) * 6;
                            ctx.shadowBlur = glowPulse;
                            ctx.shadowColor = neonCol;
                            ctx.fillStyle = neonCol;
                            
                            // Draw neon strip
                            const stripSize = 2.5;
                            const glowDist = 35; // How far the glow descends/extends
                            
                            const gradStart = isGreen ? 'rgba(0, 255, 162, 0.4)' : 'rgba(0, 187, 255, 0.4)';

                            if (side === 'bottom') {
                                ctx.fillRect(x, y - stripSize, w, stripSize);
                                const grad = ctx.createLinearGradient(0, y, 0, y + glowDist);
                                grad.addColorStop(0, gradStart);
                                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                                ctx.shadowBlur = 0; // Disable shadow for gradient
                                ctx.fillStyle = grad;
                                ctx.fillRect(x, y, w, glowDist);
                            }
                            else if (side === 'top') {
                                ctx.fillRect(x, y, w, stripSize);
                                const grad = ctx.createLinearGradient(0, y, 0, y - glowDist);
                                grad.addColorStop(0, gradStart);
                                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                                ctx.shadowBlur = 0; // Disable shadow for gradient
                                ctx.fillStyle = grad;
                                ctx.fillRect(x, y - glowDist, w, glowDist);
                            }
                            else if (side === 'left') {
                                ctx.fillRect(x, y, stripSize, h);
                                const grad = ctx.createLinearGradient(x, 0, x - glowDist, 0);
                                grad.addColorStop(0, gradStart);
                                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                                ctx.shadowBlur = 0; // Disable shadow for gradient
                                ctx.fillStyle = grad;
                                ctx.fillRect(x - glowDist, y, glowDist, h);
                            }
                            else if (side === 'right') {
                                ctx.fillRect(x - stripSize, y, stripSize, h);
                                const grad = ctx.createLinearGradient(x, 0, x + glowDist, 0);
                                grad.addColorStop(0, gradStart);
                                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                                ctx.shadowBlur = 0; // Disable shadow for gradient
                                ctx.fillStyle = grad;
                                ctx.fillRect(x, y, glowDist, h);
                            }
                            
                            // Extra circuitry glow points
                            if (Math.abs(r) > 0.7) {
                                ctx.shadowBlur = glowPulse;
                                ctx.fillStyle = neonCol;
                                ctx.fillRect(x + w/2 - 1.5, y + h/2 - 1.5, 3, 3);
                            }
                            ctx.restore();
                        } else {
                            ctx.fillStyle = isSecretDoor 
                                ? `rgb(${148 + colorVar}, 112, 190)` // Highlighted lighter purple borders
                                : `rgb(${74 + colorVar}, 85, 104)`;
                            
                            const wobble = Math.floor(r * 3);
                            const isHorizontal = w > h;
                            
                            ctx.fillRect(isHorizontal ? x + wobble : x, 
                                         isHorizontal ? y : y + wobble, 
                                         w, h);
                                         
                            // Add tiny crack/dot imperfection
                            if (Math.abs(r) > 0.8) {
                                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                                ctx.fillRect(x + (isHorizontal ? w/2 + r * 5 : 0), y + (isHorizontal ? 0 : h/2 + r * 5), isHorizontal ? 2 : 1, isHorizontal ? 1 : 2);
                            }
                        }
                    };
                    const isFloor = (tx: number, ty: number) => {
                        if (ty < 0 || ty >= dungeon.current.length || tx < 0 || tx >= dungeon.current[0].length) return false;
                        const c = dungeon.current[ty][tx];
                        if (c === 1 || c === 3) return true;
                        if (c === 4) {
                            const ridx = secretTileToRoom.current[`${ty}_${tx}`];
                            return ridx !== undefined && revealedRooms.current.has(ridx);
                        }
                        return false;
                    };
                    if (isFloor(ax, ay + 1)) drawBorder(ax * GRID_SIZE, ay * GRID_SIZE + GRID_SIZE - 2, GRID_SIZE, 2, 'bottom');
                    if (isFloor(ax, ay - 1)) drawBorder(ax * GRID_SIZE, ay * GRID_SIZE, GRID_SIZE, 2, 'top');
                    if (isFloor(ax - 1, ay)) drawBorder(ax * GRID_SIZE, ay * GRID_SIZE, 2, GRID_SIZE, 'left');
                    if (isFloor(ax + 1, ay)) drawBorder(ax * GRID_SIZE + GRID_SIZE - 2, ay * GRID_SIZE, 2, GRID_SIZE, 'right');

                    // ==========================================
                    // GLOW OVERLAY DRAWN ON TOP OF ALL DRAWINGS
                    // ==========================================
                    if (isSecretDoor && finalGlowAlpha > 0) {
                        ctx.save();
                        ctx.globalAlpha = alpha * finalGlowAlpha;

                        // 1. Double outer shadow radial glow effect
                        ctx.shadowColor = finalGlowColor;
                        ctx.shadowBlur = 20 + 10 * Math.sin(Date.now() / 90);
                        
                        // 2. High brightness double border overlay
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 3.5;
                        ctx.strokeRect(ax * GRID_SIZE + 1.5, ay * GRID_SIZE + 1.5, GRID_SIZE - 3, GRID_SIZE - 3);

                        // 3. Transparent neon fill
                        ctx.fillStyle = finalGlowColor;
                        ctx.globalAlpha = alpha * (finalGlowAlpha * 0.45); // Slightly lighter fill blend
                        ctx.fillRect(ax * GRID_SIZE, ay * GRID_SIZE, GRID_SIZE, GRID_SIZE);

                        // 4. Highlighted Inner pulsing golden/cyan cracks seeping through
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 2.5;
                        ctx.shadowBlur = 8;
                        ctx.beginPath();
                        ctx.moveTo(ax * GRID_SIZE + 4, ay * GRID_SIZE + 4);
                        ctx.lineTo(ax * GRID_SIZE + 16, ay * GRID_SIZE + 15);
                        ctx.lineTo(ax * GRID_SIZE + 12, ay * GRID_SIZE + 26);
                        
                        ctx.moveTo(ax * GRID_SIZE + GRID_SIZE - 4, ay * GRID_SIZE + 8);
                        ctx.lineTo(ax * GRID_SIZE + GRID_SIZE - 15, ay * GRID_SIZE + 18);
                        ctx.lineTo(ax * GRID_SIZE + GRID_SIZE - 8, ay * GRID_SIZE + 28);
                        ctx.stroke();

                        ctx.restore();
                    }

                    // Sparkles for weak walls: rate escalates as player gets closer
                    if (isSecretDoor) {
                        const particleChance = wallDist < 1.6 * GRID_SIZE ? 0.22 : (wallDist < 2.5 * GRID_SIZE ? 0.08 : 0.01);
                        if (Math.random() < particleChance) {
                            particles.current.push({
                                x: ax * GRID_SIZE + Math.random() * GRID_SIZE,
                                y: ay * GRID_SIZE + Math.random() * GRID_SIZE,
                                vx: (Math.random() - 0.5) * 0.4,
                                vy: -0.6 - Math.random() * 0.4,
                                life: 0,
                                maxLife: 35 + Math.random() * 20,
                                color: finalGlowColor,
                                size: 1.5 + Math.random() * 2.0
                            });
                        }
                    }

                    ctx.restore();
                };

                if (cell === 0 || cell === 2 || (cell === 4 && !isRevealed)) {
                    drawWall(x, y);
                } else {
                    // Draw floor (cell 1, 3, or revealed 4)
                    const floorVar = (x * 17 + y * 31) % 15;
                    const isBossFloor = cell === 3;
                    const levelTheme = currentDungeon.current.level % 4;
                    
                    let bgCol, tile1, tile2, crackCol;

                    if (isAlienLevel) {
                        bgCol = '#222d3d';
                        tile1 = '#8cb1cb';
                        tile2 = '#7ba0b9';
                        crackCol = 'rgba(0, 255, 255, 0.4)';
                    } else if (isBossFloor) {
                        bgCol = '#030105';
                        tile1 = '#1e113a';
                        tile2 = '#150a28';
                        crackCol = 'rgba(255, 0, 50, 0.2)';
                    } else if (levelTheme === 0) { // Classic Dungeon theme
                        bgCol = '#0a0b0e';
                        tile1 = '#2a2d36';
                        tile2 = '#22252c';
                        crackCol = 'rgba(0, 0, 0, 0.4)';
                    } else if (levelTheme === 1) { // Desert / Sandy theme
                        bgCol = '#120f0a';
                        tile1 = '#3a3428';
                        tile2 = '#302a20';
                        crackCol = 'rgba(0, 0, 0, 0.3)';
                    } else if (levelTheme === 2) { // Ice Vault theme
                        bgCol = '#080a10';
                        tile1 = '#2d3850';
                        tile2 = '#252e42';
                        crackCol = 'rgba(255, 255, 255, 0.1)';
                    } else { // Hell / Volcanic theme
                        bgCol = '#0f0505';
                        tile1 = '#3a1a1a';
                        tile2 = '#2e1414';
                        crackCol = 'rgba(0, 0, 0, 0.5)';
                    }
                    
                    // Grout / Background - Darker for more contrast
                    ctx.fillStyle = bgCol;
                    ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
                    
                    // Draw 4 bricks per tile (2x2)
                    const brickW = GRID_SIZE / 2;
                    const brickH = GRID_SIZE / 2;
                    
                    for (let by = 0; by < 2; by++) {
                        for (let bx = 0; bx < 2; bx++) {
                            const brickIdx = by * 2 + bx;
                            const isRaised = (floorVar + brickIdx) % 11 === 0;
                            const bxOffset = x * GRID_SIZE + bx * brickW;
                            const byOffset = y * GRID_SIZE + by * brickH;
                            
                            // Random slight color variation
                            const colorNoise = ((x + bx) * 13 + (y + by) * 17) % 5;
                            const colorOffset = isBossFloor ? colorNoise * 2 : colorNoise * 3;
                            
                            // Base brick color
                            ctx.fillStyle = floorVar % 2 === 0 ? tile1 : tile2;
                            
                            const drawX = bxOffset + 1 + (isRaised ? -1 : 0);
                            const drawY = byOffset + 1 + (isRaised ? -1 : 0);
                            const drawW = brickW - 2;
                            const drawH = brickH - 2;
                            
                            if (isRaised) {
                                // Draw shadow under raised brick
                                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                                ctx.fillRect(bxOffset + 2, byOffset + 2, drawW, drawH);
                                ctx.fillStyle = floorVar % 2 === 0 ? tile1 : tile2;
                            }
                            
                            ctx.fillRect(drawX, drawY, drawW, drawH);
                            
                            // Raised effect highlights and shadows
                            if (isRaised) {
                                // Highlights (top & left)
                                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                                ctx.fillRect(drawX, drawY, drawW, 1);
                                ctx.fillRect(drawX, drawY, 1, drawH);
                                // Shadows (bottom & right)
                                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                                ctx.fillRect(drawX, drawY + drawH - 1, drawW, 1);
                                ctx.fillRect(drawX + drawW - 1, drawY, 1, drawH);
                            } else {
                                // Normal subtle bevel
                                ctx.fillStyle = 'rgba(255,255,255,0.03)';
                                ctx.fillRect(drawX, drawY, drawW, 1);
                                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                                ctx.fillRect(drawX, drawY + drawH - 1, drawW, 1);
                            }
                        }
                    }
                    
                    // Floor details (cracks, debris) - Only on non-boss floors to keep clarity
                    if (!isBossFloor && (floorVar === 0 || floorVar === 5)) {
                        ctx.fillStyle = crackCol;
                        ctx.fillRect(x * GRID_SIZE + 4, y * GRID_SIZE + 4, 3, 3);
                        ctx.fillRect(x * GRID_SIZE + Math.abs((x*7)%10) + 8, y * GRID_SIZE + Math.abs((y*11)%10) + 8, 4, 2);
                        ctx.fillRect(x * GRID_SIZE + 7, y * GRID_SIZE + 12, 1, 4);
                    } else if (!isBossFloor && (floorVar === 3 || floorVar === 8)) {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                        ctx.fillRect(x * GRID_SIZE + 5, y * GRID_SIZE + 5, 2, 2);
                        ctx.fillRect(x * GRID_SIZE + GRID_SIZE - 7, y * GRID_SIZE + GRID_SIZE - 7, 2, 2);
                    }

                    if (isBossFloor && floorVar === 7) {
                         ctx.fillStyle = 'rgba(255, 0, 0, 0.05)';
                         ctx.beginPath();
                         ctx.arc(x * GRID_SIZE + GRID_SIZE/2, y * GRID_SIZE + GRID_SIZE/2, GRID_SIZE/3, 0, Math.PI * 2);
                         ctx.fill();
                    }

                    // If it's a secret floor being revealed, draw fading wall on top
                    if (cell === 4 && revealAlpha > 0) {
                        drawWall(x, y, revealAlpha);
                    }
                }
            });
        });

        // Torches - Skip on Alien levels
        if (!isAlienLevel) {
            currentDungeon.current.torches.forEach(t => {
                const tx = t.gridX * GRID_SIZE + GRID_SIZE / 2;
                const ty = t.gridY * GRID_SIZE + GRID_SIZE / 2;
                const screenX = tx + camX;
                const screenY = ty + camY;
                const rad = GRID_SIZE * 2.5 + 5;
                if (screenX < -rad || screenX > canvas.width + rad ||
                    screenY < -rad || screenY > canvas.height + rad) {
                    return;
                }
                const flicker = Math.sin(time * 8 + t.phase) * 2;
                
                // Floor glow
                ctx.globalCompositeOperation = 'screen';
                const grad = ctx.createRadialGradient(tx, ty, 0, tx, ty, GRID_SIZE * 2.5 + flicker);
                grad.addColorStop(0, 'rgba(255, 170, 0, 0.4)');
                grad.addColorStop(0.5, 'rgba(255, 100, 0, 0.1)');
                grad.addColorStop(1, 'rgba(255, 170, 0, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(tx, ty, GRID_SIZE * 2.5 + flicker, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalCompositeOperation = 'source-over';

                // Actual torch fire
                ctx.shadowBlur = 20 + flicker * 2;
                ctx.shadowColor = '#ff6600';
                ctx.fillStyle = '#ffaa00';
                ctx.beginPath();
                ctx.arc(tx, ty - 5, 4 + flicker*0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                // Torch base
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(tx - 2, ty - 2, 4, 8);
            });
        }

        // Chests
        chests.current.forEach(c => {
            const chestX = c.gridX * GRID_SIZE + GRID_SIZE / 2;
            const chestY = c.gridY * GRID_SIZE + GRID_SIZE / 2;
            
            // Offscreen culling check
            const screenX = chestX + camX;
            const screenY = chestY + camY;
            const size = 32;
            if (screenX < -size || screenX > canvas.width + size ||
                screenY < -size || screenY > canvas.height + size) {
                return;
            }

            const cx = chestX;
            const cy = chestY;
            
            // Visibility Check
            const sIdx = secretTileToRoom.current[`${c.gridY}_${c.gridX}`];
            if (sIdx !== undefined && !revealedRooms.current.has(sIdx)) return;

            // Animation for unopened chests: Hop + Shadow
            let bounceY = 0;
            let shadowScale = 1;
            if (!c.opened) {
                // Modified Hop animation: 2s pause + 2 hops in 1s
                const cycle = 3;
                const t = (time + (c.gridX * 0.1 + c.gridY * 0.1)) % cycle; 
                if (t > 2) {
                    const hopT = t - 2; // 0 to 1
                    bounceY = -Math.abs(Math.sin(hopT * Math.PI * 2)) * 10;
                }
                shadowScale = 1 - (Math.abs(bounceY) / 20);
            }

            // Chest drop shadow
            ctx.save();
            ctx.fillStyle = `rgba(0, 0, 0, ${0.5 * shadowScale})`;
            ctx.beginPath();
            ctx.ellipse(cx, cy + 12, 16 * shadowScale, 6 * shadowScale, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            const isLegendary = c.rarity === 'legendary';

            ctx.save();
            ctx.translate(0, bounceY);
            if (isLegendary && !c.opened) {
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 15 + Math.sin(Date.now() / 150) * 10;
            }

            ctx.fillStyle = isLegendary ? '#4B0082' : '#8B4513';
            ctx.fillRect(cx - 10, cy - 8, 20, 16);
            ctx.fillStyle = isLegendary ? '#FFD700' : '#FFD700';
            ctx.fillRect(cx - 10, cy - 2, 20, 4); // gold banding
            if (c.opened) {
               ctx.fillStyle = '#000';
               ctx.fillRect(cx - 8, cy - 6, 16, 6); // open top
            } else {
               ctx.fillStyle = isLegendary ? '#FFA500' : '#B8860B';
               ctx.fillRect(cx - 2, cy - 4, 4, 4); // lock
               if (isLegendary) {
                   ctx.fillStyle = '#FFD700';
                   ctx.fillRect(cx - 10, cy - 8, 20, 2); // extra gold banding
               }
            }
            ctx.shadowBlur = 0;
            ctx.restore();
        });

        // Loot
        loot.current.forEach(l => {
            // Offscreen culling check
            const screenX = l.x + camX;
            const screenY = l.y + camY;
            const size = 30;
            if (screenX < -size || screenX > canvas.width + size ||
                screenY < -size || screenY > canvas.height + size) {
                return;
            }

            // Visibility Check
            const lgx = Math.floor(l.x / GRID_SIZE);
            const lgy = Math.floor(l.y / GRID_SIZE);
            const slIdx = secretTileToRoom.current[`${lgy}_${lgx}`];
            if (slIdx !== undefined && !revealedRooms.current.has(slIdx)) return;

            const bounce = Math.sin(time * 6 + (l.x + l.y)) * 4;
            const floatY = l.z + bounce; 
            
            // Drop shadow
            ctx.save();
            const shadowScale = 1 - Math.min(1, Math.max(0, -floatY / 20));
            ctx.fillStyle = `rgba(0, 0, 0, ${0.4 * shadowScale})`;
            ctx.beginPath();
            ctx.ellipse(l.x, l.y + 4, 8 * shadowScale, 3 * shadowScale, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            ctx.shadowBlur = 10;
            ctx.shadowColor = l.rarityColor || l.color;
            ctx.fillStyle = l.color;
            
            if (l.type === 'gold') {
                const frameIndex = Math.floor((time * 10) % 4);
                const colors: Record<string, string> = { 'Y': '#FFD700', 'O': '#B8860B', 'W': '#FFFFFF' };
                const frames = [
                    [ // Front
                        "  YYYY  ",
                        " YYYYYY ",
                        "YWWYYYYY",
                        "YWWYYYYY",
                        "YYYYYYYY",
                        "YYYYOYYY",
                        " YYYYYY ",
                        "  YYYY  "
                    ],
                    [ // Quarter
                        "  YYY  ",
                        " YYYYY ",
                        "YWYYYY ",
                        "YYYYYY ",
                        "YYYYYY ",
                        "YYOYYY ",
                        " YYYYY ",
                        "  YYY  "
                    ],
                    [ // Side
                        " YY ",
                        " YY ",
                        " WY ",
                        " YY ",
                        " YY ",
                        " OY ",
                        " YY ",
                        " YY "
                    ],
                    [ // Quarter other side
                        "  YYY  ",
                        " YYYYY ",
                        " YYYYW ",
                        " YYYYY ",
                        " YYYYY ",
                        " YYYOY ",
                        " YYYYY ",
                        "  YYY  "
                    ]
                ];
                
                const frame = frames[frameIndex];
                const pixelSize = 1.5;
                const frameWidth = frame[0].length * pixelSize;
                const frameHeight = frame.length * pixelSize;
                const startX = l.x - frameWidth / 2;
                const startY = l.y + floatY - frameHeight / 2;
                
                for (let r = 0; r < frame.length; r++) {
                    for (let c = 0; c < frame[r].length; c++) {
                        const char = frame[r][c];
                        if (char !== ' ') {
                            ctx.fillStyle = colors[char];
                            ctx.fillRect(startX + c * pixelSize, startY + r * pixelSize, pixelSize + 0.2, pixelSize + 0.2);
                        }
                    }
                }
            } else if (l.type === 'gem') {
                ctx.beginPath();
                ctx.moveTo(l.x, l.y + floatY - 8);
                ctx.lineTo(l.x + 6, l.y + floatY);
                ctx.lineTo(l.x, l.y + floatY + 8);
                ctx.lineTo(l.x - 6, l.y + floatY);
                ctx.closePath();
                ctx.fillStyle = l.color || '#ff00ff';
                ctx.fill();
                
                // Add inner bright part for 3D gem look
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = 0.6;
                ctx.beginPath();
                ctx.moveTo(l.x, l.y + floatY - 4);
                ctx.lineTo(l.x + 3, l.y + floatY);
                ctx.lineTo(l.x, l.y + floatY + 4);
                ctx.lineTo(l.x - 3, l.y + floatY);
                ctx.closePath();
                ctx.fill();
                ctx.globalAlpha = 1.0;
                
                // Add top glare
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(l.x, l.y + floatY - 6, 1.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (l.type === 'crystal') {
                ctx.beginPath();
                ctx.moveTo(l.x, l.y + floatY - 8);
                ctx.lineTo(l.x + 6, l.y + floatY);
                ctx.lineTo(l.x, l.y + floatY + 8);
                ctx.lineTo(l.x - 6, l.y + floatY);
                ctx.closePath();
                const glow = Math.sin(Date.now() / 150) * 0.5 + 0.5;
                ctx.fillStyle = `rgba(255, 255, 255, ${0.7 + glow * 0.3})`;
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 15;
                ctx.fill();
            } else if (l.type === 'weapon' && l.name && WEAPONS[l.name]) {
                const w = WEAPONS[l.name];
                const isMagic = l.isMagic || (w.type !== 'sword' && w.type !== 'hammer');
                
                ctx.save();
                
                // Aura: Distinguished by type
                const auraPulse = Math.sin(time * 4) * 5 + 15;
                if (isMagic) {
                    // Magical Aura: Rotating Diamond / Star
                    ctx.globalAlpha = 0.3;
                    ctx.shadowBlur = auraPulse + 10;
                    ctx.shadowColor = '#00ffff'; // Magic often uses cyan/purple in this game's theme
                    
                    ctx.translate(l.x, l.y + floatY);
                    ctx.rotate(time * 2);
                    ctx.beginPath();
                    // Diamond shape for magic
                    ctx.moveTo(0, -22);
                    ctx.lineTo(22, 0);
                    ctx.lineTo(0, 22);
                    ctx.lineTo(-22, 0);
                    ctx.closePath();
                    
                    ctx.fillStyle = 'rgba(100, 0, 255, 0.4)';
                    ctx.fill();
                    ctx.strokeStyle = '#00ffff';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    // Sparkles for magic
                    if (Math.random() < 0.1) {
                        particles.current.push({
                            x: l.x + (Math.random()-0.5)*30, y: l.y + floatY + (Math.random()-0.5)*30,
                            vx: 0, vy: -0.5, life: 0, maxLife: 15, size: 2, color: '#00ffff'
                        });
                    }
                } else {
                    // Physical Aura: Circular / Shield-like
                    ctx.globalAlpha = 0.25;
                    ctx.shadowBlur = auraPulse;
                    ctx.shadowColor = l.rarityColor || '#fff';
                    
                    ctx.translate(l.x, l.y + floatY);
                    ctx.beginPath();
                    ctx.arc(0, 0, 18, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.fill();
                    ctx.strokeStyle = l.rarityColor || '#fff';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    // Small "glint" for physical
                    ctx.rotate(time);
                    ctx.strokeStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.moveTo(-15, 0);
                    ctx.lineTo(15, 0);
                    ctx.stroke();
                }
                
                ctx.restore();
                
                // Weapon Icon: 100% visibility
                ctx.save();
                ctx.globalAlpha = 1.0;
                ctx.shadowBlur = 0; 
                ctx.font = '24px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(w.icon, l.x, l.y + floatY);
                ctx.restore();
            } else if (l.type === 'cosmetic') {
                // Crown or Cloak icon
                ctx.save();
                ctx.globalAlpha = 1.0;
                ctx.shadowBlur = 15;
                ctx.shadowColor = l.color;
                ctx.font = '28px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const icon = l.name === 'Mantello del Destino' ? '🧥' : '👑';
                ctx.fillText(icon, l.x, l.y + floatY);
                ctx.restore();
            } else if (l.type === 'relic') {
                ctx.save();
                ctx.globalAlpha = 1.0;
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#ffff00';
                ctx.font = '32px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🔮', l.x, l.y + floatY);
                
                // Add magical sparkles
                if (Math.random() < 0.1) {
                    particles.current.push({
                        x: l.x + (Math.random() - 0.5) * 20,
                        y: l.y + floatY + (Math.random() - 0.5) * 20,
                        vx: 0, vy: -1, life: 0, maxLife: 20, size: 2, color: '#ffff00'
                    });
                }
                ctx.restore();
            } else if (l.type.startsWith('potion')) {
                const potionColors: Record<string, string> = { 
                    'W': 'rgba(255,255,255,0.8)', 
                    'C': l.color, 
                    'G': 'rgba(255,255,255,0.4)',
                    'B': 'rgba(0,0,0,0.2)'
                };
                const frame = [
                    "  WW  ",
                    "  WGW ",
                    " WWWW ",
                    "WCCCCW",
                    "WCCCCW",
                    "WCCCCW",
                    " WWWW "
                ];
                const pixelSize = 2.5;
                const frameWidth = frame[0].length * pixelSize;
                const frameHeight = frame.length * pixelSize;
                const startX = l.x - frameWidth / 2;
                const startY = l.y + floatY - frameHeight / 2;
                
                for (let r = 0; r < frame.length; r++) {
                    for (let c = 0; c < frame[r].length; c++) {
                        const char = frame[r][c];
                        if (char !== ' ') {
                            ctx.fillStyle = potionColors[char];
                            ctx.fillRect(startX + c * pixelSize, startY + r * pixelSize, pixelSize + 0.3, pixelSize + 0.3);
                        }
                    }
                }
            } else {
                ctx.beginPath();
                ctx.arc(l.x, l.y + floatY, 6, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.shadowBlur = 0;
        });

        // Player
        let pSize = 28; // slightly smaller than 40
        let color = '#00ffff';
        if (heroClass === 'mage') {
            color = '#aa55ff';
            pSize = 20;
        } else if (heroClass === 'paladin') {
            color = '#ffaa00';
            pSize = 32;
        }

        // Mythic Aura
        if (stats.current.dungeonLevel >= 100) {
            ctx.save();
            ctx.beginPath();
            const auraPulse = 1.0 + Math.sin(time * 5) * 0.1;
            const grad = ctx.createRadialGradient(player.current.x, player.current.y, pSize * 0.4, player.current.x, player.current.y, pSize * 1.6 * auraPulse);
            grad.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
            grad.addColorStop(0.5, 'rgba(218, 165, 32, 0.2)');
            grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
            ctx.fillStyle = grad;
            ctx.arc(player.current.x, player.current.y, pSize * 1.6 * auraPulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            // Sparkles
            if (Math.random() < 0.1) {
                particles.current.push({
                    x: player.current.x + (Math.random() - 0.5) * 40,
                    y: player.current.y + (Math.random() - 0.5) * 40,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: -Math.random() * 1.5,
                    life: 40,
                    maxLife: 40,
                    color: '#FFD700',
                    size: 2
                });
            }
        }

        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        
        let shouldDraw = true;
        if (player.current.flashTimer > 0) {
            shouldDraw = Math.floor(Date.now() / 100) % 2 === 0;
            player.current.flashTimer -= 1 * timeScale;
        }
        if (shouldDraw) {
            // Calculate velocity-based squash/stretch
            const velX = (keys.current['d'] || keys.current['ArrowRight'] || (gp && gp.axes[0] > 0.2) ? 1 : 0) - 
                        (keys.current['a'] || keys.current['ArrowLeft'] || (gp && gp.axes[0] < -0.2) ? 1 : 0);
            const velY = (keys.current['s'] || keys.current['ArrowDown'] || (gp && gp.axes[1] > 0.2) ? 1 : 0) - 
                        (keys.current['w'] || keys.current['ArrowUp'] || (gp && gp.axes[1] < -0.2) ? 1 : 0);
            const isMoving = velX !== 0 || velY !== 0;

            // Draw drop shadow
            ctx.save();
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.beginPath();
            ctx.ellipse(player.current.x, player.current.y + pSize/2, pSize * 0.8, pSize * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            ctx.save();
            ctx.translate(player.current.x, player.current.y);
            
            // Bobbing & squash/stretch
            const bob = isMoving ? Math.sin(time * 18) * 3 : Math.sin(time * 4) * 1.5;
            const squash = isMoving ? 1 + Math.abs(Math.sin(time * 18)) * 0.15 : 1 + Math.sin(time * 4) * 0.05;
            const stretch = 1 / squash;
            
            ctx.scale(squash, stretch);
            ctx.translate(0, bob);
            
            // Tilt while moving
            if (isMoving) {
                const tilt = velX * 0.12;
                ctx.rotate(tilt);
            }

            ctx.fillStyle = color;
            
            // Subtle scale effect during attack
            const isAttacking = player.current.attackCd > 0;
            const attackScale = isAttacking ? 1.2 : 1.0;
            const drawPSize = pSize * attackScale;
            
            ctx.fillRect(-drawPSize/2, -drawPSize/2, drawPSize, drawPSize);
            
            // Draw Cooldown Indicators
            if (player.current.attackCd > 0) {
                const attackWeapon = WEAPONS[stats.current.physicalWeapon] || WEAPONS['Spada Base'];
                const maxCd = attackWeapon.cooldown * 2.5;
                const ratio = Math.min(1, player.current.attackCd / maxCd);
                
                ctx.beginPath();
                ctx.arc(0, 0, drawPSize/2 + 6, -Math.PI/2, -Math.PI/2 + (2 * Math.PI * ratio));
                ctx.strokeStyle = `rgba(255, 100, 100, ${0.5 + Math.sin(time*10)*0.3})`;
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            if (player.current.magicCd > 0) {
                const magWeapon = WEAPONS[stats.current.magicWeapon] || WEAPONS['Bacchetta Bastarda'];
                const maxCd = magWeapon.cooldown * 2.5; 
                const ratio = Math.min(1, player.current.magicCd / maxCd);
                
                ctx.beginPath();
                ctx.arc(0, 0, drawPSize/2 + 10, -Math.PI/2, -Math.PI/2 + (2 * Math.PI * ratio));
                ctx.strokeStyle = `rgba(100, 100, 255, ${0.5 + Math.sin(time*12)*0.3})`;
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            
            // Add details per class
            if (heroClass === 'mage') {
                ctx.fillStyle = '#6600cc'; 
                ctx.beginPath();
                ctx.moveTo(0, -drawPSize/2 - 8);
                ctx.lineTo(- 10, -drawPSize/2);
                ctx.lineTo(+ 10, -drawPSize/2);
                ctx.fill();
                ctx.fillStyle = '#ffff66';
                ctx.beginPath();
                ctx.arc(0, 5, 4, 0, Math.PI * 2);
                ctx.fill();
            } else if (heroClass === 'paladin') {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-drawPSize/4, -drawPSize/4, drawPSize/2, drawPSize/2);
                ctx.fillStyle = color;
            }
            
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#000';
            let ox = 0, oy = 0;
            const visorOffset = 8 * attackScale;
            if (player.current.facing === 'up') oy = -visorOffset;
            if (player.current.facing === 'down') oy = visorOffset;
            if (player.current.facing === 'left') ox = -visorOffset;
            if (player.current.facing === 'right') ox = visorOffset;
            
            ctx.fillRect(ox - 5, oy - 3, 10, 6);
            
            // Draw equipped weapons held by player
            const pWeapon = WEAPONS[stats.current.physicalWeapon];
            const mWeapon = WEAPONS[stats.current.magicWeapon];
            
            [pWeapon, mWeapon].forEach((eqWeapon, idx) => {
                if (!eqWeapon) return;
                let wx = 0;
                let wy = 0;
                let wAngle = 0;
                
                const side = idx === 0 ? 1 : -1; 
                
                if (player.current.facing === 'up') { wx += 10 * side; wy -= 5; wAngle = side * -Math.PI/4; }
                if (player.current.facing === 'down') { wx -= 12 * side; wy += 5; wAngle = side * Math.PI/4; }
                if (player.current.facing === 'left') { wx -= 5; wy += 8 * side; wAngle = Math.PI + side * Math.PI/4; }
                if (player.current.facing === 'right') { wx += 5; wy += 8 * side; wAngle = side * -Math.PI/4; }
                
                ctx.save();
                ctx.translate(wx, wy);
                ctx.rotate(wAngle + (isMoving ? Math.sin(time*20)*0.1 : 0));
                ctx.fillStyle = eqWeapon.color || '#fff';
                
                // Attack animation bob
                if (idx === 0 && player.current.attackCd > 0) {
                    ctx.rotate((1 - (player.current.attackCd / 15)) * Math.PI / 2);
                }
                if (idx === 1 && player.current.magicCd > 0) {
                    ctx.rotate((1 - (player.current.magicCd / 25)) * -Math.PI / 4);
                }

                if (eqWeapon.type === 'wand') {
                    ctx.fillRect(-2, -10, 4, 15);
                    ctx.beginPath(); ctx.arc(0, -12, 4, 0, Math.PI*2); ctx.fill();
                } else if (eqWeapon.id === 'pistol' || eqWeapon.id === 'mythic_pistol' || eqWeapon.id === 'pistol_truth' || eqWeapon.id === 'pistol_laser') {
                    const isMythicPistol = eqWeapon.id === 'mythic_pistol';
                    const isTruthPistol = eqWeapon.id === 'pistol_truth';
                    const isLaserPistol = eqWeapon.id === 'pistol_laser';
                    ctx.fillStyle = isTruthPistol ? '#eeeeee' : (isMythicPistol ? '#333' : (isLaserPistol ? '#222' : '#444'));
                    ctx.fillRect(-2, -5, 4, 12); // Barrel
                    ctx.fillStyle = isTruthPistol ? '#ffd700' : (isMythicPistol ? '#aa8800' : (isLaserPistol ? '#880000' : '#666'));
                    ctx.fillRect(-4, 2, 8, 5); // Grip
                    ctx.fillStyle = isTruthPistol ? '#ffffff' : (isMythicPistol ? '#00ffff' : (isLaserPistol ? '#ff0000' : '#aaaaaa')); 
                    ctx.fillRect(-1, -7, 2, 2);
                    
                    if (isMythicPistol || isTruthPistol || isLaserPistol) {
                        ctx.shadowBlur = 10;
                        ctx.shadowColor = isTruthPistol ? '#ffffff' : (isMythicPistol ? '#00ffff' : (isLaserPistol ? '#ff0000' : '#ff00ff'));
                        ctx.strokeStyle = isTruthPistol ? '#ffd700' : (isMythicPistol ? '#00ffff' : (isLaserPistol ? '#ff0000' : '#ff00ff'));
                        ctx.lineWidth = 1;
                        ctx.strokeRect(-2, -5, 4, 12);
                        ctx.shadowBlur = 0;
                    }
                } else if (eqWeapon.type === 'boomerang') {
                    ctx.beginPath();
                    ctx.moveTo(-5, 8); ctx.lineTo(0, 0); ctx.lineTo(5, 8);
                    ctx.lineTo(0, 4); ctx.fill();
                } else if (eqWeapon.type === 'hammer') {
                    ctx.fillRect(-2, -5, 4, 18); // Handle
                    ctx.fillStyle = '#777';
                    ctx.fillRect(-8, -12, 16, 10); // Hammer head
                    ctx.fillStyle = '#ffd700'; // Gold detail
                    ctx.fillRect(-2, -10, 4, 6);
                } else if (eqWeapon.id === 'void_spear' || eqWeapon.id === 'astral_spear') {
                    const isAstral = eqWeapon.id === 'astral_spear';
                    // Spear Handle
                    ctx.fillStyle = isAstral ? '#1a365d' : '#444';
                    ctx.fillRect(isAstral ? -1.0 : -1.5, isAstral ? -16 : -5, isAstral ? 2.0 : 3, isAstral ? 30 : 20);
                    // Spear Tip
                    ctx.fillStyle = eqWeapon.color;
                    ctx.beginPath();
                    ctx.moveTo(isAstral ? -3 : -4, isAstral ? -16 : -5);
                    ctx.lineTo(0, isAstral ? -31 : -18);
                    ctx.lineTo(isAstral ? 3 : 4, isAstral ? -16 : -5);
                    ctx.fill();
                    // Glow effect
                    ctx.shadowBlur = isAstral ? 6 : 10;
                    ctx.shadowColor = eqWeapon.color;
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    
                    if (isAstral) {
                        ctx.fillStyle = '#ffffff';
                        ctx.beginPath();
                        ctx.arc(0, -22, 1.2, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    }
                } else if (eqWeapon.id === 'castle_whip') {
                    // Segmented chain whip handle
                    ctx.fillStyle = '#662222';
                    ctx.fillRect(-2, -2, 4, 10);
                    ctx.fillStyle = '#aa4444';
                    ctx.beginPath();
                    ctx.arc(0, -4, 4, 0, Math.PI * 2);
                    ctx.fill();

                    // Whip chain extension during attack
                    if (player.current.attackCd > 0) {
                        const progress = 1 - (player.current.attackCd / (eqWeapon.cooldown * 0.8));
                        const length = Math.sin(progress * Math.PI) * 192;
                        ctx.strokeStyle = '#883333';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(0, -4);
                        ctx.lineTo(0, -length);
                        ctx.stroke();
                        // Whip tip
                        ctx.fillStyle = '#ff3333';
                        ctx.beginPath();
                        ctx.arc(0, -length, 4, 0, Math.PI * 2);
                        ctx.fill();
                    }
                } else { // Sword
                    ctx.fillRect(-1, -12, 3, 18);
                    ctx.fillRect(-5, 0, 11, 3);
                }
                ctx.restore();
            });
            ctx.restore();
        }

        // Draw Pets
        pets.current.forEach(pet => {
            const petPulse = 1.0 + Math.sin(Date.now() / 200) * 0.1;
            const drawSize = pet.size * petPulse;
            ctx.save();
            
            // Glow
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00ffff';
            
            // Outer ring
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(pet.x, pet.y, drawSize * 1.5, 0, Math.PI * 2);
            ctx.stroke();
            
            // Core
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(pet.x, pet.y, drawSize / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Interior details (star shape)
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                ctx.lineTo(pet.x + Math.cos((18 + i * 72) / 180 * Math.PI) * (drawSize / 2), pet.y - Math.sin((18 + i * 72) / 180 * Math.PI) * (drawSize / 2));
                ctx.lineTo(pet.x + Math.cos((54 + i * 72) / 180 * Math.PI) * (drawSize / 4), pet.y - Math.sin((54 + i * 72) / 180 * Math.PI) * (drawSize / 4));
            }
            ctx.closePath();
            ctx.fill();
            
            // Health bar mini
            if (pet.hp < pet.maxHp) {
                const barW = 20;
                ctx.fillStyle = '#333';
                ctx.fillRect(pet.x - barW/2, pet.y - 15, barW, 3);
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(pet.x - barW/2, pet.y - 15, barW * (pet.hp / pet.maxHp), 3);
            }
            
            ctx.shadowBlur = 0;
            ctx.restore();
        });

        // Sword Slash
        const equippedWeapon = WEAPONS[stats.current.physicalWeapon] || WEAPONS['Spada Base'];
        const physicalStacks = stats.current.physicalStacks;
        const isSpear = equippedWeapon.id.includes('spear');
        const isThrust = equippedWeapon.special_behavior === 'thrust' || equippedWeapon.special_behavior === 'astral_thrust' || isSpear;
        const isWhip = equippedWeapon.special_behavior === 'whip';
        const isHarpoonWhip = equippedWeapon.special_behavior === 'harpoon_whip';
        const isCircleSun = equippedWeapon.special_behavior === 'circle_sun';
        if (player.current.attackCd > 0 && (equippedWeapon.type === 'sword' || equippedWeapon.type === 'hammer')) {
            const prog = 1 - (player.current.attackCd / equippedWeapon.cooldown); // 0 to 1
            const isHammer = equippedWeapon.type === 'hammer';
            const lvl = stats.current.lvl;
            const baseReach = equippedWeapon.range + (isCircleSun ? (lvl * 1.5) : 0);
            
            ctx.save();
            ctx.lineCap = 'round';
            
            const numWaves = isCircleSun ? (1 + Math.floor(lvl / 15)) : 1;
            for (let wave = 0; wave < numWaves; wave++) {
                const waveDelay = wave * 0.15;
                const waveProg = Math.max(0, Math.min(1, (prog - waveDelay) / (1 - waveDelay)));
                if (waveProg <= 0) continue;

                for (let s = 0; s < physicalStacks; s++) {
                    const reach = (baseReach + (s * (isHammer ? 12 : 8))) * (isCircleSun ? (0.6 + wave * 0.4) : 1);
                    const alphaMult = (1 - (s * 0.1)) * (isCircleSun ? (1 - wave * 0.25) : 1);
                    if (alphaMult <= 0) break;

                    let centerAngle = player.current.aimAngle;
                    if (!equippedWeapon.aimNearest) {
                        if (player.current.facing === 'up') centerAngle = -Math.PI / 2;
                        if (player.current.facing === 'down') centerAngle = Math.PI / 2;
                        if (player.current.facing === 'left') centerAngle = Math.PI;
                        // Right is 0
                    }
                    const sweep = isCircleSun ? (Math.PI * 2) : (equippedWeapon.angle || Math.PI);
                    const startAngle = centerAngle - sweep / 2;
                    const endAngle = centerAngle + sweep / 2;
                    
                    // Sweep effect
                    const currentEnd = startAngle + (endAngle - startAngle) * (isCircleSun ? waveProg : prog);
                    
                    if (isHarpoonWhip || isWhip) {
                    // Segmented Whip Drawing
                    ctx.save();
                    const segments = 12;
                    
                    let currentReach = reach;
                    let lashAngle = startAngle + (sweep * prog);
                    
                    if (isHarpoonWhip) {
                        // Harpoon moves out and back
                        currentReach = reach * Math.sin(prog * Math.PI);
                        lashAngle = centerAngle; // Harpoon is straight
                    }
                    
                    const segLen = currentReach / segments;
                    
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = equippedWeapon.color;
                    ctx.strokeStyle = (s === 0) ? equippedWeapon.color : '#662222';
                    ctx.lineWidth = 6 - (s * 1);
                    ctx.lineJoin = 'round';
                    
                    ctx.beginPath();
                    ctx.moveTo(player.current.x, player.current.y);
                    
                    let tipX = player.current.x;
                    let tipY = player.current.y;

                    for (let i = 1; i <= segments; i++) {
                        const segProg = i / segments;
                        // Whip lag: later segments follow the angle with a delay/curve
                        const lag = isHarpoonWhip ? 0 : Math.sin(prog * Math.PI) * (1 - segProg) * 0.6;
                        const angle = lashAngle + lag;
                        
                        const sx = player.current.x + Math.cos(angle) * (i * segLen);
                        const sy = player.current.y + Math.sin(angle) * (i * segLen);
                        ctx.lineTo(sx, sy);
                        
                        if (i === segments) {
                            tipX = sx;
                            tipY = sy;
                        }

                        // Joint highlight
                        if (i % 2 === 0) {
                            ctx.save();
                            ctx.translate(sx, sy);
                            ctx.fillStyle = (i === segments) ? '#fff' : '#444';
                            ctx.fillRect(-2, -2, 4, 4);
                            ctx.restore();
                        }
                    }
                    ctx.globalAlpha = (1 - prog) * alphaMult;
                    ctx.stroke();
                    
                    // If harpooned enemy exists, drag them to the tip
                    if (isHarpoonWhip && player.current.harpoonedEnemyId !== null && s === 0) {
                        const enemy = enemies.current.find(e => e.id === player.current.harpoonedEnemyId);
                        if (enemy && enemy.hp > 0) {
                            // Dragging logic: if it's the return phase (prog > 0.5), make them stick to tip
                            // Or just always stick if caught
                            enemy.x = tipX;
                            enemy.y = tipY;
                        }
                    }
                    
                    ctx.restore();
                } else if (isThrust) {
                    const thrustProg = Math.sin(prog * Math.PI);
                    const rFwd = reach * thrustProg;
                    const rBack = 64 * thrustProg;
                    
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(player.current.x - Math.cos(centerAngle) * rBack, player.current.y - Math.sin(centerAngle) * rBack);
                    ctx.lineTo(player.current.x + Math.cos(centerAngle) * rFwd, player.current.y + Math.sin(centerAngle) * rFwd);
                    const isSpear = equippedWeapon.id.includes('spear');
                    ctx.shadowBlur = equippedWeapon.special_behavior === 'astral_thrust' ? 3 : (isSpear ? 5 : 20);
                    ctx.shadowColor = equippedWeapon.color;
                    ctx.strokeStyle = equippedWeapon.color;
                    ctx.lineWidth = (equippedWeapon.special_behavior === 'astral_thrust' ? 5 : (isSpear ? 4 : 10)) + s * 1;
                    ctx.globalAlpha = (1 - prog) * alphaMult;
                    ctx.stroke();
                    
                    if (equippedWeapon.special_behavior === 'astral_thrust') {
                        ctx.strokeStyle = '#00ffff';
                        ctx.lineWidth = 3 + s * 0.5;
                        ctx.stroke();
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 1 + s * 0.2;
                        ctx.stroke();
                        
                        // Extra sparkles during thrust
                        if (s === 0) {
                            for(let i=0; i<2; i++) {
                                particles.current.push({
                                    x: player.current.x + Math.cos(centerAngle) * rFwd * Math.random(),
                                    y: player.current.y + Math.sin(centerAngle) * rFwd * Math.random(),
                                    vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
                                    life: 0, maxLife: 20, color: '#ffffff', size: 1
                                });
                            }
                        }
                    } else {
                        ctx.strokeStyle = '#fff';
                        ctx.lineWidth = 3;
                        ctx.stroke();
                    }
                    ctx.restore();

                    // Particles forward only on the main thrust
                    if (s === 0 && Math.random() < 0.4) {
                        for(let i=0; i<3; i++) {
                            particles.current.push({
                                x: player.current.x + Math.cos(centerAngle) * rFwd,
                                y: player.current.y + Math.sin(centerAngle) * rFwd,
                                vx: Math.cos(centerAngle + (Math.random()-0.5)*0.3) * (5 + Math.random()*5),
                                vy: Math.sin(centerAngle + (Math.random()-0.5)*0.3) * (5 + Math.random()*5),
                                life: 0, maxLife: 15, color: equippedWeapon.color, size: 2 + Math.random()*2
                            });
                        }
                    }
                } else if (isCircleSun) {
                    // Circle Sun Sweep
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(player.current.x, player.current.y, reach, startAngle, currentEnd);
                    ctx.lineWidth = 8 + s * 4;
                    ctx.strokeStyle = equippedWeapon.color;
                    ctx.shadowBlur = 25 + s * 5;
                    ctx.shadowColor = equippedWeapon.color;
                    ctx.globalAlpha = (1 - waveProg) * alphaMult;
                    ctx.stroke();
                    
                    // Core brightness
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2 + s * 2;
                    ctx.stroke();

                    // Solar Rays Effect
                    if (s === 0 && wave === 0) {
                        const rayCount = 8 + Math.floor(lvl / 10);
                        for (let i = 0; i < rayCount; i++) {
                            const rayAngle = (i / rayCount) * Math.PI * 2 + prog * 0.5 + wave * 0.2;
                            const rayLen = reach * (0.8 + Math.sin(prog * Math.PI + i) * 0.4);
                            
                            ctx.beginPath();
                            ctx.moveTo(player.current.x, player.current.y);
                            ctx.lineTo(
                                player.current.x + Math.cos(rayAngle) * rayLen,
                                player.current.y + Math.sin(rayAngle) * rayLen
                            );
                            ctx.strokeStyle = equippedWeapon.color;
                            ctx.lineWidth = 2;
                            ctx.globalAlpha = (1 - prog) * 0.3;
                            ctx.stroke();
                        }
                    }
                    ctx.restore();
                }
                
                // Legendary Trails
                if ((equippedWeapon.id === 'sword_destiny' || equippedWeapon.id === 'holy_hammer') && s === 0) {
                    const trailAngle = startAngle + (endAngle - startAngle) * prog;
                    const lvl = stats.current.lvl;
                    const intensity = (0.15 + physicalStacks * 0.15) * (1 + (lvl - 1) * 0.05); // Delicate for level 1, grows quickly
                    const numParticles = Math.max(1, Math.floor(2 * intensity + Math.random()));
                    
                    for (let i = 0; i < numParticles; i++) {
                        const px = player.current.x + Math.cos(trailAngle) * reach;
                        const py = player.current.y + Math.sin(trailAngle) * reach;
                        const isGold = Math.random() > 0.5;
                        const pColor = isGold ? '#FFD700' : '#FFFFFF';
                        
                        particles.current.push({
                            x: px + (Math.random() - 0.5) * (8 * intensity),
                            y: py + (Math.random() - 0.5) * (8 * intensity),
                            vx: (Math.random() - 0.5) * 2,
                            vy: (Math.random() - 0.5) * 2,
                            life: 0,
                            maxLife: (20 + Math.random() * 15) * intensity,
                            color: pColor,
                            size: (1.5 + Math.random() * 2) * intensity
                        });
                        
                        // Add some sparkle stars
                        if (Math.random() < 0.1 * intensity) {
                            particles.current.push({
                                x: px, y: py,
                                vx: (Math.random() - 0.5) * (4 * intensity), vy: (Math.random() - 0.5) * (4 * intensity),
                                life: 0, maxLife: 12 * intensity,
                                color: '#ffffff',
                                size: 1 * intensity
                            });
                        }
                    }
                }
                
                // Deflect projectiles (only first sweep does this)
                if (s === 0) {
                    for (let i = projectiles.current.length - 1; i >= 0; i--) {
                        const p = projectiles.current[i];
                        if (p.isEnemy) {
                            const dist = Math.hypot(p.x - player.current.x, p.y - player.current.y);
                                if (dist < reach + 40) {
                                    let inArea = false;
                                    if (isThrust) {
                                        const thrustProg = Math.sin(prog * Math.PI);
                                        const rFwd = reach * thrustProg;
                                        const rBack = 64 * thrustProg;
                                        const dot = (p.x - player.current.x) * Math.cos(centerAngle) + (p.y - player.current.y) * Math.sin(centerAngle);
                                        const perp = (p.x - player.current.x) * (-Math.sin(centerAngle)) + (p.y - player.current.y) * Math.cos(centerAngle);
                                        
                                        if (isSpear) {
                                            const thickness = (equippedWeapon.width || 0.5) * 40;
                                            inArea = Math.abs(perp) < thickness && dot > -rBack && dot < rFwd;
                                        } else {
                                            const thickness = equippedWeapon.special_behavior === 'astral_thrust' ? 50 : 30;
                                            inArea = Math.abs(perp) < thickness && dot > -80 && dot < equippedWeapon.range + 30;
                                        }
                                    } else {
                                        let angle = Math.atan2(p.y - player.current.y, p.x - player.current.x);
                                        while (angle < 0) angle += Math.PI * 2;
                                        while (angle >= Math.PI * 2) angle -= Math.PI * 2;
                                        
                                        let sOfs = startAngle;
                                        while (sOfs < 0) sOfs += Math.PI * 2;
                                        while (sOfs >= Math.PI * 2) sOfs -= Math.PI * 2;
                                        
                                        if (angle >= sOfs && angle <= currentEnd) {
                                            inArea = true;
                                        }
                                    }
                                    
                                    if (inArea) {
                                        projectiles.current.splice(i, 1);
                                        audio.playHitSound('warrior'); 
                                    }
                                }
                        }
                    }

                    // HIT ENEMIES (Synchronized with sweep animation)
                    enemies.current.forEach(e => {
                        if (e.hp > 0 && !player.current.currentAttackHitIds.has(e.id)) {
                             const dx = e.x - player.current.x;
                             const dy = e.y - player.current.y;
                             
                             // Optimization: Only check enemies within range
                             if (Math.abs(dx) > reach + 40 || Math.abs(dy) > reach + 40) return;
                             const dist = Math.hypot(dx, dy);
                            
                            if (dist < reach + 40) {
                                let inAttack = false;

                                if (isThrust) {
                                    const thrustProg = Math.sin(prog * Math.PI);
                                    const rFwd = reach * thrustProg;
                                    const rBack = 64 * thrustProg;
                                    const dot = dx * Math.cos(centerAngle) + dy * Math.sin(centerAngle);
                                    const perp = dx * (-Math.sin(centerAngle)) + dy * Math.cos(centerAngle);
                                    
                                    if (isSpear) {
                                        // Narrower band along the spear's line segment
                                        const thickness = (equippedWeapon.width || 0.5) * 40;
                                        inAttack = Math.abs(perp) < thickness && dot > -rBack && dot < rFwd;
                                    } else {
                                        const thickness = equippedWeapon.special_behavior === 'astral_thrust' ? 60 : 45;
                                        inAttack = Math.abs(perp) < thickness && dot > -80 && dot < reach + 30;
                                    }
                                } else if (isCircleSun) {
                                    // Sun Sword hits everything in range regardless of facing, if attack is active
                                    inAttack = true; 
                                } else if (isHarpoonWhip) {
                                    // Harpoon hit detection (thrust-like but only at the tip or along the line)
                                    const thrustProg = Math.sin(prog * Math.PI);
                                    const rFwd = reach * thrustProg;
                                    const dot = dx * Math.cos(centerAngle) + dy * Math.sin(centerAngle);
                                    const perp = dx * (-Math.sin(centerAngle)) + dy * Math.cos(centerAngle);
                                    
                                    // Harpoon tip box (checking if enemy center is near the tip)
                                    inAttack = Math.abs(perp) < 30 && Math.abs(dot - rFwd) < 35;
                                } else {
                                    let angle = Math.atan2(dy, dx);
                                    while (angle < 0) angle += Math.PI * 2;
                                    while (angle >= Math.PI * 2) angle -= Math.PI * 2;
                                    
                                    let sAngle = startAngle;
                                    while (sAngle < 0) sAngle += Math.PI * 2;
                                    while (sAngle >= Math.PI * 2) sAngle -= Math.PI * 2;

                                    const currentEnd = startAngle + (endAngle - startAngle) * prog;
                                    let eAngle = currentEnd;
                                    while (eAngle < 0) eAngle += Math.PI * 2;
                                    while (eAngle >= Math.PI * 2) eAngle -= Math.PI * 2;
                                    
                                    if (sAngle <= eAngle) {
                                        inAttack = angle >= sAngle && angle <= eAngle;
                                    } else {
                                        inAttack = angle >= sAngle || angle <= eAngle;
                                    }
                                }
                                
                                if (inAttack && (equippedWeapon.special_behavior !== 'harpoon_whip' || hasLineOfSight(player.current.x, player.current.y, e.x, e.y))) {
                                    // Combo Logic
                                    const now = Date.now();
                                    if (now - player.current.lastHitTime < 1000) {
                                        player.current.comboCount++;
                                    } else {
                                        player.current.comboCount = 1;
                                    }
                                    player.current.lastHitTime = now;
                                    const comboMultiplier = 1 + (player.current.comboCount * 0.05);

                                    player.current.currentAttackHitIds.add(e.id);
                                    
                                    // DAMAGE
                                    lastHitMobRef.current = { type: e.type, level: e.level, id: e.id, maxHp: e.maxHp, hitTime: Date.now(), deathTime: null };
                                    const baseDmg = equippedWeapon.type === 'hammer' ? 25 : 10;
                                    let damage = (baseDmg + stats.current.strength) * (1 + (physicalStacks - 1) * 0.5) * comboMultiplier * (stats.current.physDmgMult || 1);
                                    
                                    // CRITICAL HIT
                                    const isCrit = Math.random() < stats.current.critChance;
                                    if (isCrit) {
                                        damage *= stats.current.critDamage;
                                    }

                                    const actualDamage = calculateEnemyDamage(e, damage);
                                    e.hp -= actualDamage;
                                    applyOnHitEffects(e, actualDamage);
                                    spawnDamagePopup(e.x, e.y, actualDamage, e, isCrit, equippedWeapon.color);

                                    if (equippedWeapon.special_behavior === 'harpoon_whip') {
                                        // Check for boss/miniboss
                                        const isBoss = e.type === 'boss' || e.type === 'miniboss' || e.type === 'slimmy' || e.type === 'serpent' || e.type === 'shadow_reaper' || e.type === 'void_architect';
                                        if (!isBoss) {
                                            player.current.harpoonedEnemyId = e.id;
                                            e.harpoonedDuration = 0;
                                        }
                                        audio.playHitSound('warrior'); 
                                    }
                                    if (equippedWeapon.special_behavior === 'vampiric') {
                                        stats.current.hp = Math.min(stats.current.hp + Math.floor(calculateEnemyDamage(e, damage) * 0.2), stats.current.maxHp);
                                    }
                                    if (equippedWeapon.special_behavior === 'astral_thrust') {
                                        // Special effect: Astral stars on hit
                                        const hitParticles = 1 + physicalStacks;
                                        for (let k = 0; k < hitParticles; k++) {
                                           particles.current.push({
                                               x: e.x, y: e.y,
                                               vx: (Math.random() - 0.5) * (6 + physicalStacks), vy: (Math.random() - 0.5) * (6 + physicalStacks),
                                               life: 0, maxLife: 20 + physicalStacks * 2, color: '#00fbff', size: 1.0 + Math.random() * (0.5 + physicalStacks * 0.2)
                                           });
                                        }
                                        if (Math.random() < 0.3) audio.playPowerUpSound();
                                    }
                                    if (equippedWeapon.special_behavior === 'freeze') {
                                        e.freezeTimer = 90 * getEffectMultiplier(e); // Dynamic freeze
                                    }
                                    if (equippedWeapon.special_behavior === 'whip') {
                                        // Special effect: Whip lash sparks
                                        const hitStars = 1 + Math.floor(physicalStacks / 3);
                                        for (let k = 0; k < hitStars; k++) {
                                            particles.current.push({
                                                x: e.x, y: e.y,
                                                vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8,
                                                life: 0, maxLife: 20, color: '#ffaaaa', size: 1.5 + physicalStacks * 0.2
                                            });
                                        }
                                        // Small mythic lifesteal for whip
                                        stats.current.hp = Math.min(stats.current.hp + 1.5, stats.current.maxHp);
                                    }
                                    if (equippedWeapon.special_behavior === 'thunder') {
                                        audio.playThunderStrikeSound();
                                        // Visual lightning bolts
                                        const boltCount = 1 + Math.floor(physicalStacks / 3);
                                        for (let k = 0; k < boltCount; k++) {
                                            particles.current.push({
                                                x: e.x + (Math.random() - 0.5) * 40,
                                                y: e.y - 100,
                                                vx: (Math.random() - 0.5) * 5,
                                                vy: 15,
                                                life: 0,
                                                maxLife: 20,
                                                color: '#ffff00',
                                                size: 2 + physicalStacks * 0.3
                                            });
                                        }
                                    }
                                    if (equippedWeapon.special_behavior === 'circle_sun') {
                                        // Extra sun particles on hit
                                        for (let k = 0; k < 3; k++) {
                                            particles.current.push({
                                                x: e.x, y: e.y,
                                                vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
                                                life: 0, maxLife: 25, color: '#ffaa00', size: 2
                                            });
                                        }
                                        if (Math.random() < 0.2) audio.playElectricSound(0.2, 80);
                                    }
                                    if (equippedWeapon.lifesteal) {
                                        stats.current.hp = Math.min(stats.current.hp + equippedWeapon.lifesteal, stats.current.maxHp);
                                    }
                                    
                                    audio.playHitSound(e.type);
                                    if (equippedWeapon.knockback && e.type !== 'boss' && e.type !== 'nest') {
                                        const kAngle = Math.atan2(dy, dx);
                                        e.x += Math.cos(kAngle) * equippedWeapon.knockback;
                                        e.y += Math.sin(kAngle) * equippedWeapon.knockback;
                                    }
                                    
                                    if (equippedWeapon.aoeRadius) {
                                        const aoeRadiusPx = equippedWeapon.aoeRadius * GRID_SIZE;
                                        enemies.current.forEach(otherE => {
                                            if (otherE.id !== e.id && otherE.hp > 0 && Math.hypot(otherE.x - e.x, otherE.y - e.y) < aoeRadiusPx) {
                                                const splashDmg = calculateEnemyDamage(otherE, Math.floor(damage * 0.3));
                                                otherE.hp -= splashDmg;
                                                applyOnHitEffects(otherE, splashDmg);
                                            }
                                        });
                                    }

                                    if (e.hp <= 0) {
                                        registerEnemyKill(e);
                                    }
                                    
                                    // Particles
                                    for(let i=0; i<8; i++) {
                                        particles.current.push({
                                            x: e.x, y: e.y,
                                            vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8,
                                            life: 0, maxLife: 20, color: '#ff4444', size: 2
                                        });
                                    }
                                }
                            }
                        }
                    });
                }
                
                if (isThrust) {
                    // Visual already handled above
                } else if (isCircleSun) {
                    // Visual already handled above
                } else if (equippedWeapon.id === 'vampire_gloves') {
                    // Draw 3 scratches
                    const scratchOffsets = [-6, 0, 6];
                    scratchOffsets.forEach(offset => {
                        ctx.beginPath();
                        ctx.arc(player.current.x, player.current.y, reach + offset, startAngle, currentEnd);
                        ctx.globalAlpha = (1 - prog) * alphaMult;
                        ctx.strokeStyle = '#ff0000';
                        ctx.lineWidth = 2 * (1 - prog);
                        ctx.shadowBlur = 10;
                        ctx.shadowColor = '#ff0000';
                        ctx.stroke();
                    });
                } else if (equippedWeapon.id !== 'thunder_hammer') {
                    ctx.beginPath();
                    ctx.arc(player.current.x, player.current.y, reach, startAngle, currentEnd);
                    ctx.globalAlpha = (1 - prog) * alphaMult;
                    ctx.strokeStyle = equippedWeapon.color;
                    ctx.lineWidth = (10 - s) * (1 - prog);
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = equippedWeapon.color;
                    ctx.stroke();
                }
            }
        }
        ctx.restore();
        ctx.globalAlpha = 1.0;
    }

        // Reset state for enemies
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        // Draw Merchants
        rooms.current.forEach((r, idx) => {
            if (r.isMerchant && revealedRooms.current.has(idx)) {
                const mx = r.cx * GRID_SIZE + GRID_SIZE / 2;
                const my = r.cy * GRID_SIZE + GRID_SIZE / 2;
                
                ctx.save();
                ctx.translate(mx, my);
                
                // Shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.beginPath();
                ctx.ellipse(0, 15, 12, 6, 0, 0, Math.PI * 2);
                ctx.fill();

                // Merchant body (cloak)
                ctx.fillStyle = '#6B4226';
                ctx.beginPath();
                ctx.arc(0, 0, 14, Math.PI, 0);
                ctx.lineTo(14, 15);
                ctx.lineTo(-14, 15);
                ctx.closePath();
                ctx.fill();
                
                // Face
                ctx.fillStyle = '#f1c27d';
                ctx.beginPath();
                ctx.arc(0, -6, 8, 0, Math.PI * 2);
                ctx.fill();

                // Eyes
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(-3, -8, 2, 0, Math.PI * 2);
                ctx.arc(3, -8, 2, 0, Math.PI * 2);
                ctx.fill();
                
                // Hood
                ctx.fillStyle = '#8B4513';
                ctx.beginPath();
                ctx.arc(0, -8, 10, Math.PI, 0);
                ctx.lineTo(8, -2);
                ctx.lineTo(-8, -2);
                ctx.closePath();
                ctx.fill();

                // "SHOP" text above
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 10px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText('COLPISCI PER', 0, -32);
                ctx.fillText('COMPRARE', 0, -22);
                ctx.restore();
            }
        });

        // Enemies
        drawCorpses(ctx, cx, cy, canvas.width, canvas.height);
        enemies.current.forEach(e => {
            // Visibility Check
            const egx = Math.floor(e.x / GRID_SIZE);
            const egy = Math.floor(e.y / GRID_SIZE);
            const seIdx = secretTileToRoom.current[`${egy}_${egx}`];
            if (seIdx !== undefined && !revealedRooms.current.has(seIdx)) return;

            // Offscreen culling check
            const screenX = e.x + camX;
            const screenY = e.y + camY;
            const margin = (e.size || 16) * 2 + 30;
            if (screenX < -margin || screenX > canvas.width + margin || 
                screenY < -margin || screenY > canvas.height + margin) {
                return;
            }

            /* Visual effect for drain: beam removed, now handled by particles */
            /*
            if (e.type === 'vampire') {
                const dx = player.current.x - e.x;
                const dy = player.current.y - e.y;
                const drainD = Math.hypot(dx, dy);
                if (drainD < 64) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(e.x, e.y);
                    ctx.lineTo(player.current.x, player.current.y);
                    ctx.strokeStyle = `rgba(255, 0, 0, ${0.3 + Math.sin(time * 20) * 0.2})`;
                    ctx.lineWidth = 2 + Math.sin(time * 30);
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = '#ff0000';
                    ctx.stroke();
                    ctx.restore();
                }
            }
            */


            if (e.type === 'warrior' && e.slashCd && e.slashCd > 0) {
                e.slashCd -= 1;
                const prog = 1 - (e.slashCd / 15);
                const reach = e.size + 15;
                const startA = e.slashAngle! - Math.PI / 2;
                const endA = e.slashAngle! + Math.PI / 2;
                const currentEnd = startA + (endA - startA) * prog;
                
                ctx.save();
                ctx.beginPath();
                ctx.arc(e.x, e.y, reach, startA, currentEnd);
                ctx.strokeStyle = `rgba(255, 50, 50, ${1 - prog})`;
                ctx.lineWidth = 6 * (1 - prog);
                ctx.lineCap = 'round';
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ff0000';
                ctx.stroke();
                ctx.restore();
            }

            let color = '';
            if (e.isRocketTrapped) {
                const pulse = Math.sin(time * 20) * 0.5 + 0.5;
                color = pulse > 0.5 ? '#ff4500' : '#ffcc00';
            } else if (e.type === 'warrior') {
                color = '#ff3333';
            } else if (e.type === 'archer') {
                color = '#ff8800';
            } else if (e.type === 'mage') {
                color = '#9933ff';
            } else if (e.type === 'skeleton') {
                color = '#dddddd';
            } else if (e.type === 'specter') {
                color = '#00ffff';
            } else if (e.type === 'miniboss') {
                color = '#ff6600';
            } else if (e.type === 'boss') {
                color = '#ff0000';
            } else if (e.type === 'slimmy') {
                color = '#32cd32';
            } else if (e.type === 'serpent') {
                color = '#7cfc00';
            } else if (e.type === 'vampire') {
                color = '#880000';
            } else if (e.type === 'charger') {
                color = '#ff4500';
            } else if (e.type === 'bomber') {
                if (e.fuseTimer && e.fuseTimer > 0) {
                    const rate = e.fuseTimer < 30 ? 45 : 25;
                    const pulse = Math.sin(time * rate) * 0.5 + 0.5;
                    color = pulse > 0.5 ? '#ff0000' : '#ffff00';
                } else {
                    const pulse = Math.sin(time * 15) * 0.5 + 0.5;
                    color = pulse > 0.5 ? '#ff6600' : '#ff0000';
                }
            } else if (e.type === 'teleporter') {
                color = '#aa00ff';
            } else if (e.type === 'shield_bearer') {
                color = '#708090';
            } else if (e.type === 'necromancer') {
                color = '#006400';
            } else if (e.type === 'nest') {
                const isPanic = activeEnemies < 10;
                const isHyperPanic = activeEnemies < 3;
                if (isHyperPanic) color = '#ff3300'; // Angry Red
                else if (isPanic) color = '#ff9900'; // Dangerous Orange
                else color = '#f0f0f0'; // Egg white
            }
            
            ctx.fillStyle = color;
            let drawSize = e.size;
            const isMiniboss = e.type === 'miniboss';

            // Distinct drop shadow below the enemy
            if (e.type !== 'specter' && e.type !== 'nest') {
                ctx.save();
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.beginPath();
                ctx.ellipse(e.x, e.y + drawSize - 4, drawSize * 0.85, drawSize * 0.4, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Pulsating aura for Miniboss
            if (isMiniboss) {
                const auraPulse = Math.sin(time * 10) * 5 + 10;
                ctx.save();
                ctx.globalAlpha = 0.3;
                ctx.shadowBlur = auraPulse;
                ctx.shadowColor = '#ffff00';
                ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
                ctx.beginPath();
                ctx.arc(e.x, e.y, e.size * 1.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            if (e.type === 'shield_bearer') {
                ctx.save();
                ctx.strokeStyle = '#c0c0c0';
                ctx.lineWidth = 3;
                const ang = e.dir === 'right' ? 0 : (e.dir === 'left' ? Math.PI : (e.dir === 'up' ? -Math.PI / 2 : Math.PI / 2));
                ctx.beginPath();
                ctx.arc(e.x, e.y, e.size + 4, ang - 0.8, ang + 0.8);
                ctx.stroke();
                ctx.restore();
            }

            if (e.type === 'nest') {
                const isPanic = activeEnemies < 10;
                const isHyperPanic = activeEnemies < 3;
                const panicFactor = isHyperPanic ? 2.5 : (isPanic ? 1.5 : 1.0);
                
                const isSpawning = e.spawnTimer! < 90;
                const throb = isSpawning ? Math.sin(time * 15 * panicFactor + e.x) * 4 * panicFactor : Math.sin(time * 3 * panicFactor + e.x) * 2 * panicFactor;
                
                // Writhing effect during spawn
                const writhingX = isSpawning ? Math.sin(time * 20 * panicFactor) * 3 : (isPanic ? Math.sin(time * 10) * 1 : 0);
                const writhingY = isSpawning ? Math.cos(time * 20 * panicFactor) * 2 : (isPanic ? Math.cos(time * 10) * 1 : 0);

                drawSize += throb;
                
                // Nest (Egg)
                ctx.save();
                
                // Straw/Hay base
                ctx.strokeStyle = '#d4c060'; // Golden straw
                ctx.lineWidth = 1;
                for (let i = 0; i < 12; i++) {
                    const ang = (i / 12) * Math.PI * 2 + time;
                    const len = drawSize * 0.9 + Math.sin(time * 5 + i) * 5;
                    ctx.beginPath();
                    ctx.moveTo(e.x, e.y + drawSize * 0.4);
                    ctx.lineTo(e.x + Math.cos(ang) * len, e.y + drawSize * 0.7 + Math.sin(ang) * 5);
                    ctx.stroke();
                }

                ctx.beginPath();
                ctx.ellipse(e.x + writhingX, e.y + writhingY, drawSize * 0.8, drawSize, 0, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
                
                // Orifice / Mouth during spawn
                if (isSpawning) {
                    const oralPulse = Math.sin(time * 20) * 0.5 + 0.5;
                    ctx.beginPath();
                    ctx.ellipse(e.x, e.y - drawSize * 0.2, (drawSize * 0.4) * oralPulse, (drawSize * 0.2) * oralPulse, 0, 0, Math.PI * 2);
                    ctx.fillStyle = '#ff6666'; // Fleshy or red
                    ctx.fill();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = '#990000';
                    ctx.stroke();
                }

                // Dirty base
                ctx.beginPath();
                ctx.ellipse(e.x, e.y + drawSize*0.6, drawSize * 0.7, drawSize * 0.4, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#4a3728'; // Dirty brown
                ctx.globalAlpha = 0.4;
                ctx.fill();
                ctx.restore();
            } else if (e.type === 'boss') {
                // NEON OVERLORD VISUALS
                const isRage = e.hp < e.maxHp * 0.4;
                const glow = Math.sin(time * 5) * 10 + 20;
                const isStunned = e.stunTimer && e.stunTimer > 0;
                
                ctx.save();
                ctx.translate(e.x, e.y);
                if (isStunned) ctx.scale(1.2, 0.4); // Falling / Squished effect
                
                // Outer ring
                ctx.beginPath();
                ctx.arc(0, 0, e.size * 1.5, 0, Math.PI * 2);
                ctx.setLineDash([10, 10]);
                ctx.strokeStyle = isRage ? '#ff0000' : '#ff00ff';
                ctx.lineWidth = 4;
                ctx.stroke();
                
                // Rotating triangles
                ctx.rotate(time * 2);
                for(let i=0; i<3; i++) {
                    ctx.rotate((Math.PI * 2) / 3);
                    ctx.beginPath();
                    ctx.moveTo(0, -e.size * 1.8);
                    ctx.lineTo(e.size * 0.5, -e.size * 1.2);
                    ctx.lineTo(-e.size * 0.5, -e.size * 1.2);
                    ctx.closePath();
                    ctx.fillStyle = isRage ? 'rgba(255, 0, 0, 0.6)' : 'rgba(255, 0, 255, 0.6)';
                    ctx.fill();
                }
                
                // Core
                ctx.rotate(-time * 4);
                ctx.shadowBlur = glow;
                ctx.shadowColor = isRage ? '#ff0000' : '#ff00ff';
                ctx.fillStyle = '#110011';
                ctx.beginPath();
                ctx.arc(0, 0, e.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = isRage ? '#ff3333' : '#ffccff';
                ctx.lineWidth = 5;
                ctx.stroke();
                
                // Eye / Center
                ctx.fillStyle = isRage ? '#ffffff' : '#00ffff';
                ctx.beginPath();
                ctx.arc(0, 0, e.size * 0.4, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            } else if (e.type === 'slimmy' || e.type === 'serpent' || e.type === 'shadow_reaper' || e.type === 'void_architect') {
                if (e.type === 'void_architect') {
                    // Void Aura
                    ctx.save();
                    const hRatio = e.hp / e.maxHp;
                    const phase = hRatio > 0.6 ? 1 : (hRatio > 0.3 ? 2 : 3);
                    
                    const auraSize = e.size * (1.5 + Math.sin(time * 3) * 0.2);
                    const auraGrad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, auraSize);
                    
                    if (phase === 1) {
                        auraGrad.addColorStop(0, 'rgba(0, 255, 255, 0.4)');
                        auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    } else if (phase === 2) {
                        auraGrad.addColorStop(0, 'rgba(255, 0, 255, 0.4)');
                        auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    } else {
                        auraGrad.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
                        auraGrad.addColorStop(0.5, 'rgba(0, 255, 255, 0.3)');
                        auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    }
                    
                    ctx.fillStyle = auraGrad;
                    ctx.beginPath();
                    ctx.arc(e.x, e.y, auraSize, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Floating Void Shards
                    ctx.translate(e.x, e.y);
                    const shardCount = 4 + (phase-1) * 2;
                    for (let i = 0; i < shardCount; i++) {
                        ctx.save();
                        ctx.rotate(time + (Math.PI * 2 / shardCount) * i);
                        const dist = e.size * 1.3 + Math.sin(time * 2 + i) * 10;
                        ctx.fillStyle = phase === 3 ? '#ffffff' : (phase === 2 ? '#ff00ff' : '#00ffff');
                        ctx.beginPath();
                        ctx.moveTo(dist, 0);
                        ctx.lineTo(dist + 10, 5);
                        ctx.lineTo(dist + 10, -5);
                        ctx.fill();
                        ctx.restore();
                    }
                    ctx.restore();
                }

                if (e.type === 'shadow_reaper') {
                    // Shadow Aura
                    ctx.save();
                    const auraSize = e.size * 1.5;
                    const auraGrad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, auraSize);
                    auraGrad.addColorStop(0, 'rgba(45, 0, 77, 0.6)');
                    auraGrad.addColorStop(0.6, 'rgba(102, 0, 153, 0.3)');
                    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    ctx.fillStyle = auraGrad;
                    ctx.beginPath();
                    ctx.arc(e.x, e.y, auraSize, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Rotating shadow spikes
                    ctx.translate(e.x, e.y);
                    ctx.rotate(time * 2);
                    ctx.strokeStyle = '#660099';
                    ctx.lineWidth = 2;
                    for (let i = 0; i < 4; i++) {
                        ctx.rotate(Math.PI / 2);
                        ctx.beginPath();
                        ctx.moveTo(e.size * 1.1, 0);
                        ctx.lineTo(e.size * 1.6, 0);
                        ctx.stroke();
                    }
                    ctx.restore();
                }

                const drawBossSeg = (bx: number, by: number, type: Enemy['type'], main: boolean, ez: number = 0) => {
                    const art = ENEMY_PIXEL_ARTS[type];
                    if (!art) return;
                    
                    ctx.save();
                    ctx.translate(bx, by);
                    
                    const isMoving = e.state === 'chase' || e.state === 'patrol';
                    const squash = isMoving ? 1 + Math.abs(Math.sin(time * 12 + e.id)) * 0.1 : 1 + Math.sin(time * 4 + e.id) * 0.05;
                    const stretch = 1 / squash;
                    ctx.scale(squash, stretch);
                    
                    const pixelSize = (e.size * (main ? 1 : 0.7)) / 4;
                    const isStunned = e.stunTimer && e.stunTimer > 0;
                    
                    const relSide = (e.size * (main ? 1 : 0.7));
                    const startX = -relSide * (isStunned ? 1.4 : 1);
                    const startY = -relSide * (isStunned ? 0.4 : 1) - ez;
                    const bobY = isStunned ? 10 : Math.sin(time * 10 + e.id + (main ? 0 : 1)) * (type === 'slimmy' ? 4 : 2);
                    
                    for (let r = 0; r < 8; r++) {
                        for (let c = 0; c < 8; c++) {
                            const char = art.pixels[r][c];
                            if (char !== ' ' && art.colors[char]) {
                                let px = startX + c * pixelSize * (isStunned ? 1.4 : 1);
                                let py = startY + r * pixelSize * (isStunned ? 0.4 : 1) + bobY;
                                
                                // Slimmy squishiness
                                if (type === 'slimmy') {
                                    const sSquish = 1 + Math.sin(time * 12) * 0.1;
                                    const sVerticalSquish = 1 - Math.sin(time * 12) * 0.1;
                                    px = px * sSquish;
                                    py = py * sVerticalSquish;
                                }

                                ctx.fillStyle = art.colors[char];
                                ctx.fillRect(px, py, pixelSize + 0.5, pixelSize + 0.5);
                            }
                        }
                    }
                    ctx.restore();
                };

                // Shadow for Slimmy
                if (e.type === 'slimmy' && e.z && e.z > 0) {
                    ctx.save();
                    ctx.fillStyle = 'rgba(0,0,0,0.3)';
                    ctx.beginPath();
                    ctx.ellipse(e.x, e.y, e.size * 0.8, e.size * 0.4, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }

                // Draw segments first for serpent
                if (e.type === 'serpent' && e.segments) {
                    for (let s = e.segments.length - 1; s >= 0; s--) {
                         const wiggle = Math.sin(time * 8 + s * 0.8) * 8;
                         const offX = (e.dir === 'up' || e.dir === 'down') ? wiggle : 0;
                         const offY = (e.dir === 'left' || e.dir === 'right') ? wiggle : 0;
                         drawBossSeg(e.segments[s].x + offX, e.segments[s].y + offY, 'serpent', false);
                    }
                }
                // Draw head
                drawBossSeg(e.x, e.y, e.type === 'serpent' ? 'serpent' : e.type, true, e.z || 0);
            } else {
                const artType = (e.type === 'miniboss' && e.baseType) ? e.baseType : e.type;
                const art = ENEMY_PIXEL_ARTS[artType];
                if (art) {
                    const prevAlpha = ctx.globalAlpha;
                    if (e.type === 'specter') ctx.globalAlpha = 0.5 + Math.sin(time * 5) * 0.2;
                    
                    ctx.save();
                    ctx.translate(e.x, e.y);
                    
                    const pixelSize = drawSize / 4;
                    const startX = -drawSize;
                    const startY = -drawSize;
                    
                    let bobY = 0;
                    let ox = 0, oy = 0;
                    if (e.isDeadFuse) {
                        ctx.rotate(Math.PI / 2);
                        ctx.scale(1.0, 0.7);
                    } else {
                        const isMoving = e.state === 'chase' || e.state === 'patrol';
                        const squash = isMoving ? 1 + Math.abs(Math.sin(time * 15 + e.id)) * 0.12 : 1 + Math.sin(time * 4 + e.id) * 0.04;
                        const stretch = 1 / squash;
                        ctx.scale(squash, stretch);
                        
                        // Simple bobbing animation based on state
                        bobY = isMoving ? Math.sin(time * 15 + e.id) * 4 : 0;
                        
                        // Calculate offsets for directional aspect
                        const aspectOffset = pixelSize;
                        if (e.dir === 'up') oy = -aspectOffset;
                        if (e.dir === 'down') oy = aspectOffset;
                        if (e.dir === 'left') ox = -aspectOffset;
                        if (e.dir === 'right') ox = aspectOffset;
                    }

                    for (let r = 0; r < 8; r++) {
                        for (let c = 0; c < 8; c++) {
                            const char = art.pixels[r][c];
                            if (char !== ' ' && art.colors[char]) {
                                // If it's an eye pixel (usually 'B', 'W', or '0'), we can shift it more or hide it
                                const isEye = char === 'B' || (e.type === 'mage' && char === 'W') || (e.type === 'skeleton' && char === '0');
                                
                                let px = startX + c * pixelSize;
                                let py = startY + r * pixelSize + bobY;
                                
                                if (isEye) {
                                    if (e.dir === 'up') {
                                        py -= pixelSize * 2;
                                        if (py < startY) continue; 
                                    } else {
                                        px += ox;
                                        py += oy;
                                    }
                                } else {
                                    px += ox * 0.2;
                                    py += oy * 0.2;
                                }

                                ctx.fillStyle = art.colors[char];
                                ctx.fillRect(px, py, pixelSize + 0.5, pixelSize + 0.5);
                            }
                        }
                    }
                    ctx.restore();
                    ctx.globalAlpha = prevAlpha;
                } else {
                    // Fallback Draw body (square)
                    ctx.fillStyle = color;
                    ctx.fillRect(e.x - drawSize, e.y - drawSize, drawSize * 2, drawSize * 2);
                    
                    // Details (eyes) matching player aspect logic
                    ctx.fillStyle = '#050508';
                    let ox = 0, oy = 0;
                    const visorOffset = drawSize * 0.4;
                    if (e.dir === 'up') oy = -visorOffset;
                    if (e.dir === 'down') oy = visorOffset;
                    if (e.dir === 'left') ox = -visorOffset;
                    if (e.dir === 'right') ox = visorOffset;

                    if (e.dir !== 'up') {
                        ctx.fillRect(e.x + ox - 5, e.y + oy - 2, 10, 4);
                    }
                }
            }

            // Bomber fuse burning graphic animation
            if (e.type === 'bomber' && e.fuseTimer !== undefined && e.fuseTimer > 0) {
                ctx.save();
                
                let fxSource = e.x;
                let fySource = e.y - drawSize * 0.8;
                let fxControlX = e.x + 8;
                let fxControlY = e.y - drawSize * 1.1;
                let sparkX = e.x + 10;
                let sparkY = e.y - drawSize * 1.3;

                if (e.isDeadFuse) {
                    fxSource = e.x + drawSize * 0.8;
                    fySource = e.y;
                    fxControlX = e.x + drawSize * 1.1;
                    fxControlY = e.y + 8;
                    sparkX = e.x + drawSize * 1.3;
                    sparkY = e.y + 10;
                }

                // Draw fuse wire (quadratic curve)
                ctx.beginPath();
                ctx.moveTo(fxSource, fySource);
                ctx.quadraticCurveTo(fxControlX, fxControlY, sparkX, sparkY);
                ctx.strokeStyle = '#614d3f';
                ctx.lineWidth = 3;
                ctx.stroke();
                
                // Draw dynamic spark sizzle lines
                const numSparks = 5;
                ctx.strokeStyle = '#ffa500';
                ctx.lineWidth = 2;
                for (let i = 0; i < numSparks; i++) {
                    const ang = (i / numSparks) * Math.PI * 2 + time * 25;
                    const len = 5 + Math.sin(time * 30 + i) * 3;
                    ctx.beginPath();
                    ctx.moveTo(sparkX, sparkY);
                    ctx.lineTo(sparkX + Math.cos(ang) * len, sparkY + Math.sin(ang) * len);
                    ctx.stroke();
                }
                
                // Glowing circular center of spark
                ctx.beginPath();
                ctx.arc(sparkX, sparkY, 3 + Math.sin(time * 20) * 1.5, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ffff00';
                ctx.fill();
                
                ctx.restore();

                // Draw high-visibility warning countdown badge above its head
                ctx.save();
                ctx.font = 'bold 10px "JetBrains Mono", monospace';
                ctx.textAlign = 'center';
                const secondsLeft = (e.fuseTimer / 60).toFixed(1);
                
                // Pulsing/flickering offset and scale for critical count
                const isCritical = e.fuseTimer < 45;
                const textY = e.y - drawSize * 1.6 + (isCritical ? Math.sin(Date.now() / 20) * 2 : 0);
                
                // Draw solid red-orange background badge
                const badgeText = `⚠️ 💣 ${secondsLeft}s`;
                const textWidth = ctx.measureText(badgeText).width;
                ctx.fillStyle = 'rgba(15, 0, 0, 0.75)';
                ctx.fillRect(e.x - textWidth / 2 - 4, textY - 9, textWidth + 8, 13);
                
                // Outer red/yellow border on badge
                ctx.strokeStyle = isCritical ? '#ef4444' : '#facc15';
                ctx.lineWidth = 1;
                ctx.strokeRect(e.x - textWidth / 2 - 4, textY - 9, textWidth + 8, 13);
                
                // Draw warning text
                ctx.fillStyle = isCritical ? '#fc2a2a' : '#facc15';
                ctx.fillText(badgeText, e.x, textY + 1);
                ctx.restore();
            }

            if (e.isBubbleTrapped) {
                ctx.save();
                ctx.translate(e.x, e.y);
                const bSize = e.size * 1.5 + Math.sin(time * 5) * 2;
                const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, bSize);
                grad.addColorStop(0, 'rgba(255, 255, 255, 0.0)');
                grad.addColorStop(0.8, 'rgba(0, 204, 255, 0.2)');
                grad.addColorStop(1, 'rgba(255, 255, 255, 0.5)');
                ctx.fillStyle = grad;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(0, 0, bSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                // Bubble highlight
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.arc(-bSize * 0.4, -bSize * 0.4, bSize * 0.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // HP Bar
            if (!e.isDeadFuse) {
                const isBossOrMiniboss = e.type === 'boss' || e.type === 'slimmy' || e.type === 'serpent' || e.type === 'shadow_reaper' || e.type === 'void_architect' || e.type === 'miniboss';
                const isDamaged = e.hp < e.maxHp;
                const distToPlayer = Math.hypot(player.current.x - e.x, player.current.y - e.y);
                const isNearby = distToPlayer < 150;

                let opacity = 1.0;
                if (!isBossOrMiniboss) {
                    if (isDamaged) {
                        opacity = 1.0;
                    } else if (isNearby) {
                        // Fade out smoothly as they get further from 80px to 150px
                        opacity = Math.max(0, Math.min(1, (150 - distToPlayer) / 70));
                    } else {
                        opacity = 0;
                    }
                }

                if (opacity > 0) {
                    ctx.save();
                    ctx.globalAlpha *= opacity;

                    const isBoss = e.type === 'boss' || e.type === 'slimmy' || e.type === 'serpent' || e.type === 'shadow_reaper' || e.type === 'void_architect';
                    const barWidth = drawSize * (isBoss ? 3 : 2);
                    const barHeight = (isBoss ? 8 : 4);
                    const barY = e.y - drawSize - 15;
                    
                    // Border/Background
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    ctx.fillRect(e.x - barWidth / 2, barY, barWidth, barHeight);
                    
                    if (isBoss) {
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(e.x - barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2);
                    } else {
                        // High-contrast clean thin border for normal enemies
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
                        ctx.lineWidth = 0.5;
                        ctx.strokeRect(e.x - barWidth / 2 - 0.5, barY - 0.5, barWidth + 1, barHeight + 1);
                    }

                    // HP percentage
                    const hpPct = Math.max(0, e.hp / e.maxHp);

                    // Dynamic color for normal enemies based on health (Green -> Yellow -> Red)
                    let barColor = color; // fallback
                    if (!isBoss) {
                        if (hpPct > 0.6) {
                            barColor = '#10b981'; // vibrant emerald green
                        } else if (hpPct > 0.25) {
                            barColor = '#eab308'; // golden yellow
                        } else {
                            barColor = '#ef4444'; // combat crimson red
                        }
                    } else {
                        barColor = '#ff0000';
                    }

                    ctx.fillStyle = barColor;
                    ctx.fillRect(e.x - barWidth / 2, barY, barWidth * hpPct, barHeight);
                    
                    // HP Text for Bosses
                    if (isBoss) {
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 10px Courier New';
                        ctx.textAlign = 'center';
                        const hpText = `${Math.ceil(e.hp)} / ${e.maxHp}`;
                        ctx.fillText(hpText, e.x, barY - 5);
                        
                        // Mythic Title
                        if (stats.current.dungeonLevel >= 1) { // Show name for all bosses
                            ctx.fillStyle = '#FFD700';
                            ctx.font = 'bold 12px Courier New';
                            const names: Record<string, string> = {
                                boss: 'NEON OVERLORD',
                                slimmy: 'KING SLIME',
                                serpent: 'ELDER SERPENT',
                                shadow_reaper: 'SHADOW REAPER',
                                void_architect: 'VOID ARCHITECT'
                            };
                            const title = names[e.type] || 'BOSS';
                            ctx.fillText(title, e.x, barY - 20);
                        }
                        
                        ctx.textAlign = 'start'; // reset
                    }
                    ctx.restore();
                }
            }
        });

        // Projectiles
        projectiles.current.forEach(p => {
            // Offscreen culling check
            const screenX = p.x + camX;
            const screenY = p.y + camY;
            const size = (p.size || 8) * 3 + 20;
            if (screenX < -size || screenX > canvas.width + size ||
                screenY < -size || screenY > canvas.height + size) {
                return;
            }

            let pColor = p.color ? p.color : (p.isEnemy ? '#ff4444' : '#aa88ff');

            // Trails
            if (Math.random() < 0.3 || (p.special_behavior === 'obsidian_impact' && Math.random() < 0.6)) {
                particles.current.push({
                    x: p.x, y: p.y,
                    vx: -p.vx * 0.2 + (Math.random()-0.5)*0.5,
                    vy: -p.vy * 0.2 + (Math.random()-0.5)*0.5,
                    life: 0, maxLife: (p.special_behavior === 'obsidian_impact' ? 20 : 12) + Math.random()*8,
                    color: pColor,
                    size: (p.special_behavior === 'obsidian_impact' ? 2 : 1) + Math.random() * 2
                });
            }

            // Apply enemy shooter color if it's an enemy projectile and no color was set explicitly
            if (p.isEnemy && !p.color && p.shooterType && ENEMY_PIXEL_ARTS[p.shooterType]) {
                const colors = ENEMY_PIXEL_ARTS[p.shooterType].colors;
                const keys = Object.keys(colors);
                if (keys.length > 0) pColor = colors[keys[0]];
            }
            
            if (p.isHighLevel) {
                const cycle = (Date.now() / 150) % 4;
                if (cycle < 1) pColor = '#ffffff';
                else if (cycle < 2) pColor = '#ffff00';
                else if (cycle < 3) pColor = '#ffaa00';
                else pColor = '#ff0000';
            }

            ctx.fillStyle = pColor;
            ctx.shadowBlur = p.isHighLevel ? 15 : 10;
            ctx.shadowColor = pColor;
            
            let pRadius = p.isHighLevel ? 7 : 5;
            if (p.isEnemy) {
                // Enemy projectiles pulsate
                const pulse = Math.sin(Date.now() / 100) * 1.5;
                pRadius += pulse;
            }

            if (p.isBubble) {
                const bSize = (p.size || 40);
                ctx.save();
                ctx.translate(p.x, p.y);
                
                // Outer soap layer
                const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, bSize);
                grad.addColorStop(0, 'rgba(255, 255, 255, 0.0)');
                // Use p.color for the main bubble tint
                const colorVal = p.color || '#00ccff';
                grad.addColorStop(0.8, colorVal + '1a'); // 0.1 opacity hex suffix 
                grad.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
                
                ctx.fillStyle = grad;
                ctx.strokeStyle = colorVal + '4d'; // 0.3 opacity border
                ctx.lineWidth = 2;
                ctx.shadowBlur = 10;
                ctx.shadowColor = colorVal;
                ctx.beginPath();
                ctx.arc(0, 0, bSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                // Highlight
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.beginPath();
                ctx.arc(-bSize * 0.4, -bSize * 0.4, bSize * 0.2, 0, Math.PI * 2);
                ctx.fill();
                
                // Border
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                ctx.restore();
            } else if (p.isIceCrystal) {
                const bSize = 12; // Grossi cristalli
                const travelAngle = Math.atan2(p.vy, p.vx);
                
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(travelAngle);
                
                // Outer glow diamond
                ctx.fillStyle = '#88ffff';
                ctx.shadowColor = '#00FFFF';
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.moveTo(bSize * 1.5, 0);
                ctx.lineTo(0, bSize * 0.8);
                ctx.lineTo(-bSize * 1.5, 0);
                ctx.lineTo(0, -bSize * 0.8);
                ctx.closePath();
                ctx.fill();
                
                // Cross lines to make it look like a snowflake/crystal
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(bSize * 0.8, bSize * 0.8);
                ctx.lineTo(-bSize * 0.8, -bSize * 0.8);
                ctx.moveTo(-bSize * 0.8, bSize * 0.8);
                ctx.lineTo(bSize * 0.8, -bSize * 0.8);
                ctx.moveTo(0, -bSize * 1.2);
                ctx.lineTo(0, bSize * 1.2);
                ctx.stroke();
                
                // Inner bright diamond
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 0;
                ctx.beginPath();
                ctx.moveTo(bSize, 0);
                ctx.lineTo(0, bSize * 0.4);
                ctx.lineTo(-bSize, 0);
                ctx.lineTo(0, -bSize * 0.4);
                ctx.closePath();
                ctx.fill();
                
                ctx.restore();
            } else if (p.isLaser) {
                const angle = Math.atan2(p.vy, p.vx);
                const len = GRID_SIZE * 1.5; // 1.5 tiles long
                const thickness = (p.size || 3) * 1.2;
                
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(angle);
                
                // Glow effect for laser
                ctx.shadowBlur = 10 + thickness * 2;
                ctx.shadowColor = '#ff0000';
                ctx.strokeStyle = '#ff3333'; // Outer core
                ctx.lineWidth = thickness;
                ctx.lineCap = 'round';
                
                ctx.beginPath();
                ctx.moveTo(-len/2, 0);
                ctx.lineTo(len/2, 0);
                ctx.stroke();
                
                // Inner bright streak
                ctx.shadowBlur = 0;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = Math.max(1, thickness * 0.4);
                ctx.beginPath();
                ctx.moveTo(-len/2 + 2, 0);
                ctx.lineTo(len/2 - 2, 0);
                ctx.stroke();
                
                ctx.restore();
            } else if (p.isBoomerang) {
                const angle = Math.atan2(p.vy, p.vx);
                const rot = (Date.now() / 50) % (Math.PI * 2);
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(angle + rot);
                ctx.strokeStyle = pColor;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(-6, -6);
                ctx.lineTo(0, 0);
                ctx.lineTo(-6, 6);
                ctx.stroke();
                ctx.restore();
            } else if (p.special_behavior === 'auto_star') {
                const rot = (Date.now() / 150) % (Math.PI * 2);
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(rot);
                ctx.fillStyle = pColor;
                ctx.shadowBlur = p.isLegendaryStar ? 25 : 15;
                ctx.shadowColor = p.isLegendaryStar ? '#ffd700' : '#00ffff';
                ctx.beginPath();
                const outerRadius = p.isLegendaryStar ? 14 : 6;
                const innerRadius = p.isLegendaryStar ? 6 : 2.5;
                for (let i = 0; i < 5; i++) {
                    ctx.lineTo(Math.cos((18 + i * 72) / 180 * Math.PI) * outerRadius, -Math.sin((18 + i * 72) / 180 * Math.PI) * outerRadius);
                    ctx.lineTo(Math.cos((54 + i * 72) / 180 * Math.PI) * innerRadius, -Math.sin((54 + i * 72) / 180 * Math.PI) * innerRadius);
                }
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            } else {
                if (p.isEnemy && p.shooterType === 'archer') {
                    // Draw Arrow
                    const angle = Math.atan2(p.vy, p.vx);
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(angle);
                    ctx.strokeStyle = '#8B4513'; // Wood shaft
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(-8, 0);
                    ctx.lineTo(4, 0);
                    ctx.stroke();

                    ctx.fillStyle = '#C0C0C0'; // Iron arrowhead
                    ctx.beginPath();
                    ctx.moveTo(8, 0);
                    ctx.lineTo(2, 3);
                    ctx.lineTo(2, -3);
                    ctx.closePath();
                    ctx.fill();

                    ctx.strokeStyle = '#ffffff'; // Fletching
                    ctx.beginPath();
                    ctx.moveTo(-8, 0);
                    ctx.lineTo(-10, -3);
                    ctx.moveTo(-6, 0);
                    ctx.lineTo(-8, -3);
                    ctx.moveTo(-8, 0);
                    ctx.lineTo(-10, 3);
                    ctx.moveTo(-6, 0);
                    ctx.lineTo(-8, 3);
                    ctx.stroke();
                    ctx.restore();
                } else if (p.isEnemy && (p.shooterType === 'mage' || p.shooterType === 'necromancer')) {
                    // Draw Magic Bolt (Diamond)
                    const angle = Math.atan2(p.vy, p.vx);
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(angle);
                    ctx.fillStyle = pColor;
                    ctx.beginPath();
                    const size = pRadius * 1.5;
                    ctx.moveTo(size, 0);
                    ctx.lineTo(0, size * 0.5);
                    ctx.lineTo(-size, 0);
                    ctx.lineTo(0, -size * 0.5);
                    ctx.closePath();
                    ctx.fill();
                    
                    ctx.shadowBlur = 0;
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    ctx.restore();
                } else if (p.isEnemy && p.shooterType === 'vampire') {
                    // Draw Blood Drop
                    const angle = Math.atan2(p.vy, p.vx);
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(angle + Math.PI / 2); // Point forward
                    ctx.fillStyle = pColor; // usually red
                    ctx.beginPath();
                    const size = pRadius * 1.2;
                    ctx.moveTo(0, -size);
                    ctx.bezierCurveTo(size, 0, size, size, 0, size);
                    ctx.bezierCurveTo(-size, size, -size, 0, 0, -size);
                    ctx.closePath();
                    ctx.fill();
                    
                    ctx.shadowBlur = 0;
                    ctx.strokeStyle = '#ffb3b3';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    ctx.restore();
                } else if (p.isEnemy && p.shooterType === 'teleporter') {
                    // Draw Star/Spark
                    const rot = (Date.now() / 80) % (Math.PI * 2);
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(rot);
                    ctx.fillStyle = pColor;
                    ctx.beginPath();
                    for (let i = 0; i < 4; i++) {
                        ctx.lineTo(Math.cos((i * 90) / 180 * Math.PI) * pRadius * 1.5, Math.sin((i * 90) / 180 * Math.PI) * pRadius * 1.5);
                        ctx.lineTo(Math.cos((45 + i * 90) / 180 * Math.PI) * pRadius * 0.4, Math.sin((45 + i * 90) / 180 * Math.PI) * pRadius * 0.4);
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                } else if (p.isEnemy && (p.shooterType === 'specter' || p.shooterType === 'boss' || p.shooterType === 'shadow_reaper')) {
                    // Draw Wisp / Evil flame
                    const rot = Math.atan2(p.vy, p.vx);
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(rot);
                    const wiggle = Math.sin(Date.now() / 50) * 2;
                    
                    ctx.fillStyle = pColor;
                    ctx.beginPath();
                    ctx.arc(0, wiggle, pRadius, Math.PI * 0.5, Math.PI * 1.5);
                    ctx.quadraticCurveTo(pRadius * 2, wiggle, pRadius * 3, Math.sin(Date.now() / 40) * 4);
                    ctx.quadraticCurveTo(pRadius * 1.5, wiggle - pRadius * 1.5, 0, Math.PI * 1.5);
                    ctx.fill();
                    ctx.restore();
                } else if (p.special_behavior === 'eclipse') {
                    const rot = (Date.now() / 150) % (Math.PI * 2);
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(rot);
                    
                    // Shadow core - much larger than normal
                    ctx.fillStyle = pColor;
                    ctx.shadowBlur = 25;
                    ctx.shadowColor = pColor;
                    ctx.beginPath();
                    ctx.arc(0, 0, 10, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // White energy ring
                    const pulse = Math.sin(Date.now() / 150) * 3;
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(0, 0, 12 + pulse, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // Cross blades for visibility
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(-15, 0); ctx.lineTo(15, 0);
                    ctx.moveTo(0, -15); ctx.lineTo(0, 15);
                    ctx.stroke();
                    
                    ctx.restore();
                } else if (p.special_behavior === 'obsidian_impact') {
                    const angle = Math.atan2(p.vy, p.vx);
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(angle);
                    
                    // Sharp obsidian shard shape
                    ctx.fillStyle = pColor;
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = pColor;
                    
                    ctx.beginPath();
                    ctx.moveTo(18, 0);
                    ctx.lineTo(-12, -6);
                    ctx.lineTo(-8, 0);
                    ctx.lineTo(-12, 6);
                    ctx.closePath();
                    ctx.fill();
                    
                    // Glowing core line
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(10, 0);
                    ctx.lineTo(-2, 0);
                    ctx.stroke();
                    
                    ctx.restore();
                } else if (p.special_behavior === 'homing_rocket') {
                    const angle = Math.atan2(p.vy, p.vx);
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(angle);
                    
                    // Rocket Body
                    ctx.fillStyle = '#cccccc'; // Metallic gray body
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = '#ff4500';
                    
                    ctx.beginPath();
                    ctx.roundRect(-10, -4, 20, 8, 2);
                    ctx.fill();
                    
                    // Nose cone
                    ctx.fillStyle = '#ff0000';
                    ctx.beginPath();
                    ctx.moveTo(10, -4);
                    ctx.lineTo(18, 0);
                    ctx.lineTo(10, 4);
                    ctx.closePath();
                    ctx.fill();
                    
                    // Fins
                    ctx.fillStyle = '#444444';
                    ctx.beginPath();
                    ctx.moveTo(-10, -4);
                    ctx.lineTo(-12, -8);
                    ctx.lineTo(-6, -4);
                    ctx.closePath();
                    ctx.fill();
                    
                    ctx.beginPath();
                    ctx.moveTo(-10, 4);
                    ctx.lineTo(-12, 8);
                    ctx.lineTo(-6, 4);
                    ctx.closePath();
                    ctx.fill();
                    
                    // Fire/Thrust
                    const thrustLen = 10 + Math.random() * 10;
                    const grad = ctx.createLinearGradient(-10, 0, -10 - thrustLen, 0);
                    grad.addColorStop(0, '#ffff00');
                    grad.addColorStop(0.5, '#ffa500');
                    grad.addColorStop(1, 'rgba(255, 69, 0, 0)');
                    
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.moveTo(-10, -2);
                    ctx.lineTo(-10 - thrustLen, 0);
                    ctx.lineTo(-10, 2);
                    ctx.closePath();
                    ctx.fill();
                    
                    ctx.restore();
                } else {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, pRadius, 0, Math.PI * 2);
                    ctx.fill();
                    
                    if (p.isEnemy) {
                        ctx.save();
                        ctx.shadowBlur = 0; // Don't glow the border
                        ctx.strokeStyle = '#ffffff'; // White border
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                        ctx.restore();
                    }
                }
            }
            
            if (p.isHighLevel) {
                 // Inner glow
                 ctx.shadowBlur = 5;
                 ctx.shadowColor = '#fff';
                 ctx.fillStyle = '#fff';
                 ctx.beginPath();
                 ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                 ctx.fill();
            }
        });
        ctx.shadowBlur = 0;

        // Draw Exit Hatch (Botola)
        if (bossKilled.current && portal.current) {
            const px = portal.current.x;
            const py = portal.current.y;
            // Offscreen culling check
            const screenX = px + camX;
            const screenY = py + camY;
            const size = 32;
            if (screenX >= -size * 2 && screenX <= canvas.width + size * 2 &&
                screenY >= -size * 2 && screenY <= canvas.height + size * 2) {

                // Dark hole for stairs
                ctx.fillStyle = '#0a0a0d';
                ctx.fillRect(px - size/2, py - size/2, size, size);
                
                // Steps descending
                for(let i=0; i<4; i++) {
                    const stepY = py - size/2 + i * (size/4);
                    const stepH = size/4 - 2;
                    ctx.fillStyle = `rgba(30, 30, 50, ${1.0 - (i * 0.2)})`;
                    ctx.fillRect(px - size/2 + i, stepY, size - i*2, stepH);
                }

                // Frame of the hatch
                ctx.strokeStyle = '#3d2b1f';
                ctx.lineWidth = 4;
                ctx.strokeRect(px - size/2, py - size/2, size, size);

                // Open wooden door
                ctx.fillStyle = '#4a3728';
                ctx.save();
                ctx.translate(px + size * 0.4, py - size * 0.1);
                ctx.rotate(Math.PI / 4); // Slanted open door
                ctx.fillRect(0, -size/2, size * 0.8, size);
                
                // Door details (wood planks)
                ctx.strokeStyle = '#2d1f14';
                ctx.lineWidth = 1;
                for(let i=1; i<4; i++) {
                    const plankX = i * (size * 0.8 / 4);
                    ctx.beginPath();
                    ctx.moveTo(plankX, -size/2);
                    ctx.lineTo(plankX, size/2);
                    ctx.stroke();
                }
                // Iron handle
                ctx.strokeStyle = '#777';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(size * 0.4, 0, 4, 0, Math.PI * 2);
                ctx.stroke();

                ctx.restore();
                
                // Glow effect
                ctx.globalCompositeOperation = 'screen';
                const hatchGlow = ctx.createRadialGradient(px, py, 0, px, py, size * 1.5);
                hatchGlow.addColorStop(0, 'rgba(100, 200, 255, 0.1)');
                hatchGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = hatchGlow;
                ctx.fill();
                ctx.globalCompositeOperation = 'source-over';
            }
        }

        // Draw Damage Popups
        damagePopups.current.forEach((p, index) => {
            const elapsed = Date.now() - p.startTime;
            if (elapsed > 1500) {
                damagePopups.current.splice(index, 1);
                return;
            }
            // Offscreen culling check
            const screenX = p.x + camX;
            const screenY = p.y + camY;
            if (screenX < -30 || screenX > canvas.width + 30 ||
                screenY < -30 || screenY > canvas.height + 30) {
                return;
            }

            const alpha = elapsed > 1000 ? (1 - (elapsed - 1000) / 500) : 1;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.isCritical ? '#f6ad55' : p.color; // Orange for critical
            ctx.font = p.isCritical ? 'bold 20px Arial' : 'bold 14px Arial';
            ctx.shadowBlur = 4;
            ctx.shadowColor = 'black';
            ctx.fillText(p.value.toString(), p.x, p.y - 30 - elapsed * 0.05);
            ctx.restore();
        });

        // Particles
        for (let i = 0; i < particles.current.length; i++) {
            const p = particles.current[i];
            if (!p.active) continue;

            if (p.type === 'vampire_heal') {
                p.targetX = player.current.x;
                p.targetY = player.current.y;
            }
            
            if (p.targetX !== undefined && p.targetY !== undefined) {
               const dx = p.targetX - p.x;
               const dy = p.targetY - p.y;
               const dist = Math.hypot(dx, dy);
               if (dist < 10) {
                   p.active = false;
                   continue;
               } else {
                   const speed = 10;
                   p.vx = (dx / dist) * speed;
                   p.vy = (dy / dist) * speed;
                   p.x += p.vx * timeScale;
                   p.y += p.vy * timeScale;
               }
            } else {
                p.x += p.vx * timeScale;
                p.y += p.vy * timeScale;
                if (p.rotation !== undefined && p.vr !== undefined) {
                    p.rotation += p.vr * timeScale;
                }
                if (!p.noGravity) {
                    p.vy += 0.2 * timeScale; // gravity
                }
            }

            p.life++;
            if (p.life >= p.maxLife) {
                p.active = false;
                continue;
            }

            const isOffscreen = (p.x + camX < -50 || p.x + camX > canvas.width + 50 ||
                                 p.y + camY < -50 || p.y + camY > canvas.height + 50);

            if (!isOffscreen) {
                if (p.text !== undefined) {
                    ctx.save();
                    ctx.globalAlpha = 1 - (p.life / p.maxLife);
                    ctx.fillStyle = p.color;
                    ctx.font = p.fontSize ? `bold ${p.fontSize}px Arial` : 'bold 16px Arial';
                    ctx.shadowColor = '#000000';
                    ctx.shadowBlur = 6;
                    ctx.textAlign = 'center';
                    ctx.fillText(p.text, p.x, p.y);
                    ctx.restore();
                } else if (p.type === 'shockwave') {
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = 4 * (1 - (p.life / p.maxLife));
                    ctx.globalAlpha = 1 - (p.life / p.maxLife);
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
                    ctx.stroke();
                } else if (p.type === 'star') {
                    ctx.save();
                    ctx.globalAlpha = 1 - (p.life / p.maxLife);
                    ctx.translate(p.x, p.y);
                    if (p.rotation !== undefined) ctx.rotate(p.rotation);
                    ctx.fillStyle = p.color;
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = p.color;
                    
                    ctx.beginPath();
                    for (let j = 0; j < 5; j++) {
                        ctx.lineTo(Math.cos((18 + j * 72) / 180 * Math.PI) * p.size,
                                   -Math.sin((18 + j * 72) / 180 * Math.PI) * p.size);
                        ctx.lineTo(Math.cos((54 + j * 72) / 180 * Math.PI) * (p.size * 0.4),
                                   -Math.sin((54 + j * 72) / 180 * Math.PI) * (p.size * 0.4));
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                } else {
                    ctx.save();
                    ctx.globalAlpha = 1 - (p.life / p.maxLife);
                    ctx.translate(p.x, p.y);
                    if (p.rotation !== undefined) {
                        ctx.rotate(p.rotation);
                    }
                    ctx.fillStyle = p.color;
                    
                    // Add glow for spell particles
                    if (p.maxLife > 20 && p.size > 2) {
                        ctx.shadowBlur = 10;
                        ctx.shadowColor = p.color;
                    }
                    
                    if (p.rotation !== undefined) {
                        // Rectangular particle if rotated
                        ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
                    } else {
                        ctx.beginPath();
                        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.restore();
                }
            }
        }
        ctx.globalAlpha = 1.0;

        ctx.restore();
        
        // Evaluate Loot Summary first so we can adjust Minimap position
        const lootSummary: Record<string, { count: number, color: string, isEquipped?: boolean }> = {};
        loot.current.forEach(l => {
            const lgx = Math.floor(l.x / GRID_SIZE);
            const lgy = Math.floor(l.y / GRID_SIZE);
            const slIdx = secretTileToRoom.current[`${lgy}_${lgx}`];
            if (slIdx !== undefined && !revealedRooms.current.has(slIdx)) return;

            const name = l.name || (l.type === 'gold' ? 'Oro' : (l.type.startsWith('potion') ? 'Pozione' : l.type));
            if (!lootSummary[name]) {
                const isEquipped = l.type === 'weapon' && l.name && (l.name === stats.current.physicalWeapon || l.name === stats.current.magicWeapon);
                lootSummary[name] = { count: 0, color: l.rarityColor || l.color, isEquipped: !!isEquipped };
            }
            lootSummary[name].count++;
        });
        const summaryKeys = Object.keys(lootSummary);
        const lootHeight = summaryKeys.length > 0 ? summaryKeys.length * 18 + 10 : 0;

        // DRAW FOREGROUND PARALLAX (Dust/Atmosphere)
        backgroundElements.filter(e => e.type === 'foreground_dust').forEach(el => {
            const bx = cx * el.parallax;
            const by = cy * el.parallax;
            
            ctx.globalAlpha = el.opacity;
            const grad = ctx.createRadialGradient(el.x + bx, el.y + by, 0, el.x + bx, el.y + by, el.size);
            grad.addColorStop(0, el.color);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(el.x + bx - el.size, el.y + by - el.size, el.size * 2, el.size * 2);
        });
        ctx.globalAlpha = 1.0;

        // MINIMAP
        const mapSize = 120;
        const mapPadding = 20;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform to HUD space
        ctx.globalAlpha = 0.6; // 60% transparency
        const pWidth = canvas.width;
        const pHeight = canvas.height;
        const mapStartX = pWidth - mapSize - mapPadding;
        const mapStartY = pHeight - mapSize - mapPadding - (isMobile ? 120 : 20) - lootHeight; // Push up to make room for loot list
        
        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.fillRect(mapStartX, mapStartY, mapSize, mapSize);
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.strokeRect(mapStartX, mapStartY, mapSize, mapSize);
        ctx.shadowBlur = 0;

        const gridW = dungeon.current[0].length;
        const gridH = dungeon.current.length;
        const cellSize = mapSize / Math.max(gridW, gridH);
        
        exploredTiles.current.forEach(tileKey => {
            const [tx, ty] = tileKey.split(',').map(Number);
            const cell = dungeon.current[ty][tx];
            if (cell === 0 || cell === 2) {
                ctx.fillStyle = 'rgba(0, 255, 255, 0.1)'; // Wall shadow
                ctx.fillRect(mapStartX + tx * cellSize, mapStartY + ty * cellSize, cellSize, cellSize);
                ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
                ctx.strokeRect(mapStartX + tx * cellSize, mapStartY + ty * cellSize, cellSize, cellSize);
            } else if (cell === 3) {
                ctx.fillStyle = 'rgba(255, 0, 255, 0.4)'; // Boss room
                ctx.fillRect(mapStartX + tx * cellSize, mapStartY + ty * cellSize, cellSize, cellSize);
            } else {
                ctx.fillStyle = 'rgba(0, 255, 255, 0.05)'; // Floor
                ctx.fillRect(mapStartX + tx * cellSize, mapStartY + ty * cellSize, cellSize, cellSize);
            }
        });
        
        // Draw equipped weapons on the ground on minimap
        ctx.save();
        loot.current.forEach(l => {
            if (l.type === 'weapon' && l.name && (l.name === stats.current.physicalWeapon || l.name === stats.current.magicWeapon)) {
                const lgx = Math.floor(l.x / GRID_SIZE);
                const lgy = Math.floor(l.y / GRID_SIZE);
                const slIdx = secretTileToRoom.current[`${lgy}_${lgx}`];
                if (slIdx !== undefined && !revealedRooms.current.has(slIdx)) return;

                const tx = l.x / GRID_SIZE;
                const ty = l.y / GRID_SIZE;
                
                // Pulsing size and shadow for high visibility/blinking effect
                const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 150);
                const color = l.borderColor || l.rarityColor || l.color || '#fbbf24';
                
                ctx.fillStyle = color;
                ctx.shadowBlur = 4 + 6 * pulse;
                ctx.shadowColor = color;
                
                // Draw a small blinking circle
                ctx.beginPath();
                ctx.arc(mapStartX + tx * cellSize, mapStartY + ty * cellSize, 3 + pulse, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw a high contrast white inner core
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 0;
                ctx.beginPath();
                ctx.arc(mapStartX + tx * cellSize, mapStartY + ty * cellSize, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        ctx.restore();
        
        // Draw player dot on minimap
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#0ff';
        const mPX = Math.floor(player.current.x / GRID_SIZE);
        const mPY = Math.floor(player.current.y / GRID_SIZE);
        ctx.beginPath();
        ctx.arc(mapStartX + mPX * cellSize, mapStartY + mPY * cellSize, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // LOOT LIST AT BOTTOM RIGHT (UNDER MINIMAP)
        if (summaryKeys.length > 0) {
            const lootListX = pWidth - mapPadding;
            const lootListYStart = mapStartY + mapSize + 10;
            
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';
            ctx.font = 'bold 12px "JetBrains Mono", monospace';
            
            summaryKeys.forEach((name, i) => {
                const item = lootSummary[name];
                const text = `${name}${item.count > 1 ? ` x${item.count}` : ''}`;
                const yPos = lootListYStart + i * 18;
                
                ctx.save();
                if (item.isEquipped) {
                    ctx.globalAlpha = 0.35 + 0.65 * Math.sin(Date.now() / 150);
                }
                
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillText(text, lootListX + 1, yPos + 1);
                
                ctx.fillStyle = item.color;
                ctx.fillText(text, lootListX, yPos);
                ctx.restore();
            });
            ctx.restore();
        }
        
        // Dying effect
        const hpPerc = stats.current.hp / stats.current.maxHp;
        if (hpPerc < 0.2) {
             const alpha = 0.5 * (1 - (hpPerc / 0.2));
             const vignette = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width * 0.7);
             vignette.addColorStop(0, 'rgba(255, 0, 0, 0)');
             vignette.addColorStop(1, `rgba(150, 0, 0, ${alpha})`);
             
             ctx.save();
             ctx.globalCompositeOperation = 'multiply'; // Try multiply or source-over with alpha
             ctx.fillStyle = vignette;
             ctx.fillRect(0, 0, canvas.width, canvas.height);
             ctx.restore();
        }
        
        // Red Screen Damage Flash Overlay
        if (damageFlash.current > 0) {
             ctx.save();
             // Fade out the intensity proportionally to direct progress
             const flashAlpha = 0.45 * (damageFlash.current / 15);
             const damageVignette = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width * 0.75);
             damageVignette.addColorStop(0, `rgba(220, 38, 38, ${flashAlpha * 0.15})`);
             damageVignette.addColorStop(1, `rgba(220, 38, 38, ${flashAlpha})`);
             ctx.fillStyle = damageVignette;
             ctx.fillRect(0, 0, canvas.width, canvas.height);
             ctx.restore();
             
             damageFlash.current -= 1 * timeScale;
        }
        
        // Add additional tenebrous darkness if in boss room
        const currentGridX = Math.floor(player.current.x / GRID_SIZE);
        const currentGridY = Math.floor(player.current.y / GRID_SIZE);
        const isCurrentlyInBossRoom = dungeon.current[currentGridY]?.[currentGridX] === 3;
        
        if (isCurrentlyInBossRoom) {
            const bossVignette = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width * 0.7);
            bossVignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
            bossVignette.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
            ctx.fillStyle = bossVignette;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Fog effect
            ctx.fillStyle = 'rgba(20, 0, 40, 0.15)';
            const fogPulse = Math.sin(time) * 10;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Draw Full-screen Level Message
        if (levelMessage.current && levelMessage.current.timer > 0) {
            levelMessage.current.timer -= 1 * timeScale;
            ctx.save();
            ctx.font = '900 italic 48px Courier New';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const alpha = Math.min(1, levelMessage.current.timer / 40);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00ffff';
            
            ctx.fillText(levelMessage.current.text, canvas.width / 2, canvas.height / 2);
            
            ctx.font = '900 italic 20px Courier New';
            const subtext = settings.language === 'it' ? 'SINCRO SISTEMA IN CORSO...' : 'SYSTEM SYNC IN PROGRESS...';
            ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.6})`;
            ctx.fillText(subtext, canvas.width / 2, canvas.height / 2 + 50);
            ctx.restore();
        }

        if (settingsRef.current.showFps) {
            ctx.save();
            const fpsText = `FPS: ${fps}`;
            ctx.font = '900 11px "JetBrains Mono", monospace';
            const textWidth = ctx.measureText(fpsText).width;
            
            // Background box for clarity
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(canvas.width - textWidth - 30, 85, textWidth + 10, 18);
            
            ctx.fillStyle = '#00ffff';
            ctx.shadowBlur = 4;
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';
            ctx.fillText(fpsText, canvas.width - 25, 88);
            ctx.restore();
        }

        if (stats.current.hp <= 0 && !isGameOver.current) {
            isGameOver.current = true;
            localStorage.removeItem('player_stats');
            localStorage.removeItem('game_interrupted');
            audio.playGameOverMusic();
            setGameOverData({ 
                score: stats.current.score, 
                lvl: stats.current.lvl, 
                kills: stats.current.kills,
                dungeonLvl: stats.current.dungeonLevel,
                timeSurvived: Math.floor((Date.now() - startTime.current) / 1000),
                killer: killerRef.current ? { type: killerRef.current.type, level: killerRef.current.level, damage: killerRef.current.damage } : undefined
            });
            return;
        }
    };

    requestID = requestAnimationFrame(loop);

    return () => {
        cancelAnimationFrame(requestID);
        window.removeEventListener('resize', resize);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden select-none touch-none">
        <canvas 
            ref={canvasRef} 
            className="block [image-rendering:pixelated]"
        />

        {/* New Stylized UIPanel */}
        <UIPanel 
            hp={hudStats.hp}
            maxHp={hudStats.maxHp}
            mp={hudStats.mp}
            maxMp={hudStats.maxMp}
            dungeonLevel={hudStats.dungeonLevel}
            heroLevel={hudStats.lvl}
            kills={hudStats.kills}
            strength={hudStats.strength}
            gold={Math.floor(hudStats.gold)}
            physicalWeaponName={hudStats.physicalWeapon}
            physicalWeaponLevel={hudStats.physicalStacks}
            physicalWeaponRarity={hudStats.physicalWeaponRarity}
            magicWeaponName={hudStats.magicWeapon}
            magicWeaponLevel={hudStats.magicStacks}
            magicWeaponRarity={hudStats.magicWeaponRarity}
            heroClass={heroClass}
            language={settingsRef.current.language}
            score={hudStats.score}
            exp={hudStats.exp}
            nextExp={hudStats.nextExp}
            skillPoints={hudStats.skillPoints}
            defense={hudStats.defense}
            hpRegen={hudStats.hpRegen}
            mpRegenBoost={hudStats.mpRegenBoost}
            critChance={hudStats.critChance}
            critDamage={hudStats.critDamage}
            cooldownReduction={hudStats.cooldownReduction}
            attackSpeed={hudStats.attackSpeed}
            highlightedStats={highlightedStats}
            onOpenSkills={() => {
                setShowSkillTree(true);
                pauseRef.current = true;
            }}
            onOpenBestiary={() => {
                setShowBestiary(true);
                pauseRef.current = true;
            }}
            onOpenTrophies={() => {
                setShowTrophies(true);
                pauseRef.current = true;
            }}
            onPause={() => {
                if (!isPaused && !isGameOver.current && !showShop && !showSkillTree && !showLevelUpSlots) {
                    pauseRef.current = true;
                    setIsPaused(true);
                }
            }}
        />

        <div id="nearby-loot-text" className={`absolute bottom-24 left-1/2 -translate-x-1/2 text-yellow-400 text-[14px] font-black uppercase italic tracking-widest transition-all duration-300 min-h-[1.5rem] drop-shadow-[0_0_12px_rgba(250,204,21,0.6)] z-20 ${isMobile ? 'opacity-60' : 'opacity-100'}`}></div>
        <div id="mob-target-text" className={`absolute bottom-40 left-1/2 -translate-x-1/2 text-red-500 text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 ease-out min-h-[1rem] z-20 ${isMobile ? 'opacity-60' : 'opacity-100'}`} style={{ transform: 'translate(-50%, 20px)', opacity: 0 }}></div>

        {/* Touch Controls (Joystick & Action Buttons) */}
        {isMobile && !isGameOver.current && (
            <>
                {/* Movement Joystick Area */}
                <div 
                    className="fixed bottom-0 left-0 w-[50vw] h-[60vh] z-[100] touch-none select-none pointer-events-auto"
                    onPointerDown={(e) => {
                        joystickRef.current = {
                            active: true,
                            startX: e.clientX,
                            startY: e.clientY,
                            curX: e.clientX,
                            curY: e.clientY,
                            id: e.pointerId
                        };
                        e.currentTarget.setPointerCapture(e.pointerId);
                        
                        const base = document.getElementById('joystick-base');
                        if (base) {
                            base.style.display = 'block';
                            base.style.left = `${e.clientX - 60}px`;
                            base.style.top = `${e.clientY - 60}px`;
                            
                            const knob = document.getElementById('joystick-knob');
                            if (knob) knob.style.transform = `translate(-50%, -50%)`;
                        }
                    }}
                    onPointerMove={(e) => {
                        if (joystickRef.current.active && joystickRef.current.id === e.pointerId) {
                            joystickRef.current.curX = e.clientX;
                            joystickRef.current.curY = e.clientY;
                            
                            const dx = e.clientX - joystickRef.current.startX;
                            const dy = e.clientY - joystickRef.current.startY;
                            const dist = Math.hypot(dx, dy);
                            const maxDist = 40;
                            let tfX = dx;
                            let tfY = dy;
                            if (dist > maxDist) {
                                tfX = (dx / dist) * maxDist;
                                tfY = (dy / dist) * maxDist;
                            }
                            
                            const knob = document.getElementById('joystick-knob');
                            if (knob) knob.style.transform = `translate(calc(-50% + ${tfX}px), calc(-50% + ${tfY}px))`;
                        }
                    }}
                    onPointerUp={(e) => {
                        if (joystickRef.current.id === e.pointerId) {
                            joystickRef.current.active = false;
                            joystickRef.current.id = null;
                            const base = document.getElementById('joystick-base');
                            if (base) base.style.display = 'none';
                        }
                    }}
                    onPointerCancel={(e) => {
                        if (joystickRef.current.id === e.pointerId) {
                            joystickRef.current.active = false;
                            joystickRef.current.id = null;
                            const base = document.getElementById('joystick-base');
                            if (base) base.style.display = 'none';
                        }
                    }}
                >
                    {/* Joystick HUD */}
                    <div id="joystick-base" className="fixed w-[120px] h-[120px] border-2 border-white/20 bg-white/5 rounded-full pointer-events-none hidden" style={{ display: 'none' }}>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white/10 rounded-full" />
                        <div id="joystick-knob" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white/40 border-2 border-white/60 rounded-full shadow-lg" />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="absolute bottom-[calc(2.5rem+4vh)] right-10 w-44 h-44 z-[100] touch-none pointer-events-none">
                    {/* Primary Attack (Phys) */}
                    <div 
                        className="absolute bottom-2 right-2 w-[72px] h-[72px] rounded-full bg-pink-600/40 border-2 border-pink-400/60 flex items-center justify-center text-pink-100 font-black text-sm active:bg-pink-600/70 active:scale-95 transition-all shadow-[0_0_20px_#ff336644] touch-none pointer-events-auto select-none"
                        onPointerDown={handlePointerDown('z')}
                        onPointerUp={handlePointerUp('z')}
                        onPointerCancel={handlePointerUp('z')}
                    >
                        <span className="drop-shadow-lg italic">ATK</span>
                    </div>

                    {/* Secondary Attack (Mage/Magic) */}
                    <div 
                        className="absolute top-12 right-2 w-[52px] h-[52px] rounded-full bg-purple-500/30 border-2 border-purple-400/50 flex items-center justify-center text-purple-200 font-bold text-xs active:bg-purple-500/60 active:scale-90 transition-all shadow-[0_0_15px_#aa44ff33] touch-none pointer-events-auto select-none"
                        onPointerDown={handlePointerDown('x')}
                        onPointerUp={handlePointerUp('x')}
                        onPointerCancel={handlePointerUp('x')}
                    >
                        <span className="drop-shadow-md">MAG</span>
                    </div>
                </div>
            </>
        )}

        {/* Game Over Screen */}
        <AnimatePresence>
        {gameOverData && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center z-[200] p-4 font-mono overflow-hidden"
            >
                {/* Background Particles Decoration */}
                <div className="absolute inset-0 pointer-events-none opacity-30">
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ 
                                x: Math.random() * 2000, 
                                y: Math.random() * 2000,
                                scale: Math.random() * 0.5 + 0.5,
                                opacity: Math.random() * 0.3 + 0.2
                            }}
                            animate={{ 
                                y: [null, -100],
                                opacity: [null, 0]
                            }}
                            transition={{ 
                                duration: Math.random() * 3 + 2, 
                                repeat: Infinity, 
                                ease: "linear",
                                delay: Math.random() * 5
                            }}
                            className="absolute w-2 h-2 bg-red-500 rounded-full blur-sm"
                            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
                        />
                    ))}
                </div>

                <motion.div 
                    initial={{ scale: 0.9, y: 30, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{ type: "spring", damping: 20, stiffness: 100 }}
                    className="bg-slate-900/80 border-x-4 border-red-600/50 p-8 md:p-12 rounded-[2rem] max-w-lg w-full text-center shadow-[0_0_60px_rgba(220,38,38,0.2)] relative overflow-hidden backdrop-blur-md"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent animate-pulse" />
                    
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h2 className="text-5xl md:text-7xl font-black italic mb-2 text-white tracking-widest drop-shadow-[0_0_20px_rgba(220,38,38,0.9)]">
                            GAME <span className="text-red-600">OVER</span>
                        </h2>
                        <p className="text-red-500/60 text-[10px] font-black uppercase tracking-[0.4em] mb-4">
                            {settingsRef.current.language === 'it' ? 'Missione Fallita' : 'Mission Failed'}
                        </p>
                        
                        <div className="flex gap-4 mb-4">
                            <button 
                                onClick={handleReplay}
                                className="flex-1 py-5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-2xl font-black italic uppercase tracking-[0.1em] text-[10px] transition-all shadow-[0_10px_40px_rgba(16,185,129,0.3)] active:scale-95 group overflow-hidden relative"
                            >
                                <span className="relative z-10">{settingsRef.current.language === 'it' ? 'RIGIOCA' : 'RETRY'}</span>
                                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
                            </button>
                            <button 
                                onClick={() => onExit?.()}
                                className="flex-1 py-5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-2xl font-black italic uppercase tracking-[0.1em] text-[10px] transition-all shadow-[0_10px_40px_rgba(220,38,38,0.4)] active:scale-95 group overflow-hidden relative"
                            >
                                <span className="relative z-10">{settingsRef.current.language === 'it' ? 'ESCI' : 'EXIT'}</span>
                                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
                            </button>
                        </div>

                        {gameOverData.killer && (
                            <div className="mb-6 text-center text-red-500/70 text-[10px] font-black uppercase tracking-widest italic drop-shadow-[0_0_10px_rgba(220,38,38,0.3)]">
                                {settingsRef.current.language === 'it' ? 'Ucciso da:' : 'Killed by:'} {(() => {
                                        const names: Record<string, {it: string, en: string}> = {
                                            warrior: { it: 'Guerriero', en: 'Warrior' },
                                            archer: { it: 'Arciere', en: 'Archer' },
                                            mage: { it: 'Mago', en: 'Mage' },
                                            skeleton: { it: 'Scheletro', en: 'Skeleton' },
                                            miniboss: { it: 'Miniboss', en: 'Miniboss' },
                                            boss: { it: 'Boss', en: 'Boss' },
                                            nest: { it: 'Nido', en: 'Nest' },
                                            specter: { it: 'Spettro', en: 'Specter' },
                                            vampire: { it: 'Vampiro', en: 'Vampire' },
                                            charger: { it: 'Caricatore', en: 'Charger' },
                                            teleporter: { it: 'Teletrasportatore', en: 'Teleporter' },
                                            shield_bearer: { it: 'Portatore di Scudo', en: 'Shield Bearer' },
                                            bomber: { it: 'Bombardiere', en: 'Bomber' },
                                            necromancer: { it: 'Negromante', en: 'Necromancer' }
                                        };
                                        const lang = settingsRef.current.language === 'it' ? 'it' : 'en';
                                        const labelSet = names[gameOverData.killer.type];
                                        return labelSet ? labelSet[lang] : gameOverData.killer.type;
                                })()} <span className="text-white">LIV.{gameOverData.killer.level}</span> {gameOverData.killer.damage != null ? <span className="text-yellow-500">[{gameOverData.killer.damage} DMG]</span> : null}
                            </div>
                        )}
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-10 text-left bg-black/20 p-6 rounded-2xl border border-white/5">
                        <StatRow label={settingsRef.current.language === 'it' ? 'Punteggio' : 'Score'} val={gameOverData.score.toLocaleString()} color="text-cyan-400" />
                        <StatRow label={settingsRef.current.language === 'it' ? 'Tempo' : 'Time'} val={`${Math.floor(gameOverData.timeSurvived / 60)}:${(gameOverData.timeSurvived % 60).toString().padStart(2, '0')}`} color="text-emerald-400" />
                        <StatRow label={settingsRef.current.language === 'it' ? 'Livello' : 'Level'} val={gameOverData.lvl} color="text-pink-400" />
                        <StatRow label={settingsRef.current.language === 'it' ? 'Uccisioni' : 'Kills'} val={gameOverData.kills} color="text-white" />
                        <div className="md:col-span-2">
                            <StatRow label={settingsRef.current.language === 'it' ? 'Dungeon' : 'Floor'} val={gameOverData.dungeonLvl} color="text-yellow-400" />
                        </div>
                        <div className="md:col-span-2 mt-2 pt-2 border-t border-white/5 opacity-50">
                            <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-[0.2em] font-mono">
                                <span>{settingsRef.current.language === 'it' ? 'SEME DUNGEON' : 'DUNGEON SEED'}</span>
                                <span className="text-white select-all">{activeSeed.current}</span>
                            </div>
                        </div>
                    </div>



                    <div className="mt-8 text-[8px] text-slate-700 tracking-[0.5em] font-bold uppercase opacity-50">
                        Critical System Failure // Link Terminated
                    </div>
                </motion.div>
            </motion.div>
        )}
        </AnimatePresence>

        {showShop && (
            <ShopUI 
                stats={stats} 
                audio={audio}
                timeSurvived={Math.floor((Date.now() - startTime.current) / 1000)}
                onClose={() => {
                   setShowShop(false);
                   setIsMerchantRoom(false);
                   pauseRef.current = false;
                }} 
                onContinue={isMerchantRoom ? () => {
                     setShowShop(false);
                     setIsMerchantRoom(false);
                     pauseRef.current = false;
                } : () => {
                    setShowShop(false);
                    stats.current.dungeonLevel++;
                    initLevel(stats.current.dungeonLevel);
                }}
                onTrophyProgress={showTrophyProgress}
                isMerchantRoom={isMerchantRoom}
                language={settingsRef.current.language}
            />
        )}
        
        {showSkillTree && (
            <SkillTreeUI
                stats={stats}
                onClose={() => {
                    setShowSkillTree(false);
                    pauseRef.current = false;
                }}
                lang={settingsRef.current.language}
            />
        )}

        {showLevelUpSlots && (
            <LevelUpSlotMachineUI
                stats={stats}
                onClose={() => {
                    setShowLevelUpSlots(false);
                    pauseRef.current = false;
                }}
                onOpenSkillTree={() => {
                    setShowLevelUpSlots(false);
                    setShowSkillTree(true);
                }}
                lang={settingsRef.current.language}
            />
        )}

        {/* Level Up Fireworks Overlay */}
        <AnimatePresence>
            {showLevelUpText && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[400] flex flex-col items-center justify-center pointer-events-none bg-cyan-500/10 backdrop-blur-[4px]"
                >
                    <motion.div 
                        initial={{ scale: 0.5, y: 50 }}
                        animate={{ 
                            scale: [0.5, 1.2, 1], 
                            y: [50, -20, 0],
                            rotate: [0, 5, -5, 0] 
                        }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-7xl md:text-9xl font-black italic text-white drop-shadow-[0_0_50px_rgba(34,211,238,0.8)] text-center px-4"
                    >
                        ⚡LEVEL UP {stats.current.lvl}⚡
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {isPaused && (
            <div className="absolute inset-0 z-[150] flex items-center justify-center backdrop-blur-md bg-slate-950/60 font-mono">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`bg-slate-900/90 border-x-4 border-cyan-500/50 p-4 rounded-xl shadow-[0_0_50px_rgba(0,255,255,0.2)] flex flex-col gap-2 text-center w-[90vw] transition-all duration-300 relative overflow-hidden ${
                        showOptions === 'slots' ? 'max-w-[750px]' : 'max-w-[300px]'
                    }`}
                >
                    <button 
                        onClick={() => { pauseRef.current = false; setIsPaused(false); }}
                        className="absolute top-1/2 -translate-y-1/2 right-1 p-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-white transition-all z-10"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/30 overflow-hidden">
                        <div className="h-full w-20 bg-cyan-400 animate-shine" />
                    </div>

                    {showOptions === true ? (
                        <>
                            <h2 className="text-lg text-white font-black italic tracking-widest mb-2 flex items-center justify-center gap-2">
                                <Settings className="w-5 h-5 text-cyan-400" />
                                {settingsRef.current.language === 'it' ? 'SISTEMA' : 'SYSTEM'}
                            </h2>
                            <div className="flex flex-col gap-1">
                                <div className="grid grid-cols-3 gap-1">
                                    <button
                                        className="px-2 py-1.5 bg-slate-950/50 border border-slate-800 hover:border-cyan-500/50 text-cyan-400 hover:text-white rounded-md font-bold italic transition-all flex justify-center items-center text-xs"
                                        onClick={toggleLanguage}
                                    >
                                        {settingsRef.current.language === 'it' ? 'ITA' : 'ENG'}
                                    </button>
                                    <div className="px-2 py-1.5 bg-slate-950/50 border border-slate-800 rounded-md flex justify-between items-center text-xs">
                                        <span className="font-bold text-slate-400">AUDIO</span>
                                        <button 
                                            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${settingsRef.current.audio ? 'bg-cyan-500' : 'bg-slate-700'}`}
                                            onClick={toggleAudio}
                                        >
                                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${settingsRef.current.audio ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                                        </button>
                                    </div>
                                    <div className="px-2 py-1.5 bg-slate-950/50 border border-slate-800 rounded-md flex justify-between items-center text-xs">
                                        <span className="font-bold text-slate-400">FPS</span>
                                        <select 
                                            className="bg-transparent text-cyan-400 outline-none border-none font-black italic cursor-pointer text-right appearance-none"
                                            value={settingsRef.current.fps}
                                            onChange={(e) => { 
                                                settingsRef.current.fps = Number(e.target.value) as any; 
                                                setRenderTrigger(p => p + 1); 
                                            }}
                                        >
                                            <option value={30} className="bg-slate-900">30</option>
                                            <option value={60} className="bg-slate-900">60</option>
                                            <option value={90} className="bg-slate-900">90</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="px-2 py-1.5 bg-slate-950/50 border border-slate-800 rounded-md flex justify-between items-center text-xs">
                                    <span className="font-bold text-slate-400 uppercase">{settingsRef.current.language === 'it' ? 'Difficoltà' : 'Difficulty'}</span>
                                    <select 
                                        className="bg-transparent text-pink-400 outline-none border-none font-black italic cursor-pointer text-right appearance-none"
                                        value={settingsRef.current.difficulty || 3}
                                        onChange={(e) => { 
                                            settingsRef.current.difficulty = Number(e.target.value); 
                                            setRenderTrigger(p => p + 1); 
                                        }}
                                    >
                                        <option value={1} className="bg-slate-900">Novellino</option>
                                        <option value={2} className="bg-slate-900">Facile</option>
                                        <option value={3} className="bg-slate-900">Normale</option>
                                        <option value={4} className="bg-slate-900">Difficile</option>
                                        <option value={5} className="bg-slate-900">Esperto</option>
                                        <option value={6} className="bg-slate-900">Incubo</option>
                                        <option value={7} className="bg-slate-900">Inferno</option>
                                    </select>
                                </div>
                                <div className="px-2 py-1.5 bg-slate-950/50 border border-slate-800 rounded-md flex justify-between items-center text-xs">
                                    <span className="font-bold text-slate-400 uppercase">{settingsRef.current.language === 'it' ? 'Mostra FPS' : 'Show FPS'}</span>
                                    <button 
                                        className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${settingsRef.current.showFps ? 'bg-cyan-500' : 'bg-slate-700'}`}
                                        onClick={toggleShowFps}
                                    >
                                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${settingsRef.current.showFps ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                                    </button>
                                </div>
                                <div className="px-2 py-1.5 bg-slate-950/50 border border-slate-800 rounded-md flex justify-between items-center text-xs">
                                    <span className="font-bold text-slate-400 uppercase">SCANLINES</span>
                                    <button 
                                        className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${settingsRef.current.scanlines ? 'bg-pink-500' : 'bg-slate-700'}`}
                                        onClick={toggleScanlines}
                                    >
                                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${settingsRef.current.scanlines ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                                    </button>
                                </div>
                                 <button
                                    className="px-3 py-1 bg-red-950/40 border border-red-900/60 hover:border-red-500/50 text-red-400 hover:text-red-300 rounded-md font-bold transition-all flex items-center justify-center gap-2 text-xs"
                                    onClick={() => {
                                        stats.current.unlockedTrophies = [];
                                        localStorage.removeItem('unlocked_trophies');
                                        alert(settingsRef.current.language === 'it' ? 'Trofei resettati con successo!' : 'Trophies reset successfully!');
                                    }}
                                >
                                    <Trophy className="w-3.5 h-3.5 text-red-500" /> {settingsRef.current.language === 'it' ? 'AZZERA TROFEI' : 'RESET TROPHIES'}
                                </button>
                                <button
                                    className="px-3 py-1 bg-slate-950/50 border border-slate-800 hover:border-cyan-500/50 text-cyan-400 hover:text-cyan-300 rounded-md font-bold transition-all flex items-center justify-center gap-2 text-xs"
                                    onClick={() => setShowOptions('controls')}
                                >
                                    <Keyboard className="w-3 h-3" /> {settingsRef.current.language === 'it' ? 'MAPPATURA TASTI' : 'INTERFACE KEYS'}
                                </button>
                                <button
                                    className="px-3 py-1 bg-cyan-600/20 border border-cyan-500/50 hover:bg-cyan-600/40 text-cyan-400 hover:text-white rounded-md font-bold transition-all flex items-center justify-center gap-2 text-xs"
                                    onClick={() => setShowOptions(false)}
                                >
                                    {settingsRef.current.language === 'it' ? 'CONFERMA E ESCI' : 'CONFIRM AND EXIT'}
                                </button>
                            </div>
                            <button
                                className="px-6 py-2 mt-2 sm:mt-6 text-slate-500 hover:text-white font-black italic uppercase tracking-widest transition-all text-xs"
                                onClick={() => setShowOptions(false)}
                            >
                                {settingsRef.current.language === 'it' ? 'INDIETRO' : 'BACK'}
                            </button>
                        </>
                    ) : showOptions === 'controls' ? (
                        <div className="flex flex-col items-center">
                            <h2 className="text-3xl text-white font-black italic mb-8 uppercase flex items-center gap-3">
                                <Keyboard className="w-8 h-8 text-cyan-400" />
                                {settingsRef.current.language === 'it' ? 'CONTROLLI' : 'INPUT'}
                            </h2>
                            
                            <div className="flex w-full gap-2 mb-6">
                                <button 
                                    onClick={() => { settingsRef.current.controlMode = 'keyboard'; setRenderTrigger(p => p+1); }}
                                    className={`flex-1 py-3 font-black italic tracking-widest rounded-xl transition-all ${settingsRef.current.controlMode === 'keyboard' ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(8,145,178,0.5)]' : 'bg-slate-950 text-slate-600 border border-slate-800'}`}
                                >KB</button>
                                <button 
                                    onClick={() => { settingsRef.current.controlMode = 'gamepad'; setRenderTrigger(p => p+1); }}
                                    className={`flex-1 py-3 font-black italic tracking-widest rounded-xl transition-all ${settingsRef.current.controlMode === 'gamepad' ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(8,145,178,0.5)]' : 'bg-slate-950 text-slate-600 border border-slate-800'}`}
                                >PAD</button>
                            </div>

                            <div className="grid grid-cols-1 gap-2 mb-6 w-full custom-scrollbar max-h-[300px] overflow-y-auto pr-2">
                                {Object.entries(settingsRef.current.keys).map(([action, key]) => (
                                    <div key={action} className="flex justify-between items-center bg-slate-950/50 p-2 border border-slate-800/50 rounded-lg group hover:border-cyan-500/30 transition-all">
                                        <span className="capitalize text-[10px] font-black tracking-widest text-slate-500 group-hover:text-white underline decoration-slate-800 italic">{action}</span>
                                        <button 
                                            className="bg-slate-900 text-cyan-400 hover:text-white px-4 py-1 rounded font-bold min-w-[80px] border border-cyan-500/20"
                                            onClick={() => {
                                                const newKey = prompt(settingsRef.current.language === 'it' ? 'Premi un tasto...' : 'Press a key...');
                                                if (newKey) {
                                                    settingsRef.current.keys = { ...settingsRef.current.keys, [action]: newKey };
                                                    setRenderTrigger(p => p+1);
                                                }
                                            }}
                                        >{(key as string).toUpperCase()}</button>
                                    </div>
                                ))}
                            </div>

                            <button
                                className="px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black italic tracking-widest rounded-2xl w-full shadow-[0_0_20px_rgba(8,145,178,0.3)] transition-all"
                                onClick={() => setShowOptions(true)}
                            >
                                {settingsRef.current.language === 'it' ? 'AGGIORNA' : 'DEPLOY'}
                            </button>
                        </div>
                    ) : showOptions === 'slots' ? (
                        <div className="flex flex-col items-center w-full">
                            <h2 className="text-xl md:text-2xl text-white font-black italic mb-4 uppercase flex items-center justify-center gap-2 tracking-widest drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                                <Save className="w-5 h-5 text-cyan-400" />
                                {settingsRef.current.language === 'it' ? 'SALVATAGGI SLOT' : 'GAME SLOTS'}
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 w-full max-h-[300px] overflow-y-auto pr-1">
                                {Array.from({ length: 9 }, (_, i) => {
                                    const slotNum = i + 1;
                                    const slotKey = `neon_dungeon_slot_${slotNum}`;
                                    const raw = localStorage.getItem(slotKey);
                                    let slotData = null;
                                    if (raw) {
                                        try { slotData = JSON.parse(raw); } catch(e){}
                                    }

                                    return (
                                        <div 
                                            key={slotNum} 
                                            className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 ${
                                                slotData 
                                                    ? 'bg-slate-950/80 border-cyan-500/30 hover:border-cyan-500/60' 
                                                    : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                                            }`}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[9px] uppercase font-black tracking-widest text-cyan-400">
                                                    SLOT {slotNum}
                                                </span>
                                                {slotData && (
                                                    <span className="text-[8px] text-slate-500 font-bold truncate max-w-[125px]">
                                                        {new Date(slotData.timestamp).toLocaleDateString(settingsRef.current.language === 'it' ? 'it-IT' : 'en-US')}
                                                    </span>
                                                )}
                                            </div>

                                            {slotData ? (
                                                <div className="flex flex-col gap-1 text-[9px] text-slate-300 font-mono mb-2 bg-slate-900/60 p-1 rounded border border-slate-850">
                                                    <div className="flex justify-between text-[10px]">
                                                        <span className="text-pink-400 font-bold uppercase">{slotData.heroClass}</span>
                                                        <span className="text-yellow-400">LV {slotData.stats.lvl}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[8px] text-slate-400">
                                                        <span>DUNGEON L {slotData.stats.dungeonLevel}</span>
                                                        <span className="text-yellow-500 font-bold">{slotData.stats.gold} G</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center text-[9px] text-slate-600 font-bold italic uppercase my-3 py-1">
                                                    --- {settingsRef.current.language === 'it' ? 'VUOTO' : 'EMPTY'} ---
                                                </div>
                                            )}

                                            <div className="flex gap-1 mt-auto">
                                                <button
                                                    onClick={() => {
                                                        const confirmSave = slotData ? confirm(settingsRef.current.language === 'it' ? `Vuoi sovrascrivere lo Slot ${slotNum}?` : `Overwrite Slot ${slotNum}?`) : true;
                                                        if (confirmSave) {
                                                            const saveData = {
                                                                stats: stats.current,
                                                                heroClass: heroClass,
                                                                settings: {
                                                                    ...settingsRef.current,
                                                                    seed: activeSeed.current,
                                                                    language: settingsRef.current.language,
                                                                    audio: settingsRef.current.audio,
                                                                    fps: settingsRef.current.fps,
                                                                    showFps: settingsRef.current.showFps,
                                                                    scanlines: settingsRef.current.scanlines,
                                                                    controlMode: settingsRef.current.controlMode,
                                                                    keys: settingsRef.current.keys
                                                                },
                                                                timestamp: Date.now()
                                                            };
                                                            localStorage.setItem(slotKey, JSON.stringify(saveData));
                                                            setRenderTrigger(p => p + 1);
                                                        }
                                                    }}
                                                    className="flex-1 py-1 px-1 bg-cyan-950/40 border border-cyan-800/50 hover:border-cyan-400 hover:bg-cyan-950/60 rounded text-[9px] font-bold text-cyan-400 transition-all text-center flex items-center justify-center gap-1"
                                                >
                                                    <Save className="w-2.5 h-2.5 animate-pulse" /> {settingsRef.current.language === 'it' ? 'SALVA' : 'SAVE'}
                                                </button>

                                                {slotData && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                if (confirm(settingsRef.current.language === 'it' ? 'Vuoi caricare questa partita? Perderai i progressi correnti non salvati!' : 'Load this game? Any unsaved progress will be lost!')) {
                                                                    if (onLoadSlot) {
                                                                        onLoadSlot(slotData);
                                                                    } else {
                                                                        localStorage.setItem('player_stats', JSON.stringify(slotData.stats));
                                                                        localStorage.setItem('player_hero_class', slotData.heroClass);
                                                                        localStorage.setItem('neonDungeonSettings', JSON.stringify(slotData.settings));
                                                                        window.location.reload();
                                                                    }
                                                                }
                                                            }}
                                                            className="flex-1 py-1 px-1 bg-pink-950/40 border border-pink-800/50 hover:border-pink-400 hover:bg-pink-950/60 rounded text-[9px] font-bold text-pink-400 transition-all text-center flex items-center justify-center"
                                                        >
                                                            {settingsRef.current.language === 'it' ? 'CARICA' : 'LOAD'}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (confirm(settingsRef.current.language === 'it' ? `Eliminare il salvataggio nello Slot ${slotNum}?` : `Delete save in Slot ${slotNum}?`)) {
                                                                    localStorage.removeItem(slotKey);
                                                                    setRenderTrigger(p => p + 1);
                                                                }
                                                            }}
                                                            className="p-1 text-slate-500 hover:text-red-500 border border-transparent hover:border-red-950 rounded transition-all flex items-center justify-center animate-bounce"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <button
                                className="px-6 py-2 mt-4 text-slate-500 hover:text-white font-black italic uppercase tracking-widest transition-all text-xs"
                                onClick={() => setShowOptions(false)}
                            >
                                {settingsRef.current.language === 'it' ? 'INDIETRO' : 'BACK'}
                            </button>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-5xl font-black italic text-white mb-2 tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] select-none uppercase">PAUSED</h2>
                            <div className="text-[10px] text-cyan-500 font-bold tracking-[0.3em] mb-10 opacity-70">
                                SEED: {activeSeed.current}
                            </div>
                            <button
                                className="px-12 py-5 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white rounded-2xl font-black italic tracking-[0.2em] shadow-[0_0_30px_rgba(8,145,178,0.3)] transition-all active:scale-95 group"
                                onClick={() => { pauseRef.current = false; setIsPaused(false); }}
                            >
                                <span className="flex items-center gap-3">
                                    RESUME LINK <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                </span>
                            </button>
                            <button
                                className="px-6 py-4 text-slate-500 hover:text-pink-400 font-black italic tracking-widest rounded-xl transition-all uppercase text-sm border border-slate-800/50 hover:bg-slate-950/50 flex justify-between items-center px-4"
                                onClick={() => {
                                    const nextVal = !autosaveEnabled;
                                    setAutosaveEnabled(nextVal);
                                    localStorage.setItem('autosave_enabled', String(nextVal));
                                }}
                            >
                                <span>{settingsRef.current.language === 'it' ? 'AUTOSALVATAGGIO' : 'AUTOSAVE'}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] ml-2 ${autosaveEnabled ? 'bg-cyan-500/20 text-cyan-400' : 'bg-red-500/20 text-red-500'}`}>
                                    {autosaveEnabled ? 'ON' : 'OFF'}
                                </span>
                            </button>
                            <button
                                className="px-6 py-4 text-slate-500 hover:text-cyan-450 font-black italic tracking-widest rounded-xl transition-all uppercase text-sm border border-slate-800/50 hover:bg-slate-950/50 flex justify-between items-center px-4"
                                onClick={() => setShowOptions('slots')}
                            >
                                <span>{settingsRef.current.language === 'it' ? 'SALVA GIOCO (SLOT)' : 'SAVE GAME (SLOT)'}</span>
                                <Save className="w-3.5 h-3.5 text-cyan-400" />
                            </button>
                            <button
                                className="px-6 py-4 text-slate-500 hover:text-white font-black italic tracking-widest rounded-xl transition-all uppercase text-sm border border-slate-800/50 hover:bg-slate-950/50"
                                onClick={() => setShowOptions(true)}
                            >
                                {settingsRef.current.language === 'it' ? 'Parametri Sistema' : 'System Parameters'}
                            </button>
                            <button
                                className="px-6 py-4 text-slate-500 hover:text-cyan-400 font-black italic tracking-widest rounded-xl transition-all uppercase text-sm border border-slate-800/50 hover:bg-slate-950/50"
                                onClick={() => setShowTrophies(true)}
                            >
                                {settingsRef.current.language === 'it' ? 'Trofei' : 'Trophies'}
                            </button>
                            <button
                                className="px-6 py-3 text-red-900 hover:text-red-500 font-black italic tracking-widest transition-all uppercase text-[10px]"
                                onClick={() => {
                                    localStorage.removeItem('player_stats');
                                    localStorage.removeItem('game_interrupted');
                                    window.location.reload();
                                }}
                            >
                                {settingsRef.current.language === 'it' ? 'Termina Sessione' : 'Abort Session'}
                            </button>
                        </>
                    )}
                </motion.div>
            </div>
        )}
        {slotMachineState && (
            <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center backdrop-blur-xl bg-slate-950/80 font-mono">
                <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900 border-x-4 border-yellow-500/50 p-10 rounded-3xl shadow-[0_0_80px_rgba(234,179,8,0.2)] flex flex-col items-center min-w-[500px] relative overflow-hidden"
                >
                    <button 
                        onClick={() => { setSlotMachineState(null); pauseRef.current = false; setIsPaused(false); }}
                        className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-white transition-all z-10"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500/50 overflow-hidden">
                        <div className="h-full w-40 bg-white animate-shine" />
                    </div>

                    <h2 className="text-5xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-600 to-yellow-300 font-black italic mb-12 uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(234,179,8,0.5)] animate-pulse">
                        {settingsRef.current.language === 'it' ? 'SCRIGNO LEGGENDARIO' : 'LEGENDARY CHEST'}
                    </h2>
                    
                    <div className="flex gap-6 mb-12">
                        {slotMachineState.resultItems.map((item, i) => {
                            const currentReelMode = slotMachineState.reelMode[i];
                            const finalItem = slotMachineState.finalItems[i];
                            
                            // Define a fixed list of icons for the reel
                            const reelIcons = [
                                { icon: '💎', type: 'gem' },
                                { icon: '⚔️', type: 'weapon' },
                                { icon: '💰', type: 'gold' },
                                { icon: '🧪', type: 'potion' },
                                { icon: '🔱', type: 'weapon' },
                                { icon: '💎', type: 'gem' },
                                { icon: '💰', type: 'gold' },
                                { icon: '💀', type: 'threat' }
                            ];

                            // Find the index of the icon that matches the final item type
                            const targetIdx = reelIcons.findIndex(r => r.type === finalItem?.type) || 0;
                            // Calculate a translateY that puts the target index at the center
                            // Each icon is 128px high (h-32 = 8rem = 128px)
                            const targetOffset = -(targetIdx * 128);

                            return (
                                <div key={i} className={`w-32 h-32 bg-slate-950 border-2 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 ${currentReelMode === 'stopped' ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'border-slate-800 scale-95 opacity-50 shadow-none'}`}>
                                    
                                    {/* The Reel Container - Always visible during spin/stop */}
                                    <motion.div 
                                        className="flex flex-col w-full absolute top-0"
                                        animate={{ 
                                            y: currentReelMode === 'spinning' 
                                                ? [0, -1024] // Infinite spin through double list
                                                : (currentReelMode === 'stopping' || currentReelMode === 'stopped' ? targetOffset : 0)
                                        }}
                                        transition={{ 
                                            y: currentReelMode === 'spinning' 
                                                ? { repeat: Infinity, duration: 0.3, ease: "linear" }
                                                : { duration: 1.5, ease: "circOut" }
                                        }}
                                    >
                                        {[...reelIcons, ...reelIcons].map((item, scrollIdx) => {
                                            const isTarget = (scrollIdx % reelIcons.length) === targetIdx;
                                            const shouldShowFinal = isTarget && currentReelMode !== 'spinning' && finalItem;
                                            
                                            // Determine specific icon for the final item
                                            let displayIcon = item.icon;
                                            if (shouldShowFinal) {
                                                if (finalItem.type === 'weapon') {
                                                    displayIcon = finalItem.rarity === 'mythic' ? (finalItem.id === 'castle_whip' ? '🦇' : (finalItem.id === 'bubble_gun' ? '🫧' : '🔱')) : (finalItem.rarity === 'legendary' ? '🔱' : '⚔️');
                                                } else if (finalItem.type === 'gem') displayIcon = '💎';
                                                else if (finalItem.type === 'gold') displayIcon = '💰';
                                            }

                                            return (
                                                <div key={scrollIdx} className="h-32 min-h-32 w-full flex-shrink-0 flex flex-col items-center justify-center text-5xl relative">
                                                    <span className={shouldShowFinal ? "drop-shadow-[0_0_10px_gold]" : ""}>
                                                        {displayIcon}
                                                    </span>
                                                    {shouldShowFinal && finalItem.name && (
                                                        <div className="absolute bottom-2 left-0 w-full text-center px-1">
                                                            <span className="text-[9px] font-black italic tracking-tighter uppercase leading-none block" style={{ color: finalItem.rarityColor || finalItem.color }}>
                                                                {finalItem.name}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </motion.div>
                                    
                                    {/* Reel Glow */}
                                    {currentReelMode === 'stopped' && (
                                        <div className="absolute inset-0 bg-yellow-400/5 animate-pulse" />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {slotMachineState.mode === 'spinning' || slotMachineState.mode === 'stopping' ? (
                        <button
                            id="slot-stop-btn"
                            className="group relative px-12 py-5 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-black rounded-2xl font-black italic text-2xl tracking-[0.2em] shadow-[0_0_40px_rgba(234,179,8,0.4)] transition-all active:scale-95"
                            onClick={() => {
                                if (slotMachineState.mode === 'spinning') {
                                    if (Date.now() - slotMachineState.appearTime < 1000) return;
                                    
                                    const epicWeapons = Object.values(WEAPONS).filter(w => w.rarity === 'epic').map(w => w.name);
                                    const legendaryWeapons = Object.values(WEAPONS).filter(w => w.rarity === 'legendary' || w.rarity === 'mythic').map(w => w.name);
                                    
                                    const items: Partial<LootItem>[] = [];
                                    for(let i=0; i<3; i++) {
                                        const rand = Math.random();
                                        if (rand < 0.25) {
                                            // Weapon Reward
                                            const subRand = Math.random();
                                            if (subRand < 0.2 && legendaryWeapons.length > 0) {
                                                const name = legendaryWeapons[Math.floor(Math.random() * legendaryWeapons.length)];
                                                items.push({ type: 'weapon', isMagic: false, rarityColor: '#ecc94b', rarity: 'legendary', name });
                                            } else if (subRand < 0.6 && epicWeapons.length > 0) {
                                                const name = epicWeapons[Math.floor(Math.random() * epicWeapons.length)];
                                                items.push({ type: 'weapon', isMagic: false, rarityColor: '#7c3aed', rarity: 'epic', name });
                                            } else {
                                                items.push({ type: 'weapon', isMagic: false, rarityColor: '#ecc94b', rarity: 'rare', name: 'Martello del Tuono' }); // fallback
                                            }
                                        }
                                        else if (rand < 0.6) items.push({ type: 'gem', color: '#ee82ee', value: 'Diamante Astrale' });
                                        else items.push({ type: 'gold', color: '#FFD700', value: 100 });
                                    }

                                    setSlotMachineState({ 
                                        ...slotMachineState, 
                                        mode: 'stopping',
                                        reelMode: ['stopping', 'spinning', 'spinning'],
                                        finalItems: items
                                    });

                                    slotTimeouts.current.forEach(t => clearTimeout(t));
                                    slotTimeouts.current = [];

                                    slotTimeouts.current.push(setTimeout(() => {
                                        setSlotMachineState(prev => (prev && prev.reelMode[0] === 'stopping') ? {
                                            ...prev, 
                                            reelMode: ['stopped', 'stopping', 'spinning']
                                        } : prev);
                                        audio.playSlotSpinSound();
                                    }, 1000));

                                    slotTimeouts.current.push(setTimeout(() => {
                                        setSlotMachineState(prev => (prev && prev.reelMode[1] === 'stopping') ? {
                                            ...prev, 
                                            reelMode: ['stopped', 'stopped', 'stopping']
                                        } : prev);
                                        audio.playSlotSpinSound();
                                    }, 2000));

                                    slotTimeouts.current.push(setTimeout(() => {
                                        setSlotMachineState(prev => (prev && prev.reelMode[2] === 'stopping') ? {
                                            ...prev, mode: 'results', reelMode: ['stopped', 'stopped', 'stopped']
                                        } : prev);
                                        audio.playSlotSpinSound();
                                        let trackId = stats.current.dungeonLevel % 2 === 1 ? 'sottofindomistero1' : 'sottofindomistero2';
                                        if (stats.current.dungeonLevel % 10 === 0 && stats.current.dungeonLevel > 0) {
                                            trackId = 'alienmusic';
                                        }
                                        audio.playBackgroundMusic(trackId);
                                    }, 3000));
                                } else {
                                    const nextReelIndex = slotMachineState.reelMode.findIndex(m => m === 'stopping');
                                    if (nextReelIndex !== -1) {
                                        const newReelMode = [...slotMachineState.reelMode] as typeof slotMachineState.reelMode;
                                        newReelMode[nextReelIndex] = 'stopped';
                                        
                                        if (nextReelIndex < 2) {
                                            newReelMode[nextReelIndex + 1] = 'stopping';
                                        }
                                        
                                        const isLast = nextReelIndex === 2;
                                        setSlotMachineState({
                                            ...slotMachineState,
                                            mode: isLast ? 'results' : 'stopping',
                                            reelMode: newReelMode
                                        });

                                        audio.playSlotSpinSound();
                                        if (isLast) {
                                            let trackId = stats.current.dungeonLevel % 2 === 1 ? 'sottofindomistero1' : 'sottofindomistero2';
                                            if (stats.current.dungeonLevel % 10 === 0 && stats.current.dungeonLevel > 0) {
                                                trackId = 'alienmusic';
                                            }
                                            audio.playBackgroundMusic(trackId);
                                        }
                                    }
                                }
                            }}
                        >
                            <span className="relative z-10 flex items-center gap-3">
                                {slotMachineState.mode === 'spinning' 
                                    ? (settingsRef.current.language === 'it' ? 'DECODIFICA! (A)' : 'DECODE! (A)')
                                    : (settingsRef.current.language === 'it' ? 'ORA!' : 'STRIKE!')}
                            </span>
                        </button>
                    ) : (
                        <button
                            id="slot-collect-btn"
                            className="px-16 py-5 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white rounded-2xl font-black italic text-2xl tracking-[0.3em] shadow-[0_0_40px_rgba(8,145,178,0.4)] transition-all active:scale-95"
                            onClick={() => {
                                const items = slotMachineState.finalItems;
                                const countMap: Record<string, number> = {};
                                items.forEach(item => {
                                    const key = `${item.type}_${item.name || item.value}`;
                                    countMap[key] = (countMap[key] || 0) + 1;
                                });
                                
                                const maxMatch = Math.max(...Object.values(countMap));

                                if (maxMatch === 2) {
                                     stats.current.exp += stats.current.nextExp * 0.5;
                                     loot.current.push({ x: slotMachineState.cx, y: slotMachineState.cy, z: 0, vz: -2, vx: 0, vy: 0, type: 'gem', value: 'XP 50%', color: '#00ff00', isIdentified: true, spawnTime: Date.now() / 1000 });
                                } else if (maxMatch === 3) {
                                     stats.current.exp += stats.current.nextExp * 2;
                                     for(let i=0; i<50; i++) {
                                        const angle = Math.random() * Math.PI * 2;
                                        const speed = 2 + Math.random() * 8;
                                        particles.current.push({
                                            x: slotMachineState.cx, y: slotMachineState.cy,
                                            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                                            life: 0, maxLife: 30 + Math.random() * 30, color: '#FFD700', size: 4
                                        });
                                     }
                                }

                                slotMachineState.finalItems.forEach((item) => {
                                    const angle = Math.random() * Math.PI * 2;
                                    const speed = 2 + Math.random() * 4;
                                    loot.current.push({
                                        x: slotMachineState.cx,
                                        y: slotMachineState.cy,
                                        z: -5 - Math.random() * 5,
                                        vz: -2 - Math.random() * 3,
                                        vx: Math.cos(angle) * speed,
                                        vy: Math.sin(angle) * speed,
                                        type: item.type as any,
                                        value: item.value || 1,
                                        color: item.color || '#ffffff',
                                        rarityColor: item.rarityColor,
                                        isMagic: item.isMagic,
                                        name: item.name,
                                        isIdentified: true,
                                        spawnTime: Date.now() / 1000,
                                    });
                                });
                                setSlotMachineState(null);
                                pauseRef.current = false;
                                setIsPaused(false);
                            }}
                        >
                            {settingsRef.current.language === 'it' ? 'INSTALLA' : 'INSTALL'}
                        </button>
                    )}
                </motion.div>
            </div>
        )}

        {showStats && (
            <div className="absolute inset-0 z-[300] flex flex-col items-center justify-center backdrop-blur-xl bg-slate-950/80 font-mono text-white p-10 relative">
                <button 
                  onClick={() => setShowStats(false)}
                  className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-white transition-all z-10"
                >
                    <X className="w-6 h-6" />
                </button>
                <h2 className="text-4xl font-black italic mb-6">STATISTICHE EROE</h2>
                <div className="grid grid-cols-2 gap-4 text-xl">
                    <div className="text-slate-400">HP:</div><div>{Math.floor(hudStats.hp)} / {hudStats.maxHp}</div>
                    <div className="text-slate-400">Forza:</div><div>{hudStats.strength}</div>
                    <div className="text-slate-400">Prob. Critico:</div><div>{Math.floor(hudStats.critChance * 100)}%</div>
                    <div className="text-slate-400">Kills:</div><div>{hudStats.kills}</div>
                    <div className="text-slate-400">Livello:</div><div>{hudStats.lvl}</div>
                    <div className="text-slate-400">Oro:</div><div>{hudStats.gold}</div>
                </div>
                <button className="mt-8 px-8 py-4 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-black italic tracking-widest uppercase transition-all" onClick={() => setShowStats(false)}>
                    {settingsRef.current.language === 'it' ? 'CHIUDI' : 'CLOSE'}
                </button>
            </div>
        )}
      <BestiaryUI 
        isOpen={showBestiary} 
        onClose={() => setShowBestiary(false)} 
        kills={hudStats.bestiaryKills || {}} 
        language={settings.language || 'it'}
      />
      <TrophiesUI 
        isOpen={showTrophies} 
        onClose={() => setShowTrophies(false)} 
        stats={hudStats} 
        unlockedTrophies={stats.current.unlockedTrophies || []} 
        language={settings.language || 'it'}
      />

      {/* Dynamic Boss Health Bar HUD */}
      <AnimatePresence>
          {activeBoss && (
              <motion.div
                  initial={{ opacity: 0, y: -45, x: '-50%', scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
                  exit={{ opacity: 0, y: -30, x: '-50%', scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="fixed top-[115px] lg:top-[80px] left-1/2 z-[1400] w-[90%] max-w-xl bg-slate-950/95 border border-red-500/50 rounded-xl p-4 shadow-[0_0_30px_rgba(239,68,68,0.35)] backdrop-blur-md flex flex-col gap-2"
              >
                  {/* Title & Warning Info */}
                  <div className="flex justify-between items-center px-1">
                      <div className="flex items-center gap-2">
                          <span className="text-red-500 text-xs sm:text-sm animate-ping">⚠️</span>
                          <span className="text-red-500 font-extrabold tracking-[0.2em] text-xs sm:text-sm drop-shadow-[0_0_8px_rgba(239,68,68,0.6)] uppercase">
                              {getBossName(activeBoss.type, settings.language || 'it')}
                          </span>
                      </div>
                      <span className="font-mono text-[9px] sm:text-xs font-black text-rose-500/80 tracking-widest uppercase animate-pulse">
                          {settings.language === 'it' ? 'BOSS ATTIVO' : 'BOSS ACTIVE'}
                      </span>
                  </div>

                  {/* Health Bar Track with Ghost Catch-up Effect */}
                  <div className="relative w-full h-3 sm:h-4 bg-slate-900/90 rounded-full border border-red-500/20 overflow-hidden shadow-inner">
                      {/* Orange/Yellow catch-up bar for delayed damage effect */}
                      <div 
                          className="absolute inset-y-0 left-0 bg-amber-500/40 rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${Math.max(0, Math.min(100, (activeBoss.hp / activeBoss.maxHp) * 100))}%` }}
                      />
                      {/* Active Red Health Fill with Neon Glow */}
                      <div 
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 via-rose-500 to-red-500 rounded-full transition-all duration-150 ease-out shadow-[0_0_15px_rgba(239,68,68,0.8)]"
                          style={{ width: `${Math.max(0, Math.min(100, (activeBoss.hp / activeBoss.maxHp) * 100))}%` }}
                      >
                          {/* Pulsative shiny gleam */}
                          <div className="absolute inset-x-0 top-0 h-[35%] bg-white/20 rounded-t-full" />
                      </div>
                  </div>

                  {/* HP Value Status Indicators */}
                  <div className="flex justify-between items-center px-1 font-mono text-[9px] sm:text-[10px] font-bold text-slate-400">
                      <span className="text-red-400/90 tracking-wider">
                          {(settings.language === 'it' ? 'VITA: ' : 'HP: ') + Math.max(0, Math.round(activeBoss.hp))} / {activeBoss.maxHp}
                      </span>
                      <span className="text-red-400 font-extrabold tracking-widest">
                          {Math.max(0, Math.round((activeBoss.hp / activeBoss.maxHp) * 100))}%
                      </span>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

      {settingsRef.current.scanlines && (
          <>
            <div className="fixed inset-0 pointer-events-none z-[1000] scanline-overlay opacity-60"></div>
            <div className="fixed inset-0 pointer-events-none z-[1001] scanline-animation opacity-30"></div>
          </>
      )}

      {/* Trophy Progress Overlay */}
      <div className="fixed top-24 right-4 z-[1500] flex flex-col gap-2 pointer-events-none">
          <AnimatePresence>
              {Object.keys(activeTrackers).map(id => {
                  const trophy = TROPHIES.find(t => t.id === id);
                  if (!trophy) return null;
                  const current = stats.current[trophy.statKey] || 0;
                  const target = trophy.targetValue;
                  const isUnlocked = stats.current.unlockedTrophies.includes(id);
                  if (isUnlocked) return null;

                  return (
                      <motion.div 
                          key={id}
                          initial={{ opacity: 0, x: 50, scale: 0.9 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: 20, scale: 0.9 }}
                          className="bg-slate-900/80 border border-cyan-500/30 rounded-lg p-2 flex items-center gap-3 backdrop-blur-sm shadow-xl min-w-[140px]"
                      >
                          <div className="text-xl shrink-0">{trophy.icon}</div>
                          <div className="flex flex-col min-w-0 flex-1">
                              <div className="text-[10px] font-black text-cyan-400 uppercase tracking-tighter truncate">
                                  {trophy.title[settings.language || 'it'] as any}
                              </div>
                              <div className="flex items-center gap-2">
                                  <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden">
                                      <div 
                                          className="h-full bg-cyan-500"
                                          style={{ width: `${Math.min(100, (current/target)*100)}%` }}
                                      />
                                  </div>
                                  <span className="text-[9px] font-bold text-slate-400 tabular-nums shrink-0">{current}/{target}</span>
                              </div>
                          </div>
                      </motion.div>
                  );
              })}
          </AnimatePresence>
      </div>
    </div>
  );
}
