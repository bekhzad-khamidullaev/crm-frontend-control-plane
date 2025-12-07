import { MDCSnackbar } from '@material/snackbar';

export function showToast({ message, type = 'info', timeout = 4000 } = {}) {
  const snackbarEl = document.createElement('div');
  snackbarEl.className = 'mdc-snackbar';
  if (type === 'error') snackbarEl.classList.add('mdc-snackbar--error');
  if (type === 'success') snackbarEl.classList.add('mdc-snackbar--success');
  
  snackbarEl.innerHTML = `
    <div class="mdc-snackbar__surface" role="status" aria-relevant="additions">
      <div class="mdc-snackbar__label" aria-atomic="false">${message || ''}</div>
    </div>
  `;

  document.body.appendChild(snackbarEl);
  const snackbar = new MDCSnackbar(snackbarEl);
  // Material Snackbar requires timeout between 4000-10000ms or -1 (no auto-dismiss)
  snackbar.timeoutMs = Math.max(4000, Math.min(10000, timeout));
  snackbar.open();

  snackbar.listen('MDCSnackbar:closed', () => {
    snackbarEl.remove();
  });

  return () => { snackbar.close(); };
}

export const Toast = {
  info: (msg, timeout) => showToast({ message: msg, type: 'info', timeout }),
  success: (msg, timeout) => showToast({ message: msg, type: 'success', timeout }),
  error: (msg, timeout) => showToast({ message: msg, type: 'error', timeout }),
};
