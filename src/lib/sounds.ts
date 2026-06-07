class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled = true;

  private init() {
    if (!this.audioContext && typeof window !== 'undefined') {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioContext = new AudioContextClass();
        }
      } catch (e) {
        console.warn('Web Audio API not supported in this frame environment:', e);
      }
    }
  }

  play(type: 'correct' | 'wrong' | 'click' | 'levelup') {
    if (!this.enabled) return;
    this.init();
    if (!this.audioContext) return;

    // Support resuming Suspended state due to autoplay interaction limits
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      const now = this.audioContext.currentTime;
      
      switch (type) {
        case 'correct':
          // Smooth bell tone: major 3rd jump
          oscillator.type = 'triangle';
          oscillator.frequency.setValueAtTime(523.25, now); // C5
          oscillator.frequency.setValueAtTime(659.25, now + 0.08); // E5
          
          gainNode.gain.setValueAtTime(0.12, now);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
          
          oscillator.start(now);
          oscillator.stop(now + 0.4);
          break;
          
        case 'wrong':
          // Falling low buzz
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(180, now);
          oscillator.frequency.linearRampToValueAtTime(120, now + 0.25);
          
          gainNode.gain.setValueAtTime(0.1, now);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
          
          oscillator.start(now);
          oscillator.stop(now + 0.3);
          break;
          
        case 'levelup':
          // Triad cascade
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(392.00, now); // G4
          oscillator.frequency.setValueAtTime(523.25, now + 0.08); // C5
          oscillator.frequency.setValueAtTime(659.25, now + 0.16); // E5
          oscillator.frequency.setValueAtTime(783.99, now + 0.24); // G5
          
          gainNode.gain.setValueAtTime(0.15, now);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
          
          oscillator.start(now);
          oscillator.stop(now + 0.65);
          break;
          
        case 'click':
          // Mini mechanical state click tick
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(1200, now);
          
          gainNode.gain.setValueAtTime(0.04, now);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
          
          oscillator.start(now);
          oscillator.stop(now + 0.08);
          break;
      }
    } catch (e) {
      // Audio execution failure (safe fallback)
    }
  }

  enable() { this.enabled = true; }
  disable() { this.enabled = false; }
  toggle() { this.enabled = !this.enabled; }
  isEnabled() { return this.enabled; }
}

export const sounds = new SoundManager();
