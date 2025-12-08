// AppShell primitives for enterprise layout
// Provides: Breadcrumbs, ContentContainer, Section, Toolbar helpers

export function Breadcrumbs(items = []) {
  const nav = document.createElement('nav');
  nav.className = 'breadcrumbs';
  nav.setAttribute('aria-label', 'Breadcrumb');

  const ol = document.createElement('ol');
  ol.className = 'breadcrumbs__list';

  items.forEach((it, idx) => {
    const li = document.createElement('li');
    li.className = 'breadcrumbs__item';

    if (it.href && idx < items.length - 1) {
      const a = document.createElement('a');
      a.href = it.href;
      a.textContent = it.label;
      li.appendChild(a);
    } else {
      const span = document.createElement('span');
      span.textContent = it.label;
      span.setAttribute('aria-current', 'page');
      li.appendChild(span);
    }
    ol.appendChild(li);
  });

  nav.appendChild(ol);
  return nav;
}

export function ContentContainer(children = []) {
  const div = document.createElement('div');
  div.className = 'content-container';
  children.forEach((c) => div.appendChild(c));
  return div;
}

export function Section({ title, actions = [], children = [] } = {}) {
  const section = document.createElement('section');
  section.className = 'section';
  const header = document.createElement('div');
  header.className = 'section__header';
  const h = document.createElement('h2');
  h.className = 'section__title';
  h.textContent = title || '';
  const act = document.createElement('div');
  act.className = 'section__actions';
  actions.forEach((btn) => act.appendChild(btn));
  header.append(h, act);

  const body = document.createElement('div');
  body.className = 'section__body';
  children.forEach((c) => body.appendChild(c));

  section.append(header, body);
  return section;
}

export default { Breadcrumbs, ContentContainer, Section };
