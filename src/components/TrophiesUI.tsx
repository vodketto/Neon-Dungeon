import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Target, Zap, Shield, Search, Timer, Award, Lock, CheckCircle2 } from 'lucide-react';
import { TROPHIES, type Trophy as TrophyType } from '../game/trophies';

interface TrophiesUIProps {
    isOpen: boolean;
    onClose: () => void;
    stats: any;
    unlockedTrophies: string[];
    language: 'it' | 'en';
}

const CATEGORY_ICONS = {
    combat: <Zap className="w-4 h-4" />,
    exploration: <Search className="w-4 h-4" />,
    loot: <Target className="w-4 h-4" />,
    survival: <Shield className="w-4 h-4" />,
    speedrun: <Timer className="w-4 h-4" />
};

export const TrophiesUI: React.FC<TrophiesUIProps> = ({ isOpen, onClose, stats, unlockedTrophies, language }) => {
    const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');

    if (!isOpen) return null;

    const filteredTrophies = TROPHIES.filter(t => selectedCategory === 'all' || t.category === selectedCategory);

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
            >
                <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="relative w-full max-w-4xl max-h-[85vh] bg-slate-900 border-2 border-cyan-500/30 rounded-3xl shadow-[0_0_50px_rgba(34,211,238,0.1)] overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-cyan-500/20 rounded-xl">
                                <Trophy className="w-8 h-8 text-cyan-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">
                                    {language === 'it' ? 'SISTEMA TROFEI' : 'TROPHY SYSTEM'}
                                </h2>
                                <p className="text-xs font-bold text-cyan-500/60 uppercase tracking-widest">
                                    {unlockedTrophies.length} / {TROPHIES.length} {language === 'it' ? 'SBLOCCATI' : 'UNLOCKED'}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Category Filter */}
                    <div className="p-4 bg-slate-950/30 flex gap-2 overflow-x-auto no-scrollbar">
                        {['all', 'combat', 'exploration', 'loot', 'survival', 'speedrun'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-full whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all ${
                                    selectedCategory === cat 
                                    ? 'bg-cyan-500 text-slate-900 shadow-[0_0_15px_rgba(34,211,238,0.4)]' 
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                            >
                                {cat === 'all' ? (language === 'it' ? 'TUTTI' : 'ALL') : cat}
                            </button>
                        ))}
                    </div>

                    {/* Progress Bar Header */}
                    <div className="px-6 py-3 bg-slate-950/20 border-b border-slate-800/50">
                       <div className="flex justify-between items-center mb-1">
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{language === 'it' ? 'PROGRESSO TOTALE' : 'TOTAL PROGRESS'}</span>
                           <span className="text-[10px] font-black text-cyan-400 italic">{Math.round((unlockedTrophies.length / TROPHIES.length) * 100)}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                           <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${(unlockedTrophies.length / TROPHIES.length) * 100}%` }}
                               className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                           />
                       </div>
                    </div>

                    {/* Trophies Grid */}
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredTrophies.map((trophy) => {
                                const isUnlocked = unlockedTrophies.includes(trophy.id);
                                const currentStat = stats[trophy.statKey] || 0;
                                const progress = Math.min(1, currentStat / trophy.targetValue);
                                
                                return (
                                    <motion.div 
                                        key={trophy.id}
                                        layout
                                        className={`relative p-4 rounded-2xl border transition-all ${
                                            isUnlocked 
                                            ? 'bg-cyan-500/5 border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.05)]' 
                                            : 'bg-slate-800/50 border-slate-700 opacity-60'
                                        }`}
                                    >
                                        <div className="flex gap-4">
                                            {/* Icon */}
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                                                isUnlocked ? 'bg-cyan-500/20' : 'bg-slate-700/50'
                                            }`}>
                                                {isUnlocked ? trophy.icon : <Lock className="w-5 h-5 text-slate-500" />}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className={`text-sm font-black uppercase tracking-tight truncate ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>
                                                        {trophy.title[language]}
                                                    </h3>
                                                    {isUnlocked && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                                                </div>
                                                <p className="text-[11px] text-slate-500 font-medium leading-tight mb-2">
                                                    {trophy.description[language]}
                                                </p>

                                                {/* Progressive Bar */}
                                                {!isUnlocked && (
                                                    <div className="mb-2">
                                                        <div className="flex justify-between text-[8px] font-bold text-slate-600 mb-1">
                                                            <span>{currentStat} / {trophy.targetValue}</span>
                                                        </div>
                                                        <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-slate-600 transition-all"
                                                                style={{ width: `${progress * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Reward */}
                                                <div className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${isUnlocked ? 'text-yellow-500' : 'text-slate-600'}`}>
                                                    <Award className="w-3 h-3" />
                                                    {language === 'it' ? 'PREMIO' : 'REWARD'}: {trophy.reward[language]}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Category Badge */}
                                        <div className="absolute top-2 right-2 text-slate-700">
                                            {CATEGORY_ICONS[trophy.category]}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
