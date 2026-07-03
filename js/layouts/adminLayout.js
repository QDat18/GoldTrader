import { renderAdminNavbar, setupNavbarEvents } from '../components/navbar.js';
import { renderAdminTicker } from '../components/ticker.js';

export function renderAdminLayout(pageHtml, activePageName) {
  return `
    ${renderAdminNavbar(activePageName)}
    ${renderAdminTicker()}
    <main style="flex: 1;">
      ${pageHtml}
    </main>
  `;
}

export function initAdminLayout(container) {
  setupNavbarEvents(container);
}
