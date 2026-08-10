class TreasureHunterGame {
    constructor(canvas, callbacks) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks;
        this.tileSize = 40;
        
        this.handleInput = this.handleInput.bind(this);
        document.addEventListener('keydown', this.handleInput);
    }
    
    resetState() {
        this.cols = this.canvas.width / this.tileSize;
        this.rows = this.canvas.height / this.tileSize;
        this.player = { x: 1, y: 1 };
        
        this.score = 0;
        this.level = 1;
        this.isGameOver = false;
        
        this.generateMaze();
        this.callbacks.onScoreUpdate(this.score);
        this.draw();
    }
    
    generateMaze() {
        this.map = Array.from({length: this.rows}, () => Array(this.cols).fill(1)); // 1 = wall
        
        // Simple carving
        for(let r=1; r<this.rows-1; r++) {
            for(let c=1; c<this.cols-1; c++) {
                if(Math.random() > 0.3) {
                    this.map[r][c] = 0; // path
                }
            }
        }
        
        // Ensure path around edges somewhat
        for(let c=1; c<this.cols-1; c++) { this.map[1][c] = 0; this.map[this.rows-2][c] = 0; }
        for(let r=1; r<this.rows-1; r++) { this.map[r][1] = 0; this.map[r][this.cols-2] = 0; }
        
        // Place traps (2)
        for(let i=0; i<this.level*2; i++) {
            this.map[Math.floor(Math.random()*(this.rows-2))+1][Math.floor(Math.random()*(this.cols-2))+1] = 2;
        }
        
        // Place coins (3)
        for(let i=0; i<10; i++) {
            this.map[Math.floor(Math.random()*(this.rows-2))+1][Math.floor(Math.random()*(this.cols-2))+1] = 3;
        }
        
        // Place Treasure (4)
        this.map[this.rows-2][this.cols-2] = 4;
        this.map[this.rows-2][this.cols-3] = 0; // ensure access
    }
    
    start() {
        this.resetState();
    }
    
    restart() { this.start(); }
    togglePause() {}
    
    handleInput(e) {
        if(this.isGameOver) return;
        let dx = 0, dy = 0;
        if(e.key === 'ArrowUp' || e.key === 'w') dy = -1;
        if(e.key === 'ArrowDown' || e.key === 's') dy = 1;
        if(e.key === 'ArrowLeft' || e.key === 'a') dx = -1;
        if(e.key === 'ArrowRight' || e.key === 'd') dx = 1;
        
        if(dx !== 0 || dy !== 0) this.move(dx, dy);
    }
    
    handleMobileInput(btnId, isPressed) {
        if(!isPressed || this.isGameOver) return;
        let dx = 0, dy = 0;
        if(btnId === 'up') dy = -1;
        if(btnId === 'down') dy = 1;
        if(btnId === 'left') dx = -1;
        if(btnId === 'right') dx = 1;
        if(dx !== 0 || dy !== 0) this.move(dx, dy);
    }
    
    move(dx, dy) {
        let nr = this.player.y + dy;
        let nc = this.player.x + dx;
        
        if(nr<0 || nc<0 || nr>=this.rows || nc>=this.cols) return;
        
        let cell = this.map[nr][nc];
        
        if(cell === 1) return; // Wall
        
        this.player.y = nr;
        this.player.x = nc;
        
        if(cell === 2) { // Trap
            this.gameOver();
            return;
        } else if (cell === 3) { // Coin
            this.score += 50;
            this.map[nr][nc] = 0;
            this.callbacks.onScoreUpdate(this.score);
        } else if (cell === 4) { // Treasure
            this.score += 500;
            this.level++;
            this.callbacks.onScoreUpdate(this.score);
            this.player.x = 1;
            this.player.y = 1;
            this.generateMaze();
        }
        
        this.draw();
    }
    
    draw() {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        for(let r=0; r<this.rows; r++) {
            for(let c=0; c<this.cols; c++) {
                let v = this.map[r][c];
                let x = c*this.tileSize;
                let y = r*this.tileSize;
                
                if(v === 1) { // Wall
                    this.ctx.fillStyle = '#444';
                    this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
                } else if (v === 2) { // Trap (Hidden until near)
                    let dist = Math.abs(r-this.player.y) + Math.abs(c-this.player.x);
                    if(dist <= 2) {
                        this.ctx.fillStyle = '#ff0000';
                        this.ctx.fillRect(x+10, y+10, 20, 20);
                    }
                } else if (v === 3) { // Coin
                    this.ctx.fillStyle = '#ffd700';
                    this.ctx.beginPath();
                    this.ctx.arc(x+20, y+20, 8, 0, Math.PI*2);
                    this.ctx.fill();
                } else if (v === 4) { // Treasure
                    this.ctx.fillStyle = '#00ffcc';
                    this.ctx.fillRect(x+5, y+5, 30, 30);
                }
            }
        }
        
        // Player
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x*this.tileSize+20, this.player.y*this.tileSize+20, 12, 0, Math.PI*2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Outfit';
        this.ctx.fillText(`Level: ${this.level}`, 10, 20);
    }
    
    gameOver() {
        this.isGameOver = true;
        this.callbacks.onGameOver(this.score);
    }
    
    cleanup() {
        document.removeEventListener('keydown', this.handleInput);
    }
}
window.TreasureHunterGame = TreasureHunterGame;
