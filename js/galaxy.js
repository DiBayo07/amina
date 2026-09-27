/**
 * Galaxy & Typographic Portrait Engine
 * 100% Pure Word-Art: Amina's portrait is formed exclusively from thousands of
 * multilingual "I love you" phrases mapped to image pixels with exact color & luminosity.
 */

class GalaxyEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d', { alpha: true });
        this.particles = [];
        this.displayCount = 9494; // Symbolic count of love confessions
        this.state = 'GALAXY'; // 'GALAXY' or 'PORTRAIT'
        this.morphProgress = 0;
        this.targetMorph = 0;

        // 3D Camera / Galaxy Rotation
        this.rotX = 0.52;
        this.rotY = 0;
        this.targetRotX = 0.52;
        this.targetRotY = 0;
        this.zoom = 1;
        this.targetZoom = 1;
        this.galaxySpeed = 0.003;
        
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
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
        const count = 90;
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
            this.buildTypographicGrid();
        };
        this.img.onerror = () => {
            console.warn("Generating fallback grid");
            this.buildFallbackGrid();
        };
    }

    // High-Resolution Typographic Mosaic Sampling
    buildTypographicGrid() {
        const offCanvas = document.createElement('canvas');
        const offCtx = offCanvas.getContext('2d');
        
        // Grid resolution: 56 columns x 72 rows (~4000 precision typography cells)
        const cols = 56;
        const rows = Math.round(cols * (this.img.height / this.img.width));
        
        offCanvas.width = cols;
        offCanvas.height = rows;
        offCtx.drawImage(this.img, 0, 0, cols, rows);
        
        const imgData = offCtx.getImageData(0, 0, cols, rows).data;
        this.particles = [];

        // Compact phrases and symbols for crisp mosaic rendering
        const shortPhrases = [
            "Я тебя люблю", "I love you", "Te amo", "Je t'aime", "Ti amo",
            "Ich liebe dich", "愛してる", "사랑해", "أحبك", "Seni seviyorum",
            "Men seni süyem", "♥", "Люблю", "Амина", "Mon amour", "Always"
        ];

        const galaxyPalette = [
            { r: 255, g: 215, b: 180 }, // Gold star
            { r: 255, g: 140, b: 190 }, // Rose nebula
            { r: 180, g: 145, b: 255 }, // Violet glow
            { r: 150, g: 225, b: 255 }, // Ice blue
            { r: 255, g: 255, b: 255 }  // Pure white
        ];

        const maxRadius = Math.min(this.width, this.height) * 0.65;
        const arms = 3;

        let index = 0;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const pixelIdx = (y * cols + x) * 4;
                let r = imgData[pixelIdx];
                let g = imgData[pixelIdx + 1];
                let b = imgData[pixelIdx + 2];
                const a = imgData[pixelIdx + 3];

                if (a < 20) continue;

                // Relative luminance
                const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                
                // Enhance facial contrast (brighten highlights, deepen hair and lashes)
                if (lum > 0.4) {
                    r = Math.min(255, Math.round(r * 1.15));
                    g = Math.min(255, Math.round(g * 1.12));
                    b = Math.min(255, Math.round(b * 1.15));
                }

                // 1. Galaxy 3D Coordinates (Logarithmic Spiral Disk)
                const gRadius = 30 + Math.pow(Math.random(), 1.6) * (maxRadius - 30);
                const arm = index % arms;
                const armAngle = (arm * 2 * Math.PI) / arms;
                const spiralAngle = gRadius * 0.012;
                const randomOffset = (Math.random() - 0.5) * 0.4 * (gRadius / maxRadius);
                const theta = armAngle + spiralAngle + randomOffset;

                const gx = Math.cos(theta) * gRadius;
                const gy = (Math.random() - 0.5) * (20 + (1 - gRadius / maxRadius) * 50);
                const gz = Math.sin(theta) * gRadius;

                const gCol = galaxyPalette[index % galaxyPalette.length];

                // 2. Portrait Target Coordinates (-0.5 to 0.5 normalized)
                const nx = (x / cols - 0.5);
                const ny = (y / rows - 0.5);

                const phrase = shortPhrases[index % shortPhrases.length];

                this.particles.push({
                    gx, gy, gz,
                    orbitR: gRadius,
                    orbitAngle: theta,
                    orbitSpeed: 0.003 + (1 / (gRadius + 15)) * 0.5,

                    // Normalized portrait coordinates
                    nx, ny,
                    px: 0, py: 0, pz: (1 - lum) * 15 - 7,

                    // Colors
                    gr: gCol.r, gg: gCol.g, gb: gCol.b,
                    pr: r, pg: g, pb: b,

                    phrase: phrase,
                    isHeart: phrase === "♥",
                    alpha: Math.min(1, Math.max(0.4, lum > 0.1 ? 0.95 : 0.6)),
                    lum: lum,
                    morphDelay: Math.random() * 0.35
                });

                index++;
            }
        }

        this.imgLoaded = true;
        this.recalculateCoordinates();
    }

    buildFallbackGrid() {
        this.particles = [];
        const count = 3000;
        for (let i = 0; i < count; i++) {
            const t = Math.random() * Math.PI * 2;
            const r = Math.sqrt(Math.random()) * 0.45;
            this.particles.push({
                gx: Math.cos(t) * 200, gy: 0, gz: Math.sin(t) * 200,
                orbitR: 200, orbitAngle: t, orbitSpeed: 0.005,
                nx: r * Math.cos(t), ny: r * Math.sin(t),
                px: 0, py: 0, pz: 0,
                gr: 255, gg: 215, gb: 180,
                pr: 255, pg: 180, pb: 200,
                phrase: "♥", isHeart: true,
                alpha: 0.9, lum: 0.8, morphDelay: 0.1
            });
        }
        this.imgLoaded = true;
        this.recalculateCoordinates();
    }

    recalculateCoordinates() {
        // Portrait sizing for mobile and desktop screens
        const isMobile = this.width < 480;
        const portraitScaleW = Math.min(this.width * 0.86, this.height * 0.55, 340);
        const portraitScaleH = portraitScaleW * (this.img.height / this.img.width || 1.25);
        const offsetY = -25; // Center slightly above bottom HUD

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            p.px = p.nx * portraitScaleW;
            p.py = p.ny * portraitScaleH + offsetY;
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
        }, 1400);
    }

    morphToGalaxy() {
        this.state = 'GALAXY';
        this.targetMorph = 0;
        this.targetRotX = 0.52;

        if (window.audioManager) {
            window.audioManager.triggerHaptic([30]);
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

        this.morphProgress += (this.targetMorph - this.morphProgress) * 0.055;

        // Animated counter
        const targetCount = Math.round(this.morphProgress * this.displayCount);
        this.counterCurrent += Math.round((targetCount - this.counterCurrent) * 0.14);
        if (this.counterElement) {
            this.counterElement.innerText = this.counterCurrent.toLocaleString('ru-RU');
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 1. Background Stars
        this.renderCosmicBackground();

        if (!this.imgLoaded || this.particles.length === 0) return;

        const cx = this.width / 2;
        const cy = this.height / 2;
        const cosX = Math.cos(this.rotX);
        const sinX = Math.sin(this.rotX);
        const cosY = Math.cos(this.rotY);
        const sinY = Math.sin(this.rotY);
        const fov = 600;

        const isGalaxy = this.morphProgress < 0.15;
        const easeMorph = this.morphProgress * this.morphProgress * (3 - 2 * this.morphProgress);

        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Font scaling for typography mosaic
        const fontSize = 4.8 + easeMorph * 1.8;
        this.ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

        const count = this.particles.length;

        for (let i = 0; i < count; i++) {
            const p = this.particles[i];

            // Orbital movement in galaxy mode
            p.orbitAngle += p.orbitSpeed * 0.015;
            p.gx = Math.cos(p.orbitAngle) * p.orbitR;
            p.gz = Math.sin(p.orbitAngle) * p.orbitR;

            // Staggered interpolation
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

            if (screenX < -50 || screenX > this.width + 50 || screenY < -50 || screenY > this.height + 50) {
                continue;
            }

            // Interpolate color from celestial starlight to exact portrait pixel color
            const r = Math.round(p.gr + (p.pr - p.gr) * easeT);
            const g = Math.round(p.gg + (p.pg - p.gg) * easeT);
            const b = Math.round(p.gb + (p.pb - p.gb) * easeT);

            if (isGalaxy) {
                // Galaxy mode: sparkling stardust and occasional floating love words
                if (i % 5 === 0) {
                    this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha})`;
                    this.ctx.fillText(p.phrase, screenX, screenY);
                } else {
                    this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha * 0.85})`;
                    this.ctx.fillRect(screenX, screenY, scale * 2.2, scale * 2.2);
                }
            } else {
                // Portrait mode: EVERY pixel on her face is drawn with a love confession word / heart!
                const textAlpha = Math.min(1, p.alpha * (0.65 + easeT * 0.35));
                this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${textAlpha})`;
                this.ctx.fillText(p.phrase, screenX, screenY);
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

    // High-Resolution Typographic Image Export for "Save to Gallery"
    exportHighResPortrait() {
        const exportCanvas = document.createElement('canvas');
        const size = 2048;
        exportCanvas.width = size;
        exportCanvas.height = size;
        const eCtx = exportCanvas.getContext('2d');

        // Deep Space Gradient
        const grad = eCtx.createRadialGradient(size/2, size/2, 100, size/2, size/2, size * 0.75);
        grad.addColorStop(0, '#150926');
        grad.addColorStop(0.5, '#0a0614');
        grad.addColorStop(1, '#020106');
        eCtx.fillStyle = grad;
        eCtx.fillRect(0, 0, size, size);

        // Stars
        for (let i = 0; i < 250; i++) {
            eCtx.fillStyle = Math.random() > 0.4 ? '#ffffff' : '#ffd1dc';
            eCtx.globalAlpha = Math.random() * 0.7 + 0.3;
            eCtx.fillRect(Math.random() * size, Math.random() * size, Math.random() * 2.5 + 1, Math.random() * 2.5 + 1);
        }
        eCtx.globalAlpha = 1;

        // Render High-Density Typographic Portrait
        const portraitScaleW = size * 0.72;
        const portraitScaleH = portraitScaleW * (this.img.height / this.img.width || 1.25);
        const cx = size / 2;
        const cy = size / 2 - 60;

        eCtx.textAlign = 'center';
        eCtx.textBaseline = 'middle';
        eCtx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

        for (let p of this.particles) {
            const x = cx + p.nx * portraitScaleW;
            const y = cy + p.ny * portraitScaleH;

            eCtx.fillStyle = `rgb(${p.pr}, ${p.pg}, ${p.pb})`;
            eCtx.fillText(p.phrase, x, y);
        }

        // Gold Calligraphy Signature
        eCtx.fillStyle = '#ffd880';
        eCtx.font = '76px "Marck Script", cursive';
        eCtx.fillText('Амина ✨', size / 2, size - 130);

        eCtx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        eCtx.font = '26px "Montserrat", sans-serif';
        eCtx.fillText('Галактика из 9 494 признаний в любви', size / 2, size - 70);

        const link = document.createElement('a');
        link.download = 'Amina_Galaxy_Of_Love.png';
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
    }
}

window.GalaxyEngine = GalaxyEngine;
