export function ForbiddenPage() {
  const div = document.createElement('div');
  div.className = 'mdc-card';
  div.style.padding = '32px';
  div.style.margin = '24px';
  div.innerHTML = `
    <div style="text-align:center;">
      <div class="material-icons" style="font-size:72px;color:#ef5350;">block</div>
      <h2>Access denied</h2>
      <p>You do not have permission to view this page.</p>
      <a class="mdc-button mdc-button--raised" href="#/dashboard"><span class="mdc-button__label">Back to Dashboard</span></a>
    </div>
  `;
  return div;
}
export default ForbiddenPage;
