import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Heart, Zap, Sword, Shield, Wind, Sparkles, X, 
    ChevronRight, Lock, Unlock, ArrowBigUp, 
    Dna, Flame, Snowflake, Skull, Coins,
    Activity, Target, Swords
} from 'lucide-react';

interface Props {
    stats: React.MutableRefObject<any>;
    onClose: () => void;
    lang: 'it' | 'en';
}

interface SkillNode {
    id: string;
    branch: 'survival' | 'phys' | 'magic' | 'bio_atk' | 'pure_atk' | 'mag_def';
    icon: any;
    name: { it: string, en: string };
    desc: { it: string, en: string };
    maxLevel: number;
    costs: number[];
    requires?: string;
    onUpgrade: (stats: any) => void;
    position: { x: number, y: number };
}

const SKILL_TREE: SkillNode[] = [
    // --- SURVIVAL BRANCH (BIO) ---
    // Column 1: Defense (left, x: -140)
    {
        id: 'vitality',
        branch: 'survival',
        icon: Heart,
        name: { it: 'Bio-Vitalità', en: 'Bio-Vitality' },
        desc: { it: '+35 Salute Massima per rigenerare e fortificare le cellule organiche.', en: '+35 Max HP to regenerate and fortify organic cells.' },
        maxLevel: 5,
        costs: [1, 1, 2, 2, 3],
        position: { x: -140, y: -100 },
        onUpgrade: (s) => { s.maxHp += 35; s.hp += 35; }
    },
    {
        id: 'defense',
        branch: 'survival',
        icon: Shield,
        name: { it: 'Scudo Biologico', en: 'Biological Shield' },
        desc: { it: '+4 Difesa Fisica e +15 Max HP aggiuntivi.', en: '+4 Armor and +15 extra Max HP.' },
        maxLevel: 5,
        costs: [1, 2, 2, 3, 4],
        requires: 'vitality',
        position: { x: -140, y: 80 },
        onUpgrade: (s) => { s.defense = (s.defense || 0) + 4; s.maxHp += 15; s.hp += 15; }
    },
    {
        id: 'bio_adaptation',
        branch: 'survival',
        icon: Activity,
        name: { it: 'Adattamento Totale', en: 'Total Adaptation' },
        desc: { it: '+6 Difesa, +2.0 Rigenerazione HP per secondo, e +40 Max HP.', en: '+6 Armor, +2.0 HP Regen/sec, and +40 Max HP.' },
        maxLevel: 5,
        costs: [2, 3, 3, 4, 5],
        requires: 'defense',
        position: { x: -140, y: 240 },
        onUpgrade: (s) => { s.defense = (s.defense || 0) + 6; s.hpRegen = (s.hpRegen || 0) + 2.0; s.maxHp += 40; s.hp += 40; }
    },

    // Column 2: Attack Power (center, x: 0)
    {
        id: 'bio_toxin',
        branch: 'survival',
        icon: Flame,
        name: { it: 'Tossine Biologiche', en: 'Biological Toxins' },
        desc: { it: '+3 Forza Fisica base e +10% Danno Fisico Totale.', en: '+3 Base Strength and +10% Total Physical Damage.' },
        maxLevel: 5,
        costs: [1, 1, 2, 2, 3],
        position: { x: 0, y: -100 },
        onUpgrade: (s) => { s.strength += 3; s.physDmgMult = (s.physDmgMult || 1) + 0.10; }
    },
    {
        id: 'bio_evolution',
        branch: 'survival',
        icon: Dna,
        name: { it: 'Evoluzione Genica', en: 'Genetic Evolution' },
        desc: { it: '+5% Danno Fisico e +10% Danno Magico.', en: '+5% Physical and +10% Magic Damage.' },
        maxLevel: 5,
        costs: [1, 2, 2, 3, 4],
        requires: 'bio_toxin',
        position: { x: 0, y: 80 },
        onUpgrade: (s) => { s.physDmgMult = (s.physDmgMult || 1) + 0.05; s.magicDmgMult = (s.magicDmgMult || 1) + 0.10; }
    },
    {
        id: 'bio_mutation',
        branch: 'survival',
        icon: Skull,
        name: { it: 'Iper-Mutazione Fisica', en: 'Hyper Physical Mutation' },
        desc: { it: '+15% Danno Fisico e +5 Forza d\'attacco base.', en: '+15% Physical Damage and +5 Base Strength.' },
        maxLevel: 5,
        costs: [2, 3, 3, 4, 5],
        requires: 'bio_evolution',
        position: { x: 0, y: 240 },
        onUpgrade: (s) => { s.strength += 5; s.physDmgMult = (s.physDmgMult || 1) + 0.15; }
    },

    // Column 3: Skills (right, x: 140)
    {
        id: 'speed',
        branch: 'survival',
        icon: Wind,
        name: { it: 'Neuro-Agilità', en: 'Neuro-Agility' },
        desc: { it: '+6% Velocità Movimento e riflessi reattivi.', en: '+6% Movement Speed and reactiveness.' },
        maxLevel: 3,
        costs: [1, 2, 3],
        position: { x: 140, y: -100 },
        onUpgrade: (s) => { s.speedLevel = (s.speedLevel || 0) + 1.2; }
    },
    {
        id: 'regeneration',
        branch: 'survival',
        icon: Activity,
        name: { it: 'Sintesi Rigenerativa', en: 'Regenerative Synthesis' },
        desc: { it: 'Recupera passivamente 1.2 HP ogni secondo.', en: 'Passively recover 1.2 HP every second.' },
        maxLevel: 3,
        costs: [2, 3, 5],
        requires: 'speed',
        position: { x: 140, y: 80 },
        onUpgrade: (s) => { s.hpRegen = (s.hpRegen || 0) + 1.2; }
    },
    {
        id: 'bio_homeostasis',
        branch: 'survival',
        icon: Sparkles,
        name: { it: 'Omeostasi Reattiva', en: 'Reactive Homeostasis' },
        desc: { it: '+10% Velocità Attacco, +8% Velocità Movimento, e -10% Ricarica.', en: '+10% Attack Speed, +8% Movement Speed, and -10% Cooldown.' },
        maxLevel: 3,
        costs: [3, 4, 5],
        requires: 'regeneration',
        position: { x: 140, y: 240 },
        onUpgrade: (s) => { s.attackSpeed = (s.attackSpeed || 1) + 0.10; s.speedLevel = (s.speedLevel || 0) + 1.6; s.cooldownReduction = (s.cooldownReduction || 0) + 0.10; }
    },

    // --- PHYSICAL BRANCH (ATK) ---
    // Column 1: Defense (left, x: -140)
    {
        id: 'iron_skin',
        branch: 'phys',
        icon: Shield,
        name: { it: 'Pelle di Titanio', en: 'Titanium Skin' },
        desc: { it: '+4 Difesa Fisica e +15 Max HP.', en: '+4 Armor and +15 Max HP.' },
        maxLevel: 5,
        costs: [1, 1, 2, 2, 3],
        position: { x: -140, y: -100 },
        onUpgrade: (s) => { s.defense = (s.defense || 0) + 4; s.maxHp += 15; s.hp += 15; }
    },
    {
        id: 'parry_mastery',
        branch: 'phys',
        icon: Activity,
        name: { it: 'Maestria della Parata', en: 'Parry Mastery' },
        desc: { it: '+5 Difesa Fisica sussidiaria e +10 Max HP.', en: '+5 Auxiliary Armor and +10 Max HP.' },
        maxLevel: 5,
        costs: [1, 2, 2, 3, 4],
        requires: 'iron_skin',
        position: { x: -140, y: 80 },
        onUpgrade: (s) => { s.defense = (s.defense || 0) + 5; s.maxHp += 10; s.hp += 10; }
    },
    {
        id: 'gladiator_armor',
        branch: 'phys',
        icon: Swords,
        name: { it: 'Armatura del Gladiatore', en: 'Gladiator Armor' },
        desc: { it: '+8 Difesa Fisica e +30 Max HP solidi.', en: '+8 Physical Armor and +30 solid Max HP.' },
        maxLevel: 5,
        costs: [2, 3, 3, 4, 5],
        requires: 'parry_mastery',
        position: { x: -140, y: 240 },
        onUpgrade: (s) => { s.defense = (s.defense || 0) + 8; s.maxHp += 30; s.hp += 30; }
    },

    // Column 2: Attack Power (center, x: 0)
    {
        id: 'strength',
        branch: 'phys',
        icon: Sword,
        name: { it: 'Forza Bruta', en: 'Brute Force' },
        desc: { it: '+4 Forza Fisica di attacco base.', en: '+4 Base physical attack strength.' },
        maxLevel: 5,
        costs: [1, 1, 2, 2, 3],
        position: { x: 0, y: -100 },
        onUpgrade: (s) => { s.strength += 4; }
    },
    {
        id: 'phys_cooldown',
        branch: 'phys',
        icon: Zap,
        name: { it: 'Ricarica Fisica', en: 'Physical Haste' },
        desc: { it: '-8% Cooldown attacchi fisici.', en: '-8% Physical attack cooldown.' },
        maxLevel: 5,
        costs: [1, 2, 2, 3, 4],
        requires: 'strength',
        position: { x: 0, y: 80 },
        onUpgrade: (s) => { s.physicalCooldownReduction = (s.physicalCooldownReduction || 0) + 0.08; }
    },
    {
        id: 'devastating_strike',
        branch: 'phys',
        icon: Target,
        name: { it: 'Impatto Devastante', en: 'Devastating Strike' },
        desc: { it: '+20% Danno Fisico Totale e +6 Forza base.', en: '+20% Total Physical Damage and +6 base Strength.' },
        maxLevel: 5,
        costs: [2, 3, 3, 4, 5],
        requires: 'phys_cooldown',
        position: { x: 0, y: 240 },
        onUpgrade: (s) => { s.strength += 6; s.physDmgMult = (s.physDmgMult || 1) + 0.20; }
    },

    // Column 3: Skills (right, x: 140)
    {
        id: 'crit_chance',
        branch: 'phys',
        icon: Sparkles,
        name: { it: 'Precisione di Taglio', en: 'Blade Precision' },
        desc: { it: '+4% Probabilità Critico e +10% Danno Critico.', en: '+4% Critical Chance and +10% Crit Damage.' },
        maxLevel: 5,
        costs: [1, 1, 2, 2, 3],
        position: { x: 140, y: -100 },
        onUpgrade: (s) => { s.critChance += 0.04; s.critDamage = (s.critDamage || 1.5) + 0.10; }
    },
    {
        id: 'attack_speed_boost',
        branch: 'phys',
        icon: Target,
        name: { it: 'Furia di Lame', en: 'Blade Fury' },
        desc: { it: '+12% Velocità Attacco e +10% Danno Critico.', en: '+12% Attack Speed and +10% Crit Damage.' },
        maxLevel: 5,
        costs: [1, 2, 2, 3, 4],
        requires: 'crit_chance',
        position: { x: 140, y: 80 },
        onUpgrade: (s) => { s.attackSpeed = (s.attackSpeed || 1) + 0.12; s.critDamage = (s.critDamage || 1.5) + 0.10; }
    },
    {
        id: 'adrenaline_flow',
        branch: 'phys',
        icon: Flame,
        name: { it: 'Flusso di Adrenalina', en: 'Adrenaline Flow' },
        desc: { it: '+15% Velocità Attacco, +6% Probabilità Critico, e +15% Danno Critico.', en: '+15% Attack Speed, +6% Crit Chance, and +15% Crit Damage.' },
        maxLevel: 5,
        costs: [2, 3, 3, 4, 5],
        requires: 'attack_speed_boost',
        position: { x: 140, y: 240 },
        onUpgrade: (s) => { s.attackSpeed = (s.attackSpeed || 1) + 0.15; s.critChance += 0.06; s.critDamage = (s.critDamage || 1.5) + 0.15; }
    },

    // --- MAGIC BRANCH (MAG) ---
    // Column 1: Defense (left, x: -140)
    {
        id: 'mana_shield',
        branch: 'magic',
        icon: Shield,
        name: { it: 'Barriera Arcana', en: 'Arcane Barrier' },
        desc: { it: '+3 Difesa Fisica e +20 Mana Massimo.', en: '+3 Armor and +20 Max Mana.' },
        maxLevel: 5,
        costs: [1, 1, 2, 2, 3],
        position: { x: -140, y: -100 },
        onUpgrade: (s) => { s.defense = (s.defense || 0) + 3; s.maxMp += 20; s.mp += 20; }
    },
    {
        id: 'elemental_ward',
        branch: 'magic',
        icon: Dna,
        name: { it: 'Eterizzazione Difensiva', en: 'Defensive Etherness' },
        desc: { it: '+4 Difesa Fisica e +4% Velocità Movimento.', en: '+4 Armor and +4% Movement Speed.' },
        maxLevel: 5,
        costs: [1, 2, 2, 3, 4],
        requires: 'mana_shield',
        position: { x: -140, y: 80 },
        onUpgrade: (s) => { s.defense = (s.defense || 0) + 4; s.speedLevel = (s.speedLevel || 0) + 0.8; }
    },
    {
        id: 'aegis_infinity',
        branch: 'magic',
        icon: Activity,
        name: { it: 'Egida dell\'Infinito', en: 'Aegis of Infinity' },
        desc: { it: '+8 Difesa, +30 Max HP, e +30 Max MP.', en: '+8 Armor, +30 Max HP, and +30 Max MP.' },
        maxLevel: 5,
        costs: [2, 3, 3, 4, 5],
        requires: 'elemental_ward',
        position: { x: -140, y: 240 },
        onUpgrade: (s) => { s.defense = (s.defense || 0) + 8; s.maxHp += 30; s.hp += 30; s.maxMp += 30; s.mp += 30; }
    },

    // Column 2: Attack Power (center, x: 0)
    {
        id: 'arcane_surge',
        branch: 'magic',
        icon: Zap,
        name: { it: 'Ondata Catastrofica', en: 'Catastrophic Surge' },
        desc: { it: '+15% Potenza di Danno Magico.', en: '+15% Magic Damage Power.' },
        maxLevel: 5,
        costs: [1, 1, 2, 2, 3],
        position: { x: 0, y: -100 },
        onUpgrade: (s) => { s.magicDmgMult = (s.magicDmgMult || 1) + 0.15; }
    },
    {
        id: 'magic_cooldown',
        branch: 'magic',
        icon: Zap,
        name: { it: 'Ricarica Magica', en: 'Magic Haste' },
        desc: { it: '-8% Cooldown incantesimi.', en: '-8% Spell cooldown.' },
        maxLevel: 5,
        costs: [1, 2, 2, 3, 4],
        requires: 'arcane_surge',
        position: { x: 0, y: 80 },
        onUpgrade: (s) => { s.magicCooldownReduction = (s.magicCooldownReduction || 0) + 0.08; }
    },
    {
        id: 'singularity_eruption',
        branch: 'magic',
        icon: Zap,
        name: { it: 'Eruzione Singolare', en: 'Singularity Eruption' },
        desc: { it: '+20% Danno Magico, +3 Forza, e +30 Max MP.', en: '+20% Magic Damage, +3 Strength, and +30 Max MP.' },
        maxLevel: 5,
        costs: [2, 3, 3, 4, 5],
        requires: 'magic_cooldown',
        position: { x: 0, y: 240 },
        onUpgrade: (s) => { s.magicDmgMult = (s.magicDmgMult || 1) + 0.20; s.strength += 3; s.maxMp += 30; s.mp += 30; }
    },

    // Column 3: Skills (right, x: 140)
    {
        id: 'mana_regen',
        branch: 'magic',
        icon: Activity,
        name: { it: 'Flusso Rigenerativo', en: 'Regenerative Flow' },
        desc: { it: '+25% Rigenerazione Mana passiva.', en: '+25% Passive Mana Regeneration.' },
        maxLevel: 5,
        costs: [1, 1, 2, 2, 3],
        position: { x: 140, y: -100 },
        onUpgrade: (s) => { s.mpRegenBoost += 25; }
    },
    {
        id: 'skill_haste',
        branch: 'magic',
        icon: Snowflake,
        name: { it: 'Distorsione Temporale', en: 'Time Distortion' },
        desc: { it: '-12% Tempo di ricarica attacchi e incantesimi.', en: '-12% Attack and spell recovery cooldown.' },
        maxLevel: 3,
        costs: [2, 3, 5],
        requires: 'mana_regen',
        position: { x: 140, y: 80 },
        onUpgrade: (s) => { s.cooldownReduction = (s.cooldownReduction || 0) + 0.12; }
    },
    {
        id: 'spatial_overlap',
        branch: 'magic',
        icon: Wind,
        name: { it: 'Sovrimposizione Spaziale', en: 'Spatial Overlap' },
        desc: { it: '+30% Rigenerazione Mana, -15% Cooldown, e -10% Costo Mana.', en: '+30% Mana Regen, -15% Cooldown, and -10% Mana Cost.' },
        maxLevel: 3,
        costs: [3, 4, 5],
        requires: 'skill_haste',
        position: { x: 140, y: 240 },
        onUpgrade: (s) => { s.mpRegenBoost += 30; s.cooldownReduction = (s.cooldownReduction || 0) + 0.15; s.manaCostRed = (s.manaCostRed || 0) + 0.10; }
    },

    // --- BIO-ATTACK BRANCH (Poison, Debuffs) ---
    // Column 1: Toxin (left, x: -140)
    {
        id: 'bio_poison',
        branch: 'bio_atk',
        icon: Skull,
        name: { it: 'Bio-Veleno', en: 'Bio-Poison' },
        desc: { it: '+10% probabilità di avvelenare i nemici infliggendo 5 danni al secondo.', en: '+10% chance to poison enemies dealing 5 damage/sec.' },
        maxLevel: 5,
        costs: [1, 1, 2, 2, 3],
        position: { x: -140, y: -100 },
        onUpgrade: (s) => { s.poisonChance = (s.poisonChance || 0) + 0.10; s.poisonDmg = (s.poisonDmg || 0) + 5; }
    },
    {
        id: 'deep_secretion',
        branch: 'bio_atk',
        icon: Activity,
        name: { it: 'Secrezione Profonda', en: 'Deep Secretion' },
        desc: { it: '+1 secondo di durata del veleno e +8 danni al secondo.', en: '+1 second of poison duration and +8 damage/sec.' },
        maxLevel: 5,
        costs: [1, 2, 2, 3, 4],
        requires: 'bio_poison',
        position: { x: -140, y: 80 },
        onUpgrade: (s) => { s.poisonDurationSec = (s.poisonDurationSec || 5) + 1; s.poisonDmg = (s.poisonDmg || 0) + 8; }
    },
    {
        id: 'toxic_climax',
        branch: 'bio_atk',
        icon: Sparkles,
        name: { it: 'Iper-Tossicità Esplosiva', en: 'Explosive Hyper-Toxicity' },
        desc: { it: '+15% probabilità veleno, +15 danni/sec e i nemici uccisi dal veleno esplodono in una nube tossica.', en: '+15% poison chance, +15 damage/sec and poisoned enemies explode when defeated.' },
        maxLevel: 5,
        costs: [2, 3, 3, 4, 5],
        requires: 'deep_secretion',
        position: { x: -140, y: 240 },
        onUpgrade: (s) => { s.poisonChance = (s.poisonChance || 0) + 0.15; s.poisonDmg = (s.poisonDmg || 0) + 15; s.toxicExplosion = true; }
    },

    // Column 2: Debuffs (center, x: 0)
    {
        id: 'acid_spit',
        branch: 'bio_atk',
        icon: Flame,
        name: { it: 'Armatura Corrosa', en: 'Corroded Armor' },
        desc: { it: 'I tuoi attacchi riducono la difesa fisica dei nemici dell\'8% per livello.', en: 'Your attacks shred enemy physical armor by 8% per level.' },
        maxLevel: 5,
        costs: [1, 1, 2, 2, 3],
        position: { x: 0, y: -100 },
        onUpgrade: (s) => { s.acidShred = (s.acidShred || 0) + 0.08; }
    },
    {
        id: 'neurotoxin',
        branch: 'bio_atk',
        icon: Dna,
        name: { it: 'Neurotossina Rallentante', en: 'Slowing Neurotoxin' },
        desc: { it: '+12% probabilità di rallentare i nemici colpiti del 30%.', en: '+12% chance to slow hit enemies by 30%.' },
        maxLevel: 5,
        costs: [1, 2, 2, 3, 4],
        requires: 'acid_spit',
        position: { x: 0, y: 80 },
        onUpgrade: (s) => { s.slowOnHitChance = (s.slowOnHitChance || 0) + 0.12; s.slowIntensity = (s.slowIntensity || 0.10) + 0.08; }
    },
    {
        id: 'crippling_plague',
        branch: 'bio_atk',
        icon: Target,
        name: { it: 'Piaga Debilitante', en: 'Crippling Plague' },
        desc: { it: 'Attivato: i nemici avvelenati subiscono +25% danni aggiuntivi e rimangono rallentati del 40%.', en: 'Activated: poisoned enemies take +25% extra damage and are permanently slowed by 40%.' },
        maxLevel: 5,
        costs: [2, 3, 3, 4, 5],
        requires: 'neurotoxin',
        position: { x: 0, y: 240 },
        onUpgrade: (s) => { s.plagueActive = true; s.physDmgMult = (s.physDmgMult || 1) + 0.10; s.magicDmgMult = (s.magicDmgMult || 1) + 0.10; }
    },

    // Column 3: Spread (right, x: 140)
    {
        id: 'leeching_ticks',
        branch: 'bio_atk',
        icon: Heart,
        name: { it: 'Zecche Parassitarie', en: 'Leeching Ticks' },
        desc: { it: 'Ottieni 2% di Lifesteal sui bersagli affetti da veleno.', en: 'Gain 2% Lifesteal when hitting poisoned targets.' },
        maxLevel: 5,
        costs: [1, 1, 2, 2, 3],
        position: { x: 140, y: -100 },
        onUpgrade: (s) => { s.lifestealOnPoison = (s.lifestealOnPoison || 0) + 0.02; }
    },
    {
        id: 'contagion',
        branch: 'bio_atk',
        icon: Wind,
        name: { it: 'Contagio Virale', en: 'Viral Contagion' },
        desc: { it: 'Il veleno ha il 40% di probabilità di diffondersi ai nemici vicini ogni secondo.', en: 'Poison has a 40% chance of spreading to nearby enemies every second.' },
        maxLevel: 5,
        costs: [1, 2, 2, 3, 4],
        requires: 'leeching_ticks',
        position: { x: 140, y: 80 },
        onUpgrade: (s) => { s.poisonSpread = true; s.poisonDmg = (s.poisonDmg || 0) + 6; }
    },
    {
        id: 'pandemic',
        branch: 'bio_atk',
        icon: Sparkles,
        name: { it: 'Pandemia Totale', en: 'Total Pandemic' },
        desc: { it: '+20% danno del veleno e aumenta il Lifesteal su nemici avvelenati del 4%.', en: '+20% Poison damage tick and increases Lifesteal by 4% on poisoned targets.' },
        maxLevel: 5,
        costs: [2, 3, 3, 4, 5],
        requires: 'contagion',
        position: { x: 140, y: 240 },
        onUpgrade: (s) => { s.poisonDmgMult = (s.poisonDmgMult || 1) + 0.20; s.lifestealOnPoison = (s.lifestealOnPoison || 0) + 0.04; }
    },

    // --- PURE ATTACK BRANCH (Damage, Speed) ---
    // Column 1: Damage (left, x: -140)
    {
        id: 'overwhelm',
        branch: 'pure_atk',
        icon: Sword,
        name: { it: 'Impatto Sormontante', en: 'Savage Overwhelm' },
        desc: { it: '+8% Danno Fisico Totale per annichilire i nemici.', en: '+8% Total Physical Damage to annihilate targets.' },
        maxLevel: 5,
        costs: [1, 1, 2, 2, 3],
        position: { x: -140, y: -100 },
        onUpgrade: (s) => { s.physDmgMult = (s.physDmgMult || 1) + 0.08; }
    },
    {
        id: 'savage_cleave',
        branch: 'pure_atk',
        icon: Swords,
        name: { it: 'Fendente Brutale', en: 'Savage Cleave' },
        desc: { it: '+12% Danno Fisico e +5% Probabilità Critico.', en: '+12% Physical Damage and +5% Crit Chance.' },
        maxLevel: 5,
        costs: [1, 2, 2, 3, 4],
        requires: 'overwhelm',
        position: { x: -140, y: 80 },
        onUpgrade: (s) => { s.physDmgMult = (s.physDmgMult || 1) + 0.12; s.critChance += 0.05; }
    },
    {
        id: 'colossus_strike',
        branch: 'pure_atk',
        icon: Target,
        name: { it: 'Colpo del Colosso', en: 'Colossus Strike' },
        desc: { it: '+25% Danno Fisico Totale e +4 Forza d\'Attacco base.', en: '+25% Total Physical Damage and +4 Base Strength.' },
        maxLevel: 5,
        costs: [2, 3, 3, 4, 5],
        requires: 'savage_cleave',
        position: { x: -140, y: 240 },
        onUpgrade: (s) => { s.physDmgMult = (s.physDmgMult || 1) + 0.25; s.strength += 4; }
    },

    // Column 2: Attack Speed (center, x: 0)
    {
        id: 'rapid_thrust',
        branch: 'pure_atk',
        icon: Wind,
        name: { it: 'Affondo Rapido', en: 'Rapid Thrust' },
        desc: { it: '+8% Velocità d\'Attacco.', en: '+8% Attack Speed.' },
        maxLevel: 5,
        costs: [1, 1, 2, 2, 3],
        position: { x: 0, y: -100 },
        onUpgrade: (s) => { s.attackSpeed = (s.attackSpeed || 1) + 0.08; }
    },
    {
        id: 'frenzy',
        branch: 'pure_atk',
        icon: Flame,
        name: { it: 'Frenesia Bellica', en: 'Battle Frenzy' },
        desc: { it: '+12% Velocità d\'Attacco e +5% Velocità di Movimento.', en: '+12% Attack Speed and +5% Movement Speed.' },
        maxLevel: 5,
        costs: [1, 2, 2, 3, 4],
        requires: 'rapid_thrust',
        position: { x: 0, y: 80 },
        onUpgrade: (s) => { s.attackSpeed = (s.attackSpeed || 1) + 0.12; s.speedLevel = (s.speedLevel || 0) + 1.0; }
    },
    {
        id: 'berserk_mode',
        branch: 'pure_atk',
        icon: Zap,
        name: { it: 'Stato di Berserk', en: 'Berserk Mode' },
        desc: { it: '+20% Velocità d\'Attacco e +15% Riduzione del Cooldown.', en: '+20% Attack Speed and +15% Cooldown Reduction.' },
        maxLevel: 5,
        costs: [2, 3, 3, 4, 5],
        requires: 'frenzy',
        position: { x: 0, y: 240 },
        onUpgrade: (s) => { s.attackSpeed = (s.attackSpeed || 1) + 0.20; s.cooldownReduction = (s.cooldownReduction || 0) + 0.15; }
    },

    // Column 3: Lethality (right, x: 140)
    {
        id: 'precision_cut',
        branch: 'pure_atk',
        icon: Target,
        name: { it: 'Taglio di Precisione', en: 'Precision Cut' },
        desc: { it: '+5% Probabilità Colpo Critico.', en: '+5% Critical Strike Chance.' },
        maxLevel: 5,
        costs: [1, 1, 2, 2, 3],
        position: { x: 140, y: -100 },
        onUpgrade: (s) => { s.critChance += 0.05; }
    },
    {
        id: 'lethal_precision',
        branch: 'pure_atk',
        icon: Swords,
        name: { it: 'Precisione Letale', en: 'Lethal Precision' },
        desc: { it: '+25% Danno da Colpo Critico.', en: '+25% Critical Hit Damage multiplier.' },
        maxLevel: 5,
        costs: [1, 2, 2, 3, 4],
        requires: 'precision_cut',
        position: { x: 140, y: 80 },
        onUpgrade: (s) => { s.critDamage = (s.critDamage || 1.5) + 0.25; }
    },
    {
        id: 'executioner',
        branch: 'pure_atk',
        icon: Skull,
        name: { it: 'Marchio del Boia', en: 'Executioner\'s Mark' },
        desc: { it: '+10% Probabilità Critico e +40% Danno Critico.', en: '+10% Crit Chance and +40% Crit Damage.' },
        maxLevel: 5,
        costs: [2, 3, 3, 4, 5],
        requires: 'lethal_precision',
        position: { x: 140, y: 240 },
        onUpgrade: (s) => { s.critChance += 0.10; s.critDamage = (s.critDamage || 1.1) + 0.40; }
    },

    // --- MAGIC DEFENSE BRANCH (Regen, Spell Resist) ---
    // Column 1: Flow (left, x: -140)
    {
        id: 'mana_flow',
        branch: 'mag_def',
        icon: Zap,
        name: { it: 'Sorgente Celestiale', en: 'Celestial Flow' },
        desc: { it: '+35% rigenerazione passiva del Mana.', en: '+35% passive Mana Regeneration.' },
        maxLevel: 5,
        costs: [1, 1, 2, 2, 3],
        position: { x: -140, y: -100 },
        onUpgrade: (s) => { s.mpRegenBoost += 35; }
    },
    {
        id: 'astral_refresh',
        branch: 'mag_def',
        icon: Activity,
        name: { it: 'Freschezza Astrale', en: 'Astral Refresh' },
        desc: { it: '+45% rigenerazione Mana e +20 Mana Massimo.', en: '+45% Mana Regen and +20 Max Mana.' },
        maxLevel: 5,
        costs: [1, 2, 2, 3, 4],
        requires: 'mana_flow',
        position: { x: -140, y: 80 },
        onUpgrade: (s) => { s.mpRegenBoost += 45; s.maxMp += 20; s.mp += 20; }
    },
    {
        id: 'soul_source',
        branch: 'mag_def',
        icon: Sparkles,
        name: { it: 'Sorgente Animica', en: 'Soul Source' },
        desc: { it: '+60% rigenerazione Mana e ripristina 2 Mana ogni volta che elimini un nemico.', en: '+60% Mana Regen and restores 2 Mana every time you defeat an enemy.' },
        maxLevel: 5,
        costs: [2, 3, 3, 4, 5],
        requires: 'astral_refresh',
        position: { x: -140, y: 240 },
        onUpgrade: (s) => { s.soulSourceRegen = (s.soulSourceRegen || 0) + 2; s.mpRegenBoost += 60; }
    },

    // Column 2: Aegis (center, x: 0)
    {
        id: 'spell_resist',
        branch: 'mag_def',
        icon: Shield,
        name: { it: 'Resistenza agli Incanti', en: 'Spell Resistance' },
        desc: { it: 'Riduce del 15% i danni subiti da incantesimi e proiettili magici nemici.', en: 'Reduces magical projectile/spell damage taken by 15%.' },
        maxLevel: 5,
        costs: [1, 1, 2, 2, 3],
        position: { x: 0, y: -100 },
        onUpgrade: (s) => { s.spellResist = (s.spellResist || 0) + 0.15; }
    },
    {
        id: 'warding_shield',
        branch: 'mag_def',
        icon: Activity,
        name: { it: 'Scudo di Etere', en: 'Warding Shield' },
        desc: { it: '+6 Difesa Fisica totale e +20% Resistenza Magica.', en: '+6 Armor and +20% Spell Resistance.' },
        maxLevel: 5,
        costs: [1, 2, 2, 3, 4],
        requires: 'spell_resist',
        position: { x: 0, y: 80 },
        onUpgrade: (s) => { s.defense = (s.defense || 0) + 6; s.spellResist = (s.spellResist || 0) + 0.20; }
    },
    {
        id: 'anti_magic_shell',
        branch: 'mag_def',
        icon: Shield,
        name: { it: 'Involucro Anti-Magia', en: 'Anti-Magic Shell' },
        desc: { it: 'Riduce i danni magici del 35% e incrementa la Salute Massima di 50.', en: 'Reduces magic damage taken by 35% and increases Max HP by 50.' },
        maxLevel: 5,
        costs: [2, 3, 3, 4, 5],
        requires: 'warding_shield',
        position: { x: 0, y: 240 },
        onUpgrade: (s) => { s.spellResist = (s.spellResist || 0) + 0.35; s.maxHp += 50; s.hp += 50; }
    },

    // Column 3: Recoil (right, x: 140)
    {
        id: 'mana_absorption',
        branch: 'mag_def',
        icon: Sparkles,
        name: { it: 'Assorbimento Catalitico', en: 'Catalytic Absorption' },
        desc: { it: 'Converti il 15% dei danni subiti direttamente in Mana.', en: 'Convert 15% of all damage taken into Mana.' },
        maxLevel: 5,
        costs: [1, 1, 2, 2, 3],
        position: { x: 140, y: -100 },
        onUpgrade: (s) => { s.manaAbsorb = (s.manaAbsorb || 0) + 0.15; }
    },
    {
        id: 'arcane_feedback',
        branch: 'mag_def',
        icon: Wind,
        name: { it: 'Reazione Arcana', en: 'Arcane Feedback' },
        desc: { it: '-12% Costo in Mana dei tuoi incantesimi e +30 Mana Massimo.', en: '-12% Spell Mana Cost and +30 Max Mana.' },
        maxLevel: 5,
        costs: [1, 2, 2, 3, 4],
        requires: 'mana_absorption',
        position: { x: 140, y: 80 },
        onUpgrade: (s) => { s.manaCostRed = (s.manaCostRed || 0) + 0.12; s.maxMp += 30; s.mp += 30; }
    },
    {
        id: 'celestial_shield',
        branch: 'mag_def',
        icon: Shield,
        name: { it: 'Scudo Celestiale Infrangibile', en: 'Celestial Shield' },
        desc: { it: 'Attivato: lanciare incantesimi cura 5 HP, ripristina 5 Mana e riduce i costi del Mana di un ulteriore 15%.', en: 'Activated: casting a spell restores 5 HP and 5 Mana, and decreases Mana Cost by an extra 15%.' },
        maxLevel: 5,
        costs: [2, 3, 3, 4, 5],
        requires: 'arcane_feedback',
        position: { x: 140, y: 240 },
        onUpgrade: (s) => { s.celestialShieldActive = true; s.manaCostRed = (s.manaCostRed || 0) + 0.15; }
    }
];

