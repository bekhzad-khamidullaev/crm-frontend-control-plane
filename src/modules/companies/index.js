import { CompaniesList } from './CompaniesList.js';

export function mountCompanies(rootEl, route = { name: 'companies-list', params: {} }) {
  rootEl.innerHTML = '';
  const wrapper = document.createElement('div');
  
  function renderList() {
    wrapper.innerHTML = '';
    const list = CompaniesList();
    wrapper.appendChild(list);
  }

  renderList();
  rootEl.appendChild(wrapper);
}
