/**
 * NEON DEFENDER 365 - DAY 005
 * Cyberpunk Arcade Space Shooter Game
 * Built with HTML5 Canvas, Web Audio API, and Vanilla JS
 */

// Sound Engine using Web Audio API
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
    }

    playLaser() {
        if (!this.enabled || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.15);
            
            gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start();
            osc.stop(this.ctx.currentTime + 0.15);
        } catch (e) {}
    }

    playExplosion(isLarge = false) {
        if (!this.enabled || !this.ctx) return;
        try {
            const duration = isLarge ? 0.6 : 0.3;
            const bufferSize = this.ctx.sampleRate * duration;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(isLarge ? 300 : 600, this.ctx.currentTime);
            filter.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + duration);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(isLarge ? 0.5 : 0.3, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            noise.start();
        } catch (e) {}
    }

    playPowerup() {
        if (!this.enabled || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            
            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(900, now + 0.25);
            
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start();
            osc.stop(now + 0.25);
        } catch (e) {}
    }

    playUltimate() {
        if (!this.enabled || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            
            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(1200, now + 0.5);
            
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start();
            osc.stop(now + 0.5);
        } catch (e) {}
    }
}

// Game Core Class
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.sound = new SoundEngine();

        // State variables
        this.state = 'START'; // START, PLAYING, PAUSED, GAMEOVER
        this.difficulty = 'normal'; // easy, normal, hard
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('neon_defender_highscore')) || 0;
        this.wave = 1;
        this.kills = 0;
        this.screenShakeTime = 0;
        this.freezeTimer = 0;

        // Key bindings
        this.keys = {};
        this.mouse = { x: 0, y: 0, isDown: false };

        // Game Entities
        this.player = null;
        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.particles = [];
        this.powerups = [];
        this.stars = [];

        this.lastTime = 0;
        this.enemySpawnTimer = 0;
        this.waveEnemyCount = 0;
        this.waveMaxEnemies = 10;

        this.setupDOM();
        this.setupStars();
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.bindEvents();

        // Start Loop
        requestAnimationFrame((t) => this.loop(t));
    }

    setupDOM() {
        document.getElementById('startHighScoreVal').innerText = this.highScore;
        document.getElementById('finalHighScoreVal').innerText = this.highScore;
    }

    resize() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
        if (this.player) {
            this.player.y = this.canvas.height - 80;
        }
    }

    setupStars() {
        this.stars = [];
        for (let i = 0; i < 90; i++) {
            this.stars.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 1.5 + 0.5,
                alpha: Math.random() * 0.8 + 0.2
            });
        }
    }

    bindEvents() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.sound.init();
            this.keys[e.code] = true;
            if (e.code === 'KeyP' || e.code === 'Escape') {
                this.togglePause();
            }
            if (e.code === 'Space' && this.state === 'PLAYING') {
                this.activateUltimate();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Mouse / Touch
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        this.canvas.addEventListener('mousedown', () => {
            this.sound.init();
            this.mouse.isDown = true;
        });

        window.addEventListener('mouseup', () => {
            this.mouse.isDown = false;
        });

        // UI Buttons
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartPauseBtn').addEventListener('click', () => this.startGame());
        document.getElementById('resumeBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('howToPlayBtn').addEventListener('click', () => {
            document.getElementById('howToPlayModal').classList.remove('hidden');
        });
        document.getElementById('closeModalBtn').addEventListener('click', () => {
            document.getElementById('howToPlayModal').classList.add('hidden');
        });

        // Difficulty selector
        const diffBtns = document.querySelectorAll('.diff-btn');
        diffBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                diffBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.difficulty = e.target.getAttribute('data-diff');
            });
        });

        // Mute button
        const soundBtn = document.getElementById('soundToggleBtn');
        soundBtn.addEventListener('click', () => {
            this.sound.enabled = !this.sound.enabled;
            document.getElementById('soundIcon').innerText = this.sound.enabled ? '🔊' : '🔇';
        });
    }

    startGame() {
        this.sound.init();
        this.score = 0;
        this.wave = 1;
        this.kills = 0;
        this.waveEnemyCount = 0;
        this.waveMaxEnemies = 12;
        this.freezeTimer = 0;

        // Reset entities
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 80,
            radius: 20,
            speed: 7,
            hp: 100,
            maxHp: 100,
            ultimate: 0,
            shootCooldown: 0,
            weaponType: 'normal', // normal, triple, laser
            weaponTimer: 0
        };

        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.particles = [];
        this.powerups = [];

        this.state = 'PLAYING';

        // UI Updates
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('pauseScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        this.updateHUD();
    }

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            document.getElementById('pauseScreen').classList.remove('hidden');
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            document.getElementById('pauseScreen').classList.add('hidden');
        }
    }

    triggerGameOver() {
        this.state = 'GAMEOVER';
        this.sound.playExplosion(true);

        const isNewRecord = this.score > this.highScore;
        if (isNewRecord) {
            this.highScore = this.score;
            localStorage.setItem('neon_defender_highscore', this.highScore);
            document.getElementById('newHighScoreAlert').classList.remove('hidden');
        } else {
            document.getElementById('newHighScoreAlert').classList.add('hidden');
        }

        document.getElementById('finalScoreVal').innerText = this.score;
        document.getElementById('finalHighScoreVal').innerText = this.highScore;
        document.getElementById('finalWaveVal').innerText = this.wave;
        document.getElementById('finalKillsVal').innerText = this.kills;
        document.getElementById('startHighScoreVal').innerText = this.highScore;

        document.getElementById('hud').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }

    activateUltimate() {
        if (!this.player || this.player.ultimate < 100) return;
        this.player.ultimate = 0;
        this.sound.playUltimate();
        this.screenShakeTime = 25;

        // Destroy all non-boss enemies and clear bullets
        this.enemyBullets = [];
        this.enemies.forEach(enemy => {
            this.createExplosion(enemy.x, enemy.y, enemy.color, enemy.type === 'boss' ? 40 : 25);
            if (enemy.type === 'boss') {
                enemy.hp -= 200;
            } else {
                enemy.hp = 0;
                this.score += 20;
                this.kills++;
            }
        });
        this.enemies = this.enemies.filter(e => e.hp > 0);
        this.updateHUD();
    }

    updateHUD() {
        document.getElementById('scoreVal').innerText = this.score;
        document.getElementById('waveVal').innerText = this.wave;
        
        const hpPercent = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
        document.getElementById('healthBar').style.width = hpPercent + '%';

        const ultPercent = Math.min(100, this.player.ultimate);
        document.getElementById('ultimateBar').style.width = ultPercent + '%';

        // Power-up display
        const pContainer = document.getElementById('powerupContainer');
        pContainer.innerHTML = '';
        if (this.player.weaponType !== 'normal') {
            const badge = document.createElement('div');
            badge.className = 'powerup-badge';
            const secsLeft = Math.ceil(this.player.weaponTimer / 60);
            badge.innerText = `${this.player.weaponType.toUpperCase()} (${secsLeft}s)`;
            pContainer.appendChild(badge);
        }
        if (this.freezeTimer > 0) {
            const badge = document.createElement('div');
            badge.className = 'powerup-badge';
            const secsLeft = Math.ceil(this.freezeTimer / 60);
            badge.innerText = `FREEZE (${secsLeft}s)`;
            pContainer.appendChild(badge);
        }
    }

    spawnEnemy() {
        const diffMultiplier = this.difficulty === 'easy' ? 0.7 : (this.difficulty === 'hard' ? 1.5 : 1.0);
        const rand = Math.random();

        let enemy = {
            x: Math.random() * (this.canvas.width - 60) + 30,
            y: -40,
            radius: 18,
            speed: (Math.random() * 1.5 + 1.5) * (1 + this.wave * 0.08),
            hp: Math.ceil((2 + this.wave * 0.5) * diffMultiplier),
            maxHp: 2,
            type: 'scout',
            color: '#00f3ff',
            shootTimer: Math.random() * 100,
            angle: 0
        };

        if (rand > 0.65 && this.wave >= 2) {
            enemy.type = 'interceptor';
            enemy.color = '#ff0055';
            enemy.radius = 22;
            enemy.hp = Math.ceil((4 + this.wave * 0.8) * diffMultiplier);
        } else if (rand > 0.85 && this.wave >= 3) {
            enemy.type = 'heavy';
            enemy.color = '#ffe600';
            enemy.radius = 30;
            enemy.speed *= 0.6;
            enemy.hp = Math.ceil((10 + this.wave * 1.5) * diffMultiplier);
        }

        enemy.maxHp = enemy.hp;
        this.enemies.push(enemy);
        this.waveEnemyCount++;
    }

    spawnBoss() {
        const diffMultiplier = this.difficulty === 'easy' ? 0.7 : (this.difficulty === 'hard' ? 1.4 : 1.0);
        let boss = {
            x: this.canvas.width / 2,
            y: -100,
            targetY: 120,
            radius: 55,
            speed: 2,
            hp: Math.ceil(150 * (1 + this.wave * 0.2) * diffMultiplier),
            maxHp: 150,
            type: 'boss',
            color: '#9d00ff',
            shootTimer: 0,
            angle: 0
        };
        boss.maxHp = boss.hp;
        this.enemies.push(boss);
    }

    createExplosion(x, y, color, count = 15) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 1;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 4 + 1.5,
                color: color,
                alpha: 1,
                decay: Math.random() * 0.03 + 0.015
            });
        }
    }

    spawnPowerup(x, y) {
        if (Math.random() < 0.25) {
            const types = ['triple', 'laser', 'shield', 'freeze'];
            const type = types[Math.floor(Math.random() * types.length)];
            this.powerups.push({
                x, y, type,
                radius: 14,
                vy: 1.5
            });
        }
    }

    update() {
        if (this.state !== 'PLAYING') return;

        // Screen shake decay
        if (this.screenShakeTime > 0) this.screenShakeTime--;

        // Power-up timers
        if (this.player.weaponTimer > 0) {
            this.player.weaponTimer--;
            if (this.player.weaponTimer <= 0) {
                this.player.weaponType = 'normal';
            }
        }
        if (this.freezeTimer > 0) this.freezeTimer--;

        // Update Background Stars
        this.stars.forEach(star => {
            star.y += star.speed;
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
        });

        // Player Movement
        let dx = 0;
        let dy = 0;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += 1;
        if (this.keys['KeyW'] || this.keys['ArrowUp']) dy -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) dy += 1;

        // Mouse follow option if active click or moving
        if (this.mouse.isDown) {
            const mdx = this.mouse.x - this.player.x;
            const mdy = this.mouse.y - this.player.y;
            this.player.x += mdx * 0.1;
            this.player.y += mdy * 0.1;
        } else {
            this.player.x += dx * this.player.speed;
            this.player.y += dy * this.player.speed;
        }

        // Clamp player within bounds
        this.player.x = Math.max(this.player.radius, Math.min(this.canvas.width - this.player.radius, this.player.x));
        this.player.y = Math.max(this.player.radius, Math.min(this.canvas.height - this.player.radius, this.player.y));

        // Player Shooting
        this.player.shootCooldown--;
        if ((this.keys['KeyZ'] || this.mouse.isDown || this.keys['Space']) && this.player.shootCooldown <= 0) {
            this.player.shootCooldown = this.player.weaponType === 'laser' ? 4 : 10;
            this.sound.playLaser();

            if (this.player.weaponType === 'normal') {
                this.bullets.push({ x: this.player.x, y: this.player.y - 20, vy: -12, color: '#00f3ff', radius: 4 });
            } else if (this.player.weaponType === 'triple') {
                this.bullets.push({ x: this.player.x, y: this.player.y - 20, vx: -3, vy: -11, color: '#ff0055', radius: 4 });
                this.bullets.push({ x: this.player.x, y: this.player.y - 20, vx: 0, vy: -12, color: '#ff0055', radius: 4 });
                this.bullets.push({ x: this.player.x, y: this.player.y - 20, vx: 3, vy: -11, color: '#ff0055', radius: 4 });
            } else if (this.player.weaponType === 'laser') {
                this.bullets.push({ x: this.player.x, y: this.player.y - 25, vx: 0, vy: -18, color: '#ffe600', radius: 6 });
            }
        }

        // Update Bullets
        this.bullets.forEach(b => {
            b.x += (b.vx || 0);
            b.y += b.vy;
        });
        this.bullets = this.bullets.filter(b => b.y > -20 && b.x > -20 && b.x < this.canvas.width + 20);

        // Update Enemy Bullets
        this.enemyBullets.forEach(eb => {
            eb.x += eb.vx;
            eb.y += eb.vy;
            // Check collision with player
            const dist = Math.hypot(eb.x - this.player.x, eb.y - this.player.y);
            if (dist < eb.radius + this.player.radius) {
                this.player.hp -= 10;
                this.screenShakeTime = 10;
                this.sound.playExplosion(false);
                this.createExplosion(this.player.x, this.player.y, '#ff0055', 10);
                eb.dead = true;
                if (this.player.hp <= 0) this.triggerGameOver();
            }
        });
        this.enemyBullets = this.enemyBullets.filter(eb => !eb.dead && eb.y < this.canvas.height + 20);

        // Wave & Enemy Spawning logic
        const speedFactor = this.freezeTimer > 0 ? 0.3 : 1;
        this.enemySpawnTimer++;
        if (this.waveEnemyCount < this.waveMaxEnemies && this.enemySpawnTimer > Math.max(30, 80 - this.wave * 4)) {
            this.enemySpawnTimer = 0;
            this.spawnEnemy();
        }

        // Boss wave
        if (this.wave % 5 === 0 && !this.enemies.some(e => e.type === 'boss') && this.waveEnemyCount >= this.waveMaxEnemies) {
            this.spawnBoss();
        }

        // Check wave completion
        if (this.waveEnemyCount >= this.waveMaxEnemies && this.enemies.length === 0) {
            this.wave++;
            this.waveEnemyCount = 0;
            this.waveMaxEnemies = 12 + this.wave * 4;
            // Give wave bonus ultimate charge
            this.player.ultimate = Math.min(100, this.player.ultimate + 25);
        }

        // Update Enemies
        this.enemies.forEach(enemy => {
            if (enemy.type === 'boss') {
                if (enemy.y < enemy.targetY) enemy.y += 1;
                enemy.x += Math.sin(Date.now() * 0.002) * 3 * speedFactor;
                // Boss shooting pattern
                enemy.shootTimer++;
                if (enemy.shootTimer % 45 === 0) {
                    for (let a = -0.4; a <= 0.4; a += 0.2) {
                        this.enemyBullets.push({
                            x: enemy.x, y: enemy.y + 40,
                            vx: Math.sin(a) * 5, vy: Math.cos(a) * 5,
                            radius: 5, color: '#9d00ff'
                        });
                    }
                }
            } else {
                enemy.y += enemy.speed * speedFactor;
                if (enemy.type === 'scout') {
                    enemy.x += Math.sin(enemy.y * 0.05) * 2;
                } else if (enemy.type === 'interceptor') {
                    enemy.shootTimer++;
                    if (enemy.shootTimer % 90 === 0) {
                        this.enemyBullets.push({
                            x: enemy.x, y: enemy.y + 15,
                            vx: 0, vy: 6,
                            radius: 4, color: '#ff0055'
                        });
                    }
                }
            }

            // Bullet vs Enemy Collision
            this.bullets.forEach(b => {
                const dist = Math.hypot(b.x - enemy.x, b.y - enemy.y);
                if (dist < b.radius + enemy.radius) {
                    b.dead = true;
                    enemy.hp--;
                    this.createExplosion(b.x, b.y, enemy.color, 4);

                    if (enemy.hp <= 0) {
                        enemy.dead = true;
                        this.sound.playExplosion(enemy.type === 'boss' || enemy.type === 'heavy');
                        this.createExplosion(enemy.x, enemy.y, enemy.color, enemy.type === 'boss' ? 50 : 20);
                        this.score += enemy.type === 'boss' ? 500 : (enemy.type === 'heavy' ? 50 : 15);
                        this.kills++;
                        this.player.ultimate = Math.min(100, this.player.ultimate + (enemy.type === 'boss' ? 40 : 5));
                        this.spawnPowerup(enemy.x, enemy.y);
                    }
                }
            });

            // Player vs Enemy Collision
            const playerDist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
            if (playerDist < enemy.radius + this.player.radius) {
                this.player.hp -= 20;
                enemy.dead = true;
                this.screenShakeTime = 15;
                this.sound.playExplosion(true);
                this.createExplosion(enemy.x, enemy.y, '#ff0055', 20);
                if (this.player.hp <= 0) this.triggerGameOver();
            }
        });

        // Filter dead bullets and enemies
        this.bullets = this.bullets.filter(b => !b.dead);
        this.enemies = this.enemies.filter(e => !e.dead && e.y < this.canvas.height + 50);

        // Powerup movement and pickup
        this.powerups.forEach(p => {
            p.y += p.vy;
            const dist = Math.hypot(p.x - this.player.x, p.y - this.player.y);
            if (dist < p.radius + this.player.radius) {
                p.dead = true;
                this.sound.playPowerup();
                if (p.type === 'shield') {
                    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 35);
                } else if (p.type === 'freeze') {
                    this.freezeTimer = 300; // 5 seconds freeze
                } else {
                    this.player.weaponType = p.type;
                    this.player.weaponTimer = 450; // 7.5 seconds powerup
                }
            }
        });
        this.powerups = this.powerups.filter(p => !p.dead && p.y < this.canvas.height + 30);

        // Particles decay
        this.particles.forEach(pt => {
            pt.x += pt.vx;
            pt.y += pt.vy;
            pt.alpha -= pt.decay;
        });
        this.particles = this.particles.filter(pt => pt.alpha > 0);

        this.updateHUD();
    }

    render() {
        this.ctx.save();

        // Screen Shake
        if (this.screenShakeTime > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShakeTime * 0.8;
            const shakeY = (Math.random() - 0.5) * this.screenShakeTime * 0.8;
            this.ctx.translate(shakeX, shakeY);
        }

        // Clear Canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Background Stars
        this.stars.forEach(star => {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });

        if (this.state === 'PLAYING' || this.state === 'PAUSED') {
            // Draw Particles
            this.particles.forEach(pt => {
                this.ctx.save();
                this.ctx.globalAlpha = pt.alpha;
                this.ctx.fillStyle = pt.color;
                this.ctx.shadowBlur = 8;
                this.ctx.shadowColor = pt.color;
                this.ctx.beginPath();
                this.ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            });

            // Draw Powerups
            this.powerups.forEach(p => {
                this.ctx.save();
                this.ctx.shadowBlur = 12;
                let pColor = '#00f3ff';
                let icon = '⚡';
                if (p.type === 'laser') { pColor = '#ffe600'; icon = '💥'; }
                if (p.type === 'shield') { pColor = '#00ff66'; icon = '🛡️'; }
                if (p.type === 'freeze') { pColor = '#9d00ff'; icon = '❄️'; }

                this.ctx.shadowColor = pColor;
                this.ctx.strokeStyle = pColor;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ctx.stroke();

                this.ctx.font = '12px Orbitron';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(icon, p.x, p.y);
                this.ctx.restore();
            });

            // Draw Player Ship
            if (this.player) {
                this.ctx.save();
                this.ctx.translate(this.player.x, this.player.y);

                // Engine Glow Thruster
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = '#00f3ff';
                this.ctx.fillStyle = '#00f3ff';
                this.ctx.beginPath();
                this.ctx.moveTo(-8, 15);
                this.ctx.lineTo(0, 25 + Math.random() * 8);
                this.ctx.lineTo(8, 15);
                this.ctx.fill();

                // Ship Body Polygon
                this.ctx.strokeStyle = '#00f3ff';
                this.ctx.lineWidth = 3;
                this.ctx.fillStyle = '#0b1329';
                this.ctx.beginPath();
                this.ctx.moveTo(0, -22);
                this.ctx.lineTo(18, 15);
                this.ctx.lineTo(8, 10);
                this.ctx.lineTo(-8, 10);
                this.ctx.lineTo(-18, 15);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();

                // Shield Aura if active or high health
                if (this.player.hp > 50) {
                    this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
                    this.ctx.lineWidth = 1.5;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 26, 0, Math.PI * 2);
                    this.ctx.stroke();
                }

                this.ctx.restore();
            }

            // Draw Bullets
            this.bullets.forEach(b => {
                this.ctx.save();
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = b.color;
                this.ctx.fillStyle = b.color;
                this.ctx.beginPath();
                this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            });

            // Draw Enemy Bullets
            this.enemyBullets.forEach(eb => {
                this.ctx.save();
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = eb.color;
                this.ctx.fillStyle = eb.color;
                this.ctx.beginPath();
                this.ctx.arc(eb.x, eb.y, eb.radius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            });

            // Draw Enemies
            this.enemies.forEach(enemy => {
                this.ctx.save();
                this.ctx.translate(enemy.x, enemy.y);
                this.ctx.shadowBlur = 12;
                this.ctx.shadowColor = enemy.color;
                this.ctx.strokeStyle = enemy.color;
                this.ctx.lineWidth = 2.5;
                this.ctx.fillStyle = '#0f0918';

                if (enemy.type === 'boss') {
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, 45);
                    this.ctx.lineTo(45, 10);
                    this.ctx.lineTo(30, -35);
                    this.ctx.lineTo(-30, -35);
                    this.ctx.lineTo(-45, 10);
                    this.ctx.closePath();
                    this.ctx.fill();
                    this.ctx.stroke();

                    // Boss Health Bar above head
                    this.ctx.fillStyle = 'rgba(255, 0, 85, 0.8)';
                    const hpW = (enemy.hp / enemy.maxHp) * 80;
                    this.ctx.fillRect(-40, -50, hpW, 6);
                } else if (enemy.type === 'heavy') {
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.stroke();
                } else {
                    // Triangle Ship
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, 18);
                    this.ctx.lineTo(-16, -16);
                    this.ctx.lineTo(16, -16);
                    this.ctx.closePath();
                    this.ctx.fill();
                    this.ctx.stroke();
                }

                this.ctx.restore();
            });
        }

        this.ctx.restore();
    }

    loop(timestamp) {
        this.update();
        this.render();
        requestAnimationFrame((t) => this.loop(t));
    }
}

// Initialize on Load
window.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new Game();
});
