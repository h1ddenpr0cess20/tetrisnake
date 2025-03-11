/**
 * AudioManager Class
 * Handles all sound effects and music for the game using Web Audio API.
 * Includes procedurally generated sound effects and background music.
 * Manages audio state, muting, and transitions between different music tracks.
 */
class AudioManager {
  /**
   * Initializes the audio system
   */
  constructor() {
    this.audioContext = null;           // Web Audio API context
    this.sounds = {};                   // Sound effect buffers
    this.isSoundMuted = false;          // Sound effects mute state
    this.isMusicMuted = false;          // Music mute state
    this.bgMusicSource = null;          // Current music audio source
    this.bgMusicGain = null;            // Volume control for music
    this.bgMusicPlaying = false;        // Whether music is currently playing
    this.bgMusicPaused = false;         // Whether music is paused
    this.soundEffectsGain = null;       // Volume control for sound effects
    this.musicTrack = 'main';           // Current music track ('main', 'intense')
    this.currentMusicLevel = null;      // Current music level
    this.init();
    
    // Add a simple document-wide click event to resume audio context
    // This addresses the most common browser issue that causes audio to stop
    document.addEventListener('click', () => {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          console.log('AudioContext resumed on user interaction');
          
          // If music should be playing but isn't, restart it
          if (this.bgMusicPlaying && !this.bgMusicSource && !this.isMusicMuted) {
            this.startBackgroundMusic(this.currentMusicLevel || 1);
          }
        });
      }
    });
  }

  /**
   * Initializes the Web Audio API and creates initial sounds
   */
  init() {
    try {
      // Set up Audio Context with fallback for older browsers
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      
      // Create main volume control for sound effects
      this.soundEffectsGain = this.audioContext.createGain();
      this.soundEffectsGain.gain.value = 0.4;
      this.soundEffectsGain.connect(this.audioContext.destination);
      
      // Set up audio processing effects chain
      this.createEffects();
      
      // Generate all sound effects
      this.createSounds();
      
      // Prepare background music
      this.createBackgroundMusic();
    } catch (e) {
      console.warn('Web Audio API not supported in this browser:', e);
    }
  }
  
  /**
   * Creates audio effects processing chain for richer sound
   * Sets up delay, feedback, and filters
   */
  createEffects() {
    try {
      // Create delay node for echo effect
      this.delayNode = this.audioContext.createDelay(0.2);
      this.delayNode.delayTime.value = 0.08; // Short delay for clarity
      
      // Create feedback gain for repeating echoes
      this.feedbackNode = this.audioContext.createGain();
      this.feedbackNode.gain.value = 0.1; // Low feedback to avoid muddy sound
      
      // High-pass filter to reduce low frequency rumble
      this.filterNode = this.audioContext.createBiquadFilter();
      this.filterNode.type = 'highpass';
      this.filterNode.frequency.value = 300;
      
      // High shelf to enhance clarity
      this.highShelfNode = this.audioContext.createBiquadFilter();
      this.highShelfNode.type = 'highshelf';
      this.highShelfNode.frequency.value = 3000;
      this.highShelfNode.gain.value = 3; // Boost high frequencies
      
      // Connect the audio processing chain
      this.delayNode.connect(this.feedbackNode);
      this.feedbackNode.connect(this.filterNode);
      this.filterNode.connect(this.highShelfNode);
      this.highShelfNode.connect(this.delayNode);
      
      // Connect to main output at reduced volume
      this.delayNode.connect(this.audioContext.destination);
    } catch (e) {
      console.log('Could not create audio effects:', e);
    }
  }

  /**
   * Creates all game sound effects using procedural generation
   */
  createSounds() {
    // Movement sound - short crisp click
    this.sounds.move = this.createToneBuffer(200, 0.01, 'triangle', 280, 0.03);
    
    // Food eaten sound - subtle single note
    this.sounds.eat = this.createToneBuffer(330, 0.02, 'sine', 380, 0.08);
    
    // Rattlesnake sound for line clear - rapid clicking/shaking effects
    this.sounds.lineClear = this.createRattlesnakeSound();
    
    // Game over sound - descending tones
    this.sounds.gameOver = this.createComplexTone([
      { freq: 293.66, type: 'sawtooth', duration: 0.3, attack: 0.01, release: 0.2 },
      { freq: 261.63, type: 'sawtooth', duration: 0.3, attack: 0.01, release: 0.2, delay: 0.15 },
      { freq: 196.00, type: 'sawtooth', duration: 0.4, attack: 0.01, release: 0.3, delay: 0.3 }
    ], true);
    
    // Collision sound - sharp impact
    this.sounds.collision = this.createComplexTone([
      { freq: 120, type: 'square', duration: 0.08, attack: 0.005, release: 0.04 },
      { freq: 80, type: 'triangle', duration: 0.12, attack: 0.005, release: 0.05, delay: 0.01 }
    ], true);
  }

  /**
   * Creates a softer, gentler rattlesnake-inspired sound effect with increased volume
   * @returns {AudioBuffer} The gentle rattling sound buffer
   */
  createRattlesnakeSound() {
    if (!this.audioContext) return null;
    
    // Use a longer duration for a more gentle sound
    const duration = 0.8; // Shorter duration for more impact
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(2, bufferSize, sampleRate);
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // Use a middle-range frequency - not too harsh but more noticeable
    const rattleFrequency = 35;
    // Slightly more clicks for better audibility
    const clicksPerShake = 3; 
    
    // Create a gentle but audible rattling effect
    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;
      
      // Create smoother envelope with shorter fade in/out for more presence
      let envelope = 1;
      if (t < 0.1) {
        envelope = t / 0.1; // Quick fade in
      } else if (t > duration - 0.2) {
        envelope = (duration - t) / 0.2; // Fade out
      }
      
      // Generate audible clicks at moderate rattling frequency
      const rattlePhase = (t * rattleFrequency) % 1.0;
      
      // Stronger clicks with gentle transition
      let clickValue = 0;
      for (let click = 0; click < clicksPerShake; click++) {
        const clickTime = click / clicksPerShake;
        // Moderate window for smooth but present transitions
        const distanceFromClick = Math.abs(rattlePhase - clickTime);
        if (distanceFromClick < 0.05) {
          // Use a sine fade for smoothness
          const fade = Math.sin((1 - distanceFromClick / 0.05) * Math.PI/2);
          // Increased amplitude for better audibility (0.6 vs 0.4)
          clickValue = (Math.random() * 2 - 1) * 0.6 * fade;
        }
      }
      
      // Add light noise for texture
      const noise = (Math.random() * 2 - 1) * 0.08;
      
      // Combine the rattling clicks with noise - increased volume by 40%
      // Multiplying by 1.0 instead of 0.7 (was reduced before)
      const signal = (clickValue + noise) * envelope;
      
      // Add subtle stereo effect
      const stereoPan = Math.sin(t * 4) * 0.15;
      leftChannel[i] = signal * (1 - stereoPan);
      rightChannel[i] = signal * (1 + stereoPan);
    }
    
    // Apply a gentler low-pass filter to keep more audible frequencies
    const tempBuffer = this.audioContext.createBuffer(2, bufferSize, sampleRate);
    const tempLeft = tempBuffer.getChannelData(0);
    const tempRight = tempBuffer.getChannelData(1);
    
    // Copy our initial data to the temp buffer
    for (let i = 0; i < bufferSize; i++) {
      tempLeft[i] = leftChannel[i];
      tempRight[i] = rightChannel[i];
    }
    
    // Gentler filter to preserve more audible frequencies
    const filterStrength = 0.5; // Lower value = less filtering (was 0.8)
    let lastL = 0, lastR = 0;
    
    for (let i = 0; i < bufferSize; i++) {
      // Simple one-pole low-pass filter
      lastL = lastL * filterStrength + tempLeft[i] * (1 - filterStrength);
      lastR = lastR * filterStrength + tempRight[i] * (1 - filterStrength);
      
      leftChannel[i] = lastL;
      rightChannel[i] = lastR;
    }
    
    return buffer;
  }

  createComplexTone(tones, applyFilter = false) {
    if (!this.audioContext) return null;
    
    // Find the longest tone to determine buffer length
    const longestDuration = tones.reduce((max, tone) => {
      const totalDuration = (tone.delay || 0) + tone.duration;
      return totalDuration > max ? totalDuration : max;
    }, 0);
    
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(2, longestDuration * sampleRate, sampleRate);
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // Generate each tone and mix them together
    tones.forEach(tone => {
      const frequency = tone.freq;
      const type = tone.type;
      const duration = tone.duration;
      const attack = tone.attack || 0.01;
      const release = tone.release || 0.05;
      const delay = tone.delay || 0;
      const delayInSamples = Math.floor(delay * sampleRate);
      
      for (let i = 0; i < duration * sampleRate; i++) {
        const pos = i + delayInSamples;
        if (pos >= buffer.length) break;
        
        const t = i / sampleRate;
        let envelope = 1;
        
        // Apply sharper envelope for clarity
        if (t < attack) {
          envelope = t / attack; // Attack phase
        } else if (t > duration - release) {
          envelope = (duration - t) / release; // Release phase
        }
        
        // Optional filter sweep effect - more pronounced for clarity
        let filterMod = 1;
        if (applyFilter) {
          filterMod = 0.6 + 0.4 * (1 - (t / duration)); // Less extreme filter movement
        }
        
        // Generate waveform with more harmonics for clarity
        let sample = 0;
        if (type === 'sine') {
          sample = Math.sin(2 * Math.PI * frequency * t) * envelope;
        } else if (type === 'square') {
          // Softer square wave to reduce muddiness
          sample = (Math.sin(2 * Math.PI * frequency * t * filterMod) > 0 ? 0.3 : -0.3) * envelope;
        } else if (type === 'sawtooth') {
          // Brighter sawtooth
          sample = ((t * frequency * filterMod * 2) % 1 - 0.5) * envelope * 0.4;
        } else if (type === 'triangle') {
          sample = (Math.abs(((t * frequency * 2) % 2) - 1) - 0.5) * 1.2 * envelope;
        }
        
        // Add more defined stereo positioning
        const pan = tone.pan || 0;
        const leftGain = Math.min(1, 1 - (pan * 0.7)); // Less extreme panning
        const rightGain = Math.min(1, 1 + (pan * 0.7));
        
        leftChannel[pos] += sample * 0.6 * leftGain; // Slightly lower volume for cleaner mix
        rightChannel[pos] += sample * 0.6 * rightGain;
      }
    });
    
    // Normalize to prevent clipping
    const normalize = (channel) => {
      const max = channel.reduce((max, sample) => Math.max(max, Math.abs(sample)), 0);
      if (max > 0.7) { // Lower normalization target for headroom
        const gain = 0.7 / max;
        for (let i = 0; i < channel.length; i++) {
          channel[i] *= gain;
        }
      }
    };
    
    normalize(leftChannel);
    normalize(rightChannel);
    
    return buffer;
  }

  createBackgroundMusic() {
    // Create the base music track that we'll adjust speed on
    this.sounds.bgMusic = this.createDynamicMusic();
  }

  createDynamicMusic() {
    if (!this.audioContext) return null;
    
    // Set up consistent timing for 4/4 time signature
    // Slow down the tempo by increasing the note duration
    const quarterNote = 0.4; // Slower tempo (was 0.3)
    const eighthNote = quarterNote / 2;
    const sixteenthNote = eighthNote / 2;
    const halfNote = quarterNote * 2;
    const wholeNote = quarterNote * 4;
    
    // Add new patterns for variety - transposed down an octave
    const patterns = {
      mainTheme: [
        { note: 'E4', duration: eighthNote }, // Lowered from E5
        { note: 'D4', duration: eighthNote }, // Lowered from D5
        { note: 'C4', duration: eighthNote }, // Lowered from C5
        { note: 'D4', duration: eighthNote }, // Lowered from D5
        { note: 'E4', duration: eighthNote }, // Lowered from E5
        { note: 'E4', duration: eighthNote }, // Lowered from E5
        { note: 'E4', duration: quarterNote }, // Lowered from E5
      ],
      
      midEastern: [
        { note: 'E4', duration: eighthNote }, // Lowered from E5
        { note: 'F4', duration: eighthNote }, // Lowered from F5
        { note: 'D4', duration: eighthNote }, // Lowered from D5
        { note: 'D4', duration: eighthNote }, // Lowered from D5
        { note: 'C4', duration: halfNote }, // Lowered from C5
      ],
      
      tetris: [
        { note: 'E3', duration: quarterNote }, // Lowered from E4
        { note: 'B3', duration: quarterNote }, // Lowered from B4
        { note: 'C4', duration: quarterNote }, // Lowered from C5
        { note: 'D4', duration: quarterNote }, // Lowered from D5
      ],
      
      bridge: [
        { note: 'A3', duration: quarterNote }, // Lowered from A4
        { note: 'G3', duration: quarterNote }, // Lowered from G4
        { note: 'F3', duration: quarterNote }, // Lowered from F4
        { note: 'G3', duration: quarterNote }, // Lowered from G4
      ],
      
      // New pattern for variety - also lowered
      newPattern: [
        { note: 'G4', duration: eighthNote }, // Lowered from G5
        { note: 'A4', duration: eighthNote }, // Lowered from A5
        { note: 'B4', duration: eighthNote }, // Lowered from B5
        { note: 'A4', duration: eighthNote }, // Lowered from A5
        { note: 'G4', duration: eighthNote }, // Lowered from G5
        { note: 'F4', duration: eighthNote }, // Lowered from F5
        { note: 'E4', duration: quarterNote }, // Lowered from E5
      ],
      
      // Add a deeper bass-focused pattern
      bassPattern: [
        { note: 'G2', duration: quarterNote },
        { note: 'D3', duration: quarterNote },
        { note: 'G2', duration: quarterNote },
        { note: 'A2', duration: quarterNote },
      ]
    };
    
    // Extend the sequence with new patterns
    let fullSequence = [
      ...patterns.mainTheme, ...patterns.mainTheme,
      ...patterns.midEastern, ...patterns.midEastern,
      ...patterns.tetris, ...patterns.tetris,
      ...patterns.bridge, ...patterns.mainTheme,
      
      // New section with the new pattern
      ...patterns.newPattern, ...patterns.newPattern,
      ...patterns.bassPattern, ...patterns.bassPattern,
      ...patterns.mainTheme, ...patterns.midEastern,
      ...patterns.tetris, ...patterns.bridge,
      ...patterns.newPattern, ...patterns.bassPattern,
    ];
    
    // Extended note frequency map
    const noteFreq = {
      // Lower octaves for deeper sounds
      'C2': 65.41, 'C#2': 69.30, 'Db2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'Eb2': 77.78,
      'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'Gb2': 92.50, 'G2': 98.00, 'G#2': 103.83,
      'Ab2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'Bb2': 116.54, 'B2': 123.47,
      'C3': 130.81, 'C#3': 138.59, 'Db3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'Eb3': 155.56,
      'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'Gb3': 185.00, 'G3': 196.00, 'G#3': 207.65,
      'Ab3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'Bb3': 233.08, 'B3': 246.94,
      'C4': 261.63, 'C#4': 277.18, 'Db4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'Eb4': 311.13,
      'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'Gb4': 369.99, 'G4': 392.00, 'G#4': 415.30,
      'Ab4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'Bb4': 466.16, 'B4': 493.88,
      'C5': 523.25, 'C#5': 554.37, 'Db5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'Eb5': 622.25,
      'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'Gb5': 739.99, 'G5': 783.99, 'G#5': 830.61,
      'Ab5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'Bb5': 932.33, 'B5': 987.77,
      'C6': 1046.50, 'C#6': 1108.73, 'Db6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'Eb6': 1244.51,
      'E6': 1318.51, 'F6': 1396.91, 'F#6': 1479.98, 'Gb6': 1479.98, 'G6': 1567.98, 'G#6': 1661.22,
      'Ab6': 1661.22, 'A6': 1760.00, 'A#6': 1864.66, 'Bb6': 1864.66, 'B6': 1975.53
    };
    
    // Process each note in the melody
    let sequence = [];
    let currentTime = 0;
    let measureCount = 0;
    let beatInMeasure = 0;
    
    // DEEP BASS - lower octave and more prominent
    for (let m = 0; m < Math.ceil(fullSequence.length / 16); m++) {
      // Use more low notes in the bassline
      const bassPattern = ['G2', 'REST', 'G2', 'D3', 'G2', 'REST', 'A2', 'G2'];
      for (let i = 0; i < 8; i++) {
        const bassNote = bassPattern[i];
        if (bassNote !== 'REST' && noteFreq[bassNote]) {
          sequence.push({
            time: currentTime + (i * eighthNote) + (m * 4 * quarterNote),
            freq: noteFreq[bassNote],
            duration: eighthNote * 0.9,
            type: 'synth',
            gain: 0.2, // Increased gain for more bass presence
            group: 'bass'
          });
        }
      }
    }
    
    // First process the melody to get the total duration
    let melodyDuration = 0;
    fullSequence.forEach(item => {
      melodyDuration += item.duration;
    });
    
    // Calculate total number of beats needed to cover the entire track
    const totalBeats = Math.ceil(melodyDuration / quarterNote);
    
    // Add lead synth melody and track the actual duration
    fullSequence.forEach((item, index) => {
      beatInMeasure += item.duration / quarterNote;
      if (beatInMeasure >= 4) {
        measureCount++;
        beatInMeasure = beatInMeasure % 4;
      }
      if (item.note !== 'REST' && noteFreq[item.note]) {
        sequence.push({
          time: currentTime,
          freq: noteFreq[item.note],
          duration: item.duration * 0.95,
          type: 'lead',
          gain: 0.15, // Slightly reduced to balance with the bass
          group: 'melody'
        });
      }
      
      currentTime += item.duration;
    });
    
    // Add four-on-the-floor kick drum throughout the ENTIRE track
    for (let beat = 0; beat < totalBeats; beat++) {
      // Main kick on every beat (four-on-the-floor)
      sequence.push({
        time: beat * quarterNote,
        freq: 50, // Low frequency for deep kick
        duration: 0.2,
        type: 'kick',
        gain: 0.3, // Strong kick
        group: 'drums'
      });
      
      // Add off-beat kicks for variety on alternate measures
      if (beat % 8 >= 4) { // Only in every other measure
        // Add kick on the "and" of beats 1 and 3
        if (beat % 4 === 0 || beat % 4 === 2) {
          sequence.push({
            time: beat * quarterNote + (quarterNote * 0.5),
            freq: 45, // Even lower for accent
            duration: 0.18,
            type: 'kick',
            gain: 0.28,
            group: 'drums'
          });
        }
      }
    }
    
    // Add snares on beats 2 and 4 of every measure throughout the ENTIRE track
    for (let measure = 0; measure < Math.ceil(totalBeats / 4); measure++) {
      sequence.push({
        time: (measure * 4 + 1) * quarterNote, // Beat 2
        freq: 180,
        duration: 0.12,
        type: 'snare',
        gain: 0.14,
        group: 'drums'
      });
      
      sequence.push({
        time: (measure * 4 + 3) * quarterNote, // Beat 4
        freq: 180,
        duration: 0.12,
        type: 'snare',
        gain: 0.14,
        group: 'drums'
      });
    }
    
    // Add hi-hats for rhythm throughout the ENTIRE track
    for (let eighthBeat = 0; eighthBeat < totalBeats * 2; eighthBeat++) {
      sequence.push({
        time: eighthBeat * eighthNote,
        freq: 8000,
        duration: 0.08,
        type: 'hihat',
        gain: 0.08,
        group: 'hihat'
      });
    }
    
    // Calculate total duration based on the actual melody length
    const totalDuration = melodyDuration;
    
    // Create the buffer
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(2, totalDuration * sampleRate, sampleRate);
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // Render each note into the buffer
    sequence.forEach(note => {
      const startSample = Math.floor(note.time * sampleRate);
      const endSample = Math.floor((note.time + note.duration) * sampleRate);
      const frequency = note.freq;
      for (let i = startSample; i < endSample; i++) {
        if (i >= buffer.length) break;
        const t = (i - startSample) / sampleRate;
        let sample = 0;
        let attackTime, releaseTime;
        if (note.group === 'drums') {
          attackTime = 0.001;
          releaseTime = 0.15; // Longer release for drums
        } else if (note.group === 'hihat') {
          attackTime = 0.001;
          releaseTime = 0.05;
        } else if (note.group === 'bass') {
          attackTime = 0.02; // Slower attack for bass
          releaseTime = 0.15; // Longer release for bass
        } else if (note.group === 'effects') {
          attackTime = 0.005;
          releaseTime = 0.1;
        } else if (note.group === 'ethnic') {
          attackTime = 0.002;
          releaseTime = 0.08;
        } else {
          attackTime = 0.01;
          releaseTime = 0.08;
        }
        let amplitude = note.gain;
        if (t < attackTime) {
          amplitude *= (t / attackTime);
        } else if (t > note.duration - releaseTime) {
          amplitude *= (note.duration - t) / releaseTime;
        }
        if (note.type === 'lead') {
          // Use a richer lead sound with subtle vibrato
          const vibrato = 1 + (Math.sin(2 * Math.PI * 3 * t) * 0.002); // Reduced vibrato
          const saw = 2 * (((t * frequency * vibrato) % 1) - 0.5);
          const square = Math.sin(2 * Math.PI * frequency * vibrato * t) > 0 ? 0.5 : -0.5;
          // Mix saw and square waves for a richer tone
          sample = (saw * 0.7 + square * 0.3) * amplitude;
        } else if (note.type === 'synth') {
          // Use a richer bass sound
          const fundamental = 2 * (((t * frequency) % 1) - 0.5); // Sawtooth
          const subOctave = Math.sin(2 * Math.PI * (frequency/2) * t) * 0.3; // Add sub-octave
          sample = (fundamental * 0.7 + subOctave) * amplitude;
        } else if (note.type === 'kick') {
          // Enhanced kick with deeper sub and punch
          const kickFreq = frequency * (1 + 8 * Math.exp(-t * 15)); // Sharper pitch drop
          const body = Math.sin(2 * Math.PI * kickFreq * t);
          
          // Sub-bass component for extra depth
          const sub = Math.sin(2 * Math.PI * (frequency * 0.5) * t) * 0.5;
          
          // Click/attack component
          const click = Math.sin(2 * Math.PI * 1500 * t) * Math.exp(-t * 50) * 0.5;
          
          // Compression effect (simple simulation)
          let combined = (body * 0.7 + sub * 0.2 + click * 0.1) * amplitude;
          
          // Simple soft clipping for more punch
          if (combined > 0.8) {
            combined = 0.8 + (combined - 0.8) * 0.5;
          } else if (combined < -0.8) {
            combined = -0.8 + (combined + 0.8) * 0.5;
          }
          
          sample = combined;
        } else if (note.type === 'snare') {
          const noiseLevel = (Math.random() * 2 - 1) * Math.exp(-t * 10) * 0.7;
          const tone = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 12) * 0.3;
          sample = (noiseLevel + tone) * amplitude;
        } else if (note.type === 'hihat') {
          const noise = (Math.random() * 2 - 1);
          const envelope = Math.exp(-t * 40);
          sample = noise * envelope * amplitude;
        } else if (note.type === 'doumbek') {
          const bodyFreq = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 12);
          sample = bodyFreq * amplitude;
        } else if (note.type === 'tetrisDrop') {
          const drop = Math.sin(2 * Math.PI * (frequency - t * 80) * t);
          sample = drop * amplitude;
        }
        let stereoPan = 0;
        if (note.group === 'drums') {
          stereoPan = note.type === 'kick' ? 0 : -0.1;
        } else if (note.group === 'hihat') {
          stereoPan = 0.2;
        } else if (note.group === 'melody') {
          stereoPan = 0.1;
        } else if (note.group === 'ethnic') {
          stereoPan = -0.2;
        } else if (note.group === 'bass') {
          stereoPan = -0.05; // Slight pan for bass
        }
        const leftGain = Math.min(1, 1 - stereoPan);
        const rightGain = Math.min(1, 1 + stereoPan);
        leftChannel[i] += sample * leftGain;
        rightChannel[i] += sample * rightGain;
      }
    });
    
    // Normalize the buffer to prevent clipping
    const normalize = (channel) => {
      const max = channel.reduce((max, sample) => Math.max(max, Math.abs(sample)), 0);
      if (max > 0.7) {
        const gain = 0.7 / max;
        for (let i = 0; i < channel.length; i++) {
          channel[i] *= gain;
        }
      }
    };
    
    normalize(leftChannel);
    normalize(rightChannel);
    
    return buffer;
  }

  createToneBuffer(startFreq, attack, type, endFreq, duration) {
    if (!this.audioContext) return null;
    
    const sampleRate = this.audioContext.sampleRate;
    const length = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Linear interpolation between start and end frequency
      const freq = startFreq + (endFreq - startFreq) * (i / length);
      
      // Envelope: attack and release
      let amplitude = 0.7; // Slightly lower base amplitude
      if (t < attack) {
        amplitude = amplitude * (t / attack); // Attack phase
      } else if (t > duration - 0.05) {
        amplitude = amplitude * (duration - t) / 0.05; // Release phase
      }
      
      // Waveform generation with slight stereo effect
      let sample;
      if (type === 'sine') {
        sample = Math.sin(2 * Math.PI * freq * t) * amplitude;
      } else if (type === 'square') {
        sample = (Math.sin(2 * Math.PI * freq * t) > 0 ? 1 : -1) * amplitude * 0.3;
      } else if (type === 'sawtooth') {
        sample = ((t * freq) % 1 - 0.5) * amplitude * 0.6;
      } else if (type === 'triangle') {
        sample = (Math.abs(((t * freq * 2) % 2) - 1) - 0.5) * amplitude * 1.4;
      }
      
      // Add slight stereo spread for more space
      const stereoOffset = Math.sin(t * 8) * 0.1;
      leftChannel[i] = sample * (1 - stereoOffset);
      rightChannel[i] = sample * (1 + stereoOffset);
    }
    
    return buffer;
  }

  play(soundName) {
    if (this.isSoundMuted || !this.audioContext || !this.sounds[soundName]) return;
    
    // Don't play background music through the regular play method
    if (soundName === 'bgMusic' || soundName === 'bgMusicMain' || soundName === 'bgMusicIntense') return;
    
    const source = this.audioContext.createBufferSource();
    source.buffer = this.sounds[soundName];
    
    // Connect to the effects chain with more controlled levels
    const effectsEnabled = true;
    if (effectsEnabled && this.delayNode) {
      // Create a gain node for this specific sound
      const gainNode = this.audioContext.createGain();
      
      // Set different gain values based on the sound type
      if (soundName === 'lineClear') {
        // Increased volume for line clear/rattlesnake sound
        gainNode.gain.value = 1.5; // Significantly louder than other sounds
      } else if (soundName === 'eat') {
        gainNode.gain.value = 0.6; // Lower volume for food sound
      } else if (soundName === 'gameOver') {
        gainNode.gain.value = 1.0; // Normal volume for game over
      } else {
        gainNode.gain.value = 0.9; // Default for other sounds
      }
      
      // Create a gain node for effect send - less effect for clarity
      const effectSend = this.audioContext.createGain();
      // Tailored effect amount by sound type
      const effectAmount = soundName === 'lineClear' ? 0.15 : 
                          soundName === 'gameOver' ? 0.2 : 
                          soundName === 'collision' ? 0.1 : 
                          soundName === 'eat' ? 0.03 : // Reduced effect for food sound
                          0.05;
      effectSend.gain.value = effectAmount;
      
      // Connect main path
      source.connect(gainNode);
      gainNode.connect(this.soundEffectsGain);
      
      // Connect effects path
      source.connect(effectSend);
      effectSend.connect(this.delayNode);
    } else {
      // Simple connection without effects
      source.connect(this.soundEffectsGain);
    }
    
    // Resume audio context if it's suspended (autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    source.start(0);
  }

  startBackgroundMusic(level = 1) {
    if (this.isMusicMuted || !this.audioContext) {
      return;
    }
    
    try {
      // Normalize level parameter - handle both string and numeric values
      let normalizedLevel = 1;
      
      if (typeof level === 'string') {
        switch (level) {
          case 'intense':
            normalizedLevel = 5; // Map 'intense' to level 5
            break;
          case 'main':
          default:
            normalizedLevel = 1;
            break;
        }
      } else if (typeof level === 'number') {
        normalizedLevel = Math.max(1, Math.min(10, level)); // Cap between 1-10
      }
      
      // If music is already playing, stop it first to avoid overlapping sounds
      if (this.bgMusicPlaying && this.bgMusicSource) {
        this.stopBackgroundMusic();
        // Small delay to ensure clean transition
        setTimeout(() => this._initializeBackgroundMusic(normalizedLevel), 50);
        return;
      }
      
      this._initializeBackgroundMusic(normalizedLevel);
    } catch (error) {
      console.error('Error starting background music:', error);
      // Reset state for next attempt
      this.bgMusicPlaying = false;
      this.bgMusicSource = null;
    }
  }
  
  /**
   * Internal method to initialize and start the background music
   * @private
   */
  _initializeBackgroundMusic(level) {
    // Resume audio context if needed
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    // Store current level
    this.currentMusicLevel = level;
    
    // Select the music buffer 
    const musicBuffer = this.sounds.bgMusic;
    
    if (!musicBuffer) {
      console.error('Music buffer not found');
      return;
    }
    
    // Create a gain node for volume control
    this.bgMusicGain = this.audioContext.createGain();
    this.bgMusicGain.gain.value = 0.45; 
    
    // Add EQ for better clarity
    try {
      // Create EQ nodes for a cleaner, brighter sound
      const lowCut = this.audioContext.createBiquadFilter();
      lowCut.type = 'highpass';
      lowCut.frequency.value = 60; // Lower for more bass punch

      const bassBoost = this.audioContext.createBiquadFilter();
      bassBoost.type = 'lowshelf';
      bassBoost.frequency.value = 120;
      bassBoost.gain.value = 4; // More bass for club feel
      
      const lowMidScoop = this.audioContext.createBiquadFilter();
      lowMidScoop.type = 'peaking';
      lowMidScoop.frequency.value = 300;
      lowMidScoop.Q.value = 1;
      lowMidScoop.gain.value = -2; // Clean up mud
      
      const presenceBoost = this.audioContext.createBiquadFilter();
      presenceBoost.type = 'peaking';
      presenceBoost.frequency.value = 3000;
      presenceBoost.Q.value = 0.8;
      presenceBoost.gain.value = 3; // More brightness and clarity
      
      const highShelf = this.audioContext.createBiquadFilter();
      highShelf.type = 'highshelf';
      highShelf.frequency.value = 8000;
      highShelf.gain.value = 2; // Add air and sparkle
      
      // Connect the EQ chain
      this.bgMusicGain.connect(lowCut);
      lowCut.connect(bassBoost);
      bassBoost.connect(lowMidScoop);
      lowMidScoop.connect(presenceBoost);
      presenceBoost.connect(highShelf);
      highShelf.connect(this.audioContext.destination);
    } catch (e) {
      // Fallback to direct connection if EQ fails
      console.log('EQ not supported, using direct connection');
      this.bgMusicGain.connect(this.audioContext.destination);
    }
    
    // Create and configure the source
    this.bgMusicSource = this.audioContext.createBufferSource();
    this.bgMusicSource.buffer = musicBuffer;
    this.bgMusicSource.loop = true;
    
    // Always use a consistent playback rate of 1 to maintain constant pitch
    // Regardless of level, keep the music at normal speed
    this.bgMusicSource.playbackRate.value = 1;
    console.log('Music initialized with constant pitch (playbackRate = 1)');
    
    this.bgMusicSource.connect(this.bgMusicGain);
    
    // Start playback with a short fade-in
    this.bgMusicGain.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.bgMusicGain.gain.linearRampToValueAtTime(0.45, this.audioContext.currentTime + 0.5);
    
    this.bgMusicSource.start(0);
    this.bgMusicPlaying = true;
    this.bgMusicPaused = false;
    
    // When music stops (should only happen if explicitly stopped)
    this.bgMusicSource.onended = () => {
      // Check if this was an unexpected end (not caused by stopBackgroundMusic)
      // If bgMusicPlaying is still true, it means we didn't intend to stop
      if (this.bgMusicPlaying && !this.isMusicMuted && !this.bgMusicPaused) {
        console.log('Background music ended unexpectedly, restarting...');
        // Create a slight delay before restarting to prevent audio glitches
        setTimeout(() => {
          this.startBackgroundMusic(this.currentMusicLevel || 1);
        }, 100);
      } else {
        this.bgMusicPlaying = false;
        this.bgMusicSource = null;
      }
    };
  }

  changeBackgroundMusic(level) {
    // Don't adjust the music speed/pitch based on level anymore
    // This ensures the music plays at a constant pitch
    
    // If music needs to be changed from one track to another (not just speed),
    // check the level to determine which track to play
    if (this.bgMusicPlaying && this.bgMusicSource) {
      try {
        // Just store the current level without changing playback rate
        this.currentMusicLevel = typeof level === 'number' ? level : 1;
        
        console.log(`Music track level: ${this.currentMusicLevel} (maintaining constant pitch)`);
      } catch (error) {
        console.error('Error changing music:', error);
      }
    } else {
      // If not playing, start the music without speed changes
      this.startBackgroundMusic('main'); // Always use main track with constant pitch
    }
  }

  stopBackgroundMusic() {
    if (!this.bgMusicSource) {
      // Music is already stopped or never started
      this.bgMusicPlaying = false;
      return;
    }
    
    try {
      // Fade out gracefully if context is available and not suspended
      if (this.bgMusicGain && this.audioContext && this.audioContext.state === 'running') {
        const currentTime = this.audioContext.currentTime;
        this.bgMusicGain.gain.setValueAtTime(this.bgMusicGain.gain.value, currentTime);
        this.bgMusicGain.gain.linearRampToValueAtTime(0, currentTime + 0.5);
        
        // Stop the source after the fade
        setTimeout(() => {
          try {
            if (this.bgMusicSource) {
              this.bgMusicSource.stop();
              this.bgMusicSource = null;
            }
          } catch (innerError) {
            console.warn('Error stopping music after fade:', innerError);
            this.bgMusicSource = null;
          }
        }, 500);
      } else {
        // Immediate stop if no fade possible
        this.bgMusicSource.stop();
        this.bgMusicSource = null;
      }
    } catch (e) {
      console.warn('Error stopping background music:', e);
      // Still clean up the references so we can restart if needed
      this.bgMusicSource = null;
    }
    
    this.bgMusicPlaying = false;
  }

  pauseBackgroundMusic() {
    if (this.bgMusicSource && this.bgMusicPlaying) {
      this.stopBackgroundMusic();
      this.bgMusicPaused = true;
    }
  }

  resumeBackgroundMusic() {
    if (this.bgMusicPaused) {
      this.bgMusicPaused = false;
      
      // Resume audio context if it was suspended
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      // Check if we still have a valid source and context
      if (this.audioContext && this.bgMusicSource && this.audioContext.state === 'running') {
        // Fade back in
        if (this.bgMusicGain) {
          this.bgMusicGain.gain.setValueAtTime(0, this.audioContext.currentTime);
          this.bgMusicGain.gain.linearRampToValueAtTime(0.45, this.audioContext.currentTime + 0.5);
        }
      } else {
        // Restart if needed
        this.startBackgroundMusic(this.currentMusicLevel || 1);
      }
    }
  }

  toggleMute() {
    this.isSoundMuted = !this.isSoundMuted;
    console.log('Sound muted:', this.isSoundMuted);
    return this.isSoundMuted;
  }

  toggleMusic() {
    this.isMusicMuted = !this.isMusicMuted;
    console.log('Music muted:', this.isMusicMuted);
    
    if (this.isMusicMuted) {
      this.stopBackgroundMusic();
    } else if (!this.bgMusicPaused) {
      this.startBackgroundMusic(this.currentMusicLevel || 1);
    }
    
    return this.isMusicMuted;
  }

  setMute(mute) {
    if (mute !== this.isSoundMuted) {
      this.isSoundMuted = mute;
    }
  }

  setMusicMute(mute) {
    if (mute !== this.isMusicMuted) {
      this.isMusicMuted = mute;
      
      if (this.isMusicMuted) {
        this.stopBackgroundMusic();
      } else if (!this.bgMusicPaused) {
        this.startBackgroundMusic(this.currentMusicLevel || 1);
      }
    }
  }
} 