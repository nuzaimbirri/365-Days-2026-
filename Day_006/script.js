/* ==========================================================================
   DAY 006: CYBER STRIKE - NEON SURVIVOR (GAME LOGIC)
   ========================================================================== */

// --- Game State Constants & Enums ---
const GAME_STATES = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    LEVEL_UP: 'LEVEL_UP',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER'
};

// --- Web Audio API Synth Sound Engine ---
class AudioEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    play(type) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        try {
            if (type === 'laser') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.08);
            } else if (type === 'chain') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(1200, now);
                osc.frequency.linearRampToValueAtTime(400, now + 0.12);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.12);
            } else if (type === 'emp') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'explosion') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'pickup') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.08);
            } else if (type === 'levelup') {
                [400, 600, 800, 1200].forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.06);
                    gain.gain.setValueAtTime(0.2, now + idx * 0.06);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.1);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + idx * 0.06);
                    osc.stop(now + idx * 0.06 + 0.1);
                });
            } else if (type === 'dash') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(900, now + 0.15);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.15);
            } else if (type === 'hit') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.1);
            }
        } catch (e) {
            console.error("Audio playback error:", e);
        }
    }
}

const audio = new AudioEngine();

// --- Game Engine Class ---
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.state = GAME_STATES.MENU;
        this.highScore = parseInt(localStorage.getItem('cyber_strike_high_score') || '0');
        this.autoAim = false;
        this.screenShakeEnabled = true;
        this.screenShakeAmount = 0;

        // Keys & Inputs
        this.keys = {};
        this.mouse = { x: 0, y: 0, isDown: false };

        // Entities
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.particles = [];
        this.xpGems = [];
        this.floatingTexts = [];
        this.activeBoss = null;

        // Wave & Game Timing
        this.gameTime = 0; // seconds
        this.score = 0;
        this.kills = 0;
        this.waveNumber = 1;
        this.enemySpawnTimer = 0;
        this.bossSpawnedThisWave = false;

        // Resize Canvas Setup
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Input Listeners
        this.setupInputs();
        this.setupUIEvents();

        // Update High Score Display in Menu
        document.getElementById('menu-high-score').textContent = this.highScore.toLocaleString();

        // Animation Loop
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupInputs() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;

            if (e.code === 'KeyP' || e.code === 'Escape') {
                if (this.state === GAME_STATES.PLAYING) {
                    this.pauseGame();
                } else if (this.state === GAME_STATES.PAUSED) {
                    this.resumeGame();
                }
            }

            if (e.code === 'KeyT' && this.state === GAME_STATES.PLAYING) {
                this.autoAim = !this.autoAim;
                this.updateAimUI();
            }

            if ((e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') && this.state === GAME_STATES.PLAYING) {
                if (this.player) this.player.triggerDash();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.mouse.isDown = true;
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouse.isDown = false;
        });
    }

    setupUIEvents() {
        document.getElementById('btn-start').addEventListener('click', () => this.startGame());
        document.getElementById('btn-restart').addEventListener('click', () => this.startGame());
        document.getElementById('btn-restart-pause').addEventListener('click', () => this.startGame());
        document.getElementById('btn-main-menu').addEventListener('click', () => this.showMenu());
        document.getElementById('btn-resume').addEventListener('click', () => this.resumeGame());

        document.getElementById('btn-sound-toggle').addEventListener('click', () => {
            const isMuted = audio.toggleMute();
            const txt = isMuted ? '🔇 AUDIO: OFF' : '🔊 AUDIO: ON';
            document.getElementById('sound-toggle-text').textContent = txt;
            document.getElementById('pause-sound-btn').textContent = txt;
        });

        document.getElementById('pause-sound-btn').addEventListener('click', () => {
            const isMuted = audio.toggleMute();
            const txt = isMuted ? 'AUDIO: OFF' : 'AUDIO: ON';
            document.getElementById('pause-sound-btn').textContent = txt;
            document.getElementById('sound-toggle-text').textContent = isMuted ? '🔇 AUDIO: OFF' : '🔊 AUDIO: ON';
        });

        document.getElementById('pause-aim-btn').addEventListener('click', () => {
            this.autoAim = !this.autoAim;
            this.updateAimUI();
        });

        document.getElementById('pause-shake-btn').addEventListener('click', () => {
            this.screenShakeEnabled = !this.screenShakeEnabled;
            document.getElementById('pause-shake-btn').textContent = this.screenShakeEnabled ? 'SHAKE: ON' : 'SHAKE: OFF';
        });
    }

    updateAimUI() {
        const text = this.autoAim ? 'AUTO-AIM' : 'MANUAL AIM';
        document.getElementById('aim-mode-text').textContent = text;
        document.getElementById('pause-aim-btn').textContent = `AUTO-AIM: ${this.autoAim ? 'ON' : 'OFF'}`;
    }

    startGame() {
        audio.init();
        this.state = GAME_STATES.PLAYING;

        // Reset entities & variables
        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2, this);
        this.enemies = [];
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.particles = [];
        this.xpGems = [];
        this.floatingTexts = [];
        this.activeBoss = null;

        this.gameTime = 0;
        this.score = 0;
        this.kills = 0;
        this.waveNumber = 1;
        this.enemySpawnTimer = 0;
        this.bossSpawnedThisWave = false;

        // UI toggles
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('pause-screen').classList.add('hidden');
        document.getElementById('gameover-screen').classList.add('hidden');
        document.getElementById('levelup-screen').classList.add('hidden');
        document.getElementById('game-hud').classList.remove('hidden');
        document.getElementById('boss-hud-container').classList.add('hidden');

        this.updateHUD();
    }

    pauseGame() {
        if (this.state === GAME_STATES.PLAYING) {
            this.state = GAME_STATES.PAUSED;
            document.getElementById('pause-screen').classList.remove('hidden');
        }
    }

    resumeGame() {
        if (this.state === GAME_STATES.PAUSED) {
            this.state = GAME_STATES.PLAYING;
            document.getElementById('pause-screen').classList.add('hidden');
        }
    }

    showMenu() {
        this.state = GAME_STATES.MENU;
        document.getElementById('game-hud').classList.add('hidden');
        document.getElementById('pause-screen').classList.add('hidden');
        document.getElementById('gameover-screen').classList.add('hidden');
        document.getElementById('levelup-screen').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
        document.getElementById('menu-high-score').textContent = this.highScore.toLocaleString();
    }

    gameOver() {
        this.state = GAME_STATES.GAME_OVER;
        audio.play('hit');

        // Check High Score
        let isNewHigh = false;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('cyber_strike_high_score', this.highScore.toString());
            isNewHigh = true;
        }

        // Fill Stats
        document.getElementById('final-score').textContent = this.score.toLocaleString();
        document.getElementById('final-time').textContent = this.formatTime(this.gameTime);
        document.getElementById('final-wave').textContent = this.waveNumber;
        document.getElementById('final-kills').textContent = this.kills;
        document.getElementById('final-level').textContent = this.player.level;

        const hsBadge = document.getElementById('new-highscore-badge');
        if (isNewHigh) {
            hsBadge.classList.remove('hidden');
        } else {
            hsBadge.classList.add('hidden');
        }

        document.getElementById('gameover-screen').classList.remove('hidden');
    }

    triggerLevelUp() {
        this.state = GAME_STATES.LEVEL_UP;
        audio.play('levelup');

        const container = document.getElementById('upgrade-cards-container');
        container.innerHTML = '';

        const upgrades = UpgradeManager.getRandomUpgrades(this.player, 3);
        upgrades.forEach(upg => {
            const card = document.createElement('div');
            card.className = 'upgrade-card';
            card.innerHTML = `
                <div>
                    <div class="upgrade-icon-wrapper">${upg.icon}</div>
                    <div class="upgrade-title">${upg.title}</div>
                    <div class="upgrade-desc">${upg.description}</div>
                </div>
                <div class="upgrade-badge badge-${upg.rarity.toLowerCase()}">${upg.rarity}</div>
            `;
            card.addEventListener('click', () => {
                upg.apply(this.player, this);
                document.getElementById('levelup-screen').classList.add('hidden');
                this.state = GAME_STATES.PLAYING;
                this.updateHUD();
            });
            container.appendChild(card);
        });

        document.getElementById('levelup-screen').classList.remove('hidden');
    }

    addScore(pts) {
        this.score += pts;
        this.updateHUD();
    }

    addScreenShake(intensity) {
        if (this.screenShakeEnabled) {
            this.screenShakeAmount = Math.min(this.screenShakeAmount + intensity, 25);
        }
    }

    formatTime(sec) {
        const mins = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    updateHUD() {
        if (!this.player) return;

        // HP & Shield
        const hpPercent = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
        const shieldPercent = Math.max(0, (this.player.shield / this.player.maxShield) * 100);
        
        document.getElementById('hp-bar-fill').style.width = `${hpPercent}%`;
        document.getElementById('hp-text').textContent = `${Math.ceil(this.player.hp)} / ${this.player.maxHp}`;

        document.getElementById('shield-bar-fill').style.width = `${shieldPercent}%`;
        document.getElementById('shield-text').textContent = `${Math.ceil(this.player.shield)} / ${this.player.maxShield}`;

        // XP & Level
        const xpPercent = (this.player.xp / this.player.nextLevelXp) * 100;
        document.getElementById('xp-bar-fill').style.width = `${xpPercent}%`;
        document.getElementById('player-level').textContent = this.player.level;
        document.getElementById('xp-text').textContent = `${this.player.xp} / ${this.player.nextLevelXp} XP`;

        // Stats & Score
        document.getElementById('score-text').textContent = this.score.toLocaleString();
        document.getElementById('kills-text').textContent = this.kills;
        document.getElementById('wave-number').textContent = this.waveNumber;
        document.getElementById('game-timer').textContent = this.formatTime(this.gameTime);

        // Dash Cooldown Overlay
        const dashCdRatio = this.player.dashTimer / this.player.dashCooldown;
        document.getElementById('dash-cooldown-overlay').style.height = `${dashCdRatio * 100}%`;

        // Boss HUD
        if (this.activeBoss) {
            document.getElementById('boss-hud-container').classList.remove('hidden');
            const bossHpRatio = Math.max(0, (this.activeBoss.hp / this.activeBoss.maxHp) * 100);
            document.getElementById('boss-hp-fill').style.width = `${bossHpRatio}%`;
            document.getElementById('boss-hp-text').textContent = `${Math.ceil(this.activeBoss.hp)} / ${this.activeBoss.maxHp}`;
            document.getElementById('boss-name').textContent = `WARNING: ${this.activeBoss.name}`;
        } else {
            document.getElementById('boss-hud-container').classList.add('hidden');
        }
    }

    // --- Main Game Loop ---
    loop(currentTime) {
        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        if (this.state === GAME_STATES.PLAYING) {
            this.update(dt);
        }

        this.render();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        this.gameTime += dt;
        this.waveNumber = 1 + Math.floor(this.gameTime / 45); // Wave every 45s

        // Boss Spawn Check (Every 3 Waves, e.g. Wave 3, 6, 9)
        if (this.waveNumber % 3 === 0 && !this.bossSpawnedThisWave && !this.activeBoss) {
            this.spawnBoss();
        } else if (this.waveNumber % 3 !== 0) {
            this.bossSpawnedThisWave = false;
        }

        // Enemy Spawning Logic
        this.enemySpawnTimer += dt;
        const spawnInterval = Math.max(0.4, 2.5 - (this.waveNumber * 0.2));
        if (this.enemySpawnTimer >= spawnInterval && this.enemies.length < 120) {
            this.enemySpawnTimer = 0;
            this.spawnEnemyGroup();
        }

        // Screen Shake decay
        if (this.screenShakeAmount > 0) {
            this.screenShakeAmount -= dt * 30;
            if (this.screenShakeAmount < 0) this.screenShakeAmount = 0;
        }

        // Update Player
        this.player.update(dt, this.keys, this.mouse);

        // Update Projectiles
        this.projectiles.forEach((p, idx) => {
            p.update(dt);
            if (p.destroyed) this.projectiles.splice(idx, 1);
        });

        // Update Enemy Projectiles
        this.enemyProjectiles.forEach((ep, idx) => {
            ep.update(dt);
            if (ep.destroyed) this.enemyProjectiles.splice(idx, 1);
        });

        // Update Enemies
        this.enemies.forEach((enemy, idx) => {
            enemy.update(dt, this.player, this);
            if (enemy.destroyed) {
                this.enemies.splice(idx, 1);
                if (enemy === this.activeBoss) this.activeBoss = null;
            }
        });

        // Update XP Gems
        this.xpGems.forEach((gem, idx) => {
            gem.update(dt, this.player);
            if (gem.destroyed) this.xpGems.splice(idx, 1);
        });

        // Update Particles
        this.particles.forEach((part, idx) => {
            part.update(dt);
            if (part.destroyed) this.particles.splice(idx, 1);
        });

        // Update Floating Damage Texts
        this.floatingTexts.forEach((ft, idx) => {
            ft.update(dt);
            if (ft.destroyed) this.floatingTexts.splice(idx, 1);
        });

        // Collision Checks
        this.checkCollisions();

        // Refresh HUD
        this.updateHUD();
    }

    spawnEnemyGroup() {
        const count = 1 + Math.floor(Math.random() * (1 + this.waveNumber * 0.5));
        for (let i = 0; i < count; i++) {
            // Spawn around viewport perimeter
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.max(this.canvas.width, this.canvas.height) * 0.6 + 50;
            const spawnX = this.player.x + Math.cos(angle) * dist;
            const spawnY = this.player.y + Math.sin(angle) * dist;

            // Pick enemy type based on wave
            const rand = Math.random();
            let type = 'crawler';
            if (this.waveNumber >= 2 && rand > 0.6) type = 'stalker';
            if (this.waveNumber >= 3 && rand > 0.8) type = 'drone';
            if (this.waveNumber >= 4 && rand > 0.9) type = 'heavy';

            this.enemies.push(new Enemy(spawnX, spawnY, type, this.waveNumber));
        }
    }

    spawnBoss() {
        this.bossSpawnedThisWave = true;
        const angle = Math.random() * Math.PI * 2;
        const dist = 500;
        const spawnX = this.player.x + Math.cos(angle) * dist;
        const spawnY = this.player.y + Math.sin(angle) * dist;

        const boss = new Enemy(spawnX, spawnY, 'boss', this.waveNumber);
        this.enemies.push(boss);
        this.activeBoss = boss;

        audio.play('emp');
        this.addScreenShake(15);
        this.spawnFloatingText(this.player.x, this.player.y - 40, "WARNING: BOSS ENCOUNTER!", "#ff0055", 1.8);
    }

    checkCollisions() {
        // Player Projectiles vs Enemies
        this.projectiles.forEach(p => {
            if (p.destroyed) return;
            this.enemies.forEach(e => {
                if (e.destroyed) return;
                const dist = Math.hypot(p.x - e.x, p.y - e.y);
                if (dist < p.radius + e.radius) {
                    const isCrit = Math.random() < this.player.critChance;
                    const dmg = isCrit ? p.damage * 2.0 : p.damage;
                    e.takeDamage(dmg, this);
                    
                    if (!p.pierce) p.destroyed = true;

                    // Particle spark
                    this.createHitSparks(p.x, p.y, isCrit ? '#ffcc00' : '#00f3ff');
                    this.spawnFloatingText(e.x, e.y - 15, Math.ceil(dmg).toString(), isCrit ? '#ffcc00' : '#ffffff', isCrit ? 1.4 : 1.0);
                }
            });
        });

        // Enemy Projectiles vs Player
        this.enemyProjectiles.forEach(ep => {
            if (ep.destroyed) return;
            const dist = Math.hypot(ep.x - this.player.x, ep.y - this.player.y);
            if (dist < ep.radius + this.player.radius) {
                ep.destroyed = true;
                this.player.takeDamage(ep.damage, this);
            }
        });

        // Enemies vs Player (Melee hit)
        this.enemies.forEach(e => {
            if (e.destroyed) return;
            const dist = Math.hypot(e.x - this.player.x, e.y - this.player.y);
            if (dist < e.radius + this.player.radius) {
                this.player.takeDamage(e.contactDamage, this);
            }
        });
    }

    createHitSparks(x, y, color) {
        for (let i = 0; i < 6; i++) {
            this.particles.push(new Particle(x, y, color, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200, 0.3));
        }
    }

    createExplosion(x, y, color = '#ff0055', count = 20) {
        audio.play('explosion');
        this.addScreenShake(6);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 250;
            this.particles.push(new Particle(x, y, color, Math.cos(angle) * speed, Math.sin(angle) * speed, 0.4 + Math.random() * 0.4));
        }
    }

    spawnFloatingText(x, y, text, color = '#ffffff', scale = 1.0) {
        this.floatingTexts.push(new FloatingText(x, y, text, color, scale));
    }

    render() {
        this.ctx.save();

        // Screen Shake offset
        if (this.screenShakeAmount > 0) {
            const rx = (Math.random() - 0.5) * this.screenShakeAmount;
            const ry = (Math.random() - 0.5) * this.screenShakeAmount;
            this.ctx.translate(rx, ry);
        }

        // Clear Screen
        this.ctx.fillStyle = '#070913';
        this.ctx.fillRect(-20, -20, this.canvas.width + 40, this.canvas.height + 40);

        // Draw Cyber Grid Lines (World / Camera Effect)
        this.drawCyberGrid();

        if (this.state === GAME_STATES.PLAYING || this.state === GAME_STATES.PAUSED || this.state === GAME_STATES.LEVEL_UP) {
            // Camera Center on Player
            const camX = this.canvas.width / 2 - this.player.x;
            const camY = this.canvas.height / 2 - this.player.y;

            this.ctx.save();
            this.ctx.translate(camX, camY);

            // Render XP Gems
            this.xpGems.forEach(gem => gem.draw(this.ctx));

            // Render Projectiles
            this.projectiles.forEach(p => p.draw(this.ctx));
            this.enemyProjectiles.forEach(ep => ep.draw(this.ctx));

            // Render Enemies
            this.enemies.forEach(e => e.draw(this.ctx));

            // Render Player
            this.player.draw(this.ctx);

            // Render Particles
            this.particles.forEach(p => p.draw(this.ctx));

            // Render Floating Damage Texts
            this.floatingTexts.forEach(ft => ft.draw(this.ctx));

            this.ctx.restore();
        }

        this.ctx.restore();
    }

    drawCyberGrid() {
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.04)';
        this.ctx.lineWidth = 1;

        const gridSize = 60;
        const offsetX = (this.player ? -this.player.x : 0) % gridSize;
        const offsetY = (this.player ? -this.player.y : 0) % gridSize;

        for (let x = offsetX; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = offsetY; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        this.ctx.restore();
    }
}

