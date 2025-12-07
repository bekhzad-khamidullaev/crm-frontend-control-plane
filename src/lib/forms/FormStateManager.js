/**
 * Form state manager with change tracking and undo/redo
 */
export class FormStateManager {
  constructor({ trackHistory = true, maxHistory = 50 } = {}) {
    this.trackHistory = trackHistory;
    this.maxHistory = maxHistory;
    
    this.initialState = null;
    this.currentState = null;
    this.history = [];
    this.historyIndex = -1;
  }
  
  // Capture initial state
  captureState(data) {
    const state = this.cloneState(data);
    
    if (this.initialState === null) {
      this.initialState = state;
    }
    
    this.currentState = state;
    
    if (this.trackHistory) {
      this.addToHistory(state);
    }
  }
  
  // Add state to history
  addToHistory(state) {
    // Remove any forward history
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    
    this.history.push(this.cloneState(state));
    
    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }
  
  // Check if form has unsaved changes
  isDirty() {
    if (!this.initialState || !this.currentState) return false;
    return !this.statesEqual(this.initialState, this.currentState);
  }
  
  // Undo to previous state
  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.currentState = this.cloneState(this.history[this.historyIndex]);
      return this.currentState;
    }
    return null;
  }
  
  // Redo to next state
  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.currentState = this.cloneState(this.history[this.historyIndex]);
      return this.currentState;
    }
    return null;
  }
  
  // Can undo?
  canUndo() {
    return this.historyIndex > 0;
  }
  
  // Can redo?
  canRedo() {
    return this.historyIndex < this.history.length - 1;
  }
  
  // Get current state
  getCurrentState() {
    return this.cloneState(this.currentState);
  }
  
  // Get initial state
  getInitialState() {
    return this.cloneState(this.initialState);
  }
  
  // Get history
  getHistory() {
    return this.history.map(state => this.cloneState(state));
  }
  
  // Get changes from initial
  getChanges() {
    if (!this.initialState || !this.currentState) return {};
    
    const changes = {};
    
    Object.keys(this.currentState).forEach(key => {
      if (this.currentState[key] !== this.initialState[key]) {
        changes[key] = {
          from: this.initialState[key],
          to: this.currentState[key]
        };
      }
    });
    
    return changes;
  }
  
  // Reset to initial state
  reset() {
    if (this.initialState) {
      this.currentState = this.cloneState(this.initialState);
      this.history = [this.currentState];
      this.historyIndex = 0;
      return this.currentState;
    }
    return null;
  }
  
  // Clear all state
  clear() {
    this.initialState = null;
    this.currentState = null;
    this.history = [];
    this.historyIndex = -1;
  }
  
  // Compare two states
  statesEqual(state1, state2) {
    if (!state1 || !state2) return false;
    
    const keys1 = Object.keys(state1);
    const keys2 = Object.keys(state2);
    
    if (keys1.length !== keys2.length) return false;
    
    return keys1.every(key => {
      const val1 = state1[key];
      const val2 = state2[key];
      
      if (Array.isArray(val1) && Array.isArray(val2)) {
        return JSON.stringify(val1) === JSON.stringify(val2);
      }
      
      if (typeof val1 === 'object' && typeof val2 === 'object') {
        return JSON.stringify(val1) === JSON.stringify(val2);
      }
      
      return val1 === val2;
    });
  }
  
  // Clone state object
  cloneState(state) {
    if (!state) return null;
    
    // Deep clone using JSON (works for most cases)
    try {
      return JSON.parse(JSON.stringify(state));
    } catch {
      // Fallback to shallow clone
      return { ...state };
    }
  }
}
