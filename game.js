// ==================================
// NEON NIGHTMARE - Game Engine
// UPDATED VERSION - Fixed hit detection, upload, restart, and HUD
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
        this.noteSpawnY = -100;
        
        // FIXED: Target line position - moved closer to fret buttons
        this.targetY = 0;
        this.highwayHeight = 0;
        
        // Health System - Only drain on misses
        this.maxHealth = 100;
        this.currentHealth = 100;
        this.healthDrainAmount = 5;
        
        // Difficulty-based health drain values
        this.healthDrainByDifficulty = {
            easy: 5,
            medium: 8,
            hard: 12,
            expert: 15,
            master: 20
        };
        
        // Grace period at start
        this.gameStartTime = 0;
        this.gracePeriod = 3.0;
        
        // Combo notes - Hold notes that give gradual scoring
        this.comboNoteChance = 0.05;
        this.holdNoteChance = 0.08;
        
        // Fret Configuration
        this.frets = ['green', 'red', 'yellow', 'blue', 'orange'];
        this.fretKeys = ['a', 's', 'd', 'f', 'g'];
        this.fretButtons = {};
        
        // Statistics
        this.perfectHits = 0;
        this.greatHits = 0;
        this.goodHits = 0;
        this.misses = 0;
        
        // Timing Windows (in milliseconds)
        this.timingWindows = {
            perfect: 50,
            great: 100,
            good: 150
        };
        
        // Note lead time (seconds before target)
        this.noteLeadTime = 2.5;
        
        // DOM Elements
        this.initializeElements();
        this.setupEventListeners();
        this.createParticles();
        this.initializeCharacter();
        this.initializeMap();
        this.generateLevelGrid();
        
        console.log('Neon Nightmare initialized successfully');
    }

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
        
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.loadingText = document.getElementById('loadingText');
        
        this.scoreValue = document.getElementById('scoreValue');
        this.multiplierValue = document.getElementById('multiplierValue');
        this.multiplierPulse = document.getElementById('multiplierPulse');
        this.comboValue = document.getElementById('comboValue');
        this.comboDisplay = document.getElementById('comboDisplay');
        this.progressFill = document.getElementById('progressFill');
        this.songTitle = document.getElementById('songTitle');
        this.songArtist = document.getElementById('songArtist');
        
        this.levelNumber = document.getElementById('levelNumber');
        this.levelGrid = document.getElementById('levelGrid');
        
        this.noteHighway = document.getElementById('noteHighway');
        this.targetLine = document.getElementById('targetLine');
        this.beatGlow = document.getElementById('beatGlow');
        
        this.frets.forEach((fret, index) => {
            this.fretButtons[fret] = document.querySelector(`.fret-button.${fret}`);
        });
        
        // Calculate highway and target positions
        setTimeout(() => {
            this.calculateTargetY();
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
        window.addEventListener('resize', () => this.calculateTargetY());
    }
    
    calculateTargetY() {
        if (!this.noteHighway) return;
        
        const highwayRect = this.noteHighway.getBoundingClientRect();
        this.highwayHeight = highwayRect.height;
        
        // FIXED: Target line is now at 80% of highway height (closer to bottom/fret buttons)
        this.targetY = this.highwayHeight * 0.8;
        
        console.log(`Highway height: ${this.highwayHeight}px, Target Y: ${this.targetY}px`);
        
        // Update target line position in DOM
        if (this.targetLine) {
            this.targetLine.style.bottom = '20%';
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // FIXED: Reset input value on every upload click
        this.uploadButton.addEventListener('click', () => {
            console.log('Upload button clicked');
            // Always clear the input value to allow re-uploading
            this.audioFileInput.value = '';
            this.audioFileInput.click();
        });
        this.audioFileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        const selectLevelBtn = document.getElementById('selectLevel');
        if (selectLevelBtn) {
            selectLevelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLevelSelect();
            });
        }
        
        const openSettingsBtn = document.getElementById('openSettings');
        if (openSettingsBtn) {
            openSettingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showDifficultyMenu();
            });
        }
        
        const viewLeaderboardsBtn = document.getElementById('viewLeaderboards');
        if (viewLeaderboardsBtn) {
            viewLeaderboardsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLeaderboards();
            });
        }
        
        const backToMainMenuBtn = document.getElementById('backToMainMenu');
        if (backToMainMenuBtn) {
            backToMainMenuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideLevelSelect();
            });
        }
        
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
        
        // FIXED: Restart and upload buttons from game over - properly reset and trigger upload
        const restartFromGameOverBtn = document.getElementById('restartFromGameOver');
        const uploadFromGameOverBtn = document.getElementById('uploadFromGameOver');
        const mainMenuFromGameOverBtn = document.getElementById('mainMenuFromGameOver');
        
        if (restartFromGameOverBtn) restartFromGameOverBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.restartSong();
        });
        if (uploadFromGameOverBtn) uploadFromGameOverBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Go to menu first
            this.returnToMenu();
            // Then trigger upload with delay to ensure menu is ready
            setTimeout(() => {
                this.audioFileInput.value = '';
                this.uploadButton.click();
            }, 200);
        });
        if (mainMenuFromGameOverBtn) mainMenuFromGameOverBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.returnToMenu();
        });
        
        const uploadNewSongBtn = document.getElementById('uploadNewSong');
        if (uploadNewSongBtn) uploadNewSongBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.returnToMenu();
            setTimeout(() => {
                this.audioFileInput.value = '';
                this.uploadButton.click();
            }, 200);
        });
        
        if (this.skipCutsceneButton) {
            this.skipCutsceneButton.addEventListener('click', () => this.skipCutscene());
        }
        if (this.cutsceneVideo) {
            this.cutsceneVideo.addEventListener('ended', () => this.onCutsceneEnded());
        }
        
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
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
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isPlaying && !this.isCutscenePlaying) {
                this.togglePause();
            }
        });
        
        console.log('Event listeners setup complete');
    }

    createParticles() {
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;
        
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

    generateLevelGrid() {
        if (!this.levelGrid) return;
        
        this.levelGrid.innerHTML = '';
        
        for (let i = 1; i <= this.maxLevel; i++) {
            const levelItem = document.createElement('div');
            levelItem.className = 'level-item';
            levelItem.textContent = i;
            levelItem.dataset.level = i;
            
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
    }

    hideLevelSelect() {
        if (this.levelSelectMenu) this.levelSelectMenu.classList.remove('active');
        if (this.mainMenu) this.mainMenu.classList.remove('hidden');
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
        const scores = this.getLocalHighScores();
        
        let modalHTML = `
            <div class="pause-menu active" id="leaderboardsModal">
                <h2 class="pause-title">🏆 HIGH SCORES</h2>
                <div class="high-scores-list">
        `;
        
        if (scores.length === 0) {
            modalHTML += `<p class="no-scores">No scores yet! Play some levels to see your scores here.</p>`;
        } else {
            scores.forEach((score, index) => {
                const rank = index + 1;
                const rankClass = rank === 1 ? 'first-place' : rank === 2 ? 'second-place' : rank === 3 ? 'third-place' : '';
                modalHTML += `
                    <div class="score-entry ${rankClass}">
                        <span class="score-rank">${rank}</span>
                        <div class="score-info">
                            <div class="score-name">${score.songName}</div>
                            <div class="score-song">${score.difficulty.toUpperCase()}</div>
                        </div>
                        <span class="score-value">${score.score.toLocaleString()}</span>
                    </div>
                `;
            });
        }
        
        modalHTML += `
                </div>
                <div class="menu-options">
                    <button class="menu-button" onclick="document.getElementById('leaderboardsModal').remove();">
                        ← Back to Menu
                    </button>
                </div>
            </div>
        `;
        
        const existingModal = document.getElementById('leaderboardsModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    showDifficultyMenu() {
        this.showSettings();
    }

    setDifficulty(level) {
        this.difficulty = level;
        this.healthDrainAmount = this.healthDrainByDifficulty[level] || 5;
        alert(`Difficulty set to ${level.toUpperCase()}\nHealth drain on miss: ${this.healthDrainAmount}`);
        this.hideSettings();
    }

    changeDifficulty() {
        this.showSettings();
    }

    showSongComplete() {
        if (this.gameContainer) this.gameContainer.classList.add('hidden');
        
        const finalScoreValue = document.getElementById('finalScoreValue');
        const perfectCount = document.getElementById('perfectCount');
        const greatCount = document.getElementById('greatCount');
        const goodCount = document.getElementById('goodCount');
        const missCount = document.getElementById('missCount');
        const maxComboValue = document.getElementById('maxComboValue');
        
        if (finalScoreValue) finalScoreValue.textContent = this.score.toLocaleString();
        if (perfectCount) perfectCount.textContent = this.perfectHits;
        if (greatCount) greatCount.textContent = this.greatHits;
        if (goodCount) goodCount.textContent = this.goodHits;
        if (missCount) missCount.textContent = this.misses;
        if (maxComboValue) maxComboValue.textContent = this.maxCombo;
        
        if (this.songCompleteMenu) {
            this.songCompleteMenu.classList.add('active');
        }
    }
    
    showGameOver() {
        if (this.gameContainer) this.gameContainer.classList.add('hidden');
        
        const gameOverScoreValue = document.getElementById('gameOverScoreValue');
        if (gameOverScoreValue) gameOverScoreValue.textContent = this.score.toLocaleString();
        
        const gameOverMenu = document.getElementById('gameOverMenu');
        if (gameOverMenu) {
            gameOverMenu.classList.add('active');
        }
    }

    async selectLevel(level) {
        console.log(`Selecting level ${level}...`);
        this.currentLevel = level;
        this.hideLevelSelect();
        
        this.difficulty = this.getDifficultyForLevel(level);
        this.isPlaying = false;
        
        try {
            this.showLoadingOverlay(`Loading Level ${level}...`);
            
            await this.loadLevelAudio(level);
            
            this.showLoadingOverlay(`Preparing Level ${level}...`);
            
            await this.playCutscene(level);
            
            this.hideLoadingOverlay();
            
            this.startGame();
        } catch (error) {
            console.error('Error loading level:', error);
            this.hideLoadingOverlay();
            alert(`Error loading Level ${level}: ${error.message}\n\nPlease ensure Level${level}.mp3 is in the game directory.`);
            this.returnToMenu();
        }
    }

    async playCutscene(level) {
        const cutsceneUrl = `Level${level}.mp4`;
        
        try {
            this.cutsceneVideo.src = cutsceneUrl;
            this.cutsceneContainer.classList.add('active');
            this.isCutscenePlaying = true;
            
            await new Promise((resolve, reject) => {
                this.cutsceneVideo.onloadeddata = resolve;
                this.cutsceneVideo.onerror = reject;
                
                setTimeout(() => {
                    this.cutsceneVideo.onerror = null;
                    reject(new Error('Cutscene not found'));
                }, 500);
            });
            
            await this.cutsceneVideo.play();
            
        } catch (error) {
            console.log('Cutscene not found or failed to load, skipping to game:', error.message);
            this.isCutscenePlaying = false;
            this.cutsceneContainer.classList.remove('active');
            this.cutsceneVideo.src = '';
        }
    }

    onCutsceneEnded() {
        this.isCutscenePlaying = false;
        this.cutsceneContainer.classList.remove('active');
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
            if (!this.isPlaying && this.audioBuffer) {
                this.startGame();
            }
        }
    }

    async loadLevelAudio(level) {
        const audioUrl = `Level${level}.mp3`;
        
        console.log(`Loading audio for level ${level} from: ${audioUrl}`);
        
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            await this.audioContext.resume();
            
            if (this.songTitle) this.songTitle.textContent = `Level ${level}`;
            if (this.songArtist) this.songArtist.textContent = this.difficulty.toUpperCase();
            
            this.setNoteSpeedForDifficulty();
            
            const fetchPromise = fetch(audioUrl);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Audio fetch timeout')), 10000)
            );
            
            const response = await Promise.race([fetchPromise, timeoutPromise]);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Could not load ${audioUrl}`);
            }
            
            console.log('Audio file fetched, reading...');
            const arrayBuffer = await response.arrayBuffer();
            
            console.log(`Audio file read (${(arrayBuffer.length / 1024 / 1024).toFixed(2)}MB), decoding...`);
            
            this.showLoadingOverlay('Decoding audio...');
            const decodePromise = this.audioContext.decodeAudioData(arrayBuffer);
            const decodeTimeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Audio decode timeout')), 30000)
            );
            
            this.audioBuffer = await Promise.race([decodePromise, decodeTimeoutPromise]);
            this.duration = this.audioBuffer.duration;
            
            console.log(`Audio decoded successfully. Duration: ${this.duration.toFixed(2)}s`);
            
            this.showLoadingOverlay('Generating notes...');
            await this.analyzeAudioAndGenerateNotes();
            
            console.log('Level audio loading complete');
            
        } catch (error) {
            console.error('Error loading audio:', error);
            throw error;
        }
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        console.log('File upload started:', file.name);
        
        // Prevent uploading files named "LevelX"
        const levelPattern = /^Level\d+\.mp3$/i;
        if (levelPattern.test(file.name)) {
            alert('⚠️ Cannot upload files named "LevelX.mp3"\n\nThese files are reserved for the level select system.\nPlease rename your file and try again.');
            this.audioFileInput.value = '';
            return;
        }
        
        this.uploadButton.textContent = '⏳ Processing...';
        this.uploadButton.disabled = true;
        
        if (this.uploadInfo) {
            this.uploadInfo.textContent = `Loading: ${file.name}`;
        }
        
        if (file.size > 50 * 1024 * 1024) {
            alert('File too large! Please use an audio file smaller than 50MB.');
            this.uploadButton.textContent = '🎵 Upload Audio File';
            this.uploadButton.disabled = false;
            return;
        }
        
        try {
            this.showLoadingOverlay(`Processing: ${file.name}`);
            
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            await this.audioContext.resume();
            
            this.showLoadingOverlay(`Reading: ${file.name}`);
            
            const arrayBuffer = await file.arrayBuffer();
            
            this.showLoadingOverlay('Decoding audio...');
            
            console.log('Decoding audio...');
            const decodePromise = this.audioContext.decodeAudioData(arrayBuffer);
            const decodeTimeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Audio decode timeout')), 30000)
            );
            
            this.audioBuffer = await Promise.race([decodePromise, decodeTimeoutPromise]);
            this.duration = this.audioBuffer.duration;
            
            console.log(`Audio decoded successfully. Duration: ${this.duration.toFixed(2)}s`);
            
            this.showLoadingOverlay('Generating notes...');
            
            const fileName = file.name.replace(/\.[^/.]+$/, '');
            if (this.songTitle) this.songTitle.textContent = fileName;
            if (this.songArtist) this.songArtist.textContent = 'Custom Track';
            
            this.difficulty = 'medium';
            this.currentLevel = 0;
            
            this.setNoteSpeedForDifficulty();
            
            console.log('Analyzing audio and generating notes...');
            await this.analyzeAudioAndGenerateNotes();
            
            console.log('Audio processing complete, starting game...');
            
            this.hideLoadingOverlay();
            
            this.startGame();
            
        } catch (error) {
            console.error('Error processing audio:', error);
            this.hideLoadingOverlay();
            alert(`Error processing audio file: ${error.message}\n\nPlease try a different file (MP3, WAV, OGG, M4A).`);
            this.uploadButton.textContent = '🎵 Upload Audio File';
            this.uploadButton.disabled = false;
            if (this.uploadInfo) {
                this.uploadInfo.textContent = 'Supports MP3, WAV, OGG, M4A';
            }
        }
    }

    setCharacterState(state) {
        if (!this.character) return;
        
        this.character.classList.remove(this.characterState);
        this.characterState = state;
        this.character.classList.add(state);
        
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

    updateMapScroll(currentTime) {
        const deltaTime = currentTime - this.lastScrollTime;
        const scrollSpeed = 0.02 + (this.currentLevel * 0.005);
        
        this.scrollPositions.layer1 = (this.scrollPositions.layer1 + scrollSpeed * 0.1) % 100;
        this.scrollPositions.layer2 = (this.scrollPositions.layer2 + scrollSpeed * 0.3) % 100;
        this.scrollPositions.layer3 = (this.scrollPositions.layer3 + scrollSpeed * 0.5) % 100;
        this.scrollPositions.layer4 = (this.scrollPositions.layer4 + scrollSpeed * 0.8) % 100;
        
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
        this.healthDrainAmount = this.healthDrainByDifficulty[this.difficulty] || 5;
        
        console.log(`Difficulty: ${this.difficulty}, Note Speed: ${this.noteSpeed}, Health Drain: ${this.healthDrainAmount}`);
    }

    detectBeat(currentTime) {
        if (!this.analyser || !this.audioData) return false;
        
        this.analyser.getByteFrequencyData(this.audioData);
        
        let bassSum = 0;
        const bassRange = this.audioData.slice(0, 10);
        
        for (let i = 0; i < bassRange.length; i++) {
            bassSum += bassRange[i];
        }
        
        const bassAverage = bassSum / bassRange.length;
        const normalizedBass = bassAverage / 255;
        
        const isBeat = normalizedBass > this.beatThreshold;
        
        if (isBeat && (currentTime - this.lastBeatTime > 0.2)) {
            this.lastBeatTime = currentTime;
            this.triggerBeatReactiveVisuals(normalizedBass);
            return true;
        }
        
        return false;
    }

    triggerBeatReactiveVisuals(intensity) {
        if (this.beatGlow) {
            this.beatGlow.classList.add('active');
            setTimeout(() => {
                this.beatGlow.classList.remove('active');
            }, 100);
        }
        
        this.animateCharacterToBeat();
        
        if (intensity > 0.6) {
            this.activateCharacterAura();
        }
        
        if (this.multiplierPulse) {
            this.multiplierPulse.classList.add('beat-active');
            setTimeout(() => {
                this.multiplierPulse.classList.remove('beat-active');
            }, 150);
        }
    }

    async analyzeAudioAndGenerateNotes() {
        console.log('Starting audio analysis...');
        
        const channelData = this.audioBuffer.getChannelData(0);
        const sampleRate = this.audioBuffer.sampleRate;
        const duration = this.audioBuffer.duration;
        
        if (duration > 180) {
            console.log('Long file detected, using simple pattern generation');
            this.notes = this.generateSimpleNotes(duration);
            console.log(`Generated ${this.notes.length} notes using simple pattern`);
            return;
        }
        
        if (channelData.length > 5000000) {
            console.log('Large file detected, using optimized analysis');
            
            try {
                const analysisPromise = this.generateNotesFromAudioOptimized(channelData, sampleRate);
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Analysis timeout')), 15000)
                );
                
                const notes = await Promise.race([analysisPromise, timeoutPromise]);
                this.notes = notes;
                console.log(`Generated ${this.notes.length} notes using optimized analysis`);
                return;
            } catch (error) {
                if (error.message === 'Analysis timeout') {
                    console.log('Analysis timed out, falling back to simple pattern');
                    this.notes = this.generateSimpleNotes(duration);
                    console.log(`Generated ${this.notes.length} notes using fallback simple pattern`);
                    return;
                }
                throw error;
            }
        }
        
        try {
            const notes = await Promise.race([
                this.generateNotesFromAudioOptimized(channelData, sampleRate),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Analysis timeout')), 10000)
                )
            ]);
            this.notes = notes;
            console.log(`Generated ${this.notes.length} notes`);
        } catch (error) {
            if (error.message === 'Analysis timeout') {
                console.log('Analysis timed out, falling back to simple pattern');
                this.notes = this.generateSimpleNotes(duration);
                console.log(`Generated ${this.notes.length} notes using fallback simple pattern`);
                return;
            }
            throw error;
        }
    }
    
    generateSimpleNotes(duration) {
        const notes = [];
        let noteId = 0;
        
        const notesPerSecond = {
            easy: 2.0,
            medium: 3.0,
            hard: 4.0,
            expert: 5.0,
            master: 6.0
        };
        
        const noteRate = notesPerSecond[this.difficulty] || 3.0;
        const totalNotes = Math.floor(duration * noteRate);
        
        const gracePeriod = this.gracePeriod + this.noteLeadTime;
        const playableTime = duration - gracePeriod;
        const minTimeBetweenNotes = 0.3;
        
        if (playableTime < 0.5) {
            console.warn('Song too short for proper note generation');
            return notes;
        }
        
        let lastNoteTime = gracePeriod;
        
        for (let i = 0; i < totalNotes; i++) {
            const baseTime = gracePeriod + (i / totalNotes) * playableTime;
            const timeVariation = (Math.random() - 0.5) * 0.05;
            let adjustedTime = Math.max(gracePeriod + 0.5, baseTime + timeVariation);
            
            if (adjustedTime - lastNoteTime < minTimeBetweenNotes) {
                adjustedTime = lastNoteTime + minTimeBetweenNotes;
            }
            lastNoteTime = adjustedTime;
            
            const isComboNote = Math.random() < this.comboNoteChance;
            const isHoldNote = Math.random() < this.holdNoteChance;
            
            if (isComboNote) {
                const holdDuration = 1.0 + Math.random() * 1.5;
                const fret = this.frets[Math.floor(Math.random() * this.frets.length)];
                
                notes.push({
                    id: noteId++,
                    time: adjustedTime,
                    fret: fret,
                    energy: Math.random(),
                    hit: false,
                    missed: false,
                    isHold: true,
                    holdDuration: holdDuration,
                    isCombo: true,
                    comboId: noteId,
                    holdScoreAccumulated: 0
                });
            } else if (isHoldNote) {
                const holdDuration = 0.5 + Math.random() * 0.5;
                const fret = this.frets[Math.floor(Math.random() * this.frets.length)];
                
                notes.push({
                    id: noteId++,
                    time: adjustedTime,
                    fret: fret,
                    energy: Math.random(),
                    hit: false,
                    missed: false,
                    isHold: true,
                    holdDuration: holdDuration,
                    holdScoreAccumulated: 0
                });
            } else {
                const fret = this.frets[Math.floor(Math.random() * this.frets.length)];
                
                notes.push({
                    id: noteId++,
                    time: adjustedTime,
                    fret: fret,
                    energy: Math.random(),
                    hit: false,
                    missed: false,
                    isHold: false,
                    holdDuration: 0
                });
            }
            
            if (i % 500 === 0) {
            }
        }
        
        notes.sort((a, b) => a.time - b.time);
        
        return notes;
    }

    async generateNotesFromAudioOptimized(channelData, sampleRate) {
        const notes = [];
        
        console.log('Downsampling audio data...');
        
        const downsampleFactor = Math.max(1, Math.floor(channelData.length / 200000));
        const downsampledData = [];
        
        for (let i = 0; i < channelData.length; i += downsampleFactor) {
            downsampledData.push(Math.abs(channelData[i]));
            
            if (i % (downsampleFactor * 5000) === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        
        console.log(`Downsampled to ${downsampledData.length} samples`);
        
        const effectiveSampleRate = sampleRate / downsampleFactor;
        const windowSize = Math.floor(effectiveSampleRate * 0.1);
        const hopSize = Math.floor(effectiveSampleRate * 0.05);
        
        const energies = [];
        const numWindows = Math.floor((downsampledData.length - windowSize) / hopSize);
        
        console.log(`Calculating energy for ${numWindows} windows...`);
        
        for (let i = 0; i < numWindows; i++) {
            const startIdx = i * hopSize;
            let energy = 0;
            for (let j = 0; j < windowSize; j++) {
                energy += downsampledData[startIdx + j];
            }
            energies.push(energy / windowSize);
            
            if (i % 50 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        
        console.log(`Energy calculation complete: ${energies.length} windows`);
        
        const threshold = this.calculateThresholdOptimized(energies);
        console.log(`Threshold calculated: ${threshold.toFixed(4)}`);
        
        const beats = [];
        const minBeatInterval = this.getMinBeatInterval();
        const minIntervalSamples = Math.floor(minBeatInterval * effectiveSampleRate / hopSize);
        
        console.log('Detecting beats...');
        
        for (let i = 1; i < energies.length - 1; i++) {
            if (energies[i] > threshold && 
                energies[i] > energies[i - 1] && 
                energies[i] > energies[i + 1]) {
                
                const time = (i * hopSize) / sampleRate * downsampleFactor;
                
                if (beats.length === 0 || time - beats[beats.length - 1].time >= minBeatInterval) {
                    beats.push({
                        time: time,
                        energy: energies[i]
                    });
                }
            }
            
            if (i % 50 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        
        console.log(`Found ${beats.length} beats`);
        
        let noteId = 0;
        
        console.log('Generating notes...');
        
        const gracePeriod = this.gracePeriod + this.noteLeadTime;
        const validBeats = beats.filter(beat => beat.time >= gracePeriod);
        console.log(`Filtered ${beats.length - validBeats.length} early beats, ${validBeats.length} remain`);
        
        const batchSize = 50;
        for (let batch = 0; batch < validBeats.length; batch += batchSize) {
            const end = Math.min(batch + batchSize, validBeats.length);
            
            for (let i = batch; i < end; i++) {
                const beat = validBeats[i];
                
                const isComboNote = beat.energy > threshold * 2 && Math.random() < this.comboNoteChance;
                const isHoldNote = Math.random() < this.holdNoteChance;
                
                if (isComboNote) {
                    const holdDuration = 1.0 + Math.random() * 1.5;
                    const fret = this.selectFret(beat.energy, i);
                    
                    notes.push({
                        id: noteId++,
                        time: beat.time,
                        fret: fret,
                        energy: beat.energy,
                        hit: false,
                        missed: false,
                        isHold: true,
                        holdDuration: holdDuration,
                        isCombo: true,
                        comboId: noteId,
                        holdScoreAccumulated: 0
                    });
                } else if (isHoldNote) {
                    const holdDuration = 0.5 + Math.random() * 0.5;
                    const fret = this.selectFret(beat.energy, i);
                    
                    notes.push({
                        id: noteId++,
                        time: beat.time,
                        fret: fret,
                        energy: beat.energy,
                        hit: false,
                        missed: false,
                        isHold: true,
                        holdDuration: holdDuration,
                        holdScoreAccumulated: 0
                    });
                } else {
                    const fret = this.selectFret(beat.energy, i);
                    
                    notes.push({
                        id: noteId++,
                        time: beat.time,
                        fret: fret,
                        energy: beat.energy,
                        hit: false,
                        missed: false,
                        isHold: false,
                        holdDuration: 0
                    });
                }
            }
            
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        console.log(`Generated ${notes.length} notes`);
        return notes;
    }

    calculateThresholdOptimized(energies) {
        const sampleSize = Math.min(energies.length, 2000);
        const step = Math.max(1, Math.floor(energies.length / sampleSize));
        
        let sum = 0;
        let count = 0;
        for (let i = 0; i < energies.length; i += step) {
            sum += energies[i];
            count++;
        }
        
        const mean = sum / count;
        
        let sqSum = 0;
        for (let i = 0; i < energies.length; i += step) {
            sqSum += Math.pow(energies[i] - mean, 2);
        }
        
        const stdDev = Math.sqrt(sqSum / count);
        
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

    selectFret(energy, index) {
        const fretIndex = Math.floor((energy + index * 0.1) * 7) % 5;
        return this.frets[fretIndex];
    }

    startGame() {
        if (this.isPlaying) {
            console.log('Game already playing, not starting again');
            return;
        }
        
        if (!this.audioBuffer) {
            console.error('No audio buffer loaded, cannot start game');
            alert('Error: No audio loaded. Please try again.');
            this.returnToMenu();
            return;
        }
        
        if (!this.notes || this.notes.length === 0) {
            console.error('No notes generated, cannot start game');
            alert('Error: No notes generated. Please try again.');
            this.returnToMenu();
            return;
        }
        
        console.log('Starting game...');
        console.log(`Total notes: ${this.notes.length}`);
        console.log(`First note time: ${this.notes[0]?.time.toFixed(2)}s`);
        console.log(`Grace period: ${this.gracePeriod}s`);
        
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
        
        this.gameStartTime = this.audioContext.currentTime;
        
        this.calculateTargetY();
        
        this.notes.forEach(note => {
            note.hit = false;
            note.missed = false;
            note.holdStarted = false;
            note.holdCompleted = false;
            if (note.isHold) {
                note.holdScoreAccumulated = 0;
            }
        });
        
        this.updateHUD();
        this.updateHealthBar();
        if (this.levelNumber) this.levelNumber.textContent = this.currentLevel || '?';
        
        if (this.mainMenu) this.mainMenu.classList.add('hidden');
        if (this.pauseMenu) this.pauseMenu.classList.remove('active');
        if (this.settingsMenu) this.settingsMenu.classList.remove('active');
        if (this.songCompleteMenu) this.songCompleteMenu.classList.remove('active');
        
        if (this.gameContainer) {
            this.gameContainer.classList.remove('hidden');
            console.log('Game container shown');
        }
        
        this.setCharacterState('idle');
        
        if (this.uploadButton && this.currentLevel === 0) {
            this.uploadButton.textContent = '🎵 Upload Audio File';
            this.uploadButton.disabled = false;
            if (this.uploadInfo) {
                this.uploadInfo.textContent = 'Supports MP3, WAV, OGG, M4A';
            }
        }
        
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
            if (this.isPlaying && !this.isPaused) {
                this.endGame();
            }
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
        this.notes.forEach(note => {
            // FIXED: Only spawn notes that haven't been hit or missed
            // Don't spawn notes that are too close to target line
            // Spawn notes that will reach target line AFTER current position
            if (!note.hit && !note.missed && 
                !this.activeNotes.includes(note) &&
                note.time <= currentTime + this.noteLeadTime &&
                note.time > currentTime + 0.3) {
                this.activeNotes.push(note);
                this.createNoteElement(note);
            }
        });
    }

    updateNotes(currentTime) {
        this.activeNotes.forEach(note => {
            if (note.hit || note.missed) return;
            
            const timeDiff = note.time - currentTime;
            const gameTime = this.audioContext.currentTime - this.gameStartTime;
            
            // FIXED: Only drain health and mark as miss after grace period
            if (gameTime >= this.gracePeriod) {
                if (timeDiff < -this.timingWindows.good / 1000 && !note.isHold) {
                    this.missNote(note);
                }
                
                if (note.isHold && timeDiff < -this.timingWindows.good / 1000 && !note.holdStarted) {
                    this.missNote(note);
                }
            }
        });
        
        this.activeNotes = this.activeNotes.filter(note => 
            !note.missed || this.noteHighway.contains(note.element)
        );
    }

    createNoteElement(note) {
        const element = document.createElement('div');
        
        let classes = `note ${note.fret}`;
        if (note.isHold) {
            classes += ' hold-note';
        }
        
        element.className = classes;
        element.dataset.noteId = note.id;
        
        const lane = document.querySelector(`.fret-lane[data-fret="${note.fret}"]`);
        if (!lane) return;
        
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
            
            const timeToTarget = note.time - currentTime;
            
            // FIXED: Calculate position based on time remaining to target
            // When timeToTarget = noteLeadTime, note is at spawn (top)
            // When timeToTarget = 0, note is at target line
            const progress = 1 - (timeToTarget / this.noteLeadTime);
            
            const clampedProgress = Math.max(0, Math.min(1, progress));
            
            const y = this.noteSpawnY + clampedProgress * (this.targetY - this.noteSpawnY);
            note.element.style.top = y + 'px';
            
            // Handle hold note height
            if (note.isHold && note.holdDuration > 0) {
                const holdProgress = Math.min(1, Math.max(0, (currentTime - note.time) / note.holdDuration));
                const holdHeight = holdProgress * (this.targetY - this.noteSpawnY) * 0.3;
                note.element.style.height = (20 + holdHeight) + 'px';
            }
            
            if (note.isHold && currentTime > note.time + note.holdDuration) {
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
        
        // FIXED: Find the closest note in this fret lane
        const closestNote = this.activeNotes
            .filter(note => note.fret === fret && !note.hit && !note.missed)
            .sort((a, b) => Math.abs(a.time - currentTime) - Math.abs(b.time - currentTime))[0];
        
        if (closestNote) {
            const timeDiff = Math.abs(closestNote.time - currentTime) * 1000;
            
            // FIXED: Check if note is within timing window
            if (timeDiff <= this.timingWindows.good) {
                let hitType;
                if (timeDiff <= this.timingWindows.perfect) {
                    hitType = 'perfect';
                } else if (timeDiff <= this.timingWindows.great) {
                    hitType = 'great';
                } else {
                    hitType = 'good';
                }
                
                if (closestNote.isHold) {
                    closestNote.holdStarted = true;
                    this.hitNote(closestNote, hitType);
                } else {
                    this.hitNote(closestNote, hitType);
                }
            }
        }
    }

    animateFretButton(fret) {
        const button = this.fretButtons[fret];
        if (button) {
            button.classList.add('pressed');
            setTimeout(() => button.classList.remove('pressed'), 100);
        }
    }

    animateFretButtonRelease(fret) {
        const button = this.fretButtons[fret];
        if (button) {
            button.classList.remove('pressed');
        }
    }

    hitNote(note, hitType) {
        note.hit = true;
        
        const points = {
            perfect: 100,
            great: 75,
            good: 50
        };
        
        let basePoints = points[hitType];
        if (note.isHold) {
            basePoints *= 1.5;
        }
        if (note.isCombo) {
            basePoints *= 1.3;
        }
        
        this.score += Math.floor(basePoints * this.multiplier);
        this.combo++;
        
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
        
        this.updateMultiplier();
        
        if (hitType === 'perfect') this.perfectHits++;
        else if (hitType === 'great') this.greatHits++;
        else this.goodHits++;
        
        this.setCharacterState('hit');
        this.activateCharacterAura();
        
        this.showHitFeedback(hitType);
        this.animateNoteHit(note);
        
        this.updateHUD();
        
        if (!note.isHold || note.holdCompleted) {
            const index = this.activeNotes.indexOf(note);
            if (index > -1) {
                this.activeNotes.splice(index, 1);
            }
        }
        
        setTimeout(() => {
            if (note.element && note.element.parentNode && (!note.isHold || note.holdCompleted)) {
                note.element.parentNode.removeChild(note.element);
            }
        }, 200);
    }
    
    updateHoldNoteScore(note, deltaTime) {
        if (!note.isHold || !note.holdStarted || note.holdCompleted) return;
        
        const pointsPerSecond = 100 * this.multiplier;
        const pointsToAdd = Math.floor(pointsPerSecond * deltaTime);
        
        if (pointsToAdd > 0 && note.holdScoreAccumulated < note.holdDuration * pointsPerSecond) {
            note.holdScoreAccumulated += pointsToAdd;
            this.score += pointsToAdd;
            this.updateHUD();
        }
    }
    
    completeHoldNote(note) {
        const bonusPoints = Math.floor(50 * this.multiplier);
        this.score += bonusPoints;
        this.updateHUD();
        
        this.showHitFeedback('perfect');
        
        const index = this.activeNotes.indexOf(note);
        if (index > -1) {
            this.activeNotes.splice(index, 1);
        }
        
        setTimeout(() => {
            if (note.element && note.element.parentNode) {
                note.element.parentNode.removeChild(note.element);
            }
        }, 200);
    }

    missNote(note) {
        const currentTime = this.audioContext.currentTime - this.startTime;
        const gameTime = this.audioContext.currentTime - this.gameStartTime;
        
        if (gameTime < this.gracePeriod) {
            console.log('Grace period active, no health drain');
            note.missed = true;
            return;
        }
        
        note.missed = true;
        this.combo = 0;
        this.multiplier = 1;
        this.misses++;
        
        this.drainHealth();
        
        this.setCharacterState('miss');
        this.showMissFeedback();
        this.animateNoteMiss(note);
        
        this.updateHUD();
        
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
        
        if (this.currentHealth <= 0) {
            this.triggerGameOver();
        }
    }
    
    updateHealthBar() {
        const healthBar = document.getElementById('healthBarFill');
        if (healthBar) {
            const percentage = (this.currentHealth / this.maxHealth) * 100;
            healthBar.style.width = percentage + '%';
            
            if (percentage > 60) {
                healthBar.style.background = 'linear-gradient(90deg, #00FFFF, #39FF14)';
            } else if (percentage > 30) {
                healthBar.style.background = 'linear-gradient(90deg, #FFFF00, #FFA500)';
            } else {
                healthBar.style.background = 'linear-gradient(90deg, #FF0000, #FF1493)';
            }
        }
        
        const healthText = document.getElementById('healthValue');
        if (healthText) {
            healthText.textContent = Math.ceil(this.currentHealth);
        }
    }
    
    triggerGameOver() {
        this.isPlaying = false;
        
        if (this.audioSource) {
            this.audioSource.stop();
        }
        
        this.showGameOver();
    }

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
        
        this.cleanup();
        
        this.isPlaying = false;
        this.isPaused = false;
        
        if (this.pauseMenu) this.pauseMenu.classList.remove('active');
        if (this.songCompleteMenu) this.songCompleteMenu.classList.remove('active');
        const gameOverMenu = document.getElementById('gameOverMenu');
        if (gameOverMenu) {
            gameOverMenu.classList.remove('active');
        }
        
        setTimeout(() => {
            this.startGame();
        }, 100);
    }

    async playNextLevel() {
        if (this.currentLevel < this.maxLevel) {
            this.currentLevel++;
            this.cleanup();
            this.songCompleteMenu.classList.remove('active');
            
            this.difficulty = this.getDifficultyForLevel(this.currentLevel);
            this.isPlaying = false;
            
            try {
                this.showLoadingOverlay(`Loading Level ${this.currentLevel}...`);
                
                await this.loadLevelAudio(this.currentLevel);
                
                this.showLoadingOverlay(`Preparing Level ${this.currentLevel}...`);
                
                await this.playCutscene(this.currentLevel);
                
                this.hideLoadingOverlay();
                
                this.startGame();
            } catch (error) {
                console.error('Error loading next level:', error);
                this.hideLoadingOverlay();
                alert(`Error loading Level ${this.currentLevel}: ${error.message}`);
                this.returnToMenu();
            }
        } else {
            alert('You have completed all levels! Congratulations!');
            this.returnToMenu();
        }
    }

    endGame() {
        this.isPlaying = false;
        
        this.cleanup();
        
        if (this.currentHealth > 0) {
            this.showSongComplete();
            
            const songName = this.currentLevel > 0 ? `Level ${this.currentLevel}` : 'Custom Track';
            this.saveLocalHighScore(songName, this.score);
        }
    }

    saveLocalHighScore(songName, score) {
        const scores = this.getLocalHighScores();
        scores.push({
            songName: songName,
            score: score,
            date: new Date().toISOString(),
            difficulty: this.difficulty
        });
        
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
        
        const leaderboardsModal = document.getElementById('leaderboardsModal');
        if (leaderboardsModal) leaderboardsModal.remove();
        
        if (this.gameContainer) this.gameContainer.classList.add('hidden');
        if (this.mainMenu) this.mainMenu.classList.remove('hidden');
        
        if (this.uploadButton) {
            this.uploadButton.textContent = '🎵 Upload Audio File';
            this.uploadButton.disabled = false;
        }
        if (this.uploadInfo) {
            this.uploadInfo.textContent = 'Supports MP3, WAV, OGG, M4A';
        }
        
        // FIXED: Always reset file input when returning to menu
        if (this.audioFileInput) {
            this.audioFileInput.value = '';
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
        
        this.hideLoadingOverlay();
    }
    
    showLoadingOverlay(message = 'Loading...') {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = 'flex';
            if (this.loadingText) {
                this.loadingText.textContent = message;
            }
        }
    }
    
    hideLoadingOverlay() {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = 'none';
        }
    }
}

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