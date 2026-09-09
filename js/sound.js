/* ========================================
    SOUND MANAGEMENT
    ======================================== */

const sound = {
    music: null,
    swap: null,
    match: null,
    cascade: null,
    gameover: null,

    init() {
        this.music = new Audio('assets/music.mp3');
        this.music.loop = true;
        this.music.volume = 0.3;

        this.swap = new Audio('assets/swap.mp3');
        this.swap.volume = 0.5;

        this.match = new Audio('assets/match.mp3');
        this.match.volume = 0.5;

        this.cascade = new Audio('assets/cascade.mp3');
        this.cascade.volume = 0.5;

        this.gameover = new Audio('assets/gameover.mp3');
        this.gameover.volume = 0.6;
    },

    play(audio) {
        if (gameState.muted) return;
        audio.currentTime = 0;
        audio.play().catch(() => {});
    },

    playSwap() {
        this.play(this.swap);
    },

    playMatch() {
        this.play(this.match);
    },

    playCascade() {
        this.play(this.cascade);
    },

    playGameover() {
        this.play(this.gameover);
    },

    startMusic() {
        if (gameState.muted) return;
        this.music.currentTime = 0;
        this.music.play().catch(() => {});
    },

    stopMusic() {
        this.music.pause();
        this.music.currentTime = 0;
    },

    toggleMute() {
        gameState.muted = !gameState.muted;
        if (gameState.muted) {
            this.stopMusic();
            [this.swap, this.match, this.cascade, this.gameover].forEach(a => {
                a.pause();
                a.currentTime = 0;
            });
        } else {
            if (gameState.isRunning && !gameState.isPaused) {
                this.startMusic();
            }
        }
        return gameState.muted;
    }
};
