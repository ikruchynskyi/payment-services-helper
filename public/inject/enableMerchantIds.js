'use strict';

(() => {
  const FIELDS = [
    {
      env: 'sandbox',
      selector:
        '#payment_recommended_solutions_magento_payments_legacy_general_configuration_sandbox_merchant_id'
    },
    {
      env: 'production',
      selector:
        '#payment_recommended_solutions_magento_payments_legacy_general_configuration_production_merchant_id'
    }
  ];

  const unlocked = [];
  const missing = [];

  FIELDS.forEach(({ env, selector }) => {
    const input = document.querySelector(selector);
    if (input) {
      input.removeAttribute('disabled');
      input.removeAttribute('readonly');
      unlocked.push(env);
    } else {
      missing.push(env);
    }
  });

  if (unlocked.length === 0) {
    alert(
      'No Merchant ID fields found on this page.\nOpen the Payment Services configuration page in Magento Admin and try again.'
    );
    return;
  }

  const lines = [`Unlocked Merchant ID field(s): ${unlocked.join(', ')}`];
  if (missing.length) {
    lines.push(`Not present on this page: ${missing.join(', ')}`);
  }
  alert(lines.join('\n'));
})();
