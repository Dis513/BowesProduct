'use strict';

console.log('Neon Nightmare game.js loaded');

class NeonNightmare { 
    constructor() {
        /* =========================
           CORE GAME STATE
        ========================= */
        this.gameMode = 'menu'; // menu | levelSelect | intro | playing | paused
        this.isPlaying = false;
        this.isPaused = false;
        this.isIntroPlaying = false;

        /* =========================
           SCORE / DIFFICULTY
        ========================= */
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.multiplier = 1;
        this.difficulty = 'medium';

        /* =========================
           LEVELS
        ========================= */
        this.currentLevel = 1;
        this.levelThreshold = 500;
        this.currentLevelData = null;
        this.levels = [];

        /* =========================
           AUDIO
        ========================= */
        this.audioContext = null;
        this.audioBuffer = null;
        this.audioSource = null;
        this.analyser = null;
        this.audioData = null;
        this.startTime = 0;
        this.duration = 0;

        /* =========================
           NOTES
        ========================= */
        this.notes = [];
        this.activeNotes = [];
        this.noteSpawnY = -50;
        this.targetY = 0;

        /* =========================
           FRETS
        ========================= */
        this.frets = ['green', 'red', 'yellow', 'blue', 'orange'];
        this.fretKeys = ['a', 's', 'd', 'f', 'g'];
        this.fretButtons = {};

        /* =========================
           INIT
        ========================= */
        this.bindElements();
        this.bindEvents();
        this.initializeLevels();
        this.showMainMenu();
    }

    /* =========================
       SAFE DOM GETTER
    ========================= */
    $(id) {
        const el = document.getElementById(id);
        if (!el) console.warn(`Missing element: #${id}`);
        return el;
    }

    /* =========================
       DOM ELEMENTS
    ========================= */
    bindElements() {
        this.mainMenu = this.$('mainMenu');
        this.levelSelectMenu = this.$('levelSelectMenu');
        this.gameContainer = this.$('gameContainer');
        this.pauseMenu = this.$('pauseMenu');
        this.settingsMenu = this.$('settingsMenu');
        this.songCompleteMenu = this.$('songCompleteMenu');
        this.introScreen = this.$('introScreen');

        this.levelGrid = this.$('levelGrid');

        this.audioFileInput = this.$('audioFileInput');
        this.uploadButton = this.$('uploadButton');
        this.uploadInfo = this.$('uploadInfo');

        this.scoreValue = this.$('scoreValue');
        this.multiplierValue = this.$('multiplierValue');
        this.comboValue = this.$('comboValue');
        this.progressFill = this.$('progressFill');

        this.songTitle = this.$('songTitle');
        this.songArtist = this.$('songArtist');

        this.noteHighway = this.$('noteHighway');
        if (this.noteHighway) {
            this.targetY = this.noteHighway.offsetHeight - 150;
        }

        this.frets.forEach(fret => {
            this.fretButtons[fret] = document.querySelector(`.fret-button.${fret}`);
        });
    }

    /* =========================
       EVENTS
    ========================= */
    bindEvents() {
        const safeClick = (id, fn) => {
            const el = this.$(id);
            if (el) el.addEventListener('click', fn);
        };

        safeClick('showLevelSelect', () => this.showLevelSelect());
        safeClick('openSettings', () => this.showSettings());
        safeClick('viewLeaderboards', () => alert('Coming soon'));
        safeClick('backToMenuFromLevelSelect', () => this.showMainMenu());

        safeClick('resumeGame', () => this.resumeGame());
        safeClick('restartSong', () => this.restartSong());
        safeClick('returnToMenu', () => this.returnToMenu());

        safeClick('closeSettings', () => this.hideSettings());

        safeClick('playAgain', () => this.restartSong());
        safeClick('uploadNewSong', () => this.returnToMenu());
        safeClick('mainMenuFromComplete', () => this.returnToMenu());

        if (this.uploadButton && this.audioFileInput) {
            this.uploadButton.addEventListener('click', () => this.audioFileInput.click());
        }

        document.addEventListener('keydown', e => this.onKeyDown(e));
        document.addEventListener('keyup', e => this.onKeyUp(e));
    }

