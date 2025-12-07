import { MDCSelect } from '@material/select';
import { MDCMenu } from '@material/menu';

/**
 * Enterprise-grade Select component with search, async loading, grouping, multi-select
 */
export function Select({ 
  label = '', 
  value = '', 
  options = [],
  required = false,
  disabled = false,
  multiple = false,
  searchable = true,
  async = false,
  loadOptions = null,
  placeholder = 'Select...',
  helperText = '',
  errorText = '',
  groups = null,
  onChange = null,
  onSearch = null
} = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'enterprise-select-wrapper';
  wrapper.style.marginBottom = '16px';
  wrapper.style.position = 'relative';
  
  // Main select container
  const container = document.createElement('div');
  container.className = 'enterprise-select';
  
  // Label
  const labelEl = document.createElement('label');
  labelEl.className = 'enterprise-select__label';
  labelEl.textContent = label + (required ? ' *' : '');
  
  // Selected value display
  const display = document.createElement('div');
  display.className = 'enterprise-select__display mdc-text-field mdc-text-field--filled';
  display.tabIndex = 0;
  display.innerHTML = `
    <span class="mdc-text-field__ripple"></span>
    <span class="enterprise-select__value">${placeholder}</span>
    <span class="material-icons enterprise-select__arrow">arrow_drop_down</span>
    <span class="mdc-line-ripple"></span>
  `;
  
  if (disabled) display.classList.add('enterprise-select__display--disabled');
  
  // Dropdown menu
  const dropdown = document.createElement('div');
  dropdown.className = 'enterprise-select__dropdown';
  dropdown.style.display = 'none';
  
  // Search input (if searchable)
  let searchInput;
  if (searchable) {
    const searchWrapper = document.createElement('div');
    searchWrapper.className = 'enterprise-select__search';
    searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'enterprise-select__search-input';
    searchInput.placeholder = 'Search...';
    searchWrapper.innerHTML = '<span class="material-icons">search</span>';
    searchWrapper.appendChild(searchInput);
    dropdown.appendChild(searchWrapper);
  }
  
  // Options list
  const optionsList = document.createElement('div');
  optionsList.className = 'enterprise-select__options';
  dropdown.appendChild(optionsList);
  
  // Helper text
  const helper = document.createElement('div');
  helper.className = 'enterprise-select__helper';
  helper.textContent = helperText || errorText;
  if (errorText) helper.classList.add('enterprise-select__helper--error');
  
  container.append(labelEl, display, dropdown, helper);
  wrapper.appendChild(container);
  
  // State
  let selectedValues = multiple ? [] : null;
  let allOptions = options;
  let isOpen = false;
  let loading = false;
  
  // Render options
  function renderOptions(opts = allOptions, filter = '') {
    optionsList.innerHTML = '';
    
    if (loading) {
      optionsList.innerHTML = '<div class="enterprise-select__loading"><div class="spinner"></div> Loading...</div>';
      return;
    }
    
    if (!opts || opts.length === 0) {
      optionsList.innerHTML = '<div class="enterprise-select__empty">No options available</div>';
      return;
    }
    
    const filtered = filter 
      ? opts.filter(opt => opt.label?.toLowerCase().includes(filter.toLowerCase()))
      : opts;
    
    if (filtered.length === 0) {
      optionsList.innerHTML = '<div class="enterprise-select__empty">No results found</div>';
      return;
    }
    
    // Group options if groups provided
    if (groups) {
      Object.entries(groups).forEach(([groupName, groupOpts]) => {
        const groupEl = document.createElement('div');
        groupEl.className = 'enterprise-select__group';
        
        const groupLabel = document.createElement('div');
        groupLabel.className = 'enterprise-select__group-label';
        groupLabel.textContent = groupName;
        groupEl.appendChild(groupLabel);
        
        groupOpts.forEach(opt => {
          if (!filter || opt.label.toLowerCase().includes(filter.toLowerCase())) {
            groupEl.appendChild(createOption(opt));
          }
        });
        
        if (groupEl.children.length > 1) optionsList.appendChild(groupEl);
      });
    } else {
      filtered.forEach(opt => {
        optionsList.appendChild(createOption(opt));
      });
    }
  }
  
  // Create single option element
  function createOption(opt) {
    const option = document.createElement('div');
    option.className = 'enterprise-select__option';
    option.dataset.value = opt.value;
    
    if (multiple) {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = selectedValues.includes(opt.value);
      checkbox.addEventListener('change', (e) => e.stopPropagation());
      option.appendChild(checkbox);
    }
    
    const label = document.createElement('span');
    label.textContent = opt.label;
    option.appendChild(label);
    
    if (opt.icon) {
      const icon = document.createElement('span');
      icon.className = 'material-icons enterprise-select__option-icon';
      icon.textContent = opt.icon;
      option.insertBefore(icon, label);
    }
    
    const isSelected = multiple 
      ? selectedValues.includes(opt.value)
      : selectedValues === opt.value;
    
    if (isSelected) option.classList.add('enterprise-select__option--selected');
    
    option.addEventListener('click', () => handleOptionClick(opt));
    
    return option;
  }
  
  // Handle option selection
  function handleOptionClick(opt) {
    if (multiple) {
      const index = selectedValues.indexOf(opt.value);
      if (index > -1) {
        selectedValues.splice(index, 1);
      } else {
        selectedValues.push(opt.value);
      }
      updateDisplay();
      renderOptions();
      onChange?.(selectedValues);
    } else {
      selectedValues = opt.value;
      updateDisplay();
      closeDropdown();
      onChange?.(opt.value);
    }
  }
  
  // Update display value
  function updateDisplay() {
    const valueEl = display.querySelector('.enterprise-select__value');
    
    if (multiple) {
      if (selectedValues.length === 0) {
        valueEl.textContent = placeholder;
        valueEl.classList.remove('enterprise-select__value--selected');
      } else {
        const labels = selectedValues.map(val => {
          const opt = allOptions.find(o => o.value === val);
          return opt ? opt.label : val;
        });
        valueEl.textContent = labels.join(', ');
        valueEl.classList.add('enterprise-select__value--selected');
      }
    } else {
      if (selectedValues === null) {
        valueEl.textContent = placeholder;
        valueEl.classList.remove('enterprise-select__value--selected');
      } else {
        const opt = allOptions.find(o => o.value === selectedValues);
        valueEl.textContent = opt ? opt.label : selectedValues;
        valueEl.classList.add('enterprise-select__value--selected');
      }
    }
  }
  
  // Open dropdown
  function openDropdown() {
    if (disabled) return;
    isOpen = true;
    dropdown.style.display = 'block';
    display.classList.add('enterprise-select__display--open');
    
    if (async && loadOptions && allOptions.length === 0) {
      loadAsyncOptions();
    } else {
      renderOptions();
    }
    
    if (searchable && searchInput) {
      searchInput.focus();
    }
  }
  
  // Close dropdown
  function closeDropdown() {
    isOpen = false;
    dropdown.style.display = 'none';
    display.classList.remove('enterprise-select__display--open');
    if (searchInput) searchInput.value = '';
  }
  
  // Load async options
  async function loadAsyncOptions(query = '') {
    if (!loadOptions) return;
    
    loading = true;
    renderOptions();
    
    try {
      const opts = await loadOptions(query);
      allOptions = opts;
      loading = false;
      renderOptions(opts);
    } catch (err) {
      loading = false;
      optionsList.innerHTML = `<div class="enterprise-select__error">Failed to load options</div>`;
    }
  }
  
  // Event listeners
  display.addEventListener('click', () => {
    if (isOpen) closeDropdown();
    else openDropdown();
  });
  
  display.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isOpen) closeDropdown();
      else openDropdown();
    } else if (e.key === 'Escape') {
      closeDropdown();
    }
  });
  
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      if (async && onSearch) {
        onSearch(query);
        loadAsyncOptions(query);
      } else {
        renderOptions(allOptions, query);
      }
    });
  }
  
  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target) && isOpen) {
      closeDropdown();
    }
  });
  
  // Initialize
  if (value) {
    selectedValues = multiple ? (Array.isArray(value) ? value : [value]) : value;
    updateDisplay();
  }
  
  renderOptions();
  
  // Public API
  return {
    element: wrapper,
    getValue: () => selectedValues,
    setValue: (val) => {
      selectedValues = multiple ? (Array.isArray(val) ? val : [val]) : val;
      updateDisplay();
      renderOptions();
    },
    setOptions: (opts) => {
      allOptions = opts;
      renderOptions();
    },
    setError: (msg) => {
      helper.textContent = msg;
      helper.classList.add('enterprise-select__helper--error');
      container.classList.add('enterprise-select--error');
    },
    clearError: () => {
      helper.textContent = helperText;
      helper.classList.remove('enterprise-select__helper--error');
      container.classList.remove('enterprise-select--error');
    },
    setDisabled: (val) => {
      disabled = val;
      if (val) {
        display.classList.add('enterprise-select__display--disabled');
      } else {
        display.classList.remove('enterprise-select__display--disabled');
      }
    },
    refresh: () => {
      if (async) loadAsyncOptions();
      else renderOptions();
    }
  };
}
