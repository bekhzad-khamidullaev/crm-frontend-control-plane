import { DealsList } from './DealsList.js';

export function mountDeals(rootEl, route = { name: 'deals-list', params: {} }) {
  rootEl.innerHTML = '';
  const wrapper = document.createElement('div');
  
  function renderList() {
    wrapper.innerHTML = '';
    const list = DealsList();
    wrapper.appendChild(list);
  }

  renderList();
  rootEl.appendChild(wrapper);
}
