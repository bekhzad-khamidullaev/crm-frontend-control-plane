export function Spinner({ size = 'md', text = '' } = {}) {
  const wrap = document.createElement('div');
  wrap.style.display = 'flex';
  wrap.style.alignItems = 'center';
  wrap.style.gap = '12px';
  wrap.style.padding = '16px';
  wrap.style.justifyContent = 'center';
  
  const spinner = document.createElement('div');
  spinner.className = 'mdc-circular-progress';
  spinner.setAttribute('role', 'progressbar');
  spinner.setAttribute('aria-label', 'Loading...');
  
  const sizeMap = { sm: 24, md: 48, lg: 72 };
  const sizeVal = sizeMap[size] || 48;
  spinner.style.width = `${sizeVal}px`;
  spinner.style.height = `${sizeVal}px`;
  
  spinner.innerHTML = `
    <svg class="mdc-circular-progress__indeterminate-circle-graphic" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <circle class="mdc-circular-progress__indeterminate-circle" cx="24" cy="24" r="18" stroke-dasharray="113.097" stroke-dashoffset="56.549"/>
    </svg>
  `;
  
  spinner.querySelector('circle').style.stroke = 'var(--mdc-theme-primary)';
  spinner.querySelector('circle').style.strokeWidth = '4';
  spinner.querySelector('circle').style.fill = 'none';
  
  // Simple CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes mdc-circular-progress-spinner-rotate {
      to { transform: rotate(360deg); }
    }
    .mdc-circular-progress svg { animation: mdc-circular-progress-spinner-rotate 1.4s linear infinite; }
  `;
  if (!document.querySelector('#spinner-style')) {
    style.id = 'spinner-style';
    document.head.appendChild(style);
  }
  
  wrap.appendChild(spinner);
  if (text) { 
    const t = document.createElement('span'); 
    t.textContent = text; 
    t.style.color = 'rgba(0,0,0,0.6)';
    wrap.appendChild(t); 
  }
  return wrap;
}
