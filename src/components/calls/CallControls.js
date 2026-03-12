/**
 * CallControls Component
 * Controls for managing active call (mute, hold, transfer, hangup, DTMF)
 */

/**
 * Create call controls component
 * @param {Object} options - Configuration options
 * @param {Function} options.onMute - Callback when mute is toggled
 * @param {Function} options.onHold - Callback when hold is toggled
 * @param {Function} options.onTransfer - Callback when transfer is initiated
 * @param {Function} options.onHangup - Callback when hangup is clicked
 * @param {Function} options.onDTMF - Callback when DTMF digit is pressed
 * @param {Object} [options.state] - Current call state
 * @returns {HTMLElement}
 */
export function CallControls({ onMute, onHold, onTransfer, onHangup, onDTMF, state = {} } = {}) {
  const container = document.createElement('div');
  container.className = 'call-controls';

  const mainControls = document.createElement('div');
  mainControls.className = 'call-controls__main';

  // Mute button
  const muteBtn = createControlButton({
    icon: state.isMuted ? 'mic_off' : 'mic',
    label: state.isMuted ? 'Unmute' : 'Mute',
    active: state.isMuted,
    onClick: onMute,
    className: 'call-controls__btn--mute',
  });

  // Hold button
  const holdBtn = createControlButton({
    icon: state.isOnHold ? 'play_arrow' : 'pause',
    label: state.isOnHold ? 'Resume' : 'Hold',
    active: state.isOnHold,
    onClick: onHold,
    className: 'call-controls__btn--hold',
  });

  // DTMF keypad button
  const dtmfBtn = createControlButton({
    icon: 'dialpad',
    label: 'Keypad',
    onClick: () => toggleDTMFPad(container),
    className: 'call-controls__btn--dtmf',
  });

  // Transfer button
  const transferBtn = createControlButton({
    icon: 'phone_forwarded',
    label: 'Transfer',
    onClick: () => showTransferDialog(onTransfer),
    className: 'call-controls__btn--transfer',
  });

  // Hangup button
  const hangupBtn = createControlButton({
    icon: 'call_end',
    label: 'Hang up',
    onClick: onHangup,
    className: 'call-controls__btn--hangup',
    danger: true,
  });

  mainControls.appendChild(muteBtn);
  mainControls.appendChild(holdBtn);
  mainControls.appendChild(dtmfBtn);
  mainControls.appendChild(transferBtn);
  mainControls.appendChild(hangupBtn);

  container.appendChild(mainControls);

  // DTMF Keypad (hidden by default)
  const dtmfPad = createDTMFPad(onDTMF);
  dtmfPad.style.display = 'none';
  container.appendChild(dtmfPad);

  return container;
}

/**
 * Create a control button
 */
function createControlButton({ icon, label, active, onClick, className, danger } = {}) {
  const button = document.createElement('button');
  button.className = `call-controls__btn ${className || ''}`;
  if (active) button.classList.add('call-controls__btn--active');
  if (danger) button.classList.add('call-controls__btn--danger');
  button.type = 'button';
  button.title = label;

  const iconEl = document.createElement('i');
  iconEl.className = 'material-icons';
  iconEl.textContent = icon;

  const labelEl = document.createElement('span');
  labelEl.className = 'call-controls__btn-label';
  labelEl.textContent = label;

  button.appendChild(iconEl);
  button.appendChild(labelEl);

  if (onClick) {
    button.onclick = onClick;
  }

  return button;
}

/**
 * Create DTMF keypad
 */
function createDTMFPad(onDTMF) {
  const pad = document.createElement('div');
  pad.className = 'call-controls__dtmf-pad';

  const digits = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#'],
  ];

  const grid = document.createElement('div');
  grid.className = 'call-controls__dtmf-grid';

  digits.forEach(row => {
    row.forEach(digit => {
      const btn = document.createElement('button');
      btn.className = 'call-controls__dtmf-btn';
      btn.type = 'button';
      btn.textContent = digit;
      btn.onclick = () => {
        if (onDTMF) onDTMF(digit);
        // Visual feedback
        btn.classList.add('call-controls__dtmf-btn--pressed');
        setTimeout(() => btn.classList.remove('call-controls__dtmf-btn--pressed'), 100);
      };
      grid.appendChild(btn);
    });
  });

  pad.appendChild(grid);

  return pad;
}

/**
 * Toggle DTMF pad visibility
 */
function toggleDTMFPad(container) {
  const pad = container.querySelector('.call-controls__dtmf-pad');
  if (pad) {
    pad.style.display = pad.style.display === 'none' ? 'block' : 'none';
  }
}

/**
 * Show transfer dialog
 */
function showTransferDialog(onTransfer) {
  const dialog = document.createElement('div');
  dialog.className = 'call-controls__transfer-dialog';
  dialog.innerHTML = `
    <div class="call-controls__transfer-content">
      <h3>Transfer Call</h3>
      <input type="text" class="call-controls__transfer-input" placeholder="Enter phone number or extension" />
      <div class="call-controls__transfer-actions">
        <button class="mdc-button" id="cancelTransfer">Cancel</button>
        <button class="mdc-button mdc-button--raised" id="confirmTransfer">Transfer</button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  const input = dialog.querySelector('.call-controls__transfer-input');
  const cancelBtn = dialog.querySelector('#cancelTransfer');
  const confirmBtn = dialog.querySelector('#confirmTransfer');

  input.focus();

  cancelBtn.onclick = () => dialog.remove();
  
  confirmBtn.onclick = () => {
    const destination = input.value.trim();
    if (destination && onTransfer) {
      onTransfer(destination);
    }
    dialog.remove();
  };

  input.onkeypress = (e) => {
    if (e.key === 'Enter') {
      confirmBtn.click();
    }
  };
}

/**
 * Update call controls state
 */
export function updateCallControlsState(container, state) {
  const muteBtn = container.querySelector('.call-controls__btn--mute');
  const holdBtn = container.querySelector('.call-controls__btn--hold');

  if (muteBtn) {
    const icon = muteBtn.querySelector('.material-icons');
    const label = muteBtn.querySelector('.call-controls__btn-label');
    
    if (state.isMuted) {
      icon.textContent = 'mic_off';
      label.textContent = 'Unmute';
      muteBtn.classList.add('call-controls__btn--active');
    } else {
      icon.textContent = 'mic';
      label.textContent = 'Mute';
      muteBtn.classList.remove('call-controls__btn--active');
    }
  }

  if (holdBtn) {
    const icon = holdBtn.querySelector('.material-icons');
    const label = holdBtn.querySelector('.call-controls__btn-label');
    
    if (state.isOnHold) {
      icon.textContent = 'play_arrow';
      label.textContent = 'Resume';
      holdBtn.classList.add('call-controls__btn--active');
    } else {
      icon.textContent = 'pause';
      label.textContent = 'Hold';
      holdBtn.classList.remove('call-controls__btn--active');
    }
  }
}

export default CallControls;
