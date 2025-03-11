/**
 * UI Class
 * Manages all user interface elements, overlays, and interaction callbacks.
 * Handles menu transitions, button states, and event bindings.
 */
class UI {
  /**
   * Creates a UI manager
   * @param {Object} elementIds - Object containing IDs of UI elements
   */
  constructor(elementIds) {
    // Store references to all UI elements
    this.elements = {
      mainMenu: document.getElementById(elementIds.mainMenu),
      paused: document.getElementById(elementIds.paused),
      gameOver: document.getElementById(elementIds.gameOver),
      finalScore: document.getElementById(elementIds.finalScore),
      finalLevel: document.getElementById(elementIds.finalLevel),
      startButton: document.getElementById(elementIds.startButton),
      restartButton: document.getElementById(elementIds.restartButton),
      resumeButton: document.getElementById('resumeButton'),
      quitButton: document.getElementById('quitButton'),
      toggleSound: document.getElementById('toggleSound'),
      toggleSoundPaused: document.getElementById('toggleSoundPaused'),
      toggleMusic: document.getElementById('toggleMusic'),
      toggleMusicPaused: document.getElementById('toggleMusicPaused')
    };
    
    // Initial audio settings
    this.soundEnabled = true;
    this.musicEnabled = true;
    this.soundToggleCallback = null;
    this.musicToggleCallback = null;
  }

  /**
   * Displays the main menu
   */
  showMainMenu() {
    this.hideAll();
    this.elements.mainMenu.classList.remove("hidden");
  }

  /**
   * Hides the main menu
   */
  hideMainMenu() {
    this.elements.mainMenu.classList.add("hidden");
  }

  /**
   * Displays the pause menu
   */
  showPauseMenu() {
    this.elements.paused.classList.remove("hidden");
  }

  /**
   * Hides the pause menu
   */
  hidePauseMenu() {
    this.elements.paused.classList.add("hidden");
  }

  /**
   * Toggles the visibility of the pause menu
   * @param {boolean} isPaused - Whether the game is paused
   */
  togglePauseMenu(isPaused) {
    this.elements.paused.classList.toggle("hidden", !isPaused);
    
    // Sync button states when showing pause menu
    if (isPaused) {
      this.updateSoundButtonText();
      this.updateMusicButtonText();
    }
  }

  /**
   * Displays the game over screen with final score and level
   * @param {number} score - Final score
   * @param {number} level - Final level reached
   */
  showGameOver(score, level) {
    this.elements.finalScore.textContent = `Final Score: ${score}`;
    this.elements.finalLevel.textContent = `Level Reached: ${level}`;
    this.elements.gameOver.classList.remove("hidden");
  }

  /**
   * Hides the game over screen
   */
  hideGameOver() {
    this.elements.gameOver.classList.add("hidden");
  }

  /**
   * Hides all UI overlay screens
   */
  hideAll() {
    this.elements.mainMenu.classList.add("hidden");
    this.elements.paused.classList.add("hidden");
    this.elements.gameOver.classList.add("hidden");
  }

  /**
   * Binds the start game button click event
   * @param {Function} callback - Function to call when start button is clicked
   */
  onStartGame(callback) {
    this.elements.startButton.addEventListener("click", callback);
  }

  /**
   * Binds the restart game button click event
   * @param {Function} callback - Function to call when restart button is clicked
   */
  onRestartGame(callback) {
    this.elements.restartButton.addEventListener("click", callback);
  }

  /**
   * Binds the resume game button click event
   * @param {Function} callback - Function to call when resume button is clicked
   */
  onResumeGame(callback) {
    if (this.elements.resumeButton) {
      this.elements.resumeButton.addEventListener("click", callback);
    }
  }

  /**
   * Binds the quit to menu button click event
   * @param {Function} callback - Function to call when quit button is clicked
   */
  onQuitToMenu(callback) {
    if (this.elements.quitButton) {
      this.elements.quitButton.addEventListener("click", callback);
    }
  }

  /**
   * Binds sound toggle buttons across all menus
   * @param {Function} callback - Function to call when sound toggle is clicked
   */
  onSoundToggle(callback) {
    this.soundToggleCallback = callback;
    
    const handleSoundToggle = () => {
      // Get the mute state from callback and update UI
      const isMuted = callback();
      this.soundEnabled = !isMuted; // Enabled is opposite of muted
      this.updateSoundButtonText();
    };
    
    // Bind sound toggle buttons in both menus
    if (this.elements.toggleSound) {
      this.elements.toggleSound.addEventListener("click", handleSoundToggle);
    }
    
    if (this.elements.toggleSoundPaused) {
      this.elements.toggleSoundPaused.addEventListener("click", handleSoundToggle);
    }
  }

  /**
   * Binds music toggle buttons across all menus
   * @param {Function} callback - Function to call when music toggle is clicked
   */
  onMusicToggle(callback) {
    this.musicToggleCallback = callback;
    
    const handleMusicToggle = () => {
      // Get the mute state from callback and update UI
      const isMuted = callback();
      this.musicEnabled = !isMuted; // Enabled is opposite of muted
      this.updateMusicButtonText();
    };
    
    // Bind music toggle buttons in both menus
    if (this.elements.toggleMusic) {
      this.elements.toggleMusic.addEventListener("click", handleMusicToggle);
    }
    
    if (this.elements.toggleMusicPaused) {
      this.elements.toggleMusicPaused.addEventListener("click", handleMusicToggle);
    }
  }

  /**
   * Updates the text on all sound toggle buttons
   */
  updateSoundButtonText() {
    const status = this.soundEnabled ? "On" : "Off";
    
    // Update text in both menus
    if (this.elements.toggleSound) {
      this.elements.toggleSound.textContent = `Sound: ${status}`;
    }
    
    if (this.elements.toggleSoundPaused) {
      this.elements.toggleSoundPaused.textContent = `Sound: ${status}`;
    }
  }

  /**
   * Updates the text on all music toggle buttons
   */
  updateMusicButtonText() {
    const status = this.musicEnabled ? "On" : "Off";
    
    // Update text in both menus
    if (this.elements.toggleMusic) {
      this.elements.toggleMusic.textContent = `Music: ${status}`;
    }
    
    if (this.elements.toggleMusicPaused) {
      this.elements.toggleMusicPaused.textContent = `Music: ${status}`;
    }
  }
} 