class SurvivalIslandGame {
    constructor(canvas, callbacks) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks;
        
        this.tileSize = 40;
        this.cols = this.canvas.width / this.tileSize;
        this.rows = this.canvas.height / this.tileSize;
        
        this.handleInput = this.handleInput.bind(this);
        document.addEventListener('keydown', this.handleInput);
    }
    
    resetState() {
        this.player = { x: 10, y: 7, hp: 100, maxHp: 100, hunger: 100, maxHunger: 100 };
        this.inv = { wood: 0, stone: 0, food: 0 };
        this.dayTime = 0; // 0 to 2400 (24 hours)
        this.daysSurvived = 0;
        
        this.isGameOver = false;
        this.score = 0;
        
        this.generateIsland();
        this.callbacks.onScoreUpdate(this.score);
        this.draw();
    }
    
    generateIsland() {
        // 0: water, 1: sand, 2: grass, 3: tree, 4: rock, 5: bush(food), 6: shelter
        this.map = Array.from({length: this.rows}, () => Array(this.cols).fill(0));
        
        for(let r=0; r<this.rows; r++) {
            for(let c=0; c<this.cols; c++) {
                // Dist from center
                let dr = Math.abs(r - this.rows/2);
                let dc = Math.abs(c - this.cols/2);
                let dist = Math.sqrt(dr*dr + dc*dc);
                
                if (dist < 5) {
                    this.map[r][c] = 2; // Grass
                    if(Math.random() < 0.2) this.map[r][c] = 3; // Tree
                    else if(Math.random() < 0.1) this.map[r][c] = 4; // Rock
                    else if(Math.random() < 0.1) this.map[r][c] = 5; // Bush
                } else if (dist < 8) {
                    this.map[r][c] = 1; // Sand
                }
            }
        }
        
        // Ensure spawn is clear
        this.map[7][10] = 2;
    }
    
    start() {
        this.resetState();
        this.animationId = setInterval(() => this.tick(), 100);
    }
    
    restart() {
        clearInterval(this.animationId);
        this.start();
    }
    
    togglePause() { }
    
    tick() {
        if(this.isGameOver) return;
        
        this.dayTime += 2;
        if(this.dayTime >= 2400) {
            this.dayTime = 0;
            this.daysSurvived++;
            this.score += 100;
            this.callbacks.onScoreUpdate(this.score);
            
            // Regrow
            for(let r=0; r<this.rows; r++) {
                for(let c=0; c<this.cols; c++) {
                    if(this.map[r][c] === 2 && Math.random() < 0.05) this.map[r][c] = 5; // Regrow bush
                }
            }
        }
        
        // Hunger
        if(this.dayTime % 100 === 0) {
            this.player.hunger--;
            if(this.player.hunger <= 0) {
                this.player.hunger = 0;
                this.player.hp -= 5;
                if(this.player.hp <= 0) this.gameOver();
            }
        }
        
        this.draw();
    }
    
    handleInput(e) {
        if(this.isGameOver) return;
        let dx = 0, dy = 0;
        if(e.key === 'w' || e.key === 'ArrowUp') dy = -1;
        if(e.key === 's' || e.key === 'ArrowDown') dy = 1;
        if(e.key === 'a' || e.key === 'ArrowLeft') dx = -1;
        if(e.key === 'd' || e.key === 'ArrowRight') dx = 1;
        if(e.key === 'e') this.eatFood();
        if(e.key === 'c') this.craftShelter();
        
        if(dx !== 0 || dy !== 0) this.move(dx, dy);
    }
    
    handleMobileInput(btnId, isPressed) {
        if(!isPressed || this.isGameOver) return;
        let dx = 0, dy = 0;
        if(btnId === 'up') dy = -1;
        if(btnId === 'down') dy = 1;
        if(btnId === 'left') dx = -1;
        if(btnId === 'right') dx = 1;
        if(btnId === 'a') this.eatFood();
        if(btnId === 'b') this.craftShelter();
        
        if(dx !== 0 || dy !== 0) this.move(dx, dy);
    }
    
    move(dx, dy) {
        let nr = this.player.y + dy;
        let nc = this.player.x + dx;
        
        if(nr<0 || nc<0 || nr>=this.rows || nc>=this.cols) return;
        
        let cell = this.map[nr][nc];
        
        if(cell === 0) {
            return; // Can't walk on water
        } else if (cell === 3) {
            this.inv.wood++;
            this.map[nr][nc] = 2; // Turn to grass
            this.score += 5;
        } else if (cell === 4) {
            this.inv.stone++;
            this.map[nr][nc] = 2; 
            this.score += 5;
        } else if (cell === 5) {
            this.inv.food++;
            this.map[nr][nc] = 2;
            this.score += 5;
        } else {
            // Move
            this.player.y = nr;
            this.player.x = nc;
            
            // Rest in shelter
            if(cell === 6) {
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + 5);
            }
        }
        
        this.callbacks.onScoreUpdate(this.score);
        this.draw();
    }
    
    eatFood() {
        if(this.inv.food > 0 && this.player.hunger < this.player.maxHunger) {
            this.inv.food--;
            this.player.hunger = Math.min(this.player.maxHunger, this.player.hunger + 20);
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + 5);
            this.draw();
        }
    }
    
    craftShelter() {
        if(this.inv.wood >= 10 && this.inv.stone >= 5) {
            let currentCell = this.map[this.player.y][this.player.x];
            if(currentCell === 2 || currentCell === 1) { // grass or sand
                this.inv.wood -= 10;
                this.inv.stone -= 5;
                this.map[this.player.y][this.player.x] = 6;
                this.score += 500;
                this.callbacks.onScoreUpdate(this.score);
                this.draw();
            }
        }
    }
    
    draw() {
        if(this.isGameOver) return;
        
        // Draw Map
        const colors = ['#1e3a8a', '#fde047', '#4ade80', '#14532d', '#78716c', '#dc2626', '#b45309'];
        const emoji = ['', '', '', '🌲', '🪨', '🍎', '⛺'];
        
        for(let r=0; r<this.rows; r++) {
            for(let c=0; c<this.cols; c++) {
                let v = this.map[r][c];
                this.ctx.fillStyle = colors[v];
                this.ctx.fillRect(c*this.tileSize, r*this.tileSize, this.tileSize, this.tileSize);
                if(emoji[v]) {
                    this.ctx.fillStyle = '#fff';
                    this.ctx.font = '20px Arial';
                    this.ctx.fillText(emoji[v], c*this.tileSize + 8, r*this.tileSize + 28);
                }
            }
        }
        
        // Draw Player
        this.ctx.fillStyle = '#3b82f6'; // Blue shirt
        this.ctx.beginPath();
        this.ctx.arc(this.player.x*this.tileSize + 20, this.player.y*this.tileSize + 20, 15, 0, Math.PI*2);
        this.ctx.fill();
        
        // Night overlay
        if(this.dayTime < 600 || this.dayTime > 1800) {
            let alpha = this.dayTime < 600 ? (600 - this.dayTime)/600 : (this.dayTime - 1800)/600;
            alpha *= 0.7; // Max darkness
            
            // If near shelter, cut hole in darkness
            // Simplified: just darken whole screen for now
            this.ctx.fillStyle = `rgba(0,0,10,${alpha})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // HUD
        this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, 60);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Outfit';
        this.ctx.fillText(`Days: ${this.daysSurvived} | Time: ${Math.floor(this.dayTime/100)}:00`, 10, 20);
        this.ctx.fillText(`HP: ${this.player.hp} | Food: ${this.player.hunger}`, 10, 45);
        this.ctx.fillText(`Inv: Wood(${this.inv.wood}) Stone(${this.inv.stone}) Food(${this.inv.food})`, 250, 20);
        this.ctx.fillText(`Controls: WASD=Move, E=Eat, C=Craft Shelter(10W,5S)`, 250, 45);
    }
    
    gameOver() {
        this.isGameOver = true;
        clearInterval(this.animationId);
        this.callbacks.onGameOver(this.score);
    }
    
    cleanup() {
        clearInterval(this.animationId);
        document.removeEventListener('keydown', this.handleInput);
    }
}

window.SurvivalIslandGame = SurvivalIslandGame;
