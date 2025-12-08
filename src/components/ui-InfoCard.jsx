export function InfoCard({ title, items = [], icon } = {}) {
  const card = document.createElement('div');
  card.className = 'info-card';

  const header = document.createElement('div');
  header.className = 'info-card__header';
  
  if (icon) {
    const iconEl = document.createElement('span');
    iconEl.className = 'material-icons info-card__icon';
    iconEl.textContent = icon;
    header.appendChild(iconEl);
  }
  
  const titleEl = document.createElement('h6');
  titleEl.className = 'info-card__title';
  titleEl.textContent = title;
  header.appendChild(titleEl);

  const body = document.createElement('div');
  body.className = 'info-card__body';

  items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'info-card__row';

    const label = document.createElement('div');
    label.className = 'info-card__label';
    label.textContent = item.label;

    const value = document.createElement('div');
    value.className = 'info-card__value';
    
    if (item.render) {
      const rendered = item.render(item.value);
      if (rendered instanceof Node) value.appendChild(rendered);
      else value.innerHTML = rendered;
    } else {
      value.textContent = item.value ?? '-';
    }

    row.append(label, value);
    body.appendChild(row);
  });

  card.append(header, body);
  return card;
}
