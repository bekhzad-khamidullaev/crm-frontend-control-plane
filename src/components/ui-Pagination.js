export function Pagination({ page = 1, pageSize = 10, total = 0, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const nav = document.createElement('nav');
  const ul = document.createElement('ul');
  ul.className = 'pagination mb-0';

  function add(label, disabled, targetPage) {
    const li = document.createElement('li');
    li.className = `page-item ${disabled ? 'disabled' : ''}`;
    const a = document.createElement('a');
    a.className = 'page-link';
    a.href = '#';
    a.textContent = label;
    if (!disabled) {
      a.addEventListener('click', (e) => { e.preventDefault(); onChange?.(targetPage); });
    }
    li.appendChild(a);
    ul.appendChild(li);
  }

  add('«', page <= 1, 1);
  add('‹', page <= 1, Math.max(1, page - 1));
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let p = start; p <= end; p++) {
    const li = document.createElement('li');
    li.className = `page-item ${p === page ? 'active' : ''}`;
    const a = document.createElement('a');
    a.className = 'page-link';
    a.href = '#';
    a.textContent = String(p);
    a.addEventListener('click', (e) => { e.preventDefault(); onChange?.(p); });
    li.appendChild(a);
    ul.appendChild(li);
  }
  add('›', page >= totalPages, Math.min(totalPages, page + 1));
  add('»', page >= totalPages, totalPages);

  nav.appendChild(ul);
  return nav;
}
