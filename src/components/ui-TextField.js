import { MDCTextField } from '@material/textfield';

export function TextField({ 
  label = '', 
  value = '', 
  type = 'text', 
  required = false,
  multiline = false,
  rows = 3,
  helperText = '',
  errorText = '',
  placeholder = ''
} = {}) {
  const wrapper = document.createElement('div');
  wrapper.style.marginBottom = '16px';
  
  const field = document.createElement('label');
  field.className = multiline ? 'mdc-text-field mdc-text-field--filled mdc-text-field--textarea' : 'mdc-text-field mdc-text-field--filled';
  field.style.width = '100%';
  
  if (multiline) {
    field.innerHTML = `
      <span class="mdc-text-field__ripple"></span>
      <span class="mdc-floating-label">${label}</span>
      <textarea class="mdc-text-field__input" rows="${rows}" ${required ? 'required' : ''}></textarea>
      <span class="mdc-line-ripple"></span>
    `;
  } else {
    field.innerHTML = `
      <span class="mdc-text-field__ripple"></span>
      <span class="mdc-floating-label">${label}</span>
      <input class="mdc-text-field__input" type="${type}" ${required ? 'required' : ''}>
      <span class="mdc-line-ripple"></span>
    `;
  }
  
  const input = field.querySelector(multiline ? 'textarea' : 'input');
  if (value) input.value = value;
  if (placeholder) input.placeholder = placeholder;
  
  const helper = document.createElement('div');
  helper.className = 'mdc-text-field-helper-line';
  helper.innerHTML = `
    <div class="mdc-text-field-helper-text ${errorText ? 'mdc-text-field-helper-text--validation-msg' : ''}" aria-hidden="true">
      ${errorText || helperText}
    </div>
  `;
  
  wrapper.append(field, helper);
  
  const mdcField = new MDCTextField(field);
  
  return {
    element: wrapper,
    input,
    mdcField,
    getValue: () => input.value,
    setValue: (val) => { input.value = val; mdcField.value = val; },
    setError: (msg) => {
      const helperTextEl = helper.querySelector('.mdc-text-field-helper-text');
      helperTextEl.textContent = msg;
      if (msg) {
        field.classList.add('mdc-text-field--invalid');
        helperTextEl.classList.add('mdc-text-field-helper-text--validation-msg');
      } else {
        field.classList.remove('mdc-text-field--invalid');
        helperTextEl.classList.remove('mdc-text-field-helper-text--validation-msg');
      }
    },
    clearError: () => {
      field.classList.remove('mdc-text-field--invalid');
      const helperTextEl = helper.querySelector('.mdc-text-field-helper-text');
      helperTextEl.textContent = helperText;
      helperTextEl.classList.remove('mdc-text-field-helper-text--validation-msg');
    }
  };
}
