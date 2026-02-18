import React, { useEffect, useMemo, useState } from 'react';
import { trackEvent } from '../lib/analytics.js';
import { getActiveTabConfig, openNewTab, openPopupWindow, sendToActiveTab } from '../lib/chrome.js';
import {
  buildApplePayCertUrl,
  buildMageReportUrl,
  buildPaymentsConfigUrl,
  buildPayPalSdkCheckUrl,
  buildRestCountriesUrl,
  buildWikiSearchUrl
} from '../lib/urls.js';
import { APPLE_CERT_OLD } from './constants.js';

const APPLE_CERT_URL =
  'https://paypalobjects.com/devdoc/apple-pay/well-known/apple-developer-merchantid-domain-association';

const APS_LOCATIONS = [
  { id: 'product_detail', label: 'PDP' },
  { id: 'checkout', label: 'Checkout' },
  { id: 'cart', label: 'Cart' },
  { id: 'minicart', label: 'Minicart' }
];

const DocsLinks = [
  {
    id: 'engDocs',
    label: 'Engineering Docs',
    url: 'https://wiki.corp.adobe.com/display/merchantsolutions/Payment+Services'
  },
  {
    id: 'supportRunbooks',
    label: 'Support Runbooks',
    url: 'https://wiki.corp.adobe.com/display/CENG/Payments+Services+Runbooks'
  },
  {
    id: 'fluffyJaws',
    label: 'AI Chat Bot',
    url: 'https://fluffyjaws.adobe.com/'
  }
];

