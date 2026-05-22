import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, Heart, Shield, Target, Coins, TrendingUp, X } from 'lucide-react';

interface StatOption {
    id: string;
    nameIt: string;
    nameEn: string;
    icon: React.ReactNode;
    color: string;
    apply: (stats: any) => void;
}

const OPTIONS: StatOption[] = [
    { 
        id: 'def', 
        nameIt: 'Difesa +3', nameEn: 'Defense +3', 
        icon: <Shield className="w-12 h-12" />, color: '#94a3b8',
        apply: (s) => s.defense = (s.defense || 0) + 3
    },
    { 
        id: 'hp', 
        nameIt: 'Salute +30', nameEn: 'Health +30', 
        icon: <Heart className="w-12 h-12" />, color: '#fb7185',
        apply: (s) => { s.maxHp += 30; s.hp += 30; } 
    },
    { 
        id: 'crit', 
        nameIt: 'Critico +3%', nameEn: 'Crit Chance +3%', 
        icon: <Target className="w-12 h-12" />, color: '#fb923c',
        apply: (s) => s.critChance = (s.critChance || 0.05) + 0.03
    },
    { 
        id: 'mp', 
        nameIt: 'Mana +20', nameEn: 'Mana +20', 
        icon: <Zap className="w-12 h-12" />, color: '#22d3ee',
        apply: (s) => { s.maxMp += 20; s.mp += 20; } 
    },
    { 
        id: 'gold', 
        nameIt: 'Oro +15%', nameEn: 'Gold +15%', 
        icon: <Coins className="w-12 h-12" />, color: '#fbbf24',
        apply: (s) => s.extraGoldPct += 15 
    },
    { 
        id: 'xp', 
        nameIt: 'XP +10%', nameEn: 'XP +10%', 
        icon: <TrendingUp className="w-12 h-12" />, color: '#4ade80',
        apply: (s) => s.extraXpGainPct = (s.extraXpGainPct || 0) + 10
    },
    { 
        id: 'regen', 
        nameIt: 'Mana Regen +15%', nameEn: 'Mana Regen +15%', 
        icon: <Sparkles className="w-12 h-12" />, color: '#a78bfa',
        apply: (s) => s.mpRegenBoost += 15 
    },
];

interface Props {
    stats: React.MutableRefObject<any>;
    onClose: () => void;
    lang: 'it' | 'en';
    onOpenSkillTree?: () => void;
}

