export function FormPreview({ title = 'Preview', data = {} } = {}) {
  const preview = document.createElement('div');
  preview.className = 'form-preview';
  
  const header = document.createElement('div');
  header.className = 'form-preview__header';
  
  const headerTitle = document.createElement('h6');
  headerTitle.className = 'form-preview__title';
  headerTitle.textContent = title;
  
  const icon = document.createElement('span');
  icon.className = 'material-icons';
  icon.textContent = 'visibility';
  icon.style.fontSize = '20px';
  icon.style.color = 'var(--google-blue)';
  
  header.append(icon, headerTitle);
  
  const body = document.createElement('div');
  body.className = 'form-preview__body';
  
  function updatePreview(newData) {
    body.innerHTML = '';
    
    if (!newData || Object.keys(newData).length === 0) {
      const empty = document.createElement('div');
      empty.className = 'form-preview__empty';
      empty.textContent = 'Fill in the form to see preview';
      body.appendChild(empty);
      return;
    }
    
    Object.entries(newData).forEach(([key, value]) => {
      if (!value) return;
      
      const row = document.createElement('div');
      row.className = 'form-preview__row';
      
      const label = document.createElement('div');
      label.className = 'form-preview__label';
      label.textContent = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      const valueEl = document.createElement('div');
      valueEl.className = 'form-preview__value';
      valueEl.textContent = value;
      
      row.append(label, valueEl);
      body.appendChild(row);
    });
  }
  
  preview.append(header, body);
  updatePreview(data);
  
  return { element: preview, update: updatePreview };
}
