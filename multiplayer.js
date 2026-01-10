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
            // Populate level selector
            this.populateLevelSelector();
            
            const menuHTML = `
                <div class="pause-menu" id="multiplayerMenu" style="display: none;">
                    <h2 class="pause-title">👥 MULTIPLAYER</h2>
                    
                    <!-- Connection Status -->
                    <div class="connection-status" id="connectionStatus">
                        <span class="status-indicator offline"></span>
                        <span class="status-text">Disconnected</span>
                    </div>
                    
                    <!-- Level Selection -->
                    <div class="lobby-section">
                        <h3>Select Level</h3>
                        <div class="level-selector-container">
                            <select id="multiplayerLevelSelect" class="room-code-input">
                                <option value="">Choose a level...</option>
                            </select>
                            <p class="code-hint">Select a level before creating or joining a room</p>
                        </div>
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

        // Create room button - Enhanced with touch support
        const createRoomBtn = document.getElementById('createRoomBtn');
        createRoomBtn.addEventListener('click', () => {
            this.createRoom();
        });
        createRoomBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.createRoom();
        }, { passive: false });

        // Join room button - Enhanced with touch support
        const joinRoomBtn = document.getElementById('joinRoomBtn');
        joinRoomBtn.addEventListener('click', () => {
            const code = document.getElementById('joinCodeInput').value.trim().toUpperCase();
            if (code) {
                this.joinRoom(code);
            } else {
                this.showError('Please enter a room code');
            }
        });
        joinRoomBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const code = document.getElementById('joinCodeInput').value.trim().toUpperCase();
            if (code) {
                this.joinRoom(code);
            } else {
                this.showError('Please enter a room code');
            }
        }, { passive: false });

        // Refresh lobbies button - Enhanced with touch support
        const refreshLobbiesBtn = document.getElementById('refreshLobbiesBtn');
        refreshLobbiesBtn.addEventListener('click', () => {
            this.getAvailableLobbies();
        });
        refreshLobbiesBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.getAvailableLobbies();
        }, { passive: false });

        // Ready button - Enhanced with touch support
        const readyBtn = document.getElementById('readyBtn');
        readyBtn.addEventListener('click', () => {
            this.toggleReady();
        });
        readyBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.toggleReady();
        }, { passive: false });

        // Leave room button - Enhanced with touch support
        const leaveRoomBtn = document.getElementById('leaveRoomBtn');
        leaveRoomBtn.addEventListener('click', () => {
            this.leaveRoom();
        });
        leaveRoomBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.leaveRoom();
        }, { passive: false });

        // Close multiplayer menu - Enhanced with touch support
        const closeMultiplayerBtn = document.getElementById('closeMultiplayer');
        closeMultiplayerBtn.addEventListener('click', () => {
            this.hideMultiplayerMenu();
        });
        closeMultiplayerBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.hideMultiplayerMenu();
        }, { passive: false });
    }

    // ==================================
    // Level Selection
    // ==================================

    populateLevelSelector() {
        const levelSelect = document.getElementById('multiplayerLevelSelect');
        if (!levelSelect) return;
        
        levelSelect.innerHTML = '<option value="">Choose a level...</option>';
        
        for (let i = 1; i <= 50; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Level ${i}`;
            
            // Add difficulty class based on level
            if (i <= 10) {
                option.classList.add('easy');
            } else if (i <= 20) {
                option.classList.add('medium');
            } else if (i <= 35) {
                option.classList.add('hard');
            } else if (i <= 45) {
                option.classList.add('expert');
            } else {
                option.classList.add('master');
            }
            
            levelSelect.appendChild(option);
        }
    }

    getSelectedLevel() {
        const levelSelect = document.getElementById('multiplayerLevelSelect');
        if (!levelSelect) return 1;
        
        const level = parseInt(levelSelect.value);
        return level || 1;
    }

    // ==================================
    // Room Management
    // ==================================

    async createRoom() {
        try {
            // Check if level is selected
            const selectedLevel = this.getSelectedLevel();
            if (!selectedLevel) {
                this.showError('Please select a level before creating a room');
                return;
            }

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

            console.log(`Creating ${roomType} room with code: ${roomCode} for level: ${selectedLevel}`);

            // Connect to server and create room
            await this.connectToServer();
            
            console.log('Attempting to create room with options:', {
                roomCode: roomCode,
                roomType: roomType,
                isHost: true,
                level: selectedLevel
            });
            
            // Join/create the room with level info
            this.room = await this.client.joinOrCreate('rhythm_game', {
                roomCode: roomCode,
                roomType: roomType,
                isHost: true,
                level: selectedLevel
            });

            console.log('Room created successfully:', this.room.roomId);
            
            this.setupRoomListeners();
            this.lobbyCode = roomCode;
            this.isHost = true;
            this.selectedLevel = selectedLevel;

            // For public rooms, don't show the code
            const displayCode = roomType === 'private' ? roomCode : 'Public Lobby';
            this.showRoomInfo(displayCode, roomType, selectedLevel);
            this.updateConnectionStatus(true);

        } catch (error) {
            console.error('Error creating room:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                name: error.name
            });
            
            let errorMessage = 'Failed to create room';
            if (error.message) {
                errorMessage += ': ' + error.message;
            }
            if (error.code === 4210) {
                errorMessage = 'Room already exists with this code';
            }
            
            this.showError(errorMessage);
            this.updateConnectionStatus(false);
        }
    }

    async joinRoom(roomId, code, type = 'private') {
        try {
            // Check if level is selected
            const selectedLevel = this.getSelectedLevel();
            if (!selectedLevel) {
                this.showError('Please select a level before joining a room');
                return;
            }

            console.log('Joining room:', roomId, 'Code:', code, 'Type:', type, 'Level:', selectedLevel);

            await this.connectToServer();
            
            // Try to join the room by ID (not roomCode) with level info
            this.room = await this.client.joinById(roomId, {
                roomCode: code,
                isHost: false,
                level: selectedLevel
            });

            this.setupRoomListeners();
            this.lobbyCode = code;
            this.isHost = false;
            this.selectedLevel = selectedLevel;

            console.log('Joined room successfully:', roomId);
            
            // Display appropriate room info based on type
            const displayCode = type === 'public' ? 'Public Lobby' : code;
            this.showRoomInfo(displayCode, type, selectedLevel);
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

        // Make sure WebSocket client is connected
        if (!this.client || this.client.disconnected) {
            console.log('No client found or disconnected, connecting to server...');
            await this.connectToServer();
        }

        // Request rooms from server and wait for response
        const rooms = await new Promise((resolve, reject) => {
            // Timeout in case server doesn't respond
            const timeout = setTimeout(() => {
                reject(new Error('Server did not respond with rooms in time'));
            }, 5000);

            // Handler for rooms response
            const handler = (roomsData) => {
                clearTimeout(timeout);
                this.client.off('roomsList', handler); // remove listener after first response

                if (!Array.isArray(roomsData)) {
                    reject(new Error('Invalid rooms data received from server'));
                } else {
                    resolve(roomsData);
                }
            };

            this.client.on('roomsList', handler);

            // Emit request to server
            this.client.emit('getRooms', 'rhythm_game');
        });

        console.log('Available rooms:', rooms);
        console.log('Number of rooms:', rooms.length);

        // Pass rooms to display function
        this.displayLobbies(rooms);

        } catch (error) {
            console.error('Error fetching lobbies:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                name: error.name
            });
            this.showError('Failed to fetch available lobbies: ' + error.message);
        }
    }

