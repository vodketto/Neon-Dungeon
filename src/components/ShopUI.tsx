
import React, { useState, useEffect, useRef } from 'react';
import { WEAPONS } from '../game/weapons';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Coins, Undo2, ArrowRight, Zap, Target, Heart, Sparkles, Box, Trophy, X } from 'lucide-react';

interface ShopItem {
    id: number;
    name: string;
    price: number;
    stock: number;
    description: string;
    icon: string;
    type?: string;
    rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

const POTIONS: ShopItem[] = [
    { id: 1, name: 'HP Serum', price: 20, stock: 5, description: 'RESTORE VITALS', icon: '❤️', type: 'potion', rarity: 'common' },
    { id: 2, name: 'MP Charge', price: 20, stock: 5, description: 'REFILL ETHER', icon: '💧', rarity: 'common' },
    { id: 14, name: 'Jukebox Tune', price: 10, stock: 3, description: 'PLAY TRACK', icon: '📻', rarity: 'common' },
];
const WEAPONS_PHYS: ShopItem[] = [
    { id: 4, name: 'Heavy Module', price: 120, stock: 1, description: 'PHYSICAL UPGRADE', icon: '⚔️', type: 'weapon', rarity: 'uncommon' },
    { id: 41, name: 'Combat Core', price: 250, stock: 1, description: 'ELITE PHYSICAL GEAR', icon: '⚔️', type: 'weapon', rarity: 'rare' },
];
const WEAPONS_MAG: ShopItem[] = [
    { id: 5, name: 'Arcane Core', price: 220, stock: 1, description: 'MAGIC UPGRADE', icon: '🪄', type: 'weapon', rarity: 'uncommon' },
    { id: 51, name: 'Void Core', price: 400, stock: 1, description: 'SUPREME MAGIC GEAR', icon: '🪄', type: 'weapon', rarity: 'rare' },
];
const CRYSTALS: ShopItem[] = [
    { id: 6, name: 'Force Crystal', price: 100, stock: 3, description: '+2 STRENGTH', icon: '💎', type: 'stat', rarity: 'common' },
    { id: 7, name: 'Vital Crystal', price: 100, stock: 3, description: '+20 MAX HP', icon: '🧬', type: 'stat', rarity: 'common' },
    { id: 8, name: 'Ether Crystal', price: 80, stock: 3, description: '+10 MAX MP', icon: '✨', type: 'stat', rarity: 'common' },
];
const XP_ITEMS: ShopItem[] = [{ id: 3, name: 'Data Disc', price: 50, stock: 5, description: 'GAIN XP', icon: '📖', type: 'xp', rarity: 'common' }];
const MIDA_ITEMS: ShopItem[] = [{ id: 10, name: 'Midas Protocol', rarity: 'epic', price: 500, stock: 1, description: '+8% GOLD GAIN', icon: '🪙', type: 'special' }];
const MANA_REGEN_ITEMS: ShopItem[] = [
    { id: 9, name: 'Regen Aura', price: 500, stock: 1, description: 'MP REGEN x2', icon: '🌀', type: 'special', rarity: 'rare' },
    { id: 11, name: 'Mana Medallion', price: 150, stock: 2, description: 'MP REGEN BOOST', icon: '📿', type: 'special', rarity: 'uncommon' },
];
const CHESTS: ShopItem[] = [
    { id: 12, name: 'Standard Cache', price: 300, stock: 1, description: 'RANDOM LOOT', icon: '📦', rarity: 'uncommon', type: 'chest' },
    { id: 13, name: 'Elite Cache', price: 1000, stock: 1, description: 'LEGENDARY LOOT', icon: '🎁', rarity: 'legendary', type: 'chest' },
];

function selectShopItems(isMerchantRoom?: boolean): ShopItem[] {
    const selected: ShopItem[] = [];
    const potionCount = Math.random() < 0.5 ? 1 : 2;
    for(let i=0; i<potionCount; i++) selected.push(POTIONS[Math.floor(Math.random() * POTIONS.length)]);
    
    // Increased rare/epic chance if merchant room
    const rareChance = isMerchantRoom ? 0.8 : 0.3;

    // Physical weapons pool
    const pPool = Math.random() < rareChance ? WEAPONS_PHYS[1] : WEAPONS_PHYS[0];
    selected.push({ ...pPool, stock: isMerchantRoom ? pPool.stock + 2 : pPool.stock });

    // Magic weapons pool
    const mPool = Math.random() < rareChance ? WEAPONS_MAG[1] : WEAPONS_MAG[0];
    selected.push({ ...mPool, stock: isMerchantRoom ? mPool.stock + 2 : mPool.stock });

    selected.push(CRYSTALS[Math.floor(Math.random() * CRYSTALS.length)]);
    selected.push(XP_ITEMS[Math.floor(Math.random() * XP_ITEMS.length)]);
    selected.push(MIDA_ITEMS[Math.floor(Math.random() * MIDA_ITEMS.length)]);
    selected.push(MANA_REGEN_ITEMS[Math.floor(Math.random() * MANA_REGEN_ITEMS.length)]);
    
    // Increased chest chance if merchant room
    if (isMerchantRoom || Math.random() < 0.5) selected.push(CHESTS[Math.floor(Math.random() * CHESTS.length)]);
    
    const uniqueItems = Array.from(new Map(selected.map(item => [item.id, item])).values());
    // Ensure chests are always in stock in merchant room
    if (isMerchantRoom) {
        CHESTS.forEach(c => {
             if(Math.random() < 0.7) selected.push({...c, stock: 3});
        });
    }

    return uniqueItems.sort((a,b) => a.price - b.price);
}

export default function ShopUI({
    stats,
    audio,
    timeSurvived,
    onClose,
    onContinue,
    onTrophyProgress,
    isMerchantRoom,
    language = 'it',
}: {
    stats: React.MutableRefObject<any>;
    audio: any;
    timeSurvived: number;
    onClose: () => void;
    onContinue: () => void;
    onTrophyProgress?: (id: string) => void;
    isMerchantRoom?: boolean;
    language?: 'it' | 'en';
}) {
    const [items, setItems] = useState<ShopItem[]>(() => selectShopItems(isMerchantRoom));
    const [snapshot, setSnapshot] = useState<any>(null);
    const [flash, setFlash] = useState(false);
    const [showFireworks, setShowFireworks] = useState(false);

    useEffect(() => {
        setSnapshot({
            stats: JSON.parse(JSON.stringify(stats.current)),
            items: JSON.parse(JSON.stringify(items))
        });
    }, []);

    const triggerLevelUp = () => {
        audio.playLevelUpSound();
        setShowFireworks(true);
        setTimeout(() => setShowFireworks(false), 2000);
    }

    const buy = (item: ShopItem) => {
        if (stats.current.gold >= item.price && item.stock > 0) {
            stats.current.gold -= item.price;
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, stock: i.stock - 1 } : i));
            
