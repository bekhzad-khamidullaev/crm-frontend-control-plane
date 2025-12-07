/**
 * Enterprise TagsInput with autocomplete and validation
 */
export function TagsInput({
  label = '',
  value = [],
  required = false,
  disabled = false,
  placeholder = 'Add tags...',
  suggestions = [],
  maxTags = null,
  allowCustom = true,
  helperText = '',
  errorText = '',
  onChange = null,
  onLoadSuggestions = null
} = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'enterprise-tags-wrapper';
  wrapper.style.marginBottom = '16px';
  
  const container = document.createElement('div');
  container.className = 'enterprise-tags';
  
  // Label
  const labelEl = document.createElement('label');
  labelEl.className = 'enterprise-tags__label';
  labelEl.textContent = label + (required ? ' *' : '');
  
  // Tags container
  const tagsContainer = document.createElement('div');
  tagsContainer.className = 'enterprise-tags__container mdc-text-field mdc-text-field--filled';
  
  // Tags list
  const tagsList = document.createElement('div');
  tagsList.className = 'enterprise-tags__list';
  
  // Input
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'enterprise-tags__input';
  input.placeholder = placeholder;
  if (disabled) input.disabled = true;
  
  tagsContainer.innerHTML = '<span class="mdc-text-field__ripple"></span>';
  tagsContainer.append(tagsList, input);
  tagsContainer.innerHTML += '<span class="mdc-line-ripple"></span>';
  
  // Suggestions dropdown
  const suggestionsEl = document.createElement('div');
  suggestionsEl.className = 'enterprise-tags__suggestions';
  suggestionsEl.style.display = 'none';
  
  // Helper text
  const helper = document.createElement('div');
  helper.className = 'enterprise-tags__helper';
  helper.textContent = helperText || errorText;
  if (errorText) helper.classList.add('enterprise-tags__helper--error');
  
  container.append(labelEl, tagsContainer, suggestionsEl, helper);
  wrapper.appendChild(container);
  
  // State
  let tags = Array.isArray(value) ? [...value] : [];
  let filteredSuggestions = [];
  
  // Render tags
  function renderTags() {
    tagsList.innerHTML = '';
    tags.forEach((tag, index) => {
      const tagEl = document.createElement('div');
      tagEl.className = 'enterprise-tags__tag';
      tagEl.innerHTML = `
        <span class="enterprise-tags__tag-text">${escapeHtml(tag)}</span>
        <button type="button" class="enterprise-tags__tag-remove" data-index="${index}">
          <span class="material-icons">close</span>
        </button>
      `;
      tagsList.appendChild(tagEl);
    });
    
    if (maxTags) {
      const counter = document.createElement('div');
      counter.className = 'enterprise-tags__counter';
      counter.textContent = `${tags.length}/${maxTags}`;
      tagsList.appendChild(counter);
    }
  }
  
  // Add tag
  function addTag(tag) {
    const trimmed = tag.trim();
    if (!trimmed) return false;
    
    if (tags.includes(trimmed)) {
      showError('Tag already exists');
      return false;
    }
    
    if (maxTags && tags.length >= maxTags) {
      showError(`Maximum ${maxTags} tags allowed`);
      return false;
    }
    
    if (!allowCustom && suggestions.length > 0 && !suggestions.includes(trimmed)) {
      showError('Only predefined tags allowed');
      return false;
    }
    
    tags.push(trimmed);
    renderTags();
    input.value = '';
    hideSuggestions();
    onChange?.(tags);
    return true;
  }
  
  // Remove tag
  function removeTag(index) {
    tags.splice(index, 1);
    renderTags();
    onChange?.(tags);
  }
  
  // Show suggestions
  function showSuggestions(query) {
    if (!query) {
      filteredSuggestions = suggestions.slice(0, 10);
    } else {
      filteredSuggestions = suggestions.filter(s => 
        s.toLowerCase().includes(query.toLowerCase()) && !tags.includes(s)
      ).slice(0, 10);
    }
    
    if (filteredSuggestions.length === 0) {
      hideSuggestions();
      return;
    }
    
    suggestionsEl.innerHTML = '';
    filteredSuggestions.forEach(suggestion => {
      const item = document.createElement('div');
      item.className = 'enterprise-tags__suggestion';
      item.textContent = suggestion;
      item.addEventListener('click', () => {
        addTag(suggestion);
        input.focus();
      });
      suggestionsEl.appendChild(item);
    });
    
    suggestionsEl.style.display = 'block';
  }
  
  // Hide suggestions
  function hideSuggestions() {
    suggestionsEl.style.display = 'none';
  }
  
  // Show error
  function showError(msg) {
    helper.textContent = msg;
    helper.classList.add('enterprise-tags__helper--error');
    setTimeout(() => {
      helper.textContent = helperText;
      helper.classList.remove('enterprise-tags__helper--error');
    }, 3000);
  }
  
  // Escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Event listeners
  input.addEventListener('input', async (e) => {
    const query = e.target.value;
    
    if (onLoadSuggestions) {
      const loadedSuggestions = await onLoadSuggestions(query);
      filteredSuggestions = loadedSuggestions;
    }
    
    if (query.length > 0) {
      showSuggestions(query);
    } else {
      hideSuggestions();
    }
  });
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input.value);
    } else if (e.key === 'Backspace' && !input.value && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  });
  
  input.addEventListener('blur', () => {
    setTimeout(() => hideSuggestions(), 200);
  });
  
  tagsList.addEventListener('click', (e) => {
    const btn = e.target.closest('.enterprise-tags__tag-remove');
    if (btn) {
      const index = parseInt(btn.dataset.index);
      removeTag(index);
    }
  });
  
  // Initialize
  renderTags();
  
  return {
    element: wrapper,
    getValue: () => tags,
    setValue: (val) => {
      tags = Array.isArray(val) ? [...val] : [];
      renderTags();
    },
    addTag,
    removeTag,
    clear: () => {
      tags = [];
      renderTags();
      onChange?.(tags);
    },
    setError: (msg) => {
      helper.textContent = msg;
      helper.classList.add('enterprise-tags__helper--error');
      container.classList.add('enterprise-tags--error');
    },
    clearError: () => {
      helper.textContent = helperText;
      helper.classList.remove('enterprise-tags__helper--error');
      container.classList.remove('enterprise-tags--error');
    }
  };
}
