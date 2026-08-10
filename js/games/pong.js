class PongGame {
    constructor(canvas, callbacks) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks;
        
        this.resetState();
        
        this.handleInput = this.handleInput.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        
        document.addEventListener('keydown', this.handleInput);
        document.addEventListener('keyup', this.handleKeyUp);
    }
    
    resetState() {
        this.paddleWidth = 15;
        this.paddleHeight = 100;
        this.paddleSpeed = 8;
        
        this.player = { x: 20, y: this.canvas.height/2 - this.paddleHeight/2, dy: 0 };
        this.ai = { x: this.canvas.width - 35, y: this.canvas.height/2 - this.paddleHeight/2, dy: 0, speed: 5 };
        
        this.ball = { x: this.canvas.width/2, y: this.canvas.height/2, dx: 5, dy: 5, radius: 10, speed: 7 };
        
        this.score = 0;
        this.aiScore = 0; // Just for internal logic, only player score saved
        this.isGameOver = false;
        this.isPaused = false;
        
        this.callbacks.onScoreUpdate(this.score);
    }
    
    start() {
        this.resetState();
        this.animationId = requestAnimationFrame(() => this.loop());
    }
    
    restart() {
        this.start();
    }
    
    togglePause() {
        if(this.isGameOver) return;
        this.isPaused = !this.isPaused;
    }
    
    handleInput(e) {
        if(this.isPaused || this.isGameOver) return;
        const key = e.key.toLowerCase();
        if(key === 'w' || key === 'arrowup') this.player.dy = -this.paddleSpeed;
        if(key === 's' || key === 'arrowdown') this.player.dy = this.paddleSpeed;
    }
    
    handleKeyUp(e) {
        const key = e.key.toLowerCase();
        if(key === 'w' || key === 'arrowup' || key === 's' || key === 'arrowdown') {
            this.player.dy = 0;
        }
    }
    
    handleMobileInput(btnId, isPressed) {
        if(!isPressed) {
            this.player.dy = 0;
            return;
        }
        if(btnId === 'up') this.player.dy = -this.paddleSpeed;
        if(btnId === 'down') this.player.dy = this.paddleSpeed;
    }
    
    resetBall(scorer) {
        this.ball.x = this.canvas.width/2;
        this.ball.y = this.canvas.height/2;
        this.ball.dx = scorer === 'player' ? -this.ball.speed : this.ball.speed;
        this.ball.dy = (Math.random() * 2 - 1) * this.ball.speed;
    }
    
    loop() {
        if (!this.isPaused && !this.isGameOver) {
            this.update();
        }
        this.draw();
        
        if (!this.isGameOver) {
            this.animationId = requestAnimationFrame(() => this.loop());
        }
    }
    
    update() {
        // Move Player
        this.player.y += this.player.dy;
        if(this.player.y < 0) this.player.y = 0;
        if(this.player.y + this.paddleHeight > this.canvas.height) this.player.y = this.canvas.height - this.paddleHeight;
        
        // Move AI (Simple tracking)
        if (this.ai.y + this.paddleHeight/2 < this.ball.y - 10) {
            this.ai.y += this.ai.speed;
        } else if (this.ai.y + this.paddleHeight/2 > this.ball.y + 10) {
            this.ai.y -= this.ai.speed;
        }
        
        if(this.ai.y < 0) this.ai.y = 0;
        if(this.ai.y + this.paddleHeight > this.canvas.height) this.ai.y = this.canvas.height - this.paddleHeight;
        
        // Move Ball
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        
        // Wall Collision (Top/Bottom)
        if(this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > this.canvas.height) {
            this.ball.dy *= -1;
        }
        
        // Paddle Collision logic
        let paddle = this.ball.dx < 0 ? this.player : this.ai;
        if (this.ball.x - this.ball.radius < paddle.x + this.paddleWidth && 
            this.ball.x + this.ball.radius > paddle.x &&
            this.ball.y + this.ball.radius > paddle.y && 
            this.ball.y - this.ball.radius < paddle.y + this.paddleHeight) {
            
            this.ball.dx *= -1;
            
            // Adjust angle based on where it hit the paddle
            let hitPoint = (this.ball.y - (paddle.y + this.paddleHeight/2));
            hitPoint = hitPoint / (this.paddleHeight/2);
            let angle = hitPoint * (Math.PI/4); // Max 45 degree bounce
            
            let direction = this.ball.dx > 0 ? 1 : -1;
            this.ball.dx = direction * this.ball.speed * Math.cos(angle);
            this.ball.dy = this.ball.speed * Math.sin(angle);
            
            // Increase speed slightly
            this.ball.speed += 0.2;
            
            if(paddle === this.player) {
                this.score++;
                this.callbacks.onScoreUpdate(this.score);
            }
        }
        
        // Scoring (Past left/right walls)
        if(this.ball.x - this.ball.radius < 0) {
            // AI scored
            this.gameOver(); // Ends game for player
        } else if (this.ball.x + this.ball.radius > this.canvas.width) {
            // Player scored past AI
            this.score += 5; // Bonus points for getting it past AI
            this.callbacks.onScoreUpdate(this.score);
            this.resetBall('player');
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
        this.ctx.fillStyle = '#00ffcc';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#00ffcc';
        this.ctx.fillRect(this.player.x, this.player.y, this.paddleWidth, this.paddleHeight);
        
        this.ctx.fillStyle = '#ff007f';
        this.ctx.shadowColor = '#ff007f';
        this.ctx.fillRect(this.ai.x, this.ai.y, this.paddleWidth, this.paddleHeight);
        
        // Ball
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI*2);
        this.ctx.fillStyle = '#fff';
        this.ctx.shadowColor = '#fff';
        this.ctx.fill();
        this.ctx.closePath();
        
        this.ctx.shadowBlur = 0;
    }
    
    gameOver() {
        this.isGameOver = true;
        this.callbacks.onGameOver(this.score);
    }
    
    cleanup() {
        cancelAnimationFrame(this.animationId);
        document.removeEventListener('keydown', this.handleInput);
        document.removeEventListener('keyup', this.handleKeyUp);
    }
}

window.PongGame = PongGame;
