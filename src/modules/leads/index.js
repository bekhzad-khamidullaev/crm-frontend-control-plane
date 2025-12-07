import { LeadsList } from './LeadsList.js';
import { LeadForm } from './LeadForm.js';

export function mountLeads(rootEl, route = { name: 'leads-list', params: {} }) {
  rootEl.innerHTML = '';
  const wrapper = document.createElement('div');
  function renderList() {
    wrapper.innerHTML = '';
    const list = LeadsList();
    list.addEventListener('create', () => openCreate());
    list.addEventListener('view', (e) => openDetail(e.detail.id));
    list.addEventListener('edit', (e) => openEdit(e.detail.id));
    wrapper.appendChild(list);
  }

  async function openDetail(id) {
    wrapper.innerHTML = '';
    const { LeadDetail } = await import('./LeadDetail.js');
    const detail = LeadDetail({ id, onBack: gotoList, onEdit: openEdit, onDeleted: gotoList });
    wrapper.appendChild(detail);
  }

  async function openEdit(id) {
    wrapper.innerHTML = '';
    const { leadsApi } = await import('../../lib/api/client.js');
    const lead = await leadsApi.retrieve(id);
    const form = LeadForm({ lead, onSuccess: gotoList });
    form.addEventListener('cancel', gotoList);
    wrapper.appendChild(form);
  }

  function openCreate() {
    wrapper.innerHTML = '';
    const form = LeadForm({ onSuccess: gotoList });
    form.addEventListener('cancel', gotoList);
    wrapper.appendChild(form);
  }

  function gotoList() { renderList(); }

  function renderByRoute() {
    if (route.name === 'leads-new') return openCreate();
    if (route.name === 'leads-detail') return openDetail(route.params.id);
    if (route.name === 'leads-edit') return openEdit(route.params.id);
    return renderList();
  }

  renderByRoute();
  rootEl.innerHTML = '';
  rootEl.appendChild(wrapper);
}
