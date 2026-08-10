class QuestAdventureGame {
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
        this.player = { x: 5, y: 5 };
        this.inventory = { apple: 0, sword: 0 };
        this.quests = [
            { id: 1, text: "Bring me 3 apples.", target: 3, current: 0, done: false, type: 'apple' },
            { id: 2, text: "Find the lost sword.", target: 1, current: 0, done: false, type: 'sword' }
        ];
        
        this.map = Array.from({length: this.rows}, () => Array(this.cols).fill(0));
        
        // Spawn NPCs
        this.map[3][3] = 1; // NPC 1 (Apples)
        this.map[8][15] = 2; // NPC 2 (Sword)
        
        // Spawn Apples
        for(let i=0; i<5; i++) {
            this.map[Math.floor(Math.random()*(this.rows-2))+1][Math.floor(Math.random()*(this.cols-2))+1] = 3;
        }
        
        // Spawn Sword
        this.map[12][2] = 4;
        
        this.score = 0;
        this.msg = "Talk to NPCs (blue/purple) to get quests.";
        this.isGameOver = false;
        
        this.callbacks.onScoreUpdate(this.score);
        this.draw();
    }
    
    start() { this.resetState(); }
    restart() { this.start(); }
    togglePause() {}
    
    handleInput(e) {
        if(this.isGameOver) return;
        let dx = 0, dy = 0;
        if(e.key === 'ArrowUp' || e.key === 'w') dy = -1;
        if(e.key === 'ArrowDown' || e.key === 's') dy = 1;
        if(e.key === 'ArrowLeft' || e.key === 'a') dx = -1;
        if(e.key === 'ArrowRight' || e.key === 'd') dx = 1;
        if(dx !== 0 || dy !== 0) this.move(dx, dy);
    }
    
    handleMobileInput(btnId, isPressed) {
        if(!isPressed || this.isGameOver) return;
        let dx = 0, dy = 0;
        if(btnId === 'up') dy = -1;
        if(btnId === 'down') dy = 1;
        if(btnId === 'left') dx = -1;
        if(btnId === 'right') dx = 1;
        if(dx !== 0 || dy !== 0) this.move(dx, dy);
    }
    
    move(dx, dy) {
        let nr = this.player.y + dy;
        let nc = this.player.x + dx;
        
        if(nr<0 || nc<0 || nr>=this.rows || nc>=this.cols) return;
        
        let cell = this.map[nr][nc];
        
        if(cell === 1) { // NPC 1
            if(this.inventory.apple >= 3 && !this.quests[0].done) {
                this.quests[0].done = true;
                this.inventory.apple -= 3;
                this.score += 500;
                this.msg = "Thanks for the apples!";
            } else if (this.quests[0].done) {
                this.msg = "You already helped me. Thanks!";
            } else {
                this.msg = "NPC: " + this.quests[0].text;
            }
        } else if (cell === 2) { // NPC 2
             if(this.inventory.sword >= 1 && !this.quests[1].done) {
                this.quests[1].done = true;
                this.inventory.sword -= 1;
                this.score += 500;
                this.msg = "My sword! Thank you hero!";
            } else if (this.quests[1].done) {
                this.msg = "I will guard this village well.";
            } else {
                this.msg = "NPC: " + this.quests[1].text;
            }
        } else {
            this.player.x = nc;
            this.player.y = nr;
            
            if(cell === 3) { // Apple
                this.inventory.apple++;
                this.map[nr][nc] = 0;
                this.msg = "Found an Apple!";
            } else if (cell === 4) {
                this.inventory.sword++;
                this.map[nr][nc] = 0;
                this.msg = "Found a rusty sword!";
            }
        }
        
        this.callbacks.onScoreUpdate(this.score);
        this.checkWin();
        this.draw();
    }
    
    checkWin() {
        if(this.quests.every(q => q.done)) {
            this.msg = "You completed all quests! Game Over.";
            setTimeout(() => this.gameOver(), 2000);
        }
    }
    
    draw() {
        this.ctx.fillStyle = '#27ae60';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        for(let r=0; r<this.rows; r++) {
            for(let c=0; c<this.cols; c++) {
                let v = this.map[r][c];
                let x = c*this.tileSize;
                let y = r*this.tileSize;
                
                if (v === 1) {
                    this.ctx.fillStyle = '#2980b9'; // Blue NPC
                    this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
                } else if (v === 2) {
                    this.ctx.fillStyle = '#8e44ad'; // Purple NPC
                    this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
                } else if (v === 3) {
                    this.ctx.fillStyle = '#e74c3c'; // Apple
                    this.ctx.beginPath();
                    this.ctx.arc(x+20, y+20, 10, 0, Math.PI*2);
                    this.ctx.fill();
                } else if (v === 4) {
                    this.ctx.fillStyle = '#7f8c8d'; // Sword
                    this.ctx.fillRect(x+15, y+5, 10, 30);
                }
            }
        }
        
        // Player
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x*this.tileSize+20, this.player.y*this.tileSize+20, 15, 0, Math.PI*2);
        this.ctx.fill();
        
        // UI Bottom
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, this.canvas.height - 80, this.canvas.width, 80);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Outfit';
        this.ctx.fillText(this.msg, 10, this.canvas.height - 50);
        this.ctx.fillText(`Inv: Apples(${this.inventory.apple}) Sword(${this.inventory.sword})`, 10, this.canvas.height - 20);
    }
    
    gameOver() {
        this.isGameOver = true;
        this.callbacks.onGameOver(this.score);
    }
    
    cleanup() {
        document.removeEventListener('keydown', this.handleInput);
    }
}
window.QuestAdventureGame = QuestAdventureGame;
