class 2playerTankGame {
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
        this.p1 = { x: 50, y: this.canvas.height/2, angle: 0, color: '#00ffcc', hp: 3, keys: {} };
        this.p2 = { x: this.canvas.width-50, y: this.canvas.height/2, angle: Math.PI, color: '#ff007f', hp: 3, keys: {} };
        
        this.bullets = [];
        this.walls = [
            {x: 200, y: 150, w: 50, h: 300},
            {x: 550, y: 150, w: 50, h: 300},
            {x: 350, y: 50, w: 100, h: 50},
            {x: 350, y: 500, w: 100, h: 50}
        ];
        
        this.isGameOver = false;
        this.isPaused = false;
        this.callbacks.onScoreUpdate(`${this.p1.hp} - ${this.p2.hp}`);
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
        // P1
        if(['w','a','s','d'].includes(k)) this.p1.keys[k] = true;
        if(k === ' ') this.shoot(this.p1);
        // P2
        if(e.key.startsWith('Arrow')) this.p2.keys[e.key] = true;
        if(e.key === 'Enter') this.shoot(this.p2);
    }
    
    handleKeyUp(e) {
        const k = e.key.toLowerCase();
        if(['w','a','s','d'].includes(k)) this.p1.keys[k] = false;
        if(e.key.startsWith('Arrow')) this.p2.keys[e.key] = false;
    }
    
    shoot(p) {
        if(this.isPaused) return;
        this.bullets.push({
            x: p.x + Math.cos(p.angle)*20,
            y: p.y + Math.sin(p.angle)*20,
            vx: Math.cos(p.angle)*5,
            vy: Math.sin(p.angle)*5,
            owner: p,
            bounces: 1
        });
    }
    
    loop() {
        if(!this.isPaused && !this.isGameOver) this.update();
        this.draw();
        if(!this.isGameOver) this.animationId = requestAnimationFrame(() => this.loop());
    }
    
    update() {
        // Move Tanks
        this.moveTank(this.p1, 'w', 's', 'a', 'd');
        this.moveTank(this.p2, 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight');
        
        // Move Bullets
        for(let i=this.bullets.length-1; i>=0; i--) {
            let b = this.bullets[i];
            b.x += b.vx;
            b.y += b.vy;
            
            // Wall bounce
            let hitWall = false;
            for(let w of this.walls) {
                if(b.x > w.x && b.x < w.x+w.w && b.y > w.y && b.y < w.y+w.h) {
                    hitWall = true; break;
                }
            }
            
            if(b.x < 0 || b.x > this.canvas.width || b.y < 0 || b.y > this.canvas.height || hitWall) {
                if(b.bounces > 0) {
                    b.vx *= -1; // simplistic bounce
                    b.vy *= -1;
                    b.bounces--;
                    b.x += b.vx; b.y += b.vy;
                } else {
                    this.bullets.splice(i, 1);
                    continue;
                }
            }
            
            // Hit tank?
            let t1Dist = Math.hypot(b.x - this.p1.x, b.y - this.p1.y);
            let t2Dist = Math.hypot(b.x - this.p2.x, b.y - this.p2.y);
            
            if(t1Dist < 15 && b.owner !== this.p1) {
                this.p1.hp--;
                this.bullets.splice(i, 1);
                this.callbacks.onScoreUpdate(`${this.p1.hp} - ${this.p2.hp}`);
                if(this.p1.hp <= 0) this.gameOver("P2 Wins!");
            } else if (t2Dist < 15 && b.owner !== this.p2) {
                this.p2.hp--;
                this.bullets.splice(i, 1);
                this.callbacks.onScoreUpdate(`${this.p1.hp} - ${this.p2.hp}`);
                if(this.p2.hp <= 0) this.gameOver("P1 Wins!");
            }
        }
    }
    
    moveTank(p, fw, bw, tl, tr) {
        if(p.keys[tl]) p.angle -= 0.05;
        if(p.keys[tr]) p.angle += 0.05;
        
        let dx = 0, dy = 0;
        if(p.keys[fw]) { dx = Math.cos(p.angle)*3; dy = Math.sin(p.angle)*3; }
        if(p.keys[bw]) { dx = -Math.cos(p.angle)*3; dy = -Math.sin(p.angle)*3; }
        
        p.x += dx; p.y += dy;
        
        // Bounds
        p.x = Math.max(15, Math.min(this.canvas.width-15, p.x));
        p.y = Math.max(15, Math.min(this.canvas.height-15, p.y));
        
        // Walls
        for(let w of this.walls) {
            if(p.x+15 > w.x && p.x-15 < w.x+w.w && p.y+15 > w.y && p.y-15 < w.y+w.h) {
                p.x -= dx; p.y -= dy; // Undo
            }
        }
    }
    
    draw() {
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#555';
        this.walls.forEach(w => this.ctx.fillRect(w.x, w.y, w.w, w.h));
        
        this.ctx.fillStyle = '#fff';
        this.bullets.forEach(b => {
            this.ctx.beginPath(); this.ctx.arc(b.x, b.y, 4, 0, Math.PI*2); this.ctx.fill();
        });
        
        [this.p1, this.p2].forEach(p => {
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.angle);
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(-15, -15, 30, 30); // Body
            this.ctx.fillRect(0, -4, 25, 8); // Barrel
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
window['2playerTankGame'] = 2playerTankGame;
