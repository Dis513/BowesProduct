// ==================================
// Colyseus Multiplayer Server
// ==================================

const colyseus = require('colyseus');
const http = require('http');
const express = require('express');

// Game State Schema
class GameState extends colyseus.Room {
    constructor() {
        super();
        this.players = {};
        this.roomId = null;
        this.songId = null;
        this.gameStatus = 'waiting'; // waiting, playing, finished
        this.gameStartTime = null;
        this.scores = {};
        this.roomCode = null;
        this.roomType = 'public';
    }

    // Set maximum clients to 2 for multiplayer
    maxClients = 2;

    onCreate(options) {
        console.log('Room created with options:', options);
        
        // Store room metadata
        if (options) {
            this.roomCode = options.roomCode || this.generateRoomCode();
            this.roomType = options.roomType || 'public';
            
            // Set metadata for room listing
            this.setMetadata({
                roomCode: this.roomCode,
                roomType: this.roomType,
                createdAt: Date.now(),
                playerCount: 0
            });
        } else {
            // Set default metadata if no options provided
            this.roomCode = this.generateRoomCode();
            this.roomType = 'public';
            this.setMetadata({
                roomCode: this.roomCode,
                roomType: this.roomType,
                createdAt: Date.now(),
                playerCount: 0
            });
        }
        
        console.log('Room metadata set:', {
            roomCode: this.roomCode,
            roomType: this.roomType
        });
        
        this.clock.setInterval(() => this.updateGameState(), 1000 / 60);
    }
    
    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    onJoin(client) {
        const playerId = client.sessionId;
        
        // Initialize player
        this.players[playerId] = {
            id: playerId,
            score: 0,
            combo: 0,
            health: 100,
            ready: false,
            connected: true
        };

        console.log(`Player joined: ${playerId}. Total players: ${Object.keys(this.players).length}`);
        
        this.broadcast('playerJoined', { playerId, playerCount: Object.keys(this.players).length });
        
        // Update metadata with new player count
        this.setMetadata({
            roomCode: this.roomCode,
            roomType: this.roomType,
            createdAt: Date.now(),
            playerCount: Object.keys(this.players).length
        });
        
        // Check if room is full (2 players) and notify
        if (Object.keys(this.players).length === 2) {
            this.setRoomReady();
        }
    }

    onLeave(client) {
        const playerId = client.sessionId;
        
        if (this.players[playerId]) {
            this.players[playerId].connected = false;
            this.broadcast('playerLeft', { playerId });
            
            // Remove player from players object
            delete this.players[playerId];
            
            // Update metadata with new player count
            this.setMetadata({
                roomCode: this.roomCode,
                roomType: this.roomType,
                createdAt: Date.now(),
                playerCount: Object.keys(this.players).length
            });
            
            // End game if a player disconnects
            if (this.gameStatus === 'playing') {
                this.endGame();
            }
            
            // Reset room status if all players left
            if (Object.keys(this.players).length === 0) {
                this.gameStatus = 'waiting';
            }
            
            console.log(`Player left: ${playerId}. Remaining players: ${Object.keys(this.players).length}`);
        }
    }

    onMessage(client, data) {
        const playerId = client.sessionId;
        
        switch (data.type) {
            case 'setReady':
                this.setPlayerReady(playerId);
                break;
            case 'selectSong':
                this.selectSong(data.songId);
                break;
            case 'updateScore':
                this.updatePlayerScore(playerId, data.score, data.combo, data.health);
                break;
            case 'startGame':
                this.startGame();
                break;
            case 'gameFinished':
                this.handlePlayerFinished(playerId, data.finalScore);
                break;
        }
    }

    setPlayerReady(playerId) {
        if (this.players[playerId]) {
            this.players[playerId].ready = true;
            this.broadcast('playerReady', { playerId });
            
            // Check if all players are ready
            const allReady = Object.values(this.players).every(p => p.ready);
            if (allReady && Object.keys(this.players).length === 2) {
                this.startGame();
            }
        }
    }

    selectSong(songId) {
        this.songId = songId;
        this.broadcast('songSelected', { songId });
    }

    startGame() {
        if (this.gameStatus !== 'waiting') return;
        
        this.gameStatus = 'playing';
        this.gameStartTime = Date.now();
        
        // Reset player scores
        Object.keys(this.players).forEach(playerId => {
            this.players[playerId].score = 0;
            this.players[playerId].combo = 0;
            this.players[playerId].health = 100;
        });
        
        this.broadcast('gameStarted', { songId: this.songId, startTime: this.gameStartTime });
    }

    updatePlayerScore(playerId, score, combo, health) {
        if (this.players[playerId]) {
            this.players[playerId].score = score;
            this.players[playerId].combo = combo;
            this.players[playerId].health = health;
            
            // Broadcast score update to opponent
            this.broadcast('scoreUpdate', { 
                playerId, 
                score, 
                combo, 
                health 
            });
        }
    }

    handlePlayerFinished(playerId, finalScore) {
        this.scores[playerId] = finalScore;
        
        // Check if both players finished
        const playersFinished = Object.keys(this.scores).length === Object.keys(this.players).length;
        
        if (playersFinished) {
            this.endGame();
        }
    }

    endGame() {
        this.gameStatus = 'finished';
        
        // Determine winner
        const scores = Object.entries(this.scores);
        scores.sort((a, b) => b[1] - a[1]);
        
        const winner = scores[0][0];
        
        this.broadcast('gameEnded', { 
            winner, 
            finalScores: this.scores 
        });
    }

    setRoomReady() {
        this.broadcast('roomReady', { playerCount: Object.keys(this.players).length });
    }

    updateGameState() {
        // Game loop updates
    }
}

// Initialize Colyseus Server
const port = process.env.PORT || 2567;
const app = express();

// Add CORS support
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Create HTTP server
const server = http.createServer(app);

// Create Colyseus server
const gameServer = new colyseus.Server({
    server: server,
});

// Define game room
gameServer.define('rhythm_game', GameState, {
    maxClients: 2
});

// Start server
server.listen(port, '0.0.0.0', () => {
    console.log(`🎮 Colyseus Multiplayer Server running on port ${port}`);
    console.log(`🎵 Room name: rhythm_game`);
    console.log(`🌐 Server ready for connections!`);
    console.log(`📍 Listening on 0.0.0.0:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});