import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Skull, Info, Shield, Zap, Target, Star, Award } from 'lucide-react';
import { ENEMY_NAMES, ENEMY_PIXEL_ARTS, getEnemyDefense } from '../game/enemies';
import { BESTIARY_DATA } from '../game/bestiary';

interface BestiaryUIProps {
    kills: Record<string, number>;
    isOpen: boolean;
    onClose: () => void;
    language?: 'it' | 'en';
}

const EnemyAvatar = ({ type, size = 64 }: { type: string, size?: number }) => {
    const art = ENEMY_PIXEL_ARTS[type];
    if (!art) return <div style={{ width: size, height: size }} className="bg-slate-800 rounded" />;

    const pixelSize = size / 8;

    return (
        <div 
            className="relative" 
            style={{ 
                width: size, 
                height: size,
                display: 'grid',
                gridTemplateColumns: `repeat(8, ${pixelSize}px)`,
                gridTemplateRows: `repeat(8, ${pixelSize}px)`
            }}
        >
            {art.pixels.map((row, rIdx) => 
                row.split('').map((char, cIdx) => {
                    const color = art.colors[char];
                    if (!color) return <div key={`${rIdx}-${cIdx}`} />;
                    return (
                        <div 
                            key={`${rIdx}-${cIdx}`} 
                            style={{ backgroundColor: color }}
                            className="w-full h-full"
                        />
                    );
                })
            )}
        </div>
    );
};