function PopupApp() {
  const [tabConfig, setTabConfig] = useState(null);
  const [sidebar, setSidebar] = useState(null);
  const [webReqsLoading, setWebReqsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getActiveTabConfig().then(setTabConfig);
  }, []);

  const tabReady = useMemo(() => Boolean(tabConfig?.activeTab?.id), [tabConfig]);

  const handleTracked = (id, handler) => async (event) => {
    event?.preventDefault?.();
    await trackEvent(id);
    await handler();
  };

  const handleApplePay = handleTracked('validateApplePayCert', async () => {
    if (!tabConfig) return;

    const targetUrl = buildApplePayCertUrl(tabConfig);
    if (!targetUrl) return;

    try {
      const response = await fetch(APPLE_CERT_URL);
      if (!response.ok) {
        console.error('Failed to fetch certificate:', response.status);
        return;
      }
      const cert = (await response.text()).trim();

      const siteResponse = await fetch(targetUrl);
      const data = await siteResponse.text();

      if (data.trim() === cert) {
        alert('Apple Certificate is VALID');
      } else if (APPLE_CERT_OLD.includes(data)) {
        alert('Old payment services certificate detected! Please update Payment Services module');
      } else {
        alert(
          `Apple Certificate is NOT VALID:\n Console command to share with client copied to the clipboard\n${data}`
        );
        const command =
          'Please analyse if Apple Pay Domain Verification certificate is accessible. Next CLI command can help with investigation: \n' +
          `curl -IL ${targetUrl}`;
        navigator.clipboard.writeText(command);
      }
    } catch (error) {
      console.error('Error fetching:', error);
      alert(`Error fetching from ${targetUrl}`);
    }
  });

  const handleCheckEnabledPaymentMethods = handleTracked('checkEnabledPaymentMethods', async () => {
    if (!tabReady) return;
    sendToActiveTab(tabConfig.activeTab.id, { message: 'checkEnabledPaymentMethods' });
  });

  const handleFastCheckout = handleTracked('fastCheckout', async () => {
    if (!tabReady) return;
    sendToActiveTab(tabConfig.activeTab.id, { message: 'fastCheckout', tabConfig });
  });

  const handleIsHyva = handleTracked('isHyva', async () => {
    if (!tabReady) return;
    sendToActiveTab(tabConfig.activeTab.id, { message: 'isHyva' });
  });

  const handleIsAem = handleTracked('isAEM', async () => {
    if (!tabReady) return;
    sendToActiveTab(tabConfig.activeTab.id, { message: 'isAEM' });
  });

  const handleGetMixins = handleTracked('getMixins', async () => {
    if (!tabReady) return;
    sendToActiveTab(tabConfig.activeTab.id, { message: 'getMixins' });
  });

  const handleIsFastly = handleTracked('isFastly', async () => {
    if (!tabConfig) return;

    if (tabConfig.domain.includes('magentosite.cloud')) {
      alert('MAGENTO CLOUD WEBSITE');
      return;
    }

    const handleError = (err) => {
      alert("Magento site, but due to Network error, can't check if Magento Cloud");
      console.warn(err);
    };

    try {
      const restUrl = buildRestCountriesUrl(tabConfig);
      const restOk = await fetch(restUrl).then((res) => res.ok).catch(() => false);

      if (!restOk) {
        alert('NOT MAGENTO. PROBABLY PWA WEBSITE');
        return;
      }

      const response = await fetch(`https://networkcalc.com/api/dns/lookup/${tabConfig.domain}`).catch(
        handleError
      );
      if (!response?.ok) return;
      const json = await response.json();
      const cname = json?.records?.CNAME?.[0]?.address;
      if (cname === 'prod.magentocloud.map.fastly.net') {
        alert('MAGENTO CLOUD WEBSITE');
      } else {
        alert("IT'S MAGENTO, BUT NOT MAGENTO CLOUD WEBSITE");
      }
    } catch (error) {
      handleError(error);
    }
  });

  const handleGetPaymentMethods = handleTracked('getPaymentMethods', async () => {
    if (!tabReady) return;
    sendToActiveTab(tabConfig.activeTab.id, { message: 'getPaymentMethods' });
  });

  const runGetPayPalSdk = async () => {
    if (!tabConfig) return;

    const newUrl = buildPayPalSdkCheckUrl(tabConfig);
    try {
      const response = await fetch(newUrl);
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        alert('Error parsing response from PayPal SDK request');
        return;
      }
      alert(JSON.stringify(data, null, 2));
      sendToActiveTab(tabConfig.activeTab.id, {
        message: 'printSDKHelper',
        data
      });
    } catch (error) {
      console.error('Error fetching:', error);
      alert(`Error fetching from ${newUrl}`);
    }
  };

  const handleGetPayPalSdk = handleTracked('getPayPalSDK', runGetPayPalSdk);
  const handleAccsGetPayPalSdk = handleTracked('accs-getPayPalSDK', runGetPayPalSdk);

  const handleWebReqs = handleTracked('webReqs', async () => {
    setWebReqsLoading((prev) => !prev);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs?.length) return;
      chrome.runtime.sendMessage({ message: 'getHar', tabId: tabs[0].id });
    });
  });

  const handleOpenSnippets = handleTracked('snippets', async () => {
    openPopupWindow('snippets/index.html');
  });

  const handleMageReport = handleTracked('magereport', async () => {
    if (!tabConfig) return;
    openNewTab(buildMageReportUrl(tabConfig.domain));
  });

  const handleApsConfigOpen = (locationId) =>
    handleTracked(locationId, async () => {
      if (!tabConfig) return;
      const url = buildPaymentsConfigUrl(tabConfig, locationId);
      openNewTab(url);
    });

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Enter') {
      const url = buildWikiSearchUrl(event.currentTarget.value);
      openNewTab(url);
    }
  };

  const handleOpenSidebar = (eventId, targetId) =>
    handleTracked(eventId, async () => setSidebar(targetId));
  const handleCloseSidebar = (eventId) => handleTracked(eventId, async () => setSidebar(null));

  return (
    <div className="app">
      <div className="content">
        <button id="validateApplePayCert" onClick={handleApplePay} className="action-link">
          Validate Apple Pay Certificate
        </button>
        <button
          id="checkEnabledPaymentMethods"
          onClick={handleCheckEnabledPaymentMethods}
          className="action-link"
          disabled={!tabReady}
        >
          Locate Payment Services on Page
        </button>
        <button id="getPayPalSDK" onClick={handleGetPayPalSdk} className="action-link">
          Check PayPal SDK
        </button>
        <button
          id="getPaymentMethods"
          onClick={handleGetPaymentMethods}
          className="action-link"
          disabled={!tabReady}
        >
          Get Checkout Payment Methods
        </button>
        <button
          id="webReqs"
          onClick={handleWebReqs}
          className={`action-link ${webReqsLoading ? 'loading-bar' : ''}`}
        >
          Analyze web requests
        </button>
        <button id="isFastly" onClick={handleIsFastly} className="action-link">
          Is Magento Cloud ?
        </button>
        <button id="isHyva" onClick={handleIsHyva} className="action-link" disabled={!tabReady}>
          Is Hyva?
        </button>
        <button id="isAEM" onClick={handleIsAem} className="action-link" disabled={!tabReady}>
          Is AEM Storefront?
        </button>
        <button id="getMixins" onClick={handleGetMixins} className="action-link" disabled={!tabReady}>
          Checkout Mixins
        </button>
        <button
          id="fastCheckout"
          onClick={handleFastCheckout}
          className="action-link"
          disabled={!tabReady}
        >
          Fast checkout
        </button>
        <button id="magereport" onClick={handleMageReport} className="action-link" disabled={!tabReady}>
          Check MageReport
        </button>
        <div className="aps-config-group">
          <div className="aps-title">Get APS configuration for:</div>
          {APS_LOCATIONS.map((location) => (
            <button
              key={location.id}
              id={location.id}
              className="action-link aps-config"
              onClick={handleApsConfigOpen(location.id)}
              disabled={!tabReady}
            >
              {location.label}
            </button>
          ))}
        </div>
        <button
          id="openDocs"
          className="action-link"
          onClick={handleOpenSidebar('openDocs', 'docs-sidenav')}
        >
          Documentations
        </button>
        <button
          id="storefrontUtils"
          className="action-link"
          onClick={handleOpenSidebar('storefrontUtils', 'storefront-utils-container')}
        >
          Storefront utils
        </button>
      </div>

      <div className={`sidenav ${sidebar === 'storefront-utils-container' ? 'open' : ''}`}>
        <button
          id="closebtn-storefront"
          className="closebtn"
          onClick={handleCloseSidebar('closebtn-storefront')}
        >
          &times;
        </button>
        <button
          id="accs-getPayPalSDK"
          onClick={handleAccsGetPayPalSdk}
          className="action-link"
        >
          Check PayPal SDK
        </button>
      </div>

      <div className={`sidenav ${sidebar === 'docs-sidenav' ? 'open' : ''}`}>
        <button
          id="closebtn-docs"
          className="closebtn"
          onClick={handleCloseSidebar('closebtn-docs')}
        >
          &times;
        </button>
        {DocsLinks.map((link) => (
          <button
            key={link.id}
            id={link.id}
            className="action-link"
            onClick={handleTracked(link.id, async () => openNewTab(link.url))}
          >
            {link.label}
          </button>
        ))}
        <button id="snippets" onClick={handleOpenSnippets} className="action-link">
          Snippets
        </button>
        <input
          type="text"
          id="searchQuery"
          placeholder="Search for known issues"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
      </div>
    </div>
  );
}

export default PopupApp;
