import { MDCRipple } from '@material/ripple';
import { leadsApi } from '../../lib/api/client.js';
import { Modal, Spinner, Toast } from '../../components/index.js';

export function LeadDetail({ id, onBack, onEdit, onDeleted } = {}) {
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
    import('../../router.js').then(({ navigate }) => navigate('/leads'));
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

  const actionButton = (label, icon, variant = 'text') => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = variant === 'raised' ? 'mdc-button mdc-button--raised' : 'mdc-button';
    btn.innerHTML = `<span class="mdc-button__ripple"></span><span class="mdc-button__label">${label}</span>`;
    if (icon) btn.innerHTML = `<span class="mdc-button__ripple"></span><span class="material-icons" style="margin-right:6px;font-size:18px;">${icon}</span><span class="mdc-button__label">${label}</span>`;
    MDCRipple.attachTo(btn);
    return btn;
  };

  const infoRow = (label, value) => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.gap = '12px';
    row.style.padding = '8px 0';
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
    body.appendChild(Spinner({ text: 'Loading lead…' }));
    try {
      const lead = await leadsApi.retrieve(id);
      renderLead(lead);
    } catch (err) {
      body.innerHTML = `<div class="alert alert-danger">${err.message || 'Failed to load lead'}</div>`;
    }
  }

  function renderLead(lead) {
    title.textContent = lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || `Lead #${id}`;
    rightActions.innerHTML = '';

    const editBtn = actionButton('Edit', 'edit');
    editBtn.addEventListener('click', () => {
      if (onEdit) return onEdit(id);
      import('../../router.js').then(({ navigate }) => navigate(`/leads/${id}/edit`));
    });

    const convertBtn = actionButton('Convert', 'swap_horiz');
    convertBtn.addEventListener('click', async () => {
      const confirmed = await Modal({
        title: 'Convert lead',
        body: `Create a deal from "${lead.full_name || lead.first_name}"?`,
        confirmText: 'Convert',
        confirmClass: 'mdc-button--raised',
      });
      if (!confirmed) return;
      convertBtn.disabled = true;
      try {
        await leadsApi.convert(id, {});
        Toast.success('Conversion requested');
      } catch (err) {
        Toast.error(err.message || 'Conversion failed');
      } finally {
        convertBtn.disabled = false;
      }
    });

    const toggleBtn = actionButton(lead.disqualified ? 'Activate' : 'Disqualify', 'block');
    toggleBtn.addEventListener('click', async () => {
      toggleBtn.disabled = true;
      try {
        if (lead.disqualified) {
          await leadsApi.patch(id, { disqualified: false });
        } else {
          await leadsApi.disqualify(id, { disqualified: true });
        }
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
        title: 'Delete lead',
        body: `Delete ${lead.full_name || lead.first_name}?`,
        confirmText: 'Delete',
        confirmClass: 'mdc-button--raised',
      });
      if (!confirmed) return;
      deleteBtn.disabled = true;
      try {
        await leadsApi.remove(id);
        Toast.success('Lead deleted');
        onDeleted?.();
        if (!onDeleted) import('../../router.js').then(({ navigate }) => navigate('/leads'));
      } catch (err) {
        Toast.error(err.message || 'Delete failed');
      } finally {
        deleteBtn.disabled = false;
      }
    });

    rightActions.append(convertBtn, toggleBtn, editBtn, deleteBtn);

    header.innerHTML = '';
    header.append(leftActions, rightActions);

    const contactCard = document.createElement('div');
    contactCard.className = 'mdc-card';
    contactCard.style.padding = '12px';
    contactCard.style.marginBottom = '12px';
    contactCard.append(
      infoRow('Email', lead.email),
      infoRow('Secondary email', lead.secondary_email),
      infoRow('Phone', lead.phone),
      infoRow('Mobile', lead.mobile),
      infoRow('Lead source', lead.lead_source ?? '—'),
      infoRow('Owner', lead.owner_name || lead.owner || '—'),
    );

    const companyCard = document.createElement('div');
    companyCard.className = 'mdc-card';
    companyCard.style.padding = '12px';
    companyCard.style.marginBottom = '12px';
    companyCard.append(
      infoRow('Company', lead.company_name),
      infoRow('Website', lead.website),
      infoRow('Company email', lead.company_email),
      infoRow('Company phone', lead.company_phone),
      infoRow('Address', lead.company_address),
      infoRow('Country', lead.country),
      infoRow('City', lead.city_name),
    );

    const metaCard = document.createElement('div');
    metaCard.className = 'mdc-card';
    metaCard.style.padding = '12px';
    metaCard.append(
      infoRow('Last contact', lead.was_in_touch ? new Date(lead.was_in_touch).toLocaleDateString() : '—'),
      infoRow('Disqualified', lead.disqualified ? 'Yes' : 'No'),
      infoRow('Mass mailing', lead.massmail ? 'Yes' : 'No'),
      infoRow('Tags', Array.isArray(lead.tag_names) ? lead.tag_names.join(', ') : (lead.tags?.join(', ') || '—')),
      infoRow('Created', lead.creation_date ? new Date(lead.creation_date).toLocaleString() : '—'),
      infoRow('Updated', lead.update_date ? new Date(lead.update_date).toLocaleString() : '—'),
      infoRow('Notes', lead.description || '—'),
    );

    body.innerHTML = '';
    body.append(contactCard, companyCard, metaCard);
  }

  load();
  return root;
}
