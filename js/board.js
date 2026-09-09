/* ========================================
   BOARD OPERATIONS
   ======================================== */

const board = {
    initialize(container) {
        container.innerHTML = '';
        container.style.gridTemplateColumns = `repeat(${BOARD_COLS}, 1fr)`;
        container.style.gridTemplateRows = `repeat(${BOARD_ROWS}, 1fr)`;

        const cells = [];
        for (let r = 0; r < BOARD_ROWS; r++) {
            cells[r] = [];
            for (let c = 0; c < BOARD_COLS; c++) {
                const cell = crystals.createEmptyCell();
                cell.dataset.row = r;
                cell.dataset.col = c;
                container.appendChild(cell);
                cells[r][c] = cell;
            }
        }

        return cells;
    },

    getCell(cells, row, col) {
        if (row < 0 || row >= BOARD_ROWS || col < 0 || col >= BOARD_COLS) {
            return null;
        }
        return cells[row][col];
    },

    generateInitialBoard(crystalTypes) {
        let attempts = 0;
        while (attempts < 200) {
            const data = [];
            for (let r = 0; r < BOARD_ROWS; r++) {
                data[r] = [];
                for (let c = 0; c < BOARD_COLS; c++) {
                    data[r][c] = Math.floor(Math.random() * crystalTypes);
                }
            }

            // Remove ALL initial matches repeatedly
            let maxIterations = 500;
            while (maxIterations > 0) {
                maxIterations--;
                const matches = this.findMatches(data);
                if (matches.size === 0) break;

                // Replace matched cells with different types
                for (const key of matches) {
                    const [r, c] = key.split(',').map(Number);
                    const oldType = data[r][c];
                    let newType;
                    let attempts2 = 0;
                    do {
                        newType = Math.floor(Math.random() * crystalTypes);
                        attempts2++;
                    } while (newType === oldType && attempts2 < 20);
                    data[r][c] = newType;
                }
            }

            // Final safety check - make absolutely sure no matches remain
            const finalMatches = this.findMatches(data);
            if (finalMatches.size === 0 && this.hasPossibleMoves(data, crystalTypes)) {
                return data;
            }

            attempts++;
        }

        // Final fallback: try to remove any remaining matches
        const data = [];
        for (let r = 0; r < BOARD_ROWS; r++) {
            data[r] = [];
            for (let c = 0; c < BOARD_COLS; c++) {
                data[r][c] = Math.floor(Math.random() * crystalTypes);
            }
        }

        // Aggressively remove all matches
        for (let safety = 0; safety < 1000; safety++) {
            const matches = this.findMatches(data);
            if (matches.size === 0) break;

            for (const key of matches) {
                const [r, c] = key.split(',').map(Number);
                const oldType = data[r][c];
                const neighbors = [];
                for (let t = 0; t < crystalTypes; t++) {
                    if (t !== oldType) neighbors.push(t);
                }
                data[r][c] = neighbors[Math.floor(Math.random() * neighbors.length)];
            }
        }

        return data;
    },

    fillBoard(data, crystalTypes) {
        for (let r = 0; r < BOARD_ROWS; r++) {
            for (let c = 0; c < BOARD_COLS; c++) {
                data[r][c] = Math.floor(Math.random() * crystalTypes);
            }
        }

        // Remove initial matches
        let hasMatches = true;
        while (hasMatches) {
            const matches = this.findMatches(data);
            if (matches.size === 0) {
                hasMatches = false;
            } else {
                for (const key of matches) {
                    const [r, c] = key.split(',').map(Number);
                    data[r][c] = Math.floor(Math.random() * crystalTypes);
                }
            }
        }

        return data;
    },

    renderBoard(cells, data) {
        for (let r = 0; r < BOARD_ROWS; r++) {
            for (let c = 0; c < BOARD_COLS; c++) {
                const type = data[r][c];
                const cell = this.getCell(cells, r, c);
                if (!cell) continue;

                const crystal = cell.querySelector('.crystal');
                if (type >= 0) {
                    if (!crystal) {
                        // Add new crystal
                        const newCrystal = document.createElement('div');
                        newCrystal.className = `crystal type-${type}`;
                        cell.appendChild(newCrystal);
                    } else if (!crystal.classList.contains(`type-${type}`)) {
                        // Update existing crystal type
                        crystal.className = `crystal type-${type}`;
                    }
                } else {
                    // Remove crystal (empty cell)
                    if (crystal) crystal.remove();
                }
            }
        }
    },

    findMatches(data) {
        const matched = new Set();
        this.findHorizontalMatches(data, matched);
        this.findVerticalMatches(data, matched);
        return matched;
    },

    findHorizontalMatches(data, matched) {
        for (let r = 0; r < BOARD_ROWS; r++) {
            for (let c = 0; c <= BOARD_COLS - 3; c++) {
                const type = data[r][c];
                if (type < 0) continue;

                let count = 1;
                while (c + count < BOARD_COLS && data[r][c + count] === type) {
                    count++;
                }

                if (count >= 3) {
                    for (let i = 0; i < count; i++) {
                        matched.add(`${r},${c + i}`);
                    }
                    c += count - 1;
                }
            }
        }
    },

    findVerticalMatches(data, matched) {
        for (let c = 0; c < BOARD_COLS; c++) {
            for (let r = 0; r <= BOARD_ROWS - 3; r++) {
                const type = data[r][c];
                if (type < 0) continue;

                let count = 1;
                while (r + count < BOARD_ROWS && data[r + count][c] === type) {
                    count++;
                }

                if (count >= 3) {
                    for (let i = 0; i < count; i++) {
                        matched.add(`${r + i},${c}`);
                    }
                    r += count - 1;
                }
            }
        }
    },

    swapData(row1, col1, row2, col2, data) {
        const temp = data[row1][col1];
        data[row1][col1] = data[row2][col2];
        data[row2][col2] = temp;
    },

    isValidMove(row1, col1, row2, col2, data) {
        const isAdjacent = (
            (Math.abs(row1 - row2) === 1 && col1 === col2) ||
            (Math.abs(col1 - col2) === 1 && row1 === row2)
        );
        if (!isAdjacent) return false;

        this.swapData(row1, col1, row2, col2, data);
        const matches = this.findMatches(data);
        const swapCreatedMatch = matches.has(`${row1},${col1}`) || matches.has(`${row2},${col2}`);
        this.swapData(row1, col1, row2, col2, data);

        return swapCreatedMatch;
    },

    hasPossibleMoves(data, crystalTypes) {
        for (let r = 0; r < BOARD_ROWS; r++) {
            for (let c = 0; c < BOARD_COLS; c++) {
                if (c + 1 < BOARD_COLS) {
                    if (this.isValidMove(r, c, r, c + 1, data)) {
                        return true;
                    }
                }
                if (r + 1 < BOARD_ROWS) {
                    if (this.isValidMove(r, c, r + 1, c, data)) {
                        return true;
                    }
                }
            }
        }
        return false;
    },

    collapseBoard(data) {
        const moved = [];

        for (let c = 0; c < BOARD_COLS; c++) {
            let writeRow = BOARD_ROWS - 1;
            for (let r = BOARD_ROWS - 1; r >= 0; r--) {
                if (data[r][c] >= 0) {
                    if (writeRow !== r) {
                        data[writeRow][c] = data[r][c];
                        data[r][c] = -1;
                        moved.push([writeRow, c]);
                    }
                    writeRow--;
                }
            }
            for (let r = writeRow; r >= 0; r--) {
                data[r][c] = -1;
            }
        }

        return moved;
    },

    fillEmptyCells(data, crystalTypes) {
        const filled = [];

        for (let r = 0; r < BOARD_ROWS; r++) {
            for (let c = 0; c < BOARD_COLS; c++) {
                if (data[r][c] < 0) {
                    data[r][c] = Math.floor(Math.random() * crystalTypes);
                    filled.push([r, c]);
                }
            }
        }

        return filled;
    },

    restoreSwap(data, row1, col1, row2, col2) {
        this.swapData(row1, col1, row2, col2, data);
    },

    getCellIndex(row, col) {
        return row * BOARD_COLS + col;
    }
};
