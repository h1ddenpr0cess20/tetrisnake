/**
 * Snake Class
 * Represents the player-controlled snake in the game.
 * Handles movement, collision detection, and dynamic speed calculations.
 */
class Snake {
  /**
   * Initializes a new Snake instance
   */
  constructor() {
    this.body = [];                     // Array of body segments (each with x,y)
    this.direction = { x: 0, y: 1 };    // Current movement direction
    this.nextDirection = null;          // Buffered next direction change
    this.activeDirectionKey = null;     // Currently held direction key
    this.keyHoldStart = 0;              // Timestamp when key was first held
    this.lastUpdateTime = 0;            // Timestamp of last movement update
    this.directionChangeDelay = 16;     // Minimum delay between direction changes (1 frame at 60fps)
  }

  /**
   * Creates a new snake at the starting position
   */
  spawn() {
    this.body = [];
    const startY = 0;                   // Start at the top of the grid
    const startX = Math.floor(config.GRID_WIDTH / 2); // Center horizontally
    const initialLen = Math.floor(Math.random() * Math.min(4, Math.floor(config.GRID_HEIGHT / 2))) + 1;
    
    // Create a vertical snake with random initial length
    for (let i = 0; i < initialLen; i++) {
      this.body.push({ x: startX, y: startY - i });
    }
    
    // Reset movement properties
    this.direction = { x: 0, y: 1 };    // Start moving downward
    this.nextDirection = null;
    this.activeDirectionKey = null;
    this.keyHoldStart = 0;
    this.lastUpdateTime = 0;
  }

  /**
   * Returns the head segment of the snake
   * @returns {Object} The head segment with x,y coordinates
   */
  getHead() {
    return this.body[0];
  }

  /**
   * Moves the snake one step in the current direction
   * @param {boolean} eatFood - Whether the snake is eating food
   * @returns {Object} The new head position
   */
  move(eatFood) {
    const now = performance.now();
    
    // Apply any buffered direction change
    if (this.nextDirection) {
      this.direction = this.nextDirection;
      this.nextDirection = null;
    }
    
    // Calculate new head position
    const head = this.getHead();
    const newHead = { x: head.x + this.direction.x, y: head.y + this.direction.y };
    
    // Add new head to the front
    this.body.unshift(newHead);
    
    // Remove tail unless eating food
    if (!eatFood) {
      this.body.pop();
    }
    
    this.lastUpdateTime = now;
    return newHead;
  }

  /**
   * Attempts to change the snake's direction
   * @param {Object} newDir - The new direction vector {x, y}
   * @returns {boolean} Whether the direction was changed
   */
  changeDirection(newDir) {
    const now = performance.now();
    
    // Prevent 180-degree turns (snake can't reverse into itself)
    if (newDir.x === -this.direction.x && newDir.y === -this.direction.y) {
      return false;
    }
    
    // Check if this is actually a new direction
    const isNewDirection = newDir.x !== this.direction.x || newDir.y !== this.direction.y;
    
    // Buffer direction change if too soon after last movement
    if (isNewDirection && now - this.lastUpdateTime < this.directionChangeDelay) {
      this.nextDirection = newDir;
      return true;
    }
    
    // Apply immediate direction change
    if (isNewDirection) {
      this.direction = newDir;
    }
    
    return isNewDirection;
  }

  /**
   * Calculates the current movement delay based on level and input
   * @param {number} level - The current game level
   * @returns {number} The calculated delay in milliseconds
   */
  computeDelay(level) {
    // Adjust base speed based on level and snake length
    const extraSegments = this.body.length - 1;
    
    // Calculate level-based speed reduction
    const levelSpeedReduction = Math.min(level - 1, 9) * 20; // Increased level impact
    
    // VERY dramatic per-segment effect - 20ms per segment
    // At 10 segments, this would reduce delay by 200ms!
    const lengthSpeedReduction = extraSegments * 20;
    
    // Ensure a reasonable minimum speed (not too fast)
    const baseDelay = Math.max(
      60, // Slightly lower minimum delay
      config.SPEEDS.MOVE_DELAY - levelSpeedReduction - lengthSpeedReduction
    );
    
    // Apply acceleration when holding down a direction key
    let finalDelay = baseDelay;
    if (this.activeDirectionKey && this.keyHoldStart) {
      const holdTime = performance.now() - this.keyHoldStart;
      const factor = Math.min(holdTime / config.SPEEDS.HOLD_SCALE, 1);
      
      // Calculate accelerated speed with a reasonable minimum
      finalDelay = Math.max(
        40, // Allow even faster speed with key held
        baseDelay - (baseDelay - config.SPEEDS.FAST_MOVE_DELAY) * factor
      );
    }
    
    return finalDelay;
  }

  /**
   * Sets the active direction key being held
   * @param {string} key - The key identifier
   * @param {number} timestamp - The time when the key was pressed
   */
  setActiveDirection(key, timestamp) {
    if (this.activeDirectionKey !== key) {
      this.activeDirectionKey = key;
      this.keyHoldStart = timestamp;
    }
  }

  /**
   * Clears any active direction key state
   */
  clearActiveDirection() {
    this.activeDirectionKey = null;
    this.keyHoldStart = 0;
  }

  /**
   * Checks if a position collides with the snake's body
   * @param {number} x - X coordinate to check
   * @param {number} y - Y coordinate to check
   * @param {boolean} excludeTail - Whether to exclude the tail segment from collision check
   * @returns {boolean} True if collision detected
   */
  isCollidingWith(x, y, excludeTail = false) {
    return this.body.some((seg, i) => {
      // Skip the head since we're checking for the position of the new head
      if (i === 0) {
        return false;
      }
      
      // Optionally skip the tail (useful when snake is moving)
      if (excludeTail && i === this.body.length - 1) {
        return false;
      }
      
      return seg.x === x && seg.y === y;
    });
  }
} 