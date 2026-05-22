import React, { useState, useEffect } from 'react';
import { Sword, Shield, Zap, Skull, Coins, Thermometer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UIPanelProps {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  dungeonLevel: number;
  heroLevel: number;
  kills: number;
  strength: number;
  gold: number;
  physicalWeaponName: string;
  physicalWeaponLevel: number;
  magicWeaponName: string;
  magicWeaponLevel: number;
  physicalWeaponRarity?: string;
  magicWeaponRarity?: string;
  heroClass?: string;
  language?: string;
  score?: number;
  exp?: number;
  nextExp?: number;
  skillPoints?: number;
  onOpenSkills?: () => void;
  onOpenBestiary?: () => void;
  // Secondary stats
  defense?: number;
  hpRegen?: number;
  mpRegenBoost?: number;
  critChance?: number;
  critDamage?: number;
  cooldownReduction?: number;
  attackSpeed?: number;
}

export default function UIPanel({ 
  hp, maxHp, mp, maxMp, dungeonLevel, heroLevel, kills, strength, gold, 
  physicalWeaponName, physicalWeaponLevel, magicWeaponName, magicWeaponLevel, 
  physicalWeaponRarity = 'common', magicWeaponRarity = 'common', 
  heroClass = 'warrior', language = 'it', score = 0, exp = 0, nextExp = 100, 
  skillPoints = 0, onOpenSkills, onOpenBestiary,
  // Secondary stats
  defense = 0,
  hpRegen = 0,
  mpRegenBoost = 0,
  critChance = 0.05,
  critDamage = 1.5,
  cooldownReduction = 0,
  attackSpeed = 1,
}: UIPanelProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const hpPerc = (hp / maxHp) * 100;
  const mpPerc = (mp / maxMp) * 100;
  const expPerc = (exp / nextExp) * 100;

  const manaRegenPerSec = (0.06 * (1 + mpRegenBoost / 100) * 60).toFixed(1);
  const hpRegenPerSec = hpRegen.toFixed(1);
  const critPercent = Math.round(critChance * 100);
  const cdrPercent = Math.round(cooldownReduction * 100);
  const asPercent = Math.round((attackSpeed - 1) * 100);

  const getClassName = () => {
    if (language === 'it') {
      if (heroClass === 'mage') return 'Mago';
      if (heroClass === 'paladin') return 'Paladino';
      return 'Guerriero';
    } else {
      if (heroClass === 'mage') return 'Mage';
      if (heroClass === 'paladin') return 'Paladin';
      return 'Warrior';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'rare': return 'text-blue-400';
      case 'epic': return 'text-purple-400';
      case 'legendary': return 'text-yellow-400';
      case 'uncommon': return 'text-green-400';
      default: return 'text-white';
    }
  };

  const StatItem = ({ icon: Icon, value, tooltip, colorClass = "text-white", onClick }: { icon: any, value: string | number, tooltip: string, colorClass?: string, onClick?: () => void }) => (
    <button 
      className={`flex items-center gap-1.5 group outline-none ${onClick ? 'cursor-pointer hover:bg-slate-800/80 px-1.5 py-0.5 rounded transition-colors' : 'cursor-help'}`} 
      title={tooltip}
      onClick={onClick}
      disabled={!onClick}
    >
      <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
      <span className={`font-bold text-sm md:text-base ${colorClass}`}>{value}</span>
    </button>
  );

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none select-none font-mono">
      {/* Main Top Bar */}
      <div className="bg-slate-950/85 backdrop-blur-md border-b border-cyan-500/30 w-full flex flex-col lg:flex-row lg:items-center py-2.5 lg:py-0 h-auto lg:h-18 px-3 md:px-6 lg:px-8 gap-2.5 lg:gap-8 justify-between shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        
        {/* Top/Primary Row on Mobile, Left Section on Desktop */}
        <div className="flex items-center justify-between lg:justify-start lg:gap-6 w-full lg:w-auto shrink-0 gap-2">
          {/* Left Block: Hero Identity & Vitals */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {/* Hero Identity */}
            <div className="flex flex-col animate-pulse">
              <div className="text-[9px] text-cyan-400 uppercase tracking-widest opacity-70 leading-none">
                {getClassName()}
              </div>
              <div className="text-base md:text-lg font-black text-white italic tracking-tighter flex items-center gap-0.5">
                <span className="text-cyan-400">LVL</span> {heroLevel}
              </div>
            </div>

            {/* Vitals Bars */}
            <div className="flex flex-col gap-1 w-24 sm:w-28 md:w-44 shrink-0">
              {/* HP Bar */}
              <div className="relative h-3 md:h-4 bg-slate-900 border border-red-500/20 rounded-full overflow-hidden" title="Health Points">
                <motion.div 
                  animate={{ width: `${hpPerc}%` }}
                  className={`h-full ${hpPerc < 30 ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-r from-red-600 to-pink-500'}`}
                />
                <div className="absolute inset-0 flex items-center justify-center text-[7.5px] md:text-[9.5px] font-black text-white [text-shadow:_0_1px_2px_rgba(0,0,0,1),_0_1px_1px_rgba(0,0,0,1)]">
                  {Math.ceil(hp)}/{maxHp}
                </div>
              </div>
              {/* MP Bar */}
              <div className="relative h-3 md:h-4 bg-slate-900 border border-cyan-500/20 rounded-full overflow-hidden" title="Mana Points">
                <motion.div 
                  animate={{ width: `${mpPerc}%` }}
                  className="h-full bg-gradient-to-r from-cyan-600 to-blue-500"
                />
                <div className="absolute inset-0 flex items-center justify-center text-[7.5px] md:text-[9.5px] font-black text-white [text-shadow:_0_1px_2px_rgba(0,0,0,1),_0_1px_1px_rgba(0,0,0,1)]">
                  {Math.ceil(mp)}/{maxMp}
                </div>
              </div>
            </div>
          </div>

          {/* Right Block of Primary Row: Gold, Kills, Strength (visible only on mobile/tablet here) */}
          <div className="flex lg:hidden items-center gap-2.5 sm:gap-4 shrink-0 bg-slate-900/40 px-2 py-1 rounded border border-white/5">
            <StatItem icon={Coins} value={gold} colorClass="text-yellow-400" tooltip="Gold collected" />
            <StatItem icon={Skull} value={kills} colorClass="text-red-500" tooltip={language === 'it' ? "Nemici eliminati (Apri Bestiario)" : "Enemies vanquished (Open Bestiary)"} onClick={onOpenBestiary} />
            <StatItem icon={Sword} value={strength} colorClass="text-pink-400" tooltip="Hero Strength" />
          </div>
        </div>

        {/* Center Section: Expedition Progress (Dungeon Level & Score) */}
        <div className="hidden xl:flex flex-col items-center shrink-0">
          <div className="text-[10px] text-yellow-500 uppercase tracking-[0.3em] font-black italic">
            EXPEDITION #{dungeonLevel}
          </div>
          <div className="text-xl font-black text-white italic tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" title="Total Score">
            {String(score).padStart(6, '0')}
          </div>
        </div>

        {/* Bottom Panel on Mobile, Right Panel on Desktop */}
        <div className="flex items-center justify-between lg:justify-end gap-3 lg:gap-8 w-full lg:w-auto lg:grow min-w-0">
          
          {/* Stats Column: Supplementary Mini-stats is always first, then main stats on desktop */}
          <div className="flex flex-col lg:items-end justify-center gap-1 w-full lg:w-auto">
            {/* Supplementary Hero Raw Stats */}
            <div className="flex items-center gap-2 md:gap-3 text-[8.5px] md:text-[9.5px] font-black tracking-tight text-slate-400 bg-slate-900/60 border border-white/5 rounded px-2.5 py-1 justify-between lg:justify-start w-full lg:w-auto overflow-x-auto lg:overflow-x-visible shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)] whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {/* HP Regen */}
              <div className="flex items-center gap-0.5 text-rose-400 shrink-0" title={language === 'it' ? 'Rigenerazione HP al secondo' : 'HP Regen per second'}>
                <span className="text-[10px]">❤️</span>
                <span>{hpRegenPerSec}/s</span>
              </div>
              
              {/* Mana Regen */}
              <div className="flex items-center gap-0.5 text-cyan-400 shrink-0" title={language === 'it' ? 'Rigenerazione Mana al secondo (Boost)' : 'Mana Regen per second (Boost)'}>
                <span className="text-[10px]">⚡</span>
                <span>{manaRegenPerSec}/s{mpRegenBoost > 0 ? ` (+${mpRegenBoost}%)` : ''}</span>
              </div>

              {/* Defense */}
              <div className="flex items-center gap-0.5 text-slate-300 shrink-0" title={language === 'it' ? 'Difesa' : 'Defense'}>
                <span className="text-[10px]">🛡️</span>
                <span>{defense}</span>
              </div>

              {/* Critical Rate */}
              <div className="flex items-center gap-0.5 text-amber-500 shrink-0" title={language === 'it' ? 'Probabilità di colpo critico' : 'Critical hit chance'}>
                <span className="text-[10px]">🎯</span>
                <span>{critPercent}%</span>
              </div>

              {/* Cooldown Reduction (CDR) */}
              {cdrPercent > 0 && (
                <div className="flex items-center gap-0.5 text-purple-400 shrink-0" title={language === 'it' ? 'Riduzione tempo di ricarica' : 'Cooldown reduction'}>
                  <span className="text-[10px]">⏳</span>
                  <span>{cdrPercent}%</span>
                </div>
              )}

              {/* Attack Speed (AS) */}
              {asPercent > 0 && (
                <div className="flex items-center gap-0.5 text-emerald-400 shrink-0" title={language === 'it' ? 'Velocità Attacco Fisico' : 'Attack speed bonus'}>
                  <span className="text-[10px]">⚔️</span>
                  <span>+{asPercent}%</span>
                </div>
              )}
            </div>

            {/* Stats Flex Container */}
            <div className="hidden lg:flex items-center gap-4 shrink-0">
              <StatItem icon={Coins} value={gold} colorClass="text-yellow-400" tooltip="Gold collected" />
              <StatItem icon={Skull} value={kills} colorClass="text-red-500" tooltip={language === 'it' ? "Nemici eliminati (Apri Bestiario)" : "Enemies vanquished (Open Bestiary)"} onClick={onOpenBestiary} />
              <StatItem icon={Sword} value={strength} colorClass="text-pink-400" tooltip="Hero Strength" />
            </div>
          </div>

          {/* Desktop Weapons View */}
          {!isMobile && (
            <div className="hidden lg:flex gap-4 shrink-0">
              <div className="flex flex-col items-end border-r border-white/5 pr-4">
                <div className="text-[8px] text-pink-400 uppercase font-black" title="Physical Weapon">PHYSICAL L.{physicalWeaponLevel}</div>
                <div className={`text-[10px] font-bold uppercase whitespace-nowrap ${getRarityColor(physicalWeaponRarity)}`}>{physicalWeaponName}</div>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-[8px] text-cyan-400 uppercase font-black" title="Magic Weapon">MAGIC L.{magicWeaponLevel}</div>
                <div className={`text-[10px] font-bold uppercase whitespace-nowrap ${getRarityColor(magicWeaponRarity)}`}>{magicWeaponName}</div>
              </div>
            </div>
          )}

          {/* Skill Points Button */}
          {skillPoints > 0 && onOpenSkills && (
            <button 
              onClick={onOpenSkills}
              className="pointer-events-auto bg-yellow-500 text-black px-2 md:px-3 py-1 rounded text-[8px] md:text-[10px] font-black uppercase tracking-wider md:tracking-widest shadow-[0_0_15px_rgba(234,179,8,0.4)] animate-bounce shrink-0 whitespace-nowrap"
            >
              {skillPoints} {language === 'it' ? (isMobile ? 'PUNTI' : 'PUNTI ABILITÀ') : (isMobile ? 'SP' : 'SKILL PT')}
            </button>
          )}
        </div>
      </div>

      {/* Global Progress Bar (EXP) - Sits right under the main bar */}
      <div className="w-full h-4 md:h-5 bg-slate-950 border-b border-emerald-500/40 relative overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
        <motion.div 
          animate={{ width: `${expPerc}%` }}
          className="h-full bg-gradient-to-r from-emerald-600 via-green-400 to-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] md:text-xs font-black text-white mix-blend-difference tracking-[0.2em]">
            {Math.floor(exp)} / {nextExp}
          </span>
        </div>
      </div>

      {/* Mobile Bottom Bar for Weapons */}
      {isMobile && (
        <div className="bg-slate-950/90 backdrop-blur-xl border-b border-white/10 py-1.5 px-3 flex justify-center gap-8 pointer-events-none shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-2">
              <Sword className="w-3.5 h-3.5 text-pink-400 drop-shadow-[0_0_5px_rgba(236,72,153,0.5)] animate-pulse" />
              <div className="flex flex-col leading-none">
                <span className="text-[9px] text-pink-300 font-black tracking-tighter">LV.{physicalWeaponLevel}</span>
                <span className={`text-[10px] font-bold ${getRarityColor(physicalWeaponRarity)} whitespace-nowrap`}>{physicalWeaponName}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)] animate-pulse" />
              <div className="flex flex-col leading-none">
                <span className="text-[9px] text-cyan-300 font-black tracking-tighter">LV.{magicWeaponLevel}</span>
                <span className={`text-[10px] font-bold ${getRarityColor(magicWeaponRarity)} whitespace-nowrap`}>{magicWeaponName}</span>
              </div>
            </div>
        </div>
      )}
    </div>
  );
}
