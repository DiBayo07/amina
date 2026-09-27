/**
 * Audio and Haptics Manager
 * Handles realistic wax seal cracking sound via Web Audio API,
 * background music playback (Arctic Monkeys - I Wanna Be Yours),
 * and tactile haptic vibration.
 */

class AudioManager {
    constructor() {
        this.ctx = null;
        this.bgMusic = null;
        this.isMusicPlaying = false;
        this.musicVolume = 0.65;
        this.ambientSynthActive = false;
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
            
            // 1. Transient burst - the initial sharp snap
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

            // 2. Multiple micro-crackle noise bursts (fracture shards)
            for (let i = 0; i < 6; i++) {
                const delay = i * 0.02 + Math.random() * 0.015;
                const bufferSize = this.ctx.sampleRate * 0.04;
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

            // 3. Low-frequency paper thud
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
            console.warn("Audio synthesis error:", e);
        }
    }

    // Gentle harp / chime sound for galaxy morphing
    playGalaxyMorphSound() {
        try {
            this.ensureContextRunning();
            if (!this.ctx) return;

            const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C5, E5, G5, C6, E6, G6
            const now = this.ctx.currentTime;

            notes.forEach((freq, index) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                
                osc.type = 'sine';
                osc.frequency.value = freq;

                const startTime = now + index * 0.08;
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(0.18, startTime + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.2);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(startTime);
                osc.stop(startTime + 1.3);
            });
        } catch (e) {
            console.warn("Morph sound error:", e);
        }
    }

    // Sparkle chime when signature finishes
    playSparkleSound() {
        try {
            this.ensureContextRunning();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const freqs = [1046.5, 1318.5, 1567.98, 2093.0];
            freqs.forEach((f, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = f;
                const st = now + idx * 0.05;
                gain.gain.setValueAtTime(0.1, st);
                gain.gain.exponentialRampToValueAtTime(0.001, st + 0.6);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(st);
                osc.stop(st + 0.65);
            });
        } catch (e) {
            console.warn("Sparkle sound error:", e);
        }
    }

    // Tactile haptic feedback
    triggerHaptic(pattern = [40, 60, 120, 80]) {
        if ('vibrate' in navigator) {
            try {
                navigator.vibrate(pattern);
            } catch (e) {
                // Ignore if blocked by browser policy
            }
        }
    }

    // Background music initialization and playback (Arctic Monkeys - I Wanna Be Yours)
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
            console.log("Autoplay blocked or track loading, will resume on touch:", err);
            // Setup fallback synthesizer chords in case audio file is blocked
            this.startAmbientSynthFallback();
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

    fadeInMusic(targetVol = 0.7, duration = 3000) {
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
        const playIcon = document.getElementById('music-play-icon');
        const pauseIcon = document.getElementById('music-pause-icon');
        if (disc) {
            if (isPlaying) {
                disc.classList.add('playing');
                if (playIcon) playIcon.style.display = 'none';
                if (pauseIcon) pauseIcon.style.display = 'block';
            } else {
                disc.classList.remove('playing');
                if (playIcon) playIcon.style.display = 'block';
                if (pauseIcon) pauseIcon.style.display = 'none';
            }
        }
    }

    // Romantic ambient synthesizer (plays warm guitar/rhodes-like chords if audio is muted or loading)
    startAmbientSynthFallback() {
        if (this.ambientSynthActive || !this.ctx) return;
        this.ambientSynthActive = true;
        
        // Arctic Monkeys - I Wanna Be Yours progression (Cm - Gm - Ab - Bb in romantic lo-fi voicings)
        const chords = [
            [261.63, 311.13, 392.00], // Cm
            [196.00, 233.08, 293.66], // Gm
            [207.65, 261.63, 311.13], // Ab
            [233.08, 293.66, 349.23]  // Bb
        ];

        let chordIdx = 0;
        const playNextChord = () => {
            if (!this.ambientSynthActive || !this.ctx) return;
            const now = this.ctx.currentTime;
            const chord = chords[chordIdx % chords.length];
            chordIdx++;

            chord.forEach(freq => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const filter = this.ctx.createBiquadFilter();

                osc.type = 'sine';
                osc.frequency.value = freq;

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(600, now);

                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.035, now + 0.8);
                gain.gain.exponentialRampToValueAtTime(0.0005, now + 3.8);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now);
                osc.stop(now + 4.0);
            });

            setTimeout(playNextChord, 4000);
        };

        playNextChord();
    }
}

window.audioManager = new AudioManager();
