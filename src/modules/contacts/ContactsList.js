import { MDCRipple } from '@material/ripple';
import { contactsApi, usersApi, crmTagsApi } from '../../lib/api/client.js';
import { Table, Pagination, Modal, Spinner, Toast, TextField } from '../../components/index.js';

/**
 * Contacts list with server filters, inline owner/disqualify updates, and KPI chart
 */
export function ContactsList() {
  const root = document.createElement('div');
  root.className = 'contacts-screen';

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.flexWrap = 'wrap';
  header.style.alignItems = 'center';
  header.style.gap = '12px';
  header.style.marginBottom = '12px';

  const title = document.createElement('h2');
  title.textContent = 'Contacts';
  title.style.margin = '0';
  title.style.flex = '1';

  const searchField = TextField({ label: 'Search', type: 'search', placeholder: 'Name, email, phone' });
  searchField.element.style.maxWidth = '240px';
  searchField.element.style.marginBottom = '0';

  const ownerFilter = document.createElement('select');
  ownerFilter.className = 'filter-select';
  ownerFilter.innerHTML = `<option value="">Owner: All</option>`;

  const disqualifiedFilter = document.createElement('select');
  disqualifiedFilter.className = 'filter-select';
  disqualifiedFilter.innerHTML = `
    <option value="">Status: All</option>
    <option value="false">Active</option>
    <option value="true">Disqualified</option>
  `;

  const orderingFilter = document.createElement('select');
  orderingFilter.className = 'filter-select';
  orderingFilter.innerHTML = `
    <option value="-update_date">Newest</option>
    <option value="first_name">First name</option>
    <option value="owner">Owner</option>
    <option value="was_in_touch">Last contact</option>
  `;

  const newBtn = document.createElement('button');
  newBtn.className = 'mdc-button mdc-button--raised';
  newBtn.innerHTML = '<span class="mdc-button__ripple"></span><span class="mdc-button__label">New contact</span>';
  MDCRipple.attachTo(newBtn);
  newBtn.addEventListener('click', () => import('../../router.js').then(({ navigate }) => navigate('/contacts/new')));

  const hidePhoneWrap = document.createElement('label');
  hidePhoneWrap.style.display = 'flex';
  hidePhoneWrap.style.alignItems = 'center';
  hidePhoneWrap.style.gap = '6px';
  const hidePhoneCheckbox = document.createElement('input');
  hidePhoneCheckbox.type = 'checkbox';
  hidePhoneCheckbox.checked = localStorage.getItem('contacts_hide_phone') === 'true';
  hidePhoneWrap.append(hidePhoneCheckbox, document.createTextNode('Hide phones'));

  header.append(title, searchField.element, ownerFilter, disqualifiedFilter, orderingFilter, hidePhoneWrap, newBtn);

  const tableCard = document.createElement('div');
  tableCard.className = 'mdc-card';
  tableCard.style.padding = '16px';

  const tableWrap = document.createElement('div');
  const pagerWrap = document.createElement('div');
  pagerWrap.style.display = 'flex';
  pagerWrap.style.justifyContent = 'center';
  pagerWrap.style.marginTop = '12px';

  tableCard.append(tableWrap, pagerWrap);
  root.append(header, tableCard);

  const state = {
    page: 1,
    pageSize: 15,
    total: 0,
    search: '',
    owner: '',
    disqualified: '',
    ordering: '-update_date',
    hidePhones: hidePhoneCheckbox.checked,
  };

  const selectedIds = new Set();
  let users = [];
  let tags = [];

  async function loadUsers() {
    try {
      const resp = await usersApi.list({ page: 1, ordering: 'username' });
      users = resp.results || resp.items || [];
      ownerFilter.innerHTML = `<option value="">Owner: All</option>` + users.map((u) => `<option value="${u.id}">${u.first_name || u.username}</option>`).join('');
    } catch {
      users = [];
    }
  }

  async function loadTags() {
    try {
      const resp = await crmTagsApi.list({ page: 1, ordering: 'name' });
      tags = resp.results || resp.items || [];
    } catch {
      tags = [];
    }
  }

  function ownerLabel(row) {
    if (!row.owner) return '';
    if (typeof row.owner === 'object') return row.owner.first_name || row.owner.username || row.owner.id || '';
    const u = users.find((x) => x.id === row.owner);
    return u ? (u.first_name || u.username) : String(row.owner);
  }

  async function updateContact(id, payload) {
    return contactsApi.patch(id, payload);
  }

  async function load() {
    tableWrap.innerHTML = '';
    tableWrap.appendChild(Spinner({ text: 'Loading contacts…' }));
    try {
      const params = {
        page: state.page,
        search: state.search || undefined,
        owner: state.owner || undefined,
        disqualified: state.disqualified === '' ? undefined : state.disqualified === 'true',
        ordering: state.ordering || undefined,
      };
      const resp = await contactsApi.list(params);
      const items = resp.results || resp.items || [];
      state.pageSize = items.length || state.pageSize;
      state.total = resp.count ?? items.length;
      selectedIds.forEach((id) => {
        if (!items.some((row) => row.id === id)) selectedIds.delete(id);
      });

      renderTable(items);
      renderPagination();
    } catch (err) {
      tableWrap.innerHTML = `<div class="alert alert-danger">${err.message || 'Failed to load contacts'}</div>`;
    }
  }

  function renderPagination() {
    pagerWrap.innerHTML = '';
    pagerWrap.appendChild(
      Pagination({
        page: state.page,
        pageSize: state.pageSize,
        total: state.total,
        onChange: (p) => {
          state.page = p;
          load();
        },
      }),
    );
  }

  function ownerCell(row) {
    const select = document.createElement('select');
    select.className = 'inline-select';
    select.innerHTML = `<option value="">Unassigned</option>` + users.map((u) => `<option value="${u.id}">${u.first_name || u.username}</option>`).join('');
    select.value = typeof row.owner === 'object' ? row.owner.id : row.owner ?? '';
    select.addEventListener('change', async () => {
      select.disabled = true;
      const newOwner = select.value ? Number(select.value) : null;
      try {
        await updateContact(row.id, { owner: newOwner });
        Toast.success('Owner updated');
      } catch (err) {
        Toast.error(err.message || 'Failed to update owner');
        select.value = typeof row.owner === 'object' ? row.owner.id : row.owner ?? '';
      } finally {
        select.disabled = false;
      }
    });
    return select;
  }

  function disqualifyToggle(row) {
    const wrap = document.createElement('label');
    wrap.style.display = 'flex';
    wrap.style.alignItems = 'center';
    wrap.style.gap = '6px';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = Boolean(row.disqualified);
    const label = document.createElement('span');
    label.textContent = checkbox.checked ? 'Disqualified' : 'Active';
    checkbox.addEventListener('change', async () => {
      checkbox.disabled = true;
      try {
        await updateContact(row.id, { disqualified: checkbox.checked });
        label.textContent = checkbox.checked ? 'Disqualified' : 'Active';
        Toast.success('Status updated');
      } catch (err) {
        Toast.error(err.message || 'Failed to update status');
        checkbox.checked = !checkbox.checked;
      } finally {
        checkbox.disabled = false;
      }
    });
    wrap.append(checkbox, label);
    return wrap;
  }

  function renderTable(items) {
    const columns = [
      {
        key: '_select',
        label: '',
        render: (_, row) => {
          const box = document.createElement('input');
          box.type = 'checkbox';
          box.checked = selectedIds.has(row.id);
          box.addEventListener('change', () => {
            if (box.checked) selectedIds.add(row.id);
            else selectedIds.delete(row.id);
          });
          return box;
        },
      },
      {
        key: 'full_name',
        label: 'Contact',
        render: (_, row) => {
          const box = document.createElement('div');
          box.style.display = 'flex';
          box.style.flexDirection = 'column';
          box.style.gap = '2px';
          const name = document.createElement('strong');
          name.textContent = row.full_name || `${row.first_name || ''} ${row.last_name || ''}`.trim() || `#${row.id}`;
          const meta = document.createElement('span');
          meta.style.color = '#6b7280';
          meta.textContent = row.email || row.mobile || row.phone || 'No contact';
          box.append(name, meta);
          return box;
        },
      },
      { key: 'company_name', label: 'Company', render: (v) => v || '—' },
      { key: 'lead_source', label: 'Lead source', render: (v) => (v === undefined || v === null || v === '' ? '—' : v) },
      { key: 'owner', label: 'Owner', render: (_, row) => ownerCell(row) },
      { key: 'was_in_touch', label: 'Last contact', render: (v) => (v ? new Date(v).toLocaleDateString() : '—') },
      { key: 'disqualified', label: 'Status', render: (_, row) => disqualifyToggle(row) },
      {
        key: 'phone',
        label: 'Phone',
        render: (_, row) => state.hidePhones ? '•••••••' : (row.phone || ''),
      },
      {
        key: '_actions',
        label: '',
        render: (_, row) => {
          const wrap = document.createElement('div');
          wrap.style.display = 'flex';
          wrap.style.gap = '4px';

          const view = document.createElement('button');
          view.className = 'mdc-icon-button material-icons';
          view.textContent = 'visibility';
          view.title = 'View';
          MDCRipple.attachTo(view);
          view.addEventListener('click', () => import('../../router.js').then(({ navigate }) => navigate(`/contacts/${row.id}`)));

          const edit = document.createElement('button');
          edit.className = 'mdc-icon-button material-icons';
          edit.textContent = 'edit';
          edit.title = 'Edit';
          MDCRipple.attachTo(edit);
          edit.addEventListener('click', () => import('../../router.js').then(({ navigate }) => navigate(`/contacts/${row.id}/edit`)));

          const del = document.createElement('button');
          del.className = 'mdc-icon-button material-icons';
          del.textContent = 'delete';
          del.title = 'Delete';
          del.style.color = 'var(--mdc-theme-error)';
          MDCRipple.attachTo(del);
          del.addEventListener('click', async () => {
            const confirmed = await Modal({
              title: 'Delete contact',
              body: `Delete ${row.full_name || row.first_name}?`,
              confirmText: 'Delete',
              confirmClass: 'mdc-button--raised',
            });
            if (!confirmed) return;
            del.disabled = true;
            try {
              await contactsApi.remove(row.id);
              Toast.success('Contact deleted');
              load();
            } catch (err) {
              Toast.error(err.message || 'Delete failed');
            } finally {
              del.disabled = false;
            }
          });

          wrap.append(view, edit, del);
          return wrap;
        },
      },
    ];

    tableWrap.innerHTML = '';
    const table = Table({ columns, rows: items, sortable: false, stickyHeader: true });
    tableWrap.appendChild(table);
  }

  // Filters
  let debounceId;
  searchField.input.addEventListener('input', () => {
    clearTimeout(debounceId);
    debounceId = setTimeout(() => {
      state.search = searchField.getValue();
      state.page = 1;
      load();
    }, 300);
  });
  ownerFilter.addEventListener('change', () => {
    state.owner = ownerFilter.value;
    state.page = 1;
    load();
  });
  disqualifiedFilter.addEventListener('change', () => {
    state.disqualified = disqualifiedFilter.value;
    state.page = 1;
    load();
  });
  orderingFilter.addEventListener('change', () => {
    state.ordering = orderingFilter.value;
    load();
  });
  hidePhoneCheckbox.addEventListener('change', () => {
    state.hidePhones = hidePhoneCheckbox.checked;
    localStorage.setItem('contacts_hide_phone', String(state.hidePhones));
    load();
  });

  Promise.all([loadUsers(), loadTags()]).then(load);
  return root;
}
