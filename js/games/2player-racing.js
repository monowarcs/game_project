class 2playerRacingGame {
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
        this.p1 = { x: 400, y: 550, angle: -Math.PI/2, speed: 0, color: '#00ffcc', laps: 0, keys: {}, passedMid: false };
        this.p2 = { x: 400, y: 570, angle: -Math.PI/2, speed: 0, color: '#ff007f', laps: 0, keys: {}, passedMid: false };
        
        this.isGameOver = false;
        this.isPaused = false;
        this.callbacks.onScoreUpdate(`Laps: ${this.p1.laps} - ${this.p2.laps}`);
    }
    
    start() {
        this.resetState();
        this.animationId = requestAnimationFrame(() => this.loop());
    }
    
    restart() { this.start(); }
    togglePause() { this.isPaused = !this.isPaused; }
    
    handleInput(e) {
        if(this.isGameOver) return;
        const k = e.key.toLowerCase();
        if(['w','a','s','d'].includes(k)) this.p1.keys[k] = true;
        if(e.key.startsWith('Arrow')) this.p2.keys[e.key] = true;
    }
    
    handleKeyUp(e) {
        const k = e.key.toLowerCase();
        if(['w','a','s','d'].includes(k)) this.p1.keys[k] = false;
        if(e.key.startsWith('Arrow')) this.p2.keys[e.key] = false;
    }
    
    loop() {
        if(!this.isPaused && !this.isGameOver) this.update();
        this.draw();
        if(!this.isGameOver) this.animationId = requestAnimationFrame(() => this.loop());
    }
    
    update() {
        this.moveCar(this.p1, 'w', 's', 'a', 'd');
        this.moveCar(this.p2, 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight');
    }
    
    moveCar(c, fw, bw, tl, tr) {
        if(c.keys[fw]) c.speed += 0.2;
        else if (c.keys[bw]) c.speed -= 0.2;
        else c.speed *= 0.95; // Friction
        
        if(c.speed > 8) c.speed = 8;
        if(c.speed < -4) c.speed = -4;
        
        if(Math.abs(c.speed) > 0.1) {
            if(c.keys[tl]) c.angle -= 0.05 * Math.sign(c.speed);
            if(c.keys[tr]) c.angle += 0.05 * Math.sign(c.speed);
        }
        
        let dx = Math.cos(c.angle) * c.speed;
        let dy = Math.sin(c.angle) * c.speed;
        
        c.x += dx; c.y += dy;
        
        // Boundaries (Simple track: big oval)
        // Outer bounds
        if(c.x < 50) c.x = 50;
        if(c.x > 750) c.x = 750;
        if(c.y < 50) c.y = 50;
        if(c.y > 550) c.y = 550;
        
        // Inner bounds
        if(c.x > 150 && c.x < 650 && c.y > 150 && c.y < 450) {
            c.speed *= 0.5; // Grass slows down
        }
        
        // Laps
        if(c.y < 300) c.passedMid = true;
        if(c.passedMid && c.y > 500 && c.x > 350 && c.x < 450) {
            c.laps++;
            c.passedMid = false;
            this.callbacks.onScoreUpdate(`Laps: ${this.p1.laps} - ${this.p2.laps}`);
            if(c.laps >= 3) {
                this.gameOver(c === this.p1 ? "P1 Wins!" : "P2 Wins!");
            }
        }
    }
    
    draw() {
        this.ctx.fillStyle = '#2c3e50'; // Grass
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Track
        this.ctx.fillStyle = '#34495e';
        this.ctx.beginPath(); this.ctx.roundRect(50, 50, 700, 500, 100); this.ctx.fill();
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.beginPath(); this.ctx.roundRect(150, 150, 500, 300, 50); this.ctx.fill();
        
        // Start line
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(350, 450, 100, 100);
        
        // Cars
        [this.p1, this.p2].forEach(c => {
            this.ctx.save();
            this.ctx.translate(c.x, c.y);
            this.ctx.rotate(c.angle);
            this.ctx.fillStyle = c.color;
            this.ctx.fillRect(-10, -6, 20, 12);
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(4, -4, 4, 8); // Window
            this.ctx.restore();
        });
    }
    
    gameOver(msg) {
        this.isGameOver = true;
        this.callbacks.onGameOver(msg);
    }
    
    cleanup() {
        cancelAnimationFrame(this.animationId);
        document.removeEventListener('keydown', this.handleInput);
        document.removeEventListener('keyup', this.handleKeyUp);
    }
}
window['2playerRacingGame'] = 2playerRacingGame;
