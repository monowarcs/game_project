// LocalStorage wrapper
const Storage = {
    // Keys
    FAVORITES_KEY: 'arcade_favorites',
    PLAYED_GAMES_KEY: 'arcade_played_count',
    
    // --- Scores ---
    getHighScore(gameId) {
        const val = localStorage.getItem(`${gameId}_highscore`);
        return val ? parseInt(val) : 0;
    },
    
    setHighScore(gameId, score) {
        const current = this.getHighScore(gameId);
        if (score > current) {
            localStorage.setItem(`${gameId}_highscore`, score);
            return true; // New high score
        }
        return false;
    },

    // --- Favorites ---
    getFavorites() {
        const val = localStorage.getItem(this.FAVORITES_KEY);
        return val ? JSON.parse(val) : [];
    },

    toggleFavorite(gameId) {
        let favs = this.getFavorites();
        const index = favs.indexOf(gameId);
        let isFav = false;
        
        if (index > -1) {
            favs.splice(index, 1);
        } else {
            favs.push(gameId);
            isFav = true;
        }
        
        localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favs));
        return isFav;
    },

    isFavorite(gameId) {
        return this.getFavorites().includes(gameId);
    },

    // --- Stats ---
    getGamesPlayed() {
        const val = localStorage.getItem(this.PLAYED_GAMES_KEY);
        return val ? parseInt(val) : 0;
    },

    incrementGamesPlayed() {
        const val = this.getGamesPlayed() + 1;
        localStorage.setItem(this.PLAYED_GAMES_KEY, val);
        return val;
    }
};
