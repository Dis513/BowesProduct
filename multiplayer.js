// ==================================
// MultiplayerManager - Handles Multiplayer Logic
// ==================================

class MultiplayerManager {
    constructor(game) {
        this.game = game;
        this.client = null;
        this.room = null;
        this.lobbyCode = null;
        this.isHost = false;
        this.opponentId = null;
        this.availableLobbies = [];
        
        // UI Elements
        this.multiplayerMenu = null;
        this.lobbyList = null;
        this.createRoomCode = null;
        this.lobbyStatus = null;
        
        console.log('MultiplayerManager initialized');
        this.createMultiplayerUI();
    }

    // ==================================
    // UI Creation
    // ==================================

    createMultiplayerUI() {
        // Create multiplayer menu if it doesn't exist
        if (!document.getElementById('multiplayerMenu')) {
            const menuHTML = `
                <div class="pause-menu" id="multiplayerMenu" style="display: none;">
                    <h2 class="pause-title">👥 MULTIPLAYER</h2>
                    
                    <!-- Connection Status -->
                    <div class="connection-status" id="connectionStatus">
                        <span class="status-indicator offline"></span>
                        <span class="status-text">Disconnected</span>
                    </div>
                    
                    <!-- Create Room Section -->
                    <div class="lobby-section">
                        <h3>Create Room</h3>
                        <div class="room-type-selector">
                            <button class="room-type-btn active" data-type="public">
                                🌍 Public Lobby
                            </button>
                            <button class="room-type-btn" data-type="private">
                                🔒 Private Lobby
                            </button>
                        </div>
                        <div class="private-code-section" id="privateCodeSection" style="display: none;">
                            <label for="roomCodeInput">Room Code (optional):</label>
                            <input type="text" id="roomCodeInput" class="room-code-input" 
                                   placeholder="Enter custom code or leave empty for auto-generated" 
                                   maxlength="8" pattern="[A-Z0-9]{4,8}">
                            <p class="code-hint">Enter 4-8 characters or leave empty for auto-generated code</p>
                        </div>
                        <button class="menu-button" id="createRoomBtn">
                            🎮 Create Room
                        </button>
                    </div>
                    
                    <!-- Join Room Section -->
                    <div class="lobby-section">
                        <h3>Join Room</h3>
                        <div class="join-room-inputs">
                            <input type="text" id="joinCodeInput" class="room-code-input" 
                                   placeholder="Enter room code" maxlength="8">
                            <button class="menu-button" id="joinRoomBtn">
                                🔑 Join by Code
                            </button>
                        </div>
                    </div>
                    
                    <!-- Available Lobbies -->
                    <div class="lobby-section">
                        <h3>Available Lobbies</h3>
                        <button class="menu-button small" id="refreshLobbiesBtn">
                            🔄 Refresh List
                        </button>
                        <div class="lobby-list" id="lobbyList">
                            <div class="no-lobbies">No lobbies available. Create one!</div>
                        </div>
                    </div>
                    
                    <!-- Current Room Info -->
                    <div class="current-room-info" id="currentRoomInfo" style="display: none;">
                        <h3>Current Room</h3>
                        <div class="room-details">
                            <p><strong>Room Code:</strong> <span id="currentRoomCode">---</span></p>
                            <p><strong>Players:</strong> <span id="playerCount">1/2</span></p>
                            <p><strong>Room Type:</strong> <span id="roomType">---</span></p>
                        </div>
                        <div class="lobby-players" id="lobbyPlayers">
                            <!-- Players will be listed here -->
                        </div>
                        <div class="room-actions">
                            <button class="menu-button" id="readyBtn" disabled>
                                ✅ Ready
                            </button>
                            <button class="menu-button" id="leaveRoomBtn">
                                🚪 Leave Room
                            </button>
                        </div>
                    </div>
                    
                    <!-- Back Button -->
                    <div class="menu-options">
                        <button class="menu-button" id="closeMultiplayer">
                            ← Back to Menu
                        </button>
                    </div>
                </div>
            `;
            
            // Insert menu before game container
            const gameContainer = document.getElementById('gameContainer');
            gameContainer.insertAdjacentHTML('beforebegin', menuHTML);
            
            // Create persistent lobby overlay
            const overlayHTML = `
                <div class="lobby-overlay" id="lobbyOverlay" style="display: none;">
                    <div class="lobby-overlay-content">
                        <div class="lobby-overlay-info">
                            <span class="lobby-overlay-icon">🎮</span>
                            <div class="lobby-overlay-details">
                                <span class="lobby-overlay-code" id="overlayRoomCode">---</span>
                                <span class="lobby-overlay-players" id="overlayPlayerCount">1/2</span>
                            </div>
                        </div>
                        <button class="lobby-overlay-close" id="closeOverlay">×</button>
                    </div>
                </div>
            `;
            gameContainer.insertAdjacentHTML('beforebegin', overlayHTML);
            
            // Cache UI elements
            this.multiplayerMenu = document.getElementById('multiplayerMenu');
            this.lobbyList = document.getElementById('lobbyList');
            this.connectionStatus = document.getElementById('connectionStatus');
            this.privateCodeSection = document.getElementById('privateCodeSection');
            this.currentRoomInfo = document.getElementById('currentRoomInfo');
            
            this.setupMultiplayerEventListeners();
        }
    }

