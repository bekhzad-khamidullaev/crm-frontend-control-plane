/**
 * CallWidget Component
 * Widget for making and receiving calls with SIP integration
 */

import sipClient from '../../lib/telephony/SIPClient.js';
import { createCallLog, updateCallLog } from '../../lib/api/calls.js';
import CallControls, { updateCallControlsState } from '../../components/ui-CallControls.jsx';
import CallTimer from '../../components/ui-CallTimer.jsx';
import { showToast } from '../../components/ui-Toast.jsx';

/**
 * Create call widget
 * @param {Object} options
 * @param {boolean} [options.global] - Show as global floating widget
 * @returns {HTMLElement}
 */
export function CallWidget({ global = false } = {}) {
  const container = document.createElement('div');
  container.className = `call-widget ${global ? 'call-widget-global' : ''}`;

  // Widget state
  let currentCall = null;
  let callTimer = null;
  let callState = {
    isMuted: false,
    isOnHold: false,
    status: 'idle', // idle, connecting, connected, ringing
  };

  // Header
  const header = document.createElement('div');
  header.className = 'call-widget__header';
  header.innerHTML = `
    <div class="call-widget__title">
      <i class="material-icons">phone</i>
      <span>Phone</span>
    </div>
    <div class="call-widget__status">
      <span class="call-widget__status-dot"></span>
      <span class="call-widget__status-text">Not Connected</span>
    </div>
  `;

  // Body
  const body = document.createElement('div');
  body.className = 'call-widget__body';

  // Dialer view
  const dialerView = createDialerView();
  
  // Active call view
  const activeCallView = document.createElement('div');
  activeCallView.className = 'call-widget__active-call';
  activeCallView.style.display = 'none';

  body.appendChild(dialerView);
  body.appendChild(activeCallView);

  container.appendChild(header);
  container.appendChild(body);

  // Initialize SIP client
  initializeSIP();

  // Setup SIP event listeners
  setupSIPListeners();

  // Initialize SIP client
  async function initializeSIP() {
    try {
      updateStatus('Connecting...', 'connecting');
      await sipClient.init();
      await sipClient.register();
      updateStatus('Connected', 'connected');
      showToast('Phone connected', 'success');
    } catch (error) {
      console.error('SIP initialization error:', error);
      updateStatus('Connection failed', 'error');
      showToast('Failed to connect phone', 'error');
    }
  }

  // Setup SIP event listeners
  function setupSIPListeners() {
    sipClient.on('registered', () => {
      updateStatus('Connected', 'connected');
    });

    sipClient.on('unregistered', () => {
      updateStatus('Disconnected', 'disconnected');
    });

    sipClient.on('incomingCall', (data) => {
      handleIncomingCall(data);
    });

    sipClient.on('callStateChange', (state) => {
      handleCallStateChange(state);
    });

    sipClient.on('error', (error) => {
      console.error('SIP error:', error);
      showToast('Phone error: ' + error.type, 'error');
    });
  }

  // Create dialer view
  function createDialerView() {
    const dialer = document.createElement('div');
    dialer.className = 'call-widget__dialer';

    const input = document.createElement('input');
    input.type = 'tel';
    input.className = 'call-widget__dialer-input';
    input.placeholder = 'Enter phone number';
    input.id = 'dialerInput';

    const keypad = document.createElement('div');
    keypad.className = 'call-widget__keypad';

    const digits = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['*', '0', '#'],
    ];

    digits.forEach(row => {
      row.forEach(digit => {
        const btn = document.createElement('button');
        btn.className = 'call-widget__keypad-btn';
        btn.textContent = digit;
        btn.onclick = () => {
          input.value += digit;
        };
        keypad.appendChild(btn);
      });
    });

    const callBtn = document.createElement('button');
    callBtn.className = 'call-widget__call-btn mdc-button mdc-button--raised';
    callBtn.innerHTML = '<i class="material-icons">call</i> Call';
    callBtn.onclick = () => {
      const number = input.value.trim();
      if (number) {
        makeCall(number);
      }
    };

    dialer.appendChild(input);
    dialer.appendChild(keypad);
    dialer.appendChild(callBtn);

    return dialer;
  }

  // Make outgoing call
  async function makeCall(number) {
    try {
      updateStatus('Calling...', 'connecting');
      
      // Create audio element
      const audioElement = document.createElement('audio');
      audioElement.autoplay = true;
      audioElement.id = 'remoteAudio';
      document.body.appendChild(audioElement);

      // Initiate call
      await sipClient.call(number, audioElement);

      // Create call log
      currentCall = await createCallLog({
        phone_number: number,
        direction: 'outbound',
        status: 'connecting',
        started_at: new Date().toISOString(),
      });

      // Show active call view
      showActiveCallView(number, 'outbound');

    } catch (error) {
      console.error('Error making call:', error);
      showToast('Failed to make call', 'error');
      updateStatus('Connected', 'connected');
    }
  }

  // Handle incoming call
  function handleIncomingCall(data) {
    const { from, displayName } = data;
    
    // Show incoming call modal
    showIncomingCallModal(from, displayName, async (accept) => {
      if (accept) {
        const audioElement = document.createElement('audio');
        audioElement.autoplay = true;
        audioElement.id = 'remoteAudio';
        document.body.appendChild(audioElement);

        sipClient.answerCall(audioElement);

        // Create call log
        currentCall = await createCallLog({
          phone_number: from,
          direction: 'inbound',
          status: 'connected',
          started_at: new Date().toISOString(),
        });

        showActiveCallView(from, 'inbound');
      } else {
        sipClient.rejectCall();
      }
    });
  }

  // Handle call state changes
  function handleCallStateChange(state) {
    console.log('Call state changed:', state);

    switch (state.status) {
      case 'connecting':
        updateStatus('Connecting...', 'connecting');
        break;

      case 'connected':
        updateStatus('Call active', 'active');
        
        // Start timer
        if (!callTimer) {
          callTimer = CallTimer();
          const timerContainer = activeCallView.querySelector('.call-widget__timer-container');
          if (timerContainer) {
            timerContainer.appendChild(callTimer.element);
          }
        }

        // Update call log
        if (currentCall) {
          updateCallLog(currentCall.id, {
            status: 'completed',
          });
        }
        break;

      case 'terminated':
        updateStatus('Call ended', 'idle');
        
        // Stop timer and get duration
        let duration = 0;
        if (callTimer) {
          duration = callTimer.getElapsed();
          callTimer.stop();
          callTimer = null;
        }

        // Update call log
        if (currentCall) {
          updateCallLog(currentCall.id, {
            status: 'completed',
            ended_at: new Date().toISOString(),
            duration: duration,
          });
        }

        // Clean up
        const audioElement = document.getElementById('remoteAudio');
        if (audioElement) {
          audioElement.remove();
        }

        // Show dialer again
        setTimeout(() => {
          activeCallView.style.display = 'none';
          dialerView.style.display = 'block';
          updateStatus('Connected', 'connected');
          currentCall = null;
        }, 2000);
        break;

      case 'held':
        callState.isOnHold = true;
        updateCallControlsState(activeCallView, callState);
        break;

      case 'resumed':
        callState.isOnHold = false;
        updateCallControlsState(activeCallView, callState);
        break;
    }
  }

  // Show active call view
  function showActiveCallView(number, direction) {
    dialerView.style.display = 'none';
    activeCallView.style.display = 'block';
    activeCallView.innerHTML = '';

    const callInfo = document.createElement('div');
    callInfo.className = 'call-widget__call-info';
    callInfo.innerHTML = `
      <i class="material-icons call-widget__call-icon">${direction === 'inbound' ? 'call_received' : 'call_made'}</i>
      <div class="call-widget__call-number">${number}</div>
      <div class="call-widget__call-status">Connecting...</div>
      <div class="call-widget__timer-container"></div>
    `;

    const controls = CallControls({
      onMute: () => {
        callState.isMuted = sipClient.toggleMute();
        updateCallControlsState(activeCallView, callState);
      },
      onHold: () => {
        callState.isOnHold = sipClient.toggleHold();
        updateCallControlsState(activeCallView, callState);
      },
      onTransfer: (destination) => {
        sipClient.transferCall(destination);
        showToast(`Transferring to ${destination}`, 'info');
      },
      onHangup: () => {
        sipClient.hangup();
      },
      onDTMF: (digit) => {
        sipClient.sendDTMF(digit);
      },
      state: callState,
    });

    activeCallView.appendChild(callInfo);
    activeCallView.appendChild(controls);
  }

  // Update status display
  function updateStatus(text, state) {
    const statusText = header.querySelector('.call-widget__status-text');
    const statusDot = header.querySelector('.call-widget__status-dot');
    
    statusText.textContent = text;
    statusDot.className = `call-widget__status-dot call-widget__status-dot--${state}`;
  }

  return container;
}

/**
 * Show incoming call modal
 */
function showIncomingCallModal(from, displayName, callback) {
  const modal = document.createElement('div');
  modal.className = 'incoming-call-modal';
  modal.innerHTML = `
    <div class="incoming-call-modal__content">
      <div class="incoming-call-modal__icon">
        <i class="material-icons">phone_in_talk</i>
      </div>
      <h3 class="incoming-call-modal__title">Incoming Call</h3>
      <div class="incoming-call-modal__number">${displayName || from}</div>
      <div class="incoming-call-modal__actions">
        <button class="incoming-call-modal__btn incoming-call-modal__btn--reject" id="rejectCall">
          <i class="material-icons">call_end</i>
          <span>Decline</span>
        </button>
        <button class="incoming-call-modal__btn incoming-call-modal__btn--accept" id="acceptCall">
          <i class="material-icons">call</i>
          <span>Accept</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const acceptBtn = modal.querySelector('#acceptCall');
  const rejectBtn = modal.querySelector('#rejectCall');

  acceptBtn.onclick = () => {
    modal.remove();
    callback(true);
  };

  rejectBtn.onclick = () => {
    modal.remove();
    callback(false);
  };
}

export default CallWidget;
