/**
 * CallTimer Component
 * Displays call duration timer
 */

/**
 * Create call timer component
 * @param {number} [startTime] - Start timestamp (default: now)
 * @returns {Object} { element, start, stop, reset }
 */
export function CallTimer(startTime = Date.now()) {
  const container = document.createElement('div');
  container.className = 'call-timer';

  const display = document.createElement('div');
  display.className = 'call-timer__display';
  display.textContent = '00:00';

  container.appendChild(display);

  let interval = null;
  let start = startTime;
  let paused = false;
  let pausedDuration = 0;

  /**
   * Format seconds to MM:SS or HH:MM:SS
   */
  function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Update timer display
   */
  function update() {
    if (paused) return;
    
    const elapsed = Math.floor((Date.now() - start - pausedDuration) / 1000);
    display.textContent = formatTime(elapsed);
  }

  /**
   * Start timer
   */
  function startTimer() {
    if (interval) return;
    
    if (paused) {
      pausedDuration += Date.now() - pausedTime;
      paused = false;
    }
    
    update();
    interval = setInterval(update, 1000);
  }

  /**
   * Stop timer
   */
  function stopTimer() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }

  /**
   * Pause timer
   */
  let pausedTime = 0;
  function pauseTimer() {
    if (!paused) {
      paused = true;
      pausedTime = Date.now();
    }
  }

  /**
   * Resume timer
   */
  function resumeTimer() {
    if (paused) {
      pausedDuration += Date.now() - pausedTime;
      paused = false;
    }
  }

  /**
   * Reset timer
   */
  function resetTimer() {
    stopTimer();
    start = Date.now();
    pausedDuration = 0;
    paused = false;
    display.textContent = '00:00';
  }

  /**
   * Get elapsed seconds
   */
  function getElapsed() {
    return Math.floor((Date.now() - start - pausedDuration) / 1000);
  }

  // Auto-start
  startTimer();

  return {
    element: container,
    start: startTimer,
    stop: stopTimer,
    pause: pauseTimer,
    resume: resumeTimer,
    reset: resetTimer,
    getElapsed,
  };
}

export default CallTimer;