    setupMultiplayerEventListeners() {
        // Room type selector
        document.querySelectorAll('.room-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.room-type-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const roomType = e.target.dataset.type;
                if (roomType === 'private') {
                    this.privateCodeSection.style.display = 'block';
                } else {
                    this.privateCodeSection.style.display = 'none';
                }
            });
        });

        // Create room button
        document.getElementById('createRoomBtn').addEventListener('click', () => {
            this.createRoom();
        });

        // Join room button
        document.getElementById('joinRoomBtn').addEventListener('click', () => {
            const code = document.getElementById('joinCodeInput').value.trim().toUpperCase();
            if (code) {
                this.joinRoom(code);
            } else {
                this.showError('Please enter a room code');
            }
        });

        // Refresh lobbies button
        document.getElementById('refreshLobbiesBtn').addEventListener('click', () => {
            this.getAvailableLobbies();
        });

        // Ready button
        document.getElementById('readyBtn').addEventListener('click', () => {
            this.toggleReady();
        });

        // Leave room button
        document.getElementById('leaveRoomBtn').addEventListener('click', () => {
            this.leaveRoom();
        });

        // Close multiplayer menu
        document.getElementById('closeMultiplayer').addEventListener('click', () => {
            this.hideMultiplayerMenu();
        });

        // Close overlay button
        document.getElementById('closeOverlay').addEventListener('click', () => {
            document.getElementById('lobbyOverlay').style.display = 'none';
        });
    }

    // ==================================
    // Room Management
    // ==================================

    async createRoom() {
        try {
            const activeTypeBtn = document.querySelector('.room-type-btn.active');
            const roomType = activeTypeBtn.dataset.type;
            let roomCode = null;

            // For private rooms, get or generate code
            if (roomType === 'private') {
                const customCode = document.getElementById('roomCodeInput').value.trim().toUpperCase();
                roomCode = customCode || this.generateRoomCode();
            } else {
                // Public rooms - generate code but don't show it
                roomCode = this.generateRoomCode();
            }

            console.log(`Creating ${roomType} room with code: ${roomCode}`);

            // Connect to server and create room
            await this.connectToServer();
            
            // Join/create the room
            this.room = await this.client.joinOrCreate('rhythm_game', {
                roomCode: roomCode,
                roomType: roomType,
                isHost: true
            });

            this.setupRoomListeners();
            this.lobbyCode = roomCode;
            this.isHost = true;

            console.log('Room created successfully:', roomCode);
            
            // For public rooms, don't show the code
            const displayCode = roomType === 'private' ? roomCode : 'Public Lobby';
            this.showRoomInfo(displayCode, roomType);
            this.updateConnectionStatus(true);

        } catch (error) {
            console.error('Error creating room:', error);
            this.showError('Failed to create room: ' + error.message);
            this.updateConnectionStatus(false);
        }
    }

    async joinRoom(roomId, code, type = 'private') {
        try {
            console.log('Joining room:', roomId, 'Code:', code, 'Type:', type);

            await this.connectToServer();
            
            // Try to join the room by ID (not roomCode)
            this.room = await this.client.joinById(roomId, {
                roomCode: code,
                isHost: false
            });

            this.setupRoomListeners();
            this.lobbyCode = code;
            this.isHost = false;

            console.log('Joined room successfully:', roomId);
            
            // Display appropriate room info based on type
            const displayCode = type === 'public' ? 'Public Lobby' : code;
            this.showRoomInfo(displayCode, type);
            this.updateConnectionStatus(true);

        } catch (error) {
            console.error('Error joining room:', error);
            this.showError('Failed to join room. The lobby may be full or the code is incorrect.');
            this.updateConnectionStatus(false);
        }
    }

    async getAvailableLobbies() {
        try {
            console.log('Fetching available lobbies...');
            
            if (!this.client) {
                await this.connectToServer();
            }

            // Get all available rooms
            const rooms = await this.client.getAvailableRooms('rhythm_game');
            
            console.log('Available rooms:', rooms);
            console.log('Room details:', rooms.map(r => ({
                roomId: r.roomId,
                clients: r.clients,
                maxClients: r.maxClients,
                metadata: r.metadata
            })));
            
            this.displayLobbies(rooms);

        } catch (error) {
            console.error('Error fetching lobbies:', error);
            this.showError('Failed to fetch available lobbies');
        }
    }

    displayLobbies(rooms) {
        this.lobbyList.innerHTML = '';

        if (!rooms || rooms.length === 0) {
            this.lobbyList.innerHTML = '<div class="no-lobbies">No lobbies available. Create one!</div>';
            return;
        }

        console.log('Displaying lobbies:', rooms.length);

        rooms.forEach(room => {
            const roomData = room.metadata || {};
            const roomCode = roomData.roomCode || 'Unknown';
            const roomType = roomData.roomType || 'public';
            const playerCount = room.clients;
            const maxPlayers = room.maxClients || 2;

            console.log(`Room ${room.roomId}: type=${roomType}, players=${playerCount}/${maxPlayers}`);

            // Show all rooms that aren't full
            if (playerCount < maxPlayers) {
                const lobbyItem = document.createElement('div');
                lobbyItem.className = 'lobby-item';
                
                // For public lobbies, don't show the room code - just show "Public"
                // For private lobbies, show the room code with lock icon
                const lobbyName = roomType === 'public' ? '🌍 Public Lobby' : '🔒 ' + roomCode;
                
                lobbyItem.innerHTML = `
                    <div class="lobby-info">
                        <span class="lobby-code">${lobbyName}</span>
                        <span class="lobby-players">${playerCount}/${maxPlayers} players</span>
                    </div>
                    <button class="join-lobby-btn" data-roomid="${room.roomId}" data-code="${roomCode}" data-type="${roomType}">
                        Join
                    </button>
                `;
                this.lobbyList.appendChild(lobbyItem);
            }
        });

        // Add click listeners to join buttons
        document.querySelectorAll('.join-lobby-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const roomId = btn.dataset.roomid;
                const code = btn.dataset.code;
                const type = btn.dataset.type;
                this.joinRoom(roomId, code, type);
            });
        });
    }

    // ==================================
    // Room Listeners
    // ==================================

    setupRoomListeners() {
        // Log when listener is set up
        console.log('Setting up room listeners for room:', this.room.roomId);
        console.log('My session ID:', this.room.sessionId);

        this.room.onStateChange((state) => {
            console.log('Room state changed:', state);
            this.updateRoomInfo(state);
            this.updatePlayersList(state.players);
            this.checkAllPlayersReady(state.players);
        });

        this.room.onMessage('playerJoined', (data) => {
            console.log('Player joined:', data);
            this.showNotification(`Player joined!`);
            this.updatePlayerCount(data.playerCount);
        });

        this.room.onMessage('playerLeft', (data) => {
            console.log('Player left:', data);
            this.showNotification(`Player left`);
            this.updatePlayerCount();
        });

        this.room.onMessage('playerReady', (data) => {
            console.log('Player ready:', data);
            this.updateReadyStatus(data.playerId, true);
            
            // Get current room state to check if all players are ready
            if (this.room.state) {
                this.checkAllPlayersReady(this.room.state.players);
            }
        });

        this.room.onMessage('roomReady', (data) => {
            console.log('Room ready:', data);
            this.updatePlayerCount(data.playerCount);
            const readyBtn = document.getElementById('readyBtn');
            if (readyBtn) {
                readyBtn.disabled = false;
                console.log('Ready button enabled');
            }
        });

        this.room.onMessage('gameStarted', (data) => {
            console.log('Game started:', data);
            this.startMultiplayerGame(data);
        });

        this.room.onMessage('scoreUpdate', (data) => {
            console.log('Score update:', data);
            this.updateOpponentScore(data);
        });

        this.room.onMessage('gameEnded', (data) => {
            console.log('Game ended:', data);
            this.showGameResults(data);
        });

        this.room.onLeave(() => {
            console.log('Left the room');
            this.handleRoomLeave();
        });
        
        console.log('Room listeners set up successfully');
    }

    // ==================================
    // UI Updates
    // ==================================

    showRoomInfo(code, type) {
        document.getElementById('currentRoomCode').textContent = code;
        document.getElementById('roomType').textContent = type === 'public' ? 'Public' : 'Private';
        this.currentRoomInfo.style.display = 'block';
        
        // Update and show overlay
        const overlay = document.getElementById('lobbyOverlay');
        document.getElementById('overlayRoomCode').textContent = code;
        overlay.style.display = 'block';
        
        // Hide create/join sections when in a room
        document.querySelectorAll('.lobby-section').forEach(section => {
            if (!section.querySelector('#currentRoomInfo')) {
                section.style.display = 'none';
            }
        });
    }

    updateRoomInfo(state) {
        if (state) {
            this.updatePlayerCount(Object.keys(state.players).length);
            this.updatePlayersList(state.players);
            this.checkAllPlayersReady(state.players);
        }
    }

    updatePlayerCount(count) {
        document.getElementById('playerCount').textContent = `${count}/2`;
        
        // Also update overlay
        const overlayPlayerCount = document.getElementById('overlayPlayerCount');
        if (overlayPlayerCount) {
            overlayPlayerCount.textContent = `${count}/2`;
        }
    }

    updatePlayersList(players) {
        const playersList = document.getElementById('lobbyPlayers');
        playersList.innerHTML = '';

        console.log('Updating players list:', players);
        console.log('My session ID:', this.room ? this.room.sessionId : 'No room yet');

        Object.values(players).forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = `lobby-player ${player.ready ? 'ready' : 'not-ready'}`;
            playerDiv.dataset.playerId = player.id; // Store player ID for easy reference
            
            // Determine player name (You vs Opponent)
            const isYou = this.room && player.id === this.room.sessionId;
            const playerName = isYou ? '👤 You' : '👥 Opponent';
            
            playerDiv.innerHTML = `
                <span class="player-name">${playerName}</span>
                <span class="player-status">${player.ready ? '✅ Ready' : '⏳ Not Ready'}</span>
            `;
            playersList.appendChild(playerDiv);
        });
    }

    updateReadyStatus(playerId, ready) {
        // Update UI to reflect ready status
        const playerElements = document.querySelectorAll('.lobby-player');
        playerElements.forEach(el => {
            // Find the player element by checking if it contains the player ID
            if (el.dataset.playerId === playerId) {
                el.classList.toggle('ready', ready);
                el.classList.toggle('not-ready', !ready);
                
                // Update the status text
                const statusSpan = el.querySelector('.player-status');
                if (statusSpan) {
                    statusSpan.textContent = ready ? '✅ Ready' : '⏳ Not Ready';
                }
            }
        });
        
        // Re-render the entire players list to ensure consistency
        if (this.room && this.room.state) {
            this.updatePlayersList(this.room.state.players);
        }
    }

    updateConnectionStatus(connected) {
        const indicator = this.connectionStatus.querySelector('.status-indicator');
        const text = this.connectionStatus.querySelector('.status-text');
        
        if (connected) {
            indicator.classList.remove('offline');
            indicator.classList.add('online');
            text.textContent = 'Connected';
        } else {
            indicator.classList.remove('online');
            indicator.classList.add('offline');
            text.textContent = 'Disconnected';
        }
    }

    // ==================================
    // Game Functions
    // ==================================

    checkAllPlayersReady(players) {
        if (!players) return;
        
        const playerList = Object.values(players);
        const allReady = playerList.every(p => p.ready);
        const bothPlayers = playerList.length === 2;
        
        console.log('Checking ready status:', {
            totalPlayers: playerList.length,
            allReady: allReady,
            bothPlayers: bothPlayers,
            players: playerList.map(p => ({ id: p.id, ready: p.ready }))
        });
        
        if (allReady && bothPlayers) {
            console.log('✅ Both players ready! Game should start...');
            // Server will handle starting the game
            this.showNotification('Both players ready! Starting game...');
        }
    }

    toggleReady() {
        if (this.room) {
            console.log('Sending ready status to server');
            this.room.send({ type: 'setReady' });
        }
    }

    startMultiplayerGame(data) {
        console.log('========================================');
        console.log('🎮 STARTING COMPETITIVE MULTIPLAYER GAME');
        console.log('========================================');
        console.log('Game data:', data);
        
        // Enable multiplayer mode in the game
        if (this.game && typeof this.game.enableMultiplayer === 'function') {
            this.game.enableMultiplayer();
            this.game.isMultiplayer = true;
            this.game.isCompetitive = true; // Set competitive mode
            console.log('✅ Multiplayer and competitive modes enabled');
        } else {
            console.warn('Game or enableMultiplayer method not available');
        }
        
        // Hide multiplayer menu
        this.hideMultiplayerMenu();
        
        // Hide lobby overlay
        const overlay = document.getElementById('lobbyOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        
        // Store opponent ID for competitive play
        if (this.room) {
            this.opponentId = Object.keys(this.room.state.players).find(id => id !== this.room.sessionId);
            console.log('Opponent ID:', this.opponentId);
        }
        
        // Start the actual game
        let gameStarted = false;
        
        if (this.game && typeof this.game.start === 'function') {
            this.game.start();
            gameStarted = true;
            console.log('✅ Game started via this.game.start()');
        } else if (window.game && typeof window.game.start === 'function') {
            window.game.start();
            gameStarted = true;
            console.log('✅ Game started via window.game.start()');
        }
        
        if (!gameStarted) {
            console.log('⚠️ Game start method not found - you may need to start manually');
        }
        
        console.log('========================================');
        console.log('🎮 COMPETITIVE MULTIPLAYER GAME ACTIVE!');
        console.log('========================================');
        
        this.showNotification('🎮 Competitive game started! Beat your opponent!');
    }

    sendScoreUpdate(score, combo, health) {
        if (this.room) {
            console.log(`Sending score update: ${score} (combo: ${combo}, health: ${health})`);
            this.room.send({ 
                type: 'updateScore',
                score: score,
                combo: combo,
                health: health
            });
        }
    }

    sendGameFinished(finalScore) {
        if (this.room) {
            this.room.send({ 
                type: 'gameFinished',
                finalScore: finalScore
            });
        }
    }

    updateOpponentScore(data) {
        // Update opponent's score in the UI
        const isOpponent = data.playerId !== this.room.sessionId;
        
        if (isOpponent) {
            console.log(`📊 Opponent score update: ${data.score} (combo: ${data.combo}, health: ${data.health})`);
            
            // Create or update opponent score display
            let scoreDisplay = document.getElementById('opponentScoreDisplay');
            if (!scoreDisplay) {
                scoreDisplay = document.createElement('div');
                scoreDisplay.id = 'opponentScoreDisplay';
                scoreDisplay.style.cssText = `
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    background: rgba(0, 0, 0, 0.8);
                    color: #ff4444;
                    padding: 15px;
                    border-radius: 10px;
                    font-size: 16px;
                    font-weight: bold;
                    z-index: 1000;
                    border: 2px solid #ff4444;
                `;
                document.body.appendChild(scoreDisplay);
            }
            
            scoreDisplay.innerHTML = `
                <div>👥 OPPONENT</div>
                <div>Score: ${data.score}</div>
                <div>Combo: ${data.combo}x</div>
                <div>Health: ${data.health}%</div>
            `;
        }
    }

    showGameResults(data) {
        const winner = data.winner;
        const scores = data.finalScores;
        const youWon = winner === this.room.sessionId;
        
        console.log('========================================');
        console.log('🏆 GAME RESULTS');
        console.log('========================================');
        console.log('Winner:', winner);
        console.log('Final scores:', scores);
        console.log('You won:', youWon);
        console.log('========================================');
        
        // Create results overlay
        const resultsOverlay = document.createElement('div');
        resultsOverlay.id = 'gameResultsOverlay';
        resultsOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
        `;
        
        const winnerText = youWon ? '🎉 YOU WIN! 🎉' : '😢 YOU LOSE 😢';
        const winnerColor = youWon ? '#4CAF50' : '#f44336';
        const winnerEmoji = youWon ? '🏆' : '💔';
        
        let scoresHTML = '';
        Object.entries(scores).forEach(([playerId, score]) => {
            const playerName = playerId === this.room.sessionId ? '👤 You' : '👥 Opponent';
            const isWinner = playerId === winner;
            scoresHTML += `
                <div style="
                    padding: 15px;
                    margin: 10px 0;
                    background: ${isWinner ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
                    border-radius: 10px;
                    border: ${isWinner ? '3px solid #4CAF50' : '1px solid rgba(255,255,255,0.3)'};
                    text-align: center;
                ">
                    <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">${playerName}</div>
                    <div style="font-size: 36px; font-weight: bold; color: ${isWinner ? '#4CAF50' : '#fff'};">${score}</div>
                    ${isWinner ? '<div style="color: #4CAF50; margin-top: 5px;">🏆 WINNER</div>' : ''}
                </div>
            `;
        });
        
        resultsOverlay.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                padding: 40px;
                border-radius: 20px;
                text-align: center;
                max-width: 500px;
                width: 90%;
                border: 3px solid ${winnerColor};
                box-shadow: 0 0 50px ${winnerColor}40;
            ">
                <h1 style="
                    font-size: 48px;
                    margin: 0 0 20px 0;
                    color: ${winnerColor};
                    text-shadow: 0 0 20px ${winnerColor}80;
                ">
                    ${winnerEmoji} ${winnerText}
                </h1>
                
                <div style="margin: 30px 0;">
                    <h2 style="color: #fff; margin-bottom: 20px;">Final Scores</h2>
                    ${scoresHTML}
                </div>
                
                <button id="playAgainBtn" style="
                    padding: 15px 40px;
                    font-size: 20px;
                    font-weight: bold;
                    color: #fff;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    margin: 10px;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    🔄 Play Again
                </button>
                
                <button id="backToMenuBtn" style="
                    padding: 15px 40px;
                    font-size: 20px;
                    font-weight: bold;
                    color: #fff;
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    margin: 10px;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    🏠 Back to Menu
                </button>
            </div>
        `;
        
        document.body.appendChild(resultsOverlay);
        
        // Remove opponent score display
        const opponentScoreDisplay = document.getElementById('opponentScoreDisplay');
        if (opponentScoreDisplay) {
            opponentScoreDisplay.remove();
        }
        
        // Add event listeners
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            location.reload();
        });
        
        document.getElementById('backToMenuBtn').addEventListener('click', () => {
            this.leaveRoom();
            location.reload();
        });
        
        // Also leave the room on server
        this.leaveRoom();
    }

    // ==================================
    // Utility Functions
    // ==================================

   async connectToServer() {
    if (!this.client) {
        // ────────────────────────────────────────────────
        // Modern & reliable way for ngrok + Colyseus (2026 style)
        // ────────────────────────────────────────────────
        const isSecure = window.location.protocol === 'https://filtratable-lophodont-temeka.ngrok-free.dev';
        const wsProtocol = isSecure ? 'wss://' : 'ws://';

        // Use current host → for ngrok free it automatically uses port 443 (no :2567 needed!)
        const host = window.location.host;  // ← this includes domain + port if present

        const serverUrl = wsProtocol + host;

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Current page URL:     ', window.location.href);
        console.log('Colyseus target URL:  ', serverUrl);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        try {
            this.client = new Colyseus.Client(serverUrl);

            // Quick connection test
            const rooms = await this.client.getAvailableRooms('rhythm_game');
            console.log('Connection test successful — found', rooms.length, 'rooms');

            console.log('✅ Connected to Colyseus server!');
            this.updateConnectionStatus(true);
            this.showNotification('Connected to multiplayer server!');

        } catch (error) {
            console.error('❌ Colyseus connection failed:', error);
            console.error('Error message:', error.message);
            this.updateConnectionStatus(false);
            this.showError(
                'Cannot connect to server.\n' +
                'Make sure:\n' +
                '1. Your Colyseus server is running locally\n' +
                '2. ngrok http 2567 is active\n' +
                '3. You opened the page via the **https://** ngrok URL\n' +
                '4. No firewall/adblock is blocking websocket'
            );
        }
    } else {
        console.log('Already connected to Colyseus');
        this.updateConnectionStatus(true);
    }
}
    leaveRoom() {
        console.log('Leaving room...');
        
        if (this.room) {
            this.room.leave();
            this.room = null;
            this.lobbyCode = null;
            this.isHost = false;
            this.opponentId = null;
            
            // Reset UI
            if (this.currentRoomInfo) {
                this.currentRoomInfo.style.display = 'none';
            }
            
            // Hide overlay
            const overlay = document.getElementById('lobbyOverlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
            
            // Remove opponent score display
            const opponentScoreDisplay = document.getElementById('opponentScoreDisplay');
            if (opponentScoreDisplay) {
                opponentScoreDisplay.remove();
            }
            
            // Remove results overlay if it exists
            const resultsOverlay = document.getElementById('gameResultsOverlay');
            if (resultsOverlay) {
                resultsOverlay.remove();
            }
            
            document.querySelectorAll('.lobby-section').forEach(section => {
                section.style.display = 'block';
            });
            
            if (this.game && typeof this.game.disableMultiplayer === 'function') {
                this.game.disableMultiplayer();
            }
            
            this.updateConnectionStatus(false);
            
            console.log('Room left successfully');
        }
    }

    handleRoomLeave() {
        console.log('Room left');
        this.leaveRoom();
        this.showNotification('You left the room');
    }

    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    async showMultiplayerMenu() {
        this.multiplayerMenu.style.display = 'block';
        
        // Try to connect to server and update connection status
        try {
            await this.connectToServer();
            this.getAvailableLobbies();
        } catch (error) {
            console.error('Error connecting to server:', error);
            this.showError('Could not connect to multiplayer server. Please try again later.');
        }
    }

    hideMultiplayerMenu() {
        this.multiplayerMenu.style.display = 'none';
    }

    showError(message) {
        alert('Error: ' + message);
        console.error(message);
    }

    showNotification(message) {
        console.log('Notification:', message);
        // You can implement a toast notification here
    }
}

// Make MultiplayerManager available globally
window.MultiplayerManager = MultiplayerManager;