const BRANCH_COLUMN_HEADERS: Record<string, {
    left: { it: string, en: string, icon: any },
    center: { it: string, en: string, icon: any },
    right: { it: string, en: string, icon: any }
}> = {
    survival: {
        left: { it: 'DIFESA', en: 'DEFENSE', icon: Shield },
        center: { it: 'POTENZA', en: 'POWER', icon: Sword },
        right: { it: 'REATTIVITÀ', en: 'SPEED', icon: Sparkles }
    },
    phys: {
        left: { it: 'PROTEZIONE', en: 'ARMOR', icon: Shield },
        center: { it: 'POTENZA', en: 'POWER', icon: Sword },
        right: { it: 'PRECISIONE', en: 'CRIT', icon: Sparkles }
    },
    magic: {
        left: { it: 'BARRIERA', en: 'BARRIER', icon: Shield },
        center: { it: 'AURA', en: 'ASTRAL', icon: Zap },
        right: { it: 'RIGEN', en: 'REGEN', icon: Sparkles }
    },
    bio_atk: {
        left: { it: 'TOSSINA', en: 'TOXIN', icon: Skull },
        center: { it: 'CORROSIONE', en: 'SHRED', icon: Flame },
        right: { it: 'CONTAGIO', en: 'CONTAGION', icon: Wind }
    },
    pure_atk: {
        left: { it: 'DANNO', en: 'DAMAGE', icon: Sword },
        center: { it: 'FRENESIA', en: 'FRENZY', icon: Zap },
        right: { it: 'LETALITÀ', en: 'LETHALITY', icon: Target }
    },
    mag_def: {
        left: { it: 'FLUSSO', en: 'FLOW', icon: Zap },
        center: { it: 'EGIDA', en: 'AEGIS', icon: Shield },
        right: { it: 'REAZIONE', en: 'REACTION', icon: Sparkles }
    }
};

