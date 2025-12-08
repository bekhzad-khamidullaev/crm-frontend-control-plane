export function Table({ columns = [], rows = [], className = '', sortable = true, stickyHeader = true, onSortChange } = {}) {
  const table = document.createElement('table');
  table.className = `table table-striped table-hover ${className}`.trim();

  const thead = document.createElement('thead');
  if (stickyHeader) thead.style.position = 'sticky', thead.style.top = '0', thead.style.zIndex = '1', thead.style.background = '#fafafa';
  const headRow = document.createElement('tr');
  let sortState = { key: null, dir: 'asc' };
  function renderHead() {
    headRow.innerHTML = '';
    columns.forEach((col) => {
      const th = document.createElement('th');
      th.textContent = col.label ?? col.key;
      th.style.userSelect = 'none';
      if (sortable && col.sortable) {
        th.style.cursor = 'pointer';
        if (sortState.key === col.key) {
          const arrow = document.createElement('span');
          arrow.textContent = sortState.dir === 'asc' ? ' \u25B2' : ' \u25BC';
          th.appendChild(arrow);
        }
        th.addEventListener('click', () => {
          if (sortState.key === col.key) {
            sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
          } else {
            sortState.key = col.key; sortState.dir = 'asc';
          }
          renderBody();
          if (onSortChange) onSortChange({ ...sortState });
          renderHead();
        });
      }
      headRow.appendChild(th);
    });
  }
  thead.appendChild(headRow);

  const tbody = document.createElement('tbody');

  function renderBody() {
    tbody.innerHTML = '';
    let data = rows.slice();
    if (sortable && sortState.key) {
      const key = sortState.key; const dir = sortState.dir;
      data.sort((a,b) => {
        const av = a[key]; const bv = b[key];
        if (av === bv) return 0; if (av == null) return 1; if (bv == null) return -1;
        if (typeof av === 'number' && typeof bv === 'number') return dir === 'asc' ? av - bv : bv - av;
        return dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }
    data.forEach((row) => {
      const tr = document.createElement('tr');
      columns.forEach((col) => {
        const td = document.createElement('td');
        if (typeof col.render === 'function') {
          const v = col.render(row[col.key], row);
          if (v instanceof Node) td.appendChild(v); else td.textContent = v ?? '';
        } else {
          td.textContent = row[col.key] ?? '';
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  renderHead();
  renderBody();

  table.appendChild(thead);
  table.appendChild(tbody);
  return table;
}
