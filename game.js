// ==================================
// NEON NIGHTMARE - Game Engine
// Level Select & Cutscene Version 
// ==================================

class NeonNightmare {
    constructor() {
        console.log('Initializing Neon Nightmare...');
        
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
        
        console.log('Neon Nightmare initialized successfully');
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
        
        // Verify all menu elements exist
        console.log('Menu elements initialized:');
        console.log('mainMenu:', this.mainMenu);
        console.log('gameContainer:', this.gameContainer);
        console.log('pauseMenu:', this.pauseMenu);
        console.log('settingsMenu:', this.settingsMenu);
        console.log('songCompleteMenu:', this.songCompleteMenu);
        console.log('levelSelectMenu:', this.levelSelectMenu);
        
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
        console.log('Setting up event listeners...');
        
        // File Upload
        this.uploadButton = document.getElementById('uploadButton');
        this.audioFileInput = document.getElementById('audioFileInput');
        if (this.uploadButton && this.audioFileInput) {
            this.uploadButton.addEventListener('click', () => {
                console.log('Upload button clicked');
                this.audioFileInput.click();
            });
            this.audioFileInput.addEventListener('change', (e) => this.handleFileUpload(e));
            console.log('File upload listeners added');
        } else {
            console.error('Upload button or file input not found');
        }
        
        // Menu Buttons - Main Menu
        const selectLevelBtn = document.getElementById('selectLevel');
        const openSettingsBtn = document.getElementById('openSettings');
        const viewLeaderboardsBtn = document.getElementById('viewLeaderboards');
        
        if (selectLevelBtn) {
            selectLevelBtn.addEventListener('click', (e) => {
                console.log('Select Level button clicked');
                e.preventDefault();
                this.showLevelSelect();
            });
            console.log('Select Level listener added');
        } else {
            console.error('Select Level button not found');
        }
        
        if (openSettingsBtn) {
            openSettingsBtn.addEventListener('click', (e) => {
                console.log('Settings button clicked');
                e.preventDefault();
                this.showDifficultyMenu();
            });
            console.log('Settings listener added');
        } else {
            console.error('Settings button not found');
        }
        
        if (viewLeaderboardsBtn) {
            viewLeaderboardsBtn.addEventListener('click', (e) => {
                console.log('Leaderboards button clicked');
                e.preventDefault();
                this.showLeaderboards();
            });
            console.log('Leaderboards listener added');
        } else {
            console.error('Leaderboards button not found');
        }
        
        // Level Select Menu
        const backToMainMenuBtn = document.getElementById('backToMainMenu');
        if (backToMainMenuBtn) {
            backToMainMenuBtn.addEventListener('click', (e) => {
                console.log('Back to Main Menu button clicked');
                e.preventDefault();
                this.hideLevelSelect();
            });
        }
        
        // Pause Menu
        const resumeGameBtn = document.getElementById('resumeGame');
        const restartSongBtn = document.getElementById('restartSong');
        const returnToMenuBtn = document.getElementById('returnToMenu');
        
        if (resumeGameBtn) resumeGameBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.resumeGame();
        });
        if (restartSongBtn) restartSongBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.restartSong();
        });
        if (returnToMenuBtn) returnToMenuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.returnToMenu();
        });
        
        // Settings
        const setDifficultyEasyBtn = document.getElementById('setDifficultyEasy');
        const setDifficultyMediumBtn = document.getElementById('setDifficultyMedium');
        const setDifficultyHardBtn = document.getElementById('setDifficultyHard');
        const setDifficultyExpertBtn = document.getElementById('setDifficultyExpert');
        const setDifficultyMasterBtn = document.getElementById('setDifficultyMaster');
        const closeSettingsBtn = document.getElementById('closeSettings');
        
        if (setDifficultyEasyBtn) setDifficultyEasyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.setDifficulty('easy');
        });
        if (setDifficultyMediumBtn) setDifficultyMediumBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.setDifficulty('medium');
        });
        if (setDifficultyHardBtn) setDifficultyHardBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.setDifficulty('hard');
        });
        if (setDifficultyExpertBtn) setDifficultyExpertBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.setDifficulty('expert');
        });
        if (setDifficultyMasterBtn) setDifficultyMasterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.setDifficulty('master');
        });
        if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.hideSettings();
        });
        
        // Song Complete
        const playAgainBtn = document.getElementById('playAgain');
        const nextLevelBtn = document.getElementById('nextLevel');
        const selectLevelFromCompleteBtn = document.getElementById('selectLevelFromComplete');
        const mainMenuFromCompleteBtn = document.getElementById('mainMenuFromComplete');
        
        if (playAgainBtn) playAgainBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.restartSong();
        });
        if (nextLevelBtn) nextLevelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.playNextLevel();
        });
        if (selectLevelFromCompleteBtn) selectLevelFromCompleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.showLevelSelect();
        });
        if (mainMenuFromCompleteBtn) mainMenuFromCompleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.returnToMenu();
        });
        
        // Game Over
        const restartFromGameOverBtn = document.getElementById('restartFromGameOver');
        const uploadFromGameOverBtn = document.getElementById('uploadFromGameOver');
        const mainMenuFromGameOverBtn = document.getElementById('mainMenuFromGameOver');
        
        if (restartFromGameOverBtn) restartFromGameOverBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.restartSong();
        });
        if (uploadFromGameOverBtn) uploadFromGameOverBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.returnToMenu();
            if (this.uploadButton) this.uploadButton.click();
        });
        if (mainMenuFromGameOverBtn) mainMenuFromGameOverBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.returnToMenu();
        });
        
        // File Upload from song complete
        const uploadNewSongBtn = document.getElementById('uploadNewSong');
        if (uploadNewSongBtn) uploadNewSongBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.returnToMenu();
            if (this.uploadButton) this.uploadButton.click();
        });
        
        // Cutscene
        if (this.skipCutsceneButton) {
            this.skipCutsceneButton.addEventListener('click', () => this.skipCutscene());
        }
        if (this.cutsceneVideo) {
            this.cutsceneVideo.addEventListener('ended', () => this.onCutsceneEnded());
        }
        
        // Keyboard Controls
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Fret Button Controls
        this.frets.forEach((fret, index) => {
            const button = this.fretButtons[fret];
            if (button) {
                button.addEventListener('mousedown', () => this.handleFretPress(fret));
                button.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.handleFretPress(fret);
                });
            }
        });
        
        // Pause Toggle (Escape key)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isPlaying && !this.isCutscenePlaying) {
                this.togglePause();
            }
        });
        
        console.log('Event listeners setup complete');
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
        if (this.mainMenu) this.mainMenu.classList.add('hidden');
        if (this.levelSelectMenu) this.levelSelectMenu.classList.add('active');
        console.log('Showing level select menu');
    }

    hideLevelSelect() {
        if (this.levelSelectMenu) this.levelSelectMenu.classList.remove('active');
        if (this.mainMenu) this.mainMenu.classList.remove('hidden');
        console.log('Hiding level select menu');
    }

    showSettings() {
        if (this.settingsMenu) {
            this.settingsMenu.classList.add('active');
        }
    }

    hideSettings() {
        if (this.settingsMenu) {
            this.settingsMenu.classList.remove('active');
        }
    }

    showLeaderboards() {
        // For now, just show an alert - can be enhanced later
        alert('Leaderboards feature coming soon! Play more levels to track your progress.');
    }
    
    showDifficultyMenu() {
        this.showSettings();
    }

    setDifficulty(level) {
        this.difficulty = level;
        this.healthDrainAmount = this.healthDrainByDifficulty[level] || 10;
        alert(`Difficulty set to ${level.toUpperCase()}`);
        this.hideSettings();
    }

    changeDifficulty() {
        // Show the settings menu when changing difficulty
        this.showSettings();
    }

    showSongComplete() {
        if (this.gameContainer) this.gameContainer.classList.add('hidden');
        
        document.getElementById('finalScoreValue').textContent = this.score.toLocaleString();
        document.getElementById('perfectCount').textContent = this.perfectHits;
        document.getElementById('greatCount').textContent = this.greatHits;
        document.getElementById('goodCount').textContent = this.goodHits;
        document.getElementById('missCount').textContent = this.misses;
        document.getElementById('maxComboValue').textContent = this.maxCombo;
        
        if (this.songCompleteMenu) {
            this.songCompleteMenu.classList.add('active');
        }
    }
    
    showGameOver() {
        if (this.gameContainer) this.gameContainer.classList.add('hidden');
        
        document.getElementById('gameOverScoreValue').textContent = this.score.toLocaleString();
        
        const gameOverMenu = document.getElementById('gameOverMenu');
        if (gameOverMenu) {
            gameOverMenu.classList.add('active');
        }
    }

    async selectLevel(level) {
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
        
        console.log('Starting game...');
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
        if (this.levelNumber) this.levelNumber.textContent = this.currentLevel;
        
        // Hide all menus first
        if (this.mainMenu) this.mainMenu.classList.add('hidden');
        if (this.pauseMenu) this.pauseMenu.classList.remove('active');
        if (this.settingsMenu) this.settingsMenu.classList.remove('active');
        if (this.songCompleteMenu) this.songCompleteMenu.classList.remove('active');
        
        // Show game container
        if (this.gameContainer) {
            this.gameContainer.classList.remove('hidden');
            console.log('Game container shown');
        }
        
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
        if (this.progressFill) {
            this.progressFill.style.width = (progress * 100) + '%';
        }
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
        if (this.scoreValue) this.scoreValue.textContent = this.score.toLocaleString();
        if (this.multiplierValue) this.multiplierValue.textContent = this.multiplier;
        if (this.comboValue) this.comboValue.textContent = this.combo;
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
        
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 500);
    }

    showMissFeedback() {
        const darken = document.createElement('div');
        darken.className = 'screen-darken';
        document.body.appendChild(darken);
        
        // Trigger health drain on miss
        this.drainHealth();
        
        setTimeout(() => {
            if (darken.parentNode) {
                darken.parentNode.removeChild(darken);
            }
        }, 300);
    }

    animateNoteHit(note) {
        if (note.element) {
            note.element.classList.add('hit');
        }
        
        // Flash effect on target line
        const flash = document.createElement('div');
        flash.className = 'screen-flash';
        document.body.appendChild(flash);
        
        setTimeout(() => {
            if (flash.parentNode) {
                flash.parentNode.removeChild(flash);
            }
        }, 100);
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
            if (this.audioContext) {
                this.audioContext.suspend();
            }
            if (this.pauseMenu) {
                this.pauseMenu.classList.add('active');
            }
            console.log('Game paused');
        } else {
            if (this.audioContext) {
                this.audioContext.resume();
            }
            if (this.pauseMenu) {
                this.pauseMenu.classList.remove('active');
            }
            console.log('Game resumed');
            this.gameLoop();
        }
    }

    resumeGame() {
        if (this.isPaused) {
            this.togglePause();
        }
    }

    restartSong() {
        console.log('Restarting song...');
        
        // Clean up
        this.cleanup();
        
        // Reset game state
        this.isPlaying = false;
        
        // Reset UI
        if (this.pauseMenu) this.pauseMenu.classList.remove('active');
        if (this.songCompleteMenu) this.songCompleteMenu.classList.remove('active');
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

    returnToMenu() {
        console.log('Returning to main menu...');
        this.isPlaying = false;
        
        this.cleanup();
        
        if (this.pauseMenu) this.pauseMenu.classList.remove('active');
        if (this.songCompleteMenu) this.songCompleteMenu.classList.remove('active');
        if (this.settingsMenu) this.settingsMenu.classList.remove('active');
        
        const highScoresMenu = document.getElementById('highScoresMenu');
        if (highScoresMenu) highScoresMenu.classList.remove('active');
        
        const gameOverMenu = document.getElementById('gameOverMenu');
        if (gameOverMenu) gameOverMenu.classList.remove('active');
        
        if (this.gameContainer) this.gameContainer.classList.add('hidden');
        if (this.mainMenu) this.mainMenu.classList.remove('hidden');
        
        if (this.uploadButton) {
            this.uploadButton.textContent = '🎵 Upload Audio File';
            this.uploadButton.disabled = false;
        }
        if (this.uploadInfo) {
            this.uploadInfo.textContent = 'Supports MP3, WAV, OGG, M4A';
        }
    }
    
    cleanup() {
        if (this.audioSource) {
            try {
                this.audioSource.stop();
                this.audioSource.disconnect();
            } catch (e) {
                console.log('Audio source already stopped');
            }
        }
        
        this.activeNotes.forEach(note => {
            if (note.element && note.element.parentNode) {
                note.element.parentNode.removeChild(note.element);
            }
        });
        this.activeNotes = [];
        this.notes = [];
    }
}

// ===================================
// Initialize Game - Ultra-Robust Version
// ===================================

function initGame() {
    if (window.gameInitialized) {
        console.log('Game already initialized, skipping...');
        return;
    }
    
    console.log('Initializing Neon Nightmare...');
    window.game = new NeonNightmare();
    window.gameInitialized = true;
}

if (document.readyState === 'interactive' || document.readyState === 'complete') {
    console.log('DOM already ready, initializing immediately');
    initGame();
} else {
    console.log('Waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', initGame);
}

setTimeout(() => {
    if (!window.gameInitialized) {
        console.log('Fallback: Initializing game after delay');
        initGame();
    }
}, 500);