/**
 * SoundManager: Generates synthesized Neuro-style sounds using Web Audio API.
 */
class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = localStorage.getItem('neuro_sounds_enabled') !== 'false';
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('neuro_sounds_enabled', this.enabled);
        this.updateUI();
        if (this.enabled) this.playSuccess();
    }

    updateUI() {
        const icon = document.getElementById('sound-icon');
        const text = document.getElementById('sound-text');
        if (icon) icon.className = this.enabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
        if (text) text.style.display = 'none';
    }

    // --- Sound Synthesis ---

    playBuzz() {
        if (!this.enabled) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.4);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.4);
    }

    playDeleteWarning() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;

        // "TERRIFYING" ALARM SOUND
        // A harsh, screeching dissonant blast

        // Oscillator 1: The Screech
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'square'; // Square wave is harshest
        osc1.frequency.setValueAtTime(800, now);
        osc1.frequency.exponentialRampToValueAtTime(200, now + 0.3); // Rapid drop

        gain1.gain.setValueAtTime(0.4, now); // Loud!
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);

        // Oscillator 2: The Dissonance (Tritone interval)
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(1150, now); // Dissonant high pitch
        osc2.frequency.exponentialRampToValueAtTime(300, now + 0.3);

        gain2.gain.setValueAtTime(0.3, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(now + 0.3);
        osc2.stop(now + 0.3);
    }

    playSuccess() {
        if (!this.enabled) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.5);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }

    playError() {
        if (!this.enabled) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.setValueAtTime(100, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playStartup() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 1.2);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(now + 1.2);
    }
}

window.soundManager = new SoundManager();
