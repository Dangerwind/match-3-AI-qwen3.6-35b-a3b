/* ========================================
   UI MANAGEMENT
   ======================================== */

const ui = {
    init() {
        this.cacheElements();
        this.bindEvents();
        this.showStartScreen();
        this.updateHighscoreDisplay();
    },

    cacheElements() {
        this.startScreen = document.getElementById('start-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.pauseOverlay = document.getElementById('pause-overlay');
        this.gameoverOverlay = document.getElementById('gameover-overlay');
        this.noMovesOverlay = document.getElementById('no-moves-overlay');
        this.gameBoard = document.getElementById('game-board');
        this.scoreDisplay = document.getElementById('score-display');
        this.timerDisplay = document.getElementById('timer-display');
        this.highscoreDisplay = document.getElementById('highscore-display');
        this.finalScoreDisplay = document.getElementById('final-score-display');
        this.finalHighscoreDisplay = document.getElementById('final-highscore-display');
        this.newRecordRow = document.getElementById('new-record-row');
        this.startHighscore = document.getElementById('start-highscore');
        this.muteBtn = document.getElementById('mute-btn');
    },

    bindEvents() {
        // Crystal count selector
        document.querySelectorAll('.crystal-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.crystal-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                gameState.crystalTypes = parseInt(btn.dataset.count);
            });
        });

        // Start button
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());

        // Pause button
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());

        // Continue button
        document.getElementById('continue-btn').addEventListener('click', () => this.togglePause());

        // Quit to menu
        document.getElementById('quit-btn').addEventListener('click', () => this.quitToMenu());

        // Play again
        document.getElementById('play-again-btn').addEventListener('click', () => this.startGame());

        // Menu button
        document.getElementById('menu-btn').addEventListener('click', () => this.quitToMenu());

        // Mute button
        if (this.muteBtn) {
            this.muteBtn.addEventListener('click', () => {
                const muted = sound.toggleMute();
                this.muteBtn.classList.toggle('muted', muted);
            });
        }
    },

    showStartScreen() {
        this.startScreen.classList.add('active');
        this.gameScreen.classList.remove('active');
        this.pauseOverlay.classList.remove('active');
        this.gameoverOverlay.classList.remove('active');
        this.noMovesOverlay.classList.remove('active');

        // Select default (5)
        document.querySelectorAll('.crystal-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (parseInt(btn.dataset.count) === 5) {
                btn.classList.add('selected');
            }
        });
        gameState.crystalTypes = 5;

        this.updateHighscoreDisplay();
    },

    showGameScreen() {
        this.startScreen.classList.remove('active');
        this.gameScreen.classList.add('active');
        this.pauseOverlay.classList.remove('active');
        this.gameoverOverlay.classList.remove('active');
    },

    startGame() {
        resetGameState(gameState.crystalTypes);
        this.showGameScreen();
        gameState.isRunning = true;

        // Clear board DOM and initialize
        this.gameBoard.innerHTML = '';
        gameState.boardCells = board.initialize(this.gameBoard);
        gameState.boardData = board.generateInitialBoard(gameState.crystalTypes);

        // Render crystals on the board
        for (let r = 0; r < BOARD_ROWS; r++) {
            for (let c = 0; c < BOARD_COLS; c++) {
                const cell = board.getCell(gameState.boardCells, r, c);
                const type = gameState.boardData[r][c];
                if (cell && type >= 0) {
                    const crystal = document.createElement('div');
                    crystal.className = `crystal type-${type}`;
                    cell.appendChild(crystal);
                }
            }
        }

        this.updateScore();
        this.updateTimer();
        startTimer();
        sound.startMusic();
    },

    togglePause() {
        if (!gameState.isRunning) return;

        gameState.isPaused = !gameState.isPaused;

        if (gameState.isPaused) {
            this.pauseOverlay.classList.add('active');
            stopTimer();
            sound.stopMusic();
        } else {
            this.pauseOverlay.classList.remove('active');
            startTimer();
            sound.startMusic();
        }
    },

    quitToMenu() {
        stopTimer();
        sound.stopMusic();
        gameState.isRunning = false;
        gameState.isPaused = false;
        this.showStartScreen();
    },

    updateScore() {
        this.scoreDisplay.textContent = gameState.score;
    },

    updateTimer() {
        this.timerDisplay.textContent = gameState.time;

        if (gameState.time <= 10) {
            this.timerDisplay.classList.add('warning');
        } else {
            this.timerDisplay.classList.remove('warning');
        }
    },

    showGameOver(score) {
        const highScore = this.getHighscore();
        const isNewRecord = score > highScore;

        if (isNewRecord) {
            this.setHighscore(score);
        }

        this.finalScoreDisplay.textContent = score;
        this.finalHighscoreDisplay.textContent = Math.max(score, highScore);
        this.newRecordRow.style.display = isNewRecord ? 'block' : 'none';

        this.gameoverOverlay.classList.add('active');
        this.updateHighscoreDisplay();
    },

    showNoMoves() {
        this.noMovesOverlay.classList.add('active');
        setTimeout(() => {
            this.noMovesOverlay.classList.remove('active');
        }, 1500);
    },

    getHighscore() {
        try {
            return parseInt(localStorage.getItem('match3_highscore')) || 0;
        } catch (e) {
            return 0;
        }
    },

    setHighscore(score) {
        try {
            const current = this.getHighscore();
            if (score > current) {
                localStorage.setItem('match3_highscore', score.toString());
            }
        } catch (e) {
            // Silently fail
        }
    },

    updateHighscoreDisplay() {
        const highScore = this.getHighscore();
        this.highscoreDisplay.textContent = highScore;

        if (this.startHighscore) {
            if (highScore > 0) {
                this.startHighscore.textContent = `РЕКОРД: ${highScore}`;
                this.startHighscore.style.display = 'block';
            } else {
                this.startHighscore.style.display = 'none';
            }
        }
    }
};
