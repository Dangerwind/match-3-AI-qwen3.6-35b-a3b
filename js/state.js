/* ========================================
   GAME STATE MANAGEMENT
   ======================================== */

const GAME_TIME = 60;
const BOARD_ROWS = 8;
const BOARD_COLS = 8;

const gameState = {
    score: 0,
    time: GAME_TIME,
    isRunning: false,
    isPaused: false,
    selectedCell: null,
    crystalTypes: 5,
    timerInterval: null,
    isProcessing: false,
    muted: false,
    boardData: null,      // 2D array of crystal type numbers
    boardCells: null      // 2D array of DOM elements
};

function resetGameState(crystalTypes) {
    gameState.score = 0;
    gameState.time = GAME_TIME;
    gameState.isRunning = false;
    gameState.isPaused = false;
    gameState.selectedCell = null;
    gameState.crystalTypes = crystalTypes;
    gameState.isProcessing = false;
    gameState.muted = false;
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

function startTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    gameState.timerInterval = setInterval(() => {
        if (!gameState.isPaused && gameState.isRunning) {
            gameState.time--;
            ui.updateTimer();
            if (gameState.time <= 0) {
                endGame();
            }
        }
    }, 1000);
}

function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

function endGame() {
    stopTimer();
    sound.stopMusic();
    sound.playGameover();
    gameState.isRunning = false;
    ui.showGameOver(gameState.score);
}
