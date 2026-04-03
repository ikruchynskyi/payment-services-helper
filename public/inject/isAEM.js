'use strict';

(() => {
  const getConfig = () => {
    const cached = sessionStorage.getItem('config');
    if (cached) return Promise.resolve(JSON.parse(cached));
    return fetch('/config.json').then((r) => (r.ok ? r.json() : null));
  };

  getConfig()
    .then((config) => {
      const isAem = Boolean(config?.public?.default?.['commerce-core-endpoint']);
      alert(isAem ? 'Yes! This is an AEM/ACCS storefront!' : 'No, this is not an AEM/ACCS storefront');
    })
    .catch(() => {
      alert('No, this is not an AEM/ACCS storefront');
    });
})();
