// Main App State & Routing
const App = {
    state: {
        activeFilter: 'all',
        activeCategory: 'all',
        searchQuery: '',
        currentGameId: null,
        gameEngine: null // Instance of the active game
    },

    init() {
        UI.updateStats();
        this.filterAndRender();
        this.bindEvents();
    },

    bindEvents() {
        // Search
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.state.searchQuery = e.target.value.toLowerCase();
            this.filterAndRender();
        });

        // Filters (Difficulty)
        document.getElementById('difficulty-filters').addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                document.querySelectorAll('#difficulty-filters .filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.state.activeFilter = e.target.dataset.difficulty;
                this.filterAndRender();
            }
        });

        // Filters (Category)
        document.getElementById('category-filters').addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                document.querySelectorAll('#category-filters .filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.state.activeCategory = e.target.dataset.category;
                this.filterAndRender();
            }
        });

        // Top Nav Filters
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                e.target.classList.add('active');
                
                const filter = e.target.dataset.filter;
                if (filter === 'favorites') {
                    // Quick hack to show only favorites using our existing system
                    this.state.activeFilter = 'favorites';
                } else if (filter === 'all') {
                    this.state.activeFilter = 'all';
                }
                
                // Switch to home view if in game
                if(this.state.currentGameId) {
                    this.exitGame();
                }

                this.filterAndRender();
            });
        });

        // Explore button
        document.getElementById('explore-btn').addEventListener('click', () => {
            document.getElementById('games').scrollIntoView({ behavior: 'smooth' });
        });

        // Game Grid Delegation (Play & Favorite)
        document.getElementById('game-grid').addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-play')) {
                const gameId = e.target.dataset.id;
                this.launchGame(gameId);
            } else if (e.target.classList.contains('fav-btn') || e.target.closest('.fav-btn')) {
                const btn = e.target.classList.contains('fav-btn') ? e.target : e.target.closest('.fav-btn');
                const gameId = btn.dataset.id;
                const isFav = Storage.toggleFavorite(gameId);
                btn.textContent = isFav ? '♥' : '♡';
                btn.classList.toggle('active', isFav);
                UI.updateStats();
                
                // Re-render if currently viewing favorites
                if(this.state.activeFilter === 'favorites') {
                    this.filterAndRender();
                }
            }
        });

        // Game View Events
        document.getElementById('back-btn').addEventListener('click', () => this.exitGame());
        document.getElementById('exit-btn').addEventListener('click', () => this.exitGame());
        
        document.getElementById('favorite-toggle-btn').addEventListener('click', (e) => {
            if(!this.state.currentGameId) return;
            const isFav = Storage.toggleFavorite(this.state.currentGameId);
            e.target.textContent = isFav ? '♥' : '♡';
            e.target.classList.toggle('active', isFav);
            UI.updateStats();
        });

        // Mobile Controls Delegation
        // This passes events to the active game engine if it supports it
        const mobileControls = document.getElementById('mobile-controls');
        mobileControls.addEventListener('touchstart', (e) => {
            if (e.target.tagName === 'BUTTON' && this.state.gameEngine && this.state.gameEngine.handleMobileInput) {
                e.preventDefault(); // Prevent scroll
                this.state.gameEngine.handleMobileInput(e.target.id.replace('btn-', ''), true);
            }
        }, {passive: false});

        mobileControls.addEventListener('touchend', (e) => {
            if (e.target.tagName === 'BUTTON' && this.state.gameEngine && this.state.gameEngine.handleMobileInput) {
                e.preventDefault();
                this.state.gameEngine.handleMobileInput(e.target.id.replace('btn-', ''), false);
            }
        }, {passive: false});
    },

    filterAndRender() {
        let filtered = GamesDB;

        // Apply Favorites filter specifically
        if (this.state.activeFilter === 'favorites') {
            const favs = Storage.getFavorites();
            filtered = filtered.filter(g => favs.includes(g.id));
        } 
        // Apply Difficulty filter
        else if (this.state.activeFilter !== 'all') {
            filtered = filtered.filter(g => g.difficulty === this.state.activeFilter);
        }

        // Apply Category filter
        if (this.state.activeCategory !== 'all') {
            filtered = filtered.filter(g => g.category === this.state.activeCategory);
        }

        // Apply Search
        if (this.state.searchQuery) {
            filtered = filtered.filter(g => 
                g.title.toLowerCase().includes(this.state.searchQuery) || 
                g.desc.toLowerCase().includes(this.state.searchQuery)
            );
        }

        UI.renderGames(filtered);
    },

    launchGame(gameId) {
        const game = getGameById(gameId);
        if (!game) return;

        this.state.currentGameId = gameId;
        Storage.incrementGamesPlayed();
        UI.updateStats();

        // Switch UI
        document.getElementById('app-view').classList.add('hidden');
        document.getElementById('game-view').classList.remove('hidden');
        window.scrollTo(0,0);

        // Update Game Header
        document.getElementById('current-game-title').textContent = game.title;
        const favBtn = document.getElementById('favorite-toggle-btn');
        const isFav = Storage.isFavorite(gameId);
        favBtn.textContent = isFav ? '♥' : '♡';
        favBtn.classList.toggle('active', isFav);

        document.getElementById('current-score').textContent = '0';
        document.getElementById('best-score').textContent = Storage.getHighScore(gameId);

        // Initialize Game Engine based on global object mapping
        // We assume each game file registers a class on the window object (e.g. window.SnakeGame)
        const engineClassName = gameId.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('') + 'Game';
        
        if (window[engineClassName]) {
            const canvas = document.getElementById('game-canvas');
            
            // Clean up old context or resize
            canvas.width = 800; // Default logical size, handled by engine
            canvas.height = 600;
            
            this.state.gameEngine = new window[engineClassName](canvas, {
                onScoreUpdate: (score) => {
                    document.getElementById('current-score').textContent = score;
                },
                onGameOver: (score) => {
                    const isNewBest = Storage.setHighScore(gameId, score);
                    if (isNewBest) {
                        document.getElementById('best-score').textContent = score;
                    }
                    this.showGameOverlay('Game Over', `Final Score: ${score}${isNewBest ? ' (New High Score!)' : ''}`, 'PLAY AGAIN');
                }
            });

            this.showGameOverlay(game.title, game.desc, 'START GAME');
            
            // Bind overlay button to start
            const overlayBtn = document.getElementById('overlay-btn');
            overlayBtn.onclick = () => {
                this.hideGameOverlay();
                this.state.gameEngine.start();
            };

            // Bind Engine specific controls
            document.getElementById('pause-btn').onclick = () => {
                if(this.state.gameEngine.togglePause) this.state.gameEngine.togglePause();
            };
            
            document.getElementById('restart-btn').onclick = () => {
                this.hideGameOverlay();
                if(this.state.gameEngine.restart) this.state.gameEngine.restart();
            };
            
        } else {
            // Placeholder for unimplemented games
            this.showGameOverlay('Coming Soon', 'This game engine is not loaded yet.', 'BACK');
            document.getElementById('overlay-btn').onclick = () => this.exitGame();
        }
    },

    exitGame() {
        if (this.state.gameEngine && this.state.gameEngine.cleanup) {
            this.state.gameEngine.cleanup();
        }
        this.state.gameEngine = null;
        this.state.currentGameId = null;

        document.getElementById('game-view').classList.add('hidden');
        document.getElementById('app-view').classList.remove('hidden');
        this.filterAndRender(); // Refresh in case stats/favorites changed
    },

    showGameOverlay(title, desc, btnText) {
        document.getElementById('overlay-title').textContent = title;
        document.getElementById('overlay-desc').textContent = desc;
        document.getElementById('overlay-btn').textContent = btnText;
        document.getElementById('game-overlay').classList.remove('hidden');
    },

    hideGameOverlay() {
        document.getElementById('game-overlay').classList.add('hidden');
    }
};

// Start App
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
