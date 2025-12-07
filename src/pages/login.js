import { authApi } from '../lib/api/client.js';
import { setToken, isDemoMode } from '../lib/api/auth.js';
import { Toast } from '../components/index.js';
import { MDCTextField } from '@material/textfield';
import { MDCRipple } from '@material/ripple';

export function LoginPage({ onSuccess } = {}) {
  const container = document.createElement('div');
  container.className = 'login-container';
  
  const card = document.createElement('div');
  card.className = 'mdc-card login-card elevation-4';
  card.style.padding = '24px';

  // Title
  const title = document.createElement('h4');
  title.textContent = 'CRM Login';
  title.className = 'text-center mb-3';
  title.style.margin = '0 0 24px 0';
  title.style.color = 'var(--mdc-theme-primary)';

  const form = document.createElement('form');
  form.style.display = 'flex';
  form.style.flexDirection = 'column';
  form.style.gap = '24px';
  
  // Username field
  const uWrap = document.createElement('label');
  uWrap.className = 'mdc-text-field mdc-text-field--filled';
  uWrap.style.width = '100%';
  uWrap.innerHTML = `
    <span class="mdc-text-field__ripple"></span>
    <span class="mdc-floating-label">Username</span>
    <input class="mdc-text-field__input" type="text" required>
    <span class="mdc-line-ripple"></span>
  `;
  const username = uWrap.querySelector('input');
  const usernameField = new MDCTextField(uWrap);
  
  // Password field
  const pWrap = document.createElement('label');
  pWrap.className = 'mdc-text-field mdc-text-field--filled';
  pWrap.style.width = '100%';
  pWrap.innerHTML = `
    <span class="mdc-text-field__ripple"></span>
    <span class="mdc-floating-label">Password</span>
    <input class="mdc-text-field__input" type="password" required>
    <span class="mdc-line-ripple"></span>
  `;
  const password = pWrap.querySelector('input');
  const passwordField = new MDCTextField(pWrap);
  
  // Remember me checkbox
  const persistWrap = document.createElement('div');
  persistWrap.style.display = 'flex';
  persistWrap.style.alignItems = 'center';
  persistWrap.style.gap = '8px';
  const persist = document.createElement('input');
  persist.type = 'checkbox';
  persist.id = 'remember-me';
  const persistLabel = document.createElement('label');
  persistLabel.htmlFor = 'remember-me';
  persistLabel.textContent = 'Remember me';
  persistWrap.append(persist, persistLabel);

  const errorBox = document.createElement('div');
  errorBox.style.color = 'var(--mdc-theme-error)';
  errorBox.style.fontSize = '14px';
  errorBox.style.display = 'none';
  errorBox.style.marginTop = '-12px';

  // Submit button
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'mdc-button mdc-button--raised';
  submit.style.width = '100%';
  submit.innerHTML = `
    <span class="mdc-button__ripple"></span>
    <span class="mdc-button__label">Login</span>
  `;
  MDCRipple.attachTo(submit);

  form.append(uWrap, pWrap, persistWrap, errorBox, submit);
  card.append(title, form);

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    errorBox.style.display = 'none';
    uWrap.classList.remove('mdc-text-field--invalid');
    pWrap.classList.remove('mdc-text-field--invalid');
    submit.disabled = true;
    const label = submit.querySelector('.mdc-button__label');
    const originalText = label.textContent;
    label.textContent = 'Logging in...';
    
    try {
      if (isDemoMode()) {
        setToken('demo-token', { persist: true });
        Toast.success('Demo mode: logged in');
      } else {
        const data = await authApi.login({ username: username.value.trim(), password: password.value });
        const token = data?.token || data?.key || data?.auth_token || data?.access || data?.access_token;
        if (!token) throw new Error('Token not found in response');
        setToken(token, { persist: persist.checked });
        Toast.success('Login successful');
      }
      onSuccess?.();
    } catch (err) {
      if (isDemoMode()) {
        setToken('demo-token', { persist: true });
        Toast.info('Demo fallback: continuing offline');
        onSuccess?.();
      } else {
        const details = err?.details || {};
        const fieldErrors = [
          ...(details.non_field_errors || []),
          ...(details.detail ? [details.detail] : []),
          ...(details.username || []),
          ...(details.password || []),
        ];
        const msg = fieldErrors.length
          ? fieldErrors.join(', ')
          : err.message || 'Login failed';
        errorBox.textContent = msg;
        errorBox.style.display = 'block';
        Toast.error(msg);
        if (msg.toLowerCase().includes('credential')) {
          uWrap.classList.add('mdc-text-field--invalid');
          pWrap.classList.add('mdc-text-field--invalid');
        }
      }
    } finally {
      submit.disabled = false;
      label.textContent = originalText;
    }
  });

  container.appendChild(card);
  return container;
}
