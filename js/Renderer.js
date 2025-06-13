/**
 * Renderer Class
 * Handles all game rendering operations using the HTML5 Canvas API.
 * Responsible for drawing the grid, snake, food, static blocks, and HUD.
 */
class Renderer {
  /**
   * Creates a renderer for the game
   * @param {HTMLCanvasElement} canvas - The canvas element to render on
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.cellSize = config.CELL_SIZE;
    this.resizeCanvas();
    
    // Create gradient patterns for game elements
    this.createPatterns();
    
    // Animation variables
    this.animationFrame = 0;
    this.glowIntensity = 0;
    this.glowDirection = 1;
  }

  /**
   * Creates gradient and pattern objects for game elements
   */
  createPatterns() {
    // Snake gradient (light at head, darker at tail)
    this.snakeGradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    this.snakeGradient.addColorStop(0, config.COLORS.SNAKE);
    this.snakeGradient.addColorStop(1, this.adjustColor(config.COLORS.SNAKE, -20));
    
    // Create snake pattern with green variants
    this.snakePattern = {
      bodyColor: config.COLORS.SNAKE,                       // Base green
      darkerColor: this.adjustColor(config.COLORS.SNAKE, -30), // Darker green
      lighterColor: this.adjustColor(config.COLORS.SNAKE, 20)  // Lighter green
    };
    
    // Food radial gradient
    this.foodGradient = this.ctx.createRadialGradient(
      this.cellSize / 2, this.cellSize / 2, this.cellSize / 10,
      this.cellSize / 2, this.cellSize / 2, this.cellSize / 1.5
    );
    this.foodGradient.addColorStop(0, this.adjustColor(config.COLORS.FOOD, 30));
    this.foodGradient.addColorStop(1, config.COLORS.FOOD);
  }

  /**
   * Helper to lighten or darken a color
   * @param {string} color - The HEX color
   * @param {number} amount - Amount to adjust (-100 to +100)
   * @returns {string} Adjusted color
   */
  adjustColor(color, amount) {
    let usePound = false;
    
    if (color[0] === "#") {
      color = color.slice(1);
      usePound = true;
    }
    
    const num = parseInt(color, 16);
    let r = (num >> 16) & 0xff;
    let g = (num >> 8) & 0xff;
    let b = num & 0xff;
    
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    
    return (usePound ? "#" : "") + 
           ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }
  /**
   * Resizes the canvas based on window dimensions
   * Adjusts cell size for responsive layout
   */
  resizeCanvas() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     ('ontouchstart' in window) ||
                     (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
    
    let scale;
    
    if (isMobile) {
      // Mobile-optimized scaling
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const availableHeight = screenHeight - 160; // Account for mobile controls
      
      // Calculate optimal scale based on screen dimensions
      const scaleByWidth = Math.floor(screenWidth / config.GRID_WIDTH);
      const scaleByHeight = Math.floor(availableHeight / (config.GRID_HEIGHT + config.HUD_HEIGHT / config.CELL_SIZE));
      scale = Math.max(12, Math.min(scaleByWidth, scaleByHeight));
    } else {
      // Desktop scaling
      scale = window.innerWidth < 600 ? 20 : config.CELL_SIZE;
    }
    
    this.canvas.width = scale * config.GRID_WIDTH;
    this.canvas.height = scale * config.GRID_HEIGHT + config.HUD_HEIGHT;
    this.cellSize = scale;
    
    // Apply CSS to ensure proper display on mobile
    if (isMobile) {
      this.canvas.style.width = '100%';
      this.canvas.style.height = 'auto';
      this.canvas.style.maxWidth = '100vw';
      this.canvas.style.maxHeight = 'calc(100vh - 160px)';
    }
    
    // Recreate patterns on resize
    this.createPatterns();
  }

  /**
   * Main render function that draws the complete game state
   * @param {Snake} snake - The snake object
   * @param {Grid} grid - The grid object containing static blocks and food
   * @param {number} score - Current game score
   * @param {number} level - Current game level
   */
  render(snake, grid, score, level) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Update animation values
    this.animationFrame = (this.animationFrame + 1) % 60;
    this.glowIntensity += 0.05 * this.glowDirection;
    if (this.glowIntensity > 1 || this.glowIntensity < 0) {
      this.glowDirection *= -1;
    }
    
