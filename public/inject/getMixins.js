'use strict';

(() => {
  const mixins = window.requirejs?.s?.contexts?._?.config?.config?.mixins;
  if (!mixins) {
    console.warn('RequireJS mixins config not found.');
    return;
  }

  const ignored = ['Magento_', 'mage/', 'jquery'];
  Object.values(mixins).forEach((value) => {
    Object.keys(value).forEach((key) => {
      if (!ignored.some((token) => key.includes(token))) {
        console.log(key);
      }
    });
  });
})();
