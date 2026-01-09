// ==================================
// Colyseus Multiplayer Server
// ==================================

const colyseus = require('colyseus');
const http = require('http');
const express = require('express');

class GameState extends colyseus.Room {
    // VERY IMPORTANT: Limit to exactly 2 players
    maxClients = 2;

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
        // Give players 30 seconds to join before room can expire
        this.setSeatReservationTime(30);
    }

    onJoin(client) {
        const playerId = client.sessionId;

        // Prevent same client joining twice (safety check)
        if (this.players[playerId]) {
            console.log(`Ignoring duplicate join from ${playerId}`);
            return;
        }

        // Add the player
        this.players[playerId] = {
            id: playerId,
            score: 0,
            combo: 0,
            health: 100,
            ready: false,
            connected: true
        };

        console.log(`Player joined: ${playerId} | Total players now: ${Object.keys(this.players).length}`);

        // Tell everyone someone joined
        this.broadcast('playerJoined', { 
            playerId, 
            playerCount: Object.keys(this.players).length 
        });

        // ONLY make room ready when we have EXACTLY 2 real players
        if (Object.keys(this.players).length === 2) {
            console.log("=== TWO REAL PLAYERS DETECTED === Room is ready!");
            this.broadcast('roomReady', { playerCount: 2 });
            // You can auto-start here if you want, or wait for 'setReady' messages
        }
    }

    onLeave(client) {
        const playerId = client.sessionId;
        
        if (this.players[playerId]) {
            this.players[playerId].connected = false;
            this.broadcast('playerLeft', { playerId });
            
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
            
            // Start game only when BOTH are ready
            const allReady = Object.values(this.players).every(p => p.ready);
            if (allReady && Object.keys(this.players).length === 2) {
                console.log("Both players are ready → starting game!");
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

// ================================================
//           FINAL SERVER STARTUP SECTION
// ================================================

const port = process.env.PORT || 2567;

// Print immediately so we know the file is running at all
console.log("SERVER FILE HAS STARTED EXECUTION");
console.log("Current working directory:", process.cwd());
console.log("Node version:", process.version);

// Make sure server is listening and tell us loudly when it does
server.listen(port, () => {
    console.log("");
    console.log("╔════════════════════════════════════════════════════╗");
    console.log("║                                                    ║");
    console.log("║      🎮  COLYSEUS SERVER IS **NOW RUNNING**!       ║");
    console.log("║                                                    ║");
    console.log(`║               Listening on port: ${port}              ║`);
    console.log(`║         Open browser: http://localhost:${port}         ║`);
    console.log("║                                                    ║");
    console.log("║   → Now go to your game and click 'Create Room'!   ║");
    console.log("║                                                    ║");
    console.log("╚════════════════════════════════════════════════════╝");
    console.log("");
});

// If listening fails (port busy, permission, etc.)
server.on('error', (err) => {
    console.error("!!! SERVER FAILED TO START !!!");
    console.error("Error:", err.message);
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use!`);
        console.error("Try closing other Node processes or change port to 3000");
    }
    process.exit(1);
});

console.log("server.listen() command has been executed");
console.log("If you don't see the big box above → server didn't start properly");

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
