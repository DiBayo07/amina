/**
 * Audio and Haptics Manager - 100% ROBUST & INDEPENDENT
 * Plays "Arctic Monkeys - I Wanna Be Yours" via high-fidelity Web Audio Synthesizer + Audio element,
 * and realistic wax seal crack sound on opening. Zero external script dependencies.
 */

class AudioManager {
    constructor() {
        this.ctx = null;
        this.bgMusic = null;
        this.isMusicPlaying = false;
        this.synthTimer = null;
        this.initAudioContext();
    }

    initAudioContext() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        } catch (e) {
            console.warn("AudioContext init error:", e);
        }
    }

    ensureContextRunning() {
        try {
            if (!this.ctx) {
                this.initAudioContext();
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        } catch (e) {}
    }

    // Realistic wax seal breaking / cracking sound synthesis
    playWaxCrackSound() {
        try {
            this.ensureContextRunning();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            
            // 1. Sharp Snap
            const snapOsc = this.ctx.createOscillator();
            const snapGain = this.ctx.createGain();
            snapOsc.type = 'triangle';
            snapOsc.frequency.setValueAtTime(850, now);
            snapOsc.frequency.exponentialRampToValueAtTime(70, now + 0.08);
            
            snapGain.gain.setValueAtTime(0.85, now);
            snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

            snapOsc.connect(snapGain);
            snapGain.connect(this.ctx.destination);
            snapOsc.start(now);
            snapOsc.stop(now + 0.1);

            // 2. Micro-crackle noise bursts
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
                filter.frequency.value = 1900 + Math.random() * 2000;
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

            // 3. Paper thud
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

    // Tactile haptic feedback
    triggerHaptic(pattern = [40, 60, 120, 80]) {
        try {
            if (navigator && typeof navigator.vibrate === 'function') {
                navigator.vibrate(pattern);
            }
        } catch (e) {}
    }

    // Play Arctic Monkeys - I Wanna Be Yours (Guitar chords + bass + melody)
    playMusic() {
        this.ensureContextRunning();
        this.isMusicPlaying = true;
        this.updatePlayerUI(true);

        // 1. Try HTML5 Audio element
        if (!this.bgMusic) {
            this.bgMusic = document.getElementById('bg-music');
        }
        if (this.bgMusic) {
            this.bgMusic.volume = 0.7;
            this.bgMusic.play().catch(() => {
                // If audio file is missing or blocked, start the Web Audio engine
                this.startIWSBYSynth();
            });
        } else {
            this.startIWSBYSynth();
        }
    }

    pauseMusic() {
        this.isMusicPlaying = false;
        if (this.bgMusic) {
            try { this.bgMusic.pause(); } catch(e){}
        }
        this.stopIWSBYSynth();
        this.updatePlayerUI(false);
    }

    toggleMusic() {
        if (this.isMusicPlaying) {
            this.pauseMusic();
        } else {
            this.playMusic();
        }
    }

    // High-Fidelity Synthesizer for "I Wanna Be Yours" - Arctic Monkeys
    // Iconic Cm - Gm - Ab - Bb chords with electric guitar vibrato and warm bass
    startIWSBYSynth() {
        if (this.synthTimer || !this.ctx) return;

        // Tempo: ~68 BPM (Slow sensual Arctic Monkeys groove)
        const chordDuration = 3.6; // seconds per chord
        
        // Arctic Monkeys - I Wanna Be Yours Progression
        const progression = [
            {
                name: 'Cm',
                bass: 65.41, // C2
                guitar: [130.81, 196.00, 261.63, 311.13, 392.00], // C3, G3, C4, Eb4, G4
                melody: 523.25 // C5
            },
            {
                name: 'Gm',
                bass: 49.00, // G1
                guitar: [98.00, 196.00, 293.66, 392.00, 466.16], // G2, G3, D4, G4, Bb4
                melody: 466.16 // Bb4
            },
            {
                name: 'Ab',
                bass: 51.91, // Ab1
                guitar: [103.83, 207.65, 261.63, 311.13, 415.30], // Ab2, Ab3, C4, Eb4, Ab4
                melody: 415.30 // Ab4
            },
            {
                name: 'Bb',
                bass: 58.27, // Bb1
                guitar: [116.54, 233.08, 293.66, 349.23, 466.16], // Bb2, Bb3, D4, F4, Bb4
                melody: 349.23 // F4
            }
        ];

        let step = 0;

        const playStep = () => {
            if (!this.isMusicPlaying || !this.ctx) return;
            this.ensureContextRunning();
            const now = this.ctx.currentTime;
            const current = progression[step % progression.length];
            step++;

            // 1. Warm Electric Bass (Deep Sine/Triangle with lowpass)
            const bassOsc = this.ctx.createOscillator();
            const bassGain = this.ctx.createGain();
            const bassFilter = this.ctx.createBiquadFilter();

            bassOsc.type = 'triangle';
            bassOsc.frequency.setValueAtTime(current.bass, now);

            bassFilter.type = 'lowpass';
            bassFilter.frequency.setValueAtTime(220, now);

            bassGain.gain.setValueAtTime(0, now);
            bassGain.gain.linearRampToValueAtTime(0.35, now + 0.1);
            bassGain.gain.exponentialRampToValueAtTime(0.001, now + chordDuration - 0.1);

            bassOsc.connect(bassFilter);
            bassFilter.connect(bassGain);
            bassGain.connect(this.ctx.destination);

            bassOsc.start(now);
            bassOsc.stop(now + chordDuration);

            // 2. Slow Strummed Guitar Chords (Arpeggiated)
            current.guitar.forEach((freq, idx) => {
                const noteTime = now + idx * 0.06; // Strum timing
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const filter = this.ctx.createBiquadFilter();

                // Warm electric guitar timbre
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, noteTime);

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(750, noteTime);
                filter.frequency.exponentialRampToValueAtTime(350, noteTime + 2.5);

                gain.gain.setValueAtTime(0, noteTime);
                gain.gain.linearRampToValueAtTime(0.035, noteTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.0005, noteTime + 3.2);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(noteTime);
                osc.stop(noteTime + 3.4);
            });

            // 3. Gentle Rhodes / Bell Melody Note
            if (current.melody) {
                const melOsc = this.ctx.createOscillator();
                const melGain = this.ctx.createGain();
                melOsc.type = 'sine';
                melOsc.frequency.setValueAtTime(current.melody, now + 0.4);

                melGain.gain.setValueAtTime(0, now + 0.4);
                melGain.gain.linearRampToValueAtTime(0.04, now + 0.5);
                melGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

                melOsc.connect(melGain);
                melGain.connect(this.ctx.destination);

                melOsc.start(now + 0.4);
                melOsc.stop(now + 2.9);
            }

            this.synthTimer = setTimeout(playStep, chordDuration * 1000);
        };

        playStep();
    }

    stopIWSBYSynth() {
        if (this.synthTimer) {
            clearTimeout(this.synthTimer);
            this.synthTimer = null;
        }
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
