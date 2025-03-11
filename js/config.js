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
    SNAKE: "#22cc22",   // Snake color (must be green)
    BLOCK: "#ff7700",   // Color of placed blocks
    FOOD: "#ff3377",    // Color of food items
    GRID: "#2a2a45"     // Color of grid lines
  },
  
  // Movement timing (in milliseconds)
  SPEEDS: {
    MOVE_DELAY: 350,    // Base falling speed
    FAST_MOVE_DELAY: 50, // Speed when down key is held
    HOLD_SCALE: 500     // Scale for descent acceleration
  }
}; 

// Force snake color to be green across the application
document.addEventListener('DOMContentLoaded', () => {
  // Ensure CSS variables match the config
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --color-snake: ${config.COLORS.SNAKE} !important;
    }
    
    /* Direct override for any snake elements */
    .snake, #snake, [class*="snake"] {
      color: ${config.COLORS.SNAKE} !important;
      background-color: ${config.COLORS.SNAKE} !important;
      fill: ${config.COLORS.SNAKE} !important;
      stroke: ${config.COLORS.SNAKE} !important;
    }
    
    /* Override for canvas rendering elements */
    canvas {
      --snake-color: ${config.COLORS.SNAKE} !important;
    }
  `;
  document.head.appendChild(style);
}); 