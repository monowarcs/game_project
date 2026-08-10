class 2playerTictactoeGame {
    constructor(canvas, callbacks) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks;
        
        this.handleClick = this.handleClick.bind(this);
        this.canvas.addEventListener('mousedown', this.handleClick);
        this.canvas.addEventListener('touchstart', this.handleClick, {passive: false});
    }
    
    resetState() {
        this.board = Array(9).fill(null);
        this.currentPlayer = 'X';
        this.p1Score = 0;
        this.p2Score = 0;
        this.isGameOver = false;
        
        this.cellSize = 150;
        this.offsetX = (this.canvas.width - (3*this.cellSize))/2;
        this.offsetY = (this.canvas.height - (3*this.cellSize))/2;
        
        this.callbacks.onScoreUpdate(`X: ${this.p1Score} - O: ${this.p2Score}`);
        this.draw();
    }
    
    start() { this.resetState(); }
    restart() {
        this.board = Array(9).fill(null);
        this.currentPlayer = 'X';
        this.isGameOver = false;
        this.draw();
    }
    togglePause() {}
    
    handleClick(e) {
        e.preventDefault();
        if(this.isGameOver) return;
        
        let rect = this.canvas.getBoundingClientRect();
        let clientX = e.clientX || (e.touches && e.touches[0].clientX);
        let clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        let x = clientX - rect.left;
        let y = clientY - rect.top;
        x = x * (this.canvas.width / rect.width);
        y = y * (this.canvas.height / rect.height);
        
        if (x > this.offsetX && x < this.offsetX + 3*this.cellSize &&
            y > this.offsetY && y < this.offsetY + 3*this.cellSize) {
            
            let col = Math.floor((x - this.offsetX) / this.cellSize);
            let row = Math.floor((y - this.offsetY) / this.cellSize);
            let idx = row * 3 + col;
            
            if(!this.board[idx]) {
                this.board[idx] = this.currentPlayer;
                this.checkWin();
                if(!this.isGameOver) {
                    this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
                }
                this.draw();
            }
        }
    }
    
    handleInput() {}
    handleMobileInput() {}
    
    checkWin() {
        const wins = [
            [0,1,2], [3,4,5], [6,7,8], // rows
            [0,3,6], [1,4,7], [2,5,8], // cols
            [0,4,8], [2,4,6]           // diag
        ];
        
        for(let w of wins) {
            if(this.board[w[0]] && this.board[w[0]] === this.board[w[1]] && this.board[w[0]] === this.board[w[2]]) {
                this.isGameOver = true;
                if(this.currentPlayer === 'X') this.p1Score++;
                else this.p2Score++;
                this.callbacks.onScoreUpdate(`X: ${this.p1Score} - O: ${this.p2Score}`);
                setTimeout(() => this.callbacks.onGameOver(`${this.currentPlayer} Wins Round!`), 1000);
                return;
            }
        }
        
        if(!this.board.includes(null)) {
            this.isGameOver = true;
            setTimeout(() => this.callbacks.onGameOver(`Draw!`), 1000);
        }
    }
    
    draw() {
        this.ctx.fillStyle = '#0f111a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 5;
        
        // Grid
        for(let i=1; i<3; i++) {
            // V lines
            this.ctx.beginPath();
            this.ctx.moveTo(this.offsetX + i*this.cellSize, this.offsetY);
            this.ctx.lineTo(this.offsetX + i*this.cellSize, this.offsetY + 3*this.cellSize);
            this.ctx.stroke();
            // H lines
            this.ctx.beginPath();
            this.ctx.moveTo(this.offsetX, this.offsetY + i*this.cellSize);
            this.ctx.lineTo(this.offsetX + 3*this.cellSize, this.offsetY + i*this.cellSize);
            this.ctx.stroke();
        }
        
        // Pieces
        for(let r=0; r<3; r++) {
            for(let c=0; c<3; c++) {
                let v = this.board[r*3 + c];
                let cx = this.offsetX + c*this.cellSize + this.cellSize/2;
                let cy = this.offsetY + r*this.cellSize + this.cellSize/2;
                let padding = 30;
                
                if(v === 'X') {
                    this.ctx.strokeStyle = '#00ffcc';
                    this.ctx.beginPath();
                    this.ctx.moveTo(cx - this.cellSize/2 + padding, cy - this.cellSize/2 + padding);
                    this.ctx.lineTo(cx + this.cellSize/2 - padding, cy + this.cellSize/2 - padding);
                    this.ctx.stroke();
                    this.ctx.beginPath();
                    this.ctx.moveTo(cx + this.cellSize/2 - padding, cy - this.cellSize/2 + padding);
                    this.ctx.lineTo(cx - this.cellSize/2 + padding, cy + this.cellSize/2 - padding);
                    this.ctx.stroke();
                } else if (v === 'O') {
                    this.ctx.strokeStyle = '#ff007f';
                    this.ctx.beginPath();
                    this.ctx.arc(cx, cy, this.cellSize/2 - padding, 0, Math.PI*2);
                    this.ctx.stroke();
                }
            }
        }
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Outfit';
        this.ctx.fillText(`${this.currentPlayer}'s Turn`, 20, 40);
    }
    
    cleanup() {
        this.canvas.removeEventListener('mousedown', this.handleClick);
        this.canvas.removeEventListener('touchstart', this.handleClick);
    }
}
window['2playerTictactoeGame'] = 2playerTictactoeGame;
