// ==================================
// Colyseus Multiplayer Client
// ==================================

class MultiplayerManager {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.client = null;
        this.room = null;
        this.isConnected = false;
        this.isHost = false;
        this.opponentId = null;
        this.opponentScore = 0;
        this.opponentCombo = 0;
        this.opponentHealth = 100;
        this.currentRoomId = null;
        
        // Multiplayer UI Elements
        this.multiplayerMenu = null;
        this.createRoomMenu = null;
        this.joinRoomMenu = null;
        this.waitingRoom = null;
        this.multiplayerHUD = null;
        
        this.initializeUI();
    }

    async initialize() {
        try {
            // Initialize Colyseus client
            // Force update to new server URL
            localStorage.removeItem('colyseusServer');
            const serverUrl = 'wss://2567-21f97470-0a14-4362-8b9c-029b3fe4ef0e.sandbox-service.public.prod.myninja.ai';
            this.client = new Colyseus.Client(serverUrl);
            
            console.log('Colyseus client initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize Colyseus client:', error);
            return false;
        }
    }

    initializeUI() {
        console.log('initializeUI called');
        
        // Create multiplayer menu if it doesn't exist
        if (!document.getElementById('multiplayerMenu')) {
            console.log('Creating multiplayer menu HTML');
            this.createMultiplayerMenu();
        } else {
            console.log('Multiplayer menu already exists');
        }
        
        // Initialize UI references
        this.multiplayerMenu = document.getElementById('multiplayerMenu');
        this.createRoomMenu = document.getElementById('createRoomMenu');
        this.joinRoomMenu = document.getElementById('joinRoomMenu');
        this.waitingRoom = document.getElementById('waitingRoom');
        this.multiplayerHUD = document.getElementById('multiplayerHUD');
        
        console.log('Multiplayer menu element:', this.multiplayerMenu);
        console.log('Create room menu element:', this.createRoomMenu);
        console.log('Join room menu element:', this.joinRoomMenu);
        
        // Setup event listeners
        this.setupEventListeners();
    }

    createMultiplayerMenu() {
        const multiplayerHTML = `
            <!-- Multiplayer Main Menu -->
            <div class="menu-container" id="multiplayerMenu" style="display: none;">
                <h2 class="menu-title">MULTIPLAYER</h2>
                
                <div class="multiplayer-options">
                    <button class="menu-button" id="createRoomBtn">
                        🎮 Create Room
                    </button>
                    <button class="menu-button" id="joinRoomBtn">
                        🔗 Join Room
                    </button>
                    <button class="menu-button" id="quickMatchBtn">
                        ⚡ Quick Match
                    </button>
                </div>
                
                <button class="menu-button back-button" id="backToMainMenuBtn">
                    ← Back to Main Menu
                </button>
            </div>

            <!-- Create Room Menu -->
            <div class="menu-container" id="createRoomMenu" style="display: none;">
                <h2 class="menu-title">CREATE ROOM</h2>
                
                <div class="room-creation">
                    <div class="song-selection">
                        <label>Select Song (Level 1-50):</label>
                        <select id="songSelect" class="themed-select">
                            ${this.generateSongOptions()}
                        </select>
                    </div>
                    
                    <div class="room-settings">
                        <label class="checkbox-label">
                            <input type="checkbox" id="privateRoom">
                            <span>Private Room</span>
                        </label>
                    </div>
                    
                    <div class="room-code-display" id="roomCodeDisplay" style="display: none;">
                        <label>Room Code:</label>
                        <input type="text" id="roomCode" class="themed-input" readonly>
                        <button class="copy-button" id="copyRoomCode">Copy</button>
                    </div>
                </div>
                
                <div class="menu-buttons">
                    <button class="menu-button" id="confirmCreateRoom">Create Room</button>
                    <button class="menu-button back-button" id="cancelCreateRoom">Cancel</button>
                </div>
            </div>

            <!-- Join Room Menu -->
            <div class="menu-container" id="joinRoomMenu" style="display: none;">
                <h2 class="menu-title">JOIN ROOM</h2>
                
                <div class="room-joining">
                    <label>Enter Room Code:</label>
                    <input type="text" id="joinRoomCode" class="themed-input" placeholder="Enter code...">
                </div>
                
                <div class="menu-buttons">
                    <button class="menu-button" id="confirmJoinRoom">Join Room</button>
                    <button class="menu-button back-button" id="cancelJoinRoom">Cancel</button>
                </div>
            </div>

            <!-- Waiting Room -->
            <div class="menu-container" id="waitingRoom" style="display: none;">
                <h2 class="menu-title">WAITING FOR OPPONENT</h2>
                
                <div class="waiting-info">
                    <div class="room-code-display">
                        <label>Room Code:</label>
                        <input type="text" id="waitingRoomCode" class="themed-input" readonly>
                    </div>
                    
                    <div class="player-status">
                        <div class="status-item host">
                            <span class="status-label">Host:</span>
                            <span class="status-value">You</span>
                            <span class="status-indicator ready">Ready</span>
                        </div>
                        <div class="status-item opponent">
                            <span class="status-label">Opponent:</span>
                            <span class="status-value" id="opponentStatus">Waiting...</span>
                            <span class="status-indicator" id="opponentIndicator">⏳</span>
                        </div>
                    </div>
                    
                    <div class="selected-song-display">
                        <label>Selected Song:</label>
                        <span id="selectedSongDisplay">Level 1</span>
                    </div>
                </div>
                
                <div class="menu-buttons">
                    <button class="menu-button" id="cancelWaiting">Cancel</button>
                </div>
            </div>

            <!-- Multiplayer HUD -->
            <div class="multiplayer-hud" id="multiplayerHUD" style="display: none;">
                <div class="opponent-info">
                    <span class="opponent-label">Opponent</span>
                    <span class="opponent-score" id="opponentScoreDisplay">0</span>
                    <span class="opponent-combo" id="opponentComboDisplay">0x</span>
                    <span class="opponent-health" id="opponentHealthDisplay">100%</span>
                </div>
            </div>
        `;
        
        console.log('Inserting multiplayer HTML to body');
        document.body.insertAdjacentHTML('beforeend', multiplayerHTML);
        console.log('Multiplayer HTML inserted successfully');
        
        // Verify the menu was created
        const menu = document.getElementById('multiplayerMenu');
        console.log('Menu element after creation:', menu);
    }

    generateSongOptions() {
        let options = '';
        for (let i = 1; i <= 50; i++) {
            options += `<option value="${i}">Level ${i}</option>`;
        }
        return options;
    }

    setupEventListeners() {
        // Show multiplayer menu
        const showMultiplayerBtn = document.getElementById('showMultiplayer');
        if (showMultiplayerBtn) {
            showMultiplayerBtn.addEventListener('click', () => this.showMultiplayerMenu());
        }

        // Create room
        const createRoomBtn = document.getElementById('createRoomBtn');
        if (createRoomBtn) {
            createRoomBtn.addEventListener('click', () => this.showCreateRoom());
        }

        // Join room
        const joinRoomBtn = document.getElementById('joinRoomBtn');
        if (joinRoomBtn) {
            joinRoomBtn.addEventListener('click', () => this.showJoinRoom());
        }

        // Quick match
        const quickMatchBtn = document.getElementById('quickMatchBtn');
        if (quickMatchBtn) {
            quickMatchBtn.addEventListener('click', () => this.quickMatch());
        }

        // Back to main menu
        const backBtn = document.getElementById('backToMainMenuBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.hideMultiplayerMenu());
        }

        // Confirm create room
        const confirmCreateBtn = document.getElementById('confirmCreateRoom');
        if (confirmCreateBtn) {
            confirmCreateBtn.addEventListener('click', () => this.createRoom());
        }

        // Cancel create room
        const cancelCreateBtn = document.getElementById('cancelCreateRoom');
        if (cancelCreateBtn) {
            cancelCreateBtn.addEventListener('click', () => this.hideCreateRoom());
        }

        // Confirm join room
        const confirmJoinBtn = document.getElementById('confirmJoinRoom');
        if (confirmJoinBtn) {
            confirmJoinBtn.addEventListener('click', () => this.joinRoom());
        }

        // Cancel join room
        const cancelJoinBtn = document.getElementById('cancelJoinRoom');
        if (cancelJoinBtn) {
            cancelJoinBtn.addEventListener('click', () => this.hideJoinRoom());
        }

        // Cancel waiting
        const cancelWaitingBtn = document.getElementById('cancelWaiting');
        if (cancelWaitingBtn) {
            cancelWaitingBtn.addEventListener('click', () => this.leaveRoom());
        }

        // Copy room code
        const copyBtn = document.getElementById('copyRoomCode');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyRoomCode());
        }
    }

    showMultiplayerMenu() {
        console.log('showMultiplayerMenu called');
        console.log('Main menu:', this.game.mainMenu);
        console.log('Multiplayer menu:', this.multiplayerMenu);
        
        if (this.game.mainMenu) {
            this.game.mainMenu.style.display = 'none';
            console.log('Main menu hidden');
        }
        if (this.multiplayerMenu) {
            this.multiplayerMenu.style.display = 'block';
            console.log('Multiplayer menu shown');
        } else {
            console.error('Multiplayer menu element not found!');
        }
    }

    hideMultiplayerMenu() {
        if (this.multiplayerMenu) {
            this.multiplayerMenu.style.display = 'none';
        }
        if (this.game.mainMenu) {
            this.game.mainMenu.style.display = 'block';
        }
    }

    showCreateRoom() {
        if (this.multiplayerMenu) {
            this.multiplayerMenu.style.display = 'none';
        }
        if (this.createRoomMenu) {
            this.createRoomMenu.style.display = 'block';
        }
    }

    hideCreateRoom() {
        if (this.createRoomMenu) {
            this.createRoomMenu.style.display = 'none';
        }
        if (this.multiplayerMenu) {
            this.multiplayerMenu.style.display = 'block';
        }
    }

    showJoinRoom() {
        if (this.multiplayerMenu) {
            this.multiplayerMenu.style.display = 'none';
        }
        if (this.joinRoomMenu) {
            this.joinRoomMenu.style.display = 'block';
        }
    }

    hideJoinRoom() {
        if (this.joinRoomMenu) {
            this.joinRoomMenu.style.display = 'none';
        }
        if (this.multiplayerMenu) {
            this.multiplayerMenu.style.display = 'block';
        }
    }

    async createRoom() {
        try {
            if (!this.client) {
                await this.initialize();
            }

            const songId = parseInt(document.getElementById('songSelect').value);
            const isPrivate = document.getElementById('privateRoom').checked;

            // Create room options
            const options = {};
            if (isPrivate) {
                options.private = true;
            }

            // Join/create room
            this.room = await this.client.joinOrCreate('rhythm_game', options);
            
            this.isHost = true;
            this.currentRoomId = this.room.roomId;
            this.isConnected = true;
            
            // Setup room event handlers
            this.setupRoomHandlers();
            
            // Send song selection
            this.room.send({ type: 'selectSong', songId });
            
            // Show waiting room
            this.showWaitingRoom(songId);
            
        } catch (error) {
            console.error('Failed to create room:', error);
            this.showError('Failed to create room. Please try again.');
        }
    }

    async joinRoom() {
        try {
            if (!this.client) {
                await this.initialize();
            }

            const roomCode = document.getElementById('joinRoomCode').value.trim();
            
            if (!roomCode) {
                this.showError('Please enter a room code');
                return;
            }

            // Join existing room
            this.room = await this.client.joinById(roomCode);
            
            this.isHost = false;
            this.currentRoomId = this.room.roomId;
            this.isConnected = true;
            
            // Setup room event handlers
            this.setupRoomHandlers();
            
            // Send ready status
            this.room.send({ type: 'setReady' });
            
        } catch (error) {
            console.error('Failed to join room:', error);
            this.showError('Failed to join room. Invalid code or room is full.');
        }
    }

    async quickMatch() {
        try {
            if (!this.client) {
                await this.initialize();
            }

            // Join any available room
            this.room = await this.client.joinOrCreate('rhythm_game');
            
            this.isHost = false;
            this.currentRoomId = this.room.roomId;
            this.isConnected = true;
            
            // Setup room event handlers
            this.setupRoomHandlers();
            
            // Show waiting for opponent message
            this.showQuickMatchWaiting();
            
        } catch (error) {
            console.error('Failed to quick match:', error);
            this.showError('No available rooms found. Please try creating a room.');
        }
    }

    setupRoomHandlers() {
        // Player joined
        this.room.onMessage('playerJoined', (data) => {
            console.log('Player joined:', data);
            if (this.waitingRoom) {
                this.updateWaitingRoom(true);
            }
        });

        // Player left
        this.room.onMessage('playerLeft', (data) => {
            console.log('Player left:', data);
            this.handleOpponentLeft();
        });

        // Room ready
        this.room.onMessage('roomReady', (data) => {
            console.log('Room ready:', data);
        });

        // Song selected
        this.room.onMessage('songSelected', (data) => {
            console.log('Song selected:', data.songId);
            if (this.waitingRoom) {
                document.getElementById('selectedSongDisplay').textContent = `Level ${data.songId}`;
            }
        });

        // Game started
        this.room.onMessage('gameStarted', (data) => {
            console.log('Game started:', data);
            this.startMultiplayerGame(data);
        });

        // Score update
        this.room.onMessage('scoreUpdate', (data) => {
            if (data.playerId !== this.room.sessionId) {
                this.updateOpponentStats(data.score, data.combo, data.health);
            }
        });

        // Game ended
        this.room.onMessage('gameEnded', (data) => {
            console.log('Game ended:', data);
            this.handleGameEnd(data);
        });

        // Room state change
        this.room.onStateChange((state) => {
            console.log('Room state changed:', state);
        });
    }

    showWaitingRoom(songId) {
        if (this.createRoomMenu) {
            this.createRoomMenu.style.display = 'none';
        }
        if (this.waitingRoom) {
            this.waitingRoom.style.display = 'block';
            document.getElementById('waitingRoomCode').value = this.currentRoomId;
            document.getElementById('selectedSongDisplay').textContent = `Level ${songId}`;
            this.updateWaitingRoom(false);
        }
    }

    showQuickMatchWaiting() {
        // Show a simple waiting message
        const waitingHTML = `
            <div class="menu-container" id="quickMatchWaiting" style="display: block;">
                <h2 class="menu-title">FINDING OPPONENT...</h2>
                <div class="loading-spinner"></div>
                <p>Please wait while we find you an opponent...</p>
                <button class="menu-button back-button" id="cancelQuickMatch">Cancel</button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', waitingHTML);
        
        const cancelBtn = document.getElementById('cancelQuickMatch');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.leaveRoom());
        }
    }

    updateWaitingRoom(opponentConnected) {
        if (!this.waitingRoom) return;
        
        const opponentStatus = document.getElementById('opponentStatus');
        const opponentIndicator = document.getElementById('opponentIndicator');
        
        if (opponentConnected) {
            opponentStatus.textContent = 'Connected';
            opponentIndicator.textContent = '✓';
            opponentIndicator.classList.add('ready');
        } else {
            opponentStatus.textContent = 'Waiting...';
            opponentIndicator.textContent = '⏳';
            opponentIndicator.classList.remove('ready');
        }
    }

    updateOpponentStats(score, combo, health) {
        this.opponentScore = score;
        this.opponentCombo = combo;
        this.opponentHealth = health;
        
        if (this.multiplayerHUD) {
            document.getElementById('opponentScoreDisplay').textContent = score.toLocaleString();
            document.getElementById('opponentComboDisplay').textContent = combo + 'x';
            document.getElementById('opponentHealthDisplay').textContent = health + '%';
        }
    }

    async startMultiplayerGame(data) {
        // Hide waiting room
        const waitingMenus = ['waitingRoom', 'quickMatchWaiting'];
        waitingMenus.forEach(id => {
            const menu = document.getElementById(id);
            if (menu) menu.style.display = 'none';
        });
        
        // Show multiplayer HUD
        if (this.multiplayerHUD) {
            this.multiplayerHUD.style.display = 'block';
        }
        
        // Load and start the game with selected song
        this.game.currentLevel = data.songId;
        this.game.difficulty = this.game.getDifficultyForLevel(data.songId);
        
        try {
            await this.game.loadLevelAudio(data.songId);
        } catch (error) {
            console.error('Failed to load song:', error);
            this.showError('Failed to load song. Please select another song.');
            this.leaveRoom();
        }
    }

    sendScoreUpdate(score, combo, health) {
        if (this.room && this.isConnected) {
            this.room.send({
                type: 'updateScore',
                score: score,
                combo: combo,
                health: health
            });
        }
    }

    sendGameFinished(finalScore) {
        if (this.room && this.isConnected) {
            this.room.send({
                type: 'gameFinished',
                finalScore: finalScore
            });
        }
    }

    handleGameEnd(data) {
        // Determine result
        const playerScore = this.game.score;
        const opponentScore = data.finalScores[this.opponentId] || 0;
        
        const playerWon = playerScore >= opponentScore;
        
        // Show game over with multiplayer result
        this.showMultiplayerResult(playerWon, playerScore, opponentScore);
    }

    showMultiplayerResult(playerWon, playerScore, opponentScore) {
        const resultHTML = `
            <div class="menu-container" id="multiplayerResult" style="display: block;">
                <h2 class="menu-title">${playerWon ? '🎉 VICTORY!' : '😢 DEFEAT'}</h2>
                
                <div class="score-comparison">
                    <div class="player-score">
                        <span class="score-label">Your Score:</span>
                        <span class="score-value">${playerScore.toLocaleString()}</span>
                    </div>
                    <div class="opponent-score">
                        <span class="score-label">Opponent Score:</span>
                        <span class="score-value">${opponentScore.toLocaleString()}</span>
                    </div>
                </div>
                
                <div class="menu-buttons">
                    <button class="menu-button" id="playAgainMultiplayer">Play Again</button>
                    <button class="menu-button" id="backToMenuMultiplayer">Main Menu</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', resultHTML);
        
        const playAgainBtn = document.getElementById('playAgainMultiplayer');
        const backToMenuBtn = document.getElementById('backToMenuMultiplayer');
        
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                document.getElementById('multiplayerResult').remove();
                this.showMultiplayerMenu();
            });
        }
        
        if (backToMenuBtn) {
            backToMenuBtn.addEventListener('click', () => {
                document.getElementById('multiplayerResult').remove();
                this.leaveRoom();
                this.game.returnToMenu();
            });
        }
    }

    handleOpponentLeft() {
        // Show opponent left message
        const opponentLeftHTML = `
            <div class="menu-container" id="opponentLeftModal" style="display: block;">
                <h2 class="menu-title">OPPONENT DISCONNECTED</h2>
                <p>Your opponent has left the game.</p>
                <div class="menu-buttons">
                    <button class="menu-button" id="backToMenuFromDisconnect">Main Menu</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', opponentLeftHTML);
        
        const backBtn = document.getElementById('backToMenuFromDisconnect');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                document.getElementById('opponentLeftModal').remove();
                this.leaveRoom();
                this.game.returnToMenu();
            });
        }
    }

    async leaveRoom() {
        if (this.room) {
            await this.room.leave();
            this.room = null;
        }
        
        this.isConnected = false;
        this.isHost = false;
        this.opponentId = null;
        this.currentRoomId = null;
        
        // Hide multiplayer HUD
        if (this.multiplayerHUD) {
            this.multiplayerHUD.style.display = 'none';
        }
        
        // Hide any multiplayer menus
        const menus = ['waitingRoom', 'quickMatchWaiting', 'createRoomMenu', 'joinRoomMenu'];
        menus.forEach(id => {
            const menu = document.getElementById(id);
            if (menu) menu.style.display = 'none';
        });
    }

    copyRoomCode() {
        const roomCodeInput = document.getElementById('roomCode');
        if (roomCodeInput) {
            roomCodeInput.select();
            document.execCommand('copy');
            
            const copyBtn = document.getElementById('copyRoomCode');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        }
    }

    showError(message) {
        const errorHTML = `
            <div class="error-modal" id="errorModal" style="display: block;">
                <h2>Error</h2>
                <p>${message}</p>
                <button class="menu-button" id="closeErrorModal">OK</button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', errorHTML);
        
        const closeBtn = document.getElementById('closeErrorModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                document.getElementById('errorModal').remove();
            });
        }
    }

    cleanup() {
        this.leaveRoom();
    }
}