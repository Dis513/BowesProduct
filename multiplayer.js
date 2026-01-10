async joinRoom(code, type = 'private') {
    if (!code) {
        this.showError('Please enter a room code');
        return;
    }

    try {
        console.log('Joining by code:', code, 'Type:', type);

        await this.connectToServer();

        // Use joinOrCreate with filter on your custom roomCode
        this.room = await this.client.joinOrCreate('rhythm_game', {
            roomCode: code.toUpperCase(),  // ← filter by this
            roomType: type,
            isHost: false
        });

        this.setupRoomListeners();
        this.lobbyCode = code;
        this.isHost = false;

        console.log('Joined successfully by code:', code);

        const displayCode = type === 'public' ? 'Public Lobby' : code;
        this.showRoomInfo(displayCode, type);
        this.updateConnectionStatus(true);
    } catch (error) {
        console.error('Join by code failed:', error);
        this.showError('Cannot join – code invalid, room full, or not public/private as expected.');
        this.updateConnectionStatus(false);
    }
}// ==================================
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

async joinRoom(code, type = 'private') {
    if (!code) {
        this.showError('Please enter a room code');
        return;
    }

    try {
        console.log('Joining by code:', code, 'Type:', type);

        await this.connectToServer();

        // Use joinOrCreate with filter on your custom roomCode
        this.room = await this.client.joinOrCreate('rhythm_game', {
            roomCode: code.toUpperCase(),  // ← filter by this
            roomType: type,
            isHost: false
        });

        this.setupRoomListeners();
        this.lobbyCode = code;
        this.isHost = false;

        console.log('Joined successfully by code:', code);

        const displayCode = type === 'public' ? 'Public Lobby' : code;
        this.showRoomInfo(displayCode, type);
        this.updateConnectionStatus(true);
    } catch (error) {
        console.error('Join by code failed:', error);
        this.showError('Cannot join – code invalid, room full, or not public/private as expected.');
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

        rooms.forEach(room => {
            const roomData = room.metadata || {};
            const roomCode = roomData.roomCode || 'Unknown';
            const roomType = roomData.roomType || 'public';
            const playerCount = room.clients;
            const maxPlayers = room.maxClients || 2;

            // Only show public lobbies or lobbies that aren't full
            if (roomType === 'public' || playerCount < maxPlayers) {
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
        this.room.onStateChange((state) => {
            console.log('Room state changed:', state);
            this.updateRoomInfo(state);
        });

        this.room.onMessage('playerJoined', (data) => {
            console.log('Player joined:', data);
            this.showNotification(`Player ${data.playerId} joined!`);
            this.updatePlayerCount(data.playerCount);
        });

        this.room.onMessage('playerLeft', (data) => {
            console.log('Player left:', data);
            this.showNotification(`Player ${data.playerId} left`);
            this.updatePlayerCount();
        });

        this.room.onMessage('playerReady', (data) => {
            console.log('Player ready:', data);
            this.updateReadyStatus(data.playerId, true);
        });

        this.room.onMessage('roomReady', (data) => {
            console.log('Room ready:', data);
            this.updatePlayerCount(data.playerCount);
            document.getElementById('readyBtn').disabled = false;
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

        Object.values(players).forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = `lobby-player ${player.ready ? 'ready' : 'not-ready'}`;
            playerDiv.innerHTML = `
                <span class="player-name">${player.id}</span>
                <span class="player-status">${player.ready ? '✅ Ready' : '⏳ Not Ready'}</span>
            `;
            playersList.appendChild(playerDiv);
        });
    }

    updateReadyStatus(playerId, ready) {
        // Update UI to reflect ready status
        const playerElements = document.querySelectorAll('.lobby-player');
        playerElements.forEach(el => {
            if (el.textContent.includes(playerId)) {
                el.classList.toggle('ready', ready);
                el.classList.toggle('not-ready', !ready);
            }
        });
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

    toggleReady() {
        if (this.room) {
            this.room.send({ type: 'setReady' });
        }
    }

    startMultiplayerGame(data) {
        console.log('Starting multiplayer game with data:', data);
        
        // Enable multiplayer mode in the game
        this.game.enableMultiplayer();
        this.game.isMultiplayer = true;
        
        // Hide multiplayer menu
        this.hideMultiplayerMenu();
        
        // Start the game
        // You'll need to implement this in your game.js
        console.log('Multiplayer game started!');
    }

    sendScoreUpdate(score, combo, health) {
        if (this.room) {
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
        console.log('Opponent score:', data.score);
        // You can add UI elements to show opponent's progress
    }

    showGameResults(data) {
        const winner = data.winner;
        const scores = data.finalScores;
        
        let resultHTML = `
            <div class="game-results">
                <h2>Game Over!</h2>
                <p class="winner">Winner: ${winner === this.room.sessionId ? 'You! 🎉' : 'Opponent'}</p>
                <div class="final-scores">
        `;
        
        Object.entries(scores).forEach(([playerId, score]) => {
            const playerName = playerId === this.room.sessionId ? 'You' : 'Opponent';
            resultHTML += `<p>${playerName}: ${score}</p>`;
        });
        
        resultHTML += `
                </div>
                <button class="menu-button" onclick="location.reload()">Play Again</button>
            </div>
        `;
        
        // Show results modal
        alert(`Game Over! Winner: ${winner === this.room.sessionId ? 'You!' : 'Opponent'}`);
        this.leaveRoom();
    }

    // ==================================
    // Utility Functions
    // ==================================

    async connectToServer() {
        if (!this.client) {
            // Connect to Colyseus server
            // Use the current page's host for the WebSocket connection
            const protocol = window.location.protocol === 'https://filtratable-lophodont-temeka.ngrok-free.dev';
            const host = window.location.hostname;
            const port = window.location.port ? `:${window.location.port}` : '';
            const serverUrl = `${protocol}//${host}${port}`;
            
            console.log('Connecting to server:', serverUrl);
            
            try {
                this.client = new Colyseus.Client(serverUrl);
                
                // Test connection by getting available rooms
                await this.client.getAvailableRooms('rhythm_game');
                
                console.log('Successfully connected to server:', serverUrl);
                this.updateConnectionStatus(true);
            } catch (error) {
                console.error('Failed to connect to server:', error);
                // Fallback to localhost for development
                console.log('Trying fallback to localhost:2567');
                this.client = new Colyseus.Client('ws://localhost:2567');
                this.updateConnectionStatus(true);
            }
        } else {
            // Verify connection is still active
            this.updateConnectionStatus(true);
        }
    }

    leaveRoom() {
        if (this.room) {
            this.room.leave();
            this.room = null;
            this.lobbyCode = null;
            this.isHost = false;
            
            // Reset UI
            this.currentRoomInfo.style.display = 'none';
            
            // Hide overlay
            document.getElementById('lobbyOverlay').style.display = 'none';
            
            document.querySelectorAll('.lobby-section').forEach(section => {
                section.style.display = 'block';
            });
            
            this.game.disableMultiplayer();
            this.updateConnectionStatus(false);
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
