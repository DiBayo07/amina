/**
 * Galaxy & Portrait Engine
 * Renders a 3D rotating particle galaxy made of thousands of "I love you" phrases in 75+ languages
 * that morphs into a high-density portrait of Amina sampled from her photo.
 */

class GalaxyEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.totalParticles = 9494; // Symbol of infinite love
        this.state = 'GALAXY'; // 'GALAXY' or 'PORTRAIT'
        this.morphProgress = 0; // 0 = Galaxy, 1 = Portrait
        this.targetMorph = 0;

        // 3D Camera / Rotation
        this.rotX = 0.55;
        this.rotY = 0;
        this.targetRotX = 0.55;
        this.targetRotY = 0;
        this.zoom = 1;
        this.targetZoom = 1;
        this.galaxySpeed = 0.003;
        
        // Interaction state
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.touchDist = 0;
        this.inspectPoint = null; // { x, y } for magnifier

        // Background stars
        this.bgStars = [];

        // Image data
        this.img = new Image();
        this.imgLoaded = false;
        this.pixelMap = [];

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
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
        this.ctx.scale(dpr, dpr);

        if (this.imgLoaded) {
            this.recalculatePortraitCoordinates();
        }
    }

    initBackgroundStars() {
        this.bgStars = [];
        const count = 180;
        for (let i = 0; i < count; i++) {
            this.bgStars.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                size: Math.random() * 1.8 + 0.5,
                alpha: Math.random() * 0.8 + 0.2,
                twinkleSpeed: Math.random() * 0.02 + 0.005,
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
            console.warn("Could not load image directly, generating procedural heart portrait fallback");
            this.generateProceduralPortrait();
        };
    }

    processImage() {
        // Sample image pixels on offscreen canvas
        const offCanvas = document.createElement('canvas');
        const offCtx = offCanvas.getContext('2d');
        const targetW = 220;
        const targetH = Math.round(targetW * (this.img.height / this.img.width));
        
        offCanvas.width = targetW;
        offCanvas.height = targetH;
        offCtx.drawImage(this.img, 0, 0, targetW, targetH);
        
        const imgData = offCtx.getImageData(0, 0, targetW, targetH);
        const data = imgData.data;

        this.sampledPixels = [];

        // Sample points with weighted density
        for (let y = 0; y < targetH; y += 1) {
            for (let x = 0; x < targetW; x += 1) {
                const idx = (y * targetW + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const a = data[idx + 3];

                if (a < 30) continue;

                // Relative luminance
                const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                
                // Emphasize contrast for features (eyes, lips, facial contours, highlights)
                const isFeature = lum < 0.35 || (r > g + 15 && r > b + 10) || lum > 0.75;
                const prob = isFeature ? 0.85 : 0.45;

                if (Math.random() < prob) {
                    this.sampledPixels.push({
                        nx: (x / targetW - 0.5), // -0.5 to 0.5
                        ny: (y / targetH - 0.5),
                        r, g, b,
                        lum,
                        isFeature
                    });
                }
            }
        }

        // Shuffle sampled pixels for organic distribution
        for (let i = this.sampledPixels.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.sampledPixels[i], this.sampledPixels[j]] = [this.sampledPixels[j], this.sampledPixels[i]];
        }

        this.imgLoaded = true;
        this.createParticles();
    }

    generateProceduralPortrait() {
        this.sampledPixels = [];
        const count = 7000;
        for (let i = 0; i < count; i++) {
            const t = Math.random() * Math.PI * 2;
            const r = Math.sqrt(Math.random()) * 0.4;
            const nx = r * Math.cos(t);
            const ny = r * Math.sin(t);
            this.sampledPixels.push({
                nx, ny,
                r: 255, g: 190, b: 210,
                lum: 0.8,
                isFeature: true
            });
        }
        this.imgLoaded = true;
        this.createParticles();
    }

    createParticles() {
        this.particles = [];
        const count = Math.min(this.sampledPixels.length, this.totalParticles);
        this.totalParticles = count;

        const arms = 3;
        const armOffsetMax = 0.5;
        const coreRadius = 40;
        const maxRadius = Math.min(this.width, this.height) * 0.65;

        for (let i = 0; i < count; i++) {
            const pixel = this.sampledPixels[i];
            const phrase = LOVE_LANGUAGES[i % LOVE_LANGUAGES.length];

            // 1. Galaxy 3D initial coordinates (Logarithmic spiral galaxy)
            const r = coreRadius + Math.pow(Math.random(), 1.6) * (maxRadius - coreRadius);
            const arm = i % arms;
            const armAngle = (arm * 2 * Math.PI) / arms;
            const spiralAngle = r * 0.012;
            const randomOffset = (Math.random() - 0.5) * armOffsetMax * (r / maxRadius);
            const theta = armAngle + spiralAngle + randomOffset;

            const gx = Math.cos(theta) * r;
            const gy = (Math.random() - 0.5) * (30 + (1 - r / maxRadius) * 60); // Vertical thickness
            const gz = Math.sin(theta) * r;

            // Celestial galaxy colors (starlight gold, cosmic violet, rose nebula)
            const galaxyColors = [
                { r: 255, g: 215, b: 180 }, // Gold star
                { r: 255, g: 130, b: 180 }, // Rose nebula
                { r: 180, g: 140, b: 255 }, // Violet glow
                { r: 140, g: 220, b: 255 }, // Ice blue
                { r: 255, g: 255, b: 255 }  // Pure starlight
            ];
            const gCol = galaxyColors[Math.floor(Math.random() * galaxyColors.length)];

            // 2. Portrait target coordinates
            const portraitScale = Math.min(this.width * 0.82, this.height * 0.65, 460);
            const px = pixel.nx * portraitScale;
            const py = pixel.ny * portraitScale * (this.img.height / this.img.width || 1.1) - 20;
            const pz = (1 - pixel.lum) * 20 - 10; // Subtle 3D depth on face features

            this.particles.push({
                // Current 3D position
                x: gx,
                y: gy,
                z: gz,

                // Galaxy origin
                gx, gy, gz,
                orbitR: r,
                orbitAngle: theta,
                orbitSpeed: 0.003 + (1 / (r + 10)) * 0.8,

                // Portrait target
                px, py, pz,
                basePx: pixel.nx,
                basePy: pixel.ny,

                // Colors
                gr: gCol.r, gg: gCol.g, gb: gCol.b,
                pr: pixel.r, pg: pixel.g, pb: pixel.b,

                // Attributes
                phrase: phrase.native,
                lang: phrase.lang,
                fontSize: pixel.isFeature ? 7.5 : 6,
                isHeart: Math.random() < 0.18,
                alpha: Math.random() * 0.4 + 0.6,
                twinkle: Math.random() * Math.PI * 2,
                
                // Animation physics
                morphDelay: Math.random() * 0.4, // Staggered morphing
                currentProgress: 0
            });
        }
    }

    recalculatePortraitCoordinates() {
        const portraitScale = Math.min(this.width * 0.82, this.height * 0.65, 460);
        const ratio = (this.img && this.img.height && this.img.width) ? (this.img.height / this.img.width) : 1.1;
        
        for (let p of this.particles) {
            p.px = p.basePx * portraitScale;
            p.py = p.basePy * portraitScale * ratio - 20;
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
                this.targetRotY += dx * 0.006;
                this.targetRotX += dy * 0.006;
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

        // Pointer / Touch
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
                    this.targetZoom = Math.max(0.6, Math.min(2.5, this.targetZoom + delta));
                }
                this.touchDist = dist;
            }
        }, { passive: true });

        this.canvas.addEventListener('touchend', onEnd);

        // Wheel Zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.targetZoom = Math.max(0.6, Math.min(2.5, this.targetZoom - e.deltaY * 0.0015));
        }, { passive: false });

        // Tap on galaxy to trigger morphing
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
            window.audioManager.playGalaxyMorphSound();
            window.audioManager.triggerHaptic([30, 50, 80]);
        }

        const hint = document.getElementById('galaxy-hint');
        if (hint) {
            hint.innerHTML = '✨ Тысячи признаний соткали твой образ.<br><span style="font-size:0.85em; opacity:0.8;">(Коснись или проведи пальцем, чтобы приблизить слова)</span>';
        }

        const btnToggle = document.getElementById('btn-toggle-view');
        if (btnToggle) {
            btnToggle.innerHTML = '🌌 Вращать Галактику';
        }

        // Show signature and final actions
        setTimeout(() => {
            const signatureBox = document.getElementById('signature-section');
            if (signatureBox) signatureBox.classList.add('visible');
            if (window.animateSignature) window.animateSignature();
        }, 1800);
    }

    morphToGalaxy() {
        this.state = 'GALAXY';
        this.targetMorph = 0;
        this.targetRotX = 0.55;

        if (window.audioManager) {
            window.audioManager.triggerHaptic([40, 40]);
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
        // Smooth rotation and zoom easing
        this.rotX += (this.targetRotX - this.rotX) * 0.08;
        this.rotY += (this.targetRotY - this.rotY) * 0.08;
        this.zoom += (this.targetZoom - this.zoom) * 0.08;

        if (this.state === 'GALAXY') {
            this.rotY += this.galaxySpeed;
        }

        // Morph progress interpolation
        this.morphProgress += (this.targetMorph - this.morphProgress) * 0.045;

        // Counter animation
        const targetCount = Math.round(this.morphProgress * this.totalParticles);
        this.counterCurrent += Math.round((targetCount - this.counterCurrent) * 0.1);
        if (this.counterElement) {
            this.counterElement.innerText = this.counterCurrent.toLocaleString('ru-RU');
        }

        // Background stars twinkle
        for (let star of this.bgStars) {
            star.twinkle += star.twinkleSpeed;
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 1. Draw Nebula & Background Stars
        this.renderCosmicBackground();

        if (!this.imgLoaded || this.particles.length === 0) {
            // Draw loading pulse
            this.ctx.fillStyle = 'rgba(255, 200, 220, 0.7)';
            this.ctx.font = '16px "Montserrat", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Сотворение галактики любви...', this.width / 2, this.height / 2);
            return;
        }

        const cx = this.width / 2;
        const cy = this.height / 2;
        const cosX = Math.cos(this.rotX);
        const sinX = Math.sin(this.rotX);
        const cosY = Math.cos(this.rotY);
        const sinY = Math.sin(this.rotY);

        // Sort particles by depth Z for proper luminous blending
        // To maintain performance, we update positions and project
        const renderList = [];

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];

            // Update galaxy orbital rotation
            p.orbitAngle += p.orbitSpeed * 0.015;
            p.gx = Math.cos(p.orbitAngle) * p.orbitR;
            p.gz = Math.sin(p.orbitAngle) * p.orbitR;

            // Individual particle morph progress with smooth cubic ease
            const localT = Math.max(0, Math.min(1, (this.morphProgress - p.morphDelay) / (1 - p.morphDelay + 0.001)));
            const easeT = localT * localT * (3 - 2 * localT); // Smoothstep

            // Current 3D position
            const curX = p.gx + (p.px - p.gx) * easeT;
            const curY = p.gy + (p.py - p.gy) * easeT;
            const curZ = p.gz + (p.pz - p.gz) * easeT;

            // 3D rotation projection
            // Rotate Y
            const x1 = curX * cosY - curZ * sinY;
            const z1 = curZ * cosY + curX * sinY;
            // Rotate X
            const y2 = curY * cosX - z1 * sinX;
            const z2 = z1 * cosX + curY * sinX;

            // Perspective scale
            const fov = 650;
            const scale = (fov / (fov + z2)) * this.zoom;
            const screenX = cx + x1 * scale;
            const screenY = cy + y2 * scale;

            // Blended colors
            const r = Math.round(p.gr + (p.pr - p.gr) * easeT);
            const g = Math.round(p.gg + (p.pg - p.gg) * easeT);
            const b = Math.round(p.gb + (p.pb - p.gb) * easeT);

            // Opacity & Twinkle
            p.twinkle += 0.04;
            const twinkleAlpha = 0.8 + Math.sin(p.twinkle) * 0.2;
            const alpha = Math.min(1, p.alpha * twinkleAlpha * (0.6 + easeT * 0.4));

            renderList.push({
                x: screenX,
                y: screenY,
                z: z2,
                scale,
                r, g, b, alpha,
                phrase: p.isHeart ? '♥' : p.phrase,
                isHeart: p.isHeart,
                fontSize: p.fontSize * scale,
                easeT
            });
        }

        // Sort by depth
        renderList.sort((a, b) => b.z - a.z);

        // Batch rendering
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        for (let p of renderList) {
            if (p.scale <= 0) continue;

            // Magnifier expansion effect if inspecting
            let extraScale = 1;
            if (this.inspectPoint) {
                const dist = Math.hypot(p.x - this.inspectPoint.x, p.y - this.inspectPoint.y);
                if (dist < 100) {
                    const factor = (1 - dist / 100);
                    extraScale = 1 + factor * 1.8;
                }
            }

            const finalFontSize = Math.max(3.5, p.fontSize * extraScale);
            this.ctx.font = `${p.isHeart ? 'bold ' : ''}${finalFontSize}px "Caveat", "Montserrat", sans-serif`;
            
            // Soft glow for bright features
            if (p.easeT > 0.8 && (p.r > 200 || p.isHeart)) {
                this.ctx.shadowColor = `rgba(${p.r}, ${p.g}, ${p.b}, 0.5)`;
                this.ctx.shadowBlur = 4;
            } else {
                this.ctx.shadowBlur = 0;
            }

            this.ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.alpha})`;
            this.ctx.fillText(p.phrase, p.x, p.y);
        }

        this.ctx.shadowBlur = 0;
    }

    renderCosmicBackground() {
        // Deep space gradient
        const grad = this.ctx.createRadialGradient(
            this.width / 2, this.height / 2, 50,
            this.width / 2, this.height / 2, Math.max(this.width, this.height) * 0.8
        );
        grad.addColorStop(0, '#12081f');
        grad.addColorStop(0.5, '#080511');
        grad.addColorStop(1, '#030207');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw twinkling stars
        for (let star of this.bgStars) {
            const alpha = star.alpha * (0.6 + Math.sin(star.twinkle) * 0.4);
            this.ctx.fillStyle = star.color;
            this.ctx.globalAlpha = alpha;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
    }

    animate() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.animate());
    }

    // High-resolution image export for "Save to gallery"
    exportHighResPortrait() {
        const exportCanvas = document.createElement('canvas');
        const size = 1800;
        exportCanvas.width = size;
        exportCanvas.height = size;
        const eCtx = exportCanvas.getContext('2d');

        // Dark Nebula Background
        const grad = eCtx.createRadialGradient(size/2, size/2, 100, size/2, size/2, size * 0.7);
        grad.addColorStop(0, '#150926');
        grad.addColorStop(0.5, '#0a0614');
        grad.addColorStop(1, '#020106');
        eCtx.fillStyle = grad;
        eCtx.fillRect(0, 0, size, size);

        // Draw stars
        for (let i = 0; i < 300; i++) {
            eCtx.fillStyle = Math.random() > 0.4 ? '#ffffff' : '#ffd1dc';
            eCtx.globalAlpha = Math.random() * 0.7 + 0.3;
            eCtx.beginPath();
            eCtx.arc(Math.random() * size, Math.random() * size, Math.random() * 2.5 + 0.8, 0, Math.PI * 2);
            eCtx.fill();
        }
        eCtx.globalAlpha = 1;

        // Draw particles in portrait form
        const portraitScale = size * 0.72;
        const cx = size / 2;
        const cy = size / 2 - 60;
        const ratio = (this.img && this.img.height && this.img.width) ? (this.img.height / this.img.width) : 1.1;

        eCtx.textAlign = 'center';
        eCtx.textBaseline = 'middle';

        for (let p of this.particles) {
            const x = cx + p.basePx * portraitScale;
            const y = cy + p.basePy * portraitScale * ratio;
            const fontSize = (p.isHeart ? 16 : 14);

            eCtx.font = `${p.isHeart ? 'bold ' : ''}${fontSize}px "Caveat", "Montserrat", sans-serif`;
            
            if (p.pr > 200 || p.isHeart) {
                eCtx.shadowColor = `rgba(${p.pr}, ${p.pg}, ${p.pb}, 0.6)`;
                eCtx.shadowBlur = 6;
            } else {
                eCtx.shadowBlur = 0;
            }

            eCtx.fillStyle = `rgba(${p.pr}, ${p.pg}, ${p.pb}, 0.95)`;
            eCtx.fillText(p.isHeart ? '♥' : p.phrase, x, y);
        }

        eCtx.shadowBlur = 0;

        // Gold Calligraphy Signature on export
        eCtx.fillStyle = '#ffd880';
        eCtx.shadowColor = 'rgba(255, 216, 128, 0.7)';
        eCtx.shadowBlur = 15;
        eCtx.font = '68px "Marck Script", "Caveat", cursive';
        eCtx.fillText('Амина ✨', size / 2, size - 140);

        eCtx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        eCtx.shadowBlur = 0;
        eCtx.font = '24px "Montserrat", sans-serif';
        eCtx.fillText('Галактика из 9 494 признаний в любви', size / 2, size - 85);

        // Download trigger
        const link = document.createElement('a');
        link.download = 'Amina_Galaxy_Of_Love.png';
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
    }
}

window.GalaxyEngine = GalaxyEngine;
