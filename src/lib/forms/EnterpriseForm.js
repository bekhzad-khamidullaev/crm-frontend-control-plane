import { AutoSave } from '../../components/ui-AutoSave.js';
import { FormValidator } from './FormValidator.js';
import { FormStateManager } from './FormStateManager.js';
import { Toast } from '../../components/ui-Toast.js';

/**
 * Enterprise base class for all forms
 */
export class EnterpriseForm {
  constructor({
    formElement,
    apiClient,
    entityId = null,
    autoSave = true,
    autoSaveInterval = 30000,
    trackHistory = true,
    optimisticUpdates = true,
    onSave = null,
    onError = null,
    onConflict = null
  } = {}) {
    this.form = formElement;
    this.apiClient = apiClient;
    this.entityId = entityId;
    this.autoSaveEnabled = autoSave;
    this.optimisticUpdates = optimisticUpdates;
    this.onSave = onSave;
    this.onError = onError;
    this.onConflict = onConflict;
    
    // Initialize sub-systems
    this.validator = new FormValidator();
    this.stateManager = new FormStateManager({ trackHistory });
    
    if (autoSave) {
      this.autoSave = new AutoSave({
        interval: autoSaveInterval,
        onSave: (data) => this.save(data, true),
        onError: (err) => this.handleError(err)
      });
      this.autoSave.attach(this.form);
    }
    
    // Version tracking for conflict resolution
    this.version = null;
    this.lastServerData = null;
    
    this.init();
  }
  
  init() {
    // Track initial state
    this.stateManager.captureState(this.getFormData());
    
    // Setup form submission
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  }
  
