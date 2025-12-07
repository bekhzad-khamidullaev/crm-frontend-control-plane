export function Timeline({ items = [] } = {}) {
  const timeline = document.createElement('div');
  timeline.className = 'timeline';

  items.forEach((item, index) => {
    const timelineItem = document.createElement('div');
    timelineItem.className = 'timeline-item';

    const marker = document.createElement('div');
    marker.className = `timeline-item__marker timeline-item__marker--${item.type || 'default'}`;
    
    const icon = document.createElement('span');
    icon.className = 'material-icons';
    icon.textContent = item.icon || 'circle';
    marker.appendChild(icon);

    const content = document.createElement('div');
    content.className = 'timeline-item__content';

    const contentHeader = document.createElement('div');
    contentHeader.className = 'timeline-item__header';

    const title = document.createElement('div');
    title.className = 'timeline-item__title';
    title.textContent = item.title;

    const time = document.createElement('div');
    time.className = 'timeline-item__time';
    time.textContent = item.time;

    contentHeader.append(title, time);

    const description = document.createElement('div');
    description.className = 'timeline-item__description';
    description.textContent = item.description || '';

    content.append(contentHeader, description);

    if (item.meta) {
      const meta = document.createElement('div');
      meta.className = 'timeline-item__meta';
      meta.textContent = item.meta;
      content.appendChild(meta);
    }

    timelineItem.append(marker, content);
    timeline.appendChild(timelineItem);
  });

  if (items.length === 0) {
    timeline.innerHTML = '<div class="timeline-empty">No activity yet</div>';
  }

  return timeline;
}
