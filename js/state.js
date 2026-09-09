/* ========================================
   GAME STATE & CONSTANTS
   Pure data — no business logic here.
   ======================================== */

const GAME_TIME = 60;
const BOARD_ROWS = 8;
const BOARD_COLS = 8;

const gameState = {
    score: 0,
    time: GAME_TIME,
    isRunning: false,
    isPaused: false,
    crystalTypes: 5,
    isProcessing: false,
    muted: false,
    boardData: null,
    boardCells: null
};

function resetState() {
    gameState.score = 0;
    gameState.time = GAME_TIME;
    gameState.isRunning = false;
    gameState.isPaused = false;
    gameState.isProcessing = false;
    gameState.muted = false;
}
