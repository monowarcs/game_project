class PixelAdventureGame {
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
        this.player = {
            x: 50, y: 100, width: 20, height: 30,
            dx: 0, dy: 0, speed: 5, jumpPower: -12,
            grounded: false
        };
        
        this.gravity = 0.6;
        this.keys = {};
        
        this.platforms = [
            {x: 0, y: 400, w: 300, h: 200},
            {x: 350, y: 300, w: 100, h: 20},
            {x: 500, y: 200, w: 100, h: 20},
            {x: 700, y: 350, w: 100, h: 250},
        ];
        
        this.coins = [
            {x: 390, y: 260, collected: false},
            {x: 540, y: 160, collected: false},
            {x: 740, y: 310, collected: false},
        ];
        
        this.goal = {x: 760, y: 300, w: 30, h: 50}; // Flag
        
        this.score = 0;
        this.level = 1;
        this.isGameOver = false;
        this.isPaused = false;
        
        this.callbacks.onScoreUpdate(this.score);
    }
    
    generateNextLevel() {
        this.level++;
        this.score += 500;
        this.player.x = 50;
        this.player.y = 100;
        this.player.dy = 0;
        
        // Randomize platforms somewhat
        this.platforms = [
            {x: 0, y: 400, w: 200, h: 200},
            {x: 250 + Math.random()*50, y: 350 - Math.random()*50, w: 80, h: 20},
            {x: 450 + Math.random()*50, y: 250 - Math.random()*50, w: 80, h: 20},
            {x: 650, y: 350 + Math.random()*50, w: 150, h: 250},
        ];
        
        this.coins.forEach(c => {
            c.x = Math.random() * 600 + 100;
            c.y = Math.random() * 200 + 100;
            c.collected = false;
        });
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
        this.keys[e.code] = true;
    }
    
    handleKeyUp(e) {
        this.keys[e.code] = false;
    }
    
    handleMobileInput(btnId, isPressed) {
        if(this.isPaused || this.isGameOver) return;
        if(btnId === 'left') this.keys['ArrowLeft'] = isPressed;
        if(btnId === 'right') this.keys['ArrowRight'] = isPressed;
        if(btnId === 'a' || btnId === 'up') this.keys['Space'] = isPressed;
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
        // Horizontal Movement
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.dx = -this.player.speed;
        } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.dx = this.player.speed;
        } else {
            this.player.dx = 0;
        }
        
        // Jumping
        if ((this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW']) && this.player.grounded) {
            this.player.dy = this.player.jumpPower;
            this.player.grounded = false;
        }
        
        // Physics
        this.player.dy += this.gravity;
        
        // Move X & Collide
        this.player.x += this.player.dx;
        this.checkCollisions(true); // true = check X
        
        // Move Y & Collide
        this.player.y += this.player.dy;
        this.player.grounded = false;
        this.checkCollisions(false); // false = check Y
        
        // Screen bounds
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x + this.player.width > this.canvas.width) this.player.x = this.canvas.width - this.player.width;
        
        // Fall off bottom = die
        if (this.player.y > this.canvas.height) {
            this.gameOver();
        }
        
        // Collect Coins
        this.coins.forEach(c => {
            if(!c.collected && this.circleRectCollide(c.x, c.y, 10, this.player)) {
                c.collected = true;
                this.score += 100;
                this.callbacks.onScoreUpdate(this.score);
            }
        });
        
        // Goal Collision
        if (this.rectCollide(this.player, this.goal)) {
            this.generateNextLevel();
        }
    }
    
    checkCollisions(isX) {
        let p = this.player;
        
        for (let plat of this.platforms) {
            if (this.rectCollide(p, plat)) {
                if (isX) {
                    if (p.dx > 0) p.x = plat.x - p.width; // Hit right
                    else if (p.dx < 0) p.x = plat.x + plat.w; // Hit left
                    p.dx = 0;
                } else {
                    if (p.dy > 0) { // Landing
                        p.y = plat.y - p.height;
                        p.grounded = true;
                    } else if (p.dy < 0) { // Hit head
                        p.y = plat.y + plat.h;
                    }
                    p.dy = 0;
                }
            }
        }
    }
    
    rectCollide(r1, r2) {
        return r1.x < r2.x + r2.w &&
               r1.x + r1.width > r2.x &&
               r1.y < r2.y + r2.h &&
               r1.y + r1.height > r2.y;
    }
    
    circleRectCollide(cx, cy, radius, rect) {
        let testX = cx;
        let testY = cy;
        
        if (cx < rect.x) testX = rect.x;
        else if (cx > rect.x + rect.width) testX = rect.x + rect.width;
        
        if (cy < rect.y) testY = rect.y;
        else if (cy > rect.y + rect.height) testY = rect.y + rect.height;
        
        let distX = cx - testX;
        let distY = cy - testY;
        let distance = Math.sqrt((distX*distX) + (distY*distY));
        
        return distance <= radius;
    }
    
    draw() {
        // Sky Background
        this.ctx.fillStyle = '#0b1a2a'; // Dark blueish
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if(this.isGameOver) return;
        
        // Platforms
        this.ctx.fillStyle = '#6b21a8'; // Purple ground
        this.ctx.shadowBlur = 5;
        this.ctx.shadowColor = '#000';
        this.platforms.forEach(p => {
            this.ctx.fillRect(p.x, p.y, p.w, p.h);
            // Grass top
            this.ctx.fillStyle = '#00ffcc';
            this.ctx.fillRect(p.x, p.y, p.w, 5);
            this.ctx.fillStyle = '#6b21a8';
        });
        this.ctx.shadowBlur = 0;
        
        // Goal
        this.ctx.fillStyle = '#ff007f';
        this.ctx.fillRect(this.goal.x, this.goal.y, this.goal.w, this.goal.h);
        
        // Coins
        this.ctx.fillStyle = '#ffd700';
        this.coins.forEach(c => {
            if(!c.collected) {
                this.ctx.beginPath();
                this.ctx.arc(c.x, c.y, 10, 0, Math.PI*2);
                this.ctx.fill();
            }
        });
        
        // Player
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // HUD
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Outfit';
        this.ctx.fillText(`Level: ${this.level}`, 20, 30);
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

window.PixelAdventureGame = PixelAdventureGame;
