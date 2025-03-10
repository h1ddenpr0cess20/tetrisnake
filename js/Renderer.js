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
  }

  /**
   * Resizes the canvas based on window dimensions
   * Adjusts cell size for responsive layout
   */
  resizeCanvas() {
    const scale = window.innerWidth < 600 ? 20 : config.CELL_SIZE;
    this.canvas.width = scale * config.GRID_WIDTH;
    this.canvas.height = scale * config.GRID_HEIGHT + config.HUD_HEIGHT;
    this.cellSize = scale;
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
  }

  /**
   * Draws all static blocks on the grid
   * @param {Map} staticBlocks - Map of positions to block colors
   */
  drawStaticBlocks(staticBlocks) {
    for (const [pos, color] of staticBlocks) {
      const [x, y] = pos.split(",").map(Number);
      this.drawCell(x, y, color);
    }
  }

  /**
   * Draws the snake on the grid
   * @param {Array} snakeBody - Array of snake segment positions
   */
  drawSnake(snakeBody) {
    for (const seg of snakeBody) {
      this.drawCell(seg.x, seg.y, config.COLORS.SNAKE);
    }
  }

  /**
   * Draws the food item on the grid
   * @param {Object} food - Food position {x, y}
   */
  drawFood(food) {
    this.drawCell(food.x, food.y, config.COLORS.FOOD);
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
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, config.GRID_HEIGHT * this.cellSize, this.canvas.width, config.HUD_HEIGHT);
    
    // Draw score and level text
    this.ctx.fillStyle = "#fff";
    this.ctx.font = `${this.cellSize * 0.8}px sans-serif`;
    this.ctx.fillText(`Score: ${score}`, 10, config.GRID_HEIGHT * this.cellSize + this.cellSize * 0.9);
    this.ctx.fillText(`Level: ${level}`, 10, config.GRID_HEIGHT * this.cellSize + this.cellSize * 1.8);
  }
} 