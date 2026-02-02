'use strict';

(() => {
  const isAem = typeof window.DROPINS !== 'undefined';
  alert(isAem ? 'Yes! This is AEM storefront!' : 'No, this is not an AEM Storefront');
})();
