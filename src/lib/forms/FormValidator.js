/**
 * Enterprise form validation system with rules and async validators
 */
export class FormValidator {
  constructor() {
    this.rules = {};
    this.customValidators = {};
  }
  
  // Add validation rule for field
  addRule(fieldName, rule) {
    if (!this.rules[fieldName]) {
      this.rules[fieldName] = [];
    }
    this.rules[fieldName].push(rule);
  }
  
  // Add multiple rules
  addRules(rules) {
    Object.entries(rules).forEach(([field, fieldRules]) => {
      if (Array.isArray(fieldRules)) {
        fieldRules.forEach(rule => this.addRule(field, rule));
      } else {
        this.addRule(field, fieldRules);
      }
    });
  }
  
  // Add custom validator
  addValidator(name, validator) {
    this.customValidators[name] = validator;
  }
  
  // Validate all fields
  async validate(data) {
    const errors = {};
    
    for (const [fieldName, rules] of Object.entries(this.rules)) {
      const value = data[fieldName];
      
      for (const rule of rules) {
        const error = await this.validateRule(fieldName, value, rule, data);
        if (error) {
          errors[fieldName] = error;
          break; // Stop on first error for this field
        }
      }
    }
    
    return errors;
  }
  
  // Validate single rule
  async validateRule(fieldName, value, rule, allData) {
    // Handle string rule (shorthand)
    if (typeof rule === 'string') {
      return this.validateStringRule(fieldName, value, rule);
    }
    
    // Handle object rule
    if (typeof rule === 'object') {
      const { type, message, ...params } = rule;
      
      // Built-in validators
      switch(type) {
        case 'required':
          if (!value || (typeof value === 'string' && !value.trim())) {
            return message || `${this.formatFieldName(fieldName)} is required`;
          }
          break;
          
        case 'email':
          if (value && !this.isValidEmail(value)) {
            return message || 'Invalid email address';
          }
          break;
          
        case 'url':
          if (value && !this.isValidUrl(value)) {
            return message || 'Invalid URL';
          }
          break;
          
        case 'min':
          if (value && value.length < params.length) {
            return message || `Minimum ${params.length} characters required`;
          }
          break;
          
        case 'max':
          if (value && value.length > params.length) {
            return message || `Maximum ${params.length} characters allowed`;
          }
          break;
          
        case 'minValue':
          if (value && parseFloat(value) < params.value) {
            return message || `Minimum value is ${params.value}`;
          }
          break;
          
        case 'maxValue':
          if (value && parseFloat(value) > params.value) {
            return message || `Maximum value is ${params.value}`;
          }
          break;
          
        case 'pattern':
          if (value && !new RegExp(params.pattern).test(value)) {
            return message || 'Invalid format';
          }
          break;
          
        case 'match':
          if (value !== allData[params.field]) {
            return message || `Must match ${this.formatFieldName(params.field)}`;
          }
          break;
          
        case 'custom':
          if (params.validator) {
            const result = await params.validator(value, allData);
            if (result !== true) {
              return result || message || 'Validation failed';
            }
          }
          break;
          
        case 'async':
          if (params.validator) {
            const result = await params.validator(value, allData);
            if (result !== true) {
              return result || message || 'Validation failed';
            }
          }
          break;
          
        default:
          // Check custom validators
          if (this.customValidators[type]) {
            const result = await this.customValidators[type](value, params, allData);
            if (result !== true) {
              return result || message || 'Validation failed';
            }
          }
      }
    }
    
    // Handle function rule
    if (typeof rule === 'function') {
      const result = await rule(value, allData);
      if (result !== true) {
        return result || 'Validation failed';
      }
    }
    
    return null;
  }
  
  // Validate string rule (shorthand)
  validateStringRule(fieldName, value, rule) {
    switch(rule) {
      case 'required':
        if (!value || (typeof value === 'string' && !value.trim())) {
          return `${this.formatFieldName(fieldName)} is required`;
        }
        break;
        
      case 'email':
        if (value && !this.isValidEmail(value)) {
          return 'Invalid email address';
        }
        break;
        
      case 'url':
        if (value && !this.isValidUrl(value)) {
          return 'Invalid URL';
        }
        break;
        
      case 'phone':
        if (value && !this.isValidPhone(value)) {
          return 'Invalid phone number';
        }
        break;
        
      case 'numeric':
        if (value && !/^\d+$/.test(value)) {
          return 'Must be numeric';
        }
        break;
        
      case 'alpha':
        if (value && !/^[a-zA-Z]+$/.test(value)) {
          return 'Must contain only letters';
        }
        break;
        
      case 'alphanumeric':
        if (value && !/^[a-zA-Z0-9]+$/.test(value)) {
          return 'Must contain only letters and numbers';
        }
        break;
    }
    
    return null;
  }
  
  // Validate single field
  async validateField(fieldName, value, allData = {}) {
    const rules = this.rules[fieldName];
    if (!rules) return null;
    
    for (const rule of rules) {
      const error = await this.validateRule(fieldName, value, rule, allData);
      if (error) return error;
    }
    
    return null;
  }
  
  // Helper: validate email
  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
  
  // Helper: validate URL
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  // Helper: validate phone
  isValidPhone(phone) {
    const re = /^[\d\s\-+()]+$/;
    return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }
  
  // Helper: format field name
  formatFieldName(fieldName) {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }
  
  // Clear all rules
  clear() {
    this.rules = {};
  }
  
  // Remove rules for specific field
  removeRules(fieldName) {
    delete this.rules[fieldName];
  }
}

// Common validation rules
export const ValidationRules = {
  required: { type: 'required' },
  email: { type: 'email' },
  url: { type: 'url' },
  phone: 'phone',
  numeric: 'numeric',
  
  min: (length, message) => ({ type: 'min', length, message }),
  max: (length, message) => ({ type: 'max', length, message }),
  minValue: (value, message) => ({ type: 'minValue', value, message }),
  maxValue: (value, message) => ({ type: 'maxValue', value, message }),
  pattern: (pattern, message) => ({ type: 'pattern', pattern, message }),
  match: (field, message) => ({ type: 'match', field, message }),
  
  custom: (validator, message) => ({ type: 'custom', validator, message }),
  async: (validator, message) => ({ type: 'async', validator, message })
};
