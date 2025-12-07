/**
 * Enterprise ValidationSummary - displays all validation errors
 */
export function ValidationSummary({
  title = 'Please fix the following errors:',
  scrollToError = true,
  autoHide = true,
  position = 'top' // top or bottom
} = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'enterprise-validation-summary';
  wrapper.style.display = 'none';
  
  const container = document.createElement('div');
  container.className = 'enterprise-validation-summary__container';
  
  // Icon
  const icon = document.createElement('span');
  icon.className = 'material-icons enterprise-validation-summary__icon';
  icon.textContent = 'error';
  
  // Content
  const content = document.createElement('div');
  content.className = 'enterprise-validation-summary__content';
  
  // Title
  const titleEl = document.createElement('div');
  titleEl.className = 'enterprise-validation-summary__title';
  titleEl.textContent = title;
  
  // Errors list
  const errorsList = document.createElement('ul');
  errorsList.className = 'enterprise-validation-summary__list';
  
  content.append(titleEl, errorsList);
  
  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'enterprise-validation-summary__close';
  closeBtn.innerHTML = '<span class="material-icons">close</span>';
  
  container.append(icon, content, closeBtn);
  wrapper.appendChild(container);
  
  // State
  let errors = [];
  
  // Add error
  function addError(fieldName, message, fieldElement = null) {
    const error = {
      field: fieldName,
      message: message,
      element: fieldElement
    };
    
    // Check if error already exists
    const existing = errors.findIndex(e => e.field === fieldName);
    if (existing > -1) {
      errors[existing] = error;
    } else {
      errors.push(error);
    }
    
    render();
  }
  
  // Add multiple errors
  function addErrors(errorsObj) {
    Object.entries(errorsObj).forEach(([field, message]) => {
      addError(field, Array.isArray(message) ? message.join(', ') : message);
    });
  }
  
  // Remove error
  function removeError(fieldName) {
    errors = errors.filter(e => e.field !== fieldName);
    render();
  }
  
  // Clear all errors
  function clear() {
    errors = [];
    wrapper.style.display = 'none';
  }
  
  // Render errors
  function render() {
    errorsList.innerHTML = '';
    
    if (errors.length === 0) {
      if (autoHide) {
        wrapper.style.display = 'none';
      }
      return;
    }
    
    wrapper.style.display = 'block';
    
    errors.forEach(error => {
      const li = document.createElement('li');
      li.className = 'enterprise-validation-summary__item';
      
      const fieldLabel = document.createElement('strong');
      fieldLabel.textContent = formatFieldName(error.field) + ': ';
      
      const message = document.createElement('span');
      message.textContent = error.message;
      
      li.append(fieldLabel, message);
      
      // Make clickable to scroll to field
      if (scrollToError && error.element) {
        li.style.cursor = 'pointer';
        li.addEventListener('click', () => {
          scrollToField(error.element);
        });
      }
      
      errorsList.appendChild(li);
    });
    
    // Scroll summary into view
    wrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  
  // Format field name
  function formatFieldName(field) {
    return field
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }
  
  // Scroll to field
  function scrollToField(element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.focus();
    
    // Highlight field briefly
    element.classList.add('enterprise-validation-summary__highlight');
    setTimeout(() => {
      element.classList.remove('enterprise-validation-summary__highlight');
    }, 2000);
  }
  
  // Close button handler
  closeBtn.addEventListener('click', () => {
    wrapper.style.display = 'none';
  });
  
  return {
    element: wrapper,
    addError,
    addErrors,
    removeError,
    clear,
    hasErrors: () => errors.length > 0,
    getErrors: () => errors,
    show: () => {
      if (errors.length > 0) {
        wrapper.style.display = 'block';
      }
    },
    hide: () => {
      wrapper.style.display = 'none';
    }
  };
}