    this.drawGrid();
    this.drawStaticBlocks(grid.staticBlocks);
    this.drawSnake(snake.body);
    this.drawFood(grid.food);
    this.drawHUD(score, level);
  }

  /**
   * Clears the entire canvas
   */
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Draws the grid lines
   */
  drawGrid() {
    this.ctx.strokeStyle = config.COLORS.GRID;
    this.ctx.lineWidth = 1;
    this.ctx.globalAlpha = 0.5;
    
    // Draw vertical lines
    for (let x = 0; x <= config.GRID_WIDTH; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * this.cellSize, 0);
      this.ctx.lineTo(x * this.cellSize, config.GRID_HEIGHT * this.cellSize);
      this.ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= config.GRID_HEIGHT; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * this.cellSize);
      this.ctx.lineTo(config.GRID_WIDTH * this.cellSize, y * this.cellSize);
      this.ctx.stroke();
    }
    
    // Reset global alpha
    this.ctx.globalAlpha = 1;
  }

  /**
   * Draws all static blocks on the grid
   * @param {Map} staticBlocks - Map of positions to block colors
   */
  drawStaticBlocks(staticBlocks) {
    for (const [pos, color] of staticBlocks) {
      const [x, y] = pos.split(",").map(Number);
      
      // Create block gradient for each static block
      const blockGradient = this.ctx.createLinearGradient(
        x * this.cellSize, y * this.cellSize,
        (x + 1) * this.cellSize, (y + 1) * this.cellSize
      );
      blockGradient.addColorStop(0, this.adjustColor(color, 20));
      blockGradient.addColorStop(1, color);
      
      // Draw with a cracked block appearance
      this.drawBlockWithTexture(x, y, blockGradient);
    }
  }
  
  /**
   * Draws a textured block at the specified position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {string|CanvasGradient} fillStyle - Fill style for the block
   */
  drawBlockWithTexture(x, y, fillStyle) {
    const cellX = x * this.cellSize;
    const cellY = y * this.cellSize;
    const size = this.cellSize;
    
    this.ctx.save();
    
    // Draw main block
    this.ctx.fillStyle = fillStyle;
    this.drawRoundedCell(x, y, fillStyle, 2);
    
    // Add crack/edge details
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.lineWidth = 1;
    
    // Draw crack lines
    this.ctx.beginPath();
    
    // Random crack pattern based on position
    const seed = (x * 7 + y * 13) % 5; // Deterministic randomness
    
    switch(seed) {
      case 0:
        // Diagonal crack
        this.ctx.moveTo(cellX + size * 0.2, cellY + size * 0.2);
        this.ctx.lineTo(cellX + size * 0.8, cellY + size * 0.8);
        break;
      case 1:
        // Y-shaped crack
        this.ctx.moveTo(cellX + size * 0.5, cellY);
        this.ctx.lineTo(cellX + size * 0.5, cellY + size * 0.6);
        this.ctx.lineTo(cellX + size * 0.3, cellY + size * 0.8);
        this.ctx.moveTo(cellX + size * 0.5, cellY + size * 0.6);
        this.ctx.lineTo(cellX + size * 0.7, cellY + size * 0.8);
        break;
      case 2:
        // Corner chip
        this.ctx.moveTo(cellX, cellY);
        this.ctx.lineTo(cellX + size * 0.3, cellY + size * 0.3);
        this.ctx.lineTo(cellX + size * 0.3, cellY);
        this.ctx.closePath();
        break;
      case 3:
        // Horizontal crack
        this.ctx.moveTo(cellX, cellY + size * 0.4);
        this.ctx.lineTo(cellX + size, cellY + size * 0.6);
        break;
      case 4:
        // Edge chip
        this.ctx.moveTo(cellX + size, cellY + size * 0.3);
        this.ctx.lineTo(cellX + size * 0.7, cellY + size * 0.5);
        this.ctx.lineTo(cellX + size, cellY + size * 0.7);
        break;
    }
    
    this.ctx.stroke();
    
    // Add highlight
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.beginPath();
    this.ctx.moveTo(cellX, cellY);
    this.ctx.lineTo(cellX + size, cellY);
    this.ctx.lineTo(cellX, cellY + size);
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.restore();
  }

  /**
   * Draws the snake on the grid
   * @param {Array} snakeBody - Array of snake segment positions
   */
  drawSnake(snakeBody) {
    if (snakeBody.length === 0) return;
    
    // Draw snake body segments from tail to head
    for (let i = snakeBody.length - 1; i >= 0; i--) {
      const seg = snakeBody[i];
      const isHead = i === 0;
      const isTail = i === snakeBody.length - 1;
      
      // Determine the segment's position relative to adjacent segments
      let prevSeg = i < snakeBody.length - 1 ? snakeBody[i + 1] : null;
      let nextSeg = i > 0 ? snakeBody[i - 1] : null;
      
      this.drawSnakeSegment(seg, isHead, isTail, prevSeg, nextSeg, i, snakeBody.length);
    }
  }
  
  /**
   * Draws a single snake segment with realistic appearance
   * @param {Object} seg - Segment position {x, y}
   * @param {boolean} isHead - Whether this is the head segment
   * @param {boolean} isTail - Whether this is the tail segment
   * @param {Object} prevSeg - Previous segment (for direction)
   * @param {Object} nextSeg - Next segment (for direction)
   * @param {number} index - Index in the snake body
   * @param {number} totalLength - Total length of the snake
   */
  drawSnakeSegment(seg, isHead, isTail, prevSeg, nextSeg, index, totalLength) {
    const x = seg.x * this.cellSize;
    const y = seg.y * this.cellSize;
    const size = this.cellSize;
    
    // Use the snake color directly from config
    const snakeColor = config.COLORS.SNAKE;
    const baseColor = snakeColor;
    const darkerColor = this.adjustColor(snakeColor, -30);
    const lighterColor = this.adjustColor(snakeColor, 20);
    
    // Save context state
    this.ctx.save();
    
    if (isHead) {
      // Draw head with glow
      this.ctx.shadowColor = snakeColor;
      this.ctx.shadowBlur = 10 * this.glowIntensity;
      
      // Draw main head shape
      this.ctx.fillStyle = snakeColor;
      this.drawRoundedCell(seg.x, seg.y, snakeColor, 5);
      
      // Add eyes
      const eyeSize = this.cellSize / 5;
      const eyeInset = this.cellSize / 3;
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.beginPath();
      this.ctx.arc(x + eyeInset, y + eyeInset, eyeSize, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.beginPath();
      this.ctx.arc(x + size - eyeInset, y + eyeInset, eyeSize, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Add pupils
      this.ctx.fillStyle = '#000000';
      this.ctx.beginPath();
      this.ctx.arc(x + eyeInset, y + eyeInset, eyeSize / 2, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.beginPath();
      this.ctx.arc(x + size - eyeInset, y + eyeInset, eyeSize / 2, 0, Math.PI * 2);
      this.ctx.fill();
      
    } else if (isTail) {
      // Draw tapered tail
      this.ctx.fillStyle = darkerColor; // Darker GREEN
      
      // Draw slightly smaller rounded cell for tail
      const tailSize = this.cellSize * 0.85;
      const tailOffset = (this.cellSize - tailSize) / 2;
      
      this.ctx.fillRect(
        x + tailOffset, 
        y + tailOffset, 
        tailSize, 
        tailSize
      );
      
    } else {
      // Draw body segments with scale patterns
      const segmentColor = this.adjustColor(snakeColor, -(index * 5) % 30); // Adjust GREEN
      
      // Base body segment
      this.ctx.fillStyle = segmentColor; // GREEN shade
      this.ctx.fillRect(x, y, size, size);
      
      // Draw scale pattern
      this.ctx.fillStyle = darkerColor; // Darker GREEN
      
      // Calculate pattern based on position in the snake
      const patternSpacing = size / 4;
      const patternOffset = (index % 2) * patternSpacing / 2;
      
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          this.ctx.beginPath();
          this.ctx.arc(
            x + patternOffset + i * patternSpacing * 2, 
            y + patternOffset + j * patternSpacing * 2, 
            patternSpacing / 2, 
            0, Math.PI * 2
          );
          this.ctx.fill();
        }
      }
      
      // Add highlights
      this.ctx.fillStyle = lighterColor; // Lighter GREEN
      this.ctx.globalAlpha = 0.3;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x + size, y);
      this.ctx.lineTo(x, y + size);
      this.ctx.closePath();
      this.ctx.fill();
    }
    
    // Restore context
    this.ctx.restore();
  }

  /**
   * Draws the food item on the grid
   * @param {Object} food - Food position {x, y}
   */
  drawFood(food) {
    if (!food) return;
    
    // Draw glow effect
    this.ctx.shadowColor = config.COLORS.FOOD;
    this.ctx.shadowBlur = 15 * this.glowIntensity;
    
    // Pulsating size based on animation frame
    const pulseSize = 0.15 * Math.sin(this.animationFrame * 0.1) + 0.85;
    
    // Calculate center and size
    const centerX = (food.x + 0.5) * this.cellSize;
    const centerY = (food.y + 0.5) * this.cellSize;
    const radius = (this.cellSize / 2) * pulseSize;
    
    // Draw circular food
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    
    // Create dynamic food gradient
    const foodGradient = this.ctx.createRadialGradient(
      centerX, centerY, radius * 0.2,
      centerX, centerY, radius
    );
    foodGradient.addColorStop(0, this.adjustColor(config.COLORS.FOOD, 30));
    foodGradient.addColorStop(1, config.COLORS.FOOD);
    
    this.ctx.fillStyle = foodGradient;
    this.ctx.fill();
    
    // Reset shadow
    this.ctx.shadowBlur = 0;
  }

  /**
   * Draws a rounded cell at the specified position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {string|CanvasGradient} color - Fill color or gradient for the cell
   * @param {number} radius - Corner radius (default: 0)
   */
  drawRoundedCell(x, y, color, radius = 0) {
    const cellX = x * this.cellSize;
    const cellY = y * this.cellSize;
    const size = this.cellSize;
    
    this.ctx.fillStyle = color;
    
    if (radius === 0) {
      // Regular rectangle if no radius
      this.ctx.fillRect(cellX, cellY, size, size);
      return;
    }
    
    // Draw rounded rectangle
    this.ctx.beginPath();
    this.ctx.moveTo(cellX + radius, cellY);
    this.ctx.lineTo(cellX + size - radius, cellY);
    this.ctx.quadraticCurveTo(cellX + size, cellY, cellX + size, cellY + radius);
    this.ctx.lineTo(cellX + size, cellY + size - radius);
    this.ctx.quadraticCurveTo(cellX + size, cellY + size, cellX + size - radius, cellY + size);
    this.ctx.lineTo(cellX + radius, cellY + size);
    this.ctx.quadraticCurveTo(cellX, cellY + size, cellX, cellY + size - radius);
    this.ctx.lineTo(cellX, cellY + radius);
    this.ctx.quadraticCurveTo(cellX, cellY, cellX + radius, cellY);
    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * Draws a single cell at the specified position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {string} color - Fill color for the cell
   */
  drawCell(x, y, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
  }

  /**
   * Draws the heads-up display with score and level
   * @param {number} score - Current score
   * @param {number} level - Current level
   */
  drawHUD(score, level) {
    // Draw HUD background
    const hudY = config.GRID_HEIGHT * this.cellSize;
    
    // Create gradient for HUD
    const hudGradient = this.ctx.createLinearGradient(0, hudY, 0, this.canvas.height);
    hudGradient.addColorStop(0, "#0f0f1a");
    hudGradient.addColorStop(1, "#1a1a2e");
    
    this.ctx.fillStyle = hudGradient;
    this.ctx.fillRect(0, hudY, this.canvas.width, config.HUD_HEIGHT);
    
    // Add a subtle divider line
    this.ctx.strokeStyle = "#2a2a45";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, hudY);
    this.ctx.lineTo(this.canvas.width, hudY);
    this.ctx.stroke();
    
    // Draw score and level text with glow
    this.ctx.shadowColor = "#4d61fc";
    this.ctx.shadowBlur = 5;
    this.ctx.fillStyle = "#f0f0f0";
    this.ctx.font = `bold ${this.cellSize * 0.8}px Poppins, sans-serif`;
    this.ctx.fillText(`Score: ${score}`, 10, hudY + this.cellSize * 0.9);
    
    // Draw level with a different glow
    this.ctx.shadowColor = config.COLORS.SNAKE;
    this.ctx.fillText(`Level: ${level}`, 10, hudY + this.cellSize * 1.8);
    
    // Reset shadow
    this.ctx.shadowBlur = 0;
  }
} 