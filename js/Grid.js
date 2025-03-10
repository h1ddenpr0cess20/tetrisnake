/**
 * Grid Class
 * Manages the game grid including static blocks, food items, and collision detection.
 * Handles line clearing mechanics similar to Tetris.
 */
class Grid {
  /**
   * Initializes a new Grid instance
   */
  constructor() {
    this.staticBlocks = new Map();       // Map of placed blocks with position as key
    this.food = { x: 0, y: 0 };          // Current food position
    this.landedBlocks = 0;               // Counter for blocks that have landed
  }

  /**
   * Resets the grid to initial state
   */
  reset() {
    this.staticBlocks.clear();
    this.landedBlocks = 0;
    this.spawnFood();
  }

  /**
   * Checks if a position contains a static block
   * @param {number} x - X coordinate to check
   * @param {number} y - Y coordinate to check
   * @returns {boolean} True if position contains a static block
   */
  isStaticBlock(x, y) {
    return this.staticBlocks.has(`${x},${y}`);
  }

  /**
   * Spawns food at a random empty position
   * @param {Snake} snake - Snake object to avoid spawning food on
   */
  spawnFood(snake) {
    do {
      this.food = {
        x: Math.floor(Math.random() * config.GRID_WIDTH),
        y: Math.floor(Math.random() * config.GRID_HEIGHT)
      };
    } while (
      this.isStaticBlock(this.food.x, this.food.y) ||
      (snake && snake.isCollidingWith(this.food.x, this.food.y))
    );
  }

  /**
   * Checks if a position contains food
   * @param {number} x - X coordinate to check
   * @param {number} y - Y coordinate to check
   * @returns {boolean} True if position contains food
   */
  isSnakeEatingFood(x, y) {
    return x === this.food.x && y === this.food.y;
  }

  /**
   * Checks if a position results in a collision
   * @param {number} x - X coordinate to check
   * @param {number} y - Y coordinate to check
   * @returns {boolean} True if position is invalid or occupied
   */
  isCollision(x, y) {
    return x < 0 || 
           x >= config.GRID_WIDTH || 
           y < 0 || 
           y >= config.GRID_HEIGHT || 
           this.isStaticBlock(x, y);
  }

  /**
   * Converts snake segments to static blocks on the grid
   * @param {Snake} snake - The snake to lock in place
   */
  lockSnake(snake) {
    for (const seg of snake.body) {
      this.staticBlocks.set(`${seg.x},${seg.y}`, config.COLORS.BLOCK);
      this.landedBlocks++;
    }
  }

  /**
   * Clears any full lines and shifts blocks above down
   * @returns {number} Number of lines cleared
   */
  clearLines() {
    let linesCleared = 0;
    
    // Check lines from bottom to top
    for (let y = config.GRID_HEIGHT - 1; y >= 0; y--) {
      if (this.isLineFull(y)) {
        linesCleared++;
        this.removeLine(y);
        y++; // Check the same line again after shifting
      }
    }
    
    return linesCleared;
  }

  /**
   * Checks if a row is completely filled with blocks
   * @param {number} y - Y coordinate of the line to check
   * @returns {boolean} True if the line is full
   */
  isLineFull(y) {
    for (let x = 0; x < config.GRID_WIDTH; x++) {
      if (!this.isStaticBlock(x, y)) return false;
    }
    return true;
  }

  /**
   * Removes a line and shifts all blocks above it down
   * @param {number} y - Y coordinate of the line to remove
   */
  removeLine(y) {
    // Remove the full line
    for (let x = 0; x < config.GRID_WIDTH; x++) {
      this.staticBlocks.delete(`${x},${y}`);
    }
    
    // Shift all blocks above the line down one row
    const newStatic = new Map();
    for (const [pos, col] of this.staticBlocks) {
      const [px, py] = pos.split(",").map(Number);
      newStatic.set(`${px},${py < y ? py + 1 : py}`, col);
    }
    
    this.staticBlocks = newStatic;
  }
} 