displayLobbies(rooms) {
    this.lobbyList.innerHTML = '';

    if (!Array.isArray(rooms) || rooms.length === 0) {
        this.lobbyList.innerHTML = `
            <div class="no-lobbies">No lobbies available. Create one!</div>
        `;
        return;
    }

    rooms.forEach(room => {
        const roomData = room.metadata || {};
        const roomCode = roomData.roomCode || 'Unknown';
        const roomType = roomData.roomType || 'public';
        const playerCount = room.clients || 0;
        const maxPlayers = room.maxClients || 2;
        const roomLevel = roomData.level || 1;

        // Only show public lobbies or lobbies that aren't full
        if (roomType === 'public' || playerCount < maxPlayers) {
            const lobbyItem = document.createElement('div');
            lobbyItem.className = 'lobby-item';

            const lobbyName = roomType === 'public' ? '🌍 Public Lobby' : '🔒 ' + roomCode;

            // Determine level color
            let levelColor = '#39FF14'; // Easy (green)
            if (roomLevel > 10 && roomLevel <= 20) levelColor = '#FFFF00'; // Medium
            else if (roomLevel > 20 && roomLevel <= 35) levelColor = '#FFA500'; // Hard
            else if (roomLevel > 35 && roomLevel <= 45) levelColor = '#FF0000'; // Expert
            else if (roomLevel > 45) levelColor = '#FF1493'; // Master

            lobbyItem.innerHTML = `
                <div class="lobby-info">
                    <span class="lobby-code">${lobbyName}</span>
                    <span class="lobby-level" style="color: ${levelColor};">Level ${roomLevel}</span>
                    <span class="lobby-players">${playerCount}/${maxPlayers} players</span>
                </div>
                <button class="join-lobby-btn" data-roomid="${room.roomId}" data-code="${roomCode}" data-type="${roomType}" data-level="${roomLevel}">
                    Join
                </button>
            `;

            this.lobbyList.appendChild(lobbyItem);
        }
    });

    // Unified function to handle joining a room
    const joinHandler = (e) => {
        const btn = e.currentTarget;
        const roomId = btn.dataset.roomid;
        const code = btn.dataset.code;
        const type = btn.dataset.type;
        const level = btn.dataset.level;

        // Auto-select the level when joining
        const levelSelect = document.getElementById('multiplayerLevelSelect');
        if (levelSelect && level) {
            levelSelect.value = level;
        }

        this.joinRoom(roomId, code, type);
    };

    // Add click listeners to join buttons with touch support
document.querySelectorAll('.join-lobby-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const roomId = e.currentTarget.dataset.roomid;
        const code = e.currentTarget.dataset.code;
        const type = e.currentTarget.dataset.type;
        const level = e.currentTarget.dataset.level;

        // Auto-select the level when joining
        const levelSelect = document.getElementById('multiplayerLevelSelect');
        if (levelSelect && level) {
            levelSelect.value = level;
        }

        this.joinRoom(roomId, code, type);
    }); // <-- closes addEventListener

    // Touch support
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const roomId = e.currentTarget.dataset.roomid;
        const code = e.currentTarget.dataset.code;
        const type = e.currentTarget.dataset.type;
        const level = e.currentTarget.dataset.level;

        const levelSelect = document.getElementById('multiplayerLevelSelect');
        if (levelSelect && level) {
            levelSelect.value = level;
        }

        this.joinRoom(roomId, code, type);
    }, { passive: false });

}); // <-- closes forEach


        // Add click listeners to join buttons with touch support
        document.querySelectorAll('.join-lobby-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const roomId = e.target.dataset.roomid;
                const code = e.target.dataset.code;
                const type = e.target.dataset.type;
                const level = e.target.dataset.level;
                
                // Auto-select the level when joining
                const levelSelect = document.getElementById('multiplayerLevelSelect');
                if (levelSelect && level) {
                    levelSelect.value = level;
                }
                
                this.joinRoom(roomId, code, type);
            });
            
            // Add touch support for join buttons
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const roomId = e.target.dataset.roomid;
                const code = e.target.dataset.code;
                const type = e.target.dataset.type;
                const level = e.target.dataset.level;
                
                // Auto-select the level when joining
                const levelSelect = document.getElementById('multiplayerLevelSelect');
                if (levelSelect && level) {
                    levelSelect.value = level;
                }
                
                this.joinRoom(roomId, code, type);
            }, { passive: false });
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

    showRoomInfo(code, type, level = 1) {
        document.getElementById('currentRoomCode').textContent = code;
        document.getElementById('roomType').textContent = type === 'public' ? 'Public' : 'Private';
        
        // Add level display to room details
        const roomDetails = document.querySelector('.room-details');
        if (roomDetails) {
            // Check if level info already exists
            let levelInfo = roomDetails.querySelector('.room-level');
            if (!levelInfo) {
                levelInfo = document.createElement('p');
                levelInfo.className = 'room-level';
                roomDetails.appendChild(levelInfo);
            }
            levelInfo.innerHTML = `<strong>Level:</strong> ${level}`;
        }
        
        this.currentRoomInfo.style.display = 'block';
        
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
            this.room.send('setReady', {});
        }
    }

    startMultiplayerGame(data) {
        console.log('Starting multiplayer game with data:', data);
        
        // Enable multiplayer mode in the game
        this.game.enableMultiplayer();
        this.game.isMultiplayer = true;
        
        // Hide multiplayer menu
        this.hideMultiplayerMenu();
        
        // Load the selected level and start the game
        if (this.selectedLevel) {
            console.log('Loading level:', this.selectedLevel);
            this.game.selectLevel(this.selectedLevel);
        } else {
            console.error('No level selected!');
            this.showError('No level selected. Please select a level and try again.');
        }
    }

    sendScoreUpdate(score, combo, health) {
        if (this.room) {
            this.room.send('updateScore', {
                score: score,
                combo: combo,
                health: health
            });
        }
    }

    sendGameFinished(finalScore) {
        if (this.room) {
            this.room.send('gameFinished', {
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
 // ==================================
// Utility Functions
// ==================================

async connectToServer() {
    if (this.client) {
        this.updateConnectionStatus(true);
        return;
    }

    // 🔒 Explicit Colyseus WebSocket server
    const SERVER_URL = "wss://filtratable-lophodont-temeka.ngrok-free.dev";

    console.log("Connecting to server:", SERVER_URL);

    try {
        this.client = new Colyseus.Client(SERVER_URL);

        // Test connection
        await this.client.getAvailableRooms("rhythm_game");

        console.log("Successfully connected to server");
        this.updateConnectionStatus(true);
    } catch (error) {
        console.error("Failed to connect to server:", error);
        this.updateConnectionStatus(false);
        throw error;
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
        
        // Populate level selector
        this.populateLevelSelector();
        
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
