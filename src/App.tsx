/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import GameCanvas from './components/GameCanvas';
import StartScreen, { GameSettings, HeroClass } from './components/StartScreen';

export default function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [heroClass, setHeroClass] = useState<HeroClass>('warrior');

  const handleExit = () => {
    localStorage.removeItem('player_stats');
    setIsStarted(false);
    setSettings(null);
  };

  return (
    <div className="relative w-screen h-screen bg-gray-950 overflow-hidden text-cyan-400">
        <AnimatePresence mode="wait">
            {!isStarted || !settings ? (
                <motion.div 
                    key="start"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                >
                    <StartScreen 
                        onStart={(s, h) => {
                            localStorage.setItem('player_hero_class', h);
                            localStorage.removeItem('player_stats');
                            localStorage.removeItem('game_interrupted');
                            setSettings(s);
                            setHeroClass(h);
                            setIsStarted(true);
                        }}
                        onContinue={() => {
                            const savedSettings = localStorage.getItem('neonDungeonSettings');
                            if (savedSettings) setSettings(JSON.parse(savedSettings));
                            const savedHero = localStorage.getItem('player_hero_class') as HeroClass || 'warrior';
                            setHeroClass(savedHero);
                            setIsStarted(true);
                        }}
                        onLoadSlot={(slotData) => {
                            localStorage.setItem('player_stats', JSON.stringify(slotData.stats));
                            localStorage.setItem('player_hero_class', slotData.heroClass);
                            localStorage.setItem('neonDungeonSettings', JSON.stringify(slotData.settings));
                            // Also mark load as a clean interrupted game state to enable continuation
                            localStorage.setItem('game_interrupted', 'true');
                            setHeroClass(slotData.heroClass);
                            setSettings(slotData.settings);
                            setIsStarted(true);
                        }}
                    />
                </motion.div>
            ) : (
                <motion.div
                    key="game"
                    className="w-full h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <GameCanvas 
                        settings={settings} 
                        heroClass={heroClass} 
                        onExit={handleExit}
                        onLoadSlot={(slotData) => {
                            localStorage.setItem('player_stats', JSON.stringify(slotData.stats));
                            localStorage.setItem('player_hero_class', slotData.heroClass);
                            localStorage.setItem('neonDungeonSettings', JSON.stringify(slotData.settings));
                            localStorage.setItem('game_interrupted', 'true');
                            window.location.reload();
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
}
