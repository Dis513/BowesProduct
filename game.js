// ================================== //
// NEON NIGHTMARE - Game Engine     //
// Updated: Difficulty = Note Density Only
// ================================== //

class NeonNightmare {
    constructor() {
        // Game State
        this.isPlaying = false;
        this.isPaused = false;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.multiplier = 1;
        this.difficulty = 'medium';

        // Level System
        this.currentLevel = 1;
        this.maxLevel = 50;
        this.isCustomSong = false;

        // Character System
        this.character = null;
        this.characterSprite = null;
        this.characterAura = null;
        this.characterState = 'idle';

        // Map System
        this.parallaxLayers = {};
        this.scrollPositions = { layer1: 0, layer2: 0, layer3: 0, layer4: 0 };
        this.lastScrollTime = 0;

        // Beat Detection
        this.beatDetected = false;
        this.lastBeatTime = 0;
        this.beatThreshold = 0.35;
        this.beatHistory = [];
        this.beatHistorySize = 10;

        // Audio
        this.audioContext = null;
        this.audioBuffer = null;
        this.audioSource = null;
        this.analyser = null;
        this.audioData = null;
        this.startTime = 0;
        this.duration = 0;

        // Cutscene
        this.cutsceneVideo = null;
        this.isCutscenePlaying = false;

        // Notes
        this.notes = [];
        this.activeNotes = [];
        this.noteSpeed = 3;           // Fixed for all difficulties
        this.noteSpawnY = -50;
        this.targetY = 0;

        // Fret Configuration
        this.frets = ['green', 'red', 'yellow', 'blue', 'orange'];
        this.fretKeys = ['a', 's', 'd', 'f', 'g'];
        this.fretButtons = {};

        // Statistics
        this.perfectHits = 0;
        this.greatHits = 0;
        this.goodHits = 0;
        this.misses = 0;

        // === UNIFIED TIMING & SPEED (same for all difficulties) ===
        this.timingWindows = {
            easy:    { perfect: 80, great: 130, good: 200, noteSpeed: 3.0, minInterval: 0.6,  threshold: 0.30 },
            medium:  { perfect: 80, great: 130, good: 200, noteSpeed: 3.0, minInterval: 0.4,  threshold: 0.30 },
            hard:    { perfect: 80, great: 130, good: 200, noteSpeed: 3.0, minInterval: 0.25, threshold: 0.30 },
            expert:  { perfect: 80, great: 130, good: 200, noteSpeed: 3.0, minInterval: 0.18, threshold: 0.30 },
            master:  { perfect: 80, great: 130, good: 200, noteSpeed: 3.0, minInterval: 0.12, threshold: 0.30 }
        };
        // Only minInterval changes → controls note density
        // Everything else (timing windows, speed) is now identical

        // DOM Elements
        this.initializeElements();
        this.setupEventListeners();
        this.createParticles();
        this.initializeCharacter();
        this.initializeMap();
        this.generateLevelGrid();
    }

    // ===================================
    // Initialization
    // ===================================
    initializeElements() {
        this.mainMenu = document.getElementById('mainMenu');
        this.gameContainer = document.getElementById('gameContainer');
        this.pauseMenu = document.getElementById('pauseMenu');
        this.settingsMenu = document.getElementById('settingsMenu');
        this.songCompleteMenu = document.getElementById('songCompleteMenu');
        this.levelSelectMenu = document.getElementById('levelSelectMenu');

        this.uploadButton = document.getElementById('uploadButton');
        this.audioFileInput = document.getElementById('audioFileInput');
        this.uploadInfo = document.getElementById('uploadInfo');

        this.cutsceneContainer = document.getElementById('cutsceneContainer');
        this.cutsceneVideo = document.getElementById('cutsceneVideo');
        this.skipCutsceneButton = document.getElementById('skipCutscene');

        this.scoreValue = document.getElementById('scoreValue');
        this.multiplierValue = document.getElementById('multiplierValue');
        this.multiplierPulse = document.getElementById('multiplierPulse');
        this.comboValue = document.getElementById('comboValue');
        this.comboDisplay = document.getElementById('comboDisplay');
        this.progressFill = document.getElementById('progressFill');
        this.songTitle = document.getElementById('songTitle');
        this.songArtist = document.getElementById('songArtist');
        this.songDifficulty = document.getElementById('songDifficulty');

        this.levelNumberTop = document.getElementById('levelNumberTop');
        this.levelDisplayTop = document.getElementById('levelDisplayTop');
        this.levelGrid = document.getElementById('levelGrid');

        this.noteHighway = document.getElementById('noteHighway');
        this.targetLine = document.getElementById('targetLine');
        this.beatGlow = document.getElementById('beatGlow');

        this.frets.forEach((fret, index) => {
            this.fretButtons[fret] = document.querySelector(`.fret-button.${fret}`);
        });

        setTimeout(() => {
            this.targetY = this.noteHighway.offsetHeight - 150;
        }, 100);
    }