    /* =========================
       MENUS
    ========================= */
    hideAll() {
        [
            this.mainMenu,
            this.levelSelectMenu,
            this.gameContainer,
            this.pauseMenu,
            this.settingsMenu,
            this.songCompleteMenu,
            this.introScreen
        ].forEach(el => el && el.classList.add('hidden'));
    }

    showMainMenu() {
        this.gameMode = 'menu';
        this.hideAll();
        this.mainMenu?.classList.remove('hidden');
    }

    showLevelSelect() {
        this.gameMode = 'levelSelect';
        this.hideAll();
        this.levelSelectMenu?.classList.remove('hidden');
    }

    showSettings() {
        this.settingsMenu?.classList.add('active');
    }

    hideSettings() {
        this.settingsMenu?.classList.remove('active');
    }

    /* =========================
       LEVELS
    ========================= */
    initializeLevels() {
        this.levels = [
            { id: 1, name: 'Level 1', artist: 'Demo', difficulty: 'Easy', musicFile: 'song1.mp3' },
            { id: 2, name: 'Level 2', artist: 'Demo', difficulty: 'Medium', musicFile: 'song2.mp3' },
            { id: 3, name: 'Level 3', artist: 'Demo', difficulty: 'Hard', musicFile: 'song3.mp3' }
        ];

        if (!this.levelGrid) return;

        this.levelGrid.innerHTML = '';
        this.levels.forEach(level => {
            const card = document.createElement('div');
            card.className = 'level-card';
            card.innerHTML = `
                <h3>${level.name}</h3>
                <p>${level.artist}</p>
                <button>▶ Play</button>
            `;
            card.querySelector('button').addEventListener('click', e => {
                e.stopPropagation();
                this.startLevel(level);
            });
            this.levelGrid.appendChild(card);
        });
    }

    /* =========================
       GAME START
    ========================= */
    async startLevel(level) {
        this.currentLevelData = level;
        this.hideAll();
        this.gameContainer?.classList.remove('hidden');
        await this.loadAudio(level.musicFile);
        this.startGame();
    }

    async loadAudio(file) {
        this.audioContext = new AudioContext();
        const res = await fetch(file);
        const buf = await res.arrayBuffer();
        this.audioBuffer = await this.audioContext.decodeAudioData(buf);
        this.duration = this.audioBuffer.duration;
    }

    startGame() {
        this.isPlaying = true;
        this.startTime = this.audioContext.currentTime;

        this.audioSource = this.audioContext.createBufferSource();
        this.audioSource.buffer = this.audioBuffer;
        this.audioSource.connect(this.audioContext.destination);
        this.audioSource.start();

        requestAnimationFrame(() => this.gameLoop());
    }

    gameLoop() {
        if (!this.isPlaying || this.isPaused) return;
        requestAnimationFrame(() => this.gameLoop());
    }

    /* =========================
       INPUT
    ========================= */
    onKeyDown(e) {
        if (e.key === 'Escape') {
            if (this.gameMode === 'playing') this.togglePause();
            return;
        }
    }

    onKeyUp() {}

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.audioContext?.suspend();
            this.pauseMenu?.classList.add('active');
        } else {
            this.audioContext?.resume();
            this.pauseMenu?.classList.remove('active');
            this.gameLoop();
        }
    }

    resumeGame() {
        if (this.isPaused) this.togglePause();
    }

    restartSong() {
        this.cleanup();
        this.startLevel(this.currentLevelData);
    }

    returnToMenu() {
        this.cleanup();
        this.showMainMenu();
    }

    cleanup() {
        try {
            this.audioSource?.stop();
            this.audioSource?.disconnect();
            this.audioContext?.close();
        } catch {}
        this.isPlaying = false;
        this.isPaused = false;
    }
}

/* =========================
   BOOTSTRAP
========================= */
document.addEventListener('DOMContentLoaded', () => {
    window.game = new NeonNightmare();
});
