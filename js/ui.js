/* ========================================
   UI MANAGEMENT
   Owns: screen transitions, button bindings, display updates, highscores.
   Does NOT: initialize board, manage timer, control game lifecycle.
   ======================================== */

const ui = {
    init() {
        this._cacheElements();
        this._bindEvents();
        this.showStartScreen();
    },

    /* ── Screen transitions ──────────────────── */

    showStartScreen() {
        this._startScreen.classList.add('active');
        this._gameScreen.classList.remove('active');
        this._pauseOverlay.classList.remove('active');
        this._gameoverOverlay.classList.remove('active');
        this._noMovesOverlay.classList.remove('active');

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
        this._startScreen.classList.remove('active');
        this._gameScreen.classList.add('active');
        this._pauseOverlay.classList.remove('active');
        this._gameoverOverlay.classList.remove('active');
    },

    showGameOver(score) {
        const highScore = this._getHighscore();
        const isNewRecord = score > highScore;

        if (isNewRecord) {
            this._setHighscore(score);
        }

        this._finalScoreDisplay.textContent = score;
        this._finalHighscoreDisplay.textContent = Math.max(score, highScore);
        this._newRecordRow.style.display = isNewRecord ? 'block' : 'none';

        this._gameoverOverlay.classList.add('active');
        this.updateHighscoreDisplay();
    },

    showNoMoves() {
        this._noMovesOverlay.classList.add('active');
        setTimeout(() => {
            this._noMovesOverlay.classList.remove('active');
        }, 1500);
    },

    /* ── Display updates ─────────────────────── */

    updateScore() {
        this._scoreDisplay.textContent = gameState.score;
    },

    updateTimer() {
        this._timerDisplay.textContent = gameState.time;
        if (gameState.time <= 10) {
            this._timerDisplay.classList.add('warning');
        } else {
            this._timerDisplay.classList.remove('warning');
        }
    },

    updateHighscoreDisplay() {
        const highScore = this._getHighscore();
        this._highscoreDisplay.textContent = highScore;

        if (this._startHighscore) {
            if (highScore > 0) {
                this._startHighscore.textContent = `РЕКОРД: ${highScore}`;
                this._startHighscore.style.display = 'block';
            } else {
                this._startHighscore.style.display = 'none';
            }
        }
    },

    /* ── Event bindings ──────────────────────── */

    _bindEvents() {
        document.querySelectorAll('.crystal-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.crystal-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                gameState.crystalTypes = parseInt(btn.dataset.count);
            });
        });

        document.getElementById('start-btn').addEventListener('click', () => game.start());
        document.getElementById('pause-btn').addEventListener('click', () => game.pause());
        document.getElementById('continue-btn').addEventListener('click', () => game.pause());
        document.getElementById('quit-btn').addEventListener('click', () => game.quitToMenu());
        document.getElementById('play-again-btn').addEventListener('click', () => game.start());
        document.getElementById('menu-btn').addEventListener('click', () => game.quitToMenu());

        if (this._muteBtn) {
            this._muteBtn.addEventListener('click', () => {
                const muted = sound.toggleMute();
                this._muteBtn.classList.toggle('muted', muted);
            });
        }
    },

    /* ── Cache DOM elements ──────────────────── */

    _cacheElements() {
        this._startScreen = document.getElementById('start-screen');
        this._gameScreen = document.getElementById('game-screen');
        this._pauseOverlay = document.getElementById('pause-overlay');
        this._gameoverOverlay = document.getElementById('gameover-overlay');
        this._noMovesOverlay = document.getElementById('no-moves-overlay');
        this._scoreDisplay = document.getElementById('score-display');
        this._timerDisplay = document.getElementById('timer-display');
        this._highscoreDisplay = document.getElementById('highscore-display');
        this._finalScoreDisplay = document.getElementById('final-score-display');
        this._finalHighscoreDisplay = document.getElementById('final-highscore-display');
        this._newRecordRow = document.getElementById('new-record-row');
        this._startHighscore = document.getElementById('start-highscore');
        this._muteBtn = document.getElementById('mute-btn');
    },

    /* ── Highscore storage ───────────────────── */

    _getHighscore() {
        try {
            return parseInt(localStorage.getItem('match3_highscore')) || 0;
        } catch (e) {
            return 0;
        }
    },

    _setHighscore(score) {
        try {
            const current = this._getHighscore();
            if (score > current) {
                localStorage.setItem('match3_highscore', score.toString());
            }
        } catch (e) {
            // Silently fail
        }
    }
};
