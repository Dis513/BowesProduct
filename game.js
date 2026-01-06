<content>
// ==================================
// NEON NIGHTMARE - Game Engine
// Local File Version with Character & Map System
// ===================================

class NeonNightmare {
    constructor() {
        // Game State
        this.isPlaying = false;
        this.isPaused = false;
        this.isIntroPlaying = false;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.multiplier = 1;
        this.difficulty = 'medium';
        
        // Level System
        this.currentLevel = 1;
        this.levelProgress = 0;
        this.levelThreshold = 500;
        this.maxLevel = Infinity;
        this.currentLevelData = null;
        
        // Character System
        this.character = null;
        this.characterSprite = null;
        this.characterAura = null;
        this.characterState = 'idle';
        this.lastAnimationTime = 0;
        
        // Map System
        this.parallaxLayers = [];
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
        
        // Video
        this.introVideoElement = null;
        this.videoCanPlay = false;
        
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
        
        // Timing Windows (in milliseconds)
        this.timingWindows = {
            easy: { perfect: 100, great: 200, good: 300 },
            medium: { perfect: 50, great: 100, good: 150 },
            hard: { perfect: 40, great: 80, good: 120 },
            expert: { perfect: 30, great: 60, good: 90 }
        };
        
        // Game Mode
        this.gameMode = 'menu';
        this.customAudioFile = null;
        
        // DOM Elements
        this.initializeElements();
        this.setupEventListeners();
        this.createParticles();
        this.initializeCharacter();
        this.initializeMap();
        this.initializeLevels();
    }

    // ===================================
    // Level System
    // ===================================

    initializeLevels() {
        // Just paste your music file names here!
        // Make sure the audio files are in the same folder as this HTML file
        this.levels = [
            {
                id: 1,
                name: "Level 1",
                artist: "Demo Track",
                difficulty: "Easy",
                musicFile: "song1.mp3",  // ← Change this to your music file name
                introVideo: null,
                description: "First level"
            },
            {
                id: 2,
                name: "Level 2", 
                artist: "Demo Track",
                difficulty: "Medium",
                musicFile: "song2.mp3",  // ← Change this to your music file name
                introVideo: null,
                description: "Second level"
            },
            {
                id: 3,
                name: "Level 3",
                artist: "Demo Track", 
                difficulty: "Hard",
                musicFile: "song3.mp3",  // ← Change this to your music file name
                introVideo: null,
                description: "Third level"
            }
        ];
        
        this.populateLevelSelect();
    }

    populateLevelSelect() {
        const levelGrid = document.getElementById('levelGrid');
        levelGrid.innerHTML = '';
        
        this.levels.forEach(level => {
            const levelCard = document.createElement('div');
            levelCard.className = 'level-card';
            levelCard.dataset.levelId = level.id;
            
            levelCard.innerHTML = `
                <div class="level-difficulty ${level.difficulty.toLowerCase()}">${level.difficulty}</div>
                <h3 class="level-name">${level.name}</h3>
                <p class="level-artist">${level.artist}</p>
                <p class="level-description">${level.description}</p>
                <button class="level-play-button">▶ PLAY</button>
            `;
            
            levelCard.addEventListener('click', () => this.selectLevel(level.id));
            levelGrid.appendChild(levelCard);
        });
    }

    selectLevel(levelId) {
        this.currentLevelData = this.levels.find(level => level.id === levelId);
        if (!this.currentLevelData) return;
        
        console.log(`Selected level: ${this.currentLevelData.name}`);
        this.gameMode = 'intro';
        this.showIntroScreen();
    }

    // ===================================
    // Initialization
    // ===================================

