import { TasksList } from './TasksList.js';

export function mountTasks(rootEl) {
  rootEl.innerHTML = '';
  const list = TasksList();
  rootEl.appendChild(list);
}
