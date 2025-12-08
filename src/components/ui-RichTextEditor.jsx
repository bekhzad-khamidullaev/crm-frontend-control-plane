/**
 * Enterprise RichTextEditor with toolbar and preview
 */
export function RichTextEditor({
  label = '',
  value = '',
  required = false,
  disabled = false,
  minHeight = 200,
  maxHeight = 500,
  helperText = '',
  errorText = '',
  placeholder = 'Enter text...',
  showToolbar = true,
  onChange = null
} = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'enterprise-editor-wrapper';
  wrapper.style.marginBottom = '16px';
  
  const container = document.createElement('div');
  container.className = 'enterprise-editor';
  
  // Label
  const labelEl = document.createElement('label');
  labelEl.className = 'enterprise-editor__label';
  labelEl.textContent = label + (required ? ' *' : '');
  
  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'enterprise-editor__toolbar';
  if (!showToolbar) toolbar.style.display = 'none';
  
  toolbar.innerHTML = `
    <button type="button" class="enterprise-editor__tool" data-command="bold" title="Bold">
      <span class="material-icons">format_bold</span>
    </button>
    <button type="button" class="enterprise-editor__tool" data-command="italic" title="Italic">
      <span class="material-icons">format_italic</span>
    </button>
    <button type="button" class="enterprise-editor__tool" data-command="underline" title="Underline">
      <span class="material-icons">format_underlined</span>
    </button>
    <span class="enterprise-editor__divider"></span>
    <button type="button" class="enterprise-editor__tool" data-command="insertUnorderedList" title="Bullet List">
      <span class="material-icons">format_list_bulleted</span>
    </button>
    <button type="button" class="enterprise-editor__tool" data-command="insertOrderedList" title="Numbered List">
      <span class="material-icons">format_list_numbered</span>
    </button>
    <span class="enterprise-editor__divider"></span>
    <button type="button" class="enterprise-editor__tool" data-command="createLink" title="Insert Link">
      <span class="material-icons">link</span>
    </button>
    <button type="button" class="enterprise-editor__tool" data-command="removeFormat" title="Clear Formatting">
      <span class="material-icons">format_clear</span>
    </button>
  `;
  
  // Editor area
  const editorArea = document.createElement('div');
  editorArea.className = 'enterprise-editor__area';
  editorArea.contentEditable = !disabled;
  editorArea.innerHTML = value || '';
  editorArea.style.minHeight = minHeight + 'px';
  editorArea.style.maxHeight = maxHeight + 'px';
  
  if (!value) {
    editorArea.dataset.placeholder = placeholder;
  }
  
  if (disabled) {
    editorArea.classList.add('enterprise-editor__area--disabled');
  }
  
  // Character count
  const counter = document.createElement('div');
  counter.className = 'enterprise-editor__counter';
  counter.textContent = '0 characters';
  
  // Helper text
  const helper = document.createElement('div');
  helper.className = 'enterprise-editor__helper';
  helper.textContent = helperText || errorText;
  if (errorText) helper.classList.add('enterprise-editor__helper--error');
  
  container.append(labelEl, toolbar, editorArea, counter, helper);
  wrapper.appendChild(container);
  
  // Update counter
  function updateCounter() {
    const text = editorArea.innerText || '';
    const chars = text.length;
    counter.textContent = `${chars} character${chars !== 1 ? 's' : ''}`;
  }
  
  // Execute command
  function execCommand(command, value = null) {
    editorArea.focus();
    
    if (command === 'createLink') {
      const url = prompt('Enter URL:');
      if (url) {
        document.execCommand(command, false, url);
      }
    } else {
      document.execCommand(command, false, value);
    }
    
    editorArea.focus();
  }
  
  // Toolbar event listeners
  toolbar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-command]');
    if (!btn) return;
    
    e.preventDefault();
    execCommand(btn.dataset.command);
  });
  
  // Editor event listeners
  editorArea.addEventListener('input', () => {
    updateCounter();
    
    if (editorArea.innerHTML.trim() === '') {
      editorArea.dataset.placeholder = placeholder;
    } else {
      delete editorArea.dataset.placeholder;
    }
    
    onChange?.(editorArea.innerHTML);
  });
  
  editorArea.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  });
  
  // Initialize
  updateCounter();
  
  return {
    element: wrapper,
    getValue: () => editorArea.innerHTML,
    getPlainText: () => editorArea.innerText,
    setValue: (val) => {
      editorArea.innerHTML = val || '';
      updateCounter();
      if (!val) {
        editorArea.dataset.placeholder = placeholder;
      } else {
        delete editorArea.dataset.placeholder;
      }
    },
    clear: () => {
      editorArea.innerHTML = '';
      editorArea.dataset.placeholder = placeholder;
      updateCounter();
      onChange?.('');
    },
    setError: (msg) => {
      helper.textContent = msg;
      helper.classList.add('enterprise-editor__helper--error');
      container.classList.add('enterprise-editor--error');
    },
    clearError: () => {
      helper.textContent = helperText;
      helper.classList.remove('enterprise-editor__helper--error');
      container.classList.remove('enterprise-editor--error');
    },
    focus: () => editorArea.focus()
  };
}
