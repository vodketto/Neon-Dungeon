export class AudioEngine {
  ctx: AudioContext | null = null;
  enabled: boolean = true;
  sfxVolume: number = 1.0;
  musicVolume: number = 0.5;
  private musicGain: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  private musicTimeout: NodeJS.Timeout | null = null;
  private activeTimeouts: NodeJS.Timeout[] = [];

  private addTimeout(cb: () => void, delay: number) {
    const t = setTimeout(() => {
        this.activeTimeouts = this.activeTimeouts.filter(x => x !== t);
        cb();
    }, delay);
    this.activeTimeouts.push(t);
    return t;
  }

  private clearAllTimeouts() {
    this.activeTimeouts.forEach(clearTimeout);
    this.activeTimeouts = [];
    if (this.musicTimeout) {
        clearTimeout(this.musicTimeout);
        this.musicTimeout = null;
    }
  }

  init() {
    if (!this.ctx) {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.sfxGainNode = this.ctx.createGain();
        this.sfxGainNode.gain.value = this.sfxVolume;
        this.sfxGainNode.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
        const resumeCtx = () => {
             this.ctx?.resume().then(() => {
                 // Only play if nothing else is playing and we have a valid track
                 if (!this.musicGain && this.currentTrackId) {
                    this.playBackgroundMusic();
                 }
             });
             window.removeEventListener('mousedown', resumeCtx);
             window.removeEventListener('keydown', resumeCtx);
        };
        window.addEventListener('mousedown', resumeCtx);
        window.addEventListener('keydown', resumeCtx);
    }
  }

  playDropSound(type: 'gold' | 'weapon' | 'potion' | 'item' | 'gem') {
    if (!this.ctx || !this.enabled || this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.sfxGainNode || this.ctx.destination);

    if (type === 'gold' || type === 'gem') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(988, now);
        osc.frequency.exponentialRampToValueAtTime(1319, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'weapon') {
        osc.type = 'sawtooth';
        [261.63, 329.63, 392.00, 523.25, 659.25].forEach((freq, i) => {
            osc.frequency.setValueAtTime(freq, now + i * 0.05);
        });
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);

        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(this.sfxGainNode || this.ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(2000, now);
        osc2.frequency.exponentialRampToValueAtTime(200, now + 0.3);
        gain2.gain.setValueAtTime(0.05, now);
        gain2.gain.linearRampToValueAtTime(0, now + 0.3);
        osc2.start(now);
        osc2.stop(now + 0.3);
    } else if (type === 'potion') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'item') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    }
  }

  playTone(freq: number, type: OscillatorType, duration: number, startFreq?: number, endFreq?: number) {
    if (!this.ctx || !this.enabled || this.ctx.state === 'suspended') return;
    if (!Number.isFinite(freq) || !Number.isFinite(duration)) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    
    try {
        if (startFreq && Number.isFinite(startFreq)) {
            const finalEnd = (endFreq && Number.isFinite(endFreq)) ? endFreq : freq;
            osc.frequency.setValueAtTime(startFreq, now);
            if (finalEnd > 0 && startFreq > 0) {
                osc.frequency.exponentialRampToValueAtTime(finalEnd, now + duration);
            } else {
                osc.frequency.linearRampToValueAtTime(finalEnd, now + duration);
            }
        } else {
            osc.frequency.setValueAtTime(freq, now);
        }
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
        osc.connect(gain);
        gain.connect(this.sfxGainNode || this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
    } catch (e) {
        console.warn('AudioEngine: Failed to play tone', e);
    }
  }

  playLegendaryChestSound() {
    if (!this.ctx || !this.enabled || this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;
    
    // A majestic chord
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.15, now + i * 0.1 + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
        osc.connect(gain);
        gain.connect(this.sfxGainNode || this.ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + 1.5);
    });
  }

  playSlotSpinSound() {
    this.playTone(800, 'square', 0.1, 400, 800);
  }

  playCoinSound() {
    this.playTone(1319, 'triangle', 0.22, 988, 1319);
  }

  playWeaponPickupSound() {
    if (!this.ctx || !this.enabled || this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;
    [523, 659, 784, 1046, 1319].forEach((f, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + i * 0.1);
        gain.gain.setValueAtTime(0.1, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.1);
    });
    this.playTone(4000, 'sine', 0.3, 2000, 4000);
  }

  playDashSound() {
    this.playTone(300, 'triangle', 0.1, 150, 100);
  }

  playPlayerHitSound() {
    this.playTone(180, 'sawtooth', 0.2, 250, 80);
    this.playTone(80, 'square', 0.25, 120, 40);
    
    // Low rumble impact
    if (this.ctx && this.enabled) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(60, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.connect(gain);
        gain.connect(this.sfxGainNode || this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
    }
  }

  playHitSound(type: string) {
    if (type === 'warrior') this.playTone(150, 'square', 0.1);
    else if (type === 'archer') this.playTone(800, 'sine', 0.1);
    else if (type === 'mage') this.playTone(400, 'triangle', 0.1);
    else if (type === 'miniboss') { this.playTone(100, 'sawtooth', 0.1); this.playTone(150, 'square', 0.1); }
    else if (type === 'boss') { this.playTone(80, 'sawtooth', 0.2); this.playTone(120, 'square', 0.2); this.playTone(200, 'sine', 0.1); }
  }

  playCritHitSound() {
      this.playTone(1800, 'square', 0.1, 1200, 1800);
      this.playTone(80, 'sawtooth', 0.2, 160, 40);
  }

  playLevelUpSound() {
    [261, 329, 392, 523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.playTone(f, 'triangle', 0.1), i * 100));
    this.playTone(60, 'square', 0.5, 60, 180);
  }

  playSuckSound() {
    if (!this.ctx || !this.enabled || this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.connect(gain);
    gain.connect(this.sfxGainNode || this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  playBuySound() {
    this.playTone(1200, 'sine', 0.2, 880, 1200);
  }

  playShootSound() {
    this.playTone(800, 'sine', 0.1, 800, 400);
  }

  playLaserSound() {
    this.playTone(1500, 'sawtooth', 0.15, 2000, 800);
  }

  playFireballSound() {
    this.playTone(400, 'sawtooth', 0.15, 200, 600);
  }

  playVampireSound() {
    this.playTone(600, 'triangle', 0.2, 300, 100);
    this.playTone(200, 'sine', 0.2, 400, 100);
  }

  playBrass(freq: number, duration: number, volume: number = 0.1, targetGain?: GainNode) {
    if (!this.ctx || !this.enabled) return;
    const gTarget = targetGain || this.musicGain;
    if (!gTarget) return;
    
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 1.01, now); // Detune for richness

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq, now);
    filter.frequency.exponentialRampToValueAtTime(freq * 8, now + 0.1);
    filter.frequency.exponentialRampToValueAtTime(freq * 2, now + duration);

    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(volume, now + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(g);
    g.connect(gTarget);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  }

  playGuitar(freq: number, duration: number, volume: number = 0.08, targetGain?: GainNode) {
    if (!this.ctx || !this.enabled) return;
    const gTarget = targetGain || this.musicGain;
    if (!gTarget) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);
    
    // Slight pitch bend for 'vibrato' or 'bend' feel
    osc.frequency.linearRampToValueAtTime(freq * 1.02, now + 0.05);
    osc.frequency.linearRampToValueAtTime(freq, now + duration);

    g.gain.setValueAtTime(volume, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(g);
    g.connect(gTarget);

    osc.start(now);
    osc.stop(now + duration);
  }

  playDrum(type: 'kick' | 'snare' | 'hihat', time: number, targetGain?: GainNode) {
    if (!this.ctx || !this.enabled) return;
    const gTarget = targetGain || this.musicGain;
    if (!gTarget) return;

    const now = time;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    if (type === 'kick') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.1);
        g.gain.setValueAtTime(0.2, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    } else if (type === 'snare') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        g.gain.setValueAtTime(0.1, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        // Add white noise essentially
        const noise = this.ctx.createBufferSource();
        const bufferSize = this.ctx.sampleRate * 0.1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for(let i=0; i<bufferSize; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;
        const ng = this.ctx.createGain();
        ng.gain.setValueAtTime(0.05, now);
        ng.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        noise.connect(ng);
        ng.connect(gTarget);
        noise.start(now);
        noise.stop(now + 0.15);
    } else {
        osc.type = 'square';
        osc.frequency.setValueAtTime(5000, now);
        g.gain.setValueAtTime(0.02, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    }

    osc.connect(g);
    g.connect(gTarget);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  playBossLaser() {
    this.playTone(1500, 'sawtooth', 0.5, 2000, 400);
  }

  playBossCharge() {
    this.playTone(200, 'sine', 0.8, 200, 1200);
  }

  playBossExplosion() {
    this.playTone(100, 'sawtooth', 0.6, 200, 40);
    this.playTone(50, 'square', 0.6, 100, 20);
  }

  playImpactSound() {
      this.playTone(80, 'sawtooth', 0.3, 150, 40);
      this.playTone(40, 'square', 0.3, 80, 20);
  }

  playPopSound() {
      this.playTone(800, 'sine', 0.1, 400, 1000);
  }

  playPowerUpSound() {
      this.playTone(400, 'sine', 0.2, 400, 800);
      this.playTone(600, 'sine', 0.3, 600, 1200);
  }

  playSlimeSound() {
      this.playTone(200, 'sine', 0.3, 400, 100);
      this.playTone(300, 'triangle', 0.2, 200, 500);
  }

  playBreakWallSound() {
    this.playTone(100, 'sawtooth', 0.1, 200, 50);
  }

  playWinSound() {
    if (!this.ctx || !this.enabled || this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;
    [400, 600, 800, 1200].forEach((f, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.1);
        gain.gain.setValueAtTime(0.1, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.1);
    });
  }

  playSecretRoomSound() {
    if (!this.ctx || !this.enabled || this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;
    // Triumphal jingle: C5 - E5 - G5 - C6
    [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.15);
      gain.gain.setValueAtTime(0.1, now + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.3);
      osc.connect(gain);
      gain.connect(this.sfxGainNode || this.ctx!.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.3);
    });
  }

  playBossDefeatSound() {
    if (!this.ctx || !this.enabled || this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;
    // More elaborate triumphal fanfare
    const notes = [
      523.25, 523.25, 523.25, 523.25, // C5 C5 C5 C5
      415.30, 466.16, 523.25, // Ab4 Bb4 C5
      466.16, 523.25 // Bb4 C5
    ];
    const durations = [0.1, 0.1, 0.1, 0.3, 0.2, 0.2, 0.4, 0.2, 0.8];
    let time = 0;
    notes.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now + time);
      gain.gain.setValueAtTime(0.08, now + time);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + durations[i]);
      osc.connect(gain);
      gain.connect(this.sfxGainNode || this.ctx!.destination);
      osc.start(now + time);
      osc.stop(now + time + durations[i]);
      time += durations[i];
    });
  }

  playUndoSound() {
    this.playTone(400, 'sawtooth', 0.2, 600, 400);
  }

  playThunderStrikeSound() {
    if (!this.ctx || !this.enabled || this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;
    
    // Low booming thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.8, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    osc.connect(gain);
    gain.connect(this.sfxGainNode || this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.5);

    // Electric crackle
    this.playElectricSound(0.2, 200);
  }

  playElectricSound(duration: number = 0.2, freq: number = 100) {
    if (!this.ctx || !this.enabled || this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;
    // Base buzz
    const osc = this.ctx.createOscillator();
    const noise = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.linearRampToValueAtTime(freq * 1.5, now + duration);
    
    // Crackle effect
    for (let i = 0; i < 10; i++) {
        osc.frequency.setValueAtTime(freq * (1 + Math.random() * 2), now + (i / 10) * duration);
    }
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    osc.connect(gain);
    gain.connect(this.sfxGainNode || this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + duration);
  }

  setMusicVolume(v: number) {
      if (!Number.isFinite(v)) return;
      this.musicVolume = Math.max(0, Math.min(1, v));
      if (this.musicGain && this.ctx) {
          try {
              this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
          } catch(e) {}
      }
  }

  setSfxVolume(v: number) {
      if (!Number.isFinite(v)) return;
      this.sfxVolume = Math.max(0, Math.min(1, v));
      if (this.sfxGainNode && this.ctx) {
          try {
              this.sfxGainNode.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
          } catch(e) {}
      }
  }

  musicSpeed: number = 1.0;
  setMusicSpeed(speed: number) {
      if (this.musicSpeed === speed) return;
      this.musicSpeed = speed;
      if (this.musicGain) {
          this.playBackgroundMusic();
      }
  }

  stopBackgroundMusic() {
    this.clearAllTimeouts();
    if (this.musicGain && this.ctx) {
        const oldGain = this.musicGain;
        try {
            oldGain.gain.setValueAtTime(oldGain.gain.value, this.ctx.currentTime);
            oldGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
            setTimeout(() => {
                try { oldGain.disconnect(); } catch(e) {}
            }, 300);
        } catch(e) {}
        this.musicGain = null;
    }
  }

  currentTrackId: string = 'sottofindomistero1';
  private previousTrackId: string = 'sottofindomistero1';

  playShopMusic() {
      if (this.currentTrackId === 'shop') return;
      this.previousTrackId = this.currentTrackId;
      this.playBackgroundMusic('shop');
  }

  stopShopMusic() {
      if (this.currentTrackId === 'shop') {
          this.playBackgroundMusic(this.previousTrackId);
      }
  }

  playCasinoMusic() {
      if (this.currentTrackId === 'casino') return;
      this.previousTrackId = this.currentTrackId;
      this.playBackgroundMusic('casino');
  }

  stopCasinoMusic() {
      if (this.currentTrackId === 'casino') {
          this.playBackgroundMusic(this.previousTrackId);
      }
  }

  playGameOverMusic() {
      if (this.currentTrackId === 'gameover') return;
      this.previousTrackId = this.currentTrackId;
      this.playBackgroundMusic('gameover');
  }

  playBackgroundMusic(trackId?: string) {
    if (trackId) this.currentTrackId = trackId;
    this.stopBackgroundMusic();
    if (!this.ctx || !this.enabled || this.ctx.state === 'suspended') return;
    
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicVolume; 
    this.musicGain.connect(this.ctx.destination);

    if (this.currentTrackId === 'sottofindomistero1') {
        this.loopSottofondoMistero1();
    } else if (this.currentTrackId === 'sottofindomistero2') {
        this.loopSottofondoMistero2();
    } else if (this.currentTrackId === 'casino') {
        this.loopCasinoMusic();
    } else if (this.currentTrackId === 'shop') {
        this.loopShopMusic();
    } else if (this.currentTrackId === 'alien' || this.currentTrackId === 'alienmusic') {
        this.loopAlienMusic();
    } else if (this.currentTrackId === 'gameover') {
        this.loopGameOverMusic();
    } else if (this.currentTrackId === 'menu') {
        this.loopMenuMusic();
    } else {
        // fallback
        this.loopSottofondoMistero1();
    }
  }

  private loopGameOverMusic() {
    const bps = 1.2; // slightly faster than 60bpm, roughly 72bpm for the march
    const loopLength = 16 / bps;
    let nextLoopTime = this.ctx!.currentTime;

    const playLoop = () => {
        if (!this.ctx || !this.enabled || !this.musicGain || this.currentTrackId !== 'gameover') return;
        if (nextLoopTime < this.ctx.currentTime) nextLoopTime = this.ctx.currentTime;
        const now = nextLoopTime;

        // Chopin Funeral March Melody (approximate famous part)
        const Bb3 = 233.08, Db4 = 277.18, C4 = 261.63, Gb3 = 185.00, F3 = 174.61;
        const melody = [
            // Measure 1
            { f: Bb3, time: 0, dur: 0.9 },
            { f: Bb3, time: 1.0, dur: 0.65 },
            { f: Bb3, time: 1.75, dur: 0.2 },
            { f: Bb3, time: 2.0, dur: 1.8 },
            // Measure 2
            { f: Db4, time: 4.0, dur: 0.9 },
            { f: C4,  time: 5.0, dur: 0.65 },
            { f: C4,  time: 5.75, dur: 0.2 },
            { f: C4,  time: 6.0, dur: 1.8 },
            // Measure 3
            { f: Bb3, time: 8.0, dur: 0.9 },
            { f: Bb3, time: 9.0, dur: 0.65 },
            { f: Bb3, time: 9.75, dur: 0.2 },
            { f: Bb3, time: 10.0, dur: 1.8 },
            // Measure 4
            { f: Gb3, time: 12.0, dur: 0.9 },
            { f: F3,  time: 13.0, dur: 0.65 },
            { f: F3,  time: 13.75, dur: 0.2 },
            { f: F3,  time: 14.0, dur: 1.8 }
        ];

        melody.forEach(note => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'sawtooth';
            // slight detune for an organ-like eerie feel
            const osc2 = this.ctx!.createOscillator();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(note.f * 1.005, now + note.time / bps);
            osc.frequency.setValueAtTime(note.f, now + note.time / bps);
            
            gain.gain.setValueAtTime(0, now + note.time / bps);
            gain.gain.linearRampToValueAtTime(0.08, now + note.time / bps + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + (note.time + note.dur) / bps);
            
            osc.connect(gain);
            osc2.connect(gain);
            gain.connect(this.musicGain!);
            
            osc.start(now + note.time / bps);
            osc.stop(now + (note.time + note.dur) / bps);
            osc2.start(now + note.time / bps);
            osc2.stop(now + (note.time + note.dur) / bps);
        });

        // Bass chords
        const Bb2 = Bb3 / 2, F2 = F3 / 2, Gb2 = Gb3 / 2;
        const bassNotes = [
            { f: Bb2, time: 0, dur: 3.8 },
            { f: F2,  time: 4, dur: 3.8 },
            { f: Gb2, time: 8, dur: 3.8 },
            { f: F2,  time: 12, dur: 3.8 }
        ];

        bassNotes.forEach(note => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'square'; // giving it a low growl
            osc.frequency.setValueAtTime(note.f, now + note.time / bps);
            
            gain.gain.setValueAtTime(0, now + note.time / bps);
            // Swell
            gain.gain.linearRampToValueAtTime(0.06, now + note.time / bps + 1.0);
            gain.gain.linearRampToValueAtTime(0, now + (note.time + note.dur) / bps);
            
            // Add a lowpass filter
            const filter = this.ctx!.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(300, now + note.time / bps);
            filter.frequency.exponentialRampToValueAtTime(50, now + (note.time + note.dur) / bps);
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain!);
            
            osc.start(now + note.time / bps);
            osc.stop(now + (note.time + note.dur) / bps);
        });

        nextLoopTime += loopLength;
        const timeToNextLoop = (nextLoopTime - this.ctx.currentTime - 0.1) * 1000;
        this.musicTimeout = this.addTimeout(playLoop, Math.max(0, timeToNextLoop));
    };

    playLoop();
  }

  private loopAlienMusic() {
    const loopLength = 4 / this.musicSpeed;
    let nextLoopTime = this.ctx!.currentTime;

    const playLoop = () => {
        if (!this.ctx || !this.enabled || !this.musicGain || (this.currentTrackId !== 'alien' && this.currentTrackId !== 'alienmusic')) return;
        
        if (nextLoopTime < this.ctx.currentTime) nextLoopTime = this.ctx.currentTime;
        const now = nextLoopTime;

        // Dark, pulsing techno-ish beat
        const beatLength = 0.5 / this.musicSpeed;
        for (let i = 0; i < 8; i++) {
            const start = now + i * beatLength;
            
            // Pulsing bass kick
            const kick = this.ctx!.createOscillator();
            const kickGain = this.ctx!.createGain();
            kick.type = 'sine';
            kick.frequency.setValueAtTime(60, start);
            kick.frequency.exponentialRampToValueAtTime(0.01, start + 0.1 / this.musicSpeed);
            
            kickGain.gain.setValueAtTime(0.08, start);
            kickGain.gain.exponentialRampToValueAtTime(0.001, start + 0.1 / this.musicSpeed);
            
            kick.connect(kickGain);
            kickGain.connect(this.musicGain!);
            kick.start(start);
            kick.stop(start + 0.1 / this.musicSpeed);

            // Alien "chirp" or high-tech sequence on off-beats
            if (i % 2 === 1) {
                const chirp = this.ctx!.createOscillator();
                const chirpGain = this.ctx!.createGain();
                chirp.type = 'square';
                const f = 800 + Math.sin(i * 10) * 400;
                chirp.frequency.setValueAtTime(f, start + 0.1);
                chirp.frequency.exponentialRampToValueAtTime(f * 2, start + 0.2 / this.musicSpeed);
                
                chirpGain.gain.setValueAtTime(0, start + 0.1);
                chirpGain.gain.linearRampToValueAtTime(0.02, start + 0.12 / this.musicSpeed);
                chirpGain.gain.linearRampToValueAtTime(0, start + 0.2 / this.musicSpeed);
                
                chirp.connect(chirpGain);
                chirpGain.connect(this.musicGain!);
                chirp.start(start + 0.1);
                chirp.stop(start + 0.2 / this.musicSpeed);
            }
        }

        // Spacey Pad / Atmosphere
        const padFreqs = [110, 138.59, 164.81]; // A2, C#3, E3 (A major, but weirdly spaced)
        padFreqs.forEach((freq, idx) => {
            const pad = this.ctx!.createOscillator();
            const padGain = this.ctx!.createGain();
            pad.type = 'sawtooth';
            pad.frequency.setValueAtTime(freq, now);
            pad.frequency.linearRampToValueAtTime(freq * 1.005, now + loopLength);
            
            // Filter out high frequencies to make it a "pad"
            const filter = this.ctx!.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(400 + Math.sin(now) * 200, now);
            filter.frequency.linearRampToValueAtTime(600, now + loopLength);
            
            padGain.gain.setValueAtTime(0, now);
            padGain.gain.linearRampToValueAtTime(0.03, now + loopLength / 2);
            padGain.gain.linearRampToValueAtTime(0, now + loopLength);
            
            pad.connect(filter);
            filter.connect(padGain);
            padGain.connect(this.musicGain!);
            pad.start(now);
            pad.stop(now + loopLength);
        });

        // Fast arpeggiated "glitch" sequence
        const synthNotes = [440, 493.88, 523.25, 587.33, 659.25, 783.99];
        for (let i = 0; i < 16; i++) {
            if (Math.random() > 0.6) {
                const sStart = now + (i * 0.25) / this.musicSpeed;
                const sOsc = this.ctx!.createOscillator();
                const sGain = this.ctx!.createGain();
                sOsc.type = 'sine';
                sOsc.frequency.setValueAtTime(synthNotes[Math.floor(Math.random() * synthNotes.length)] * 2, sStart);
                
                sGain.gain.setValueAtTime(0, sStart);
                sGain.gain.linearRampToValueAtTime(0.015, sStart + 0.05 / this.musicSpeed);
                sGain.gain.exponentialRampToValueAtTime(0.001, sStart + 0.2 / this.musicSpeed);
                
                sOsc.connect(sGain);
                sGain.connect(this.musicGain!);
                sOsc.start(sStart);
                sOsc.stop(sStart + 0.2 / this.musicSpeed);
            }
        }

        nextLoopTime += loopLength;
        const timeToNextLoop = (nextLoopTime - this.ctx.currentTime - 0.1 / this.musicSpeed) * 1000;
        this.musicTimeout = this.addTimeout(playLoop, Math.max(0, timeToNextLoop));
    };

    playLoop();
  }

  private loopSottofondoMistero2() {
    const loopLength = 8 / this.musicSpeed;
    let nextLoopTime = this.ctx!.currentTime;

    const playLoop = () => {
        if (!this.ctx || !this.enabled || !this.musicGain || this.currentTrackId !== 'sottofindomistero2') return;
        
        if (nextLoopTime < this.ctx.currentTime) nextLoopTime = this.ctx.currentTime;
        const now = nextLoopTime;

        // Eerie, haunting tones
        const baseFreqs = [146.83, 110.00, 138.59, 92.50]; // D, A, C#, F#
        
        baseFreqs.forEach((freq, idx) => {
            const start = now + (idx * 2) / this.musicSpeed;
            
            // Slow, sweeping pad
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);
            osc.frequency.linearRampToValueAtTime(freq * 1.01, start + 2 / this.musicSpeed);
            
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.04, start + 0.8 / this.musicSpeed);
            gain.gain.linearRampToValueAtTime(0, start + 2.0 / this.musicSpeed);
            
            osc.connect(gain);
            gain.connect(this.musicGain!);
            osc.start(start);
            osc.stop(start + 2.0 / this.musicSpeed);

            // Shimmering overtones
            [freq * 2.5, freq * 3.1].forEach((f, i) => {
                const sOsc = this.ctx!.createOscillator();
                const sGain = this.ctx!.createGain();
                sOsc.type = 'sine';
                sOsc.frequency.setValueAtTime(f, start + 0.5);
                
                sGain.gain.setValueAtTime(0, start + 0.5);
                sGain.gain.linearRampToValueAtTime(0.01, start + 1.0);
                sGain.gain.linearRampToValueAtTime(0, start + 1.5);
                
                sOsc.connect(sGain);
                sGain.connect(this.musicGain!);
                sOsc.start(start + 0.5);
                sOsc.stop(start + 1.5);
            });
        });

        // Occasional deep thrum
        const thrumOsc = this.ctx!.createOscillator();
        const thrumGain = this.ctx!.createGain();
        thrumOsc.type = 'triangle';
        thrumOsc.frequency.setValueAtTime(40, now);
        thrumGain.gain.setValueAtTime(0, now);
        thrumGain.gain.linearRampToValueAtTime(0.05, now + 1.0);
        thrumGain.gain.linearRampToValueAtTime(0, now + 4.0);
        thrumOsc.connect(thrumGain);
        thrumGain.connect(this.musicGain!);
        thrumOsc.start(now);
        thrumOsc.stop(now + 4.0);

        nextLoopTime += loopLength;
        const timeToNextLoop = (nextLoopTime - this.ctx.currentTime - 0.1 / this.musicSpeed) * 1000;
        this.musicTimeout = this.addTimeout(playLoop, Math.max(0, timeToNextLoop));
    };

    playLoop();
  }

  private loopShopMusic() {
    const loopLength = 4 / this.musicSpeed; 
    let nextLoopTime = this.ctx!.currentTime;

    const playLoop = () => {
        if (!this.ctx || !this.enabled || !this.musicGain || this.currentTrackId !== 'shop') return;
        
        if (nextLoopTime < this.ctx.currentTime) nextLoopTime = this.ctx.currentTime;
        const now = nextLoopTime;

        // Cheerful melody
        const melody = [
            523.25, 523.25, 587.33, 659.25,
            659.25, 587.33, 523.25, 493.88,
            440.00, 523.25, 587.33, 493.88,
            523.25, 523.25, 523.25, 0
        ];

        melody.forEach((freq, i) => {
            if (freq === 0) return;
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq * 1.5;
            
            const start = now + (i * 0.25) / this.musicSpeed;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.04, start + 0.05 / this.musicSpeed);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2 / this.musicSpeed);
            
            osc.connect(gain);
            gain.connect(this.musicGain!);
            osc.start(start);
            osc.stop(start + 0.2 / this.musicSpeed);
        });

        // Bouncy bass
        const bass = [261.63, 196.00, 220.00, 392.00];
        bass.forEach((freq, i) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i / this.musicSpeed);
            
            const start = now + i / this.musicSpeed;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.08, start + 0.1 / this.musicSpeed);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.8 / this.musicSpeed);
            
            osc.connect(gain);
            gain.connect(this.musicGain!);
            osc.start(start);
            osc.stop(start + 0.8 / this.musicSpeed);
        });

        nextLoopTime += loopLength;
        const timeToNextLoop = (nextLoopTime - this.ctx.currentTime - 0.1 / this.musicSpeed) * 1000;
        this.musicTimeout = this.addTimeout(playLoop, Math.max(0, timeToNextLoop));
    };

    playLoop();
  }

  private loopCasinoMusic() {
    const loopLength = 2 / this.musicSpeed; // Fast 2 second loop
    let nextLoopTime = this.ctx!.currentTime;

    const playLoop = () => {
        if (!this.ctx || !this.enabled || !this.musicGain || this.currentTrackId !== 'casino') return;
        
        if (nextLoopTime < this.ctx.currentTime) nextLoopTime = this.ctx.currentTime;
        const now = nextLoopTime;

        // Upbeat, fast casino-like arpeggiated tune.
        // C major pentatonic, fast
        const notes = [
            523.25, 659.25, 783.99, 1046.50, // C, E, G, C(octave)
            1318.51, 1046.50, 783.99, 659.25,
            587.33, 659.25, 783.99, 880.00,
            1046.50, 783.99, 659.25, 523.25
        ];

        notes.forEach((freq, i) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'square';
            osc.frequency.value = freq;
            
            const start = now + (i * 0.125) / this.musicSpeed;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.04, start + 0.02 / this.musicSpeed);
            gain.gain.linearRampToValueAtTime(0, start + 0.1 / this.musicSpeed);
            
            osc.connect(gain);
            gain.connect(this.musicGain!);
            
            osc.start(start);
            osc.stop(start + 0.1 / this.musicSpeed);
        });

        // Simple bass bounce
        const bassNotes = [130.81, 196.00, 130.81, 196.00];
        bassNotes.forEach((freq, i) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            
            const start = now + (i * 0.5) / this.musicSpeed;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.08, start + 0.1 / this.musicSpeed);
            gain.gain.linearRampToValueAtTime(0, start + 0.3 / this.musicSpeed);
            
            osc.connect(gain);
            gain.connect(this.musicGain!);
            
            osc.start(start);
            osc.stop(start + 0.4 / this.musicSpeed);
        });

        nextLoopTime += loopLength;
        const timeToNextLoop = (nextLoopTime - this.ctx.currentTime - 0.1 / this.musicSpeed) * 1000;
        this.musicTimeout = this.addTimeout(playLoop, Math.max(0, timeToNextLoop));
    };

    playLoop();
  }

  private loopMenuMusic() {
    const bpm = 120;
    const beat = 60 / bpm;
    // We'll create a 64-beat sequence (~32 seconds) that we repeat.
    const loopLength = 64 * beat;
    let nextLoopTime = this.ctx!.currentTime;

    const playLoop = () => {
        if (!this.ctx || !this.enabled || !this.musicGain || this.currentTrackId !== 'menu') return;
        if (nextLoopTime < this.ctx.currentTime) nextLoopTime = this.ctx.currentTime;
        const now = nextLoopTime;

        // Frequencies
        const A1 = 55.00, A2 = 110.00, C2 = 65.41, D2 = 73.42, E2 = 82.41, G2 = 98.00;
        const A3 = 220.00, C3 = 130.81, D3 = 146.83, E3 = 164.81, G3 = 196.00;
        const C4 = 261.63, D4 = 293.66, E4 = 329.63, G4 = 392.00, A4 = 440.00;

        const currentGain = this.musicGain;

        // Intro: 0-8 beats
        // Brass Swells
        for (let i = 0; i < 2; i++) {
           const time = now + (i * 4) * beat;
           this.playBrass(A2, 3.5 * beat, 0.12, currentGain);
           this.playBrass(E3, 3.5 * beat, 0.08, currentGain);
        }

        // Bass/Guitar driving riff: 8-56 beats
        const guitarRiff = [A2, A2, C3, A2, D3, A2, G2, A2]; 
        for (let b = 8; b < 56; b++) {
            const time = now + b * beat;
            const note = guitarRiff[b % 8];
            
            // Kick pattern
            if (b % 4 === 0 || b % 4 === 2.5) this.playDrum('kick', time, currentGain);
            // Snare pattern
            if (b % 4 === 2) this.playDrum('snare', time, currentGain);
            // Hihat 
            this.playDrum('hihat', time + 0.5 * beat, currentGain);

            // Guitar riff
            if (b % 1 === 0) {
                this.playGuitar(note, 0.15 * beat, 0.1, currentGain);
            }
            if (b % 4 === 3.5) {
                this.playGuitar(note * 1.5, 0.2 * beat, 0.07, currentGain);
            }
        }

        // Brass accents: 16-56 beats
        const B4 = 493.88;
        const brassPattern = [
            { beat: 16, f: [A3, E4], dur: 2 },
            { beat: 20, f: [G3, D4], dur: 2 },
            { beat: 24, f: [C4, G4], dur: 4 },
            { beat: 32, f: [A3, E4], dur: 2 },
            { beat: 36, f: [G3, D4], dur: 2 },
            { beat: 40, f: [D4, A4], dur: 4 },
            { beat: 48, f: [E4, B4], dur: 6 }
        ];

        brassPattern.forEach(p => {
            p.f.forEach(freq => {
                const time = now + p.beat * beat;
                if (time >= now && time < now + loopLength) {
                    this.addTimeout(() => {
                        if (this.currentTrackId === 'menu' && this.musicGain === currentGain) {
                            this.playBrass(freq, p.dur * beat, 0.1, currentGain);
                        }
                    }, (p.beat * beat) * 1000);
                }
            });
        });

        // Finale: 56-64 beats
        for (let b = 56; b < 64; b++) {
            const time = now + b * beat;
            this.playDrum('kick', time, currentGain);
            if (b % 2 === 1) this.playDrum('snare', time, currentGain);
            
            this.playGuitar(A2 * 2, 0.1 * beat, 0.15, currentGain);
            if (b === 63) {
               // Crashing final chord
               this.addTimeout(() => {
                   if (this.currentTrackId === 'menu' && this.musicGain === currentGain) {
                       [A2, E3, A3, C4, E4].forEach(f => this.playBrass(f, 4 * beat, 0.2, currentGain));
                   }
               }, (b * beat) * 1000);
            }
        }

        nextLoopTime += loopLength;
        const timeToNextLoop = (nextLoopTime - this.ctx.currentTime - 0.1) * 1000;
        this.musicTimeout = this.addTimeout(playLoop, Math.max(0, timeToNextLoop));
    };

    playLoop();
  }

  private loopSottofondoMistero1() {
    const loopLength = 8 / this.musicSpeed; // 8 seconds per loop
    let nextLoopTime = this.ctx!.currentTime;

    const playLoop = () => {
        if (!this.ctx || !this.enabled || !this.musicGain || this.currentTrackId !== 'sottofindomistero1') return;
        
        // Re-sync nextLoopTime with currentTime if it fell behind (e.g. tab backgrounded)
        if (nextLoopTime < this.ctx.currentTime) {
            nextLoopTime = this.ctx.currentTime;
        }
        
        const now = nextLoopTime;

        // Simple 4-chord progression
        const notes = [
            [130.81, 155.56, 196.00, 261.63], // Cm
            [103.83, 130.81, 155.56, 207.65], // Ab
            [155.56, 196.00, 233.08, 311.13], // Eb
            [146.83, 196.00, 246.94, 293.66]  // G
        ];

        notes.forEach((chord, chordIdx) => {
            // Arpeggio
            chord.forEach((freq, noteIdx) => {
                const osc = this.ctx!.createOscillator();
                const gain = this.ctx!.createGain();
                
                osc.type = 'sine';
                osc.frequency.value = freq * 2; // an octave higher usually sounds better for arps
                
                const startTime = now + (chordIdx * 2 + noteIdx * 0.5) / this.musicSpeed;
                
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(0.03, startTime + 0.1 / this.musicSpeed);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45 / this.musicSpeed);
                
                osc.connect(gain);
                gain.connect(this.musicGain!);
                
                osc.start(startTime);
                osc.stop(startTime + 0.5 / this.musicSpeed);
            });
            
            // Bass pad
            const bassOsc = this.ctx!.createOscillator();
            const bassGain = this.ctx!.createGain();
            bassOsc.type = 'triangle';
            bassOsc.frequency.value = chord[0] / 2; // octave down
            
            const bassStart = now + (chordIdx * 2) / this.musicSpeed;
            bassGain.gain.setValueAtTime(0, bassStart);
            bassGain.gain.linearRampToValueAtTime(0.06, bassStart + 0.2 / this.musicSpeed);
            bassGain.gain.linearRampToValueAtTime(0.03, bassStart + 1.8 / this.musicSpeed);
            bassGain.gain.linearRampToValueAtTime(0, bassStart + 2.0 / this.musicSpeed);
            
            bassOsc.connect(bassGain);
            bassGain.connect(this.musicGain!);
            
            bassOsc.start(bassStart);
            bassOsc.stop(bassStart + 2.0 / this.musicSpeed);
        });

        nextLoopTime += loopLength;
        // Schedule next playLoop slightly before the current one ends
        const timeToNextLoop = (nextLoopTime - this.ctx.currentTime - 0.1 / this.musicSpeed) * 1000;
        this.musicTimeout = this.addTimeout(playLoop, Math.max(0, timeToNextLoop));
    };

    playLoop();
  }
}

export const globalAudio = new AudioEngine();

