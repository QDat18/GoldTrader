import store from './store.js';

// Layout wrappers
import { renderUserLayout, initUserLayout } from './layouts/userLayout.js';
import { renderAdminLayout, initAdminLayout } from './layouts/adminLayout.js';
import { renderBlankLayout, initBlankLayout } from './layouts/blankLayout.js';

// Page components
import { pageHome } from './pages/home.js';
import { pageLogin } from './pages/login.js';
import { pageRegister } from './pages/register.js';
import { pageDashboard } from './pages/dashboard.js';
import { pageTrade } from './pages/trade.js';
import { pageDca } from './pages/dca.js';
import { pageHistory } from './pages/history.js';
import { pageOrder } from './pages/order.js';
import { pageAdminDashboard } from './pages/adminDashboard.js';
import { pageInventory } from './pages/inventory.js';
import { pageNotifications } from './pages/notifications.js';

// Route mappings
const routes = {
  '': pageHome,
  'home': pageHome,
  'login': pageLogin,
  'register': pageRegister,
  'dashboard': pageDashboard,
  'trade': pageTrade,
  'dca': pageDca,
  'history': pageHistory,
  'order': pageOrder,
  'admin': pageAdminDashboard,
  'inventory': pageInventory,
  'notifications': pageNotifications
};

class App {
  constructor(appContainerId) {
    this.container = document.getElementById(appContainerId);
    this.currentPage = null;
    this.currentPageName = '';
  }

  init() {
    // Listen to route changes
    window.addEventListener('hashchange', () => this.handleRouting());
    
    // Subscribe to store updates to re-render page
    store.subscribe(() => this.renderCurrentPage());

    // Run routing for initial load
    this.handleRouting();
  }

  handleRouting() {
    // Parse hash and strip parameters (e.g. #order?id=123 -> order)
    const fullHash = window.location.hash.substring(1) || '';
    const pageName = fullHash.split('?')[0];

    const page = routes[pageName] || pageHome;

    // Call destroy on previous page if it exists (e.g., to clear timers)
    if (this.currentPage && typeof this.currentPage.destroy === 'function') {
      this.currentPage.destroy();
    }

    this.currentPage = page;
    this.currentPageName = pageName || 'home';

    // Auto switch current user role to admin if accessing admin routes
    const adminRoutes = ['admin', 'inventory'];
    if (adminRoutes.includes(this.currentPageName) && store.state.currentUser.role !== 'admin') {
      store.state.currentUser.role = 'admin';
    }

    this.renderCurrentPage();
  }

  renderCurrentPage() {
    if (!this.currentPage) return;

    // Get raw page HTML
    const pageHtml = this.currentPage.render();

    // Determine layout based on page
    let finalHtml = '';
    const authPages = ['login', 'register'];
    const adminPages = ['admin', 'inventory'];

    if (authPages.includes(this.currentPageName)) {
      finalHtml = renderBlankLayout(pageHtml);
    } else if (adminPages.includes(this.currentPageName)) {
      finalHtml = renderAdminLayout(pageHtml, this.currentPageName);
    } else {
      finalHtml = renderUserLayout(pageHtml, this.currentPageName);
    }

    // Inject into app container
    this.container.innerHTML = finalHtml;

    // Initialize layout and page event listeners
    if (authPages.includes(this.currentPageName)) {
      initBlankLayout(this.container);
    } else if (adminPages.includes(this.currentPageName)) {
      initAdminLayout(this.container);
    } else {
      initUserLayout(this.container);
    }

    // Initialize page-specific code
    if (typeof this.currentPage.init === 'function') {
      this.currentPage.init(this.container);
    }
  }
}

// Instantiate and start app
document.addEventListener('DOMContentLoaded', () => {
  const app = new App('app');
  app.init();
});
