// ==================================
// NEON NIGHTMARE - Game Engine
// Level Select & Cutscene Version 
// ==================================

class NeonNightmare {
    constructor() {
        console.log('NeonNightmare constructor called');
        
        try {
            // Game State
            this.isPlaying = false;
            this.isPaused = false;
            this.score = 0;
            this.combo = 0;
            this.maxCombo = 0;
            this.multiplier = 1;
            this.difficulty = 'medium';
            
            // Firebase & User Profile
            this.db = null;
            this.auth = null;
            this.currentUser = null;
            this.userProfile = {
                level: 1,
                xp: 0,
                xpToNextLevel: 100,
                profileIcon: '🎸',
                totalScore: 0,
                songsPlayed: 0
            };
            
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
            
            // Hold Notes
            this.activeHolds = {}; // Track active hold notes by fret
            this.holdNoteDuration = 1000; // Duration in milliseconds for hold notes
        
        // Health System
        this.maxHealth = 100;
        this.currentHealth = 100;
        this.healthDrainPerDifficulty = {
            easy: 2,
            medium: 3,
            hard: 5,
            expert: 7,
            master: 10
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
            good: 150,
            hold: 300  // Larger timing window for hold notes
        };
        
        // DOM Elements
        this.initializeElements();
        this.setupEventListeners();
        this.createParticles();
        this.initializeCharacter();
        this.initializeMap();
        this.generateLevelGrid();
        this.initializeFirebase();
        this.loadUserProfile();
        
        console.log('NeonNightmare initialized successfully');
        } catch (error) {
            console.error('Error in NeonNightmare constructor:', error);
            throw error;
        }
    }

    // ===================================
    // Initialization
    // ===================================