  // Get form data as object
  getFormData() {
    const formData = new FormData(this.form);
    const data = {};
    
    formData.forEach((value, key) => {
      // Handle multiple values (checkboxes, multi-select)
      if (data[key]) {
        if (Array.isArray(data[key])) {
          data[key].push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    });
    
    return data;
  }
  
  // Set form data
  setFormData(data) {
    Object.entries(data).forEach(([key, value]) => {
      const field = this.form.elements[key];
      if (!field) return;
      
      if (field.type === 'checkbox') {
        field.checked = Boolean(value);
      } else if (field.type === 'radio') {
        const radio = this.form.querySelector(`input[name="${key}"][value="${value}"]`);
        if (radio) radio.checked = true;
      } else {
        field.value = value || '';
      }
    });
    
    this.stateManager.captureState(data);
  }
  
  // Validate form
  async validate() {
    const data = this.getFormData();
    const errors = await this.validator.validate(data);
    
    // Display errors on fields
    Object.entries(errors).forEach(([field, message]) => {
      this.setFieldError(field, message);
    });
    
    return Object.keys(errors).length === 0;
  }
  
  // Set field error
  setFieldError(fieldName, message) {
    const field = this.form.elements[fieldName];
    if (!field) return;
    
    // Find associated component API
    const wrapper = field.closest('.mdc-text-field, .enterprise-select-wrapper, .enterprise-datepicker-wrapper');
    if (wrapper && wrapper._component && wrapper._component.setError) {
      wrapper._component.setError(message);
    } else {
      // Fallback: add error class and message
      field.classList.add('error');
      const errorEl = field.parentElement.querySelector('.error-message');
      if (errorEl) {
        errorEl.textContent = message;
      }
    }
  }
  
  // Clear field error
  clearFieldError(fieldName) {
    const field = this.form.elements[fieldName];
    if (!field) return;
    
    const wrapper = field.closest('.mdc-text-field, .enterprise-select-wrapper, .enterprise-datepicker-wrapper');
    if (wrapper && wrapper._component && wrapper._component.clearError) {
      wrapper._component.clearError();
    } else {
      field.classList.remove('error');
      const errorEl = field.parentElement.querySelector('.error-message');
      if (errorEl) {
        errorEl.textContent = '';
      }
    }
  }
  
  // Clear all errors
  clearAllErrors() {
    const fields = Array.from(this.form.elements);
    fields.forEach(field => {
      if (field.name) this.clearFieldError(field.name);
    });
  }
  
  // Handle form submission
  async handleSubmit() {
    this.clearAllErrors();
    
    const isValid = await this.validate();
    if (!isValid) {
      Toast.error('Please fix validation errors');
      return;
    }
    
    const data = this.getFormData();
    await this.save(data, false);
  }
  
  // Save data
  async save(data, isAutoSave = false) {
    try {
      let result;
      
      // Optimistic update
      if (this.optimisticUpdates && !isAutoSave) {
        this.applyOptimisticUpdate(data);
      }
      
      // Send to server
      if (this.entityId) {
        // Update existing
        result = await this.apiClient.patch(this.entityId, data);
      } else {
        // Create new
        result = await this.apiClient.create(data);
        this.entityId = result.id;
      }
      
      // Check for version conflicts
      if (this.version && result.version && result.version !== this.version) {
        return this.handleConflict(data, result);
      }
      
      // Update version and server data
      this.version = result.version;
      this.lastServerData = result;
      
      // Update state manager
      this.stateManager.captureState(data);
      
      // Callback
      if (this.onSave) {
        this.onSave(result, isAutoSave);
      }
      
      if (!isAutoSave) {
        Toast.success(this.entityId ? 'Saved successfully' : 'Created successfully');
      }
      
      return result;
      
    } catch (error) {
      // Rollback optimistic update
      if (this.optimisticUpdates && !isAutoSave) {
        this.rollbackOptimisticUpdate();
      }
      
      this.handleError(error, isAutoSave);
      throw error;
    }
  }
  
  // Apply optimistic update
  applyOptimisticUpdate(data) {
    // Store current data for rollback
    this._optimisticData = this.getFormData();
    
    // Show saving indicator
    this.form.classList.add('saving');
  }
  
  // Rollback optimistic update
  rollbackOptimisticUpdate() {
    if (this._optimisticData) {
      this.setFormData(this._optimisticData);
      this._optimisticData = null;
    }
    
    this.form.classList.remove('saving');
  }
  
  // Handle server errors
  handleError(error, isAutoSave = false) {
    console.error('Form error:', error);
    
    // Map DRF errors to fields
    if (error.details && typeof error.details === 'object') {
      Object.entries(error.details).forEach(([field, messages]) => {
        const message = Array.isArray(messages) ? messages.join(', ') : messages;
        this.setFieldError(field, message);
      });
    }
    
    if (!isAutoSave) {
      Toast.error(error.message || 'Failed to save');
    }
    
    if (this.onError) {
      this.onError(error);
    }
  }
  
  // Handle version conflicts
  async handleConflict(localData, serverData) {
    console.warn('Version conflict detected');
    
    if (this.onConflict) {
      const resolution = await this.onConflict(localData, serverData);
      
      if (resolution === 'server') {
        this.setFormData(serverData);
        this.version = serverData.version;
        Toast.info('Loaded server version');
      } else if (resolution === 'local') {
        // Force save with server version
        this.version = serverData.version;
        return this.save(localData, false);
      } else if (resolution === 'merge') {
        const merged = { ...serverData, ...localData };
        this.setFormData(merged);
        this.version = serverData.version;
        return this.save(merged, false);
      }
    } else {
      // Default: show dialog
      const result = confirm(
        'This record was modified by someone else. Load their changes? (Cancel to keep your changes)'
      );
      
      if (result) {
        this.setFormData(serverData);
        this.version = serverData.version;
      }
    }
  }
  
  // Undo last change
  undo() {
    const previousState = this.stateManager.undo();
    if (previousState) {
      this.setFormData(previousState);
      Toast.info('Undone');
    }
  }
  
  // Redo change
  redo() {
    const nextState = this.stateManager.redo();
    if (nextState) {
      this.setFormData(nextState);
      Toast.info('Redone');
    }
  }
  
  // Check if form has unsaved changes
  isDirty() {
    return this.stateManager.isDirty();
  }
  
  // Get change history
  getHistory() {
    return this.stateManager.getHistory();
  }
  
  // Destroy form
  destroy() {
    if (this.autoSave) {
      this.autoSave.destroy();
    }
    this.stateManager.clear();
  }
}
