/**
 * Enterprise AutoSave component for forms
 */
export class AutoSave {
  constructor({
    interval = 30000, // 30 seconds
    onSave = null,
    onError = null,
    debug = false
  } = {}) {
    this.interval = interval;
    this.onSave = onSave;
    this.onError = onError;
    this.debug = debug;
    
    this.timer = null;
    this.saving = false;
    this.lastSaved = null;
    this.pendingChanges = false;
    this.formData = {};
    
    this.indicator = this.createIndicator();
  }
  
  createIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'enterprise-autosave-indicator';
    indicator.innerHTML = `
      <span class="enterprise-autosave-indicator__icon material-icons"></span>
      <span class="enterprise-autosave-indicator__text"></span>
    `;
    return indicator;
  }
  
  // Attach to form
  attach(form) {
    if (!(form instanceof HTMLFormElement)) {
      console.error('AutoSave: form must be HTMLFormElement');
      return;
    }
    
    this.form = form;
    
    // Add indicator to form
    if (!form.querySelector('.enterprise-autosave-indicator')) {
      form.appendChild(this.indicator);
    }
    
    // Listen to all inputs
    form.addEventListener('input', () => {
      this.markDirty();
    });
    
    form.addEventListener('change', () => {
      this.markDirty();
    });
    
    // Prevent unload with unsaved changes
    window.addEventListener('beforeunload', (e) => {
      if (this.pendingChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    });
    
    this.updateStatus('ready', 'All changes saved');
    
    if (this.debug) console.log('AutoSave: attached to form');
  }
  
  // Mark form as dirty
  markDirty() {
    this.pendingChanges = true;
    
    // Clear existing timer
    if (this.timer) {
      clearTimeout(this.timer);
    }
    
    // Set new timer
    this.timer = setTimeout(() => {
      this.save();
    }, this.interval);
    
    this.updateStatus('pending', 'Unsaved changes');
    
    if (this.debug) console.log('AutoSave: marked dirty, will save in', this.interval / 1000, 'seconds');
  }
  
  // Save form
  async save() {
    if (this.saving) {
      if (this.debug) console.log('AutoSave: already saving, skipping');
      return;
    }
    
    if (!this.pendingChanges) {
      if (this.debug) console.log('AutoSave: no pending changes, skipping');
      return;
    }
    
    this.saving = true;
    this.updateStatus('saving', 'Saving...');
    
    try {
      // Collect form data
      const formData = new FormData(this.form);
      const data = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });
      
      this.formData = data;
      
      // Call save handler
      if (this.onSave) {
        await this.onSave(data);
      }
      
      this.pendingChanges = false;
      this.lastSaved = new Date();
      this.updateStatus('saved', 'All changes saved');
      
      if (this.debug) console.log('AutoSave: saved successfully', data);
      
      // Show saved status for 3 seconds, then switch to ready
      setTimeout(() => {
        if (!this.pendingChanges) {
          this.updateStatus('ready', this.getTimeAgo());
        }
      }, 3000);
      
    } catch (error) {
      this.updateStatus('error', 'Failed to save');
      
      if (this.onError) {
        this.onError(error);
      }
      
      if (this.debug) console.error('AutoSave: save failed', error);
      
      // Retry after 5 seconds
      setTimeout(() => {
        if (this.pendingChanges) {
          this.save();
        }
      }, 5000);
    } finally {
      this.saving = false;
    }
  }
  
  // Force save
  forceSave() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    return this.save();
  }
  
  // Update status indicator
  updateStatus(status, text) {
    const icon = this.indicator.querySelector('.enterprise-autosave-indicator__icon');
    const textEl = this.indicator.querySelector('.enterprise-autosave-indicator__text');
    
    this.indicator.className = 'enterprise-autosave-indicator';
    this.indicator.classList.add(`enterprise-autosave-indicator--${status}`);
    
    switch(status) {
      case 'pending':
        icon.textContent = 'schedule';
        break;
      case 'saving':
        icon.textContent = 'sync';
        icon.classList.add('spinning');
        break;
      case 'saved':
        icon.textContent = 'check_circle';
        icon.classList.remove('spinning');
        break;
      case 'error':
        icon.textContent = 'error';
        icon.classList.remove('spinning');
        break;
      case 'ready':
        icon.textContent = 'cloud_done';
        icon.classList.remove('spinning');
        break;
    }
    
    textEl.textContent = text;
  }
  
  // Get time ago
  getTimeAgo() {
    if (!this.lastSaved) return 'Never saved';
    
    const seconds = Math.floor((new Date() - this.lastSaved) / 1000);
    
    if (seconds < 60) return 'Saved just now';
    if (seconds < 3600) return `Saved ${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `Saved ${Math.floor(seconds / 3600)} hours ago`;
    return 'Saved ' + this.lastSaved.toLocaleDateString();
  }
  
  // Update time ago periodically
  startTimeUpdater() {
    setInterval(() => {
      if (this.lastSaved && !this.pendingChanges && !this.saving) {
        this.updateStatus('ready', this.getTimeAgo());
      }
    }, 60000); // Update every minute
  }
  
  // Destroy
  destroy() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    if (this.indicator && this.indicator.parentNode) {
      this.indicator.remove();
    }
    this.form = null;
    
    if (this.debug) console.log('AutoSave: destroyed');
  }
  
  // Get indicator element
  getIndicator() {
    return this.indicator;
  }
}
