import seedrandom from 'seedrandom';

/**
 * Procedural Dungeon Generator
 */

export type TileType = 0 | 1 | 2 | 3 | 4 | 6; // Wall, Floor, Corridor, BossFloor, SecretFloor, MerchantChest
export type DungeonGrid = TileType[][];

export interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
  isSecret?: boolean;
  isAmbush?: boolean;
  isMerchant?: boolean;
  isRevealed?: boolean;
  wallX?: number;
  wallY?: number;
  isStanza?: boolean;
  accessCount?: number;
  accessWidths?: number[];
}

export interface Torch {
  gridX: number;
  gridY: number;
  phase: number;
}

export interface Chest {
  gridX: number;
  gridY: number;
  hp: number;
  opened: boolean;
  isGuaranteedWeaponChest?: boolean;
  rarity?: 'common' | 'rare' | 'legendary';
  containsDiamond?: boolean;
}

export interface DungeonData {
  grid: DungeonGrid;
  rooms: Room[];
  torches: Torch[];
  chests: Chest[];
  bossRoomIdx: number;
  level: number;
  seed: string;
}

export function generateDungeon(widthLimit: number = 45, heightLimit: number = 40, level: number = 1, seed: string = Math.random().toString(36).substring(7)): DungeonData {
  let currentSeed = seed;
  let attempts = 0;
  while (attempts < 50) {
      const data = generateDungeonInternal(widthLimit, heightLimit, level, currentSeed);
      if (validateDungeon(data)) {
          data.seed = seed; // Keep original seed for logic consistency
          return data;
      }
      attempts++;
      currentSeed = seed + "_" + attempts;
  }
  return generateDungeonInternal(widthLimit, heightLimit, level, seed);
}

function validateDungeon(data: DungeonData): boolean {
    const { grid, rooms } = data;
    const height = grid.length;
    const width = grid[0].length;
    if (rooms.length === 0) return true;

    const visited = new Set<string>();
    const stack = [{x: rooms[0].cx, y: rooms[0].cy}];
    
    while (stack.length > 0) {
        const curr = stack.pop()!;
        const key = `${curr.x},${curr.y}`;
        if (visited.has(key)) continue;
        visited.add(key);
        
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const d of dirs) {
            const nx = curr.x + d[0];
            const ny = curr.y + d[1];
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                // Weak walls (2) are considered walkable for connectivity (to reach secret rooms)
                if (grid[ny][nx] !== 0 && !visited.has(`${nx},${ny}`)) {
                    stack.push({x: nx, y: ny});
                }
            }
        }
    }
    
    for (const r of rooms) {
        if (!visited.has(`${r.cx},${r.cy}`)) return false;
    }
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (grid[y][x] !== 0 && !visited.has(`${x},${y}`)) {
                return false;
            }
        }
    }
    return true;
}

