/* ========================================
   CRYSTAL TYPES AND RENDERING
   ======================================== */

const crystals = {
    createElement(type) {
        const cell = document.createElement('div');
        cell.className = 'cell';

        const crystal = document.createElement('div');
        crystal.className = `crystal type-${type}`;
        cell.appendChild(crystal);

        return cell;
    },

    createEmptyCell() {
        const cell = document.createElement('div');
        cell.className = 'cell';
        return cell;
    },

    getTypeFromCell(cell) {
        const crystal = cell.querySelector('.crystal');
        if (!crystal) return -1;

        for (let i = 0; i < 7; i++) {
            if (crystal.classList.contains(`type-${i}`)) {
                return i;
            }
        }
        return -1;
    },

    setCrystalType(cell, type) {
        const crystal = cell.querySelector('.crystal');
        if (!crystal) {
            const newCr = document.createElement('div');
            newCr.className = `crystal type-${type}`;
            cell.appendChild(newCr);
            return;
        }
        crystal.className = `crystal type-${type}`;
    },

    hasCrystal(cell) {
        return cell.querySelector('.crystal') !== null;
    },

    removeCrystal(cell) {
        const crystal = cell.querySelector('.crystal');
        if (crystal) {
            crystal.remove();
        }
    },

    getCellSize() {
        const board = document.getElementById('game-board');
        if (!board) return 50;
        const boardRect = board.getBoundingClientRect();
        const gap = 3;
        const padding = 20;
        const size = (boardRect.width - padding - (BOARD_COLS - 1) * gap) / BOARD_COLS;
        return size;
    }
};
