/**
 * Game Configuration
 * Central configuration object containing all game parameters
 */
const config = {
  // Display dimensions (in pixels)
  CELL_SIZE: 30,        // Size of each game grid cell
  GRID_WIDTH: 20,       // Number of cells horizontally
  GRID_HEIGHT: 30,      // Number of cells vertically
  HUD_HEIGHT: 100,      // Height of the heads-up display

  // Color scheme
  COLORS: {
    SNAKE: "lime",      // Color of the snake body
    BLOCK: "orange",    // Color of placed blocks
    FOOD: "red",        // Color of food items
    GRID: "#444"        // Color of grid lines
  },
  
  // Movement timing (in milliseconds)
  SPEEDS: {
    MOVE_DELAY: 300,    // Base falling speed
    FAST_MOVE_DELAY: 50, // Speed when down key is held
    HOLD_SCALE: 500     // Scale for descent acceleration
  }
}; 