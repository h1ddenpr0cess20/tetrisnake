/**
 * InputHandler Class
 * Manages keyboard and touch input for game controls.
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
    this.touchStartPos = null;          // Track touch start position for swipe detection
    this.swipeThreshold = 50;           // Minimum distance for swipe detection
    this.isMobile = this.detectMobile(); // Detect if on mobile device
    
    this.setupEventListeners();
    this.setupTouchControls();
    
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
   * Detects if the device is mobile
   * @returns {boolean} True if mobile device
   */
  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
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
   * Sets up touch controls for mobile devices
   */
  setupTouchControls() {
    // Get mobile control buttons
    const upBtn = document.getElementById('upBtn');
    const downBtn = document.getElementById('downBtn');
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const pauseBtn = document.getElementById('pauseBtn');

    // Button mapping to keys
    const buttonToKey = {
      upBtn: 'ArrowUp',
      downBtn: 'ArrowDown',
      leftBtn: 'ArrowLeft',
      rightBtn: 'ArrowRight'
    };

    // Add touch event listeners for direction buttons
    Object.entries(buttonToKey).forEach(([btnId, key]) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        // Handle touch start
        btn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.simulateKeyPress(key, true);
        }, { passive: false });

        // Handle touch end
        btn.addEventListener('touchend', (e) => {
          e.preventDefault();
          this.simulateKeyPress(key, false);
        }, { passive: false });

        // Handle mouse events for desktop testing
        btn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this.simulateKeyPress(key, true);
        });

        btn.addEventListener('mouseup', (e) => {
          e.preventDefault();
          this.simulateKeyPress(key, false);
        });

        // Prevent context menu on long press
        btn.addEventListener('contextmenu', (e) => e.preventDefault());
      }
    });

    // Handle pause button
    if (pauseBtn) {
      pauseBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.simulateKeyPress('p', true);
        // Immediately release for pause toggle
        setTimeout(() => this.simulateKeyPress('p', false), 100);
      }, { passive: false });

      pauseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.simulateKeyPress('p', true);
        setTimeout(() => this.simulateKeyPress('p', false), 100);
      });
    }

    // Add swipe gesture support on the canvas
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
      canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (e.touches.length === 1) {
          this.touchStartPos = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
          };
        }
      }, { passive: false });

      canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
      }, { passive: false });

      canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (this.touchStartPos && e.changedTouches.length === 1) {
          const touchEndPos = {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY
          };

          const deltaX = touchEndPos.x - this.touchStartPos.x;
          const deltaY = touchEndPos.y - this.touchStartPos.y;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

          if (distance > this.swipeThreshold) {
            let swipeKey = null;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
              // Horizontal swipe
              swipeKey = deltaX > 0 ? 'ArrowRight' : 'ArrowLeft';
            } else {
              // Vertical swipe
              swipeKey = deltaY > 0 ? 'ArrowDown' : 'ArrowUp';
            }

            if (swipeKey) {
              this.simulateKeyPress(swipeKey, true);
              setTimeout(() => this.simulateKeyPress(swipeKey, false), 100);
            }
          }

          this.touchStartPos = null;
        }
      }, { passive: false });
    }
  }

  /**
   * Simulates a key press or release
   * @param {string} key - The key to simulate
   * @param {boolean} pressed - Whether the key is pressed or released
   */
  simulateKeyPress(key, pressed) {
    // Update key state
    this.keyState.set(key, pressed);
    
    // Add haptic feedback for mobile devices
    if (pressed && this.isMobile && 'vibrate' in navigator) {
      // Light vibration for direction changes, stronger for pause
      const vibrationPattern = key === 'p' ? [50] : [20];
      navigator.vibrate(vibrationPattern);
    }
    
    // Process direction keys for buffering when pressed
    if (pressed && this.directionMapping[key]) {
      const lastKey = this.inputBuffer.length > 0 ? this.inputBuffer[this.inputBuffer.length - 1] : null;
      
      // Avoid buffering moves that would cause immediate reversal
      const currentOppKey = lastKey ? this.oppositeDirections[lastKey] : null;
      if (key !== lastKey && key !== currentOppKey) {
        // Remove duplicates of this key from buffer
        this.inputBuffer = this.inputBuffer.filter(k => k !== key);
        
        // Add key to end of buffer (most recent)
        this.inputBuffer.push(key);
        
        // Maintain buffer size limit
        if (this.inputBuffer.length > this.maxBufferSize) {
          this.inputBuffer.shift();
        }
      }
    }
    
    // Update input buffer when direction keys are released
    if (!pressed && this.directionMapping[key]) {
      this.inputBuffer = this.inputBuffer.filter(k => k !== key);
    }
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