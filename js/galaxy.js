/**
 * Galaxy & Portrait Engine - ULTRA 60FPS FOR MOBILE
 * 3D swirling galaxy that converges around a crystal-clear portrait of Amina.
 */

class GalaxyEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d', { alpha: true });
        this.particles = [];
        this.displayCount = 9494; // Symbol of infinite love
        this.simCount = 1200; // Perfect for locked 60 FPS on any phone
        this.state = 'GALAXY'; // 'GALAXY' or 'PORTRAIT'
        this.morphProgress = 0;
        this.targetMorph = 0;

        // 3D Rotation
        this.rotX = 0.52;
        this.rotY = 0;
        this.targetRotX = 0.52;
        this.targetRotY = 0;
        this.zoom = 1;
        this.targetZoom = 1;
        this.galaxySpeed = 0.0028;
        
        // Interaction
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.touchDist = 0;

        // Background stars
        this.bgStars = [];

        // Image
        this.img = new Image();
        this.imgLoaded = false;

        // Counter
        this.counterElement = document.getElementById('love-counter');
        this.counterCurrent = 0;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.initBackgroundStars();
        this.setupEvents();
        this.loadImage('assets/amina.png');
        this.animate();
    }

    resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = Math.floor(this.width * dpr);
        this.canvas.height = Math.floor(this.height * dpr);
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
        this.ctx.scale(dpr, dpr);

        if (this.imgLoaded) {
            this.recalculateCoordinates();
        }
    }

    initBackgroundStars() {
        this.bgStars = [];
        const count = 75;
        for (let i = 0; i < count; i++) {
            this.bgStars.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                size: Math.random() * 1.5 + 0.5,
                alpha: Math.random() * 0.7 + 0.3,
                twinkleSpeed: Math.random() * 0.03 + 0.01,
                twinkle: Math.random() * Math.PI * 2,
                color: Math.random() > 0.3 ? '#ffffff' : '#ffd1dc'
            });
        }
    }

    loadImage(src) {
        this.img.crossOrigin = "Anonymous";
        this.img.src = src;
        this.img.onload = () => {
            this.imgLoaded = true;
            this.createParticles();
        };
        this.img.onerror = () => {
            this.imgLoaded = true;
            this.createParticles();
        };
    }

    createParticles() {
        this.particles = [];
        const count = this.simCount;

        const arms = 3;
        const armOffsetMax = 0.45;
        const coreRadius = 30;
        const maxRadius = Math.min(this.width, this.height) * 0.65;

        const galaxyPalette = [
            { r: 255, g: 215, b: 180 }, // Gold star
            { r: 255, g: 140, b: 190 }, // Rose nebula
            { r: 180, g: 145, b: 255 }, // Violet glow
            { r: 150, g: 225, b: 255 }, // Ice blue
            { r: 255, g: 255, b: 255 }  // Pure white
        ];

        // Frame dimensions for portrait constellation
        const isMobile = this.width < 480;
        const pW = isMobile ? 220 : 250;
        const pH = isMobile ? 275 : 310;
        const pRadius = 24;

        for (let i = 0; i < count; i++) {
            const phrase = LOVE_LANGUAGES[i % LOVE_LANGUAGES.length];

            // 1. Galaxy 3D coordinates
            const r = coreRadius + Math.pow(Math.random(), 1.6) * (maxRadius - coreRadius);
            const arm = i % arms;
            const armAngle = (arm * 2 * Math.PI) / arms;
            const spiralAngle = r * 0.012;
            const randomOffset = (Math.random() - 0.5) * armOffsetMax * (r / maxRadius);
            const theta = armAngle + spiralAngle + randomOffset;

            const gx = Math.cos(theta) * r;
            const gy = (Math.random() - 0.5) * (20 + (1 - r / maxRadius) * 45);
            const gz = Math.sin(theta) * r;

            const gCol = galaxyPalette[i % galaxyPalette.length];

            // 2. Portrait constellation coordinates:
            // Part around perimeter halo, part twinkling across the photo
            let px, py, pz;
            if (i < count * 0.45) {
                // Outer glowing aura / frame
                const angle = Math.random() * Math.PI * 2;
                const spread = (Math.random() - 0.5) * 35;
                const halfW = pW / 2 + 10 + spread;
                const halfH = pH / 2 + 10 + spread;
                px = Math.cos(angle) * halfW;
                py = Math.sin(angle) * halfH - 20;
                pz = (Math.random() - 0.5) * 15;
            } else {
                // Starlight constellation overlay on photo
                px = (Math.random() - 0.5) * (pW - 20);
                py = (Math.random() - 0.5) * (pH - 20) - 20;
                pz = (Math.random() - 0.5) * 20;
            }

            this.particles.push({
                gx, gy, gz,
                orbitR: r,
                orbitAngle: theta,
                orbitSpeed: 0.003 + (1 / (r + 15)) * 0.5,

                px, py, pz,
                basePx: px / (pW / 2),
                basePy: (py + 20) / (pH / 2),

                gr: gCol.r, gg: gCol.g, gb: gCol.b,
                pr: gCol.r, pg: gCol.g, pb: gCol.b,

                phrase: phrase.native,
                isHeart: i % 5 === 0,
                alpha: Math.random() * 0.4 + 0.6,
                morphDelay: Math.random() * 0.3
            });
        }
    }

    recalculateCoordinates() {
        const isMobile = this.width < 480;
        const pW = isMobile ? 220 : 250;
        const pH = isMobile ? 275 : 310;

        for (let p of this.particles) {
            p.px = p.basePx * (pW / 2);
            p.py = p.basePy * (pH / 2) - 20;
        }
    }

    setupEvents() {
        const onStart = (x, y) => {
            this.isDragging = true;
            this.lastMouseX = x;
            this.lastMouseY = y;
        };

        const onMove = (x, y) => {
            if (this.isDragging) {
                const dx = x - this.lastMouseX;
                const dy = y - this.lastMouseY;
                this.targetRotY += dx * 0.005;
                this.targetRotX += dy * 0.005;
                this.lastMouseX = x;
                this.lastMouseY = y;
            }
        };

        const onEnd = () => {
            this.isDragging = false;
        };

        this.canvas.addEventListener('mousedown', (e) => onStart(e.clientX, e.clientY));
        window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
        window.addEventListener('mouseup', onEnd);

        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                onStart(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) {
                onMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        this.canvas.addEventListener('touchend', onEnd);

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.targetZoom = Math.max(0.7, Math.min(2.0, this.targetZoom - e.deltaY * 0.0012));
        }, { passive: false });

        this.canvas.addEventListener('click', (e) => {
            if (Math.abs(e.clientX - this.lastMouseX) < 5 && Math.abs(e.clientY - this.lastMouseY) < 5) {
                this.toggleState();
            }
        });
    }

    toggleState() {
        if (this.state === 'GALAXY') {
            this.morphToPortrait();
        } else {
            this.morphToGalaxy();
        }
    }

    morphToPortrait() {
        this.state = 'PORTRAIT';
        this.targetMorph = 1;
        this.targetRotX = 0;
        this.targetRotY = 0;
        this.targetZoom = 1;

        if (window.audioManager) {
            window.audioManager.triggerHaptic([30, 60]);
        }

        // Reveal Crystal Clear Photo Backdrop
        const backdrop = document.getElementById('portrait-backdrop');
        if (backdrop) {
            backdrop.classList.add('visible');
        }

        const hint = document.getElementById('galaxy-hint');
        if (hint) {
            hint.innerHTML = '✨ Тысячи признаний в любви соткали твой образ ❤️';
        }

        const btnToggle = document.getElementById('btn-toggle-view');
        if (btnToggle) {
            btnToggle.innerHTML = '🌌 Вращать Галактику';
        }

        setTimeout(() => {
            const signatureBox = document.getElementById('signature-section');
            if (signatureBox) signatureBox.classList.add('visible');
            if (window.animateSignature) window.animateSignature();
        }, 1200);
    }

    morphToGalaxy() {
        this.state = 'GALAXY';
        this.targetMorph = 0;
        this.targetRotX = 0.52;

        if (window.audioManager) {
            window.audioManager.triggerHaptic([30]);
        }

        const backdrop = document.getElementById('portrait-backdrop');
        if (backdrop) {
            backdrop.classList.remove('visible');
        }

        const hint = document.getElementById('galaxy-hint');
        if (hint) {
            hint.innerHTML = '🌌 Вращай галактику пальцем • Нажми кнопку внизу, чтобы собрать образ';
        }

        const btnToggle = document.getElementById('btn-toggle-view');
        if (btnToggle) {
            btnToggle.innerHTML = '✨ Собрать Портрет';
        }
    }

    update() {
        this.rotX += (this.targetRotX - this.rotX) * 0.09;
        this.rotY += (this.targetRotY - this.rotY) * 0.09;
        this.zoom += (this.targetZoom - this.zoom) * 0.09;

        if (this.state === 'GALAXY') {
            this.rotY += this.galaxySpeed;
        }

        this.morphProgress += (this.targetMorph - this.morphProgress) * 0.06;

        // Counter
        const targetCount = Math.round(this.morphProgress * this.displayCount);
        this.counterCurrent += Math.round((targetCount - this.counterCurrent) * 0.14);
        if (this.counterElement) {
            this.counterElement.innerText = this.counterCurrent.toLocaleString('ru-RU');
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 1. Cosmic Background Stars
        this.renderCosmicBackground();

        if (this.particles.length === 0) return;

        const cx = this.width / 2;
        const cy = this.height / 2;
        const cosX = Math.cos(this.rotX);
        const sinX = Math.sin(this.rotX);
        const cosY = Math.cos(this.rotY);
        const sinY = Math.sin(this.rotY);
        const fov = 600;
        const isGalaxy = this.morphProgress < 0.2;

        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = '10px "Caveat", "Montserrat", sans-serif';

        const count = this.particles.length;

        for (let i = 0; i < count; i++) {
            const p = this.particles[i];

            p.orbitAngle += p.orbitSpeed * 0.015;
            p.gx = Math.cos(p.orbitAngle) * p.orbitR;
            p.gz = Math.sin(p.orbitAngle) * p.orbitR;

            const localT = Math.max(0, Math.min(1, (this.morphProgress - p.morphDelay) / (1 - p.morphDelay + 0.001)));
            const easeT = localT * localT * (3 - 2 * localT);

            const curX = p.gx + (p.px - p.gx) * easeT;
            const curY = p.gy + (p.py - p.gy) * easeT;
            const curZ = p.gz + (p.pz - p.gz) * easeT;

            const x1 = curX * cosY - curZ * sinY;
            const z1 = curZ * cosY + curX * sinY;
            const y2 = curY * cosX - z1 * sinX;
            const z2 = z1 * cosX + curY * sinX;

            const scale = (fov / (fov + z2)) * this.zoom;
            if (scale <= 0) continue;

            const screenX = cx + x1 * scale;
            const screenY = cy + y2 * scale;

            if (screenX < -50 || screenX > this.width + 50 || screenY < -50 || screenY > this.height + 50) {
                continue;
            }

            const r = p.gr;
            const g = p.gg;
            const b = p.gb;

            if (isGalaxy) {
                if (i % 5 === 0) {
                    this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha})`;
                    this.ctx.fillText(p.isHeart ? '♥' : p.phrase, screenX, screenY);
                } else {
                    this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha * 0.85})`;
                    this.ctx.fillRect(screenX, screenY, scale * 2.2, scale * 2.2);
                }
            } else {
                // Portrait mode: glowing multilingual words & hearts framing the photo
                this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha * (0.8 + easeT * 0.2)})`;
                this.ctx.fillText(p.isHeart ? '♥' : p.phrase, screenX, screenY);
            }
        }
    }

    renderCosmicBackground() {
        for (let i = 0; i < this.bgStars.length; i++) {
            const s = this.bgStars[i];
            s.twinkle += s.twinkleSpeed;
            const a = s.alpha * (0.7 + Math.sin(s.twinkle) * 0.3);
            this.ctx.fillStyle = s.color;
            this.ctx.globalAlpha = a;
            this.ctx.fillRect(s.x, s.y, s.size, s.size);
        }
        this.ctx.globalAlpha = 1;
    }

    animate() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.animate());
    }

    // High-resolution image export
    exportHighResPortrait() {
        const exportCanvas = document.createElement('canvas');
        const size = 1800;
        exportCanvas.width = size;
        exportCanvas.height = size;
        const eCtx = exportCanvas.getContext('2d');

        // Dark Nebula Background
        const grad = eCtx.createRadialGradient(size/2, size/2, 100, size/2, size/2, size * 0.75);
        grad.addColorStop(0, '#150926');
        grad.addColorStop(0.5, '#0a0614');
        grad.addColorStop(1, '#020106');
        eCtx.fillStyle = grad;
        eCtx.fillRect(0, 0, size, size);

        // Stars
        for (let i = 0; i < 200; i++) {
            eCtx.fillStyle = Math.random() > 0.4 ? '#ffffff' : '#ffd1dc';
            eCtx.globalAlpha = Math.random() * 0.7 + 0.3;
            eCtx.fillRect(Math.random() * size, Math.random() * size, Math.random() * 2.5 + 1, Math.random() * 2.5 + 1);
        }
        eCtx.globalAlpha = 1;

        // Draw clear centered portrait of Amina
        const pW = 800;
        const pH = 1000;
        const pX = (size - pW) / 2;
        const pY = (size - pH) / 2 - 40;

        if (this.img && this.img.complete) {
            eCtx.save();
            // Rounded corners clip
            eCtx.beginPath();
            eCtx.roundRect(pX, pY, pW, pH, 40);
            eCtx.clip();
            eCtx.drawImage(this.img, pX, pY, pW, pH);
            eCtx.restore();

            // Glow border
            eCtx.strokeStyle = 'rgba(255, 216, 128, 0.5)';
            eCtx.lineWidth = 4;
            eCtx.strokeRect(pX, pY, pW, pH);
        }

        // Outer starlight words
        eCtx.textAlign = 'center';
        eCtx.textBaseline = 'middle';
        eCtx.font = '18px "Caveat", "Montserrat", sans-serif';
        eCtx.fillStyle = '#ffd880';

        for (let i = 0; i < 180; i++) {
            const phrase = LOVE_LANGUAGES[i % LOVE_LANGUAGES.length];
            const angle = (i / 180) * Math.PI * 2;
            const radX = pW / 2 + 50 + (i % 3) * 20;
            const radY = pH / 2 + 50 + (i % 3) * 20;
            const x = size / 2 + Math.cos(angle) * radX;
            const y = size / 2 - 40 + Math.sin(angle) * radY;
            eCtx.fillText(phrase.native, x, y);
        }

        // Gold Calligraphy Signature
        eCtx.fillStyle = '#ffd880';
        eCtx.font = '72px "Marck Script", cursive';
        eCtx.fillText('Амина ✨', size / 2, size - 120);

        eCtx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        eCtx.font = '24px "Montserrat", sans-serif';
        eCtx.fillText('Галактика из 9 494 признаний в любви', size / 2, size - 65);

        const link = document.createElement('a');
        link.download = 'Amina_Galaxy_Of_Love.png';
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
    }
}

window.GalaxyEngine = GalaxyEngine;
