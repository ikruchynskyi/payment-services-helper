
// Inject.js is the only way I found how to access window object
let payments = window?.checkoutConfig?.payment;
if (payments) {
    const tableData = Object.keys(payments).map(key => ({ key, isVisible: payments[key].isVisible }));
    console.table(tableData);
}
