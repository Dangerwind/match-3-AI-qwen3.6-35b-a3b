/* ========================================
   CORE GAME LOGIC
   ======================================== */

const game = {
    cell1: null,
    cell2: null,
    row1: null,
    col1: null,
    row2: null,
    col2: null,

    init() {
        this.bindBoardEvents();
    },

    bindBoardEvents() {
        this.gameBoard = document.getElementById('game-board');
        this.gameBoard.addEventListener('click', (e) => {
            if (!gameState.isRunning || gameState.isPaused || gameState.isProcessing) return;

            const cell = e.target.closest('.cell');
            if (!cell) return;

            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);

            this.handleCellClick(row, col, cell);
        });
    },

    handleCellClick(row, col, cell) {
        if (!this.cell1) {
            this.cell1 = cell;
            this.row1 = row;
            this.col1 = col;
            cell.classList.add('selected');
        } else if (!this.cell2) {
            if (this.cell1 === cell) {
                cell.classList.remove('selected');
                this.cell1 = null;
                return;
            }

            this.cell2 = cell;
            this.row2 = row;
            this.col2 = col;

            const isAdjacent = (
                (Math.abs(this.row1 - this.row2) === 1 && this.col1 === this.col2) ||
                (Math.abs(this.col1 - this.col2) === 1 && this.row1 === this.row2)
            );

            if (!isAdjacent) {
                this.cell1.classList.remove('selected');
                this.cell1 = this.cell2;
                this.row1 = this.row2;
                this.col1 = this.col2;
                this.cell2 = null;
                this.row2 = null;
                this.col2 = null;
                this.cell1.classList.add('selected');
                return;
            }

            this.trySwap();
        }
    },

    async trySwap() {
        gameState.isProcessing = true;

        const cell1 = this.cell1;
        const cell2 = this.cell2;
        const row1 = this.row1;
        const col1 = this.col1;
        const row2 = this.row2;
        const col2 = this.col2;

        cell1.classList.remove('selected');
        cell2.classList.remove('selected');
        this.cell1 = null;
        this.cell2 = null;

        // Check if valid move (this temporarily swaps and swaps back)
        const isValid = board.isValidMove(row1, col1, row2, col2, gameState.boardData);

        if (!isValid) {
            animations.animateInvalidMove(cell1, cell2);
            gameState.isProcessing = false;
            return;
        }

        // Actually swap the data
        board.swapData(row1, col1, row2, col2, gameState.boardData);

        // Play swap sound
        sound.playSwap();

        // Re-render board to sync DOM with data
        board.renderBoard(gameState.boardCells, gameState.boardData);

        // Find matches in the swapped board
        const matches = board.findMatches(gameState.boardData);

        if (matches.size === 0) {
            // No match - swap back both data and DOM
            board.restoreSwap(gameState.boardData, row1, col1, row2, col2);
            board.renderBoard(gameState.boardCells, gameState.boardData);
            animations.animateInvalidMove(cell1, cell2);
            gameState.isProcessing = false;
            return;
        }

        // Process cascades
        const points = await animations.processCascade(gameState.boardData, gameState.boardCells, this.gameBoard);

        gameState.score += points;
        ui.updateScore();

        // Check for possible moves
        const hasMoves = board.hasPossibleMoves(gameState.boardData, gameState.crystalTypes);
        if (!hasMoves) {
            await this.handleNoMoves();
        }

        gameState.isProcessing = false;
    },

    async handleNoMoves() {
        ui.showNoMoves();
        await animations.delay(1000);
        this.shuffleBoard();
    },

    shuffleBoard() {
        this.gameBoard.innerHTML = '';
        gameState.boardCells = board.initialize(this.gameBoard);
        gameState.boardData = board.generateInitialBoard(gameState.crystalTypes);

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
    }
};
