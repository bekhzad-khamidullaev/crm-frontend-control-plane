import { companiesApi } from '../../lib/api/client.js';
import { Pagination, Modal, Spinner, Toast, FAB, TextField } from '../../components/index.js';
import { MDCRipple } from '@material/ripple';

export function CompaniesList() {
  const root = document.createElement('div');
  root.style.position = 'relative';

  const card = document.createElement('div');
  card.className = 'mdc-card';
  card.style.padding = '24px';

  const header = document.createElement('div');
  header.className = 'page-header';
  
  const titleSection = document.createElement('div');
  const title = document.createElement('h5');
  title.className = 'page-header__title';
  title.textContent = 'Companies';
  const subtitle = document.createElement('div');
  subtitle.className = 'page-header__subtitle';
  subtitle.textContent = 'Corporate directory';
  titleSection.append(title, subtitle);
  
  const actions = document.createElement('div');
  actions.className = 'page-header__actions';
  
  const searchField = TextField({ label: 'Search companies', type: 'search' });
  searchField.element.style.maxWidth = '300px';
  searchField.element.style.marginBottom = '0';
  const search = searchField.input;
  
  actions.appendChild(searchField.element);
  header.append(titleSection, actions);

  const body = document.createElement('div');
  body.style.minHeight = '200px';
  body.style.marginTop = '24px';

  const pagerWrap = document.createElement('div');
  pagerWrap.style.marginTop = '16px';
  pagerWrap.style.display = 'flex';
  pagerWrap.style.justifyContent = 'center';

  card.append(header, body, pagerWrap);
  
  const fabContainer = document.createElement('div');
  fabContainer.className = 'fab-container';
  const fab = FAB({ 
    icon: 'add', 
    label: 'Add Company',
    onClick: () => import('../../router.js').then(({ navigate }) => navigate('/companies/new'))
  });
  fabContainer.appendChild(fab);
  
  root.append(card, fabContainer);

  let state = { page: 1, pageSize: 10, total: 0, q: '' };

  async function load() {
    body.innerHTML = '';
    body.appendChild(Spinner({ text: 'Loading companies…' }));
    try {
      const resp = await companiesApi.list({ page: state.page, page_size: state.pageSize, search: state.q });
      const items = resp.results || [];
      state.total = resp.count ?? items.length;

      const grid = document.createElement('div');
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
      grid.style.gap = '24px';

      items.forEach(company => {
        const companyCard = document.createElement('div');
        companyCard.className = 'mdc-card mdc-card--interactive card-premium';
        companyCard.style.padding = '24px';
        
        const cardHeader = document.createElement('div');
        cardHeader.style.display = 'flex';
        cardHeader.style.alignItems = 'center';
        cardHeader.style.gap = '16px';
        cardHeader.style.marginBottom = '16px';
        
        const icon = document.createElement('span');
        icon.className = 'material-icons';
        icon.textContent = 'business';
        icon.style.fontSize = '48px';
        icon.style.color = 'var(--mdc-theme-primary)';
        
        const info = document.createElement('div');
        info.style.flex = '1';
        
        const name = document.createElement('h6');
        name.textContent = company.name;
        name.style.margin = '0 0 4px 0';
        name.style.color = 'var(--mdc-theme-primary)';
        
        const website = document.createElement('div');
        website.textContent = company.website || 'No website';
        website.style.fontSize = '0.875rem';
        website.style.color = 'var(--mdc-theme-text-secondary)';
        
        info.append(name, website);
        cardHeader.append(icon, info);
        
        const details = document.createElement('div');
        details.style.fontSize = '0.875rem';
        details.style.color = 'var(--mdc-theme-text-secondary)';
        details.style.marginBottom = '16px';
        if (company.industry) details.innerHTML += `<div><strong>Industry:</strong> ${company.industry}</div>`;
        if (company.size) details.innerHTML += `<div><strong>Size:</strong> ${company.size}</div>`;
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'action-buttons';
        actionsDiv.style.justifyContent = 'flex-end';
        
        const viewBtn = document.createElement('button');
        viewBtn.className = 'action-button material-icons';
        viewBtn.textContent = 'visibility';
        viewBtn.addEventListener('click', (e) => { e.stopPropagation(); import('../../router.js').then(({ navigate }) => navigate(`/companies/${company.id}`)); });
        
        const editBtn = document.createElement('button');
        editBtn.className = 'action-button material-icons';
        editBtn.textContent = 'edit';
        editBtn.addEventListener('click', (e) => { e.stopPropagation(); import('../../router.js').then(({ navigate }) => navigate(`/companies/${company.id}/edit`)); });
        
        actionsDiv.append(viewBtn, editBtn);
        
        companyCard.append(cardHeader, details, actionsDiv);
        companyCard.addEventListener('click', () => import('../../router.js').then(({ navigate }) => navigate(`/companies/${company.id}`)));
        grid.appendChild(companyCard);
      });

      body.innerHTML = '';
      if (items.length === 0) {
        body.innerHTML = '<div class="empty-state"><div class="empty-state__icon material-icons">business</div><div class="empty-state__title">No companies found</div><div class="empty-state__description">Start by adding your first company</div></div>';
      } else {
        body.appendChild(grid);
      }

      pagerWrap.innerHTML = '';
      pagerWrap.appendChild(Pagination({ page: state.page, pageSize: state.pageSize, total: state.total, onChange: (p) => { state.page = p; load(); } }));
    } catch (err) {
      console.error(err);
      body.innerHTML = `<div class="empty-state"><div class="empty-state__icon material-icons">error</div><div class="empty-state__title">Failed to load</div></div>`;
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
