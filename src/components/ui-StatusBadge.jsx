export function StatusBadge({ status, type = 'neutral' } = {}) {
  const badge = document.createElement('span');
  badge.className = `badge badge--${type}`;
  badge.textContent = status;
  return badge;
}

export function createBadge(text, type = 'neutral') {
  return StatusBadge({ status: text, type });
}

// Helper to auto-detect type from status string
export function smartBadge(status) {
  const str = String(status).toLowerCase();
  if (str.includes('success') || str.includes('won') || str.includes('completed') || str.includes('active')) {
    return StatusBadge({ status, type: 'success' });
  }
  if (str.includes('error') || str.includes('failed') || str.includes('lost') || str.includes('cancelled')) {
    return StatusBadge({ status, type: 'error' });
  }
  if (str.includes('warning') || str.includes('pending') || str.includes('review')) {
    return StatusBadge({ status, type: 'warning' });
  }
  if (str.includes('info') || str.includes('progress') || str.includes('ongoing')) {
    return StatusBadge({ status, type: 'info' });
  }
  return StatusBadge({ status, type: 'neutral' });
}
