export const WIKI_SEARCH_TEMPLATE =
  'https://wiki.corp.adobe.com/dosearchsite.action?cql=siteSearch+~+%22#PLACEHOLDER#%22+and+space+in+(%22CTAGRP%22%2C%22CENG%22)+and+type+%3D+%22page%22&queryString=#PLACEHOLDER#';

export function buildWikiSearchUrl(query) {
  const normalized = String(query || '').trim();
  if (!normalized) return WIKI_SEARCH_TEMPLATE.replaceAll('#PLACEHOLDER#', '');
  const encoded = encodeURIComponent(normalized);
  return WIKI_SEARCH_TEMPLATE.replaceAll('#PLACEHOLDER#', encoded);
}

export function buildPaymentsConfigUrl(tabConfig, location) {
  if (!tabConfig?.url || !tabConfig?.domain) return '';
  const loc = String(location || '').toUpperCase();
  return `${tabConfig.url.protocol}//${tabConfig.domain}/rest/V1/payments-config/${loc}`;
}

export function buildApplePayCertUrl(tabConfig) {
  if (!tabConfig?.url || !tabConfig?.domain) return '';
  return `${tabConfig.url.protocol}//${tabConfig.domain}/.well-known/apple-developer-merchantid-domain-association`;
}

export function buildMageReportUrl(domain) {
  if (!domain) return '';
  return `https://www.magereport.com/scan/?s=${domain}`;
}

export function buildPayPalSdkCheckUrl(tabConfig) {
  if (!tabConfig?.url || !tabConfig?.domain) return '';
  return `${tabConfig.url.protocol}//${tabConfig.domain}/customer/section/load/?sections=payments`;
}

export function buildRestCountriesUrl(tabConfig) {
  if (!tabConfig?.url || !tabConfig?.domain) return '';
  return `${tabConfig.url.protocol}//${tabConfig.domain}/rest/V1/directory/countries`;
}
