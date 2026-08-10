class DungeonEscapeGame {
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
        this.timeLeft = 60; // 60 seconds to escape
        this.keys = 0;
        this.isGameOver = false;
        
        this.generateMap();
        this.callbacks.onScoreUpdate(this.score);
        this.draw();
    }
    
    generateMap() {
        // 0: path, 1: wall, 2: key, 3: locked door
        this.map = Array.from({length: this.rows}, () => Array(this.cols).fill(1));
        
        for(let r=1; r<this.rows-1; r++) {
            for(let c=1; c<this.cols-1; c++) {
                if(Math.random() > 0.25) this.map[r][c] = 0;
            }
        }
        
        // Spawn 3 keys
        for(let i=0; i<3; i++) {
            this.map[Math.floor(Math.random()*(this.rows-2))+1][Math.floor(Math.random()*(this.cols-2))+1] = 2;
        }
        
        // Exit Door
        this.map[this.rows-2][this.cols-2] = 3;
    }
    
    start() {
        this.resetState();
        this.timerInterval = setInterval(() => {
            if(!this.isGameOver) {
                this.timeLeft--;
                this.draw();
                if(this.timeLeft <= 0) this.gameOver();
            }
        }, 1000);
    }
    
    restart() { 
        clearInterval(this.timerInterval);
        this.start(); 
    }
    
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
        
        if(cell === 3) {
            if(this.keys >= 3) {
                // Escaped
                this.score += 1000 + (this.timeLeft * 10);
                this.level++;
                this.keys = 0;
                this.timeLeft = Math.max(30, 60 - (this.level*5));
                this.callbacks.onScoreUpdate(this.score);
                this.player.x = 1; this.player.y = 1;
                this.generateMap();
            }
            return;
        }
        
        this.player.x = nc;
        this.player.y = nr;
        
        if(cell === 2) {
            this.keys++;
            this.score += 100;
            this.map[nr][nc] = 0;
            this.callbacks.onScoreUpdate(this.score);
        }
        
        this.draw();
    }
    
    draw() {
        this.ctx.fillStyle = '#0f111a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        for(let r=0; r<this.rows; r++) {
            for(let c=0; c<this.cols; c++) {
                let v = this.map[r][c];
                let x = c*this.tileSize;
                let y = r*this.tileSize;
                
                if(v === 1) { // Wall
                    this.ctx.fillStyle = '#1c1f2e';
                    this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
                } else if (v === 2) { // Key
                    this.ctx.fillStyle = '#ffd700';
                    this.ctx.beginPath();
                    this.ctx.arc(x+20, y+20, 8, 0, Math.PI*2);
                    this.ctx.fill();
                } else if (v === 3) { // Door
                    this.ctx.fillStyle = this.keys >= 3 ? '#00ffcc' : '#ff4757';
                    this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
                }
            }
        }
        
        // Player
        this.ctx.fillStyle = '#ff007f';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x*this.tileSize+20, this.player.y*this.tileSize+20, 12, 0, Math.PI*2);
        this.ctx.fill();
        
        // HUD
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '18px Outfit';
        this.ctx.fillText(`Time: ${this.timeLeft}s | Keys: ${this.keys}/3 | Lvl: ${this.level}`, 10, 25);
    }
    
    gameOver() {
        this.isGameOver = true;
        clearInterval(this.timerInterval);
        this.callbacks.onGameOver(this.score);
    }
    
    cleanup() {
        clearInterval(this.timerInterval);
        document.removeEventListener('keydown', this.handleInput);
    }
}
window.DungeonEscapeGame = DungeonEscapeGame;