export default function LevelUpSlotMachineUI({ stats, onClose, lang, onOpenSkillTree }: Props) {
    const [mode, setMode] = useState<'idle' | 'spinning' | 'results'>('idle');
    const [reelItems, setReelItems] = useState<StatOption[]>([]);
    const [stopping, setStopping] = useState([false, false, false]);
    const [stopped, setStopped] = useState([false, false, false]);
    const [, setTick] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setTick(prev => prev + 1);
        }, 150);
        return () => clearInterval(interval);
    }, []);
    
    useEffect(() => {
        // Start spinning automatically after a short delay
        const t = setTimeout(() => {
            setMode('spinning');
            // Choose 3 final items
            const chosen = [
                OPTIONS[Math.floor(Math.random() * OPTIONS.length)],
                OPTIONS[Math.floor(Math.random() * OPTIONS.length)],
                OPTIONS[Math.floor(Math.random() * OPTIONS.length)]
            ];
            setReelItems(chosen);

            // Auto stop sequence
            setTimeout(() => setStopping([true, false, false]), 1000);
            setTimeout(() => setStopped([true, false, false]), 1500);
            
            setTimeout(() => setStopping([true, true, false]), 2000);
            setTimeout(() => setStopped([true, true, false]), 2500);
            
            setTimeout(() => setStopping([true, true, true]), 3000);
            setTimeout(() => {
                setStopped([true, true, true]);
                setMode('results');
            }, 3500);
        }, 500);
        return () => clearTimeout(t);
    }, []);

    const handleCollect = () => {
        reelItems.forEach(item => item.apply(stats.current));
        onClose();
    };

    return (
        <div className="absolute inset-0 z-[300] flex flex-col items-center justify-center p-4 backdrop-blur-2xl bg-black/90 font-mono">
            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-4xl bg-slate-900 border-4 border-cyan-500/30 rounded-[40px] p-12 flex flex-col items-center shadow-[0_0_100px_rgba(34,211,238,0.2)] relative overflow-hidden"
            >
                <button 
                    id="slot-close-btn"
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-white transition-all z-50"
                >
                    <X className="w-6 h-6" />
                </button>
                <div className="absolute top-8 right-20">
                    <div className="text-yellow-400 font-black italic tracking-widest text-xl leading-none">
                        LVL {stats.current.lvl}
                    </div>
                </div>
                {/* Decorative scanning lines */}
                <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

                <h2 className="text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-cyan-400 mb-2 tracking-tighter drop-shadow-[0_0_20px_rgba(34,211,238,0.5)] uppercase animate-pulse">
                    LEVEL UP!
                </h2>
                <button
                    id="skill-points-levelup-btn"
                    onClick={() => {
                        if (stats.current.skillPoints > 0 && onOpenSkillTree) {
                            // Automatically collect/apply the 3 slot machine roll rewards so the user doesn't lose them
                            let finalItems = reelItems;
                            if (!finalItems || finalItems.length === 0) {
                                finalItems = [
                                    OPTIONS[Math.floor(Math.random() * OPTIONS.length)],
                                    OPTIONS[Math.floor(Math.random() * OPTIONS.length)],
                                    OPTIONS[Math.floor(Math.random() * OPTIONS.length)]
                                ];
                            }
                            finalItems.forEach(item => {
                                if (item && typeof item.apply === 'function') {
                                    item.apply(stats.current);
                                }
                            });
                            onOpenSkillTree();
                        }
                    }}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full mb-6 border transition-all ${
                        stats.current.skillPoints > 0 
                            ? 'bg-amber-500/25 border-amber-500/60 text-amber-300 hover:bg-amber-500/35 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] shadow-[0_0_10px_rgba(245,158,11,0.15)] active:scale-95 cursor-pointer pointer-events-auto' 
                            : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500/50 cursor-default pointer-events-none'
                    }`}
                    title={stats.current.skillPoints > 0 ? (lang === 'it' ? 'Apri Albero Abilità' : 'Open Skill Tree') : undefined}
                >
                    <Zap className={`w-4 h-4 ${stats.current.skillPoints > 0 ? 'text-amber-400 fill-amber-500/20 animate-pulse' : 'text-cyan-500/40'}`} />
                    <span className="text-sm font-black uppercase tracking-widest">
                        {lang === 'it' ? 'PUNTI ABILITÀ:' : 'SKILL POINTS:'} {stats.current.skillPoints || 0}
                    </span>
                    {stats.current.skillPoints > 0 && (
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-550"></span>
                        </span>
                    )}
                </button>
                <div className="text-cyan-500 font-bold tracking-[0.4em] mb-12 uppercase text-sm opacity-80">
                    {lang === 'it' ? 'Slot Attributi Permanenti' : 'Permanent Attribute Slots'}
                </div>

                <div className="flex gap-8 mb-16 relative">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className={`w-40 h-48 bg-black border-2 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden transition-all duration-700 ${stopped[i] ? 'border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.4)] scale-105' : 'border-slate-800 opacity-40 scale-95'}`}>
                            
                            {!stopped[i] ? (
                                <div 
                                    className="flex flex-col w-full absolute top-0"
                                    style={{
                                        animation: !stopping[i] ? 'slotSpin 0.2s linear infinite' : 'slotSpin 0.5s ease-out forwards'
                                    }}
                                >
                                    {/* Stat items during spin */}
                                    {[...OPTIONS, ...OPTIONS, ...OPTIONS].map((opt, idx) => (
                                        <div key={idx} className="h-48 min-h-[192px] w-full flex items-center justify-center opacity-30 scale-75">
                                            <div style={{ color: opt.color }} className="drop-shadow-[0_0_10px_currentColor]">
                                                {opt.icon}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <motion.div 
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="flex flex-col items-center text-center p-4"
                                >
                                    <div className="relative mb-4">
                                        <div style={{ color: reelItems[i].color }} className="drop-shadow-[0_0_15px_currentColor]">
                                            {reelItems[i].icon}
                                        </div>
                                        <motion.div 
                                           animate={{ rotate: 360 }}
                                           transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                           className="absolute -inset-2 border-2 border-dashed border-cyan-400 rounded-full opacity-30"
                                        />
                                    </div>
                                    <div className="text-[10px] font-black uppercase tracking-widest leading-tight" style={{ color: reelItems[i].color }}>
                                        {lang === 'it' ? reelItems[i].nameIt : reelItems[i].nameEn}
                                    </div>
                                    {/* Loot Name Overlay Fading */}
                                    {mode === 'results' && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: [0, 1, 1, 0] }}
                                            transition={{ duration: 3, times: [0, 0.2, 0.8, 1] }}
                                            className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 rounded-3xl p-2 text-center"
                                        >
                                            <div className="text-[14px] font-black uppercase text-white shadow-lg animate-pulse">
                                                {lang === 'it' ? reelItems[i].nameIt : reelItems[i].nameEn}
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}

                            {/* Scanline overlay for each reel */}
                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black via-transparent to-black opacity-60" />
                        </div>
                    ))}
                </div>

                <AnimatePresence>
                    {mode === 'results' && (
                        <motion.button
                            id="slot-collect-btn"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="px-12 py-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-black italic text-2xl tracking-[0.3em] shadow-[0_0_40px_rgba(8,145,178,0.5)] transition-all active:scale-90"
                            onClick={handleCollect}
                        >
                            {lang === 'it' ? 'RISCUOTI' : 'COLLECT'}
                        </motion.button>
                    )}
                </AnimatePresence>

                <style>{`
                    @keyframes slotSpin {
                        from { transform: translateY(0); }
                        to { transform: translateY(-300%); }
                    }
                    .animate-shine {
                        animation: shine 2s infinite linear;
                    }
                    @keyframes shine {
                        from { transform: translateX(-100%); }
                        to { transform: translateX(400%); }
                    }
                `}</style>
            </motion.div>
        </div>
    );
}
