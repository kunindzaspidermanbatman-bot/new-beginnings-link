// Audio utility for notification sounds
class AudioAlert {
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;

  private async initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume audio context if it's suspended (required by browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    }
  }

  async playNotificationSound(duration: number = 2500) {
    if (this.isPlaying) return;

    try {
      await this.initAudioContext();
      if (!this.audioContext) return;

      this.isPlaying = true;

      // Create oscillator for the sound
      this.oscillator = this.audioContext.createOscillator();
      this.gainNode = this.audioContext.createGain();

      // Connect nodes
      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      // Configure sound (notification bell-like tone)
      this.oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
      this.oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.1);
      this.oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime + 0.2);
      this.oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.3);
      
      // Set volume (loud but not overwhelming)
      this.gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      this.gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

      // Start and stop the sound
      this.oscillator.start(this.audioContext.currentTime);
      this.oscillator.stop(this.audioContext.currentTime + duration / 1000);

      // Clean up after sound ends
      this.oscillator.onended = () => {
        this.isPlaying = false;
        this.oscillator = null;
        this.gainNode = null;
      };

    } catch (error) {
      console.error('Error playing notification sound:', error);
      this.isPlaying = false;
    }
  }

  async playBookingSound(duration: number = 4000) {
    if (this.isPlaying) return;

    try {
      await this.initAudioContext();
      if (!this.audioContext) return;

      this.isPlaying = true;

      // Create a much more attention-grabbing sound for booking alerts
      this.oscillator = this.audioContext.createOscillator();
      this.gainNode = this.audioContext.createGain();

      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      // Urgent alarm-like pattern - much louder and more distinctive
      this.oscillator.frequency.setValueAtTime(1200, this.audioContext.currentTime);
      this.oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime + 0.15);
      this.oscillator.frequency.setValueAtTime(1200, this.audioContext.currentTime + 0.3);
      this.oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime + 0.45);
      this.oscillator.frequency.setValueAtTime(1200, this.audioContext.currentTime + 0.6);
      this.oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime + 0.75);
      this.oscillator.frequency.setValueAtTime(1200, this.audioContext.currentTime + 0.9);
      this.oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime + 1.05);
      this.oscillator.frequency.setValueAtTime(1200, this.audioContext.currentTime + 1.2);
      this.oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime + 1.35);
      this.oscillator.frequency.setValueAtTime(1200, this.audioContext.currentTime + 1.5);
      this.oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime + 1.65);
      this.oscillator.frequency.setValueAtTime(1200, this.audioContext.currentTime + 1.8);
      this.oscillator.frequency.linearRampToValueAtTime(600, this.audioContext.currentTime + 2.2);

      // Much louder volume - hard to miss!
      this.gainNode.gain.setValueAtTime(0.7, this.audioContext.currentTime);
      this.gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime + 0.1);
      this.gainNode.gain.setValueAtTime(0.7, this.audioContext.currentTime + 0.2);
      this.gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime + 0.3);
      this.gainNode.gain.setValueAtTime(0.7, this.audioContext.currentTime + 0.4);
      this.gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime + 0.5);
      this.gainNode.gain.setValueAtTime(0.7, this.audioContext.currentTime + 0.6);
      this.gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime + 0.7);
      this.gainNode.gain.setValueAtTime(0.7, this.audioContext.currentTime + 0.8);
      this.gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime + 0.9);
      this.gainNode.gain.setValueAtTime(0.7, this.audioContext.currentTime + 1.0);
      this.gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime + 1.1);
      this.gainNode.gain.setValueAtTime(0.7, this.audioContext.currentTime + 1.2);
      this.gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime + 1.3);
      this.gainNode.gain.setValueAtTime(0.7, this.audioContext.currentTime + 1.4);
      this.gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime + 1.5);
      this.gainNode.gain.setValueAtTime(0.7, this.audioContext.currentTime + 1.6);
      this.gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

      this.oscillator.start(this.audioContext.currentTime);
      this.oscillator.stop(this.audioContext.currentTime + duration / 1000);

      this.oscillator.onended = () => {
        this.isPlaying = false;
        this.oscillator = null;
        this.gainNode = null;
      };

    } catch (error) {
      console.error('Error playing booking sound:', error);
      this.isPlaying = false;
    }
  }

  stop() {
    if (this.oscillator && this.isPlaying) {
      this.oscillator.stop();
      this.isPlaying = false;
    }
  }
}

// Create singleton instance
export const audioAlert = new AudioAlert();