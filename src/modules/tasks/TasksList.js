import { tasksApi } from '../../lib/api/client.js';
import { Pagination, Modal, Spinner, Toast, FAB, TextField } from '../../components/index.js';

export function TasksList() {
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
  title.textContent = 'Tasks';
  const subtitle = document.createElement('div');
  subtitle.className = 'page-header__subtitle';
  subtitle.textContent = 'Track work and assignments';
  titleSection.append(title, subtitle);
  
  const actions = document.createElement('div');
  actions.className = 'page-header__actions';
  
  const searchField = TextField({ label: 'Search tasks', type: 'search' });
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
    label: 'Add Task',
    onClick: () => import('../../router.js').then(({ navigate }) => navigate('/tasks/new'))
  });
  fabContainer.appendChild(fab);
  
  root.append(card, fabContainer);

  let state = { page: 1, pageSize: 10, total: 0, q: '' };

  async function load() {
    body.innerHTML = '';
    body.appendChild(Spinner({ text: 'Loading tasks…' }));
    try {
      const resp = await tasksApi.list({ page: state.page, page_size: state.pageSize, search: state.q });
      const items = resp.results || [];
      state.total = resp.count ?? items.length;

      const tasksList = document.createElement('div');
      tasksList.style.display = 'flex';
      tasksList.style.flexDirection = 'column';
      tasksList.style.gap = '12px';

      items.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = 'mdc-card';
        taskCard.style.padding = '16px';
        taskCard.style.display = 'flex';
        taskCard.style.alignItems = 'center';
        taskCard.style.gap = '16px';
        taskCard.style.cursor = 'pointer';
        taskCard.addEventListener('click', () => import('../../router.js').then(({ navigate }) => navigate(`/tasks/${task.id}`)));
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.status === 'completed';
        checkbox.onclick = (e) => e.stopPropagation();
        
        const content = document.createElement('div');
        content.style.flex = '1';
        
        const taskTitle = document.createElement('div');
        taskTitle.textContent = task.title;
        taskTitle.style.fontWeight = '500';
        taskTitle.style.marginBottom = '4px';
        
        const taskMeta = document.createElement('div');
        taskMeta.style.fontSize = '0.875rem';
        taskMeta.style.color = 'var(--mdc-theme-text-secondary)';
        taskMeta.style.display = 'flex';
        taskMeta.style.gap = '16px';
        
        if (task.priority) {
          const priorityBadge = document.createElement('span');
          priorityBadge.className = `badge badge--${task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'neutral'}`;
          priorityBadge.textContent = task.priority;
          taskMeta.appendChild(priorityBadge);
        }
        if (task.due_date) {
          const dueDate = document.createElement('span');
          dueDate.textContent = `Due: ${new Date(task.due_date).toLocaleDateString()}`;
          taskMeta.appendChild(dueDate);
        }
        if (task.assignee) {
          const assignee = document.createElement('span');
          assignee.textContent = `@${task.assignee.username}`;
          taskMeta.appendChild(assignee);
        }
        
        content.append(taskTitle, taskMeta);
        
        const statusBadge = document.createElement('span');
        statusBadge.className = `badge badge--${task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'info' : 'neutral'}`;
        statusBadge.textContent = task.status || 'pending';
        
        taskCard.append(checkbox, content, statusBadge);
        tasksList.appendChild(taskCard);
      });

      body.innerHTML = '';
      if (items.length === 0) {
        body.innerHTML = '<div class="empty-state"><div class="empty-state__icon material-icons">task</div><div class="empty-state__title">No tasks found</div><div class="empty-state__description">Create your first task</div></div>';
      } else {
        body.appendChild(tasksList);
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
