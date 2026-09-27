/**
 * Main Application Coordinator
 * Manages screen transitions, letter typing flow, wax shattering,
 * music player widgets, and interactive galaxy controls.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Screens
    const screenEnvelope = document.getElementById('screen-envelope');
    const screenLetter = document.getElementById('screen-letter');
    const screenPolaroid = document.getElementById('screen-polaroid');
    const screenGalaxy = document.getElementById('screen-galaxy');

    // Envelope Elements
    const waxSealBtn = document.getElementById('wax-seal-btn');
    const envelopeEl = document.getElementById('envelope-element');
    const sealShards = document.getElementById('seal-shards');
    const envWrapper = document.getElementById('envelope-card');

    // Letter Elements
    const paragraphs = document.querySelectorAll('#letter-paragraphs p');
    const btnSkipTyping = document.getElementById('btn-skip-typing');
    const btnToPolaroid = document.getElementById('btn-to-polaroid');

    // Polaroid Elements
    const btnToGalaxy = document.getElementById('btn-to-galaxy');

    // Galaxy Elements
    const btnToggleView = document.getElementById('btn-toggle-view');
    const btnSaveImage = document.getElementById('btn-save-image');
    const btnShare = document.getElementById('btn-share');
    const musicWidget = document.getElementById('music-widget');
    const toast = document.getElementById('toast');

    let galaxyEngine = null;
    let typingInterval = null;
    let currentParagraphIdx = 0;
    let hasOpened = false;

    // Screen transition utility
    function switchScreen(activeScreen) {
        [screenEnvelope, screenLetter, screenPolaroid, screenGalaxy].forEach(s => {
            if (s) s.classList.remove('active');
        });
        if (activeScreen) {
            activeScreen.classList.add('active');
        }
    }

    // Toast notification
    function showToast(message) {
        if (!toast) return;
        toast.innerText = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // ==========================================================
    // STEP 1: WAX SEAL SHATTER & ENVELOPE OPEN
    // ==========================================================
    function triggerWaxShatter(e) {
        if (hasOpened) return;
        hasOpened = true;

        // Audio & Haptics
        try {
            if (window.audioManager) {
                window.audioManager.playWaxCrackSound();
                window.audioManager.triggerHaptic([50, 70, 180, 90]);
            }
        } catch (err) {
            console.warn(err);
        }

        // Dynamic wax shards
        try {
            if (sealShards) {
                sealShards.innerHTML = '';
                sealShards.classList.add('cracking');
                const shardCount = 16;
                for (let i = 0; i < shardCount; i++) {
                    const shard = document.createElement('div');
                    shard.className = 'shard';
                    const size = Math.random() * 14 + 6;
                    shard.style.width = `${size}px`;
                    shard.style.height = `${size * 0.8}px`;
                    shard.style.top = '35%';
                    shard.style.left = '35%';

                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * 120 + 50;
                    const tx = Math.cos(angle) * dist;
                    const ty = Math.sin(angle) * dist;
                    const rot = (Math.random() - 0.5) * 720;

                    shard.style.setProperty('--tx', `${tx}px`);
                    shard.style.setProperty('--ty', `${ty}px`);
                    shard.style.setProperty('--rot', `${rot}deg`);
                    sealShards.appendChild(shard);
                }
            }
        } catch (err) {}

        // Envelope breaking animation
        if (envelopeEl) {
            envelopeEl.classList.add('opening');
        }

        // Transition to letter and start music
        setTimeout(() => {
            switchScreen(screenLetter);
            startLetterTyping();
            try {
                if (window.audioManager) {
                    window.audioManager.playMusic();
                }
            } catch (err) {}
        }, 600);
    }

    // Support both click, touch, and pointer
    if (waxSealBtn) {
        waxSealBtn.addEventListener('click', triggerWaxShatter);
        waxSealBtn.addEventListener('touchend', triggerWaxShatter);
    }
    if (envWrapper) {
        envWrapper.addEventListener('click', triggerWaxShatter);
        envWrapper.addEventListener('touchend', triggerWaxShatter);
    }

    // ==========================================================
    // STEP 2: LETTER REVEAL
    // ==========================================================
    function startLetterTyping() {
        currentParagraphIdx = 0;
        
        function revealNext() {
            if (currentParagraphIdx < paragraphs.length) {
                const p = paragraphs[currentParagraphIdx];
                p.classList.add('revealed');
                currentParagraphIdx++;
                typingInterval = setTimeout(revealNext, 2000);
            }
        }

        revealNext();
    }

    function revealAllParagraphs() {
        if (typingInterval) clearTimeout(typingInterval);
        paragraphs.forEach(p => p.classList.add('revealed'));
        if (btnSkipTyping) btnSkipTyping.style.display = 'none';
    }

    if (btnSkipTyping) {
        btnSkipTyping.addEventListener('click', revealAllParagraphs);
    }

    if (btnToPolaroid) {
        btnToPolaroid.addEventListener('click', () => {
            switchScreen(screenPolaroid);
            if (window.audioManager) {
                window.audioManager.triggerHaptic([30]);
            }
        });
    }

    // ==========================================================
    // STEP 3: POLAROID TO GALAXY
    // ==========================================================
    if (btnToGalaxy) {
        btnToGalaxy.addEventListener('click', () => {
            switchScreen(screenGalaxy);
            if (!galaxyEngine) {
                galaxyEngine = new GalaxyEngine('galaxy-canvas');
                window.galaxyEngine = galaxyEngine;
            }
            if (window.audioManager) {
                window.audioManager.triggerHaptic([40]);
            }
        });
    }

    // ==========================================================
    // STEP 4 & 5: GALAXY CONTROLS & FINALE
    // ==========================================================
    if (btnToggleView) {
        btnToggleView.addEventListener('click', () => {
            if (galaxyEngine) {
                galaxyEngine.toggleState();
            }
        });
    }

    if (btnSaveImage) {
        btnSaveImage.addEventListener('click', () => {
            if (galaxyEngine) {
                galaxyEngine.exportHighResPortrait();
                showToast('✨ Портрет сохранён в галерею!');
            }
        });
    }

    if (btnShare) {
        btnShare.addEventListener('click', () => {
            const shareData = {
                title: 'Галактика признаний для Амины ❤️',
                text: 'Тысячи признаний в любви соткали твой образ...',
                url: window.location.href
            };

            if (navigator.share && /mobile|android|iphone/i.test(navigator.userAgent)) {
                navigator.share(shareData).catch(() => {});
            } else {
                navigator.clipboard.writeText(window.location.href).then(() => {
                    showToast('🔗 Ссылка скопирована в буфер обмена!');
                }).catch(() => {
                    showToast('Ссылка: ' + window.location.href);
                });
            }
        });
    }

    if (musicWidget) {
        musicWidget.addEventListener('click', () => {
            if (window.audioManager) {
                window.audioManager.toggleMusic();
            }
        });
    }

    // Signature drawing trigger
    window.animateSignature = function() {
        const sigPath = document.getElementById('signature-path');
        if (sigPath) {
            sigPath.classList.remove('draw');
            void sigPath.offsetWidth; // Trigger reflow
            sigPath.classList.add('draw');
        }
    };
});
