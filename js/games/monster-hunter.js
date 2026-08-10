class MonsterHunterGame {
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
            x: this.canvas.width/2, y: this.canvas.height - 100,
            radius: 15, speed: 6, hp: 100, maxHp: 100, isAttacking: false
        };
        
        this.boss = {
            x: this.canvas.width/2, y: 150,
            radius: 60, speed: 2, hp: 1000, maxHp: 1000,
            state: 'idle', stateTimer: 0
        };
        
        this.projectiles = [];
        this.keys = {};
        
        this.score = 0;
        this.level = 1;
        this.isGameOver = false;
        this.isPaused = false;
        
        this.callbacks.onScoreUpdate(this.score);
    }
    
    start() {
        this.resetState();
        this.animationId = requestAnimationFrame(() => this.loop());
    }
    
    restart() { this.start(); }
    togglePause() { this.isPaused = !this.isPaused; }
    
    handleInput(e) {
        if(this.isGameOver) return;
        this.keys[e.key.toLowerCase()] = true;
    }
    
    handleKeyUp(e) {
        this.keys[e.key.toLowerCase()] = false;
    }
    
    handleMobileInput(btnId, isPressed) {
        if(this.isGameOver) return;
        const map = {'up':'w','down':'s','left':'a','right':'d','a':' '};
        if(map[btnId]) this.keys[map[btnId]] = isPressed;
    }
    
    loop() {
        if(!this.isPaused && !this.isGameOver) this.update();
        this.draw();
        if(!this.isGameOver) this.animationId = requestAnimationFrame(() => this.loop());
    }
    
    update() {
        // Player Move
        let dx = 0, dy = 0;
        if(this.keys['w'] || this.keys['arrowup']) dy -= this.player.speed;
        if(this.keys['s'] || this.keys['arrowdown']) dy += this.player.speed;
        if(this.keys['a'] || this.keys['arrowleft']) dx -= this.player.speed;
        if(this.keys['d'] || this.keys['arrowright']) dx += this.player.speed;
        
        this.player.x = Math.max(this.player.radius, Math.min(this.canvas.width-this.player.radius, this.player.x + dx));
        this.player.y = Math.max(this.player.radius, Math.min(this.canvas.height-this.player.radius, this.player.y + dy));
        
        // Attack
        this.player.isAttacking = this.keys[' '];
        
        // Boss Logic
        this.boss.stateTimer++;
        if(this.boss.state === 'idle') {
            if(this.boss.stateTimer > 60) {
                this.boss.state = Math.random() > 0.5 ? 'move' : 'shoot';
                this.boss.stateTimer = 0;
            }
        } else if (this.boss.state === 'move') {
            // Move towards player slowly
            let angle = Math.atan2(this.player.y - this.boss.y, this.player.x - this.boss.x);
            this.boss.x += Math.cos(angle) * this.boss.speed;
            this.boss.y += Math.sin(angle) * this.boss.speed;
            if(this.boss.stateTimer > 120) { this.boss.state = 'idle'; this.boss.stateTimer = 0; }
        } else if (this.boss.state === 'shoot') {
            if(this.boss.stateTimer % 20 === 0) { // Shoot pattern
                let angle = Math.atan2(this.player.y - this.boss.y, this.player.x - this.boss.x);
                // Spread shot
                for(let i=-1; i<=1; i++) {
                    this.projectiles.push({
                        x: this.boss.x, y: this.boss.y,
                        vx: Math.cos(angle + (i*0.3)) * 5, vy: Math.sin(angle + (i*0.3)) * 5,
                        r: 8, isEnemy: true
                    });
                }
            }
            if(this.boss.stateTimer > 60) { this.boss.state = 'idle'; this.boss.stateTimer = 0; }
        }
        
        // Player Melee Hit
        let dist = Math.hypot(this.player.x - this.boss.x, this.player.y - this.boss.y);
        if(this.player.isAttacking && dist < this.boss.radius + this.player.radius + 30) {
            this.boss.hp -= 5;
            this.score += 5;
            this.callbacks.onScoreUpdate(this.score);
            
            if(this.boss.hp <= 0) {
                // Next Level
                this.level++;
                this.boss.maxHp += 500;
                this.boss.hp = this.boss.maxHp;
                this.boss.speed += 0.5;
                this.boss.x = this.canvas.width/2;
                this.boss.y = 150;
                this.projectiles = [];
                this.player.hp = this.player.maxHp;
                this.score += 1000;
            }
        }
        
        // Player body collision
        if(dist < this.boss.radius + this.player.radius) {
            this.player.hp -= 1;
            if(this.player.hp <= 0) this.gameOver();
        }
        
        // Update Projectiles
        for(let i=this.projectiles.length-1; i>=0; i--) {
            let p = this.projectiles[i];
            p.x += p.vx; p.y += p.vy;
            
            if(p.x < 0 || p.x > this.canvas.width || p.y < 0 || p.y > this.canvas.height) {
                this.projectiles.splice(i, 1);
                continue;
            }
            
            if(p.isEnemy && Math.hypot(this.player.x - p.x, this.player.y - p.y) < this.player.radius + p.r) {
                this.player.hp -= 10;
                this.projectiles.splice(i, 1);
                if(this.player.hp <= 0) this.gameOver();
            }
        }
    }
    
    draw() {
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if(this.isGameOver) return;
        
        // Boss
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.beginPath();
        this.ctx.arc(this.boss.x, this.boss.y, this.boss.radius, 0, Math.PI*2);
        this.ctx.fill();
        
        // Boss HP
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(this.boss.x - 50, this.boss.y - this.boss.radius - 20, 100, 10);
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(this.boss.x - 50, this.boss.y - this.boss.radius - 20, 100 * (this.boss.hp/this.boss.maxHp), 10);
        
        // Player
        this.ctx.fillStyle = '#3498db';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI*2);
        this.ctx.fill();
        
        if(this.player.isAttacking) {
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, this.player.radius + 20, -Math.PI/2, 0); // Slash effect
            this.ctx.stroke();
        }
        
        // Projectiles
        this.ctx.fillStyle = '#f1c40f';
        this.projectiles.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
            this.ctx.fill();
        });
        
        // Player HUD
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Outfit';
        this.ctx.fillText(`Level: ${this.level}  HP: ${this.player.hp}/${this.player.maxHp}`, 10, 30);
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
window.MonsterHunterGame = MonsterHunterGame;
