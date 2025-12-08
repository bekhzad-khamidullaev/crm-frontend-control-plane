export function Tabs({ tabs = [], onTabChange, activeTab = 0 } = {}) {
  const container = document.createElement('div');
  container.className = 'tabs-container';

  const tabList = document.createElement('div');
  tabList.className = 'tabs-list';

  const tabContent = document.createElement('div');
  tabContent.className = 'tabs-content';

  let currentTab = activeTab;

  tabs.forEach((tab, index) => {
    const tabButton = document.createElement('button');
    tabButton.className = `tab-button ${index === currentTab ? 'tab-button--active' : ''}`;
    
    if (tab.icon) {
      const icon = document.createElement('span');
      icon.className = 'material-icons tab-button__icon';
      icon.textContent = tab.icon;
      tabButton.appendChild(icon);
    }
    
    const label = document.createElement('span');
    label.className = 'tab-button__label';
    label.textContent = tab.label;
    tabButton.appendChild(label);

    if (tab.badge) {
      const badge = document.createElement('span');
      badge.className = 'tab-button__badge';
      badge.textContent = tab.badge;
      tabButton.appendChild(badge);
    }

    tabButton.addEventListener('click', () => {
      currentTab = index;
      updateTabs();
      if (onTabChange) onTabChange(index, tab);
    });

    tabList.appendChild(tabButton);
  });

  function updateTabs() {
    const buttons = tabList.querySelectorAll('.tab-button');
    buttons.forEach((btn, idx) => {
      btn.classList.toggle('tab-button--active', idx === currentTab);
    });
    
    tabContent.innerHTML = '';
    if (tabs[currentTab]?.content) {
      const content = tabs[currentTab].content;
      if (typeof content === 'function') {
        const result = content();
        if (result instanceof Node) tabContent.appendChild(result);
        else tabContent.innerHTML = result;
      } else if (content instanceof Node) {
        tabContent.appendChild(content);
      } else {
        tabContent.innerHTML = content;
      }
    }
  }

  container.append(tabList, tabContent);
  updateTabs();

  return { element: container, setActiveTab: (index) => { currentTab = index; updateTabs(); } };
}
