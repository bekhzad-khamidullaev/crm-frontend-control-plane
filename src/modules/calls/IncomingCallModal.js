/**
 * IncomingCallModal Component
 * Modal for handling incoming calls
 */

/**
 * Create incoming call modal
 * @param {Object} callData
 * @param {string} callData.from - Caller phone number
 * @param {string} [callData.displayName] - Caller display name
 * @param {Function} onAccept - Callback when call is accepted
 * @param {Function} onReject - Callback when call is rejected
 * @returns {HTMLElement}
 */
export function IncomingCallModal({ from, displayName }, onAccept, onReject) {
  const modal = document.createElement('div');
  modal.className = 'incoming-call-modal';

  const overlay = document.createElement('div');
  overlay.className = 'incoming-call-modal__overlay';

  const content = document.createElement('div');
  content.className = 'incoming-call-modal__content';

  // Animation ring
  const ring = document.createElement('div');
  ring.className = 'incoming-call-modal__ring';

  // Icon
  const icon = document.createElement('div');
  icon.className = 'incoming-call-modal__icon';
  icon.innerHTML = '<i class="material-icons">phone_in_talk</i>';

  // Title
  const title = document.createElement('h3');
  title.className = 'incoming-call-modal__title';
  title.textContent = 'Incoming Call';

  // Caller info
  const callerInfo = document.createElement('div');
  callerInfo.className = 'incoming-call-modal__caller';

  if (displayName) {
    const name = document.createElement('div');
    name.className = 'incoming-call-modal__name';
    name.textContent = displayName;
    callerInfo.appendChild(name);
  }

  const number = document.createElement('div');
  number.className = 'incoming-call-modal__number';
  number.textContent = from;
  callerInfo.appendChild(number);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'incoming-call-modal__actions';

  const rejectBtn = document.createElement('button');
  rejectBtn.className = 'incoming-call-modal__btn incoming-call-modal__btn--reject';
  rejectBtn.innerHTML = `
    <i class="material-icons">call_end</i>
    <span>Decline</span>
  `;
  rejectBtn.onclick = () => {
    modal.remove();
    if (onReject) onReject();
  };

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'incoming-call-modal__btn incoming-call-modal__btn--accept';
  acceptBtn.innerHTML = `
    <i class="material-icons">call</i>
    <span>Accept</span>
  `;
  acceptBtn.onclick = () => {
    modal.remove();
    if (onAccept) onAccept();
  };

  actions.appendChild(rejectBtn);
  actions.appendChild(acceptBtn);

  // Assembly
  content.appendChild(ring);
  content.appendChild(icon);
  content.appendChild(title);
  content.appendChild(callerInfo);
  content.appendChild(actions);

  modal.appendChild(overlay);
  modal.appendChild(content);

  // Add to body
  document.body.appendChild(modal);

  // Animate in
  requestAnimationFrame(() => {
    modal.classList.add('incoming-call-modal--visible');
  });

  return modal;
}

export default IncomingCallModal;
