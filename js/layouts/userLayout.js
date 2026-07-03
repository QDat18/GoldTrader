import { renderUserNavbar, setupNavbarEvents } from '../components/navbar.js';
import { renderUserTicker } from '../components/ticker.js';
import { renderFooter } from '../components/footer.js';

export function renderUserLayout(pageHtml, activePageName) {
  return `
    ${renderUserNavbar(activePageName)}
    ${renderUserTicker()}
    <main style="flex: 1;">
      ${pageHtml}
    </main>
    ${renderFooter()}
  `;
}

export function initUserLayout(container) {
  setupNavbarEvents(container);
}
