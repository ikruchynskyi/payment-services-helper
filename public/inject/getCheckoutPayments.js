'use strict';

(() => {
  const payments = window?.checkoutConfig?.payment;
  if (!payments) {
    console.warn('Payment config not found on window.checkoutConfig.payment');
    return;
  }

  const tableData = Object.keys(payments).map((key) => ({
    key,
    isVisible: payments[key]?.isVisible
  }));
  console.table(tableData);
})();
