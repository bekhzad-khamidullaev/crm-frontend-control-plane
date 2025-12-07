import { MDCDialog } from '@material/dialog';

export function Modal({ title = 'Confirm', body = '', confirmText = 'OK', cancelText = 'Cancel', confirmClass = 'mdc-button--raised' } = {}) {
  return new Promise((resolve) => {
    const dialogEl = document.createElement('div');
    dialogEl.className = 'mdc-dialog';
    dialogEl.innerHTML = `
      <div class="mdc-dialog__container">
        <div class="mdc-dialog__surface" role="alertdialog" aria-modal="true">
          <h2 class="mdc-dialog__title">${title}</h2>
          <div class="mdc-dialog__content">${typeof body === 'string' ? body : ''}</div>
          <div class="mdc-dialog__actions">
            <button type="button" class="mdc-button mdc-dialog__button" data-mdc-dialog-action="cancel">
              <span class="mdc-button__ripple"></span>
              <span class="mdc-button__label">${cancelText}</span>
            </button>
            <button type="button" class="mdc-button ${confirmClass} mdc-dialog__button" data-mdc-dialog-action="confirm">
              <span class="mdc-button__ripple"></span>
              <span class="mdc-button__label">${confirmText}</span>
            </button>
          </div>
        </div>
      </div>
      <div class="mdc-dialog__scrim"></div>
    `;

    if (body instanceof Node) {
      const contentEl = dialogEl.querySelector('.mdc-dialog__content');
      contentEl.innerHTML = '';
      contentEl.appendChild(body);
    }

    document.body.appendChild(dialogEl);
    const dialog = new MDCDialog(dialogEl);

    dialog.listen('MDCDialog:closed', (e) => {
      resolve(e.detail.action === 'confirm');
      dialogEl.remove();
    });

    dialog.open();
  });
}