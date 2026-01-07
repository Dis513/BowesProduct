// ==================================
// NEON NIGHTMARE - Game Engine
// Level Select & Cutscene Version 
// ==================================

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
        this.beatThreshold = 0.3;
        
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
        this.noteSpeed = 3;
        this.noteSpawnY = -50;
        this.targetY = 0;
        
        // Health System
        this.maxHealth = 100;
        this.currentHealth = 100;
        this.healthDrainAmount = 10;
        
        // Difficulty-based health drain values
        this.healthDrainByDifficulty = {
            easy: 5,
            medium: 10,
            hard: 15,
            expert: 20,
            master: 25
        };
        
        // Combo note counts by difficulty
        this.maxComboNotesByDifficulty = {
            easy: 2,
            medium: 2,
            hard: 3,
            expert: 3,
            master: 4
        };
        
        // Fret Configuration
        this.frets = ['green', 'red', 'yellow', 'blue', 'orange'];
        this.fretKeys = ['a', 's', 'd', 'f', 'g'];
        this.fretButtons = {};
        
        // Statistics
        this.perfectHits = 0;
        this.greatHits = 0;
        this.goodHits = 0;
        this.misses = 0;
        
        // Timing Windows (in milliseconds) - Consistent across difficulties
        this.timingWindows = {
            perfect: 50,
            great: 100,
            good: 150
        };
        
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
        // Menu Elements
        this.mainMenu = document.getElementById('mainMenu');
        this.gameContainer = document.getElementById('gameContainer');
        this.pauseMenu = document.getElementById('pauseMenu');
        this.settingsMenu = document.getElementById('settingsMenu');
        this.songCompleteMenu = document.getElementById('songCompleteMenu');
        this.levelSelectMenu = document.getElementById('levelSelectMenu');
        
        // File Upload Elements
        this.uploadButton = document.getElementById('uploadButton');
        this.audioFileInput = document.getElementById('audioFileInput');
        this.uploadInfo = document.getElementById('uploadInfo');
        
        // Cutscene Elements
        this.cutsceneContainer = document.getElementById('cutsceneContainer');
        this.cutsceneVideo = document.getElementById('cutsceneVideo');
        this.skipCutsceneButton = document.getElementById('skipCutscene');
        
        // HUD Elements
        this.scoreValue = document.getElementById('scoreValue');
        this.multiplierValue = document.getElementById('multiplierValue');
        this.multiplierPulse = document.getElementById('multiplierPulse');
        this.comboValue = document.getElementById('comboValue');
        this.comboDisplay = document.getElementById('comboDisplay');
        this.progressFill = document.getElementById('progressFill');
        this.songTitle = document.getElementById('songTitle');
        this.songArtist = document.getElementById('songArtist');
        
        // Level Elements
        this.levelNumber = document.getElementById('levelNumber');
        this.levelGrid = document.getElementById('levelGrid');
        
        // Game Elements
        this.noteHighway = document.getElementById('noteHighway');
        this.targetLine = document.getElementById('targetLine');
        this.beatGlow = document.getElementById('beatGlow');
        
        // Fret Buttons
        this.frets.forEach((fret, index) => {
            this.fretButtons[fret] = document.querySelector(`.fret-button.${fret}`);
        });
        
        // Calculate target line position
        setTimeout(() => {
            this.calculateTargetY();
        }, 100);
    }

    initializeCharacter() {
        // Create character DOM element
        this.character = document.getElementById('character');
        this.characterSprite = document.getElementById('characterSprite');
        this.characterAura = document.getElementById('characterAura');
        
        // Set initial state
        this.setCharacterState('idle');
    }

    initializeMap() {
        // Initialize parallax layers
        this.parallaxLayers = {
            layer1: document.getElementById('parallaxLayer1'),
            layer2: document.getElementById('parallaxLayer2'),
            layer3: document.getElementById('parallaxLayer3'),
            layer4: document.getElementById('parallaxLayer4')
        };
        
        // Set initial scroll positions
        this.lastScrollTime = performance.now();
        
        // Add resize listener to recalculate target position
        window.addEventListener('resize', () => this.calculateTargetY());
    }
    
    calculateTargetY() {
        if (!this.noteHighway) return;
        
        // Get the target line element to find its actual position
        const targetLine = document.getElementById('targetLine');
        if (targetLine) {
            const highwayRect = this.noteHighway.getBoundingClientRect();
            const targetRect = targetLine.getBoundingClientRect();
            
            // Calculate target Y relative to the highway top
            this.targetY = targetRect.top - highwayRect.top;
            
            console.log(`Target Y calculated: ${this.targetY}px, Highway height: ${this.noteHighway.offsetHeight}px`);
        } else {
            // Fallback calculation
            this.targetY = this.noteHighway.offsetHeight - 150;
            console.log(`Target Y fallback: ${this.targetY}px`);
        }
    }

    setupEventListeners() {
        // File Upload
        this.uploadButton = document.getElementById('uploadButton');
        this.audioFileInput = document.getElementById('audioFileInput');
        this.uploadButton.addEventListener('click', () => this.audioFileInput.click());
        this.audioFileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Menu Buttons
        document.getElementById('selectLevel').addEventListener('click', () => this.showLevelSelect());
        document.getElementById('openSettings').addEventListener('click', () => this.showSettings());
        document.getElementById('viewLeaderboards').addEventListener('click', () => this.showLeaderboards());
        document.getElementById('backToMainMenu').addEventListener('click', () => this.hideLevelSelect());
        
        // Pause Menu
        document.getElementById('resumeGame').addEventListener('click', () => this.resumeGame());
        document.getElementById('restartSong').addEventListener('click', () => this.restartSong());
        document.getElementById('returnToMenu').addEventListener('click', () => this.returnToMenu());
        
        // Settings
        document.getElementById('setDifficultyEasy').addEventListener('click', () => this.setDifficulty('easy'));
        document.getElementById('setDifficultyMedium').addEventListener('click', () => this.setDifficulty('medium'));
        document.getElementById('setDifficultyHard').addEventListener('click', () => this.setDifficulty('hard'));
        document.getElementById('setDifficultyExpert').addEventListener('click', () => this.setDifficulty('expert'));
        document.getElementById('setDifficultyMaster').addEventListener('click', () => this.setDifficulty('master'));
        document.getElementById('closeSettings').addEventListener('click', () => this.hideSettings());
        
        // Song Complete
        document.getElementById('playAgain').addEventListener('click', () => this.restartSong());
        document.getElementById('nextLevel').addEventListener('click', () => this.playNextLevel());
        document.getElementById('selectLevelFromComplete').addEventListener('click', () => this.showLevelSelect());
        document.getElementById('mainMenuFromComplete').addEventListener('click', () => this.returnToMenu());
        
        // Game Over
        document.getElementById('restartFromGameOver').addEventListener('click', () => this.restartSong());
        document.getElementById('uploadFromGameOver').addEventListener('click', () => {
            this.returnToMenu();
            this.uploadButton.click();
        });
        document.getElementById('mainMenuFromGameOver').addEventListener('click', () => this.returnToMenu());
        
        // File Upload
        document.getElementById('uploadNewSong')?.addEventListener('click', () => {
            this.returnToMenu();
            this.uploadButton.click();
        });
        
        // Cutscene
        this.skipCutsceneButton.addEventListener('click', () => this.skipCutscene());
        this.cutsceneVideo.addEventListener('ended', () => this.onCutsceneEnded());
        
        // Keyboard Controls
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Fret Button Controls
        this.frets.forEach((fret, index) => {
            const button = this.fretButtons[fret];
            button.addEventListener('mousedown', () => this.handleFretPress(fret));
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleFretPress(fret);
            });
        });
        
        // Pause Toggle (Escape key)
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
            
            // Random colors
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
            
            // Add difficulty class based on level
            if (i <= 10) {
                levelItem.classList.add('easy');
            } else if (i <= 20) {
                levelItem.classList.add('medium');
            } else if (i <= 35) {
                levelItem.classList.add('hard');
            } else if (i <= 45) {
                levelItem.classList.add('expert');
            } else {
                levelItem.classList.add('master');
            }
            
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

    async async selectLevel(level) {
        this.currentLevel = level;
        this.hideLevelSelect();
        
        // Set difficulty based on level
        this.difficulty = this.getDifficultyForLevel(level);
        
        // Set playing to false before loading
        this.isPlaying = false;
        
        // Load audio first (without starting)
        await this.loadLevelAudio(level);
        
        // Then play cutscene
        await this.playCutscene(level);
        
        // Start game after cutscene
        this.startGame();
    }

    // ===================================
    // Cutscene System
    // ===================================

    async playCutscene(level) {
        const cutsceneUrl = `Level${level}.mp4`;
        
        try {
            // Try to load cutscene
            this.cutsceneVideo.src = cutsceneUrl;
            this.cutsceneContainer.classList.add('active');
            this.isCutscenePlaying = true;
            
            // Wait for video to be ready
            await new Promise((resolve, reject) => {
                this.cutsceneVideo.onloadeddata = resolve;
                this.cutsceneVideo.onerror = reject;
                
                // Timeout if video doesn't exist
                setTimeout(() => reject(new Error('Cutscene not found')), 2000);
            });
            
            // Play video
            await this.cutsceneVideo.play();
            
        } catch (error) {
            // Cutscene doesn't exist, skip to game
            console.log('Cutscene not found, skipping to game');
            this.isCutscenePlaying = false;
            this.cutsceneContainer.classList.remove('active');
        }
    }

    onCutsceneEnded() {
        this.isCutscenePlaying = false;
        this.cutsceneContainer.classList.remove('active');
        // Start game after cutscene ends
        if (!this.isPlaying && this.audioBuffer) {
            this.startGame();
        }
    }

    skipCutscene() {
        if (this.isCutscenePlaying) {
            this.cutsceneVideo.pause();
            this.cutsceneVideo.currentTime = 0;
            this.cutsceneContainer.classList.remove('active');
            this.isCutscenePlaying = false;
            // Start game after skipping cutscene
            if (!this.isPlaying && this.audioBuffer) {
                this.startGame();
            }
        }
    }

    // ===================================
    // Audio Loading
    // ===================================

    async loadLevelAudio(level) {
        const audioUrl = `Level${level}.mp3`;
        
        try {
            // Initialize Audio Context if needed
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            await this.audioContext.resume();
            
            // Update song info
            this.songTitle.textContent = `Level ${level}`;
            this.songArtist.textContent = this.difficulty.toUpperCase();
            
            // Set note speed and health drain based on difficulty
            this.setNoteSpeedForDifficulty();
            
            // Load audio file
            const response = await fetch(audioUrl);
            
            if (!response.ok) {
                throw new Error(`Audio file not found: ${audioUrl}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.duration = this.audioBuffer.duration;
            
            // Analyze audio and generate notes
            await this.analyzeAudioAndGenerateNotes();
            
            // Don't start game here - wait for cutscene to finish
            
        } catch (error) {
            console.error('Error loading audio:', error);
            alert(`Error: Could not load Level ${level}.mp3\n\nPlease ensure Level${level}.mp3 is in the same directory as the game.`);
            this.returnToMenu();
        }
    }

    // ===================================
    // File Upload & Audio Processing
    // ===================================

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        this.uploadButton.textContent = '⏳ Processing...';
        this.uploadButton.disabled = true;
        
        try {
            // Initialize Audio Context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Read file
            const arrayBuffer = await file.arrayBuffer();
            
            // Decode audio
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.duration = this.audioBuffer.duration;
            
            // Update song info
            this.songTitle.textContent = file.name.replace(/\.[^/.]+$/, '');
            this.songArtist.textContent = 'Custom Track';
            
            // Set difficulty to medium for custom tracks (can be changed in settings)
            this.difficulty = 'medium';
            this.currentLevel = 0;
            
            // Set note speed based on difficulty
            this.setNoteSpeedForDifficulty();
            
            // Analyze audio and generate notes
            await this.analyzeAudioAndGenerateNotes();
            
            // Start game immediately for custom songs (no cutscene)
            this.startGame();
            
        } catch (error) {
            console.error('Error processing audio:', error);
            alert('Error processing audio file. Please try a different file.');
            this.uploadButton.textContent = '🎵 Upload Audio File';
            this.uploadButton.disabled = false;
        }
    }

    // ===================================
    // Character System
    // ===================================

    setCharacterState(state) {
        // Remove old state
        this.character.classList.remove(this.characterState);
        
        // Set new state
        this.characterState = state;
        this.character.classList.add(state);
        
        // Reset after animation
        if (state === 'hit' || state === 'miss' || state === 'groove') {
            setTimeout(() => {
                this.setCharacterState('idle');
            }, 300);
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
            setTimeout(() => {
                this.characterAura.classList.remove('active');
            }, 500);
        }
    }

    // ===================================
    // Map System
    // ===================================

    updateMapScroll(currentTime) {
        const deltaTime = currentTime - this.lastScrollTime;
        const scrollSpeed = 0.02 + (this.currentLevel * 0.005);
        
        // Update parallax layers with different speeds
        this.scrollPositions.layer1 = (this.scrollPositions.layer1 + scrollSpeed * 0.1) % 100;
        this.scrollPositions.layer2 = (this.scrollPositions.layer2 + scrollSpeed * 0.3) % 100;
        this.scrollPositions.layer3 = (this.scrollPositions.layer3 + scrollSpeed * 0.5) % 100;
        this.scrollPositions.layer4 = (this.scrollPositions.layer4 + scrollSpeed * 0.8) % 100;
        
        // Apply transforms
        if (this.parallaxLayers.layer1) {
            this.parallaxLayers.layer1.style.transform = `translateX(${this.scrollPositions.layer1}%)`;
        }
        if (this.parallaxLayers.layer2) {
            this.parallaxLayers.layer2.style.transform = `translateX(${this.scrollPositions.layer2}%)`;
        }
        if (this.parallaxLayers.layer3) {
            this.parallaxLayers.layer3.style.transform = `translateX(${this.scrollPositions.layer3}%)`;
        }
        if (this.parallaxLayers.layer4) {
            this.parallaxLayers.layer4.style.transform = `translateX(${this.scrollPositions.layer4}%)`;
        }
        
        this.lastScrollTime = currentTime;
    }

    // ===================================
    // Level System
    // ===================================

    getDifficultyForLevel(level) {
        if (level <= 10) return 'easy';
        if (level <= 20) return 'medium';
        if (level <= 35) return 'hard';
        if (level <= 45) return 'expert';
        return 'master';
    }
    
    setNoteSpeedForDifficulty() {
        const speedMultipliers = {
            easy: 2.5,
            medium: 3.0,
            hard: 3.8,
            expert: 4.5,
            master: 5.2
        };
        this.noteSpeed = speedMultipliers[this.difficulty] || 3.0;
        
        // Set health drain based on difficulty
        this.healthDrainAmount = this.healthDrainByDifficulty[this.difficulty] || 10;
        
        console.log(`Difficulty: ${this.difficulty}, Note Speed: ${this.noteSpeed}, Health Drain: ${this.healthDrainAmount}`);
    }

    // ===================================
    // Beat-reactive Visuals
    // ===================================

    detectBeat(currentTime) {
        if (!this.analyser || !this.audioData) return false;
        
        // Get frequency data
        this.analyser.getByteFrequencyData(this.audioData);
        
        // Calculate average volume for low frequencies (bass)
        let bassSum = 0;
        const bassRange = this.audioData.slice(0, 10);
        
        for (let i = 0; i < bassRange.length; i++) {
            bassSum += bassRange[i];
        }
        
        const bassAverage = bassSum / bassRange.length;
        const normalizedBass = bassAverage / 255;
        
        // Check for beat
        const isBeat = normalizedBass > this.beatThreshold;
        
        if (isBeat && (currentTime - this.lastBeatTime > 0.2)) {
            this.lastBeatTime = currentTime;
            this.triggerBeatReactiveVisuals(normalizedBass);
            return true;
        }
        
        return false;
    }

    triggerBeatReactiveVisuals(intensity) {
        // Beat glow effect
        if (this.beatGlow) {
            this.beatGlow.classList.add('active');
            setTimeout(() => {
                this.beatGlow.classList.remove('active');
            }, 100);
        }
        
        // Character reacts to beat
        this.animateCharacterToBeat();
        
        // Activate character aura on strong beats
        if (intensity > 0.6) {
            this.activateCharacterAura();
        }
        
        // Pulse multiplier to beat
        if (this.multiplierPulse) {
            this.multiplierPulse.classList.add('beat-active');
            setTimeout(() => {
                this.multiplierPulse.classList.remove('beat-active');
            }, 150);
        }
    }

    // ===================================
    // Audio Analysis
    // ===================================

    async analyzeAudioAndGenerateNotes() {
        // Get audio data for analysis
        const channelData = this.audioBuffer.getChannelData(0);
        const sampleRate = this.audioBuffer.sampleRate;
        
        // Analyze to detect beats and generate notes
        this.notes = this.generateNotesFromAudio(channelData, sampleRate);
        
        console.log(`Generated ${this.notes.length} notes`);
    }

    generateNotesFromAudio(channelData, sampleRate) {
        const notes = [];
        const windowSize = Math.floor(sampleRate * 0.1);
        const hopSize = Math.floor(sampleRate * 0.05);
        
        // Calculate energy for each window
        const energies = [];
        for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
            let energy = 0;
            for (let j = 0; j < windowSize; j++) {
                energy += Math.abs(channelData[i + j]);
            }
            energies.push(energy / windowSize);
        }
        
        // Find peaks (beats) using simple thresholding
        const threshold = this.calculateThreshold(energies);
        const beats = [];
        
        for (let i = 1; i < energies.length - 1; i++) {
            if (energies[i] > threshold && 
                energies[i] > energies[i - 1] && 
                energies[i] > energies[i + 1]) {
                const time = (i * hopSize) / sampleRate;
                beats.push({
                    time: time,
                    energy: energies[i]
                });
            }
        }
        
        // Filter beats based on difficulty and level
        const minBeatInterval = this.getMinBeatInterval();
        const filteredBeats = this.filterBeats(beats, minBeatInterval);
        
        // Generate notes from beats
        let noteId = 0;
        filteredBeats.forEach((beat, index) => {
            // Determine if this should be a combo note (multiple notes at once)
            const isComboNote = Math.random() < 0.15; // 15% chance of combo note
            const maxComboNotes = this.maxComboNotesByDifficulty[this.difficulty] || 2;
            
            if (isComboNote) {
                // Generate multiple notes for combo
                const comboCount = Math.min(2 + Math.floor(Math.random() * (maxComboNotes - 1)), maxComboNotes);
                const selectedFrets = [];
                
                // Select unique frets for the combo
                while (selectedFrets.length < comboCount) {
                    const fret = this.selectFret(beat.energy, index + selectedFrets.length);
                    if (!selectedFrets.includes(fret)) {
                        selectedFrets.push(fret);
                    }
                }
                
                // Create notes for each fret in the combo
                selectedFrets.forEach(fret => {
                    notes.push({
                        id: noteId++,
                        time: beat.time,
                        fret: fret,
                        energy: beat.energy,
                        hit: false,
                        missed: false,
                        isCombo: true,
                        comboId: noteId // All notes in this combo share the same comboId
                    });
                });
            } else {
                // Determine if this should be a hold note (10% chance)
                const isHoldNote = Math.random() < 0.1;
                const fret = this.selectFret(beat.energy, index);
                
                notes.push({
                    id: noteId++,
                    time: beat.time,
                    fret: fret,
                    energy: beat.energy,
                    hit: false,
                    missed: false,
                    isHold: isHoldNote,
                    holdDuration: isHoldNote ? 0.3 + Math.random() * 0.5 : 0 // Hold for 300-800ms
                });
            }
        });
        
        return notes;
    }

    calculateThreshold(energies) {
        const mean = energies.reduce((a, b) => a + b, 0) / energies.length;
        const stdDev = Math.sqrt(
            energies.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / energies.length
        );
        
        // Lower threshold for harder difficulties = more notes
        const thresholdMultipliers = {
            easy: 0.7,
            medium: 0.5,
            hard: 0.4,
            expert: 0.3,
            master: 0.2
        };
        const multiplier = thresholdMultipliers[this.difficulty] || 0.5;
        
        return mean + stdDev * multiplier;
    }

    getMinBeatInterval() {
        const intervals = {
            easy: 0.5,
            medium: 0.35,
            hard: 0.25,
            expert: 0.18,
            master: 0.12
        };
        return intervals[this.difficulty] || 0.35;
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
        // Use energy and index to select fret for variety
        const fretIndex = Math.floor((energy + index * 0.1) * 7) % 5;
        return this.frets[fretIndex];
    }

    // ===================================
    // Game Loop & Rendering
    // ===================================

    startGame() {
        // Prevent starting if already playing
        if (this.isPlaying) {
            console.log('Game already playing, not starting again');
            return;
        }
        
        this.isPlaying = true;
        this.isPaused = false;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.multiplier = 1;
        this.perfectHits = 0;
        this.greatHits = 0;
        this.goodHits = 0;
        this.misses = 0;
        this.activeNotes = [];
        this.currentHealth = this.maxHealth;
        
        // Recalculate target position when game starts
        this.calculateTargetY();
        
        // Reset notes
        this.notes.forEach(note => {
            note.hit = false;
            note.missed = false;
            note.holdStarted = false;
            note.holdCompleted = false;
        });
        
        // Update UI
        this.updateHUD();
        this.updateHealthBar();
        this.levelNumber.textContent = this.currentLevel;
        this.mainMenu.classList.add('hidden');
        this.gameContainer.classList.remove('hidden');
        
        // Set character to idle
        this.setCharacterState('idle');
        
        // Start audio
        this.playAudio();
        
        // Start game loop
        this.gameLoop();
    }

    playAudio() {
        this.audioSource = this.audioContext.createBufferSource();
        this.audioSource.buffer = this.audioBuffer;
        
        // Create analyser for visualizations
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.audioData = new Uint8Array(this.analyser.frequencyBinCount);
        
        // Connect nodes
        this.audioSource.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        
        this.startTime = this.audioContext.currentTime;
        this.audioSource.start(0);
        
        // Handle song end
        this.audioSource.onended = () => {
            if (this.isPlaying && !this.isPaused) {
                this.endGame();
            }
        };
    }

    gameLoop() {
        if (!this.isPlaying || this.isPaused) return;
        
        const currentTime = this.audioContext.currentTime - this.startTime;
        const performanceTime = performance.now();
        
        // Detect beats and trigger visuals
        this.detectBeat(performanceTime);
        
        // Update map scroll
        this.updateMapScroll(performanceTime);
        
        // Spawn notes
        this.spawnNotes(currentTime);
        
        // Update notes
        this.updateNotes(currentTime);
        
        // Update progress
        this.updateProgress(currentTime);
        
        // Render
        this.render();
        
        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }

    spawnNotes(currentTime) {
        const noteLeadTime = 2.0;
        
        this.notes.forEach(note => {
            if (!note.hit && !note.missed && 
                !this.activeNotes.includes(note) &&
                note.time <= currentTime + noteLeadTime &&
                note.time > currentTime) {
                this.activeNotes.push(note);
                this.createNoteElement(note);
            }
        });
    }

    updateNotes(currentTime) {
        this.activeNotes.forEach(note => {
            if (note.hit || note.missed) return;
            
            const timeDiff = note.time - currentTime;
            
            // Check for miss (but not for hold notes that were started)
            if (timeDiff < -this.timingWindows.good / 1000 && !note.isHold) {
                this.missNote(note);
            }
            
            // Check for hold note miss if not started
            if (note.isHold && timeDiff < -this.timingWindows.good / 1000 && !note.holdStarted) {
                this.missNote(note);
            }
        });
        
        // Remove inactive notes
        this.activeNotes = this.activeNotes.filter(note => 
            !note.missed || this.noteHighway.contains(note.element)
        );
    }

    createNoteElement(note) {
        const element = document.createElement('div');
        
        // Add appropriate classes based on note type
        let classes = `note ${note.fret}`;
        if (note.isHold) {
            classes += ' hold-note';
        }
        if (note.isCombo) {
            classes += ' combo-note';
        }
        
        element.className = classes;
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
            
            // Handle hold note height
            if (note.isHold && note.holdDuration > 0) {
                const holdProgress = Math.min(1, (currentTime - note.time) / note.holdDuration);
                const holdHeight = holdProgress * (this.targetY - this.noteSpawnY) * 0.5;
                note.element.style.height = (20 + holdHeight) + 'px';
            }
            
            // Check if hold note should end
            if (note.isHold && currentTime > note.time + note.holdDuration) {
                // Mark hold as completed if it was hit
                if (note.holdStarted && !note.holdCompleted) {
                    note.holdCompleted = true;
                    this.completeHoldNote(note);
                }
            }
        });
    }

    updateProgress(currentTime) {
        const progress = Math.min(currentTime / this.duration, 1);
        this.progressFill.style.width = (progress * 100) + '%';
    }

    // ===================================
    // Input Handling
    // ===================================

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
            const fret = this.frets[fretIndex];
            this.animateFretButtonRelease(fret);
        }
    }

    handleFretPress(fret) {
        if (!this.isPlaying || this.isPaused) return;
        
        const currentTime = this.audioContext.currentTime - this.startTime;
        
        // Find the closest note in this fret lane
        const closestNote = this.activeNotes
            .filter(note => note.fret === fret && !note.hit && !note.missed)
            .sort((a, b) => Math.abs(a.time - currentTime) - Math.abs(b.time - currentTime))[0];
        
        if (closestNote) {
            const timeDiff = Math.abs(closestNote.time - currentTime) * 1000;
            
            if (timeDiff <= this.timingWindows.good) {
                let hitType;
                if (timeDiff <= this.timingWindows.perfect) {
                    hitType = 'perfect';
                } else if (timeDiff <= this.timingWindows.great) {
                    hitType = 'great';
                } else {
                    hitType = 'good';
                }
                
                // Handle hold note start
                if (closestNote.isHold) {
                    closestNote.holdStarted = true;
                    this.hitNote(closestNote, hitType);
                } else {
                    // Regular note or combo note
                    this.hitNote(closestNote, hitType);
                }
            }
        }
    }

    animateFretButton(fret) {
        const button = this.fretButtons[fret];
        button.classList.add('pressed');
        setTimeout(() => button.classList.remove('pressed'), 100);
    }

    animateFretButtonRelease(fret) {
        const button = this.fretButtons[fret];
        button.classList.remove('pressed');
    }

    // ===================================
    // Scoring System
    // ===================================

    hitNote(note, hitType) {
        note.hit = true;
        
        // Calculate points (hold notes give more points)
        const points = {
            perfect: 100,
            great: 75,
            good: 50
        };
        
        let basePoints = points[hitType];
        if (note.isHold) {
            basePoints *= 1.5; // Hold notes give 50% more points
        }
        if (note.isCombo) {
            basePoints *= 1.3; // Combo notes give 30% more points
        }
        
        this.score += Math.floor(basePoints * this.multiplier);
        this.combo++;
        
        // Update max combo
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
        
        // Update multiplier
        this.updateMultiplier();
        
        // Update statistics
        if (hitType === 'perfect') this.perfectHits++;
        else if (hitType === 'great') this.greatHits++;
        else this.goodHits++;
        
        // Character animation
        this.setCharacterState('hit');
        this.activateCharacterAura();
        
        // Visual feedback
        this.showHitFeedback(hitType);
        this.animateNoteHit(note);
        
        // Update HUD
        this.updateHUD();
        
        // Remove note from active notes (unless it's a hold note in progress)
        if (!note.isHold || note.holdCompleted) {
            const index = this.activeNotes.indexOf(note);
            if (index > -1) {
                this.activeNotes.splice(index, 1);
            }
        }
        
        // Remove note element after animation
        setTimeout(() => {
            if (note.element && note.element.parentNode && (!note.isHold || note.holdCompleted)) {
                note.element.parentNode.removeChild(note.element);
            }
        }, 200);
    }
    
    completeHoldNote(note) {
        // Add bonus points for completing hold
        const bonusPoints = Math.floor(50 * this.multiplier);
        this.score += bonusPoints;
        this.updateHUD();
        
        // Visual feedback for completing hold
        this.showHitFeedback('perfect');
        
        // Remove from active notes
        const index = this.activeNotes.indexOf(note);
        if (index > -1) {
            this.activeNotes.splice(index, 1);
        }
        
        // Remove element
        setTimeout(() => {
            if (note.element && note.element.parentNode) {
                note.element.parentNode.removeChild(note.element);
            }
        }, 200);
    }

    missNote(note) {
        note.missed = true;
        this.combo = 0;
        this.multiplier = 1;
        this.misses++;
        
        // Drain health
        this.drainHealth();
        
        // Character animation
        this.setCharacterState('miss');
        
        // Visual feedback
        this.showMissFeedback();
        this.animateNoteMiss(note);
        
        // Update HUD
        this.updateHUD();
        
        // Remove note element after animation
        setTimeout(() => {
            if (note.element && note.element.parentNode) {
                note.element.parentNode.removeChild(note.element);
            }
        }, 300);
    }

    updateMultiplier() {
        if (this.combo >= 40) {
            this.multiplier = 4;
        } else if (this.combo >= 20) {
            this.multiplier = 3;
        } else if (this.combo >= 10) {
            this.multiplier = 2;
        } else {
            this.multiplier = 1;
        }
    }

    updateHUD() {
        this.scoreValue.textContent = this.score.toLocaleString();
        this.multiplierValue.textContent = this.multiplier;
        this.comboValue.textContent = this.combo;
    }
    
    drainHealth() {
        this.currentHealth = Math.max(0, this.currentHealth - this.healthDrainAmount);
        this.updateHealthBar();
        
        // Check for game over
        if (this.currentHealth <= 0) {
            this.triggerGameOver();
        }
    }
    
    updateHealthBar() {
        const healthBar = document.getElementById('healthBarFill');
        if (healthBar) {
            const percentage = (this.currentHealth / this.maxHealth) * 100;
            healthBar.style.width = percentage + '%';
            
            // Change color based on health level
            if (percentage > 60) {
                healthBar.style.background = 'linear-gradient(90deg, #00FFFF, #39FF14)';
            } else if (percentage > 30) {
                healthBar.style.background = 'linear-gradient(90deg, #FFFF00, #FFA500)';
            } else {
                healthBar.style.background = 'linear-gradient(90deg, #FF0000, #FF1493)';
            }
        }
        
        // Update health text
        const healthText = document.getElementById('healthValue');
        if (healthText) {
            healthText.textContent = Math.ceil(this.currentHealth);
        }
    }
    
    triggerGameOver() {
        this.isPlaying = false;
        
        // Stop audio
        if (this.audioSource) {
            this.audioSource.stop();
        }
        
        // Show game over screen
        this.showGameOver();
    }

    // ===================================
    // Visual Effects
    // ===================================

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
        
        // Trigger health drain on miss
        this.drainHealth();
        
        setTimeout(() => darken.remove(), 300);
    }

    animateNoteHit(note) {
        if (note.element) {
            note.element.classList.add('hit');
        }
        
        // Flash effect on target line
        const flash = document.createElement('div');
        flash.className = 'screen-flash';
        document.body.appendChild(flash);
        
        setTimeout(() => flash.remove(), 100);
    }

    animateNoteMiss(note) {
        if (note.element) {
            note.element.classList.add('miss');
        }
    }

    // ===================================
    // Game State Management
    // ===================================

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

    resumeGame() {
        if (this.isPaused) {
            this.togglePause();
        }
    }

    restartSong() {
        // Clean up
        this.cleanup();
        
        // Reset game state
        this.isPlaying = false;
        
        // Reset UI
        this.pauseMenu.classList.remove('active');
        this.songCompleteMenu.classList.remove('active');
        const gameOverMenu = document.getElementById('gameOverMenu');
        if (gameOverMenu) {
            gameOverMenu.classList.remove('active');
        }
        
        // Small delay to ensure cleanup is complete before starting
        setTimeout(() => {
            this.startGame();
        }, 100);
    }

    playNextLevel() {
        if (this.currentLevel < this.maxLevel) {
            this.currentLevel++;
            this.cleanup();
            this.songCompleteMenu.classList.remove('active');
            
            // Set difficulty based on new level
            this.difficulty = this.getDifficultyForLevel(this.currentLevel);
            
            // Set playing to false before loading next level
            this.isPlaying = false;
            
            // Load audio first
            this.loadLevelAudio(this.currentLevel).then(() => {
                // Then play cutscene
                this.playCutscene(this.currentLevel);
            });
        } else {
            alert('You have completed all levels! Congratulations!');
            this.returnToMenu();
        }
    }

    endGame() {
        this.isPlaying = false;
        
        // Clean up
        this.cleanup();
        
        // Save local high score
        const songName = this.songTitle.textContent;
        this.saveLocalHighScore(songName, this.score);
        
        // Upload to Firebase if logged in
        this.uploadToFirebase(songName, this.score);
        
        // Show completion menu
        this.showSongComplete();
    }
    
    async uploadToFirebase(songName, score) {
        try {
            const auth = this.getFirebaseAuth();
            if (!auth || !auth.currentUser) {
                console.log('User not logged in, skipping Firebase upload');
                return;
            }
            
            const db = this.getFirestore();
            const user = auth.currentUser;
            
            // Get current user data to update XP
            const userRef = this.getDocFunction()(db, 'users', user.uid);
            const userSnap = await userRef;
            
            let currentXP = 0;
            if (userSnap.exists()) {
                currentXP = userSnap.data().xp || 0;
            }
            
            // Calculate XP based on score (1 XP per 100 points)
            const earnedXP = Math.floor(score / 100);
            const newXP = currentXP + earnedXP;
            
            // Update user XP
            await this.getSetDocFunction()(this.getDocFunction()(db, 'users', user.uid), { xp: newXP }, { merge: true });
            
            // Check if this is a new high score for this song
            const scoresQuery = this.getQueryFunction()(
                this.getCollectionFunction()(db, 'scores'),
                this.getOrderByFunction()('score'),
                this.getLimitFunction()(10)
            );
            
            const scoresSnapshot = await this.getGetDocsFunction()(scoresQuery);
            const existingScores = scoresSnapshot.docs.map(doc => doc.data());
            const songScores = existingScores.filter(s => s.songName === songName);
            
            const isHighScore = songScores.length === 0 || score > Math.max(...songScores.map(s => s.score));
            
            if (isHighScore) {
                // Upload to Firebase leaderboard
                await this.getAddDocFunction()(this.getCollectionFunction()(db, 'scores'), {
                    songName: songName,
                    score: score,
                    userId: user.uid,
                    userEmail: user.email,
                    userPhoto: user.photoURL,
                    difficulty: this.difficulty,
                    timestamp: new Date().toISOString()
                });
                
                console.log('High score uploaded to Firebase!');
            }
            
        } catch (error) {
            console.error('Error uploading to Firebase:', error);
        }
    }
    
    // Helper functions to access Firebase from global scope
    getFirebaseAuth() {
        if (window.firebaseFunctions && window.firebaseFunctions.auth) {
            return window.firebaseFunctions.auth;
        }
        return null;
    }
    
    getFirestore() {
        if (window.firebaseFunctions && window.firebaseFunctions.db) {
            return window.firebaseFunctions.db;
        }
        return null;
    }
    
    getDocFunction() {
        if (window.firebaseFunctions && window.firebaseFunctions.doc) {
            return window.firebaseFunctions.doc;
        }
        return null;
    }
    
    getSetDocFunction() {
        if (window.firebaseFunctions && window.firebaseFunctions.setDoc) {
            return window.firebaseFunctions.setDoc;
        }
        return null;
    }
    
    getCollectionFunction() {
        if (window.firebaseFunctions && window.firebaseFunctions.collection) {
            return window.firebaseFunctions.collection;
        }
        return null;
    }
    
    getAddDocFunction() {
        if (window.firebaseFunctions && window.firebaseFunctions.addDoc) {
            return window.firebaseFunctions.addDoc;
        }
        return null;
    }
    
    getQueryFunction() {
        if (window.firebaseFunctions && window.firebaseFunctions.query) {
            return window.firebaseFunctions.query;
        }
        return null;
    }
    
    getOrderByFunction() {
        if (window.firebaseFunctions && window.firebaseFunctions.orderBy) {
            return window.firebaseFunctions.orderBy;
        }
        return null;
    }
    
    getLimitFunction() {
        if (window.firebaseFunctions && window.firebaseFunctions.limit) {
            return window.firebaseFunctions.limit;
        }
        return null;
    }
    
    getGetDocsFunction() {
        if (window.firebaseFunctions && window.firebaseFunctions.getDocs) {
            return window.firebaseFunctions.getDocs;
        }
        return null;
    }

    returnToMenu() {
        this.isPlaying = false;
        
        // Clean up
        this.cleanup();
        
        // Reset UI
        this.pauseMenu.classList.remove('active');
        this.songCompleteMenu.classList.remove('active');
        this.settingsMenu.classList.remove('active');
        const highScoresMenu = document.getElementById('highScoresMenu');
        if (highScoresMenu) {
            highScoresMenu.classList.remove('active');
        }
        const gameOverMenu = document.getElementById('gameOverMenu');
        if (gameOverMenu) {
            gameOverMenu.classList.remove('active');
        }
        this.gameContainer.classList.add('hidden');
        this.mainMenu.classList.remove('hidden');
        
        // Reset upload button
        this.uploadButton.textContent = '🎵 Upload Audio File';
        this.uploadButton.disabled = false;
        this.uploadInfo.textContent = 'Supports MP3, WAV, OGG, M4A';
    }
    
    // ===================================
    // Local High Scores System
    // ===================================
    
    saveLocalHighScore(songName, score) {
        const scores = this.getLocalHighScores();
        scores.push({
            songName: songName,
            score: score,
            date: new Date().toISOString(),
            difficulty: this.difficulty
        });
        
        // Sort by score and keep top 10
        scores.sort((a, b) => b.score - a.score);
        const topScores = scores.slice(0, 10);
        
        localStorage.setItem('neonNightmareHighScores', JSON.stringify(topScores));
    }
    
    getLocalHighScores() {
        const stored = localStorage.getItem('neonNightmareHighScores');
        return stored ? JSON.parse(stored) : [];
    }
    
    showHighScores() {
        const scores = this.getLocalHighScores();
        const menu = document.getElementById('highScoresMenu');
        
        if (!menu) {
            this.createHighScoresMenu();
            this.showHighScores();
            return;
        }
        
        const scoresList = document.getElementById('highScoresList');
        scoresList.innerHTML = '';
        
        if (scores.length === 0) {
            scoresList.innerHTML = '<p class="no-scores">No high scores yet!</p>';
        } else {
            scores.forEach((entry, index) => {
                const scoreItem = document.createElement('div');
                scoreItem.className = 'score-item';
                scoreItem.innerHTML = `
                    <span class="score-rank">${index + 1}.</span>
                    <span class="score-song">${entry.songName}</span>
                    <span class="score-difficulty ${entry.difficulty}">${entry.difficulty}</span>
                    <span class="score-value">${entry.score.toLocaleString()}</span>
                `;
                scoresList.appendChild(scoreItem);
            });
        }
        
        menu.classList.add('active');
    }
    
    createHighScoresMenu() {
        const menu = document.createElement('div');
        menu.className = 'pause-menu';
        menu.id = 'highScoresMenu';
        menu.innerHTML = `
            <h2 class="pause-title">🏆 HIGH SCORES</h2>
            <div class="high-scores-list" id="highScoresList"></div>
            <div class="menu-options">
                <button class="menu-button" id="closeHighScores">
                    ← Back
                </button>
            </div>
        `;
        document.body.appendChild(menu);
        
        document.getElementById('closeHighScores').addEventListener('click', () => {
            menu.classList.remove('active');
        });
    }
    
    showLeaderboards() {
        this.showHighScores();
    }

    cleanup() {
        // Stop audio
        if (this.audioSource) {
            try {
                this.audioSource.stop();
                this.audioSource.disconnect();
            } catch (e) {
                console.log('Audio source already stopped');
            }
        }
        
        // Remove all note elements
        this.activeNotes.forEach(note => {
            if (note.element && note.element.parentNode) {
                note.element.parentNode.removeChild(note.element);
            }
        });
        this.activeNotes = [];
    }

    // ===================================
    // Menu Functions
    // ===================================

    showSettings() {
        this.settingsMenu.classList.add('active');
    }

    hideSettings() {
        this.settingsMenu.classList.remove('active');
    }

    setDifficulty(level) {
        this.difficulty = level;
        this.setNoteSpeedForDifficulty();
        this.hideSettings();
        
        // Show confirmation
        alert(`Difficulty set to ${level.toUpperCase()}`);
    }

    showSongComplete() {
        // Update statistics
        document.getElementById('finalScoreValue').textContent = this.score.toLocaleString();
        document.getElementById('perfectCount').textContent = this.perfectHits;
        document.getElementById('greatCount').textContent = this.greatHits;
        document.getElementById('goodCount').textContent = this.goodHits;
        document.getElementById('missCount').textContent = this.misses;
        document.getElementById('maxComboValue').textContent = this.maxCombo;
        
        // Show menu
        this.songCompleteMenu.classList.add('active');
    }
    
    showGameOver() {
        // Update final score
        document.getElementById('gameOverScoreValue').textContent = this.score.toLocaleString();
        
        // Show game over menu
        const gameOverMenu = document.getElementById('gameOverMenu');
        if (gameOverMenu) {
            gameOverMenu.classList.add('active');
        }
    }

    showLeaderboards() {
        alert('Leaderboards feature coming soon!');
    }
}

// ===================================
// Initialize Game
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    window.game = new NeonNightmare();
});
