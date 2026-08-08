/* ==========================================================================
   DAY 008 - SYNTHWAVE BEAT HERO: NEON RHYTHM
   Main JavaScript Application Engine
   Web Audio Synth, Procedural & Custom Music Engine, 3D Perspective Canvas Engine
   ========================================================================== */

(function() {
    'use strict';

    /* --- Constants & Configuration --- */
    const LANES_COUNT = 4;
    const DEFAULT_KEY_LAYOUTS = {
        'DFJK': ['d', 'f', 'j', 'k'],
        'ASKL': ['a', 's', 'k', 'l'],
        '1234': ['1', '2', '3', '4']
    };

    const LANE_COLORS = [
        { primary: '#ff007f', glow: 'rgba(255, 0, 127, 0.8)', name: 'Pink', rgb: '255, 0, 127' },
        { primary: '#00f0ff', glow: 'rgba(0, 240, 255, 0.8)', name: 'Cyan', rgb: '0, 240, 255' },
        { primary: '#ffe600', glow: 'rgba(255, 230, 0, 0.8)', name: 'Yellow', rgb: '255, 230, 0' },
        { primary: '#00ff66', glow: 'rgba(0, 255, 102, 0.8)', name: 'Green', rgb: '0, 255, 102' }
    ];

    /* --- DOM Elements --- */
    let canvas, ctx;

    // Modals
    let modalSongSelect, modalPause, modalResults;

    // Buttons
    let btnStartGame, btnPause, btnAudioToggle, btnResumePause, btnRestartPause, btnMenuPause, btnRetryResults, btnMenuResults, cardCustomMp3, mp3FileInput;

    // HUD Elements
    let hudStats, scoreVal, accuracyVal, maxComboVal, multiplierVal;
    let judgmentPopup, judgmentText, comboDisplay, comboCountText;
    let energyBarContainer, energyFill;

    // Settings Inputs
    let selectSpeed, selectKeys, globalHighscoreText, touchLaneBtns;

    // Results Elements
    let resultsTitle, resultsSongName, rankBadge, resultFinalScore, resultAccuracy, resultMaxCombo, cntPerfect, cntGreat, cntGood, cntMiss, newHighscoreNotice;

    /* --- Audio & Synth Engine --- */
    let audioCtx = null;
    let masterGain = null;
    let customAudioBuffer = null;
    let customAudioSource = null;
    let isMuted = false;
    let proceduralMusicTimer = null;

    /* --- Game State Data --- */
    let gameState = 'MENU'; // MENU, PLAYING, PAUSED, RESULTS
    let currentSongKey = 'cyber-pulse';
    let activeKeyLayout = ['d', 'f', 'j', 'k'];
    let noteSpeedMultiplier = 1.25;

    let score = 0;
    let currentCombo = 0;
    let maxCombo = 0;
    let totalNotesInTrack = 0;
    let hitsCounts = { perfect: 0, great: 0, good: 0, miss: 0 };
    let energyShield = 100; // 0 to 100

    let songStartTime = 0;
    let songDuration = 0;
    let currentSongNotes = [];
    let particles = [];
    let lanePressedState = [false, false, false, false];
    let laneHitAnimationTime = [0, 0, 0, 0];

    let animationFrameId = null;

    /* --- Initialize Application --- */
    function init() {
        canvas = document.getElementById('rhythmCanvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');

        // Modals
        modalSongSelect = document.getElementById('modal-song-select');
        modalPause = document.getElementById('modal-pause');
        modalResults = document.getElementById('modal-results');

        // Buttons
        btnStartGame = document.getElementById('btn-start-game');
        btnPause = document.getElementById('btn-pause');
        btnAudioToggle = document.getElementById('btn-audio-toggle');
        btnResumePause = document.getElementById('btn-resume-pause');
        btnRestartPause = document.getElementById('btn-restart-pause');
        btnMenuPause = document.getElementById('btn-menu-pause');
        btnRetryResults = document.getElementById('btn-retry-results');
        btnMenuResults = document.getElementById('btn-menu-results');
        cardCustomMp3 = document.getElementById('card-custom-mp3');
        mp3FileInput = document.getElementById('mp3-file-input');

        // HUD Elements
        hudStats = document.getElementById('hud-stats');
        scoreVal = document.getElementById('score-val');
        accuracyVal = document.getElementById('accuracy-val');
        maxComboVal = document.getElementById('max-combo-val');
        multiplierVal = document.getElementById('multiplier-val');

        judgmentPopup = document.getElementById('judgment-popup');
        judgmentText = document.getElementById('judgment-text');
        comboDisplay = document.getElementById('combo-display');
        comboCountText = document.getElementById('combo-count');

        energyBarContainer = document.getElementById('energy-bar-container');
        energyFill = document.getElementById('energy-fill');

        // Settings Inputs
        selectSpeed = document.getElementById('select-speed');
        selectKeys = document.getElementById('select-keys');
        globalHighscoreText = document.getElementById('global-highscore');
        touchLaneBtns = document.querySelectorAll('.touch-lane-btn');

        // Results Elements
        resultsTitle = document.getElementById('results-title');
        resultsSongName = document.getElementById('results-song-name');
        rankBadge = document.getElementById('rank-badge');
        resultFinalScore = document.getElementById('result-final-score');
        resultAccuracy = document.getElementById('result-accuracy');
        resultMaxCombo = document.getElementById('result-max-combo');
        cntPerfect = document.getElementById('cnt-perfect');
        cntGreat = document.getElementById('cnt-great');
        cntGood = document.getElementById('cnt-good');
        cntMiss = document.getElementById('cnt-miss');
        newHighscoreNotice = document.getElementById('new-highscore-notice');

        setupEventListeners();
        loadHighScore();
        updateKeyBindLabels();
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }

    function resizeCanvas() {
        if (!canvas || !canvas.parentElement) return;
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width > 0 ? rect.width : 800;
        canvas.height = rect.height > 0 ? rect.height : 700;
    }

    /* --- Web Audio API Synth Engine --- */
    function initAudioContext() {
        try {
            if (!audioCtx) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                audioCtx = new AudioContextClass();
                masterGain = audioCtx.createGain();
                masterGain.gain.value = 0.8;
                masterGain.connect(audioCtx.destination);
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
        } catch (e) {
            console.warn('Web Audio API not supported or blocked:', e);
        }
    }

    function getCurrentTime() {
        return (audioCtx && audioCtx.state !== 'closed') ? audioCtx.currentTime : (performance.now() / 1000);
    }

    // Play hit feedback sound synthesizer
    function playSoundHit(type) {
        if (isMuted || !audioCtx || audioCtx.state !== 'running') return;

        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(masterGain);

            const now = audioCtx.currentTime;

            if (type === 'PERFECT') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(880, now);
                osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
                osc.start(now);
                osc.stop(now + 0.12);
            } else if (type === 'GREAT' || type === 'GOOD') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, now);
                osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.08);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === 'MISS') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(140, now);
                osc.frequency.linearRampToValueAtTime(60, now + 0.15);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
            }
        } catch (e) {
            // Audio error safeguard
        }
    }

    // Synthwave Procedural Audio Generator
    function startProceduralSynthwaveSong(songKey) {
        stopAudio();
        initAudioContext();

        let bpm = 120;
        if (songKey === 'neon-highway') bpm = 138;
        if (songKey === 'darksynth-fury') bpm = 155;

        const stepDuration = 60 / bpm / 4; // 16th notes
        let stepCounter = 0;

        const scale = [110, 130.81, 146.83, 164.81, 196, 220, 261.63, 293.66, 329.63, 392, 440];

        proceduralMusicTimer = setInterval(() => {
            if (gameState !== 'PLAYING' || !audioCtx || audioCtx.state !== 'running') return;

            try {
                const now = audioCtx.currentTime;

                // Kick Drum on 4-on-the-floor
                if (stepCounter % 4 === 0) {
                    const kickOsc = audioCtx.createOscillator();
                    const kickGain = audioCtx.createGain();
                    kickOsc.type = 'sine';
                    kickOsc.frequency.setValueAtTime(150, now);
                    kickOsc.frequency.exponentialRampToValueAtTime(30, now + 0.08);
                    kickGain.gain.setValueAtTime(0.5, now);
                    kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
                    kickOsc.connect(kickGain);
                    kickGain.connect(masterGain);
                    kickOsc.start(now);
                    kickOsc.stop(now + 0.09);
                }

                // Snare Drum
                if (stepCounter % 8 === 4) {
                    const snareGain = audioCtx.createGain();
                    const bufferSize = audioCtx.sampleRate * 0.1;
                    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                    const data = buffer.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) {
                        data[i] = Math.random() * 2 - 1;
                    }
                    const noise = audioCtx.createBufferSource();
                    noise.buffer = buffer;

                    const filter = audioCtx.createBiquadFilter();
                    filter.type = 'highpass';
                    filter.frequency.value = 1000;

                    noise.connect(filter);
                    filter.connect(snareGain);
                    snareGain.connect(masterGain);

                    snareGain.gain.setValueAtTime(0.25, now);
                    snareGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                    noise.start(now);
                }

                // Synth Bassline
                if (stepCounter % 2 === 0) {
                    const bassOsc = audioCtx.createOscillator();
                    const bassGain = audioCtx.createGain();
                    const filter = audioCtx.createBiquadFilter();

                    const freq = scale[stepCounter % scale.length];
                    bassOsc.type = 'sawtooth';
                    bassOsc.frequency.setValueAtTime(freq / 2, now);

                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(800, now);
                    filter.frequency.exponentialRampToValueAtTime(200, now + 0.1);

                    bassOsc.connect(filter);
                    filter.connect(bassGain);
                    bassGain.connect(masterGain);

                    bassGain.gain.setValueAtTime(0.3, now);
                    bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
                    bassOsc.start(now);
                    bassOsc.stop(now + 0.12);
                }

                stepCounter++;
            } catch (e) {
                // Audio synthesis safeguard
            }
        }, stepDuration * 1000);
    }

    function stopAudio() {
        if (proceduralMusicTimer) {
            clearInterval(proceduralMusicTimer);
            proceduralMusicTimer = null;
        }
        if (customAudioSource) {
            try { customAudioSource.stop(); } catch (e) {}
            customAudioSource = null;
        }
    }

    /* --- Beat Track Generation Engine --- */
    function generateTrackNotes(songKey) {
        const notes = [];
        let noteId = 1;
        let bpm = 120;
        let durationSec = 45;

        if (songKey === 'neon-highway') { bpm = 138; durationSec = 55; }
        if (songKey === 'darksynth-fury') { bpm = 155; durationSec = 60; }

        if (songKey === 'custom' && customAudioBuffer) {
            const channelData = customAudioBuffer.getChannelData(0);
            const sampleRate = customAudioBuffer.sampleRate;
            durationSec = customAudioBuffer.duration;

            const windowSize = Math.floor(sampleRate * 0.1);
            let prevEnergy = 0;

            for (let i = 0; i < channelData.length; i += windowSize) {
                let sum = 0;
                for (let j = i; j < Math.min(i + windowSize, channelData.length); j++) {
                    sum += channelData[j] * channelData[j];
                }
                const energy = Math.sqrt(sum / windowSize);
                const time = i / sampleRate;

                if (energy > prevEnergy * 1.5 && energy > 0.08 && time > 2.0 && time < durationSec - 2) {
                    const lane = Math.floor(Math.random() * LANES_COUNT);
                    notes.push({ id: noteId++, lane: lane, time: time, hit: false, missed: false });
                }
                prevEnergy = energy;
            }
        } else {
            const beatInterval = 60 / bpm;
            const startTime = 2.0;

            let t = startTime;
            let patternIndex = 0;

            while (t < durationSec) {
                const mode = patternIndex % 4;

                if (mode === 0) {
                    const lane = Math.floor(patternIndex % LANES_COUNT);
                    notes.push({ id: noteId++, lane: lane, time: t, hit: false, missed: false });
                    t += beatInterval;
                } else if (mode === 1) {
                    const lane1 = (patternIndex * 2) % LANES_COUNT;
                    const lane2 = (patternIndex * 2 + 1) % LANES_COUNT;
                    notes.push({ id: noteId++, lane: lane1, time: t, hit: false, missed: false });
                    notes.push({ id: noteId++, lane: lane2, time: t + beatInterval * 0.5, hit: false, missed: false });
                    t += beatInterval;
                } else if (mode === 2) {
                    const laneA = patternIndex % LANES_COUNT;
                    const laneB = (patternIndex + 2) % LANES_COUNT;
                    notes.push({ id: noteId++, lane: laneA, time: t, hit: false, missed: false });
                    notes.push({ id: noteId++, lane: laneB, time: t, hit: false, missed: false });
                    t += beatInterval * 1.5;
                } else {
                    for (let l = 0; l < 4; l++) {
                        notes.push({ id: noteId++, lane: l, time: t + l * (beatInterval * 0.4), hit: false, missed: false });
                    }
                    t += beatInterval * 2;
                }

                patternIndex++;
            }
        }

        songDuration = durationSec;
        totalNotesInTrack = notes.length;
        return notes;
    }

    /* --- Start Game --- */
    function startGame() {
        initAudioContext();
        gameState = 'PLAYING';

        // Reset stats
        score = 0;
        currentCombo = 0;
        maxCombo = 0;
        energyShield = 100;
        hitsCounts = { perfect: 0, great: 0, good: 0, miss: 0 };
        particles = [];

        currentSongNotes = generateTrackNotes(currentSongKey);
        songStartTime = getCurrentTime();

        // Start Music
        if (currentSongKey === 'custom' && customAudioBuffer && audioCtx) {
            stopAudio();
            customAudioSource = audioCtx.createBufferSource();
            customAudioSource.buffer = customAudioBuffer;
            customAudioSource.connect(masterGain);
            customAudioSource.start(0);
        } else {
            startProceduralSynthwaveSong(currentSongKey);
        }

        // Show HUD and hide Modals
        if (modalSongSelect) modalSongSelect.classList.add('hidden');
        if (modalPause) modalPause.classList.add('hidden');
        if (modalResults) modalResults.classList.add('hidden');

        if (hudStats) hudStats.classList.remove('hidden');
        if (btnPause) btnPause.classList.remove('hidden');
        if (energyBarContainer) energyBarContainer.classList.remove('hidden');

        updateHUD();

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        gameLoop();
    }

    /* --- Game Loop & Rendering --- */
    function gameLoop() {
        if (gameState === 'PLAYING') {
            update();
            render();
            animationFrameId = requestAnimationFrame(gameLoop);
        }
    }

    function update() {
        const currentTime = getCurrentTime() - songStartTime;
        const travelTime = 1.6 / noteSpeedMultiplier;

        // Check missed notes
        currentSongNotes.forEach(note => {
            if (!note.hit && !note.missed) {
                if (currentTime > note.time + 0.14) {
                    note.missed = true;
                    registerHit('MISS');
                }
            }
        });

        // Update Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.03;
            p.size *= 0.95;
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }

        // Update lane animation time
        for (let i = 0; i < LANES_COUNT; i++) {
            if (laneHitAnimationTime[i] > 0) {
                laneHitAnimationTime[i] -= 0.05;
            }
        }

        // Check End Condition
        if (currentTime > songDuration + 1.5 || energyShield <= 0) {
            endGame();
        }
    }

    /* --- 3D Perspective Rhythm Highway Rendering --- */
    function render() {
        if (!ctx || !canvas) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const w = canvas.width;
        const h = canvas.height;

        const horizonY = h * 0.18;
        const targetY = h * 0.82;
        const topWidth = w * 0.25;
        const bottomWidth = w * 0.85;

        const topXLeft = (w - topWidth) / 2;
        const topXRight = topXLeft + topWidth;
        const bottomXLeft = (w - bottomWidth) / 2;
        const bottomXRight = bottomXLeft + bottomWidth;

        // 1. Render Highway Surface
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(topXLeft, horizonY);
        ctx.lineTo(topXRight, horizonY);
        ctx.lineTo(bottomXRight, targetY + (h - targetY));
        ctx.lineTo(bottomXLeft, targetY + (h - targetY));
        ctx.closePath();

        const trackGrad = ctx.createLinearGradient(0, horizonY, 0, h);
        trackGrad.addColorStop(0, 'rgba(15, 10, 30, 0.95)');
        trackGrad.addColorStop(0.5, 'rgba(25, 12, 50, 0.95)');
        trackGrad.addColorStop(1, 'rgba(10, 5, 20, 0.98)');
        ctx.fillStyle = trackGrad;
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 0, 127, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        // 2. Render Lane Dividers
        for (let i = 0; i <= LANES_COUNT; i++) {
            const tTop = i / LANES_COUNT;
            const xTop = topXLeft + tTop * topWidth;
            const xBot = bottomXLeft + tTop * bottomWidth;

            ctx.beginPath();
            ctx.moveTo(xTop, horizonY);
            ctx.lineTo(xBot, h);
            ctx.strokeStyle = (i === 0 || i === LANES_COUNT) ? 'rgba(0, 240, 255, 0.8)' : 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = (i === 0 || i === LANES_COUNT) ? 4 : 1.5;
            ctx.stroke();
        }

        // 3. Render Horizontal Beat Grid Lines
        const currentTime = getCurrentTime() - songStartTime;
        const travelTime = 1.6 / noteSpeedMultiplier;

        ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
        ctx.lineWidth = 1;
        for (let b = 0; b < 20; b++) {
            const beatOffset = ((currentTime * 3 + b * 0.5) % 10) / 10;
            const lineY = horizonY + Math.pow(beatOffset, 2) * (h - horizonY);

            const scaleRatio = (lineY - horizonY) / (h - horizonY);
            const lineW = topWidth + scaleRatio * (bottomWidth - topWidth);
            const lineX = (w - lineW) / 2;

            ctx.beginPath();
            ctx.moveTo(lineX, lineY);
            ctx.lineTo(lineX + lineW, lineY);
            ctx.stroke();
        }

        // 4. Render Lane Hit Flash Effect
        for (let i = 0; i < LANES_COUNT; i++) {
            if (lanePressedState[i] || laneHitAnimationTime[i] > 0) {
                const t0 = i / LANES_COUNT;
                const t1 = (i + 1) / LANES_COUNT;

                const xT0 = topXLeft + t0 * topWidth;
                const xT1 = topXLeft + t1 * topWidth;
                const xB0 = bottomXLeft + t0 * bottomWidth;
                const xB1 = bottomXLeft + t1 * bottomWidth;

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(xT0, horizonY);
                ctx.lineTo(xT1, horizonY);
                ctx.lineTo(xB1, targetY);
                ctx.lineTo(xB0, targetY);
                ctx.closePath();

                const flashGrad = ctx.createLinearGradient(0, horizonY, 0, targetY);
                const col = LANE_COLORS[i];
                flashGrad.addColorStop(0, 'transparent');
                flashGrad.addColorStop(1, 'rgba(' + col.rgb + ', 0.35)');
                ctx.fillStyle = flashGrad;
                ctx.fill();
                ctx.restore();
            }
        }

        // 5. Render Target Hit Bar & Circles
        ctx.save();
        ctx.shadowColor = 'rgba(0, 240, 255, 0.8)';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(bottomXLeft, targetY);
        ctx.lineTo(bottomXRight, targetY);
        ctx.stroke();
        ctx.restore();

        for (let i = 0; i < LANES_COUNT; i++) {
            const tCenter = (i + 0.5) / LANES_COUNT;
            const targetX = bottomXLeft + tCenter * bottomWidth;
            const col = LANE_COLORS[i];

            ctx.save();
            ctx.beginPath();
            ctx.arc(targetX, targetY, 26, 0, Math.PI * 2);
            ctx.fillStyle = lanePressedState[i] ? col.primary : 'rgba(18, 14, 38, 0.8)';
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = col.primary;
            ctx.shadowColor = col.primary;
            ctx.shadowBlur = lanePressedState[i] ? 20 : 8;
            ctx.stroke();

            ctx.font = 'bold 16px "Orbitron", sans-serif';
            ctx.fillStyle = lanePressedState[i] ? '#000000' : '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(activeKeyLayout[i].toUpperCase(), targetX, targetY);
            ctx.restore();
        }

        // 6. Render Incoming Note Gems
        currentSongNotes.forEach(note => {
            if (note.hit || note.missed) return;

            const timeDiff = note.time - currentTime;

            if (timeDiff > 0 && timeDiff <= travelTime) {
                const progress = 1 - (timeDiff / travelTime);
                const curvedProgress = Math.pow(progress, 1.8);

                const currentY = horizonY + curvedProgress * (targetY - horizonY);
                const currentTrackWidth = topWidth + curvedProgress * (bottomWidth - topWidth);
                const currentTrackLeft = (w - currentTrackWidth) / 2;

                const tCenter = (note.lane + 0.5) / LANES_COUNT;
                const currentX = currentTrackLeft + tCenter * currentTrackWidth;

                const noteRadius = 10 + curvedProgress * 20;
                const col = LANE_COLORS[note.lane];

                ctx.save();
                ctx.beginPath();
                ctx.arc(currentX, currentY, noteRadius, 0, Math.PI * 2);
                ctx.fillStyle = col.primary;
                ctx.shadowColor = col.primary;
                ctx.shadowBlur = 15;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(currentX - noteRadius * 0.25, currentY - noteRadius * 0.25, noteRadius * 0.4, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.restore();
            }
        });

        // 7. Render Particles
        particles.forEach(p => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;
            ctx.globalAlpha = p.life;
            ctx.fill();
            ctx.restore();
        });
    }

    /* --- Key & Hit Detection logic --- */
    function handleLanePress(laneIndex) {
        if (gameState !== 'PLAYING') return;

        lanePressedState[laneIndex] = true;
        laneHitAnimationTime[laneIndex] = 1.0;

        if (touchLaneBtns[laneIndex]) {
            touchLaneBtns[laneIndex].classList.add('pressed');
        }

        const currentTime = getCurrentTime() - songStartTime;
        const travelTime = 1.6 / noteSpeedMultiplier;

        let candidateNote = null;
        let minDiff = Infinity;

        currentSongNotes.forEach(note => {
            if (note.lane === laneIndex && !note.hit && !note.missed) {
                const diff = Math.abs(note.time - currentTime);
                if (diff < minDiff) {
                    minDiff = diff;
                    candidateNote = note;
                }
            }
        });

        if (candidateNote) {
            if (minDiff <= 0.055) {
                candidateNote.hit = true;
                registerHit('PERFECT', candidateNote.lane);
            } else if (minDiff <= 0.095) {
                candidateNote.hit = true;
                registerHit('GREAT', candidateNote.lane);
            } else if (minDiff <= 0.135) {
                candidateNote.hit = true;
                registerHit('GOOD', candidateNote.lane);
            }
        }
    }

    function handleLaneRelease(laneIndex) {
        lanePressedState[laneIndex] = false;
        if (touchLaneBtns[laneIndex]) {
            touchLaneBtns[laneIndex].classList.remove('pressed');
        }
    }

    function registerHit(type, laneIndex = 0) {
        playSoundHit(type);

        if (type === 'PERFECT') {
            hitsCounts.perfect++;
            currentCombo++;
            score += 1000 * getMultiplier();
            energyShield = Math.min(100, energyShield + 4);
            spawnHitParticles(laneIndex, '#00f0ff');
            showJudgmentPopup('PERFECT', 'text-perfect');
        } else if (type === 'GREAT') {
            hitsCounts.great++;
            currentCombo++;
            score += 750 * getMultiplier();
            energyShield = Math.min(100, energyShield + 2);
            spawnHitParticles(laneIndex, '#00ff66');
            showJudgmentPopup('GREAT', 'text-great');
        } else if (type === 'GOOD') {
            hitsCounts.good++;
            score += 400;
            spawnHitParticles(laneIndex, '#ffe600');
            showJudgmentPopup('GOOD', 'text-good');
        } else if (type === 'MISS') {
            hitsCounts.miss++;
            currentCombo = 0;
            energyShield = Math.max(0, energyShield - 12);
            showJudgmentPopup('MISS', 'text-miss');
        }

        if (currentCombo > maxCombo) {
            maxCombo = currentCombo;
        }

        updateHUD();
    }

    function spawnHitParticles(laneIndex, color) {
        if (!canvas) return;
        const w = canvas.width;
        const h = canvas.height;
        const targetY = h * 0.82;
        const bottomWidth = w * 0.85;
        const bottomXLeft = (w - bottomWidth) / 2;

        const tCenter = (laneIndex + 0.5) / LANES_COUNT;
        const targetX = bottomXLeft + tCenter * bottomWidth;

        for (let i = 0; i < 16; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 8;
            particles.push({
                x: targetX,
                y: targetY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 4 + Math.random() * 6,
                color: color,
                life: 1.0
            });
        }
    }

    function getMultiplier() {
        if (currentCombo >= 50) return 4;
        if (currentCombo >= 25) return 3;
        if (currentCombo >= 10) return 2;
        return 1;
    }

    function showJudgmentPopup(text, cssClass) {
        if (!judgmentText || !judgmentPopup) return;
        judgmentText.textContent = text;
        judgmentText.className = 'judgment-text ' + cssClass;
        judgmentPopup.classList.remove('hidden');

        judgmentPopup.style.animation = 'none';
        judgmentPopup.offsetHeight;
        judgmentPopup.style.animation = null;
    }

    function updateHUD() {
        if (scoreVal) scoreVal.textContent = score.toLocaleString('en-US', { minimumIntegerDigits: 6 });
        if (maxComboVal) maxComboVal.textContent = maxCombo + 'x';
        if (multiplierVal) multiplierVal.textContent = getMultiplier() + 'x';

        const totalHits = hitsCounts.perfect + hitsCounts.great + hitsCounts.good + hitsCounts.miss;
        if (totalHits > 0) {
            const weightedScore = (hitsCounts.perfect * 1.0 + hitsCounts.great * 0.75 + hitsCounts.good * 0.5) / totalHits;
            const acc = (weightedScore * 100).toFixed(1);
            if (accuracyVal) accuracyVal.textContent = acc + '%';
        } else {
            if (accuracyVal) accuracyVal.textContent = '100.0%';
        }

        if (currentCombo > 2) {
            if (comboCountText) comboCountText.textContent = currentCombo;
            if (comboDisplay) comboDisplay.classList.remove('hidden');
        } else {
            if (comboDisplay) comboDisplay.classList.add('hidden');
        }

        if (energyFill) energyFill.style.width = energyShield + '%';
    }

    /* --- Event Listeners & Input Handlers --- */
    function setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            const key = e.key.toLowerCase();

            const laneIndex = activeKeyLayout.indexOf(key);
            if (laneIndex !== -1) {
                handleLanePress(laneIndex);
            }

            if (key === 'escape' || key === 'p') {
                togglePause();
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            const laneIndex = activeKeyLayout.indexOf(key);
            if (laneIndex !== -1) {
                handleLaneRelease(laneIndex);
            }
        });

        touchLaneBtns.forEach(btn => {
            const laneIndex = parseInt(btn.getAttribute('data-lane'), 10);
            
            const startPress = (e) => {
                e.preventDefault();
                handleLanePress(laneIndex);
            };

            const endPress = (e) => {
                e.preventDefault();
                handleLaneRelease(laneIndex);
            };

            btn.addEventListener('mousedown', startPress);
            btn.addEventListener('mouseup', endPress);
            btn.addEventListener('touchstart', startPress, { passive: false });
            btn.addEventListener('touchend', endPress, { passive: false });
        });

        const songCards = document.querySelectorAll('.song-card:not(.custom-card)');
        songCards.forEach(card => {
            card.addEventListener('click', () => {
                songCards.forEach(c => c.classList.remove('active'));
                if (cardCustomMp3) cardCustomMp3.classList.remove('active');
                card.classList.add('active');
                currentSongKey = card.getAttribute('data-song');
            });
        });

        if (cardCustomMp3 && mp3FileInput) {
            cardCustomMp3.addEventListener('click', () => {
                mp3FileInput.click();
            });

            mp3FileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    initAudioContext();
                    const reader = new FileReader();
                    reader.onload = function(evt) {
                        if (!audioCtx) return;
                        audioCtx.decodeAudioData(evt.target.result, function(buffer) {
                            customAudioBuffer = buffer;
                            songCards.forEach(c => c.classList.remove('active'));
                            cardCustomMp3.classList.add('active');
                            currentSongKey = 'custom';
                            alert(`File Audio "${file.name}" berhasil dimuat! Siap dimainkan.`);
                        });
                    };
                    reader.readAsArrayBuffer(file);
                }
            });
        }

        if (selectSpeed) {
            selectSpeed.addEventListener('change', (e) => {
                noteSpeedMultiplier = parseFloat(e.target.value);
            });
        }

        if (selectKeys) {
            selectKeys.addEventListener('change', (e) => {
                activeKeyLayout = DEFAULT_KEY_LAYOUTS[e.target.value] || ['d', 'f', 'j', 'k'];
                updateKeyBindLabels();
            });
        }

        if (btnStartGame) btnStartGame.addEventListener('click', startGame);
        if (btnPause) btnPause.addEventListener('click', togglePause);
        if (btnResumePause) btnResumePause.addEventListener('click', togglePause);
        if (btnRestartPause) btnRestartPause.addEventListener('click', startGame);
        if (btnMenuPause) btnMenuPause.addEventListener('click', returnToMenu);

        if (btnRetryResults) btnRetryResults.addEventListener('click', startGame);
        if (btnMenuResults) btnMenuResults.addEventListener('click', returnToMenu);

        if (btnAudioToggle) {
            btnAudioToggle.addEventListener('click', () => {
                isMuted = !isMuted;
                btnAudioToggle.textContent = isMuted ? '🔇' : '🔊';
            });
        }
    }

    function updateKeyBindLabels() {
        touchLaneBtns.forEach((btn, idx) => {
            const label = btn.querySelector('.key-bind');
            if (label && activeKeyLayout[idx]) {
                label.textContent = activeKeyLayout[idx].toUpperCase();
            }
        });
    }

    function togglePause() {
        if (gameState === 'PLAYING') {
            gameState = 'PAUSED';
            if (audioCtx) audioCtx.suspend();
            modalPause.classList.remove('hidden');
        } else if (gameState === 'PAUSED') {
            gameState = 'PLAYING';
            if (audioCtx) audioCtx.resume();
            modalPause.classList.add('hidden');
        }
    }

    function returnToMenu() {
        stopAudio();
        gameState = 'MENU';

        if (modalPause) modalPause.classList.add('hidden');
        if (modalResults) modalResults.classList.add('hidden');
        if (hudStats) hudStats.classList.add('hidden');
        if (btnPause) btnPause.classList.add('hidden');
        if (energyBarContainer) energyBarContainer.classList.add('hidden');
        if (judgmentPopup) judgmentPopup.classList.add('hidden');
        if (comboDisplay) comboDisplay.classList.add('hidden');

        if (modalSongSelect) modalSongSelect.classList.remove('hidden');
        loadHighScore();
    }

    /* --- End Game & Results System --- */
    function endGame() {
        stopAudio();
        gameState = 'RESULTS';

        const totalHits = hitsCounts.perfect + hitsCounts.great + hitsCounts.good + hitsCounts.miss;
        let accuracy = 100;
        if (totalHits > 0) {
            const weightedScore = (hitsCounts.perfect * 1.0 + hitsCounts.great * 0.75 + hitsCounts.good * 0.5) / totalHits;
            accuracy = (weightedScore * 100).toFixed(1);
        }

        let rank = 'SSS';
        if (accuracy < 98) rank = 'SS';
        if (accuracy < 94) rank = 'S';
        if (accuracy < 85) rank = 'A';
        if (accuracy < 75) rank = 'B';
        if (accuracy < 60 || energyShield <= 0) rank = 'C';

        if (rankBadge) {
            rankBadge.textContent = rank;
            rankBadge.className = 'rank-badge rank-' + rank.toLowerCase().charAt(0);
        }

        if (resultsTitle) {
            if (energyShield <= 0) {
                resultsTitle.textContent = 'STAGE FAILED!';
                resultsTitle.style.textShadow = '0 0 15px var(--neon-red)';
            } else {
                resultsTitle.textContent = 'STAGE CLEARED!';
                resultsTitle.style.textShadow = '0 0 15px var(--neon-pink)';
            }
        }

        if (resultsSongName) resultsSongName.textContent = currentSongKey.toUpperCase().replace('-', ' ');
        if (resultFinalScore) resultFinalScore.textContent = score.toLocaleString('en-US', { minimumIntegerDigits: 6 });
        if (resultAccuracy) resultAccuracy.textContent = accuracy + '%';
        if (resultMaxCombo) resultMaxCombo.textContent = maxCombo + 'x';

        if (cntPerfect) cntPerfect.textContent = hitsCounts.perfect;
        if (cntGreat) cntGreat.textContent = hitsCounts.great;
        if (cntGood) cntGood.textContent = hitsCounts.good;
        if (cntMiss) cntMiss.textContent = hitsCounts.miss;

        const savedHigh = localStorage.getItem('synthwave_beat_hero_highscore') || 0;
        if (score > parseInt(savedHigh, 10)) {
            localStorage.setItem('synthwave_beat_hero_highscore', score);
            if (newHighscoreNotice) newHighscoreNotice.classList.remove('hidden');
        } else {
            if (newHighscoreNotice) newHighscoreNotice.classList.add('hidden');
        }

        if (modalResults) modalResults.classList.remove('hidden');
    }

    function loadHighScore() {
        const savedHigh = localStorage.getItem('synthwave_beat_hero_highscore') || 0;
        if (globalHighscoreText) {
            globalHighscoreText.textContent = parseInt(savedHigh, 10).toLocaleString('en-US', { minimumIntegerDigits: 6 });
        }
    }

    // Reliable Script Initialization Check
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
