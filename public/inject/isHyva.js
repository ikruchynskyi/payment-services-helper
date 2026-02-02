'use strict';

(() => {
  if (window.hyva) {
    if (typeof window.dispatchMessages === 'function') {
      window.dispatchMessages(
        [
          {
            type: 'success',
            text: 'Yes, this is Hyva!'
          }
        ],
        15000
      );
    } else {
      alert('Yes, this is Hyva!');
    }
  } else {
    alert('No, this is not Hyva!');
  }
})();