function generateDungeonInternal(widthLimit: number = 45, heightLimit: number = 40, level: number = 1, seed: string = Math.random().toString(36).substring(7)): DungeonData {
  const rng = seedrandom(seed);
  
  // Scale size based on level (start small, grow to limit)
  const sizeFactor = Math.min(1.0, 0.8 + level * 0.02);
  const width = Math.max(45, Math.floor(widthLimit * sizeFactor));
  const height = Math.max(40, Math.floor(heightLimit * sizeFactor));

  // Initialize with walls (0)
  const grid: DungeonGrid = Array(height).fill(null).map(() => Array(width).fill(0));
  const rooms: Room[] = [];
  const torches: Torch[] = [];
  const chests: Chest[] = [];

  const placeRoom = (x: number, y: number, w: number, h: number) => {
    for (let i = y; i < y + h; i++) {
        for (let j = x; j < x + w; j++) {
        if (i >= 0 && i < height && j >= 0 && j < width) {
            grid[i][j] = 1; // Floor
        }
      }
    }
  };

  // 1. Central Hub
  const hubW = Math.floor(width * 0.3) + 2;
  const hubH = Math.floor(height * 0.3) + 2;
  const hubX = Math.floor(width/2 - hubW/2);
  const hubY = Math.floor(height/2 - hubH/2);
  placeRoom(hubX, hubY, hubW, hubH);
  const hubRoom = { x: hubX, y: hubY, w: hubW, h: hubH, cx: Math.floor(hubX + hubW/2), cy: Math.floor(hubY + hubH/2) };

  // Randomize Corner Selection
  const spawnCorner = Math.floor(rng() * 4); // 0: TL, 1: TR, 2: BL, 3: BR
  const bossCorner = 3 - spawnCorner; // Diagonally opposite

  // 2. Spawn Room (Hero) - External with 2-4 tiles tunnel
  const spawnW = 6;
  const spawnH = 6;
  const heroTunnelLen = Math.floor(rng() * 3) + 2; // 2 to 4
  
  let spawnX = 0, spawnY = 0;
  // Place spawn room near hub edge to maintain tunnel length, but towards the corner
  if (spawnCorner === 0) { // TL
    spawnX = hubX - heroTunnelLen - spawnW;
    spawnY = hubY - heroTunnelLen - spawnH;
  } else if (spawnCorner === 1) { // TR
    spawnX = hubX + hubW + heroTunnelLen;
    spawnY = hubY - heroTunnelLen - spawnH;
  } else if (spawnCorner === 2) { // BL
    spawnX = hubX - heroTunnelLen - spawnW;
    spawnY = hubY + hubH + heroTunnelLen;
  } else { // BR
    spawnX = hubX + hubW + heroTunnelLen;
    spawnY = hubY + hubH + heroTunnelLen;
  }

  // Bound check and ensure "esternality"
  spawnX = Math.max(2, Math.min(width - spawnW - 2, spawnX));
  spawnY = Math.max(2, Math.min(height - spawnH - 2, spawnY));

  placeRoom(spawnX, spawnY, spawnW, spawnH);
  rooms.push({ x: spawnX, y: spawnY, w: spawnW, h: spawnH, cx: Math.floor(spawnX + spawnW / 2), cy: Math.floor(spawnY + spawnH / 2) });

  // 3. Boss Room - External with 4-8 tiles tunnel, 3 wide
  const bossW = 10 + Math.min(6, Math.floor(level / 2));
  const bossH = 10 + Math.min(6, Math.floor(level / 2));
  const bossTunnelLen = Math.floor(rng() * 5) + 4; // 4 to 8
  
  let bossX = 0, bossY = 0;
  if (bossCorner === 0) { // TL
    bossX = hubX - bossTunnelLen - bossW;
    bossY = hubY - bossTunnelLen - bossH;
  } else if (bossCorner === 1) { // TR
    bossX = hubX + hubW + bossTunnelLen;
    bossY = hubY - bossTunnelLen - bossH;
  } else if (bossCorner === 2) { // BL
    bossX = hubX - bossTunnelLen - bossW;
    bossY = hubY + hubH + bossTunnelLen;
  } else { // BR
    bossX = hubX + hubW + bossTunnelLen;
    bossY = hubY + hubH + bossTunnelLen;
  }

  bossX = Math.max(2, Math.min(width - bossW - 2, bossX));
  bossY = Math.max(2, Math.min(height - bossH - 2, bossY));

  for (let iy = bossY; iy < bossY + bossH; iy++) {
    for (let ix = bossX; ix < bossX + bossW; ix++) {
      if (iy >= 0 && iy < height && ix >= 0 && ix < width) {
        grid[iy][ix] = 3; // Boss Floor
      }
    }
  }
  const bossRoomObj = { x: bossX, y: bossY, w: bossW, h: bossH, cx: Math.floor(bossX + bossW / 2), cy: Math.floor(bossY + bossH / 2) };
  // We'll push boss room later to be index rooms.length ?
  // Let's push it now and track index
  const bossRoomIdxInRooms = rooms.length;
  rooms.push(bossRoomObj);

  // 4. Other random rooms
  const numRooms = Math.floor(rng() * (4 + Math.floor(level/2))) + 4; 
  for (let i = 0; i < numRooms; i++) {
    const w = Math.floor(rng() * 5) + 4;
    const h = Math.floor(rng() * 5) + 4;
    let rx, ry;
    let attempts = 0;
    while(attempts < 20) {
        rx = Math.floor(rng() * (width - w - 4)) + 2;
        ry = Math.floor(rng() * (height - h - 4)) + 2;
        // Distance check from existing special rooms
        let overlap = false;
        for (const existing of rooms) {
            if (rx < existing.x + existing.w + 2 && 
                rx + w + 2 > existing.x &&
                ry < existing.y + existing.h + 2 &&
                ry + h + 2 > existing.y) overlap = true;
        }
        if (!overlap) break;
        attempts++;
    }
    if (rx !== undefined && ry !== undefined) {
        placeRoom(rx, ry, w, h);
        rooms.push({ x: rx, y: ry, w: w, h: h, cx: Math.floor(rx + w / 2), cy: Math.floor(ry + h / 2) });
    }
  }

  const connectToHub = (r: Room, isBoss: boolean = false) => {
    let cx = r.cx;
    let cy = r.cy;
    
    // Find closest hub point to make it more "tunnel-like"
    let targetX = hubRoom.cx;
    let targetY = hubRoom.cy;

    if (cx < hubRoom.x) targetX = hubRoom.x;
    else if (cx > hubRoom.x + hubRoom.w - 1) targetX = hubRoom.x + hubRoom.w - 1;
    else targetX = cx;

    if (cy < hubRoom.y) targetY = hubRoom.y;
    else if (cy > hubRoom.y + hubRoom.h - 1) targetY = hubRoom.y + hubRoom.h - 1;
    else targetY = cy;

    // Horizontally
    while (cx !== targetX) {
      grid[cy][cx] = grid[cy][cx] === 0 ? 1 : grid[cy][cx];
      if (isBoss) {
          if (cy + 1 < height) grid[cy+1][cx] = grid[cy+1][cx] === 0 ? 1 : grid[cy+1][cx];
          if (cy - 1 >= 0) grid[cy-1][cx] = grid[cy-1][cx] === 0 ? 1 : grid[cy-1][cx];
      }
      cx += cx < targetX ? 1 : -1;
    }
    // Vertically
    while (cy !== targetY) {
      grid[cy][cx] = grid[cy][cx] === 0 ? 1 : grid[cy][cx];
      if (isBoss) {
          if (cx + 1 < width) grid[cy][cx+1] = grid[cy][cx+1] === 0 ? 1 : grid[cy][cx+1];
          if (cx - 1 >= 0) grid[cy][cx-1] = grid[cy][cx-1] === 0 ? 1 : grid[cy][cx-1];
      }
      cy += cy < targetY ? 1 : -1;
    }
  };

  rooms.forEach((r, idx) => {
      connectToHub(r, idx === bossRoomIdxInRooms);
  });

  // Export correct boss room index
  const bossRoomIdx = bossRoomIdxInRooms;

  // Generate Secret Rooms
  const numSecrets = Math.floor(rng() * 2) + Math.min(3, 1 + Math.floor(level/5)); 
  const floorTiles: {x: number, y: number}[] = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (grid[y][x] > 0) floorTiles.push({ x, y });
    }
  }

  for (let i = 0; i < numSecrets; i++) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 80) {
        attempts++;
        const baseTile = floorTiles[Math.floor(rng() * floorTiles.length)];
        const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]]; // N, S, W, E
        const dir = dirs[Math.floor(rng() * dirs.length)];
        
        const wallX = baseTile.x + dir[0];
        const wallY = baseTile.y + dir[1];
        
        // Wall tile must be wall (0)
        if (wallY < 1 || wallY >= height - 1 || wallX < 1 || wallX >= width - 1 || grid[wallY][wallX] !== 0) continue;

        // Randomize Secret Room Type and Size
        const roomRoll = rng();
        const isAmbush = roomRoll < 0.6; // 60%
        const isMerchant = roomRoll >= 0.6 && roomRoll < 0.7; // 10%
        // Remaining 30% are treasure rooms
        let sw: number, sh: number;
        
        if (isAmbush) {
            // Ambush room: min 3x4 to max 8x6
            sw = Math.floor(rng() * 6) + 3; // 3 to 8
            sh = Math.floor(rng() * 3) + 4; // 4 to 6
        } else if (isMerchant) {
            // Merchant room: special size
            sw = 4;
            sh = 4;
        } else {
            // Treasure room: min 2x2 to max 3x4
            sw = Math.floor(rng() * 2) + 2; // 2 or 3
            sh = Math.floor(rng() * 3) + 2; // 2, 3, or 4
        }

        // Start room exactly 1 tile after the wall tile
        let sx: number, sy: number;
        if (dir[0] !== 0) { // West or East
            sx = wallX + dir[0];
            if (dir[0] === -1) sx = wallX - sw;
            sy = wallY - Math.floor(sh / 2);
        } else { // North or South
            sy = wallY + dir[1];
            if (dir[1] === -1) sy = wallY - sh;
            sx = wallX - Math.floor(sw / 2);
        }

        let canPlace = true;
        if (sx <= 1 || sx >= width - sw - 1 || sy <= 1 || sy >= height - sh - 1) {
            canPlace = false;
        } else {
            for (let iy = sy - 1; iy <= sy + sh; iy++) {
                for (let ix = sx - 1; ix <= sx + sw; ix++) {
                    if (grid[iy][ix] !== 0) {
                        canPlace = false;
                        break;
                    }
                }
                if (!canPlace) break;
            }
        }

    if (canPlace) {
        // Mark as secret floor
        for (let iy = sy; iy < sy + sh; iy++) {
            for (let ix = sx; ix < sx + sw; ix++) {
                grid[iy][ix] = 4; // Secret Floor
            }
        }
        rooms.push({ x: sx, y: sy, w: sw, h: sh, cx: Math.floor(sx + sw/2), cy: Math.floor(sy + sh/2), isSecret: true, isAmbush, isMerchant, wallX, wallY });
        
        grid[wallY][wallX] = 2; // Secret weak wall
        
        // Place chest/merchant in merchant room
        if (isMerchant) {
             const cx = Math.floor(sx + sw/2);
             const cy = Math.floor(sy + sh/2);
             grid[cy][cx] = 6; // Merchant chest tile (assuming 6 is a special chest for merchant)
        }
        // Add treasure! Ambush rooms have less treasure than pure treasure rooms
        const chestChance = isAmbush ? 0.3 : 0.6;
        for (let iy = sy; iy < sy + sh; iy++) {
            for (let ix = sx; ix < sx + sw; ix++) {
                const rand = rng();
                if (rand < chestChance) {
                    // Chance of a chest in each tile
                    const rarityRand = rng();
                    let rarity: 'common' | 'rare' | 'legendary' = 'common';
                    let hp = 10;
                    
                    if (isAmbush) {
                        if (rarityRand < 0.1) { rarity = 'legendary'; hp = 30; }
                        else if (rarityRand < 0.4) { rarity = 'rare'; hp = 20; }
                    } else {
                        if (rarityRand < 0.3) { rarity = 'legendary'; hp = 30; }
                        else if (rarityRand < 0.7) { rarity = 'rare'; hp = 20; }
                    }
                    
                    chests.push({ 
                        gridX: ix, 
                        gridY: iy, 
                        hp, 
                        opened: false, 
                        rarity,
                        containsDiamond: rng() < (isAmbush ? 0.05 : 0.2) 
                    });
                }
            }
        }
            
            placed = true;
        }
    }
  }

  // Populate torches on inner walls
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
       if (grid[y][x] === 0) { // Wall
           let isInternal = false;
           // Check adjacent flooring (room or corridor)
           if (y > 0 && grid[y-1][x] !== 0) isInternal = true;
           if (y < height - 1 && grid[y+1][x] !== 0) isInternal = true;
           if (x > 0 && grid[y][x-1] !== 0) isInternal = true;
           if (x < width - 1 && grid[y][x+1] !== 0) isInternal = true;

           if (isInternal) {
               if (rng() < 0.15) {
                   torches.push({ gridX: x, gridY: y, phase: rng() * Math.PI * 2 });
               }
           }
       }
    }
  }

  // Place chests
  for (let i = 0; i < rooms.length; i++) {
    const room = rooms[i];
    const isHeroRoom = (i === 0);
    
    let shouldPlaceChest = false;
    let rarity: 'common' | 'rare' | 'legendary' = 'common';
    let hp = 10;

    if (isHeroRoom) {
        if (level === 1) {
            // Level 1: Always a chest, 20% legendary
            shouldPlaceChest = true;
            if (rng() < 0.2) {
                rarity = 'legendary';
                hp = 30;
            }
        } else {
            // Level > 1: 10% chance of legendary chest
            if (rng() < 0.1) {
                shouldPlaceChest = true;
                rarity = 'legendary';
                hp = 30;
            }
        }
    } else if (rng() < 0.6) {
        // Normal room chance
        shouldPlaceChest = true;
    }

    if (shouldPlaceChest) {
        // Place chest randomly inside the room (not on walls)
        const cx = room.x + 1 + Math.floor(rng() * (room.w - 2));
        const cy = room.y + 1 + Math.floor(rng() * (room.h - 2));
        chests.push({ gridX: cx, gridY: cy, hp, opened: false, rarity });
    }
  }

  if (chests.length > 0) {
      chests[Math.floor(rng() * chests.length)].isGuaranteedWeaponChest = true;
  }

  // 5. Perfect Room Recognition Algorithm (detectStanze)
  // By room ("stanza"), we mean an area of at least 4x2 or 2x4 tiles with exactly 1 entrance of width 1 or 2.
  rooms.forEach((room) => {
    // Check size: at least 4x2 tiles or more
    const sizeOk = (room.w >= 4 && room.h >= 2) || (room.w >= 2 && room.h >= 4);

    const borderTiles: { x: number; y: number }[] = [];

    // Top border
    for (let tx = room.x; tx < room.x + room.w; tx++) {
      const ty = room.y - 1;
      if (ty >= 0 && ty < height && tx >= 0 && tx < width) {
        if (grid[ty][tx] > 0) {
          borderTiles.push({ x: tx, y: ty });
        }
      }
    }
    // Bottom border
    for (let tx = room.x; tx < room.x + room.w; tx++) {
      const ty = room.y + room.h;
      if (ty >= 0 && ty < height && tx >= 0 && tx < width) {
        if (grid[ty][tx] > 0) {
          borderTiles.push({ x: tx, y: ty });
        }
      }
    }
    // Left border
    for (let ty = room.y; ty < room.y + room.h; ty++) {
      const tx = room.x - 1;
      if (ty >= 0 && ty < height && tx >= 0 && tx < width) {
        if (grid[ty][tx] > 0) {
          borderTiles.push({ x: tx, y: ty });
        }
      }
    }
    // Right border
    for (let ty = room.y; ty < room.y + room.h; ty++) {
      const tx = room.x + room.w;
      if (ty >= 0 && ty < height && tx >= 0 && tx < width) {
        if (grid[ty][tx] > 0) {
          borderTiles.push({ x: tx, y: ty });
        }
      }
    }

    // Group border floor/corridor/secret tiles into Chebyshev-connected components
    const visited = new Set<string>();
    const components: { x: number; y: number }[][] = [];

    borderTiles.forEach((tile) => {
      const tileKey = `${tile.x},${tile.y}`;
      if (visited.has(tileKey)) return;

      const comp: { x: number; y: number }[] = [];
      const queue = [tile];
      visited.add(tileKey);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        comp.push(curr);

        borderTiles.forEach((other) => {
          const otherKey = `${other.x},${other.y}`;
          if (visited.has(otherKey)) return;

          const dx = Math.abs(curr.x - other.x);
          const dy = Math.abs(curr.y - other.y);
          if (dx <= 1 && dy <= 1) {
            visited.add(otherKey);
            queue.push(other);
          }
        });
      }
      components.push(comp);
    });

    const accessCount = components.length;
    const accessWidths = components.map(comp => comp.length);

    // Filter: "stanza" must have exactly 1 entrance of width 1 or 2 tiles
    const hasUniqueAccessOfSize1Or2 = accessCount === 1 && (accessWidths[0] === 1 || accessWidths[0] === 2);

    room.isStanza = sizeOk && hasUniqueAccessOfSize1Or2;
    room.accessCount = accessCount;
    room.accessWidths = accessWidths;
  });

  return { grid, rooms, torches, chests, bossRoomIdx, level, seed };
}
