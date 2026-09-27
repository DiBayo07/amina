/**
 * Galaxy & Portrait Engine - ULTRA-OPTIMIZED (60 FPS on Mobile)
 * High-performance 3D galaxy of multilingual love phrases that morphs into Amina's portrait.
 */

class GalaxyEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d', { alpha: false, desynchronized: true });
        this.particles = [];
        this.displayCount = 9494; // Symbolic count for display
        this.simCount = 2800; // Optimal particle count for smooth 60fps
        this.state = 'GALAXY'; // 'GALAXY' or 'PORTRAIT'
        this.morphProgress = 0; // 0 = Galaxy, 1 = Portrait
        this.targetMorph = 0;

        // 3D Camera / Rotation
        this.rotX = 0.5;
        this.rotY = 0;
        this.targetRotX = 0.5;
        this.targetRotY = 0;
        this.zoom = 1;
        this.targetZoom = 1;
        this.galaxySpeed = 0.0025;
        
        // Interaction state
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.touchDist = 0;
        this.inspectPoint = null;

        // Background stars (pre-rendered for speed)
        this.bgStars = [];

        // Image data
        this.img = new Image();
        this.imgLoaded = false;
        this.sampledPixels = [];

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
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // Cap at 1.5 for performance
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = Math.floor(this.width * dpr);
        this.canvas.height = Math.floor(this.height * dpr);
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
        this.ctx.scale(dpr, dpr);

        if (this.imgLoaded) {
            this.recalculatePortraitCoordinates();
        }
    }

    initBackgroundStars() {
        this.bgStars = [];
        const count = 100;
        for (let i = 0; i < count; i++) {
            this.bgStars.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                size: Math.random() * 1.5 + 0.5,
                alpha: Math.random() * 0.7 + 0.3,
                twinkleSpeed: Math.random() * 0.03 + 0.01,
                twinkle: Math.random() * Math.PI * 2,
                color: Math.random() > 0.3 ? '#ffffff' : (Math.random() > 0.5 ? '#ffd1dc' : '#cce5ff')
            });
        }
    }

    loadImage(src) {
        this.img.crossOrigin = "Anonymous";
        this.img.src = src;
        this.img.onload = () => {
            this.processImage();
        };
        this.img.onerror = () => {
            console.warn("Generating procedural fallback portrait");
            this.generateProceduralPortrait();
        };
    }

    processImage() {
        const offCanvas = document.createElement('canvas');
        const offCtx = offCanvas.getContext('2d');
        const targetW = 160;
        const targetH = Math.round(targetW * (this.img.height / this.img.width));
        
        offCanvas.width = targetW;
        offCanvas.height = targetH;
        offCtx.drawImage(this.img, 0, 0, targetW, targetH);
        
        const imgData = offCtx.getImageData(0, 0, targetW, targetH);
        const data = imgData.data;

        this.sampledPixels = [];

        // Sample points with density weighted by contrast and facial features
        for (let y = 0; y < targetH; y += 1) {
            for (let x = 0; x < targetW; x += 1) {
                const idx = (y * targetW + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const a = data[idx + 3];

                if (a < 30) continue;

                const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                const isFeature = lum < 0.35 || (r > g + 15 && r > b + 10) || lum > 0.75;
                const prob = isFeature ? 0.75 : 0.32;

                if (Math.random() < prob) {
                    this.sampledPixels.push({
                        nx: (x / targetW - 0.5),
                        ny: (y / targetH - 0.5),
                        r, g, b,
                        lum,
                        isFeature
                    });
                }
            }
        }

        // Shuffle
        for (let i = this.sampledPixels.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.sampledPixels[i], this.sampledPixels[j]] = [this.sampledPixels[j], this.sampledPixels[i]];
        }

        this.imgLoaded = true;
        this.createParticles();
    }

    generateProceduralPortrait() {
        this.sampledPixels = [];
        for (let i = 0; i < this.simCount; i++) {
            const t = Math.random() * Math.PI * 2;
            const r = Math.sqrt(Math.random()) * 0.45;
            this.sampledPixels.push({
                nx: r * Math.cos(t),
                ny: r * Math.sin(t),
                r: 255, g: 190, b: 215,
                lum: 0.7,
                isFeature: true
            });
        }
        this.imgLoaded = true;
        this.createParticles();
    }

    createParticles() {
        this.particles = [];
        const count = Math.min(this.sampledPixels.length, this.simCount);

        const arms = 3;
        const armOffsetMax = 0.45;
        const coreRadius = 35;
        const maxRadius = Math.min(this.width, this.height) * 0.62;

        const galaxyPalette = [
            { r: 255, g: 215, b: 180 },
            { r: 255, g: 140, b: 190 },
            { r: 180, g: 145, b: 255 },
            { r: 150, g: 225, b: 255 },
            { r: 255, g: 255, b: 255 }
        ];

        for (let i = 0; i < count; i++) {
            const pixel = this.sampledPixels[i];
            const phrase = LOVE_LANGUAGES[i % LOVE_LANGUAGES.length];

            // 1. Galaxy coordinates
            const r = coreRadius + Math.pow(Math.random(), 1.6) * (maxRadius - coreRadius);
            const arm = i % arms;
            const armAngle = (arm * 2 * Math.PI) / arms;
            const spiralAngle = r * 0.012;
            const randomOffset = (Math.random() - 0.5) * armOffsetMax * (r / maxRadius);
            const theta = armAngle + spiralAngle + randomOffset;

            const gx = Math.cos(theta) * r;
            const gy = (Math.random() - 0.5) * (25 + (1 - r / maxRadius) * 50);
            const gz = Math.sin(theta) * r;

            const gCol = galaxyPalette[i % galaxyPalette.length];

            // 2. Portrait coordinates
            const portraitScale = Math.min(this.width * 0.85, this.height * 0.62, 440);
            const px = pixel.nx * portraitScale;
            const py = pixel.ny * portraitScale * (this.img.height / this.img.width || 1.1) - 15;
            const pz = (1 - pixel.lum) * 16 - 8;

            this.particles.push({
                gx, gy, gz,
                orbitR: r,
                orbitAngle: theta,
                orbitSpeed: 0.003 + (1 / (r + 15)) * 0.6,

                px, py, pz,
                basePx: pixel.nx,
                basePy: pixel.ny,

                gr: gCol.r, gg: gCol.g, gb: gCol.b,
                pr: pixel.r, pg: pixel.g, pb: pixel.b,

                phrase: phrase.native,
                isHeart: i % 7 === 0,
                alpha: Math.random() * 0.35 + 0.65,
                morphDelay: Math.random() * 0.35
            });
        }
    }

    recalculatePortraitCoordinates() {
        const portraitScale = Math.min(this.width * 0.85, this.height * 0.62, 440);
        const ratio = (this.img && this.img.height && this.img.width) ? (this.img.height / this.img.width) : 1.1;
        
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            p.px = p.basePx * portraitScale;
            p.py = p.basePy * portraitScale * ratio - 15;
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
            if (this.state === 'PORTRAIT') {
                this.inspectPoint = { x, y };
            }
        };

        const onEnd = () => {
            this.isDragging = false;
            this.inspectPoint = null;
        };

        this.canvas.addEventListener('mousedown', (e) => onStart(e.clientX, e.clientY));
        window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
        window.addEventListener('mouseup', onEnd);

        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                onStart(e.touches[0].clientX, e.touches[0].clientY);
            } else if (e.touches.length === 2) {
                this.touchDist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
            }
        }, { passive: true });

        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) {
                onMove(e.touches[0].clientX, e.touches[0].clientY);
            } else if (e.touches.length === 2) {
                const dist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                if (this.touchDist > 0) {
                    const delta = (dist - this.touchDist) * 0.004;
                    this.targetZoom = Math.max(0.7, Math.min(2.2, this.targetZoom + delta));
                }
                this.touchDist = dist;
            }
        }, { passive: true });

        this.canvas.addEventListener('touchend', onEnd);

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.targetZoom = Math.max(0.7, Math.min(2.2, this.targetZoom - e.deltaY * 0.0012));
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

        const hint = document.getElementById('galaxy-hint');
        if (hint) {
            hint.innerHTML = '✨ Тысячи признаний соткали твой образ.<br><span style="font-size:0.85em; opacity:0.8;">(Проведи пальцем по портрету, чтобы рассмотреть слова)</span>';
        }

        const btnToggle = document.getElementById('btn-toggle-view');
        if (btnToggle) {
            btnToggle.innerHTML = '🌌 Вращать Галактику';
        }

        setTimeout(() => {
            const signatureBox = document.getElementById('signature-section');
            if (signatureBox) signatureBox.classList.add('visible');
            if (window.animateSignature) window.animateSignature();
        }, 1600);
    }

    morphToGalaxy() {
        this.state = 'GALAXY';
        this.targetMorph = 0;
        this.targetRotX = 0.5;

        if (window.audioManager) {
            window.audioManager.triggerHaptic([30]);
        }

        const hint = document.getElementById('galaxy-hint');
        if (hint) {
            hint.innerHTML = '🌌 Вращай галактику пальцем • Нажми, чтобы собрать образ';
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

        this.morphProgress += (this.targetMorph - this.morphProgress) * 0.055;

        // Counter
        const targetCount = Math.round(this.morphProgress * this.displayCount);
        this.counterCurrent += Math.round((targetCount - this.counterCurrent) * 0.12);
        if (this.counterElement) {
            this.counterElement.innerText = this.counterCurrent.toLocaleString('ru-RU');
        }
    }

    render() {
        // Fast clear
        this.ctx.fillStyle = '#040208';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 1. Static/Twinkling Stars
        this.renderCosmicBackground();

        if (!this.imgLoaded || this.particles.length === 0) {
            this.ctx.fillStyle = 'rgba(255, 200, 220, 0.7)';
            this.ctx.font = '16px "Montserrat", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Загрузка галактики любви...', this.width / 2, this.height / 2);
            return;
        }

        const cx = this.width / 2;
        const cy = this.height / 2;
        const cosX = Math.cos(this.rotX);
        const sinX = Math.sin(this.rotX);
        const cosY = Math.cos(this.rotY);
        const sinY = Math.sin(this.rotY);
        const fov = 600;
        const isGalaxyMode = this.morphProgress < 0.15;
        const isPortraitMode = this.morphProgress > 0.85;

        // Batch canvas font setting ONCE per frame
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = '10px "Caveat", "Montserrat", sans-serif';

        const count = this.particles.length;

        for (let i = 0; i < count; i++) {
            const p = this.particles[i];

            // Update orbit
            p.orbitAngle += p.orbitSpeed * 0.015;
            p.gx = Math.cos(p.orbitAngle) * p.orbitR;
            p.gz = Math.sin(p.orbitAngle) * p.orbitR;

            // Interpolation
            const localT = Math.max(0, Math.min(1, (this.morphProgress - p.morphDelay) / (1 - p.morphDelay + 0.001)));
            const easeT = localT * localT * (3 - 2 * localT);

            const curX = p.gx + (p.px - p.gx) * easeT;
            const curY = p.gy + (p.py - p.gy) * easeT;
            const curZ = p.gz + (p.pz - p.gz) * easeT;

            // 3D rotation projection
            const x1 = curX * cosY - curZ * sinY;
            const z1 = curZ * cosY + curX * sinY;
            const y2 = curY * cosX - z1 * sinX;
            const z2 = z1 * cosX + curY * sinX;

            const scale = (fov / (fov + z2)) * this.zoom;
            if (scale <= 0) continue;

            const screenX = cx + x1 * scale;
            const screenY = cy + y2 * scale;

            // Skip off-screen particles
            if (screenX < -50 || screenX > this.width + 50 || screenY < -50 || screenY > this.height + 50) {
                continue;
            }

            // Blended colors
            const r = Math.round(p.gr + (p.pr - p.gr) * easeT);
            const g = Math.round(p.gg + (p.pg - p.gg) * easeT);
            const b = Math.round(p.gb + (p.pb - p.gb) * easeT);

            // In Galaxy Mode: draw ultra-fast stardust points + occasional text phrases
            if (isGalaxyMode) {
                if (i % 6 === 0) {
                    this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha})`;
                    this.ctx.fillText(p.isHeart ? '♥' : p.phrase, screenX, screenY);
                } else {
                    this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha * 0.85})`;
                    this.ctx.fillRect(screenX, screenY, scale * 2.2, scale * 2.2);
                }
            } else {
                // In Portrait / Morph Mode: draw text particles
                let text = p.isHeart ? '♥' : p.phrase;
                
                // Magnifier on touch/hover
                if (this.inspectPoint && isPortraitMode) {
                    const dist = Math.hypot(screenX - this.inspectPoint.x, screenY - this.inspectPoint.y);
                    if (dist < 90) {
                        this.ctx.font = '15px "Caveat", "Montserrat", sans-serif';
                        this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                        this.ctx.fillText(text, screenX, screenY);
                        this.ctx.font = '10px "Caveat", "Montserrat", sans-serif';
                        continue;
                    }
                }

                this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha * (0.7 + easeT * 0.3)})`;
                this.ctx.fillText(text, screenX, screenY);
            }
        }
    }

    renderCosmicBackground() {
        // Fast ambient background
        const grad = this.ctx.createRadialGradient(
            this.width / 2, this.height / 2, 40,
            this.width / 2, this.height / 2, Math.max(this.width, this.height) * 0.75
        );
        grad.addColorStop(0, '#130822');
        grad.addColorStop(0.6, '#080413');
        grad.addColorStop(1, '#030107');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Background stars
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

        // Portrait text particles
        const portraitScale = size * 0.72;
        const cx = size / 2;
        const cy = size / 2 - 50;
        const ratio = (this.img && this.img.height && this.img.width) ? (this.img.height / this.img.width) : 1.1;

        eCtx.textAlign = 'center';
        eCtx.textBaseline = 'middle';

        for (let p of this.particles) {
            const x = cx + p.basePx * portraitScale;
            const y = cy + p.basePy * portraitScale * ratio;
            const fontSize = p.isHeart ? 16 : 13;

            eCtx.font = `${p.isHeart ? 'bold ' : ''}${fontSize}px "Caveat", "Montserrat", sans-serif`;
            eCtx.fillStyle = `rgb(${p.pr}, ${p.pg}, ${p.pb})`;
            eCtx.fillText(p.isHeart ? '♥' : p.phrase, x, y);
        }

        // Gold Signature
        eCtx.fillStyle = '#ffd880';
        eCtx.font = '68px "Marck Script", cursive';
        eCtx.fillText('Амина ✨', size / 2, size - 130);

        eCtx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        eCtx.font = '24px "Montserrat", sans-serif';
        eCtx.fillText('Галактика из 9 494 признаний в любви', size / 2, size - 75);

        const link = document.createElement('a');
        link.download = 'Amina_Galaxy_Of_Love.png';
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
    }
}

window.GalaxyEngine = GalaxyEngine;
