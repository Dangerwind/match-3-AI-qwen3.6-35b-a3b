/* ========================================
   GAME ORCHESTRATOR
   Coordinates all modules: board, animations, sound, ui, state.
   Owns: lifecycle, timer, player interactions, score.
   ======================================== */

const game = {
    _timerInterval: null,
    _firstCell: null,
    _firstRow: null,
    _firstCol: null,
    _gameBoard: null,

    init() {
        this._gameBoard = document.getElementById('game-board');
        this._bindBoardEvents();
    },

    /* ── Lifecycle ─────────────────────────────── */

    start() {
        resetState();
        gameState.isRunning = true;
        gameState.crystalTypes = this._getCrystalTypes();

        ui.showGameScreen();

        this._gameBoard.innerHTML = '';
        gameState.boardCells = board.initialize(this._gameBoard);
        gameState.boardData = board.generateInitialBoard(gameState.crystalTypes);
        board.syncBoardDOM(gameState.boardCells, gameState.boardData);

        ui.updateScore();
        ui.updateTimer();
        ui.updateHighscoreDisplay();

        this._startTimer();
        sound.startMusic();
    },

    pause() {
        if (!gameState.isRunning) return;
        gameState.isPaused = !gameState.isPaused;

        if (gameState.isPaused) {
            this._stopTimer();
            sound.stopMusic();
        } else {
            this._startTimer();
            sound.startMusic();
        }
    },

    quitToMenu() {
        this._stopTimer();
        sound.stopMusic();
        gameState.isRunning = false;
        gameState.isPaused = false;
        ui.showStartScreen();
    },

    end() {
        this._stopTimer();
        gameState.isRunning = false;
        sound.stopMusic();
        sound.playGameover();
        ui.showGameOver(gameState.score);
    },

    /* ── Timer ─────────────────────────────────── */

    _startTimer() {
        if (this._timerInterval) clearInterval(this._timerInterval);
        this._timerInterval = setInterval(() => {
            if (gameState.isPaused || !gameState.isRunning) return;
            gameState.time--;
            ui.updateTimer();
            if (gameState.time <= 0) {
                this.end();
            }
        }, 1000);
    },

    _stopTimer() {
        if (this._timerInterval) {
            clearInterval(this._timerInterval);
            this._timerInterval = null;
        }
    },

    /* ── Player interaction ────────────────────── */

    _bindBoardEvents() {
        this._gameBoard.addEventListener('click', (e) => {
            if (!gameState.isRunning || gameState.isPaused || gameState.isProcessing) return;

            const cell = e.target.closest('.cell');
            if (!cell) return;

            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);

            this._handleCellClick(row, col, cell);
        });
    },

    _handleCellClick(row, col, cell) {
        if (!this._firstCell) {
            this._firstCell = cell;
            this._firstRow = row;
            this._firstCol = col;
            cell.classList.add('selected');
            return;
        }

        if (this._firstCell === cell) {
            cell.classList.remove('selected');
            this._firstCell = null;
            return;
        }

        this._secondCell = cell;
        this._secondRow = row;
        this._secondCol = col;

        const isAdjacent = (
            (Math.abs(this._firstRow - this._secondRow) === 1 && this._firstCol === this._secondCol) ||
            (Math.abs(this._firstCol - this._secondCol) === 1 && this._firstRow === this._secondRow)
        );

        if (!isAdjacent) {
            this._firstCell.classList.remove('selected');
            this._firstCell = this._secondCell;
            this._firstRow = this._secondRow;
            this._firstCol = this._secondCol;
            this._secondCell = null;
            this._secondRow = null;
            this._secondCol = null;
            this._firstCell.classList.add('selected');
            return;
        }

        this._executeSwap();
    },

    /* ── Swap & cascade ────────────────────────── */

    async _executeSwap() {
        gameState.isProcessing = true;

        const cell1 = this._firstCell;
        const cell2 = this._secondCell;
        const row1 = this._firstRow;
        const col1 = this._firstCol;
        const row2 = this._secondRow;
        const col2 = this._secondCol;

        cell1.classList.remove('selected');
        cell2.classList.remove('selected');
        this._firstCell = null;
        this._secondCell = null;

        const isValid = board.isValidMove(row1, col1, row2, col2, gameState.boardData);
        if (!isValid) {
            animations.animateInvalidMove(cell1, cell2);
            gameState.isProcessing = false;
            return;
        }

        board.swapData(row1, col1, row2, col2, gameState.boardData);
        sound.playSwap();
        board.renderBoard(gameState.boardCells, gameState.boardData);

        const matches = board.findMatches(gameState.boardData);
        if (matches.size === 0) {
            board.restoreSwap(gameState.boardData, row1, col1, row2, col2);
            board.renderBoard(gameState.boardCells, gameState.boardData);
            animations.animateInvalidMove(cell1, cell2);
            gameState.isProcessing = false;
            return;
        }

        const points = await animations.processCascade(gameState.boardData, gameState.boardCells, this._gameBoard);
        gameState.score += points;
        ui.updateScore();

        if (!board.hasPossibleMoves(gameState.boardData, gameState.crystalTypes)) {
            ui.showNoMoves();
            await animations.delay(1000);
            this._shuffleBoard();
        }

        gameState.isProcessing = false;
    },

    /* ── Shuffle ───────────────────────────────── */

    _shuffleBoard() {
        this._gameBoard.innerHTML = '';
        gameState.boardCells = board.initialize(this._gameBoard);
        gameState.boardData = board.generateInitialBoard(gameState.crystalTypes);
        board.syncBoardDOM(gameState.boardCells, gameState.boardData);
    },

    /* ── Helpers ───────────────────────────────── */

    _getCrystalTypes() {
        const btn = document.querySelector('.crystal-btn.selected');
        return btn ? parseInt(btn.dataset.count) : 5;
    }
};
