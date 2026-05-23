import React, { useState, useEffect } from 'react';
import { globalAudio } from '../game/audio';
import MenuBackground from './MenuBackground';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Play, Shield, Sword, Wand2, ChevronLeft, Volume2, VolumeX, Keyboard, Gamepad2, Monitor, Save, Trash2 } from 'lucide-react';

export type HeroClass = 'warrior' | 'mage' | 'paladin';
export interface GameSettings {
    language: 'it' | 'en';
    audio: boolean;
    musicVolume: number;
    sfxVolume: number;
    fps: 30 | 60 | 90 | 120;
    controlMode: 'keyboard' | 'gamepad';
    seed?: string;
    startLevel?: number;
    difficulty: number;
    showFps: boolean;
    scanlines: boolean;
    keys: {
        up: string;
        down: string;
        left: string;
        right: string;
        fire1: string;
        fire2: string;
    };
}

const CyberButton = ({ children, onClick, active = false, className = "", variant = "cyan" }: any) => {
    const colors: any = {
        cyan: "from-cyan-500 to-blue-600 border-cyan-400 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.5)]",
        pink: "from-pink-500 to-purple-600 border-pink-400 group-hover:shadow-[0_0_15px_rgba(236,72,153,0.5)]",
        gray: "from-slate-700 to-slate-950 border-slate-600"
    };

    return (
        <button 
            type="button"
            onClick={onClick}
            className={`group relative px-6 py-3 select-none ${className}`}
        >
            {/* Decorative and backgrounds that scale visual-only when clicked */}
            <div className="absolute inset-0 pointer-events-none group-active:scale-95 transition-transform duration-100 ease-out">
                <div className={`absolute inset-0 bg-gradient-to-br opacity-20 group-hover:opacity-45 transition-all rounded-sm ${colors[variant]}`} />
                {/* Corner Accents */}
                <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 ${active ? 'border-white' : 'border-slate-700 group-hover:border-white'}`} />
                <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 ${active ? 'border-white' : 'border-slate-700 group-hover:border-white'}`} />
            </div>

            {/* Content text/icons that scale visual-only and let events click through */}
            <div className={`relative z-10 font-mono tracking-[0.2em] font-black italic flex items-center justify-center gap-3 pointer-events-none group-active:scale-95 transition-transform duration-100 ease-out ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                {children}
            </div>
        </button>
    );
}

export default function StartScreen({ onStart, onContinue, onLoadSlot }: { onStart: (settings: GameSettings, hero: HeroClass) => void, onContinue?: () => void, onLoadSlot?: (saveData: any) => void }) {
  const [view, setView] = useState<'main' | 'options' | 'controls' | 'heroSelection' | 'customDungeon' | 'slots'>('main');
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [isInterrupted, setIsInterrupted] = useState(false);

  useEffect(() => {
    setHasSavedGame(!!localStorage.getItem('player_stats'));
    setIsInterrupted(localStorage.getItem('game_interrupted') === 'true');
  }, []);
  const [customSeed, setCustomSeed] = useState('');
  const [customLevel, setCustomLevel] = useState(1);
  const [suggestedSeed, setSuggestedSeed] = useState(() => (Math.random().toString(36).substring(2, 6) + "-" + Math.random().toString(36).substring(2, 6)).toUpperCase());
  const [settings, setSettings] = useState<GameSettings>(() => {
      const saved = localStorage.getItem('neonDungeonSettings');
      const defaults: GameSettings = {
          language: 'it',
          audio: true,
          musicVolume: 0.5,
          sfxVolume: 0.8,
          fps: 60,
          controlMode: 'keyboard',
          difficulty: 3,
          showFps: false,
          scanlines: true,
          keys: {
              up: 'w',
              down: 's',
              left: 'a',
              right: 'd',
              fire1: 'z',
              fire2: 'x'
          }
      };
      if (!saved) return defaults;
      try {
          const parsed = JSON.parse(saved);
          return {
              ...defaults,
              ...parsed,
              showFps: parsed.showFps !== undefined ? !!parsed.showFps : defaults.showFps,
              scanlines: parsed.scanlines !== undefined ? !!parsed.scanlines : defaults.scanlines,
              // Ensure volumes are finite numbers
              musicVolume: typeof parsed.musicVolume === 'number' && Number.isFinite(parsed.musicVolume) ? parsed.musicVolume : defaults.musicVolume,
              sfxVolume: typeof parsed.sfxVolume === 'number' && Number.isFinite(parsed.sfxVolume) ? parsed.sfxVolume : defaults.sfxVolume,
              keys: { ...defaults.keys, ...(parsed.keys || {}) }
          };
      } catch (e) {
          return defaults;
      }
  });

  const refreshSuggestedSeed = () => {
    const newSeed = (Math.random().toString(36).substring(2, 6) + "-" + Math.random().toString(36).substring(2, 6)).toUpperCase();
    setSuggestedSeed(newSeed);
    setCustomSeed(newSeed);
  };

  const HEROES: { id: 'warrior' | 'mage' | 'paladin', name: string, stats: any, desc: string, icon: any }[] = [
      { id: 'warrior', name: 'Guerriero', desc: 'Inizia con Spada del Destino (AoE & Knockback)', stats: { hp: 150, str: 8, critChance: 0.1 }, icon: <Sword className="w-8 h-8" /> },
      { id: 'mage', name: 'Mago', desc: 'Inizia con Bacchetta Bastarda e Spada Base', stats: { hp: 80, str: 4, critChance: 0.05 }, icon: <Wand2 className="w-8 h-8" /> },
      { id: 'paladin', name: 'Paladino', desc: 'Inizia con Martello Santificatore (Life Steal & Holy AoE)', stats: { hp: 120, str: 6, critChance: 0.07 }, icon: <Shield className="w-8 h-8" /> }
  ];

  useEffect(() => {
      localStorage.setItem('neonDungeonSettings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
      if (settings.audio) {
          globalAudio.musicVolume = settings.musicVolume;
          globalAudio.sfxVolume = settings.sfxVolume;
          globalAudio.init();
          globalAudio.playBackgroundMusic('menu');
      }
      return () => {
          // No longer stopping here if we want a seamless transition?
          // Actually, the user wants the dungeon music to start correctly.
          // If we stop here, AnimatePresence wait will ensure it's silent before GameCanvas starts.
          globalAudio.stopBackgroundMusic();
      };
  }, []);

  const [editingKey, setEditingKey] = useState<keyof GameSettings['keys'] | null>(null);

  const handleStartFinalize = (heroId: HeroClass) => {
      if (settings.audio) {
          globalAudio.musicVolume = settings.musicVolume;
          globalAudio.sfxVolume = settings.sfxVolume;
          globalAudio.init();
          if (globalAudio.ctx?.state === 'suspended') {
              globalAudio.ctx.resume();
          }
          // Explicitly stop menu music before transitioning
          globalAudio.stopBackgroundMusic();
      }
      onStart({
          ...settings,
          seed: customSeed || undefined,
          startLevel: customLevel
      }, heroId);
  };
    
  if (view === 'heroSelection') {
      return (
          <div className="absolute inset-0 z-50 flex flex-col items-center bg-slate-950 text-cyan-400 font-mono overflow-y-auto outline-none py-12 px-6">
              <MenuBackground />
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 flex flex-col items-center max-w-5xl w-full"
              >
                  <h2 className="text-3xl sm:text-5xl font-black italic tracking-tighter mb-10 sm:mb-16 text-white text-center">
                    SELECT YOUR <span className="text-pink-500">AVATAR</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-12">
                      {HEROES.map((hero, idx) => (
                          <motion.button
                            key={hero.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`group relative p-6 sm:p-8 border-2 transition-all flex flex-col items-center gap-4 sm:gap-6 cursor-pointer text-left w-full border-slate-800 bg-slate-900/50 hover:border-pink-500 hover:bg-pink-500/10 hover:shadow-[0_0_30px_rgba(236,72,153,0.3)]`}
                            onClick={() => handleStartFinalize(hero.id)}
                            type="button"
                          >
                              <div className={`p-4 rounded-full border-2 pointer-events-none border-slate-700 text-slate-500 group-hover:text-pink-500 group-hover:border-pink-500`}>
                                  {hero.icon}
                              </div>
                              <div className="text-center pointer-events-none w-full">
                                  <div className="text-2xl font-black italic text-white uppercase tracking-widest">{hero.name}</div>
                                  <div className="text-[10px] uppercase text-slate-500 font-bold mb-4">{hero.desc}</div>
                                  
                                  <div className="space-y-2 w-full">
                                      <div className="flex justify-between items-center text-xs">
                                          <span className="text-slate-500">HP</span>
                                          <span className="text-red-400 font-bold">{hero.stats.hp}</span>
                                      </div>
                                      <div className="h-1 bg-slate-800 w-full rounded-full overflow-hidden">
                                          <div className="h-full bg-red-500" style={{ width: `${(hero.stats.hp / 150) * 100}%` }} />
                                      </div>
                                      <div className="flex justify-between items-center text-xs">
                                          <span className="text-slate-500">STR</span>
                                          <span className="text-cyan-400 font-bold">{hero.stats.str}</span>
                                      </div>
                                      <div className="h-1 bg-slate-800 w-full rounded-full overflow-hidden">
                                          <div className="h-full bg-cyan-500" style={{ width: `${(hero.stats.str / 10) * 100}%` }} />
                                      </div>
                                  </div>
                              </div>
                          </motion.button>
                      ))}
                  </div>
                  
                  <button onClick={() => setView('main')} className="mb-12 text-slate-500 hover:text-white flex items-center gap-2 tracking-widest uppercase font-bold text-xs group transition-colors">
                     <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> {settings.language === 'it' ? 'INDIETRO' : 'BACK'}
                  </button>
              </motion.div>
          </div>
      );
  }

  const handleKeyCapture = (e: React.KeyboardEvent) => {
      if (!editingKey) return;
      e.preventDefault();
      setSettings({
          ...settings,
          keys: {
              ...settings.keys,
              [editingKey]: e.key
          }
      });
      setEditingKey(null);
  };

    if (view === 'controls') {
        return (
            <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black backdrop-blur-xl text-cyan-400 font-mono overflow-y-auto py-12 px-6" onKeyDown={handleKeyCapture} tabIndex={0}>
                <MenuBackground />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative z-10 flex flex-col items-center w-full max-w-2xl p-10 bg-slate-900/50 border border-slate-800 rounded-3xl"
                >
                     <h2 className="text-4xl font-black italic mb-8 text-white flex items-center gap-4">
                         <Keyboard className="w-8 h-8 text-cyan-500" />
                         {settings.language === 'it' ? 'CONTROLLI' : 'CONTROLS'}
                     </h2>
  
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-10">
                        {/* Keyboard Section */}
                        <div className="space-y-3">
                            <div className="text-[10px] text-pink-500 font-black tracking-widest uppercase mb-4 flex items-center gap-2">
                                <Keyboard className="w-4 h-4" /> Keyboard & Mouse
                            </div>
                            {(Object.entries(settings.keys) as [keyof GameSettings['keys'], string][]).map(([action, key]) => (
                                <div key={action} className="group flex justify-between items-center p-3 border border-slate-800 hover:border-cyan-500/50 rounded-xl bg-slate-950 transition-all">
                                    <span className="capitalize text-[10px] font-bold text-slate-400 group-hover:text-white tracking-widest italic">{action}</span>
                                    <button 
                                        onClick={() => setEditingKey(action)}
                                        className={`px-4 py-2 rounded-lg min-w-[80px] text-center font-black italic tracking-widest transition-all text-xs ${editingKey === action ? 'bg-pink-600 text-white animate-pulse shadow-[0_0_20px_rgba(219,39,119,0.5)]' : 'bg-slate-900 text-cyan-500 hover:bg-slate-800'}`}
                                    >
                                        {editingKey === action ? '???' : key.toUpperCase()}
                                    </button>
                                </div>
                            ))}
                            <div className="flex justify-between items-center p-3 border border-slate-800 rounded-xl bg-slate-950 opacity-60">
                                <span className="capitalize text-[10px] font-bold text-slate-400 tracking-widest italic">Dash</span>
                                <span className="px-4 py-2 text-center font-black italic tracking-widest text-xs text-white">SHIFT / SPACE</span>
                            </div>
                        </div>

                        {/* Gamepad Section */}
                        <div className="space-y-3">
                            <div className="text-[10px] text-cyan-500 font-black tracking-widest uppercase mb-4 flex items-center gap-2">
                                <Gamepad2 className="w-4 h-4" /> Gamepad Protocol
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center p-3 border border-slate-800 rounded-xl bg-slate-950/40">
                                    <span className="text-[10px] font-bold text-slate-400 tracking-widest italic">Movement</span>
                                    <span className="text-[10px] font-black text-cyan-500 uppercase">Left Stick / D-Pad</span>
                                </div>
                                <div className="flex justify-between items-center p-3 border border-slate-800 rounded-xl bg-slate-950/40">
                                    <span className="text-[10px] font-bold text-slate-400 tracking-widest italic">Aiming</span>
                                    <span className="text-[10px] font-black text-cyan-500 uppercase">Right Stick (360°)</span>
                                </div>
                                <div className="flex justify-between items-center p-3 border border-slate-800 rounded-xl bg-slate-950/40">
                                    <span className="text-[10px] font-bold text-slate-400 tracking-widest italic">Physical Attack</span>
                                    <span className="text-[10px] font-black text-white uppercase bg-cyan-600 px-2 py-1 rounded">A Button</span>
                                </div>
                                <div className="flex justify-between items-center p-3 border border-slate-800 rounded-xl bg-slate-950/40">
                                    <span className="text-[10px] font-bold text-slate-400 tracking-widest italic">Magic Attack</span>
                                    <span className="text-[10px] font-black text-white uppercase bg-blue-600 px-2 py-1 rounded">X Button</span>
                                </div>
                                <div className="flex justify-between items-center p-3 border border-slate-800 rounded-xl bg-slate-950/40">
                                    <span className="text-[10px] font-bold text-slate-400 tracking-widest italic">Dash / Evade</span>
                                    <span className="text-[10px] font-black text-white uppercase bg-red-600 px-2 py-1 rounded">B / RB</span>
                                </div>
                                <div className="flex justify-between items-center p-3 border border-slate-800 rounded-xl bg-slate-950/40">
                                    <span className="text-[10px] font-bold text-slate-400 tracking-widest italic">Pause</span>
                                    <span className="text-[10px] font-black text-slate-300 uppercase">Start</span>
                                </div>
                                <div className="flex justify-between items-center p-3 border border-slate-800 rounded-xl bg-slate-950/40">
                                    <span className="text-[10px] font-bold text-slate-400 tracking-widest italic">Switch Tab</span>
                                    <span className="text-[10px] font-black text-slate-300 uppercase">LB / RB</span>
                                </div>
                            </div>
                        </div>
                     </div>
  
                     <div className="flex flex-col sm:flex-row gap-4 w-full">
                          <button 
                              onClick={() => setSettings({
                                  ...settings, 
                                  keys: { up: 'w', down: 's', left: 'a', right: 'd', fire1: 'z', fire2: 'x' }
                              })}
                              className="flex-1 py-3 text-[10px] font-black text-slate-600 hover:text-white uppercase tracking-widest border border-slate-800 rounded-xl transition-all"
                          >
                              {settings.language === 'it' ? 'RESET DEFAULTS' : 'RESET DEFAULTS'}
                          </button>
  
                          <button
                              onClick={() => setView('options')}
                              className="flex-2 px-12 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-black italic tracking-widest rounded-xl shadow-[0_0_20px_rgba(8,145,178,0.3)] transition-all"
                          >
                              {settings.language === 'it' ? 'CONFERMA' : 'UPDATE'}
                          </button>
                     </div>
                </motion.div>
            </div>
        );
    }

  if (view === 'options') {
      return (
          <div className="absolute inset-0 z-50 flex flex-col items-center bg-slate-950 font-mono overflow-y-auto py-12 px-6">
              <MenuBackground />
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative z-10 flex flex-col items-center w-full max-w-lg p-6 sm:p-10 bg-slate-900/40 border border-slate-800/50 rounded-3xl"
              >
                  <h2 className="text-3xl sm:text-5xl font-black italic mb-10 text-white tracking-tighter text-center">
                      <Settings className="w-8 h-8 sm:w-10 sm:h-10 inline-block mr-4 text-pink-500" />
                      {settings.language === 'it' ? 'OPZIONI' : 'OPTIONS'}
                  </h2>
                  
                  <div className="flex flex-col gap-8 sm:gap-10 w-full">
                      {/* Language */}
                      <div className="flex flex-col gap-3">
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black italic">Display Language</div>
                          <div className="flex gap-2">
                             <CyberButton active={settings.language === 'it'} onClick={() => setSettings({...settings, language: 'it'})} className="flex-1 py-4 sm:py-3">IT</CyberButton>
                             <CyberButton active={settings.language === 'en'} onClick={() => setSettings({...settings, language: 'en'})} className="flex-1 py-4 sm:py-3">EN</CyberButton>
                          </div>
                      </div>
                      
                      {/* Audio */}
                      <div className="flex flex-col gap-3">
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black italic">Audio Feedback</div>
                          <div className="flex gap-2 mb-2">
                             <CyberButton active={settings.audio} onClick={() => {
                                 setSettings({...settings, audio: true});
                                 globalAudio.enabled = true;
                             }} className="flex-1 py-4 sm:py-3">
                                <Volume2 className="w-4 h-4" /> ON
                             </CyberButton>
                             <CyberButton active={!settings.audio} onClick={() => {
                                 setSettings({...settings, audio: false});
                                 globalAudio.enabled = false;
                                 globalAudio.stopBackgroundMusic();
                             }} className="flex-1 py-4 sm:py-3">
                                <VolumeX className="w-4 h-4" /> OFF
                             </CyberButton>
                          </div>

                          {settings.audio && (
                              <div className="space-y-4 pt-2 border-t border-slate-800">
                                  <div className="space-y-2">
                                      <div className="flex justify-between text-[10px] text-slate-500 uppercase font-black tracking-widest">
                                          <span>Music Volume</span>
                                          <span className="text-pink-500">{Math.round(settings.musicVolume * 100)}%</span>
                                      </div>
                                      <input 
                                          type="range" min="0" max="1" step="0.01" 
                                          value={settings.musicVolume}
                                          onChange={(e) => {
                                              const v = parseFloat(e.target.value);
                                              setSettings({...settings, musicVolume: v});
                                              globalAudio.setMusicVolume(v);
                                          }}
                                          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                      />
                                  </div>
                                  <div className="space-y-2">
                                      <div className="flex justify-between text-[10px] text-slate-500 uppercase font-black tracking-widest">
                                          <span>SFX Volume</span>
                                          <span className="text-cyan-500">{Math.round(settings.sfxVolume * 100)}%</span>
                                      </div>
                                      <input 
                                          type="range" min="0" max="1" step="0.01" 
                                          value={settings.sfxVolume}
                                          onChange={(e) => {
                                              const v = parseFloat(e.target.value);
                                              setSettings({...settings, sfxVolume: v});
                                              globalAudio.setSfxVolume(v);
                                          }}
                                          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                      />
                                  </div>
                              </div>
                          )}
                      </div>

                      {/* Input Mode */}
                      <div className="flex flex-col gap-3">
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black italic">Input Protocol</div>
                          <div className="flex gap-2">
                             <CyberButton active={settings.controlMode === 'keyboard'} onClick={() => setSettings({...settings, controlMode: 'keyboard'})} className="flex-1 py-4 sm:py-3">
                                <Monitor className="w-4 h-4" /> KB
                             </CyberButton>
                             <CyberButton active={settings.controlMode === 'gamepad'} onClick={() => setSettings({...settings, controlMode: 'gamepad'})} className="flex-1 py-4 sm:py-3">
                                <Gamepad2 className="w-4 h-4" /> PAD
                             </CyberButton>
                          </div>
                      </div>

                      <button 
                          onClick={() => setView('controls')}
                          className="group relative w-full py-5 sm:py-4 bg-slate-950 border border-cyan-500/30 rounded-xl overflow-hidden"
                      >
                          <div className="absolute inset-0 bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-colors" />
                          <span className="relative z-10 text-[10px] sm:text-xs font-black italic tracking-widest text-cyan-400 group-hover:text-cyan-300">CUSTOMIZE KEYBINDINGS</span>
                      </button>
                      
                      <div className="flex flex-col gap-3">
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black italic">{settings.language === 'it' ? 'Difficoltà' : 'Difficulty'}</div>
                          <div className="relative">
                            <select 
                                className="w-full py-4 px-4 bg-slate-950 border border-cyan-500/30 rounded-xl outline-none text-cyan-400 font-black italic cursor-pointer appearance-none uppercase text-center text-sm"
                                value={settings.difficulty || 3}
                                onChange={(e) => setSettings({...settings, difficulty: Number(e.target.value)})}
                            >
                                <option value={1} className="bg-slate-900">Novellino</option>
                                <option value={2} className="bg-slate-900">Facile</option>
                                <option value={3} className="bg-slate-900">Normale</option>
                                <option value={4} className="bg-slate-900">Difficile</option>
                                <option value={5} className="bg-slate-900">Esperto</option>
                                <option value={6} className="bg-slate-900">Incubo</option>
                                <option value={7} className="bg-slate-900">Inferno</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <ChevronLeft className="w-4 h-4 text-cyan-500 rotate-[270deg]" />
                            </div>
                          </div>
                      </div>

                      {/* FPS */}
                      <div className="flex flex-col gap-3">
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black italic">Monitor Refresh Rate</div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {[30, 60, 90, 120].map(fps => (
                                  <CyberButton key={fps} active={settings.fps === fps} onClick={() => setSettings({...settings, fps: fps as 30|60|90|120})} className="w-full py-4 sm:py-3">{fps}</CyberButton>
                              ))}
                          </div>
                      </div>

                      {/* SHOW FPS TOGGLE */}
                      <div className="flex flex-col gap-3">
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black italic">
                              {settings.language === 'it' ? 'Mostra FPS' : 'Show FPS'}
                          </div>
                          <div className="flex gap-2">
                             <CyberButton active={settings.showFps} onClick={() => setSettings({...settings, showFps: true})} className="flex-1 py-4 sm:py-3">
                                {settings.language === 'it' ? 'ATTIVO' : 'SHOW'}
                             </CyberButton>
                             <CyberButton active={!settings.showFps} onClick={() => setSettings({...settings, showFps: false})} className="flex-1 py-4 sm:py-3">
                                {settings.language === 'it' ? 'DISATTIVATO' : 'HIDE'}
                             </CyberButton>
                          </div>
                      </div>

                      {/* SCANLINES TOGGLE */}
                      <div className="flex flex-col gap-3">
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black italic">
                              {settings.language === 'it' ? 'Scanline Overlay' : 'Scanline Overlay'}
                          </div>
                          <div className="flex gap-2">
                             <CyberButton active={settings.scanlines} onClick={() => setSettings({...settings, scanlines: true})} className="flex-1 py-4 sm:py-3">
                                {settings.language === 'it' ? 'ATTIVO' : 'ENABLED'}
                             </CyberButton>
                             <CyberButton active={!settings.scanlines} onClick={() => setSettings({...settings, scanlines: false})} className="flex-1 py-4 sm:py-3">
                                {settings.language === 'it' ? 'SPENTO' : 'DISABLED'}
                             </CyberButton>
                          </div>
                      </div>
                  </div>

                  <button
                      onClick={() => setView('main')}
                      className="mt-12 sm:mt-16 text-xs font-black tracking-widest text-slate-500 hover:text-white transition-all uppercase flex items-center gap-2 mb-8"
                  >
                      <ChevronLeft className="w-4 h-4" /> {settings.language === 'it' ? 'INDIETRO' : 'BACK'}
                  </button>
              </motion.div>
          </div>
      );
  }

  if (view === 'customDungeon') {
      return (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 font-mono p-4">
              <MenuBackground />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 flex flex-col items-center w-full max-w-md p-6 sm:p-8 bg-slate-900 border border-pink-500/30 rounded-2xl"
              >
                  <h2 className="text-2xl sm:text-3xl font-black italic mb-6 sm:mb-8 text-white uppercase tracking-tighter text-center">
                      Mission <span className="text-pink-500">Parameters</span>
                  </h2>

                  <div className="w-full space-y-6">
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center flex-wrap gap-2">
                                <label className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-black tracking-widest">Dungeon Seed</label>
                                <button 
                                    onClick={refreshSuggestedSeed}
                                    className="text-[8px] sm:text-[9px] text-cyan-500 hover:text-white font-black underline decoration-cyan-500/30 transition-all"
                                >
                                    GENERATE NEW
                                </button>
                            </div>
                            <input 
                                type="text" 
                                value={customSeed}
                                onChange={(e) => setCustomSeed(e.target.value)}
                                placeholder="Random Seed..."
                                className="w-full bg-black border border-slate-800 p-3 rounded-lg text-cyan-400 font-bold focus:border-cyan-500 outline-none transition-all placeholder:text-slate-700 text-sm"
                            />
                            <div className="text-[8px] text-slate-600 italic">Current Suggested: {suggestedSeed}</div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-black tracking-widest">Infiltration Depth</label>
                                <div className="flex items-center gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setCustomLevel(Math.max(1, customLevel - 1))}
                                        className="w-11 h-11 flex items-center justify-center bg-slate-800 text-white rounded-lg hover:bg-cyan-600 active:bg-cyan-700 transition-colors font-black text-lg select-none"
                                    >-</button>
                                    <span className="text-pink-500 font-black italic w-14 sm:w-16 text-center text-sm">LV {customLevel}</span>
                                    <button 
                                        type="button"
                                        onClick={() => setCustomLevel(Math.min(1000, customLevel + 1))}
                                        className="w-11 h-11 flex items-center justify-center bg-slate-800 text-white rounded-lg hover:bg-cyan-600 active:bg-cyan-700 transition-colors font-black text-lg select-none"
                                    >+</button>
                                </div>
                            </div>
                            <input 
                                type="range" 
                                min="1" 
                                max="1000" 
                                value={customLevel}
                                onChange={(e) => setCustomLevel(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                            />
                        </div>
                      </div>

                      {customSeed.trim().length > 0 ? (
                        <motion.button 
                            type="button"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            onClick={() => setView('heroSelection')}
                            className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-700 text-white font-black italic tracking-[0.25em] rounded-xl shadow-[0_0_30px_rgba(236,72,153,0.5)] border border-pink-400 animate-pulse active:brightness-110 active:opacity-95 transition-all text-sm select-none"
                        >
                            {settings.language === 'it' ? 'INIZIA MISSIONE' : 'START MISSION'}
                        </motion.button>
                      ) : (
                        <button 
                            disabled
                            className="w-full py-4 bg-slate-800 text-slate-600 font-black italic tracking-widest rounded-xl opacity-50 cursor-not-allowed border border-slate-700 text-sm"
                        >
                            {settings.language === 'it' ? 'INSERIRE SEED' : 'ENTER SEED'}
                        </button>
                      )}

                      <div className="flex gap-4">
                        <button 
                            onClick={() => setView('main')}
                            className="flex-1 py-3 text-[10px] text-slate-500 hover:text-white font-black uppercase tracking-widest border border-slate-800 rounded-xl transition-all"
                        >
                            {settings.language === 'it' ? 'ANNULLA' : 'CANCEL'}
                        </button>

                        <button 
                            onClick={() => { setCustomSeed(''); setCustomLevel(1); }}
                            className="flex-1 py-3 text-[10px] text-slate-500 hover:text-white font-black uppercase tracking-widest border border-slate-800 rounded-xl transition-all"
                        >
                            {settings.language === 'it' ? 'RESET' : 'RESET'}
                        </button>
                      </div>
                  </div>
              </motion.div>
          </div>
      );
  }

  if (view === 'slots') {
      return (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 font-mono p-4">
              <MenuBackground />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 flex flex-col items-center w-full max-w-2xl p-6 sm:p-8 bg-slate-900 border border-cyan-500/30 rounded-2xl"
              >
                  <h2 className="text-2xl sm:text-3xl font-black italic mb-6 text-white uppercase tracking-tighter text-center flex items-center justify-center gap-3">
                      <Save className="w-6 h-6 text-cyan-400" />
                      {settings.language === 'it' ? 'Carica Salvataggio' : 'Load Save Game'}
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full max-h-[350px] overflow-y-auto pr-1">
                      {Array.from({ length: 9 }, (_, i) => {
                          const slotNum = i + 1;
                          const slotKey = `neon_dungeon_slot_${slotNum}`;
                          const raw = localStorage.getItem(slotKey);
                          let slotData = null;
                          if (raw) {
                              try { slotData = JSON.parse(raw); } catch(e){}
                          }

                          return (
                              <div 
                                  key={slotNum} 
                                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 ${
                                      slotData 
                                          ? 'bg-slate-950/80 border-cyan-500/30 hover:border-cyan-500/60' 
                                          : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                                  }`}
                              >
                                  <div className="flex justify-between items-center mb-1">
                                      <span className="text-[10px] uppercase font-black tracking-widest text-cyan-400">
                                          SLOT {slotNum}
                                      </span>
                                      {slotData && (
                                          <span className="text-[8px] text-slate-500 font-bold truncate max-w-[125px]">
                                              {new Date(slotData.timestamp).toLocaleDateString(settings.language === 'it' ? 'it-IT' : 'en-US')}
                                          </span>
                                      )}
                                  </div>

                                  {slotData ? (
                                      <div className="flex flex-col gap-1 text-[9px] text-slate-300 font-mono mb-3 bg-slate-900/60 p-2 rounded border border-slate-850">
                                          <div className="flex justify-between text-[11px]">
                                              <span className="text-pink-400 font-bold uppercase">{slotData.heroClass}</span>
                                              <span className="text-yellow-400">LV {slotData.stats.lvl}</span>
                                          </div>
                                          <div className="flex justify-between text-[8px] text-slate-400">
                                              <span>DUNGEON L {slotData.stats.dungeonLevel}</span>
                                              <span className="text-yellow-500 font-bold">{slotData.stats.gold} G</span>
                                          </div>
                                          <div className="text-[8px] text-cyan-400 truncate mt-1">
                                              ⚔️ {slotData.stats.physicalWeapon || (settings.language === 'it' ? 'Spada Base' : 'Base Sword')}
                                          </div>
                                      </div>
                                  ) : (
                                      <div className="text-center text-[10px] text-slate-600 font-bold italic uppercase my-6 py-2">
                                          --- {settings.language === 'it' ? 'VUOTO' : 'EMPTY'} ---
                                      </div>
                                  )}

                                  <div className="flex gap-1.5 mt-auto">
                                      {slotData ? (
                                          <>
                                              <button
                                                  onClick={() => {
                                                      if (onLoadSlot) {
                                                          onLoadSlot(slotData);
                                                      } else {
                                                          localStorage.setItem('player_stats', JSON.stringify(slotData.stats));
                                                          localStorage.setItem('player_hero_class', slotData.heroClass);
                                                          localStorage.setItem('neonDungeonSettings', JSON.stringify(slotData.settings));
                                                          window.location.reload();
                                                      }
                                                  }}
                                                  className="flex-1 py-1.5 px-2 bg-pink-950/40 hover:bg-pink-900/20 border border-pink-700/50 hover:border-pink-400 rounded text-[10px] font-bold text-pink-400 transition-all text-center flex items-center justify-center cursor-pointer"
                                              >
                                                  {settings.language === 'it' ? 'CARICA' : 'LOAD'}
                                              </button>
                                              <button
                                                  onClick={() => {
                                                      if (confirm(settings.language === 'it' ? `Eliminare il salvataggio nello Slot ${slotNum}?` : `Delete save in Slot ${slotNum}?`)) {
                                                          localStorage.removeItem(slotKey);
                                                          // force re-render by briefly toggling state
                                                          setView('main');
                                                          setTimeout(() => setView('slots'), 5);
                                                      }
                                                  }}
                                                  className="p-1.5 text-slate-500 hover:text-red-500 border border-transparent hover:border-red-950 rounded transition-all flex items-center justify-center cursor-pointer"
                                              >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                          </>
                                      ) : (
                                          <button
                                              disabled
                                              className="flex-1 py-1 px-2 bg-slate-950 border border-slate-900 rounded text-[9px] font-bold text-slate-600 cursor-not-allowed text-center"
                                          >
                                              {settings.language === 'it' ? 'VUOTO' : 'EMPTY'}
                                          </button>
                                      )}
                                  </div>
                              </div>
                          );
                      })}
                  </div>

                  <button
                      className="px-8 py-3 mt-6 text-slate-500 hover:text-white font-black italic uppercase tracking-widest border border-slate-800 hover:border-slate-500 rounded-xl transition-all text-xs cursor-pointer"
                      onClick={() => setView('main')}
                  >
                      {settings.language === 'it' ? 'INDIETRO' : 'BACK'}
                  </button>
              </motion.div>
          </div>
      );
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-cyan-400 overflow-hidden font-mono">
      <MenuBackground />
      <div className="relative z-10 flex flex-col items-center">
        <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative mb-24"
        >
            {/* Background Title Glow */}
            <div className="absolute inset-0 blur-3xl bg-cyan-600/20 rounded-full animate-pulse" />
            
            <h1 className="text-4xl sm:text-7xl lg:text-[10rem] font-black italic tracking-tighter leading-none select-none text-center">
                <span className="relative block text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                    NEON
                </span>
                <span className="relative block text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 to-blue-600 lg:ml-12 -mt-2 lg:-mt-4 drop-shadow-[0_0_20px_rgba(34,211,238,1)]">
                    DUNGEON
                </span>
            </h1>
            
            {/* Version Flag */}
            <div className="absolute -top-6 -right-4 lg:-top-4 lg:-right-12 px-3 py-1 bg-pink-600 text-white text-[8px] lg:text-[10px] font-black italic tracking-widest rounded-sm rotate-12 shadow-lg z-20">
                V2.1 PRO
            </div>
        </motion.div>

        <nav className="flex flex-col gap-4 w-full max-w-[280px] sm:max-w-xs px-4">
            {hasSavedGame && (
                <CyberButton 
                    onClick={onContinue}
                    variant="pink"
                    className="w-full py-4 lg:py-3 mb-2 text-xs"
                >
                    <Play className="w-5 h-5 fill-current animate-pulse text-pink-300" />
                    {isInterrupted 
                        ? (settings.language === 'it' ? 'CONTINUA PARTITA INTERROTTA' : 'RESUME INTERRUPTED GAME')
                        : (settings.language === 'it' ? 'CONTINUA' : 'CONTINUE')
                    }
                </CyberButton>
            )}
            <CyberButton 
                onClick={() => setView('heroSelection')}
                variant="cyan"
                className="w-full py-4 lg:py-3"
            >
                <Play className="w-5 h-5 fill-current" />
                {settings.language === 'it' ? 'ESPLORA' : 'DEPLOY'}
            </CyberButton>

            <CyberButton 
                onClick={() => setView('customDungeon')}
                variant="pink"
                className="w-full py-4 lg:py-3"
            >
                <Monitor className="w-5 h-5" />
                {settings.language === 'it' ? 'SCEGLI DUNGEON' : 'CHOOSE DUNGEON'}
            </CyberButton>

            <CyberButton 
                onClick={() => setView('slots')}
                variant="cyan"
                className="w-full py-4 lg:py-3"
            >
                <Save className="w-5 h-5" />
                {settings.language === 'it' ? 'CARICA SLOT' : 'LOAD SLOT'}
            </CyberButton>

            <CyberButton 
                onClick={() => setView('options')}
                variant="gray"
                className="w-full py-4 lg:py-3"
            >
                <Settings className="w-5 h-5" />
                {settings.language === 'it' ? 'SISTEMA' : 'SYSTEM'}
            </CyberButton>
        </nav>
        
        {/* Footer info */}
        <div className="absolute bottom-6 w-full px-4 text-[8px] sm:text-[10px] text-slate-700 tracking-[0.2em] sm:tracking-[0.3em] font-black italic flex flex-wrap justify-center gap-4 sm:gap-8">
            <span>NEON ENGINE V4.0</span>
            <span>SECURE LINK ESTABLISHED</span>
            <span className="hidden sm:inline">OS VERSION: 0xDEADBEEF</span>
        </div>
      </div>
    </div>
  );
}
