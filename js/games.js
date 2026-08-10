// Database of all games
const GamesDB = [
    // --- EASY ---
    {
        id: 'snake',
        title: 'Snake',
        desc: 'Classic Snake Game. Eat food to grow, avoid the walls and your own tail.',
        difficulty: 'easy',
        category: 'arcade',
        thumbEmoji: '🐍'
    },
    {
        id: 'flappy-bird',
        title: 'Flappy Bird',
        desc: 'Navigate the bird through the pipes. Tap or Space to flap.',
        difficulty: 'easy',
        category: 'arcade',
        thumbEmoji: '🐦'
    },
    {
        id: 'pong',
        title: 'Pong',
        desc: 'Classic table tennis arcade game against an AI opponent.',
        difficulty: 'easy',
        category: 'arcade',
        thumbEmoji: '🏓'
    },
    {
        id: 'breakout',
        title: 'Breakout',
        desc: 'Destroy all the bricks with the bouncing ball.',
        difficulty: 'easy',
        category: 'arcade',
        thumbEmoji: '🧱'
    },
    {
        id: 'tetris',
        title: 'Tetris',
        desc: 'Clear lines by arranging falling blocks.',
        difficulty: 'easy',
        category: 'puzzle',
        thumbEmoji: '🧩'
    },
    {
        id: '2048',
        title: '2048',
        desc: 'Slide and merge tiles to reach the 2048 tile.',
        difficulty: 'easy',
        category: 'puzzle',
        thumbEmoji: '🔢'
    },

    // --- HARD ---
    {
        id: 'dungeon-crawler',
        title: 'Dungeon Crawler',
        desc: 'Explore the dungeon and defeat enemies.',
        difficulty: 'hard',
        category: 'rpg',
        thumbEmoji: '⚔️'
    },
    {
        id: 'mini-rpg',
        title: 'Mini RPG',
        desc: 'Level up, find items, and battle monsters.',
        difficulty: 'hard',
        category: 'rpg',
        thumbEmoji: '🛡️'
    },
    {
        id: 'pixel-adventure',
        title: 'Pixel Adventure',
        desc: 'Jump and run through challenging platforms.',
        difficulty: 'hard',
        category: 'action',
        thumbEmoji: '🏃'
    },
    {
        id: 'zombie-apocalypse',
        title: 'Zombie Apoc',
        desc: 'Survive endless waves of the undead.',
        difficulty: 'hard',
        category: 'action',
        thumbEmoji: '🧟'
    },
    {
        id: 'survival-island',
        title: 'Survival Island',
        desc: 'Gather resources and survive the night.',
        difficulty: 'hard',
        category: 'survival',
        thumbEmoji: '🌴'
    },
    {
        id: 'treasure-hunter',
        title: 'Treasure Hunter',
        desc: 'Navigate traps to find hidden treasure.',
        difficulty: 'hard',
        category: 'adventure',
        thumbEmoji: '💎'
    },
    {
        id: 'dungeon-escape',
        title: 'Dungeon Escape',
        desc: 'Find the keys and escape before time runs out.',
        difficulty: 'hard',
        category: 'puzzle',
        thumbEmoji: '🗝️'
    },
    {
        id: 'monster-hunter',
        title: 'Monster Hunter',
        desc: 'Face off against giant boss monsters.',
        difficulty: 'hard',
        category: 'action',
        thumbEmoji: '🦖'
    },
    {
        id: 'quest-adventure',
        title: 'Quest Adventure',
        desc: 'Talk to NPCs and complete quests.',
        difficulty: 'hard',
        category: 'rpg',
        thumbEmoji: '📜'
    },

    // --- MULTIPLAYER ---
    {
        id: '2player-pong',
        title: '2P Pong',
        desc: 'Classic Pong for two players on one keyboard.',
        difficulty: 'multiplayer',
        category: 'multiplayer',
        thumbEmoji: '🏸'
    },
    {
        id: '2player-snake',
        title: '2P Snake',
        desc: 'Competitive Snake. Cut off your opponent!',
        difficulty: 'multiplayer',
        category: 'multiplayer',
        thumbEmoji: '🐉'
    },
    {
        id: '2player-tank',
        title: '2P Tank Battle',
        desc: 'Shoot your opponent in a maze of walls.',
        difficulty: 'multiplayer',
        category: 'multiplayer',
        thumbEmoji: '🏎️'
    },
    {
        id: '2player-racing',
        title: '2P Racing',
        desc: 'Top-down racing. First to 3 laps wins.',
        difficulty: 'multiplayer',
        category: 'racing',
        thumbEmoji: '🏁'
    },
    {
        id: '2player-tictactoe',
        title: '2P Tic-Tac-Toe',
        desc: 'Classic logic game for two players.',
        difficulty: 'multiplayer',
        category: 'puzzle',
        thumbEmoji: '❌'
    }
];

// Helper to get game by ID
function getGameById(id) {
    return GamesDB.find(g => g.id === id);
}
