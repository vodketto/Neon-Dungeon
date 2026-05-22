import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Skull, Info, Shield, Zap, Target } from 'lucide-react';
import { ENEMY_NAMES, ENEMY_PIXEL_ARTS } from '../game/enemies';
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

                                    return (
                                        <motion.button
                                            key={type}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setSelectedEnemy(type)}
                                            className={`
                                                relative aspect-square rounded-xl border flex flex-col items-center justify-center gap-2 transition-all p-2
                                                ${!isDiscovered ? 'opacity-30 grayscale' : 'opacity-100'}
                                                ${isSelected 
                                                    ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                                                    : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-500'}
                                            `}
                                        >
                                            <EnemyAvatar type={type} size={48} />
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate w-full text-center">
                                                {isDiscovered ? (ENEMY_NAMES[type]?.[language] || type) : '???'}
                                            </div>
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
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-500 font-bold uppercase tracking-widest">{language === 'it' ? 'VITTORIE' : 'VANQUISHED'}</span>
                                                    <span className="text-red-500 font-black text-lg italic">{kills[selectedEnemy] || 0}</span>
                                                </div>
                                            </div>
                                        </div>
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
