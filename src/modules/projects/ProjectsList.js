import { projectsApi } from '../../lib/api/client.js';
import { Pagination, Spinner, Toast, FAB, TextField } from '../../components/index.js';

export function ProjectsList() {
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
  title.textContent = 'Projects';
  const subtitle = document.createElement('div');
  subtitle.className = 'page-header__subtitle';
  subtitle.textContent = 'Manage project portfolio';
  titleSection.append(title, subtitle);
  
  const actions = document.createElement('div');
  actions.className = 'page-header__actions';
  
  const searchField = TextField({ label: 'Search projects', type: 'search' });
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
    label: 'Add Project',
    onClick: () => import('../../router.js').then(({ navigate }) => navigate('/projects/new'))
  });
  fabContainer.appendChild(fab);
  
  root.append(card, fabContainer);

  let state = { page: 1, pageSize: 9, total: 0, q: '' };

  async function load() {
    body.innerHTML = '';
    body.appendChild(Spinner({ text: 'Loading projects…' }));
    try {
      const resp = await projectsApi.list({ page: state.page, page_size: state.pageSize, search: state.q });
      const items = resp.results || [];
      state.total = resp.count ?? items.length;

      const grid = document.createElement('div');
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(350px, 1fr))';
      grid.style.gap = '24px';

      items.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = 'mdc-card card-premium';
        projectCard.style.padding = '0';
        projectCard.style.cursor = 'pointer';
        projectCard.addEventListener('click', () => import('../../router.js').then(({ navigate }) => navigate(`/projects/${project.id}`)));
        
        const cardHeader = document.createElement('div');
        cardHeader.className = 'card-premium__header';
        
        const projectTitle = document.createElement('div');
        projectTitle.className = 'card-premium__title';
        projectTitle.innerHTML = `<span class="material-icons">work</span>${project.name}`;
        
        const projectSubtitle = document.createElement('div');
        projectSubtitle.className = 'card-premium__subtitle';
        projectSubtitle.textContent = project.description || 'No description';
        
        cardHeader.append(projectTitle, projectSubtitle);
        
        const cardBody = document.createElement('div');
        cardBody.style.padding = '24px';
        
        const meta = document.createElement('div');
        meta.style.display = 'flex';
        meta.style.gap = '12px';
        meta.style.flexWrap = 'wrap';
        meta.style.marginBottom = '16px';
        
        if (project.stage) {
          const stageBadge = document.createElement('span');
          stageBadge.className = 'badge badge--info';
          stageBadge.textContent = project.stage.name;
          meta.appendChild(stageBadge);
        }
        
        if (project.status) {
          const statusBadge = document.createElement('span');
          statusBadge.className = `badge badge--${project.status === 'completed' ? 'success' : project.status === 'in_progress' ? 'info' : 'neutral'}`;
          statusBadge.textContent = project.status;
          meta.appendChild(statusBadge);
        }
        
        const progress = document.createElement('div');
        progress.style.marginTop = '12px';
        const progressLabel = document.createElement('div');
        progressLabel.style.fontSize = '0.75rem';
        progressLabel.style.color = 'var(--mdc-theme-text-secondary)';
        progressLabel.style.marginBottom = '4px';
        progressLabel.textContent = `Progress: ${project.progress || 0}%`;
        const progressBar = document.createElement('div');
        progressBar.style.height = '4px';
        progressBar.style.background = 'rgba(0,0,0,0.1)';
        progressBar.style.borderRadius = '2px';
        progressBar.style.overflow = 'hidden';
        const progressFill = document.createElement('div');
        progressFill.style.height = '100%';
        progressFill.style.width = `${project.progress || 0}%`;
        progressFill.style.background = 'var(--mdc-theme-primary)';
        progressFill.style.transition = 'width 0.3s';
        progressBar.appendChild(progressFill);
        progress.append(progressLabel, progressBar);
        
        cardBody.append(meta, progress);
        projectCard.append(cardHeader, cardBody);
        grid.appendChild(projectCard);
      });

      body.innerHTML = '';
      if (items.length === 0) {
        body.innerHTML = '<div class="empty-state"><div class="empty-state__icon material-icons">work</div><div class="empty-state__title">No projects found</div></div>';
      } else {
        body.appendChild(grid);
      }

      pagerWrap.innerHTML = '';
      pagerWrap.appendChild(Pagination({ page: state.page, pageSize: state.pageSize, total: state.total, onChange: (p) => { state.page = p; load(); } }));
    } catch (err) {
      console.error(err);
      body.innerHTML = `<div class="empty-state"><div class="empty-state__icon material-icons">error</div></div>`;
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
