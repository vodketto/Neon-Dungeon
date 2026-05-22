export interface Weapon {
    id: string;
    name: string;
    icon: string;
    type: 'sword' | 'wand' | 'boomerang' | 'hammer';
    angle: number; // in radians
    range: number;
    width: number;
    color: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
    cooldown: number;
    description: string;
    curve?: number;
    homing?: boolean;
    projectile_behavior?: string;
    stackable?: boolean;
    max_stacks?: number;
    special_behavior?: string;
    homingRange?: number;
    aoeRadius?: number;
    magnetic?: boolean;
    knockback?: number;
    lifesteal?: number;
    aimNearest?: boolean;
}

export const WEAPONS: Record<string, Weapon> = {
    'Martello Santificatore': {
        id: 'holy_hammer',
        name: 'Martello Santificatore',
        icon: '🔱',
        type: 'hammer',
        angle: Math.PI / 1.8, 
        range: 120,
        width: 1.6,
        color: '#fffacd',
        rarity: 'legendary',
        cooldown: 28,
        description: 'Martello Benedetto. Colpi che curano e generano scoppi di luce santificata.',
        aoeRadius: 2.5,
        knockback: 15,
        lifesteal: 2
    },
    'Spada del Destino': {
        id: 'sword_destiny',
        name: 'Spada del Destino',
        icon: '⚔️',
        type: 'sword',
        angle: Math.PI / 2.5, // ~72 degrees
        range: 110,
        width: 1.2,
        color: '#ffffff',
        rarity: 'legendary',
        cooldown: 22,
        description: 'La leggendaria spada dei re. Danni ad area e knockback brutale.',
        aoeRadius: 1.8,
        knockback: 12,
        lifesteal: 1
    },
    'Spada Base': {
        id: 'base_sword',
        name: 'Spada Base',
        icon: '🗡️',
        type: 'sword',
        angle: Math.PI / 3, // 60 degrees
        range: 40,
        width: 1.0,
        color: '#00ffff',
        rarity: 'common',
        cooldown: 15,
        description: 'Arma iniziale. Colpo frontale a cono stretto.'
    },
    'Bacchetta Base': {
        id: 'base_wand',
        name: 'Bacchetta Base',
        icon: '🪄',
        type: 'wand',
        angle: 0,
        range: 150,
        width: 0,
        color: '#ffffff',
        rarity: 'common',
        cooldown: 25,
        description: 'Bacchetta iniziale. Spara proiettili dritti.'
    },
    'Pistola': {
        id: 'pistol',
        name: 'Pistola',
        icon: '🔫',
        type: 'sword',
        angle: 0.1,
        range: 350,
        width: 0,
        color: '#aaaaaa',
        rarity: 'common',
        cooldown: 45,
        description: 'Arma a distanza. Spara una raffica di 3 colpi fisici.',
        special_behavior: 'burst'
    },
    'Bacchetta Sinuosa': {
        id: 'wand_curve',
        name: 'Bacchetta Sinuosa',
        icon: '🌀',
        type: 'wand',
        angle: 0,
        range: 200,
        width: 0,
        color: '#ff00ff',
        rarity: 'uncommon',
        cooldown: 20,
        description: 'Colpi curvi',
        curve: 0.2,
        projectile_behavior: 'I proiettili curvano gradualmente verso il nemico più vicino'
    },
    'Spirito Inseguitore': {
        id: 'wand_home',
        name: 'Spirito Inseguitore',
        icon: '👻',
        type: 'wand',
        angle: 0,
        range: 300,
        width: 0,
        color: '#00ccff',
        rarity: 'rare',
        cooldown: 25,
        description: 'Inseguono',
        homing: true,
        projectile_behavior: 'I proiettili inseguono attivamente il nemico più vicino con correzione di rotta aggressiva'
    },
    'Bacchetta Bastarda': {
        id: 'wand_bastard',
        name: 'Bacchetta Bastarda',
        icon: '🪄',
        type: 'wand',
        angle: 0,
        range: 400,
        width: 0,
        color: '#ffcc00',
        rarity: 'legendary',
        cooldown: 18,
        description: 'Bacchetta bastarda: i colpi inseguono i nemici entro 3 tiles.',
        homing: true,
        homingRange: 256,
        aoeRadius: 2,
        magnetic: true
    },
    'Boomerang': {
        id: 'boomerang',
        name: 'Boomerang',
        icon: '🪃',
        type: 'boomerang',
        angle: 0,
        range: 140,
        width: 0,
        color: '#00ff88',
        rarity: 'uncommon',
        cooldown: 20,
        description: 'Ritorna',
        stackable: true,
        max_stacks: 4,
        special_behavior: 'Due fasi: OUT (lanciato) e RETURN (ritorno)'
    },
    'Martello del Tuono': {
        id: 'thunder_hammer',
        name: 'Martello del Tuono',
        icon: '🔨',
        type: 'hammer',
        angle: Math.PI / 2, 
        range: 75,
        width: 1.5,
        color: '#FFD700',
        rarity: 'rare',
        cooldown: 40,
        description: 'Lento ma devastante. Crea un\'onda d\'urto all\'impatto.'
    },
    'Guanti del Vampiro': {
        id: 'vampire_gloves',
        name: 'Guanti del Vampiro',
        icon: '🐾',
        type: 'sword',
        angle: Math.PI / 4,
        range: 72, // Increased by 32 (1/2 tile)
        width: 1.0,
        color: '#ff0000',
        rarity: 'rare',
        cooldown: 12,
        description: 'Graffiano i nemici e drenano la loro linfa vitale per curare te.',
        special_behavior: 'vampiric'
    },
    'Daga del Vento': {
        id: 'wind_dagger',
        name: 'Daga del Vento',
        icon: '🗡️',
        type: 'sword',
        angle: Math.PI / 3,
        range: 45,
        width: 0.8,
        color: '#00ffcc',
        rarity: 'uncommon',
        cooldown: 8,
        description: 'Veloce come il vento. Consente attacchi rapidissimi.',
        knockback: 4
    },
    'Scettro del Gelo': {
        id: 'ice_scepter',
        name: 'Scettro del Gelo',
        icon: '❄️',
        type: 'wand',
        angle: 0,
        range: 220,
        width: 0,
        color: '#00ffff',
        rarity: 'rare',
        cooldown: 35,
        description: 'Congela i nemici sul colpo, immobilizzandoli brevemente.',
        special_behavior: 'freeze',
        aimNearest: true
    },
    'Lancia del Sole': {
        id: 'sun_spear',
        name: 'Lancia del Sole',
        icon: '🔱',
        type: 'sword',
        angle: Math.PI / 8,
        range: 160,
        width: 0.5,
        color: '#ffcc00',
        rarity: 'epic',
        cooldown: 25,
        description: 'Una lancia sacra. Portata eccezionale ma angolo stretto.',
        knockback: 10,
        aoeRadius: 0.5
    },
    'Arco d\'Ossidiana': {
        id: 'obsidian_bow',
        name: 'Arco d\'Ossidiana',
        icon: '🏹',
        type: 'wand',
        angle: 0,
        range: 450,
        width: 0,
        color: '#a85cf6', // Lighter purple for better visibility
        rarity: 'epic',
        cooldown: 18,
        description: 'Frecce d\'ossidiana instabili. Esplodono all\'impatto infliggendo ingenti danni ad area.',
        projectile_behavior: 'fast',
        special_behavior: 'obsidian_impact',
        aoeRadius: 3.0 // 3 tiles
    },
    'Lancia del Vuoto': {
        id: 'void_spear',
        name: 'Lancia del Vuoto',
        icon: '🌀',
        type: 'sword',
        angle: Math.PI / 12,
        range: 192, // 3 tiles is 192px (64*3)
        width: 0.4,
        color: '#8b5cf6',
        rarity: 'epic',
        cooldown: 18,
        description: 'Una lancia che squarcia il vuoto. Colpisce dritto davanti a te e alle tue spalle.',
        knockback: 15,
        special_behavior: 'thrust'
    },
    'Martello del Giudizio': {
        id: 'judgment_hammer',
        name: 'Martello del Giudizio',
        icon: '🔨',
        type: 'hammer',
        angle: Math.PI / 2,
        range: 80,
        width: 1.2,
        color: '#7c3aed',
        rarity: 'epic',
        cooldown: 40,
        description: 'Scatena piccoli fulmini ad ogni colpo massiccio.',
        knockback: 25,
        aoeRadius: 2.0,
        special_behavior: 'thunder'
    },
    'Bacchetta dell\'Eclissi': {
        id: 'eclipse_wand',
        name: 'Bacchetta dell\'Eclissi',
        icon: '🌑',
        type: 'wand',
        angle: 0,
        range: 350,
        width: 0,
        color: '#6d28d9',
        rarity: 'epic',
        cooldown: 10,
        description: 'Spara proiettili d\'ombra massicci e letali. Consumo mana ridotto.',
        projectile_behavior: 'homing',
        special_behavior: 'eclipse'
    },
    'Falce della Morte': {
        id: 'death_scythe',
        name: 'Falce della Morte',
        icon: '💀',
        type: 'sword',
        angle: Math.PI * 0.8,
        range: 90,
        width: 2.0,
        color: '#330033',
        rarity: 'legendary',
        cooldown: 45,
        description: 'Un arco di distruzione massivo. Ruba la vita a ogni vittima.',
        aoeRadius: 3.5,
        lifesteal: 5,
        knockback: 20
    },
    'Pistola Mitica': {
        id: 'mythic_pistol',
        name: 'Pistola Mitica',
        icon: '🔫',
        type: 'sword',
        angle: 0.1,
        range: 450,
        width: 0,
        color: '#00ffff',
        rarity: 'legendary',
        cooldown: 40,
        description: 'Arma mitica. Spara una raffica massiccia di colpi. Carica per un colpo a ricerca nemica.',
        special_behavior: 'mythic_burst'
    },
    'Pistola Laser': {
        id: 'pistol_laser',
        name: 'Pistola Laser',
        icon: '🔫',
        type: 'sword',
        angle: 0.05,
        range: 400,
        width: 0,
        color: '#ff0000',
        rarity: 'epic',
        cooldown: 30,
        description: 'Pistola avanzata. Spara raggio laser rapidi.',
        special_behavior: 'burst'
    },
    'Pistola della Verità': {
        id: 'pistol_truth',
        name: 'Pistola della Verità',
        icon: '🔫',
        type: 'sword',
        angle: 0.05,
        range: 600,
        width: 0,
        color: '#ffffff',
        rarity: 'legendary',
        cooldown: 35,
        description: 'Leggenda pura. Spara proiettili di luce che trapassano i nemici. Carica per un raggio epuratore.',
        special_behavior: 'truth_burst'
    },
    'Lancia dell\'Astrale': {
        id: 'astral_spear',
        name: 'Lancia dell\'Astrale',
        icon: '🔱',
        type: 'sword',
        angle: Math.PI / 16,
        range: 280,
        width: 0.3,
        color: '#00fbff',
        rarity: 'legendary',
        cooldown: 20,
        description: 'La lancia che trafigge le stelle. Colpo a lunghissima gittata. Carica per uno scatto astrale travolgente.',
        knockback: 18,
        special_behavior: 'astral_thrust'
    },
    'Frusta di Castello': {
        id: 'castle_whip',
        name: 'Frusta di Castello',
        icon: '⛓️',
        type: 'sword',
        angle: Math.PI / 8, // Narrower for a targeted strike
        range: 192, // 3 tiles (64 * 3)
        width: 1.0,
        color: '#ff4444',
        rarity: 'mythic',
        cooldown: 35,
        description: 'Antica frusta che arpiona il nemico più vicino trascinandolo verso l\'eroe.',
        knockback: -15, // Negative knockback to pull enemies
        special_behavior: 'harpoon_whip',
        aimNearest: true
    },
    'Spara-Bolle Mitica': {
        id: 'bubble_gun',
        name: 'Spara-Bolle Mitica',
        icon: '🫧',
        type: 'wand',
        angle: 0.2,
        range: 450,
        width: 0,
        color: '#00ccff',
        rarity: 'mythic',
        cooldown: 18,
        description: 'Direttamente dai sogni di un draghetto. Spara bolle magiche che intrappolano i nemici. Carica per una Bolla Gigante.',
        special_behavior: 'bubble_shot'
    },
    'Lancia-Bolle d\'Oro': {
        id: 'bubble_wand_gold',
        name: 'Lancia-Bolle d\'Oro',
        icon: '🪄',
        type: 'wand',
        angle: 0.15,
        range: 400,
        width: 0,
        color: '#ffd700',
        rarity: 'legendary',
        cooldown: 25,
        description: 'Una bacchetta dorata che evoca bolle luminose. Intrappola i nemici in sfere dorate.',
        special_behavior: 'bubble_shot'
    },
    'Boomerang di Giada': {
        id: 'jade_boomerang',
        name: 'Boomerang di Giada',
        icon: '🪃',
        type: 'boomerang',
        angle: 0.3,
        range: 350,
        width: 0,
        color: '#00ffaa',
        rarity: 'legendary',
        cooldown: 35,
        description: 'Un boomerang mistico intagliato nella giada. Ritorna sempre al proprietario colpendo tutto sul suo cammino.',
        special_behavior: 'boomerang'
    },
    'Bacchetta delle Stelle': {
        id: 'star_wand',
        name: 'Bacchetta delle Stelle',
        icon: '🌟',
        type: 'wand',
        angle: 0,
        range: 400,
        width: 0,
        color: '#ffffff',
        rarity: 'mythic',
        cooldown: 45,
        description: 'Spara da sola colpendo i nemici con stelle a ricerca.',
        special_behavior: 'auto_star',
        homing: true,
        homingRange: 400,
        magnetic: true
    },
    'Spada del Sole': {
        id: 'sword_sun',
        name: 'Spada del Sole',
        icon: '☀️',
        type: 'sword',
        angle: Math.PI * 2,
        range: 80,
        width: 1.5,
        color: '#ffcc00',
        rarity: 'mythic',
        cooldown: 40,
        description: 'Antica lama forgiata nel cuore di una stella. Scatena onde circolari di energia solare che crescono con il potere del portatore.',
        special_behavior: 'circle_sun'
    },
};
