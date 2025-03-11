/**
 * Game Class
 * The core game controller that manages game state, logic, and components.
 * Handles the main game loop, input processing, and game event coordination.
 */
class Game {
  /**
   * Creates a new Game instance
   * @param {string} canvasId - The ID of the canvas element for rendering
   */
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.snake = new Snake();
    this.grid = new Grid();
    this.renderer = new Renderer(this.canvas);
    this.inputHandler = new InputHandler();
    this.audioManager = new AudioManager();
    this.ui = new UI({
      mainMenu: "mainMenu",
      paused: "pausedOverlay",
      gameOver: "gameOverOverlay",
      finalScore: "finalScore",
      finalLevel: "finalLevel",
      startButton: "startButton",
      restartButton: "restartButton"
    });

    // Game state variables
    this.score = 0;
    this.level = 1;
    this.gameOver = false;
    this.paused = false;
    this.lastMoveTime = 0;
    this.accumulator = 0;
    
    this.bindEvents();
    
    // Set initial UI state
    this.ui.updateSoundButtonText();
    this.ui.updateMusicButtonText();
  }

  /**
   * Binds all event handlers for game interaction
   */
  bindEvents() {
    // Handle window resize
    window.addEventListener("resize", () => this.renderer.resizeCanvas());
    
    // Game start handler
    this.ui.onStartGame(() => {
      this.ui.hideMainMenu();
      this.start();
    });
    
    // Game restart handler
    this.ui.onRestartGame(() => {
      this.ui.hideGameOver();
      this.reset();
      
      // Resume music if not muted
      if (!this.audioManager.isMusicMuted) {
        this.audioManager.startBackgroundMusic('main');
      }
    });
    
    // Pause menu resume button handler
    this.ui.onResumeGame(() => {
      this.paused = false;
      this.ui.togglePauseMenu(false);
      this.audioManager.resumeBackgroundMusic();
    });
    
    // Pause menu quit button handler
    this.ui.onQuitToMenu(() => {
      this.quitToMainMenu();
    });
    
    // Audio controls
    this.ui.onSoundToggle(() => {
      const isMuted = this.audioManager.toggleMute();
      return isMuted;
    });
    
    this.ui.onMusicToggle(() => {
      const isMuted = this.audioManager.toggleMusic();
      return isMuted;
    });
  }

  /**
   * Starts a new game session
   */
  start() {
    this.reset();
    this.lastMoveTime = performance.now();
    this.audioManager.startBackgroundMusic();
    this.gameLoop(this.lastMoveTime);
  }

  /**
   * Resets the game state to initial values
   */
  reset() {
    this.score = 0;
    this.level = 1;
    this.gameOver = false;
    this.paused = false;
    this.grid.reset();
    this.snake.spawn();
    this.grid.spawnFood(this.snake);
    
    // Clear the canvas to prevent any remnants of the previous game
    this.renderer.clear();
  }

  /**
   * Main game loop, runs every animation frame
   * @param {number} timestamp - Current time from requestAnimationFrame
   */
  gameLoop(timestamp) {
    if (!this.lastMoveTime) this.lastMoveTime = timestamp;
    const delta = timestamp - this.lastMoveTime;
    this.lastMoveTime = timestamp;

    this.handleInput();

    if (!this.paused && !this.gameOver) {
      this.updateGame(delta);
    }

    // Only render the game if not in game over state
    if (!this.gameOver) {
      this.renderer.render(this.snake, this.grid, this.score, this.level);
    }
    
    requestAnimationFrame(timestamp => this.gameLoop(timestamp));
  }

  /**
   * Processes player input each frame
   */
  handleInput() {
    // Handle pause toggle with debouncing
    if (this.inputHandler.isPausePressed()) {
      if (!this.pausePressed) {
        this.paused = !this.paused;
        this.ui.togglePauseMenu(this.paused);
        
        // Update audio state based on pause state
        if (this.paused) {
          this.audioManager.pauseBackgroundMusic();
        } else {
          this.audioManager.resumeBackgroundMusic();
        }
        
        this.pausePressed = true;
      }
    } else {
      this.pausePressed = false;
    }

    // Handle quit to main menu (only when paused)
    if (this.paused && this.inputHandler.isQuitPressed()) {
      this.quitToMainMenu();
      return;
    }

    // Process movement input when game is active
    if (!this.paused && !this.gameOver) {
      const directionInput = this.inputHandler.getDirection();
      if (directionInput) {
        // Apply direction change and provide immediate visual feedback
        this.snake.changeDirection(directionInput.direction);
        this.snake.setActiveDirection(directionInput.key, performance.now());
      } else {
        this.snake.clearActiveDirection();
      }
    }
  }

  /**
   * Updates game state based on elapsed time
   * @param {number} delta - Time elapsed since last frame in ms
   */
  updateGame(delta) {
    this.accumulator += delta;
    
    // Calculate the snake's movement delay based on current level and length
    const delay = this.snake.computeDelay(this.level);
    
    // Time-based movement system
    while (this.accumulator >= delay) {
      this.accumulator -= delay;
      this.updateSnake();
    }
  }

  /**
   * Updates snake position and handles collisions
   */
  updateSnake() {
    const head = this.snake.getHead();
    const newHead = { 
      x: head.x + this.snake.direction.x, 
      y: head.y + this.snake.direction.y 
    };

    // Check for collisions with walls or placed blocks
    if (this.grid.isCollision(newHead.x, newHead.y)) {
      this.audioManager.play('collision');
      this.handleCollision();
      return;
    }
    
    // Check for self-collision (excluding head and tail)
    if (this.snake.isCollidingWith(newHead.x, newHead.y, true)) {
      this.audioManager.play('collision');
      this.handleCollision();
      return;
    }

    // Check for food collection
    const isEating = this.grid.isSnakeEatingFood(newHead.x, newHead.y);
    
    // Play appropriate audio feedback
    if (!isEating) {
      this.audioManager.play('move');
    }
    
    this.snake.move(isEating);
    
    if (isEating) {
      this.handleFoodEaten();
    }
  }

  /**
   * Handles collision between snake and grid/blocks
   */
  handleCollision() {
    // Play impact sound
    this.audioManager.play('collision');
    
    // Add a brief screen shake effect
    const gameContainer = document.getElementById('gameContainer');
    gameContainer.classList.add('shake');
    setTimeout(() => {
      gameContainer.classList.remove('shake');
    }, 300);
    
    // Convert snake to static blocks
    this.grid.lockSnake(this.snake);
    
    // Check for and clear completed lines
    const linesCleared = this.grid.clearLines();
    
    if (linesCleared > 0) {
      this.audioManager.play('lineClear');
      this.score += linesCleared * 50 * this.level;
    }
    
    // Update level based on blocks placed - make it less frequent to prevent bugs
    // Changed from 50 to 80 blocks per level to slow down progression
    this.level = 1 + Math.floor(this.grid.landedBlocks / 80);
    
    // Intensify music at higher levels - pass the numeric level instead of 'intense'
    if (this.level >= 5 && !this.audioManager.isMusicMuted) {
      // Pass the actual level number instead of a string
      this.audioManager.changeBackgroundMusic(this.level);
    }
    
    // Spawn new snake
    this.snake.spawn();
    
    // End game if no room to spawn
    if (this.snake.body.some(seg => this.grid.isStaticBlock(seg.x, seg.y))) {
      this.endGame();
    }
  }

  /**
   * Handles food collection logic
   */
  handleFoodEaten() {
    this.audioManager.play('eat');
    this.score += this.level * 10;
    
    // Update music speed based on snake length to match gameplay speed
    // Only update if music isn't muted
    if (!this.audioManager.isMusicMuted && this.snake.body.length > 1) {
      // Calculate effective speed level from snake length
      // Use snake length directly in a formula that smoothly increases with length
      // Every ~8 segments = +1 music level
      const lengthSpeedLevel = 1 + (this.snake.body.length / 8);
      
      // Use the higher of game level or length-based level
      const effectiveLevel = Math.max(this.level, lengthSpeedLevel);
      
      // Update the music speed gradually
      this.audioManager.changeBackgroundMusic(effectiveLevel);
    }
    
    this.grid.spawnFood(this.snake);
  }

  /**
   * Triggers game over state
   */
  endGame() {
    this.gameOver = true;
    this.audioManager.play('gameOver');
    this.audioManager.stopBackgroundMusic();
    this.ui.showGameOver(this.score, this.level);
  }

  /**
   * Exits to main menu from the game
   */
  quitToMainMenu() {
    this.paused = false;
    this.gameOver = false;
    this.ui.hideAll();
    this.ui.showMainMenu();
    this.audioManager.stopBackgroundMusic();
    this.reset();
  }
} 