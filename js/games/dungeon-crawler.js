class DungeonCrawlerGame {
    constructor(canvas, callbacks) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks;
        
        this.tileSize = 40;
        this.cols = this.canvas.width / this.tileSize; // 20
        this.rows = this.canvas.height / this.tileSize; // 15
        
        this.handleInput = this.handleInput.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        document.addEventListener('keydown', this.handleInput);
        document.addEventListener('keyup', this.handleKeyUp);
    }
    
    resetState() {
        this.player = { x: 1, y: 1, hp: 100, maxHp: 100, dmg: 25, keys: 0 };
        this.level = 1;
        this.score = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.keysPressed = {};
        this.lastMoveTime = 0;
        
        this.callbacks.onScoreUpdate(this.score);
        this.generateLevel();
    }
    
    generateLevel() {
        // 0 = floor, 1 = wall, 2 = enemy, 3 = key, 4 = door(exit), 5 = potion
        this.map = Array.from({length: this.rows}, () => Array(this.cols).fill(0));
        this.enemies = [];
        this.items = [];
        
        for(let r=0; r<this.rows; r++) {
            for(let c=0; c<this.cols; c++) {
                if(r===0 || r===this.rows-1 || c===0 || c===this.cols-1) {
                    this.map[r][c] = 1; // borders
                } else if (Math.random() < 0.15 && !(r===1 && c===1)) {
                    this.map[r][c] = 1; // random walls
                }
            }
        }
        
        // Spawn Exit
        let placedExit = false;
        while(!placedExit) {
            let r = Math.floor(Math.random() * (this.rows-2)) + 1;
            let c = Math.floor(Math.random() * (this.cols-2)) + 1;
            if(this.map[r][c] === 0 && (r>5 || c>5)) {
                this.map[r][c] = 4;
                placedExit = true;
            }
        }
        
        // Spawn Key
        let placedKey = false;
        while(!placedKey) {
            let r = Math.floor(Math.random() * (this.rows-2)) + 1;
            let c = Math.floor(Math.random() * (this.cols-2)) + 1;
            if(this.map[r][c] === 0) {
                this.items.push({type: 'key', r, c});
                this.map[r][c] = 3;
                placedKey = true;
            }
        }
        
        // Spawn Enemies
        let enemyCount = this.level + 2;
        for(let i=0; i<enemyCount; i++) {
            let r = Math.floor(Math.random() * (this.rows-2)) + 1;
            let c = Math.floor(Math.random() * (this.cols-2)) + 1;
            if(this.map[r][c] === 0 && (r>3 || c>3)) {
                this.enemies.push({ r, c, hp: 50 + (this.level*10), dmg: 10 + this.level*2 });
                this.map[r][c] = 2;
            }
        }
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
    }
    
    handleInput(e) {
        if(this.isPaused || this.isGameOver) return;
        this.keysPressed[e.key.toLowerCase()] = true;
    }
    
    handleKeyUp(e) {
        this.keysPressed[e.key.toLowerCase()] = false;
    }
    
    handleMobileInput(btnId, isPressed) {
        if(this.isPaused || this.isGameOver) return;
        const map = {'up': 'w', 'down': 's', 'left': 'a', 'right': 'd', 'a': 'space'};
        if(map[btnId]) this.keysPressed[map[btnId]] = isPressed;
    }
    
    loop(time) {
        if (!this.isPaused && !this.isGameOver) {
            if (time - this.lastMoveTime > 150) { // Input delay for grid movement
                this.update();
                this.lastMoveTime = time;
            }
        }
        this.draw();
        
        if (!this.isGameOver) {
            this.animationId = requestAnimationFrame((t) => this.loop(t));
        }
    }
    
    update() {
        let dr = 0, dc = 0;
        if(this.keysPressed['w'] || this.keysPressed['arrowup']) dr = -1;
        else if(this.keysPressed['s'] || this.keysPressed['arrowdown']) dr = 1;
        else if(this.keysPressed['a'] || this.keysPressed['arrowleft']) dc = -1;
        else if(this.keysPressed['d'] || this.keysPressed['arrowright']) dc = 1;
        
        if(dr !== 0 || dc !== 0) {
            let nr = this.player.y + dr;
            let nc = this.player.x + dc;
            let targetCell = this.map[nr][nc];
            
            if(targetCell === 1) {
                // Wall, do nothing
            } else if (targetCell === 2) {
                // Enemy Bump Attack
                let enemyIndex = this.enemies.findIndex(e => e.r === nr && e.c === nc);
                if(enemyIndex > -1) {
                    let enemy = this.enemies[enemyIndex];
                    enemy.hp -= this.player.dmg;
                    
                    if(enemy.hp <= 0) {
                        this.enemies.splice(enemyIndex, 1);
                        this.map[nr][nc] = 0; // Clear cell
                        this.score += 50;
                        this.callbacks.onScoreUpdate(this.score);
                    } else {
                        // Enemy hits back
                        this.player.hp -= enemy.dmg;
                        if(this.player.hp <= 0) this.gameOver();
                    }
                }
            } else if (targetCell === 4) {
                // Door
                if(this.player.keys > 0) {
                    this.level++;
                    this.player.keys--;
                    this.score += 100;
                    this.callbacks.onScoreUpdate(this.score);
                    this.player.x = 1;
                    this.player.y = 1;
                    this.generateLevel();
                } // Else blocked
            } else {
                // Move
                this.player.y = nr;
                this.player.x = nc;
                
                if(targetCell === 3) {
                    // Key
                    this.player.keys++;
                    this.map[nr][nc] = 0;
                    this.score += 20;
                    this.callbacks.onScoreUpdate(this.score);
                }
            }
            
            // Randomly move one enemy per player step
            if(this.enemies.length > 0 && Math.random() > 0.3) {
                let rEnemy = this.enemies[Math.floor(Math.random() * this.enemies.length)];
                let eDr = Math.random() > 0.5 ? (this.player.y > rEnemy.r ? 1 : -1) : 0;
                let eDc = eDr === 0 ? (this.player.x > rEnemy.c ? 1 : -1) : 0;
                
                let eNr = rEnemy.r + eDr;
                let eNc = rEnemy.c + eDc;
                
                if(eNr === this.player.y && eNc === this.player.x) {
                    this.player.hp -= rEnemy.dmg;
                    if(this.player.hp <= 0) this.gameOver();
                } else if(this.map[eNr][eNc] === 0) {
                    this.map[rEnemy.r][rEnemy.c] = 0; // Old pos
                    rEnemy.r = eNr;
                    rEnemy.c = eNc;
                    this.map[eNr][eNc] = 2; // New pos
                }
            }
        }
    }
    
    draw() {
        this.ctx.fillStyle = '#0f111a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if(this.isGameOver) return;
        
        for(let r=0; r<this.rows; r++) {
            for(let c=0; c<this.cols; c++) {
                let x = c * this.tileSize;
                let y = r * this.tileSize;
                let val = this.map[r][c];
                
                if(val === 1) { // Wall
                    this.ctx.fillStyle = '#2c3040';
                    this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
                } else if (val === 2) { // Enemy
                    this.ctx.fillStyle = '#ff4757';
                    this.ctx.beginPath();
                    this.ctx.arc(x + this.tileSize/2, y + this.tileSize/2, this.tileSize/2 - 5, 0, Math.PI*2);
                    this.ctx.fill();
                } else if (val === 3) { // Key
                    this.ctx.fillStyle = '#ffd700';
                    this.ctx.font = '20px Outfit';
                    this.ctx.fillText('🗝️', x + 5, y + 25);
                } else if (val === 4) { // Door
                    this.ctx.fillStyle = '#6b21a8';
                    this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
                    this.ctx.fillStyle = '#fff';
                    this.ctx.font = '20px Outfit';
                    this.ctx.fillText('🚪', x + 5, y + 25);
                }
            }
        }
        
        // Draw Player
        let px = this.player.x * this.tileSize;
        let py = this.player.y * this.tileSize;
        this.ctx.fillStyle = '#00ffcc';
        this.ctx.beginPath();
        this.ctx.arc(px + this.tileSize/2, py + this.tileSize/2, this.tileSize/2 - 4, 0, Math.PI*2);
        this.ctx.fill();
        
        // Draw HUD
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Outfit';
        this.ctx.fillText(`Level: ${this.level}  HP: ${this.player.hp}/${this.player.maxHp}  Keys: ${this.player.keys}`, 10, 20);
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

window.DungeonCrawlerGame = DungeonCrawlerGame;