export default function BestiaryUI({ kills, isOpen, onClose, language = 'it' }: BestiaryUIProps) {
    const [selectedEnemy, setSelectedEnemy] = useState<string | null>(null);

    const enemyTypes = Object.keys(BESTIARY_DATA);
    
    // Sort enemy types: bosses/legendary at the end, common at start
    const sortedTypes = [...enemyTypes].sort((a, b) => {
        const rarities = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
        return rarities[BESTIARY_DATA[a].rarity] - rarities[BESTIARY_DATA[b].rarity];
    });

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'uncommon': return 'text-green-400';
            case 'rare': return 'text-blue-400';
            case 'epic': return 'text-purple-400';
            case 'legendary': return 'text-yellow-400';
            default: return 'text-slate-400';
        }
    };

    const getRarityCardStyle = (type: string, isDiscovered: boolean, isSelected: boolean, hasMastery: boolean = false) => {
        if (!isDiscovered) {
            return 'bg-slate-900/45 opacity-30 grayscale border-slate-800/60';
        }
        if (hasMastery) {
            return isSelected 
                ? 'bg-amber-950/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5),_inset_0_0_12px_rgba(245,158,11,0.1)] opacity-100 animate-pulse' 
                : 'bg-slate-950/40 border-amber-600/30 shadow-[0_0_8px_rgba(245,158,11,0.1),_inset_0_0_10px_rgba(245,158,11,0.02)] opacity-70 hover:opacity-100';
        }
        const rarity = BESTIARY_DATA[type]?.rarity || 'common';
        switch (rarity) {
            case 'legendary':
                return isSelected 
                    ? 'bg-amber-500/15 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]' 
                    : 'bg-slate-800/50 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)] hover:border-amber-500/65';
            case 'epic':
                return isSelected 
                    ? 'bg-purple-500/15 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.6)]' 
                    : 'bg-slate-800/50 border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.2)] hover:border-purple-500/65';
            case 'rare':
                return isSelected 
                    ? 'bg-blue-500/15 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]' 
                    : 'bg-slate-800/50 border-blue-500/40 shadow-[0_0_8px_rgba(59,130,246,0.2)] hover:border-blue-500/65';
            case 'uncommon':
                return isSelected 
                    ? 'bg-green-500/15 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]' 
                    : 'bg-slate-800/50 border-green-500/40 shadow-[0_0_8px_rgba(34,197,94,0.2)] hover:border-green-500/65';
            default: // common
                return isSelected 
                    ? 'bg-cyan-500/15 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.6)]' 
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-500';
        }
    };

    const getRarityHoverStyle = (type: string, isDiscovered: boolean, hasMastery: boolean = false) => {
        if (!isDiscovered) return { scale: 1.02 };
        if (hasMastery) {
            return { scale: 1.08, borderColor: "rgba(245, 158, 11, 0.7)", boxShadow: "0px 0px 14px rgba(245, 158, 11, 0.45)" };
        }
        const rarity = BESTIARY_DATA[type]?.rarity || 'common';
        switch (rarity) {
            case 'legendary':
                return { scale: 1.08, borderColor: "rgba(245, 158, 11, 0.8)", boxShadow: "0px 0px 16px rgba(245, 158, 11, 0.5)" };
            case 'epic':
                return { scale: 1.08, borderColor: "rgba(168, 85, 247, 0.8)", boxShadow: "0px 0px 16px rgba(168, 85, 247, 0.5)" };
            case 'rare':
                return { scale: 1.08, borderColor: "rgba(59, 130, 246, 0.8)", boxShadow: "0px 0px 16px rgba(59, 130, 246, 0.5)" };
            case 'uncommon':
                return { scale: 1.08, borderColor: "rgba(34, 197, 94, 0.8)", boxShadow: "0px 0px 16px rgba(34, 197, 94, 0.5)" };
            default:
                return { scale: 1.08, borderColor: "rgba(6, 182, 212, 0.8)", boxShadow: "0px 0px 16px rgba(6, 182, 212, 0.5)" };
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />
                    
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative bg-slate-900 border border-cyan-500/30 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.2)]"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-500/20 rounded-lg">
                                    <Skull className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">
                                        {language === 'it' ? 'Bestiario' : 'Bestiary'}
                                    </h2>
                                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
                                        {language === 'it' ? 'Conoscenza dei Nemici Vinti' : 'Knowledge of Vanquished Foes'}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-slate-800 rounded-full transition-colors group"
                            >
                                <X className="w-6 h-6 text-slate-400 group-hover:text-white" />
                            </button>
                        </div>

                        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                            {/* Main Grid */}
                            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                {sortedTypes.map(type => {
                                    const count = kills[type] || 0;
                                    const isDiscovered = count > 0;
                                    const isSelected = selectedEnemy === type;
                                    const hasMastery = count >= 50;

                                    const delay = (type.charCodeAt(0) % 7) * 0.4;
                                    return (
                                        <motion.button
                                            key={type}
                                            id={`bestiary-item-card-${type}`}
                                            whileHover={getRarityHoverStyle(type, isDiscovered, hasMastery)}
                                            whileTap={{ scale: 0.95 }}
                                            animate={isDiscovered ? {
                                                scale: [1, 1.02, 1],
                                            } : undefined}
                                            transition={isDiscovered ? {
                                                scale: {
                                                    duration: 3 + (type.charCodeAt(0) % 3),
                                                    repeat: Infinity,
                                                    repeatType: "reverse",
                                                    ease: "easeInOut",
                                                    delay: delay
                                                }
                                            } : undefined}
                                            onClick={() => setSelectedEnemy(type)}
                                            className={`
                                                relative aspect-square rounded-xl border flex flex-col items-center justify-center gap-2 transition-all p-2
                                                ${getRarityCardStyle(type, isDiscovered, isSelected, hasMastery)}
                                            `}
                                        >
                                            {hasMastery ? (
                                                <div id={`bestiary-elite-badge-${type}`} className="relative flex items-center justify-center w-12 h-12">
                                                    {/* Outer spin ring */}
                                                    <div className="absolute inset-0 bg-amber-500/10 rounded-full border border-dashed border-amber-500/30 animate-spin" />
                                                    {/* Central solid circle */}
                                                    <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 border border-yellow-200/30 shadow-[0_0_12px_rgba(245,158,11,0.5)]">
                                                        <Award className="w-5.5 h-5.5 text-slate-950" />
                                                    </div>
                                                    {/* Elite Text Overlay */}
                                                    <div className="absolute bottom-0 bg-slate-950 border border-amber-500/50 text-amber-400 font-mono text-[7px] font-black px-1.5 py-0.25 rounded tracking-widest uppercase shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-10 scale-[0.85]">
                                                        ELITE
                                                    </div>
                                                </div>
                                            ) : (
                                                <EnemyAvatar type={type} size={48} />
                                            )}

                                            {hasMastery && (
                                                <div id={`bestiary-particles-${type}`} className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                                                    {[...Array(5)].map((_, i) => (
                                                        <motion.div
                                                            key={i}
                                                            id={`disintegrate-particle-${type}-${i}`}
                                                            className="absolute bg-amber-500 rounded-sm w-1 h-0.5 shadow-[0_0_6px_rgba(245,158,11,0.8)]"
                                                            initial={{ 
                                                                x: `${15 + (i * 18) + (type.charCodeAt(i % type.length) % 10)}%`, 
                                                                y: "85%", 
                                                                opacity: 0.8, 
                                                                scale: 1 
                                                            }}
                                                            animate={{ 
                                                                y: "25%", 
                                                                opacity: [0, 0.9, 0], 
                                                                scale: [0.8, 1.3, 0.4] 
                                                            }}
                                                            transition={{
                                                                duration: 1.8 + (i * 0.4),
                                                                repeat: Infinity,
                                                                ease: "easeOut",
                                                                delay: i * 0.3
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            )}

                                            {isDiscovered && !hasMastery && count >= 25 && (
                                                <div className="absolute top-1 left-1 bg-yellow-500 text-slate-900 rounded-full p-0.5 shadow-[0_0_8px_rgba(234,179,8,0.6)]">
                                                    <Star className="w-2.5 h-2.5 fill-current" />
                                                </div>
                                            )}
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate w-full text-center mt-auto">
                                                {isDiscovered ? (ENEMY_NAMES[type]?.[language] || type) : '???'}
                                            </div>

                                            {isDiscovered && !hasMastery && (
                                                <div className="w-full mt-1 px-1">
                                                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min(100, (count / 50) * 100)}%` }}
                                                            className="h-full bg-cyan-500"
                                                        />
                                                    </div>
                                                    <div className="text-[7px] font-black text-slate-500 uppercase tracking-widest text-center mt-0.5">
                                                        {count}/50 {language === 'it' ? 'KILL' : 'KILLS'}
                                                    </div>
                                                </div>
                                            )}

                                            {count > 0 && (
                                                <div className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-lg">
                                                    {count}
                                                </div>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Sidebar Detail */}
                            <div className="w-full lg:w-80 bg-slate-950/50 border-t lg:border-t-0 lg:border-l border-slate-800 p-6 flex flex-col gap-6 overflow-y-auto">
                                {selectedEnemy ? (
                                    <>
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="p-8 bg-slate-900 rounded-2xl border border-slate-800 shadow-inner">
                                                <EnemyAvatar type={selectedEnemy} size={128} />
                                            </div>
                                            <div className="text-center">
                                                <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${getRarityColor(BESTIARY_DATA[selectedEnemy].rarity)}`}>
                                                    {BESTIARY_DATA[selectedEnemy].rarity}
                                                </div>
                                                <h3 className="text-2xl font-black text-white italic truncate px-2">
                                                    {kills[selectedEnemy] > 0 ? (ENEMY_NAMES[selectedEnemy]?.[language] || selectedEnemy) : '???'}
                                                </h3>
                                            </div>
                                        </div>
                                        {selectedEnemy && (
                                            <div className="flex flex-col gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-cyan-400">
                                                        <Info className="w-4 h-4" />
                                                        <span className="text-xs font-black uppercase tracking-widest">{language === 'it' ? 'DESCRIZIONE' : 'DESCRIPTION'}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-300 leading-relaxed font-medium italic italic">
                                                        {kills[selectedEnemy] > 0 
                                                            ? (BESTIARY_DATA[selectedEnemy].description[language]) 
                                                            : (language === 'it' ? 'Sconfiggi questo nemico per sbloccare le informazioni.' : 'Defeat this enemy to unlock information.')}
                                                    </p>
                                                </div>

                                                <div className="flex flex-col gap-2 pt-4 border-t border-slate-800">
                                                    {kills[selectedEnemy] > 0 && (() => {
                                                        const def = getEnemyDefense(selectedEnemy);
                                                        const getResLabel = (val: number) => val >= 30 ? (language === 'it' ? 'RESISTENTE' : 'RESISTANT') : (val > 0 ? (language === 'it' ? 'NORMALE' : 'NORMAL') : (language === 'it' ? 'DEBOLE' : 'WEAK'));
                                                    
                                                        return (
                                                            <>
                                                                <div className="flex justify-between items-center text-xs">
                                                                    <span className="text-slate-500 font-bold uppercase tracking-widest">{language === 'it' ? 'FISICA' : 'PHYSICAL'}</span>
                                                                    <span className={`font-black italic ${def.physicalDefense >= 30 ? 'text-red-500' : 'text-green-500'}`}>{getResLabel(def.physicalDefense)}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center text-xs">
                                                                    <span className="text-slate-500 font-bold uppercase tracking-widest">{language === 'it' ? 'MAGICA' : 'MAGICAL'}</span>
                                                                    <span className={`font-black italic ${def.magicalDefense >= 30 ? 'text-red-500' : 'text-green-500'}`}>{getResLabel(def.magicalDefense)}</span>
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                    
                                                    <div className="flex justify-between items-center text-xs mt-2">
                                                        <span className="text-slate-500 font-bold uppercase tracking-widest">{language === 'it' ? 'VITTORIE' : 'VANQUISHED'}</span>
                                                        <span className="text-red-500 font-black text-lg italic">{kills[selectedEnemy] || 0}</span>
                                                    </div>
                                                    
                                                    {kills[selectedEnemy] >= 50 && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center gap-3"
                                                        >
                                                            <div className="p-2 bg-yellow-500/20 rounded-lg">
                                                                <Award className="w-5 h-5 text-yellow-500" />
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">
                                                                    {language === 'it' ? 'MAESTRIA SBLOCCATA' : 'MASTERY UNLOCKED'}
                                                                </div>
                                                                <div className="text-[11px] text-yellow-200/70 font-medium italic">
                                                                    {language === 'it' ? '+1% Danni contro questa specie' : '+1% Damage against this species'}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 text-slate-500 p-8">
                                        <Target className="w-12 h-12 opacity-20" />
                                        <p className="text-sm font-bold uppercase tracking-widest italic">
                                            {language === 'it' ? 'Seleziona un nemico per visualizzare i dettagli' : 'Select an enemy to view details'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Info */}
                        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-center">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">
                                {language === 'it' ? 'CONSIGLIO: Sconfiggi più nemici per rivelare i loro segreti' : 'HINT: Defeat more enemies to reveal their secrets'}
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