            if (item.name === 'HP Serum') stats.current.hp = Math.min(stats.current.maxHp, stats.current.hp + 50);
            else if (item.name === 'MP Charge') stats.current.mp = Math.min(stats.current.maxMp, stats.current.mp + 50);
            else if (item.type === 'weapon') {
                const isMagic = item.name === 'Arcane Core' || item.name === 'Void Core';
                const weaponPool = isMagic 
                    ? Object.keys(WEAPONS).filter(k => WEAPONS[k].type === 'wand')
                    : Object.keys(WEAPONS).filter(k => WEAPONS[k].type === 'sword' || WEAPONS[k].type === 'hammer' || WEAPONS[k].type === 'boomerang');
                
                const picked = weaponPool[Math.floor(Math.random() * weaponPool.length)];
                const weaponDef = WEAPONS[picked];
                
                // Add to pending weapons instead of equipping
                if (!stats.current.pendingShopWeapons) stats.current.pendingShopWeapons = [];
                stats.current.pendingShopWeapons.push({
                    name: picked,
                    isMagic: isMagic,
                    rarity: item.rarity,
                    special_behavior: weaponDef.special_behavior
                });
            }
            else if (item.type === 'chest') {
                 if (!stats.current.inventory) stats.current.inventory = [];
                 stats.current.inventory.push({ ...item });
            }
            else if (item.name === 'Force Crystal') stats.current.strength += 2;
            else if (item.name === 'Vital Crystal') { stats.current.maxHp += 20; stats.current.hp += 20; }
            else if (item.name === 'Ether Crystal') { stats.current.maxMp += 10; stats.current.mp += 10; }
            else if (item.name === 'Mana Medallion') {
                const boost = Math.floor(Math.random() * 8) + 3; // 3% to 10%
                stats.current.mpRegenBoost = (stats.current.mpRegenBoost || 0) + boost;
            }
            else if (item.name === 'Midas Protocol') {
                stats.current.extraGoldPct = Math.min(9, (stats.current.extraGoldPct || 1) + 8);
            }
            else if (item.name === 'Data Disc') {
                const xpPercent = 0.10 + Math.random() * 0.15; // 10% to 25%
                const xpGain = Math.floor(stats.current.nextExp * xpPercent);
                stats.current.exp += xpGain;
                audio.playDropSound('item');

                if (stats.current.exp >= stats.current.nextExp) {
                    stats.current.exp -= stats.current.nextExp;
                    stats.current.lvl++;
                    stats.current.skillPoints = (stats.current.skillPoints || 0) + 1;
                    stats.current.maxHp += 20;
                    stats.current.hp = stats.current.maxHp;
                    stats.current.strength += 1;
                    stats.current.nextExp = Math.floor(stats.current.nextExp * 1.5);
                    triggerLevelUp();
                }
            } else if (item.name === 'Jukebox Tune') {
                stats.current.jukeboxesUsed = (stats.current.jukeboxesUsed || 0) + 1;
                if (onTrophyProgress) onTrophyProgress('dungeon_dj');
                audio.playShopMusic(); 
            }
            audio.playBuySound();
        }
    };

    const undo = () => {
        if (snapshot) {
            stats.current = JSON.parse(JSON.stringify(snapshot.stats));
            setItems(JSON.parse(JSON.stringify(snapshot.items)));
            audio.playUndoSound();
            setFlash(true);
            setTimeout(() => setFlash(false), 200);
        }
    };

    return (
        <div className={`absolute inset-0 bg-slate-950/98 flex flex-col items-center z-50 p-6 font-mono text-white transition-all duration-300 ${flash ? 'bg-red-900/90' : ''} overflow-y-auto custom-scrollbar`}>
            {/* STICKY HEADER SECTION */}
            <div className="sticky top-0 w-full z-[60] bg-slate-950/90 backdrop-blur-md pb-4 pt-2 mb-4 border-b border-cyan-500/20">
                <button 
                    id="shop-close-btn"
                    onClick={onClose}
                    className="absolute top-2 right-0 p-2 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-white transition-all z-50"
                >
                    <X className="w-5 h-5" />
                </button>
                
                <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-center md:items-end gap-4"
                >
                    <div className="text-center md:text-left">
                        <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 flex items-center gap-3 justify-center md:justify-start">
                            <ShoppingCart className="w-6 h-6 text-cyan-400" />
                            BLACK MARKET <span className="text-slate-700 text-lg font-bold not-italic ml-2">TERMINAL V3.0</span>
                        </h2>
                        <div className="text-[8px] text-cyan-500/50 tracking-[0.4em] font-bold mt-1 uppercase">Level {stats.current.dungeonLevel} // Session Secured</div>
                    </div>
                    <div className="text-center md:text-right">
                        <div className="text-[9px] text-yellow-500/50 tracking-widest font-bold uppercase mb-0.5">Available Credits</div>
                        <div className="text-2xl md:text-3xl font-black text-yellow-400 italic flex items-center justify-center md:justify-end gap-2">
                            <Coins className="w-6 h-6" /> {Math.floor(stats.current.gold)}
                        </div>
                    </div>
                </motion.div>

                {/* HERO STATS (TOP BAR) */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full max-w-5xl mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900/40 p-3 rounded-xl border border-white/5 shadow-inner"
                >
                    <StatItem label="VITALITY" val={`${Math.floor(stats.current.hp)}/${stats.current.maxHp}`} percentage={(stats.current.hp / stats.current.maxHp) * 100} icon={<Heart className="w-3 h-3 text-red-400" />} tooltip="Health Points: Determines how much damage you can take." />
                    <StatItem label="ETHER" val={`${Math.floor(stats.current.mp)}/${stats.current.maxMp}`} percentage={(stats.current.mp / stats.current.maxMp) * 100} icon={<Zap className="w-3 h-3 text-cyan-400" />} tooltip="Mana Points: Used to cast powerful magic spells." />
                    <StatItem label="POWER" val={stats.current.strength} percentage={Math.min(100, (stats.current.strength / 20) * 100)} icon={<Sparkles className="w-3 h-3 text-pink-400" />} tooltip="Strength: Boosts your physical attack damage." />
                    <StatItem label="EXPERIENCE" val={`${stats.current.exp}/${stats.current.nextExp}`} percentage={(stats.current.exp / stats.current.nextExp) * 100} icon={<Box className="w-3 h-3 text-orange-400" />} tooltip="EXP: Collect to level up and gain new powerful abilities." />
                </motion.div>
            </div>

            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
                {/* Run Summary (Left Sidebar Style) */}
                <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="lg:col-span-1 bg-slate-900/40 border border-slate-800 p-4 rounded-2xl flex flex-col gap-3"
                >
                    <div className="text-[10px] font-black text-emerald-500 tracking-[0.2em] border-b border-emerald-500/20 pb-2 mb-1 flex items-center gap-2 uppercase">
                        <Trophy className="w-3 h-3" /> Run Statistics
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center group cursor-help" title="Total score accumulated during the run">
                            <span className="text-[10px] text-slate-500 font-bold">TOTAL SCORE</span>
                            <span className="text-xs font-black text-cyan-400">{stats.current.score.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center group cursor-help" title="Number of enemies vanquished">
                            <span className="text-[10px] text-slate-500 font-bold">THREATS ELIMINATED</span>
                            <span className="text-xs font-black text-red-500">{stats.current.kills}</span>
                        </div>
                        <div className="flex justify-between items-center group cursor-help" title="Time lived during this expedition">
                            <span className="text-[10px] text-slate-500 font-bold">TIME ELAPSED</span>
                            <span className="text-xs font-black text-white">{Math.floor(timeSurvived / 60)}:{(timeSurvived % 60).toString().padStart(2, '0')}</span>
                        </div>
                    </div>
                </motion.div>

                {/* Equipped (Center-Right) */}
                <motion.div 
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="lg:col-span-3 bg-slate-900/40 border border-slate-800 p-4 rounded-2xl flex flex-col gap-2"
                >
                    <div className="text-[10px] font-black text-pink-500 tracking-[0.2em] border-b border-pink-500/20 pb-2 mb-1 uppercase">Loaded Modules</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-2 bg-black/40 border border-white/5 rounded-lg flex justify-between items-center px-4 group cursor-help" title="Equipped Physical Weapon">
                            <div>
                                <div className="text-[8px] text-pink-500 font-black mb-1 uppercase">PHS MODULE</div>
                                <div className="text-[10px] font-bold text-white italic truncate tracking-widest uppercase">{stats.current.physicalWeapon}</div>
                            </div>
                            <div className="text-xs font-black text-slate-700 italic">V.{stats.current.physicalStacks}.0</div>
                        </div>
                        <div className="p-2 bg-black/40 border border-white/5 rounded-lg flex justify-between items-center px-4 group cursor-help" title="Equipped Magic Weapon">
                            <div>
                                <div className="text-[10px] text-cyan-500 font-black mb-1 uppercase tracking-tighter">MAG CORE</div>
                                <div className="text-[10px] font-bold text-white italic truncate tracking-widest uppercase">{stats.current.magicWeapon}</div>
                            </div>
                            <div className="text-xs font-black text-slate-700 italic">V.{stats.current.magicStacks}.0</div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Shop Items Section (Bottom) */}
            <motion.div 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-5xl flex-1 bg-slate-900/20 border border-white/5 p-4 rounded-3xl mb-4 overflow-y-auto custom-scrollbar min-h-[300px]"
            >
                <div className="text-xs font-black text-slate-500 tracking-[0.4em] mb-4 flex items-center justify-center gap-3">
                    <div className="h-px bg-slate-800 flex-1" />
                    DEALS AVAILABLE
                    <div className="h-px bg-slate-800 flex-1" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-6">
                    {items.map((item, idx) => {
                        const rarity = item.rarity || 'common';
                        const rarityStyles = {
                            common: 'border-slate-800 hover:border-slate-600 bg-slate-900/60 text-slate-400',
                            uncommon: 'border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
                            rare: 'border-blue-500/30 hover:border-blue-500/60 bg-blue-500/5 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]',
                            epic: 'border-purple-500/30 hover:border-purple-500/60 bg-purple-500/5 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]',
                            legendary: 'border-yellow-500/30 hover:border-yellow-500/60 bg-yellow-500/5 text-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.15)]',
                        }[rarity];

                        const rarityLabelColor = {
                            common: 'bg-slate-500/20 text-slate-400',
                            uncommon: 'bg-emerald-500/20 text-emerald-400',
                            rare: 'bg-blue-500/20 text-blue-400',
                            epic: 'bg-purple-500/20 text-purple-400',
                            legendary: 'bg-yellow-500/20 text-yellow-400',
                        }[rarity];

                        const isAffordable = stats.current.gold >= item.price;
                        const canBuy = item.stock > 0 && isAffordable;

                        return (
                            <motion.button 
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.03 }}
                                onClick={() => buy(item)}
                                disabled={!canBuy}
                                className={`group relative p-4 border text-left rounded-2xl transition-all ${
                                    canBuy 
                                    ? `hover:bg-slate-800/80 active:scale-95 ${rarityStyles}` 
                                    : 'bg-slate-950/40 border-slate-900 opacity-50 cursor-not-allowed text-slate-600'
                                }`}
                            >
                                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-[4px] text-[7px] font-black uppercase tracking-widest z-20 bg-black/40 border border-white/5 opacity-60 group-hover:opacity-100">
                                    {rarity}
                                </div>

                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className={`text-2xl w-10 h-10 flex items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${rarityLabelColor}`}>
                                            {item.icon}
                                        </div>
                                        <div>
                                            <div className="font-black italic text-white uppercase tracking-tighter text-xs group-hover:text-cyan-400 transition-colors">{item.name}</div>
                                            <div className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[120px]">{item.description}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[8px] font-bold text-yellow-500/40 tracking-tighter">BANK</div>
                                        <div className={`font-black italic text-sm ${isAffordable ? 'text-yellow-400' : 'text-red-500'}`}>{item.price}G</div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center relative z-10 mt-2">
                                    <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${item.stock > 0 ? 'bg-white/10 text-slate-300' : 'bg-red-500/20 text-red-500'}`}>
                                        Stock: {item.stock}
                                    </div>
                                    {canBuy && (
                                        <div className="text-[8px] font-bold text-cyan-500 animate-pulse uppercase tracking-widest">Buy →</div>
                                    )}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>

            {/* Footer Actions */}
            <motion.div 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-5xl flex items-center justify-between gap-4 mt-auto border-t border-slate-800/50 pt-4"
            >
                <button 
                    onClick={undo} 
                    className="flex items-center gap-2 group px-4 py-2 border border-slate-800 rounded-xl text-slate-600 hover:text-white hover:border-slate-500 transition-all text-[10px] font-black italic tracking-widest"
                >
                    <Undo2 className="w-3 h-3 group-hover:-rotate-45 transition-transform" /> REVERT SESSION
                </button>
                
                <button 
                    id="shop-continue-btn"
                    onClick={() => { onContinue(); }} 
                    className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-2xl font-black italic tracking-[.2em] shadow-[0_0_30px_rgba(8,145,178,0.3)] hover:shadow-[0_0_50px_rgba(8,145,178,0.5)] transition-all active:scale-95 group"
                >
                        {isMerchantRoom ? "LEAVE MERCHANT" : "DESCEND FURTHER"} <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </button>
            </motion.div>

            {/* Level Up Fireworks Overlay */}
            <AnimatePresence>
                {showFireworks && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none bg-cyan-500/5 backdrop-blur-[2px]"
                    >
                        <motion.div 
                            animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="text-7xl md:text-8xl font-black italic text-white drop-shadow-[0_0_30px_rgba(0,255,255,0.8)] text-center"
                        >
                            ⚡LEVEL UP {stats.current.lvl}⚡
                        </motion.div>
                        <div className="text-xl md:text-2xl font-black italic text-cyan-400 mt-4 tracking-[0.5em] animate-pulse">
                            {language === 'it' ? 'POTENZIAMENTO SISTEMA' : 'SYSTEM BOOST'}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function StatItem({ label, val, icon, percentage, tooltip }: { label: string, val: any, icon: any, percentage?: number, tooltip: string }) {
    return (
        <div className="flex flex-col gap-1 group cursor-help" title={tooltip}>
            <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 tracking-widest">
                <span className="flex items-center gap-1">{icon} {label}</span>
                <span className="text-white">{val}</span>
            </div>
            <div className="h-1.5 bg-slate-950 w-full rounded-full overflow-hidden border border-white/5">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: percentage !== undefined ? `${percentage}%` : '100%' }}
                    className="h-full bg-cyan-500 transition-all duration-300"
                />
            </div>
        </div>
    );
}
