
export interface Trophy {
    id: string;
    title: { it: string; en: string };
    description: { it: string; en: string };
    category: 'combat' | 'exploration' | 'loot' | 'survival' | 'speedrun';
    targetValue: number;
    statKey: string;
    reward: { it: string; en: string };
    icon: string;
}

export const TROPHIES: Trophy[] = [
    {
        id: 'rat_slayer',
        title: { it: 'Sterminatore di Ratti Laser', en: 'Laser Rat Exterminator' },
        description: { it: 'Uccidi 50 ratti neon', en: 'Kill 50 neon rats' },
        category: 'combat',
        targetValue: 50,
        statKey: 'ratsKilled',
        reward: { it: 'Lama Neon', en: 'Neon Blade' },
        icon: '⚔️'
    },
    {
        id: 'loot_goblin',
        title: { it: 'Supremo Goblin del Bottino', en: 'Loot Goblin Supreme' },
        description: { it: 'Raccogli 100 oggetti', en: 'Collect 100 items' },
        category: 'loot',
        targetValue: 100,
        statKey: 'itemsCollected',
        reward: { it: 'Forziere Bonus', en: 'Bonus Chest' },
        icon: '💰'
    },
    {
        id: 'photon_ninja',
        title: { it: 'Ninja del Fotone', en: 'Photon Ninja' },
        description: { it: 'Sconfiggi 20 nemici senza colpi subiti', en: 'Defeat 20 enemies without taking hits' },
        category: 'survival',
        targetValue: 20,
        statKey: 'noHitStreak',
        reward: { it: 'Skin Furtiva', en: 'Stealth Skin' },
        icon: '🥷'
    },
    {
        id: 'luminous_runner',
        title: { it: 'Corridore Luminoso', en: 'Luminous Runner' },
        description: { it: 'Completa dungeon < 5 min', en: 'Complete dungeon in < 5 min' },
        category: 'speedrun',
        targetValue: 1, // Logic handled specially (check time on portal)
        statKey: 'fastDungeonClears',
        reward: { it: 'Stivali Velocità', en: 'Speed Boots' },
        icon: '⚡'
    },
    {
        id: 'neon_archivist',
        title: { it: 'Archivista del Neon', en: 'Neon Archivist' },
        description: { it: 'Scopri 10 stanze segrete', en: 'Discover 10 secret rooms' },
        category: 'exploration',
        targetValue: 10,
        statKey: 'secretRoomsFound',
        reward: { it: 'Pergamena Lore', en: 'Lore Scroll' },
        icon: '📜'
    },
    {
        id: 'circuit_breaker',
        title: { it: 'Interruttore di Circuiti', en: 'Circuit Breaker' },
        description: { it: 'Sconfiggi boss con arma elettrica', en: 'Defeat boss with electric weapon' },
        category: 'combat',
        targetValue: 1,
        statKey: 'electricBossKills',
        reward: { it: 'Aura Shock', en: 'Shock Aura' },
        icon: '🔋'
    },
    {
        id: 'pixel_survivor',
        title: { it: 'Sopravvissuto Pixel', en: 'Pixel Survivor' },
        description: { it: 'Sopravvivi 10 ondate/stanze', en: 'Survive 10 waves/rooms' },
        category: 'survival',
        targetValue: 10,
        statKey: 'roomsCleared',
        reward: { it: 'Vita Extra', en: 'Extra Life' },
        icon: '❤️'
    },
    {
        id: 'synthwave_slayer',
        title: { it: 'Ammazzasynthwave', en: 'Synthwave Slayer' },
        description: { it: 'Uccidi 200 nemici', en: 'Kill 200 enemies' },
        category: 'combat',
        targetValue: 200,
        statKey: 'kills',
        reward: { it: 'Colonna Sonora Neon', en: 'Neon Soundtrack' },
        icon: '🎹'
    },
    {
        id: 'cyber_collector',
        title: { it: 'Collezionista Cyber', en: 'Cyber Collector' },
        description: { it: 'Ottieni 50 drop rari', en: 'Get 50 rare drops' },
        category: 'loot',
        targetValue: 50,
        statKey: 'rareDropsCollected',
        reward: { it: 'Zaino Luminoso', en: 'Glowing Backpack' },
        icon: '🎒'
    },
    {
        id: 'dungeon_dj',
        title: { it: 'DJ del Dungeon', en: 'Dungeon DJ' },
        description: { it: 'Attiva 3 jukebox (Punti Ristoro)', en: 'Activate 3 jukeboxes' },
        category: 'exploration',
        targetValue: 3,
        statKey: 'jukeboxesUsed',
        reward: { it: 'Skin Musicale', en: 'Musical Skin' },
        icon: '📻'
    },
    {
        id: 'weapon_master',
        title: { it: 'Maestro d\'Armi', en: 'Weapon Master' },
        description: { it: 'Raccogli 25 armi', en: 'Collect 25 weapons' },
        category: 'loot',
        targetValue: 25,
        statKey: 'weaponsCollected',
        reward: { it: 'Lama Suprema', en: 'Supreme Blade' },
        icon: '🗡️'
    },
    {
        id: 'upgrade_me',
        title: { it: 'Potenziami', en: 'Upgrade Me' },
        description: { it: 'Fai salire di livello le armi 10 volte', en: 'Level up weapons 10 times' },
        category: 'loot',
        targetValue: 10,
        statKey: 'weaponsUpgraded',
        reward: { it: 'Super Carica', en: 'Super Charge' },
        icon: '⚡'
    }
];
