// Tiện ích phát âm thanh chuông gọi đi và chuông đến tự động bằng Web Audio API thuần (không cần file mp3)
class CallRingtoneManager {
  private audioCtx: AudioContext | null = null;
  private isPlaying = false;
  private ringInterval: number | null = null;

  private initContext() {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Phát tiếng chuông "tút... tút..." khi bấm gọi đi
   */
  public playOutgoingRingtone() {
    this.stopRingtone();
    this.initContext();
    this.isPlaying = true;

    const playBeep = () => {
      if (!this.isPlaying || !this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.audioCtx.currentTime); // 440Hz chuẩn US ringtone

      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 1.2);
    };

    playBeep();
    this.ringInterval = window.setInterval(playBeep, 3500);
  }

  /**
   * Phát tiếng chuông reo vui tai khi có người gọi tới
   */
  public playIncomingRingtone() {
    this.stopRingtone();
    this.initContext();
    this.isPlaying = true;

    const playChime = () => {
      if (!this.isPlaying || !this.audioCtx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        const startTime = this.audioCtx.currentTime + idx * 0.15;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    };

    playChime();
    this.ringInterval = window.setInterval(playChime, 2500);
  }

  /**
   * Phát tiếng bíp ngắn báo hiệu cuộc gọi kết thúc
   */
  public playEndTone() {
    this.stopRingtone();
    this.initContext();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, this.audioCtx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.4);
  }

  /**
   * Dừng toàn bộ âm thanh chuông đang phát
   */
  public stopRingtone() {
    this.isPlaying = false;
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }
}

export const callRingtone = new CallRingtoneManager();
