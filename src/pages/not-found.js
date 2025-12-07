export function NotFoundPage() {
  const div = document.createElement('div');
  div.className = 'mdc-card';
  div.style.padding = '32px';
  div.style.margin = '24px';
  div.innerHTML = `
    <div style="text-align:center;">
      <div class="material-icons" style="font-size:72px;color:#bdbdbd;">sentiment_dissatisfied</div>
      <h2>Page not found</h2>
      <p>The page you are looking for does not exist.</p>
      <a class="mdc-button mdc-button--raised" href="#/dashboard"><span class="mdc-button__label">Go to Dashboard</span></a>
    </div>
  `;
  return div;
}
export default NotFoundPage;
