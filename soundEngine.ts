class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public volume: number = 0.8;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private playChord(freqs: number[], duration: number, type: OscillatorType = 'sine') {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    masterGain.connect(this.ctx.destination);

    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0.001, this.ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.4, this.ctx.currentTime + idx * 0.08 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(this.ctx.currentTime + idx * 0.08);
      osc.stop(this.ctx.currentTime + duration);
    });

    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  }

  public play(event: string) {
    switch (event) {
      case 'nuevo_viaje':
        this.playChord([440, 554.37, 659.25, 880], 1.8, 'triangle');
        break;
      case 'viaje_asignado':
        this.playChord([523.25, 659.25, 783.99, 1046.50], 1.6, 'sine');
        break;
      case 'conductor_en_camino':
        this.playChord([392, 493.88, 587.33, 783.99], 1.5, 'sine');
        break;
      case 'conductor_llego':
        this.playChord([587.33, 739.99, 880, 1174.66], 2.2, 'triangle');
        break;
      case 'viaje_iniciado':
        this.playChord([329.63, 415.30, 493.88, 659.25], 1.5, 'sine');
        break;
      case 'viaje_completado':
        this.playChord([523.25, 659.25, 783.99, 987.77, 1046.50], 2.5, 'sine');
        break;
      case 'viaje_cancelado':
        this.playChord([349.23, 311.13, 277.18, 233.08], 2.0, 'sawtooth');
        break;
      case 'recarga_confirmada':
        this.playChord([440, 659.25, 880, 1318.51], 2.0, 'triangle');
        break;
      case 'recarga_pendiente':
        this.playChord([440, 554.37], 1.0, 'sine');
        break;
      case 'saldo_bajo':
        this.playChord([220, 207.65, 196.00], 1.5, 'sawtooth');
        break;
      case 'senal_perdida':
        this.playChord([300, 260], 0.8, 'square');
        break;
      case 'senal_recuperada':
        this.playChord([520, 680], 0.8, 'sine');
        break;
      default:
        this.playChord([440, 660], 0.5, 'sine');
    }
  }
}

export const sound = new SoundEngine();