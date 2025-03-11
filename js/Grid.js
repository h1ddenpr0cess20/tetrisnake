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
   * Spawns food at a random empty position, never in the top row
   * @param {Snake} snake - Snake object to avoid spawning food on
   */
  spawnFood(snake) {
    do {
      this.food = {
        x: Math.floor(Math.random() * config.GRID_WIDTH),
        // Start from row 1 (second row) instead of row 0 (top row)
        y: Math.floor(Math.random() * (config.GRID_HEIGHT - 1)) + 1
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
   * Locks the snake into static blocks (turns snake into blocks)
   * @param {Snake} snake - The snake object to lock
   */
  lockSnake(snake) {
    // Add each snake segment as a static block with color variations
    for (let i = 0; i < snake.body.length; i++) {
      const seg = snake.body[i];
      
      // Store original color reference to maintain color scheme,
      // but give a slight color variation to make each block look unique
      const variance = Math.floor(Math.random() * 30) - 15; // Random value between -15 and 15
      const blockColor = i === 0 
        ? config.COLORS.BLOCK // Head is always block color
        : this.adjustBlockColor(config.COLORS.BLOCK, variance);
      
      this.staticBlocks.set(`${seg.x},${seg.y}`, blockColor);
      this.landedBlocks++;
    }
  }
  
  /**
   * Helper to adjust a color's brightness for block variation
   * @param {string} color - Hex color
   * @param {number} adjustment - Amount to adjust (-100 to +100)
   * @returns {string} Adjusted color
   */
  adjustBlockColor(color, adjustment) {
    // Parse the hex color
    const hex = color.startsWith('#') ? color.slice(1) : color;
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Adjust each component
    const newR = Math.max(0, Math.min(255, r + adjustment));
    const newG = Math.max(0, Math.min(255, g + adjustment));
    const newB = Math.max(0, Math.min(255, b + adjustment));
    
    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
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