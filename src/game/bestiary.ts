export interface BestiaryEntry {
    id: string;
    description: {
        it: string;
        en: string;
    };
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export const BESTIARY_DATA: Record<string, BestiaryEntry> = {
    warrior: {
        id: 'warrior',
        description: {
            it: 'Un soldato corazzato che attacca da vicino con una spada.',
            en: 'An armored soldier who attacks up close with a sword.'
        },
        rarity: 'common'
    },
    archer: {
        id: 'archer',
        description: {
            it: 'Un arciere agile che scaglia frecce da lontano.',
            en: 'An agile archer who shoots arrows from afar.'
        },
        rarity: 'common'
    },
    mage: {
        id: 'mage',
        description: {
            it: 'Un incantatore che lancia dardi magici a ricerca.',
            en: 'A spellcaster who launches homing magic bolts.'
        },
        rarity: 'uncommon'
    },
    skeleton: {
        id: 'skeleton',
        description: {
            it: 'Resti rianimati che brandiscono vecchie lame.',
            en: 'Reanimated remains wielding old blades.'
        },
        rarity: 'common'
    },
    specter: {
        id: 'specter',
        description: {
            it: 'Uno spirito etereo che attraversa i muri.',
            en: 'An ethereal spirit that passes through walls.'
        },
        rarity: 'uncommon'
    },
    vampire: {
        id: 'vampire',
        description: {
            it: 'Una creatura della notte che ruba la vita con il suo tocco.',
            en: 'A creature of the night that steals life with its touch.'
        },
        rarity: 'rare'
    },
    charger: {
        id: 'charger',
        description: {
            it: 'Un nemico pesante che carica il giocatore a grande velocità.',
            en: 'A heavy enemy that charges the player at high speed.'
        },
        rarity: 'uncommon'
    },
    teleporter: {
        id: 'teleporter',
        description: {
            it: 'Uno strano essere in grado di abbattere le distanze istantaneamente.',
            en: 'A strange being capable of closing distances instantly.'
        },
        rarity: 'rare'
    },
    shield_bearer: {
        id: 'shield_bearer',
        description: {
            it: 'Un guerriero difensivo con un grande scudo che blocca i colpi frontali.',
            en: 'A defensive warrior with a large shield that blocks frontal attacks.'
        },
        rarity: 'uncommon'
    },
    bomber: {
        id: 'bomber',
        description: {
            it: 'Pazzoide instabile che esplode quando si avvicina troppo.',
            en: 'Unstable maniac who explodes when getting too close.'
        },
        rarity: 'common'
    },
    necromancer: {
        id: 'necromancer',
        description: {
            it: 'Un potente mago che evoca scheletri dai caduti.',
            en: 'A powerful mage who summons skeletons from the fallen.'
        },
        rarity: 'epic'
    },
    nest: {
        id: 'nest',
        description: {
            it: 'Un ammasso organico che genera costantemente nuovi nemici.',
            en: 'An organic mass that constantly generates new enemies.'
        },
        rarity: 'uncommon'
    },
    miniboss: {
        id: 'miniboss',
        description: {
            it: 'Un nemico d\'elite più forte e resistente dei comuni soldati.',
            en: 'An elite enemy stronger and tougher than common soldiers.'
        },
        rarity: 'rare'
    },
    boss: {
        id: 'boss',
        description: {
            it: 'Il primo custode del dungeon, una versione potenziata di un guerriero elite.',
            en: 'The first guardian of the dungeon, an upgraded version of an elite warrior.'
        },
        rarity: 'epic'
    },
    slimmy: {
        id: 'slimmy',
        description: {
            it: 'Un ammasso gelatinoso gigante in grado di dividersi.',
            en: 'A giant gelatinous mass capable of splitting itself.'
        },
        rarity: 'epic'
    },
    serpent: {
        id: 'serpent',
        description: {
            it: 'Un enorme predatore strisciante che ti circonda nel buio.',
            en: 'A huge slithering predator that surrounds you in the dark.'
        },
        rarity: 'epic'
    },
    shadow_reaper: {
        id: 'shadow_reaper',
        description: {
            it: 'Una manifestazione d\'ombra che brandisce una falce spettrale.',
            en: 'A shadow manifestation wielding a spectral scythe.'
        },
        rarity: 'legendary'
    },
    void_architect: {
        id: 'void_architect',
        description: {
            it: 'Il costruttore dei piani oscuri, manipola la realtà stessa.',
            en: 'The builder of the dark planes, manipulates reality itself.'
        },
        rarity: 'legendary'
    }
};
