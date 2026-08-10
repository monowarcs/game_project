class 2playerSnakeGame {
    constructor(canvas, callbacks) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks;
        
        this.gridSize = 20;
        this.tileCountX = this.canvas.width / this.gridSize;
        this.tileCountY = this.canvas.height / this.gridSize;
        
        this.handleInput = this.handleInput.bind(this);
        document.addEventListener('keydown', this.handleInput);
    }
    
    resetState() {
        this.p1 = { snake: [{x: 5, y: 5}], vel: {x: 1, y: 0}, color: '#00ffcc', dead: false };
        this.p2 = { snake: [{x: this.tileCountX-6, y: this.tileCountY-6}], vel: {x: -1, y: 0}, color: '#ff007f', dead: false };
        
        this.food = this.spawnFood();
        this.isGameOver = false;
        this.isPaused = false;
        this.speed = 100;
        
        this.callbacks.onScoreUpdate("0 - 0");
    }
    
    spawnFood() {
        return {
            x: Math.floor(Math.random() * this.tileCountX),
            y: Math.floor(Math.random() * this.tileCountY)
        };
    }
    
    start() {
        this.resetState();
        if(this.animationId) clearInterval(this.animationId);
        this.animationId = setInterval(() => this.loop(), this.speed);
    }
    
    restart() { this.start(); }
    togglePause() { this.isPaused = !this.isPaused; }
    
    handleInput(e) {
        if(this.isPaused || this.isGameOver) return;
        const key = e.key.toLowerCase();
        
        // P1 (WASD)
        if(key === 'w' && this.p1.vel.y !== 1) this.p1.vel = {x: 0, y: -1};
        if(key === 's' && this.p1.vel.y !== -1) this.p1.vel = {x: 0, y: 1};
        if(key === 'a' && this.p1.vel.x !== 1) this.p1.vel = {x: -1, y: 0};
        if(key === 'd' && this.p1.vel.x !== -1) this.p1.vel = {x: 1, y: 0};
        
        // P2 (Arrows)
        if(key === 'arrowup' && this.p2.vel.y !== 1) this.p2.vel = {x: 0, y: -1};
        if(key === 'arrowdown' && this.p2.vel.y !== -1) this.p2.vel = {x: 0, y: 1};
        if(key === 'arrowleft' && this.p2.vel.x !== 1) this.p2.vel = {x: -1, y: 0};
        if(key === 'arrowright' && this.p2.vel.x !== -1) this.p2.vel = {x: 1, y: 0};
    }
    
    loop() {
        if (!this.isPaused && !this.isGameOver) {
            this.update();
        }
        this.draw();
    }
    
    update() {
        this.updatePlayer(this.p1);
        this.updatePlayer(this.p2);
        
        // Check collisions between snakes
        this.checkCollision(this.p1, this.p2);
        this.checkCollision(this.p2, this.p1);
        
        if(this.p1.dead && this.p2.dead) this.gameOver("Draw!");
        else if (this.p1.dead) this.gameOver("P2 Wins!");
        else if (this.p2.dead) this.gameOver("P1 Wins!");
    }
    
    updatePlayer(p) {
        if(p.dead) return;
        
        const head = { x: p.snake[0].x + p.vel.x, y: p.snake[0].y + p.vel.y };
        
        // Wall
        if (head.x < 0 || head.x >= this.tileCountX || head.y < 0 || head.y >= this.tileCountY) {
            p.dead = true;
            return;
        }
        
        // Self
        if (p.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
            p.dead = true;
            return;
        }
        
        p.snake.unshift(head);
        
        // Food
        if (head.x === this.food.x && head.y === this.food.y) {
            this.food = this.spawnFood();
            this.callbacks.onScoreUpdate(`${this.p1.snake.length} - ${this.p2.snake.length}`);
        } else {
            p.snake.pop();
        }
    }
    
    checkCollision(attacker, victim) {
        if(attacker.dead || victim.dead) return;
        const head = attacker.snake[0];
        if (victim.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
            attacker.dead = true;
        }
    }
    
    draw() {
        this.ctx.fillStyle = '#0f111a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Food
        this.ctx.fillStyle = '#ffd700';
        this.ctx.fillRect(this.food.x * this.gridSize, this.food.y * this.gridSize, this.gridSize-1, this.gridSize-1);
        
        // Snakes
        [this.p1, this.p2].forEach(p => {
            this.ctx.fillStyle = p.color;
            p.snake.forEach(seg => {
                this.ctx.fillRect(seg.x * this.gridSize, seg.y * this.gridSize, this.gridSize-1, this.gridSize-1);
            });
        });
    }
    
    gameOver(msg) {
        this.isGameOver = true;
        clearInterval(this.animationId);
        this.callbacks.onGameOver(msg);
    }
    
    cleanup() {
        clearInterval(this.animationId);
        document.removeEventListener('keydown', this.handleInput);
    }
}
window['2playerSnakeGame'] = 2playerSnakeGame;
