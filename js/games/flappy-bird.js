class FlappyBirdGame {
    constructor(canvas, callbacks) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks;
        
        this.resetState();
        
        this.handleInput = this.handleInput.bind(this);
        document.addEventListener('keydown', this.handleInput);
    }
    
    resetState() {
        this.bird = { x: 150, y: 300, velocity: 0, radius: 15 };
        this.gravity = 0.5;
        this.jump = -8;
        
        this.pipes = [];
        this.pipeWidth = 60;
        this.pipeGap = 150;
        this.pipeSpeed = 3;
        this.frameCount = 0;
        
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
        if(e.code === 'Space' || e.type === 'mousedown' || e.type === 'touchstart') {
            if(!this.isPaused && !this.isGameOver) {
                this.bird.velocity = this.jump;
            }
        }
    }
    
    handleMobileInput(btnId, isPressed) {
        if(isPressed && !this.isPaused && !this.isGameOver && btnId === 'a') {
             this.bird.velocity = this.jump;
        }
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
        this.frameCount++;
        
        // Bird Physics
        this.bird.velocity += this.gravity;
        this.bird.y += this.bird.velocity;
        
        // Spawn Pipes
        if (this.frameCount % 90 === 0) {
            const minHeight = 50;
            const maxHeight = this.canvas.height - this.pipeGap - minHeight;
            const height = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
            
            this.pipes.push({
                x: this.canvas.width,
                topHeight: height,
                passed: false
            });
        }
        
        // Move Pipes & Check Collision
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            let p = this.pipes[i];
            p.x -= this.pipeSpeed;
            
            // Collision
            let hitTop = this.bird.x + this.bird.radius > p.x && this.bird.x - this.bird.radius < p.x + this.pipeWidth && this.bird.y - this.bird.radius < p.topHeight;
            let hitBottom = this.bird.x + this.bird.radius > p.x && this.bird.x - this.bird.radius < p.x + this.pipeWidth && this.bird.y + this.bird.radius > p.topHeight + this.pipeGap;
            
            if (hitTop || hitBottom) {
                this.gameOver();
            }
            
            // Score
            if (p.x + this.pipeWidth < this.bird.x && !p.passed) {
                this.score++;
                this.callbacks.onScoreUpdate(this.score);
                p.passed = true;
            }
            
            // Remove off-screen pipes
            if (p.x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
            }
        }
        
        // Ground / Ceiling Collision
        if (this.bird.y + this.bird.radius >= this.canvas.height || this.bird.y - this.bird.radius <= 0) {
            this.gameOver();
        }
    }
    
    draw() {
        this.ctx.fillStyle = '#0f111a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if(this.isGameOver) return;
        
        // Draw Pipes
        this.ctx.fillStyle = '#00ffcc';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#00ffcc';
        
        this.pipes.forEach(p => {
            // Top Pipe
            this.ctx.fillRect(p.x, 0, this.pipeWidth, p.topHeight);
            // Bottom Pipe
            this.ctx.fillRect(p.x, p.topHeight + this.pipeGap, this.pipeWidth, this.canvas.height - (p.topHeight + this.pipeGap));
        });
        
        this.ctx.shadowBlur = 0;
        
        // Draw Bird
        this.ctx.beginPath();
        this.ctx.arc(this.bird.x, this.bird.y, this.bird.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ff007f';
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
    }
}

window.FlappyBirdGame = FlappyBirdGame;
