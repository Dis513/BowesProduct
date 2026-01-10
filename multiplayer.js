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
        this.selectedLevel = 1;
        
        // UI Elements
        this.multiplayerMenu = null;
        this.lobbyList = null;
        this.connectionStatus = null;
        this.privateCodeSection = null;
        this.currentRoomInfo = null;
        
        console.log('MultiplayerManager initialized');
        this.createMultiplayerUI();
    }

    // ==================================
    // UI Creation
    // ==================================
    createMultiplayerUI() {
        if (!document.getElementById('multiplayerMenu')) {
            this.populateLevelSelector();
            
            const menuHTML = `
                <div class="pause-menu" id="multiplayerMenu" style="display: none;">
                    <h2 class="pause-title">👥 MULTIPLAYER</h2>
                    
                    <div class="connection-status" id="connectionStatus">
                        <span class="status-indicator offline"></span>
                        <span class="status-text">Disconnected</span>
                    </div>
                    
                    <div class="lobby-section">
                        <h3>Select Level</h3>
                        <div class="level-selector-container">
                            <select id="multiplayerLevelSelect" class="room-code-input">
                                <option value="">Choose a level...</option>
                            </select>
                            <p class="code-hint">Select a level before creating or joining a room</p>
                        </div>
                    </div>

                    <div class="lobby-section">
                        <h3>Create Room</h3>
                        <div class="room-type-selector">
                            <button class="room-type-btn active" data-type="public">🌍 Public Lobby</button>
                            <button class="room-type-btn" data-type="private">🔒 Private Lobby</button>
                        </div>
                        <div class="private-code-section" id="privateCodeSection" style="display: none;">
                            <label for="roomCodeInput">Room Code (optional):</label>
                            <input type="text" id="roomCodeInput" class="room-code-input" 
                                   placeholder="Enter custom code or leave empty for auto-generated" 
                                   maxlength="8" pattern="[A-Z0-9]{4,8}">
                            <p class="code-hint">Enter 4-8 characters or leave empty for auto-generated code</p>
                        </div>
                        <button class="menu-button" id="createRoomBtn">🎮 Create Room</button>
                    </div>

                    <div class="lobby-section">
                        <h3>Join Room</h3>
                        <div class="join-room-inputs">
                            <input type="text" id="joinCodeInput" class="room-code-input" 
                                   placeholder="Enter room code" maxlength="8">
                            <button class="menu-button" id="joinRoomBtn">🔑 Join by Code</button>
                        </div>
                    </div>

                    <div class="lobby-section">
                        <h3>Available Lobbies</h3>
                        <button class="menu-button small" id="refreshLobbiesBtn">🔄 Refresh List</button>
                        <div class="lobby-list" id="lobbyList">
                            <div class="no-lobbies">No lobbies available. Create one!</div>
                        </div>
                    </div>

                    <div class="current-room-info" id="currentRoomInfo" style="display: none;">
                        <h3>Current Room</h3>
                        <div class="room-details">
                            <p><strong>Room Code:</strong> <span id="currentRoomCode">---</span></p>
                            <p><strong>Players:</strong> <span id="playerCount">1/2</span></p>
                            <p><strong>Room Type:</strong> <span id="roomType">---</span></p>
                        </div>
                        <div class="lobby-players" id="lobbyPlayers"></div>
                        <div class="room-actions">
                            <button class="menu-button" id="readyBtn" disabled>✅ Ready</button>
                            <button class="menu-button" id="leaveRoomBtn">🚪 Leave Room</button>
                        </div>
                    </div>

                    <div class="menu-options">
                        <button class="menu-button" id="closeMultiplayer">← Back to Menu</button>
                    </div>
                </div>
            `;
            
            const gameContainer = document.getElementById('gameContainer');
            gameContainer.insertAdjacentHTML('beforebegin', menuHTML);

            this.multiplayerMenu = document.getElementById('multiplayerMenu');
            this.lobbyList = document.getElementById('lobbyList');
            this.connectionStatus = document.getElementById('connectionStatus');
            this.privateCodeSection = document.getElementById('privateCodeSection');
            this.currentRoomInfo = document.getElementById('currentRoomInfo');

            this.setupMultiplayerEventListeners();
        }
    }

    // ==================================
    // Event Listeners
    // ==================================
    setupMultiplayerEventListeners() {
        const createRoomBtn = document.getElementById('createRoomBtn');
        const joinRoomBtn = document.getElementById('joinRoomBtn');
        const refreshLobbiesBtn = document.getElementById('refreshLobbiesBtn');
        const readyBtn = document.getElementById('readyBtn');
        const leaveRoomBtn = document.getElementById('leaveRoomBtn');
        const closeMultiplayerBtn = document.getElementById('closeMultiplayer');

        const bind = (el, fn) => {
            el.addEventListener('click', fn);
            el.addEventListener('touchstart', e => { e.preventDefault(); fn(); }, { passive: false });
        };

        bind(createRoomBtn, () => this.createRoom());
        bind(joinRoomBtn, () => {
            const code = document.getElementById('joinCodeInput').value.trim().toUpperCase();
            if (code) this.joinRoom(code);
            else this.showError('Please enter a room code');
        });
        bind(refreshLobbiesBtn, () => this.getAvailableLobbies());
        bind(readyBtn, () => this.toggleReady());
        bind(leaveRoomBtn, () => this.leaveRoom());
        bind(closeMultiplayerBtn, () => this.hideMultiplayerMenu());
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
            if (i <= 10) option.classList.add('easy');
            else if (i <= 20) option.classList.add('medium');
            else if (i <= 35) option.classList.add('hard');
            else if (i <= 45) option.classList.add('expert');
            else option.classList.add('master');
            levelSelect.appendChild(option);
        }
    }

    getSelectedLevel() {
        const levelSelect = document.getElementById('multiplayerLevelSelect');
        const level = levelSelect ? parseInt(levelSelect.value) : 1;
        return level || 1;
    }

    // ==================================
    // Room Management
    // ==================================
    async createRoom() {
        try {
            const selectedLevel = this.getSelectedLevel();
            if (!selectedLevel) return this.showError('Please select a level before creating a room');

            const activeTypeBtn = document.querySelector('.room-type-btn.active');
            const roomType = activeTypeBtn.dataset.type;
            let roomCode = roomType === 'private'
                ? (document.getElementById('roomCodeInput').value.trim().toUpperCase() || this.generateRoomCode())
                : this.generateRoomCode();

            await this.connectToServer();

            this.room = await this.client.joinOrCreate('rhythm_game', {
                roomCode, roomType, isHost: true, level: selectedLevel
            });

            this.lobbyCode = roomCode;
            this.isHost = true;
            this.selectedLevel = selectedLevel;

            const displayCode = roomType === 'private' ? roomCode : 'Public Lobby';
            this.showRoomInfo(displayCode, roomType, selectedLevel);
            this.updateConnectionStatus(true);

            this.setupRoomListeners();
            console.log('Room created successfully:', this.room.roomId);

        } catch (error) {
            console.error('Error creating room:', error);
            this.showError('Failed to create room: ' + (error.message || error));
            this.updateConnectionStatus(false);
        }
    }

    async joinRoom(roomId, code, type = 'private') {
        try {
            const selectedLevel = this.getSelectedLevel();
            if (!selectedLevel) return this.showError('Please select a level before joining a room');

            await this.connectToServer();

            this.room = await this.client.joinById(roomId, {
                roomCode: code, isHost: false, level: selectedLevel
            });

            this.lobbyCode = code;
            this.isHost = false;
            this.selectedLevel = selectedLevel;

            const displayCode = type === 'public' ? 'Public Lobby' : code;
            this.showRoomInfo(displayCode, type, selectedLevel);
            this.updateConnectionStatus(true);

            this.setupRoomListeners();
            console.log('Joined room successfully:', roomId);

        } catch (error) {
            console.error('Error joining room:', error);
            this.showError('Failed to join room. Lobby may be full or code incorrect.');
            this.updateConnectionStatus(false);
        }
    }

    async getAvailableLobbies() {
        try {
            if (!this.client) throw new Error('Not connected to server');
            const rooms = await this.client.getAvailableRooms('rhythm_game');
            console.log('Available rooms:', rooms);
            this.displayLobbies(rooms);
        } catch (error) {
            console.error('Error fetching lobbies:', error);
            this.showError('Failed to fetch available lobbies: ' + error.message);
        }
    }

    displayLobbies(rooms) {
        if (!this.lobbyList) return;
        this.lobbyList.innerHTML = '';

        if (!Array.isArray(rooms) || rooms.length === 0) {
            this.lobbyList.innerHTML = `<div class="no-lobbies">No lobbies available. Create one!</div>`;
            return;
        }

        rooms.forEach(room => {
            const data = room.metadata || {};
            const roomCode = data.roomCode || 'Unknown';
            const roomType = data.roomType || 'public';
            const playerCount = room.clients || 0;
            const maxPlayers = room.maxClients || 2;
            const level = data.level || 1;

            if (roomType === 'public' || playerCount < maxPlayers) {
                const lobbyItem = document.createElement('div');
                lobbyItem.className = 'lobby-item';

                const lobbyName = roomType === 'public' ? '🌍 Public Lobby' : '🔒 ' + roomCode;

                let levelColor = '#39FF14';
                if (level > 10 && level <= 20) levelColor = '#FFFF00';
                else if (level > 20 && level <= 35) levelColor = '#FFA500';
                else if (level > 35 && level <= 45) levelColor = '#FF0000';
                else if (level > 45) levelColor = '#FF1493';

                lobbyItem.innerHTML = `
                    <div class="lobby-info">
                        <span class="lobby-code">${lobbyName}</span>
                        <span class="lobby-level" style="color: ${levelColor};">Level ${level}</span>
                        <span class="lobby-players">${playerCount}/${maxPlayers} players</span>
                    </div>
                    <button class="join-lobby-btn" data-roomid="${room.roomId}" data-code="${roomCode}" data-type="${roomType}" data-level="${level}">
                        Join
                    </button>
                `;

                this.lobbyList.appendChild(lobbyItem);
            }
        });

        // Attach join button listeners
        this.lobbyList.querySelectorAll('.join-lobby-btn').forEach(btn => {
            const joinHandler = (e) => {
                e.preventDefault();
                const roomId = btn.dataset.roomid;
                const code = btn.dataset.code;
                const type = btn.dataset.type;
                const level = btn.dataset.level;
                const levelSelect = document.getElementById('multiplayerLevelSelect');
                if (levelSelect && level) levelSelect.value = level;
                this.joinRoom(roomId, code, type);
            };
            btn.addEventListener('click', joinHandler);
            btn.addEventListener('touchstart', joinHandler, { passive: false });
        });
    }

    // ==================================
    // Room Listeners
    // ==================================
    setupRoomListeners() {
        if (!this.room) return;

        this.room.onStateChange(state => {
            console.log('Room state changed:', state);
            this.updateRoomInfo(state);
        });

        this.room.onMessage('playerJoined', data => {
            console.log('Player joined:', data);
            this.showNotification(`Player ${data.playerId} joined!`);
            this.updatePlayerCount(data.playerCount);
        });

        this.room.onMessage('playerLeft', data => {
            console.log('Player left:', data);
            this.showNotification(`Player ${data.playerId} left`);
            this.updatePlayerCount();
        });

        this.room.onMessage('playerReady', data => this.updateReadyStatus(data.playerId, true));
        this.room.onMessage('roomReady', data => {
            this.updatePlayerCount(data.playerCount);
            document.getElementById('readyBtn').disabled = false;
        });

        this.room.onMessage('gameStarted', data => this.startMultiplayerGame(data));
        this.room.onMessage('scoreUpdate', data => this.updateOpponentScore(data));
        this.room.onMessage('gameEnded', data => this.showGameResults(data));

        this.room.onLeave(() => this.handleRoomLeave());
    }

    // ==================================
    // UI Updates
    // ==================================
    showRoomInfo(code, type, level = 1) {
        document.getElementById('currentRoomCode').textContent = code;
        document.getElementById('roomType').textContent = type === 'public' ? 'Public' : 'Private';

        const roomDetails = document.querySelector('.room-details');
        if (roomDetails) {
            let levelInfo = roomDetails.querySelector('.room-level');
            if (!levelInfo) {
                levelInfo = document.createElement('p');
                levelInfo.className = 'room-level';
                roomDetails.appendChild(levelInfo);
            }
            levelInfo.innerHTML = `<strong>Level:</strong> ${level}`;
        }

        this.currentRoomInfo.style.display = 'block';
        document.querySelectorAll('.lobby-section').forEach(section => section.style.display = 'none');
    }

    updateRoomInfo(state) {
        if (state) {
            this.updatePlayerCount(Object.keys(state.players).length);
            this.updatePlayersList(state.players);
        }
    }

    updatePlayerCount(count) {
        const el = document.getElementById('playerCount');
        if (el) el.textContent = `${count || 1}/2`;
    }

    updatePlayersList(players) {
        const playersList = document.getElementById('lobbyPlayers');
        if (!playersList) return;
        playersList.innerHTML = '';
        Object.values(players).forEach(player => {
            const div = document.createElement('div');
            div.className = `lobby-player ${player.ready ? 'ready' : 'not-ready'}`;
            div.innerHTML = `<span class="player-name">${player.id}</span> <span class="player-status">${player.ready ? '✅ Ready' : '⏳ Not Ready'}</span>`;
            playersList.appendChild(div);
        });
    }

    updateReadyStatus(playerId, ready) {
        document.querySelectorAll('.lobby-player').forEach(el => {
            if (el.textContent.includes(playerId)) {
                el.classList.toggle('ready', ready);
                el.classList.toggle('not-ready', !ready);
            }
        });
    }

    updateConnectionStatus(connected) {
        const indicator = this.connectionStatus.querySelector('.status-indicator');
        const text = this.connectionStatus.querySelector('.status-text');
        if (!indicator || !text) return;
        if (connected) {
            indicator.classList.remove('offline'); indicator.classList.add('online'); text.textContent = 'Connected';
        } else {
            indicator.classList.remove('online'); indicator.classList.add('offline'); text.textContent = 'Disconnected';
        }
    }

    // ==================================
    // Game Functions
    // ==================================
    toggleReady() { if (this.room) this.room.send('setReady', {}); }

    startMultiplayerGame(data) {
        console.log('Starting multiplayer game with data:', data);
        this.game.enableMultiplayer();
        this.game.isMultiplayer = true;
        this.hideMultiplayerMenu();
        if (this.selectedLevel) this.game.selectLevel(this.selectedLevel);
        else this.showError('No level selected. Please select a level and try again.');
    }

    sendScoreUpdate(score, combo, health) { if (this.room) this.room.send('updateScore', {score, combo, health}); }
    sendGameFinished(finalScore) { if (this.room) this.room.send('gameFinished', {finalScore}); }
    updateOpponentScore(data) { console.log('Opponent score:', data.score); }

    showGameResults(data) {
        const winner = data.winner;
        const scores = data.finalScores;
        alert(`Game Over! Winner: ${winner === this.room.sessionId ? 'You!' : 'Opponent'}`);
        this.leaveRoom();
    }

    // ==================================
    // Utility Functions
    // ==================================
    async connectToServer() {
        if (this.client) { this.updateConnectionStatus(true); return; }
        const SERVER_URL = "wss://filtratable-lophodont-temeka.ngrok-free.dev";
        console.log("Connecting to server:", SERVER_URL);

        try {
            this.client = new Colyseus.Client(SERVER_URL);
            await this.client.getAvailableRooms("rhythm_game");
            console.log("Successfully connected to server");
            this.updateConnectionStatus(true);
        } catch (error) {
            console.error("Failed to connect to server:", error);
            this.updateConnectionStatus(false);
            throw error
