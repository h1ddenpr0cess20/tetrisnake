/**
 * InputHandler Class
 * Manages keyboard input for game controls.
 * Handles direction changes, buffering inputs, and special actions (pause/quit).
 */
class InputHandler {
  /**
   * Initializes a new InputHandler instance
   */
  constructor() {
    this.keyState = new Map();          // Tracks currently pressed keys
    this.lastProcessedKey = null;       // Last key that was processed
    this.inputBuffer = [];              // Buffer to store recent direction inputs
    this.maxBufferSize = 2;             // Buffer size limit
    
    this.setupEventListeners();
    
    // Map arrow keys to direction vectors
    this.directionMapping = {
      "ArrowUp": { x: 0, y: -1 },
      "ArrowDown": { x: 0, y: 1 },
      "ArrowLeft": { x: -1, y: 0 },
      "ArrowRight": { x: 1, y: 0 }
    };
    
    // Map of opposite directions to prevent 180° turns
    this.oppositeDirections = {
      "ArrowUp": "ArrowDown",
      "ArrowDown": "ArrowUp",
      "ArrowLeft": "ArrowRight",
      "ArrowRight": "ArrowLeft"
    };
    
    // Prevent spacebar from triggering buttons
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        e.preventDefault();
      }
    }, { capture: true });
  }

  /**
   * Sets up event listeners for keyboard input
   */
  setupEventListeners() {
    // Handle key press events
    document.addEventListener("keydown", (e) => {
      // Only process game control keys
      if (this.directionMapping[e.key] || e.key.toLowerCase() === "p" || e.key.toLowerCase() === "q") {
        // Update key state
        this.keyState.set(e.key, true);
        
        // Process direction keys for buffering
        if (this.directionMapping[e.key]) {
          const lastKey = this.inputBuffer.length > 0 ? this.inputBuffer[this.inputBuffer.length - 1] : null;
          
          // Avoid buffering moves that would cause immediate reversal
          const currentOppKey = lastKey ? this.oppositeDirections[lastKey] : null;
          if (e.key !== lastKey && e.key !== currentOppKey) {
            // Remove duplicates of this key from buffer
            this.inputBuffer = this.inputBuffer.filter(key => key !== e.key);
            
            // Add key to end of buffer (most recent)
            this.inputBuffer.push(e.key);
            
            // Maintain buffer size limit
            if (this.inputBuffer.length > this.maxBufferSize) {
              this.inputBuffer.shift();
            }
          }
        }
      }
    });

    // Handle key release events
    document.addEventListener("keyup", (e) => {
      this.keyState.set(e.key, false);
      
      // Update input buffer when direction keys are released
      if (this.directionMapping[e.key]) {
        this.inputBuffer = this.inputBuffer.filter(key => key !== e.key);
      }
    });
    
    // Clear input state when window loses focus
    window.addEventListener("blur", () => {
      this.keyState.clear();
      this.inputBuffer = [];
    });
  }

  /**
   * Checks if a specific key is currently pressed
   * @param {string} key - The key to check
   * @returns {boolean} True if the key is pressed
   */
  isKeyPressed(key) {
    return this.keyState.get(key) || false;
  }

  /**
   * Gets the current direction input based on pressed keys
   * @returns {Object|null} Object with key and direction vector, or null if no direction keys pressed
   */
  getDirection() {
    // First check the buffered keys (prioritize most recent)
    for (let i = this.inputBuffer.length - 1; i >= 0; i--) {
      const key = this.inputBuffer[i];
      if (this.isKeyPressed(key)) {
        return { key, direction: this.directionMapping[key] };
      }
    }
    
    // Fallback: check all direction keys if buffer is empty or no buffered keys are pressed
    for (const [key, direction] of Object.entries(this.directionMapping)) {
      if (this.isKeyPressed(key)) {
        // Add to buffer for consistency
        if (!this.inputBuffer.includes(key)) {
          this.inputBuffer.push(key);
          // Maintain buffer size limit
          if (this.inputBuffer.length > this.maxBufferSize) {
            this.inputBuffer.shift();
          }
        }
        return { key, direction };
      }
    }
    
    return null;
  }

  /**
   * Checks if pause key is pressed
   * @returns {boolean} True if pause key (P) is pressed
   */
  isPausePressed() {
    return this.isKeyPressed("p") || this.isKeyPressed("P");
  }

  /**
   * Checks if quit key is pressed
   * @returns {boolean} True if quit key (Q) is pressed
   */
  isQuitPressed() {
    return this.isKeyPressed("q") || this.isKeyPressed("Q");
  }
} 