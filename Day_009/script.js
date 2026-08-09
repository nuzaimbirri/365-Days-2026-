/**
 * Neon Quantum Sandbox - Cosmic Gravity & Particle Physics
 * Day 009 of 365 Days Code Challenge
 *
 * Clean, modular, zero-error physics & sound engine.
 */

(function () {
    'use strict';

    // ==========================================
    // CONFIGURATION & CONSTANTS
    // ==========================================
    const CONFIG = {
        MAX_PARTICLES: 2000,
        DEFAULT_GRAVITY: 1.2,
        DEFAULT_FRICTION: 0.997,
        DEFAULT_TRAIL: 0.15,
        SPRAY_RATE: 15,
        SOFTENING: 15, // Prevents infinite force at r=0
        AUDIO_ENABLED: false
    };

    const PARTICLE_TYPES = {
        photon: { color: '#00f3ff', glow: 'rgba(0, 243, 255, 0.8)', radius: 2, mass: 0.5 },
        plasma: { color: '#ff0055', glow: 'rgba(255, 0, 85, 0.8)', radius: 3, mass: 1.5 },
        antimatter: { color: '#ffaa00', glow: 'rgba(255, 170, 0, 0.8)', radius: 2.5, mass: 2.5 },
        stardust: { color: '#00ff66', glow: 'rgba(0, 255, 102, 0.8)', radius: 1.8, mass: 0.8 }
    };

    // ==========================================
    // AUDIO ENGINE (Web Audio API)
    // ==========================================
    class SynthEngine {
        constructor() {
            this.ctx = null;
            this.isEnabled = false;
            this.masterGain = null;
            this.droneOsc = null;
            this.droneGain = null;
            this.pentatonicScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25]; // C4 to E5
        }

        init() {
            if (this.ctx) return;
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;

            this.ctx = new AudioCtx();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            // Ambient Cosmic Synth Drone
            this.droneOsc = this.ctx.createOscillator();
            this.droneGain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            this.droneOsc.type = 'sine';
            this.droneOsc.frequency.setValueAtTime(65.41, this.ctx.currentTime); // C2

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(250, this.ctx.currentTime);

            this.droneGain.gain.setValueAtTime(0, this.ctx.currentTime);

            this.droneOsc.connect(filter);
            filter.connect(this.droneGain);
            this.droneGain.connect(this.masterGain);

            this.droneOsc.start();
        }

        toggle(enable) {
            if (enable && !this.ctx) {
                this.init();
            }

            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }

            this.isEnabled = enable;
            if (this.droneGain && this.ctx) {
                const targetGain = enable ? 0.08 : 0;
                this.droneGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
            }
        }

        playChime(pitchIndex = 0, volume = 0.1) {
            if (!this.isEnabled || !this.ctx) return;

            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                const freq = this.pentatonicScale[pitchIndex % this.pentatonicScale.length];
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now);

                gain.gain.setValueAtTime(volume, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

                osc.connect(gain);
                gain.connect(this.masterGain);

                osc.start(now);
                osc.stop(now + 0.5);
            } catch (e) {
                // Ignore audio play errors
            }
        }

        playShockwaveSound() {
            if (!this.isEnabled || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);

                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

                osc.connect(gain);
                gain.connect(this.masterGain);

                osc.start(now);
                osc.stop(now + 0.4);
            } catch (e) {}
        }
    }

    // ==========================================
    // PARTICLE CLASS
    // ==========================================
    class Particle {
        constructor(x, y, vx, vy, typeKey = 'photon') {
            const props = PARTICLE_TYPES[typeKey] || PARTICLE_TYPES.photon;
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.type = typeKey;
            this.radius = props.radius;
            this.mass = props.mass;
            this.color = props.color;
            this.glow = props.glow;
            this.trail = [];
            this.maxTrailLength = 5;
        }

        update(friction, boundaryMode, width, height) {
            // Velocity friction
            this.vx *= friction;
            this.vy *= friction;

            // Save trail
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }

            // Position update
            this.x += this.vx;
            this.y += this.vy;

            // Boundary collision handling
            if (boundaryMode === 'bounce') {
                if (this.x - this.radius < 0) {
                    this.x = this.radius;
                    this.vx *= -0.8;
                } else if (this.x + this.radius > width) {
                    this.x = width - this.radius;
                    this.vx *= -0.8;
                }

                if (this.y - this.radius < 0) {
                    this.y = this.radius;
                    this.vy *= -0.8;
                } else if (this.y + this.radius > height) {
                    this.y = height - this.radius;
                    this.vy *= -0.8;
                }
            } else if (boundaryMode === 'wrap') {
                if (this.x < 0) this.x = width;
                if (this.x > width) this.x = 0;
                if (this.y < 0) this.y = height;
                if (this.y > height) this.y = 0;
            }
        }

        draw(ctx) {
            // Draw particle trail
            if (this.trail.length > 1) {
                ctx.beginPath();
                ctx.moveTo(this.trail[0].x, this.trail[0].y);
                for (let i = 1; i < this.trail.length; i++) {
                    ctx.lineTo(this.trail[i].x, this.trail[i].y);
                }
                ctx.strokeStyle = this.glow;
                ctx.lineWidth = this.radius * 0.8;
                ctx.stroke();
            }

            // Draw core particle
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    // ==========================================
    // GRAVITY WELL CLASS
    // ==========================================
    class GravityWell {
        constructor(x, y, type = 'blackhole', mass = 1500) {
            this.x = x;
            this.y = y;
            this.type = type; // 'blackhole', 'whitehole', 'vortex'
            this.mass = mass;
            this.radius = 16;
            this.pulse = 0;
            this.isDragging = false;
        }

        update() {
            this.pulse += 0.05;
        }

        draw(ctx) {
            const pulseRadius = this.radius + Math.sin(this.pulse) * 3;

            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, pulseRadius, 0, Math.PI * 2);

            if (this.type === 'blackhole') {
                ctx.fillStyle = '#000000';
                ctx.strokeStyle = '#00f3ff';
                ctx.shadowColor = '#00f3ff';
                ctx.shadowBlur = 20;
                ctx.lineWidth = 3;
                ctx.fill();
                ctx.stroke();

                // Draw event horizon ring
                ctx.beginPath();
                ctx.arc(this.x, this.y, pulseRadius * 1.5, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
                ctx.setLineDash([4, 4]);
                ctx.stroke();

            } else if (this.type === 'whitehole') {
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#ff0055';
                ctx.shadowColor = '#ff0055';
                ctx.shadowBlur = 25;
                ctx.lineWidth = 3;
                ctx.fill();
                ctx.stroke();

            } else if (this.type === 'vortex') {
                ctx.fillStyle = '#110022';
                ctx.strokeStyle = '#ffaa00';
                ctx.shadowColor = '#ffaa00';
                ctx.shadowBlur = 20;
                ctx.lineWidth = 3;
                ctx.fill();
                ctx.stroke();

                // Spiral icon lines
                ctx.beginPath();
                ctx.arc(this.x, this.y, pulseRadius * 1.4, this.pulse, this.pulse + Math.PI);
                ctx.strokeStyle = 'rgba(255, 170, 0, 0.6)';
                ctx.stroke();
            }

            ctx.restore();
        }
    }

    // ==========================================
    // SHOCKWAVE CLASS
    // ==========================================
    class Shockwave {
        constructor(x, y, force = 25) {
            this.x = x;
            this.y = y;
            this.radius = 5;
            this.maxRadius = 180;
            this.force = force;
            this.alpha = 1;
        }

        update() {
            this.radius += 8;
            this.alpha = 1 - (this.radius / this.maxRadius);
        }

        draw(ctx) {
            if (this.alpha <= 0) return;
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 243, 255, ${this.alpha})`;
            ctx.lineWidth = 4 * this.alpha;
            ctx.shadowColor = '#00f3ff';
            ctx.shadowBlur = 15;
            ctx.stroke();
            ctx.restore();
        }
    }

    // ==========================================
    // MAIN APP CONTROLLER
    // ==========================================
    class QuantumSandboxApp {
        constructor() {
            this.canvas = document.getElementById('physics-canvas');
            this.ctx = this.canvas.getContext('2d');

            this.width = 0;
            this.height = 0;
            this.dpr = window.devicePixelRatio || 1;

            this.particles = [];
            this.wells = [];
            this.shockwaves = [];

            // Physics Settings State
            this.gravity = CONFIG.DEFAULT_GRAVITY;
            this.friction = CONFIG.DEFAULT_FRICTION;
            this.trailLength = CONFIG.DEFAULT_TRAIL;
            this.sprayRate = CONFIG.SPRAY_RATE;
            this.boundaryMode = 'bounce';
            this.activeTool = 'spawn';
            this.activeParticleType = 'photon';
            this.isPaused = false;

            // Mouse / Touch state
            this.isMouseDown = false;
            this.mouseX = 0;
            this.mouseY = 0;
            this.draggedWell = null;

            // Audio & Stats
            this.synth = new SynthEngine();
            this.fps = 60;
            this.lastFrameTime = performance.now();
            this.frameCount = 0;

            this.init();
        }

        init() {
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());

            this.setupEvents();
            this.setupUIControls();
            this.loadPreset('galaxy');

            // Start Animation Loop
            requestAnimationFrame((timestamp) => this.loop(timestamp));
        }

        resizeCanvas() {
            this.width = window.innerWidth;
            this.height = window.innerHeight;

            this.canvas.width = this.width * this.dpr;
            this.canvas.height = this.height * this.dpr;
            this.ctx.scale(this.dpr, this.dpr);
        }

        setupEvents() {
            const getCanvasCoords = (e) => {
                const rect = this.canvas.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                return {
                    x: clientX - rect.left,
                    y: clientY - rect.top
                };
            };

            const handleDown = (e) => {
                // Ignore click if interactive UI element was target
                if (e.target !== this.canvas) return;

                this.isMouseDown = true;
                const pos = getCanvasCoords(e);
                this.mouseX = pos.x;
                this.mouseY = pos.y;

                // Check if user clicked on existing gravity well to drag it
                for (const well of this.wells) {
                    const dx = pos.x - well.x;
                    const dy = pos.y - well.y;
                    if (Math.sqrt(dx * dx + dy * dy) < well.radius * 2) {
                        this.draggedWell = well;
                        well.isDragging = true;
                        return;
                    }
                }

                // Handle single click tool actions
                this.applyToolClick(pos.x, pos.y);
            };

            const handleMove = (e) => {
                const pos = getCanvasCoords(e);
                this.mouseX = pos.x;
                this.mouseY = pos.y;

                if (this.draggedWell) {
                    this.draggedWell.x = pos.x;
                    this.draggedWell.y = pos.y;
                }
            };

            const handleUp = () => {
                this.isMouseDown = false;
                if (this.draggedWell) {
                    this.draggedWell.isDragging = false;
                    this.draggedWell = null;
                }
            };

            this.canvas.addEventListener('mousedown', handleDown);
            this.canvas.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleUp);

            this.canvas.addEventListener('touchstart', handleDown, { passive: true });
            this.canvas.addEventListener('touchmove', handleMove, { passive: true });
            window.addEventListener('touchend', handleUp);
        }

        applyToolClick(x, y) {
            if (this.activeTool === 'blackhole') {
                this.wells.push(new GravityWell(x, y, 'blackhole', 1500));
                this.synth.playChime(2, 0.15);
            } else if (this.activeTool === 'whitehole') {
                this.wells.push(new GravityWell(x, y, 'whitehole', -1500));
                this.synth.playChime(4, 0.15);
            } else if (this.activeTool === 'vortex') {
                this.wells.push(new GravityWell(x, y, 'vortex', 1200));
                this.synth.playChime(6, 0.15);
            } else if (this.activeTool === 'shockwave') {
                this.shockwaves.push(new Shockwave(x, y, 30));
                this.synth.playShockwaveSound();
            } else if (this.activeTool === 'eraser') {
                // Remove nearby gravity wells or particles
                this.wells = this.wells.filter(w => Math.hypot(w.x - x, w.y - y) > 40);
                this.particles = this.particles.filter(p => Math.hypot(p.x - x, p.y - y) > 50);
            }
        }

        spawnParticlesAtMouse() {
            if (this.particles.length >= CONFIG.MAX_PARTICLES) return;

            const count = Math.min(this.sprayRate, CONFIG.MAX_PARTICLES - this.particles.length);
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 3 + 1;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                const offsetX = (Math.random() - 0.5) * 10;
                const offsetY = (Math.random() - 0.5) * 10;

                this.particles.push(new Particle(
                    this.mouseX + offsetX,
                    this.mouseY + offsetY,
                    vx,
                    vy,
                    this.activeParticleType
                ));
            }
        }

        loadPreset(presetName) {
            this.particles = [];
            this.wells = [];
            this.shockwaves = [];

            const cx = this.width / 2;
            const cy = this.height / 2;

            if (presetName === 'galaxy') {
                // Central Massive Blackhole
                this.wells.push(new GravityWell(cx, cy, 'blackhole', 2500));

                // 600 Spiral Orbiting Particles
                const particleCount = 650;
                for (let i = 0; i < particleCount; i++) {
                    const radius = Math.random() * (Math.min(this.width, this.height) * 0.35) + 30;
                    const angle = Math.random() * Math.PI * 2;

                    const px = cx + Math.cos(angle) * radius;
                    const py = cy + Math.sin(angle) * radius;

                    // Calculate tangential circular orbit velocity: v = sqrt(G*M / r)
                    const orbitSpeed = Math.sqrt((this.gravity * 2500) / (radius + 20)) * 0.9;
                    const vx = -Math.sin(angle) * orbitSpeed;
                    const vy = Math.cos(angle) * orbitSpeed;

                    const typeKeys = ['photon', 'plasma', 'stardust'];
                    const type = typeKeys[i % typeKeys.length];

                    this.particles.push(new Particle(px, py, vx, vy, type));
                }
            } else if (presetName === 'supernova') {
                // Supernova Explosion Center
                const count = 700;
                for (let i = 0; i < count; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 12 + 2;
                    const vx = Math.cos(angle) * speed;
                    const vy = Math.sin(angle) * speed;

                    const type = (i % 2 === 0) ? 'plasma' : 'antimatter';
                    this.particles.push(new Particle(cx, cy, vx, vy, type));
                }
                this.shockwaves.push(new Shockwave(cx, cy, 40));
                this.synth.playShockwaveSound();

            } else if (presetName === 'binary') {
                // Dual Counter-Rotating Blackholes
                const dist = 120;
                this.wells.push(new GravityWell(cx - dist, cy, 'blackhole', 1800));
                this.wells.push(new GravityWell(cx + dist, cy, 'blackhole', 1800));

                for (let i = 0; i < 500; i++) {
                    const px = cx + (Math.random() - 0.5) * 400;
                    const py = cy + (Math.random() - 0.5) * 400;
                    const vx = (Math.random() - 0.5) * 2;
                    const vy = (Math.random() - 0.5) * 2;
                    this.particles.push(new Particle(px, py, vx, vy, 'photon'));
                }
            } else if (presetName === 'chaos') {
                // Multiple Blackholes and Whiteholes
                this.wells.push(new GravityWell(cx - 150, cy - 100, 'blackhole', 1600));
                this.wells.push(new GravityWell(cx + 150, cy + 100, 'blackhole', 1600));
                this.wells.push(new GravityWell(cx, cy, 'whitehole', -2000));

                for (let i = 0; i < 600; i++) {
                    const px = cx + (Math.random() - 0.5) * 500;
                    const py = cy + (Math.random() - 0.5) * 500;
                    const typeKeys = ['photon', 'plasma', 'antimatter', 'stardust'];
                    this.particles.push(new Particle(px, py, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, typeKeys[i % 4]));
                }
            }
        }

        updatePhysics() {
            if (this.isPaused) return;

            // Handle active semprot spray if mouse held down
            if (this.isMouseDown && this.activeTool === 'spawn' && !this.draggedWell) {
                this.spawnParticlesAtMouse();
            }

            // Update Gravity Wells
            for (const well of this.wells) {
                well.update();
            }

            // Update Shockwaves
            for (let i = this.shockwaves.length - 1; i >= 0; i--) {
                const sw = this.shockwaves[i];
                sw.update();
                if (sw.alpha <= 0) {
                    this.shockwaves.splice(i, 1);
                }
            }

            // Update Particles
            const count = this.particles.length;
            for (let i = count - 1; i >= 0; i--) {
                const p = this.particles[i];

                // 1. Calculate Gravity forces from Gravity Wells
                for (const well of this.wells) {
                    const dx = well.x - p.x;
                    const dy = well.y - p.y;
                    const distSq = dx * dx + dy * dy + (CONFIG.SOFTENING * CONFIG.SOFTENING);
                    const dist = Math.sqrt(distSq);

                    // Event horizon particle absorption for blackholes
                    if (well.type === 'blackhole' && dist < well.radius) {
                        // Absorbed! Trigger sound occasionally
                        if (Math.random() < 0.03) {
                            this.synth.playChime(Math.floor(Math.random() * 8), 0.05);
                        }
                        this.particles.splice(i, 1);
                        break;
                    }

                    const force = (this.gravity * well.mass * p.mass) / distSq;

                    if (well.type === 'vortex') {
                        // Radial pull + Perpendicular tangential torque force
                        p.vx += (dx / dist) * force * 0.5 + (-dy / dist) * force * 0.8;
                        p.vy += (dy / dist) * force * 0.5 + (dx / dist) * force * 0.8;
                    } else {
                        // Standard pull (blackhole) or push (whitehole)
                        p.vx += (dx / dist) * force;
                        p.vy += (dy / dist) * force;
                    }
                }

                // If particle was absorbed, skip remaining steps
                if (!this.particles[i]) continue;

                // 2. Calculate Shockwave kinetic pulses
                for (const sw of this.shockwaves) {
                    const dx = p.x - sw.x;
                    const dy = p.y - sw.y;
                    const dist = Math.hypot(dx, dy);
                    const ringDiff = Math.abs(dist - sw.radius);

                    if (ringDiff < 25 && dist > 0) {
                        const pushForce = (sw.force / (dist + 10)) * sw.alpha * 3;
                        p.vx += (dx / dist) * pushForce;
                        p.vy += (dy / dist) * pushForce;
                    }
                }

                // 3. Update particle position and boundary physics
                p.update(this.friction, this.boundaryMode, this.width, this.height);

                // Handle Infinite Boundary mode cleanup
                if (this.boundaryMode === 'infinite') {
                    if (p.x < -100 || p.x > this.width + 100 || p.y < -100 || p.y > this.height + 100) {
                        this.particles.splice(i, 1);
                    }
                }
            }
        }

        render() {
            // Draw background trail effect for glowing motion blur
            this.ctx.fillStyle = `rgba(5, 7, 15, ${this.trailLength})`;
            this.ctx.fillRect(0, 0, this.width, this.height);

            // Render Shockwaves
            for (const sw of this.shockwaves) {
                sw.draw(this.ctx);
            }

            // Render Gravity Wells
            for (const well of this.wells) {
                well.draw(this.ctx);
            }

            // Render Particles
            for (const p of this.particles) {
                p.draw(this.ctx);
            }
        }

        loop(timestamp) {
            // FPS Meter Calculation
            this.frameCount++;
            if (timestamp - this.lastFrameTime >= 500) {
                this.fps = Math.round((this.frameCount * 1000) / (timestamp - this.lastFrameTime));
                this.lastFrameTime = timestamp;
                this.frameCount = 0;
                this.updateHUDStats();
            }

            this.updatePhysics();
            this.render();

            requestAnimationFrame((ts) => this.loop(ts));
        }

        updateHUDStats() {
            document.getElementById('stat-fps').textContent = this.fps;
            document.getElementById('stat-particles').textContent = this.particles.length;
            document.getElementById('stat-wells').textContent = this.wells.length;
        }

        setupUIControls() {
            // Preset Button Listeners
            document.querySelectorAll('.preset-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.loadPreset(btn.getAttribute('data-preset'));
                });
            });

            // Tool Button Listeners
            document.querySelectorAll('.tool-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.activeTool = btn.getAttribute('data-tool');
                });
            });

            // Particle Type Listeners
            document.querySelectorAll('.ptype-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.ptype-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.activeParticleType = btn.getAttribute('data-type');
                });
            });

            // Sliders Listeners
            const sliderGravity = document.getElementById('slider-gravity');
            sliderGravity.addEventListener('input', (e) => {
                this.gravity = parseFloat(e.target.value);
                document.getElementById('val-gravity').textContent = this.gravity.toFixed(1);
            });

            const sliderFriction = document.getElementById('slider-friction');
            sliderFriction.addEventListener('input', (e) => {
                this.friction = parseFloat(e.target.value);
                document.getElementById('val-friction').textContent = this.friction.toFixed(3);
            });

            const sliderTrail = document.getElementById('slider-trail');
            sliderTrail.addEventListener('input', (e) => {
                this.trailLength = parseFloat(e.target.value);
                document.getElementById('val-trail').textContent = this.trailLength.toFixed(2);
            });

            const sliderSpray = document.getElementById('slider-spray-rate');
            sliderSpray.addEventListener('input', (e) => {
                this.sprayRate = parseInt(e.target.value, 10);
                document.getElementById('val-spray-rate').textContent = this.sprayRate;
            });

            // Boundary Select
            document.getElementById('select-boundary').addEventListener('change', (e) => {
                this.boundaryMode = e.target.value;
            });

            // Action Buttons
            document.getElementById('btn-pause').addEventListener('click', (e) => {
                this.isPaused = !this.isPaused;
                const icon = e.currentTarget.querySelector('i');
                icon.className = this.isPaused ? 'fa-solid fa-play' : 'fa-solid fa-pause';
            });

            document.getElementById('btn-clear').addEventListener('click', () => {
                this.particles = [];
            });

            document.getElementById('btn-reset-wells').addEventListener('click', () => {
                this.wells = [];
            });

            document.getElementById('btn-burst').addEventListener('click', () => {
                const cx = this.width / 2;
                const cy = this.height / 2;
                for (let i = 0; i < 300; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 8 + 2;
                    this.particles.push(new Particle(cx, cy, Math.cos(angle) * speed, Math.sin(angle) * speed, this.activeParticleType));
                }
                this.shockwaves.push(new Shockwave(cx, cy, 35));
                this.synth.playShockwaveSound();
            });

            // Audio Toggle Button
            const audioBtn = document.getElementById('btn-audio');
            audioBtn.addEventListener('click', () => {
                const newState = !this.synth.isEnabled;
                this.synth.toggle(newState);
                audioBtn.classList.toggle('active', newState);
                audioBtn.querySelector('i').className = newState ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
            });

            // Fullscreen Button
            document.getElementById('btn-fullscreen').addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                } else {
                    document.exitFullscreen().catch(() => {});
                }
            });

            // Panel Collapsible Sidebar
            const panel = document.getElementById('control-panel');
            document.getElementById('toggle-panel-btn').addEventListener('click', () => {
                panel.classList.toggle('collapsed');
                const icon = document.querySelector('#toggle-panel-btn i');
                icon.className = panel.classList.contains('collapsed') ? 'fa-solid fa-chevron-left' : 'fa-solid fa-chevron-right';
            });

            // Help Modal Controls
            const helpModal = document.getElementById('help-modal');
            document.getElementById('btn-help').addEventListener('click', () => {
                helpModal.classList.remove('hidden');
            });
            document.getElementById('close-modal').addEventListener('click', () => {
                helpModal.classList.add('hidden');
            });
            document.getElementById('btn-start').addEventListener('click', () => {
                helpModal.classList.add('hidden');
                // Auto enable audio on start click user gesture
                if (!this.synth.isEnabled) {
                    this.synth.toggle(true);
                    audioBtn.classList.add('active');
                    audioBtn.querySelector('i').className = 'fa-solid fa-volume-high';
                }
            });
        }
    }

    // ==========================================
    // INITIALIZE ON DOM LOADED
    // ==========================================
    window.addEventListener('DOMContentLoaded', () => {
        window.app = new QuantumSandboxApp();
    });

})();
