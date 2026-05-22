export const ENEMY_NAMES: Record<string, {it: string, en: string}> = {
    warrior: { it: 'Guerriero', en: 'Warrior' },
    archer: { it: 'Arciere', en: 'Archer' },
    mage: { it: 'Mago', en: 'Mage' },
    skeleton: { it: 'Scheletro', en: 'Skeleton' },
    miniboss: { it: 'Miniboss', en: 'Miniboss' },
    boss: { it: 'Devy', en: 'Devy' },
    slimmy: { it: 'Slimmy', en: 'Slimmy' },
    serpent: { it: 'Gran Serpente', en: 'Great Serpent' },
    nest: { it: 'Nido', en: 'Nest' },
    specter: { it: 'Spettro', en: 'Specter' },
    vampire: { it: 'Vampiro', en: 'Vampire' },
    shadow_reaper: { it: 'Mietitore d\'Ombra', en: 'Shadow Reaper' },
    charger: { it: 'Caricatore', en: 'Charger' },
    teleporter: { it: 'Teletrasportatore', en: 'Teleporter' },
    shield_bearer: { it: 'Portatore di Scudo', en: 'Shield Bearer' },
    bomber: { it: 'Bombardiere', en: 'Bomber' },
    necromancer: { it: 'Negromante', en: 'Necromancer' },
    void_architect: { it: 'Architetto del Vuoto', en: 'Void Architect' },
    void_fragment: { it: 'Frammento del Vuoto', en: 'Void Fragment' }
};

