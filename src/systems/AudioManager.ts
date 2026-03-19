import Phaser from 'phaser';

/**
 * AudioManager — Web Audio API tabanlı prosedürel ses sistemi.
 * BGM: bgmGain üzerinden (musicVolume)
 * SFX: sfxGain üzerinden (sfxVolume) — ayrı zincir, stopBGM SFX'i susturmaz
 */
export class AudioManager {
  private ctx: AudioContext;
  private bgmGain: GainNode;   // BGM zinciri
  private sfxGain: GainNode;   // SFX zinciri

  private musicVolume: number = 0.8;
  private sfxVolume: number = 1.0;

  private bgmActive = false;
  private bgmTimeout: ReturnType<typeof setTimeout> | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private intensityLevel: number = 0;

  constructor(scene: Phaser.Scene, musicVolume = 0.8, sfxVolume = 1.0) {
    const soundManager = scene.sound as Phaser.Sound.WebAudioSoundManager;
    this.ctx = soundManager.context;

    this.musicVolume = musicVolume;
    this.sfxVolume = sfxVolume;

    // BGM gain — sadece BGM buraya bağlanır
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = musicVolume;
    this.bgmGain.connect(this.ctx.destination);

    // SFX gain — tüm efekt sesleri buraya bağlanır
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = sfxVolume;
    this.sfxGain.connect(this.ctx.destination);

    // Gürültü tamponu (snare, hihat için)
    const bufLen = Math.floor(this.ctx.sampleRate * 0.5);
    this.noiseBuffer = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private now(): number { return this.ctx.currentTime; }

  /** Osillatör — dest belirtilmezse sfxGain kullanılır */
  private osc(type: OscillatorType, freq: number, gain: number, dur: number, freqEnd?: number, dest?: AudioNode): void {
    const t = this.now();
    const target = dest ?? this.sfxGain;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (freqEnd !== undefined) o.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(target);
    o.start(t); o.stop(t + dur);
  }

  /** Gürültü — dest belirtilmezse sfxGain kullanılır */
  private noise(start: number, dur: number, gain: number, highpass = 0, dest?: AudioNode): void {
    if (!this.noiseBuffer) return;
    const target = dest ?? this.sfxGain;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    if (highpass > 0) {
      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = highpass;
      src.connect(f); f.connect(g);
    } else {
      src.connect(g);
    }
    g.connect(target);
    src.start(start); src.stop(start + dur);
  }

  // ─── BGM ────────────────────────────────────────────────────────────────────

  playBGM(): void {
    if (this.bgmActive) return;
    this.bgmActive = true;
    this.bgmGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.bgmGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    this.scheduleBGMBar();
  }

  setIntensity(level: number): void {
    this.intensityLevel = Math.max(0, Math.min(3, level));
  }

  private scheduleBGMBar(): void {
    if (!this.bgmActive) return;

    const lvl = this.intensityLevel;
    const bpm = 128 + lvl * 4;
    const beat = 60 / bpm;
    const step = beat / 2;
    const t = this.ctx.currentTime + 0.05;
    const steps = 16;

    const bassFreqs  = [55, 0, 55, 0, 65, 0, 55, 0, 55, 0, 82, 65, 55, 0, 65, 82];
    const bassFreqs2 = [0, 55, 0, 65, 0, 55, 0, 82, 0, 65,  0,  0,  0, 55,  0,  0];

    for (let i = 0; i < steps; i++) {
      const bt = t + i * step;

      // Kick
      const baseKick   = i === 0 || i === 4 || i === 8 || i === 10;
      const extraKick  = lvl >= 2 && (i === 2 || i === 6 || i === 14);
      const franticKick = lvl >= 3 && (i === 1 || i === 9 || i === 13);
      if (baseKick || extraKick || franticKick) this.scheduleKick(bt);

      // Snare
      if (i === 4 || i === 12) this.scheduleSnare(bt);
      if (lvl >= 2 && i === 14) this.scheduleSnare(bt);

      // Hihat
      const hihatBase  = (i % 4 === 0) ? 0.055 : 0.028;
      const hihatBoost = lvl >= 1 ? 1.3 : 1;
      this.noise(bt, 0.025, hihatBase * hihatBoost, 7000, this.bgmGain);
      if (lvl >= 3) this.noise(bt + step * 0.5, 0.012, 0.018, 8000, this.bgmGain);

      // Bass
      const bassVol = 1 + lvl * 0.08;
      if (bassFreqs[i] > 0) this.scheduleBass(bt, bassFreqs[i], step * 0.85, bassVol);
      if (lvl >= 2 && bassFreqs2[i] > 0) this.scheduleBass(bt, bassFreqs2[i], step * 0.7, bassVol * 0.6);

      // Melody
      const melodyStart = lvl >= 1 ? 4 : 8;
      if (i >= melodyStart && i % 2 === 0) {
        const melodyNotes = lvl >= 2
          ? [220, 261, 329, 392, 329, 261, 220, 261]
          : [220, 261, 329, 261];
        const mIdx = (i - melodyStart) / 2 % melodyNotes.length;
        this.scheduleMelodyVol(bt, melodyNotes[mIdx], step * 0.7, lvl >= 2 ? 0.07 : 0.04);
      }

      if (lvl >= 3 && i % 4 === 0) {
        const padNotes = [440, 523, 659, 523];
        this.scheduleMelodyVol(bt, padNotes[i / 4 % padNotes.length], step * 1.9, 0.03);
      }
    }

    const loopMs = steps * step * 1000;
    this.bgmTimeout = setTimeout(() => this.scheduleBGMBar(), loopMs - 50);
  }

  private scheduleKick(t: number): void {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(35, t + 0.18);
    g.gain.setValueAtTime(0.65, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    o.connect(g); g.connect(this.bgmGain);
    o.start(t); o.stop(t + 0.22);
    this.noise(t, 0.012, 0.15, 2000, this.bgmGain);
  }

  private scheduleSnare(t: number): void {
    this.noise(t, 0.12, 0.22, 1500, this.bgmGain);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(80, t + 0.06);
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    o.connect(g); g.connect(this.bgmGain);
    o.start(t); o.stop(t + 0.08);
  }

  private scheduleBass(t: number, freq: number, dur: number, volMult: number = 1): void {
    const o = this.ctx.createOscillator();
    const f = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.value = freq;
    f.type = 'lowpass';
    f.frequency.value = 500;
    f.Q.value = 1.5;
    g.gain.setValueAtTime(0.12 * volMult, t);
    g.gain.setValueAtTime(0.10 * volMult, t + dur * 0.7);
    g.gain.linearRampToValueAtTime(0.001, t + dur);
    o.connect(f); f.connect(g); g.connect(this.bgmGain);
    o.start(t); o.stop(t + dur);
  }

  private scheduleMelodyVol(t: number, freq: number, dur: number, vol: number): void {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.linearRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.bgmGain);
    o.start(t); o.stop(t + dur);
  }

  setVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.bgmGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
  }

  setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
  }

  getVolume(): number { return this.musicVolume; }
  getSfxVolume(): number { return this.sfxVolume; }

  /** Oyun duraklatıldığında tüm sesleri dondur (BGM + Sezer + SFX) */
  pauseBGM(): void {
    if (this.bgmTimeout !== null) {
      clearTimeout(this.bgmTimeout);
      this.bgmTimeout = null;
    }
    if (this.ctx.state === 'running') {
      this.ctx.suspend();
    }
  }

  /** Oyun devam edince sesleri geri aç */
  resumeBGM(): void {
    this.ctx.resume().then(() => {
      // BGM aktifse ve zamanlayıcı durmaktaysa yeniden başlat
      if (this.bgmActive && this.bgmTimeout === null) {
        this.scheduleBGMBar();
      }
    });
  }

  stopBGM(): void {
    this.bgmActive = false;
    if (this.bgmTimeout !== null) {
      clearTimeout(this.bgmTimeout);
      this.bgmTimeout = null;
    }
    // BGM gain'i sustur
    this.bgmGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.bgmGain.gain.setValueAtTime(0, this.ctx.currentTime);
    // Ctx askıya alınmışsa geri aç — Phaser aynı ctx'i yeniden kullanır
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // ─── SFX — tümü sfxGain zincirini kullanır ──────────────────────────────────

  playShoot(): void {
    const t = this.now();
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(1800, t);
    o.frequency.exponentialRampToValueAtTime(400, t + 0.06);
    g.gain.setValueAtTime(0.16, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    o.connect(g); g.connect(this.sfxGain);
    o.start(t); o.stop(t + 0.07);
    this.noise(t, 0.025, 0.06, 3000);
  }

  playHit(): void {
    const t = this.now();
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(380, t);
    o.frequency.exponentialRampToValueAtTime(80, t + 0.055);
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.065);
    o.connect(g); g.connect(this.sfxGain);
    o.start(t); o.stop(t + 0.065);
  }

  playKill(): void {
    const t = this.now();
    this.osc('sine', 600, 0.22, 0.05, 120);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(1800, t + 0.01);
    o.frequency.exponentialRampToValueAtTime(300, t + 0.12);
    g.gain.setValueAtTime(0, t);
    g.gain.setValueAtTime(0.14, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    o.connect(g); g.connect(this.sfxGain);
    o.start(t); o.stop(t + 0.12);
    this.noise(t, 0.04, 0.08, 1000);
  }

  playXPPickup(): void {
    this.osc('sine', 800, 0.13, 0.08, 1600);
  }

  playGoldPickup(): void {
    const t = this.now();
    this.osc('sine', 1200, 0.12, 0.04);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 1600;
    g.gain.setValueAtTime(0, t);
    g.gain.setValueAtTime(0.12, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    o.connect(g); g.connect(this.sfxGain);
    o.start(t); o.stop(t + 0.09);
  }

  playLevelUp(): void {
    const t = this.now();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      const s = t + i * 0.09;
      g.gain.setValueAtTime(0, s);
      g.gain.linearRampToValueAtTime(0.2, s + 0.02);
      g.gain.linearRampToValueAtTime(0, s + 0.28);
      o.connect(g); g.connect(this.sfxGain);
      o.start(s); o.stop(s + 0.28);
    });
    const o2 = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    o2.type = 'triangle';
    o2.frequency.value = 2093;
    g2.gain.setValueAtTime(0, t + 0.25);
    g2.gain.linearRampToValueAtTime(0.1, t + 0.3);
    g2.gain.linearRampToValueAtTime(0, t + 0.55);
    o2.connect(g2); g2.connect(this.sfxGain);
    o2.start(t); o2.stop(t + 0.55);
  }

  playBossKill(): void {
    const t = this.now();
    const o1 = this.ctx.createOscillator();
    const g1 = this.ctx.createGain();
    o1.type = 'sine';
    o1.frequency.setValueAtTime(120, t);
    o1.frequency.exponentialRampToValueAtTime(25, t + 0.5);
    g1.gain.setValueAtTime(0.6, t);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    o1.connect(g1); g1.connect(this.sfxGain);
    o1.start(t); o1.stop(t + 0.5);
    this.noise(t, 0.3, 0.25, 200);
    const notes = [880, 660, 523, 392];
    notes.forEach((freq, i) => {
      const delay = i * 0.1;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'square';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, t + delay);
      g.gain.linearRampToValueAtTime(0.15, t + delay + 0.02);
      g.gain.linearRampToValueAtTime(0, t + delay + 0.18);
      o.connect(g); g.connect(this.sfxGain);
      o.start(t + delay); o.stop(t + delay + 0.2);
    });
  }

  playVictory(): void {
    const t = this.now();
    const melody = [523, 659, 784, 1047, 784, 1047, 1319];
    melody.forEach((freq, i) => {
      const delay = i * 0.13;
      const dur = i === melody.length - 1 ? 0.8 : 0.18;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = i % 2 === 0 ? 'sine' : 'triangle';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, t + delay);
      g.gain.linearRampToValueAtTime(0.22, t + delay + 0.03);
      g.gain.linearRampToValueAtTime(0, t + delay + dur);
      o.connect(g); g.connect(this.sfxGain);
      o.start(t + delay); o.stop(t + delay + dur + 0.05);
    });
    this.osc('sine', 130, 0.4, 0.3, 50);
  }

  playDash(): void {
    const t = this.now();
    this.osc('sawtooth', 900, 0.12, 0.1, 80);
    this.noise(t, 0.06, 0.07, 500);
  }

  playTimerWarning(): void {
    const t = this.now();
    for (let i = 0; i < 3; i++) {
      const delay = i * 0.15;
      const freq = 880 - i * 110;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'square';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, t + delay);
      g.gain.linearRampToValueAtTime(0.10, t + delay + 0.02);
      g.gain.linearRampToValueAtTime(0, t + delay + 0.08);
      o.connect(g); g.connect(this.sfxGain);
      o.start(t + delay); o.stop(t + delay + 0.12);
    }
  }

  playPlayerHit(): void {
    const t = this.now();
    this.osc('sine', 90, 0.28, 0.15, 30);
    this.noise(t, 0.06, 0.1, 0);
  }

  /** Shop ses efektleri */
  playPurchase(): void {
    const t = this.now();
    this.osc('sine', 440, 0.15, 0.06, 880);
    this.osc('sine', 660, 0.10, 0.10, 1320);
  }

  playReroll(): void {
    const t = this.now();
    this.noise(t, 0.04, 0.08, 2000);
    this.osc('triangle', 300, 0.12, 0.08, 600);
  }
}
