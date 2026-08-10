class ZombieApocalypseGame {
    constructor(canvas, callbacks) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks;
        
        this.handleInput = this.handleInput.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleMouse = this.handleMouse.bind(this);
        this.handleClick = this.handleClick.bind(this);
        
        document.addEventListener('keydown', this.handleInput);
        document.addEventListener('keyup', this.handleKeyUp);
        this.canvas.addEventListener('mousemove', this.handleMouse);
        this.canvas.addEventListener('mousedown', this.handleClick);
    }
    
    resetState() {
        this.player = {
            x: this.canvas.width/2, 
            y: this.canvas.height/2, 
            radius: 15, speed: 4, hp: 100, maxHp: 100,
            angle: 0
        };
        
        this.keys = {};
        this.bullets = [];
        this.zombies = [];
        this.blood = [];
        
        this.wave = 1;
        this.zombiesToSpawn = 10;
        this.spawnTimer = 0;
        
        this.score = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.lastTime = 0;
        
        this.callbacks.onScoreUpdate(this.score);
    }
    
    start() {
        this.resetState();
        this.animationId = requestAnimationFrame((t) => this.loop(t));
    }
    
    restart() {
        this.start();
    }
    
    togglePause() {
        if(this.isGameOver) return;
        this.isPaused = !this.isPaused;
        if(!this.isPaused) this.lastTime = performance.now();
    }
    
    handleInput(e) {
        if(this.isPaused || this.isGameOver) return;
        this.keys[e.code] = true;
    }
    
    handleKeyUp(e) {
        this.keys[e.code] = false;
    }
    
    handleMouse(e) {
        if(this.isPaused || this.isGameOver) return;
        let rect = this.canvas.getBoundingClientRect();
        let mouseX = e.clientX - rect.left;
        let mouseY = e.clientY - rect.top;
        // Scale to logical canvas
        mouseX = mouseX * (this.canvas.width / rect.width);
        mouseY = mouseY * (this.canvas.height / rect.height);
        
        this.player.angle = Math.atan2(mouseY - this.player.y, mouseX - this.player.x);
    }
    
    handleClick(e) {
        if(this.isPaused || this.isGameOver) return;
        // Shoot
        this.bullets.push({
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(this.player.angle) * 10,
            vy: Math.sin(this.player.angle) * 10,
            radius: 4,
            life: 100 // frames
        });
    }
    
    handleMobileInput(btnId, isPressed) {
        // Map D-pad to movement
        const map = {'up':'KeyW','down':'KeyS','left':'KeyA','right':'KeyD'};
        if(map[btnId]) this.keys[map[btnId]] = isPressed;
        
        // Auto shoot closest enemy on A button press
        if(btnId === 'a' && isPressed && !this.isGameOver && !this.isPaused) {
            let target = this.getClosestZombie();
            let angle = target ? Math.atan2(target.y - this.player.y, target.x - this.player.x) : this.player.angle;
            this.player.angle = angle;
            
            this.bullets.push({
                x: this.player.x,
                y: this.player.y,
                vx: Math.cos(angle) * 10,
                vy: Math.sin(angle) * 10,
                radius: 4,
                life: 100
            });
        }
    }
    
    getClosestZombie() {
        let closest = null;
        let minDist = Infinity;
        for(let z of this.zombies) {
            let d = Math.hypot(z.x - this.player.x, z.y - this.player.y);
            if(d < minDist) { minDist = d; closest = z; }
        }
        return closest;
    }
    
    loop(time) {
        if (this.isPaused || this.isGameOver) return;
        
        let dt = time - this.lastTime;
        this.lastTime = time;
        
        this.update();
        this.draw();
        
        this.animationId = requestAnimationFrame((t) => this.loop(t));
    }
    
    update() {
        // Move Player
        let dx = 0, dy = 0;
        if(this.keys['KeyW']) dy -= this.player.speed;
        if(this.keys['KeyS']) dy += this.player.speed;
        if(this.keys['KeyA']) dx -= this.player.speed;
        if(this.keys['KeyD']) dx += this.player.speed;
        
        // Normalize diagonal speed
        if(dx !== 0 && dy !== 0) {
            let invMag = 1 / Math.sqrt(2);
            dx *= invMag;
            dy *= invMag;
        }
        
        this.player.x += dx;
        this.player.y += dy;
        
        // Clamp player
        this.player.x = Math.max(this.player.radius, Math.min(this.canvas.width - this.player.radius, this.player.x));
        this.player.y = Math.max(this.player.radius, Math.min(this.canvas.height - this.player.radius, this.player.y));
        
        // Spawn Zombies
        this.spawnTimer--;
        if(this.spawnTimer <= 0 && this.zombiesToSpawn > 0) {
            this.spawnZombie();
            this.spawnTimer = 60 - (this.wave * 2); // Faster spawn higher wave
            if(this.spawnTimer < 10) this.spawnTimer = 10;
            this.zombiesToSpawn--;
        } else if (this.zombiesToSpawn <= 0 && this.zombies.length === 0) {
            // Next Wave
            this.wave++;
            this.zombiesToSpawn = 10 + (this.wave * 5);
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + 20); // Heal a bit
        }
        
        // Update Bullets
        for(let i = this.bullets.length-1; i>=0; i--) {
            let b = this.bullets[i];
            b.x += b.vx;
            b.y += b.vy;
            b.life--;
            
            if(b.life <= 0 || b.x < 0 || b.x > this.canvas.width || b.y < 0 || b.y > this.canvas.height) {
                this.bullets.splice(i, 1);
                continue;
            }
            
            // Hit Zombie?
            for(let j = this.zombies.length-1; j>=0; j--) {
                let z = this.zombies[j];
                if(Math.hypot(b.x - z.x, b.y - z.y) < b.radius + z.radius) {
                    z.hp -= 25;
                    this.bullets.splice(i, 1); // destroy bullet
                    
                    if(z.hp <= 0) {
                        this.blood.push({x: z.x, y: z.y, size: 20, life: 300});
                        this.zombies.splice(j, 1);
                        this.score += 10;
                        this.callbacks.onScoreUpdate(this.score);
                    } else {
                        // Knockback
                        z.x += b.vx * 0.5;
                        z.y += b.vy * 0.5;
                    }
                    break; // Bullet hit something, stop checking other zombies
                }
            }
        }
        
        // Update Zombies
        for(let z of this.zombies) {
            let angle = Math.atan2(this.player.y - z.y, this.player.x - z.x);
            z.x += Math.cos(angle) * z.speed;
            z.y += Math.sin(angle) * z.speed;
            
            // Hit Player?
            if(Math.hypot(this.player.x - z.x, this.player.y - z.y) < this.player.radius + z.radius) {
                this.player.hp -= 1; // Constant drain on contact
                if(this.player.hp <= 0) {
                    this.gameOver();
                }
            }
        }
        
        // Update Blood
        for(let i=this.blood.length-1; i>=0; i--) {
            this.blood[i].life--;
            if(this.blood[i].life <= 0) this.blood.splice(i, 1);
        }
    }
    
    spawnZombie() {
        let angle = Math.random() * Math.PI * 2;
        let r = Math.max(this.canvas.width, this.canvas.height);
        // Spawn outside screen
        let zx = this.canvas.width/2 + Math.cos(angle) * r;
        let zy = this.canvas.height/2 + Math.sin(angle) * r;
        
        let speed = 1 + Math.random() * (this.wave * 0.2); // Faster zombies over time
        if(speed > 4) speed = 4;
        
        this.zombies.push({
            x: zx, y: zy, radius: 12, hp: 50 + (this.wave*10), speed: speed
        });
    }
    
    draw() {
        this.ctx.fillStyle = '#0f111a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if(this.isGameOver) return;
        
        // Draw Blood
        this.blood.forEach(b => {
            this.ctx.fillStyle = `rgba(150, 0, 0, ${b.life / 300})`;
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.size, 0, Math.PI*2);
            this.ctx.fill();
        });
        
        // Draw Bullets
        this.ctx.fillStyle = '#ffff00';
        this.bullets.forEach(b => {
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI*2);
            this.ctx.fill();
        });
        
        // Draw Zombies
        this.zombies.forEach(z => {
            this.ctx.fillStyle = '#10b981'; // Greenish
            this.ctx.beginPath();
            this.ctx.arc(z.x, z.y, z.radius, 0, Math.PI*2);
            this.ctx.fill();
        });
        
        // Draw Player
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        this.ctx.rotate(this.player.angle);
        
        this.ctx.fillStyle = '#3b82f6';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.player.radius, 0, Math.PI*2);
        this.ctx.fill();
        // Gun barrel
        this.ctx.fillStyle = '#9ca3af';
        this.ctx.fillRect(0, -4, this.player.radius + 10, 8);
        
        this.ctx.restore();
        
        // HUD
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Outfit';
        this.ctx.fillText(`Wave: ${this.wave}`, 20, 30);
        
        // HP Bar
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(20, 45, 200, 20);
        this.ctx.fillStyle = '#ff4757';
        this.ctx.fillRect(20, 45, (this.player.hp / this.player.maxHp) * 200, 20);
    }
    
    gameOver() {
        this.isGameOver = true;
        this.callbacks.onGameOver(this.score);
    }
    
    cleanup() {
        cancelAnimationFrame(this.animationId);
        document.removeEventListener('keydown', this.handleInput);
        document.removeEventListener('keyup', this.handleKeyUp);
        this.canvas.removeEventListener('mousemove', this.handleMouse);
        this.canvas.removeEventListener('mousedown', this.handleClick);
    }
}

window.ZombieApocalypseGame = ZombieApocalypseGame;
