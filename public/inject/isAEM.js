'use strict';

(() => {
  const flattenConfig = (value, path = 'config') => {
    if (Array.isArray(value)) {
      return value.flatMap((item, index) => flattenConfig(item, `${path}[${index}]`));
    }

    if (value && typeof value === 'object') {
      return Object.entries(value).flatMap(([key, nestedValue]) =>
        flattenConfig(nestedValue, `${path}.${key}`)
      );
    }

    return [
      {
        key: path,
        value: value ?? 'null'
      }
    ];
  };

  const getConfig = () => {
    const cached = sessionStorage.getItem('config');
    if (cached) return Promise.resolve(JSON.parse(cached));
    return fetch('/config.json').then((r) => (r.ok ? r.json() : null));
  };

  getConfig()
    .then((config) => {
      const isAem = Boolean(
        config?.public?.default?.['commerce-core-endpoint'] ??
          config?.public?.default?.['commerce-endpoint']
      );
      if (isAem && config) {
        console.group('[APS Helper] ACCS storefront config.json');
        console.table(flattenConfig(config));
        console.log(config);
        console.groupEnd();
      }
      alert(isAem ? 'Yes! This is an AEM/ACCS storefront!' : 'No, this is not an AEM/ACCS storefront');
    })
    .catch(() => {
      alert('No, this is not an AEM/ACCS storefront');
    });
})();
