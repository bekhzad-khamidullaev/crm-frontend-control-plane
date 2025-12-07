import { MDCRipple } from '@material/ripple';

export function FAB({ icon = 'add', label = '', onClick, extended = false } = {}) {
  const fab = document.createElement('button');
  fab.className = extended ? 'mdc-fab mdc-fab--extended' : 'mdc-fab';
  
  if (extended) {
    fab.innerHTML = `
      <div class="mdc-fab__ripple"></div>
      <span class="material-icons mdc-fab__icon">${icon}</span>
      <span class="mdc-fab__label">${label}</span>
    `;
  } else {
    fab.innerHTML = `
      <div class="mdc-fab__ripple"></div>
      <span class="material-icons mdc-fab__icon">${icon}</span>
    `;
    if (label) fab.setAttribute('aria-label', label);
  }
  
  MDCRipple.attachTo(fab);
  
  if (onClick) fab.addEventListener('click', onClick);
  
  return fab;
}