    initializeElements() {
        console.log('Initializing elements...');
        
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
        
        console.log('Upload button:', this.uploadButton);
        console.log('Audio file input:', this.audioFileInput);
        
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
        
        // Profile Elements
        this.playerProfile = document.getElementById('playerProfile');
        this.profilePic = document.getElementById('profilePic');
        this.profileEmoji = document.getElementById('profileEmoji');
        this.playerLevel = document.getElementById('playerLevel');
        this.xpFill = document.getElementById('xpFill');
        this.xpText = document.getElementById('xpText');
        this.authBtn = document.getElementById('authBtn');
        this.leaderboardMenu = document.getElementById('leaderboardMenu');
        
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
        
        console.log('Elements initialized');
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
    
    // ===================================
    // Firebase Integration
    // ===================================
    
    async initializeFirebase() {
        // Firebase is initialized in the module script in HTML
        // This method sets up auth state listener
        if (window.firebaseAuth) {
            this.auth = window.firebaseAuth;
            this.db = window.firebaseDb;
            this.provider = window.firebaseProvider;
            
            // Set up auth state listener
            this.auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                this.updateProfileDisplay(user);
            });
            
            // Set up auth button click handler
            if (this.authBtn) {
                this.authBtn.addEventListener('click', () => {
                    if (this.currentUser) {
                        this.auth.signOut();
                    } else {
                        this.auth.signInWithPopup(this.provider).catch(error => {
                            console.error('Auth error:', error);
                            alert('Authentication failed. Please try again.');
                        });
                    }
                });
            }
        } else {
            console.log('Firebase not yet initialized, will retry...');
            // Retry after a short delay
            setTimeout(() => this.initializeFirebase(), 1000);
        }
    }
    
    async loadUserProfile() {
        if (!this.currentUser || !this.db) return;
        
        const { doc, getDoc } = window.firebaseDocs;
        const userRef = doc(this.db, 'users', this.currentUser.uid);
        const snap = await getDoc(userRef);
        
        if (snap.exists()) {
            const data = snap.data();
            this.userProfile = {
                level: data.level || 1,
                xp: data.xp || 0,
                xpToNextLevel: this.getXPForLevel((data.level || 1) + 1),
                profileIcon: data.profileIcon || '🎸',
                totalScore: data.totalScore || 0,
                songsPlayed: data.songsPlayed || 0
            };
        } else {
            // Create new user profile
            await this.createNewUserProfile();
        }
        
        this.updateProfileDisplay(this.currentUser);
    }
    
    async createNewUserProfile() {
        if (!this.currentUser || !this.db) return;
        
        const { doc, setDoc } = window.firebaseDocs;
        const userRef = doc(this.db, 'users', this.currentUser.uid);
        
        const newProfile = {
            level: 1,
            xp: 10,
            profileIcon: '🎸',
            totalScore: 0,
            songsPlayed: 0,
            createdAt: new Date().toISOString()
        };
        
        await setDoc(userRef, newProfile);
        this.userProfile = {
            ...newProfile,
            xpToNextLevel: this.getXPForLevel(2)
        };
    }
    
    getXPForLevel(level) {
        const levels = [0, 200, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000];
        return levels[level] || levels[levels.length - 1] + (level - 9) * 5000;
    }
    
    calculateLevelFromXP(xp) {
        const levels = [0, 200, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000];
        let level = 1;
        for (let i = 1; i < levels.length; i++) {
            if (xp >= levels[i]) {
                level = i + 1;
            } else {
                break;
            }
        }
        return level;
    }
    
    updateProfileDisplay(user) {
        if (!user) {
            this.authBtn.textContent = 'Login';
            this.profilePic.style.display = 'none';
            this.profileEmoji.style.display = 'block';
            this.playerLevel.textContent = '1';
            this.xpFill.style.width = '0%';
            this.xpText.textContent = '0 / 100 XP';
            return;
        }
        
        this.authBtn.textContent = 'Logout';
        
        if (user.photoURL) {
            this.profilePic.src = user.photoURL;
            this.profilePic.style.display = 'block';
            this.profileEmoji.style.display = 'none';
        }
        
        // Load user profile data
        this.loadUserProfile();
        
        // Update level and XP display
        const level = this.userProfile.level;
        const xp = this.userProfile.xp;
        const currentLevelXP = this.getXPForLevel(level);
        const nextLevelXP = this.getXPForLevel(level + 1);
        const progress = nextLevelXP > currentLevelXP ? 
            ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100 : 100;
        
        this.playerLevel.textContent = level;
        this.xpFill.style.width = progress + '%';
        this.xpText.textContent = `${xp} / ${nextLevelXP} XP`;
    }
    
    async addXP(amount) {
        if (!this.currentUser || !this.db) return;
        
        const newXP = this.userProfile.xp + amount;
        const newLevel = this.calculateLevelFromXP(newXP);
        const leveledUp = newLevel > this.userProfile.level;
        
        this.userProfile.xp = newXP;
        this.userProfile.level = newLevel;
        this.userProfile.xpToNextLevel = this.getXPForLevel(newLevel + 1);
        
        const { doc, updateDoc } = window.firebaseDocs;
        const userRef = doc(this.db, 'users', this.currentUser.uid);
        
        await updateDoc(userRef, {
            xp: newXP,
            level: newLevel
        });
        
        this.updateProfileDisplay(this.currentUser);
        
        return leveledUp;
    }
    
    async submitScore(score, songName, difficulty) {
        if (!this.currentUser || !this.db) return;
        
        const { collection, doc, setDoc, updateDoc, getDoc } = window.firebaseDocs;
        
        // Create score document
        const scoreId = `${this.currentUser.uid}_${Date.now()}`;
        const scoreRef = doc(this.db, 'scores', scoreId);
        
        await setDoc(scoreRef, {
            userId: this.currentUser.uid,
            userName: this.currentUser.displayName || 'Anonymous',
            score: score,
            songName: songName,
            difficulty: difficulty,
            level: this.userProfile.level,
            timestamp: new Date().toISOString()
        });
        
        // Update user profile
        const userRef = doc(this.db, 'users', this.currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const userData = userSnap.data();
            const totalScore = (userData.totalScore || 0) + score;
            const songsPlayed = (userData.songsPlayed || 0) + 1;
            
            await updateDoc(userRef, {
                totalScore: totalScore,
                songsPlayed: songsPlayed
            });
            
            this.userProfile.totalScore = totalScore;
            this.userProfile.songsPlayed = songsPlayed;
        }
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
        const uploadButton = document.getElementById('uploadButton');
        const audioFileInput = document.getElementById('audioFileInput');
        
        if (uploadButton && audioFileInput) {
            uploadButton.addEventListener('click', () => audioFileInput.click());
            audioFileInput.addEventListener('change', (e) => this.handleFileUpload(e));
            console.log('Upload button listeners attached');
        } else {
            console.error('Upload button or audio input not found!');
        }
        
        // Menu Buttons - Use event delegation or null checks
        const selectLevelBtn = document.getElementById('selectLevel');
        if (selectLevelBtn) {
            selectLevelBtn.addEventListener('click', () => {
                console.log('Select Level clicked');
                this.showLevelSelect();
            });
            console.log('Select Level listener attached');
        }
        
        const openSettingsBtn = document.getElementById('openSettings');
        if (openSettingsBtn) {
            openSettingsBtn.addEventListener('click', () => this.showSettings());
            console.log('Settings listener attached');
        }
        
        const viewLeaderboardsBtn = document.getElementById('viewLeaderboards');
        if (viewLeaderboardsBtn) {
            viewLeaderboardsBtn.addEventListener('click', () => this.showLeaderboards());
            console.log('Leaderboards listener attached');
        }
        
        const backToMainMenuBtn = document.getElementById('backToMainMenu');
        if (backToMainMenuBtn) {
            backToMainMenuBtn.addEventListener('click', () => this.hideLevelSelect());
        }
        
        const closeLeaderboardBtn = document.getElementById('closeLeaderboard');
        if (closeLeaderboardBtn) {
            closeLeaderboardBtn.addEventListener('click', () => this.hideLeaderboards());
        }
        
        // Pause Menu
        const resumeGameBtn = document.getElementById('resumeGame');
        if (resumeGameBtn) {
            resumeGameBtn.addEventListener('click', () => this.resumeGame());
        }
        
        const restartSongBtn = document.getElementById('restartSong');
        if (restartSongBtn) {
            restartSongBtn.addEventListener('click', () => this.restartSong());
        }
        
        const returnToMenuBtn = document.getElementById('returnToMenu');
        if (returnToMenuBtn) {
            returnToMenuBtn.addEventListener('click', () => this.returnToMenu());
        }
        
        const changeDifficultyBtn = document.getElementById('changeDifficulty');
        if (changeDifficultyBtn) {
            changeDifficultyBtn.addEventListener('click', () => {
                this.showSettings();
            });
        }
        
        // Settings
        const setDifficultyEasyBtn = document.getElementById('setDifficultyEasy');
        if (setDifficultyEasyBtn) {
            setDifficultyEasyBtn.addEventListener('click', () => this.setDifficulty('easy'));
        }
        
        const setDifficultyMediumBtn = document.getElementById('setDifficultyMedium');
        if (setDifficultyMediumBtn) {
            setDifficultyMediumBtn.addEventListener('click', () => this.setDifficulty('medium'));
        }
        
        const setDifficultyHardBtn = document.getElementById('setDifficultyHard');
        if (setDifficultyHardBtn) {
            setDifficultyHardBtn.addEventListener('click', () => this.setDifficulty('hard'));
        }
        
        const setDifficultyExpertBtn = document.getElementById('setDifficultyExpert');
        if (setDifficultyExpertBtn) {
            setDifficultyExpertBtn.addEventListener('click', () => this.setDifficulty('expert'));
        }
        
        const setDifficultyMasterBtn = document.getElementById('setDifficultyMaster');
        if (setDifficultyMasterBtn) {
            setDifficultyMasterBtn.addEventListener('click', () => this.setDifficulty('master'));
        }
        
        const closeSettingsBtn = document.getElementById('closeSettings');
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => this.hideSettings());
        }
        
        // Theme Menu
        const openThemesBtn = document.getElementById('openThemes');
        if (openThemesBtn) {
            openThemesBtn.addEventListener('click', () => this.showThemes());
        }
        
        const closeThemesBtn = document.getElementById('closeThemes');
        if (closeThemesBtn) {
            closeThemesBtn.addEventListener('click', () => this.hideThemes());
        }
        
        // Theme Selection
        const neonTheme = document.getElementById('neon-theme');
        const rainbowSixSiegeTheme = document.getElementById('rainbow-six-siege-theme');
        const starWarsTheme = document.getElementById('star-wars-theme');
        const sonicTheme = document.getElementById('sonic-theme');
        const darkSoulsTheme = document.getElementById('dark-souls-theme');
        const warcraftTheme = document.getElementById('warcraft-theme');
        const avatarTheme = document.getElementById('avatar-theme');
        const finalFantasyTheme = document.getElementById('final-fantasy-theme');
        const callOfDutyTheme = document.getElementById('call-of-duty-theme');
        const minecraftTheme = document.getElementById('minecraft-theme');
        
        if (neonTheme) {
            neonTheme.addEventListener('click', () => this.selectTheme('neon'));
        }
        
        if (rainbowSixSiegeTheme) {
            rainbowSixSiegeTheme.addEventListener('click', () => this.selectTheme('rainbow-six-siege'));
        }
        
        if (starWarsTheme) {
            starWarsTheme.addEventListener('click', () => this.selectTheme('star-wars'));
        }
        
        if (sonicTheme) {
            sonicTheme.addEventListener('click', () => this.selectTheme('sonic'));
        }
        
        if (darkSoulsTheme) {
            darkSoulsTheme.addEventListener('click', () => this.selectTheme('dark-souls'));
        }
        
        if (warcraftTheme) {
            warcraftTheme.addEventListener('click', () => this.selectTheme('warcraft'));
        }
        
        if (avatarTheme) {
            avatarTheme.addEventListener('click', () => this.selectTheme('avatar'));
        }
        
        if (finalFantasyTheme) {
            finalFantasyTheme.addEventListener('click', () => this.selectTheme('final-fantasy'));
        }
        
        if (callOfDutyTheme) {
            callOfDutyTheme.addEventListener('click', () => this.selectTheme('call-of-duty'));
        }
        
        if (minecraftTheme) {
            minecraftTheme.addEventListener('click', () => this.selectTheme('minecraft'));
        }
        
        // Load saved theme
        this.loadTheme();
        this.updateThemeUnlockStatus();
        
        // Song Complete
        const playAgainBtn = document.getElementById('playAgain');
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => this.restartSong());
        }
        
        const nextLevelBtn = document.getElementById('nextLevel');
        if (nextLevelBtn) {
            nextLevelBtn.addEventListener('click', () => this.playNextLevel());
        }
        
        const selectLevelFromCompleteBtn = document.getElementById('selectLevelFromComplete');
        if (selectLevelFromCompleteBtn) {
            selectLevelFromCompleteBtn.addEventListener('click', () => this.showLevelSelect());
        }
        
        const mainMenuFromCompleteBtn = document.getElementById('mainMenuFromComplete');
        if (mainMenuFromCompleteBtn) {
            mainMenuFromCompleteBtn.addEventListener('click', () => this.returnToMenu());
        }
        
        // Game Over
        const restartFromGameOverBtn = document.getElementById('restartFromGameOver');
        if (restartFromGameOverBtn) {
            restartFromGameOverBtn.addEventListener('click', () => this.restartSong());
        }
        
        const uploadFromGameOverBtn = document.getElementById('uploadFromGameOver');
        if (uploadFromGameOverBtn) {
            uploadFromGameOverBtn.addEventListener('click', () => {
                this.returnToMenu();
                const uploadBtn = document.getElementById('uploadButton');
                if (uploadBtn) uploadBtn.click();
            });
        }
        
        const mainMenuFromGameOverBtn = document.getElementById('mainMenuFromGameOver');
        if (mainMenuFromGameOverBtn) {
            mainMenuFromGameOverBtn.addEventListener('click', () => this.returnToMenu());
        }
        
        // File Upload from complete menu
        const uploadNewSongBtn = document.getElementById('uploadNewSong');
        if (uploadNewSongBtn) {
            uploadNewSongBtn.addEventListener('click', () => {
                this.returnToMenu();
                const uploadBtn = document.getElementById('uploadButton');
                if (uploadBtn) uploadBtn.click();
            });
        }
        
        // Cutscene
        if (this.skipCutsceneButton && this.cutsceneVideo) {
            this.skipCutsceneButton.addEventListener('click', () => this.skipCutscene());
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
                button.addEventListener('mouseup', () => this.handleFretRelease(fret));
                button.addEventListener('mouseleave', () => this.handleFretRelease(fret));
                button.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.handleFretPress(fret);
                });
                button.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.handleFretRelease(fret);
                });
            }
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
        this.mainMenu.style.display = 'none';
        this.levelSelectMenu.classList.add('active');
    }

    hideLevelSelect() {
        this.levelSelectMenu.classList.remove('active');
        this.mainMenu.style.display = 'block';
    }

    async selectLevel(level) {
        this.currentLevel = level;
        this.hideLevelSelect();
        
        // Show loading screen
        this.showLoadingScreen('Loading Level', 'Preparing audio and notes...');
        
        // Set difficulty based on level
        this.difficulty = this.getDifficultyForLevel(level);
        
        // Load and play cutscene
        await this.playCutscene(level);
        
        // Load audio and start game
        await this.loadLevelAudio(level);
        
        // Hide loading screen
        this.hideLoadingScreen();
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
            // Initialize Audio Context if needed
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            await this.audioContext.resume();
            
            // Update loading progress
            this.updateLoadingProgress(20, 'Loading audio file...');
            
            // Update song info
            this.songTitle.textContent = `Level ${level}`;
            this.songArtist.textContent = this.difficulty.toUpperCase();
            
            // Load audio file
            const response = await fetch(audioUrl);
            
            if (!response.ok) {
                throw new Error(`Audio file not found: ${audioUrl}`);
            }
            
            // Update loading progress
            this.updateLoadingProgress(40, 'Decoding audio...');
            
            const arrayBuffer = await response.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.duration = this.audioBuffer.duration;
            
            // Update loading progress
            this.updateLoadingProgress(60, 'Analyzing beats...');
            
            // Analyze audio and generate notes
            await this.analyzeAudioAndGenerateNotes();
            
            // Update loading progress
            this.updateLoadingProgress(80, 'Starting game...');
            
            // Start game
            this.startGame();
            
        } catch (error) {
            console.error('Error loading audio:', error);
            this.hideLoadingScreen();
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
        
        // Show loading screen
        this.showLoadingScreen('Loading Custom Track', 'Processing your audio file...');
        
        try {
            // Initialize Audio Context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Update loading progress
            this.updateLoadingProgress(20, 'Reading file...');
            
            // Read file
            const arrayBuffer = await file.arrayBuffer();
            
            // Update loading progress
            this.updateLoadingProgress(40, 'Decoding audio...');
            
            // Decode audio
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.duration = this.audioBuffer.duration;
            
            // Update song info
            this.songTitle.textContent = file.name.replace(/\.[^/.]+$/, '');
            this.songArtist.textContent = 'Custom Track';
            
            // Use current difficulty setting (can be changed in settings before upload)
            // Default to medium if not set
            if (!this.difficulty) {
                this.difficulty = 'medium';
            }
            this.currentLevel = 0;
            
            // Set note speed based on difficulty
            this.setNoteSpeedForDifficulty();
            
            // Update loading progress
            this.updateLoadingProgress(60, 'Analyzing beats...');
            
            // Analyze audio and generate notes
            await this.analyzeAudioAndGenerateNotes();
            
            // Update loading progress
            this.updateLoadingProgress(80, 'Starting game...');
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            // Reset file input to allow re-uploading same file
            event.target.value = '';
            
            // Start game
            this.startGame();
            
        } catch (error) {
            console.error('Error processing audio:', error);
            this.hideLoadingScreen();
            // Reset file input on error too
            event.target.value = '';
            alert('Error processing audio file. Please try a different file.');
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
        console.log(`Difficulty: ${this.difficulty}, Note Speed: ${this.noteSpeed}`);
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
        filteredBeats.forEach((beat, index) => {
            const fret = this.selectFret(beat.energy, index);
            const isHold = Math.random() < this.getHoldNoteProbability();
            const isSimultaneous = Math.random() < this.getSimultaneousNoteProbability();
            const isHealth = Math.random() < 0.1; // 10% chance for health note
            
            const note = {
                id: index,
                time: beat.time,
                fret: fret,
                energy: beat.energy,
                hit: false,
                missed: false,
                isHold: isHold,
                isSimultaneous: isSimultaneous,
                isHealth: isHealth
            };
            
            notes.push(note);
            
            // Add simultaneous note if applicable
            if (isSimultaneous) {
                const secondFret = this.selectDifferentFret(fret);
                notes.push({
                    id: index + '_sim',
                    time: beat.time,
                    fret: secondFret,
                    energy: beat.energy,
                    hit: false,
                    missed: false,
                    isHold: isHold && Math.random() < 0.5, // 50% chance both are hold notes
                    isSimultaneous: true,
                    isHealth: false // Simultaneous notes are not health notes
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
            master: 0.15  // Challenging but not impossible - about 6-7 notes per second max
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
    
    selectDifferentFret(excludedFret) {
        const availableFrets = this.frets.filter(f => f !== excludedFret);
        const randomIndex = Math.floor(Math.random() * availableFrets.length);
        return availableFrets[randomIndex];
    }
    
    getHoldNoteProbability() {
        // Hold notes become more common on higher difficulties
        const probabilities = {
            easy: 0.1,
            medium: 0.15,
            hard: 0.2,
            expert: 0.25,
            master: 0.25  // Keep same as expert - master is hard enough with faster notes
        };
        return probabilities[this.difficulty] || 0.15;
    }
    
    getSimultaneousNoteProbability() {
        // Simultaneous notes are rare on all difficulties
        const probabilities = {
            easy: 0.05,
            medium: 0.08,
            hard: 0.1,
            expert: 0.12,
            master: 0.12  // Keep same as expert - too many simultaneous notes makes it impossible
        };
        return probabilities[this.difficulty] || 0.08;
    }

    // ===================================
    // Game Loop & Rendering
    // ===================================

    startGame() {
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
        this.gameStartTime = null; // Track when game actually starts
        this.gracePeriod = 1.0; // 1 second grace period at start
        
        // Reset notes
        this.notes.forEach(note => {
            note.hit = false;
            note.missed = false;
        });
        
        // Update UI - MUST show game container BEFORE calculating target Y
        this.updateHUD();
        this.levelNumber.textContent = this.currentLevel;
        this.mainMenu.style.display = 'none';
        this.gameContainer.classList.add('active');
        this.gameContainer.classList.remove('hidden');
        
        // NOW calculate target position after UI is visible
        // Use setTimeout to ensure DOM has updated
        setTimeout(() => {
            this.calculateTargetY();
        }, 50);
        
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
        this.gameStartTime = this.audioContext.currentTime; // Track actual game start
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
        
        // Check hold notes for auto-completion
        this.checkHoldNotes(currentTime);
        
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
        // Check if we're still in grace period
        const timeSinceStart = this.audioContext.currentTime - this.gameStartTime;
        const inGracePeriod = timeSinceStart < this.gracePeriod;
        
        this.activeNotes.forEach(note => {
            if (note.hit || note.missed) return;
            
            const timeDiff = note.time - currentTime;
            
            // Check for miss - but only after grace period
            // This prevents notes that spawn at negative time from causing immediate misses
            if (!inGracePeriod && timeDiff < -this.timingWindows.good / 1000) {
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
        element.className = `note ${note.fret}${note.isHold ? ' hold' : ''}${note.isHealth ? ' health' : ''}`;
        element.dataset.noteId = note.id;
        element.dataset.id = note.id;
        
        // Add health indicator if it's a health note
        if (note.isHealth) {
            const healthIndicator = document.createElement('div');
            healthIndicator.className = 'health-indicator';
            healthIndicator.textContent = '+';
            element.appendChild(healthIndicator);
        }
        
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
            
            // Debug: Check if note is at target line
            if (Math.abs(timeToTarget) < 0.016) { // Within one frame (16ms)
                console.log(`Note ${note.id} at target line! Y position: ${y}, Target Y: ${this.targetY}`);
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
            // Use larger timing window for hold notes (300ms vs 150ms)
            const timingWindow = closestNote.isHold ? this.timingWindows.hold : this.timingWindows.good;
            const timeDiff = Math.abs(closestNote.time - currentTime) * 1000;
            
            // Debug logging
            console.log(`Hit attempt: timeDiff=${timeDiff.toFixed(1)}ms, noteTime=${closestNote.time.toFixed(3)}s, currentTime=${currentTime.toFixed(3)}s, isHold=${closestNote.isHold}`);
            
            if (timeDiff <= timingWindow) {
                let hitType;
                if (timeDiff <= this.timingWindows.perfect) {
                    hitType = 'perfect';
                } else if (timeDiff <= this.timingWindows.great) {
                    hitType = 'great';
                } else {
                    hitType = 'good';
                }
                
                this.hitNote(closestNote, hitType);
                
                // Check if this is a hold note
                if (closestNote.isHold) {
                    this.startHoldNote(closestNote, fret);
                }
            } else {
                console.log(`Missed timing window: ${timeDiff.toFixed(1)}ms > ${timingWindow}ms`);
            }
        }
        
        // Animate fret button
        this.animateFretButton(fret);
    }
    
    handleFretRelease(fret) {
        if (!this.isPlaying || this.isPaused) return;
        
        // Check if there's an active hold note
        if (this.activeHolds[fret]) {
            this.endHoldNote(fret);
        }
        
        this.animateFretButtonRelease(fret);
    }
    
    startHoldNote(note, fret) {
        const currentTime = this.audioContext.currentTime - this.startTime;
        const holdDuration = 1.0; // 1 second hold duration
        const holdEndTime = note.time + holdDuration;
        
        this.activeHolds[fret] = {
            note: note,
            startTime: currentTime,
            holdEndTime: holdEndTime,
            holdDuration: holdDuration,
            isHolding: true,
            scoreInterval: null
        };
        
        // Visual feedback for holding
        const noteElement = document.querySelector(`.note[data-id="${note.id}"]`);
        if (noteElement) {
            noteElement.classList.add('holding');
        }
        
        // Start scoring points while holding (2x points for hold notes)
        this.activeHolds[fret].scoreInterval = setInterval(() => {
            if (this.activeHolds[fret] && this.activeHolds[fret].isHolding) {
                this.score += 20 * this.multiplier; // 2x points for hold notes
                this.updateHUD();
            }
        }, 100); // Score every 100ms while holding
    }
    
    endHoldNote(fret) {
        if (this.activeHolds[fret]) {
            const hold = this.activeHolds[fret];
            const currentTime = this.audioContext.currentTime - this.startTime;
            const holdTime = currentTime - hold.startTime;
            const halfwayPoint = hold.holdDuration / 2;
            
            // Clear the scoring interval
            clearInterval(hold.scoreInterval);
            
            // Check if held for at least halfway
            if (holdTime < halfwayPoint) {
                // Released too early - count as miss
                console.log(`Hold note released too early: ${holdTime.toFixed(2)}s < ${halfwayPoint.toFixed(2)}s`);
                this.combo = 0;
                this.multiplier = 1;
                this.misses++;
                this.drainHealth();
                this.showMissFeedback();
                this.updateHUD();
            } else {
                // Successfully held for at least halfway
                console.log(`Hold note successful: ${holdTime.toFixed(2)}s >= ${halfwayPoint.toFixed(2)}s`);
            }
            
            // Remove visual feedback
            const noteElement = document.querySelector(`.note[data-id="${hold.note.id}"]`);
            if (noteElement) {
                noteElement.classList.remove('holding');
            }
            
            delete this.activeHolds[fret];
        }
    }
    
    // Check if hold notes should end automatically
    checkHoldNotes(currentTime) {
        Object.keys(this.activeHolds).forEach(fret => {
            const hold = this.activeHolds[fret];
            if (hold && currentTime >= hold.holdEndTime) {
                // Hold note completed successfully
                console.log(`Hold note auto-completed for fret ${fret}`);
                this.endHoldNote(fret);
            }
        });
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
        
        // Check if this is a health note
        if (note.isHealth) {
            this.currentHealth = Math.min(this.maxHealth, this.currentHealth + 10);
            this.updateHealthBar();
            console.log('Health note hit! +10 HP');
        }
        
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
        const drainAmount = this.healthDrainPerDifficulty[this.difficulty] || 10;
        this.currentHealth = Math.max(0, this.currentHealth - drainAmount);
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
        
        // Health drain is already handled in missNote(), don't drain twice!
        
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
        const gameOverMenu = document.getElementById('gameOverMenu');
        if (gameOverMenu) {
            gameOverMenu.classList.remove('active');
        }
        
        // Start game
        this.startGame();
    }

    playNextLevel() {
        if (this.currentLevel < this.maxLevel) {
            this.currentLevel++;
            this.cleanup();
            this.songCompleteMenu.classList.remove('active');
            
            // Set difficulty based on new level
            this.difficulty = this.getDifficultyForLevel(this.currentLevel);
            
            // Load and play cutscene
            this.playCutscene(this.currentLevel).then(() => {
                // Load audio and start game
                this.loadLevelAudio(this.currentLevel);
            });
        } else {
            alert('You have completed all levels! Congratulations!');
            this.returnToMenu();
        }
    }

    endGame() {
        this.isPlaying = false;
        
        // Update high score
        const currentHighScore = this.getHighScore();
        if (this.score > currentHighScore) {
            localStorage.setItem('highScore', this.score.toString());
            // Update theme unlock status when high score increases
            this.updateThemeUnlockStatus();
        }
        
        // Clean up
        this.cleanup();
        
        // Show completion menu
        this.showSongComplete();
    }

    returnToMenu() {
        this.isPlaying = false;
        
        // Clean up
        this.cleanup();
        
        // Reset UI
        this.pauseMenu.classList.remove('active');
        this.songCompleteMenu.classList.remove('active');
        this.settingsMenu.classList.remove('active');
        const gameOverMenu = document.getElementById('gameOverMenu');
        if (gameOverMenu) {
            gameOverMenu.classList.remove('active');
        }
        this.gameContainer.classList.remove('active');
        this.gameContainer.classList.add('hidden');
        this.mainMenu.style.display = 'block';
        
        // Reset upload button
        this.uploadButton.textContent = '🎵 Upload Audio File';
        this.uploadButton.disabled = false;
        this.uploadInfo.textContent = 'Supports MP3, WAV, OGG, M4A';
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

    showThemes() {
        const themeMenu = document.getElementById('themeMenu');
        if (themeMenu) {
            themeMenu.style.display = 'block';
            this.updateThemeUnlockStatus();
        }
    }

    hideThemes() {
        const themeMenu = document.getElementById('themeMenu');
        if (themeMenu) {
            themeMenu.style.display = 'none';
        }
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('selectedTheme') || 'neon';
        this.applyTheme(savedTheme);
    }

    selectTheme(themeName) {
        const starWarsTheme = document.getElementById('star-wars-theme');
        const darkSoulsTheme = document.getElementById('dark-souls-theme');
        const avatarTheme = document.getElementById('avatar-theme');
        const finalFantasyTheme = document.getElementById('final-fantasy-theme');
        const callOfDutyTheme = document.getElementById('call-of-duty-theme');
        const minecraftTheme = document.getElementById('minecraft-theme');
        const rainbowSixSiegeTheme = document.getElementById('rainbow-six-siege-theme');
        const sonicTheme = document.getElementById('sonic-theme');
        const warcraftTheme = document.getElementById('warcraft-theme');
        
        // Check if Rainbow Six Siege theme is locked
        if (themeName === 'rainbow-six-siege') {
            const highScore = this.getHighScore();
            if (highScore < 100000) {
                alert('🔒 Siege Ops theme is locked! Score 100,000 points to unlock it.');
                return;
            }
        }
        
        // Check if Star Wars theme is locked
        if (themeName === 'star-wars') {
            const highScore = this.getHighScore();
            if (highScore < 500000) {
                alert('🔒 Galactic Wars theme is locked! Score 500,000 points to unlock it.');
                return;
            }
        }
        
        // Check if Sonic theme is locked
        if (themeName === 'sonic') {
            const highScore = this.getHighScore();
            if (highScore < 2000000) {
                alert('🔒 Speed Demon theme is locked! Score 2,000,000 points to unlock it.');
                return;
            }
        }
        
        // Check if Dark Souls theme is locked
        if (themeName === 'dark-souls') {
            const highScore = this.getHighScore();
            if (highScore < 8000000) {
                alert('🔒 Souls Nightmare theme is locked! Score 8,000,000 points to unlock it.');
                return;
            }
        }
        
        // Check if Warcraft theme is locked
        if (themeName === 'warcraft') {
            const highScore = this.getHighScore();
            if (highScore < 15000000) {
                alert('🔒 Realms of War theme is locked! Score 15,000,000 points to unlock it.');
                return;
            }
        }
        
        // Check if Avatar theme is locked
        if (themeName === 'avatar') {
            const highScore = this.getHighScore();
            if (highScore < 25000000) {
                alert('🔒 Pandora theme is locked! Score 25,000,000 points to unlock it.');
                return;
            }
        }
        
        // Check if Final Fantasy theme is locked
        if (themeName === 'final-fantasy') {
            const highScore = this.getHighScore();
            if (highScore < 40000000) {
                alert('🔒 Crystal Chronicles theme is locked! Score 40,000,000 points to unlock it.');
                return;
            }
        }
        
        // Check if Call of Duty theme is locked
        if (themeName === 'call-of-duty') {
            const highScore = this.getHighScore();
            if (highScore < 60000000) {
                alert('🔒 Modern Warfare theme is locked! Score 60,000,000 points to unlock it.');
                return;
            }
        }
        
        // Check if Minecraft theme is locked
        if (themeName === 'minecraft') {
            const highScore = this.getHighScore();
            if (highScore < 80000000) {
                alert('🔒 Block Wars theme is locked! Score 80,000,000 points to unlock it.');
                return;
            }
        }
        
        this.applyTheme(themeName);
        localStorage.setItem('selectedTheme', themeName);
        
        // Update UI
        this.updateThemeUI(themeName);
    }

    applyTheme(themeName) {
        const stylesheet = document.getElementById('theme-stylesheet');
        const gameTitle = document.querySelector('.game-title');
        
        if (stylesheet) {
            if (themeName === 'minecraft') {
                stylesheet.href = 'minecraft.css';
                if (gameTitle) {
                    gameTitle.textContent = 'BLOCK WARS';
                }
            } else if (themeName === 'call-of-duty') {
                stylesheet.href = 'call-of-duty.css';
                if (gameTitle) {
                    gameTitle.textContent = 'MODERN WARFARE';
                }
            } else if (themeName === 'final-fantasy') {
                stylesheet.href = 'final-fantasy.css';
                if (gameTitle) {
                    gameTitle.textContent = 'CRYSTAL CHRONICLES';
                }
            } else if (themeName === 'warcraft') {
                stylesheet.href = 'warcraft.css';
                if (gameTitle) {
                    gameTitle.textContent = 'REALMS OF WAR';
                }
            } else if (themeName === 'avatar') {
                stylesheet.href = 'avatar.css';
                if (gameTitle) {
                    gameTitle.textContent = 'PANDORA';
                }
            } else if (themeName === 'sonic') {
                stylesheet.href = 'sonic.css';
                if (gameTitle) {
                    gameTitle.textContent = 'SPEED DEMON';
                }
            } else if (themeName === 'dark-souls') {
                stylesheet.href = 'dark-souls.css';
                if (gameTitle) {
                    gameTitle.textContent = 'SOULS NIGHTMARE';
                }
            } else if (themeName === 'rainbow-six-siege') {
                stylesheet.href = 'rainbow-six-siege.css';
                if (gameTitle) {
                    gameTitle.textContent = 'SIEGE OPS';
                }
            } else if (themeName === 'star-wars') {
                stylesheet.href = 'star-wars.css';
                if (gameTitle) {
                    gameTitle.textContent = 'GALACTIC WARS';
                }
            } else {
                stylesheet.href = 'styles.css';
                if (gameTitle) {
                    gameTitle.textContent = 'NEON NIGHTMARE';
                }
            }
        }
    }

    updateThemeUI(themeName) {
        const neonTheme = document.getElementById('neon-theme');
        const rainbowSixSiegeTheme = document.getElementById('rainbow-six-siege-theme');
        const starWarsTheme = document.getElementById('star-wars-theme');
        const sonicTheme = document.getElementById('sonic-theme');
        const darkSoulsTheme = document.getElementById('dark-souls-theme');
        const warcraftTheme = document.getElementById('warcraft-theme');
        const avatarTheme = document.getElementById('avatar-theme');
        const finalFantasyTheme = document.getElementById('final-fantasy-theme');
        const callOfDutyTheme = document.getElementById('call-of-duty-theme');
        const minecraftTheme = document.getElementById('minecraft-theme');
        
        // Remove selected class from all themes
        if (neonTheme) neonTheme.classList.remove('selected');
        if (rainbowSixSiegeTheme) rainbowSixSiegeTheme.classList.remove('selected');
        if (starWarsTheme) starWarsTheme.classList.remove('selected');
        if (sonicTheme) sonicTheme.classList.remove('selected');
        if (darkSoulsTheme) darkSoulsTheme.classList.remove('selected');
        if (warcraftTheme) warcraftTheme.classList.remove('selected');
        if (avatarTheme) avatarTheme.classList.remove('selected');
        if (finalFantasyTheme) finalFantasyTheme.classList.remove('selected');
        if (callOfDutyTheme) callOfDutyTheme.classList.remove('selected');
        if (minecraftTheme) minecraftTheme.classList.remove('selected');
        
        // Add selected class to current theme
        if (themeName === 'neon' && neonTheme) {
            neonTheme.classList.add('selected');
            const btn = neonTheme.querySelector('.theme-select-btn');
        } else if (themeName === 'rainbow-six-siege' && rainbowSixSiegeTheme) {
            rainbowSixSiegeTheme.classList.add('selected');
            const btn = rainbowSixSiegeTheme.querySelector(''theme-select-btn');
            if (btn) {
                btn.textContent = '\\u2713 Selected';
                btn.disabled = false;
            }
            if (btn) {
                btn.textContent = '✓ Selected';
                btn.disabled = false;
            }
        } else if (themeName === 'star-wars' && starWarsTheme) {
            starWarsTheme.classList.add('selected');
            const btn = starWarsTheme.querySelector('.theme-select-btn');
            if (btn) {
                btn.textContent = '✓ Selected';
                btn.disabled = false;
            }
        } else if (themeName === 'dark-souls' && darkSoulsTheme) {
            darkSoulsTheme.classList.add('selected');
            const btn = darkSoulsTheme.querySelector('.theme-select-btn');
            if (btn) {
                btn.textContent = '✓ Selected';
                btn.disabled = false;
            }
        } else if (themeName === 'avatar' && avatarTheme) {
            avatarTheme.classList.add('selected');
            const btn = avatarTheme.querySelector('.theme-select-btn');
            if (btn) {
                btn.textContent = '✓ Selected';
                btn.disabled = false;
            }
        } else if (themeName === 'final-fantasy' && finalFantasyTheme) {
            finalFantasyTheme.classList.add('selected');
            const btn = finalFantasyTheme.querySelector('.theme-select-btn');
            if (btn) {
                btn.textContent = '✓ Selected';
                btn.disabled = false;
            }
        } else if (themeName === 'call-of-duty' && callOfDutyTheme) {
            callOfDutyTheme.classList.add('selected');
            const btn = callOfDutyTheme.querySelector('.theme-select-btn');
            if (btn) {
                btn.textContent = '✓ Selected';
                btn.disabled = false;
            }
        } else if (themeName === 'minecraft' && minecraftTheme) {
            minecraftTheme.classList.add('selected');
            const btn = minecraftTheme.querySelector('.theme-select-btn');
            if (btn) {
                btn.textContent = '✓ Selected';
                btn.disabled = false;
            }
        }
    }

    getHighScore() {
        const highScore = localStorage.getItem('highScore') || '0';
        return parseInt(highScore);
    }

    updateThemeUnlockStatus() {
        const highScore = this.getHighScore();
        const starWarsTheme = document.getElementById('star-wars-theme');
        const darkSoulsTheme = document.getElementById('dark-souls-theme');
        const avatarTheme = document.getElementById('avatar-theme');
        const finalFantasyTheme = document.getElementById('final-fantasy-theme');
        const callOfDutyTheme = document.getElementById('call-of-duty-theme');
        const minecraftTheme = document.getElementById('minecraft-theme');
        const rainbowSixSiegeTheme = document.getElementById('rainbow-six-siege-theme');
        const sonicTheme = document.getElementById('sonic-theme');
        const warcraftTheme = document.getElementById('warcraft-theme');
        const unlockScore = document.getElementById('unlockScore');
        const progressFill = document.getElementById('progressFill');
        
        // Update unlock score display
        if (unlockScore) {
            unlockScore.textContent = highScore.toLocaleString();
        }
        
        // Calculate progress based on next unlock or max if all unlocked
        let progressTarget = 80000000;
        let allUnlocked = true;
        
        // Update Rainbow Six Siege theme lock status
        if (rainbowSixSiegeTheme) {
            const themeInfo = rainbowSixSiegeTheme.querySelector('.theme-info p');
            const btn = rainbowSixSiegeTheme.querySelector('.theme-select-btn');
            
            if (highScore >= 100000) {
                rainbowSixSiegeTheme.classList.remove('locked');
                if (themeInfo) themeInfo.textContent = 'Unlocked!';
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'Select';
                }
            } else {
                allUnlocked = false;
                progressTarget = 100000;
                rainbowSixSiegeTheme.classList.add('locked');
                if (themeInfo) themeInfo.textContent = `🔒 Unlock at 100,000 points (${(100000 - highScore).toLocaleString()} more)`;
                if (btn) {
                    btn.disabled = true;
                    btn.textContent = '🔒 Locked';
                }
            }
        }
        
        // Update Star Wars theme lock status
        if (starWarsTheme) {
            const themeInfo = starWarsTheme.querySelector('.theme-info p');
            const btn = starWarsTheme.querySelector('.theme-select-btn');
            
            if (highScore >= 500000) {
                starWarsTheme.classList.remove('locked');
                if (themeInfo) themeInfo.textContent = 'Unlocked!';
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'Select';
                }
            } else {
                allUnlocked = false;
                if (progressTarget > 500000) progressTarget = 500000;
                starWarsTheme.classList.add('locked');
                if (themeInfo) themeInfo.textContent = `🔒 Unlock at 500,000 points (${(500000 - highScore).toLocaleString()} more)`;
                if (btn) {
                    btn.disabled = true;
                    btn.textContent = '🔒 Locked';
                }
            }
        }
        
        // Update Sonic theme lock status
        if (sonicTheme) {
            const themeInfo = sonicTheme.querySelector('.theme-info p');
            const btn = sonicTheme.querySelector('.theme-select-btn');
            
            if (highScore >= 2000000) {
                sonicTheme.classList.remove('locked');
                if (themeInfo) themeInfo.textContent = 'Unlocked!';
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'Select';
                }
            } else {
                allUnlocked = false;
                if (progressTarget > 2000000) progressTarget = 2000000;
                sonicTheme.classList.add('locked');
                if (themeInfo) themeInfo.textContent = `🔒 Unlock at 2,000,000 points (${(2000000 - highScore).toLocaleString()} more)`;
                if (btn) {
                    btn.disabled = true;
                    btn.textContent = '🔒 Locked';
                }
            }
        }
        
        // Update Dark Souls theme lock status
        if (darkSoulsTheme) {
            const themeInfo = darkSoulsTheme.querySelector('.theme-info p');
            const btn = darkSoulsTheme.querySelector('.theme-select-btn');
            
            if (highScore >= 8000000) {
                darkSoulsTheme.classList.remove('locked');
                if (themeInfo) themeInfo.textContent = 'Unlocked!';
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'Select';
                }
            } else {
                allUnlocked = false;
                if (progressTarget > 8000000) progressTarget = 8000000;
                darkSoulsTheme.classList.add('locked');
                if (themeInfo) themeInfo.textContent = `🔒 Unlock at 8,000,000 points (${(8000000 - highScore).toLocaleString()} more)`;
                if (btn) {
                    btn.disabled = true;
                    btn.textContent = '🔒 Locked';
                }
            }
        }
        
        // Update Warcraft theme lock status
        if (warcraftTheme) {
            const themeInfo = warcraftTheme.querySelector('.theme-info p');
            const btn = warcraftTheme.querySelector('.theme-select-btn');
            
            if (highScore >= 15000000) {
                warcraftTheme.classList.remove('locked');
                if (themeInfo) themeInfo.textContent = 'Unlocked!';
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'Select';
                }
            } else {
                allUnlocked = false;
                if (progressTarget > 15000000) progressTarget = 15000000;
                warcraftTheme.classList.add('locked');
                if (themeInfo) themeInfo.textContent = `🔒 Unlock at 15,000,000 points (${(15000000 - highScore).toLocaleString()} more)`;
                if (btn) {
                    btn.disabled = true;
                    btn.textContent = '🔒 Locked';
                }
            }
        }
        
        // Update Avatar theme lock status
        if (avatarTheme) {
            const themeInfo = avatarTheme.querySelector('.theme-info p');
            const btn = avatarTheme.querySelector('.theme-select-btn');
            
            if (highScore >= 25000000) {
                avatarTheme.classList.remove('locked');
                if (themeInfo) themeInfo.textContent = 'Unlocked!';
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'Select';
                }
            } else {
                allUnlocked = false;
                if (progressTarget > 25000000) progressTarget = 25000000;
                avatarTheme.classList.add('locked');
                if (themeInfo) themeInfo.textContent = `🔒 Unlock at 25,000,000 points (${(25000000 - highScore).toLocaleString()} more)`;
                if (btn) {
                    btn.disabled = true;
                    btn.textContent = '🔒 Locked';
                }
            }
        }
        
        // Update Final Fantasy theme lock status
        if (finalFantasyTheme) {
            const themeInfo = finalFantasyTheme.querySelector('.theme-info p');
            const btn = finalFantasyTheme.querySelector('.theme-select-btn');
            
            if (highScore >= 40000000) {
                finalFantasyTheme.classList.remove('locked');
                if (themeInfo) themeInfo.textContent = 'Unlocked!';
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'Select';
                }
            } else {
                allUnlocked = false;
                if (progressTarget > 40000000) progressTarget = 40000000;
                finalFantasyTheme.classList.add('locked');
                if (themeInfo) themeInfo.textContent = `🔒 Unlock at 40,000,000 points (${(40000000 - highScore).toLocaleString()} more)`;
                if (btn) {
                    btn.disabled = true;
                    btn.textContent = '🔒 Locked';
                }
            }
        }
        
        // Update Call of Duty theme lock status
        if (callOfDutyTheme) {
            const themeInfo = callOfDutyTheme.querySelector('.theme-info p');
            const btn = callOfDutyTheme.querySelector('.theme-select-btn');
            
            if (highScore >= 60000000) {
                callOfDutyTheme.classList.remove('locked');
                if (themeInfo) themeInfo.textContent = 'Unlocked!';
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'Select';
                }
            } else {
                allUnlocked = false;
                if (progressTarget > 60000000) progressTarget = 60000000;
                callOfDutyTheme.classList.add('locked');
                if (themeInfo) themeInfo.textContent = `🔒 Unlock at 60,000,000 points (${(60000000 - highScore).toLocaleString()} more)`;
                if (btn) {
                    btn.disabled = true;
                    btn.textContent = '🔒 Locked';
                }
            }
        }
        
        // Update Minecraft theme lock status
        if (minecraftTheme) {
            const themeInfo = minecraftTheme.querySelector('.theme-info p');
            const btn = minecraftTheme.querySelector('.theme-select-btn');
            
            if (highScore >= 80000000) {
                minecraftTheme.classList.remove('locked');
                if (themeInfo) themeInfo.textContent = 'Unlocked!';
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'Select';
                }
            } else {
                allUnlocked = false;
                progressTarget = 80000000;
                minecraftTheme.classList.add('locked');
                if (themeInfo) themeInfo.textContent = `🔒 Unlock at 80,000,000 points (${(80000000 - highScore).toLocaleString()} more)`;
                if (btn) {
                    btn.disabled = true;
                    btn.textContent = '🔒 Locked';
                }
            }
        }
        
        // Update progress bar
        if (progressFill) {
            const progress = Math.min((highScore / progressTarget) * 100, 100);
            progressFill.style.width = `${progress}%`;
        }
        
        // Update current theme UI
        const currentTheme = localStorage.getItem('selectedTheme') || 'neon';
        this.updateThemeUI(currentTheme);
    }

    setDifficulty(level) {
        this.difficulty = level;
        this.setNoteSpeedForDifficulty();
        this.hideSettings();
        
        // Show confirmation
        alert(`Difficulty set to ${level.toUpperCase()}`);
    }

    async showSongComplete() {
        // Update statistics
        document.getElementById('finalScoreValue').textContent = this.score.toLocaleString();
        document.getElementById('perfectCount').textContent = this.perfectHits;
        document.getElementById('greatCount').textContent = this.greatHits;
        document.getElementById('goodCount').textContent = this.goodHits;
        document.getElementById('missCount').textContent = this.misses;
        document.getElementById('maxComboValue').textContent = this.maxCombo;
        
        // Calculate XP reward based on performance
        const baseXP = 50;
        const scoreMultiplier = Math.floor(this.score / 1000);
        const comboBonus = Math.floor(this.maxCombo / 10) * 10;
        const accuracyBonus = this.calculateAccuracyBonus();
        const totalXP = baseXP + scoreMultiplier + comboBonus + accuracyBonus;
        
        // Add XP to user profile
        const leveledUp = await this.addXP(totalXP);
        
        // Submit score to leaderboard
        const songName = this.currentLevel > 0 ? `Level ${this.currentLevel}` : this.songTitle.textContent;
        await this.submitScore(this.score, songName, this.difficulty);
        
        // Show level up notification if applicable
        if (leveledUp) {
            setTimeout(() => {
                alert(`🎉 LEVEL UP! You are now level ${this.userProfile.level}!`);
            }, 500);
        }
        
        // Show menu
        this.songCompleteMenu.classList.add('active');
    }
    
    calculateAccuracyBonus() {
        const totalNotes = this.perfectHits + this.greatHits + this.goodHits + this.misses;
        if (totalNotes === 0) return 0;
        
        const hitNotes = this.perfectHits + this.greatHits + this.goodHits;
        const accuracy = hitNotes / totalNotes;
        
        if (accuracy >= 0.95) return 100;
        if (accuracy >= 0.9) return 75;
        if (accuracy >= 0.8) return 50;
        if (accuracy >= 0.7) return 25;
        return 0;
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
        this.leaderboardMenu = document.getElementById('leaderboardMenu');
        this.leaderboardMenu.classList.add('active');
        this.loadLeaderboard('all');
        
        // Setup leaderboard tabs
        const tabs = document.querySelectorAll('.leaderboard-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.loadLeaderboard(e.target.dataset.difficulty);
            });
        });
    }
    
    hideLeaderboards() {
        this.leaderboardMenu.classList.remove('active');
    }
    
    async loadLeaderboard(difficulty) {
        if (!this.db) {
            this.showEmptyLeaderboard('Sign in to view leaderboards');
            return;
        }
        
        const { collection, query, orderBy, limit, getDocs } = window.firebaseDocs;
        const leaderboardList = document.getElementById('leaderboardList');
        leaderboardList.innerHTML = '<div class="loading-spinner" style="margin: 2rem auto;"></div>';
        
        try {
            let q;
            if (difficulty === 'all') {
                q = query(
                    collection(this.db, 'scores'),
                    orderBy('score', 'desc'),
                    limit(10)
                );
            } else {
                q = query(
                    collection(this.db, 'scores'),
                    orderBy('score', 'desc'),
                    limit(10)
                );
                // Filter by difficulty after getting results
            }
            
            const snapshot = await getDocs(q);
            let scores = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                if (difficulty === 'all' || data.difficulty === difficulty) {
                    scores.push(data);
                }
            });
            
            // Sort and limit
            scores.sort((a, b) => b.score - a.score);
            scores = scores.slice(0, 10);
            
            if (scores.length === 0) {
                this.showEmptyLeaderboard('No scores yet!');
                return;
            }
            
            this.renderLeaderboard(scores);
            
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            this.showEmptyLeaderboard('Error loading scores');
        }
    }
    
    renderLeaderboard(scores) {
        const leaderboardList = document.getElementById('leaderboardList');
        leaderboardList.innerHTML = '';
        
        scores.forEach((score, index) => {
            const entry = document.createElement('div');
            entry.className = 'leaderboard-entry';
            
            if (this.currentUser && score.userId === this.currentUser.uid) {
                entry.classList.add('player-entry');
            }
            
            entry.innerHTML = `
                <div class="leaderboard-rank rank-${index + 1}">${index + 1}</div>
                <div class="leaderboard-player">
                    <div class="leaderboard-name">${score.userName}</div>
                    <div class="leaderboard-difficulty">${score.difficulty}</div>
                </div>
                <div class="leaderboard-score">${score.score.toLocaleString()}</div>
            `;
            
            leaderboardList.appendChild(entry);
        });
    }
    
    showEmptyLeaderboard(message) {
        const leaderboardList = document.getElementById('leaderboardList');
        leaderboardList.innerHTML = `
            <div class="leaderboard-empty">
                ${message}
            </div>
        `;
    }
    
    // ===================================
    // Loading Screen
    // ===================================
    
    showLoadingScreen(title, text) {
        const loadingScreen = document.getElementById('loadingScreen');
        const loadingTitle = document.getElementById('loadingTitle');
        const loadingText = document.getElementById('loadingText');
        const loadingFill = document.getElementById('loadingFill');
        
        loadingTitle.textContent = title;
        loadingText.textContent = text;
        loadingFill.style.width = '0%';
        loadingScreen.classList.add('active');
    }
    
    updateLoadingProgress(progress, text) {
        const loadingText = document.getElementById('loadingText');
        const loadingFill = document.getElementById('loadingFill');
        
        loadingText.textContent = text;
        loadingFill.style.width = progress + '%';
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.classList.remove('active');
    }
}

// ===================================
// Initialize Game
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    console.log('Main menu element:', document.getElementById('mainMenu'));
    console.log('Upload button element:', document.getElementById('uploadButton'));
    
    try {
        window.game = new NeonNightmare();
        console.log('Game instance created:', window.game);
    } catch (error) {
        console.error('Failed to create game instance:', error);
    } 
});
