class TetrisGame {
    constructor(canvas, callbacks) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks;
        
        // Logical grid
        this.cols = 10;
        this.rows = 20;
        this.blockSize = 25; // 10 * 25 = 250px wide
        this.offsetX = (this.canvas.width - (this.cols * this.blockSize)) / 2;
        this.offsetY = (this.canvas.height - (this.rows * this.blockSize)) / 2;
        
        this.colors = [
            null,
            '#00ffff', // I
            '#0000ff', // J
            '#ffa500', // L
            '#ffff00', // O
            '#00ff00', // S
            '#800080', // T
            '#ff0000'  // Z
        ];
        
        this.pieces = [
            [],
            [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], // I
            [[2,0,0], [2,2,2], [0,0,0]], // J
            [[0,0,3], [3,3,3], [0,0,0]], // L
            [[4,4], [4,4]], // O
            [[0,5,5], [5,5,0], [0,0,0]], // S
            [[0,6,0], [6,6,6], [0,0,0]], // T
            [[7,7,0], [0,7,7], [0,0,0]]  // Z
        ];
        
        this.handleInput = this.handleInput.bind(this);
        document.addEventListener('keydown', this.handleInput);
    }
    
    resetState() {
        this.grid = Array.from({length: this.rows}, () => Array(this.cols).fill(0));
        this.score = 0;
        this.isGameOver = false;
        this.isPaused = false;
        
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;
        
        this.spawnPiece();
        this.callbacks.onScoreUpdate(this.score);
    }
    
    spawnPiece() {
        const typeId = Math.floor(Math.random() * 7) + 1;
        this.player = {
            pos: {x: 3, y: 0},
            matrix: this.pieces[typeId]
        };
        
        if (this.collide(this.grid, this.player)) {
            this.gameOver();
        }
    }
    
    start() {
        this.resetState();
        this.animationId = requestAnimationFrame((t) => this.loop(t));
    }
    
    restart() {
        this.start();
    }
    
    togglePause() {
        if(this.isGameOver) return;
        this.isPaused = !this.isPaused;
        if(!this.isPaused) {
            this.lastTime = performance.now();
            this.animationId = requestAnimationFrame((t) => this.loop(t));
        }
    }
    
    handleInput(e) {
        if(this.isPaused || this.isGameOver) return;
        if(e.key === 'ArrowLeft' || e.key === 'a') this.move(-1);
        if(e.key === 'ArrowRight' || e.key === 'd') this.move(1);
        if(e.key === 'ArrowDown' || e.key === 's') this.drop();
        if(e.key === 'ArrowUp' || e.key === 'w') this.rotate(1);
    }
    
    handleMobileInput(btnId, isPressed) {
        if(!isPressed || this.isPaused || this.isGameOver) return;
        if(btnId === 'left') this.move(-1);
        if(btnId === 'right') this.move(1);
        if(btnId === 'down') this.drop();
        if(btnId === 'a' || btnId === 'up') this.rotate(1);
    }
    
    move(dir) {
        this.player.pos.x += dir;
        if (this.collide(this.grid, this.player)) {
            this.player.pos.x -= dir;
        }
    }
    
    drop() {
        this.player.pos.y++;
        if (this.collide(this.grid, this.player)) {
            this.player.pos.y--;
            this.merge(this.grid, this.player);
            this.spawnPiece();
            this.clearLines();
        }
        this.dropCounter = 0;
    }
    
    rotate(dir) {
        const pos = this.player.pos.x;
        let offset = 1;
        this.rotateMatrix(this.player.matrix, dir);
        while (this.collide(this.grid, this.player)) {
            this.player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > this.player.matrix[0].length) {
                this.rotateMatrix(this.player.matrix, -dir); // Undo rotate
                this.player.pos.x = pos;
                return;
            }
        }
    }
    
    rotateMatrix(matrix, dir) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
            }
        }
        if (dir > 0) {
            matrix.forEach(row => row.reverse());
        } else {
            matrix.reverse();
        }
    }
    
    collide(grid, player) {
        const m = player.matrix;
        const o = player.pos;
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 && (grid[y + o.y] && grid[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }
    
    merge(grid, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    grid[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    }
    
    clearLines() {
        let rowCount = 1;
        outer: for (let y = this.grid.length -1; y >= 0; --y) {
            for (let x = 0; x < this.grid[y].length; ++x) {
                if (this.grid[y][x] === 0) {
                    continue outer;
                }
            }
            const row = this.grid.splice(y, 1)[0].fill(0);
            this.grid.unshift(row);
            ++y;
            this.score += rowCount * 100;
            rowCount *= 2;
        }
        this.callbacks.onScoreUpdate(this.score);
        this.dropInterval = Math.max(100, 1000 - (this.score / 10));
    }
    
    loop(time = 0) {
        if (this.isPaused || this.isGameOver) return;
        
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        
        this.dropCounter += deltaTime;
        if (this.dropCounter > this.dropInterval) {
            this.drop();
        }
        
        this.draw();
        this.animationId = requestAnimationFrame((t) => this.loop(t));
    }
    
    drawMatrix(matrix, offset) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    this.ctx.fillStyle = this.colors[value];
                    this.ctx.fillRect(
                        this.offsetX + (x + offset.x) * this.blockSize,
                        this.offsetY + (y + offset.y) * this.blockSize,
                        this.blockSize - 1, 
                        this.blockSize - 1
                    );
                }
            });
        });
    }
    
    draw() {
        this.ctx.fillStyle = '#0f111a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw Play Area Border
        this.ctx.strokeStyle = '#333';
        this.ctx.strokeRect(this.offsetX - 2, this.offsetY - 2, (this.cols * this.blockSize) + 4, (this.rows * this.blockSize) + 4);
        
        this.drawMatrix(this.grid, {x: 0, y: 0});
        this.drawMatrix(this.player.matrix, this.player.pos);
    }
    
    gameOver() {
        this.isGameOver = true;
        this.callbacks.onGameOver(this.score);
    }
    
    cleanup() {
        cancelAnimationFrame(this.animationId);
        document.removeEventListener('keydown', this.handleInput);
    }
}

window.TetrisGame = TetrisGame;
