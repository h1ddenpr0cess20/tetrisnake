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
    this.init();
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
    
    // Line clear sound - ascending notes fanfare
    this.sounds.lineClear = this.createComplexTone([
      { freq: 440, type: 'sine', duration: 0.2, attack: 0.01, release: 0.1 },
      { freq: 554, type: 'sine', duration: 0.2, attack: 0.01, release: 0.1, delay: 0.03 },
      { freq: 659, type: 'sine', duration: 0.2, attack: 0.01, release: 0.1, delay: 0.06 },
      { freq: 880, type: 'sine', duration: 0.25, attack: 0.01, release: 0.15, delay: 0.09 },
      { freq: 1100, type: 'sine', duration: 0.3, attack: 0.02, release: 0.2, delay: 0.12 }
    ]);
    
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
    // Create main theme music
    this.sounds.bgMusicMain = this.createMusicTrack('main');
    
    // Create intense theme (faster version for higher levels)
    this.sounds.bgMusicIntense = this.createMusicTrack('intense');
    
    // Default to main theme
    this.sounds.bgMusic = this.sounds.bgMusicMain;
  }

  createMusicTrack(type) {
    if (!this.audioContext) return null;
    
    // Set up consistent timing for 4/4 time signature
    // Each "beat" will be 0.25 seconds (quarter note)
    const quarterNote = 0.25;
    const eighthNote = quarterNote / 2;
    const halfNote = quarterNote * 2;
    const wholeNote = quarterNote * 4;
    
    // Middle Eastern inspired patterns - toned down the high notes
    // Using Hijaz Kar scale (D, Eb, F#, G, A, Bb, C#, D) - with characteristic augmented 2nd intervals
    const patterns = {
      // Each pattern is exactly 4 beats (one measure in 4/4 time)
      pattern1: [
        { note: 'D3', duration: quarterNote },
        { note: 'F#3', duration: quarterNote },
        { note: 'G3', duration: quarterNote },
        { note: 'Bb3', duration: quarterNote }
      ],
      
      pattern2: [
        { note: 'D3', duration: quarterNote }, // Lowered from D4
        { note: 'C#3', duration: quarterNote }, // Lowered from C#4
        { note: 'Bb3', duration: quarterNote },
        { note: 'G3', duration: quarterNote }
      ],
      
      pattern3: [
        { note: 'G3', duration: eighthNote },
        { note: 'A3', duration: eighthNote },
        { note: 'Bb3', duration: quarterNote },
        { note: 'A3', duration: quarterNote },
        { note: 'G3', duration: halfNote }
      ],
      
      pattern4: [
        { note: 'Eb3', duration: quarterNote },
        { note: 'F#3', duration: quarterNote },
        { note: 'G3', duration: halfNote }
      ],
      
      // Simplified ornamental patterns with fewer high pitches
      pattern5: [
        { note: 'D3', duration: eighthNote }, // Lowered from D4
        { note: 'Eb3', duration: eighthNote }, // Lowered from Eb4
        { note: 'D3', duration: eighthNote }, // Lowered from D4
        { note: 'C#3', duration: eighthNote }, // Lowered from C#4
        { note: 'D3', duration: eighthNote }, // Lowered from D4
        { note: 'Eb3', duration: eighthNote }, // Lowered from Eb4
        { note: 'F#3', duration: quarterNote } // Lowered from F#4
      ],
      
      pattern6: [
        { note: 'A3', duration: eighthNote },
        { note: 'Bb3', duration: eighthNote },
        { note: 'A3', duration: eighthNote },
        { note: 'G3', duration: eighthNote },
        { note: 'F#3', duration: quarterNote },
        { note: 'G3', duration: quarterNote }
      ]
    };
    
    // Create a sequence that follows musical structure
    let fullSequence = [];
    
    if (type === 'main') {
      // Create a Middle Eastern inspired structure
      fullSequence = [
        // Introduction section
        ...patterns.pattern1, ...patterns.pattern2, ...patterns.pattern1, ...patterns.pattern3,
        
        // Main theme with ornaments 
        ...patterns.pattern5, ...patterns.pattern6, ...patterns.pattern5, ...patterns.pattern4,
        
        // Variation section
        ...patterns.pattern2, ...patterns.pattern6, ...patterns.pattern1, ...patterns.pattern3,
        
        // Final section with more ornamentation
        ...patterns.pattern5, ...patterns.pattern4, ...patterns.pattern6, ...patterns.pattern1
      ];
    } else if (type === 'intense') {
      // Faster tempo for intense
      const speedFactor = 0.8; // 20% faster
      
      // Create a more driving Middle Eastern inspired structure
      const intenseParts = [
        ...patterns.pattern5, ...patterns.pattern2, ...patterns.pattern6, ...patterns.pattern1,
        ...patterns.pattern3, ...patterns.pattern5, ...patterns.pattern4, ...patterns.pattern2,
        ...patterns.pattern6, ...patterns.pattern3, ...patterns.pattern5, ...patterns.pattern1
      ];
      
      // Apply tempo adjustment
      fullSequence = intenseParts.map(note => ({
        ...note,
        duration: note.duration * speedFactor
      }));
    }
    
    // Extended note frequency map with Middle Eastern accidentals
    const noteFreq = {
      // Low octave
      'C2': 65.41, 'C#2': 69.30, 'Db2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'Eb2': 77.78,
      'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'Gb2': 92.50, 'G2': 98.00, 'G#2': 103.83,
      'Ab2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'Bb2': 116.54, 'B2': 123.47,
      
      // Mid-low octave
      'C3': 130.81, 'C#3': 138.59, 'Db3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'Eb3': 155.56,
      'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'Gb3': 185.00, 'G3': 196.00, 'G#3': 207.65,
      'Ab3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'Bb3': 233.08, 'B3': 246.94,
      
      // Mid-high octave
      'C4': 261.63, 'C#4': 277.18, 'Db4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'Eb4': 311.13,
      'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'Gb4': 369.99, 'G4': 392.00, 'G#4': 415.30,
      'Ab4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'Bb4': 466.16, 'B4': 493.88,
      
      // High octave
      'C5': 523.25, 'C#5': 554.37, 'Db5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'Eb5': 622.25,
      'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'Gb5': 739.99, 'G5': 783.99, 'G#5': 830.61,
      'Ab5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'Bb5': 932.33, 'B5': 987.77
    };
    
    // Process each note in the melody
    let sequence = [];
    let currentTime = 0;
    let measureCount = 0;
    let beatInMeasure = 0;
    
    // Add a drone note (common in Middle Eastern music)
    const droneDuration = wholeNote * 4; // 4 measures
    for (let m = 0; m < Math.ceil(fullSequence.length / 16); m++) { // 16 notes per 4 measures
      sequence.push({
        time: currentTime + (m * droneDuration),
        freq: noteFreq['D2'], // Low drone on the tonic
        duration: droneDuration * 0.95, // Slightly shorter to avoid clicks
        type: 'drone',
        gain: 0.06, // Decreased gain
        group: 'drone'
      });
    }
    
    // Add stronger Middle Eastern inspired bassline
    for (let m = 0; m < Math.ceil(fullSequence.length / 4); m++) {
      // Middle Eastern rhythmic patterns - emphasizing D as the tonic
      const bassPatterns = [
        ['D2', 'A2', 'D2', 'G2', 'D2', 'A2', 'D2', 'A2'],
        ['D2', 'D2', 'A2', 'G2', 'D2', 'A2', 'G2', 'D2'],
        ['G2', 'D2', 'A2', 'G2', 'D2', 'G2', 'D2', 'A2'],
        ['D2', 'A2', 'G2', 'F#2', 'G2', 'A2', 'D2', 'D2']
      ];
      
      // Choose a pattern based on measure number
      const patternIndex = m % 4;
      const bassPattern = bassPatterns[patternIndex];
      
      // Add each bass note
      for (let i = 0; i < 8; i++) { // 8 eighth notes per measure
        const bassNote = bassPattern[i];
        if (noteFreq[bassNote]) {
          sequence.push({
            time: currentTime + (i * eighthNote) + (m * 4 * quarterNote),
            freq: noteFreq[bassNote],
            duration: eighthNote * 0.8, // Longer for a stronger bassline
            type: 'triangle',
            gain: 0.14, // Increased gain for stronger bass
            group: 'bass'
          });
        }
      }
    }
    
    // Add melody and enhanced Middle Eastern percussion
    fullSequence.forEach((item, index) => {
      // Track our position in musical time
      beatInMeasure += item.duration / quarterNote;
      if (beatInMeasure >= 4) {
        measureCount++;
        beatInMeasure = beatInMeasure % 4;
      }
      
      // Add melody note with slight vibrato for Middle Eastern character
      sequence.push({
        time: currentTime,
        freq: noteFreq[item.note],
        duration: item.duration,
        type: 'midEastern',
        gain: 0.12, // Slightly decreased melody gain
        group: 'melody'
      });
      
      // Enhanced Middle Eastern percussion patterns - STRONGER BEAT
      // Calculate 16th note positions within this note's time span
      const startBeat = Math.floor(beatInMeasure * 4) / 4;
      const noteDurationInBeats = item.duration / quarterNote;
      const endBeat = startBeat + noteDurationInBeats;
      
      // For each 16th note position within this note's timespan
      for (let b = startBeat * 4; b < endBeat * 4; b++) {
        const sixteenthNote = b / 4;
        const sixteenthPosition = sixteenthNote % 4; // Position within measure
        const sixteenthTime = currentTime + ((sixteenthNote - startBeat) * quarterNote);
        
        // Enhanced doumbek/darbuka pattern (stronger Middle Eastern drum)
        // Classic Middle Eastern rhythm patterns:
        
        // Strong Doumbek pattern: Dum, tek, Dum-Dum, tek (Dum = bass, tek = higher tone)
        if (sixteenthPosition === 0) { // Beat 1: Stronger Dum (deep tone)
          sequence.push({
            time: sixteenthTime,
            freq: 55, // Lower frequency for deeper sound
            duration: 0.15, // Longer duration for more impact
            type: 'doumbek',
            gain: 0.18, // Increased gain for stronger beat
            group: 'doumDrum'
          });
        } else if (sixteenthPosition === 1) { // Beat 2: Tek (higher tone)
          sequence.push({
            time: sixteenthTime,
            freq: 170, // Lowered frequency
            duration: 0.08,
            type: 'doumbek',
            gain: 0.12,
            group: 'tekDrum'
          });
        }
        
        // Additional Dum on beat 2.5 for more rhythmic drive
        if (sixteenthPosition === 2) { // Beat 3: Dum (deep tone)
          sequence.push({
            time: sixteenthTime,
            freq: 58, // Lower frequency for deeper sound
            duration: 0.12, // Longer for more impact
            type: 'doumbek',
            gain: 0.17, // Increased gain
            group: 'doumDrum'
          });
        } else if (sixteenthPosition === 2.5) { // Extra Dum for more beat
          sequence.push({
            time: sixteenthTime,
            freq: 60,
            duration: 0.1,
            type: 'doumbek',
            gain: 0.15,
            group: 'doumDrum'
          });
        }
        
        if (sixteenthPosition === 3) { // Beat 4: Tek (higher tone)
          sequence.push({
            time: sixteenthTime,
            freq: 165, // Lowered frequency
            duration: 0.08,
            type: 'doumbek',
            gain: 0.13,
            group: 'tekDrum'
          });
        }
        
        // Removed the zills (finger cymbals) which were likely causing the high-pitched noise
        
        // Add lower pitched frame drum for additional rhythm
        if (sixteenthPosition % 0.5 === 0) { // Every 8th note
          // Only on certain beats for variation
          if (sixteenthPosition === 0.5 || sixteenthPosition === 1.5 || sixteenthPosition === 3.5) {
            sequence.push({
              time: sixteenthTime,
              freq: 130, // Much lower frequency
              duration: 0.06,
              type: 'frameDrum',
              gain: 0.08, // Moderate gain
              group: 'frameDrum'
            });
          }
        }
        
        // Add a low daf drum (frame drum) hit for a stronger beat
        if (sixteenthPosition === 0 || sixteenthPosition === 2) { // On main beats
          sequence.push({
            time: sixteenthTime,
            freq: 90, // Low frequency for depth
            duration: 0.15,
            type: 'daf',
            gain: 0.15, // Good presence
            group: 'daf'
          });
        }
      }
      
      // Update time based on note duration
      currentTime += item.duration;
    });
    
    // Calculate total duration
    const totalDuration = currentTime;
    
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
      
      // Generate the tone for this note
      for (let i = startSample; i < endSample; i++) {
        if (i >= buffer.length) break;
        
        const t = (i - startSample) / sampleRate;
        let sample = 0;
        
        // Different envelope shapes based on instrument type
        let attackTime, releaseTime;
        
        if (note.group === 'doumDrum') {
          attackTime = 0.002; // Faster attack for punchier sound
          releaseTime = 0.2; // Longer release for more body
        } else if (note.group === 'tekDrum') {
          attackTime = 0.001;
          releaseTime = 0.08;
        } else if (note.group === 'frameDrum' || note.group === 'daf') {
          attackTime = 0.002;
          releaseTime = 0.15;
        } else if (note.group === 'bass' || note.group === 'drone') {
          attackTime = 0.02;
          releaseTime = 0.2;
        } else {
          // Middle Eastern melody typically has fast attack
          attackTime = 0.01;
          releaseTime = 0.1;
        }
        
        let amplitude = note.gain;
        
        if (t < attackTime) {
          amplitude *= (t / attackTime); // Attack
        } else if (t > note.duration - releaseTime) {
          amplitude *= (note.duration - t) / releaseTime; // Release
        }
        
        // Middle Eastern instruments and sounds - revised to avoid high pitches
        if (note.type === 'midEastern') {
          // Middle Eastern instrument with characteristic vibrato but less high harmonics
          const vibratoFreq = 5.5; // Slightly slower vibrato
          const vibrato = 1 + (Math.sin(2 * Math.PI * vibratoFreq * t) * 0.005); // Subtle vibrato
          
          // Main tone
          const mainTone = Math.sin(2 * Math.PI * frequency * t * vibrato);
          // Lower harmonic content
          const thirdHarmonic = Math.sin(2 * Math.PI * frequency * 1.5 * t) * 0.15;
          
          sample = (mainTone + thirdHarmonic) * amplitude;
        } else if (note.type === 'drone') {
          // Drone sound with rich but controlled harmonics
          const fundamental = Math.sin(2 * Math.PI * frequency * t);
          const fifth = Math.sin(2 * Math.PI * frequency * 1.5 * t) * 0.3;
          
          sample = (fundamental + fifth) * amplitude * 0.7;
        } else if (note.type === 'triangle') {
          // Fuller triangle wave for bassline
          const fundamental = (Math.abs(((t * frequency * 2) % 2) - 1) - 0.5);
          const subBass = Math.sin(2 * Math.PI * (frequency * 0.5) * t) * 0.15;
          
          sample = (fundamental + subBass) * amplitude * 1.2;
        } else if (note.type === 'doumbek') {
          // Doumbek/darbuka - Middle Eastern hand drum - enhanced for stronger beat
          if (note.group === 'doumDrum') {
            // Deep "Dum" sound with more impact
            const freqEnvelope = Math.exp(-t * 20); // Slower decay
            const bodyResonance = Math.sin(2 * Math.PI * (frequency + 30 * freqEnvelope) * t);
            const clickAttack = Math.sin(2 * Math.PI * 400 * t) * Math.exp(-t * 100) * 0.3; // Lower frequency click
            
            sample = (bodyResonance + clickAttack) * amplitude * Math.exp(-t * 10);
          } else {
            // "Tek" sound with controlled higher frequencies
            const mainFreq = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 20);
            const snap = (Math.random() * 2 - 1) * Math.exp(-t * 50) * 0.4;
            
            sample = (mainFreq * 0.6 + snap * 0.4) * amplitude;
          }
        } else if (note.type === 'frameDrum' || note.type === 'daf') {
          // Frame drum sound - deep and resonant
          const mainFreq = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 12);
          const bodyResonance = Math.sin(2 * Math.PI * (frequency * 1.2) * t) * Math.exp(-t * 15) * 0.4;
          const thump = Math.sin(2 * Math.PI * (frequency * 0.8) * t) * Math.exp(-t * 8) * 0.5;
          
          sample = (mainFreq + bodyResonance + thump) * amplitude;
        }
        
        // Stereo positioning by instrument type
        let stereoPan = 0;
        
        // Position instruments for a balanced stereo field
        if (note.group === 'doumDrum') {
          stereoPan = -0.15; // Centered with slight left bias
        } else if (note.group === 'tekDrum') {
          stereoPan = 0.15; // Slight right
        } else if (note.group === 'frameDrum') {
          stereoPan = 0.25; // More right
        } else if (note.group === 'daf') {
          stereoPan = -0.2; // More left
        } else if (note.group === 'drone') {
          stereoPan = 0; // Centered
        } else if (note.group === 'bass') {
          stereoPan = -0.1; // Slightly left
        } else if (note.group === 'melody') {
          // Melody moves slightly
          stereoPan = Math.sin(note.time * 0.5) * 0.1; // Subtle movement
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
      if (max > 0.7) { // Lower target for clearer mix
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
      gainNode.gain.value = 0.9; // Higher direct signal
      
      // Create a gain node for effect send - less effect for clarity
      const effectSend = this.audioContext.createGain();
      // Tailored effect amount by sound type
      const effectAmount = soundName === 'lineClear' ? 0.15 : 
                          soundName === 'gameOver' ? 0.2 : 
                          soundName === 'collision' ? 0.1 : 
                          soundName === 'eat' ? 0.03 : // Reduced effect for food sound
                          0.05;
      effectSend.gain.value = effectAmount;
      
      // Adjust volume for specific sounds
      if (soundName === 'eat') {
        gainNode.gain.value = 0.6; // Lower volume for food sound
      } else if (soundName === 'lineClear') {
        gainNode.gain.value = 1.0; // Higher volume for line clear
      }
      
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

  startBackgroundMusic(track = 'main') {
    if (this.isMusicMuted || !this.audioContext || !this.sounds.bgMusic || this.bgMusicPlaying) return;
    
    // Resume audio context if needed
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    // Use the requested track
    this.musicTrack = track;
    
    // Select the appropriate music track
    const musicBuffer = track === 'intense' ? 
                       this.sounds.bgMusicIntense : 
                       this.sounds.bgMusicMain;
    
    if (!musicBuffer) return;
    
    // Create a gain node for volume control
    this.bgMusicGain = this.audioContext.createGain();
    this.bgMusicGain.gain.value = 0.4; // Slightly lower for better balance
    
    // Add EQ for better clarity
    try {
      // Create EQ nodes for clearer sound
      const lowCut = this.audioContext.createBiquadFilter();
      lowCut.type = 'highpass';
      lowCut.frequency.value = 120; // Cut rumble
      
      const bassBoost = this.audioContext.createBiquadFilter();
      bassBoost.type = 'lowshelf';
      bassBoost.frequency.value = 250;
      bassBoost.gain.value = 2; // Less extreme boost
      
      const midScoop = this.audioContext.createBiquadFilter();
      midScoop.type = 'peaking';
      midScoop.frequency.value = 500; // Lower for mud removal
      midScoop.Q.value = 1;
      midScoop.gain.value = -3; // Deeper cut to remove mud
      
      const presenceBoost = this.audioContext.createBiquadFilter();
      presenceBoost.type = 'peaking';
      presenceBoost.frequency.value = 2000;
      presenceBoost.Q.value = 0.8;
      presenceBoost.gain.value = 2;
      
      const highBoost = this.audioContext.createBiquadFilter();
      highBoost.type = 'highshelf';
      highBoost.frequency.value = 4000;
      highBoost.gain.value = 3;
      
      // Connect the EQ chain
      this.bgMusicGain.connect(lowCut);
      lowCut.connect(bassBoost);
      bassBoost.connect(midScoop);
      midScoop.connect(presenceBoost);
      presenceBoost.connect(highBoost);
      highBoost.connect(this.audioContext.destination);
    } catch (e) {
      // Fallback to direct connection if EQ fails
      console.log('EQ not supported, using direct connection');
      this.bgMusicGain.connect(this.audioContext.destination);
    }
    
    // Create and configure the source
    this.bgMusicSource = this.audioContext.createBufferSource();
    this.bgMusicSource.buffer = musicBuffer;
    this.bgMusicSource.loop = true;
    this.bgMusicSource.connect(this.bgMusicGain);
    
    // Start playback with a short fade-in
    this.bgMusicGain.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.bgMusicGain.gain.linearRampToValueAtTime(0.4, this.audioContext.currentTime + 0.5);
    
    this.bgMusicSource.start(0);
    this.bgMusicPlaying = true;
    this.bgMusicPaused = false;
    
    // When music stops (should only happen if explicitly stopped)
    this.bgMusicSource.onended = () => {
      this.bgMusicPlaying = false;
      this.bgMusicSource = null;
    };
  }

  // Change the music track while playing
  changeBackgroundMusic(track) {
    if (track === this.musicTrack) return; // Already playing this track
    
    // Stop current music
    if (this.bgMusicPlaying) {
      this.stopBackgroundMusic();
    }
    
    // Start the new track
    this.startBackgroundMusic(track);
  }

  stopBackgroundMusic() {
    if (this.bgMusicSource) {
      try {
        // Fade out gracefully
        if (this.bgMusicGain && this.audioContext) {
          const currentTime = this.audioContext.currentTime;
          this.bgMusicGain.gain.setValueAtTime(this.bgMusicGain.gain.value, currentTime);
          this.bgMusicGain.gain.linearRampToValueAtTime(0, currentTime + 0.5);
          
          // Stop the source after the fade
          setTimeout(() => {
            if (this.bgMusicSource) {
              this.bgMusicSource.stop();
              this.bgMusicSource = null;
            }
          }, 500);
        } else {
          this.bgMusicSource.stop();
          this.bgMusicSource = null;
        }
      } catch (e) {
        console.log('Error stopping music:', e);
      }
      
      this.bgMusicPlaying = false;
    }
  }

  pauseBackgroundMusic() {
    if (this.bgMusicSource && this.bgMusicPlaying) {
      this.stopBackgroundMusic();
      this.bgMusicPaused = true;
    }
  }

  resumeBackgroundMusic() {
    if (this.bgMusicPaused) {
      this.startBackgroundMusic(this.musicTrack);
      this.bgMusicPaused = false;
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
      this.startBackgroundMusic(this.musicTrack);
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
        this.startBackgroundMusic(this.musicTrack);
      }
    }
  }
} 