export interface Consumable {
    id: string;
    type: 'potion_hp' | 'potion_mp' | 'potion_xp' | 'potion_speed' | 'potion_str' | 'potion_crit';
    value: number;
    color: string;
    dropWeight: number; // For random tables
}

export interface Valuables {
    id: string;
    type: 'gem' | 'crystal' | 'diamond' | 'gold';
    name: string;
    value: number;
    color: string;
    rarityColor: string;
    dropWeight: number;
}

export const GEMS: Valuables[] = [
    { id: 'gem_ruby', type: 'gem', name: 'Rubino Supremo', value: 500, color: '#ee82ee', rarityColor: '#ee82ee', dropWeight: 10 },
    { id: 'gem_sapphire', type: 'gem', name: 'Zaffiro Antico', value: 500, color: '#ee82ee', rarityColor: '#ee82ee', dropWeight: 10 },
    { id: 'gem_emerald', type: 'gem', name: 'Smeraldo Puro', value: 500, color: '#ee82ee', rarityColor: '#ee82ee', dropWeight: 10 },
    { id: 'gem_diamond_astral', type: 'gem', name: 'Diamante Astrale', value: 2000, color: '#ffffff', rarityColor: '#00ffff', dropWeight: 2 },
    { id: 'gem_black', type: 'gem', name: 'Cristallo Nero', value: 1000, color: '#222222', rarityColor: '#666666', dropWeight: 5 },
];

export const POTIONS: Consumable[] = [
    { id: 'pot_hp', type: 'potion_hp', value: 40, color: '#ff3366', dropWeight: 30 },
    { id: 'pot_mp', type: 'potion_mp', value: 30, color: '#00ffff', dropWeight: 30 },
    { id: 'pot_xp', type: 'potion_xp', value: 10, color: '#00ff88', dropWeight: 25 },
    { id: 'pot_speed', type: 'potion_speed', value: 1.5, color: '#ffff00', dropWeight: 10 },
    { id: 'pot_str', type: 'potion_str', value: 2, color: '#ff8800', dropWeight: 8 },
    { id: 'pot_crit', type: 'potion_crit', value: 0.05, color: '#ffcc00', dropWeight: 5 },
];
