import { ProjectsList } from './ProjectsList.js';

export function mountProjects(rootEl) {
  rootEl.innerHTML = '';
  const list = ProjectsList();
  rootEl.appendChild(list);
}
