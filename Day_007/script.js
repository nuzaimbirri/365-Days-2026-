/* ==========================================================================
   DAY 007 - CYBER CORE: GRID DEFENSE (GAME ENGINE)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- Canvas & Core Setup ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Fixed logical resolution for tile calculations
    const TILE_SIZE = 40;
    const GRID_COLS = 24; // 24 * 40 = 960
    const GRID_ROWS = 15; // 15 * 40 = 600

    canvas.width = 960;
    canvas.height = 600;

    // --- Web Audio API Sound Generator ---
    class SoundEngine {
        constructor() {
            this.ctx = null;
            this.muted = false;
        }

        init() {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                this.ctx = new AudioCtx();
            }
        }

        playSynthSound(type) {
            if (this.muted || !this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                switch (type) {
                    case 'pulse':
                        osc.type = 'sawtooth';
                        osc.frequency.setValueAtTime(800, now);
                        osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
                        gain.gain.setValueAtTime(0.15, now);
                        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
                        osc.start(now);
                        osc.stop(now + 0.1);
                        break;
                    case 'plasma':
                        osc.type = 'square';
                        osc.frequency.setValueAtTime(150, now);
                        osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
                        gain.gain.setValueAtTime(0.25, now);
                        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
                        osc.start(now);
                        osc.stop(now + 0.25);
                        break;
                    case 'cryo':
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(1200, now);
                        osc.frequency.linearRampToValueAtTime(600, now + 0.08);
                        gain.gain.setValueAtTime(0.08, now);
                        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
                        osc.start(now);
                        osc.stop(now + 0.08);
                        break;
                    case 'tesla':
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(300 + Math.random() * 600, now);
                        gain.gain.setValueAtTime(0.12, now);
                        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
                        osc.start(now);
                        osc.stop(now + 0.12);
                        break;
                    case 'railgun':
                        osc.type = 'sawtooth';
                        osc.frequency.setValueAtTime(1800, now);
                        osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);
                        gain.gain.setValueAtTime(0.3, now);
                        gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
                        osc.start(now);
                        osc.stop(now + 0.35);
                        break;
                    case 'kill':
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(400, now);
                        osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
                        gain.gain.setValueAtTime(0.1, now);
                        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
                        osc.start(now);
                        osc.stop(now + 0.08);
                        break;
                    case 'wave':
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(523.25, now); // C5
                        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
                        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
                        gain.gain.setValueAtTime(0.2, now);
                        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
                        osc.start(now);
                        osc.stop(now + 0.4);
                        break;
                    case 'core_damage':
                        osc.type = 'sawtooth';
                        osc.frequency.setValueAtTime(120, now);
                        osc.frequency.linearRampToValueAtTime(60, now + 0.2);
                        gain.gain.setValueAtTime(0.3, now);
                        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
                        osc.start(now);
                        osc.stop(now + 0.2);
                        break;
                    case 'orbital':
                        osc.type = 'sawtooth';
                        osc.frequency.setValueAtTime(900, now);
                        osc.frequency.exponentialRampToValueAtTime(30, now + 0.6);
                        gain.gain.setValueAtTime(0.4, now);
                        gain.gain.linearRampToValueAtTime(0.01, now + 0.6);
                        osc.start(now);
                        osc.stop(now + 0.6);
                        break;
                    case 'emp':
                        osc.type = 'square';
                        osc.frequency.setValueAtTime(600, now);
                        osc.frequency.linearRampToValueAtTime(100, now + 0.3);
                        gain.gain.setValueAtTime(0.25, now);
                        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
                        osc.start(now);
                        osc.stop(now + 0.3);
                        break;
                    case 'click':
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(700, now);
                        gain.gain.setValueAtTime(0.08, now);
                        gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
                        osc.start(now);
                        osc.stop(now + 0.05);
                        break;
                }
            } catch (e) {
                console.warn('Audio play error:', e);
            }
        }
    }

    const sound = new SoundEngine();

    // --- Game Configuration & Definitions ---
    const TOWER_TYPES = {
        pulse: {
            name: 'Pulse Laser',
            cost: 100,
            range: 130,
            damage: 16,
            fireRate: 2.2, // shots per sec
            color: '#00f3ff',
            previewClass: 'pulse-preview'
        },
        plasma: {
            name: 'Plasma Bomb',
            cost: 175,
            range: 110,
            damage: 45,
            fireRate: 0.85,
            splashRadius: 55,
            color: '#ff0055',
            previewClass: 'plasma-preview'
        },
        cryo: {
            name: 'Cryo Beam',
            cost: 150,
            range: 105,
            damage: 4,
            fireRate: 4.5,
            slowRatio: 0.5,
            slowDuration: 2,
            color: '#00ff88',
            previewClass: 'cryo-preview'
        },
        tesla: {
            name: 'Tesla Coil',
            cost: 225,
            range: 125,
            damage: 28,
            fireRate: 1.2,
            chainCount: 4,
            color: '#ffea00',
            previewClass: 'tesla-preview'
        },
        railgun: {
            name: 'Railgun Sniper',
            cost: 300,
            range: 220,
            damage: 130,
            fireRate: 0.5,
            pierce: true,
            color: '#9d00ff',
            previewClass: 'railgun-preview'
        }
    };

    // Grid Paths Definitions (Tile Coordinates)
    const PATH_1 = [
        {x: 0, y: 3}, {x: 6, y: 3}, {x: 6, y: 10}, {x: 14, y: 10}, 
        {x: 14, y: 5}, {x: 21, y: 5}, {x: 21, y: 7}, {x: 23, y: 7}
    ];

    const PATH_2 = [
        {x: 0, y: 11}, {x: 10, y: 11}, {x: 10, y: 4}, {x: 18, y: 4}, 
        {x: 18, y: 12}, {x: 21, y: 12}, {x: 21, y: 7}, {x: 23, y: 7}
    ];

    const CORE_TILE = {x: 23, y: 7};

    // Convert Tile Paths to Pixel Waypoints (Center of tiles)
    function tilePathToWaypoints(pathTiles) {
        return pathTiles.map(tile => ({
            x: tile.x * TILE_SIZE + TILE_SIZE / 2,
            y: tile.y * TILE_SIZE + TILE_SIZE / 2
        }));
    }

    const WAYPOINTS_PATH_1 = tilePathToWaypoints(PATH_1);
    const WAYPOINTS_PATH_2 = tilePathToWaypoints(PATH_2);

    // Build Path Lookup Table for fast grid placement validation
    const pathTilesSet = new Set();
    [PATH_1, PATH_2].forEach(path => {
        for (let i = 0; i < path.length - 1; i++) {
            const p1 = path[i];
            const p2 = path[i + 1];
            const minX = Math.min(p1.x, p2.x);
            const maxX = Math.max(p1.x, p2.x);
            const minY = Math.min(p1.y, p2.y);
            const maxY = Math.max(p1.y, p2.y);

            for (let x = minX; x <= maxX; x++) {
                for (let y = minY; y <= maxY; y++) {
                    pathTilesSet.add(`${x},${y}`);
                }
            }
        }
    });

    // --- State Variables ---
    let gameState = {
        running: false,
        paused: false,
        speedMultiplier: 1,
        coreHp: 100,
        maxCoreHp: 100,
        energy: 350,
        wave: 0,
        maxWaves: 25,
        score: 0,
        totalKills: 0,
        towersBuilt: 0,
        totalCreditsEarned: 350,
        selectedTowerType: 'pulse',
        activeSkill: null, // 'orbital' or 'emp'
        inspectingTower: null
    };

    let towers = [];
    let enemies = [];
    let projectiles = [];
    let particles = [];
    let textFloaters = [];
    
    let waveInProgress = false;
    let waveQueue = [];
    let spawnTimer = 0;

    let hoverTile = {x: -1, y: -1};

    // --- DOM Elements ---
    const coreHpValEl = document.getElementById('core-hp-val');
    const coreHpBarEl = document.getElementById('core-hp-bar');
    const energyValEl = document.getElementById('energy-val');
    const waveValEl = document.getElementById('wave-val');
    const scoreValEl = document.getElementById('score-val');
    const statKillsEl = document.getElementById('stat-kills-total');
    const statTowersEl = document.getElementById('stat-towers-built');
    const statCreditsEl = document.getElementById('stat-total-credits');
    const btnStartWave = document.getElementById('btn-start-wave');
    const waveCounterBtn = document.getElementById('wave-counter-btn');
    const nextWaveDetailsEl = document.getElementById('next-wave-details');

    const btnSound = document.getElementById('btn-sound');
    const btnPause = document.getElementById('btn-pause');
    const btnSpeed = document.getElementById('btn-speed');

    const modalStart = document.getElementById('modal-start');
    const modalGameOver = document.getElementById('modal-gameover');
    const btnGameStart = document.getElementById('btn-game-start');
    const btnRestart = document.getElementById('btn-restart');

    const skillOrbitalBtn = document.getElementById('skill-orbital');
    const skillEmpBtn = document.getElementById('skill-emp');

    const towerInspector = document.getElementById('tower-inspector');
    const inspectNameEl = document.getElementById('inspect-name');
    const inspectDamageEl = document.getElementById('inspect-damage');
    const inspectRangeEl = document.getElementById('inspect-range');
    const inspectFirerateEl = document.getElementById('inspect-firerate');
    const inspectKillsEl = document.getElementById('inspect-kills');
    const inspectUpgradeCostEl = document.getElementById('inspect-upgrade-cost');
    const inspectSellRefundEl = document.getElementById('inspect-sell-refund');
    const btnUpgradeTower = document.getElementById('btn-upgrade-tower');
    const btnSellTower = document.getElementById('btn-sell-tower');
    const inspectCloseBtn = document.getElementById('inspect-close');

    // --- Classes ---

    // Enemy Class
    class Enemy {
        constructor(type, waypoints) {
            this.type = type;
            this.waypoints = waypoints;
            this.waypointIndex = 0;

            this.x = waypoints[0].x;
            this.y = waypoints[0].y;

            // Stats according to type
            switch (type) {
                case 'runner':
                    this.maxHp = 50 + gameState.wave * 12;
                    this.speed = 3.2;
                    this.bounty = 20;
                    this.color = '#ffea00';
                    this.radius = 9;
                    this.shield = 0;
                    break;
                case 'tank':
                    this.maxHp = 240 + gameState.wave * 70;
                    this.speed = 1.1;
                    this.bounty = 35;
                    this.color = '#ff0055';
                    this.radius = 16;
                    this.shield = 0;
                    break;
                case 'shielded':
                    this.maxHp = 130 + gameState.wave * 35;
                    this.maxShield = 130 + gameState.wave * 35;
                    this.shield = this.maxShield;
                    this.speed = 1.7;
                    this.bounty = 45;
                    this.color = '#9d00ff';
                    this.radius = 13;
                    break;
                case 'boss':
                    this.maxHp = 1200 + gameState.wave * 300;
                    this.speed = 0.95;
                    this.bounty = 200;
                    this.color = '#ff6600';
                    this.radius = 22;
                    this.shield = 0;
                    break;
                case 'drone':
                default:
                    this.maxHp = 65 + gameState.wave * 18;
                    this.speed = 2.1;
                    this.bounty = 15;
                    this.color = '#00f3ff';
                    this.radius = 11;
                    this.shield = 0;
                    break;
            }

            this.hp = this.maxHp;
            this.slowTimer = 0;
            this.slowFactor = 1;
            this.stunTimer = 0;

            this.rotation = 0;
        }

        update(dt) {
            if (this.stunTimer > 0) {
                this.stunTimer -= dt;
                return true;
            }

            if (this.slowTimer > 0) {
                this.slowTimer -= dt;
            } else {
                this.slowFactor = 1;
            }

            const currentSpeed = this.speed * this.slowFactor * gameState.speedMultiplier;
            const target = this.waypoints[this.waypointIndex + 1];

            if (!target) {
                // Reached the Core!
                dealCoreDamage(this.type === 'boss' ? 25 : 10);
                return false; // destroy enemy
            }

            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.hypot(dx, dy);

            this.rotation = Math.atan2(dy, dx);

            if (dist < currentSpeed) {
                this.x = target.x;
                this.y = target.y;
                this.waypointIndex++;
            } else {
                this.x += (dx / dist) * currentSpeed;
                this.y += (dy / dist) * currentSpeed;
            }

            return true;
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);

            // Stun effect aura
            if (this.stunTimer > 0) {
                ctx.beginPath();
                ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
                ctx.strokeStyle = '#ffea00';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.stroke();
            }

            // Draw Enemy Body
            ctx.beginPath();
            if (this.type === 'tank' || this.type === 'boss') {
                ctx.rect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
            } else if (this.type === 'runner') {
                ctx.moveTo(this.radius + 4, 0);
                ctx.lineTo(-this.radius, -this.radius + 3);
                ctx.lineTo(-this.radius, this.radius - 3);
                ctx.closePath();
            } else {
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            }

            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Shield visual outer ring
            if (this.shield > 0) {
                ctx.beginPath();
                ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2);
                ctx.strokeStyle = '#00f3ff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            ctx.restore();

            // Health bar above enemy
            const barW = this.radius * 2.2;
            const barH = 4;
            const barX = this.x - barW / 2;
            const barY = this.y - this.radius - 10;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(barX, barY, barW, barH);

            const hpPct = Math.max(0, this.hp / this.maxHp);
            ctx.fillStyle = hpPct > 0.5 ? '#00ff88' : (hpPct > 0.2 ? '#ffea00' : '#ff0055');
            ctx.fillRect(barX, barY, barW * hpPct, barH);

            // Shield Bar if present
            if (this.maxShield > 0 && this.shield > 0) {
                const shieldPct = Math.max(0, this.shield / this.maxShield);
                ctx.fillStyle = '#9d00ff';
                ctx.fillRect(barX, barY - 3, barW * shieldPct, 2);
            }
        }

        takeDamage(amount, type) {
            let actualDamage = amount;

            // Handle Shield mitigation
            if (this.shield > 0) {
                if (type === 'railgun') {
                    // Railgun pierces shield direct to HP
                } else {
                    if (this.shield >= actualDamage) {
                        this.shield -= actualDamage;
                        actualDamage = 0;
                    } else {
                        actualDamage -= this.shield;
                        this.shield = 0;
                    }
                }
            }

            this.hp -= actualDamage;

            // Spawn damage particle floater
            addFloater(`-${Math.round(amount)}`, this.x, this.y - 12, '#ffea00');

            if (this.hp <= 0) {
                return true; // killed
            }
            return false;
        }

        applySlow(ratio, duration) {
            this.slowRatio = ratio;
            this.slowFactor = 1 - ratio;
            this.slowTimer = duration;
        }

        applyStun(duration) {
            this.stunTimer = duration;
        }
    }

    // Tower Class
    class Tower {
        constructor(type, tileX, tileY) {
            this.type = type;
            this.tileX = tileX;
            this.tileY = tileY;

            this.x = tileX * TILE_SIZE + TILE_SIZE / 2;
            this.y = tileY * TILE_SIZE + TILE_SIZE / 2;

            const spec = TOWER_TYPES[type];
            this.name = spec.name;
            this.baseCost = spec.cost;
            this.level = 1;

            this.range = spec.range;
            this.damage = spec.damage;
            this.fireRate = spec.fireRate;
            this.color = spec.color;

            this.cooldown = 0;
            this.kills = 0;
            this.rotation = 0;
            this.target = null;
        }

        getUpgradeCost() {
            return Math.round(this.baseCost * 0.8 * this.level);
        }

        getSellRefund() {
            return Math.round(this.baseCost * 0.6 * this.level);
        }

        upgrade() {
            const cost = this.getUpgradeCost();
            if (gameState.energy >= cost) {
                gameState.energy -= cost;
                this.level++;
                this.damage = Math.round(this.damage * 1.35);
                this.range = Math.round(this.range * 1.1);
                this.fireRate = Number((this.fireRate * 1.15).toFixed(2));
                sound.playSynthSound('upgrade');
                addFloater(`UPGRADE! Lvl ${this.level}`, this.x, this.y - 20, '#00ff88');
                updateUI();
                return true;
            }
            return false;
        }

        update(dt) {
            this.cooldown -= dt * gameState.speedMultiplier;

            // Find target (first enemy in range along path)
            this.target = this.findTarget();

            if (this.target) {
                const dx = this.target.x - this.x;
                const dy = this.target.y - this.y;
                this.rotation = Math.atan2(dy, dx);

                if (this.cooldown <= 0) {
                    this.shoot();
                    this.cooldown = 1 / this.fireRate;
                }
            }
        }

        findTarget() {
            let bestEnemy = null;
            let maxProgress = -1;

            for (const enemy of enemies) {
                const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (dist <= this.range) {
                    const progress = enemy.waypointIndex * 1000 + dist;
                    if (progress > maxProgress) {
                        maxProgress = progress;
                        bestEnemy = enemy;
                    }
                }
            }
            return bestEnemy;
        }

        shoot() {
            sound.playSynthSound(this.type);

            if (this.type === 'pulse') {
                projectiles.push(new Projectile(this, this.target, 'pulse'));
            } else if (this.type === 'plasma') {
                projectiles.push(new Projectile(this, this.target, 'plasma'));
            } else if (this.type === 'cryo') {
                // Instant freeze beam spray
                this.target.takeDamage(this.damage, 'cryo');
                this.target.applySlow(TOWER_TYPES.cryo.slowRatio, TOWER_TYPES.cryo.slowDuration);
                addBeamParticle(this.x, this.y, this.target.x, this.target.y, '#00ff88');
            } else if (this.type === 'tesla') {
                // Zap chain lightning to multiple targets
                let hitTargets = [this.target];
                this.target.takeDamage(this.damage, 'tesla');

                // Chain to near enemies
                let lastTarget = this.target;
                for (let i = 1; i < TOWER_TYPES.tesla.chainCount; i++) {
                    let nextTarget = enemies.find(e => !hitTargets.includes(e) && Math.hypot(e.x - lastTarget.x, e.y - lastTarget.y) < 100);
                    if (nextTarget) {
                        hitTargets.push(nextTarget);
                        nextTarget.takeDamage(this.damage * 0.75, 'tesla');
                        addLightningParticle(lastTarget.x, lastTarget.y, nextTarget.x, nextTarget.y, '#ffea00');
                        lastTarget = nextTarget;
                    } else {
                        break;
                    }
                }
                addLightningParticle(this.x, this.y, this.target.x, this.target.y, '#ffea00');
            } else if (this.type === 'railgun') {
                // Instant heavy rail beam piercing
                this.target.takeDamage(this.damage, 'railgun');
                addRailgunParticle(this.x, this.y, this.target.x, this.target.y, '#9d00ff');
            }
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);

            // Base platform
            ctx.fillStyle = '#14182f';
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Rotating Turret Top
            ctx.rotate(this.rotation);
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;

            if (this.type === 'railgun') {
                ctx.fillRect(0, -3, 22, 6);
            } else if (this.type === 'plasma') {
                ctx.fillRect(0, -6, 16, 12);
            } else {
                ctx.fillRect(0, -4, 18, 8);
            }

            // Level Badge indicator
            ctx.rotate(-this.rotation);
            ctx.fillStyle = '#ffffff';
            ctx.font = '700 9px Orbitron';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.level, 0, 0);

            ctx.restore();
        }
    }

    // Projectile Class
    class Projectile {
        constructor(sourceTower, targetEnemy, type) {
            this.source = sourceTower;
            this.target = targetEnemy;
            this.type = type;

            this.x = sourceTower.x;
            this.y = sourceTower.y;

            this.targetX = targetEnemy.x;
            this.targetY = targetEnemy.y;

            this.speed = type === 'plasma' ? 350 : 600;
            this.damage = sourceTower.damage;
            this.color = sourceTower.color;
        }

        update(dt) {
            if (this.target && enemies.includes(this.target)) {
                this.targetX = this.target.x;
                this.targetY = this.target.y;
            }

            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.hypot(dx, dy);

            const moveStep = this.speed * dt * gameState.speedMultiplier;

            if (dist <= moveStep) {
                this.hit();
                return false; // destroy projectile
            }

            this.x += (dx / dist) * moveStep;
            this.y += (dy / dist) * moveStep;
            return true;
        }

        hit() {
            if (this.type === 'plasma') {
                // Splash AoE explosion
                createExplosion(this.x, this.y, TOWER_TYPES.plasma.splashRadius, this.color);
                enemies.forEach(e => {
                    if (Math.hypot(e.x - this.x, e.y - this.y) <= TOWER_TYPES.plasma.splashRadius) {
                        if (e.takeDamage(this.damage, 'plasma')) {
                            this.source.kills++;
                            onEnemyKilled(e);
                        }
                    }
                });
            } else {
                if (this.target && enemies.includes(this.target)) {
                    if (this.target.takeDamage(this.damage, this.type)) {
                        this.source.kills++;
                        onEnemyKilled(this.target);
                    }
                }
            }
        }

        draw() {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.type === 'plasma' ? 6 : 4, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.restore();
        }
    }

    // --- Particle System Helpers ---
    function createExplosion(x, y, radius, color) {
        sound.playSynthSound('plasma');
        for (let i = 0; i < 16; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * radius * 2;
            particles.push({
                x: x, y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: Math.random() * 4 + 2,
                color: color,
                alpha: 1,
                life: 0.4
            });
        }
    }

    function addBeamParticle(x1, y1, x2, y2, color) {
        particles.push({
            type: 'line',
            x1: x1, y1: y1, x2: x2, y2: y2,
            color: color,
            alpha: 1,
            life: 0.15
        });
    }

    function addLightningParticle(x1, y1, x2, y2, color) {
        particles.push({
            type: 'lightning',
            x1: x1, y1: y1, x2: x2, y2: y2,
            color: color,
            alpha: 1,
            life: 0.2
        });
    }

    function addRailgunParticle(x1, y1, x2, y2, color) {
        particles.push({
            type: 'rail',
            x1: x1, y1: y1, x2: x2, y2: y2,
            color: color,
            alpha: 1,
            life: 0.35
        });
    }

    function addFloater(text, x, y, color) {
        textFloaters.push({
            text: text,
            x: x,
            y: y,
            color: color,
            alpha: 1,
            life: 0.8
        });
    }

    // --- Wave Generator & Spawner ---
    function prepareWave(waveNumber) {
        const queue = [];
        let count = 6 + waveNumber * 3;

        // Wave composition formula
        for (let i = 0; i < count; i++) {
            let path = Math.random() > 0.5 ? WAYPOINTS_PATH_1 : WAYPOINTS_PATH_2;
            let type = 'drone';

            const rand = Math.random();
            if (waveNumber >= 3 && rand < 0.3) type = 'runner';
            if (waveNumber >= 5 && rand > 0.6) type = 'tank';
            if (waveNumber >= 8 && rand > 0.8) type = 'shielded';

            queue.push({ type, path });
        }

        // Add Bosses on wave 10, 20, 25
        if (waveNumber % 5 === 0 || waveNumber === 25) {
            queue.push({ type: 'boss', path: WAYPOINTS_PATH_1 });
            if (waveNumber >= 15) {
                queue.push({ type: 'boss', path: WAYPOINTS_PATH_2 });
            }
        }

        return queue;
    }

    function startNextWave() {
        if (waveInProgress || gameState.wave >= gameState.maxWaves) return;

        gameState.wave++;
        waveInProgress = true;
        waveQueue = prepareWave(gameState.wave);
        spawnTimer = 0;

        sound.playSynthSound('wave');
        updateUI();
    }

    function onEnemyKilled(enemy) {
        sound.playSynthSound('kill');
        gameState.score += enemy.bounty * 10;
        gameState.energy += enemy.bounty;
        gameState.totalKills++;
        gameState.totalCreditsEarned += enemy.bounty;

        addFloater(`+⚡${enemy.bounty}`, enemy.x, enemy.y, '#ffea00');

        // Check if wave finished
        enemies = enemies.filter(e => e.hp > 0);
        updateUI();
    }

    function dealCoreDamage(amount) {
        sound.playSynthSound('core_damage');
        gameState.coreHp -= amount;
        addFloater(`-${amount} CORE HP!`, CORE_TILE.x * TILE_SIZE, CORE_TILE.y * TILE_SIZE - 20, '#ff0055');

        if (gameState.coreHp <= 0) {
            gameState.coreHp = 0;
            triggerGameOver(false);
        }
        updateUI();
    }

    function triggerGameOver(isVictory) {
        gameState.running = false;
        const titleEl = document.getElementById('end-status-title');
        const msgEl = document.getElementById('end-status-msg');

        if (isVictory) {
            titleEl.textContent = 'VICTORY ACHIEVED!';
            titleEl.style.color = 'var(--neon-green)';
            msgEl.textContent = 'Cyber Core berhasil bertahan penuh dari seluruh gelombang virus!';
        } else {
            titleEl.textContent = 'SYSTEM COMPROMISED';
            titleEl.style.color = 'var(--neon-pink)';
            msgEl.textContent = 'Core pertahanan telah hancur oleh serangan virus malware.';
        }

        document.getElementById('end-score').textContent = gameState.score;
        document.getElementById('end-waves').textContent = `${gameState.wave} / ${gameState.maxWaves}`;
        document.getElementById('end-kills').textContent = gameState.totalKills;

        modalGameOver.classList.remove('hidden');
    }

    // --- UI Update & Synchronization ---
    function updateUI() {
        coreHpValEl.textContent = `${gameState.coreHp} / ${gameState.maxCoreHp}`;
        coreHpBarEl.style.width = `${(gameState.coreHp / gameState.maxCoreHp) * 100}%`;

        energyValEl.textContent = gameState.energy;
        waveValEl.textContent = `${gameState.wave} / ${gameState.maxWaves}`;
        scoreValEl.textContent = gameState.score;

        statKillsEl.textContent = gameState.totalKills;
        statTowersEl.textContent = gameState.towersBuilt;
        statCreditsEl.textContent = gameState.totalCreditsEarned;

        waveCounterBtn.textContent = gameState.wave + 1;
        if (waveInProgress) {
            btnStartWave.disabled = true;
            btnStartWave.style.opacity = '0.5';
            nextWaveDetailsEl.textContent = `BERLANGSUNG (${enemies.length + waveQueue.length} sisa)`;
        } else {
            btnStartWave.disabled = false;
            btnStartWave.style.opacity = '1';
            nextWaveDetailsEl.textContent = gameState.wave < gameState.maxWaves ? `Gelombang ${gameState.wave + 1}` : 'SEMUA CLEAR!';
        }

        // Enable / Disable Tower Selector Cards according to Energy balance
        document.querySelectorAll('.tower-card').forEach(card => {
            const type = card.getAttribute('data-type');
            const cost = TOWER_TYPES[type].cost;
            if (gameState.energy < cost) {
                card.classList.add('disabled');
            } else {
                card.classList.remove('disabled');
            }
        });

        // Tactical Skills availability
        skillOrbitalBtn.disabled = gameState.energy < 200 || !waveInProgress;
        skillEmpBtn.disabled = gameState.energy < 150 || !waveInProgress;

        // Inspector updates if active
        if (gameState.inspectingTower) {
            const t = gameState.inspectingTower;
            inspectNameEl.textContent = `${t.name.toUpperCase()} (LVL ${t.level})`;
            inspectDamageEl.textContent = t.damage;
            inspectRangeEl.textContent = t.range;
            inspectFirerateEl.textContent = `${t.fireRate}/s`;
            inspectKillsEl.textContent = t.kills;

            inspectUpgradeCostEl.textContent = `⚡ ${t.getUpgradeCost()}`;
            inspectSellRefundEl.textContent = `⚡ ${t.getSellRefund()}`;

            btnUpgradeTower.disabled = gameState.energy < t.getUpgradeCost();
        }
    }

    // --- Interactive Map & Input Controls ---

    // Tower Construction & Inspection Click Handler
    canvas.addEventListener('click', (e) => {
        sound.init(); // Initialize audio context on first click

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        const tileX = Math.floor(mouseX / TILE_SIZE);
        const tileY = Math.floor(mouseY / TILE_SIZE);

        if (tileX < 0 || tileX >= GRID_COLS || tileY < 0 || tileY >= GRID_ROWS) return;

        // Check if Orbital Skill targeted
        if (gameState.activeSkill === 'orbital') {
            triggerOrbitalStrike(mouseX, mouseY);
            gameState.activeSkill = null;
            canvas.style.cursor = 'crosshair';
            return;
        }

        // Check if existing tower clicked
        const existingTower = towers.find(t => t.tileX === tileX && t.tileY === tileY);
        if (existingTower) {
            openInspector(existingTower, e.clientX, e.clientY);
            return;
        } else {
            closeInspector();
        }

        // Build new tower if valid grid tile
        const isPath = pathTilesSet.has(`${tileX},${tileY}`);
        const isCore = tileX === CORE_TILE.x && tileY === CORE_TILE.y;

        if (!isPath && !isCore) {
            const spec = TOWER_TYPES[gameState.selectedTowerType];
            if (gameState.energy >= spec.cost) {
                gameState.energy -= spec.cost;
                const newTower = new Tower(gameState.selectedTowerType, tileX, tileY);
                towers.push(newTower);
                gameState.towersBuilt++;

                sound.playSynthSound('click');
                addFloater(`-${spec.cost}⚡`, mouseX, mouseY - 15, '#00f3ff');
                updateUI();
            } else {
                addFloater(`KREDIT TIDAK CUKUP!`, mouseX, mouseY - 15, '#ff0055');
            }
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        hoverTile.x = Math.floor(mouseX / TILE_SIZE);
        hoverTile.y = Math.floor(mouseY / TILE_SIZE);
    });

    canvas.addEventListener('mouseleave', () => {
        hoverTile.x = -1;
        hoverTile.y = -1;
    });

    // Inspector Popup Handlers
    function openInspector(tower, clientX, clientY) {
        gameState.inspectingTower = tower;
        towerInspector.style.left = `${Math.min(window.innerWidth - 240, clientX + 15)}px`;
        towerInspector.style.top = `${Math.min(window.innerHeight - 180, clientY + 15)}px`;
        towerInspector.classList.remove('hidden');
        updateUI();
    }

    function closeInspector() {
        gameState.inspectingTower = null;
        towerInspector.classList.add('hidden');
    }

    inspectCloseBtn.addEventListener('click', closeInspector);

    btnUpgradeTower.addEventListener('click', () => {
        if (gameState.inspectingTower) {
            gameState.inspectingTower.upgrade();
        }
    });

    btnSellTower.addEventListener('click', () => {
        if (gameState.inspectingTower) {
            const t = gameState.inspectingTower;
            const refund = t.getSellRefund();
            gameState.energy += refund;
            sound.playSynthSound('click');
            addFloater(`+⚡${refund}`, t.x, t.y, '#ffea00');

            towers = towers.filter(tower => tower !== t);
            closeInspector();
            updateUI();
        }
    });

    // Tower Selection Handler
    document.querySelectorAll('.tower-card').forEach(card => {
        card.addEventListener('click', () => {
            sound.init();
            document.querySelectorAll('.tower-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            gameState.selectedTowerType = card.getAttribute('data-type');
            sound.playSynthSound('click');
        });
    });

    // Tactical Skills Handlers
    skillOrbitalBtn.addEventListener('click', () => {
        sound.init();
        if (gameState.energy >= 200) {
            gameState.activeSkill = 'orbital';
            canvas.style.cursor = 'target';
            addFloater(`KLIK GRID UNTUK ORBITAL LASER!`, canvas.width / 2, 80, '#ff0055');
        }
    });

    skillEmpBtn.addEventListener('click', () => {
        sound.init();
        if (gameState.energy >= 150) {
            gameState.energy -= 150;
            sound.playSynthSound('emp');
            enemies.forEach(e => e.applyStun(4.0)); // 4 seconds stun
            createExplosion(canvas.width / 2, canvas.height / 2, 400, '#00f3ff');
            addFloater(`EMP ACTIVATED! 4S STUN`, canvas.width / 2, 80, '#00f3ff');
            updateUI();
        }
    });

    function triggerOrbitalStrike(x, y) {
        gameState.energy -= 200;
        sound.playSynthSound('orbital');
        createExplosion(x, y, 120, '#ff0055');

        enemies.forEach(e => {
            if (Math.hypot(e.x - x, e.y - y) <= 120) {
                if (e.takeDamage(450, 'orbital')) {
                    onEnemyKilled(e);
                }
            }
        });
        updateUI();
    }

    // Top Header Buttons
    btnStartWave.addEventListener('click', () => {
        sound.init();
        startNextWave();
    });

    btnSound.addEventListener('click', () => {
        sound.muted = !sound.muted;
        btnSound.textContent = sound.muted ? '🔇' : '🔊';
    });

    btnPause.addEventListener('click', () => {
        gameState.paused = !gameState.paused;
        btnPause.textContent = gameState.paused ? '▶️' : '⏸️';
    });

    btnSpeed.addEventListener('click', () => {
        if (gameState.speedMultiplier === 1) gameState.speedMultiplier = 2;
        else if (gameState.speedMultiplier === 2) gameState.speedMultiplier = 3;
        else gameState.speedMultiplier = 1;
        btnSpeed.textContent = `${gameState.speedMultiplier}x`;
    });

    // Modals Restart & Start
    btnGameStart.addEventListener('click', () => {
        sound.init();
        modalStart.classList.add('hidden');
        resetGame();
    });

    btnRestart.addEventListener('click', () => {
        sound.init();
        modalGameOver.classList.add('hidden');
        resetGame();
    });

    function resetGame() {
        gameState = {
            running: true,
            paused: false,
            speedMultiplier: 1,
            coreHp: 100,
            maxCoreHp: 100,
            energy: 350,
            wave: 0,
            maxWaves: 25,
            score: 0,
            totalKills: 0,
            towersBuilt: 0,
            totalCreditsEarned: 350,
            selectedTowerType: 'pulse',
            activeSkill: null,
            inspectingTower: null
        };

        towers = [];
        enemies = [];
        projectiles = [];
        particles = [];
        textFloaters = [];
        waveInProgress = false;

        closeInspector();
        updateUI();
    }

    // --- Main Game Loop & Rendering ---
    let lastTime = performance.now();

    function gameLoop(now) {
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        if (gameState.running && !gameState.paused) {
            updateGame(dt);
        }

        renderGame();
        requestAnimationFrame(gameLoop);
    }

    function updateGame(dt) {
        // Handle Enemy Wave Spawning
        if (waveInProgress && waveQueue.length > 0) {
            spawnTimer -= dt * gameState.speedMultiplier;
            if (spawnTimer <= 0) {
                const nextEnemySpec = waveQueue.shift();
                enemies.push(new Enemy(nextEnemySpec.type, nextEnemySpec.path));
                spawnTimer = 1.0; // seconds between enemy spawns
            }
        } else if (waveInProgress && waveQueue.length === 0 && enemies.length === 0) {
            // Wave Completed!
            waveInProgress = false;
            const waveBonus = gameState.wave * 50;
            gameState.energy += waveBonus;
            gameState.totalCreditsEarned += waveBonus;
            sound.playSynthSound('wave');
            addFloater(`GELOMBANG CLEAR! +⚡${waveBonus}`, canvas.width / 2, canvas.height / 2, '#00ff88');

            if (gameState.wave >= gameState.maxWaves) {
                triggerGameOver(true);
            }
            updateUI();
        }

        // Update Towers
        towers.forEach(t => t.update(dt));

        // Update Enemies
        enemies = enemies.filter(e => e.update(dt));

        // Update Projectiles
        projectiles = projectiles.filter(p => p.update(dt));

        // Update Particles
        particles.forEach(p => {
            p.life -= dt * gameState.speedMultiplier;
            if (p.vx) p.x += p.vx * dt;
            if (p.vy) p.y += p.vy * dt;
        });
        particles = particles.filter(p => p.life > 0);

        // Update Text Floaters
        textFloaters.forEach(f => {
            f.y -= 25 * dt;
            f.life -= dt;
        });
        textFloaters = textFloaters.filter(f => f.life > 0);
    }

    // --- Render Rendering Functions ---
    function renderGame() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Draw Grid Canvas Background & Tiles
        drawGrid();

        // 2. Draw Paths & Arrow Guidance
        drawPaths();

        // 3. Draw Core Facility Base
        drawCoreBase();

        // 4. Draw Tile Hover Preview & Range Indicator
        drawHoverPreview();

        // 5. Draw Towers
        towers.forEach(t => t.draw());

        // 6. Draw Enemies
        enemies.forEach(e => e.draw());

        // 7. Draw Projectiles
        projectiles.forEach(p => p.draw());

        // 8. Draw Special Particle Effects
        particles.forEach(p => drawParticle(p));

        // 9. Draw Damage/Reward Text Floaters
        textFloaters.forEach(f => {
            ctx.save();
            ctx.font = '700 13px Orbitron';
            ctx.fillStyle = f.color;
            ctx.shadowColor = f.color;
            ctx.shadowBlur = 8;
            ctx.textAlign = 'center';
            ctx.fillText(f.text, f.x, f.y);
            ctx.restore();
        });
    }

    function drawGrid() {
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)';
        ctx.lineWidth = 1;

        for (let col = 0; col <= GRID_COLS; col++) {
            ctx.beginPath();
            ctx.moveTo(col * TILE_SIZE, 0);
            ctx.lineTo(col * TILE_SIZE, canvas.height);
            ctx.stroke();
        }

        for (let row = 0; row <= GRID_ROWS; row++) {
            ctx.beginPath();
            ctx.moveTo(0, row * TILE_SIZE);
            ctx.lineTo(canvas.width, row * TILE_SIZE);
            ctx.stroke();
        }
    }

    function drawPaths() {
        // Helper to render neon path corridor
        const renderPathLine = (pathPoints, color) => {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
            for (let i = 1; i < pathPoints.length; i++) {
                ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = TILE_SIZE * 0.7;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalAlpha = 0.15;
            ctx.stroke();

            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.8;
            ctx.setLineDash([8, 8]);
            ctx.stroke();
            ctx.restore();
        };

        renderPathLine(WAYPOINTS_PATH_1, '#00f3ff');
        renderPathLine(WAYPOINTS_PATH_2, '#ff0055');

        // Draw Spawner Gates
        [WAYPOINTS_PATH_1[0], WAYPOINTS_PATH_2[0]].forEach((spawner, idx) => {
            ctx.save();
            ctx.fillStyle = idx === 0 ? '#00f3ff' : '#ff0055';
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(spawner.x, spawner.y, 14, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = '800 10px Orbitron';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('SPAWN', spawner.x, spawner.y);
            ctx.restore();
        });
    }

    function drawCoreBase() {
        const x = CORE_TILE.x * TILE_SIZE + TILE_SIZE / 2;
        const y = CORE_TILE.y * TILE_SIZE + TILE_SIZE / 2;

        ctx.save();
        ctx.translate(x, y);

        // Core Shield Ring
        const pulseRadius = 24 + Math.sin(Date.now() / 200) * 3;
        ctx.beginPath();
        ctx.arc(0, 0, pulseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = '#00ff88';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 20;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Core Diamond Inner Structure
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(14, 0);
        ctx.lineTo(0, 14);
        ctx.lineTo(-14, 0);
        ctx.closePath();
        ctx.fillStyle = '#00ff88';
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '800 10px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('CORE', 0, 0);

        ctx.restore();
    }

    function drawHoverPreview() {
        if (hoverTile.x < 0 || hoverTile.y < 0) return;

        const x = hoverTile.x * TILE_SIZE;
        const y = hoverTile.y * TILE_SIZE;
        const centerX = x + TILE_SIZE / 2;
        const centerY = y + TILE_SIZE / 2;

        const isPath = pathTilesSet.has(`${hoverTile.x},${hoverTile.y}`);
        const isCore = hoverTile.x === CORE_TILE.x && hoverTile.y === CORE_TILE.y;
        const hasTower = towers.some(t => t.tileX === hoverTile.x && t.tileY === hoverTile.y);

        const canBuild = !isPath && !isCore && !hasTower;

        ctx.save();
        ctx.fillStyle = canBuild ? 'rgba(0, 243, 255, 0.25)' : 'rgba(255, 0, 85, 0.25)';
        ctx.strokeStyle = canBuild ? '#00f3ff' : '#ff0055';
        ctx.lineWidth = 2;

        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

        // Draw Range Radius Circle if buildable or hovering existing tower
        const spec = TOWER_TYPES[gameState.selectedTowerType];
        let rangeRadius = spec.range;

        if (hasTower) {
            const existingTower = towers.find(t => t.tileX === hoverTile.x && t.tileY === hoverTile.y);
            rangeRadius = existingTower.range;
        }

        ctx.beginPath();
        ctx.arc(centerX, centerY, rangeRadius, 0, Math.PI * 2);
        ctx.fillStyle = canBuild ? 'rgba(0, 243, 255, 0.06)' : 'rgba(255, 0, 85, 0.06)';
        ctx.fill();
        ctx.strokeStyle = canBuild ? 'rgba(0, 243, 255, 0.4)' : 'rgba(255, 0, 85, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 6]);
        ctx.stroke();

        ctx.restore();
    }

    function drawParticle(p) {
        ctx.save();
        if (p.type === 'line' || p.type === 'lightning' || p.type === 'rail') {
            ctx.beginPath();
            ctx.moveTo(p.x1, p.y1);
            ctx.lineTo(p.x2, p.y2);
            ctx.strokeStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = p.type === 'rail' ? 20 : 10;
            ctx.lineWidth = p.type === 'rail' ? 5 : (p.type === 'lightning' ? 3 : 2);
            ctx.globalAlpha = p.life * 4;
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;
            ctx.globalAlpha = p.life;
            ctx.fill();
        }
        ctx.restore();
    }

    // Start Game Loop Initialization
    requestAnimationFrame(gameLoop);
    updateUI();
});
