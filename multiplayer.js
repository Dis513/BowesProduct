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
        console.log('Creating multiplayer UI...');
        
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
            if (gameContainer) {
                gameContainer.insertAdjacentHTML('beforebegin', menuHTML);
                console.log('Multiplayer menu HTML inserted');
            } else {
                console.error('Game container not found!');
                return;
            }
            
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
            console.log('Lobby overlay HTML inserted');
            
            // Cache UI elements
            this.multiplayerMenu = document.getElementById('multiplayerMenu');
            this.lobbyList = document.getElementById('lobbyList');
            this.connectionStatus = document.getElementById('connectionStatus');
            this.privateCodeSection = document.getElementById('privateCodeSection');
            this.currentRoomInfo = document.getElementById('currentRoomInfo');
            
            console.log('Setting up multiplayer event listeners...');
            this.setupMultiplayerEventListeners();
            console.log('Multiplayer UI created successfully');
        } else {
            console.log('Multiplayer menu already exists, skipping creation');
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

        // Create room button - prevent default behavior and stop propagation
        document.getElementById('createRoomBtn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Create Room button clicked');
            this.createRoom();
        });

        // Join room button - prevent default behavior and stop propagation
        document.getElementById('joinRoomBtn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Join Room button clicked');
            const code = document.getElementById('joinCodeInput').value.trim().toUpperCase();
            if (code) {
                this.joinRoom(code);
            } else {
                this.showError('Please enter a room code');
            }
        });

        // Refresh lobbies button - prevent default behavior and stop propagation
        document.getElementById('refreshLobbiesBtn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Refresh Lobbies button clicked');
            this.getAvailableLobbies();
        });

        // Ready button - prevent default behavior and stop propagation
        document.getElementById('readyBtn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleReady();
        });

        // Leave room button - prevent default behavior and stop propagation
        document.getElementById('leaveRoomBtn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Leave Room button clicked');
            this.leaveRoom();
        });

        // Close multiplayer menu - prevent default behavior and stop propagation
        document.getElementById('closeMultiplayer').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Close Multiplayer button clicked');
            this.hideMultiplayerMenu();
        });

        // Close overlay button - prevent default behavior and stop propagation
        document.getElementById('closeOverlay').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Close Overlay button clicked');
            document.getElementById('lobbyOverlay').style.display = 'none';
        });
    }

    // ==================================
    // Room Management
    // ==================================

    async createRoom() {
        try {
            const activeTypeBtn = document.querySelector('.room-type-btn.active');
            if (!activeTypeBtn) {
                throw new Error('No room type selected');
            }
            
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

            // Connect to server first
            await this.connectToServer();
            
            // Check if client is properly initialized
            if (!this.client) {
                throw new Error('Failed to initialize client connection');
            }
            
            // Join/create the room with explicit error handling
            try {
                this.room = await this.client.joinOrCreate('rhythm_game', {
                    roomCode: roomCode,
                    roomType: roomType,
                    isHost: true
                });
            } catch (joinError) {
                console.error('Join/create error:', joinError);
                throw new Error(joinError.message || 'Failed to create room');
            }

            // Verify room was created
            if (!this.room) {
                throw new Error('Room creation returned null');
            }

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
            const errorMsg = error.message || 'Unknown error occurred';
            this.showError('Failed to create room: ' + errorMsg);
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

            // Verify client is initialized
            if (!this.client) {
                throw new Error('Client not initialized');
            }

            // Get all available rooms with explicit error handling
            let rooms;
            try {
                rooms = await this.client.getAvailableRooms('rhythm_game');
            } catch (fetchError) {
                console.error('Fetch rooms error:', fetchError);
                throw new Error(fetchError.message || 'Failed to fetch rooms');
            }
            
            console.log('Available rooms:', rooms);
            
            // Handle null or undefined response
            if (!rooms) {
                console.log('No rooms available (null response)');
                rooms = [];
            }
            
            this.displayLobbies(rooms);

        } catch (error) {
            console.error('Error fetching lobbies:', error);
            const errorMsg = error.message || 'Unknown error occurred';
            this.showError('Failed to fetch available lobbies: ' + errorMsg);
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
        if (!this.room) {
            console.error('Cannot setup listeners - no room');
            return;
        }

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
            // Update ready status in the player list
            this.updateReadyStatus(data.playerId, true);
        });

        this.room.onMessage('roomReady', (data) => {
            console.log('Room ready:', data);
            this.updatePlayerCount(data.playerCount);
            
            // Enable ready button when room is ready
            const readyBtn = document.getElementById('readyBtn');
            if (readyBtn) {
                readyBtn.disabled = false;
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
    }

    // ==================================
    // UI Updates
    // ==================================

    showRoomInfo(code, type) {
        try {
            const currentRoomCodeEl = document.getElementById('currentRoomCode');
            const roomTypeEl = document.getElementById('roomType');
            const overlay = document.getElementById('lobbyOverlay');
            const overlayRoomCodeEl = document.getElementById('overlayRoomCode');
            
            if (currentRoomCodeEl) {
                currentRoomCodeEl.textContent = code;
            }
            if (roomTypeEl) {
                roomTypeEl.textContent = type === 'public' ? 'Public' : 'Private';
            }
            if (this.currentRoomInfo) {
                this.currentRoomInfo.style.display = 'block';
            }
            
            // Update and show overlay
            if (overlayRoomCodeEl) {
                overlayRoomCodeEl.textContent = code;
            }
            if (overlay) {
                overlay.style.display = 'block';
            }
            
            // Hide create/join sections when in a room
            document.querySelectorAll('.lobby-section').forEach(section => {
                if (!section.querySelector('#currentRoomInfo')) {
                    section.style.display = 'none';
                }
            });
        } catch (error) {
            console.error('Error showing room info:', error);
        }
    }

    updateRoomInfo(state) {
        try {
            if (state && state.players) {
                const playerCount = Object.keys(state.players).length;
                this.updatePlayerCount(playerCount);
                this.updatePlayersList(state.players);
            }
        } catch (error) {
            console.error('Error updating room info:', error);
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
        try {
            const playersList = document.getElementById('lobbyPlayers');
            if (!playersList) {
                console.error('Players list element not found');
                return;
            }
            
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
        } catch (error) {
            console.error('Error updating players list:', error);
        }
    }

    updateReadyStatus(playerId, ready) {
        try {
            // Update UI to reflect ready status
            const playerElements = document.querySelectorAll('.lobby-player');
            playerElements.forEach(el => {
                const playerNameEl = el.querySelector('.player-name');
                if (playerNameEl && playerNameEl.textContent === playerId) {
                    el.classList.toggle('ready', ready);
                    el.classList.toggle('not-ready', !ready);
                    
                    // Update the status text
                    const statusEl = el.querySelector('.player-status');
                    if (statusEl) {
                        statusEl.textContent = ready ? '✅ Ready' : '⏳ Not Ready';
                    }
                }
            });
        } catch (error) {
            console.error('Error updating ready status:', error);
        }
    }

    updateConnectionStatus(connected) {
        try {
            if (!this.connectionStatus) {
                console.error('Connection status element not found');
                return;
            }
            
            const indicator = this.connectionStatus.querySelector('.status-indicator');
            const text = this.connectionStatus.querySelector('.status-text');
            
            if (indicator && text) {
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
        } catch (error) {
            console.error('Error updating connection status:', error);
        }
    }

    // ==================================
    // Game Functions
    // ==================================

    toggleReady() {
        try {
            if (this.room) {
                console.log('Sending ready status...');
                this.room.send({ type: 'setReady' });
                console.log('Ready status sent successfully');
            } else {
                console.error('No room available to send ready status');
                this.showError('Not connected to a room');
            }
        } catch (error) {
            console.error('Error sending ready status:', error);
            this.showError('Failed to set ready status: ' + (error.message || 'Unknown error'));
        }
    }

    startMultiplayerGame(data) {
        try {
            console.log('Starting multiplayer game with data:', data);
            
            // Verify game instance exists
            if (!this.game) {
                console.error('Game instance not available');
                this.showError('Game not initialized');
                return;
            }
            
            // Enable multiplayer mode in the game
            if (typeof this.game.enableMultiplayer === 'function') {
                this.game.enableMultiplayer();
            } else {
                console.warn('enableMultiplayer method not found on game instance');
            }
            
            this.game.isMultiplayer = true;
            
            // Hide multiplayer menu
            this.hideMultiplayerMenu();
            
            // Hide overlay
            const overlay = document.getElementById('lobbyOverlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
            
            // Start the game
            console.log('Multiplayer game started!');
        } catch (error) {
            console.error('Error starting multiplayer game:', error);
            this.showError('Failed to start game: ' + (error.message || 'Unknown error'));
        }
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
            // Use the current page's protocol (http->ws, https->wss)
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.hostname;
            const port = window.location.port ? `:${window.location.port}` : '';
            
            // Construct server URL based on current environment
            let serverUrl;
            if (host === 'localhost' || host === '127.0.0.1') {
                // Local development
                serverUrl = 'ws://localhost:2567';
            } else {
                // Production/remote environment - use same host with WebSocket protocol
                serverUrl = `${protocol}//${host}${port}`;
            }
            
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
        try {
            if (this.room) {
                this.room.leave();
                this.room = null;
                this.lobbyCode = null;
                this.isHost = false;
                
                // Reset UI
                if (this.currentRoomInfo) {
                    this.currentRoomInfo.style.display = 'none';
                }
                
                // Hide overlay
                const overlay = document.getElementById('lobbyOverlay');
                if (overlay) {
                    overlay.style.display = 'none';
                }
                
                document.querySelectorAll('.lobby-section').forEach(section => {
                    section.style.display = 'block';
                });
                
                if (this.game && typeof this.game.disableMultiplayer === 'function') {
                    this.game.disableMultiplayer();
                }
                this.updateConnectionStatus(false);
            }
        } catch (error) {
            console.error('Error leaving room:', error);
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

    async async showMultiplayerMenu() {
        if (this.multiplayerMenu) {
            this.multiplayerMenu.style.display = 'block';
        }
        
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
        if (this.multiplayerMenu) {
            this.multiplayerMenu.style.display = 'none';
        }
    }

    showError(message) {
        console.error('Error:', message);
        
        // Try to use a custom error notification instead of alert
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.textContent = 'Error: ' + message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(errorDiv);
        
        // Remove after 5 seconds
        setTimeout(() => {
            errorDiv.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 300);
        }, 5000);
    }

    showNotification(message) {
        console.log('Notification:', message);
        // You can implement a toast notification here
    }
}

// Make MultiplayerManager available globally
window.MultiplayerManager = MultiplayerManager;
