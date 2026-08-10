class 2048Game {
    constructor(canvas, callbacks) {
        // Renamed internally because classes can't start with a number in JS cleanly sometimes, 
        // but window mapping will look for '2048Game'. Actually, let's name it Game2048 
        // and fix mapping in app.js or attach it directly.
        // The mapping does: '2048' -> '2048Game'. 
        // Wait, window['2048Game'] = class {} is perfectly valid.
        
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks;
        
        this.size = 4;
        this.grid = [];
        this.tileSize = 100;
        this.padding = 15;
        this.boardSize = this.size * this.tileSize + (this.size + 1) * this.padding;
        this.offsetX = (this.canvas.width - this.boardSize) / 2;
        this.offsetY = (this.canvas.height - this.boardSize) / 2;
        
        this.colors = {
            0: '#2c3040',
            2: '#00ffcc',
            4: '#00e6b8',
            8: '#00b38f',
            16: '#ff007f',
            32: '#e60073',
            64: '#b30059',
            128: '#6b21a8',
            256: '#5c1c91',
            512: '#ffd700',
            1024: '#e6c200',
            2048: '#ff4500'
        };
        
        this.handleInput = this.handleInput.bind(this);
        document.addEventListener('keydown', this.handleInput);
    }
    
    resetState() {
        this.grid = Array.from({length: this.size}, () => Array(this.size).fill(0));
        this.score = 0;
        this.isGameOver = false;
        
        this.addRandomTile();
        this.addRandomTile();
        
        this.callbacks.onScoreUpdate(this.score);
        this.draw(); // 2048 is turn-based, no animation loop needed unless for smooth sliding
    }
    
    addRandomTile() {
        let empty = [];
        for(let r=0; r<this.size; r++) {
            for(let c=0; c<this.size; c++) {
                if(this.grid[r][c] === 0) empty.push({r, c});
            }
        }
        if(empty.length > 0) {
            let pos = empty[Math.floor(Math.random() * empty.length)];
            this.grid[pos.r][pos.c] = Math.random() < 0.9 ? 2 : 4;
        }
    }
    
    start() {
        this.resetState();
    }
    
    restart() {
        this.start();
    }
    
    togglePause() {
        // Turn based, pause doesn't really mean much except blocking input
    }
    
    handleInput(e) {
        if(this.isGameOver) return;
        
        let moved = false;
        switch(e.key) {
            case 'ArrowUp': case 'w': moved = this.moveUp(); break;
            case 'ArrowDown': case 's': moved = this.moveDown(); break;
            case 'ArrowLeft': case 'a': moved = this.moveLeft(); break;
            case 'ArrowRight': case 'd': moved = this.moveRight(); break;
        }
        
        if(moved) {
            this.addRandomTile();
            this.draw();
            this.checkGameOver();
        }
    }
    
    handleMobileInput(btnId, isPressed) {
        if(!isPressed || this.isGameOver) return;
        
        let moved = false;
        switch(btnId) {
            case 'up': moved = this.moveUp(); break;
            case 'down': moved = this.moveDown(); break;
            case 'left': moved = this.moveLeft(); break;
            case 'right': moved = this.moveRight(); break;
        }
        
        if(moved) {
            this.addRandomTile();
            this.draw();
            this.checkGameOver();
        }
    }
    
    slide(row) {
        let arr = row.filter(val => val);
        let missing = this.size - arr.length;
        let zeros = Array(missing).fill(0);
        return arr.concat(zeros);
    }
    
    combine(row) {
        for(let i=0; i<this.size-1; i++) {
            if(row[i] !== 0 && row[i] === row[i+1]) {
                row[i] *= 2;
                row[i+1] = 0;
                this.score += row[i];
            }
        }
        return row;
    }
    
    operate(row) {
        row = this.slide(row);
        row = this.combine(row);
        row = this.slide(row);
        return row;
    }
    
    moveLeft() {
        let oldGrid = JSON.stringify(this.grid);
        for(let i=0; i<this.size; i++) {
            this.grid[i] = this.operate(this.grid[i]);
        }
        this.callbacks.onScoreUpdate(this.score);
        return oldGrid !== JSON.stringify(this.grid);
    }
    
    moveRight() {
        let oldGrid = JSON.stringify(this.grid);
        for(let i=0; i<this.size; i++) {
            let row = this.grid[i].slice().reverse();
            row = this.operate(row);
            this.grid[i] = row.reverse();
        }
        this.callbacks.onScoreUpdate(this.score);
        return oldGrid !== JSON.stringify(this.grid);
    }
    
    moveUp() {
        let oldGrid = JSON.stringify(this.grid);
        for(let c=0; c<this.size; c++) {
            let col = [this.grid[0][c], this.grid[1][c], this.grid[2][c], this.grid[3][c]];
            col = this.operate(col);
            for(let r=0; r<this.size; r++) {
                this.grid[r][c] = col[r];
            }
        }
        this.callbacks.onScoreUpdate(this.score);
        return oldGrid !== JSON.stringify(this.grid);
    }
    
    moveDown() {
        let oldGrid = JSON.stringify(this.grid);
        for(let c=0; c<this.size; c++) {
            let col = [this.grid[0][c], this.grid[1][c], this.grid[2][c], this.grid[3][c]].reverse();
            col = this.operate(col);
            col.reverse();
            for(let r=0; r<this.size; r++) {
                this.grid[r][c] = col[r];
            }
        }
        this.callbacks.onScoreUpdate(this.score);
        return oldGrid !== JSON.stringify(this.grid);
    }
    
    checkGameOver() {
        // Any empty spaces?
        for(let r=0; r<this.size; r++) {
            for(let c=0; c<this.size; c++) {
                if(this.grid[r][c] === 0) return; // Not over
            }
        }
        // Any possible merges?
        for(let r=0; r<this.size; r++) {
            for(let c=0; c<this.size; c++) {
                let current = this.grid[r][c];
                if(r !== this.size -1 && current === this.grid[r+1][c]) return;
                if(c !== this.size -1 && current === this.grid[r][c+1]) return;
            }
        }
        // If we get here, it's over
        this.isGameOver = true;
        this.callbacks.onGameOver(this.score);
    }
    
    draw() {
        this.ctx.fillStyle = '#0f111a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw Board Background
        this.ctx.fillStyle = '#1c1f2e';
        this.ctx.beginPath();
        this.ctx.roundRect(this.offsetX, this.offsetY, this.boardSize, this.boardSize, 10);
        this.ctx.fill();
        
        for(let r=0; r<this.size; r++) {
            for(let c=0; c<this.size; c++) {
                let val = this.grid[r][c];
                let x = this.offsetX + this.padding + c * (this.tileSize + this.padding);
                let y = this.offsetY + this.padding + r * (this.tileSize + this.padding);
                
                this.ctx.fillStyle = this.colors[val] || '#ff4500';
                this.ctx.beginPath();
                this.ctx.roundRect(x, y, this.tileSize, this.tileSize, 8);
                this.ctx.fill();
                
                if (val !== 0) {
                    this.ctx.fillStyle = val > 4 ? '#fff' : '#000';
                    this.ctx.font = 'bold 40px Outfit';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(val, x + this.tileSize/2, y + this.tileSize/2);
                }
            }
        }
    }
    
    cleanup() {
        document.removeEventListener('keydown', this.handleInput);
    }
}

window['2048Game'] = 2048Game;
