// ==================================
// NEON NIGHTMARE - Game Engine
// Track Select & Cutscene Version
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
        
        // Track System (renamed from Level)
        this.currentTrack = 1;
        this.maxTrack = 50;
        
        // Health System
        this.health = 100;
        this.maxHealth = 100;
        this.trackFailed = false;
        
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
        
        // Fret Configuration
        this.frets = ['green', 'red', 'yellow', 'blue', 'orange'];
        this.fretKeys = ['a', 's', 'd', 'f', 'g'];
        this.fretButtons = {};
        
        // Statistics
        this.perfectHits = 0;
        this.greatHits = 0;
        this.goodHits = 0;
        this.misses = 0;
        
        // Difficulty Settings (Speed and Density based)
        this.difficultySettings = {
            easy: {
                noteSpeed: 1.5,      // Much slower notes
                noteDensity: 0.2,    // Fewer notes
                damagePerMiss: 3,    // Less damage
                timingWindow: 200    // More forgiving timing
            },
            medium: {
                noteSpeed: 2.0,
                noteDensity: 0.35,
                damagePerMiss: 5,
                timingWindow: 150
            },
            hard: {
                noteSpeed: 2.5,
                noteDensity: 0.5,
                damagePerMiss: 8,
                timingWindow: 120
            },
            expert: {
                noteSpeed: 3.0,
                noteDensity: 0.65,
                damagePerMiss: 20,
                timingWindow: 60
            },
            master: {
                noteSpeed: 6.0,
                noteDensity: 1.0,
                damagePerMiss: 25,
                timingWindow: 40
            }
        };
        
        // Track-based difficulty scaling
        this.trackDifficultyMultiplier = 1.0;
        
        // DOM Elements
        this.initializeElements();
        this.setupEventListeners();
        this.createParticles();
        this.initializeCharacter();
        this.initializeMap();
        this.generateTrackGrid();
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
        
        // Track Elements (renamed from Level)
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
            this.targetY = this.noteHighway.offsetHeight - 150;
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
    }

    setupEventListeners() {
        // File Upload
        this.uploadButton = document.getElementById('uploadButton');
        this.audioFileInput = document.getElementById('audioFileInput');
        this.uploadButton.addEventListener('click', () => this.audioFileInput.click());
        this.audioFileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Menu Buttons
        document.getElementById('selectLevel').addEventListener('click', () => this.showTrackSelect());
        document.getElementById('openSettings').addEventListener('click', () => this.showSettings());
        document.getElementById('viewLeaderboards').addEventListener('click', () => this.showLeaderboards());
        document.getElementById('backToMainMenu').addEventListener('click', () => this.hideTrackSelect());
        
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
        document.getElementById('nextLevel').addEventListener('click', () => this.playNextTrack());
        document.getElementById('selectLevelFromComplete').addEventListener('click', () => this.showTrackSelect());
        document.getElementById('mainMenuFromComplete').addEventListener('click', () => this.returnToMenu());
        
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
    // Track Select System (renamed from Level)
    // ===================================

    generateTrackGrid() {
        this.levelGrid.innerHTML = '';
        
        for (let i = 1; i <= this.maxTrack; i++) {
            const trackItem = document.createElement('div');
            trackItem.className = 'level-item';
            trackItem.textContent = i;
            trackItem.dataset.track = i;
            
            // Add difficulty class based on track
            if (i <= 10) {
                trackItem.classList.add('easy');
            } else if (i <= 20) {
                trackItem.classList.add('medium');
            } else if (i <= 35) {
                trackItem.classList.add('hard');
            } else if (i <= 45) {
                trackItem.classList.add('expert');
            } else {
                trackItem.classList.add('master');
            }
            
            trackItem.addEventListener('click', () => this.selectTrack(i));
            this.levelGrid.appendChild(trackItem);
        }
    }

    showTrackSelect() {
        this.mainMenu.classList.add('hidden');
        this.levelSelectMenu.classList.add('active');
    }

    hideTrackSelect() {
        this.levelSelectMenu.classList.remove('active');
        this.mainMenu.classList.remove('hidden');
    }

    async selectTrack(track) {
        this.currentTrack = track;
        this.hideTrackSelect();
        
        // Set difficulty based on track
        this.difficulty = this.getDifficultyForTrack(track);
        
        // Calculate track difficulty multiplier
        this.trackDifficultyMultiplier = 1.0 + (track - 1) * 0.01; // 1% increase per track
        
        // Load and play cutscene
        await this.playCutscene(track);
        
        // Load audio and start game
        await this.loadTrackAudio(track);
    }

    // ===================================
    // Cutscene System
    // ===================================

    async playCutscene(track) {
        const cutsceneUrl = `Level${track}.mp4`; // Keep Level naming for cutscenes
        
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

    async loadTrackAudio(track) {
        const audioUrl = `Level${track}.mp3`; // Keep Level naming for audio files
        
        try {
            // Initialize Audio Context if needed
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            await this.audioContext.resume();
            
            // Update song info
            this.songTitle.textContent = `Track ${track}`;
            this.songArtist.textContent = this.difficulty.toUpperCase();
            
            // Load audio file
            const response = await fetch(audioUrl);
            
            if (!response.ok) {
                throw new Error(`Audio file not found: ${audioUrl}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.duration = this.audioBuffer.duration;
            
            // Generate unique seed for this track
            this.noteGenerationSeed = this.generateSeedFromTrack(track);
            
            // Analyze audio and generate notes
            await this.analyzeAudioAndGenerateNotes();
            
            // Start game
            this.startGame();
            
        } catch (error) {
            console.error('Error loading audio:', error);
            alert(`Error: Could not load Level ${track}.mp3\n\nPlease ensure Level${track}.mp3 is in the same directory as the game.`);
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
            this.currentTrack = 0; // 0 indicates custom track
            
            // Generate unique seed for this custom file
            this.noteGenerationSeed = this.generateSeedFromFile(file);
            
            // Analyze audio and generate notes
            await this.analyzeAudioAndGenerateNotes();
            
            // Start game
            this.startGame();
            
        } catch (error) {
            console.error('Error processing audio:', error);
            alert('Error processing audio file. Please try a different file.');
            this.uploadButton.textContent = '🎵 Upload Audio File';
            this.uploadButton.disabled = false;
        }
    }

    // ===================================
    // Unique Note Generation System
    // ===================================

    generateSeedFromTrack(track) {
        // Generate a unique seed based on track number
        return track * 12345 + 67890;
    }

    generateSeedFromFile(file) {
        // Generate a unique seed based on file properties
        let seed = 0;
        const name = file.name;
        const size = file.size;
        const type = file.type;
        
        for (let i = 0; i < name.length; i++) {
            seed += name.charCodeAt(i) * (i + 1);
        }
        seed += size;
        for (let i = 0; i < type.length; i++) {
            seed += type.charCodeAt(i) * (i + 100);
        }
        
        return seed;
    }

    seededRandom(seed) {
        // Simple seeded random number generator
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
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
    // Health System
    // ===================================

    updateHealth(amount) {
        this.health = Math.max(0, Math.min(this.maxHealth, this.health + amount));
        
        // Update health display (you'll need to add this to HTML)
        this.updateHealthDisplay();
        
        // Check for track failure
        if (this.health <= 0 && !this.trackFailed) {
            this.failTrack();
        }
    }

    updateHealthDisplay() {
        const healthPercent = (this.health / this.maxHealth) * 100;
        const healthBar = document.getElementById('healthBarFill');
        const healthValue = document.getElementById('healthValue');
        // Removed healthPulse as it doesn't exist in HTML
        
        if (healthBar) {
            healthBar.style.width = `${healthPercent}%`;
            
            // Update health value display
            if (healthValue) {
                healthValue.textContent = Math.floor(this.health);
            }
            
            // Change color and styling based on health
            healthBar.className = 'health-fill'; // Reset classes
            healthValue.className = 'health-value'; // Reset classes
            healthPulse.className = 'health-pulse'; // Reset classes
            
            if (healthPercent > 60) {
                healthBar.classList.add('high');
                healthValue.classList.add('high');
            } else if (healthPercent > 30) {
                healthBar.classList.add('medium');
                healthValue.classList.add('medium');
            } else {
                healthBar.classList.add('low');
                healthValue.classList.add('low');
                healthPulse.classList.add('low-health'); // Add pulsing animation for low health
            }
        }
    }

    failTrack() {
        this.trackFailed = true;
        this.isPlaying = false;
        
        // Stop audio
        if (this.audioSource) {
            this.audioSource.stop();
        }
        
        // Show failure message
        alert(`TRACK FAILED!\n\nScore: ${this.score.toLocaleString()}\nMax Combo: ${this.maxCombo}`);
        
        // Return to menu or restart options
        this.cleanup();
        this.showFailureMenu();
    }

    showFailureMenu() {
        // Show menu with restart or return options
        // You can reuse the songCompleteMenu or create a new one
        const failureTitle = document.querySelector('#songCompleteMenu .pause-title');
        const originalTitle = failureTitle.textContent;
        
        failureTitle.textContent = '❌ TRACK FAILED';
        document.getElementById('finalScoreValue').textContent = this.score.toLocaleString();
        document.getElementById('perfectCount').textContent = this.perfectHits;
        document.getElementById('greatCount').textContent = this.greatHits;
        document.getElementById('goodCount').textContent = this.goodHits;
        document.getElementById('missCount').textContent = this.misses;
        document.getElementById('maxComboValue').textContent = this.maxCombo;
        
        // Hide next level button for failed tracks
        document.getElementById('nextLevel').style.display = 'none';
        
        this.songCompleteMenu.classList.add('active');
        
        // Restore title when menu closes
        const restoreTitle = () => {
            failureTitle.textContent = originalTitle;
            document.getElementById('nextLevel').style.display = 'block';
        };
        
        document.getElementById('playAgain').onclick = () => {
            restoreTitle();
            this.restartSong();
        };
        
        document.getElementById('mainMenuFromComplete').onclick = () => {
            restoreTitle();
            this.returnToMenu();
        };
    }

    // ===================================
    // Map System
    // ===================================

    updateMapScroll(currentTime) {
        const deltaTime = currentTime - this.lastScrollTime;
        const scrollSpeed = 0.02 + (this.currentTrack * 0.005);
        
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
    // Track System
    // ===================================

    getDifficultyForTrack(track) {
        if (track <= 10) return 'easy';
        if (track <= 20) return 'medium';
        if (track <= 35) return 'hard';
        if (track <= 45) return 'expert';
        return 'master';
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
    // Audio Analysis & Note Generation
    // ===================================

    async analyzeAudioAndGenerateNotes() {
        // Get audio data for analysis
        const channelData = this.audioBuffer.getChannelData(0);
        const sampleRate = this.audioBuffer.sampleRate;
        
        // Generate unique notes for this song
        this.notes = this.generateNotesFromAudio(channelData, sampleRate);
        
        console.log(`Generated ${this.notes.length} unique notes for this track`);
    }

    generateNotesFromAudio(channelData, sampleRate) {
        const notes = [];
        const windowSize = Math.floor(sampleRate * 0.1);
        const hopSize = Math.floor(sampleRate * 0.05);
        
        // Get current difficulty settings
        const settings = this.difficultySettings[this.difficulty];
        const adjustedSpeed = settings.noteSpeed * this.trackDifficultyMultiplier;
        const adjustedDensity = settings.noteDensity * this.trackDifficultyMultiplier;
        
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
        
        // Filter beats based on density
        const minBeatInterval = 1.0 / (adjustedDensity * 4); // More density = smaller interval
        const filteredBeats = this.filterBeats(beats, minBeatInterval);
        
        // Generate notes from beats using seeded randomness for uniqueness
        let seed = this.noteGenerationSeed;
        
        filteredBeats.forEach((beat, index) => {
            // Use seeded random for unique patterns
            seed = seed * 1103515245 + 12345;
            const randomValue = (seed / 2147483647) % 1;
            
            // Select fret based on energy and seeded random
            const fret = this.selectFretUnique(beat.energy, randomValue, index);
            
            notes.push({
                id: index,
                time: beat.time,
                fret: fret,
                energy: beat.energy,
                hit: false,
                missed: false,
                speed: adjustedSpeed // Store individual note speed
            });
        });
        
        return notes;
    }

    calculateThreshold(energies) {
        const mean = energies.reduce((a, b) => a + b, 0) / energies.length;
        const stdDev = Math.sqrt(
            energies.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / energies.length
        );
        return mean + stdDev * 0.5;
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

    selectFretUnique(energy, randomValue, index) {
        // Create unique patterns using seeded random
        const fretIndex = Math.floor((energy + randomValue * 10 + index * 0.01) * 7) % 5;
        return this.frets[fretIndex];
    }

    // ===================================
    // Game Loop & Rendering
    // ===================================

    startGame() {
        this.isPlaying = true;
        this.isPaused = false;
        this.trackFailed = false;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.multiplier = 1;
        this.health = this.maxHealth; // Reset health
        this.perfectHits = 0;
        this.greatHits = 0;
        this.goodHits = 0;
        this.misses = 0;
        this.activeNotes = [];
        
        // Reset notes
        this.notes.forEach(note => {
            note.hit = false;
            note.missed = false;
        });
        
        // Update UI
        this.updateHUD();
        this.updateHealthDisplay();
        this.levelNumber.textContent = this.currentTrack || 'CUSTOM';
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
        
        // Handle song end with a delay to allow last notes to complete
        this.audioSource.onended = () => {
            if (this.isPlaying && !this.isPaused && !this.trackFailed) {
                // Give extra time for final notes to be hit
                setTimeout(() => {
                    if (this.isPlaying && !this.isPaused && !this.trackFailed) {
                        this.endGame();
                    }
                }, 2000); // 2 second delay
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
        const settings = this.difficultySettings[this.difficulty];
        const adjustedSpeed = settings.noteSpeed * this.trackDifficultyMultiplier;
        const noteLeadTime = 3.0 / adjustedSpeed; // Faster notes = less lead time
        
        this.notes.forEach(note => {
            if (!note.hit && !note.missed && 
                !this.activeNotes.includes(note) &&
                note.time <= currentTime + noteLeadTime &&
                note.time > currentTime - 0.5) { // Allow notes 0.5s past their time to still spawn
                this.activeNotes.push(note);
                this.createNoteElement(note);
            }
        });
    }

    updateNotes(currentTime) {
        const settings = this.difficultySettings[this.difficulty];
        const timingWindow = settings.timingWindow / 1000; // Convert to seconds
        
        this.activeNotes.forEach(note => {
            if (note.hit || note.missed) return;
            
            const timeDiff = note.time - currentTime;
            
            // Check for miss - only mark as missed if well past the timing window
            if (timeDiff < -timingWindow) { // 
                this.missNote(note);
            }
        });
        
        // Remove inactive notes that have been missed and off screen
        this.activeNotes = this.activeNotes.filter(note => 
            !note.missed || (note.element && this.noteHighway.contains(note.element))
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
        
        this.activeNotes.forEach(note => {
            if (!note.element) return;
            
            const settings = this.difficultySettings[this.difficulty];
            const adjustedSpeed = settings.noteSpeed * this.trackDifficultyMultiplier;
            const noteLeadTime = 3.0 / adjustedSpeed;
            
            const timeToTarget = note.time - currentTime;
            let progress = 1 - (timeToTarget / noteLeadTime);
            
            // Clamp progress to ensure notes don't render beyond target
            progress = Math.max(0, Math.min(1, progress));
            
            const y = this.noteSpawnY + progress * (this.targetY - this.noteSpawnY);
            note.element.style.top = y + 'px';
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
        const settings = this.difficultySettings[this.difficulty];
        const timingWindow = settings.timingWindow / 1000; // Convert to seconds
        
        // Find the closest note in this fret lane
        const closestNote = this.activeNotes
            .filter(note => note.fret === fret && !note.hit && !note.missed)
            .sort((a, b) => Math.abs(a.time - currentTime) - Math.abs(b.time - currentTime))[0];
        
        if (closestNote) {
            const timeDiff = Math.abs(closestNote.time - currentTime) * 1000;
            
            if (timeDiff <= settings.timingWindow) {
                let hitType;
                if (timeDiff <= settings.timingWindow * 0.33) {
                    hitType = 'perfect';
                } else if (timeDiff <= settings.timingWindow * 0.66) {
                    hitType = 'great';
                } else {
                    hitType = 'good';
                }
                
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
        const button = this.fretButtons[fret];
        button.classList.remove('pressed');
    }

    // ===================================
    // Scoring System
    // ===================================

    hitNote(note, hitType) {
        note.hit = true;
        
        // Calculate points
        const points = {
            perfect: 100,
            great: 75,
            good: 50
        };
        
        this.score += points[hitType] * this.multiplier;
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
        
        // Small health recovery for hits
        this.updateHealth(2);
        
        // Character animation
        this.setCharacterState('hit');
        this.activateCharacterAura();
        
        // Visual feedback
        this.showHitFeedback(hitType);
        this.animateNoteHit(note);
        
        // Update HUD
        this.updateHUD();
        
        // Remove note from active notes
        const index = this.activeNotes.indexOf(note);
        if (index > -1) {
            this.activeNotes.splice(index, 1);
        }
        
        // Remove note element after animation
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
        
        // Apply damage based on difficulty
        const settings = this.difficultySettings[this.difficulty];
        const damage = settings.damagePerMiss * this.trackDifficultyMultiplier;
        this.updateHealth(-damage);
        
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
        
        // Reset UI
        this.pauseMenu.classList.remove('active');
        this.songCompleteMenu.classList.remove('active');
        
        // Start game
        this.startGame();
    }

    playNextTrack() {
        if (this.currentTrack < this.maxTrack) {
            this.currentTrack++;
            this.cleanup();
            this.songCompleteMenu.classList.remove('active');
            
            // Set difficulty based on new track
            this.difficulty = this.getDifficultyForTrack(this.currentTrack);
            this.trackDifficultyMultiplier = 1.0 + (this.currentTrack - 1) * 0.02;
            
            // Load and play cutscene
            this.playCutscene(this.currentTrack).then(() => {
                // Load audio and start game
                this.loadTrackAudio(this.currentTrack);
            });
        } else {
            alert('You have completed all tracks! Congratulations!');
            this.returnToMenu();
        }
    }

    endGame() {
        this.isPlaying = false;
        
        // Clean up after a short delay to allow final animations
        setTimeout(() => {
            this.cleanup();
            
            // Only show completion menu if track wasn't failed
            if (!this.trackFailed) {
                this.showSongComplete();
            }
        }, 500);
    }

    returnToMenu() {
        this.isPlaying = false;
        
        // Clean up
        this.cleanup();
        
        // Reset UI
        this.pauseMenu.classList.remove('active');
        this.songCompleteMenu.classList.remove('active');
        this.settingsMenu.classList.remove('active');
        this.gameContainer.classList.add('hidden');
        this.mainMenu.classList.remove('hidden');
        
        // Reset upload button
        this.uploadButton.textContent = '🎵 Upload Audio File';
        this.uploadButton.disabled = false;
        this.uploadInfo.textContent = 'Supports MP3, WAV, OGG, OGG, M4A';
    }

    cleanup() {
        // Stop audio
        if (this.audioSource) {
            this.audioSource.stop();
            this.audioSource.disconnect();
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