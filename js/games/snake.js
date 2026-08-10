class SnakeGame {
    constructor(canvas, callbacks) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks;
        
        // Logical grid size for Snake
        this.gridSize = 20;
        this.tileCount = 40; // 800/20
        
        this.resetState();
        
        // Bindings
        this.handleInput = this.handleInput.bind(this);
        document.addEventListener('keydown', this.handleInput);
    }
    
    resetState() {
        this.snake = [
            {x: 10, y: 10}
        ];
        this.velocity = {x: 1, y: 0};
        this.food = this.spawnFood();
        this.score = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.speed = 100;
        this.lastTime = 0;
        this.accumulator = 0;
        this.callbacks.onScoreUpdate(this.score);
    }
    
    spawnFood() {
        let newFood;
        while(true) {
            newFood = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * (600/this.gridSize)) // Canvas height / grid
            };
            // Check collision with snake
            let conflict = this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
            if(!conflict) break;
        }
        return newFood;
    }
    
    start() {
        this.resetState();
        this.animationId = requestAnimationFrame((time) => this.loop(time));
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
        this.updateDirection(key);
    }
    
    handleMobileInput(btnId, isPressed) {
        if(!isPressed || this.isPaused || this.isGameOver) return;
        this.updateDirection(btnId);
    }
    
    updateDirection(cmd) {
        if ((cmd === 'arrowup' || cmd === 'w' || cmd === 'up') && this.velocity.y !== 1) {
            this.velocity = {x: 0, y: -1};
        } else if ((cmd === 'arrowdown' || cmd === 's' || cmd === 'down') && this.velocity.y !== -1) {
            this.velocity = {x: 0, y: 1};
        } else if ((cmd === 'arrowleft' || cmd === 'a' || cmd === 'left') && this.velocity.x !== 1) {
            this.velocity = {x: -1, y: 0};
        } else if ((cmd === 'arrowright' || cmd === 'd' || cmd === 'right') && this.velocity.x !== -1) {
            this.velocity = {x: 1, y: 0};
        }
    }
    
    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        if (!this.isPaused && !this.isGameOver) {
            this.accumulator += deltaTime;
            
            // Fixed timestep for game logic
            if (this.accumulator > this.speed) {
                this.update();
                this.accumulator -= this.speed;
            }
        }
        
        this.draw();
        
        if (!this.isGameOver) {
            this.animationId = requestAnimationFrame((time) => this.loop(time));
        }
    }
    
    update() {
        const head = { ...this.snake[0] };
        head.x += this.velocity.x;
        head.y += this.velocity.y;
        
        // Wall Collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= (600/this.gridSize)) {
            this.gameOver();
            return;
        }
        
        // Self Collision
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }
        
        this.snake.unshift(head);
        
        // Food Collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.callbacks.onScoreUpdate(this.score);
            this.food = this.spawnFood();
            
            // Increase speed slightly
            if(this.speed > 50) this.speed -= 2;
        } else {
            this.snake.pop();
        }
    }
    
    draw() {
        // Clear background
        this.ctx.fillStyle = '#0f111a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if(this.isGameOver) return;
        
        // Draw Grid (optional, skipping for neon look)
        
        // Draw Food
        this.ctx.fillStyle = '#ff007f';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#ff007f';
        this.ctx.fillRect(this.food.x * this.gridSize, this.food.y * this.gridSize, this.gridSize - 1, this.gridSize - 1);
        
        // Draw Snake
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#00ffcc';
        this.snake.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? '#00e6b8' : '#00ffcc';
            this.ctx.fillRect(segment.x * this.gridSize, segment.y * this.gridSize, this.gridSize - 1, this.gridSize - 1);
        });
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
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

window.SnakeGame = SnakeGame;