// --- Player Entity Class ---
class Player {
    constructor(x, y, game) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.radius = 18;

        // Base Stats
        this.maxHp = 100;
        this.hp = 100;
        this.maxShield = 50;
        this.shield = 50;
        this.shieldRegenTimer = 0;

        this.speed = 220;
        this.level = 1;
        this.xp = 0;
        this.nextLevelXp = 100;
        this.critChance = 0.1;
        this.magnetRadius = 140;

        // Cyber Dash
        this.dashCooldown = 3.0;
        this.dashTimer = 0;
        this.isDashing = false;
        this.dashDuration = 0.25;
        this.dashElapsed = 0;
        this.dashDirX = 0;
        this.dashDirY = 0;

        // Weapons Array & Level States
        this.weapons = {
            plasma: { level: 1, fireTimer: 0, fireRate: 0.2, damage: 25 },
            drones: { level: 0, count: 2, orbitAngle: 0, fireTimer: 0, damage: 18 },
            lightning: { level: 0, timer: 0, cooldown: 2.0, damage: 45, targets: 3 },
            emp: { level: 0, timer: 0, cooldown: 4.0, radius: 250, damage: 80 },
            blade: { level: 0, angle: 0, damage: 30 }
        };
    }

    triggerDash() {
        if (this.dashTimer <= 0 && !this.isDashing) {
            this.isDashing = true;
            this.dashElapsed = 0;
            this.dashTimer = this.dashCooldown;

            // Determine Dash direction
            let dx = 0, dy = 0;
            if (this.game.keys['KeyW'] || this.game.keys['ArrowUp']) dy -= 1;
            if (this.game.keys['KeyS'] || this.game.keys['ArrowDown']) dy += 1;
            if (this.game.keys['KeyA'] || this.game.keys['ArrowLeft']) dx -= 1;
            if (this.game.keys['KeyD'] || this.game.keys['ArrowRight']) dx += 1;

            if (dx === 0 && dy === 0) {
                // Dash towards mouse direction if stationary
                const angle = Math.atan2(this.game.mouse.y - this.game.canvas.height / 2, this.game.mouse.x - this.game.canvas.width / 2);
                dx = Math.cos(angle);
                dy = Math.sin(angle);
            } else {
                const len = Math.hypot(dx, dy);
                dx /= len;
                dy /= len;
            }

            this.dashDirX = dx;
            this.dashDirY = dy;
            audio.play('dash');
            this.game.addScreenShake(4);

            // Create Shockwave shock
            for (let i = 0; i < 12; i++) {
                const a = (i / 12) * Math.PI * 2;
                this.game.particles.push(new Particle(this.x, this.y, '#00f3ff', Math.cos(a) * 150, Math.sin(a) * 150, 0.3));
            }
        }
    }

    takeDamage(amount, game) {
        if (this.isDashing) return; // Invulnerable during dash

        this.shieldRegenTimer = 4.0; // Reset shield regen timer
        audio.play('hit');
        game.addScreenShake(8);

        if (this.shield > 0) {
            if (this.shield >= amount) {
                this.shield -= amount;
            } else {
                const remaining = amount - this.shield;
                this.shield = 0;
                this.hp -= remaining;
            }
        } else {
            this.hp -= amount;
        }

        if (this.hp <= 0) {
            this.hp = 0;
            game.gameOver();
        }
    }

    addXp(amount) {
        this.xp += amount;
        audio.play('pickup');

        if (this.xp >= this.nextLevelXp) {
            this.xp -= this.nextLevelXp;
            this.level++;
            this.nextLevelXp = Math.floor(this.nextLevelXp * 1.35);
            this.game.triggerLevelUp();
        }
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
        this.game.spawnFloatingText(this.x, this.y - 20, `+${amount} HP`, '#00ff66', 1.2);
    }

    update(dt, keys, mouse) {
        // Dash Cooldown & Execution
        if (this.dashTimer > 0) {
            this.dashTimer -= dt;
            if (this.dashTimer < 0) this.dashTimer = 0;
        }

        if (this.isDashing) {
            this.dashElapsed += dt;
            const dashSpeed = 650;
            this.x += this.dashDirX * dashSpeed * dt;
            this.y += this.dashDirY * dashSpeed * dt;

            // Ghost particle
            if (Math.random() < 0.6) {
                this.game.particles.push(new Particle(this.x, this.y, '#00f3ff', 0, 0, 0.2));
            }

            if (this.dashElapsed >= this.dashDuration) {
                this.isDashing = false;
            }
        } else {
            // Normal Movement
            let dx = 0, dy = 0;
            if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
            if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
            if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
            if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

            if (dx !== 0 && dy !== 0) {
                dx *= 0.7071;
                dy *= 0.7071;
            }

            this.x += dx * this.speed * dt;
            this.y += dy * this.speed * dt;
        }

        // Shield Passive Regeneration
        if (this.shieldRegenTimer > 0) {
            this.shieldRegenTimer -= dt;
        } else if (this.shield < this.maxShield) {
            this.shield = Math.min(this.maxShield, this.shield + dt * 12);
        }

        // Weapon Logic
        this.updateWeapons(dt, mouse);
    }

    updateWeapons(dt, mouse) {
        // 1. Plasma Repeater (Primary)
        const wPlasma = this.weapons.plasma;
        if (wPlasma.level > 0) {
            wPlasma.fireTimer += dt;
            if (wPlasma.fireTimer >= wPlasma.fireRate) {
                wPlasma.fireTimer = 0;
                this.firePlasma(mouse);
            }
        }

        // 2. Orbital Laser Drones
        const wDrones = this.weapons.drones;
        if (wDrones.level > 0) {
            wDrones.orbitAngle += dt * 2.0;
            wDrones.fireTimer += dt;
            if (wDrones.fireTimer >= 0.8) {
                wDrones.fireTimer = 0;
                this.fireOrbitalDrones();
            }
        }

        // 3. Chain Lightning
        const wLightning = this.weapons.lightning;
        if (wLightning.level > 0) {
            wLightning.timer += dt;
            if (wLightning.timer >= wLightning.cooldown) {
                wLightning.timer = 0;
                this.triggerChainLightning();
            }
        }

        // 4. EMP Nova Bomb
        const wEmp = this.weapons.emp;
        if (wEmp.level > 0) {
            wEmp.timer += dt;
            if (wEmp.timer >= wEmp.cooldown) {
                wEmp.timer = 0;
                this.triggerEmpPulse();
            }
        }

        // 5. Cyber Blade Ring
        const wBlade = this.weapons.blade;
        if (wBlade.level > 0) {
            wBlade.angle += dt * 3.5;
            this.checkBladeCollisions();
        }
    }

    firePlasma(mouse) {
        let angle = 0;
        if (this.game.autoAim && this.game.enemies.length > 0) {
            // Target closest enemy
            const nearest = this.getClosestEnemy();
            if (nearest) {
                angle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
            }
        } else {
            angle = Math.atan2(mouse.y - this.game.canvas.height / 2, mouse.x - this.game.canvas.width / 2);
        }

        const count = 1 + Math.floor((this.weapons.plasma.level - 1) / 2); // Multi-shot at higher levels
        const spread = 0.12;

        for (let i = 0; i < count; i++) {
            const offset = (i - (count - 1) / 2) * spread;
            const finalAngle = angle + offset;
            const speed = 700;
            this.game.projectiles.push(new Projectile(
                this.x, this.y,
                Math.cos(finalAngle) * speed,
                Math.sin(finalAngle) * speed,
                this.weapons.plasma.damage,
                '#00f3ff', 5
            ));
        }
        audio.play('laser');
    }

    fireOrbitalDrones() {
        const nearest = this.getClosestEnemy();
        if (!nearest) return;

        const count = this.weapons.drones.count;
        const radius = 65;

        for (let i = 0; i < count; i++) {
            const a = this.weapons.drones.orbitAngle + (i / count) * Math.PI * 2;
            const droneX = this.x + Math.cos(a) * radius;
            const droneY = this.y + Math.sin(a) * radius;

            const fireAngle = Math.atan2(nearest.y - droneY, nearest.x - droneX);
            this.game.projectiles.push(new Projectile(
                droneX, droneY,
                Math.cos(fireAngle) * 550,
                Math.sin(fireAngle) * 550,
                this.weapons.drones.damage,
                '#9d00ff', 4
            ));
        }
    }

    triggerChainLightning() {
        const targets = this.game.enemies
            .map(e => ({ enemy: e, dist: Math.hypot(e.x - this.x, e.y - this.y) }))
            .sort((a, b) => a.dist - b.dist)
            .slice(0, this.weapons.lightning.targets);

        if (targets.length === 0) return;

        audio.play('chain');
        let prevX = this.x, prevY = this.y;

        targets.forEach(({ enemy }) => {
            // Draw lightning beam particle effect
            for (let step = 0; step < 8; step++) {
                const t = step / 8;
                const lx = prevX + (enemy.x - prevX) * t + (Math.random() - 0.5) * 20;
                const ly = prevY + (enemy.y - prevY) * t + (Math.random() - 0.5) * 20;
                this.game.particles.push(new Particle(lx, ly, '#ffe600', 0, 0, 0.25));
            }
            enemy.takeDamage(this.weapons.lightning.damage, this.game);
            prevX = enemy.x;
            prevY = enemy.y;
        });
    }

    triggerEmpPulse() {
        audio.play('emp');
        this.game.addScreenShake(10);
        const radius = this.weapons.emp.radius;

        // Spawn visual EMP expand ring particle
        for (let i = 0; i < 36; i++) {
            const a = (i / 36) * Math.PI * 2;
            this.game.particles.push(new Particle(
                this.x, this.y, '#00ff66',
                Math.cos(a) * (radius / 0.3),
                Math.sin(a) * (radius / 0.3),
                0.35
            ));
        }

        this.game.enemies.forEach(e => {
            const dist = Math.hypot(e.x - this.x, e.y - this.y);
            if (dist <= radius) {
                e.takeDamage(this.weapons.emp.damage, this.game);
            }
        });
    }

    checkBladeCollisions() {
        const radius = 80;
        const bladeCount = 3 + this.weapons.blade.level;
        for (let i = 0; i < bladeCount; i++) {
            const a = this.weapons.blade.angle + (i / bladeCount) * Math.PI * 2;
            const bx = this.x + Math.cos(a) * radius;
            const by = this.y + Math.sin(a) * radius;

            this.game.enemies.forEach(e => {
                const dist = Math.hypot(e.x - bx, e.y - by);
                if (dist < 20 + e.radius) {
                    e.takeDamage(this.weapons.blade.damage * 0.05, this.game); // Continuous slicing contact
                }
            });
        }
    }

    getClosestEnemy() {
        let closest = null;
        let minDist = Infinity;
        this.game.enemies.forEach(e => {
            const d = Math.hypot(e.x - this.x, e.y - this.y);
            if (d < minDist) {
                minDist = d;
                closest = e;
            }
        });
        return closest;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Render Shield Bubble
        if (this.shield > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 243, 255, ${0.4 + (this.shield / this.maxShield) * 0.4})`;
            ctx.lineWidth = 2;
            ctx.shadowColor = '#00f3ff';
            ctx.shadowBlur = 10;
            ctx.stroke();
        }

        // Render Cyber Blade Ring if active
        if (this.weapons.blade.level > 0) {
            const bladeCount = 3 + this.weapons.blade.level;
            const radius = 80;
            for (let i = 0; i < bladeCount; i++) {
                const a = this.weapons.blade.angle + (i / bladeCount) * Math.PI * 2;
                const bx = Math.cos(a) * radius;
                const by = Math.sin(a) * radius;

                ctx.save();
                ctx.translate(bx, by);
                ctx.rotate(a + Math.PI / 2);
                ctx.fillStyle = '#ff0055';
                ctx.shadowColor = '#ff0055';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.moveTo(0, -12);
                ctx.lineTo(6, 12);
                ctx.lineTo(-6, 12);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        }

        // Render Orbital Drones if active
        if (this.weapons.drones.level > 0) {
            const count = this.weapons.drones.count;
            const radius = 65;
            for (let i = 0; i < count; i++) {
                const a = this.weapons.drones.orbitAngle + (i / count) * Math.PI * 2;
                const dx = Math.cos(a) * radius;
                const dy = Math.sin(a) * radius;

                ctx.beginPath();
                ctx.arc(dx, dy, 6, 0, Math.PI * 2);
                ctx.fillStyle = '#9d00ff';
                ctx.shadowColor = '#9d00ff';
                ctx.shadowBlur = 10;
                ctx.fill();
            }
        }

        // Render Player Body (Futuristic Triangle Fighter)
        let angle = Math.atan2(this.game.mouse.y - this.game.canvas.height / 2, this.game.mouse.x - this.game.canvas.width / 2);
        if (this.game.autoAim && this.game.enemies.length > 0) {
            const nearest = this.getClosestEnemy();
            if (nearest) angle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
        }

        ctx.rotate(angle);

        ctx.beginPath();
        ctx.moveTo(this.radius + 4, 0);
        ctx.lineTo(-this.radius, -this.radius + 4);
        ctx.lineTo(-this.radius + 6, 0);
        ctx.lineTo(-this.radius, this.radius - 4);
        ctx.closePath();

        ctx.fillStyle = this.isDashing ? '#ffffff' : '#00f3ff';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }
}

// --- Enemy Entity Class ---
class Enemy {
    constructor(x, y, type, wave) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.destroyed = false;
        this.fireTimer = 0;

        // Type Properties
        if (type === 'crawler') {
            this.name = 'Cyber Bug';
            this.radius = 14;
            this.maxHp = 30 + wave * 10;
            this.speed = 170 + Math.random() * 30;
            this.contactDamage = 10;
            this.color = '#ff0055';
            this.scoreVal = 10;
            this.xpVal = 15;
        } else if (type === 'stalker') {
            this.name = 'Neon Assassin';
            this.radius = 18;
            this.maxHp = 70 + wave * 20;
            this.speed = 210;
            this.contactDamage = 18;
            this.color = '#9d00ff';
            this.scoreVal = 25;
            this.xpVal = 30;
        } else if (type === 'drone') {
            this.name = 'Sniper Drone';
            this.radius = 16;
            this.maxHp = 50 + wave * 15;
            this.speed = 110;
            this.contactDamage = 8;
            this.color = '#ffe600';
            this.scoreVal = 35;
            this.xpVal = 40;
        } else if (type === 'heavy') {
            this.name = 'Iron Mech';
            this.radius = 28;
            this.maxHp = 250 + wave * 60;
            this.speed = 85;
            this.contactDamage = 30;
            this.color = '#00ff66';
            this.scoreVal = 80;
            this.xpVal = 85;
        } else if (type === 'boss') {
            this.name = 'CYBER DREADNOUGHT';
            this.radius = 50;
            this.maxHp = 2000 + wave * 800;
            this.speed = 60;
            this.contactDamage = 45;
            this.color = '#ff0055';
            this.scoreVal = 1000;
            this.xpVal = 500;
        }

        this.hp = this.maxHp;
    }

    takeDamage(dmg, game) {
        this.hp -= dmg;
        if (this.hp <= 0 && !this.destroyed) {
            this.destroyed = true;
            game.kills++;
            game.addScore(this.scoreVal);
            game.createExplosion(this.x, this.y, this.color, this.type === 'boss' ? 50 : 15);

            // Drop XP Gem
            game.xpGems.push(new XpGem(this.x, this.y, this.xpVal));
        }
    }

    update(dt, player, game) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            // Movement towards player
            let targetDist = (this.type === 'drone') ? 220 : 0;
            if (dist > targetDist) {
                this.x += (dx / dist) * this.speed * dt;
                this.y += (dy / dist) * this.speed * dt;
            }
        }

        // Shooting logic for Ranged Drone & Boss
        if (this.type === 'drone') {
            this.fireTimer += dt;
            if (this.fireTimer >= 2.2) {
                this.fireTimer = 0;
                const angle = Math.atan2(dy, dx);
                game.enemyProjectiles.push(new Projectile(this.x, this.y, Math.cos(angle) * 350, Math.sin(angle) * 350, 12, '#ffe600', 5));
            }
        } else if (this.type === 'boss') {
            this.fireTimer += dt;
            if (this.fireTimer >= 1.5) {
                this.fireTimer = 0;
                // Boss Ring Attack Pattern
                for (let i = 0; i < 12; i++) {
                    const a = (i / 12) * Math.PI * 2;
                    game.enemyProjectiles.push(new Projectile(this.x, this.y, Math.cos(a) * 260, Math.sin(a) * 260, 18, '#ff0055', 6));
                }
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;

        if (this.type === 'boss') {
            // Boss Render (Octagon Mech with core)
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                const px = Math.cos(a) * this.radius;
                const py = Math.sin(a) * this.radius;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Core
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        } else if (this.type === 'heavy') {
            ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// --- Projectile Entity Class ---
class Projectile {
    constructor(x, y, vx, vy, damage, color = '#00f3ff', radius = 4, pierce = false) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.color = color;
        this.radius = radius;
        this.pierce = pierce;
        this.destroyed = false;
        this.lifeTimer = 2.5; // Max 2.5s life
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        this.lifeTimer -= dt;
        if (this.lifeTimer <= 0) this.destroyed = true;
    }

    draw(ctx) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
    }
}

// --- XP Gem Pickup Class ---
class XpGem {
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.destroyed = false;
        this.radius = 6;
        this.color = value >= 100 ? '#9d00ff' : (value >= 40 ? '#00ff66' : '#00f3ff');
    }

    update(dt, player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist < player.magnetRadius) {
            // Magnet pull speed
            const speed = 400 * (1 - dist / player.magnetRadius) + 150;
            this.x += (dx / dist) * speed * dt;
            this.y += (dy / dist) * speed * dt;
        }

        if (dist < player.radius + this.radius) {
            this.destroyed = true;
            player.addXp(this.value);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
        ctx.restore();
    }
}

// --- Particle Visual Effect Class ---
class Particle {
    constructor(x, y, color, vx, vy, life) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = vx;
        this.vy = vy;
        this.maxLife = life;
        this.life = life;
        this.destroyed = false;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        if (this.life <= 0) this.destroyed = true;
    }

    draw(ctx) {
        ctx.save();
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// --- Floating Text Popups Class ---
class FloatingText {
    constructor(x, y, text, color = '#ffffff', scale = 1.0) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.scale = scale;
        this.life = 0.8;
        this.destroyed = false;
    }

    update(dt) {
        this.y -= 30 * dt;
        this.life -= dt;
        if (this.life <= 0) this.destroyed = true;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life / 0.8);
        ctx.font = `bold ${Math.floor(16 * this.scale)}px 'Orbitron', sans-serif`;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.fillText(this.text, this.x - 10, this.y);
        ctx.restore();
    }
}

// --- Upgrades Registry ---
class UpgradeManager {
    static getRandomUpgrades(player, count = 3) {
        const pool = [
            {
                id: 'plasma_upgrade',
                title: 'Plasma Cannon +1',
                description: 'Meningkatkan fire rate & damage meriam utama laser.',
                icon: '🔫',
                rarity: 'Common',
                apply: (p) => {
                    p.weapons.plasma.level++;
                    p.weapons.plasma.fireRate = Math.max(0.08, p.weapons.plasma.fireRate * 0.85);
                    p.weapons.plasma.damage += 8;
                }
            },
            {
                id: 'drone_unlock',
                title: player.weapons.drones.level === 0 ? 'Buka Orbital Drone' : 'Drone Laser +1',
                description: 'Memanggil drone mengorbit yang menembak musuh terdekat.',
                icon: '🛸',
                rarity: 'Rare',
                apply: (p) => {
                    p.weapons.drones.level++;
                    p.weapons.drones.count++;
                    p.weapons.drones.damage += 6;
                }
            },
            {
                id: 'chain_unlock',
                title: player.weapons.lightning.level === 0 ? 'Buka Tesla Lightning' : 'Overcharge Lightning',
                description: 'Menyetrum musuh terdekat secara berkala dengan rantai petir.',
                icon: '⚡',
                rarity: 'Epic',
                apply: (p) => {
                    p.weapons.lightning.level++;
                    p.weapons.lightning.targets += 2;
                    p.weapons.lightning.damage += 15;
                }
            },
            {
                id: 'emp_unlock',
                title: player.weapons.emp.level === 0 ? 'Buka EMP Nova Bomb' : 'Super EMP Pulse',
                description: 'Melepaskan gelombang kejutan masif yang menyapu musuh.',
                icon: '💣',
                rarity: 'Epic',
                apply: (p) => {
                    p.weapons.emp.level++;
                    p.weapons.emp.radius += 40;
                    p.weapons.emp.damage += 35;
                }
            },
            {
                id: 'blade_unlock',
                title: player.weapons.blade.level === 0 ? 'Buka Cyber Blade Ring' : 'Cyber Blade +1',
                description: 'Pedang energi mengitari pesawat dan mencincang musuh jarak dekat.',
                icon: '🗡️',
                rarity: 'Legendary',
                apply: (p) => {
                    p.weapons.blade.level++;
                    p.weapons.blade.damage += 10;
                }
            },
            {
                id: 'stat_hp',
                title: 'NANO HEAL & MAX HP',
                description: 'Memulihkan 40 HP & meningkatkan Max HP sebesar +30.',
                icon: '💖',
                rarity: 'Common',
                apply: (p) => {
                    p.maxHp += 30;
                    p.heal(40);
                }
            },
            {
                id: 'stat_shield',
                title: 'SHIELD OVERCLOCK',
                description: 'Meningkatkan daya tahan perisai +25 & regenerasi perisai.',
                icon: '🛡️',
                rarity: 'Rare',
                apply: (p) => {
                    p.maxShield += 25;
                    p.shield = p.maxShield;
                }
            },
            {
                id: 'stat_speed',
                title: 'CYBER THRUSTER',
                description: 'Meningkatkan kecepatan gerak pesawat sebesar +15%.',
                icon: '🚀',
                rarity: 'Common',
                apply: (p) => {
                    p.speed *= 1.15;
                }
            },
            {
                id: 'stat_magnet',
                title: 'XP MAGNET FIELD',
                description: 'Memperluas jangkauan magnet penarik XP gem sebesar +50%.',
                icon: '🧲',
                rarity: 'Common',
                apply: (p) => {
                    p.magnetRadius *= 1.5;
                }
            },
            {
                id: 'stat_crit',
                title: 'CRITICAL LASER CORE',
                description: 'Meningkatkan peluang serangan kritis (Critical Hit) +15%.',
                icon: '🎯',
                rarity: 'Rare',
                apply: (p) => {
                    p.critChance += 0.15;
                }
            }
        ];

        // Shuffle & Pick 'count' unique items
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
}

// --- Initialize Game on DOM Load ---
window.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new Game();
});