export default function SkillTreeUI({ stats, onClose, lang }: Props) {
    const s = stats.current;
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedColumn, setSelectedColumn] = useState<'left' | 'center' | 'right' | null>(() => {
        const saved = localStorage.getItem('skill_tree_selected_column');
        return (saved as any) || 'left';
    });
    const [activeBranch, setActiveBranch] = useState<'survival' | 'phys' | 'magic' | 'bio_atk' | 'pure_atk' | 'mag_def'>(() => {
        const saved = localStorage.getItem('skill_tree_active_branch');
        return (saved as any) || 'phys';
    });
    const [, setTick] = useState(0);

    // Persistence
    React.useEffect(() => {
        localStorage.setItem('skill_tree_active_branch', activeBranch);
        if (selectedColumn) localStorage.setItem('skill_tree_selected_column', selectedColumn);
    }, [activeBranch, selectedColumn]);

    const currentHeaders = BRANCH_COLUMN_HEADERS[activeBranch] || BRANCH_COLUMN_HEADERS['phys'];
    const LeftIcon = currentHeaders.left.icon;
    const CenterIcon = currentHeaders.center.icon;
    const RightIcon = currentHeaders.right.icon;

    // Initialize skill levels in stats if missing
    useMemo(() => {
        SKILL_TREE.forEach(node => {
            const key = `skill_${node.id}`;
            if (s[key] === undefined) s[key] = 0;
        });
    }, [s]);

    const upgrade = (node: SkillNode) => {
        const key = `skill_${node.id}`;
        const lvl = s[key];
        if (lvl >= node.maxLevel) return;
        
        const cost = node.costs[lvl];
        if (s.skillPoints >= cost) {
            s.skillPoints -= cost;
            const newLvl = lvl + 1;
            s[key] = newLvl;
            node.onUpgrade(s);

            // If we reached max level for this node, auto-select the next one in the chain
            if (newLvl >= node.maxLevel) {
                const nextNode = SKILL_TREE.find(n => n.requires === node.id && n.branch === activeBranch);
                if (nextNode) {
                    setSelectedId(nextNode.id);
                }
            }

            setTick(t => t + 1);
        }
    };

    const isUnlocked = (node: SkillNode) => {
        if (!node.requires) return true;
        return (s[`skill_${node.requires}`] || 0) > 0;
    };

    const BranchButton = ({ branch, label, icon: Icon, color }: any) => (
        <button 
            onClick={() => {
                setActiveBranch(branch);
                setSelectedId(null);
                setSelectedColumn('left'); // Auto-select left column on branch change
            }}
            className={`
                flex-none md:flex-1 sm:flex-initial min-w-[90px] md:min-w-[100px] sm:min-w-0 
                px-3 flex items-center justify-center gap-1.5 md:gap-2 
                py-2 md:py-3.5 border-b-2 transition-all snap-center relative overflow-hidden group
                ${activeBranch === branch ? `${color} border-current bg-white/[0.08]` : 'text-slate-400 border-transparent hover:text-slate-200'}
            `}
        >
            <Icon className={`w-3.5 h-3.5 md:w-5 md:h-5 transition-transform duration-300 ${activeBranch === branch ? 'scale-110' : 'group-hover:scale-110'}`} />
            <span className="font-bold uppercase tracking-[0.15em] text-[7px] sm:text-[10px] md:text-xs whitespace-nowrap">{label}</span>
            {activeBranch === branch && (
                <motion.div 
                    layoutId="active-tab-glow"
                    className="absolute inset-0 bg-current opacity-[0.05]"
                />
            )}
        </button>
    );

    const filteredSkills = SKILL_TREE.filter(n => 
        n.branch === activeBranch && 
        (selectedColumn === null || (selectedColumn === 'left' && n.position.x === -140) || (selectedColumn === 'center' && n.position.x === 0) || (selectedColumn === 'right' && n.position.x === 140))
    );
    const selectedNode = SKILL_TREE.find(n => n.id === selectedId);

    const branches: any[] = [
        { id: 'survival', label: lang === 'it' ? 'BIO' : 'BIO', icon: Dna, color: 'text-emerald-400' },
        { id: 'phys', label: lang === 'it' ? 'FIS' : 'PHY', icon: Sword, color: 'text-amber-400' },
        { id: 'pure_atk', label: lang === 'it' ? 'FOR' : 'STR', icon: Swords, color: 'text-red-500' },
        { id: 'magic', label: lang === 'it' ? 'MAG' : 'MAG', icon: Sparkles, color: 'text-cyan-400' },
        { id: 'bio_atk', label: lang === 'it' ? 'ARC' : 'ARC', icon: Wind, color: 'text-indigo-400' },
        { id: 'mag_def', label: lang === 'it' ? 'ESP' : 'SPI', icon: Target, color: 'text-violet-400' },
    ];

    const branchColors: Record<string, string> = {
        survival: '#34d399',
        phys: '#fbbf24',
        pure_atk: '#ef4444',
        magic: '#22d3ee',
        bio_atk: '#818cf8',
        mag_def: '#a78bfa',
    };
    const activeColor = branchColors[activeBranch] || '#22d3ee';

    const cycleBranch = (dir: number) => {
        const idx = branches.findIndex(b => b.id === activeBranch);
        const nextIdx = (idx + dir + branches.length) % branches.length;
        setActiveBranch(branches[nextIdx].id);
        setSelectedId(null);
        setSelectedColumn('left');
    };

    return (
        <div className="absolute inset-0 z-[350] flex items-center justify-center p-0 md:p-8 backdrop-blur-2xl bg-slate-950/95 font-mono overflow-hidden">
            {/* Hidden navigation helpers for gamepad */}
            <button id="skill-prev-tab-btn" onClick={() => cycleBranch(-1)} className="hidden" />
            <button id="skill-next-tab-btn" onClick={() => cycleBranch(1)} className="hidden" />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-full md:h-[90vh] md:max-w-6xl md:rounded-[2rem] border-0 md:border md:border-white/10 bg-slate-950 relative flex flex-col md:flex-row overflow-hidden shadow-2xl shadow-black/80"
            >
                {/* Background Pattern & Scanlines */}
                <div className="absolute inset-0 opacity-[0.04] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                <div className="absolute inset-0 pointer-events-none z-[1] opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
                
                {/* Header Actions */}
                <div className="absolute top-0 right-0 p-4 md:p-8 z-[300] flex items-center gap-4">
                    <button 
                        id="skill-close-btn"
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 rounded-full bg-slate-900 border border-white/10 text-white hover:bg-slate-800 transition-all shadow-xl group"
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">
                            {lang === 'it' ? 'ESCI' : 'EXIT'}
                        </span>
                        <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    </button>
                </div>

                {/* Centered Skill Points */}
                <div className="absolute top-4 md:top-8 left-1/2 -translate-x-1/2 z-[300] flex flex-col items-center">
                    <div className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1 text-center">
                        {lang === 'it' ? 'Punti Disponibili' : 'Available Points'}
                    </div>
                    <div className="bg-cyan-500 text-slate-950 px-4 md:px-6 py-1 md:py-1.5 rounded-sm font-black text-base md:text-xl italic shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                        {s.skillPoints} SP
                    </div>
                </div>

                {/* Left Section: Matrix Nav & View */}
                <div className="flex-1 flex flex-col relative overflow-hidden">
                    {/* Header */}
                    <div className="p-6 md:p-10 pb-0">
                        <div className="flex justify-between items-center md:items-baseline">
                            <h2 className="text-xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
                                {lang === 'it' ? 'MATRICE' : 'MATRIX'}
                            </h2>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="grid grid-cols-3 md:flex px-4 md:px-10 mt-2 md:mt-4 gap-1 md:gap-3 justify-start md:justify-center select-none border-b border-white/5 pb-1 md:pb-2">
                        {branches.map(b => (
                            <BranchButton key={b.id} branch={b.id} label={b.label} icon={b.icon} color={b.color} />
                        ))}
                    </div>

                    {/* Tree Illustration Area */}
                    <div className="flex-1 relative overflow-auto custom-scrollbar p-4 md:p-12 touch-pan-x touch-pan-y shadow-inner">
                        <div className="relative min-h-[500px] md:min-h-[600px] w-full flex items-center justify-center overflow-visible scale-[0.75] md:scale-100 origin-center">
                            {/* SVG for connections with real coordinates */}
                            <svg 
                                className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" 
                                viewBox="-400 -400 800 800" 
                                preserveAspectRatio="xMidYMid meet"
                            >
                                <defs>
                                    <filter id="glow">
                                        <feGaussianBlur stdDeviation="2.5" result="blur" />
                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                    </filter>
                                </defs>
                                <g>
                                    {SKILL_TREE.filter(n => n.branch === activeBranch).map(node => {
                                        if (!node.requires) return null;
                                        const parent = SKILL_TREE.find(n => n.id === node.requires);
                                        if (!parent) return null;
                                        
                                        const parentLvl = s[`skill_${parent.id}`] || 0;
                                        const nodeLvl = s[`skill_${node.id}`] || 0;
                                        const isPathUnlocked = parentLvl > 0;
                                        const isPathActive = nodeLvl > 0;
                                        
                                        // Filter connections along with nodes for visual consistency
                                        const isVisible = selectedColumn === null || 
                                            (selectedColumn === 'left' && node.position.x === -140) ||
                                            (selectedColumn === 'center' && node.position.x === 0) ||
                                            (selectedColumn === 'right' && node.position.x === 140);
                                            
                                        if (!isVisible) return null;

                                        return (
                                            <React.Fragment key={`${parent.id}-${node.id}`}>
                                                {/* Background static line */}
                                                <line 
                                                    x1={parent.position.x} y1={parent.position.y}
                                                    x2={node.position.x} y2={node.position.y}
                                                    stroke="white"
                                                    strokeWidth="1"
                                                    strokeOpacity={isPathUnlocked ? 0.1 : 0.03}
                                                />
                                                
                                                {/* Active path with energy flow */}
                                                {isPathActive && (
                                                    <>
                                                        {/* Solid colored line */}
                                                        <motion.line 
                                                            initial={{ pathLength: 0, opacity: 0 }}
                                                            animate={{ pathLength: 1, opacity: 0.3 }}
                                                            key={`${parent.id}-${node.id}-active-base`}
                                                            x1={parent.position.x} y1={parent.position.y}
                                                            x2={node.position.x} y2={node.position.y}
                                                            stroke={activeColor}
                                                            strokeWidth="3"
                                                            style={{ filter: 'blur(2px)' }}
                                                        />
                                                        {/* Flowing energy beads */}
                                                        <motion.line 
                                                            key={`${parent.id}-${node.id}-active-flow`}
                                                            x1={parent.position.x} y1={parent.position.y}
                                                            x2={node.position.x} y2={node.position.y}
                                                            stroke={activeColor}
                                                            strokeWidth="2"
                                                            strokeDasharray="4 12"
                                                            animate={{ strokeDashoffset: [32, 0] }}
                                                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                                            style={{ filter: `drop-shadow(0 0 3px ${activeColor})` }}
                                                        />
                                                    </>
                                                )}
                                                
                                                {/* Unlocked but not yet purchased path (Available) */}
                                                {isPathUnlocked && !isPathActive && (
                                                    <motion.line
                                                        key={`${parent.id}-${node.id}-available`}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: [0.1, 0.4, 0.1] }}
                                                        transition={{ duration: 3, repeat: Infinity }}
                                                        x1={parent.position.x} y1={parent.position.y}
                                                        x2={node.position.x} y2={node.position.y}
                                                        stroke="white"
                                                        strokeWidth="1.5"
                                                        strokeDasharray="2 4"
                                                    />
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </g>
                            </svg>

                            {/* Node Container */}
                            <div className="relative w-full h-full flex items-center justify-center">
                                {/* Symmetrical Lane Headers */}
                                <button 
                                    onClick={() => setSelectedColumn(selectedColumn === 'left' ? null : 'left')}
                                    style={{ 
                                        position: 'absolute',
                                        left: '50%', top: '50%',
                                        marginLeft: -70, marginTop: -20,
                                        transform: 'translate(-140px, -200px)' 
                                    }}
                                    className={`w-[140px] flex flex-col items-center select-none transition-all duration-500 group ${selectedColumn && selectedColumn !== 'left' ? 'opacity-20 scale-90' : 'opacity-100'}`}
                                >
                                    <div className={`p-2 rounded-lg mb-1.5 transition-all ${selectedColumn === 'left' ? 'bg-cyan-500/10' : ''}`}>
                                        <LeftIcon className={`w-5 h-5 ${selectedColumn === 'left' ? 'text-cyan-400' : 'text-slate-300'} drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] animate-pulse`} />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${selectedColumn === 'left' ? 'text-cyan-300' : 'text-slate-400'} drop-shadow-[0_0_6px_rgba(34,211,238,0.3)] text-center w-full truncate`}>
                                        {lang === 'it' ? currentHeaders.left.it : currentHeaders.left.en}
                                    </span>
                                    <div className={`w-8 h-[2px] mt-1 transition-all ${selectedColumn === 'left' ? 'bg-cyan-500 w-12' : 'bg-slate-500/20'}`} />
                                </button>

                                <button 
                                    onClick={() => setSelectedColumn(selectedColumn === 'center' ? null : 'center')}
                                    style={{ 
                                        position: 'absolute',
                                        left: '50%', top: '50%',
                                        marginLeft: -70, marginTop: -20,
                                        transform: 'translate(0px, -200px)' 
                                    }}
                                    className={`w-[140px] flex flex-col items-center select-none transition-all duration-500 group ${selectedColumn && selectedColumn !== 'center' ? 'opacity-20 scale-90' : 'opacity-100'}`}
                                >
                                    <div className={`p-2 rounded-lg mb-1.5 transition-all ${selectedColumn === 'center' ? 'bg-amber-500/10' : ''}`}>
                                        <CenterIcon className={`w-5 h-5 ${selectedColumn === 'center' ? 'text-amber-400' : 'text-slate-300'} drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] animate-pulse`} />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${selectedColumn === 'center' ? 'text-amber-300' : 'text-slate-400'} drop-shadow-[0_0_6px_rgba(251,191,36,0.3)] text-center w-full truncate`}>
                                        {lang === 'it' ? currentHeaders.center.it : currentHeaders.center.en}
                                    </span>
                                    <div className={`w-8 h-[2px] mt-1 transition-all ${selectedColumn === 'center' ? 'bg-amber-500 w-12' : 'bg-slate-500/20'}`} />
                                </button>

                                <button 
                                    onClick={() => setSelectedColumn(selectedColumn === 'right' ? null : 'right')}
                                    style={{ 
                                        position: 'absolute',
                                        left: '50%', top: '50%',
                                        marginLeft: -70, marginTop: -20,
                                        transform: 'translate(140px, -200px)' 
                                    }}
                                    className={`w-[140px] flex flex-col items-center select-none transition-all duration-500 group ${selectedColumn && selectedColumn !== 'right' ? 'opacity-20 scale-90' : 'opacity-100'}`}
                                >
                                    <div className={`p-2 rounded-lg mb-1.5 transition-all ${selectedColumn === 'right' ? 'bg-purple-500/10' : ''}`}>
                                        <RightIcon className={`w-5 h-5 ${selectedColumn === 'right' ? 'text-purple-400' : 'text-slate-300'} drop-shadow-[0_0_8px_rgba(192,132,252,0.5)] animate-pulse`} />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${selectedColumn === 'right' ? 'text-purple-300' : 'text-slate-400'} drop-shadow-[0_0_6px_rgba(192,132,252,0.3)] text-center w-full truncate`}>
                                        {lang === 'it' ? currentHeaders.right.it : currentHeaders.right.en}
                                    </span>
                                    <div className={`w-8 h-[2px] mt-1 transition-all ${selectedColumn === 'right' ? 'bg-purple-500 w-12' : 'bg-slate-500/20'}`} />
                                </button>

                                {filteredSkills.map((node) => {
                                    const unlocked = isUnlocked(node);
                                    const level = s[`skill_${node.id}`] || 0;
                                    const isMax = level >= node.maxLevel;
                                    const isSelected = selectedId === node.id;
                                    
                                    return (
                                        <motion.button
                                            key={node.id}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setSelectedId(node.id)}
                                            style={{ 
                                                position: 'absolute',
                                                left: '50%', top: '50%',
                                                marginLeft: -32, marginTop: -32,
                                                transform: `translate(${node.position.x}px, ${node.position.y}px)` 
                                            }}
                                            className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 group relative ${
                                                unlocked 
                                                ? (isSelected ? 'bg-white border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-110' : (level > 0 ? 'bg-slate-900/80 border-white/40 hover:border-white shadow-lg' : 'bg-slate-950/50 border-white/20 hover:border-white/40 shadow-lg')) 
                                                : 'bg-slate-950 border-slate-800 opacity-50 grayscale pointer-events-none'
                                            }`}
                                        >
                                            <node.icon className={`w-8 h-8 transition-colors duration-300 ${isSelected ? 'text-slate-950' : (level > 0 ? 'text-white' : 'text-slate-200 group-hover:text-white')}`} />
                                            
                                            {/* Level Progress Bar (Mini) */}
                                            <div className="absolute -bottom-4 left-0 w-full h-1 bg-white/5 rounded-full overflow-hidden flex gap-[1px] p-[1px]">
                                                {Array.from({ length: node.maxLevel }).map((_, i) => (
                                                    <div key={i} className={`flex-1 h-full rounded-sm transition-all duration-500 ${i < level ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'bg-white/10'}`} />
                                                ))}
                                            </div>

                                            {!unlocked && <Lock className="absolute w-4 h-4 text-slate-500" />}
                                            {isMax && level > 0 && (
                                                <motion.div 
                                                    initial={{ opacity: 0, scale: 0 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.4)] z-10"
                                                >
                                                    <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                                                </motion.div>
                                            )}

                                            {isSelected && (
                                                <motion.div 
                                                    layoutId="node-halo"
                                                    className="absolute -inset-2 border border-white/20 rounded-2xl animate-ping opacity-20"
                                                />
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Details Panel */}
                <div className={`
                    absolute md:relative bottom-0 right-0 w-full md:w-96 
                    bg-slate-950/98 md:bg-white/[0.02] 
                    border-t md:border-t-0 md:border-l border-white/10 md:border-white/5 
                    p-6 md:p-10 flex flex-col gap-4 md:gap-8 shrink-0 
                    overflow-y-auto transition-all duration-300 z-[400]
                    ${selectedId ? 'translate-y-0 h-[70vh] md:h-full opacity-100 shadow-2xl shadow-cyan-500/10' : 'translate-y-full md:translate-y-0 h-0 md:h-full opacity-0 md:opacity-100'}
                `}>
                    <AnimatePresence mode="wait">
                        {selectedId && selectedNode ? (
                            <motion.div 
                                key={selectedId}
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.15 }}
                                className="flex flex-col h-full"
                            >
                                {/* Mobile Back Button */}
                                <button 
                                    onClick={() => setSelectedId(null)}
                                    className="md:hidden self-start mb-6 flex items-center gap-2 text-cyan-400 font-black text-[10px] uppercase tracking-widest"
                                >
                                    <ChevronRight className="w-4 h-4 rotate-180" />
                                    {lang === 'it' ? 'Torna alla Matrice' : 'Back to Matrix'}
                                </button>

                                <div className="flex flex-col gap-5 md:gap-6">
                                    <div className="relative group self-start">
                                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shadow-inner group-hover:border-cyan-500/50 transition-colors">
                                            <selectedNode.icon className="w-8 h-8 md:w-10 md:h-10 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
                                        </div>
                                        <div className="absolute -inset-1 bg-cyan-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <div className="text-[9px] md:text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">
                                                {selectedNode.branch} MODULE
                                            </div>
                                            <div className="h-px flex-1 bg-white/5" />
                                        </div>
                                        <h3 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter leading-tight md:leading-none">
                                            {lang === 'it' ? selectedNode.name.it : selectedNode.name.en}
                                        </h3>
                                        <div className="flex gap-1.5 mt-3">
                                            {Array.from({ length: selectedNode.maxLevel }).map((_, i) => {
                                                 const level = s[`skill_${selectedNode.id}`] || 0;
                                                 return <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i < level ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-white/5'}`} />;
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 md:mt-10 flex-1 relative">
                                    <div className="absolute -left-6 top-1 bottom-1 w-px bg-cyan-500/20" />
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">System Specifications</div>
                                    <p className="text-slate-300 text-sm md:text-base leading-relaxed font-medium italic opacity-90">
                                        "{lang === 'it' ? selectedNode.desc.it : selectedNode.desc.en}"
                                    </p>
                                </div>

                                <div className="mt-8 pt-6 md:pt-8 border-t border-white/5 pb-20 md:pb-0">
                                    {s[`skill_${selectedNode.id}`] < selectedNode.maxLevel ? (
                                        <div className="space-y-4 md:space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Investment Req</div>
                                                <div className={`text-xl md:text-2xl font-black italic ${s.skillPoints >= selectedNode.costs[s[`skill_${selectedNode.id}`]] ? 'text-white' : 'text-red-500'}`}>
                                                    {selectedNode.costs[s[`skill_${selectedNode.id}`]]} SP
                                                </div>
                                            </div>
                                            <button 
                                                id="skill-upgrade-btn"
                                                onClick={() => upgrade(selectedNode)}
                                                disabled={s.skillPoints < selectedNode.costs[s[`skill_${selectedNode.id}`]]}
                                                className={`w-full py-4 md:py-5 rounded-xl font-black uppercase tracking-[0.3em] transition-all relative overflow-hidden group ${
                                                    s.skillPoints >= selectedNode.costs[s[`skill_${selectedNode.id}`]]
                                                    ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-[0_0_40px_rgba(6,182,212,0.2)]'
                                                    : 'bg-white/5 text-white/20 border border-white/5'
                                                }`}
                                            >
                                                {lang === 'it' ? 'INIZIALIZZA' : 'INITIALIZE'}
                                                {s.skillPoints >= selectedNode.costs[s[`skill_${selectedNode.id}`]] && (
                                                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                                )}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-full py-4 md:py-5 bg-white text-slate-950 rounded-xl font-black uppercase tracking-[0.3em] text-center italic shadow-xl">
                                            {lang === 'it' ? 'COMPLETATO' : 'OPTIMIZED'}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <div className="hidden md:flex h-full flex-col items-center justify-center text-center opacity-20">
                                <Target className="w-16 h-16 mb-4" />
                                <div className="text-[11px] font-black uppercase tracking-widest leading-loose">
                                    {lang === 'it' ? 'SISTEMA IN ATTESA\nSELEZIONA MODULO' : 'SYSTEM STANDBY\nSELECT MODULE'}
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}


