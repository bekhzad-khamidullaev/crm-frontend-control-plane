/**
 * ChatInput Component
 * Input field for sending chat messages with emoji support
 */

/**
 * Create chat input component
 * @param {Object} options - Configuration options
 * @param {Function} options.onSend - Callback when message is sent
 * @param {Function} [options.onTyping] - Callback when user is typing
 * @param {Object} [options.replyingTo] - Message being replied to
 * @param {Function} [options.onCancelReply] - Callback to cancel reply
 * @returns {HTMLElement}
 */
export function ChatInput({ onSend, onTyping, replyingTo, onCancelReply } = {}) {
  const container = document.createElement('div');
  container.className = 'chat-input';

  // Reply indicator
  if (replyingTo) {
    const replyIndicator = document.createElement('div');
    replyIndicator.className = 'chat-input__reply-indicator';
    replyIndicator.innerHTML = `
      <i class="material-icons">reply</i>
      <span>Replying to ${replyingTo.owner_name || replyingTo.sender?.full_name || 'Unknown'}</span>
      <button class="chat-input__cancel-reply" type="button">
        <i class="material-icons">close</i>
      </button>
    `;
    
    const cancelBtn = replyIndicator.querySelector('.chat-input__cancel-reply');
    cancelBtn.onclick = () => {
      if (onCancelReply) onCancelReply();
      replyIndicator.remove();
    };
    
    container.appendChild(replyIndicator);
  }

  const form = document.createElement('form');
  form.className = 'chat-input__form';

  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'chat-input__wrapper';

  // Text input
  const textarea = document.createElement('textarea');
  textarea.className = 'chat-input__textarea';
  textarea.placeholder = 'Type a message...';
  textarea.rows = 1;
  textarea.maxLength = 4000;

  // Auto-resize textarea
  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    
    if (onTyping) {
      onTyping(textarea.value);
    }
  });

  // Emoji button
  const emojiBtn = document.createElement('button');
  emojiBtn.type = 'button';
  emojiBtn.className = 'chat-input__btn chat-input__btn--emoji';
  emojiBtn.innerHTML = '<i class="material-icons">insert_emoticon</i>';
  emojiBtn.title = 'Insert emoji';
  emojiBtn.onclick = () => {
    showEmojiPicker(textarea);
  };

  // Send button
  const sendBtn = document.createElement('button');
  sendBtn.type = 'submit';
  sendBtn.className = 'chat-input__btn chat-input__btn--send mdc-button mdc-button--raised';
  sendBtn.innerHTML = '<i class="material-icons">send</i>';
  sendBtn.title = 'Send message';

  // Handle form submission
  form.onsubmit = (e) => {
    e.preventDefault();
    const content = textarea.value.trim();
    
    if (content && onSend) {
      onSend({
        content,
        answer_to: replyingTo?.id || null,
      });
      
      textarea.value = '';
      textarea.style.height = 'auto';
      
      // Remove reply indicator if exists
      const replyIndicator = container.querySelector('.chat-input__reply-indicator');
      if (replyIndicator) replyIndicator.remove();
    }
  };

  // Ctrl/Cmd + Enter to send
  textarea.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      form.dispatchEvent(new Event('submit'));
    }
  });

  inputWrapper.appendChild(textarea);
  inputWrapper.appendChild(emojiBtn);
  inputWrapper.appendChild(sendBtn);

  form.appendChild(inputWrapper);
  container.appendChild(form);

  return container;
}

/**
 * Show emoji picker
 */
function showEmojiPicker(textarea) {
  // Simple emoji picker - could be enhanced with library
  const emojis = ['😀', '😂', '😍', '🎉', '👍', '👎', '🔥', '💯', '✅', '❌'];
  
  const picker = document.createElement('div');
  picker.className = 'chat-input__emoji-picker';
  
  emojis.forEach(emoji => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = emoji;
    btn.onclick = () => {
      textarea.value += emoji;
      textarea.focus();
      picker.remove();
    };
    picker.appendChild(btn);
  });
  
  // Position near emoji button
  const emojiBtn = textarea.parentElement.querySelector('.chat-input__btn--emoji');
  const rect = emojiBtn.getBoundingClientRect();
  picker.style.position = 'absolute';
  picker.style.bottom = rect.height + 10 + 'px';
  picker.style.right = '10px';
  
  textarea.parentElement.appendChild(picker);
  
  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', function closeEmojiPicker(e) {
      if (!picker.contains(e.target) && e.target !== emojiBtn) {
        picker.remove();
        document.removeEventListener('click', closeEmojiPicker);
      }
    });
  }, 0);
}

export default ChatInput;
