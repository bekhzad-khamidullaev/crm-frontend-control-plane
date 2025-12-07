import { ContactsList } from './ContactsList.js';
import { ContactForm } from './ContactForm.js';

export function mountContacts(rootEl, route = { name: 'contacts-list', params: {} }) {
  rootEl.innerHTML = '';
  const wrapper = document.createElement('div');
  
  function renderList() {
    wrapper.innerHTML = '';
    const list = ContactsList();
    wrapper.appendChild(list);
  }

  async function openDetail(id) {
    wrapper.innerHTML = '';
    const { ContactDetail } = await import('./ContactDetail.js');
    const detail = ContactDetail({ id, onBack: gotoList, onEdit: openEdit, onDeleted: gotoList });
    wrapper.appendChild(detail);
  }

  async function openEdit(id) {
    wrapper.innerHTML = '';
    const { contactsApi } = await import('../../lib/api/client.js');
    const contact = await contactsApi.retrieve(id);
    const form = ContactForm({ contact, onSuccess: gotoList });
    form.addEventListener('cancel', gotoList);
    wrapper.appendChild(form);
  }

  function openCreate() {
    wrapper.innerHTML = '';
    const form = ContactForm({ onSuccess: gotoList });
    form.addEventListener('cancel', gotoList);
    wrapper.appendChild(form);
  }

  function gotoList() { renderList(); }

  function renderByRoute() {
    if (route.name === 'contacts-new') return openCreate();
    if (route.name === 'contacts-detail') return openDetail(route.params.id);
    if (route.name === 'contacts-edit') return openEdit(route.params.id);
    return renderList();
  }

  renderByRoute();
  rootEl.innerHTML = '';
  rootEl.appendChild(wrapper);
}