import { MDCRipple } from '@material/ripple';
import { leadsApi, usersApi, crmTagsApi } from '../../lib/api/client.js';
import { Table, Pagination, Modal, Spinner, Toast, TextField } from '../../components/index.js';

/**
 * Leads list with API-driven filters, inline updates, and KPI widget
 */
export function LeadsList() {
  const root = document.createElement('div');
  root.className = 'leads-screen';

  const header = document.createElement('div');
  header.className = 'leads-toolbar';
  header.style.display = 'flex';
  header.style.gap = '12px';
  header.style.alignItems = 'center';
  header.style.flexWrap = 'wrap';
  header.style.marginBottom = '16px';

  const title = document.createElement('h2');
  title.textContent = 'Leads';
  title.style.flex = '1';
  title.style.margin = '0';

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
  newBtn.innerHTML = '<span class="mdc-button__ripple"></span><span class="mdc-button__label">New lead</span>';
  MDCRipple.attachTo(newBtn);
  newBtn.addEventListener('click', () => import('../../router.js').then(({ navigate }) => navigate('/leads/new')));

  const hidePhoneWrap = document.createElement('label');
  hidePhoneWrap.style.display = 'flex';
  hidePhoneWrap.style.alignItems = 'center';
  hidePhoneWrap.style.gap = '6px';
  const hidePhoneCheckbox = document.createElement('input');
  hidePhoneCheckbox.type = 'checkbox';
  hidePhoneCheckbox.checked = localStorage.getItem('leads_hide_phone') === 'true';
  hidePhoneWrap.append(hidePhoneCheckbox, document.createTextNode('Hide phones'));

  header.append(title, searchField.element, ownerFilter, disqualifiedFilter, orderingFilter, hidePhoneWrap, newBtn);

  const bulkBar = document.createElement('div');
  bulkBar.style.display = 'flex';
  bulkBar.style.alignItems = 'center';
  bulkBar.style.gap = '8px';
  bulkBar.style.margin = '8px 0';
  const bulkLabel = document.createElement('span');
  bulkLabel.textContent = 'Bulk tag selected:';
  const bulkTagSelect = document.createElement('select');
  bulkTagSelect.innerHTML = `<option value="">Select tag</option>`;
  const bulkApplyBtn = document.createElement('button');
  bulkApplyBtn.className = 'mdc-button';
  bulkApplyBtn.innerHTML = '<span class="mdc-button__ripple"></span><span class="mdc-button__label">Apply</span>';
  MDCRipple.attachTo(bulkApplyBtn);
  bulkApplyBtn.disabled = true;
  bulkBar.append(bulkLabel, bulkTagSelect, bulkApplyBtn);

  const tableCard = document.createElement('div');
  tableCard.className = 'mdc-card';
  tableCard.style.padding = '16px';

  const tableWrap = document.createElement('div');
  const pagerWrap = document.createElement('div');
  pagerWrap.style.display = 'flex';
  pagerWrap.style.justifyContent = 'center';
  pagerWrap.style.marginTop = '12px';

  tableCard.append(tableWrap, pagerWrap);
  root.append(header, bulkBar, tableCard);

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
    } catch (err) {
      users = [];
    }
  }

  async function loadTags() {
    try {
      const resp = await crmTagsApi.list({ page: 1, ordering: 'name' });
      tags = resp.results || resp.items || [];
      bulkTagSelect.innerHTML = `<option value="">Select tag</option>` + tags.map((t) => `<option value="${t.id}">${t.name}</option>`).join('');
    } catch (err) {
      tags = [];
      bulkTagSelect.innerHTML = `<option value="">Select tag</option>`;
    }
    updateBulkState();
  }

  function currentOwnerOption(row) {
    if (!row.owner) return '';
    if (typeof row.owner === 'object') {
      return row.owner.first_name || row.owner.username || row.owner.id || '';
    }
    const option = users.find((u) => u.id === row.owner);
    return option ? (option.first_name || option.username) : String(row.owner);
  }

  async function updateLead(id, payload, { useAssign = false } = {}) {
    if (useAssign) {
      return leadsApi.assign(id, payload);
    }
    return leadsApi.patch(id, payload);
  }

  async function load() {
    tableWrap.innerHTML = '';
    tableWrap.appendChild(Spinner({ text: 'Loading leads…' }));
    try {
      const params = {
        page: state.page,
        search: state.search || undefined,
        owner: state.owner || undefined,
        disqualified: state.disqualified === '' ? undefined : state.disqualified === 'true',
        ordering: state.ordering || undefined,
      };

      const resp = await leadsApi.list(params);
      const items = resp.results || resp.items || [];
      state.pageSize = items.length || state.pageSize;
      state.total = resp.count ?? items.length;
      selectedIds.forEach((selectedId) => {
        if (!items.some((row) => row.id === selectedId)) selectedIds.delete(selectedId);
      });
      updateBulkState();

      renderTable(items);
      renderPagination();
    } catch (err) {
      console.error(err);
      Toast.error(err.message || 'Failed to load leads, showing sample data');
      const sample = [
        { id: 101, first_name: 'Sample', last_name: 'Lead', email: 'sample@example.com', phone: '+1 555 100-2000', lead_source: 1, was_in_touch: null, disqualified: false },
      ];
      renderTable(sample);
      renderPagination();
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

  function createOwnerCell(row) {
    const select = document.createElement('select');
    select.className = 'inline-select';
    select.innerHTML = `<option value="">Unassigned</option>` + users.map((u) => `<option value="${u.id}">${u.first_name || u.username}</option>`).join('');
    const current = typeof row.owner === 'object' ? row.owner.id : row.owner;
    select.value = current ?? '';
    select.addEventListener('change', async () => {
      const newOwner = select.value ? Number(select.value) : null;
      select.disabled = true;
      try {
        await updateLead(row.id, { owner: newOwner }, { useAssign: true });
        Toast.success('Owner updated');
      } catch (err) {
        Toast.error(err.message || 'Failed to update owner');
        select.value = current ?? '';
      } finally {
        select.disabled = false;
      }
    });
    return select;
  }

  function inlineInput(row, field, { type = 'text', placeholder = '' } = {}) {
    const input = document.createElement('input');
    input.type = type;
    input.className = 'inline-input';
    input.value = row[field] || '';
    input.placeholder = placeholder;
    input.addEventListener('blur', async () => {
      const next = input.value.trim();
      if (next === (row[field] || '')) return;
      input.disabled = true;
      try {
        const payloadValue = type === 'number' && next !== '' ? Number(next) : (next || null);
        await updateLead(row.id, { [field]: payloadValue });
        Toast.success('Updated');
        row[field] = payloadValue;
      } catch (err) {
        Toast.error(err.message || 'Update failed');
        input.value = row[field] || '';
      } finally {
        input.disabled = false;
      }
    });
    return input;
  }

  function inlineDate(row, field) {
    return inlineInput(row, field, { type: 'date' });
  }

  function createDisqualifyToggle(row) {
    const wrap = document.createElement('label');
    wrap.style.display = 'flex';
    wrap.style.alignItems = 'center';
    wrap.style.gap = '6px';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = Boolean(row.disqualified);
    checkbox.addEventListener('change', async () => {
      checkbox.disabled = true;
      try {
        if (checkbox.checked) {
          await leadsApi.disqualify(row.id, { disqualified: true });
        } else {
          await leadsApi.patch(row.id, { disqualified: false });
        }
        Toast.success('Status updated');
      } catch (err) {
        Toast.error(err.message || 'Failed to update status');
        checkbox.checked = !checkbox.checked;
      } finally {
        checkbox.disabled = false;
      }
    });
    const label = document.createElement('span');
    label.textContent = checkbox.checked ? 'Disqualified' : 'Active';
    checkbox.addEventListener('change', () => {
      label.textContent = checkbox.checked ? 'Disqualified' : 'Active';
    });
    wrap.append(checkbox, label);
    return wrap;
  }

  function createActions(row) {
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.gap = '4px';

    const view = document.createElement('button');
    view.className = 'mdc-icon-button material-icons';
    view.textContent = 'visibility';
    view.title = 'View';
    MDCRipple.attachTo(view);
    view.addEventListener('click', () => import('../../router.js').then(({ navigate }) => navigate(`/leads/${row.id}`)));

    const edit = document.createElement('button');
    edit.className = 'mdc-icon-button material-icons';
    edit.textContent = 'edit';
    edit.title = 'Edit';
    MDCRipple.attachTo(edit);
    edit.addEventListener('click', () => import('../../router.js').then(({ navigate }) => navigate(`/leads/${row.id}/edit`)));

    const convert = document.createElement('button');
    convert.className = 'mdc-icon-button material-icons';
    convert.textContent = 'swap_horiz';
    convert.title = 'Convert';
    MDCRipple.attachTo(convert);
    convert.addEventListener('click', async () => {
      const confirmed = await Modal({
        title: 'Convert lead',
        body: `Create deal from "${row.full_name || row.first_name}"?`,
        confirmText: 'Convert',
        confirmClass: 'mdc-button--raised',
      });
      if (!confirmed) return;
      convert.disabled = true;
      try {
        await leadsApi.convert(row.id, {});
        Toast.success('Lead conversion requested');
      } catch (err) {
        Toast.error(err.message || 'Conversion failed');
      } finally {
        convert.disabled = false;
      }
    });

    const del = document.createElement('button');
    del.className = 'mdc-icon-button material-icons';
    del.textContent = 'delete';
    del.title = 'Delete';
    del.style.color = 'var(--mdc-theme-error)';
    MDCRipple.attachTo(del);
    del.addEventListener('click', async () => {
      const confirmed = await Modal({
        title: 'Delete lead',
        body: `Delete ${row.full_name || row.first_name}?`,
        confirmText: 'Delete',
        confirmClass: 'mdc-button--raised',
      });
      if (!confirmed) return;
      del.disabled = true;
      try {
        await leadsApi.remove(row.id);
        Toast.success('Lead deleted');
        load();
      } catch (err) {
        Toast.error(err.message || 'Delete failed');
      } finally {
        del.disabled = false;
      }
    });

    wrap.append(view, edit, convert, del);
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
            updateBulkState();
          });
          return box;
        },
      },
      {
        key: 'full_name',
        label: 'Lead',
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
      { key: 'company_name', label: 'Company' },
      {
        key: 'email',
        label: 'Email',
        render: (_, row) => inlineInput(row, 'email', { type: 'email', placeholder: 'email' }),
      },
      {
        key: 'phone',
        label: 'Phone',
        render: (_, row) => state.hidePhones ? '•••••••' : inlineInput(row, 'phone', { type: 'tel', placeholder: 'phone' }),
      },
      {
        key: 'lead_source',
        label: 'Source',
        render: (_, row) => inlineInput(row, 'lead_source', { type: 'number', placeholder: 'source id' }),
      },
      {
        key: 'owner',
        label: 'Owner',
        render: (_, row) => createOwnerCell(row),
      },
      {
        key: 'was_in_touch',
        label: 'Last contact',
        render: (_, row) => inlineDate(row, 'was_in_touch'),
      },
      {
        key: 'disqualified',
        label: 'Status',
        render: (_, row) => createDisqualifyToggle(row),
      },
      { key: '_actions', label: '', render: (_, row) => createActions(row) },
    ];

    tableWrap.innerHTML = '';
    const table = Table({ columns, rows: items, sortable: false, stickyHeader: true });
    tableWrap.appendChild(table);
  }

  function updateBulkState() {
    bulkApplyBtn.disabled = selectedIds.size === 0 || !bulkTagSelect.value;
  }

  // Filters wiring
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
    localStorage.setItem('leads_hide_phone', String(state.hidePhones));
    load();
  });
  bulkTagSelect.addEventListener('change', updateBulkState);
  bulkApplyBtn.addEventListener('click', async () => {
    const tagId = Number(bulkTagSelect.value);
    if (!tagId || selectedIds.size === 0) return;
    bulkApplyBtn.disabled = true;
    try {
      await leadsApi.bulkTag({ tags: [tagId], ids: Array.from(selectedIds) });
      Toast.success('Tag applied');
      selectedIds.clear();
      updateBulkState();
      load();
    } catch (err) {
      Toast.error(err.message || 'Bulk tag failed');
    } finally {
      bulkApplyBtn.disabled = false;
    }
  });

  Promise.all([loadUsers(), loadTags()]).then(load);
  return root;
}
