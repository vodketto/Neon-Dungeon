export interface Relic {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: 'uncommon' | 'rare' | 'epic' | 'legendary';
    effect: (stats: any) => void;
}

export const RELICS: Relic[] = [
    {
        id: 'crit_scope',
        name: 'Precision Scope',
        description: 'Increases crit chance by 10%',
        icon: '🎯',
        rarity: 'rare',
        effect: (stats) => { stats.critChance += 0.1; }
    },
    {
        id: 'mana_battery',
        name: 'Ether Battery',
        description: 'Increases mana regeneration',
        icon: '🔋',
        rarity: 'epic',
        effect: (stats) => { stats.manaRegen += 0.5; }
    },
    {
        id: 'speed_boots',
        name: 'Fleet Foot',
        description: 'Increases movement speed',
        icon: '👟',
        rarity: 'uncommon',
        effect: (stats) => { stats.speedBonus += 0.2; }
    }
];
