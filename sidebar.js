/* Only the three main pages opt in; case-study navigation stays fixed. */
(() => {
  const root = document.documentElement;
  const preference = 'portfolio:sidebar-collapsed';
  const read = () => {
    try { return localStorage.getItem(preference) === 'true'; }
    catch { return false; }
  };
  root.classList.toggle('sidebar-collapsed', read());
  document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('[data-collapsible-sidebar]');
    const button = sidebar?.querySelector('.sidebar-toggle');
    const content = sidebar?.querySelector('.sidebar-content');
    if (!button || !content) return;
    const desktop = matchMedia('(min-width:821px)');
    const render = () => {
      const collapsed = root.classList.contains('sidebar-collapsed');
      button.setAttribute('aria-expanded', String(!collapsed));
      button.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
      button.title = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
      content.inert = collapsed || !desktop.matches;
    };
    button.addEventListener('click', () => {
      root.classList.toggle('sidebar-collapsed');
      try { localStorage.setItem(preference, String(root.classList.contains('sidebar-collapsed'))); } catch {}
      render();
    });
    desktop.addEventListener('change', render);
    window.addEventListener('pageshow', render);
    window.addEventListener('storage', event => {
      if (event.key !== preference && event.key !== null) return;
      root.classList.toggle('sidebar-collapsed', read());
      render();
    });
    sidebar.addEventListener('transitionend', event => {
      if (event.target === sidebar && event.propertyName === 'width') window.dispatchEvent(new Event('resize'));
    });
    render();
  }, { once:true });
})();
