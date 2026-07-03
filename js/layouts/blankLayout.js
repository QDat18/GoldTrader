export function renderBlankLayout(pageHtml) {
  return `
    <main style="flex: 1; display: flex; flex-direction: column;">
      ${pageHtml}
    </main>
  `;
}

export function initBlankLayout(container) {
  // No layout-specific event setup needed
}
