import { dealsApi, stagesApi } from '../../lib/api/client.js';
import { Table, Pagination, Modal, Spinner, Toast, FAB, TextField } from '../../components/index.js';
import { MDCRipple } from '@material/ripple';

export function DealsList() {
  const root = document.createElement('div');
  root.style.position = 'relative';

  const card = document.createElement('div');
  card.className = 'mdc-card';
  card.style.padding = '24px';

  // Header with view toggle
  const header = document.createElement('div');
  header.className = 'page-header';
  
  const titleSection = document.createElement('div');
  const title = document.createElement('h5');
  title.className = 'page-header__title';
  title.textContent = 'Deals';
  const subtitle = document.createElement('div');
  subtitle.className = 'page-header__subtitle';
  subtitle.textContent = 'Manage your sales pipeline';
  titleSection.append(title, subtitle);
  
  const actions = document.createElement('div');
  actions.className = 'page-header__actions';
  
  const searchField = TextField({ label: 'Search deals', type: 'search' });
  searchField.element.style.maxWidth = '300px';
  searchField.element.style.marginBottom = '0';
  const search = searchField.input;
  
  const viewToggle = document.createElement('div');
  viewToggle.className = 'action-buttons';
  const listViewBtn = document.createElement('button');
  listViewBtn.className = 'mdc-icon-button material-icons';
  listViewBtn.textContent = 'view_list';
  listViewBtn.title = 'List View';
  MDCRipple.attachTo(listViewBtn);
  const kanbanViewBtn = document.createElement('button');
  kanbanViewBtn.className = 'mdc-icon-button material-icons';
  kanbanViewBtn.textContent = 'view_kanban';
  kanbanViewBtn.title = 'Kanban View';
  MDCRipple.attachTo(kanbanViewBtn);
  viewToggle.append(listViewBtn, kanbanViewBtn);
  
  actions.append(searchField.element, viewToggle);
  header.append(titleSection, actions);

  const body = document.createElement('div');
  body.style.minHeight = '200px';
  body.style.marginTop = '24px';

  const tableWrap = document.createElement('div');
  tableWrap.className = 'table-container';

  const pagerWrap = document.createElement('div');
  pagerWrap.style.marginTop = '16px';
  pagerWrap.style.display = 'flex';
  pagerWrap.style.justifyContent = 'center';

  card.append(header, body, pagerWrap);
  
  // FAB button
  const fabContainer = document.createElement('div');
  fabContainer.className = 'fab-container';
  const fab = FAB({ 
    icon: 'add', 
    label: 'Add Deal',
    onClick: () => import('../../router.js').then(({ navigate }) => navigate('/deals/new'))
  });
  fabContainer.appendChild(fab);
  
  root.append(card, fabContainer);

  let state = { page: 1, pageSize: 10, total: 0, q: '' };

  async function load() {
    body.innerHTML = '';
    body.appendChild(Spinner({ text: 'Loading deals…' }));
    try {
      const resp = await dealsApi.list({ page: state.page, page_size: state.pageSize, search: state.q });
      const items = resp.results || [];
      state.total = resp.count ?? items.length;

      const columns = [
        { key: 'title', label: 'Title' },
        { key: 'value', label: 'Value', render: (v) => v ? `$${Number(v).toLocaleString()}` : '-' },
        { key: 'stage', label: 'Stage', render: (v) => v?.name || '-' },
        { key: 'contact', label: 'Contact', render: (v) => v?.email || '-' },
        { key: 'assignee', label: 'Owner', render: (v) => v?.username || '-' },
        { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
      ];

      const actionCol = { key: '_actions', label: 'Actions', render: (_, row) => {
          const wrap = document.createElement('div');
          wrap.className = 'action-buttons';
          
          const view = document.createElement('button');
          view.className = 'action-button material-icons';
          view.textContent = 'visibility';
          view.title = 'View';
          view.addEventListener('click', () => import('../../router.js').then(({ navigate }) => navigate(`/deals/${row.id}`)));
          
          const edit = document.createElement('button');
          edit.className = 'action-button material-icons';
          edit.textContent = 'edit';
          edit.title = 'Edit';
          edit.addEventListener('click', () => import('../../router.js').then(({ navigate }) => navigate(`/deals/${row.id}/edit`)));
          
          const del = document.createElement('button');
          del.className = 'action-button material-icons';
          del.textContent = 'delete';
          del.title = 'Delete';
          del.style.color = 'var(--mdc-theme-error)';
          del.addEventListener('click', async () => { 
            const confirmed = await Modal({ 
              title: 'Delete Deal', 
              body: `Delete "${row.title}"? This cannot be undone.`, 
              confirmText: 'Delete', 
              confirmClass: 'mdc-button--raised' 
            }); 
            if (confirmed) { 
              try { await dealsApi.remove(row.id); Toast.success('Deal deleted'); load(); } 
              catch (e) { Toast.error(e.message || 'Delete failed'); } 
            } 
          });
          
          wrap.append(view, edit, del);
          return wrap;
        } };
      
      const table = document.createElement('table');
      table.className = 'table-enterprise';
      const thead = document.createElement('thead');
      const headRow = document.createElement('tr');
      [...columns, actionCol].forEach(col => {
        const th = document.createElement('th');
        th.textContent = col.label;
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      
      const tbody = document.createElement('tbody');
      items.forEach(row => {
        const tr = document.createElement('tr');
        [...columns, actionCol].forEach(col => {
          const td = document.createElement('td');
          if (col.render) {
            const val = col.render(row[col.key], row);
            if (val instanceof Node) td.appendChild(val); else td.textContent = val ?? '';
          } else {
            td.textContent = row[col.key] ?? '';
          }
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      
      table.append(thead, tbody);
      tableWrap.innerHTML = '';
      tableWrap.appendChild(table);
      body.innerHTML = '';
      body.appendChild(tableWrap);

      pagerWrap.innerHTML = '';
      pagerWrap.appendChild(Pagination({ page: state.page, pageSize: state.pageSize, total: state.total, onChange: (p) => { state.page = p; load(); } }));
    } catch (err) {
      console.error(err);
      body.innerHTML = `<div class="empty-state"><div class="empty-state__icon material-icons">error</div><div class="empty-state__title">Failed to load deals</div><div class="empty-state__description">${err.message}</div></div>`;
    }
  }

  let debounceId;
  search.addEventListener('input', () => {
    clearTimeout(debounceId);
    debounceId = setTimeout(() => { state.q = search.value; state.page = 1; load(); }, 300);
  });

  load();
  return root;
}