    initializeCharacter() {
        this.character = document.getElementById('character');
        this.characterSprite = document.getElementById('characterSprite');
        this.characterAura = document.getElementById('characterAura');
        this.setCharacterState('idle');
    }

    initializeMap() {
        this.parallaxLayers = {
            layer1: document.getElementById('parallaxLayer1'),
            layer2: document.getElementById('parallaxLayer2'),
            layer3: document.getElementById('parallaxLayer3'),
            layer4: document.getElementById('parallaxLayer4')
        };
        this.lastScrollTime = performance.now();
    }

    setupEventListeners() {
        this.uploadButton.addEventListener('click', () => this.audioFileInput.click());
        this.audioFileInput.addEventListener('change', (e) => this.handleFileUpload(e));

        document.getElementById('selectLevel').addEventListener('click', () => this.showLevelSelect());
        document.getElementById('openSettings').addEventListener('click', () => this.showSettings());
        document.getElementById('backToMainMenu').addEventListener('click', () => this.hideLevelSelect());

        document.getElementById('resumeGame').addEventListener('click', () => this.resumeGame());
        document.getElementById('restartSong').addEventListener('click', () => this.restartSong());
        document.getElementById('returnToMenu').addEventListener('click', () => this.returnToMenu());

        document.getElementById('setDifficultyEasy').addEventListener('click', () => this.setDifficulty('easy'));
        document.getElementById('setDifficultyMedium').addEventListener('click', () => this.setDifficulty('medium'));
        document.getElementById('setDifficultyHard').addEventListener('click', () => this.setDifficulty('hard'));
        document.getElementById('setDifficultyExpert').addEventListener('click', () => this.setDifficulty('expert'));
        document.getElementById('setDifficultyMaster').addEventListener('click', () => this.setDifficulty('master'));
        document.getElementById('closeSettings').addEventListener('click', () => this.hideSettings());

        document.getElementById('playAgain').addEventListener('click', () => this.restartSong());
        document.getElementById('nextLevel').addEventListener('click', () => this.playNextLevel());
        document.getElementById('selectLevelFromComplete').addEventListener('click', () => this.showLevelSelect());
        document.getElementById('mainMenuFromComplete').addEventListener('click', () => this.returnToMenu());

        document.getElementById('uploadNewSong')?.addEventListener('click', () => {
            this.returnToMenu();
            this.uploadButton.click();
        });

        this.skipCutsceneButton.addEventListener('click', () => this.skipCutscene());
        this.cutsceneVideo.addEventListener('ended', () => this.onCutsceneEnded());

        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        this.frets.forEach((fret) => {
            const button = this.fretButtons[fret];
            button.addEventListener('mousedown', () => this.handleFretPress(fret));
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleFretPress(fret);
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isPlaying && !this.isCutscenePlaying) {
                this.togglePause();
            }
        });
    }

    createParticles() {
        const particlesContainer = document.getElementById('particles');
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 8 + 's';
            particle.style.animationDuration = (5 + Math.random() * 5) + 's';

            const colors = ['#00FFFF', '#9D00FF', '#39FF14', '#FF1493'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            particle.style.background = color;
            particle.style.boxShadow = `0 0 10px ${color}`;

            particlesContainer.appendChild(particle);
        }
    }

    // ===================================
    // Level Select System
    // ===================================
    generateLevelGrid() {
        this.levelGrid.innerHTML = '';
        for (let i = 1; i <= this.maxLevel; i++) {
            const levelItem = document.createElement('div');
            levelItem.className = 'level-item';
            levelItem.textContent = i;
            levelItem.dataset.level = i;

            if (i <= 10) levelItem.classList.add('easy');
            else if (i <= 20) levelItem.classList.add('medium');
            else if (i <= 35) levelItem.classList.add('hard');
            else if (i <= 45) levelItem.classList.add('expert');
            else levelItem.classList.add('master');

            levelItem.addEventListener('click', () => this.selectLevel(i));
            this.levelGrid.appendChild(levelItem);
        }
    }

    showLevelSelect() {
        this.mainMenu.classList.add('hidden');
        this.levelSelectMenu.classList.add('active');
    }

    hideLevelSelect() {
        this.levelSelectMenu.classList.remove('active');
        this.mainMenu.classList.remove('hidden');
    }

    async selectLevel(level) {
        this.currentLevel = level;
        this.isCustomSong = false;
        this.hideLevelSelect();
        this.difficulty = this.getDifficultyForLevel(level);
        await this.playCutscene(level);
        await this.loadLevelAudio(level);
    }

    // ===================================
    // Cutscene System
    // ===================================
    async playCutscene(level) {
        const cutsceneUrl = `Level${level}.mp4`;
        try {
            this.cutsceneVideo.src = cutsceneUrl;
            this.cutsceneContainer.classList.add('active');
            this.isCutscenePlaying = true;

            await new Promise((resolve, reject) => {
                this.cutsceneVideo.onloadeddata = resolve;
                this.cutsceneVideo.onerror = reject;
                setTimeout(() => reject(new Error('Cutscene not found')), 2000);
            });

            await this.cutsceneVideo.play();
        } catch (error) {
            console.log('Cutscene not found, skipping');
            this.isCutscenePlaying = false;
            this.cutsceneContainer.classList.remove('active');
        }
    }

    onCutsceneEnded() {
        this.isCutscenePlaying = false;
        this.cutsceneContainer.classList.remove('active');
    }

    skipCutscene() {
        if (this.isCutscenePlaying) {
            this.cutsceneVideo.pause();
            this.cutsceneVideo.currentTime = 0;
            this.onCutsceneEnded();
        }
    }

    // ===================================
    // Audio Loading
    // ===================================
    async loadLevelAudio(level) {
        const audioUrl = `Level${level}.mp3`;
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            await this.audioContext.resume();

            this.songTitle.textContent = `Level ${level}`;
            this.songArtist.textContent = this.difficulty.toUpperCase();
            this.songDifficulty.textContent = `Difficulty: ${this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1)}`;

            this.levelNumberTop.textContent = level;

            const response = await fetch(audioUrl);
            if (!response.ok) throw new Error('Audio file not found');
            const arrayBuffer = await response.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.duration = this.audioBuffer.duration;

            await this.analyzeAudioAndGenerateNotes();
            this.startGame();
        } catch (error) {
            console.error('Error loading audio:', error);
            alert(`Error: Could not load Level${level}.mp3\n\nPlease ensure the file exists.`);
            this.returnToMenu();
        }
    }

    // ===================================
    // File Upload & Custom Song
    // ===================================
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.uploadButton.textContent = '⏳ Processing...';
        this.uploadButton.disabled = true;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const arrayBuffer = await file.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.duration = this.audioBuffer.duration;

            this.songTitle.textContent = file.name.replace(/.[^/.]+$/, '');
            this.songArtist.textContent = 'Custom Track';
            this.songDifficulty.textContent = `Difficulty: ${this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1)}`;

            this.isCustomSong = true;
            this.currentLevel = 0;
            this.levelNumberTop.textContent = 'CUSTOM';

            await this.analyzeAudioAndGenerateNotes();
            this.startGame();
        } catch (error) {
            console.error('Error processing audio:', error);
            alert('Error processing audio file.');
            this.uploadButton.textContent = '🎵 Upload Audio File';
            this.uploadButton.disabled = false;
        }
    }

    // ===================================
    // Note Generation - Difficulty affects density only
    // ===================================
    async analyzeAudioAndGenerateNotes() {
        const channelData = this.audioBuffer.getChannelData(0);
        const sampleRate = this.audioBuffer.sampleRate;
        this.notes = this.generateNotesFromAudio(channelData, sampleRate);
        console.log(`Generated ${this.notes.length} notes at ${this.difficulty} difficulty`);
    }

    generateNotesFromAudio(channelData, sampleRate) {
        const notes = [];
        const windowSize = Math.floor(sampleRate * 0.08);
        const hopSize = Math.floor(sampleRate * 0.04);

        const energies = [];
        for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
            let energy = 0;
            for (let j = 0; j < windowSize; j++) {
                energy += Math.abs(channelData[i + j]);
            }
            energies.push(energy / windowSize);
        }

        const difficultySettings = this.timingWindows[this.difficulty];
        const threshold = this.calculateDynamicThreshold(energies);

        const beats = [];
        const localWindowSize = 5;
        for (let i = localWindowSize; i < energies.length - localWindowSize; i++) {
            const localEnergy = energies[i];
            let isLocalMax = true;
            for (let j = i - localWindowSize; j <= i + localWindowSize; j++) {
                if (j !== i && energies[j] >= localEnergy) {
                    isLocalMax = false;
                    break;
                }
            }
            if (isLocalMax && localEnergy > threshold) {
                const time = (i * hopSize) / sampleRate;
                beats.push({ time, energy: localEnergy });
            }
        }

        // This is the ONLY thing that changes with difficulty
        const filteredBeats = this.filterBeats(beats, difficultySettings.minInterval);

        filteredBeats.forEach((beat, index) => {
            const fret = this.selectFret(beat.energy, index);
            notes.push({
                id: index,
                time: beat.time,
                fret: fret,
                energy: beat.energy,
                hit: false,
                missed: false
            });
        });

        return notes;
    }

    calculateDynamicThreshold(energies) {
        const windowSize = 50;
        const thresholds = [];
        for (let i = 0; i < energies.length; i++) {
            let sum = 0, count = 0;
            for (let j = Math.max(0, i - windowSize); j <= Math.min(energies.length - 1, i + windowSize); j++) {
                sum += energies[j];
                count++;
            }
            thresholds.push(sum / count);
        }
        const meanThreshold = thresholds.reduce((a, b) => a + b, 0) / thresholds.length;
        return meanThreshold * 1.3; // Fixed multiplier — no per-difficulty variation
    }

    filterBeats(beats, minInterval) {
        const filtered = [];
        let lastTime = -minInterval;
        beats.forEach(beat => {
            if (beat.time - lastTime >= minInterval) {
                filtered.push(beat);
                lastTime = beat.time;
            }
        });
        return filtered;
    }

    selectFret(energy, index) {
        const fretIndex = Math.floor((energy + index * 0.15) * 7) % 5;
        return this.frets[fretIndex];
    }

    // ===================================
    // Game Loop & Core Logic (unchanged except using fixed speed/timing)
    // ===================================
    startGame() {
        this.isPlaying = true;
        this.isPaused = false;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.multiplier = 1;
        this.perfectHits = this.greatHits = this.goodHits = this.misses = 0;
        this.activeNotes = [];

        this.notes.forEach(note => { note.hit = false; note.missed = false; });

        this.updateHUD();
        this.updateMultiplierColor();

        if (this.isCustomSong) this.levelNumberTop.textContent = 'CUSTOM';
        else this.levelNumberTop.textContent = this.currentLevel;

        this.mainMenu.classList.add('hidden');
        this.gameContainer.classList.remove('hidden');
        this.setCharacterState('idle');

        this.playAudio();
        this.gameLoop();
    }

    playAudio() {
        this.audioSource = this.audioContext.createBufferSource();
        this.audioSource.buffer = this.audioBuffer;

        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.audioData = new Uint8Array(this.analyser.frequencyBinCount);

        this.audioSource.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        this.startTime = this.audioContext.currentTime;
        this.audioSource.start(0);

        this.audioSource.onended = () => {
            if (this.isPlaying && !this.isPaused) this.endGame();
        };
    }

    gameLoop() {
        if (!this.isPlaying || this.isPaused) return;

        const currentTime = this.audioContext.currentTime - this.startTime;
        const performanceTime = performance.now();

        this.detectBeat(performanceTime);
        this.updateMapScroll(performanceTime);
        this.spawnNotes(currentTime);
        this.updateNotes(currentTime);
        this.updateProgress(currentTime);
        this.render();

        requestAnimationFrame(() => this.gameLoop());
    }

    spawnNotes(currentTime) {
        const noteLeadTime = 2.0;
        this.notes.forEach(note => {
            if (!note.hit && !note.missed && !this.activeNotes.includes(note) &&
                note.time <= currentTime + noteLeadTime && note.time > currentTime) {
                this.activeNotes.push(note);
                this.createNoteElement(note);
            }
        });
    }

    updateNotes(currentTime) {
        const timing = this.timingWindows[this.difficulty];
        this.activeNotes.forEach(note => {
            if (note.hit || note.missed) return;
            const timeDiff = note.time - currentTime;
            if (timeDiff < -timing.good / 1000) {
                this.missNote(note);
            }
        });

        this.activeNotes = this.activeNotes.filter(note =>
            !note.missed || this.noteHighway.contains(note.element)
        );
    }

    createNoteElement(note) {
        const element = document.createElement('div');
        element.className = `note ${note.fret}`;
        element.dataset.noteId = note.id;

        const lane = document.querySelector(`.fret-lane[data-fret="${note.fret}"]`);
        const laneRect = lane.getBoundingClientRect();
        const highwayRect = this.noteHighway.getBoundingClientRect();

        element.style.left = (laneRect.left - highwayRect.left + laneRect.width / 2) + 'px';
        element.style.top = this.noteSpawnY + 'px';

        note.element = element;
        this.noteHighway.appendChild(element);
    }

    render() {
        const currentTime = this.audioContext.currentTime - this.startTime;
        const noteLeadTime = 2.0;

        this.activeNotes.forEach(note => {
            if (!note.element) return;
            const timeToTarget = note.time - currentTime;
            const progress = 1 - (timeToTarget / noteLeadTime);
            const y = this.noteSpawnY + progress * (this.targetY - this.noteSpawnY);
            note.element.style.top = y + 'px';
        });
    }

    updateProgress(currentTime) {
        const progress = Math.min(currentTime / this.duration, 1);
        this.progressFill.style.width = (progress * 100) + '%';
    }

    // Input, scoring, visuals, menus — unchanged from original (cleaned syntax)
    handleKeyDown(event) {
        const key = event.key.toLowerCase();
        const fretIndex = this.fretKeys.indexOf(key);
        if (fretIndex !== -1) {
            const fret = this.frets[fretIndex];
            this.handleFretPress(fret);
            this.animateFretButton(fret);
        }
    }

    handleKeyUp(event) {
        const key = event.key.toLowerCase();
        const fretIndex = this.fretKeys.indexOf(key);
        if (fretIndex !== -1) {
            this.animateFretButtonRelease(this.frets[fretIndex]);
        }
    }

    handleFretPress(fret) {
        if (!this.isPlaying || this.isPaused) return;
        const currentTime = this.audioContext.currentTime - this.startTime;
        const timing = this.timingWindows[this.difficulty];

        const closestNote = this.activeNotes
            .filter(n => n.fret === fret && !n.hit && !n.missed)
            .sort((a, b) => Math.abs(a.time - currentTime) - Math.abs(b.time - currentTime))[0];

        if (closestNote) {
            const timeDiff = Math.abs(closestNote.time - currentTime) * 1000;
            if (timeDiff <= timing.good) {
                let hitType = timeDiff <= timing.perfect ? 'perfect' :
                              timeDiff <= timing.great ? 'great' : 'good';
                this.hitNote(closestNote, hitType);
            }
        }
    }

    animateFretButton(fret) {
        const button = this.fretButtons[fret];
        button.classList.add('pressed');
        setTimeout(() => button.classList.remove('pressed'), 100);
    }

    animateFretButtonRelease(fret) {
        this.fretButtons[fret].classList.remove('pressed');
    }

    hitNote(note, hitType) {
        note.hit = true;
        const points = { perfect: 100, great: 75, good: 50 };
        this.score += points[hitType] * this.multiplier;
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        this.updateMultiplier();

        if (hitType === 'perfect') this.perfectHits++;
        else if (hitType === 'great') this.greatHits++;
        else this.goodHits++;

        this.setCharacterState('hit');
        this.activateCharacterAura();
        this.showHitFeedback(hitType);
        this.animateNoteHit(note);
        this.triggerMultiplierHitEffect();
        this.updateHUD();

        const idx = this.activeNotes.indexOf(note);
        if (idx > -1) this.activeNotes.splice(idx, 1);

        setTimeout(() => {
            if (note.element?.parentNode) note.element.parentNode.removeChild(note.element);
        }, 200);
    }

    missNote(note) {
        note.missed = true;
        this.combo = 0;
        this.multiplier = 1;
        this.misses++;
        this.setCharacterState('miss');
        this.showMissFeedback();
        this.animateNoteMiss(note);
        this.updateHUD();
        this.updateMultiplierColor();

        setTimeout(() => {
            if (note.element?.parentNode) note.element.parentNode.removeChild(note.element);
        }, 300);
    }

    updateMultiplier() {
        if (this.combo >= 40) this.multiplier = 4;
        else if (this.combo >= 20) this.multiplier = 3;
        else if (this.combo >= 10) this.multiplier = 2;
        else this.multiplier = 1;
        this.updateMultiplierColor();
    }

    updateMultiplierColor() {
        this.multiplierPulse.classList.remove('x1', 'x2', 'x3', 'x4');
        this.multiplierPulse.classList.add(`x${this.multiplier}`);
    }

    triggerMultiplierHitEffect() {
        this.multiplierPulse.classList.add('hit-active');
        setTimeout(() => this.multiplierPulse.classList.remove('hit-active'), 150);
    }

    updateHUD() {
        this.scoreValue.textContent = this.score.toLocaleString();
        this.multiplierValue.textContent = this.multiplier;
        this.comboValue.textContent = this.combo;
    }

    showHitFeedback(hitType) {
        const feedback = document.createElement('div');
        feedback.className = `hit-feedback ${hitType}`;
        feedback.textContent = hitType.toUpperCase();
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 500);
    }

    showMissFeedback() {
        const darken = document.createElement('div');
        darken.className = 'screen-darken';
        document.body.appendChild(darken);
        setTimeout(() => darken.remove(), 300);
    }

    animateNoteHit(note) {
        if (note.element) note.element.classList.add('hit');
        const flash = document.createElement('div');
        flash.className = 'screen-flash';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 100);
    }

    animateNoteMiss(note) {
        if (note.element) note.element.classList.add('miss');
    }

    setCharacterState(state) {
        this.character.classList.remove(this.characterState);
        this.characterState = state;
        this.character.classList.add(state);
        if (state === 'hit' || state === 'miss' || state === 'groove') {
            setTimeout(() => this.setCharacterState('idle'), 300);
        }
    }

    animateCharacterToBeat() {
        if (this.combo > 5 && this.characterState === 'idle') {
            this.setCharacterState('groove');
        }
    }

    activateCharacterAura() {
        if (this.characterAura) {
            this.characterAura.classList.add('active');
            setTimeout(() => this.characterAura.classList.remove('active'), 500);
        }
    }

    updateMapScroll(currentTime) {
        const deltaTime = currentTime - this.lastScrollTime;
        const scrollSpeed = 0.02 + (this.currentLevel * 0.005);

        this.scrollPositions.layer1 = (this.scrollPositions.layer1 + scrollSpeed * 0.1) % 100;
        this.scrollPositions.layer2 = (this.scrollPositions.layer2 + scrollSpeed * 0.3) % 100;
        this.scrollPositions.layer3 = (this.scrollPositions.layer3 + scrollSpeed * 0.5) % 100;
        this.scrollPositions.layer4 = (this.scrollPositions.layer4 + scrollSpeed * 0.8) % 100;

        Object.keys(this.parallaxLayers).forEach((key, i) => {
            const layer = this.parallaxLayers[key];
            if (layer) layer.style.transform = `translateX(-${this.scrollPositions[key]}%)`;
        });

        this.lastScrollTime = currentTime;
    }

    detectBeat(currentTime) {
        if (!this.analyser || !this.audioData) return false;
        this.analyser.getByteFrequencyData(this.audioData);

        let bassSum = 0;
        const bassRange = this.audioData.slice(0, 20);
        for (let i = 0; i < bassRange.length; i++) bassSum += bassRange[i];
        const normalizedBass = (bassSum / bassRange.length) / 255;

        if (normalizedBass > 0.35 && (currentTime - this.lastBeatTime > 0.15)) {
            this.lastBeatTime = currentTime;
            this.triggerBeatReactiveVisuals(normalizedBass);
            return true;
        }
        return false;
    }

    triggerBeatReactiveVisuals(intensity) {
        if (this.beatGlow) {
            this.beatGlow.classList.add('active');
            setTimeout(() => this.beatGlow.classList.remove('active'), 80);
        }
        this.animateCharacterToBeat();
        if (intensity > 0.6) this.activateCharacterAura();

        if (this.multiplierPulse) {
            this.multiplierPulse.classList.add('beat-active');
            setTimeout(() => this.multiplierPulse.classList.remove('beat-active'), 80);
        }
    }

    getDifficultyForLevel(level) {
        if (level <= 10) return 'easy';
        if (level <= 20) return 'medium';
        if (level <= 35) return 'hard';
        if (level <= 45) return 'expert';
        return 'master';
    }

    setDifficulty(level) {
        this.difficulty = level;
        this.hideSettings();
        this.songDifficulty.textContent = `Difficulty: ${level.charAt(0).toUpperCase() + level.slice(1)}`;
        alert(`Difficulty set to ${level.toUpperCase()}`);

        if (this.isPlaying && this.isCustomSong) {
            this.analyzeAudioAndGenerateNotes(); // Regenerate with new density
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.audioContext.suspend();
            this.pauseMenu.classList.add('active');
        } else {
            this.audioContext.resume();
            this.pauseMenu.classList.remove('active');
            this.gameLoop();
        }
    }

    resumeGame() { if (this.isPaused) this.togglePause(); }

    restartSong() {
        this.cleanup();
        this.pauseMenu.classList.remove('active');
        this.songCompleteMenu.classList.remove('active');
        this.startGame();
    }

    playNextLevel() {
        if (this.currentLevel < this.maxLevel) {
            this.currentLevel++;
            this.cleanup();
            this.songCompleteMenu.classList.remove('active');
            this.difficulty = this.getDifficultyForLevel(this.currentLevel);
            this.playCutscene(this.currentLevel).then(() => this.loadLevelAudio(this.currentLevel));
        } else {
            alert('You have completed all levels! Congratulations!');
            this.returnToMenu();
        }
    }

    endGame() {
        this.isPlaying = false;
        this.cleanup();
        this.showSongComplete();
    }

    returnToMenu() {
        this.isPlaying = false;
        this.cleanup();
        this.pauseMenu.classList.remove('active');
        this.songCompleteMenu.classList.remove('active');
        this.settingsMenu.classList.remove('active');
        this.gameContainer.classList.add('hidden');
        this.mainMenu.classList.remove('hidden');
        this.uploadButton.textContent = '🎵 Upload Audio File';
        this.uploadButton.disabled = false;
    }

    cleanup() {
        if (this.audioSource) {
            this.audioSource.stop();
            this.audioSource.disconnect();
        }
        this.activeNotes.forEach(note => {
            if (note.element?.parentNode) note.element.parentNode.removeChild(note.element);
        });
        this.activeNotes = [];
    }

    showSettings() { this.settingsMenu.classList.add('active'); }
    hideSettings() { this.settingsMenu.classList.remove('active'); }

    showSongComplete() {
        document.getElementById('finalScoreValue').textContent = this.score.toLocaleString();
        document.getElementById('perfectCount').textContent = this.perfectHits;
        document.getElementById('greatCount').textContent = this.greatHits;
        document.getElementById('goodCount').textContent = this.goodHits;
        document.getElementById('missCount').textContent = this.misses;
        document.getElementById('maxComboValue').textContent = this.maxCombo;
        this.songCompleteMenu.classList.add('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new NeonNightmare();
});
