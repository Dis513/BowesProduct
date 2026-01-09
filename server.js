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
    }

    onCreate() {
        this.clock.setInterval(() => this.updateGameState(), 1000 / 60);
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

        this.broadcast('playerJoined', { playerId, playerCount: Object.keys(this.players).length });
        
        // Check if room is full (2 players)
        if (Object.keys(this.players).length === 2) {
            this.setRoomReady();
        }
    }

    onLeave(client) {
        const playerId = client.sessionId;
        
        if (this.players[playerId]) {
            this.players[playerId].connected = false;
            this.broadcast('playerLeft', { playerId });
            
            // End game if a player disconnects
            if (this.gameStatus === 'playing') {
                this.endGame();
            }
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

const port = process.env.PORT || 2567;

// SUPER LOUD DEBUG LOGS - you WILL see these
console.log("=== SERVER FILE STARTING ===");
console.log("Node version:", process.version);
console.log("Current directory:", process.cwd());
console.log("Trying to listen on port:", port);

server.listen(port, () => {
    console.log("");
    console.log("╔════════════════════════════════════════════╗");
    console.log("║     🎮 COLYSEUS SERVER IS **ACTUALLY** RUNNING!    ║");
    console.log("║                                            ║");
    console.log(`║           Port: ${port}                           ║`);
    console.log(`║   Test in browser: http://localhost:${port}       ║`);
    console.log("║   Now go to game → click Create Room!      ║");
    console.log("╚════════════════════════════════════════════╝");
    console.log("");
});

// Even louder: log if listen fails
server.on('error', (err) => {
    console.error("SERVER LISTEN ERROR:", err.message);
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use! Kill the process or change port.`);
    }
    process.exit(1);
});

console.log("=== server.listen() called - if you see this but no box → callback didn't fire!");
const app = express();


// Create HTTP server
const server = http.createServer(app);

// Create Colyseus server
const gameServer = new colyseus.Server({
    server: server,
});

// Define game room
gameServer.define('rhythm_game', GameState);

// Start server
server.listen(port, () => {
    console.log(`🎮 Colyseus Multiplayer Server running on port ${port}`);
    console.log(`🎵 Room name: rhythm_game`);
    console.log(`🌐 Server ready for connections!`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});
