export function FormSection({ title, icon, children, collapsible = false, defaultOpen = true } = {}) {
  const section = document.createElement('div');
  section.className = 'form-section';
  
  const header = document.createElement('div');
  header.className = 'form-section__header';
  
  if (icon) {
    const iconEl = document.createElement('span');
    iconEl.className = 'material-icons form-section__icon';
    iconEl.textContent = icon;
    header.appendChild(iconEl);
  }
  
  const titleEl = document.createElement('h6');
  titleEl.className = 'form-section__title';
  titleEl.textContent = title;
  header.appendChild(titleEl);
  
  if (collapsible) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'material-icons form-section__toggle';
    toggle.textContent = defaultOpen ? 'expand_less' : 'expand_more';
    header.appendChild(toggle);
    
    toggle.addEventListener('click', () => {
      const isOpen = body.style.display !== 'none';
      body.style.display = isOpen ? 'none' : 'block';
      toggle.textContent = isOpen ? 'expand_more' : 'expand_less';
    });
  }
  
  const body = document.createElement('div');
  body.className = 'form-section__body';
  if (!defaultOpen) body.style.display = 'none';
  
  if (Array.isArray(children)) {
    children.forEach(child => body.appendChild(child));
  } else if (children instanceof Node) {
    body.appendChild(children);
  }
  
  section.append(header, body);
  return section;
}
