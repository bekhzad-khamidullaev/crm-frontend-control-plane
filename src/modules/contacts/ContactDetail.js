import { MDCRipple } from '@material/ripple';
import { contactsApi } from '../../lib/api/client.js';
import { Modal, Spinner, Toast } from '../../components/index.js';

export function ContactDetail({ id, onBack, onEdit, onDeleted } = {}) {
  const root = document.createElement('div');
  const card = document.createElement('div');
  card.className = 'mdc-card';
  card.style.padding = '16px';
  card.style.maxWidth = '1200px';
  card.style.margin = '0 auto';
  root.appendChild(card);

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.justifyContent = 'space-between';
  header.style.marginBottom = '12px';

  const leftActions = document.createElement('div');
  leftActions.style.display = 'flex';
  leftActions.style.alignItems = 'center';
  leftActions.style.gap = '8px';

  const backBtn = document.createElement('button');
  backBtn.className = 'mdc-icon-button material-icons';
  backBtn.textContent = 'arrow_back';
  backBtn.title = 'Back';
  MDCRipple.attachTo(backBtn);
  backBtn.addEventListener('click', () => {
    if (onBack) return onBack();
    import('../../router.js').then(({ navigate }) => navigate('/contacts'));
  });
  leftActions.appendChild(backBtn);

  const title = document.createElement('h2');
  title.style.margin = '0';
  leftActions.appendChild(title);

  const rightActions = document.createElement('div');
  rightActions.style.display = 'flex';
  rightActions.style.gap = '8px';

  const body = document.createElement('div');

  card.append(header, body);

  const actionButton = (label, icon) => {
    const btn = document.createElement('button');
    btn.className = 'mdc-button';
    btn.innerHTML = `<span class="mdc-button__ripple"></span><span class="material-icons" style="margin-right:6px;font-size:18px;">${icon}</span><span class="mdc-button__label">${label}</span>`;
    MDCRipple.attachTo(btn);
    return btn;
  };

  const infoRow = (label, value) => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.gap = '12px';
    row.style.padding = '6px 0';
    const l = document.createElement('div');
    l.textContent = label;
    l.style.fontWeight = '600';
    l.style.color = '#4b5563';
    const v = document.createElement('div');
    v.textContent = value ?? '—';
    v.style.textAlign = 'right';
    row.append(l, v);
    return row;
  };

  async function load() {
    body.innerHTML = '';
    body.appendChild(Spinner({ text: 'Loading contact…' }));
    try {
      const contact = await contactsApi.retrieve(id);
      renderContact(contact);
    } catch (err) {
      body.innerHTML = `<div class="alert alert-danger">${err.message || 'Failed to load contact'}</div>`;
    }
  }

  function renderContact(contact) {
    title.textContent = contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || `Contact #${id}`;
    rightActions.innerHTML = '';

    const editBtn = actionButton('Edit', 'edit');
    editBtn.addEventListener('click', () => {
      if (onEdit) return onEdit(id);
      import('../../router.js').then(({ navigate }) => navigate(`/contacts/${id}/edit`));
    });

    const toggleBtn = actionButton(contact.disqualified ? 'Activate' : 'Disqualify', 'block');
    toggleBtn.addEventListener('click', async () => {
      toggleBtn.disabled = true;
      try {
        await contactsApi.patch(id, { disqualified: !contact.disqualified });
        Toast.success('Status updated');
        load();
      } catch (err) {
        Toast.error(err.message || 'Update failed');
      } finally {
        toggleBtn.disabled = false;
      }
    });

    const deleteBtn = actionButton('Delete', 'delete');
    deleteBtn.classList.add('mdc-button--outlined');
    deleteBtn.addEventListener('click', async () => {
      const confirmed = await Modal({
        title: 'Delete contact',
        body: `Delete ${contact.full_name || contact.first_name}?`,
        confirmText: 'Delete',
        confirmClass: 'mdc-button--raised',
      });
      if (!confirmed) return;
      deleteBtn.disabled = true;
      try {
        await contactsApi.remove(id);
        Toast.success('Contact deleted');
        onDeleted?.();
        if (!onDeleted) import('../../router.js').then(({ navigate }) => navigate('/contacts'));
      } catch (err) {
        Toast.error(err.message || 'Delete failed');
      } finally {
        deleteBtn.disabled = false;
      }
    });

    rightActions.append(toggleBtn, editBtn, deleteBtn);
    header.innerHTML = '';
    header.append(leftActions, rightActions);

    const contactCard = document.createElement('div');
    contactCard.className = 'mdc-card';
    contactCard.style.padding = '12px';
    contactCard.style.marginBottom = '12px';
    contactCard.append(
      infoRow('Email', contact.email),
      infoRow('Secondary email', contact.secondary_email),
      infoRow('Phone', contact.phone),
      infoRow('Mobile', contact.mobile),
      infoRow('Lead source', contact.lead_source ?? '—'),
      infoRow('Owner', contact.owner_name || contact.owner || '—'),
      infoRow('Department', contact.department || '—'),
    );

    const companyCard = document.createElement('div');
    companyCard.className = 'mdc-card';
    companyCard.style.padding = '12px';
    companyCard.style.marginBottom = '12px';
    companyCard.append(
      infoRow('Company', contact.company_name || contact.company || '—'),
      infoRow('Country', contact.country || '—'),
      infoRow('City', contact.city_name || '—'),
      infoRow('Address', contact.address || '—'),
    );

    const metaCard = document.createElement('div');
    metaCard.className = 'mdc-card';
    metaCard.style.padding = '12px';
    metaCard.append(
      infoRow('Last contact', contact.was_in_touch ? new Date(contact.was_in_touch).toLocaleDateString() : '—'),
      infoRow('Disqualified', contact.disqualified ? 'Yes' : 'No'),
      infoRow('Mass mailing', contact.massmail ? 'Yes' : 'No'),
      infoRow('Tags', Array.isArray(contact.tag_names) ? contact.tag_names.join(', ') : (contact.tags?.join(', ') || '—')),
      infoRow('Created', contact.creation_date ? new Date(contact.creation_date).toLocaleString() : '—'),
      infoRow('Updated', contact.update_date ? new Date(contact.update_date).toLocaleString() : '—'),
      infoRow('Description', contact.description || '—'),
    );

    body.innerHTML = '';
    body.append(contactCard, companyCard, metaCard);
  }

  load();
  return root;
}
