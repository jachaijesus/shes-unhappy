class SoundSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = true;
  private currentStage: number = 0;

  // Sound nodes
  private industrialHum1: OscillatorNode | null = null;
  private industrialHum2: OscillatorNode | null = null;
  private industrialGain: GainNode | null = null;

  private windNoise: AudioWorkletNode | ScriptProcessorNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;

  private padOsc: OscillatorNode | null = null;
  private padGain: GainNode | null = null;

  constructor() {
    // Sound system starts muted by default
  }

  public init() {
    if (this.ctx) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.4, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.setupIndustrialHum();
      this.setupWindNoise();
      this.setupPad();
      this.startBirds();

      this.updateStageVolumes();
    } catch (e) {
      console.warn("Failed to initialize Web Audio API:", e);
    }
  }

  private setupIndustrialHum() {
    if (!this.ctx || !this.masterGain) return;

    // A low-frequency mechanical hum
    this.industrialHum1 = this.ctx.createOscillator();
    this.industrialHum1.type = 'sawtooth';
    this.industrialHum1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1

    this.industrialHum2 = this.ctx.createOscillator();
    this.industrialHum2.type = 'square';
    this.industrialHum2.frequency.setValueAtTime(82.41, this.ctx.currentTime); // E2

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(120, this.ctx.currentTime);
    lowpass.Q.setValueAtTime(3, this.ctx.currentTime);

    this.industrialGain = this.ctx.createGain();
    this.industrialGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.industrialHum1.connect(lowpass);
    this.industrialHum2.connect(lowpass);
    lowpass.connect(this.industrialGain);
    this.industrialGain.connect(this.masterGain);

    this.industrialHum1.start();
    this.industrialHum2.start();
  }

  private setupWindNoise() {
    if (!this.ctx || !this.masterGain) return;

    // Generate white noise using ScriptProcessorNode (safest fallback since no extra files)
    const bufferSize = 4096;
    this.windNoise = this.ctx.createScriptProcessor(bufferSize, 1, 1);
    this.windNoise.onaudioprocess = (e) => {
      const output = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2.0 - 1.0;
      }
    };

    // Filter white noise to create wind
    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.setValueAtTime(400, this.ctx.currentTime);
    this.windFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.windNoise.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    // LFO to modulate filter frequency (wind gust simulation)
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime); // very slow LFO
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(250, this.ctx.currentTime); // swing by +/- 250 Hz

    lfo.connect(lfoGain);
    if (this.windFilter) {
      lfoGain.connect(this.windFilter.frequency);
    }
    lfo.start();
  }

  private setupPad() {
    if (!this.ctx || !this.masterGain) return;

    // Organic forest pad
    this.padOsc = this.ctx.createOscillator();
    this.padOsc.type = 'sine';
    this.padOsc.frequency.setValueAtTime(329.63, this.ctx.currentTime); // E4

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    this.padGain = this.ctx.createGain();
    this.padGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.padOsc.connect(filter);
    filter.connect(this.padGain);
    this.padGain.connect(this.masterGain);

    this.padOsc.start();
  }

  private startBirds() {
    // Schedule procedural bird chirps when stage is high
    const triggerBird = () => {
      if (!this.ctx || !this.masterGain || this.isMuted) {
        setTimeout(triggerBird, 3000 + Math.random() * 4000);
        return;
      }

      // Birds only chirp in stage 2 & 3
      if (this.currentStage >= 2) {
        const time = this.ctx.currentTime;
        const nowMuted = this.currentStage === 2 ? 0.08 : 0.25;

        // Play 2-3 rapid high-pitched chirps
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        
        osc.connect(gain);
        gain.connect(this.masterGain);

        const baseFreq = 1200 + Math.random() * 800;
        osc.frequency.setValueAtTime(baseFreq, time);
        // Exponential sweep upwards to sound like a bird chirp
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, time + 0.15);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(nowMuted, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

        osc.start(time);
        osc.stop(time + 0.2);

        // Double chirp?
        if (Math.random() > 0.4) {
          const osc2 = this.ctx.createOscillator();
          const gain2 = this.ctx.createGain();
          osc2.type = 'sine';
          osc2.connect(gain2);
          gain2.connect(this.masterGain);

          const time2 = time + 0.12;
          osc2.frequency.setValueAtTime(baseFreq * 1.1, time2);
          osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.9, time2 + 0.15);

          gain2.gain.setValueAtTime(0, time2);
          gain2.gain.linearRampToValueAtTime(nowMuted, time2 + 0.02);
          gain2.gain.exponentialRampToValueAtTime(0.001, time2 + 0.18);

          osc2.start(time2);
          osc2.stop(time2 + 0.2);
        }
      }

      setTimeout(triggerBird, 2000 + Math.random() * 5000);
    };

    triggerBird();
  }

  private updateStageVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Cross-fade speeds: 1 second transition
    const transitionTime = 1.0;

    if (this.industrialGain) {
      // Stage 0: Max hum (0.6). Stage 1: 0.3. Stage 2: 0.05. Stage 3: 0.0
      let indVol = 0;
      if (this.currentStage === 0) indVol = 0.5;
      else if (this.currentStage === 1) indVol = 0.2;
      else if (this.currentStage === 2) indVol = 0.04;
      else indVol = 0.0;
      this.industrialGain.gain.setTargetAtTime(indVol, t, transitionTime / 3);
    }

    if (this.windGain) {
      // Stage 0: 0.0. Stage 1: Max wind (0.4). Stage 2: 0.3. Stage 3: Gentle breeze (0.2)
      let windVol = 0;
      if (this.currentStage === 1) windVol = 0.35;
      else if (this.currentStage === 2) windVol = 0.25;
      else if (this.currentStage === 3) windVol = 0.15;
      this.windGain.gain.setTargetAtTime(windVol, t, transitionTime / 3);
    }

    if (this.padGain) {
      // Stage 0: 0.0. Stage 1: 0.0. Stage 2: Gentle (0.15). Stage 3: Full (0.35)
      let padVol = 0;
      if (this.currentStage === 2) padVol = 0.15;
      else if (this.currentStage === 3) padVol = 0.35;
      this.padGain.gain.setTargetAtTime(padVol, t, transitionTime / 3);
    }
  }

  public setStage(stage: number) {
    this.currentStage = stage;
    this.init(); // ensure active
    this.updateStageVolumes();
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    
    // Ensure initialized if clicking unmute
    if (!this.isMuted) {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.4, this.ctx.currentTime, 0.1);
    }

    return this.isMuted;
  }

  public getMuteState(): boolean {
    return this.isMuted;
  }
}

export const soundSystem = new SoundSystem();
export default soundSystem;
