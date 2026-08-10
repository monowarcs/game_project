class 2playerPongGame {
    constructor(canvas, callbacks) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks;
        
        this.handleInput = this.handleInput.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        
        document.addEventListener('keydown', this.handleInput);
        document.addEventListener('keyup', this.handleKeyUp);
    }
    
    resetState() {
        this.paddleWidth = 15;
        this.paddleHeight = 100;
        this.paddleSpeed = 8;
        
        this.p1 = { x: 20, y: this.canvas.height/2 - this.paddleHeight/2, dy: 0, score: 0 };
        this.p2 = { x: this.canvas.width - 35, y: this.canvas.height/2 - this.paddleHeight/2, dy: 0, score: 0 };
        
        this.ball = { x: this.canvas.width/2, y: this.canvas.height/2, dx: 5, dy: 5, radius: 10, speed: 7 };
        
        this.isGameOver = false;
        this.isPaused = false;
        
        this.callbacks.onScoreUpdate(`${this.p1.score} - ${this.p2.score}`);
    }
    
    start() {
        this.resetState();
        this.animationId = requestAnimationFrame(() => this.loop());
    }
    
    restart() { this.start(); }
    togglePause() { this.isPaused = !this.isPaused; }
    
    handleInput(e) {
        if(this.isPaused || this.isGameOver) return;
        const key = e.key.toLowerCase();
        // P1
        if(key === 'w') this.p1.dy = -this.paddleSpeed;
        if(key === 's') this.p1.dy = this.paddleSpeed;
        // P2
        if(key === 'arrowup') this.p2.dy = -this.paddleSpeed;
        if(key === 'arrowdown') this.p2.dy = this.paddleSpeed;
    }
    
    handleKeyUp(e) {
        const key = e.key.toLowerCase();
        if(key === 'w' || key === 's') this.p1.dy = 0;
        if(key === 'arrowup' || key === 'arrowdown') this.p2.dy = 0;
    }
    
    resetBall(scorer) {
        this.ball.x = this.canvas.width/2;
        this.ball.y = this.canvas.height/2;
        this.ball.dx = scorer === 'p1' ? -this.ball.speed : this.ball.speed;
        this.ball.dy = (Math.random() * 2 - 1) * this.ball.speed;
    }
    
    loop() {
        if (!this.isPaused && !this.isGameOver) {
            this.update();
        }
        this.draw();
        if (!this.isGameOver) this.animationId = requestAnimationFrame(() => this.loop());
    }
    
    update() {
        // Move Paddles
        this.p1.y += this.p1.dy;
        if(this.p1.y < 0) this.p1.y = 0;
        if(this.p1.y + this.paddleHeight > this.canvas.height) this.p1.y = this.canvas.height - this.paddleHeight;
        
        this.p2.y += this.p2.dy;
        if(this.p2.y < 0) this.p2.y = 0;
        if(this.p2.y + this.paddleHeight > this.canvas.height) this.p2.y = this.canvas.height - this.paddleHeight;
        
        // Move Ball
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        
        // Wall Collision
        if(this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > this.canvas.height) {
            this.ball.dy *= -1;
        }
        
        // Paddle Collision
        let paddle = this.ball.dx < 0 ? this.p1 : this.p2;
        if (this.ball.x - this.ball.radius < paddle.x + this.paddleWidth && 
            this.ball.x + this.ball.radius > paddle.x &&
            this.ball.y + this.ball.radius > paddle.y && 
            this.ball.y - this.ball.radius < paddle.y + this.paddleHeight) {
            
            this.ball.dx *= -1;
            let hitPoint = (this.ball.y - (paddle.y + this.paddleHeight/2)) / (this.paddleHeight/2);
            let angle = hitPoint * (Math.PI/4);
            let direction = this.ball.dx > 0 ? 1 : -1;
            this.ball.dx = direction * this.ball.speed * Math.cos(angle);
            this.ball.dy = this.ball.speed * Math.sin(angle);
            this.ball.speed += 0.2;
        }
        
        // Scoring
        if(this.ball.x - this.ball.radius < 0) {
            this.p2.score++;
            this.callbacks.onScoreUpdate(`${this.p1.score} - ${this.p2.score}`);
            if(this.p2.score >= 10) this.gameOver();
            else this.resetBall('p2');
        } else if (this.ball.x + this.ball.radius > this.canvas.width) {
            this.p1.score++;
            this.callbacks.onScoreUpdate(`${this.p1.score} - ${this.p2.score}`);
            if(this.p1.score >= 10) this.gameOver();
            else this.resetBall('p1');
        }
    }
    
    draw() {
        this.ctx.fillStyle = '#0f111a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Center Line
        this.ctx.setLineDash([15, 15]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width/2, 0);
        this.ctx.lineTo(this.canvas.width/2, this.canvas.height);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.stroke();
        
        // Paddles
        this.ctx.fillStyle = '#00ffcc'; // P1
        this.ctx.fillRect(this.p1.x, this.p1.y, this.paddleWidth, this.paddleHeight);
        
        this.ctx.fillStyle = '#ff007f'; // P2
        this.ctx.fillRect(this.p2.x, this.p2.y, this.paddleWidth, this.paddleHeight);
        
        // Ball
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI*2);
        this.ctx.fillStyle = '#fff';
        this.ctx.fill();
        this.ctx.closePath();
    }
    
    gameOver() {
        this.isGameOver = true;
        this.callbacks.onGameOver(this.p1.score > this.p2.score ? "P1 Wins!" : "P2 Wins!");
    }
    
    cleanup() {
        cancelAnimationFrame(this.animationId);
        document.removeEventListener('keydown', this.handleInput);
        document.removeEventListener('keyup', this.handleKeyUp);
    }
}
window['2playerPongGame'] = 2playerPongGame;