export const ENEMY_PIXEL_ARTS: Record<string, {colors: Record<string, string>, pixels: string[]}> = {
    archer: { // Green, Robin Hood
        colors: { 'G': '#2e8b57', 'Y': '#ffcc99', 'B': '#8b4513', 'D': '#006400', 'W': '#ffffff' },
        pixels: [
            "  DDDD  ",
            "  GGGG  ",
            " YYYYYY ",
            " GGWYWG ",
            " GBBBBG ",
            " G BB G ",
            "   BB   ",
            "  BBBB  "
        ]
    },
    mage: { // Blue hood
        colors: { 'B': '#0000cd', 'D': '#000080', 'Y': '#ffff00', 'C': '#000000', 'W': '#ffffff' },
        pixels: [
            "   BB   ",
            "  BBBB  ",
            " BBCCBB ",
            " BCYYCB ",
            " BBBBBB ",
            " BBBBBB ",
            "  BBBB  ",
            "  BBBB  "
        ]
    },
    warrior: { // Paladin
        colors: { 'S': '#c0c0c0', 'W': '#ffffff', 'D': '#808080', 'G': '#ffd700', 'B': '#000000' },
        pixels: [
            "  SSWS  ",
            " SSGWSS ",
            " BSSWSB ",
            " SWSSWS ",
            " SSSSS  ",
            " S SS S ",
            "  SSSS  ",
            "  SSSS  "
        ]
    },
skeleton: {
    colors: { 'W': '#ffffff', 'G': '#d3d3d3', 'B': '#000000' },
    pixels: [
        "  WWWW  ",
        " WBBBW ",
        "WBWWWWB",
        "WBWWWWB",
        " WBBBW ",
        "  WWWW  ",
        " W W W ",
        "W  W  W"
    ]
},
    miniboss: {
        colors: { 'R': '#ff4500', 'D': '#8b0000', 'Y': '#ffd700', 'B': '#000000' },
        pixels: [
            " RR  RR ",
            " RRRRRR ",
            " RBYYBR ",
            " RRRRRR ",
            " RRRRRR ",
            " R RR R ",
            "  RRRR  ",
            " RR  RR "
        ]
    },
    boss: {
        colors: { 'R': '#ff0000', 'D': '#8b0000', 'B': '#000000', 'Y': '#ffff00' },
        pixels: [
            "DD    DD",
            "DDRRRRDD",
            "RRBYYBRR",
            " RRRRRR ",
            " RRRRRR ",
            " R RR R ",
            "  RRRR  ",
            " RR  RR "
        ]
    },
 specter: { // Pac-Man style ghost
    colors: { 'C': '#00ffff', 'W': '#ffffff', 'B': '#87ceeb', 'D': '#4682b4' },
    pixels: [
        "  BBBB  ",
        " BBBBBB ",
        "BBBBBBBB",
        "BBWWWWBB",
        "BBWDWDBB",
        "BBBBBBBB",
        "BB B BBB",
        "B BBB BB"
    ]
},
    slimmy: { // Green slime
        colors: { 'G': '#32cd32', 'L': '#adff2f', 'B': '#228b22', 'W': '#ffffff', 'E': '#000000' },
        pixels: [
            "  GGGGG ",
            " GGGGGGG",
            "GGWGGWGG",
            "GGEGGEGG",
            "GGGGGGGG",
            "GGGGGGGG",
            " GLLLLG ",
            "  GGGG  "
        ]
    },
    serpent: { // Large segmented snake
        colors: { 'G': '#3a5a40', 'L': '#588157', 'Y': '#a3b18a', 'W': '#ffffff', 'E': '#000000', 'R': '#ff4d4d' },
        pixels: [
            "  GGGG  ",
            " GGGGGGG",
            " GGGRGGG",
            "GWEGWEGG",
            "GGLLLLGG",
            " GYYYYG ",
            "  GGGG  ",
            "   GG   "
        ]
    },
    vampire: { // Pale skin, red eyes, black cape
        colors: { 'B': '#000000', 'R': '#ff0000', 'P': '#ffe4e1', 'W': '#ffffff' },
        pixels: [
            "  BBBB  ",
            " BPPP B ",
            " B R R B",
            " BPPPP B",
            " BWBWB B",
            "  BBBB  ",
            "  B  B  ",
            " BB  BB "
        ]
    },
    shadow_reaper: {
        colors: { 'B': '#000000', 'P': '#2d004d', 'V': '#660099', 'W': '#ffffff', 'G': '#00ffcc' },
        pixels: [
            "  BBBB  ",
            " BBBBBB ",
            "BPBPBPBP",
            "PVWVVWVP",
            "PVGPPGVP",
            " P V V P",
            "  VVVV  ",
            " VV  VV "
        ]
    },
    charger: {
        colors: { 'R': '#ff4500', 'D': '#8b0000', 'B': '#000000', 'W': '#ffffff' },
        pixels: [
            "  RRRR  ",
            " RRRRRR ",
            "RRWRRWRR",
            "RRBRRBRR",
            "RRRRRRRR",
            "RRDRDRRR",
            " R DR D ",
            "RR  RR  "
        ]
    },
    teleporter: {
        colors: { 'P': '#aa00ff', 'B': '#330066', 'W': '#ffffff', 'E': '#ff00ff' },
        pixels: [
            "  PPPP  ",
            " PPPPPP ",
            "PPWPPWPP",
            "PPEPPEPP",
            "PPPPPPPP",
            "PBBBBBB ",
            "  BBBB  ",
            " BB  BB "
        ]
    },
    shield_bearer: {
        colors: { 'S': '#708090', 'G': '#c0c0c0', 'B': '#000000', 'W': '#ffffff' },
        pixels: [
            "  SSSS  ",
            " SSSSGG ",
            "SSWWSSG ",
            "SSBBSSG ",
            "SSSSSSG ",
            " S SS G ",
            "  SSSSG ",
            "  SSSSG "
        ]
    },
    bomber: {
        colors: { 'R': '#ff0000', 'O': '#ff6600', 'B': '#000000', 'W': '#ffffff' },
        pixels: [
            "  BBBB  ",
            " BBWWBB ",
            "BBWOROWB",
            "BBBBBBBB",
            " RRRRRR ",
            " RRRRRR ",
            "  RRRR  ",
            " R    R "
        ]
    },
    necromancer: {
        colors: { 'G': '#006400', 'D': '#004d00', 'W': '#ffffff', 'B': '#000000' },
        pixels: [
            "  GGGG  ",
            " GGGGGG ",
            "GGWG GWG",
            "GGBG GBG",
            "GGGGGGGG",
            "DDDDDDDD",
            " D    D ",
            "DD    DD"
        ]
    },
    void_architect: {
        colors: { 'V': '#2d004d', 'B': '#000000', 'W': '#ffffff', 'G': '#00ffff' },
        pixels: [
            "  VVVV  ",
            " VVVVVV ",
            "VVWVVWVV",
            "VVGVVGVV",
            "VVVVVVVV",
            "BBBBBBBB",
            " B    B ",
            "BB    BB"
        ]
    },
    void_fragment: {
        colors: { 'V': '#660099', 'B': '#000000', 'G': '#00ffff' },
        pixels: [
            "  VV  ",
            " VVVV ",
            "VVGVV",
            " VVVV ",
            "  VV  ",
            "      ",
            "      ",
            "      "
        ]
    }
};
