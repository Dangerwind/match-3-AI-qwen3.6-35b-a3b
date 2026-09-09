/* ========================================
   ANIMATIONS
   ======================================== */

const animations = {
    async swapCells(row1, col1, row2, col2, boardCells) {
        const cell1 = board.getCell(boardCells, row1, col1);
        const cell2 = board.getCell(boardCells, row2, col2);

        cell1.classList.add('swapping');
        cell2.classList.add('swapping');

        await this.delay(250);

        cell1.classList.remove('swapping');
        cell2.classList.remove('swapping');
    },

    showScorePopup(row, col, points) {
        const cell = board.getCell(gameState.boardCells, row, col);
        if (!cell) return;

        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = `+${points}`;
        cell.appendChild(popup);

        setTimeout(() => {
            if (popup.parentNode) {
                popup.remove();
            }
        }, 800);
    },

    async processCascade(boardData, boardCells, container) {
        let totalChainPoints = 0;
        let hasMore = true;

        while (hasMore) {
            const matches = board.findMatches(boardData);

            if (matches.size === 0) {
                hasMore = false;
                break;
            }

            const stepPoints = matches.size;
            totalChainPoints += stepPoints;

            // Show score popup from center of matched area
            let sumR = 0, sumC = 0;
            for (const key of matches) {
                const [r, c] = key.split(',').map(Number);
                sumR += r;
                sumC += c;
            }
            const avgR = Math.floor(sumR / matches.size);
            const avgC = Math.floor(sumC / matches.size);
            this.showScorePopup(avgR, avgC, stepPoints);

            // Add destruction animation to matched crystals
            for (const key of matches) {
                const [r, c] = key.split(',').map(Number);
                const cell = board.getCell(boardCells, r, c);
                if (cell) {
                    const crystal = cell.querySelector('.crystal');
                    if (crystal) {
                        crystal.classList.add('destroy-anim');
                    }
                }
            }

            // Play match/cascade sound
            if (totalChainPoints === stepPoints) {
                sound.playMatch();
            } else {
                sound.playCascade();
            }

            // Wait for destruction animation
            await this.delay(350);

            // Remove matched crystals from DOM
            for (const key of matches) {
                const [r, c] = key.split(',').map(Number);
                const cell = board.getCell(boardCells, r, c);
                if (cell) {
                    const crystal = cell.querySelector('.crystal');
                    if (crystal) crystal.remove();
                }
            }

            // Remove matched cells from board data (mark as empty)
            for (const key of matches) {
                const [r, c] = key.split(',').map(Number);
                boardData[r][c] = -1;
            }

            // Animate falling crystals FIRST (before collapsing data)
            await this.animateFallInColumns(boardData, boardCells);

            // NOW collapse the data (logical move)
            board.collapseBoard(boardData);

            // Fill empty cells with new crystal types
            board.fillEmptyCells(boardData, gameState.crystalTypes);

            // Animate new crystals appearing (only if no crystal already exists)
            await this.fillNewCrystals(boardData, boardCells);

            // SAFETY: remove any extra crystals that shouldn't be in cells
            this.cleanupExtraCrystals(boardCells);

            await this.delay(150);
        }

        return totalChainPoints;
    },

    animateFallInColumns(boardData, boardCells) {
        return new Promise(resolve => {
            const fallingCrystals = [];

            // For each column, find empty cells and crystals above them
            for (let c = 0; c < BOARD_COLS; c++) {
                const emptyRows = [];
                for (let r = 0; r < BOARD_ROWS; r++) {
                    if (boardData[r][c] < 0) {
                        emptyRows.push(r);
                    }
                }

                if (emptyRows.length === 0) continue;

                const firstEmptyRow = emptyRows[0];

                for (let r = 0; r < firstEmptyRow; r++) {
                    if (boardData[r][c] >= 0) {
                        const cell = board.getCell(boardCells, r, c);
                        const crystal = cell?.querySelector('.crystal');
                        if (crystal) {
                            const fallDistance = emptyRows.filter(er => er > r).length;
                            if (fallDistance > 0) {
                                const targetRow = r + fallDistance;
                                const targetCell = board.getCell(boardCells, targetRow, c);
                                fallingCrystals.push({
                                    crystal: crystal,
                                    cell: cell,
                                    targetCell: targetCell,
                                    fallDistance: fallDistance
                                });
                            }
                        }
                    }
                }
            }

            if (fallingCrystals.length === 0) {
                setTimeout(resolve, 100);
                return;
            }

            // Get cell dimensions
            const cellHeight = boardCells[0][0].offsetHeight || 50;

            // Animate falling and move crystals immediately after animation
            for (const fc of fallingCrystals) {
                const {crystal, cell, targetCell, fallDistance} = fc;

                // Get the source cell's grid position
                const sourceRow = parseInt(cell.dataset.row);
                const sourceCol = parseInt(cell.dataset.col);
                const targetRow = parseInt(targetCell.dataset.row);
                const targetCol = parseInt(targetCell.dataset.col);

                // Calculate pixel offset
                const offsetX = (targetCol - sourceCol) * (cellHeight + 3); // +3 for gap
                const offsetY = (targetRow - sourceRow) * (cellHeight + 3);

                // Move crystal to be positioned absolutely within the cell
                crystal.style.position = 'absolute';
                crystal.style.top = '10%';
                crystal.style.left = '10%';
                crystal.style.zIndex = '50';
                crystal.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)';
                crystal.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
            }

            // After animation completes, move crystals to target cells and clean up styles
            setTimeout(() => {
                for (const fc of fallingCrystals) {
                    const {crystal, targetCell} = fc;
                    crystal.style.position = '';
                    crystal.style.top = '';
                    crystal.style.left = '';
                    crystal.style.zIndex = '';
                    crystal.style.transition = '';
                    crystal.style.transform = '';
                    targetCell.appendChild(crystal);
                }
                resolve();
            }, 350);
        });
    },

    fillNewCrystals(boardData, boardCells) {
        return new Promise(resolve => {
            const promises = [];

            for (let r = 0; r < BOARD_ROWS; r++) {
                for (let c = 0; c < BOARD_COLS; c++) {
                    const cell = board.getCell(boardCells, r, c);
                    const type = boardData[r][c];
                    const existingCrystal = cell.querySelector('.crystal');

                    if (type >= 0 && !existingCrystal) {
                        // This is a new crystal that needs to appear
                        const newCrystal = document.createElement('div');
                        newCrystal.className = `crystal type-${type}`;
                        newCrystal.style.opacity = '0';
                        newCrystal.style.transform = 'translateY(-30px) scale(0.5)';

                        cell.appendChild(newCrystal);

                        // Animate it appearing
                        requestAnimationFrame(() => {
                            newCrystal.style.transition = 'opacity 0.2s, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
                            newCrystal.style.opacity = '1';
                            newCrystal.style.transform = 'translateY(0) scale(1)';
                        });

                        promises.push(this.delay(400));
                    }
                }
            }

            Promise.all(promises).then(resolve);
        });
    },

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    shakeBoard(container) {
        container.classList.add('shaking');
        setTimeout(() => {
            container.classList.remove('shaking');
        }, 300);
    },

    animateInvalidMove(cell1, cell2) {
        cell1.classList.add('shaking');
        cell2.classList.add('shaking');
        setTimeout(() => {
            cell1.classList.remove('shaking');
            cell2.classList.remove('shaking');
        }, 300);
    },

    cleanupExtraCrystals(boardCells) {
        for (let r = 0; r < BOARD_ROWS; r++) {
            for (let c = 0; c < BOARD_COLS; c++) {
                const cell = board.getCell(boardCells, r, c);
                if (!cell) continue;

                const crystals = cell.querySelectorAll('.crystal');
                if (crystals.length <= 1) continue;

                // Remove extra crystals, keep the first one
                for (let i = 1; i < crystals.length; i++) {
                    crystals[i].remove();
                }
            }
        }
    }
};
