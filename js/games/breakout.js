class BreakoutGame {
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
        this.paddle = { x: this.canvas.width/2 - 50, y: this.canvas.height - 30, width: 100, height: 15, dx: 0, speed: 8 };
        this.ball = { x: this.canvas.width/2, y: this.canvas.height - 50, dx: 4, dy: -4, radius: 8 };
        
        this.brickRowCount = 5;
        this.brickColumnCount = 8;
        this.brickWidth = 80;
        this.brickHeight = 25;
        this.brickPadding = 15;
        this.brickOffsetTop = 50;
        this.brickOffsetLeft = 30;
        
        this.bricks = [];
        for(let c=0; c<this.brickColumnCount; c++) {
            this.bricks[c] = [];
            for(let r=0; r<this.brickRowCount; r++) {
                this.bricks[c][r] = { x: 0, y: 0, status: 1 };
            }
        }
        
        this.score = 0;
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
        if(e.key === 'ArrowRight' || e.key === 'd') this.paddle.dx = this.paddle.speed;
        if(e.key === 'ArrowLeft' || e.key === 'a') this.paddle.dx = -this.paddle.speed;
    }
    
    handleKeyUp(e) {
        if(e.key === 'ArrowRight' || e.key === 'd' || e.key === 'ArrowLeft' || e.key === 'a') {
            this.paddle.dx = 0;
        }
    }
    
    handleMobileInput(btnId, isPressed) {
        if(!isPressed) {
            this.paddle.dx = 0;
            return;
        }
        if(btnId === 'right') this.paddle.dx = this.paddle.speed;
        if(btnId === 'left') this.paddle.dx = -this.paddle.speed;
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
        // Move Paddle
        this.paddle.x += this.paddle.dx;
        if (this.paddle.x < 0) this.paddle.x = 0;
        if (this.paddle.x + this.paddle.width > this.canvas.width) this.paddle.x = this.canvas.width - this.paddle.width;
        
        // Move Ball
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        
        // Wall Collision
        if(this.ball.x + this.ball.dx > this.canvas.width - this.ball.radius || this.ball.x + this.ball.dx < this.ball.radius) {
            this.ball.dx = -this.ball.dx;
        }
        if(this.ball.y + this.ball.dy < this.ball.radius) {
            this.ball.dy = -this.ball.dy;
        } else if (this.ball.y + this.ball.dy > this.canvas.height - this.ball.radius) {
            this.gameOver();
        }
        
        // Paddle Collision
        if (this.ball.y + this.ball.radius > this.paddle.y && 
            this.ball.x > this.paddle.x && 
            this.ball.x < this.paddle.x + this.paddle.width) {
            this.ball.dy = -this.ball.dy;
            // Add some english
            let hitPoint = this.ball.x - (this.paddle.x + this.paddle.width/2);
            this.ball.dx = hitPoint * 0.15;
        }
        
        // Brick Collision
        let bricksLeft = 0;
        for(let c=0; c<this.brickColumnCount; c++) {
            for(let r=0; r<this.brickRowCount; r++) {
                let b = this.bricks[c][r];
                if(b.status === 1) {
                    bricksLeft++;
                    if(this.ball.x > b.x && this.ball.x < b.x + this.brickWidth && 
                       this.ball.y > b.y && this.ball.y < b.y + this.brickHeight) {
                        this.ball.dy = -this.ball.dy;
                        b.status = 0;
                        this.score += 10;
                        this.callbacks.onScoreUpdate(this.score);
                    }
                }
            }
        }
        
        // Win Condition (Reset bricks for endless mode)
        if(bricksLeft === 0) {
            for(let c=0; c<this.brickColumnCount; c++) {
                for(let r=0; r<this.brickRowCount; r++) {
                    this.bricks[c][r].status = 1;
                }
            }
            this.ball.dx *= 1.1; // Increase speed slightly
            this.ball.dy *= 1.1;
        }
    }
    
    draw() {
        this.ctx.fillStyle = '#0f111a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if(this.isGameOver) return;
        
        // Draw Bricks
        this.ctx.shadowBlur = 5;
        for(let c=0; c<this.brickColumnCount; c++) {
            for(let r=0; r<this.brickRowCount; r++) {
                if(this.bricks[c][r].status === 1) {
                    let brickX = (c * (this.brickWidth + this.brickPadding)) + this.brickOffsetLeft;
                    let brickY = (r * (this.brickHeight + this.brickPadding)) + this.brickOffsetTop;
                    this.bricks[c][r].x = brickX;
                    this.bricks[c][r].y = brickY;
                    
                    // Gradient based on row
                    this.ctx.fillStyle = r % 2 === 0 ? '#00ffcc' : '#6b21a8';
                    this.ctx.shadowColor = this.ctx.fillStyle;
                    
                    this.ctx.fillRect(brickX, brickY, this.brickWidth, this.brickHeight);
                }
            }
        }
        this.ctx.shadowBlur = 0;
        
        // Draw Paddle
        this.ctx.fillStyle = '#ff007f';
        this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
        
        // Draw Ball
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI*2);
        this.ctx.fillStyle = '#fff';
        this.ctx.fill();
        this.ctx.closePath();
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

window.BreakoutGame = BreakoutGame;
