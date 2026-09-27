/**
 * Audio and Haptics Manager
 * Handles ONLY wax seal cracking sound and background music playback (Arctic Monkeys - I Wanna Be Yours).
 */

class AudioManager {
    constructor() {
        this.ctx = null;
        this.bgMusic = null;
        this.isMusicPlaying = false;
        this.initAudioContext();
    }

    initAudioContext() {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
            this.ctx = new AudioCtx();
        }
    }

    ensureContextRunning() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Realistic wax seal breaking / cracking sound synthesis
    playWaxCrackSound() {
        try {
            this.ensureContextRunning();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            
            // Transient sharp snap
            const snapOsc = this.ctx.createOscillator();
            const snapGain = this.ctx.createGain();
            snapOsc.type = 'triangle';
            snapOsc.frequency.setValueAtTime(800, now);
            snapOsc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
            
            snapGain.gain.setValueAtTime(0.8, now);
            snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

            snapOsc.connect(snapGain);
            snapGain.connect(this.ctx.destination);
            snapOsc.start(now);
            snapOsc.stop(now + 0.1);

            // Micro-crackle noise bursts
            for (let i = 0; i < 5; i++) {
                const delay = i * 0.02 + Math.random() * 0.015;
                const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let j = 0; j < bufferSize; j++) {
                    data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufferSize * 0.25));
                }

                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.value = 1800 + Math.random() * 2200;
                filter.Q.value = 4.0;

                const gain = this.ctx.createGain();
                const startTime = now + delay;
                gain.gain.setValueAtTime(0.4 / (i + 1), startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);

                noise.start(startTime);
                noise.stop(startTime + 0.05);
            }

            // Paper thud
            const thudOsc = this.ctx.createOscillator();
            const thudGain = this.ctx.createGain();
            thudOsc.type = 'sine';
            thudOsc.frequency.setValueAtTime(140, now);
            thudOsc.frequency.exponentialRampToValueAtTime(40, now + 0.18);
            
            thudGain.gain.setValueAtTime(0.5, now);
            thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

            thudOsc.connect(thudGain);
            thudGain.connect(this.ctx.destination);
            thudOsc.start(now);
            thudOsc.stop(now + 0.22);

        } catch (e) {
            console.warn("Wax sound error:", e);
        }
    }

    // Tactile haptic feedback (silent)
    triggerHaptic(pattern = [40, 60, 120, 80]) {
        if ('vibrate' in navigator) {
            try {
                navigator.vibrate(pattern);
            } catch (e) {
                // ignore
            }
        }
    }

    // Background music initialization and playback
    initMusic() {
        if (!this.bgMusic) {
            this.bgMusic = document.getElementById('bg-music');
            if (this.bgMusic) {
                this.bgMusic.volume = 0;
            }
        }
    }

    playMusic() {
        this.initMusic();
        if (!this.bgMusic) return;

        this.bgMusic.play().then(() => {
            this.isMusicPlaying = true;
            this.fadeInMusic();
            this.updatePlayerUI(true);
        }).catch((err) => {
            console.log("Audio waiting for user gesture:", err);
        });
    }

    pauseMusic() {
        if (this.bgMusic) {
            this.bgMusic.pause();
            this.isMusicPlaying = false;
            this.updatePlayerUI(false);
        }
    }

    toggleMusic() {
        if (this.isMusicPlaying) {
            this.pauseMusic();
        } else {
            this.playMusic();
        }
    }

    fadeInMusic(targetVol = 0.75, duration = 2500) {
        if (!this.bgMusic) return;
        let start = Date.now();
        const initialVol = this.bgMusic.volume;
        const interval = setInterval(() => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            this.bgMusic.volume = initialVol + (targetVol - initialVol) * progress;
            if (progress >= 1) {
                clearInterval(interval);
            }
        }, 50);
    }

    updatePlayerUI(isPlaying) {
        const disc = document.getElementById('music-disc');
        if (disc) {
            if (isPlaying) {
                disc.classList.add('playing');
            } else {
                disc.classList.remove('playing');
            }
        }
    }
}

window.audioManager = new AudioManager();