    initializeElements() {
        // Menu Elements
        this.mainMenu = document.getElementById('mainMenu');
        this.levelSelectMenu = document.getElementById('levelSelectMenu');
        this.gameContainer = document.getElementById('gameContainer');
        this.pauseMenu = document.getElementById('pauseMenu');
        this.settingsMenu = document.getElementById('settingsMenu');
        this.songCompleteMenu = document.getElementById('songCompleteMenu');
        this.introScreen = document.getElementById('introScreen');
        
        // File Upload
        this.audioFileInput = document.getElementById('audioFileInput');
        this.uploadButton = document.getElementById('uploadButton');
        this.uploadInfo = document.getElementById('uploadInfo');
        
        // HUD Elements
        this.scoreValue = document.getElementById('scoreValue');
        this.multiplierValue = document.getElementById('multiplierValue');
        this.comboValue = document.getElementById('comboValue');
        this.comboDisplay = document.getElementById('comboDisplay');
        this.progressFill = document.getElementById('progressFill');
        this.songTitle = document.getElementById('songTitle');
        this.songArtist = document.getElementById('songArtist');
        
        // Level Elements
        this.levelNumber = document.getElementById('levelNumber');
        
        // Game Elements
        this.noteHighway = document.getElementById('noteHighway');
        this.targetLine = document.getElementById('targetLine');
        this.beatGlow = document.getElementById('beatGlow');
        
        // Intro Video Elements
        this.introVideo = document.getElementById('introVideo');
        this.skipIntroButton = document.getElementById('skipIntroButton');
        this.introLevelName = document.getElementById('introLevelName');
        this.introLevelArtist = document.getElementById('introLevelArtist');
        
        // Fret Buttons
        this.frets.forEach((fret, index) => {
            this.fretButtons[fret] = document.querySelector(`.fret-button.${fret}`);
        });
        
        // Calculate target line position
        this.targetY = this.noteHighway.offsetHeight - 150;
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
        // File Upload
        this.uploadButton.addEventListener('click', () => this.audioFileInput.click());
        this.audioFileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Menu Buttons
        document.getElementById('showLevelSelect').addEventListener('click', () => this.showLevelSelect());
        document.getElementById('openSettings').addEventListener('click', () => this.showSettings());
        document.getElementById('viewLeaderboards').addEventListener('click', () => this.showLeaderboards());
        document.getElementById('backToMenuFromLevelSelect').addEventListener('click', () => this.showMainMenu());
        
        // Pause Menu
        document.getElementById('resumeGame').addEventListener('click', () => this.resumeGame());
        document.getElementById('restartSong').addEventListener('click', () => this.restartSong());
        document.getElementById('returnToMenu').addEventListener('click', () => this.returnToMenu());
        
        // Settings
        document.getElementById('setDifficultyEasy').addEventListener('click', () => this.setDifficulty('easy'));
        document.getElementById('setDifficultyMedium').addEventListener('click', () => this.setDifficulty('medium'));
        document.getElementById('setDifficultyHard').addEventListener('click', () => this.setDifficulty('hard'));
        document.getElementById('setDifficultyExpert').addEventListener('click', () => this.setDifficulty('expert'));
        document.getElementById('closeSettings').addEventListener('click', () => this.hideSettings());
        
        // Song Complete
        document.getElementById('playAgain').addEventListener('click', () => this.restartSong());
        document.getElementById('uploadNewSong').addEventListener('click', () => this.returnToMenu());
        document.getElementById('mainMenuFromComplete').addEventListener('click', () => this.returnToMenu());
        
        // Intro Video
        this.skipIntroButton.addEventListener('click', () => this.skipIntro());
        this.introVideo.addEventListener('ended', () => this.onIntroVideoEnded());
        this.introVideo.addEventListener('error', () => this.onIntroVideoError());
        this.introVideo.addEventListener('loadeddata', () => {
            this.videoCanPlay = true;
        });
        
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
            if (e.key === 'Escape') {
                if (this.isIntroPlaying) {
                    this.skipIntro();
                } else if (this.isPlaying) {
                    this.togglePause();
                }
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
    // Menu Management
    // ===================================

    showMainMenu() {
        this.gameMode = 'menu';
        this.mainMenu.classList.remove('hidden');
        this.levelSelectMenu.classList.add('hidden');
        this.gameContainer.classList.add('hidden');
        this.introScreen.classList.add('hidden');
    }

    showLevelSelect() {
        this.gameMode = 'levelSelect';
        this.mainMenu.classList.add('hidden');
        this.levelSelectMenu.classList.remove('hidden');
        this.gameContainer.classList.add('hidden');
        this.introScreen.classList.add('hidden');
    }

    showIntroScreen() {
        this.mainMenu.classList.add('hidden');
        this.levelSelectMenu.classList.add('hidden');
        this.gameContainer.classList.add('hidden');
        this.introScreen.classList.remove('hidden');
        
        // Update intro screen info
        if (this.currentLevelData) {
            this.introLevelName.textContent = this.currentLevelData.name;
            this.introLevelArtist.textContent = this.currentLevelData.artist;
        } else {
            this.introLevelName.textContent = 'Free Play';
            this.introLevelArtist.textContent = 'Custom Audio';
        }
        
        // Start intro (video or timeout)
        this.startIntro();
    }

    startIntro() {
        this.isIntroPlaying = true;
        this.videoCanPlay = false;
        
        // Check if there's an intro video
        if (this.currentLevelData && this.currentLevelData.introVideo) {
            try {
                this.introVideo.src = this.currentLevelData.introVideo;
                this.introVideo.load();
                this.introVideo.play().catch(err => {
                    console.log('Video play failed:', err);
                    this.skipIntro();
                });
            } catch (err) {
                console.log('Video error:', err);
                this.skipIntro();
            }
        } else {
            // No video, just show intro for 2 seconds then start game
            setTimeout(() => {
                this.startLevel();
            }, 2000);
        }
    }

    skipIntro() {
        if (!this.isIntroPlaying) return;
        
        if (this.introVideo) {
            this.introVideo.pause();
            this.introVideo.currentTime = 0;
            this.introVideo.src = '';
        }
        
        this.startLevel();
    }

    onIntroVideoEnded() {
        if (this.isIntroPlaying) {
            this.startLevel();
        }
    }

    onIntroVideoError() {
        console.log('Intro video error, starting game...');
        this.startLevel();
    }

    // ===================================
    // Character System
    // ===================================

    setCharacterState(state) {
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

    // ===================================
    // Map System
    // ===================================

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

    // ===================================
    // Level System
    // ===================================

    updateLevel() {
        const newLevel = Math.floor(this.score / this.levelThreshold) + 1;
        
        if (newLevel > this.currentLevel) {
            this.currentLevel = newLevel;
            this.levelNumber.textContent = this.currentLevel;
            this.levelNumber.classList.add('level-up');
            
            this.increaseDifficulty();
            
            setTimeout(() => {
                this.levelNumber.classList.remove('level-up');
            }, 500);
            
            console.log(`Level up! Now at level ${this.currentLevel}`);
        }
    }

    increaseDifficulty() {
        const minBeatInterval = Math.max(0.1, this.getMinBeatInterval() - (this.currentLevel * 0.01));
        this.adjustedMinBeatInterval = minBeatInterval;
    }

    // ===================================
    // Beat Detection
    // ===================================

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
    }

    // ===================================
    // Audio Loading
    // ===================================

    async loadLevelAudio() {
        if (!this.currentLevelData) return null;
        
        try {
            console.log('Loading level audio:', this.currentLevelData.musicFile);
            
            // Try to load the audio file
            const response = await fetch(this.currentLevelData.musicFile);
            if (!response.ok) {
                throw new Error(`Failed to load audio: ${response.status}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const buffer = await audioContext.decodeAudioData(arrayBuffer);
            
            this.duration = buffer.duration;
            return buffer;
            
        } catch (error) {
            console.error('Error loading level audio:', error);
            alert(`Error loading audio file: ${this.currentLevelData.musicFile}\nMake sure the file exists in the same folder.`);
            return null;
        }
    }

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
            
            this.customAudioFile = {
                name: file.name.replace(/\.[^/.]+$/, ''),
                buffer: this.audioBuffer
            };
            
            this.currentLevelData = null;
            this.gameMode = 'intro';
            this.showIntroScreen();
            
        } catch (error) {
            console.error('Error processing audio:', error);
            alert('Error processing audio file. Please try a different file.');
            this.uploadButton.textContent = '🎵 Upload Audio File';
            this.uploadButton.disabled = false;
        }
    }

    async analyzeAudioAndGenerateNotes() {
        const channelData = this.audioBuffer.getChannelData(0);
        const sampleRate = this.audioBuffer.sampleRate;
        this.notes = this.generateNotesFromAudio(channelData, sampleRate);
        console.log(`Generated ${this.notes.length} notes`);
    }

    generateNotesFromAudio(channelData, sampleRate) {
        const notes = [];
        const windowSize = Math.floor(sampleRate * 0.1);
        const hopSize = Math.floor(sampleRate * 0.05);
        
        const energies = [];
        for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
            let energy = 0;
            for (let j = 0; j < windowSize; j++) {
                energy += Math.abs(channelData[i + j]);
            }
            energies.push(energy / windowSize);
        }
        
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
        
        const minBeatInterval = this.adjustedMinBeatInterval || this.getMinBeatInterval();
        const filteredBeats = this.filterBeats(beats, minBeatInterval);
        
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

    calculateThreshold(energies) {
        const mean = energies.reduce((a, b) => a + b, 0) / energies.length;
        const stdDev = Math.sqrt(
            energies.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / energies.length
        );
        return mean + stdDev * 0.5;
    }

    getMinBeatInterval() {
        const intervals = {
            easy: 0.5,
            medium: 0.3,
            hard: 0.2,
            expert: 0.15
        };
        return intervals[this.difficulty] || 0.3;
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
        const fretIndex = Math.floor((energy + index * 0.1) * 7) % 5;
        return this.frets[fretIndex];
    }

    // ===================================
    // Game Loop
    // ===================================

    async startLevel() {
        this.isIntroPlaying = false;
        this.introScreen.classList.add('hidden');
        
        // Load audio
        if (this.currentLevelData) {
            this.audioBuffer = await this.loadLevelAudio();
            if (!this.audioBuffer) {
                this.returnToMenu();
                return;
            }
            this.songTitle.textContent = this.currentLevelData.name;
            this.songArtist.textContent = this.currentLevelData.artist;
        } else if (this.customAudioFile) {
            this.audioBuffer = this.customAudioFile.buffer;
            this.songTitle.textContent = this.customAudioFile.name;
            this.songArtist.textContent = 'Free Play';
        } else {
            console.error('No audio data available');
            this.returnToMenu();
            return;
        }
        
        // Generate notes
        await this.analyzeAudioAndGenerateNotes();
        
        // Start game
        this.startGame();
    }

    startGame() {
        this.isPlaying = true;
        this.isPaused = false;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.multiplier = 1;
        this.currentLevel = 1;
        this.levelProgress = 0;
        this.perfectHits = 0;
        this.greatHits = 0;
        this.goodHits = 0;
        this.misses = 0;
        this.activeNotes = [];
        this.adjustedMinBeatInterval = null;
        
        this.notes.forEach(note => {
            note.hit = false;
            note.missed = false;
        });
        
        this.updateHUD();
        this.levelNumber.textContent = '1';
        
        this.mainMenu.classList.add('hidden');
        this.levelSelectMenu.classList.add('hidden');
        this.gameContainer.classList.remove('hidden');
        this.introScreen.classList.add('hidden');
        
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
        const timingWindows = this.timingWindows[this.difficulty];
        
        this.activeNotes.forEach(note => {
            if (note.hit || note.missed) return;
            
            const timeDiff = note.time - currentTime;
            
            if (timeDiff < -timingWindows.good / 1000) {
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
        const timingWindows = this.timingWindows[this.difficulty];
        
        const closestNote = this.activeNotes
            .filter(note => note.fret === fret && !note.hit && !note.missed)
            .sort((a, b) => Math.abs(a.time - currentTime) - Math.abs(b.time - currentTime))[0];
        
        if (closestNote) {
            const timeDiff = Math.abs(closestNote.time - currentTime) * 1000;
            
            if (timeDiff <= timingWindows.good) {
                let hitType;
                if (timeDiff <= timingWindows.perfect) {
                    hitType = 'perfect';
                } else if (timeDiff <= timingWindows.great) {
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
        
        const points = {
            perfect: 100,
            great: 75,
            good: 50
        };
        
        this.score += points[hitType] * this.multiplier;
        this.combo++;
        
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
        
        this.updateMultiplier();
        
        if (hitType === 'perfect') this.perfectHits++;
        else if (hitType === 'great') this.greatHits++;
        else this.goodHits++;
        
        this.updateLevel();
        this.setCharacterState('hit');
        this.activateCharacterAura();
        this.showHitFeedback(hitType);
        this.animateNoteHit(note);
        this.updateHUD();
        
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
        note.missed = true;
        this.combo = 0;
        this.multiplier = 1;
        this.misses++;
        
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
        this.cleanup();
        this.pauseMenu.classList.remove('active');
        this.songCompleteMenu.classList.remove('active');
        this.startLevel();
    }

    endGame() {
        this.isPlaying = false;
        this.cleanup();
        this.showSongComplete();
    }

    returnToMenu() {
        this.isPlaying = false;
        this.isIntroPlaying = false;
        this.gameMode = 'menu';
        
        this.cleanup();
        
        if (this.introVideo) {
            this.introVideo.pause();
            this.introVideo.currentTime = 0;
            this.introVideo.src = '';
        }
        
        this.pauseMenu.classList.remove('active');
        this.songCompleteMenu.classList.remove('active');
        this.settingsMenu.classList.remove('active');
        this.gameContainer.classList.add('hidden');
        this.introScreen.classList.add('hidden');
        this.mainMenu.classList.remove('hidden');
        
        this.currentLevel = 1;
        this.currentLevelData = null;
        
        this.uploadButton.textContent = '🎵 Upload Audio File';
        this.uploadButton.disabled = false;
        this.uploadInfo.textContent = 'Supports MP3, WAV, OGG, M4A';
    }

    cleanup() {
        if (this.audioSource) {
            try {
                this.audioSource.stop();
                this.audioSource.disconnect();
            } catch (e) {
                // Audio source may already be stopped
            }
        }
        
        this.activeNotes.forEach(note => {
            if (note.element && note.element.parentNode) {
                note.element.parentNode.removeChild(note.element);
            }
        });
        this.activeNotes = [];
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        this.audioContext = null;
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
        alert(`Difficulty set to ${level.toUpperCase()}`);
    } 

    showSongComplete() {
        document.getElementById('finalScoreValue').textContent = this.score.toLocaleString();
        document.getElementById('perfectCount').textContent = this.perfectHits;
        document.getElementById('greatCount').textContent = this.greatHits;
        document.getElementById('goodCount').textContent = this.goodHits;
        document.getElementById('missCount').textContent = this.misses;
        document.getElementById('maxComboValue').textContent = this.maxCombo;
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
</content>
