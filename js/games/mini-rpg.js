class MiniRpgGame {
    constructor(canvas, callbacks) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks;
        
        // For Mini RPG we reuse similar grid logic to Dungeon Crawler but with open space, XP, and turn text
        this.tileSize = 40;
        this.cols = this.canvas.width / this.tileSize; 
        this.rows = this.canvas.height / this.tileSize; 
        
        this.handleInput = this.handleInput.bind(this);
        document.addEventListener('keydown', this.handleInput);
    }
    
    resetState() {
        this.player = { x: 5, y: 5, hp: 50, maxHp: 50, xp: 0, level: 1, dmg: 10 };
        this.score = 0;
        this.log = ["Welcome to Mini RPG!", "Bump into enemies to attack."];
        this.isGameOver = false;
        
        this.enemies = [];
        for(let i=0; i<10; i++) {
            this.spawnEnemy();
        }
        
        this.potions = [];
        for(let i=0; i<3; i++) {
            this.spawnPotion();
        }
        
        this.callbacks.onScoreUpdate(this.score);
        this.draw();
    }
    
    logMsg(msg) {
        this.log.push(msg);
        if(this.log.length > 5) this.log.shift();
    }
    
    spawnEnemy() {
        this.enemies.push({
            x: Math.floor(Math.random() * (this.cols-2)) + 1,
            y: Math.floor(Math.random() * (this.rows-6)) + 1, // Keep away from bottom log
            hp: 20 + (this.player.level * 5),
            dmg: 5 + this.player.level,
            xp: 10 * this.player.level
        });
    }
    
    spawnPotion() {
         this.potions.push({
            x: Math.floor(Math.random() * (this.cols-2)) + 1,
            y: Math.floor(Math.random() * (this.rows-6)) + 1
        });
    }
    
    start() {
        this.resetState();
    }
    
    restart() {
        this.start();
    }
    
    togglePause() { }
    
    handleInput(e) {
        if(this.isGameOver) return;
        let dx = 0, dy = 0;
        if(e.key === 'ArrowUp' || e.key === 'w') dy = -1;
        if(e.key === 'ArrowDown' || e.key === 's') dy = 1;
        if(e.key === 'ArrowLeft' || e.key === 'a') dx = -1;
        if(e.key === 'ArrowRight' || e.key === 'd') dx = 1;
        
        if(dx !== 0 || dy !== 0) this.movePlayer(dx, dy);
    }
    
    handleMobileInput(btnId, isPressed) {
        if(!isPressed || this.isGameOver) return;
        let dx = 0, dy = 0;
        if(btnId === 'up') dy = -1;
        if(btnId === 'down') dy = 1;
        if(btnId === 'left') dx = -1;
        if(btnId === 'right') dx = 1;
        if(dx !== 0 || dy !== 0) this.movePlayer(dx, dy);
    }
    
    movePlayer(dx, dy) {
        let nx = this.player.x + dx;
        let ny = this.player.y + dy;
        
        // Bounds
        if(nx < 0 || nx >= this.cols || ny < 0 || ny >= this.rows - 3) return;
        
        // Combat
        let enemyIdx = this.enemies.findIndex(e => e.x === nx && e.y === ny);
        if(enemyIdx > -1) {
            let enemy = this.enemies[enemyIdx];
            enemy.hp -= this.player.dmg;
            this.logMsg(`You hit enemy for ${this.player.dmg} dmg.`);
            
            if(enemy.hp <= 0) {
                this.logMsg(`Enemy defeated! +${enemy.xp} XP.`);
                this.player.xp += enemy.xp;
                this.score += 50;
                this.enemies.splice(enemyIdx, 1);
                this.checkLevelUp();
                this.spawnEnemy(); // Keep world populated
            } else {
                this.player.hp -= enemy.dmg;
                this.logMsg(`Enemy hits you for ${enemy.dmg} dmg.`);
                if(this.player.hp <= 0) {
                    this.draw();
                    this.gameOver();
                    return;
                }
            }
        } else {
            // Move
            this.player.x = nx;
            this.player.y = ny;
            
            // Potion check
            let pIdx = this.potions.findIndex(p => p.x === nx && p.y === ny);
            if(pIdx > -1) {
                this.potions.splice(pIdx, 1);
                let heal = 20 * this.player.level;
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
                this.logMsg(`Drank potion. Restored ${heal} HP.`);
                setTimeout(() => this.spawnPotion(), 5000);
            }
        }
        
        this.callbacks.onScoreUpdate(this.score);
        this.draw();
    }
    
    checkLevelUp() {
        let req = this.player.level * 50;
        if(this.player.xp >= req) {
            this.player.level++;
            this.player.xp -= req;
            this.player.maxHp += 20;
            this.player.hp = this.player.maxHp;
            this.player.dmg += 5;
            this.logMsg(`*** LEVEL UP! You are now level ${this.player.level} ***`);
        }
    }
    
    draw() {
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw Grass/World
        this.ctx.fillStyle = '#2d4c1e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height - 120);
        
        // Draw Potions
        this.potions.forEach(p => {
            this.ctx.fillStyle = '#ff007f'; // Pink potion
            this.ctx.fillRect(p.x * this.tileSize + 10, p.y * this.tileSize + 10, 20, 20);
        });
        
        // Draw Enemies
        this.enemies.forEach(e => {
            this.ctx.fillStyle = '#ff4757';
            this.ctx.beginPath();
            this.ctx.arc(e.x * this.tileSize + 20, e.y * this.tileSize + 20, 15, 0, Math.PI*2);
            this.ctx.fill();
        });
        
        // Draw Player
        this.ctx.fillStyle = '#00ffcc';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x * this.tileSize + 20, this.player.y * this.tileSize + 20, 15, 0, Math.PI*2);
        this.ctx.fill();
        
        // UI Area Bottom
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, this.canvas.height - 120, this.canvas.width, 120);
        this.ctx.strokeStyle = '#00ffcc';
        this.ctx.strokeRect(0, this.canvas.height - 120, this.canvas.width, 120);
        
        // Stats
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Outfit';
        this.ctx.fillText(`LVL: ${this.player.level} | HP: ${this.player.hp}/${this.player.maxHp} | DMG: ${this.player.dmg} | XP: ${this.player.xp}/${this.player.level*50}`, 10, this.canvas.height - 100);
        
        // Combat Log
        this.ctx.fillStyle = '#aaa';
        this.ctx.font = '14px Outfit';
        this.log.forEach((msg, i) => {
            this.ctx.fillText(msg, 10, this.canvas.height - 75 + (i*15));
        });
    }
    
    gameOver() {
        this.isGameOver = true;
        this.callbacks.onGameOver(this.score);
    }
    
    cleanup() {
        document.removeEventListener('keydown', this.handleInput);
    }
}

window.MiniRpgGame = MiniRpgGame;
