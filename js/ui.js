// UI Management
const UI = {
    gameGrid: document.getElementById('game-grid'),
    noResults: document.getElementById('no-results'),
    
    // Render the grid of games based on a list
    renderGames(gamesList) {
        this.gameGrid.innerHTML = '';
        
        if (gamesList.length === 0) {
            this.noResults.classList.remove('hidden');
            return;
        }
        
        this.noResults.classList.add('hidden');
        
        gamesList.forEach(game => {
            const card = document.createElement('div');
            card.className = 'game-card';
            
            const isFav = Storage.isFavorite(game.id);
            
            card.innerHTML = `
                <div class="card-thumb">
                    ${game.thumbEmoji}
                </div>
                <div class="card-content">
                    <h3 class="card-title">${game.title}</h3>
                    <div class="card-meta">
                        <span class="difficulty-badge difficulty-${game.difficulty}">${game.difficulty}</span>
                        <span style="color: var(--text-muted)">${game.category}</span>
                    </div>
                    <p class="card-desc">${game.desc}</p>
                    
                    <div class="card-actions">
                        <button class="btn btn-primary btn-play" data-id="${game.id}">PLAY NOW</button>
                        <button class="btn-icon fav-btn ${isFav ? 'active' : ''}" data-id="${game.id}">
                            ${isFav ? '♥' : '♡'}
                        </button>
                    </div>
                </div>
            `;
            
            this.gameGrid.appendChild(card);
        });
    },

    updateStats() {
        document.getElementById('stat-played').textContent = Storage.getGamesPlayed();
        document.getElementById('stat-favorites').textContent = Storage.getFavorites().length;
    }
};
