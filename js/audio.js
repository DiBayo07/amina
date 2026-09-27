/**
 * Audio and Haptics Manager
 * Plays Arctic Monkeys - I Wanna Be Yours via YouTube IFrame API + HTML5 Audio fallback,
 * and realistic wax seal crack sound on opening.
 */

class AudioManager {
    constructor() {
        this.ctx = null;
        this.bgMusic = null;
        this.ytPlayer = null;
        this.ytReady = false;
        this.isMusicPlaying = false;
        this.hasStarted = false;
        this.initAudioContext();
        this.initYouTube();
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

    // Initialize YouTube IFrame API for Arctic Monkeys - I Wanna Be Yours
    initYouTube() {
        window.onYouTubeIframeAPIReady = () => {
            try {
                this.ytPlayer = new YT.Player('yt-player', {
                    height: '1',
                    width: '1',
                    videoId: 'nyuo9-OjNNg', // Arctic Monkeys - I Wanna Be Yours (Official Audio)
                    playerVars: {
                        autoplay: 0,
                        controls: 0,
                        loop: 1,
                        playlist: 'nyuo9-OjNNg',
                        playsinline: 1
                    },
                    events: {
                        onReady: () => {
                            this.ytReady = true;
                            if (this.hasStarted && !this.isMusicPlaying) {
                                this.playMusic();
                            }
                        }
                    }
                });
            } catch (e) {
                console.warn("YouTube player init:", e);
            }
        };
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

    // Tactile haptic feedback
    triggerHaptic(pattern = [40, 60, 120, 80]) {
        if ('vibrate' in navigator) {
            try {
                navigator.vibrate(pattern);
            } catch (e) {
                // ignore
            }
        }
    }

    // Play Arctic Monkeys - I Wanna Be Yours
    playMusic() {
        this.hasStarted = true;
        this.ensureContextRunning();

        let played = false;

        // 1. Try YouTube Player (Official Track)
        if (this.ytPlayer && this.ytReady && typeof this.ytPlayer.playVideo === 'function') {
            try {
                this.ytPlayer.playVideo();
                this.isMusicPlaying = true;
                this.updatePlayerUI(true);
                played = true;
            } catch (e) {
                console.warn("YouTube play error:", e);
            }
        }

        // 2. Try HTML5 Audio
        if (!this.bgMusic) {
            this.bgMusic = document.getElementById('bg-music');
        }
        if (this.bgMusic) {
            this.bgMusic.play().then(() => {
                this.isMusicPlaying = true;
                this.updatePlayerUI(true);
            }).catch(() => {
                // If HTML5 audio is blocked and YouTube is still initializing, retry on next frame
                if (!played) {
                    setTimeout(() => {
                        if (this.ytPlayer && typeof this.ytPlayer.playVideo === 'function') {
                            this.ytPlayer.playVideo();
                            this.isMusicPlaying = true;
                            this.updatePlayerUI(true);
                        }
                    }, 1000);
                }
            });
        }
    }

    pauseMusic() {
        this.isMusicPlaying = false;
        if (this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
            this.ytPlayer.pauseVideo();
        }
        if (this.bgMusic) {
            this.bgMusic.pause();
        }
        this.updatePlayerUI(false);
    }

    toggleMusic() {
        if (this.isMusicPlaying) {
            this.pauseMusic();
        } else {
            this.playMusic();
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
